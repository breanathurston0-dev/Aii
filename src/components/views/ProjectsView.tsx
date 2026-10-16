import React, { useState, useMemo } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  FolderKanban, 
  Folder, 
  FolderPlus, 
  FolderOpen, 
  Plus, 
  Copy, 
  Trash2, 
  Check, 
  Download, 
  Upload, 
  Search, 
  Database, 
  Building2, 
  Film, 
  Smartphone, 
  Headphones, 
  Languages, 
  Tag, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Edit2, 
  Layers, 
  Video, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Grid, 
  ListFilter, 
  CheckSquare, 
  Square,
  Play,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { Project, ProjectFolder, VeoGenerationRequest } from '../../types/studio';
import { secondsToSrtTimestamp } from '../../services/srtService';
import { createProjectZip, downloadBlob } from '../../services/exportZipService';

// Color palette options for folders
const FOLDER_COLORS = [
  { name: 'Indigo', value: '#6366f1', bgClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' },
  { name: 'Emerald', value: '#10b981', bgClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { name: 'Amber', value: '#f59e0b', bgClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { name: 'Pink', value: '#ec4899', bgClass: 'bg-pink-500/20 text-pink-400 border-pink-500/40' },
  { name: 'Purple', value: '#8b5cf6', bgClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40' },
  { name: 'Cyan', value: '#06b6d4', bgClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  { name: 'Rose', value: '#f43f5e', bgClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
  { name: 'Blue', value: '#3b82f6', bgClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
];

export const ProjectsView: React.FC = () => {
  const { 
    projects, 
    activeProject, 
    setActiveProject, 
    createProject, 
    deleteProject, 
    duplicateProject,
    updateActiveProject,
    folders,
    createFolder,
    updateFolder,
    deleteFolder,
    moveProjectToFolder,
    batchMoveProjects,
    batchDeleteProjects,
    updateProjectMeta,
    generateVeoVideo,
    addNotification,
    setActivePage
  } = useStudio();

  // Search, filter, view mode state
  const [search, setSearch] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'client' | 'project-type' | 'uncategorized'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'duration' | 'subtitles'>('updated');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Multi-select state
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Inline rename
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Modals state
  const [showSqliteModal, setShowSqliteModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ProjectFolder | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderCategoryInput, setFolderCategoryInput] = useState<'client' | 'project-type' | 'custom'>('client');
  const [folderClientInput, setFolderClientInput] = useState('');
  const [folderColorInput, setFolderColorInput] = useState('#6366f1');
  const [folderDescInput, setFolderDescInput] = useState('');

  // Veo 3 Video Generator Modal state
  const [showVeoModal, setShowVeoModal] = useState(false);
  const [veoPrompt, setVeoPrompt] = useState('Cinematic aerial tracking shot over Angkor Wat temple towers at sunrise with golden morning mist');
  const [veoAspectRatio, setVeoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [veoResolution, setVeoResolution] = useState<'720p' | '1080p'>('720p');
  const [veoDuration, setVeoDuration] = useState<number>(6);
  const [veoStyle, setVeoStyle] = useState('Cinematic Documentary');
  const [veoTargetProjectId, setVeoTargetProjectId] = useState<string>(activeProject.id);
  const [isGeneratingVeo, setIsGeneratingVeo] = useState(false);
  const [veoProgress, setVeoProgress] = useState(0);
  const [veoStatusText, setVeoStatusText] = useState('');
  const [generatedVeoResult, setGeneratedVeoResult] = useState<any | null>(null);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.clientName && p.clientName.toLowerCase().includes(q)) ||
        (p.projectType && p.projectType.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Category Tab filter
    if (activeCategoryTab === 'client') {
      result = result.filter(p => {
        const folder = folders.find(f => f.id === p.folderId);
        return folder?.categoryType === 'client' || Boolean(p.clientName);
      });
    } else if (activeCategoryTab === 'project-type') {
      result = result.filter(p => {
        const folder = folders.find(f => f.id === p.folderId);
        return folder?.categoryType === 'project-type' || Boolean(p.projectType);
      });
    } else if (activeCategoryTab === 'uncategorized') {
      result = result.filter(p => !p.folderId);
    }

    // Specific folder selection
    if (selectedFolderId) {
      if (selectedFolderId === '__uncategorized__') {
        result = result.filter(p => !p.folderId);
      } else {
        result = result.filter(p => p.folderId === selectedFolderId);
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'duration') {
        return b.durationSeconds - a.durationSeconds;
      }
      if (sortBy === 'subtitles') {
        return b.subtitles.length - a.subtitles.length;
      }
      return 0;
    });

    return result;
  }, [projects, search, activeCategoryTab, selectedFolderId, sortBy, folders]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = projects.length;
    const categorized = projects.filter(p => Boolean(p.folderId)).length;
    const clientFoldersCount = folders.filter(f => f.categoryType === 'client').length;
    const typeFoldersCount = folders.filter(f => f.categoryType === 'project-type').length;
    const clientProjectsCount = projects.filter(p => {
      const f = folders.find(x => x.id === p.folderId);
      return f?.categoryType === 'client' || Boolean(p.clientName);
    }).length;
    const totalDurationSec = projects.reduce((acc, p) => acc + (p.durationSeconds || 0), 0);

    return {
      total,
      categorized,
      clientFoldersCount,
      typeFoldersCount,
      clientProjectsCount,
      totalDurationSec,
      rate: total > 0 ? Math.round((categorized / total) * 100) : 0,
    };
  }, [projects, folders]);

  // Helper for folder styling
  const getFolderColor = (folderId?: string | null) => {
    if (!folderId) return '#64748b';
    const folder = folders.find(f => f.id === folderId);
    return folder?.color || '#6366f1';
  };

  const getFolderName = (folderId?: string | null) => {
    if (!folderId) return 'Uncategorized';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || 'Unassigned';
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjectIds.length === filteredProjects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(filteredProjects.map(p => p.id));
    }
  };

  // Folder modal handlers
  const handleOpenCreateFolder = () => {
    setEditingFolder(null);
    setFolderNameInput('');
    setFolderCategoryInput('client');
    setFolderClientInput('');
    setFolderColorInput('#6366f1');
    setFolderDescInput('');
    setShowFolderModal(true);
  };

  const handleOpenEditFolder = (folder: ProjectFolder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingFolder(folder);
    setFolderNameInput(folder.name);
    setFolderCategoryInput(folder.categoryType);
    setFolderClientInput(folder.clientName || '');
    setFolderColorInput(folder.color || '#6366f1');
    setFolderDescInput(folder.description || '');
    setShowFolderModal(true);
  };

  const handleSaveFolder = () => {
    if (!folderNameInput.trim()) {
      addNotification('Folder name cannot be empty', 'warning');
      return;
    }

    if (editingFolder) {
      updateFolder(editingFolder.id, {
        name: folderNameInput.trim(),
        categoryType: folderCategoryInput,
        clientName: folderCategoryInput === 'client' ? (folderClientInput.trim() || folderNameInput.trim()) : undefined,
        color: folderColorInput,
        description: folderDescInput.trim(),
      });
    } else {
      createFolder(
        folderNameInput.trim(),
        folderCategoryInput,
        folderColorInput,
        folderDescInput.trim(),
        folderCategoryInput === 'client' ? (folderClientInput.trim() || folderNameInput.trim()) : undefined
      );
    }
    setShowFolderModal(false);
  };

  const handleDeleteFolderConfirm = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const count = projects.filter(p => p.folderId === folderId).length;
    const confirmMsg = count > 0 
      ? `Delete folder "${folder.name}"? ${count} project(s) will be unassigned.`
      : `Delete folder "${folder.name}"?`;
    
    if (window.confirm(confirmMsg)) {
      deleteFolder(folderId, null);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    }
  };

  // Toggle folder accordion
  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Batch actions
  const handleBatchMove = (targetFolderId: string | null) => {
    if (selectedProjectIds.length === 0) return;
    batchMoveProjects(selectedProjectIds, targetFolderId);
    setSelectedProjectIds([]);
  };

  const handleBatchDelete = () => {
    if (selectedProjectIds.length === 0) return;
    if (window.confirm(`Delete ${selectedProjectIds.length} selected projects? This action cannot be undone.`)) {
      batchDeleteProjects(selectedProjectIds);
      setSelectedProjectIds([]);
    }
  };

  // Backup & Restore
  const handleBackup = async (p: Project) => {
    const blob = await createProjectZip(p);
    downloadBlob(blob, `${p.name.replace(/\s+/g, '_')}_backup.zip`);
    addNotification(`Exported backup for ${p.name}`, 'success');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.name) {
          const restored = createProject(`${parsed.name} (Restored)`, parsed.description, parsed.sourceLanguage, parsed.targetLanguage);
          if (parsed.folderId) {
            updateProjectMeta(restored.id, {
              folderId: parsed.folderId,
              clientName: parsed.clientName,
              projectType: parsed.projectType,
              status: parsed.status,
            });
          }
          addNotification('Project restored successfully from JSON', 'success');
        }
      } catch {
        addNotification('Failed to parse backup JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Inline rename
  const handleStartRename = (p: Project) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const handleSaveRename = (id: string) => {
    if (!editName.trim()) return;
    updateProjectMeta(id, { name: editName.trim() });
    setEditingId(null);
  };

  // Veo 3 Video Generator trigger
  const handleRunVeoGeneration = async () => {
    if (!veoPrompt.trim()) {
      addNotification('Prompt is required for Veo 3 video generation', 'warning');
      return;
    }

    setIsGeneratingVeo(true);
    setVeoProgress(10);
    setVeoStatusText('Initializing Google Veo 3 video pipeline (veo-3.1-fast-generate-preview)...');
    setGeneratedVeoResult(null);

    try {
      setTimeout(() => {
        setVeoProgress(35);
        setVeoStatusText(`Synthesizing latent keyframes with aspect ratio ${veoAspectRatio}...`);
      }, 700);

      setTimeout(() => {
        setVeoProgress(70);
        setVeoStatusText(`Applying ${veoStyle} stylistic color grading & temporal motion coherence...`);
      }, 1400);

      const request: VeoGenerationRequest = {
        prompt: veoPrompt.trim(),
        aspectRatio: veoAspectRatio, // strictly 16:9 or 9:16
        resolution: veoResolution,
        durationSeconds: veoDuration,
        stylePreset: veoStyle,
        targetProjectId: veoTargetProjectId,
      };

      const result = await generateVeoVideo(request);

      setVeoProgress(100);
      setVeoStatusText('Render completed! Video attached to project workspace.');
      setGeneratedVeoResult(result);
    } catch (err: any) {
      addNotification(`Veo 3 generation failed: ${err.message}`, 'error');
      setVeoStatusText('Generation failed. Please retry.');
    } finally {
      setIsGeneratingVeo(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Top Header & Workspaces Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Workspace &amp; Project Folders</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {projects.length} Total
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Categorize multi-asset media by Client or Project Type. Organize large production workspaces with atomic migrations.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Veo 3 Video Generator Quick Button */}
          <button
            onClick={() => {
              setVeoTargetProjectId(activeProject.id);
              setShowVeoModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-600 border border-amber-500/30 rounded-md transition-all shadow-sm group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Generate Video (Veo 3)</span>
          </button>

          <button
            onClick={handleOpenCreateFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => setShowSqliteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQLite Schema</span>
          </button>

          <button
            onClick={() => setActivePage('history')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors cursor-pointer"
            title="View automated incremental snapshots and restore previous states"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Version History</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Restore JSON</span>
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>

          <button
            onClick={() => {
              const newProj = createProject('Untitled Production', 'New project workspace', 'km', 'en');
              setActivePage('video-editor');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Workspace Metric & Category Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Projects</span>
            <Film className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {stats.categorized} categorized ({stats.rate}%)
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Client Workspaces</span>
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats.clientFoldersCount} Folders</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {stats.clientProjectsCount} client deliverables
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Project Type Tracks</span>
            <Layers className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats.typeFoldersCount} Workflows</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Social reels, audiobooks &amp; dubbing
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Duration</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {secondsToSrtTimestamp(stats.totalDurationSec)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Across active production timelines
          </div>
        </div>
      </div>

      {/* Main Filter & Navigation Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Categorization Tabs: All / By Client / By Project Type / Uncategorized */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => {
                setActiveCategoryTab('all');
                setSelectedFolderId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategoryTab === 'all' && !selectedFolderId
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>All Projects ({projects.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveCategoryTab('client');
                setSelectedFolderId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategoryTab === 'client'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>By Client ({folders.filter(f => f.categoryType === 'client').length})</span>
            </button>

            <button
              onClick={() => {
                setActiveCategoryTab('project-type');
                setSelectedFolderId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategoryTab === 'project-type'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-pink-300" />
              <span>By Project Type ({folders.filter(f => f.categoryType === 'project-type').length})</span>
            </button>

            <button
              onClick={() => {
                setActiveCategoryTab('uncategorized');
                setSelectedFolderId('__uncategorized__');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategoryTab === 'uncategorized'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Uncategorized ({projects.filter(p => !p.folderId).length})</span>
            </button>
          </div>

          {/* View Mode & Sort Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
              <button
                onClick={() => setViewMode('grouped')}
                title="Grouped by Folder Sections"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
                  viewMode === 'grouped' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Folder Sections</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Standard Grid View"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300">
              <ListFilter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                aria-label="Sort projects by"
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="updated" className="bg-slate-900">Recently Updated</option>
                <option value="name" className="bg-slate-900">Name (A-Z)</option>
                <option value="duration" className="bg-slate-900">Duration</option>
                <option value="subtitles" className="bg-slate-900">Subtitle Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* Folder Pills Bar for instant filtering */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-800/60 pb-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono pr-1 whitespace-nowrap">
            Folder Filter:
          </span>
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`px-2 py-1 rounded text-xs transition-colors whitespace-nowrap ${
              selectedFolderId === null
                ? 'bg-slate-200 text-slate-900 font-semibold'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All ({projects.length})
          </button>

          {folders.map(f => {
            const count = projects.filter(p => p.folderId === f.id).length;
            const isSelected = selectedFolderId === f.id;

            return (
              <div
                key={f.id}
                onClick={() => setSelectedFolderId(isSelected ? null : f.id)}
                className={`group flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border cursor-pointer transition-all whitespace-nowrap ${
                  isSelected 
                    ? 'border-indigo-400 bg-indigo-950/60 text-white' 
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: f.color }} 
                />
                <span className="font-medium">{f.name}</span>
                <span className="text-[10px] font-mono text-slate-400 px-1 rounded bg-slate-900">
                  {count}
                </span>

                {/* Folder options hover button */}
                <button
                  onClick={(e) => handleOpenEditFolder(f, e)}
                  title="Edit Folder"
                  className="opacity-0 group-hover:opacity-100 hover:text-indigo-300 p-0.5 rounded transition-opacity"
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={(e) => handleDeleteFolderConfirm(f.id, e)}
                  title="Delete Folder"
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-opacity"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Search Bar + Batch Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search projects by title, client, type, or tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Multi-Select Select-All toggle */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-800 hover:text-white transition-colors"
            >
              {selectedProjectIds.length === filteredProjects.length && filteredProjects.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Select All ({filteredProjects.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Batch Operations Bar */}
      {selectedProjectIds.length > 0 && (
        <div className="sticky top-2 z-30 bg-indigo-950 border border-indigo-500/50 rounded-lg p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">
              {selectedProjectIds.length} project(s) selected
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Move to Folder dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded px-2 py-1">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Move to:</span>
              <select
                onChange={e => {
                  const val = e.target.value;
                  handleBatchMove(val === '__none__' ? null : val);
                  e.target.value = '';
                }}
                defaultValue=""
                aria-label="Move selected projects to folder"
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="" disabled className="bg-slate-900">Select target folder...</option>
                <option value="__none__" className="bg-slate-900 text-slate-400">Remove from Folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id} className="bg-slate-900">
                    {f.name} ({f.categoryType === 'client' ? 'Client' : 'Workflow'})
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Delete */}
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            {/* Deselect All */}
            <button
              onClick={() => setSelectedProjectIds([])}
              className="text-slate-400 hover:text-white px-2 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Projects Display: Grouped by Folder Sections vs Standard Grid */}
      {viewMode === 'grouped' ? (
        <div className="space-y-6">
          {/* Folders Accordion Sections */}
          {folders.map(folder => {
            const folderProjects = filteredProjects.filter(p => p.folderId === folder.id);
            if (selectedFolderId && selectedFolderId !== folder.id) return null;
            if (activeCategoryTab === 'uncategorized') return null;
            if (activeCategoryTab === 'client' && folder.categoryType !== 'client') return null;
            if (activeCategoryTab === 'project-type' && folder.categoryType !== 'project-type') return null;

            const isCollapsed = Boolean(collapsedFolders[folder.id]);
            const totalDur = folderProjects.reduce((a, b) => a + (b.durationSeconds || 0), 0);

            return (
              <div 
                key={folder.id} 
                className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden transition-all"
              >
                {/* Folder Header */}
                <div 
                  onClick={() => toggleFolderCollapse(folder.id)}
                  className="p-3.5 flex items-center justify-between bg-slate-900/90 hover:bg-slate-800/60 cursor-pointer border-b border-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white p-0.5">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <div 
                      className="w-3.5 h-3.5 rounded flex-shrink-0"
                      style={{ backgroundColor: folder.color }}
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white tracking-tight">
                          {folder.name}
                        </h2>
                        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                          folder.categoryType === 'client'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                        }`}>
                          {folder.categoryType === 'client' ? 'Client' : 'Project Type'}
                        </span>
                        {folder.clientName && folder.categoryType === 'client' && (
                          <span className="text-[11px] text-slate-400">
                            Client: <span className="text-slate-200">{folder.clientName}</span>
                          </span>
                        )}
                      </div>
                      {folder.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {folder.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs" onClick={e => e.stopPropagation()}>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {folderProjects.length} project{folderProjects.length === 1 ? '' : 's'} • {secondsToSrtTimestamp(totalDur)}
                    </span>

                    <button
                      onClick={() => {
                        const newP = createProject(`${folder.name} Project`, `Created inside ${folder.name}`, 'km', 'en');
                        updateProjectMeta(newP.id, {
                          folderId: folder.id,
                          clientName: folder.clientName,
                          projectType: folder.categoryType === 'project-type' ? folder.name : 'Social Video',
                        });
                        setActivePage('video-editor');
                      }}
                      title="Add Project to Folder"
                      className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded transition-colors text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Project</span>
                    </button>

                    <button
                      onClick={(e) => handleOpenEditFolder(folder, e)}
                      title="Edit Folder"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Folder Content / Nested Project Cards */}
                {!isCollapsed && (
                  <div className="p-4">
                    {folderProjects.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                        <FolderOpen className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                        <p>No projects in this folder yet.</p>
                        <button
                          onClick={() => {
                            const newP = createProject(`${folder.name} Item`, '', 'km', 'en');
                            updateProjectMeta(newP.id, { folderId: folder.id, clientName: folder.clientName });
                          }}
                          className="mt-2 text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Create new project here
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {folderProjects.map(proj => renderProjectCard(proj))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Uncategorized Projects Section */}
          {(!selectedFolderId || selectedFolderId === '__uncategorized__') && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
              <div 
                onClick={() => toggleFolderCollapse('__uncategorized__')}
                className="p-3.5 flex items-center justify-between bg-slate-900/90 hover:bg-slate-800/60 cursor-pointer border-b border-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-400 hover:text-white p-0.5">
                    {collapsedFolders['__uncategorized__'] ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <Tag className="w-4 h-4 text-slate-400" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-300 tracking-tight">
                      Unassigned Projects
                    </h2>
                    <p className="text-xs text-slate-500">
                      Projects not currently filed into any client or project type folder.
                    </p>
                  </div>
                </div>

                <span className="text-slate-400 font-mono text-xs">
                  {filteredProjects.filter(p => !p.folderId).length} project(s)
                </span>
              </div>

              {!collapsedFolders['__uncategorized__'] && (
                <div className="p-4">
                  {filteredProjects.filter(p => !p.folderId).length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs">
                      All projects are categorized into folders!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProjects.filter(p => !p.folderId).map(proj => renderProjectCard(proj))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Standard Flat Grid View */
        <div>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-lg">
              <FolderKanban className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-300">No projects match the current filter</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search query or folder selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map(proj => renderProjectCard(proj))}
            </div>
          )}
        </div>
      )}

      {/* SQLite Schema Modal */}
      {showSqliteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">StoryForge Studio SQLite Database Schema &amp; Folder Management</h3>
              </div>
              <button onClick={() => setShowSqliteModal(false)} className="text-slate-400 hover:text-white text-xs">
                Close
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-md font-mono text-xs text-slate-300 overflow-x-auto space-y-2 border border-slate-800">
              <div className="text-slate-500">-- SQLite Project &amp; Folder Repository (Migration Version 4)</div>
              <div>CREATE TABLE SchemaMigrations (Version INTEGER PRIMARY KEY, AppliedAt TEXT NOT NULL);</div>
              <div className="text-emerald-400">CREATE TABLE ProjectFolders (</div>
              <div className="pl-4">Id TEXT PRIMARY KEY,</div>
              <div className="pl-4">Name TEXT NOT NULL,</div>
              <div className="pl-4">CategoryType TEXT NOT NULL, -- 'client', 'project-type', 'custom'</div>
              <div className="pl-4">ClientName TEXT,</div>
              <div className="pl-4">Color TEXT NOT NULL,</div>
              <div className="pl-4">Description TEXT,</div>
              <div className="pl-4">CreatedAt TEXT NOT NULL,</div>
              <div className="pl-4">UpdatedAt TEXT NOT NULL</div>
              <div className="text-emerald-400">);</div>
              <div className="text-indigo-400">CREATE TABLE Projects (</div>
              <div className="pl-4">Id TEXT PRIMARY KEY,</div>
              <div className="pl-4">Name TEXT NOT NULL,</div>
              <div className="pl-4">FolderId TEXT REFERENCES ProjectFolders(Id) ON DELETE SET NULL,</div>
              <div className="pl-4">ClientName TEXT,</div>
              <div className="pl-4">ProjectType TEXT,</div>
              <div className="pl-4">Status TEXT DEFAULT 'in-progress',</div>
              <div className="pl-4">Description TEXT,</div>
              <div className="pl-4">CreatedAt TEXT NOT NULL,</div>
              <div className="pl-4">UpdatedAt TEXT NOT NULL,</div>
              <div className="pl-4">TargetLanguage TEXT,</div>
              <div className="pl-4">SourceLanguage TEXT,</div>
              <div className="pl-4">DurationSeconds REAL,</div>
              <div className="pl-4">JsonData TEXT NOT NULL</div>
              <div className="text-indigo-400">);</div>
              <div>CREATE INDEX idx_projects_folder ON Projects(FolderId);</div>
              <div>CREATE INDEX idx_projects_updated ON Projects(UpdatedAt DESC);</div>
            </div>

            <p className="text-xs text-slate-400">
              The C# .NET 8 desktop application uses Microsoft.Data.Sqlite with foreign-key relationships, client categorizations, and automated migrations.
            </p>
          </div>
        </div>
      )}

      {/* New / Edit Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingFolder ? 'Edit Project Folder' : 'Create New Project Folder'}
                </h3>
              </div>
              <button onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Category Selector */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Categorization Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFolderCategoryInput('client')}
                    className={`flex items-center gap-2 p-2.5 rounded border text-left transition-all ${
                      folderCategoryInput === 'client'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-xs">Client Folder</div>
                      <div className="text-[10px] text-slate-500">By client / sponsor</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFolderCategoryInput('project-type')}
                    className={`flex items-center gap-2 p-2.5 rounded border text-left transition-all ${
                      folderCategoryInput === 'project-type'
                        ? 'border-pink-500 bg-pink-950/40 text-pink-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-pink-400" />
                    <div>
                      <div className="font-semibold text-xs">Project Type</div>
                      <div className="text-[10px] text-slate-500">By workflow format</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Folder Name */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Folder Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder={folderCategoryInput === 'client' ? 'e.g. Acme Media Group' : 'e.g. Short-form Social Reels'}
                  value={folderNameInput}
                  onChange={e => setFolderNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Client Name (if client category) */}
              {folderCategoryInput === 'client' && (
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Media Group"
                    value={folderClientInput}
                    onChange={e => setFolderClientInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Color Picker */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Accent Color</label>
                <div className="flex items-center gap-2">
                  {FOLDER_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFolderColorInput(c.value)}
                      title={c.name}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        folderColorInput === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or deliverables description..."
                  value={folderDescInput}
                  onChange={e => setFolderDescInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFolder}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded"
              >
                {editingFolder ? 'Save Changes' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Veo 3 Video Generator Modal */}
      {showVeoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Google Veo 3 Fast Video Generator</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      veo-3.1-fast-generate-preview
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate production-ready video clips directly into project timelines with Veo 3.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowVeoModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              {/* Target Project Selection */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Project Destination</label>
                <select
                  value={veoTargetProjectId}
                  onChange={e => setVeoTargetProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({getFolderName(p.folderId)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Video Prompt */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Creative Prompt <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={veoPrompt}
                  onChange={e => setVeoPrompt(e.target.value)}
                  placeholder="Describe scene, camera motion, atmosphere, lighting..."
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-sans"
                />

                {/* Prompt Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Presets:</span>
                  {[
                    'Angkor Wat sunrise aerial tracking shot with golden morning mist',
                    'Siem Reap street food night market vertical 9:16 reel with sizzle',
                    'Cyberpunk neon riverside Phnom Penh reflection with light rain',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setVeoPrompt(preset)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap"
                    >
                      {preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Selector: 16:9 or 9:16 (STRICT REQUIREMENT) */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">
                  Aspect Ratio <span className="text-amber-400 font-mono text-[10px]">(veo-3.1-fast-generate-preview)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVeoAspectRatio('16:9')}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                      veoAspectRatio === '16:9'
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="w-8 h-5 border-2 border-current rounded flex items-center justify-center flex-shrink-0 text-[9px] font-mono">
                      16:9
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-200">16:9 Widescreen (Landscape)</div>
                      <div className="text-[10px] text-slate-500">YouTube, Documentaries, Desktop (1920x1080)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVeoAspectRatio('9:16')}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all ${
                      veoAspectRatio === '9:16'
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="w-5 h-8 border-2 border-current rounded flex items-center justify-center flex-shrink-0 text-[9px] font-mono">
                      9:16
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-200">9:16 Vertical (Portrait)</div>
                      <div className="text-[10px] text-slate-500">TikTok, Instagram Reels, Shorts (1080x1920)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Style, Resolution, and Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Visual Style</label>
                  <select
                    value={veoStyle}
                    onChange={e => setVeoStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Cinematic Documentary">Cinematic Documentary</option>
                    <option value="Hyperrealistic 4K">Hyperrealistic 4K</option>
                    <option value="Cyberpunk Neon">Cyberpunk Neon</option>
                    <option value="Vintage 35mm Film">Vintage 35mm Film</option>
                    <option value="Dramatic Studio Lighting">Dramatic Studio Lighting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Resolution</label>
                  <select
                    value={veoResolution}
                    onChange={e => setVeoResolution(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Duration: <span className="text-white font-mono">{veoDuration}s</span>
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={10}
                    step={1}
                    value={veoDuration}
                    onChange={e => setVeoDuration(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer mt-1"
                  />
                </div>
              </div>

              {/* Generation Progress or Result */}
              {isGeneratingVeo && (
                <div className="bg-slate-950 border border-amber-500/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-300">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>{veoStatusText}</span>
                    </span>
                    <span className="font-mono">{veoProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${veoProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completed Video Preview */}
              {generatedVeoResult && (
                <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-lg p-3 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="flex items-center gap-1.5 font-semibold text-xs">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Veo 3 Video Ready: {generatedVeoResult.mediaFile.name}</span>
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      {veoAspectRatio} • {generatedVeoResult.mediaFile.duration}s
                    </span>
                  </div>

                  <div className="aspect-video bg-black rounded overflow-hidden max-h-48 flex items-center justify-center border border-slate-800">
                    <video
                      src={generatedVeoResult.mediaFile.url}
                      controls
                      autoPlay
                      muted
                      className="max-h-full max-w-full"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        const target = projects.find(p => p.id === veoTargetProjectId);
                        if (target) {
                          setActiveProject(target);
                          setActivePage('video-editor');
                        }
                        setShowVeoModal(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                    >
                      <span>Open in Video Editor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-500 font-mono">
                Model: veo-3.1-fast-generate-preview • Output: {veoAspectRatio}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVeoModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isGeneratingVeo}
                  onClick={handleRunVeoGeneration}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded shadow-md transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingVeo ? 'Generating Video...' : 'Generate with Veo 3'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render individual project card
  function renderProjectCard(proj: Project) {
    const isActive = proj.id === activeProject.id;
    const isEditing = editingId === proj.id;
    const isSelected = selectedProjectIds.includes(proj.id);
    const folder = folders.find(f => f.id === proj.folderId);
    const folderColor = getFolderColor(proj.folderId);

    return (
      <div
        key={proj.id}
        className={`rounded-lg border p-4 flex flex-col justify-between transition-all relative ${
          isActive 
            ? 'bg-indigo-950/25 border-indigo-500/60 shadow-lg shadow-indigo-950/20' 
            : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
        } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
      >
        <div>
          {/* Card Top Badges & Select Checkbox */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleSelect(proj.id)}
                className="text-slate-400 hover:text-white"
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600" />
                )}
              </button>

              {/* Folder Badge */}
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border"
                style={{ 
                  backgroundColor: `${folderColor}15`, 
                  borderColor: `${folderColor}40`,
                  color: folderColor 
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folderColor }} />
                <span>{folder?.name || 'Unassigned'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {proj.sourceLanguage.toUpperCase()} → {proj.targetLanguage.toUpperCase()}
              </span>
              {isActive && (
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Project Title / Inline Editing */}
          {isEditing ? (
            <div className="flex items-center gap-1.5 mb-2">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="flex-1 bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-xs text-white"
                autoFocus
              />
              <button
                onClick={() => handleSaveRename(proj.id)}
                className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3
              onDoubleClick={() => handleStartRename(proj)}
              className="text-sm font-bold text-white mb-1.5 truncate cursor-pointer hover:text-indigo-300 transition-colors"
              title="Double click to rename"
            >
              {proj.name}
            </h3>
          )}

          {/* Client & Project Type Sub-pills */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {proj.clientName && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                <Building2 className="w-2.5 h-2.5 text-emerald-400" />
                <span className="truncate max-w-[120px]">{proj.clientName}</span>
              </span>
            )}
            {proj.projectType && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                <Tag className="w-2.5 h-2.5 text-pink-400" />
                <span>{proj.projectType}</span>
              </span>
            )}
            {proj.status && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                proj.status === 'completed' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : proj.status === 'review'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {proj.status}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {proj.description || 'No description added yet.'}
          </p>

          {/* Project Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-[11px] font-mono text-slate-400 mb-3">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Duration</span>
              <span className="text-slate-200">{secondsToSrtTimestamp(proj.durationSeconds)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Subtitles</span>
              <span className="text-slate-200">{proj.subtitles.length} lines</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Media</span>
              <span className="text-slate-200">{proj.mediaFiles.length} file{proj.mediaFiles.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="space-y-2 pt-1">
          {/* Change Folder Dropdown */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-slate-500">Folder:</span>
            <select
              value={proj.folderId || ''}
              onChange={e => {
                const newFolderId = e.target.value ? e.target.value : null;
                moveProjectToFolder(proj.id, newFolderId);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[160px] truncate"
            >
              <option value="">Unassigned</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => {
                setActiveProject(proj);
                setActivePage('video-editor');
              }}
              className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>Open Editor</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <div className="flex items-center gap-1">
              {/* Quick Veo 3 Generator button for this project */}
              <button
                onClick={() => {
                  setVeoTargetProjectId(proj.id);
                  setShowVeoModal(true);
                }}
                title="Generate Video Clip for this project with Veo 3"
                className="p-1.5 text-amber-400 hover:text-amber-200 hover:bg-slate-800 rounded transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleBackup(proj)}
                title="Export Backup ZIP"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => duplicateProject(proj.id)}
                title="Duplicate Project"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => deleteProject(proj.id)}
                title="Delete Project"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
