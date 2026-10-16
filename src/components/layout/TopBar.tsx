import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { downloadCSharpSolutionZip } from '../../services/csharpSourceFiles';
import { 
  FolderPlus, 
  Download, 
  Sun, 
  Moon, 
  Code2, 
  Sparkles,
  Layers
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const { 
    activeProject, 
    activePage, 
    theme, 
    setTheme, 
    createProject, 
    jobQueue,
    setActivePage 
  } = useStudio();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSrcLang, setNewSrcLang] = useState('km');
  const [newTgtLang, setNewTgtLang] = useState('en');

  const runningJobsCount = jobQueue.filter(j => j.status === 'running').length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createProject(newName, newDesc, newSrcLang, newTgtLang);
    setNewName('');
    setNewDesc('');
    setShowNewModal(false);
    setActivePage('video-editor');
  };

  const getPageTitle = (page: string) => {
    return page.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <>
      <header className="h-13 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-5 flex items-center justify-between gap-8 select-none z-30 shrink-0">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
            STORYFORGE STUDIO
          </span>
          <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 font-mono bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
            v2.4 LTS · .NET 8 WPF
          </span>
        </div>

        {/* Zone 2: Project & Module Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 max-w-md truncate">
          <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="text-slate-200 font-medium truncate">{activeProject?.name || 'Untitled'}</span>
          <span className="text-slate-600">/</span>
          <span className="text-indigo-300 font-medium whitespace-nowrap">{getPageTitle(activePage)}</span>
          {runningJobsCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              {runningJobsCount} Active Job{runningJobsCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* C# Solution ZIP Downloader */}
          <button
            onClick={() => downloadCSharpSolutionZip()}
            title="Download complete C# .NET 8 WPF Desktop solution source code (ZIP)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">.NET 8 WPF Solution</span>
          </button>

          {/* New Project Button */}
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-md transition-colors whitespace-nowrap"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">New Project</span>
          </button>

          {/* Quick Export Button */}
          <button
            onClick={() => setActivePage('export-center')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 rounded-md transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Hub</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-md transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create StoryForge Project</h3>
            <p className="text-xs text-slate-400 mb-4">Initialize a project with multilingual video editing, transcript sync, and Khmer speech workflows.</p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khmer Folk Story Episode 1"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief story outline or production notes..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Source Language</label>
                  <select
                    value={newSrcLang}
                    onChange={e => setNewSrcLang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="km">Khmer (ភាសាខ្មែរ)</option>
                    <option value="en">English</option>
                    <option value="zh">Chinese (中文)</option>
                    <option value="th">Thai (ไทย)</option>
                    <option value="vi">Vietnamese (Tiếng Việt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Language</label>
                  <select
                    value={newTgtLang}
                    onChange={e => setNewTgtLang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="en">English</option>
                    <option value="km">Khmer (ភាសាខ្មែរ)</option>
                    <option value="zh">Chinese (中文)</option>
                    <option value="fr">French (Français)</option>
                    <option value="es">Spanish (Español)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
