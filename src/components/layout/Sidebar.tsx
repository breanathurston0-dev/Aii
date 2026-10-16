import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { PageId } from '../../types/studio';
import {
  LayoutDashboard,
  FolderKanban,
  Film,
  Subtitles,
  FileText,
  Volume2,
  Mic2,
  Fingerprint,
  Sliders,
  Wand2,
  BookOpen,
  Languages,
  DownloadCloud,
  ListOrdered,
  Cpu,
  History,
  Settings,
  Terminal,
} from 'lucide-react';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage, jobQueue, snapshots } = useStudio();

  const runningCount = jobQueue.filter(j => j.status === 'running').length;

  const sections: NavSection[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
      ],
    },
    {
      title: 'VIDEO & SUBTITLES',
      items: [
        { id: 'video-editor', label: 'Video Editor', icon: Film },
        { id: 'subtitle-editor', label: 'Subtitle/SRT Editor', icon: Subtitles },
        { id: 'transcript-editor', label: 'Transcript Editor', icon: FileText },
      ],
    },
    {
      title: 'AI AUDIO & SPEECH',
      items: [
        { id: 'tts-studio', label: 'Text-to-Speech (Khmer)', icon: Volume2, badge: 'Khmer' },
        { id: 'voice-studio', label: 'Voice Studio', icon: Mic2 },
        { id: 'voice-cloning', label: 'Voice Cloning', icon: Fingerprint, badge: 'Consent' },
        { id: 'vocal-remover', label: 'Vocal Remover (Demucs)', icon: Sliders },
        { id: 'audio-tools', label: 'Audio Tools', icon: Wand2 },
      ],
    },
    {
      title: 'AI STORY & TRANSLATION',
      items: [
        { id: 'story-summarizer', label: 'Story Summarizer', icon: BookOpen },
        { id: 'translation-studio', label: 'Translation Studio', icon: Languages, badge: 'Multi' },
      ],
    },
    {
      title: 'OUTPUT & SYSTEM',
      items: [
        { id: 'export-center', label: 'Export Center', icon: DownloadCloud },
        { id: 'processing-queue', label: 'Processing Queue', icon: ListOrdered, badge: runningCount > 0 ? String(runningCount) : undefined },
        { id: 'provider-settings', label: 'AI Provider Settings', icon: Cpu },
        { id: 'history', label: 'Version History', icon: History, badge: snapshots.length > 0 ? `${snapshots.length}v` : undefined },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'logs-diagnostics', label: 'Logs & Diagnostics', icon: Terminal },
      ],
    },
  ];

  return (
    <aside className="w-60 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 select-none overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {sections.map(sec => (
          <div key={sec.title}>
            <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 font-mono">
              {sec.title}
            </div>
            <div className="space-y-0.5 mt-0.5">
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                          item.id === 'processing-queue' && runningCount > 0
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
