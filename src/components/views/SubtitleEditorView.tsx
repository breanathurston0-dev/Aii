import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Subtitles, 
  Plus, 
  Trash2, 
  Upload, 
  Download, 
  Clock, 
  AlertTriangle, 
  Check, 
  Wand2, 
  Type, 
  Eye, 
  Split, 
  Combine,
  Sparkles
} from 'lucide-react';
import { 
  parseSrt, 
  stringifySrt, 
  shiftTimestamps, 
  fixOverlaps, 
  secondsToSrtTimestamp, 
  srtTimestampToSeconds 
} from '../../services/srtService';
import { downloadBlob } from '../../services/exportZipService';
import { SubtitleSegment } from '../../types/studio';
import { VideoCanvasPlayer } from '../common/VideoCanvasPlayer';

export const SubtitleEditorView: React.FC = () => {
  const { 
    activeProject, 
    updateActiveProject, 
    addNotification, 
    setVideoCurrentTime, 
    videoCurrentTime,
    khmerFont,
    setKhmerFont,
    setActivePage
  } = useStudio();

  const [shiftOffsetMs, setShiftOffsetMs] = useState<number>(500);
  const [showStylePanel, setShowStylePanel] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const subtitles = activeProject.subtitles || [];

  const filteredSubs = subtitles.filter(s =>
    s.text.toLowerCase().includes(search.toLowerCase()) ||
    (s.speaker && s.speaker.toLowerCase().includes(search.toLowerCase()))
  );

  const handleImportSrt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseSrt(text);
      if (parsed.length > 0) {
        updateActiveProject(prev => ({ ...prev, subtitles: parsed }));
        addNotification(`Imported ${parsed.length} subtitles from SRT`, 'success');
      } else {
        addNotification('Could not parse any subtitle entries from file', 'warning');
      }
    };
    reader.readAsText(file);
  };

  const handleExportSrt = () => {
    const srtStr = stringifySrt(subtitles);
    const blob = new Blob([srtStr], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${activeProject.name}_subtitles.srt`);
    addNotification('Exported SRT file', 'success');
  };

  const handleAddSubtitle = () => {
    const last = subtitles[subtitles.length - 1];
    const startSec = last ? last.endSeconds + 0.2 : videoCurrentTime;
    const endSec = startSec + 3.0;

    const newSub: SubtitleSegment = {
      id: Date.now(),
      startTime: secondsToSrtTimestamp(startSec),
      endTime: secondsToSrtTimestamp(endSec),
      startSeconds: startSec,
      endSeconds: endSec,
      text: 'New subtitle line...',
      isOverlapping: false,
      cpsAlert: false,
    };

    updateActiveProject(prev => ({
      ...prev,
      subtitles: [...prev.subtitles, newSub],
    }));
    addNotification('Subtitle added', 'success');
  };

  const handleUpdateSub = (id: number, text: string, startStr: string, endStr: string, speaker?: string) => {
    const startSec = srtTimestampToSeconds(startStr);
    const endSec = srtTimestampToSeconds(endStr);
    const duration = Math.max(0.1, endSec - startSec);
    const cpsAlert = text.length / duration > 22;

    updateActiveProject(prev => ({
      ...prev,
      subtitles: prev.subtitles.map(s =>
        s.id === id
          ? {
              ...s,
              text,
              speaker,
              startTime: startStr,
              endTime: endStr,
              startSeconds: startSec,
              endSeconds: endSec,
              cpsAlert,
            }
          : s
      ),
    }));
  };

  const handleDeleteSub = (id: number) => {
    updateActiveProject(prev => ({
      ...prev,
      subtitles: prev.subtitles.filter(s => s.id !== id),
    }));
    addNotification('Subtitle deleted', 'info');
  };

  const handleShiftTimestamps = (direction: 1 | -1) => {
    const delta = shiftOffsetMs * direction;
    const shifted = shiftTimestamps(subtitles, delta);
    updateActiveProject(prev => ({ ...prev, subtitles: shifted }));
    addNotification(`Shifted all subtitles by ${delta > 0 ? '+' : ''}${delta}ms`, 'success');
  };

  const handleFixOverlaps = () => {
    const fixed = fixOverlaps(subtitles);
    updateActiveProject(prev => ({ ...prev, subtitles: fixed }));
    addNotification('Resolved all overlapping timestamps', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Subtitles className="w-5 h-5 text-indigo-400" />
            <span>Professional Subtitle &amp; SRT Editor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Millisecond timing control, Khmer Unicode typography, reading speed checks, and overlap auto-fixing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-md cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import SRT</span>
            <input type="file" accept=".srt" onChange={handleImportSrt} className="hidden" />
          </label>

          <button
            onClick={handleExportSrt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-md"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export SRT</span>
          </button>

          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border ${
              showStylePanel
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'text-slate-300 bg-slate-900 border-slate-700 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Burn-In Styling</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player on Top / Left, Subtitle List Below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Preview & Quick Tools */}
        <div className="lg:col-span-5 space-y-4">
          <VideoCanvasPlayer />

          {/* Shift & Timing Tools Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800/80 pb-2">
              Timing Correction &amp; Alignment
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Shift Offset:</span>
              <input
                type="number"
                step={100}
                value={shiftOffsetMs}
                onChange={e => setShiftOffsetMs(parseInt(e.target.value) || 0)}
                className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
              />
              <span className="text-xs text-slate-500 font-mono">ms</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleShiftTimestamps(-1)}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono border border-slate-700"
              >
                - Shift Earlier ({shiftOffsetMs}ms)
              </button>
              <button
                onClick={() => handleShiftTimestamps(1)}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono border border-slate-700"
              >
                + Shift Later ({shiftOffsetMs}ms)
              </button>
            </div>

            <button
              onClick={handleFixOverlaps}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded text-xs font-semibold transition-colors mt-2"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Auto-Fix Overlapping Subtitles</span>
            </button>
          </div>

          {/* Burn-in Style Configuration Drawer */}
          {showStylePanel && (
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-lg p-4 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
                Burn-in Visual Styling
              </span>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">FONT FAMILY</label>
                <select
                  value={khmerFont}
                  onChange={e => {
                    setKhmerFont(e.target.value);
                    updateActiveProject(prev => ({
                      ...prev,
                      burnInConfig: { ...prev.burnInConfig, fontFamily: e.target.value },
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="Noto Sans Khmer">Noto Sans Khmer (Recommended for Khmer)</option>
                  <option value="Kantumruy Pro">Kantumruy Pro (Modern Khmer)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Latin / Modern)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">FONT SIZE (PX)</label>
                  <input
                    type="number"
                    value={activeProject.burnInConfig.fontSize}
                    onChange={e => {
                      const sz = parseInt(e.target.value) || 28;
                      updateActiveProject(prev => ({
                        ...prev,
                        burnInConfig: { ...prev.burnInConfig, fontSize: sz },
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">OUTLINE WIDTH</label>
                  <input
                    type="number"
                    value={activeProject.burnInConfig.outlineWidth}
                    onChange={e => {
                      const w = parseInt(e.target.value) || 2;
                      updateActiveProject(prev => ({
                        ...prev,
                        burnInConfig: { ...prev.burnInConfig, outlineWidth: w },
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">FONT COLOR</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeProject.burnInConfig.fontColor}
                      onChange={e => {
                        updateActiveProject(prev => ({
                          ...prev,
                          burnInConfig: { ...prev.burnInConfig, fontColor: e.target.value },
                        }));
                      }}
                      className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-300">{activeProject.burnInConfig.fontColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">ALIGNMENT</label>
                  <select
                    value={activeProject.burnInConfig.alignment}
                    onChange={e => {
                      updateActiveProject(prev => ({
                        ...prev,
                        burnInConfig: { ...prev.burnInConfig, alignment: e.target.value as any },
                      }));
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
                  >
                    <option value="bottom">Bottom Margin</option>
                    <option value="middle">Middle / Centered</option>
                    <option value="top">Top Margin</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Editable Subtitle Block List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Search subtitle text..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />

            <button
              onClick={handleAddSubtitle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subtitle</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {filteredSubs.map((sub, idx) => {
              const duration = Math.max(0.1, sub.endSeconds - sub.startSeconds);
              const cps = (sub.text.length / duration).toFixed(1);

              return (
                <div
                  key={sub.id}
                  className={`p-3.5 rounded-lg border space-y-2 transition-all ${
                    sub.isOverlapping
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : sub.cpsAlert
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold">#{idx + 1}</span>
                      <input
                        type="text"
                        value={sub.startTime}
                        onChange={e => handleUpdateSub(sub.id, sub.text, e.target.value, sub.endTime, sub.speaker)}
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-center"
                      />
                      <span className="text-slate-600">→</span>
                      <input
                        type="text"
                        value={sub.endTime}
                        onChange={e => handleUpdateSub(sub.id, sub.text, sub.startTime, e.target.value, sub.speaker)}
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200 text-center"
                      />
                      <button
                        onClick={() => setVideoCurrentTime(sub.startSeconds)}
                        className="p-1 text-indigo-400 hover:text-indigo-300"
                        title="Seek player to start"
                      >
                        <Clock className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{duration.toFixed(1)}s ({cps} cps)</span>
                      {sub.isOverlapping && (
                        <span className="text-[10px] text-rose-400 flex items-center gap-0.5" title="Overlaps with adjacent entry">
                          <AlertTriangle className="w-3 h-3" /> Overlap
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteSub(sub.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={sub.text}
                    style={{ fontFamily: khmerFont }}
                    onChange={e => handleUpdateSub(sub.id, e.target.value, sub.startTime, sub.endTime, sub.speaker)}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded p-2 text-xs text-white leading-relaxed focus:outline-none focus:border-indigo-500"
                  />
                </div>
              );
            })}

            {filteredSubs.length === 0 && (
              <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-lg">
                <p className="text-xs text-slate-500">No subtitles found. Click "Add Subtitle" or "Import SRT".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
