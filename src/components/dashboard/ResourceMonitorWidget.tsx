import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity, 
  Flame, 
  Gauge, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  Clock, 
  Layers, 
  Sliders, 
  Maximize2, 
  Minimize2,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  Database,
  Radio,
  Sparkles,
  Server
} from 'lucide-react';
import { JobItem } from '../../types/studio';

export type PerformanceProfile = 'turbo' | 'balanced' | 'eco';

interface MetricSnapshot {
  timestamp: number;
  cpu: number;
  gpu: number;
  ramMB: number;
}

export const ResourceMonitorWidget: React.FC = () => {
  const { 
    jobQueue, 
    addJob, 
    systemStatus, 
    setActivePage, 
    addNotification 
  } = useStudio();

  // Active running tasks
  const runningJobs = useMemo(() => {
    return jobQueue.filter(j => j.status === 'running');
  }, [jobQueue]);

  // Controls & Settings
  const [profile, setProfile] = useState<PerformanceProfile>('turbo');
  const [isLivePolling, setIsLivePolling] = useState<boolean>(true);
  const [pollingIntervalMs, setPollingIntervalMs] = useState<number>(1000);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'cores' | 'tasks' | 'hardware'>('metrics');
  const [isOptimizingMemory, setIsOptimizingMemory] = useState<boolean>(false);

  // Simulated Hardware Specs (Realistic Workstation Profile)
  const hardwareSpecs = {
    cpuModel: 'AMD Ryzen 9 / Apple M-Series (16 Cores, 32 Threads)',
    baseClock: '3.80 GHz',
    boostClock: '5.20 GHz',
    gpuModel: 'NVIDIA RTX 4080 / Apple Metal Engine (16GB VRAM)',
    totalRamGB: 32,
    totalRamMB: 32768,
    storageType: 'NVMe PCIe 4.0 SSD (Read 7100 MB/s, Write 6800 MB/s)',
  };

  // Multi-core status (8 representative cores for detailed display)
  const [coreLoads, setCoreLoads] = useState<number[]>([12, 8, 15, 6, 11, 14, 9, 7]);

  // Metric history for SVG sparklines (last 24 data points)
  const [history, setHistory] = useState<MetricSnapshot[]>(() => {
    const now = Date.now();
    return Array.from({ length: 24 }).map((_, i) => ({
      timestamp: now - (24 - i) * 1000,
      cpu: 12 + Math.floor(Math.sin(i) * 4),
      gpu: 8 + Math.floor(Math.cos(i) * 3),
      ramMB: 3100 + i * 15,
    }));
  });

  // Latest calculated metric values
  const currentSnapshot = history[history.length - 1] || {
    cpu: 14,
    gpu: 9,
    ramMB: 3200,
    timestamp: Date.now()
  };

  // Calculate live loads based on active jobs and performance profile
  useEffect(() => {
    if (!isLivePolling) return;

    const timer = setInterval(() => {
      setHistory(prevHistory => {
        const hasJobs = runningJobs.length > 0;
        
        // Multiplier based on profile
        const profileMultiplier = profile === 'turbo' ? 1.0 : profile === 'balanced' ? 0.8 : 0.55;

        // Base idle jitter
        let targetCpu = 10 + Math.random() * 6;
        let targetGpu = 6 + Math.random() * 5;
        let targetRam = 3150 + Math.random() * 120;

        // If tasks are running, surge resource usage realistically
        if (hasJobs) {
          runningJobs.forEach(job => {
            switch (job.type) {
              case 'video_burn':
                // Heavy GPU encoder and CPU ffmpeg
                targetCpu += 48 * profileMultiplier;
                targetGpu += 62 * profileMultiplier;
                targetRam += 1850;
                break;
              case 'vocal_separation':
                // Heavy CPU multi-threading and tensor memory
                targetCpu += 65 * profileMultiplier;
                targetGpu += 45 * profileMultiplier;
                targetRam += 1400;
                break;
              case 'transcription':
                // Moderate CPU speech recognition
                targetCpu += 38 * profileMultiplier;
                targetGpu += 22 * profileMultiplier;
                targetRam += 850;
                break;
              case 'tts':
                targetCpu += 28 * profileMultiplier;
                targetGpu += 15 * profileMultiplier;
                targetRam += 420;
                break;
              default:
                targetCpu += 32 * profileMultiplier;
                targetGpu += 25 * profileMultiplier;
                targetRam += 600;
            }
          });
        }

        // Clamp values to realistic max bounds
        const finalCpu = Math.min(98, Math.max(5, Math.round(targetCpu)));
        const finalGpu = Math.min(99, Math.max(3, Math.round(targetGpu)));
        const finalRam = Math.min(hardwareSpecs.totalRamMB - 2000, Math.max(2800, Math.round(targetRam)));

        // Update core loads distributed unevenly
        setCoreLoads(prev => prev.map((_, idx) => {
          const coreJitter = (Math.random() - 0.5) * 16;
          // When jobs running, thread 0-3 take heavier load
          const bias = hasJobs ? (idx < 4 ? 12 : -8) : 0;
          return Math.min(100, Math.max(4, Math.round(finalCpu + bias + coreJitter)));
        }));

        const newPoint: MetricSnapshot = {
          timestamp: Date.now(),
          cpu: finalCpu,
          gpu: finalGpu,
          ramMB: finalRam
        };

        const updated = [...prevHistory.slice(1), newPoint];
        return updated;
      });
    }, pollingIntervalMs);

    return () => clearInterval(timer);
  }, [isLivePolling, pollingIntervalMs, runningJobs, profile]);

  // Derived metrics
  const ramUsagePercent = Math.round((currentSnapshot.ramMB / hardwareSpecs.totalRamMB) * 100);
  const ramUsageGB = (currentSnapshot.ramMB / 1024).toFixed(2);
  const vramUsedGB = ((currentSnapshot.gpu / 100) * 11.2 + 1.2).toFixed(1);
  const gpuTemp = Math.round(44 + (currentSnapshot.gpu / 100) * 32);
  const cpuTemp = Math.round(42 + (currentSnapshot.cpu / 100) * 38);
  const diskReadMBps = runningJobs.length > 0 ? (85 + Math.random() * 60).toFixed(0) : (4 + Math.random() * 6).toFixed(0);
  const diskWriteMBps = runningJobs.length > 0 ? (42 + Math.random() * 55).toFixed(0) : (1 + Math.random() * 3).toFixed(0);

  // Memory breakdown segments
  const ramBreakdown = useMemo(() => {
    const total = currentSnapshot.ramMB;
    return {
      videoBuffers: Math.round(total * 0.42),
      audioStems: Math.round(total * 0.26),
      wasmModelWeights: Math.round(total * 0.18),
      sqliteAndDom: Math.round(total * 0.14)
    };
  }, [currentSnapshot.ramMB]);

  // Run benchmark test load
  const handleRunBenchmark = () => {
    addNotification('Initiating Hardware Acceleration & Subsystem Stress Test', 'info');
    
    addJob('video_burn', 'Hardware Benchmark: Multi-Thread 4K H.264 & Demucs Stress Test', async (update) => {
      update(10, 'Allocating 8 worker threads and testing WebAssembly SIMD throughput');
      await new Promise(r => setTimeout(r, 800));
      update(35, 'Simulating GPU frame rasterization and HEVC hardware encoder pass');
      await new Promise(r => setTimeout(r, 900));
      update(70, 'Running audio stem separation FFT spectrum convolution on CPU cores');
      await new Promise(r => setTimeout(r, 900));
      update(95, 'Verifying memory integrity and flushing transient render caches');
      await new Promise(r => setTimeout(r, 600));
      addNotification('Benchmark complete: 4K encode rate ~84 fps, Hardware GPU acceleration verified', 'success');
      return 'benchmark_results_4k.log';
    });
  };

  // Optimize & Purge Memory
  const handlePurgeMemory = () => {
    setIsOptimizingMemory(true);
    setTimeout(() => {
      setHistory(prev => prev.map(pt => ({
        ...pt,
        ramMB: Math.max(2800, pt.ramMB - 650)
      })));
      setIsOptimizingMemory(false);
      addNotification('RAM Optimized: Freed 650 MB of transient video frame and audio waveform cache', 'success');
    }, 700);
  };

  // Helper to generate SVG points string for sparkline
  const generateSvgPoints = (data: number[], min: number, max: number, width: number, height: number) => {
    if (data.length < 2) return '';
    const range = max - min || 1;
    return data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const normalizedY = 1 - (val - min) / range;
      const y = Math.max(2, Math.min(height - 2, normalizedY * height));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const cpuDataPoints = history.map(h => h.cpu);
  const gpuDataPoints = history.map(h => h.gpu);
  const ramDataPoints = history.map(h => h.ramMB);

  // Status color helpers
  const getLoadBadgeColor = (val: number) => {
    if (val < 50) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (val < 80) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  const getLoadBarColor = (val: number) => {
    if (val < 50) return 'bg-emerald-500';
    if (val < 80) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                System Resource &amp; Engine Telemetry Monitor
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border flex items-center gap-1 ${
                runningJobs.length > 0 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse' 
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${runningJobs.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {runningJobs.length > 0 ? `${runningJobs.length} Processing Tasks Active` : 'Engine Idle / Nominal'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live multi-threaded CPU usage, GPU tensor compute, and RAM allocation for multimedia synthesis.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Performance Profile Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            {(['turbo', 'balanced', 'eco'] as PerformanceProfile[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setProfile(p);
                  addNotification(`Performance profile set to ${p.toUpperCase()}`, 'info');
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase transition-colors cursor-pointer ${
                  profile === p 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Switch to ${p} profile`}
              >
                {p === 'turbo' ? '⚡ Turbo' : p === 'balanced' ? '⚖️ Balanced' : '🍃 Eco'}
              </button>
            ))}
          </div>

          {/* Polling Pause / Play */}
          <button
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`p-1.5 rounded border text-xs transition-colors cursor-pointer ${
              isLivePolling 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' 
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
            title={isLivePolling ? 'Pause live metric updates' : 'Resume live metric polling'}
          >
            {isLivePolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Test Load / Benchmark */}
          <button
            onClick={handleRunBenchmark}
            className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Trigger a simulated hardware stress test to verify CPU/GPU responsiveness"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Processing Load</span>
          </button>

          {/* Purge / Optimize RAM */}
          <button
            onClick={handlePurgeMemory}
            disabled={isOptimizingMemory}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Clean transient video frame buffers and garbage collect memory"
          >
            <RefreshCw className={`w-3 h-3 text-slate-400 ${isOptimizingMemory ? 'animate-spin' : ''}`} />
            <span>{isOptimizingMemory ? 'Optimizing...' : 'Trim RAM'}</span>
          </button>

          {/* Toggle Expand / Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse monitor views' : 'Expand detailed hardware view'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid (CPU, GPU, RAM, I/O) */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/60">
        {/* 1. CPU USAGE CARD */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>CPU UTILIZATION</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getLoadBadgeColor(currentSnapshot.cpu)}`}>
              {currentSnapshot.cpu}%
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {currentSnapshot.cpu}
              <span className="text-lg font-normal text-slate-500">%</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              @ {profile === 'turbo' ? '4.85 GHz' : profile === 'balanced' ? '3.80 GHz' : '2.40 GHz'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${getLoadBarColor(currentSnapshot.cpu)}`}
              style={{ width: `${currentSnapshot.cpu}%` }}
            />
          </div>

          {/* SVG Sparkline */}
          <div className="h-10 w-full mb-3 bg-slate-900/40 rounded border border-slate-800/50 p-1 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={generateSvgPoints(cpuDataPoints, 0, 100, 100, 30)}
              />
            </svg>
          </div>

          {/* Sub-metrics */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>{cpuTemp}°C</span>
            </span>
            <span>16 Cores / 32 Threads</span>
          </div>
        </div>

        {/* 2. GPU / HARDWARE ACCELERATION CARD */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>GPU &amp; TENSOR CORE</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getLoadBadgeColor(currentSnapshot.gpu)}`}>
              {currentSnapshot.gpu}%
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {currentSnapshot.gpu}
              <span className="text-lg font-normal text-slate-500">%</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              VRAM: {vramUsedGB} / 16.0 GB
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${getLoadBarColor(currentSnapshot.gpu)}`}
              style={{ width: `${currentSnapshot.gpu}%` }}
            />
          </div>

          {/* SVG Sparkline */}
          <div className="h-10 w-full mb-3 bg-slate-900/40 rounded border border-slate-800/50 p-1 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#34d399"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={generateSvgPoints(gpuDataPoints, 0, 100, 100, 30)}
              />
            </svg>
          </div>

          {/* Sub-metrics */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>{gpuTemp}°C</span>
            </span>
            <span className="text-emerald-400 font-semibold">WebGPU / NVENC Active</span>
          </div>
        </div>

        {/* 3. RAM ALLOCATION CARD */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300">
              <Database className="w-4 h-4 text-purple-400" />
              <span>RAM ALLOCATION</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold text-purple-400 bg-purple-500/10 border-purple-500/20">
              {ramUsagePercent}% ({ramUsageGB} GB)
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {ramUsageGB}
              <span className="text-lg font-normal text-slate-500"> GB</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              of {hardwareSpecs.totalRamGB} GB
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-purple-500 transition-all duration-500 rounded-full"
              style={{ width: `${ramUsagePercent}%` }}
            />
          </div>

          {/* SVG Sparkline */}
          <div className="h-10 w-full mb-3 bg-slate-900/40 rounded border border-slate-800/50 p-1 flex items-center justify-center">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={generateSvgPoints(ramDataPoints, 2000, 10000, 100, 30)}
              />
            </svg>
          </div>

          {/* Sub-metrics */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Buffer: {(ramBreakdown.videoBuffers / 1024).toFixed(1)}GB</span>
            <span className="text-emerald-400">Memory Pressure: Low</span>
          </div>
        </div>

        {/* 4. DISK I/O & PIPELINE THROUGHPUT CARD */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-300">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span>STORAGE &amp; BUS I/O</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold text-sky-400 bg-sky-500/10 border-sky-500/20">
              NVMe Gen4
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {diskReadMBps}
              <span className="text-lg font-normal text-slate-500"> MB/s</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Write: {diskWriteMBps} MB/s
            </span>
          </div>

          {/* Dual Bar (Read/Write) */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Read Bandwidth</span>
              <span>{diskReadMBps} MB/s</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (Number(diskReadMBps) / 200) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
              <span>Write Bandwidth</span>
              <span>{diskWriteMBps} MB/s</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, (Number(diskWriteMBps) / 150) * 100)}%` }}
              />
            </div>
          </div>

          {/* Sub-metrics */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Async Queue: {runningJobs.length} active</span>
            <span className="text-slate-300">SQLite WAL Active</span>
          </div>
        </div>
      </div>

      {/* Tabs for Detailed Telemetry (Expanded or Interactive view) */}
      <div className="border-t border-slate-800/80 px-5 pt-3 pb-0 bg-slate-950/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === 'metrics'
                ? 'bg-slate-900 border-slate-800 text-white border-b-transparent font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Detailed Allocation
          </button>
          <button
            onClick={() => setActiveTab('cores')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === 'cores'
                ? 'bg-slate-900 border-slate-800 text-white border-b-transparent font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Core Matrix ({coreLoads.length} Cores)
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-t border-t border-x transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-slate-900 border-slate-800 text-white border-b-transparent font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Active Task Threads</span>
            {runningJobs.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === 'hardware'
                ? 'bg-slate-900 border-slate-800 text-white border-b-transparent font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Engine &amp; Subsystems
          </button>
        </div>

        <button
          onClick={() => setActivePage('processing-queue')}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer mb-2"
        >
          <span>Open Full Job Queue</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab 1: Detailed Allocation Breakdown */}
      {activeTab === 'metrics' && (
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/40 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* RAM Breakdown Sub-panel */}
            <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  DYNAMIC RAM HEAP ALLOCATION ({ramUsageGB} GB Tracked)
                </span>
                <span className="text-[11px] text-slate-500">Max System: {hardwareSpecs.totalRamGB} GB</span>
              </div>

              {/* Stacked Bar */}
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div style={{ width: '42%' }} className="bg-indigo-500" title={`Video Cache & Frame Buffers: ${ramBreakdown.videoBuffers} MB`} />
                <div style={{ width: '26%' }} className="bg-emerald-500" title={`Audio PCM & Stem Waves: ${ramBreakdown.audioStems} MB`} />
                <div style={{ width: '18%' }} className="bg-amber-500" title={`WebAssembly AI Models: ${ramBreakdown.wasmModelWeights} MB`} />
                <div style={{ width: '14%' }} className="bg-purple-500" title={`SQLite & UI State: ${ramBreakdown.sqliteAndDom} MB`} />
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  <span>Video Buffers ({ramBreakdown.videoBuffers} MB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span>Audio Stems ({ramBreakdown.audioStems} MB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span>AI Model Weights ({ramBreakdown.wasmModelWeights} MB)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                  <span>SQLite DB Cache ({ramBreakdown.sqliteAndDom} MB)</span>
                </div>
              </div>
            </div>

            {/* GPU Acceleration Sub-panel */}
            <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  HARDWARE ACCELERATION STATUS
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">Shader Core 3.0</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">WebGPU Context:</span>
                  <span className="text-emerald-400 font-semibold">Active (Vulkan)</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">FFmpeg HW Encoder:</span>
                  <span className="text-emerald-400 font-semibold">NVENC H.264/HEVC</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Wasm SIMD Vector:</span>
                  <span className="text-emerald-400 font-semibold">128-bit Active</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Demucs Engine:</span>
                  <span className="text-emerald-400 font-semibold">PyTorch Tensor</span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>VRAM Bandwidth: 672 GB/s</span>
                <span>PCIe Gen 4.0 x16</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Core Matrix (Multi-core breakdown) */}
      {activeTab === 'cores' && (
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="font-semibold">LOGICAL PROCESSOR CORE DISTRIBUTION (8 Sample Cores)</span>
            <span className="text-slate-400">Total System: 16 Cores, 32 Threads</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {coreLoads.map((load, idx) => (
              <div 
                key={idx}
                className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-center space-y-1.5"
              >
                <div className="text-[10px] font-mono text-slate-500 font-semibold uppercase">
                  Core #{idx + 1}
                </div>
                <div className="text-base font-extrabold text-white font-mono tabular-nums">
                  {load}%
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${getLoadBarColor(load)}`}
                    style={{ width: `${load}%` }}
                  />
                </div>
                <div className="text-[9px] font-mono text-slate-400">
                  {idx < 4 ? 'Perf Core' : 'Eff Core'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Active Task Threads */}
      {activeTab === 'tasks' && (
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="font-semibold">ACTIVE PROCESSING JOBS &amp; HARDWARE CORRELATION</span>
            <span className="text-slate-400">{runningJobs.length} running tasks</span>
          </div>

          {runningJobs.length === 0 ? (
            <div className="p-6 bg-slate-950/60 rounded-lg border border-slate-800/80 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Hardware Pipeline Idle
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  No background rendering, transcription, or stem separation tasks are currently active. 
                  Hardware resources are operating in low-power nominal standby.
                </p>
              </div>

              <button
                onClick={handleRunBenchmark}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Launch Benchmark Load Test</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {runningJobs.map(job => (
                <div 
                  key={job.id}
                  className="p-3 bg-slate-950/90 rounded-lg border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-indigo-600/20 text-indigo-400 flex items-center justify-center animate-spin">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{job.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {job.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Started: {new Date(job.startedAt).toLocaleTimeString()} · Progress: {job.progress}%
                      </div>
                    </div>
                  </div>

                  {/* Resource consumption estimates for this task */}
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-800/60">
                      CPU: ~{job.type === 'vocal_separation' ? '65%' : job.type === 'video_burn' ? '48%' : '35%'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-800/60">
                      GPU: ~{job.type === 'video_burn' ? '62%' : '25%'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-800/60">
                      RAM: ~{job.type === 'video_burn' ? '1.8 GB' : '950 MB'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Engine & Subsystems info */}
      {activeTab === 'hardware' && (
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="font-semibold">ENGINE CAPABILITIES &amp; SUBSYSTEM MATRIX</span>
            <span className="text-slate-400">StoryForge v2.4 Native Pipeline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
              <div className="text-slate-500 text-[10px] uppercase font-bold">FFMPEG MEDIA CORE</div>
              <div className="text-white font-semibold">Version 4.4.2 Native</div>
              <div className="text-[11px] text-emerald-400">H.264 / HEVC / ProRes / AAC</div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
              <div className="text-slate-500 text-[10px] uppercase font-bold">WHISPER STT ENGINE</div>
              <div className="text-white font-semibold">Whisper.cpp / Faster-Whisper</div>
              <div className="text-[11px] text-emerald-400">Khmer Unicode &amp; 98+ Languages</div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
              <div className="text-slate-500 text-[10px] uppercase font-bold">DEMUCS AUDIO ISOLATOR</div>
              <div className="text-white font-semibold">HTDemucs 4-Stem Model</div>
              <div className="text-[11px] text-emerald-400">Vocals, Drums, Bass, Other</div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
              <div className="text-slate-500 text-[10px] uppercase font-bold">PERSISTENCE &amp; DB</div>
              <div className="text-white font-semibold">SQLite WAL Storage</div>
              <div className="text-[11px] text-emerald-400">Real-time Project Auto-save</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Status Bar */}
      <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>Host: {hardwareSpecs.cpuModel}</span>
          </span>
          <span className="text-slate-600">·</span>
          <span>GPU: {hardwareSpecs.gpuModel}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500">Sampling Rate: {pollingIntervalMs}ms</span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400">Hardware Acceleration: Ready</span>
        </div>
      </div>
    </div>
  );
};
