import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  HistoryItem, 
  JobItem, 
  MediaFile,
  PageId, 
  Project, 
  ProjectFolder, 
  ProjectMilestone,
  MilestoneStage,
  SubtitleBurnInConfig, 
  SubtitleSegment, 
  SystemStatus, 
  VeoGenerationRequest,
  VoiceProfile,
  ExportPreset,
  CommentAuthor,
  CommentReply,
  CommentStatus,
  ProjectComment,
  ProjectSnapshot,
  BackupSettings,
  SnapshotTriggerType
} from '../types/studio';
import { SAMPLE_PROJECTS, DEFAULT_PROJECT_FOLDERS } from '../services/mockData';
import { fetchSystemStatus } from '../services/geminiService';
import { 
  loadExportPresetsFromStorage, 
  saveExportPresetsToStorage, 
  DEFAULT_EXPORT_PRESETS,
  ACTIVE_PRESET_KEY 
} from '../services/exportPresets';
import { 
  DEFAULT_TEAM_MEMBERS, 
  generateSampleComments,
  formatTimestampShort 
} from '../services/commentsService';
import {
  DEFAULT_BACKUP_SETTINGS,
  SNAPSHOT_STORAGE_KEY,
  BACKUP_SETTINGS_STORAGE_KEY,
  createProjectSnapshot,
  generateInitialSampleSnapshots,
  detectProjectChanges
} from '../services/backupService';

export const generateDefaultMilestones = (startDateStr?: string, deadlineStr?: string): ProjectMilestone[] => {
  const start = startDateStr ? new Date(startDateStr).getTime() : Date.now();
  const end = deadlineStr ? new Date(deadlineStr).getTime() : (start + 86400000 * 7);
  const totalDuration = Math.max(86400000, end - start);
  const ms = (pct: number) => new Date(start + totalDuration * pct).toISOString();

  return [
    {
      id: `ms_${Date.now()}_1`,
      title: 'Story Concept & AI Script Extraction',
      dueDate: ms(0.2),
      completed: true,
      completedAt: ms(0.2),
      stage: 'script',
      notes: 'Initial scene outline and narrative draft generated'
    },
    {
      id: `ms_${Date.now()}_2`,
      title: 'Khmer & Multilingual Speech Recognition',
      dueDate: ms(0.4),
      completed: false,
      stage: 'transcription',
      notes: 'Whisper STT timestamp alignment'
    },
    {
      id: `ms_${Date.now()}_3`,
      title: 'Unicode Subtitles & CPS Validation',
      dueDate: ms(0.6),
      completed: false,
      stage: 'subtitles',
      notes: 'Check reading speed and line splits'
    },
    {
      id: `ms_${Date.now()}_4`,
      title: 'TTS Voice Dubbing & Stem Mixing',
      dueDate: ms(0.8),
      completed: false,
      stage: 'voiceover',
      notes: 'Speech synthesis and stem separation'
    },
    {
      id: `ms_${Date.now()}_5`,
      title: 'Final Burn-In & Master MP4 Export',
      dueDate: end ? new Date(end).toISOString() : ms(1.0),
      completed: false,
      stage: 'export',
      notes: 'Burn-in delivery and packaging'
    }
  ];
};

interface StudioContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  projects: Project[];
  activeProject: Project;
  setActiveProject: (project: Project) => void;
  createProject: (name: string, desc?: string, srcLang?: string, tgtLang?: string) => Project;
  createProjectFromTemplate: (
    template: any, 
    customName?: string, 
    overrides?: {
      aspectRatio?: '9:16' | '16:9' | '1:1';
      sourceLanguage?: string;
      targetLanguage?: string;
      initialPage?: PageId;
      storyTone?: string;
      durationSeconds?: number;
      burnInConfig?: Partial<SubtitleBurnInConfig>;
    }
  ) => Project;
  updateActiveProject: (updater: (prev: Project) => Project) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => void;
  // Folders & categorization system
  folders: ProjectFolder[];
  createFolder: (name: string, categoryType: 'client' | 'project-type' | 'custom', color?: string, description?: string, clientName?: string) => ProjectFolder;
  updateFolder: (id: string, updates: Partial<ProjectFolder>) => void;
  deleteFolder: (id: string, reassignFolderId?: string | null) => void;
  moveProjectToFolder: (projectId: string, folderId: string | null) => void;
  batchMoveProjects: (projectIds: string[], folderId: string | null) => void;
  batchDeleteProjects: (projectIds: string[]) => void;
  updateProjectMeta: (projectId: string, updates: Partial<Project>) => void;
  // Project Timeline & Milestones (Requirement 6)
  updateProjectDeadline: (projectId: string, deadline: string) => void;
  updateProjectStartDate: (projectId: string, startDate: string) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  addMilestone: (projectId: string, milestone: Omit<ProjectMilestone, 'id'>) => void;
  updateMilestone: (projectId: string, milestoneId: string, updates: Partial<ProjectMilestone>) => void;
  deleteMilestone: (projectId: string, milestoneId: string) => void;
  autoGenerateProjectMilestones: (projectId: string) => void;
  // Veo 3 Video Generation
  generateVeoVideo: (request: VeoGenerationRequest) => Promise<any>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  systemStatus: SystemStatus | null;
  refreshSystemStatus: () => Promise<void>;
  jobQueue: JobItem[];
  addJob: (type: JobItem['type'], title: string, runFn: (updateProgress: (p: number, log?: string) => void) => Promise<string>) => string;
  cancelJob: (id: string) => void;
  retryJob: (id: string) => void;
  history: HistoryItem[];
  addHistory: (action: string, details: string, type?: HistoryItem['type']) => void;
  notifications: { id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }[];
  addNotification: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissNotification: (id: string) => void;
  // Video player synchronizer
  videoCurrentTime: number;
  setVideoCurrentTime: (time: number) => void;
  isVideoPlaying: boolean;
  setIsVideoPlaying: (playing: boolean) => void;
  activeSubtitle: SubtitleSegment | null;
  // Voice profiles
  voiceProfiles: VoiceProfile[];
  addVoiceProfile: (profile: VoiceProfile) => void;
  removeVoiceProfile: (id: string) => void;
  // Settings
  khmerFont: string;
  setKhmerFont: (font: string) => void;
  lowResourceMode: boolean;
  setLowResourceMode: (low: boolean) => void;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  // Export Presets (ExportCenterView feature)
  exportPresets: ExportPreset[];
  activeExportPresetId: string;
  setActiveExportPresetId: (id: string) => void;
  createExportPreset: (preset: Omit<ExportPreset, 'id' | 'createdAt' | 'updatedAt'>) => ExportPreset;
  updateExportPreset: (id: string, updates: Partial<ExportPreset>) => void;
  deleteExportPreset: (id: string) => void;
  resetExportPresets: () => void;
  duplicateExportPreset: (id: string) => ExportPreset;
  // Team Commenting & Time-stamped Notes
  comments: ProjectComment[];
  currentTeamUser: CommentAuthor;
  setCurrentTeamUser: (author: CommentAuthor) => void;
  activeCommentId: string | null;
  setActiveCommentId: (id: string | null) => void;
  addComment: (comment: Omit<ProjectComment, 'id' | 'createdAt' | 'replies' | 'status'> & { status?: CommentStatus }) => ProjectComment;
  updateComment: (commentId: string, updates: Partial<ProjectComment>) => void;
  deleteComment: (commentId: string) => void;
  resolveComment: (commentId: string, resolved: boolean) => void;
  addCommentReply: (commentId: string, content: string, author?: CommentAuthor) => void;
  deleteCommentReply: (commentId: string, replyId: string) => void;
  toggleCommentReaction: (commentId: string, emoji: string) => void;
  // Automated Incremental Backup & Version History
  snapshots: ProjectSnapshot[];
  backupSettings: BackupSettings;
  updateBackupSettings: (updates: Partial<BackupSettings>) => void;
  createSnapshot: (projectId?: string, label?: string, trigger?: SnapshotTriggerType, destination?: 'local' | 'cloud' | 'both') => ProjectSnapshot;
  restoreSnapshot: (snapshotId: string) => boolean;
  deleteSnapshot: (snapshotId: string) => void;
  syncSnapshotToCloud: (snapshotId: string) => void;
  importSnapshotFromJson: (jsonStr: string) => boolean;
  lastAutoBackupTime: string | null;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const [folders, setFolders] = useState<ProjectFolder[]>(() => {
    try {
      const stored = localStorage.getItem('storyforge_folders');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_PROJECT_FOLDERS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem('storyforge_projects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any, idx: number) => {
            const sampleMatch = SAMPLE_PROJECTS.find(sp => sp.id === p.id);
            const startDate = p.startDate || sampleMatch?.startDate || p.createdAt || new Date(Date.now() - 86400000 * 3).toISOString();
            const deadline = p.deadline || sampleMatch?.deadline || new Date(Date.now() + 86400000 * 5).toISOString();
            const milestones = (p.milestones && Array.isArray(p.milestones) && p.milestones.length > 0)
              ? p.milestones
              : (sampleMatch?.milestones || generateDefaultMilestones(startDate, deadline));

            return {
              ...p,
              folderId: p.folderId !== undefined ? p.folderId : (sampleMatch?.folderId || (idx === 0 ? 'folder_client_angkor' : idx === 1 ? 'folder_type_dubbing' : 'folder_client_acme')),
              clientName: p.clientName || sampleMatch?.clientName || (idx === 0 ? 'Angkor Heritage Foundation' : idx === 1 ? 'StoryForge Labs' : 'Acme Media Group'),
              projectType: p.projectType || sampleMatch?.projectType || (idx === 0 ? 'Documentary' : idx === 1 ? 'Dubbing' : 'Social Video'),
              status: p.status || sampleMatch?.status || 'in-progress',
              tags: p.tags || sampleMatch?.tags || ['General'],
              startDate,
              deadline,
              milestones,
              comments: (p.comments && Array.isArray(p.comments) && p.comments.length > 0)
                ? p.comments
                : (sampleMatch?.comments || (idx === 0 ? generateSampleComments(p.id) : [])),
            };
          });
        }
      }
    } catch {
      // fallback
    }
    return SAMPLE_PROJECTS;
  });

  // Sync folders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('storyforge_folders', JSON.stringify(folders));
    } catch {
      // ignore quota errors
    }
  }, [folders]);

  // Sync projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('storyforge_projects', JSON.stringify(projects));
    } catch {
      // ignore quota errors
    }
  }, [projects]);

  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || 'proj_khmer_angkor_01');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [jobQueue, setJobQueue] = useState<JobItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>(() => [
    {
      id: 'h_1',
      action: 'Project Loaded',
      details: 'Loaded Angkor Heritage & Folk Tales sample project',
      timestamp: new Date().toISOString(),
      projectId: 'proj_khmer_angkor_01',
      projectName: 'Angkor Heritage & Folk Tales',
      type: 'project',
    },
  ]);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }[]>([]);

  // Video playback
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  // Settings
  const [khmerFont, setKhmerFont] = useState<string>('Noto Sans Khmer');
  const [lowResourceMode, setLowResourceMode] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);

  // Voice profiles
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([
    { id: 'km-voice-1', name: 'Sophea (សុភា)', gender: 'female', language: 'km', languageName: 'Khmer (ខ្មែរ)', provider: 'gemini', voiceIdentifier: 'Kore' },
    { id: 'km-voice-2', name: 'Dara (ដារា)', gender: 'male', language: 'km', languageName: 'Khmer (ខ្មែរ)', provider: 'gemini', voiceIdentifier: 'Fenrir' },
    { id: 'km-voice-3', name: 'Bopha (បុប្ផា)', gender: 'female', language: 'km', languageName: 'Khmer (ខ្មែរ)', provider: 'browser', voiceIdentifier: 'Browser-Khmer' },
    { id: 'en-voice-1', name: 'Kore (Studio Narrator)', gender: 'female', language: 'en', languageName: 'English', provider: 'gemini', voiceIdentifier: 'Kore' },
    { id: 'en-voice-2', name: 'Puck (Dynamic Host)', gender: 'male', language: 'en', languageName: 'English', provider: 'gemini', voiceIdentifier: 'Puck' },
    { id: 'en-voice-3', name: 'Charon (Deep Voiceover)', gender: 'male', language: 'en', languageName: 'English', provider: 'gemini', voiceIdentifier: 'Charon' },
  ]);

  // Load system status on launch
  const refreshSystemStatus = async () => {
    try {
      const status = await fetchSystemStatus();
      setSystemStatus(status);
    } catch (e: any) {
      console.warn('System status check offline:', e.message);
    }
  };

  useEffect(() => {
    refreshSystemStatus();
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECTS[0];

  const setActiveProject = (p: Project) => {
    setActiveProjectId(p.id);
  };

  const updateActiveProject = (updater: (prev: Project) => Project) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === activeProject.id) {
          const updated = updater(p);
          return { ...updated, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  const createProject = (name: string, desc = '', srcLang = 'km', tgtLang = 'en'): Project => {
    const startDate = new Date().toISOString();
    const deadline = new Date(Date.now() + 86400000 * 7).toISOString();
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: name.trim() || 'Untitled Project',
      description: desc,
      createdAt: startDate,
      updatedAt: startDate,
      sourceLanguage: srcLang,
      targetLanguage: tgtLang,
      durationSeconds: 60.0,
      mediaFiles: [],
      transcript: [],
      subtitles: [],
      voiceMappings: {},
      burnInConfig: {
        fontFamily: khmerFont,
        fontSize: 28,
        fontColor: '#FFFFFF',
        outlineColor: '#000000',
        outlineWidth: 2,
        shadowOffset: 2,
        backgroundColor: 'transparent',
        alignment: 'bottom',
        marginVertical: 35,
        resolution: '1080p',
      },
      status: 'in-progress',
      startDate,
      deadline,
      milestones: generateDefaultMilestones(startDate, deadline),
      comments: [],
    };

    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    addNotification(`Project "${newProj.name}" created successfully`, 'success');
    addHistory('Project Created', `Created project ${newProj.name}`, 'project');
    return newProj;
  };

  const createProjectFromTemplate = (
    template: any, 
    customName?: string,
    overrides?: {
      aspectRatio?: '9:16' | '16:9' | '1:1';
      sourceLanguage?: string;
      targetLanguage?: string;
      initialPage?: PageId;
      storyTone?: string;
      durationSeconds?: number;
      burnInConfig?: Partial<SubtitleBurnInConfig>;
    }
  ): Project => {
    const projName = customName?.trim() || `${template.title} Production`;
    const targetAspect = overrides?.aspectRatio || template.aspectRatio || '16:9';
    const targetDuration = overrides?.durationSeconds ?? template.durationSeconds ?? 60;
    const isVertical = targetAspect === '9:16';
    const startDate = new Date().toISOString();
    const daysAhead = template.id === 'template_social_short' ? 3 : template.id === 'template_audiobook_prod' ? 10 : 6;
    const deadline = new Date(Date.now() + 86400000 * daysAhead).toISOString();

    const mergedBurnIn = {
      ...(template.defaultConfig?.burnInConfig || {}),
      ...(overrides?.burnInConfig || {}),
      resolution: isVertical ? 'vertical_1080x1920' : '1080p',
    };

    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: projName,
      description: template.description,
      createdAt: startDate,
      updatedAt: startDate,
      sourceLanguage: overrides?.sourceLanguage || template.sourceLanguage || 'km',
      targetLanguage: overrides?.targetLanguage || template.targetLanguage || 'en',
      durationSeconds: targetDuration,
      mediaFiles: [
        {
          id: `media_${Date.now()}`,
          name: `${template.title.replace(/\s+/g, '_')}_Master.mp4`,
          type: 'video',
          url: isVertical 
            ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
            : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: targetDuration,
          width: isVertical ? 1080 : 1920,
          height: isVertical ? 1920 : 1080,
          frameRate: 30.0,
          videoCodec: 'h264',
          audioCodec: 'aac',
          sizeBytes: 12500000,
        },
      ],
      transcript: JSON.parse(JSON.stringify(template.sampleTranscript || [])),
      subtitles: JSON.parse(JSON.stringify(template.sampleSubtitles || [])),
      storySummary: template.sampleStorySummary ? {
        ...JSON.parse(JSON.stringify(template.sampleStorySummary)),
        tone: overrides?.storyTone || template.sampleStorySummary.tone || 'Dramatic',
      } : undefined,
      voiceMappings: { ...(template.defaultConfig?.voiceMappings || {}) },
      burnInConfig: mergedBurnIn,
      status: 'in-progress',
      startDate,
      deadline,
      milestones: generateDefaultMilestones(startDate, deadline),
      comments: [],
    };

    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    addNotification(`Initialized "${newProj.name}" from template (${template.badge})`, 'success');
    addHistory('Project Initialized', `Created project from template: ${template.title}`, 'project');
    
    const targetPage = overrides?.initialPage || template.initialPage || 'video-editor';
    setActivePage(targetPage);
    return newProj;
  };

  const duplicateProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;
    const duplicated: Project = {
      ...JSON.parse(JSON.stringify(target)),
      id: `proj_${Date.now()}`,
      name: `${target.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects(prev => [duplicated, ...prev]);
    setActiveProjectId(duplicated.id);
    addNotification(`Duplicated "${target.name}"`, 'success');
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) {
      addNotification('Cannot delete the only remaining project', 'warning');
      return;
    }
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    setActiveProjectId(remaining[0].id);
    addNotification('Project deleted', 'info');
  };

  // Folder & Workspace Categorization Methods
  const createFolder = (
    name: string,
    categoryType: 'client' | 'project-type' | 'custom',
    color = '#6366f1',
    description = '',
    clientName = ''
  ): ProjectFolder => {
    const newFolder: ProjectFolder = {
      id: `folder_${Date.now()}`,
      name: name.trim() || 'New Folder',
      categoryType,
      color,
      description,
      clientName: clientName || (categoryType === 'client' ? name.trim() : undefined),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFolders(prev => [newFolder, ...prev]);
    addNotification(`Folder "${newFolder.name}" created`, 'success');
    addHistory('Folder Created', `Created folder "${newFolder.name}" (${categoryType})`, 'project');
    return newFolder;
  };

  const updateFolder = (id: string, updates: Partial<ProjectFolder>) => {
    setFolders(prev =>
      prev.map(f => (f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f))
    );
    addNotification('Folder updated', 'success');
  };

  const deleteFolder = (id: string, reassignFolderId: string | null = null) => {
    const folderToDelete = folders.find(f => f.id === id);
    setFolders(prev => prev.filter(f => f.id !== id));
    setProjects(prev =>
      prev.map(p => (p.folderId === id ? { ...p, folderId: reassignFolderId, updatedAt: new Date().toISOString() } : p))
    );
    addNotification(`Folder "${folderToDelete?.name || ''}" deleted`, 'info');
    addHistory('Folder Deleted', `Deleted folder "${folderToDelete?.name || ''}"`, 'project');
  };

  const moveProjectToFolder = (projectId: string, folderId: string | null) => {
    const targetFolder = folders.find(f => f.id === folderId);
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const updates: Partial<Project> = {
            folderId,
            updatedAt: new Date().toISOString(),
          };
          if (targetFolder) {
            if (targetFolder.categoryType === 'client') {
              updates.clientName = targetFolder.clientName || targetFolder.name;
            } else if (targetFolder.categoryType === 'project-type') {
              updates.projectType = targetFolder.name;
            }
          }
          return { ...p, ...updates };
        }
        return p;
      })
    );
    addNotification(
      targetFolder ? `Moved project to "${targetFolder.name}"` : 'Removed project from folder',
      'success'
    );
  };

  const batchMoveProjects = (projectIds: string[], folderId: string | null) => {
    const targetFolder = folders.find(f => f.id === folderId);
    setProjects(prev =>
      prev.map(p => {
        if (projectIds.includes(p.id)) {
          const updates: Partial<Project> = {
            folderId,
            updatedAt: new Date().toISOString(),
          };
          if (targetFolder) {
            if (targetFolder.categoryType === 'client') {
              updates.clientName = targetFolder.clientName || targetFolder.name;
            } else if (targetFolder.categoryType === 'project-type') {
              updates.projectType = targetFolder.name;
            }
          }
          return { ...p, ...updates };
        }
        return p;
      })
    );
    addNotification(
      `Moved ${projectIds.length} projects to "${targetFolder ? targetFolder.name : 'Unassigned'}"`,
      'success'
    );
  };

  const batchDeleteProjects = (projectIds: string[]) => {
    if (projectIds.length >= projects.length) {
      addNotification('Cannot delete all projects. At least one must remain.', 'warning');
      return;
    }
    const remaining = projects.filter(p => !projectIds.includes(p.id));
    setProjects(remaining);
    if (projectIds.includes(activeProjectId)) {
      setActiveProjectId(remaining[0].id);
    }
    addNotification(`Deleted ${projectIds.length} projects`, 'info');
  };

  const updateProjectMeta = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    addNotification('Project updated', 'success');
  };

  // Project Timeline & Milestones Management (Requirement 6)
  const updateProjectDeadline = (projectId: string, deadline: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          return { ...p, deadline, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
    addNotification('Project deadline updated', 'success');
  };

  const updateProjectStartDate = (projectId: string, startDate: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          return { ...p, startDate, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
    addNotification('Project start date updated', 'success');
  };

  const toggleMilestone = (projectId: string, milestoneId: string) => {
    let milestoneTitle = '';
    let nowCompleted = false;

    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const milestones = (p.milestones || []).map(m => {
            if (m.id === milestoneId) {
              const nextState = !m.completed;
              milestoneTitle = m.title;
              nowCompleted = nextState;
              return {
                ...m,
                completed: nextState,
                completedAt: nextState ? new Date().toISOString() : undefined,
              };
            }
            return m;
          });

          const allCompleted = milestones.length > 0 && milestones.every(m => m.completed);
          const updatedStatus = allCompleted ? 'completed' : (p.status === 'completed' ? 'in-progress' : p.status);

          return {
            ...p,
            milestones,
            status: updatedStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    addNotification(
      nowCompleted ? `Milestone completed: "${milestoneTitle}"` : `Milestone marked pending: "${milestoneTitle}"`,
      nowCompleted ? 'success' : 'info'
    );
  };

  const addMilestone = (projectId: string, milestone: Omit<ProjectMilestone, 'id'>) => {
    const newMs: ProjectMilestone = {
      ...milestone,
      id: `ms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const currentMs = p.milestones || [];
          const updatedMilestones = [...currentMs, newMs].sort(
            (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          );
          return {
            ...p,
            milestones: updatedMilestones,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    addNotification(`Added milestone: "${newMs.title}"`, 'success');
  };

  const updateMilestone = (projectId: string, milestoneId: string, updates: Partial<ProjectMilestone>) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const milestones = (p.milestones || []).map(m => (m.id === milestoneId ? { ...m, ...updates } : m));
          milestones.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
          return {
            ...p,
            milestones,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    addNotification('Milestone updated', 'success');
  };

  const deleteMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            milestones: (p.milestones || []).filter(m => m.id !== milestoneId),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    addNotification('Milestone removed', 'info');
  };

  const autoGenerateProjectMilestones = (projectId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const generated = generateDefaultMilestones(p.startDate || p.createdAt, p.deadline);
          return {
            ...p,
            milestones: generated,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    addNotification('Generated standard 5-stage pipeline milestones', 'success');
  };

  // Veo 3 Video Generation implementation
  const generateVeoVideo = async (request: VeoGenerationRequest): Promise<any> => {
    const res = await fetch('/api/ai/veo-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      throw new Error('Veo 3 generation failed on server');
    }
    const data = await res.json();
    const newMedia: MediaFile = {
      id: data.id || `media_veo_${Date.now()}`,
      name: data.fileName || `Veo3_${data.aspectRatio.replace(':', 'x')}_${Date.now()}.mp4`,
      type: 'video',
      url: data.videoUrl,
      duration: data.durationSeconds || 6,
      width: data.width || (data.aspectRatio === '9:16' ? 1080 : 1920),
      height: data.height || (data.aspectRatio === '9:16' ? 1920 : 1080),
      frameRate: 30,
      videoCodec: 'h264',
      audioCodec: 'aac',
      sizeBytes: 8500000,
    };

    const targetId = request.targetProjectId || activeProjectId;
    setProjects(prev =>
      prev.map(p => {
        if (p.id === targetId) {
          return {
            ...p,
            durationSeconds: Math.max(p.durationSeconds, newMedia.duration),
            mediaFiles: [newMedia, ...p.mediaFiles],
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    addNotification(`Veo 3 video generated (${request.aspectRatio})`, 'success');
    addHistory('AI Video Generated', `Generated video with Veo 3 (${request.aspectRatio}): "${request.prompt.slice(0, 40)}..."`, 'media');
    return { mediaFile: newMedia, data };
  };

  const addNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `notif_${Date.now()}_${Math.random()}`;
    setNotifications(prev => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      dismissNotification(id);
    }, 4500);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addHistory = (action: string, details: string, type: HistoryItem['type'] = 'project') => {
    const newItem: HistoryItem = {
      id: `hist_${Date.now()}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      projectId: activeProject.id,
      projectName: activeProject.name,
      type,
    };
    setHistory(prev => [newItem, ...prev.slice(0, 99)]);
  };

  // Job Queue Executor
  const addJob = (
    type: JobItem['type'],
    title: string,
    runFn: (updateProgress: (p: number, log?: string) => void) => Promise<string>
  ): string => {
    const jobId = `job_${Date.now()}`;
    const newJob: JobItem = {
      id: jobId,
      type,
      title,
      status: 'queued',
      progress: 0,
      startedAt: new Date().toISOString(),
      logLines: [`[${new Date().toLocaleTimeString()}] Queued: ${title}`],
    };

    setJobQueue(prev => [newJob, ...prev]);
    addNotification(`Queued: ${title}`, 'info');

    // Run asynchronously
    setTimeout(async () => {
      setJobQueue(prev =>
        prev.map(j => (j.id === jobId ? { ...j, status: 'running', logLines: [...j.logLines, `[${new Date().toLocaleTimeString()}] Processing started`] } : j))
      );

      const updateProgress = (p: number, log?: string) => {
        setJobQueue(prev =>
          prev.map(j => {
            if (j.id !== jobId) return j;
            const updatedLogs = log ? [...j.logLines, `[${new Date().toLocaleTimeString()}] ${log}`] : j.logLines;
            return { ...j, progress: Math.min(100, Math.max(0, p)), logLines: updatedLogs };
          })
        );
      };

      try {
        const artifact = await runFn(updateProgress);
        setJobQueue(prev =>
          prev.map(j =>
            j.id === jobId
              ? {
                  ...j,
                  status: 'completed',
                  progress: 100,
                  completedAt: new Date().toISOString(),
                  outputArtifact: artifact,
                  logLines: [...j.logLines, `[${new Date().toLocaleTimeString()}] Completed: ${artifact}`],
                }
              : j
          )
        );
        addNotification(`Completed: ${title}`, 'success');
        addHistory('Job Completed', `${title}: ${artifact}`, 'ai');
      } catch (err: any) {
        setJobQueue(prev =>
          prev.map(j =>
            j.id === jobId
              ? {
                  ...j,
                  status: 'failed',
                  errorMessage: err.message,
                  completedAt: new Date().toISOString(),
                  logLines: [...j.logLines, `[${new Date().toLocaleTimeString()}] Failed: ${err.message}`],
                }
              : j
          )
        );
        addNotification(`Job failed: ${title}`, 'error');
      }
    }, 150);

    return jobId;
  };

  const cancelJob = (id: string) => {
    setJobQueue(prev =>
      prev.map(j => (j.id === id ? { ...j, status: 'cancelled', logLines: [...j.logLines, 'Cancelled by user'] } : j))
    );
    addNotification('Job cancelled', 'warning');
  };

  const retryJob = (id: string) => {
    const job = jobQueue.find(j => j.id === id);
    if (!job) return;
    addJob(job.type, `${job.title} (Retry)`, async (update) => {
      update(25, 'Re-initializing pipeline');
      await new Promise(r => setTimeout(r, 600));
      update(75, 'Processing pipeline tasks');
      await new Promise(r => setTimeout(r, 600));
      return 'Retried task completed successfully';
    });
  };

  const addVoiceProfile = (profile: VoiceProfile) => {
    setVoiceProfiles(prev => [...prev, profile]);
    addNotification(`Voice profile "${profile.name}" added`, 'success');
  };

  const removeVoiceProfile = (id: string) => {
    setVoiceProfiles(prev => prev.filter(v => v.id !== id));
  };

  // Export Presets (ExportCenterView feature)
  const [exportPresets, setExportPresets] = useState<ExportPreset[]>(loadExportPresetsFromStorage);
  const [activeExportPresetId, setActiveExportPresetIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_PRESET_KEY) || 'preset_social_1080p';
    } catch {
      return 'preset_social_1080p';
    }
  });

  const setActiveExportPresetId = (id: string) => {
    setActiveExportPresetIdState(id);
    try {
      localStorage.setItem(ACTIVE_PRESET_KEY, id);
    } catch {}
  };

  useEffect(() => {
    saveExportPresetsToStorage(exportPresets);
  }, [exportPresets]);

  const createExportPreset = (presetData: Omit<ExportPreset, 'id' | 'createdAt' | 'updatedAt'>): ExportPreset => {
    const now = new Date().toISOString();
    const newPreset: ExportPreset = {
      ...presetData,
      id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
      isBuiltIn: false,
    };
    setExportPresets(prev => [newPreset, ...prev]);
    setActiveExportPresetId(newPreset.id);
    addNotification(`Export preset "${newPreset.name}" created`, 'success');
    addHistory('create_preset', `Created export preset "${newPreset.name}" (${newPreset.resolution} ${newPreset.videoFormat.toUpperCase()})`, 'export');
    return newPreset;
  };

  const updateExportPreset = (id: string, updates: Partial<ExportPreset>) => {
    setExportPresets(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    addNotification('Export preset updated', 'success');
  };

  const deleteExportPreset = (id: string) => {
    const target = exportPresets.find(p => p.id === id);
    if (!target) return;
    if (target.isBuiltIn) {
      addNotification('Built-in system presets cannot be deleted', 'warning');
      return;
    }
    setExportPresets(prev => prev.filter(p => p.id !== id));
    if (activeExportPresetId === id) {
      setActiveExportPresetId('preset_social_1080p');
    }
    addNotification(`Export preset "${target.name}" removed`, 'info');
  };

  const resetExportPresets = () => {
    setExportPresets(DEFAULT_EXPORT_PRESETS);
    setActiveExportPresetId('preset_social_1080p');
    addNotification('Reset export presets to factory defaults', 'info');
  };

  const duplicateExportPreset = (id: string): ExportPreset => {
    const source = exportPresets.find(p => p.id === id) || DEFAULT_EXPORT_PRESETS[0];
    const now = new Date().toISOString();
    const clone: ExportPreset = {
      ...source,
      id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${source.name} (Copy)`,
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
    };
    setExportPresets(prev => [clone, ...prev]);
    setActiveExportPresetId(clone.id);
    addNotification(`Duplicated preset as "${clone.name}"`, 'success');
    return clone;
  };

  // Team Commenting & Time-stamped Notes System
  const [currentTeamUser, setCurrentTeamUser] = useState<CommentAuthor>(DEFAULT_TEAM_MEMBERS[0]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const comments = activeProject.comments || [];

  const addComment = (commentData: Omit<ProjectComment, 'id' | 'createdAt' | 'replies' | 'status'> & { status?: CommentStatus }): ProjectComment => {
    const newComment: ProjectComment = {
      ...commentData,
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      projectId: activeProjectId,
      status: commentData.status || 'open',
      createdAt: new Date().toISOString(),
      replies: [],
      reactions: {},
    };

    updateActiveProject(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newComment],
    }));

    addNotification(`Note added at ${formatTimestampShort(newComment.timestamp)}`, 'success');
    addHistory('Comment Added', `Added note at ${formatTimestampShort(newComment.timestamp)}: "${newComment.content.slice(0, 35)}..."`, 'project');
    return newComment;
  };

  const updateComment = (commentId: string, updates: Partial<ProjectComment>) => {
    updateActiveProject(prev => ({
      ...prev,
      comments: (prev.comments || []).map(c => 
        c.id === commentId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }));
    addNotification('Comment updated', 'info');
  };

  const deleteComment = (commentId: string) => {
    updateActiveProject(prev => ({
      ...prev,
      comments: (prev.comments || []).filter(c => c.id !== commentId),
    }));
    if (activeCommentId === commentId) {
      setActiveCommentId(null);
    }
    addNotification('Comment removed', 'info');
  };

  const resolveComment = (commentId: string, resolved: boolean) => {
    updateActiveProject(prev => ({
      ...prev,
      comments: (prev.comments || []).map(c => {
        if (c.id !== commentId) return c;
        return {
          ...c,
          status: resolved ? 'resolved' : 'open',
          resolvedBy: resolved ? {
            authorName: currentTeamUser.name,
            resolvedAt: new Date().toISOString(),
          } : undefined,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    addNotification(resolved ? 'Comment marked as resolved' : 'Comment reopened', 'info');
  };

  const addCommentReply = (commentId: string, content: string, author?: CommentAuthor) => {
    if (!content.trim()) return;
    const reply: CommentReply = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      author: author || currentTeamUser,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    updateActiveProject(prev => ({
      ...prev,
      comments: (prev.comments || []).map(c => 
        c.id === commentId ? { ...c, replies: [...c.replies, reply], updatedAt: new Date().toISOString() } : c
      ),
    }));
    addNotification('Reply posted to feedback thread', 'success');
  };

  const deleteCommentReply = (commentId: string, replyId: string) => {
    updateActiveProject(prev => ({
      ...prev,
      comments: (prev.comments || []).map(c => 
        c.id === commentId ? { ...c, replies: c.replies.filter(r => r.id !== replyId), updatedAt: new Date().toISOString() } : c
      ),
    }));
    addNotification('Reply deleted', 'info');
  };

  const toggleCommentReaction = (commentId: string, emoji: string) => {
    updateActiveProject(prev => ({
      ...prev,
      comments: (prev.comments || []).map(c => {
        if (c.id !== commentId) return c;
        const currentCount = c.reactions?.[emoji] || 0;
        const nextReactions = { ...c.reactions, [emoji]: currentCount + 1 };
        return { ...c, reactions: nextReactions };
      }),
    }));
  };

  // =========================================================================
  // AUTOMATED INCREMENTAL BACKUP & VERSION HISTORY SYSTEM
  // =========================================================================
  const [backupSettings, setBackupSettings] = useState<BackupSettings>(() => {
    try {
      const stored = localStorage.getItem(BACKUP_SETTINGS_STORAGE_KEY);
      if (stored) return { ...DEFAULT_BACKUP_SETTINGS, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return DEFAULT_BACKUP_SETTINGS;
  });

  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>(() => {
    try {
      const stored = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return generateInitialSampleSnapshots(projects);
  });

  const [lastAutoBackupTime, setLastAutoBackupTime] = useState<string | null>(() => {
    return snapshots.length > 0 ? snapshots[snapshots.length - 1].timestamp : null;
  });

  // Sync backup settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BACKUP_SETTINGS_STORAGE_KEY, JSON.stringify(backupSettings));
    } catch {
      // ignore quota
    }
  }, [backupSettings]);

  // Sync snapshots to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
    } catch {
      // ignore quota
    }
  }, [snapshots]);

  // Update backup settings
  const updateBackupSettings = (updates: Partial<BackupSettings>) => {
    setBackupSettings(prev => ({ ...prev, ...updates }));
    addNotification('Backup configuration saved', 'info');
  };

  // Create manual or programmatic snapshot
  const createSnapshot = (
    projectId?: string,
    label?: string,
    trigger: SnapshotTriggerType = 'manual',
    destination: 'local' | 'cloud' | 'both' = 'both'
  ): ProjectSnapshot => {
    const targetProj = projectId ? projects.find(p => p.id === projectId) || activeProject : activeProject;
    const projectSnapshots = snapshots.filter(s => s.projectId === targetProj.id);
    const newSnap = createProjectSnapshot(targetProj, trigger, label, projectSnapshots, destination);

    setSnapshots(prev => {
      const otherProjectSnapshots = prev.filter(s => s.projectId !== targetProj.id);
      const updatedThisProj = [...projectSnapshots, newSnap];
      
      const pruned = updatedThisProj.length > backupSettings.maxSnapshotsPerProject
        ? updatedThisProj.slice(updatedThisProj.length - backupSettings.maxSnapshotsPerProject)
        : updatedThisProj;

      return [...otherProjectSnapshots, ...pruned];
    });

    setLastAutoBackupTime(newSnap.timestamp);

    if (trigger === 'manual') {
      addNotification(`Snapshot ${newSnap.versionTag} created for "${targetProj.name}"`, 'success');
      addHistory('Version Snapshot Created', `Created manual checkpoint ${newSnap.versionTag} (${label || 'Saved state'})`, 'project');
    }

    return newSnap;
  };

  // Restore snapshot to active state with safety checkpoint
  const restoreSnapshot = (snapshotId: string): boolean => {
    const targetSnap = snapshots.find(s => s.id === snapshotId);
    if (!targetSnap) {
      addNotification('Snapshot could not be found to restore', 'error');
      return false;
    }

    const restoredProject = JSON.parse(JSON.stringify(targetSnap.projectData)) as Project;
    restoredProject.updatedAt = new Date().toISOString();

    // 1. Create a pre-restore safety checkpoint of current state so user never loses work
    createSnapshot(restoredProject.id, `Pre-restore safety snapshot before rolling back to ${targetSnap.versionTag}`, 'restore_point');

    // 2. Apply restored project to state
    setProjects(prev => prev.map(p => p.id === restoredProject.id ? restoredProject : p));
    if (activeProjectId === restoredProject.id) {
      setVideoCurrentTime(0);
    }

    addNotification(`Project successfully restored to ${targetSnap.versionTag} (${targetSnap.label || 'Saved checkpoint'})`, 'success');
    addHistory('Version Restored', `Restored "${restoredProject.name}" to version ${targetSnap.versionTag} from ${new Date(targetSnap.timestamp).toLocaleString()}`, 'project');
    return true;
  };

  // Delete snapshot
  const deleteSnapshot = (snapshotId: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
    addNotification('Snapshot removed from version history', 'info');
  };

  // Sync snapshot to cloud
  const syncSnapshotToCloud = (snapshotId: string) => {
    setSnapshots(prev => prev.map(s => {
      if (s.id !== snapshotId) return s;
      return {
        ...s,
        cloudSynced: true,
        cloudSyncTimestamp: new Date().toISOString(),
        destination: s.destination === 'local' ? 'both' : s.destination
      };
    }));
    addNotification('Snapshot synced to StoryForge Cloud Storage', 'success');
  };

  // Import snapshot from JSON string
  const importSnapshotFromJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.projectData && parsed.versionTag && parsed.id) {
        setSnapshots(prev => [parsed, ...prev]);
        addNotification(`Imported snapshot ${parsed.versionTag} for "${parsed.projectName}"`, 'success');
        return true;
      }
      addNotification('Invalid StoryForge backup file format', 'error');
      return false;
    } catch {
      addNotification('Failed to parse backup JSON file', 'error');
      return false;
    }
  };

  // Periodic Automated Incremental Backup Engine
  useEffect(() => {
    if (!backupSettings.autoBackupEnabled || backupSettings.intervalSeconds <= 0) return;

    const intervalMs = backupSettings.intervalSeconds * 1000;
    const timer = setInterval(() => {
      if (!activeProject) return;

      const projectSnaps = snapshots.filter(s => s.projectId === activeProject.id);
      const latestSnap = projectSnaps[projectSnaps.length - 1];

      // Detect if changes actually occurred since latest snapshot
      const changes = detectProjectChanges(activeProject, latestSnap?.projectData);
      
      // If there are specific detected changes, save incremental snapshot
      const hasMeaningfulChanges = changes.length > 0 && !changes.every(c => c.includes('checkpoint'));

      if (hasMeaningfulChanges) {
        const autoSnap = createProjectSnapshot(
          activeProject,
          'automated',
          `Auto-save: ${changes[0] || 'Incremental updates'}`,
          projectSnaps,
          backupSettings.cloudSyncEnabled ? 'both' : 'local'
        );

        setSnapshots(prev => {
          const otherProjectSnapshots = prev.filter(s => s.projectId !== activeProject.id);
          const updatedThisProj = [...projectSnaps, autoSnap];
          const pruned = updatedThisProj.length > backupSettings.maxSnapshotsPerProject
            ? updatedThisProj.slice(updatedThisProj.length - backupSettings.maxSnapshotsPerProject)
            : updatedThisProj;
          return [...otherProjectSnapshots, ...pruned];
        });

        setLastAutoBackupTime(autoSnap.timestamp);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [backupSettings.autoBackupEnabled, backupSettings.intervalSeconds, backupSettings.cloudSyncEnabled, backupSettings.maxSnapshotsPerProject, activeProject, snapshots]);

  // Find active subtitle corresponding to videoCurrentTime
  const activeSubtitle = activeProject.subtitles.find(
    s => videoCurrentTime >= s.startSeconds && videoCurrentTime <= s.endSeconds
  ) || null;

  return (
    <StudioContext.Provider
      value={{
        activePage,
        setActivePage,
        projects,
        activeProject,
        setActiveProject,
        createProject,
        createProjectFromTemplate,
        updateActiveProject,
        deleteProject,
        duplicateProject,
        // Folders & categorization system
        folders,
        createFolder,
        updateFolder,
        deleteFolder,
        moveProjectToFolder,
        batchMoveProjects,
        batchDeleteProjects,
        updateProjectMeta,
        // Project Timeline & Milestones (Requirement 6)
        updateProjectDeadline,
        updateProjectStartDate,
        toggleMilestone,
        addMilestone,
        updateMilestone,
        deleteMilestone,
        autoGenerateProjectMilestones,
        generateVeoVideo,
        theme,
        setTheme,
        systemStatus,
        refreshSystemStatus,
        jobQueue,
        addJob,
        cancelJob,
        retryJob,
        history,
        addHistory,
        notifications,
        addNotification,
        dismissNotification,
        videoCurrentTime,
        setVideoCurrentTime,
        isVideoPlaying,
        setIsVideoPlaying,
        activeSubtitle,
        voiceProfiles,
        addVoiceProfile,
        removeVoiceProfile,
        khmerFont,
        setKhmerFont,
        lowResourceMode,
        setLowResourceMode,
        autoSaveEnabled,
        setAutoSaveEnabled,
        // Export Presets (ExportCenterView feature)
        exportPresets,
        activeExportPresetId,
        setActiveExportPresetId,
        createExportPreset,
        updateExportPreset,
        deleteExportPreset,
        resetExportPresets,
        duplicateExportPreset,
        // Team Commenting & Time-stamped Notes
        comments,
        currentTeamUser,
        setCurrentTeamUser,
        activeCommentId,
        setActiveCommentId,
        addComment,
        updateComment,
        deleteComment,
        resolveComment,
        addCommentReply,
        deleteCommentReply,
        toggleCommentReaction,
        // Automated Incremental Backup & Version History
        snapshots,
        backupSettings,
        updateBackupSettings,
        createSnapshot,
        restoreSnapshot,
        deleteSnapshot,
        syncSnapshotToCloud,
        importSnapshotFromJson,
        lastAutoBackupTime,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) throw new Error('useStudio must be used within a StudioProvider');
  return context;
};
