import React, { useState, useRef, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Undo2, 
  Redo2, 
  History, 
  ChevronDown, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  Layers,
  Subtitles,
  FileText,
  Film,
  Sparkles,
  Volume2,
  Calendar,
  MessageSquare,
  Sliders
} from 'lucide-react';
import { UndoActionCategory, UndoHistoryEntry } from '../../types/studio';

interface UndoRedoControlsProps {
  variant?: 'compact' | 'full' | 'inline';
  showDropdown?: boolean;
}

export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({ 
  variant = 'compact',
  showDropdown = true 
}) => {
  const { 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    undoStack, 
    redoStack, 
    lastUndoAction, 
    lastRedoAction,
    jumpToHistoryState,
    clearUndoHistory,
    activeProject
  } = useStudio();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getCategoryIcon = (category: UndoActionCategory) => {
    switch (category) {
      case 'subtitles':
        return <Subtitles className="w-3 h-3 text-indigo-400" />;
      case 'transcript':
        return <FileText className="w-3 h-3 text-blue-400" />;
      case 'media':
        return <Film className="w-3 h-3 text-emerald-400" />;
      case 'burnin':
        return <Sparkles className="w-3 h-3 text-amber-400" />;
      case 'audio':
        return <Volume2 className="w-3 h-3 text-teal-400" />;
      case 'milestones':
        return <Calendar className="w-3 h-3 text-purple-400" />;
      case 'comments':
        return <MessageSquare className="w-3 h-3 text-rose-400" />;
      default:
        return <Layers className="w-3 h-3 text-slate-400" />;
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

  const formatRelativeTime = (timestamp: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
      if (diffSec < 5) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  // Stack view reversed for display (latest first)
  const displayUndoStack = [...undoStack].reverse();
  const displayRedoStack = [...redoStack].reverse();
  const totalEdits = undoStack.length + redoStack.length;

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Undo / Redo Button Group */}
      <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 shadow-sm">
        {/* Undo Button */}
        <button
          onClick={undo}
          disabled={!canUndo}
          title={canUndo ? `Undo: ${lastUndoAction || 'Last edit'} (Ctrl+Z)` : 'Nothing to undo'}
          className={`group flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            canUndo
              ? 'text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
              : 'text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          {variant !== 'inline' && (
            <span className="hidden lg:inline text-[11px]">Undo</span>
          )}
          {canUndo && (
            <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {undoStack.length}
            </span>
          )}
        </button>

        <span className="w-px h-3.5 bg-slate-800 mx-0.5" />

        {/* Redo Button */}
        <button
          onClick={redo}
          disabled={!canRedo}
          title={canRedo ? `Redo: ${lastRedoAction || 'Next edit'} (Ctrl+Y / Ctrl+Shift+Z)` : 'Nothing to redo'}
          className={`group flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
            canRedo
              ? 'text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
              : 'text-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          <Redo2 className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          {variant !== 'inline' && (
            <span className="hidden lg:inline text-[11px]">Redo</span>
          )}
          {canRedo && (
            <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {redoStack.length}
            </span>
          )}
        </button>

        {/* History Inspector Flyout Toggle */}
        {showDropdown && (
          <>
            <span className="w-px h-3.5 bg-slate-800 mx-0.5" />
            <button
              onClick={() => setIsOpen(!isOpen)}
              title="View Edit History Stack & Time Travel"
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                isOpen 
                  ? 'bg-indigo-600/30 text-indigo-300' 
                  : totalEdits > 0 
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                    : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <History className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Dropdown Flyout Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 md:w-96 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-3 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-bold text-white block">Edit History & Time Travel</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {undoStack.length} undo step{undoStack.length === 1 ? '' : 's'} · {redoStack.length} redo step{redoStack.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {totalEdits > 0 && (
              <button
                onClick={() => {
                  clearUndoHistory();
                  setIsOpen(false);
                }}
                className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear undo/redo history for active project"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Current Live State Pin */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-2 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <div>
                <span className="font-semibold text-indigo-200 block text-[11px]">Current Working State</span>
                <span className="text-[10px] text-indigo-300/70 truncate max-w-[200px] block">
                  {activeProject.name}
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Active Head
            </span>
          </div>

          {/* Stacks Container */}
          <div className="max-h-72 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {/* Redo Stack Section (future states if undone) */}
            {redoStack.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1 uppercase tracking-wider px-1">
                  <span>Redo Available ({redoStack.length})</span>
                  <span>(Ctrl+Y)</span>
                </div>
                <div className="space-y-1">
                  {displayRedoStack.map((entry, idx) => {
                    const originalIndex = redoStack.length - 1 - idx;
                    return (
                      <div
                        key={entry.id}
                        className="group flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all text-slate-300"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Redo2 className="w-3 h-3 text-emerald-400 shrink-0 opacity-70 group-hover:opacity-100" />
                          <div className="truncate">
                            <span className="font-medium text-slate-200 block truncate group-hover:text-emerald-300">
                              {entry.actionDescription}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                              <span className={`px-1 py-0.2 rounded border text-[8px] uppercase ${getCategoryBadgeClass(entry.category)}`}>
                                {entry.category}
                              </span>
                              <span>·</span>
                              <span>{formatRelativeTime(entry.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            jumpToHistoryState(originalIndex, 'redo');
                            setIsOpen(false);
                          }}
                          className="shrink-0 ml-2 px-2 py-0.5 text-[10px] bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded transition-colors cursor-pointer"
                        >
                          Redo to here
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Undo Stack Section (previous states) */}
            {undoStack.length > 0 ? (
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1 uppercase tracking-wider px-1">
                  <span>Undoable Actions ({undoStack.length})</span>
                  <span>(Ctrl+Z)</span>
                </div>
                <div className="space-y-1">
                  {displayUndoStack.map((entry, idx) => {
                    const originalIndex = undoStack.length - 1 - idx;
                    return (
                      <div
                        key={entry.id}
                        className="group flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all text-slate-300"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="shrink-0 p-1 rounded bg-slate-900 border border-slate-800">
                            {getCategoryIcon(entry.category)}
                          </div>
                          <div className="truncate">
                            <span className="font-medium text-slate-200 block truncate group-hover:text-indigo-300">
                              {entry.actionDescription}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                              <span className={`px-1 py-0.2 rounded border text-[8px] uppercase ${getCategoryBadgeClass(entry.category)}`}>
                                {entry.category}
                              </span>
                              <span>·</span>
                              <span>{formatRelativeTime(entry.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            jumpToHistoryState(originalIndex, 'undo');
                            setIsOpen(false);
                          }}
                          className="shrink-0 ml-2 px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded border border-slate-700 hover:border-indigo-500 transition-colors cursor-pointer"
                          title="Rollback project to this exact state"
                        >
                          Revert to this
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 italic">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-slate-600 opacity-60" />
                <span>No prior modifications in this session.</span>
                <span className="block text-[10px] text-slate-600 font-mono mt-0.5">
                  Edits across subtitle, transcript, and media tools are tracked automatically.
                </span>
              </div>
            )}
          </div>

          {/* Footer Shortcuts hint */}
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Shortcut: <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-slate-300">Ctrl+Z</kbd> / <kbd className="bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-slate-300">Ctrl+Y</kbd></span>
            <span>Max Depth: 50 states</span>
          </div>
        </div>
      )}
    </div>
  );
};
