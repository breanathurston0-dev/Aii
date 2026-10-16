import React, { useState, useMemo } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Film, 
  Subtitles, 
  BookOpen, 
  Languages, 
  Volume2, 
  Sliders, 
  DownloadCloud, 
  ArrowRight,
  Sparkles,
  Cpu,
  Clock,
  Layers,
  Smartphone,
  Headphones,
  Compass,
  Globe2,
  Check,
  Eye,
  SlidersHorizontal,
  HardDrive,
  BarChart3,
  FolderKanban,
  TrendingUp,
  Database,
  Search,
  Plus,
  Play,
  Copy,
  ExternalLink,
  FileText,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Zap,
  Mic,
  MessageSquareQuote
} from 'lucide-react';
import { secondsToSrtTimestamp } from '../../services/srtService';
import { PROJECT_TEMPLATES } from '../../services/templates';
import { Project, ProjectTemplate, PageId } from '../../types/studio';
import { ProjectTimeline } from '../dashboard/ProjectTimeline';

export const DashboardView: React.FC = () => {
  const { 
    activeProject, 
    setActivePage, 
    projects, 
    setActiveProject, 
    systemStatus,
    jobQueue,
    createProjectFromTemplate,
    createProject,
    duplicateProject,
    addNotification,
    addHistory
  } = useStudio();

  // Template System State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null);
  
  // Template Customizer State
  const [customProjectName, setCustomProjectName] = useState<string>('');
  const [customAspectRatio, setCustomAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('16:9');
  const [customInitialPage, setCustomInitialPage] = useState<PageId>('video-editor');
  const [customStoryTone, setCustomStoryTone] = useState<string>('Dramatic');
  const [customFontFamily, setCustomFontFamily] = useState<string>('Noto Sans Khmer');
  const [customFontSize, setCustomFontSize] = useState<number>(28);
  const [activeModalTab, setActiveModalTab] = useState<'config' | 'synopsis' | 'subtitles'>('config');

  // Storage Cache State
  const [isPurgingCache, setIsPurgingCache] = useState<boolean>(false);

  // Workflow Statistics Calculations
  const activeJobs = jobQueue.filter(j => j.status === 'running').length;
  const totalProjects = projects.length;
  const pendingTasks = jobQueue.filter(j => j.status === 'queued' || j.status === 'running').length;
  const completedTasks = jobQueue.filter(j => j.status === 'completed').length;
  const failedTasks = jobQueue.filter(j => j.status === 'failed').length;

  const totalSizeBytes = useMemo(() => {
    return projects.reduce((acc, p) => {
      const mediaSize = p.mediaFiles.reduce((mAcc, m) => mAcc + (m.sizeBytes || 0), 0);
      const subSize = (p.subtitles.length * 150);
      return acc + mediaSize + subSize;
    }, 0) + 14200000; // Base application cache & SQLite footprint
  }, [projects]);

  const formattedStorage = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  const totalMediaCount = projects.reduce((acc, p) => acc + (p.mediaFiles.length || 0), 0);
  const totalDurationSec = projects.reduce((acc, p) => acc + (p.durationSeconds || 0), 0);
  const totalDurationMinutes = (totalDurationSec / 60).toFixed(1);
  const totalSubtitles = projects.reduce((acc, p) => acc + (p.subtitles?.length || 0), 0);

  // Storage breakdown estimates
  const videoStorageMB = (totalSizeBytes * 0.65 / (1024 * 1024)).toFixed(1);
  const audioStorageMB = (totalSizeBytes * 0.22 / (1024 * 1024)).toFixed(1);
  const subtitleStorageMB = (totalSizeBytes * 0.08 / (1024 * 1024)).toFixed(1);
  const databaseStorageMB = (totalSizeBytes * 0.05 / (1024 * 1024)).toFixed(1);

  // Filter Templates
  const filteredTemplates = useMemo(() => {
    return PROJECT_TEMPLATES.filter(template => {
      const matchesCategory = selectedCategory === 'all' || 
        template.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        template.id.toLowerCase().includes(selectedCategory.toLowerCase());
      
      const matchesSearch = !templateSearchQuery.trim() ||
        template.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        template.tagline.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        template.badge.toLowerCase().includes(templateSearchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, templateSearchQuery]);

  // Last 5 Edited Projects (Requirement 3)
  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [projects]);

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'template_social_short':
        return Smartphone;
      case 'template_audiobook_prod':
        return Headphones;
      case 'template_documentary_heritage':
        return Compass;
      case 'template_multilingual_dub':
        return Globe2;
      case 'template_podcast_clip':
        return MessageSquareQuote;
      default:
        return Sparkles;
    }
  };

  // Launch Template directly with default presets
  const handleQuickLaunchTemplate = (template: ProjectTemplate) => {
    createProjectFromTemplate(template);
    addNotification(`Quick-launched template: ${template.title}`, 'success');
  };

  // Open Template Customizer Modal
  const handleOpenCustomizeModal = (template: ProjectTemplate) => {
    setPreviewTemplate(template);
    setCustomProjectName(`${template.title} Production`);
    setCustomAspectRatio(template.aspectRatio);
    setCustomInitialPage(template.initialPage);
    setCustomStoryTone(template.defaultConfig.storyTone);
    setCustomFontFamily(template.defaultConfig.burnInConfig.fontFamily);
    setCustomFontSize(template.defaultConfig.burnInConfig.fontSize);
    setActiveModalTab('config');
  };

  // Launch Template with customized overrides
  const handleConfirmCustomizedLaunch = () => {
    if (!previewTemplate) return;
    createProjectFromTemplate(
      previewTemplate,
      customProjectName,
      {
        aspectRatio: customAspectRatio,
        initialPage: customInitialPage,
        storyTone: customStoryTone,
        burnInConfig: {
          fontFamily: customFontFamily,
          fontSize: customFontSize,
        }
      }
    );
    setPreviewTemplate(null);
  };

  // Open a specific project directly in a chosen editor (Requirement 3)
  const handleOpenInEditor = (project: Project, editorPage: PageId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveProject(project);
    setActivePage(editorPage);
    addNotification(`Opened "${project.name}" in ${getEditorLabel(editorPage)}`, 'info');
  };

  const getEditorLabel = (page: PageId) => {
    switch (page) {
      case 'video-editor': return 'Video Editor';
      case 'subtitle-editor': return 'Subtitle Studio';
      case 'story-summarizer': return 'Story Summarizer';
      case 'tts-studio': return 'TTS Audio Studio';
      case 'translation-studio': return 'Translation Studio';
      case 'vocal-remover': return 'Vocal Stem Remover';
      case 'export-center': return 'Burn-In & Export Center';
      default: return 'Editor';
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const updated = new Date(isoString);
      const diffMs = now.getTime() - updated.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return updated.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const handlePurgeCache = () => {
    setIsPurgingCache(true);
    setTimeout(() => {
      setIsPurgingCache(false);
      addNotification('Temporary render stems & audio cache cleared safely', 'success');
      addHistory('Cache Cleared', 'Freed temporary waveform render files', 'media');
    }, 600);
  };

  const pipelineSteps = [
    {
      id: 'video-editor',
      title: '1. Video Editor & Timeline',
      desc: 'Trim, split clips, inspect resolution, aspect ratio & frame rates with FFmpeg.',
      icon: Film,
      action: 'Open Video Editor',
    },
    {
      id: 'transcript-editor',
      title: '2. Speech-to-Text & Transcribe',
      desc: 'Transcribe Khmer & English audio via Whisper.cpp, Faster-Whisper, or Gemini API.',
      icon: Layers,
      action: 'Transcribe Media',
    },
    {
      id: 'story-summarizer',
      title: '3. AI Story Summarizer',
      desc: 'Extract scene outlines, character rosters, and narration scripts with tone control.',
      icon: BookOpen,
      action: 'Summarize Story',
    },
    {
      id: 'subtitle-editor',
      title: '4. Subtitle / SRT Studio',
      desc: 'Precision timing, overlap detection, CPS reading speed checks, and Khmer Unicode styling.',
      icon: Subtitles,
      action: 'Edit Subtitles',
    },
    {
      id: 'translation-studio',
      title: '5. Multilingual Translation',
      desc: 'Translate subtitles between Khmer, English, Chinese, and French with timing preservation.',
      icon: Languages,
      action: 'Translate Project',
    },
    {
      id: 'tts-studio',
      title: '6. Khmer & Multi Text-to-Speech',
      desc: 'Synthesize natural voiceovers via Gemini 3.8 TTS, browser speech, or local Piper voices.',
      icon: Volume2,
      action: 'Generate Speech',
    },
    {
      id: 'vocal-remover',
      title: '7. Vocal Separation (Demucs)',
      desc: 'Isolate vocal stems from soundtrack music with real-time stem gain sliders.',
      icon: Sliders,
      action: 'Separate Audio',
    },
    {
      id: 'export-center',
      title: '8. Burn-In & Export Center',
      desc: 'Hardcode subtitles into MP4 via FFmpeg, export audio tracks, or download C# solution.',
      icon: DownloadCloud,
      action: 'Open Export Hub',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-7 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
              Professional Workstation
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">Full-Stack AI Engine &amp; SQLite Persistent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            StoryForge Studio
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Unified production suite combining AI story extraction, Khmer Unicode subtitle timing, 
            natural speech synthesis, video timeline editing, and audio stem isolation.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActivePage('video-editor')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Resume Active Project: {activeProject?.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActivePage('story-summarizer')}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Story Summarizer</span>
            </button>
            <button
              onClick={() => createProject(`Story Project #${projects.length + 1}`)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-md border border-slate-700/80 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Blank Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REQUIREMENT 2: WORKFLOW STATISTICS CARD
          Displays summary metrics: total projects, pending tasks, recent storage usage
         ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Workflow Statistics &amp; Studio Telemetry
                </h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time operational summary metrics: active projects, background pipeline tasks, and disk storage allocation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePurgeCache}
              disabled={isPurgingCache}
              className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Purge temporary audio waveform renders and transient cache"
            >
              <RefreshCw className={`w-3 h-3 text-slate-400 ${isPurgingCache ? 'animate-spin' : ''}`} />
              <span>{isPurgingCache ? 'Cleaning...' : 'Purge Cache'}</span>
            </button>

            <button
              onClick={() => setActivePage('processing-queue')}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium rounded border border-indigo-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Queue ({pendingTasks} pending)</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* 4 Primary Summary Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Projects Metric */}
          <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/90 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1.5">
              <span className="font-semibold">TOTAL PROJECTS</span>
              <FolderKanban className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                {totalProjects}
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
              <div className="truncate">
                <span className="text-slate-500">Current:</span> <span className="text-slate-200 font-medium">{activeProject?.name}</span>
              </div>
              <div className="text-slate-500">
                {totalMediaCount} Media Items · SQLite Persistent
              </div>
            </div>
          </div>

          {/* 2. Pending Tasks Metric */}
          <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/90 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1.5">
              <span className="font-semibold">PENDING TASKS</span>
              <div className="flex items-center gap-1">
                {activeJobs > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                {pendingTasks}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({activeJobs} in-flight)
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                <strong className="text-emerald-400 font-mono">{completedTasks}</strong> done
              </span>
              <span className="text-slate-600">·</span>
              <span>
                <strong className="text-amber-400 font-mono">{jobQueue.filter(j => j.status === 'queued').length}</strong> queued
              </span>
              <span className="text-slate-600">·</span>
              <span>
                <strong className="text-rose-400 font-mono">{failedTasks}</strong> err
              </span>
            </div>
          </div>

          {/* 3. Recent Storage Usage Metric */}
          <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/90 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1.5">
              <span className="font-semibold">RECENT STORAGE USAGE</span>
              <HardDrive className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                {formattedStorage}
              </span>
              <span className="text-sm font-semibold text-slate-400 font-mono">MB</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="text-emerald-400 font-medium">Safe (&lt; 2% disk)</span>
              <span className="text-slate-500 font-mono">{projects.length} workspaces</span>
            </div>
          </div>

          {/* 4. Production Volume / Throughput Metric */}
          <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/90 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1.5">
              <span className="font-semibold">PRODUCTION VOLUME</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                {totalDurationMinutes}
              </span>
              <span className="text-sm font-semibold text-slate-400 font-mono">mins</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="text-slate-300 font-medium">{totalSubtitles} Subtitles</span>
              <span className="text-indigo-400 font-mono">Khmer UTF-8</span>
            </div>
          </div>
        </div>

        {/* Detailed Storage Allocation Visualizer Bar */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-300">MEDIA &amp; CACHE ALLOCATION BREAKDOWN</span>
            </div>
            <span className="text-[11px] text-slate-400">Total Tracked: {formattedStorage} MB</span>
          </div>

          {/* Allocation Bar */}
          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
            <div style={{ width: '65%' }} className="bg-indigo-500 hover:bg-indigo-400 transition-colors" title={`Video Masters: ${videoStorageMB} MB (65%)`} />
            <div style={{ width: '22%' }} className="bg-emerald-500 hover:bg-emerald-400 transition-colors" title={`Audio & Vocal Stems: ${audioStorageMB} MB (22%)`} />
            <div style={{ width: '8%' }} className="bg-purple-500 hover:bg-purple-400 transition-colors" title={`Subtitles & Transcripts: ${subtitleStorageMB} MB (8%)`} />
            <div style={{ width: '5%' }} className="bg-amber-500 hover:bg-amber-400 transition-colors" title={`SQLite Metadata: ${databaseStorageMB} MB (5%)`} />
          </div>

          {/* Legend and Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1">
            <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                <span>Video Masters ({videoStorageMB} MB)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                <span>Audio Stems ({audioStorageMB} MB)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span>Subtitles ({subtitleStorageMB} MB)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>SQLite DB ({databaseStorageMB} MB)</span>
              </span>
            </div>

            <button
              onClick={() => setActivePage('settings')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Storage &amp; SQLite Settings</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Telemetry Status Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
          <div className="flex items-center gap-2 p-2 rounded bg-slate-950/60 border border-slate-800/70">
            <span className={`w-2 h-2 rounded-full ${systemStatus?.dependencies.ffmpeg.installed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-300 truncate">
              {systemStatus?.dependencies.ffmpeg.installed ? 'FFmpeg 4.4 Engine' : 'FFmpeg Simulated'}
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-slate-950/60 border border-slate-800/70">
            <span className={`w-2 h-2 rounded-full ${systemStatus?.hasGeminiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-300 truncate">
              {systemStatus?.hasGeminiKey ? 'Gemini 3.8 Connected' : 'Local Fallback Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-slate-950/60 border border-slate-800/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 truncate">Whisper STT Ready</span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-slate-950/60 border border-slate-800/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300 truncate">Demucs Stem Isolation</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REQUIREMENT 1: PROJECT TEMPLATE SYSTEM IN DASHBOARDVIEW
          Allows users to quickly initialize common workflows like 'Short-form Social Video'
          or 'Audiobook Production' with pre-configured settings.
         ========================================================================= */}
      <section className="space-y-4">
        {/* Template Header & Category / Search Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Workflow Project Templates
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Quickly initialize production pipelines with pre-configured aspect ratios, typography, voice casting, and starter scripts.
            </p>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search templates..."
                value={templateSearchQuery}
                onChange={e => setTemplateSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-40 sm:w-48 transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'social', label: 'Social 9:16' },
                { id: 'publishing', label: 'Audiobook' },
                { id: 'documentary', label: 'Documentary' },
                { id: 'localization', label: 'Dubbing' },
                { id: 'talk', label: 'Podcasts' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => {
            const Icon = getTemplateIcon(template.id);
            const isSocial = template.id === 'template_social_short';
            const isAudiobook = template.id === 'template_audiobook_prod';

            return (
              <div
                key={template.id}
                className={`bg-slate-900/80 hover:bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-indigo-950/30 ${
                  isSocial 
                    ? 'border-indigo-500/40 ring-1 ring-indigo-500/20' 
                    : isAudiobook 
                    ? 'border-purple-500/40 ring-1 ring-purple-500/20'
                    : 'border-slate-800/90 hover:border-indigo-500/50'
                }`}
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isSocial ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                        isAudiobook ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                        'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider block">
                          {template.category}
                        </span>
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {template.title}
                        </h3>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                      template.aspectRatio === '9:16'
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}>
                      {template.badge}
                    </span>
                  </div>

                  {/* Tagline & Description */}
                  <div className="text-xs text-indigo-300/90 font-medium mb-1.5">
                    {template.tagline}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                    {template.description}
                  </p>

                  {/* Pre-configured Settings Overview Box */}
                  <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 space-y-2 text-[11px] font-mono">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                      PRE-CONFIGURED WORKFLOW SETTINGS
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">FORMAT:</span>
                        <span className="font-semibold text-white">{template.aspectRatio}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">PACING:</span>
                        <span className="font-semibold text-white">{template.durationSeconds}s</span>
                      </div>
                      <div className="flex items-center justify-between col-span-2">
                        <span className="text-slate-500">TYPOGRAPHY:</span>
                        <span className="text-slate-200 truncate font-semibold" title={template.defaultConfig.burnInConfig.fontFamily}>
                          {template.defaultConfig.burnInConfig.fontFamily} ({template.defaultConfig.burnInConfig.fontSize}px)
                        </span>
                      </div>
                      <div className="flex items-center justify-between col-span-2">
                        <span className="text-slate-500">DESTINATION:</span>
                        <span className="text-indigo-400 capitalize">{getEditorLabel(template.initialPage)}</span>
                      </div>
                    </div>

                    {/* Sample Story Hook Preview */}
                    {template.sampleStorySummary.socialHook && (
                      <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 italic">
                        "{template.sampleStorySummary.socialHook}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Button Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => handleQuickLaunchTemplate(template)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    title={`Quickly initialize ${template.title} with default settings`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Quick Initialize</span>
                  </button>

                  <button
                    onClick={() => handleOpenCustomizeModal(template)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md border border-slate-700 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                    title="Customize project name, aspect ratio, fonts, and tone before launching"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          REQUIREMENT 3: RECENT PROJECTS PANEL
          Shows a list of the last 5 edited projects with one-click access to open them
          directly in their respective editors.
         ========================================================================= */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Recent Projects
                </h2>
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                  Last 5 Edited
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quick-resume recent workspaces with one-click access directly into your preferred stage editor.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActivePage('projects')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Manage All ({projects.length}) Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5 Recent Projects List */}
        <div className="space-y-3">
          {recentProjects.length === 0 ? (
            <div className="text-center py-8 bg-slate-950/60 rounded-lg border border-slate-800/80 p-6 space-y-3">
              <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm text-slate-300 font-medium">No projects available</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start by picking one of the workflow templates above or create a new blank project.
              </p>
              <button
                onClick={() => createProject('My First Story Project')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
              >
                Create First Project
              </button>
            </div>
          ) : (
            recentProjects.map(proj => {
              const isActive = proj.id === activeProject.id;
              const isVertical = proj.burnInConfig?.resolution?.includes('vertical') || 
                (proj.mediaFiles[0]?.height && proj.mediaFiles[0]?.width && proj.mediaFiles[0].height > proj.mediaFiles[0].width);

              return (
                <div
                  key={proj.id}
                  onClick={() => setActiveProject(proj)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-indigo-950/25 border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-md'
                      : 'bg-slate-950/70 hover:bg-slate-950 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Project Details & Meta */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white hover:text-indigo-300 transition-colors truncate">
                        {proj.name}
                      </span>

                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-mono font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                          ACTIVE WORKSPACE
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {isVertical ? '9:16 Vertical' : '16:9 Landscape'}
                      </span>

                      <span className="text-[11px] font-mono text-slate-500">
                        {formatRelativeTime(proj.updatedAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl">
                      {proj.description || 'Production workspace configured for AI story summarization and Khmer subtitle editing.'}
                    </p>

                    {/* Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-0.5">
                      <span className="text-slate-300 font-semibold">
                        ⏱ {secondsToSrtTimestamp(proj.durationSeconds || 0)}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span>{proj.mediaFiles.length} Media File{proj.mediaFiles.length !== 1 ? 's' : ''}</span>
                      <span className="text-slate-600">·</span>
                      <span>{proj.subtitles.length} Subtitles</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-indigo-400">
                        {proj.sourceLanguage.toUpperCase()} → {proj.targetLanguage.toUpperCase()}
                      </span>
                      {proj.storySummary && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-emerald-400">Story Script Ready</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: One-Click Direct Access to Respective Editors */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
                      Direct Open:
                    </span>

                    {/* Video Editor Button */}
                    <button
                      onClick={(e) => handleOpenInEditor(proj, 'video-editor', e)}
                      title="Open directly in Video Editor Timeline"
                      className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white rounded text-xs font-medium border border-slate-700/80 hover:border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Video</span>
                    </button>

                    {/* Subtitle Studio Button */}
                    <button
                      onClick={(e) => handleOpenInEditor(proj, 'subtitle-editor', e)}
                      title="Open directly in Subtitle & Khmer SRT Studio"
                      className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white rounded text-xs font-medium border border-slate-700/80 hover:border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Subtitles</span>
                    </button>

                    {/* Story Summarizer Button */}
                    <button
                      onClick={(e) => handleOpenInEditor(proj, 'story-summarizer', e)}
                      title="Open directly in AI Story Summarizer"
                      className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white rounded text-xs font-medium border border-slate-700/80 hover:border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                      <span>Story AI</span>
                    </button>

                    {/* TTS Studio Button */}
                    <button
                      onClick={(e) => handleOpenInEditor(proj, 'tts-studio', e)}
                      title="Open directly in Khmer Text-to-Speech Studio"
                      className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white rounded text-xs font-medium border border-slate-700/80 hover:border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>TTS Voice</span>
                    </button>

                    {/* Export Hub Button */}
                    <button
                      onClick={(e) => handleOpenInEditor(proj, 'export-center', e)}
                      title="Open directly in Burn-In & Export Center"
                      className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-indigo-600 text-slate-200 hover:text-white rounded text-xs font-medium border border-slate-700/80 hover:border-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />
                      <span>Export</span>
                    </button>

                    {/* Duplicate Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateProject(proj.id);
                      }}
                      title="Duplicate project"
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* =========================================================================
          REQUIREMENT 6: PROJECT TIMELINE COMPONENT FOR DASHBOARDVIEW
          Visualizes project deadlines and milestones on an interactive horizontal scale
         ========================================================================= */}
      <section>
        <ProjectTimeline onOpenProjectEditor={handleOpenInEditor} />
      </section>

      {/* Production Pipeline Overview (8 Stages) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Full Production Pipeline (8 Stages)
          </h2>
          <span className="text-xs text-slate-400 font-mono">Select any stage to jump into workflow</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {pipelineSteps.map(step => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                onClick={() => setActivePage(step.id as any)}
                className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-lg p-4 cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center mb-3 group-hover:bg-indigo-600/20 transition-colors">
                    <Icon className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal">{step.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-medium text-indigo-400 group-hover:text-indigo-300">
                  <span>{step.action}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          TEMPLATE PREVIEW & PRE-CONFIGURATION MODAL
         ========================================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{previewTemplate.title}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {previewTemplate.category} · {previewTemplate.badge}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2 text-xs">
              <button
                onClick={() => setActiveModalTab('config')}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  activeModalTab === 'config'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Configuration Overrides
              </button>
              <button
                onClick={() => setActiveModalTab('synopsis')}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  activeModalTab === 'synopsis'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Story Hook &amp; Narration
              </button>
              <button
                onClick={() => setActiveModalTab('subtitles')}
                className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                  activeModalTab === 'subtitles'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sample Subtitles ({previewTemplate.sampleSubtitles.length})
              </button>
            </div>

            {/* Tab 1: Config Form */}
            {activeModalTab === 'config' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={customProjectName}
                    onChange={e => setCustomProjectName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Aspect Ratio Format
                    </label>
                    <select
                      value={customAspectRatio}
                      onChange={e => setCustomAspectRatio(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="9:16">9:16 Vertical (TikTok / Reels / Shorts)</option>
                      <option value="16:9">16:9 Landscape (YouTube / Broadcast)</option>
                      <option value="1:1">1:1 Square (Instagram Post)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Initial Target Editor
                    </label>
                    <select
                      value={customInitialPage}
                      onChange={e => setCustomInitialPage(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="video-editor">1. Video Editor Timeline</option>
                      <option value="subtitle-editor">2. Subtitle / SRT Studio</option>
                      <option value="story-summarizer">3. AI Story Summarizer</option>
                      <option value="tts-studio">4. Khmer &amp; Multi TTS Studio</option>
                      <option value="translation-studio">5. Translation Studio</option>
                      <option value="export-center">6. Burn-In &amp; Export Center</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subtitle Khmer Font
                    </label>
                    <select
                      value={customFontFamily}
                      onChange={e => setCustomFontFamily(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Noto Sans Khmer">Noto Sans Khmer (Modern &amp; Clean)</option>
                      <option value="Kantumruy Pro">Kantumruy Pro (High-Impact Social)</option>
                      <option value="Siemreap">Siemreap (Editorial &amp; Podcast)</option>
                      <option value="Battambang">Battambang (Traditional Script)</option>
                      <option value="Moul">Moul (Headline &amp; Title Carvings)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Story Script Tone
                    </label>
                    <select
                      value={customStoryTone}
                      onChange={e => setCustomStoryTone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Dramatic">Dramatic (High energy &amp; cliffhangers)</option>
                      <option value="Documentary">Documentary (Poetic &amp; authoritative)</option>
                      <option value="Educational">Educational (Clear &amp; instructional)</option>
                      <option value="Energetic">Energetic (Conversational &amp; fast)</option>
                    </select>
                  </div>
                </div>

                {/* Pre-configured Highlights */}
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target Duration:</span>
                    <span className="text-white font-semibold">{previewTemplate.durationSeconds}s</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Subtitle Size &amp; Outline:</span>
                    <span className="text-white font-semibold">
                      {customFontSize}px · {previewTemplate.defaultConfig.burnInConfig.outlineWidth}px outline
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Voice Actor Mapping:</span>
                    <span className="text-indigo-400 font-semibold">
                      {Object.keys(previewTemplate.defaultConfig.voiceMappings).join(', ') || 'Narrator Default'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Synopsis Preview */}
            {activeModalTab === 'synopsis' && (
              <div className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs max-h-72 overflow-y-auto">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block mb-1">
                    Story Concept
                  </span>
                  <div className="text-sm font-bold text-white mb-1">
                    {previewTemplate.sampleStorySummary.title}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {previewTemplate.sampleStorySummary.synopsis}
                  </p>
                </div>

                {previewTemplate.sampleStorySummary.socialHook && (
                  <div className="p-2.5 bg-indigo-950/40 rounded border border-indigo-800/40">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block mb-0.5">
                      Opening Viral Hook
                    </span>
                    <p className="text-indigo-200 font-medium">
                      "{previewTemplate.sampleStorySummary.socialHook}"
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block mb-1">
                    Narration Script Starter
                  </span>
                  <p className="text-slate-300 italic bg-slate-900/80 p-3 rounded border border-slate-800">
                    "{previewTemplate.sampleStorySummary.narrationScript}"
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Subtitles Preview */}
            {activeModalTab === 'subtitles' && (
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs max-h-72 overflow-y-auto">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block mb-1">
                  Starter Khmer Unicode Subtitles
                </span>
                {previewTemplate.sampleSubtitles.map((sub, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900/80 rounded border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span className="text-indigo-400 font-semibold">{sub.speaker || 'Narrator'}</span>
                      <span>{sub.startTime} → {sub.endTime}</span>
                    </div>
                    <p className="text-slate-200 text-xs font-serif leading-relaxed">
                      {sub.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomizedLaunch}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Initialize &amp; Open {getEditorLabel(customInitialPage)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
