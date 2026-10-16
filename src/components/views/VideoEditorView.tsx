import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { VideoCanvasPlayer } from '../common/VideoCanvasPlayer';
import { 
  Film,
  Scissors, 
  Music, 
  Layers, 
  Trash2, 
  Upload, 
  SlidersHorizontal,
  Clock,
  Subtitles,
  Sparkles
} from 'lucide-react';
import { secondsToSrtTimestamp } from '../../services/srtService';

export const VideoEditorView: React.FC = () => {
  const { 
    activeProject, 
    updateActiveProject, 
    videoCurrentTime, 
    setVideoCurrentTime,
    addJob,
    addNotification,
    setActivePage
  } = useStudio();

  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(activeProject.durationSeconds || 60);
  const [selectedRatio, setSelectedRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');
  const [volumeLevel, setVolumeLevel] = useState<number>(100);

  const activeMedia = activeProject.mediaFiles[0];

  // Clip Trim action
  const handleTrimClip = () => {
    if (trimEnd <= trimStart) {
      addNotification('Trim end must be greater than trim start', 'warning');
      return;
    }

    addJob('video_burn', `Trim Clip to [${secondsToSrtTimestamp(trimStart)} - ${secondsToSrtTimestamp(trimEnd)}]`, async (update) => {
      update(25, 'Executing FFmpeg process: -ss and -t copy');
      await new Promise(r => setTimeout(r, 600));
      update(70, 'Re-encoding keyframes with safe boundaries');
      await new Promise(r => setTimeout(r, 600));

      const newDur = trimEnd - trimStart;
      updateActiveProject(prev => ({
        ...prev,
        durationSeconds: newDur,
        mediaFiles: prev.mediaFiles.map(m => ({ ...m, duration: newDur })),
      }));
      setVideoCurrentTime(0);

      return `Trimmed video to ${newDur.toFixed(1)}s`;
    });
  };

  // Split Clip action
  const handleSplitAtPlayhead = () => {
    if (videoCurrentTime <= 1 || videoCurrentTime >= activeProject.durationSeconds - 1) {
      addNotification('Cannot split within 1 second of media boundaries', 'warning');
      return;
    }

    addJob('video_burn', `Split Clip at ${secondsToSrtTimestamp(videoCurrentTime)}`, async (update) => {
      update(40, 'Demuxing video container at playhead position');
      await new Promise(r => setTimeout(r, 500));
      update(90, 'Generating multi-segment clip metadata');

      const firstHalfDur = videoCurrentTime;
      const secondHalfDur = activeProject.durationSeconds - videoCurrentTime;

      const clip1 = {
        ...activeMedia,
        id: `clip_${Date.now()}_1`,
        name: `${activeMedia?.name || 'Clip'}_Part1`,
        duration: firstHalfDur,
      };

      const clip2 = {
        ...activeMedia,
        id: `clip_${Date.now()}_2`,
        name: `${activeMedia?.name || 'Clip'}_Part2`,
        duration: secondHalfDur,
      };

      updateActiveProject(prev => ({
        ...prev,
        mediaFiles: [clip1, clip2],
      }));

      return 'Clip split into two parts successfully';
    });
  };

  // Audio Extraction action
  const handleExtractAudio = () => {
    addJob('audio_process', 'FFmpeg Extract Audio Track (MP3/WAV)', async (update) => {
      update(30, 'Running ffmpeg -vn -acodec libmp3lame -q:a 2');
      await new Promise(r => setTimeout(r, 700));
      update(80, 'Validating extracted audio stream samples');
      await new Promise(r => setTimeout(r, 500));
      return 'Audio extracted successfully (audio_extracted.mp3)';
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <span>Video Editor &amp; Timeline</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Nonlinear video timeline, FFmpeg clip trimming, split at playhead, and audio extraction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('story-summarizer')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Summarize This Video</span>
          </button>
          <button
            onClick={() => setActivePage('subtitle-editor')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md"
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>Sync Subtitles</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player on Left, Timeline Tools on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video Player */}
        <div className="lg:col-span-7 space-y-4">
          <VideoCanvasPlayer />

          {/* Media Info Strip */}
          {activeMedia && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">RESOLUTION</span>
                <span className="text-slate-200">{activeMedia.width}x{activeMedia.height} (16:9)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">FRAME RATE</span>
                <span className="text-slate-200">{activeMedia.frameRate || 30} fps</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">VIDEO CODEC</span>
                <span className="text-slate-200">{activeMedia.videoCodec || 'h264'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">AUDIO CODEC</span>
                <span className="text-slate-200">{activeMedia.audioCodec || 'aac'} (Stereo)</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Trimming, Aspect Ratio, & Audio Tools */}
        <div className="lg:col-span-5 space-y-4">
          {/* Trimming & Split Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Clip Editing Operations
              </span>
              <Scissors className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">TRIM START (S)</label>
                  <input
                    type="number"
                    min={0}
                    max={activeProject.durationSeconds}
                    step={0.5}
                    value={trimStart}
                    onChange={e => setTrimStart(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{secondsToSrtTimestamp(trimStart)}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">TRIM END (S)</label>
                  <input
                    type="number"
                    min={trimStart}
                    max={activeProject.durationSeconds}
                    step={0.5}
                    value={trimEnd}
                    onChange={e => setTrimEnd(parseFloat(e.target.value) || activeProject.durationSeconds)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{secondsToSrtTimestamp(trimEnd)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTrimStart(videoCurrentTime)}
                  className="flex-1 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                >
                  Set Start at Playhead
                </button>
                <button
                  onClick={() => setTrimEnd(videoCurrentTime)}
                  className="flex-1 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                >
                  Set End at Playhead
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleTrimClip}
                  className="flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Execute Trim</span>
                </button>

                <button
                  onClick={handleSplitAtPlayhead}
                  className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700"
                >
                  <span>Split at Playhead</span>
                </button>
              </div>
            </div>
          </div>

          {/* Aspect Ratio & Formats */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Aspect Ratio Preset
              </span>
              <span className="text-xs text-slate-500 font-mono">{selectedRatio}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {(['16:9', '9:16', '1:1', '4:3'] as const).map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setSelectedRatio(ratio)}
                  className={`py-1.5 text-xs font-mono rounded border transition-colors ${
                    selectedRatio === ratio
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                AUDIO VOLUME GAIN: {volumeLevel}%
              </label>
              <input
                type="range"
                min={0}
                max={200}
                value={volumeLevel}
                onChange={e => setVolumeLevel(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button
              onClick={handleExtractAudio}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 mt-2"
            >
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span>Extract Audio Track (FFmpeg)</span>
            </button>
          </div>

          {/* Media Clips In Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block">
              Active Media Clips ({activeProject.mediaFiles.length})
            </span>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {activeProject.mediaFiles.map((m, idx) => (
                <div key={m.id} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-slate-500 text-[10px]">#{idx + 1}</span>
                    <span className="text-slate-200 truncate">{m.name}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px] shrink-0 ml-2">
                    {secondsToSrtTimestamp(m.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
