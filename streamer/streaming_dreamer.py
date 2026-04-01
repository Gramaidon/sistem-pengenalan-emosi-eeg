import scipy.io
import numpy as np
import time
from pylsl import StreamInfo, StreamOutlet

def start_lsl_stream_fixed(file_path, subject_index=0):
    print(f"📥 Memuat dataset dari: {file_path}")
    try:
        mat = scipy.io.loadmat(file_path)
    except FileNotFoundError:
        print("❌ Error: File tidak ditemukan! Pastikan path benar.")
        return

    # --- NAVIGASI STRUKTUR DATA ---
    dreamer_struct = mat['DREAMER'][0, 0]
    data_struct = dreamer_struct['Data']
    subject_data = data_struct[0, subject_index]
    eeg_data = subject_data['EEG'][0, 0]
    
    # Ambil Container Stimuli (Seharusnya shape (18, 1))
    stimuli_container = eeg_data['stimuli'][0, 0]
    num_trials = stimuli_container.shape[0]
    print(f"🔎 Ditemukan {num_trials} Trial/Video dalam container subjek ini.")

    # ==========================================
    # KONFIGURASI LAB STREAMING LAYER (LSL)
    # ==========================================
    sampling_rate = 128
    num_channels = 14
    info = StreamInfo('DREAMER_EEG_Stream', 'EEG', num_channels, sampling_rate, 'float32', f'dreamer_sub_{subject_index}')
    
    # Metadata Channel
    channel_names = ['AF3', 'F7', 'F3', 'FC5', 'T7', 'P7', 'O1', 'O2', 'P8', 'T8', 'FC6', 'F4', 'F8', 'AF4']
    chns = info.desc().append_child("channels")
    for label in channel_names:
        ch = chns.append_child("channel")
        ch.append_child_value("label", label)
        ch.append_child_value("unit", "microvolts")
        ch.append_child_value("type", "EEG")

    outlet = StreamOutlet(info)
    print("✅ LSL Stream Outlet siap! Menunggu receiver...")
    time.sleep(3)

    # ==========================================
    # PROSES STREAMING REAL-TIME (TRIAL 14 - 18)
    # ==========================================
    # Trial 14 = index 13
    # Trial 18 = index 17
    # Kita buat batas amannya dengan min() jika dataset ternyata kurang dari 18
    start_idx = 13 
    end_idx = min(18, num_trials) 

    print(f"\n🔄 MEMULAI STREAMING UNTUK TRIAL {start_idx + 1} HINGGA {end_idx}...\n")

    for trial_idx in range(start_idx, end_idx):
        print(f"--- Persiapan Trial {trial_idx + 1} ---")
        
        # Ekstrak konten
        raw_content = stimuli_container[trial_idx, 0]
        trial_matrix = raw_content
        
        # Logika Unwrapping (membuka bungkusan array bersarang dari MATLAB)
        while trial_matrix.shape[1] != 14:
            if trial_matrix.shape[0] == 1 and trial_matrix.shape[1] == 1:
                trial_matrix = trial_matrix[0,0]
            elif trial_matrix.shape[1] == 1: 
                try:
                    trial_matrix = trial_matrix[0,0]
                except:
                    break
            else:
                break
        
        # Verifikasi Dimensi Matriks
        if trial_matrix.shape[1] != 14:
            print(f"❌ Gagal mengekstrak matriks yang valid untuk Trial {trial_idx+1}. Shape: {trial_matrix.shape}")
            continue
            
        num_samples = trial_matrix.shape[0]
        duration = num_samples / sampling_rate
        
        print(f"▶️ Streaming Trial {trial_idx + 1} | Durasi Asli: {duration:.2f} detik | Shape: {trial_matrix.shape}")
        
        # Mulai streaming per sampel
        start_time = time.time()
        for i in range(num_samples):
            # Flatten array agar menjadi list 1D berisi 14 angka
            sample = trial_matrix[i, :].flatten().tolist()
            
            if len(sample) == 14:
                outlet.push_sample(sample)
            else:
                print(f"⚠️ Error dimensi sample pada indeks {i}: {len(sample)}")
                break
            
            # Sinkronisasi Waktu Real-time (128 Hz)
            target_time = start_time + (i / sampling_rate)
            sleep_duration = target_time - time.time()
            if sleep_duration > 0:
                time.sleep(sleep_duration)
        
        print(f"⏹️ Trial {trial_idx + 1} selesai.\n")
        
        # Jeda antar trial (agar aliran data terlihat realistis seperti antar sesi)
        time.sleep(2) 

    print("🎉 Streaming untuk Trial 14 hingga 18 telah selesai.")

# --- EKSEKUSI ---
if __name__ == "__main__":
    # Sesuaikan path dengan lokasi file DREAMER Anda
    FILE_PATH = r'DREAMER/DREAMER_ori.mat'
    
    # Eksekusi streaming untuk Subjek 1 (index 0)
    start_lsl_stream_fixed(FILE_PATH, subject_index=0)