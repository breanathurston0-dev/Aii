import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Settings, 
  Moon, 
  Sun, 
  Type, 
  Cpu, 
  Trash2, 
  ShieldCheck, 
  Folder,
  HardDrive
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    theme, 
    setTheme, 
    khmerFont, 
    setKhmerFont, 
    lowResourceMode, 
    setLowResourceMode,
    autoSaveEnabled,
    setAutoSaveEnabled,
    addNotification 
  } = useStudio();

  const handleClearCache = () => {
    localStorage.removeItem('storyforge_cache');
    addNotification('Temporary audio waveforms & render cache cleared', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Studio Settings &amp; Preferences</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure UI themes, Khmer Unicode font fallback, low-resource hardware modes, and privacy.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="max-w-3xl space-y-5">
        {/* Appearance & Theme */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
            Interface Appearance &amp; Typography
          </span>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Color Theme</div>
              <div className="text-[11px] text-slate-400">Choose between dark slate workstation or high-contrast light mode</div>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${
                  theme === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3 h-3" /> Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${
                  theme === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-3 h-3" /> Light
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Primary Khmer Unicode Font</div>
              <div className="text-[11px] text-slate-400">Applies to subtitles, transcripts, and video overlays</div>
            </div>
            <select
              value={khmerFont}
              onChange={e => {
                setKhmerFont(e.target.value);
                addNotification(`Selected ${e.target.value} as default font`, 'info');
              }}
              className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
            >
              <option value="Noto Sans Khmer">Noto Sans Khmer</option>
              <option value="Kantumruy Pro">Kantumruy Pro</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
            </select>
          </div>
        </div>

        {/* Performance & Low Resource Mode */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
            Performance &amp; Hardware Mode
          </span>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Low-Resource Mode (CPU Execution)</div>
              <div className="text-[11px] text-slate-400">Limits concurrent background workers and prioritizes smaller Whisper/Demucs models</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={lowResourceMode}
                onChange={e => setLowResourceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Automatic Project Autosave</div>
              <div className="text-[11px] text-slate-400">Saves project state every 60 seconds into SQLite storage</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={e => setAutoSaveEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>

        {/* Temporary Storage & Cache Cleanup */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
            Storage &amp; Temporary Files
          </span>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">Clear Render Cache &amp; Waveforms</div>
              <div className="text-[11px] text-slate-400">Removes cached audio peaks and temporary FFmpeg render chunks</div>
            </div>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
