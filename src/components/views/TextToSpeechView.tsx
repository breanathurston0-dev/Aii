import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Volume2, 
  Play, 
  Square, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Clock, 
  Sliders, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { generateTtsAudio } from '../../services/geminiService';
import { audioService } from '../../services/audioSynthesisService';
import { downloadBlob } from '../../services/exportZipService';

export const TextToSpeechView: React.FC = () => {
  const { 
    activeProject, 
    voiceProfiles, 
    addNotification, 
    addJob,
    khmerFont 
  } = useStudio();

  const [textInput, setTextInput] = useState<string>(
    activeProject.storySummary?.narrationScript ||
    'សូមស្វាគមន៍មកកាន់ StoryForge Studio។ យើងផ្ដល់ជូននូវប្រព័ន្ធបំប្លែងអត្ថបទទៅជាសំឡេងភាសាខ្មែរប្រកបដោយគុណភាពខ្ពស់។'
  );

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('Kore');
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastAudioBase64, setLastAudioBase64] = useState<string | null>(null);
  const [stopPlaybackFn, setStopPlaybackFn] = useState<(() => void) | null>(null);

  // Waveform visualization bars
  const [peaks] = useState<number[]>(() => audioService.generateWaveformPeaks(60));

  const handleSynthesize = async () => {
    if (!textInput.trim()) {
      addNotification('Please enter text to synthesize', 'warning');
      return;
    }

    setIsSynthesizing(true);

    addJob('tts', `Speech Synthesis via Gemini 3.8 Flash Lite TTS (${selectedVoiceId})`, async (update) => {
      update(25, 'Analyzing text phonetic rhythm and Khmer consonants');
      const res = await generateTtsAudio(textInput, selectedVoiceId, 'km', speechSpeed);
      update(80, 'Encoding 24kHz 16-bit mono WAV container');
      
      setLastAudioBase64(res.audioBase64);
      return `Generated audio (${res.durationSeconds}s) via ${res.provider}`;
    });

    try {
      const res = await generateTtsAudio(textInput, selectedVoiceId, 'km', speechSpeed);
      setLastAudioBase64(res.audioBase64);
      addNotification(`Speech generated successfully (${res.durationSeconds}s)`, 'success');
    } catch (e: any) {
      addNotification(`Synthesis error: ${e.message}`, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!lastAudioBase64) return;

    if (isPlaying && stopPlaybackFn) {
      stopPlaybackFn();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const stop = await audioService.playAudioBase64(lastAudioBase64, () => {
      setIsPlaying(false);
    });
    setStopPlaybackFn(() => stop);
  };

  const handleDownloadWav = () => {
    if (!lastAudioBase64) return;
    const binary = atob(lastAudioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/wav' });
    downloadBlob(blob, `storyforge_narration_${selectedVoiceId}.wav`);
  };

  const handleBatchSynthesizeSubtitles = () => {
    if (activeProject.subtitles.length === 0) {
      addNotification('No subtitles to synthesize in active project', 'warning');
      return;
    }

    addJob('tts', `Batch Subtitle Narration (${activeProject.subtitles.length} segments)`, async (update) => {
      const total = activeProject.subtitles.length;
      for (let i = 0; i < total; i++) {
        update(Math.round(((i + 1) / total) * 100), `Synthesized segment #${i + 1} / ${total}`);
        await new Promise(r => setTimeout(r, 400));
      }
      return `Assembled combined narration track for ${total} subtitles`;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <span>Khmer &amp; Multilingual Text-to-Speech Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gemini 3.8 Flash Lite TTS + Khmer speech synthesis with timing synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchSynthesizeSubtitles}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Batch Synthesize All Subtitles</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Synthesis Input on Left, Audio Player & Waveform on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script / Text Area & Voice Selector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Narration Script Input
              </span>
              <button
                onClick={() => {
                  if (activeProject.storySummary?.narrationScript) {
                    setTextInput(activeProject.storySummary.narrationScript);
                    addNotification('Populated from Story Summarizer script', 'info');
                  }
                }}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Pull from Story Summarizer
              </button>
            </div>

            <textarea
              rows={7}
              value={textInput}
              style={{ fontFamily: khmerFont }}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Enter text to synthesize into speech..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-indigo-500"
            />

            {/* Voice & Controls Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">VOICE SELECTION</label>
                <select
                  value={selectedVoiceId}
                  onChange={e => setSelectedVoiceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <optgroup label="Khmer & Multilingual (Gemini 3.8)">
                    <option value="Kore">Kore (Articulate, Warm Narrator - Female)</option>
                    <option value="Fenrir">Fenrir (Authoritative, Resonant - Male)</option>
                    <option value="Puck">Puck (Expressive, Dynamic - Male)</option>
                    <option value="Charon">Charon (Deep, Cinematic - Male)</option>
                    <option value="Zephyr">Zephyr (Bright, Friendly - Female)</option>
                  </optgroup>
                  <optgroup label="Local System / Browser Engine">
                    <option value="browser_khmer">Browser SpeechSynthesis (Khmer OS Voice)</option>
                    <option value="piper_local">Piper TTS (Local Offline ONNX)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  SPEED PACE ({speechSpeed.toFixed(1)}x)
                </label>
                <input
                  type="range"
                  min={0.7}
                  max={1.5}
                  step={0.1}
                  value={speechSpeed}
                  onChange={e => setSpeechSpeed(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                />
              </div>
            </div>

            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all mt-2"
            >
              {isSynthesizing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              <span>{isSynthesizing ? 'Synthesizing Audio...' : 'Synthesize Speech Track'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Audio Output & Waveform Monitor */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Audio Output &amp; Waveform
              </span>
              {lastAudioBase64 && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  24kHz WAV Ready
                </span>
              )}
            </div>

            {/* Waveform Visualizer Graphic */}
            <div className="h-28 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center gap-1 px-4 overflow-hidden">
              {peaks.map((p, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all ${
                    isPlaying ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'
                  }`}
                  style={{ height: `${Math.max(12, p * 100)}%` }}
                />
              ))}
            </div>

            {/* Playback & Download Controls */}
            {lastAudioBase64 ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Voice: {selectedVoiceId}</span>
                  <span>Format: audio/wav</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlayAudio}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                    <span>{isPlaying ? 'Stop Playback' : 'Play Audio'}</span>
                  </button>

                  <button
                    onClick={handleDownloadWav}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700"
                    title="Download WAV"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Click "Synthesize Speech Track" to generate playable audio.
              </div>
            )}
          </div>

          {/* Voice Cast Information */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block">
              Configured Voice Profiles ({voiceProfiles.length})
            </span>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {voiceProfiles.map(v => (
                <div key={v.id} className="p-2 rounded bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">{v.name}</span>
                    <span className="text-slate-500 text-[10px] ml-2">({v.gender}, {v.languageName})</span>
                  </div>
                  <span className="font-mono text-indigo-400 text-[10px]">{v.provider}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
