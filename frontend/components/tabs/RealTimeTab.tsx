import React, { useState, useEffect, useRef } from 'react';
import { Activity, Wifi, WifiOff, RefreshCw, Archive } from 'lucide-react';

export default function RealtimeTab() {
  const [emotionData, setEmotionData] = useState<any>(null);
  const [aiLatency, setAiLatency] = useState(0);
  const [netLatency, setNetLatency] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const [currentStats, setCurrentStats] = useState({ 0: 0, 1: 0, 2: 0, 3: 0});
  const [currentTotal, setCurrentTotal] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);

  const statsRef = useRef({ 0: 0, 1: 0, 2: 0, 3: 0});
  const totalRef = useRef(0);
  const sessionCounterRef = useRef(1);
  
  useEffect(() => {
    // Pastikan port sesuai dengan server.js Anda (8081)
    const ws = new WebSocket('ws://localhost:8081');
    let pingInterval: NodeJS.Timeout;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Terhubung ke Node.js WebSocket');
      
      // Ping setiap 2 detik untuk mengukur Network Latency
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      }, 2000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 1. Tangkap Pong dari Node.js (Kalkulasi Jaringan RTT/2)
        if (data.type === 'pong') {
          const rtt = Date.now() - data.timestamp;
          setNetLatency(rtt / 2);
          return;
        }

        // 2. Cek apakah ini sinyal reset dari python (ganti video)
        if (data.type === 'reset') {
          saveToHistoryAndReset();
          return;
        }

        // 3. Tangkap Latensi Komputasi AI dari Python
        // Harus sama persis dengan key di Python: "latensi_ai_ms"
        if (data.latensi_ai_ms !== undefined) {
          setAiLatency(data.latensi_ai_ms);
        }
        
        // Simpan sisa data emosi
        if (data.emotion) {
            setEmotionData(data);
        }

        // 4. Update akumulasi statistik di ref dan state
        if (data.kuadran_id !== undefined) {
          const id = data.kuadran_id;
          statsRef.current = { ...statsRef.current, [id]: statsRef.current[id as keyof typeof statsRef.current] + 1 };
          totalRef.current += 1;
          
          setCurrentStats({ ...statsRef.current });
          setCurrentTotal(totalRef.current);
        }
      } catch (error) {
        console.error("Error parsing WS data:", error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Terputus dari WebSocket');
    };

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, []);

  const saveToHistoryAndReset = () => {
    if (totalRef.current > 0) {
      const t = totalRef.current;
      const s = statsRef.current;

      const newHistoryItem = {
        id: sessionCounterRef.current,
        totalDetik: t,
        hahv: ((s[0] / t) * 100).toFixed(1),
        lahv: ((s[1] / t) * 100).toFixed(1),
        halv: ((s[2] / t) * 100).toFixed(1),
        lalv: ((s[3] / t) * 100).toFixed(1),
        timestamp: new Date().toLocaleString()
      };

      setHistory(prev => [newHistoryItem, ...prev]);
      sessionCounterRef.current += 1;
    }

    statsRef.current = { 0: 0, 1: 0, 2: 0, 3: 0 };
    totalRef.current = 0;
    setCurrentStats({ 0: 0, 1: 0, 2: 0, 3: 0 });
    setCurrentTotal(0);
    setEmotionData(null);
  };
  
  const getPercentage = (quadrantId: number) => {
    if (currentTotal === 0) return 0;
    return ((currentStats[quadrantId as keyof typeof currentStats] / currentTotal) * 100).toFixed(1);
  };

  const activeQuad = emotionData ? emotionData.kuadran_id : null;
  
  // Total E2E = Komputasi AI + Jaringan
  const totalE2ELatency = (aiLatency + netLatency).toFixed(2);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-6">
      {/* Header Status */}
      <div className="w-full flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isConnected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isConnected ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="font-bold text-gray-800">LSL Stream Status</h2>
            <p className="text-sm text-gray-500">{isConnected ? 'Connected to Pipeline' : 'Disconnected / Waiting...'}</p>
          </div>
        </div>
        
        {/* Indikator Latensi Baru */}
        <div className="text-right">
          <div className="font-mono text-2xl font-bold text-blue-600">
            {totalE2ELatency} <span className="text-sm text-gray-500">ms</span>
          </div>
          <div className="text-xs font-bold text-gray-800 mt-1">Total End-to-End Latency</div>
          <div className="text-[10px] text-gray-400 mt-1">
            AI Compute: {aiLatency.toFixed(2)} ms | Network: {netLatency.toFixed(2)} ms
          </div>
        </div>
      </div>

      {/* Main Display */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Text Output */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center h-80">
          <Activity className={`w-16 h-16 mb-4 ${emotionData ? 'text-blue-500 animate-pulse' : 'text-gray-300'}`} />
          <h3 className="text-gray-500 font-medium mb-2">Deteksi Emosi Saat Ini:</h3>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
            {emotionData ? emotionData.emotion.split(' - ')[0] : "Standby..."}
          </p>
          <p className="text-lg text-gray-500 mt-2 font-medium">
            {emotionData ? emotionData.emotion.split(' - ')[1] : "Menunggu gelombang otak..."}
          </p>
        </div>

        {/* Right: Circumplex Model Visualization */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center h-80 relative">
          <h3 className="text-gray-500 font-medium mb-4">Circumplex Model of Affect</h3>
          
          <div className="relative w-full max-w-[240px] aspect-square grid grid-cols-2 grid-rows-2 gap-2 mt-2">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0 rounded-full"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-200 -translate-x-1/2 z-0 rounded-full"></div>
            
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400">High Arousal</span>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400">Low Arousal</span>
            <span className="absolute top-1/2 -left-12 -translate-y-1/2 text-xs font-bold text-gray-400 -rotate-90">Low Valence</span>
            <span className="absolute top-1/2 -right-12 -translate-y-1/2 text-xs font-bold text-gray-400 rotate-90">High Valence</span>

            <div className={`rounded-tl-2xl z-10 transition-all duration-300 flex items-center justify-center font-bold text-sm
              ${activeQuad === 2 ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
              HALV (Stressed)
            </div>
            
            <div className={`rounded-tr-2xl z-10 transition-all duration-300 flex items-center justify-center font-bold text-sm
              ${activeQuad === 0 ? 'bg-yellow-400 text-white shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-105' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
              HAHV (Excited)
            </div>

            <div className={`rounded-bl-2xl z-10 transition-all duration-300 flex items-center justify-center font-bold text-sm
              ${activeQuad === 3 ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-105' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
              LALV (Bored)
            </div>

            <div className={`rounded-br-2xl z-10 transition-all duration-300 flex items-center justify-center font-bold text-sm
              ${activeQuad === 1 ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] scale-105' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
              LAHV (Calm)
            </div>
          </div>
        </div>
      </div>

      {/* Main Display: Bawah (Statistik Persentase Sesi)*/}
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Statistik Sesi Stimulus</h3>
            <p className="text-sm text-gray-500">Total Prediksi: <span className="font-bold">{currentTotal}</span> detik</p>
          </div>
          <button
            onClick={saveToHistoryAndReset}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4"/> Simpan & Reset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Progress Bars */}
          {[
            { id: 0, label: 'HAHV (Excited / Happy)', color: 'bg-yellow-400' },
            { id: 1, label: 'LAHV (Calm / Relaxed)', color: 'bg-green-500' },
            { id: 2, label: 'HALV (Stressed / Nervous)', color: 'bg-blue-500' },
            { id: 3, label: 'LALV (Bored / Sluggish)', color: 'bg-blue-500' } // Sesuaikan warna jika perlu
          ].map(quad => (
            <div key={quad.id}>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                <span>{quad.label}</span>
                <span>{getPercentage(quad.id)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className={`${quad.color} h-3 rounded-full transition-all duration-500`} style={{ width: `${getPercentage(quad.id)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Riwayat Sesi Stimulus */}
    {history.length > 0 && (
      <div className="w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600"/> Riwayat Rata-Rata Stimulus
        </h3>

        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold">
                    Stimulus {item.id}
                  </div>
                  <span className="text-xs font-medium text-gray-400">{item.timestamp}</span>
                </div>
                <div className="text-xs font-medium text-gray-500">
                  Durasi: <span className="text-gray-800">{item.totalDetik} detik</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                  <div className="text-xs text-yellow-600 font-bold mb-1">HAHV</div>
                  <div className="text-lg font-extrabold text-yellow-700">{item.hahv}%</div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <div className="text-xs text-green-600 font-bold mb-1">LAHV</div>
                  <div className="text-lg font-extrabold text-green-700">{item.lahv}%</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="text-xs text-blue-600 font-bold mb-1">HALV</div>
                  <div className="text-lg font-extrabold text-blue-700">{item.halv}%</div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <div className="text-xs text-red-600 font-bold mb-1">LALV</div>
                  <div className="text-lg font-extrabold text-red-700">{item.lalv}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> 
    )}
    </div>  
  );
}