import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Undo2, 
  Redo2, 
  RotateCcw, 
  Layers, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  ChevronRight, 
  Subtitles, 
  FileText, 
  Film, 
  Sparkles, 
  Volume2, 
  Calendar, 
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Eye,
  Sliders,
  Keyboard
} from 'lucide-react';
import { UndoActionCategory, UndoHistoryEntry } from '../../types/studio';

export const ActiveUndoHistoryTab: React.FC = () => {
  const { 
    activeProject, 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    undoStack, 
    redoStack, 
    lastUndoAction, 
    lastRedoAction,
    jumpToHistoryState,
    clearUndoHistory 
  } = useStudio();

  const [inspectingEntry, setInspectingEntry] = useState<UndoHistoryEntry | null>(null);

  const getCategoryIcon = (category: UndoActionCategory) => {
    switch (category) {
      case 'subtitles':
        return <Subtitles className="w-3.5 h-3.5 text-indigo-400" />;
      case 'transcript':
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'media':
        return <Film className="w-3.5 h-3.5 text-emerald-400" />;
      case 'burnin':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case 'audio':
        return <Volume2 className="w-3.5 h-3.5 text-teal-400" />;
      case 'milestones':
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      case 'comments':
        return <MessageSquare className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: UndoActionCategory) => {
    switch (category) {
      case 'subtitles':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'transcript':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      case 'media':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'burnin':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'audio':
        return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
      case 'milestones':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'comments':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  const totalStates = undoStack.length + redoStack.length;

  return (
    <div className="space-y-6">
      {/* Control Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className="text-base font-bold text-white">Central Studio Undo/Redo Engine</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live State Tracking
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Active project: <span className="text-slate-200 font-semibold">{activeProject.name}</span> · Tracks every edit across subtitles, transcripts, media clips, and typography styles.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Undo Button */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                canUndo
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-indigo-500 cursor-pointer shadow-sm'
                  : 'bg-slate-950 text-slate-600 border-slate-800/80 cursor-not-allowed opacity-60'
              }`}
            >
              <Undo2 className="w-4 h-4 text-indigo-400" />
              <span>Undo ({undoStack.length})</span>
            </button>

            {/* Redo Button */}
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                canRedo
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-emerald-500 cursor-pointer shadow-sm'
                  : 'bg-slate-950 text-slate-600 border-slate-800/80 cursor-not-allowed opacity-60'
              }`}
            >
              <Redo2 className="w-4 h-4 text-emerald-400" />
              <span>Redo ({redoStack.length})</span>
            </button>

            {/* Clear Button */}
            {totalStates > 0 && (
              <button
                onClick={clearUndoHistory}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 border border-slate-800 transition-colors cursor-pointer"
                title="Clear edit history for active project"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Stack</span>
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Undo Depth</span>
            <span className="text-sm font-bold text-indigo-400 font-mono">{undoStack.length} / 50</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Redo Available</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{redoStack.length}</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Last Undo Action</span>
            <span className="text-xs font-medium text-slate-300 truncate block">
              {lastUndoAction || 'None'}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase block">Hotkeys</span>
            <span className="text-xs font-mono text-slate-400">Ctrl+Z / Ctrl+Y</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Timeline List + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Time Travel Timeline List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Chrono State Log (Latest to Earliest)</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              Click "Revert to this" to rollback to any step
            </span>
          </div>

          {/* Current Working Head */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">Current Head State</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Live
                  </span>
                </div>
                <span className="text-[11px] text-indigo-200/70 font-mono">
                  {activeProject.subtitles.length} subtitles · {activeProject.transcript.length} transcript lines · {activeProject.durationSeconds.toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          {/* Undo Stack Entries */}
          {undoStack.length > 0 ? (
            <div className="space-y-2">
              {[...undoStack].reverse().map((entry, idx) => {
                const originalIndex = undoStack.length - 1 - idx;
                const isInspecting = inspectingEntry?.id === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isInspecting
                        ? 'bg-slate-800/90 border-indigo-500/70 shadow-md shadow-indigo-950/30'
                        : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                          {getCategoryIcon(entry.category)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {entry.actionDescription}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded border text-[8px] uppercase font-mono ${getCategoryBadgeClass(entry.category)}`}>
                              {entry.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>Step #{originalIndex + 1}</span>
                            <span>·</span>
                            <span>{formatTimestamp(entry.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setInspectingEntry(isInspecting ? null : entry)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Inspect snapshot payload"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => jumpToHistoryState(originalIndex, 'undo')}
                          className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500 rounded-md transition-colors cursor-pointer"
                          title="Rollback to this point in time"
                        >
                          Revert
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 bg-slate-900/50 border border-slate-800/60 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No actions to undo</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Any modifications made in the Subtitle Editor, Video Timeline, or Transcript view will be registered here.
              </p>
            </div>
          )}
        </div>

        {/* Right: Redo Stack & Snapshot Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Redo Stack Card */}
          {redoStack.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Redo2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Redo Branch ({redoStack.length})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Ctrl+Y</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {[...redoStack].reverse().map((entry, idx) => {
                  const originalIndex = redoStack.length - 1 - idx;
                  return (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-slate-200 block truncate">
                          {entry.actionDescription}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <button
                        onClick={() => jumpToHistoryState(originalIndex, 'redo')}
                        className="px-2 py-0.5 text-[11px] font-medium bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded border border-emerald-500/30 transition-colors cursor-pointer shrink-0"
                      >
                        Redo
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Snapshot Data Inspector */}
          {inspectingEntry ? (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white font-mono">Snapshot Payload</span>
                </div>
                <button
                  onClick={() => setInspectingEntry(null)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Action:</span>
                  <span className="text-slate-200 font-semibold">{inspectingEntry.actionDescription}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-indigo-400 uppercase font-mono">{inspectingEntry.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Subtitles Count:</span>
                  <span className="text-slate-200 font-mono">{inspectingEntry.snapshot.subtitles.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Transcript Segments:</span>
                  <span className="text-slate-200 font-mono">{inspectingEntry.snapshot.transcript.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Timeline Duration:</span>
                  <span className="text-slate-200 font-mono">{inspectingEntry.snapshot.durationSeconds.toFixed(1)}s</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const idx = undoStack.findIndex(e => e.id === inspectingEntry.id);
                    if (idx !== -1) {
                      jumpToHistoryState(idx, 'undo');
                      setInspectingEntry(null);
                    }
                  }}
                  className="w-full py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
                >
                  Rollback to this state now
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono border-b border-slate-800/80 pb-2">
                <Keyboard className="w-4 h-4 text-indigo-400" />
                <span>Keyboard Shortcuts &amp; Ergonomics</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center justify-between">
                  <span>Undo last change:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px]">
                    Ctrl + Z
                  </kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>Redo last undone change:</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-[11px]">
                    Ctrl + Y / Ctrl + Shift + Z
                  </kbd>
                </li>
                <li className="flex items-center justify-between">
                  <span>Typing Debounce:</span>
                  <span className="text-slate-400 font-mono text-[11px]">1000ms coalescing</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Scope:</span>
                  <span className="text-indigo-400 font-mono text-[11px]">Per-Project Isolation</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
