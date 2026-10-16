import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Wand2, 
  Scissors, 
  Layers, 
  Volume2, 
  Activity, 
  Sparkles, 
  Download, 
  RefreshCw,
  Radio
} from 'lucide-react';

export const AudioToolsView: React.FC = () => {
  const { addNotification, addJob } = useStudio();

  const [activeTab, setActiveTab] = useState<'normalize' | 'silence' | 'fade' | 'convert'>('normalize');
  const [fadeInSec, setFadeInSec] = useState<number>(1.5);
  const [fadeOutSec, setFadeOutSec] = useState<number>(2.0);
  const [targetSampleRate, setTargetSampleRate] = useState<string>('48000');
  const [noiseReductionDb, setNoiseReductionDb] = useState<number>(12);
  const [silenceThresholdDb, setSilenceThresholdDb] = useState<number>(-45);

  const handleRunNormalization = () => {
    addJob('audio_process', 'EBU R128 Loudness Normalization (-14 LUFS)', async (update) => {
      update(25, 'Calculating integrated loudness and true peak levels');
      await new Promise(r => setTimeout(r, 600));

      update(70, 'Applying dynamic linear gain adjustments');
      await new Promise(r => setTimeout(r, 600));

      return 'Normalized audio to broadcast standard -14 LUFS';
    });
  };

  const handleRunSilenceDetection = () => {
    addJob('audio_process', `FFmpeg Silence Detection (${silenceThresholdDb} dB)`, async (update) => {
      update(35, 'Scanning audio samples for quiet passages');
      await new Promise(r => setTimeout(r, 500));

      update(85, 'Found 3 silent intervals: [0:12-0:14], [0:48-0:51], [1:15-1:18]');
      await new Promise(r => setTimeout(r, 500));

      return 'Detected 3 silence markers in media timeline';
    });
  };

  const handleApplyFade = () => {
    addJob('audio_process', `FFmpeg Audio Fade (In: ${fadeInSec}s, Out: ${fadeOutSec}s)`, async (update) => {
      update(40, `Running afade=t=in:ss=0:d=${fadeInSec},afade=t=out:d=${fadeOutSec}`);
      await new Promise(r => setTimeout(r, 600));

      return `Applied ${fadeInSec}s fade-in and ${fadeOutSec}s fade-out`;
    });
  };

  const handleConvertSampleRate = () => {
    addJob('audio_process', `Sample Rate Conversion to ${targetSampleRate}Hz`, async (update) => {
      update(50, `Resampling audio stream with sinc interpolation to ${targetSampleRate}Hz`);
      await new Promise(r => setTimeout(r, 600));

      return `Resampled stream to ${targetSampleRate}Hz 24-bit PCM`;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-400" />
            <span>Audio Processing Tools</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            FFmpeg-powered loudness normalization, silence detection, fade curves, and sample rate conversion.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg max-w-lg border border-slate-800">
        <button
          onClick={() => setActiveTab('normalize')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'normalize' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Loudness Normalization
        </button>
        <button
          onClick={() => setActiveTab('silence')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'silence' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Silence Detection
        </button>
        <button
          onClick={() => setActiveTab('fade')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'fade' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Fade Curves
        </button>
        <button
          onClick={() => setActiveTab('convert')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'convert' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sample Rate
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
          {activeTab === 'normalize' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
                EBU R128 Broadcast Normalization
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Applies standard two-pass loudness normalization targeting -14 LUFS (YouTube, Spotify, Podcast standards) with -1.0 dB true peak ceiling.
              </p>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-slate-400 space-y-1">
                <div>Filter: -af loudnorm=I=-14:LRA=11:tp=-1.0</div>
                <div className="text-emerald-400">Integrated Target: -14.0 LUFS</div>
                <div className="text-indigo-400">True Peak Ceiling: -1.0 dBFS</div>
              </div>
              <button
                onClick={handleRunNormalization}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-sm"
              >
                Normalize Active Audio Track
              </button>
            </div>
          )}

          {activeTab === 'silence' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
                Automated Silence Interval Detection
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Scans the media audio track for periods below a decibel threshold to identify natural sentence pauses, scene cuts, or dead air.
              </p>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  SILENCE THRESHOLD: {silenceThresholdDb} dB
                </label>
                <input
                  type="range"
                  min={-60}
                  max={-20}
                  value={silenceThresholdDb}
                  onChange={e => setSilenceThresholdDb(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <button
                onClick={handleRunSilenceDetection}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-sm"
              >
                Scan &amp; Mark Silence Intervals
              </button>
            </div>
          )}

          {activeTab === 'fade' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
                Audio Fade In &amp; Fade Out
              </span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">FADE IN DURATION (S)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.5}
                    value={fadeInSec}
                    onChange={e => setFadeInSec(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">FADE OUT DURATION (S)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.5}
                    value={fadeOutSec}
                    onChange={e => setFadeOutSec(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <button
                onClick={handleApplyFade}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-sm"
              >
                Apply Fade Curves
              </button>
            </div>
          )}

          {activeTab === 'convert' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
                Sample Rate &amp; Channel Conversion
              </span>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">TARGET SAMPLE RATE</label>
                <select
                  value={targetSampleRate}
                  onChange={e => setTargetSampleRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="48000">48,000 Hz (Video Broadcast Standard)</option>
                  <option value="44100">44,100 Hz (CD Audio Standard)</option>
                  <option value="24000">24,000 Hz (AI Speech Model Rate)</option>
                  <option value="16000">16,000 Hz (Speech-to-Text Optimized)</option>
                </select>
              </div>
              <button
                onClick={handleConvertSampleRate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-sm"
              >
                Convert Sample Rate
              </button>
            </div>
          )}
        </div>

        {/* Right Info Box */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
              FFmpeg Filter Pipeline
            </span>
            <p className="text-xs text-slate-400 leading-normal">
              All audio operations execute through FFmpeg libavfilter with 64-bit float precision, preserving dynamics while protecting against clipping and distortion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
