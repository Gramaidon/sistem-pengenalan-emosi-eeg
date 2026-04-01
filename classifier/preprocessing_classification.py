import time
import numpy as np
from pylsl import resolve_byprop, StreamInlet
from scipy.signal import butter, filtfilt 
from scipy.stats import zscore            
import onnxruntime as ort
import json
from websocket import create_connection 

# ==========================================
# 1. KONFIGURASI 
# ==========================================
FS = 128  
CHANNELS = ['AF3', 'F7', 'F3', 'FC5', 'T7', 'P7', 'O1', 'O2', 'P8', 'T8', 'FC6', 'F4', 'F8', 'AF4']

EMOTION_LABELS = {
    0: "High Arousal, High Valence (HAHV) - Excited/Happy",
    1: "Low Arousal, High Valence (LAHV) - Calm/Relaxed",
    2: "High Arousal, Low Valence (HALV) - Stressed/Nervous",
    3: "Low Arousal, Low Valence (LALV) - Bored/Sluggish"
}

# ==========================================
# 2. FUNGSI PRAPROSES 
# ==========================================
def butter_bandpass_filter(data, lowcut, highcut, fs, order=3):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    
    padlen = 3 * max(len(a), len(b))
    if data.shape[0] <= padlen:
        return np.zeros_like(data)
    
    y = filtfilt(b, a, data, axis=0)
    return y

def generate_adaptive_weights(signal):
    z_vals = zscore(signal, ddof=1)
    weights = np.abs(z_vals)
    weights[np.isnan(weights) | (weights == 0)] = 1e-9 
    return weights

def apply_mwmf_realtime(signal_window, window_size=5):
    length, num_channels = signal_window.shape
    cleaned_window = np.zeros_like(signal_window)
    n = window_size // 2
    window_factor = (2 * n) + 1

    for c in range(num_channels):
        sig_1d = signal_window[:, c]
        weights = generate_adaptive_weights(sig_1d)
        
        pad_signal = np.pad(sig_1d, (n, n), mode='constant', constant_values=0)
        pad_weights = np.pad(weights, (n, n), mode='constant', constant_values=0)
        
        for j in range(length):
            x_local = pad_signal[j : j + window_size]
            w_local = pad_weights[j : j + window_size]
            
            denominator = window_factor * np.sum(w_local) 
            if denominator == 0:
                cleaned_window[j, c] = sig_1d[j]
            else:
                cleaned_window[j, c] = np.sum(w_local * x_local) / denominator
                
    return cleaned_window

# ==========================================
# 3. EKSTRAKSI FITUR
# ==========================================
def calculate_differential_entropy(signal_window):
    variance = np.var(signal_window, axis=0, ddof=1)
    variance[variance < 1e-10] = 1e-10 
    de = 0.5 * np.log(2 * np.pi * np.e * variance)
    return de

def map_to_3d_cube_onnx(de_features):
    channel_coords = {
        'AF3': (1, 3), 'F7': (2, 1), 'F3': (2, 3), 'FC5': (3, 2), 
        'T7': (4, 0), 'P7': (6, 1), 'O1': (8, 3), 
        'O2': (8, 5), 'P8': (6, 7), 'T8': (4, 8), 
        'FC6': (3, 6), 'F4': (2, 5), 'F8': (2, 7), 'AF4': (1, 5)
    }
    cube = np.zeros((9, 9, 4), dtype=np.float32) 
    for band_idx in range(4):
        for ch_idx, ch_name in enumerate(CHANNELS):
            row, col = channel_coords[ch_name]
            cube[row, col, band_idx] = de_features[band_idx, ch_idx]
    return cube

# ==========================================
# 4. MAIN PIPELINE (LSL RECEIVER)
# ==========================================
def run_classification_module(model_path):
    print(f"⏳ Memuat Model ONNX dari: {model_path} ...")
    try:
        ort_session = ort.InferenceSession(model_path)
        input_name = ort_session.get_inputs()[0].name
        print("✅ Model berhasil dimuat!")
    except Exception as e:
        print(f"❌ Gagal memuat model: {e}")
        return
        
    print("🔍 Mencari aliran data LSL EEG...")
    streams = resolve_byprop('type', 'EEG')
    if not streams:
        return
    inlet = StreamInlet(streams[0])
    print("✅ Terhubung! Menunggu data...\n")

    print("⌛Menghubungkan ke Node.js WebSocket...")
    try:
        ws = create_connection("ws://localhost:8081")
        print("✅Terhubung ke Node.js WebSocket!")
    except Exception as e:
        print(f"❌Gagal terhubung ke WebSocket: {e}")
        return
    
    buffer_size = 128 
    baseline_size = 128 * 3 
    
    # Konteks Filter untuk Trial (3 detik)
    trial_context_size = 128 * 3 
    data_buffer = []
    
    is_collecting_baseline = True
    baseline_de_features = None  
    last_sample_time = time.time()

    try:
        while True:
            sample, timestamp = inlet.pull_sample(timeout=1.0)
            current_time = time.time()
            
            if sample is None:
                if not is_collecting_baseline and (current_time - last_sample_time > 1.5):
                    print("\n[INFO] Ganti Video. Resetting Baseline...")
                    is_collecting_baseline = True
                    baseline_de_features = None
                    data_buffer = []

                    try:
                        ws.send(json.dumps({"type": "reset"}))
                    except:
                        pass
                continue
                
            last_sample_time = current_time
            data_buffer.append(sample)
            
            # --- FASE 1: BASELINE (3 DETIK) ---
            if is_collecting_baseline:
                if len(data_buffer) >= baseline_size:
                    raw_base = np.array(data_buffer)
                    clean_base = apply_mwmf_realtime(raw_base, window_size=5)
                    
                    theta_b = butter_bandpass_filter(clean_base, 4, 8, FS)
                    alpha_b = butter_bandpass_filter(clean_base, 8, 14, FS)
                    beta_b  = butter_bandpass_filter(clean_base, 14, 31, FS)
                    gamma_b = butter_bandpass_filter(clean_base, 31, 45, FS)
                    
                    baseline_de_list = []
                    for sec in range(3):
                        s_idx, e_idx = sec * FS, (sec + 1) * FS
                        sec_de = np.vstack([
                            calculate_differential_entropy(theta_b[s_idx:e_idx]),
                            calculate_differential_entropy(alpha_b[s_idx:e_idx]),
                            calculate_differential_entropy(beta_b[s_idx:e_idx]),
                            calculate_differential_entropy(gamma_b[s_idx:e_idx])
                        ])
                        baseline_de_list.append(sec_de)
                        
                    baseline_de_features = np.mean(baseline_de_list, axis=0) 
                    print("🟢 Baseline Terkunci! Memulai Prediksi Real-time dari Detik ke-4...")
                    
                    is_collecting_baseline = False
                    
                    # [PERBAIKAN KUNCI]: Jangan kosongkan buffer. 
                    # Simpan 2 detik terakhir dari data mentah baseline sebagai "konteks masa lalu" 
                    # agar filter filtfilt di detik ke-4 punya landasan yang stabil.
                    data_buffer = data_buffer[FS:] 
                    
            # --- FASE 2: TRIAL CLASSIFICATION DENGAN ROLLING BUFFER ---
            else:
                # Tunggu hingga buffer terisi 3 detik (2 detik masa lalu + 1 detik baru)
                if len(data_buffer) == trial_context_size:

                    # Menghitung waktu proses (Start timer)
                    start_time = time.perf_counter()

                    raw_window_3s = np.array(data_buffer)
                    
                    # TANPA MWMF! Langsung filter 3 detik
                    theta_3s = butter_bandpass_filter(raw_window_3s, 4, 8, FS)
                    alpha_3s = butter_bandpass_filter(raw_window_3s, 8, 14, FS)
                    beta_3s  = butter_bandpass_filter(raw_window_3s, 14, 31, FS)
                    gamma_3s = butter_bandpass_filter(raw_window_3s, 31, 45, FS)
                    
                    # Ekstrak fitur HANYA dari 1 detik terakhir
                    trial_de_raw = np.vstack([
                        calculate_differential_entropy(theta_3s[-FS:, :]),
                        calculate_differential_entropy(alpha_3s[-FS:, :]),
                        calculate_differential_entropy(beta_3s[-FS:, :]),
                        calculate_differential_entropy(gamma_3s[-FS:, :])
                    ])
                    
                    # Relative Difference
                    abs_baseline = np.abs(baseline_de_features)
                    abs_baseline[abs_baseline < 1e-9] = 1e-9 
                    trial_de_reduced = trial_de_raw / abs_baseline
                    
                    cube_feature = map_to_3d_cube_onnx(trial_de_reduced) 
                    input_data = np.expand_dims(cube_feature, axis=0).astype(np.float32)
                    
                    outputs = ort_session.run(None, {input_name: input_data})
                    predicted_class_idx = np.argmax(outputs[0], axis=1)[0]
                    predicted_emotion = EMOTION_LABELS[predicted_class_idx]

                    # Selesai hitung, stop timer
                    end_time = time.perf_counter()
                    latensi_ai_ms = (end_time - start_time) * 1000

                    print(f"[Waktu: {timestamp:.2f}] Emosi: {predicted_emotion} | Latensi Proses: {latensi_ai_ms:.2f} ms")

                    # --- PENGIRIMAN WEBSOCKET ---
                    current_time_ms = int(time.time() * 1000)

                    payload = {
                        "emotion": predicted_emotion, # ✅ TYPO DIPERBAIKI
                        "kuadran_id": int(predicted_class_idx),
                        "python_timestamp": current_time_ms,
                        "latensi_ai_ms": latensi_ai_ms
                    }

                    try:
                        ws.send(json.dumps(payload))
                    except Exception as e:
                        print(f"❌ Gagal mengirim data ke WebSocket: {e}")
                    
                    # Geser buffer: Buang 1 detik paling tua (FIFO)
                    data_buffer = data_buffer[FS:]
                
    except KeyboardInterrupt:
        print("\n⏹️ Modul Klasifikasi dihentikan.")
        ws.close()

if __name__ == '__main__':
    MODEL_FILE = r"model_file/subject_01_ccn_best.onnx" 
    run_classification_module(MODEL_FILE)