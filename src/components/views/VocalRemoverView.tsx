import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Sliders, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Download, 
  RefreshCw, 
  Layers, 
  Sparkles,
  Music,
  Mic2
} from 'lucide-react';
import { separateAudioVocals } from '../../services/geminiService';
import { audioService } from '../../services/audioSynthesisService';

export const VocalRemoverView: React.FC = () => {
  const { activeProject, addNotification, addJob } = useStudio();

  const [model, setModel] = useState<'htdemucs' | 'htdemucs_ft' | 'mdx_extra'>('htdemucs');
  const [isSeparating, setIsSeparating] = useState<boolean>(false);
  const [separationResult, setSeparationResult] = useState<any | null>({
    vocalsTrack: 'Angkor_narrative_vocals.wav',
    instrumentalTrack: 'Angkor_narrative_instrumental.wav',
    isolationDb: '-28.4 dB',
    status: 'Ready',
  });

  const [vocalsVolume, setVocalsVolume] = useState<number>(100);
  const [instVolume, setInstVolume] = useState<number>(85);
  const [isVocalsMuted, setIsVocalsMuted] = useState<boolean>(false);
  const [isInstMuted, setIsInstMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Peaks for vocals and instruments
  const [vocalPeaks] = useState(() => audioService.generateWaveformPeaks(50, 11));
  const [instPeaks] = useState(() => audioService.generateWaveformPeaks(50, 29));

  const handleRunSeparation = async () => {
    setIsSeparating(true);

    addJob('vocal_separation', `Demucs Vocal Separation (${model})`, async (update) => {
      update(20, 'Loading deep neural source separation model weights');
      await new Promise(r => setTimeout(r, 600));

      update(50, 'Performing STFT spectrogram decomposition');
      await new Promise(r => setTimeout(r, 700));

      update(85, 'Synthesizing isolated vocals and instrumental stems');
      await new Promise(r => setTimeout(r, 600));

      const res = await separateAudioVocals('media_sample_01.mp4', model);
      setSeparationResult(res);
      return `Separated stems: Vocals (-28.4 dB) & Instrumental`;
    });

    try {
      const res = await separateAudioVocals('media_sample_01.mp4', model);
      setSeparationResult(res);
      addNotification('Vocal stems separated successfully with Demucs', 'success');
    } catch (err: any) {
      addNotification(`Separation failed: ${err.message}`, 'error');
    } finally {
      setIsSeparating(false);
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span>Vocal Remover &amp; Audio Separation (Demucs)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep-learning source separation engine isolating vocal speech tracks from instrumental background music.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={model}
            onChange={e => setModel(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="htdemucs">Demucs v4 (Hybrid Transformer - Fast)</option>
            <option value="htdemucs_ft">Demucs v4 Fine-Tuned (High Fidelity)</option>
            <option value="mdx_extra">MDX-Net Extra (Vocals Specific)</option>
          </select>

          <button
            onClick={handleRunSeparation}
            disabled={isSeparating}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-sm whitespace-nowrap"
          >
            {isSeparating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isSeparating ? 'Separating Stems...' : 'Separate Vocals & Music'}</span>
          </button>
        </div>
      </div>

      {/* Stem Mixer Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mixer Track Sliders */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Multitrack Stem Mixer
              </span>
              <button
                onClick={togglePlayback}
                className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
              >
                {isPlaying ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isPlaying ? 'Pause Stems' : 'Play Both Stems'}</span>
              </button>
            </div>

            {/* Vocals Track */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Isolated Vocals / Speech</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    -28.4 dB
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsVocalsMuted(!isVocalsMuted)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                      isVocalsMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isVocalsMuted ? 'Muted' : 'Mute'}
                  </button>
                  <span className="text-xs font-mono text-slate-300">{isVocalsMuted ? '0%' : `${vocalsVolume}%`}</span>
                </div>
              </div>

              {/* Waveform graphic */}
              <div className="h-12 flex items-center gap-0.5 overflow-hidden px-1">
                {vocalPeaks.map((p, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-xs transition-all ${
                      isPlaying && !isVocalsMuted ? 'bg-indigo-400' : 'bg-slate-800'
                    }`}
                    style={{ height: `${p * 100}%` }}
                  />
                ))}
              </div>

              <input
                type="range"
                min={0}
                max={150}
                value={isVocalsMuted ? 0 : vocalsVolume}
                onChange={e => setVocalsVolume(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Instrumental / Backing Track */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Instrumental / Backing Track</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                    Clean Music
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsInstMuted(!isInstMuted)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                      isInstMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isInstMuted ? 'Muted' : 'Mute'}
                  </button>
                  <span className="text-xs font-mono text-slate-300">{isInstMuted ? '0%' : `${instVolume}%`}</span>
                </div>
              </div>

              {/* Waveform graphic */}
              <div className="h-12 flex items-center gap-0.5 overflow-hidden px-1">
                {instPeaks.map((p, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-xs transition-all ${
                      isPlaying && !isInstMuted ? 'bg-emerald-400' : 'bg-slate-800'
                    }`}
                    style={{ height: `${p * 100}%` }}
                  />
                ))}
              </div>

              <input
                type="range"
                min={0}
                max={150}
                value={isInstMuted ? 0 : instVolume}
                onChange={e => setInstVolume(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Stem Artifacts & Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
              Extracted Stem Files
            </span>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>Vocals Only Track</span>
                  <button
                    onClick={() => addNotification('Downloaded vocals stem WAV', 'success')}
                    className="p-1 text-indigo-400 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] font-mono text-slate-500">Angkor_narrative_vocals.wav (WAV 24-bit)</div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>Instrumental Only Track</span>
                  <button
                    onClick={() => addNotification('Downloaded instrumental stem WAV', 'success')}
                    className="p-1 text-emerald-400 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] font-mono text-slate-500">Angkor_narrative_instrumental.wav (WAV 24-bit)</div>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded text-[11px] text-slate-300 leading-normal">
              Demucs v4 separates audio into 4 potential stems: Vocals, Drums, Bass, and Other. StoryForge Studio assembles isolated dialogue for clear narration replacement or dubbing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
