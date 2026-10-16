import React, { useState, useMemo, useRef } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  History, 
  RotateCcw, 
  Download, 
  Upload, 
  Cloud, 
  CloudCheck, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sliders, 
  FolderKanban, 
  FileText, 
  Subtitles, 
  Film, 
  MessageSquare, 
  Layers, 
  Copy, 
  RefreshCw, 
  Sparkles,
  Info,
  Calendar,
  X,
  FileCode,
  Check
} from 'lucide-react';
import { 
  ProjectSnapshot, 
  SnapshotTriggerType, 
  Project 
} from '../../types/studio';
import { 
  formatBytes, 
  exportSnapshotJson, 
  exportAllSnapshotsJson 
} from '../../services/backupService';

export const VersionHistoryTab: React.FC = () => {
  const { 
    projects, 
    activeProject, 
    snapshots, 
    backupSettings, 
    updateBackupSettings, 
    createSnapshot, 
    restoreSnapshot, 
    deleteSnapshot, 
    syncSnapshotToCloud, 
    importSnapshotFromJson, 
    lastAutoBackupTime, 
    addNotification 
  } = useStudio();

  // Filters & Search
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTrigger, setFilterTrigger] = useState<string>('all');
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);

  // Manual Checkpoint Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualLabel, setManualLabel] = useState<string>('');
  const [manualDestination, setManualDestination] = useState<'both' | 'local' | 'cloud'>('both');

  // Preview & Comparison Modal
  const [inspectSnapshot, setInspectSnapshot] = useState<ProjectSnapshot | null>(null);

  // Restore Confirmation Modal
  const [confirmRestoreSnap, setConfirmRestoreSnap] = useState<ProjectSnapshot | null>(null);

  // Hidden file input for backup JSON upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Snapshots
  const filteredSnapshots = useMemo(() => {
    return snapshots
      .filter(snap => {
        const matchesProject = selectedProjectId === 'all' || snap.projectId === selectedProjectId;
        const matchesTrigger = filterTrigger === 'all' || snap.trigger === filterTrigger;
        const matchesSearch = !searchQuery.trim() || 
          snap.versionTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
          snap.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (snap.label && snap.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (snap.summary.changesDetected && snap.summary.changesDetected.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));

        return matchesProject && matchesTrigger && matchesSearch;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [snapshots, selectedProjectId, filterTrigger, searchQuery]);

  // Total backup storage used
  const totalSizeBytes = useMemo(() => {
    return snapshots.reduce((acc, s) => acc + (s.summary.sizeBytes || 0), 0);
  }, [snapshots]);

  // Handle Manual Snapshot Creation
  const handleCreateManualSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    createSnapshot(
      activeProject.id,
      manualLabel.trim() || 'Manual user checkpoint',
      'manual',
      manualDestination
    );
    setManualLabel('');
    setIsManualModalOpen(false);
  };

  // Handle Import from File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importSnapshotFromJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Format relative timestamp
  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 45) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  // Trigger Badge Colors & Labels
  const getTriggerMeta = (trigger: SnapshotTriggerType) => {
    switch (trigger) {
      case 'automated':
        return { label: 'Auto Incremental', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'manual':
        return { label: 'Manual Checkpoint', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'milestone':
        return { label: 'Milestone Stage', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      case 'restore_point':
        return { label: 'Pre-Restore Safety', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'export':
        return { label: 'Pre-Export Archive', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
      default:
        return { label: 'Snapshot', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Automated Incremental Version Control
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  backupSettings.autoBackupEnabled 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${backupSettings.autoBackupEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {backupSettings.autoBackupEnabled ? `Auto-Save Active (${backupSettings.intervalSeconds}s)` : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Periodically preserves project snapshots to local browser storage and cloud storage for zero-data-loss rollback.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Checkpoint</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Import and restore a previously exported snapshot JSON file"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import Backup</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => exportAllSnapshotsJson(snapshots)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download master JSON backup of all project versions"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export All ({snapshots.length})</span>
            </button>

            <button
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className={`p-1.5 rounded border text-xs transition-colors cursor-pointer ${
                showConfigDrawer 
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
              title="Configure auto-save interval and backup settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">TOTAL SNAPSHOTS</span>
            <span className="text-base font-bold text-white">{snapshots.length} Versions</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Across {projects.length} projects</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">STORAGE OCCUPIED</span>
            <span className="text-base font-bold text-indigo-400">{formatBytes(totalSizeBytes)}</span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">&lt; 1% localStorage quota</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">LATEST BACKUP</span>
            <span className="text-base font-bold text-white">
              {lastAutoBackupTime ? formatRelativeTime(lastAutoBackupTime) : 'None'}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {lastAutoBackupTime ? new Date(lastAutoBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Standby'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">CLOUD STATUS</span>
            <span className="text-base font-bold text-emerald-400 flex items-center gap-1">
              <CloudCheck className="w-4 h-4" />
              Synced
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Google Cloud Storage Active</span>
          </div>
        </div>

        {/* Configuration Drawer (Expandable) */}
        {showConfigDrawer && (
          <div className="p-4 rounded-lg bg-slate-950/90 border border-indigo-500/30 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                AUTOMATED BACKUP &amp; RETENTION POLICIES
              </span>
              <button
                onClick={() => setShowConfigDrawer(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Toggle Auto Backup */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Automatic Interval Backup</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoBackupToggle"
                    checked={backupSettings.autoBackupEnabled}
                    onChange={(e) => updateBackupSettings({ autoBackupEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="autoBackupToggle" className="text-slate-400 cursor-pointer text-[11px]">
                    {backupSettings.autoBackupEnabled ? 'Enabled (Auto-detects changes)' : 'Disabled'}
                  </label>
                </div>
              </div>

              {/* Interval Selection */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Auto-Save Frequency</label>
                <select
                  value={backupSettings.intervalSeconds}
                  onChange={(e) => updateBackupSettings({ intervalSeconds: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                >
                  <option value={30}>Every 30 seconds</option>
                  <option value={60}>Every 1 minute (Recommended)</option>
                  <option value={120}>Every 2 minutes</option>
                  <option value={300}>Every 5 minutes</option>
                  <option value={600}>Every 10 minutes</option>
                </select>
              </div>

              {/* Max Snapshots Retention */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Retention Buffer Limit</label>
                <select
                  value={backupSettings.maxSnapshotsPerProject}
                  onChange={(e) => updateBackupSettings({ maxSnapshotsPerProject: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                >
                  <option value={10}>Last 10 snapshots / project</option>
                  <option value={20}>Last 20 snapshots / project</option>
                  <option value={35}>Last 35 snapshots / project</option>
                  <option value={50}>Last 50 snapshots / project</option>
                </select>
              </div>

              {/* Cloud Sync */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-medium">Cloud Redundancy Sync</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cloudSyncToggle"
                    checked={backupSettings.cloudSyncEnabled}
                    onChange={(e) => updateBackupSettings({ cloudSyncEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="cloudSyncToggle" className="text-slate-400 cursor-pointer text-[11px]">
                    Sync copies to Cloud Storage
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Project Selector Filter */}
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-indigo-400" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="all">All Projects ({snapshots.length} versions)</option>
            {projects.map(p => {
              const count = snapshots.filter(s => s.projectId === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.name} ({count}) {p.id === activeProject?.id ? '★ Active' : ''}
                </option>
              );
            })}
          </select>

          {/* Trigger filter pills */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            {[
              { id: 'all', label: 'All Triggers' },
              { id: 'automated', label: 'Automated' },
              { id: 'manual', label: 'Manual' },
              { id: 'milestone', label: 'Milestones' },
              { id: 'restore_point', label: 'Pre-Restore' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTrigger(tab.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  filterTrigger === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search version tag, note, or diff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Snapshot Cards List */}
      <div className="space-y-3">
        {filteredSnapshots.length === 0 ? (
          <div className="p-8 bg-slate-900/60 rounded-xl border border-slate-800 text-center space-y-3">
            <History className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">No Version Snapshots Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No previous project states match your active filter. Create a manual checkpoint or keep auto-save enabled while working.
            </p>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Create First Checkpoint
            </button>
          </div>
        ) : (
          filteredSnapshots.map(snap => {
            const triggerMeta = getTriggerMeta(snap.trigger);
            const isCurrentlyActiveProj = snap.projectId === activeProject?.id;

            return (
              <div
                key={snap.id}
                className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/90 rounded-xl p-4 sm:p-5 transition-all shadow-xs space-y-3.5 group"
              >
                {/* Snapshot Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono font-extrabold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {snap.versionTag}
                    </span>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${triggerMeta.color}`}>
                      {triggerMeta.label}
                    </span>

                    {snap.cloudSynced ? (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20" title="Synchronized to Cloud Storage">
                        <CloudCheck className="w-3 h-3" />
                        <span>Cloud Synced</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => syncSnapshotToCloud(snap.id)}
                        className="text-[10px] font-mono text-slate-400 hover:text-indigo-400 flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 transition-colors cursor-pointer"
                        title="Upload copy to Cloud Storage"
                      >
                        <Cloud className="w-3 h-3" />
                        <span>Push to Cloud</span>
                      </button>
                    )}

                    <span className="text-xs text-slate-400 font-medium">
                      Project: <span className="text-slate-200 font-semibold">{snap.projectName}</span>
                      {isCurrentlyActiveProj && (
                        <span className="ml-1 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-mono">
                          Active Target
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Timestamp & Size */}
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1" title={new Date(snap.timestamp).toLocaleString()}>
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatRelativeTime(snap.timestamp)}</span>
                    </span>
                    <span className="text-slate-600">·</span>
                    <span>{formatBytes(snap.summary.sizeBytes)}</span>
                  </div>
                </div>

                {/* Label & Detected Changes Box */}
                <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      {snap.label || 'Checkpoint state'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(snap.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Detected Incremental Changes */}
                  {snap.summary.changesDetected && snap.summary.changesDetected.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      {snap.summary.changesDetected.map((change, idx) => (
                        <span key={idx} className="bg-slate-900 text-indigo-300 border border-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>{change}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* State Content Metrics Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px] font-mono text-slate-400 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{snap.summary.subtitleCount} Subtitles</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{snap.summary.transcriptCount} Transcripts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{snap.summary.mediaCount} Media Files</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                      <span>{snap.summary.commentCount} Notes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>{snap.summary.milestoneCount} Milestones</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {/* Primary Restore Button */}
                    <button
                      onClick={() => setConfirmRestoreSnap(snap)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Roll back active project state to this version (with automatic pre-restore safety checkpoint)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore This Version</span>
                    </button>

                    {/* Preview / Compare Button */}
                    <button
                      onClick={() => setInspectSnapshot(snap)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Compare &amp; Inspect</span>
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportSnapshotJson(snap)}
                      className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
                      title="Download snapshot as JSON file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteSnapshot(snap.id)}
                      className="p-1.5 rounded bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800/60 transition-colors cursor-pointer"
                      title="Delete this snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =========================================================================
          MODAL 1: CREATE MANUAL CHECKPOINT
         ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Create Project Checkpoint</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualSnapshot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Checkpoint Name / Note
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Before Khmer TTS Voiceover Pass"
                  value={manualLabel}
                  onChange={(e) => setManualLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Storage Destination
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  {(['both', 'local', 'cloud'] as const).map(dest => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => setManualDestination(dest)}
                      className={`p-2 rounded border text-center capitalize transition-colors cursor-pointer ${
                        manualDestination === dest
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {dest === 'both' ? 'Local + Cloud' : dest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>Target: <strong className="text-slate-200">{activeProject?.name}</strong></div>
                <div>Subtitles: {activeProject?.subtitles.length || 0} segments</div>
                <div>Estimated snapshot size: ~{formatBytes(calculateProjectSizeBytes(activeProject))}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow cursor-pointer"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CONFIRM RESTORE VERSION
         ========================================================================= */}
      {confirmRestoreSnap && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Restore Version {confirmRestoreSnap.versionTag}?</h3>
              </div>
              <button
                onClick={() => setConfirmRestoreSnap(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                You are about to roll back the project state for{' '}
                <strong className="text-white">"{confirmRestoreSnap.projectName}"</strong> to{' '}
                <strong className="text-indigo-400">{confirmRestoreSnap.versionTag}</strong>, saved on{' '}
                <span className="font-mono">{new Date(confirmRestoreSnap.timestamp).toLocaleString()}</span>.
              </p>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-[11px] font-mono">
                <div className="text-slate-400 font-semibold uppercase">STATE TO BE RESTORED:</div>
                <div className="text-slate-300">· Subtitles: {confirmRestoreSnap.summary.subtitleCount} segments</div>
                <div className="text-slate-300">· Transcripts: {confirmRestoreSnap.summary.transcriptCount} segments</div>
                <div className="text-slate-300">· Media Files: {confirmRestoreSnap.summary.mediaCount} items</div>
                <div className="text-slate-300">· Note/Label: {confirmRestoreSnap.label}</div>
              </div>

              {/* Safety guarantee notification */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Safety First Guarantee:</strong> An automatic pre-restore safety checkpoint of your current live state will be created immediately before rollback, so you can re-restore back at any time.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setConfirmRestoreSnap(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  restoreSnapshot(confirmRestoreSnap.id);
                  setConfirmRestoreSnap(null);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold shadow flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm &amp; Rollback</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: COMPARE & INSPECT STATE SIDE-BY-SIDE
         ========================================================================= */}
      {inspectSnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    State Inspector: {inspectSnapshot.versionTag}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {inspectSnapshot.projectName} · {new Date(inspectSnapshot.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectSnapshot(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Snapshot Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Trigger</span>
                  <span className="font-bold text-white capitalize">{inspectSnapshot.trigger}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Subtitles</span>
                  <span className="font-bold text-white">{inspectSnapshot.summary.subtitleCount}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Transcripts</span>
                  <span className="font-bold text-white">{inspectSnapshot.summary.transcriptCount}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Storage</span>
                  <span className="font-bold text-white">{formatBytes(inspectSnapshot.summary.sizeBytes)}</span>
                </div>
              </div>

              {/* Subtitles Preview in Snapshot */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-white uppercase font-mono">
                  Sample Subtitles in this Snapshot ({inspectSnapshot.projectData.subtitles?.length || 0})
                </div>
                <div className="max-h-48 overflow-y-auto bg-slate-950 rounded-lg border border-slate-800 divide-y divide-slate-800/80 p-2 font-mono text-[11px]">
                  {(inspectSnapshot.projectData.subtitles || []).map((sub, idx) => (
                    <div key={idx} className="py-1.5 px-2 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-indigo-400 font-semibold mr-2">#{idx + 1}</span>
                        <span className="text-slate-200">{sub.text}</span>
                      </div>
                      <span className="text-slate-500 shrink-0">
                        {sub.startSeconds}s - {sub.endSeconds}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transcript Preview */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-white uppercase font-mono">
                  Transcript Segments ({inspectSnapshot.projectData.transcript?.length || 0})
                </div>
                <div className="max-h-40 overflow-y-auto bg-slate-950 rounded-lg border border-slate-800 divide-y divide-slate-800/80 p-2 font-mono text-[11px]">
                  {(inspectSnapshot.projectData.transcript || []).map((t, idx) => (
                    <div key={idx} className="py-1.5 px-2">
                      <span className="text-amber-400 font-semibold mr-2">[{t.speaker}]</span>
                      <span className="text-slate-300">{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => exportSnapshotJson(inspectSnapshot)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Snapshot JSON</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectSnapshot(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const target = inspectSnapshot;
                    setInspectSnapshot(null);
                    setConfirmRestoreSnap(target);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore This State</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for local estimate
function calculateProjectSizeBytes(proj?: Project): number {
  if (!proj) return 15000;
  try {
    return new Blob([JSON.stringify(proj)]).size;
  } catch {
    return 18000;
  }
}
