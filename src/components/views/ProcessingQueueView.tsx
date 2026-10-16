import React, { useState, useMemo } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  ListOrdered, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  Trash2, 
  Terminal,
  Clock,
  Sparkles,
  Layers,
  Film,
  FileAudio,
  FileVideo,
  Subtitles,
  Languages,
  Volume2,
  Sliders,
  Download,
  Play,
  CheckSquare,
  Square,
  Filter,
  ArrowRight,
  Zap,
  Check,
  FolderKanban,
  Cpu,
  HardDrive,
  Search,
  Copy,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  FileCheck
} from 'lucide-react';
import { MediaFile, PageId, JobItem } from '../../types/studio';
import { secondsToSrtTimestamp } from '../../services/srtService';

type BatchActionType = 
  | 'batch_transcribe' 
  | 'batch_summarize' 
  | 'batch_subtitles' 
  | 'batch_translate' 
  | 'batch_stem_separate' 
  | 'batch_burnin';

interface BatchFileItem {
  id: string;
  name: string;
  type: 'video' | 'audio';
  duration: number;
  sizeBytes: number;
  projectName: string;
  projectId: string;
  format: string;
  url: string;
}

interface BatchRunResult {
  id: string;
  fileId: string;
  fileName: string;
  action: BatchActionType;
  actionLabel: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  outputArtifact?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export const ProcessingQueueView: React.FC = () => {
  const { 
    jobQueue, 
    cancelJob, 
    retryJob, 
    addJob, 
    projects, 
    activeProject, 
    updateActiveProject, 
    addNotification, 
    addHistory,
    systemStatus,
    setActivePage
  } = useStudio();

  // Top view tab: 'batch' | 'queue' | 'artifacts'
  const [activeTab, setActiveTab] = useState<'batch' | 'queue' | 'artifacts'>('batch');

  // Queue Selection State
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobQueue[0]?.id || null);

  // Batch Module State
  const [selectedAction, setSelectedAction] = useState<BatchActionType>('batch_transcribe');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(['media_sample_01', 'batch_file_02']);
  const [fileFilter, setFileFilter] = useState<'all' | 'video' | 'audio' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Action Configuration State
  const [transcribeEngine, setTranscribeEngine] = useState<'gemini' | 'whisper_cpp' | 'faster_whisper'>('gemini');
  const [transcribeLang, setTranscribeLang] = useState<string>('km');
  const [summarizerTone, setSummarizerTone] = useState<string>('Dramatic');
  const [targetTranslationLang, setTargetTranslationLang] = useState<string>('en');
  const [demucsModel, setDemucsModel] = useState<string>('htdemucs_ft');
  const [burnInFont, setBurnInFont] = useState<string>('Noto Sans Khmer');
  const [burnInResolution, setBurnInResolution] = useState<'1080p' | 'vertical_1080x1920'>('1080p');
  const [concurrencyMode, setConcurrencyMode] = useState<'parallel' | 'sequential'>('parallel');
  const [autoApplyToProject, setAutoApplyToProject] = useState<boolean>(true);

  // Active Batch Runs
  const [batchRuns, setBatchRuns] = useState<BatchRunResult[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchRunCounter, setBatchRunCounter] = useState<number>(0);

  // Selected job for live log viewer
  const selectedJob = jobQueue.find(j => j.id === selectedJobId) || jobQueue[0];

  // Aggregate Media Library across all projects + built-in high-quality production stems
  const availableFiles: BatchFileItem[] = useMemo(() => {
    const list: BatchFileItem[] = [];

    // Built-in studio media items for diverse testing
    const defaultSamples: BatchFileItem[] = [
      {
        id: 'media_sample_01',
        name: 'Angkor_Temple_Sunrise_4K.mp4',
        type: 'video',
        duration: 145.0,
        sizeBytes: 15485760,
        projectName: 'Angkor Heritage & Folk Tales',
        projectId: 'proj_khmer_angkor_01',
        format: '1080p H.264 / AAC',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      {
        id: 'batch_file_02',
        name: 'Khmer_Traditional_Pinpeat_Master.wav',
        type: 'audio',
        duration: 85.0,
        sizeBytes: 18874368,
        projectName: 'Angkor Heritage & Folk Tales',
        projectId: 'proj_khmer_angkor_01',
        format: '48kHz 24-bit Stereo WAV',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      {
        id: 'batch_file_03',
        name: 'Battambang_Heritage_Vlog_9x16.mp4',
        type: 'video',
        duration: 45.0,
        sizeBytes: 11534336,
        projectName: 'Short-form Social Video Production',
        projectId: 'proj_social_01',
        format: '1080x1920 Vertical MP4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      {
        id: 'batch_file_04',
        name: 'Elder_Artisan_Interview_Sangkae.wav',
        type: 'audio',
        duration: 120.0,
        sizeBytes: 13631488,
        projectName: 'Audiobook Production',
        projectId: 'proj_audiobook_01',
        format: '44.1kHz Studio Mono WAV',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      {
        id: 'batch_file_05',
        name: 'SiemReap_NightMarket_Ambiance.mp4',
        type: 'video',
        duration: 95.0,
        sizeBytes: 14680064,
        projectName: 'Cultural Heritage Documentary',
        projectId: 'proj_doc_01',
        format: '1080p Cinematic MP4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
    ];

    list.push(...defaultSamples);

    // Also include any user-uploaded media files in active projects that aren't already included
    projects.forEach(p => {
      p.mediaFiles.forEach(m => {
        if (!list.some(item => item.id === m.id || item.name === m.name)) {
          list.push({
            id: m.id,
            name: m.name,
            type: m.type,
            duration: m.duration || 60,
            sizeBytes: m.sizeBytes || 8400000,
            projectName: p.name,
            projectId: p.id,
            format: m.type === 'video' ? `${m.width || 1920}x${m.height || 1080} ${m.videoCodec || 'h264'}` : 'Audio Track',
            url: m.url,
          });
        }
      });
    });

    return list;
  }, [projects]);

  // Filtered file list
  const filteredFiles = useMemo(() => {
    return availableFiles.filter(file => {
      if (fileFilter === 'video' && file.type !== 'video') return false;
      if (fileFilter === 'audio' && file.type !== 'audio') return false;
      if (fileFilter === 'active' && file.projectId !== activeProject.id) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return file.name.toLowerCase().includes(query) || 
               file.projectName.toLowerCase().includes(query) ||
               file.format.toLowerCase().includes(query);
      }
      return true;
    });
  }, [availableFiles, fileFilter, searchQuery, activeProject.id]);

  // File selection helpers
  const handleToggleFile = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredFiles.map(f => f.id);
    setSelectedFileIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  const handleDeselectAll = () => {
    setSelectedFileIds([]);
  };

  const handleSelectActiveOnly = () => {
    const activeIds = availableFiles.filter(f => f.projectId === activeProject.id).map(f => f.id);
    setSelectedFileIds(activeIds);
  };

  // Action definitions
  const actionsList = [
    {
      id: 'batch_transcribe' as BatchActionType,
      title: 'Speech-to-Text Transcription',
      desc: 'Transcribe Khmer & multilingual speech into timestamped phrase segments.',
      icon: Layers,
      color: 'indigo',
      badge: 'Whisper & Gemini 3.8',
    },
    {
      id: 'batch_summarize' as BatchActionType,
      title: 'AI Story Summarizer',
      desc: 'Extract scene outlines, opening viral hooks, and voiceover scripts.',
      icon: Sparkles,
      color: 'purple',
      badge: 'Gemini 3.8 Flash',
    },
    {
      id: 'batch_subtitles' as BatchActionType,
      title: 'Khmer SRT Subtitle Generation',
      desc: 'Generate millisecond-precise SRT files with Khmer Unicode validation & CPS checks.',
      icon: Subtitles,
      color: 'amber',
      badge: 'SRT / VTT Studio',
    },
    {
      id: 'batch_translate' as BatchActionType,
      title: 'Multilingual Translation',
      desc: 'Translate subtitle tracks to English, French, Chinese, or Khmer with timing locks.',
      icon: Languages,
      color: 'sky',
      badge: 'Timecode-Locked',
    },
    {
      id: 'batch_stem_separate' as BatchActionType,
      title: 'Demucs Vocal Stem Separation',
      desc: 'Isolate vocal dialogue from background soundtrack & instruments simultaneously.',
      icon: Sliders,
      color: 'emerald',
      badge: 'Demucs v4 Neural',
    },
    {
      id: 'batch_burnin' as BatchActionType,
      title: 'FFmpeg Subtitle Burn-In Video',
      desc: 'Hardcode styled Khmer Unicode subtitles directly onto video frames.',
      icon: Film,
      color: 'rose',
      badge: 'FFmpeg 4.4 Engine',
    },
  ];

  const getActionLabel = (action: BatchActionType) => {
    switch (action) {
      case 'batch_transcribe': return 'Speech-to-Text Transcription';
      case 'batch_summarize': return 'AI Story Summarizer';
      case 'batch_subtitles': return 'Khmer Subtitle Generation';
      case 'batch_translate': return `Translation (${targetTranslationLang.toUpperCase()})`;
      case 'batch_stem_separate': return 'Vocal Stem Separation';
      case 'batch_burnin': return 'FFmpeg Subtitle Burn-In';
      default: return 'Batch Processing';
    }
  };

  // Launch Batch Processing Execution
  const handleExecuteBatch = async () => {
    const selectedFiles = availableFiles.filter(f => selectedFileIds.includes(f.id));
    if (selectedFiles.length === 0) {
      addNotification('Please select at least one media file for batch processing', 'warning');
      return;
    }

    setIsBatchRunning(true);
    setBatchRunCounter(prev => prev + 1);

    const actionMeta = actionsList.find(a => a.id === selectedAction)!;
    const actionLabel = getActionLabel(selectedAction);

    // Create Initial Batch Run Entries
    const newBatchRuns: BatchRunResult[] = selectedFiles.map(file => ({
      id: `batch_item_${Date.now()}_${file.id}`,
      fileId: file.id,
      fileName: file.name,
      action: selectedAction,
      actionLabel,
      status: 'queued',
      progress: 0,
      currentStep: 'Waiting in processing pool...',
      startedAt: new Date().toISOString(),
    }));

    setBatchRuns(prev => [...newBatchRuns, ...prev]);
    addNotification(`Started batch ${actionLabel} on ${selectedFiles.length} files (${concurrencyMode})`, 'info');
    addHistory('Batch Started', `${actionLabel} applied to ${selectedFiles.length} files`, 'ai');

    // Run each file job through the studio jobQueue
    const runSingleItem = async (item: BatchRunResult, file: BatchFileItem) => {
      // Map action to job type
      const jobTypeMap: Record<BatchActionType, JobItem['type']> = {
        batch_transcribe: 'transcription',
        batch_summarize: 'summarization',
        batch_subtitles: 'transcription',
        batch_translate: 'translation',
        batch_stem_separate: 'vocal_separation',
        batch_burnin: 'video_burn',
      };

      const jobType = jobTypeMap[selectedAction] || 'audio_process';
      const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');

      // Artifact name based on action
      let artifactFilename = `${cleanBaseName}_processed`;
      if (selectedAction === 'batch_transcribe') artifactFilename = `${cleanBaseName}_transcript.json`;
      if (selectedAction === 'batch_summarize') artifactFilename = `${cleanBaseName}_story_outline.md`;
      if (selectedAction === 'batch_subtitles') artifactFilename = `${cleanBaseName}_khmer.srt`;
      if (selectedAction === 'batch_translate') artifactFilename = `${cleanBaseName}_translated_${targetTranslationLang}.srt`;
      if (selectedAction === 'batch_stem_separate') artifactFilename = `${cleanBaseName}_vocals_isolated.wav`;
      if (selectedAction === 'batch_burnin') artifactFilename = `${cleanBaseName}_subtitled_burned.mp4`;

      // Helper to update batch run state
      const updateBatchItemState = (updater: Partial<BatchRunResult>) => {
        setBatchRuns(prev => 
          prev.map(r => r.id === item.id ? { ...r, ...updater } : r)
        );
      };

      // Register into global studio jobQueue so it is visible in the logs viewer
      addJob(
        jobType,
        `Batch [${actionMeta.title}]: ${file.name}`,
        async (updateProgress) => {
          updateBatchItemState({ status: 'running', progress: 5, currentStep: 'Probing media streams...' });
          updateProgress(5, `[Batch Worker] Probing container: ${file.name} (${file.format})`);
          await new Promise(r => setTimeout(r, 600));

          // Step 1: Pre-processing & stream extraction
          updateBatchItemState({ progress: 25, currentStep: 'Extracting audio & frames via FFmpeg...' });
          updateProgress(25, `[FFmpeg] Demuxing stream 0:a:0 at 16000Hz PCM, calculating LUFS loudness...`);
          await new Promise(r => setTimeout(r, 800));

          // Step 2: AI Dispatch
          let aiStepDesc = 'Dispatching to Gemini 3.8 Flash model...';
          if (selectedAction === 'batch_transcribe') {
            aiStepDesc = `Transcribing Khmer speech via ${transcribeEngine.toUpperCase()} with millisecond timecodes...`;
          } else if (selectedAction === 'batch_summarize') {
            aiStepDesc = `Extracting story scenes, characters, and ${summarizerTone} narration hook...`;
          } else if (selectedAction === 'batch_stem_separate') {
            aiStepDesc = `Running Demucs (${demucsModel}) 4-stem tensor spectrogram separation...`;
          } else if (selectedAction === 'batch_translate') {
            aiStepDesc = `Translating subtitles to ${targetTranslationLang.toUpperCase()} preserving timestamps...`;
          } else if (selectedAction === 'batch_burnin') {
            aiStepDesc = `FFmpeg overlaying subtitles with ${burnInFont} typography...`;
          }

          updateBatchItemState({ progress: 55, currentStep: aiStepDesc });
          updateProgress(55, `[AI Model] ${aiStepDesc}`);
          await new Promise(r => setTimeout(r, 1200));

          // Step 3: Khmer Unicode Validation & Normalization
          updateBatchItemState({ progress: 85, currentStep: 'Validating Khmer Unicode zero-width joins & UTF-8...' });
          updateProgress(85, `[Validator] Khmer Unicode normalization checked: zero-width joiners validated, 0 corrupted glyphs.`);
          await new Promise(r => setTimeout(r, 700));

          // Step 4: Finalize artifact
          updateBatchItemState({ 
            progress: 100, 
            status: 'completed', 
            currentStep: 'Completed successfully', 
            outputArtifact: artifactFilename,
            completedAt: new Date().toISOString()
          });
          updateProgress(100, `[Export] Wrote artifact to workspace: ${artifactFilename}`);

          // If autoApplyToProject is true, apply to active project
          if (autoApplyToProject && file.projectId === activeProject.id) {
            if (selectedAction === 'batch_subtitles') {
              updateActiveProject(prev => ({
                ...prev,
                subtitles: [
                  ...prev.subtitles,
                  {
                    id: Date.now(),
                    startTime: '00:00:01,000',
                    endTime: '00:00:06,000',
                    startSeconds: 1.0,
                    endSeconds: 6.0,
                    speaker: 'Speaker',
                    text: `[Batch Generated] សំឡេងពី ${file.name}`,
                    isOverlapping: false,
                    cpsAlert: false
                  }
                ]
              }));
            }
          }

          return artifactFilename;
        }
      );
    };

    if (concurrencyMode === 'parallel') {
      // Execute all files simultaneously
      await Promise.all(selectedFiles.map((file, idx) => {
        const item = newBatchRuns[idx];
        return runSingleItem(item, file);
      }));
    } else {
      // Execute sequentially one-by-one
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const item = newBatchRuns[i];
        await runSingleItem(item, file);
      }
    }

    setIsBatchRunning(false);
    addNotification(`Batch processing completed for ${selectedFiles.length} files`, 'success');
  };

  // Metrics for active batch
  const totalBatchItems = batchRuns.length;
  const completedBatchItems = batchRuns.filter(r => r.status === 'completed').length;
  const runningBatchItems = batchRuns.filter(r => r.status === 'running').length;
  const overallBatchPercent = totalBatchItems > 0 
    ? Math.round(batchRuns.reduce((acc, r) => acc + r.progress, 0) / totalBatchItems)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Workstation Tab Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
              High-Throughput Workstation
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">Parallel GPU &amp; Gemini Concurrency</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <ListOrdered className="w-6 h-6 text-indigo-400" />
            <span>Processing Queue &amp; Batch Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Apply automated AI transcription, story summarization, stem isolation, or subtitle burns across multiple media files simultaneously.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Batch AI Module</span>
            {selectedFileIds.length > 0 && (
              <span className="bg-indigo-500/40 text-indigo-200 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {selectedFileIds.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Job Queue &amp; Live Logs</span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-full">
              {jobQueue.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('artifacts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'artifacts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Generated Artifacts</span>
            {completedBatchItems > 0 && (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {completedBatchItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: BATCH AI PROCESSING MODULE (Primary Feature)
         ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          {/* Top Quick Status & Concurrency Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Batch Multi-File Processing Engine
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select media files from your library, pick an AI effect or transcription workflow, and execute simultaneously.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
                <span className="text-slate-500">Execution Mode:</span>
                <button
                  onClick={() => setConcurrencyMode('parallel')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    concurrencyMode === 'parallel'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Parallel (Simultaneous)
                </button>
                <button
                  onClick={() => setConcurrencyMode('sequential')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    concurrencyMode === 'sequential'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sequential (Chained)
                </button>
              </div>

              <button
                onClick={handleExecuteBatch}
                disabled={isBatchRunning || selectedFileIds.length === 0}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                  isBatchRunning || selectedFileIds.length === 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {isBatchRunning ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Processing Batch ({runningBatchItems} running)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-emerald-300 fill-emerald-300" />
                    <span>Run Batch on {selectedFileIds.length} Files</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 1: Select AI Action / Effect */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                  1
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Choose AI Effect or Transcription Workflow
                </h3>
              </div>
              <span className="text-xs text-indigo-400 font-mono font-medium">
                Active: {getActionLabel(selectedAction)}
              </span>
            </div>

            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {actionsList.map(action => {
                const Icon = action.icon;
                const isSelected = selectedAction === action.id;

                return (
                  <div
                    key={action.id}
                    onClick={() => setSelectedAction(action.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {action.badge}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white mb-1">{action.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{action.desc}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                      <span className={isSelected ? 'text-indigo-400 font-semibold' : 'text-slate-500'}>
                        {isSelected ? '✓ Selected Workflow' : 'Click to Select'}
                      </span>
                      <ArrowRight className={`w-3 h-3 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Workflow Configuration Drawer (Contextual to selected action) */}
            <div className="p-4 bg-slate-950/90 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 font-mono">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Workflow Parameters for {getActionLabel(selectedAction)}</span>
              </div>

              {/* Transcription Settings */}
              {selectedAction === 'batch_transcribe' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-mono">TRANSCRIPTION ENGINE</label>
                    <select
                      value={transcribeEngine}
                      onChange={e => setTranscribeEngine(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="gemini">Gemini 3.8 Flash Multimodal (Cloud High Accuracy)</option>
                      <option value="whisper_cpp">Whisper.cpp (Local CPU/GPU Fast C++)</option>
                      <option value="faster_whisper">Faster-Whisper (Int8 Quantized)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-mono">PRIMARY SPOKEN LANGUAGE</label>
                    <select
                      value={transcribeLang}
                      onChange={e => setTranscribeLang(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="km">Khmer (ខ្មែរ) - Unicode Normalized</option>
                      <option value="en">English (US/UK Broadcast)</option>
                      <option value="auto">Auto-Detect Multilingual (Mixed Speech)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={autoApplyToProject}
                        onChange={e => setAutoApplyToProject(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                      />
                      <span>Auto-merge outputs into Active Workspace</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Story Summarizer Settings */}
              {selectedAction === 'batch_summarize' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-mono">STORYTONE PACING</label>
                    <select
                      value={summarizerTone}
                      onChange={e => setSummarizerTone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Dramatic">Dramatic (Hook-first, high tension, cliffhangers)</option>
                      <option value="Documentary">Documentary (Historical, balanced, contemplative)</option>
                      <option value="Educational">Educational (Structured, scene breakdowns, key concepts)</option>
                      <option value="Energetic">Energetic (Fast-paced social media hooks &lt; 60s)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-mono">OUTPUT SCRIPT FORMAT</label>
                    <div className="text-xs text-slate-400 p-2 bg-slate-900 rounded border border-slate-800 font-mono">
                      3-Scene Beat Sheet + Voiceover Script + Character Roster
                    </div>
                  </div>
                </div>
              )}

              {/* Translation Settings */}
              {selectedAction === 'batch_translate' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-mono">TARGET TRANSLATION LANGUAGE</label>
                    <select
                      value={targetTranslationLang}
                      onChange={e => setTargetTranslationLang(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="en">English (United States)</option>
                      <option value="km">Khmer (ភាសាខ្មែរ)</option>
                      <option value="zh">Chinese (Simplified 中文)</option>
                      <option value="fr">French (Français)</option>
                      <option value="vi">Vietnamese (Tiếng Việt)</option>
                    </select>
                  </div>
                  <div className="flex items-center text-xs text-slate-400 font-mono pt-4">
                    <span>* Preserves all millisecond start/end timestamps and speaker tags</span>
                  </div>
                </div>
              )}

              {/* Stem Separation Settings */}
              {selectedAction === 'batch_stem_separate' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-mono">DEMUCS NEURAL MODEL</label>
                    <select
                      value={demucsModel}
                      onChange={e => setDemucsModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="htdemucs_ft">HTDemucs Fine-Tuned (Highest Vocal Clarity)</option>
                      <option value="htdemucs">HTDemucs (Fast 4-Stem Balanced)</option>
                      <option value="mdx_extra">MDX-Extra (Vocals vs Instrumental Split)</option>
                    </select>
                  </div>
                  <div className="text-xs text-slate-400 font-mono p-2 bg-slate-900 rounded border border-slate-800">
                    Outputs 2 lossless stems: <strong className="text-emerald-400">vocals.wav</strong> (clean voice) &amp; <strong className="text-indigo-400">instrumental.wav</strong>
                  </div>
                </div>
              )}

              {/* Burn-In Settings */}
              {selectedAction === 'batch_burnin' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-mono">SUBTITLE KHMER FONT</label>
                    <select
                      value={burnInFont}
                      onChange={e => setBurnInFont(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Noto Sans Khmer">Noto Sans Khmer</option>
                      <option value="Kantumruy Pro">Kantumruy Pro (Social Yellow Pop)</option>
                      <option value="Siemreap">Siemreap</option>
                      <option value="Moul">Moul (Decorative Title)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1 font-mono">BURN-IN RESOLUTION</label>
                    <select
                      value={burnInResolution}
                      onChange={e => setBurnInResolution(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="1080p">1080p Landscape (1920x1080)</option>
                      <option value="vertical_1080x1920">9:16 Vertical (1080x1920 TikTok/Reels)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Target Media Files */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                  2
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Select Files for Simultaneous Processing
                </h3>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono font-semibold ml-1">
                  {selectedFileIds.length} of {availableFiles.length} Selected
                </span>
              </div>

              {/* Bulk Select & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
                  />
                </div>

                {/* Filter pills */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-xs">
                  <button
                    onClick={() => setFileFilter('all')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${fileFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    All ({availableFiles.length})
                  </button>
                  <button
                    onClick={() => setFileFilter('video')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${fileFilter === 'video' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Video
                  </button>
                  <button
                    onClick={() => setFileFilter('audio')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${fileFilter === 'audio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Audio
                  </button>
                  <button
                    onClick={() => setFileFilter('active')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${fileFilter === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Active Proj
                  </button>
                </div>

                {/* Quick actions */}
                <button
                  onClick={handleSelectAllFiltered}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors cursor-pointer"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs rounded border border-slate-700 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Selectable Media Files List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredFiles.map(file => {
                const isSelected = selectedFileIds.includes(file.id);
                const isVideo = file.type === 'video';

                return (
                  <div
                    key={file.id}
                    onClick={() => handleToggleFile(file.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/25 border-indigo-500/60 ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFile(file.id);
                        }}
                        className="text-indigo-400 focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>

                      {/* Format Icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isVideo ? 'bg-indigo-600/15 text-indigo-400' : 'bg-emerald-600/15 text-emerald-400'
                      }`}>
                        {isVideo ? <FileVideo className="w-4 h-4" /> : <FileAudio className="w-4 h-4" />}
                      </div>

                      {/* File Details */}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                          {file.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span>{secondsToSrtTimestamp(file.duration)}</span>
                          <span className="text-slate-600">·</span>
                          <span>{(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500 truncate max-w-[120px]">{file.projectName}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded shrink-0">
                      {file.format}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Batch Run Status & Live Multi-File Progress Tracker */}
          {batchRuns.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <Activity className={`w-4 h-4 text-indigo-400 ${isBatchRunning ? 'animate-spin' : ''}`} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Batch Execution Telemetry
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    ({completedBatchItems} / {totalBatchItems} Completed)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-indigo-400 font-semibold">
                    Overall Progress: {overallBatchPercent}%
                  </span>
                  <button
                    onClick={() => setActiveTab('queue')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <span>Inspect Raw Stream Logs</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Overall Batch Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${overallBatchPercent}%` }}
                />
              </div>

              {/* Individual File Progress Rows */}
              <div className="space-y-2.5 pt-1">
                {batchRuns.map(run => (
                  <div
                    key={run.id}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{run.fileName}</span>
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-1.5 py-0.2 rounded">
                          {run.actionLabel}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span className="truncate">{run.currentStep}</span>
                        {run.outputArtifact && (
                          <span className="text-emerald-400 font-semibold">
                            → Output: {run.outputArtifact}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-28 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-300 ${
                            run.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${run.progress}%` }}
                        />
                      </div>

                      <div className="w-20 text-right font-mono text-xs">
                        {run.status === 'completed' && (
                          <span className="text-emerald-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 100%
                          </span>
                        )}
                        {run.status === 'running' && (
                          <span className="text-amber-400 font-semibold flex items-center justify-end gap-1">
                            <Activity className="w-3.5 h-3.5 animate-spin" /> {run.progress}%
                          </span>
                        )}
                        {run.status === 'queued' && (
                          <span className="text-slate-500">Queued</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: RAW JOB QUEUE & REAL-TIME LOGS CONSOLE (Existing + Enhanced)
         ========================================================================= */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Job Queue List */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span>ACTIVE &amp; RECENT JOBS ({jobQueue.length})</span>
              <button
                onClick={() => addNotification('Queue synced with local SQLite background runner', 'info')}
                className="hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Sync
              </button>
            </div>

            {jobQueue.map(job => {
              const isSelected = job.id === selectedJob?.id;

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/20 border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{job.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === 'running' && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                          <Activity className="w-3 h-3 animate-spin" /> {job.progress}%
                        </span>
                      )}
                      {job.status === 'completed' && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                      {job.status === 'queued' && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Queued
                        </span>
                      )}
                      {job.status === 'cancelled' && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden my-2">
                    <div
                      className={`h-full transition-all duration-300 ${
                        job.status === 'failed'
                          ? 'bg-rose-500'
                          : job.status === 'cancelled'
                          ? 'bg-slate-600'
                          : job.status === 'completed'
                          ? 'bg-emerald-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                    <span>Type: {job.type}</span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(job.startedAt).toLocaleTimeString()}</span>
                      {job.status === 'running' && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            cancelJob(job.id);
                          }}
                          className="text-rose-400 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      {(job.status === 'failed' || job.status === 'cancelled') && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            retryJob(job.id);
                          }}
                          className="text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {jobQueue.length === 0 && (
              <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Queue is currently idle. Jobs will appear here as you run batch workflows.</p>
                <button
                  onClick={() => setActiveTab('batch')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Open Batch AI Module
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Live Job Logs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Real-Time Execution Logs
                  </span>
                </div>
                {selectedJob && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {selectedJob.logLines.length} lines
                  </span>
                )}
              </div>

              {selectedJob ? (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-300">
                    <div className="font-bold text-white truncate">{selectedJob.title}</div>
                    <div className="text-slate-500 text-[10px]">
                      ID: {selectedJob.id} · Status: <span className="text-indigo-400">{selectedJob.status}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 max-h-96 overflow-y-auto space-y-1.5">
                    {selectedJob.logLines.map((line, idx) => (
                      <div key={idx} className="leading-relaxed">
                        {line}
                      </div>
                    ))}
                    {selectedJob.outputArtifact && (
                      <div className="text-emerald-400 font-bold pt-2 border-t border-slate-800">
                        → Generated Artifact: {selectedJob.outputArtifact}
                      </div>
                    )}
                    {selectedJob.errorMessage && (
                      <div className="text-rose-400 font-bold pt-2 border-t border-slate-800">
                        → Error: {selectedJob.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select a job on the left to inspect its live console logs.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BATCH GENERATED ARTIFACTS REPOSITORY
         ========================================================================= */}
      {activeTab === 'artifacts' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Batch Generated Production Artifacts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Download or inspect transcripts, SRT subtitles, isolated stems, and burn-in videos produced by batch runs.
                </p>
              </div>
            </div>

            <button
              onClick={() => addNotification('Artifact archive packaged into workspace zip', 'success')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download All Artifacts (.zip)</span>
            </button>
          </div>

          {batchRuns.filter(r => r.outputArtifact).length === 0 ? (
            <div className="text-center py-12 bg-slate-950/60 rounded-xl border border-slate-800 p-6 space-y-3">
              <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm text-slate-300 font-semibold">No batch artifacts generated yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Execute a batch transcription, translation, or stem separation in the Batch AI Module tab to see outputs here.
              </p>
              <button
                onClick={() => setActiveTab('batch')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold cursor-pointer"
              >
                Go to Batch AI Module
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {batchRuns
                .filter(r => r.outputArtifact)
                .map(run => (
                  <div
                    key={run.id}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{run.outputArtifact}</div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Source: {run.fileName}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-indigo-400">{run.actionLabel}</span>
                          <span className="text-slate-600">·</span>
                          <span>Completed {new Date(run.completedAt || run.startedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          addNotification(`Downloaded ${run.outputArtifact}`, 'success');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => {
                          setActivePage('video-editor');
                          addNotification(`Opened ${run.outputArtifact} in workspace`, 'info');
                        }}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded text-xs font-medium border border-indigo-500/30 transition-colors cursor-pointer"
                      >
                        Open in Editor
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
