export type PageId =
  | 'dashboard'
  | 'projects'
  | 'video-editor'
  | 'story-summarizer'
  | 'transcript-editor'
  | 'subtitle-editor'
  | 'translation-studio'
  | 'tts-studio'
  | 'voice-studio'
  | 'voice-cloning'
  | 'vocal-remover'
  | 'audio-tools'
  | 'provider-settings'
  | 'export-center'
  | 'processing-queue'
  | 'history'
  | 'settings'
  | 'logs-diagnostics';

export interface ProjectFolder {
  id: string;
  name: string;
  categoryType: 'client' | 'project-type' | 'custom';
  color: string; // Hex color code or Tailwind identifier
  description?: string;
  clientName?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type MilestoneStage = 
  | 'script' 
  | 'transcription' 
  | 'subtitles' 
  | 'translation' 
  | 'voiceover' 
  | 'review' 
  | 'export';

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string; // ISO date string (YYYY-MM-DD or full ISO)
  completed: boolean;
  completedAt?: string;
  stage: MilestoneStage;
  assignedTo?: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  targetLanguage: string;
  sourceLanguage: string;
  durationSeconds: number;
  mediaFiles: MediaFile[];
  transcript: TranscriptSegment[];
  subtitles: SubtitleSegment[];
  storySummary?: StorySummary;
  voiceMappings: Record<string, string>; // speaker -> voiceId
  burnInConfig: SubtitleBurnInConfig;
  // Folder & Workspace categorization
  folderId?: string | null;
  clientName?: string;
  projectType?: string;
  tags?: string[];
  status?: 'draft' | 'in-progress' | 'review' | 'completed' | 'archived';
  // Project Timeline & Deadlines
  startDate?: string;
  deadline?: string;
  milestones?: ProjectMilestone[];
  // Team Comments & Time-stamped Notes
  comments?: ProjectComment[];
}

export interface VeoGenerationRequest {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  durationSeconds?: number;
  stylePreset?: string;
  targetProjectId?: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: 'video' | 'audio';
  url: string;
  duration: number; // in seconds
  width?: number;
  height?: number;
  frameRate?: number;
  videoCodec?: string;
  audioCodec?: string;
  sizeBytes: number;
  thumbnailUrl?: string;
}

export interface TranscriptSegment {
  id: number;
  startTime: number; // seconds
  endTime: number;   // seconds
  speaker: string;
  text: string;
  confidence?: number;
  words?: { word: string; start: number; end: number }[];
}

export interface SubtitleSegment {
  id: number;
  startTime: string; // "00:00:01,200"
  endTime: string;   // "00:00:04,500"
  startSeconds: number;
  endSeconds: number;
  text: string;
  speaker?: string;
  voiceId?: string;
  isOverlapping?: boolean;
  cpsAlert?: boolean; // Characters per second warning
}

export interface StorySummary {
  title: string;
  synopsis: string;
  keyEvents: string[];
  sceneOutline: {
    sceneNumber: number;
    title: string;
    description: string;
    durationSeconds: number;
  }[];
  narrationScript: string;
  characters: {
    name: string;
    role: string;
    suggestedVoiceTone: string;
  }[];
  socialHook?: string;
  tone: string;
  length: 'short' | 'medium' | 'detailed';
  createdAt: string;
}

export interface SubtitleBurnInConfig {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  outlineColor: string;
  outlineWidth: number;
  shadowOffset: number;
  backgroundColor: string;
  alignment: 'bottom' | 'top' | 'middle';
  marginVertical: number;
  resolution: '1080p' | '720p' | '4k' | 'vertical_1080x1920';
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string; // 'km', 'en', etc.
  languageName: string;
  provider: 'gemini' | 'browser' | 'piper' | 'custom_clone';
  voiceIdentifier: string;
  isCloned?: boolean;
  sampleAudioUrl?: string;
  consentVerified?: boolean;
  ownerName?: string;
  timbreDescription?: string;
}

export interface JobItem {
  id: string;
  type: 'transcription' | 'summarization' | 'translation' | 'tts' | 'vocal_separation' | 'video_burn' | 'audio_process';
  title: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0 - 100
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  logLines: string[];
  outputArtifact?: string;
}

export interface HistoryItem {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  projectId: string;
  projectName: string;
  type: 'export' | 'ai' | 'media' | 'project';
}

export interface SystemStatus {
  status: string;
  hasGeminiKey: boolean;
  dependencies: {
    ffmpeg: DependencyDetail;
    ffprobe: DependencyDetail;
    python: DependencyDetail;
    whisperCpp: DependencyDetail;
    fasterWhisper: DependencyDetail;
    demucs: DependencyDetail;
    piperTts: DependencyDetail;
  };
  supportedLanguages: {
    code: string;
    name: string;
    native: string;
    ttsSupport: boolean;
    sttSupport: boolean;
  }[];
}

export interface DependencyDetail {
  installed: boolean;
  version: string;
  path: string;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  badge: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  sourceLanguage: string;
  targetLanguage: string;
  durationSeconds: number;
  initialPage: PageId;
  defaultConfig: {
    burnInConfig: SubtitleBurnInConfig;
    voiceMappings: Record<string, string>;
    storyTone: string;
    storyLength: 'short' | 'medium' | 'detailed';
  };
  sampleStorySummary: StorySummary;
  sampleTranscript: TranscriptSegment[];
  sampleSubtitles: SubtitleSegment[];
}

// Export Presets (ExportCenterView feature)
export type ExportVideoFormat = 'mp4' | 'mkv' | 'webm' | 'mov';
export type ExportResolution = '1080p' | '720p' | '4k' | '2k' | '1080x1920';
export type ExportVideoCodec = 'h264' | 'hevc' | 'vp9' | 'prores';
export type ExportAudioCodec = 'aac' | 'mp3' | 'opus' | 'pcm';
export type ExportAudioBitrate = '128k' | '192k' | '256k' | '320k';
export type ExportFrameRate = '24' | '30' | '60' | 'source';
export type ExportQualityCrf = '18' | '20' | '23' | '26' | '28';
export type ExportPresetCategory = 'social' | 'master' | 'web' | 'broadcast' | 'custom';

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  category: ExportPresetCategory;
  isBuiltIn?: boolean;
  videoFormat: ExportVideoFormat;
  resolution: ExportResolution;
  aspectRatio: '16:9' | '9:16' | '1:1' | 'source';
  videoCodec: ExportVideoCodec;
  audioCodec: ExportAudioCodec;
  audioBitrate: ExportAudioBitrate;
  frameRate: ExportFrameRate;
  crfQuality: ExportQualityCrf;
  burnSubtitles: boolean;
  colorSpace?: 'rec709' | 'bt2020' | 'srgb';
  customFfmpegArgs?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Time-stamped Team Commenting System
export interface CommentAuthor {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  initials: string;
}

export type CommentTargetType = 'video' | 'transcript' | 'both';

export type CommentCategory = 
  | 'feedback' 
  | 'edit_request' 
  | 'translation_fix' 
  | 'audio_note' 
  | 'pacing' 
  | 'general';

export type CommentPriority = 'low' | 'medium' | 'high' | 'critical';

export type CommentStatus = 'open' | 'in_progress' | 'resolved';

export interface CommentReply {
  id: string;
  author: CommentAuthor;
  content: string;
  createdAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  targetType: CommentTargetType;
  timestamp: number; // In seconds
  endTimestamp?: number; // Optional duration range end
  transcriptSegmentId?: number; // Linked TranscriptSegment.id
  author: CommentAuthor;
  content: string;
  category: CommentCategory;
  priority: CommentPriority;
  status: CommentStatus;
  createdAt: string;
  updatedAt?: string;
  replies: CommentReply[];
  reactions?: Record<string, number>;
  resolvedBy?: {
    authorName: string;
    resolvedAt: string;
  };
}

// Automated Incremental Backup & Version History Types
export type SnapshotTriggerType = 
  | 'automated' 
  | 'manual' 
  | 'milestone' 
  | 'export' 
  | 'ai_generation' 
  | 'restore_point';

export interface ProjectSnapshot {
  id: string;
  projectId: string;
  projectName: string;
  versionTag: string; // e.g. "v1.4", "v1.5-auto"
  timestamp: string; // ISO date string
  trigger: SnapshotTriggerType;
  label?: string; // Optional user label, e.g. "Before Khmer burn-in"
  summary: {
    subtitleCount: number;
    transcriptCount: number;
    mediaCount: number;
    milestoneCount: number;
    commentCount: number;
    sizeBytes: number;
    changesDetected?: string[];
  };
  destination: 'local' | 'cloud' | 'both';
  cloudSynced?: boolean;
  cloudSyncTimestamp?: string;
  // Full project state snapshot for safe rollback
  projectData: Project;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  intervalSeconds: number; // e.g. 60, 120, 300
  maxSnapshotsPerProject: number; // e.g. 20
  cloudSyncEnabled: boolean;
  saveOnMajorMilestone: boolean;
  saveBeforeExport: boolean;
}
