import React from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';

// Views
import { DashboardView } from './components/views/DashboardView';
import { ProjectsView } from './components/views/ProjectsView';
import { VideoEditorView } from './components/views/VideoEditorView';
import { StorySummarizerView } from './components/views/StorySummarizerView';
import { TranscriptEditorView } from './components/views/TranscriptEditorView';
import { SubtitleEditorView } from './components/views/SubtitleEditorView';
import { TranslationStudioView } from './components/views/TranslationStudioView';
import { TextToSpeechView } from './components/views/TextToSpeechView';
import { VoiceStudioView } from './components/views/VoiceStudioView';
import { VoiceCloningView } from './components/views/VoiceCloningView';
import { VocalRemoverView } from './components/views/VocalRemoverView';
import { AudioToolsView } from './components/views/AudioToolsView';
import { AiProviderSettingsView } from './components/views/AiProviderSettingsView';
import { ExportCenterView } from './components/views/ExportCenterView';
import { ProcessingQueueView } from './components/views/ProcessingQueueView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { LogsDiagnosticsView } from './components/views/LogsDiagnosticsView';

const StudioMain: React.FC = () => {
  const { activePage, theme, notifications, dismissNotification } = useStudio();

  const renderActiveView = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardView />;
      case 'projects':
        return <ProjectsView />;
      case 'video-editor':
        return <VideoEditorView />;
      case 'story-summarizer':
        return <StorySummarizerView />;
      case 'transcript-editor':
        return <TranscriptEditorView />;
      case 'subtitle-editor':
        return <SubtitleEditorView />;
      case 'translation-studio':
        return <TranslationStudioView />;
      case 'tts-studio':
        return <TextToSpeechView />;
      case 'voice-studio':
        return <VoiceStudioView />;
      case 'voice-cloning':
        return <VoiceCloningView />;
      case 'vocal-remover':
        return <VocalRemoverView />;
      case 'audio-tools':
        return <AudioToolsView />;
      case 'provider-settings':
        return <AiProviderSettingsView />;
      case 'export-center':
        return <ExportCenterView />;
      case 'processing-queue':
        return <ProcessingQueueView />;
      case 'history':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      case 'logs-diagnostics':
        return <LogsDiagnosticsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <TopBar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/30">
          {renderActiveView()}
        </main>
      </div>

      <StatusBar />

      {/* Floating Notifications Toaster */}
      <div className="fixed bottom-10 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => dismissNotification(n.id)}
            className={`pointer-events-auto p-3 rounded-lg border shadow-xl text-xs flex items-center justify-between gap-3 transition-all ${
              n.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                : n.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                : n.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/40'
                : 'bg-slate-900/90 text-slate-200 border-slate-700'
            }`}
          >
            <span>{n.message}</span>
            <button className="text-[10px] opacity-70 hover:opacity-100 ml-2">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StudioProvider>
      <StudioMain />
    </StudioProvider>
  );
}
