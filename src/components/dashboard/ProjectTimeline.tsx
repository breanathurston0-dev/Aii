import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Project, 
  ProjectMilestone, 
  MilestoneStage, 
  PageId 
} from '../../types/studio';
import { 
  Calendar, 
  Clock, 
  Flag, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Filter, 
  Sparkles, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Film, 
  BookOpen, 
  Layers, 
  Subtitles, 
  Languages, 
  Volume2, 
  Eye, 
  DownloadCloud, 
  Target, 
  RotateCcw, 
  Check, 
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Edit2
} from 'lucide-react';

interface ProjectTimelineProps {
  onOpenProjectEditor?: (project: Project, page: PageId) => void;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ onOpenProjectEditor }) => {
  const { 
    projects, 
    activeProject, 
    setActiveProject, 
    setActivePage,
    folders,
    updateProjectDeadline,
    updateProjectStartDate,
    toggleMilestone,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    autoGenerateProjectMilestones,
    addNotification
  } = useStudio();

  // Timeline Scale & Range State
  const [zoomDays, setZoomDays] = useState<number>(30); // 14, 30, 60
  const [timelineStartOffsetDays, setTimelineStartOffsetDays] = useState<number>(-7); // Start 7 days before today
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Selected Milestone for detail popover / inspection
  const [selectedMilestone, setSelectedMilestone] = useState<{
    project: Project;
    milestone: ProjectMilestone;
    xPos: number;
    yPos: number;
  } | null>(null);

  // Modal State for Adding / Editing Milestone
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState<boolean>(false);
  const [targetProjectId, setTargetProjectId] = useState<string>(activeProject?.id || projects[0]?.id || '');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<string>('');
  const [newMilestoneStage, setNewMilestoneStage] = useState<MilestoneStage>('subtitles');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [newMilestoneNotes, setNewMilestoneNotes] = useState<string>('');

  // Inline Deadline Editing State
  const [editingDeadlineProjectId, setEditingDeadlineProjectId] = useState<string | null>(null);
  const [inlineDeadlineDate, setInlineDeadlineDate] = useState<string>('');

  // Horizontal Scroll Container Ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Time calculations
  const now = useMemo(() => new Date(), []);
  const todayTimestamp = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [now]);

  // Determine timeline range: start date & end date based on offset & zoomDays
  const { timelineStartDate, timelineEndDate, totalTimelineDays, dayColumns } = useMemo(() => {
    const start = new Date(todayTimestamp + timelineStartOffsetDays * 86400000);
    start.setHours(0, 0, 0, 0);

    const daysCount = zoomDays;
    const end = new Date(start.getTime() + daysCount * 86400000);
    end.setHours(23, 59, 59, 999);

    const cols: { date: Date; dateStr: string; dayNum: number; dayLabel: string; isToday: boolean; isWeekend: boolean }[] = [];
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const isToday = d.getTime() === todayTimestamp;
      const dayOfWeek = d.getDay();
      cols.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    return {
      timelineStartDate: start,
      timelineEndDate: end,
      totalTimelineDays: daysCount,
      dayColumns: cols,
    };
  }, [todayTimestamp, timelineStartOffsetDays, zoomDays]);

  // Center on today on initial mount
  const handleJumpToToday = () => {
    setTimelineStartOffsetDays(-5);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 160, behavior: 'smooth' });
    }
  };

  const handlePanLeft = () => {
    setTimelineStartOffsetDays(prev => prev - 7);
  };

  const handlePanRight = () => {
    setTimelineStartOffsetDays(prev => prev + 7);
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'overdue') {
          const isOverdue = p.deadline && new Date(p.deadline).getTime() < todayTimestamp && p.status !== 'completed';
          const hasOverdueMilestone = p.milestones?.some(
            m => !m.completed && new Date(m.dueDate).getTime() < todayTimestamp
          );
          if (!isOverdue && !hasOverdueMilestone) return false;
        } else if (p.status !== statusFilter) {
          return false;
        }
      }

      // Folder filter
      if (folderFilter !== 'all') {
        if (p.folderId !== folderFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesClient = p.clientName?.toLowerCase().includes(q);
        const matchesType = p.projectType?.toLowerCase().includes(q);
        const matchesMilestone = p.milestones?.some(m => m.title.toLowerCase().includes(q));
        if (!matchesName && !matchesClient && !matchesType && !matchesMilestone) return false;
      }

      return true;
    });
  }, [projects, statusFilter, folderFilter, searchQuery, todayTimestamp]);

  // Timeline Statistics
  const timelineStats = useMemo(() => {
    let totalMilestones = 0;
    let completedMilestones = 0;
    let overdueMilestones = 0;
    let upcomingMilestonesCount = 0;
    let nextDeadlines: { project: Project; daysUntil: number }[] = [];

    projects.forEach(p => {
      if (p.milestones) {
        totalMilestones += p.milestones.length;
        p.milestones.forEach(m => {
          if (m.completed) {
            completedMilestones++;
          } else {
            const dueTime = new Date(m.dueDate).getTime();
            if (dueTime < todayTimestamp) {
              overdueMilestones++;
            } else if (dueTime <= todayTimestamp + 86400000 * 7) {
              upcomingMilestonesCount++;
            }
          }
        });
      }

      if (p.deadline) {
        const dTime = new Date(p.deadline).getTime();
        const diffDays = Math.ceil((dTime - todayTimestamp) / 86400000);
        if (p.status !== 'completed') {
          nextDeadlines.push({ project: p, daysUntil: diffDays });
        }
      }
    });

    nextDeadlines.sort((a, b) => a.daysUntil - b.daysUntil);

    const completionRate = totalMilestones > 0 
      ? Math.round((completedMilestones / totalMilestones) * 100) 
      : 0;

    return {
      totalMilestones,
      completedMilestones,
      overdueMilestones,
      upcomingMilestonesCount,
      nextDeadline: nextDeadlines[0] || null,
      completionRate,
    };
  }, [projects, todayTimestamp]);

  // Stage Icon and Colors
  const getStageIcon = (stage: MilestoneStage) => {
    switch (stage) {
      case 'script': return BookOpen;
      case 'transcription': return Layers;
      case 'subtitles': return Subtitles;
      case 'translation': return Languages;
      case 'voiceover': return Volume2;
      case 'review': return Eye;
      case 'export': return DownloadCloud;
      default: return Target;
    }
  };

  const getStageLabel = (stage: MilestoneStage) => {
    switch (stage) {
      case 'script': return 'Story Script';
      case 'transcription': return 'Whisper STT';
      case 'subtitles': return 'Subtitles & Timing';
      case 'translation': return 'Translation';
      case 'voiceover': return 'TTS Voiceover';
      case 'review': return 'Editorial Review';
      case 'export': return 'Final Export';
      default: return stage;
    }
  };

  const getFolderColor = (folderId?: string | null) => {
    if (!folderId) return '#6366f1';
    const folder = folders.find(f => f.id === folderId);
    return folder?.color || '#6366f1';
  };

  // Convert a date to percentage position along the horizontal scale
  const getDatePercentage = (dateStr: string) => {
    const time = new Date(dateStr).getTime();
    const startTime = timelineStartDate.getTime();
    const endTime = timelineEndDate.getTime();
    const totalDuration = endTime - startTime;

    if (totalDuration <= 0) return 0;
    const offset = time - startTime;
    const pct = (offset / totalDuration) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  // Calculate Today position percentage
  const todayPercentage = useMemo(() => {
    return getDatePercentage(new Date(todayTimestamp + 43200000).toISOString());
  }, [todayTimestamp, timelineStartDate, timelineEndDate]);

  // Save inline deadline
  const handleSaveInlineDeadline = (projectId: string) => {
    if (inlineDeadlineDate) {
      updateProjectDeadline(projectId, new Date(inlineDeadlineDate).toISOString());
      setEditingDeadlineProjectId(null);
    }
  };

  // Submit new milestone
  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !targetProjectId) return;

    addMilestone(targetProjectId, {
      title: newMilestoneTitle.trim(),
      stage: newMilestoneStage,
      dueDate: new Date(newMilestoneDueDate).toISOString(),
      completed: false,
      notes: newMilestoneNotes.trim() || undefined,
    });

    setIsAddMilestoneOpen(false);
    setNewMilestoneTitle('');
    setNewMilestoneNotes('');
  };

  // Quick preset suggestions for adding milestones
  const milestonePresets: { title: string; stage: MilestoneStage }[] = [
    { title: 'Khmer Subtitle Timing & Font Verification', stage: 'subtitles' },
    { title: 'AI Story Synopsis & Scene Character Script', stage: 'script' },
    { title: 'Dual-Speaker Natural TTS Voiceover', stage: 'voiceover' },
    { title: 'Bilingual Review with Client Committee', stage: 'review' },
    { title: 'FFmpeg 4K Master MP4 Delivery', stage: 'export' },
  ];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-lg relative">
      {/* =========================================================================
          SECTION 1: HEADER & STATS SUMMARY BANNER
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 font-mono">
                Project Timeline &amp; Milestones
              </h2>
              <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono uppercase font-semibold">
                Interactive Gantt Scale
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize deadlines, track progress stages, and interact with production milestones across all workspaces.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setTargetProjectId(activeProject?.id || projects[0]?.id || '');
              setIsAddMilestoneOpen(true);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </button>

          {activeProject && (
            <button
              onClick={() => autoGenerateProjectMilestones(activeProject.id)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Automatically generate standard 5-stage milestones for active project"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Auto Pipeline:</span>
              <span className="text-indigo-300 font-semibold truncate max-w-[120px]">{activeProject.name}</span>
            </button>
          )}

          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
            title="Recenter timeline view on Today"
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* KPI Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: Milestone Completion Rate */}
        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/90 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Milestone Progress</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">
                {timelineStats.completedMilestones}/{timelineStats.totalMilestones}
              </span>
              <span className="text-xs font-semibold text-emerald-400 font-mono">
                ({timelineStats.completionRate}%)
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 2: Next Critical Deadline */}
        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/90 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Next Deadline</div>
            <div className="flex items-baseline gap-1 mt-0.5 truncate">
              {timelineStats.nextDeadline ? (
                <>
                  <span className={`text-base font-bold font-mono ${
                    timelineStats.nextDeadline.daysUntil < 0 ? 'text-rose-400' :
                    timelineStats.nextDeadline.daysUntil <= 2 ? 'text-amber-400' : 'text-slate-200'
                  }`}>
                    {timelineStats.nextDeadline.daysUntil < 0 
                      ? `${Math.abs(timelineStats.nextDeadline.daysUntil)}d overdue` 
                      : timelineStats.nextDeadline.daysUntil === 0 
                      ? 'Due today!' 
                      : `In ${timelineStats.nextDeadline.daysUntil} days`}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate block max-w-[100px]">
                    · {timelineStats.nextDeadline.project.name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-500">None scheduled</span>
              )}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Target className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 3: Due This Week */}
        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/90 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Due This Week</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-indigo-300 font-mono tabular-nums">
                {timelineStats.upcomingMilestonesCount}
              </span>
              <span className="text-xs text-slate-400 font-mono">milestones</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 4: Overdue Alert */}
        <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/90 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Attention Needed</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-xl font-extrabold font-mono tabular-nums ${
                timelineStats.overdueMilestones > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {timelineStats.overdueMilestones}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {timelineStats.overdueMilestones > 0 ? 'overdue items' : 'all on-track'}
              </span>
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            timelineStats.overdueMilestones > 0 
              ? 'bg-rose-500/15 border border-rose-500/40 text-rose-400 animate-pulse' 
              : 'bg-slate-800 border border-slate-700 text-slate-500'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: TIMELINE SCALE CONTROLS & FILTERS
         ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
        {/* Left: Search & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects or milestones..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-48 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="in-progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue / Critical</option>
          </select>

          {/* Folder Filter */}
          <select
            value={folderFilter}
            onChange={e => setFolderFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Folders / Clients</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.categoryType})
              </option>
            ))}
          </select>
        </div>

        {/* Right: Scale Window / Zoom Selector & Pan Buttons */}
        <div className="flex items-center gap-2">
          {/* Pan Navigation */}
          <div className="flex items-center bg-slate-900 rounded-md border border-slate-800 p-0.5">
            <button
              onClick={handlePanLeft}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Pan 1 week backward"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-2 select-none">
              {timelineStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {timelineEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <button
              onClick={handlePanRight}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
              title="Pan 1 week forward"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Presets */}
          <div className="flex items-center bg-slate-900 rounded-md border border-slate-800 p-0.5 text-xs font-mono">
            {[
              { days: 14, label: '14D' },
              { days: 30, label: '30D' },
              { days: 60, label: '60D' },
            ].map(z => (
              <button
                key={z.days}
                onClick={() => setZoomDays(z.days)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  zoomDays === z.days
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: THE INTERACTIVE HORIZONTAL SCALE CANVAS
         ========================================================================= */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/90 relative shadow-inner"
        style={{ minHeight: '380px' }}
      >
        <div style={{ minWidth: `${Math.max(900, zoomDays * 36)}px` }} className="relative select-none">
          {/* Header Row: Dates Ruler */}
          <div className="flex border-b border-slate-800/80 sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm">
            {/* Left Header Corner (Project Info Column) */}
            <div className="w-72 shrink-0 p-3 border-r border-slate-800/80 flex items-center justify-between text-xs font-mono font-bold text-slate-400 uppercase tracking-wider bg-slate-950">
              <span>Workspaces ({filteredProjects.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Progress &amp; Deadline</span>
            </div>

            {/* Right Horizontal Date Scale Header */}
            <div className="flex-1 flex relative">
              {dayColumns.map((col, idx) => (
                <div
                  key={idx}
                  className={`flex-1 border-r border-slate-800/40 py-2 px-1 text-center flex flex-col items-center justify-center transition-colors ${
                    col.isToday 
                      ? 'bg-indigo-950/40 border-r-indigo-500/30' 
                      : col.isWeekend 
                      ? 'bg-slate-900/40' 
                      : ''
                  }`}
                >
                  <span className={`text-[10px] font-mono uppercase ${
                    col.isToday ? 'text-indigo-400 font-bold' : 'text-slate-500'
                  }`}>
                    {col.dayLabel}
                  </span>
                  <span className={`text-xs font-mono font-bold ${
                    col.isToday 
                      ? 'text-white bg-indigo-600 w-5 h-5 rounded-full flex items-center justify-center shadow-xs' 
                      : 'text-slate-300'
                  }`}>
                    {col.dayNum}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today Indicator Line (Spanning Full Height of Chart) */}
          <div 
            className="absolute top-0 bottom-0 z-10 pointer-events-none flex flex-col items-center"
            style={{ 
              left: `calc(18rem + ${todayPercentage}% * (100% - 18rem) / 100)`,
            }}
          >
            {/* Glowing today line */}
            <div className="w-0.5 h-full bg-gradient-to-b from-indigo-500 via-indigo-500/80 to-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          </div>

          {/* Project Track Rows */}
          <div className="divide-y divide-slate-800/60 relative">
            {filteredProjects.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs font-mono">
                No projects match current timeline filters.
              </div>
            ) : (
              filteredProjects.map(proj => {
                const isActive = proj.id === activeProject?.id;
                const folderColor = getFolderColor(proj.folderId);
                const folder = folders.find(f => f.id === proj.folderId);
                
                // Start date & deadline percentages
                const projStartPct = getDatePercentage(proj.startDate || proj.createdAt);
                const projDeadlinePct = getDatePercentage(proj.deadline || new Date(Date.now() + 86400000 * 5).toISOString());
                const barLeft = Math.min(projStartPct, projDeadlinePct);
                const barWidth = Math.max(2, Math.abs(projDeadlinePct - projStartPct));

                // Milestone calculations
                const milestones = proj.milestones || [];
                const completedCount = milestones.filter(m => m.completed).length;
                const progressPct = milestones.length > 0 
                  ? Math.round((completedCount / milestones.length) * 100) 
                  : 0;

                // Is deadline passed
                const deadlineTime = proj.deadline ? new Date(proj.deadline).getTime() : 0;
                const isOverdue = deadlineTime > 0 && deadlineTime < todayTimestamp && proj.status !== 'completed';
                const daysUntilDeadline = deadlineTime > 0 
                  ? Math.ceil((deadlineTime - todayTimestamp) / 86400000) 
                  : null;

                const isExpanded = expandedProjectId === proj.id;

                return (
                  <div 
                    key={proj.id}
                    className={`flex hover:bg-slate-900/30 transition-colors group ${
                      isActive ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Left Sticky Column: Project Info */}
                    <div className="w-72 shrink-0 p-3.5 border-r border-slate-800/80 bg-slate-950/95 flex flex-col justify-between gap-2">
                      <div>
                        {/* Top: Folder tag & Status */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span 
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border"
                            style={{ 
                              color: folderColor, 
                              borderColor: `${folderColor}40`,
                              backgroundColor: `${folderColor}15`
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folderColor }} />
                            <span className="truncate max-w-[110px]">{folder?.name || proj.clientName || 'Workspace'}</span>
                          </span>

                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            proj.status === 'completed' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' :
                            proj.status === 'review' ? 'bg-purple-950/40 text-purple-300 border-purple-800/60' :
                            isOverdue ? 'bg-rose-950/50 text-rose-300 border-rose-800/60 animate-pulse' :
                            'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {isOverdue ? 'OVERDUE' : proj.status?.toUpperCase() || 'IN PROGRESS'}
                          </span>
                        </div>

                        {/* Project Name */}
                        <div 
                          onClick={() => setActiveProject(proj)}
                          className="text-xs font-bold text-white hover:text-indigo-300 transition-colors truncate cursor-pointer flex items-center gap-1.5"
                          title={proj.name}
                        >
                          <span className="truncate">{proj.name}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" title="Active Project" />
                          )}
                        </div>

                        {/* Quick meta subtitle */}
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-1">
                          <span>{proj.projectType || 'Media'}</span>
                          <span>·</span>
                          <span className="text-slate-300 font-semibold">{progressPct}% Complete</span>
                          <span>·</span>
                          <span>{completedCount}/{milestones.length} ms</span>
                        </div>
                      </div>

                      {/* Bottom row: Deadline countdown & expand toggle */}
                      <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-slate-800/60">
                        {editingDeadlineProjectId === proj.id ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              type="date"
                              value={inlineDeadlineDate}
                              onChange={e => setInlineDeadlineDate(e.target.value)}
                              className="px-1.5 py-0.5 bg-slate-900 border border-indigo-500 rounded text-[10px] text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveInlineDeadline(proj.id)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px]"
                              title="Save deadline"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingDeadlineProjectId(null)}
                              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => {
                              setEditingDeadlineProjectId(proj.id);
                              setInlineDeadlineDate(
                                proj.deadline 
                                  ? proj.deadline.split('T')[0] 
                                  : new Date().toISOString().split('T')[0]
                              );
                            }}
                            className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                            title="Click to edit project deadline"
                          >
                            <Flag className={`w-3 h-3 ${isOverdue ? 'text-rose-400' : 'text-indigo-400'}`} />
                            <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                              {daysUntilDeadline === null 
                                ? 'Set deadline' 
                                : daysUntilDeadline < 0 
                                ? `${Math.abs(daysUntilDeadline)}d late` 
                                : daysUntilDeadline === 0 
                                ? 'Due today' 
                                : `${daysUntilDeadline}d left`}
                            </span>
                            <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                          </div>
                        )}

                        <button
                          onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                          className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide' : 'Details'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Right Horizontal Track Area */}
                    <div className="flex-1 relative flex items-center py-4 px-2 min-h-[80px]">
                      {/* Background Day Column Grid Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {dayColumns.map((col, idx) => (
                          <div 
                            key={idx} 
                            className={`flex-1 border-r border-slate-800/25 ${
                              col.isWeekend ? 'bg-slate-900/10' : ''
                            }`} 
                          />
                        ))}
                      </div>

                      {/* Project Horizontal Span Bar (Gantt track) */}
                      <div
                        className="absolute h-9 rounded-lg border transition-all pointer-events-auto shadow-sm flex items-center px-2 group/bar"
                        style={{
                          left: `${barLeft}%`,
                          width: `${barWidth}%`,
                          backgroundColor: `${folderColor}18`,
                          borderColor: `${folderColor}45`,
                        }}
                      >
                        {/* Progress Fill inside track */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-l-lg transition-all opacity-30"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: folderColor,
                          }}
                        />

                        {/* Project Track Label */}
                        <span className="relative z-0 text-[10px] font-mono font-medium text-slate-300 truncate pointer-events-none select-none pl-1">
                          {proj.name} ({progressPct}%)
                        </span>
                      </div>

                      {/* Interactive Milestones Plotted Along the Timeline */}
                      {milestones.map((milestone) => {
                        const msPct = getDatePercentage(milestone.dueDate);
                        const StageIcon = getStageIcon(milestone.stage);
                        const isMsOverdue = !milestone.completed && new Date(milestone.dueDate).getTime() < todayTimestamp;

                        return (
                          <div
                            key={milestone.id}
                            style={{ left: `${msPct}%` }}
                            className="absolute -translate-x-1/2 z-10 flex flex-col items-center group/node cursor-pointer"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setSelectedMilestone({
                                project: proj,
                                milestone,
                                xPos: rect.left + rect.width / 2,
                                yPos: rect.top,
                              });
                            }}
                          >
                            {/* Milestone Marker Button / Node */}
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all transform hover:scale-125 shadow-md ${
                                milestone.completed
                                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/40'
                                  : isMsOverdue
                                  ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse shadow-rose-900/50'
                                  : 'bg-slate-900 border-indigo-400 text-indigo-300 hover:border-white shadow-indigo-950/50'
                              }`}
                              title={`${milestone.title} (${getStageLabel(milestone.stage)}) - Due: ${new Date(milestone.dueDate).toLocaleDateString()}`}
                            >
                              {milestone.completed ? (
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              ) : (
                                <StageIcon className="w-3.5 h-3.5" />
                              )}
                            </div>

                            {/* Node Floating Title (Visible on hover) */}
                            <div className="absolute top-8 pointer-events-none opacity-0 group-hover/node:opacity-100 transition-opacity bg-slate-900/95 border border-slate-700 text-white text-[10px] font-mono px-2 py-1 rounded shadow-xl whitespace-nowrap z-30">
                              <span className="font-bold">{milestone.title}</span>
                              <span className="text-slate-400 block text-[9px]">
                                {new Date(milestone.dueDate).toLocaleDateString()} · {milestone.completed ? 'Completed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Project Deadline Flag Marker */}
                      {proj.deadline && (
                        <div
                          style={{ left: `${projDeadlinePct}%` }}
                          className="absolute -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer group/deadline"
                          onClick={() => {
                            setEditingDeadlineProjectId(proj.id);
                            setInlineDeadlineDate(proj.deadline ? proj.deadline.split('T')[0] : '');
                          }}
                          title={`Deadline: ${new Date(proj.deadline).toLocaleDateString()}`}
                        >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center border shadow-md transition-transform group-hover/deadline:scale-125 ${
                            proj.status === 'completed'
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                              : isOverdue
                              ? 'bg-rose-950 border-rose-500 text-rose-400 animate-bounce'
                              : 'bg-amber-950/80 border-amber-500 text-amber-300'
                          }`}>
                            <Flag className="w-3 h-3 fill-current" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: EXPANDED PROJECT MILESTONES DETAIL DRAWER
         ========================================================================= */}
      {expandedProjectId && (() => {
        const proj = projects.find(p => p.id === expandedProjectId);
        if (!proj) return null;
        const milestones = proj.milestones || [];

        return (
          <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Milestone Task Checklist: {proj.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({milestones.filter(m => m.completed).length} of {milestones.length} completed)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTargetProjectId(proj.id);
                    setIsAddMilestoneOpen(true);
                  }}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Milestone</span>
                </button>
                <button
                  onClick={() => setExpandedProjectId(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Checklist items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {milestones.length === 0 ? (
                <div className="col-span-2 text-center py-4 text-xs text-slate-500 font-mono">
                  No milestones configured for this project. Click "+ Add Milestone" above.
                </div>
              ) : (
                milestones.map(m => {
                  const StageIcon = getStageIcon(m.stage);
                  const isMsOverdue = !m.completed && new Date(m.dueDate).getTime() < todayTimestamp;

                  return (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 transition-all ${
                        m.completed
                          ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                          : isMsOverdue
                          ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                          : 'bg-slate-900/90 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          onClick={() => toggleMilestone(proj.id, m.id)}
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                            m.completed 
                              ? 'bg-emerald-600 border-emerald-500 text-white' 
                              : 'border-slate-600 hover:border-indigo-400 bg-slate-950'
                          }`}
                        >
                          {m.completed && <Check className="w-3 h-3" />}
                        </button>

                        <div className="min-w-0">
                          <div className={`text-xs font-semibold truncate ${
                            m.completed ? 'line-through text-slate-500' : 'text-white'
                          }`}>
                            {m.title}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span className="flex items-center gap-1 text-indigo-400">
                              <StageIcon className="w-3 h-3" />
                              <span>{getStageLabel(m.stage)}</span>
                            </span>
                            <span>·</span>
                            <span className={isMsOverdue ? 'text-rose-400 font-semibold' : ''}>
                              Due {new Date(m.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                          {m.notes && (
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                              "{m.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteMilestone(proj.id, m.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer shrink-0"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          SECTION 5: INTERACTIVE MILESTONE INSPECTOR POPOVER MODAL
         ========================================================================= */}
      {selectedMilestone && (() => {
        const { project, milestone } = selectedMilestone;
        const StageIcon = getStageIcon(milestone.stage);
        const isMsOverdue = !milestone.completed && new Date(milestone.dueDate).getTime() < todayTimestamp;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    milestone.completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    isMsOverdue ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  }`}>
                    <StageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      {project.name} · {getStageLabel(milestone.stage)}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {milestone.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status & Date */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px]">DUE DATE</span>
                  <span className={`font-semibold ${isMsOverdue ? 'text-rose-400' : 'text-slate-200'}`}>
                    {new Date(milestone.dueDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CURRENT STATUS</span>
                  <span className={`font-semibold ${milestone.completed ? 'text-emerald-400' : isMsOverdue ? 'text-rose-400' : 'text-amber-400'}`}>
                    {milestone.completed ? 'Completed' : isMsOverdue ? 'Overdue' : 'Pending Action'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {milestone.notes ? (
                <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded border border-slate-800/60 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                    PRODUCTION NOTES
                  </span>
                  <p className="leading-relaxed">{milestone.notes}</p>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  No additional notes provided for this milestone.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    deleteMilestone(project.id, milestone.id);
                    setSelectedMilestone(null);
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      toggleMilestone(project.id, milestone.id);
                      setSelectedMilestone(null);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      milestone.completed
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{milestone.completed ? 'Mark as Incomplete' : 'Mark as Completed'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          SECTION 6: ADD MILESTONE MODAL
         ========================================================================= */}
      {isAddMilestoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Project Milestone</h3>
                  <p className="text-xs text-slate-400">Schedule a production checkpoint or deliverable deadline</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddMilestoneOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3.5">
              {/* Target Project Selection */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Target Project
                </label>
                <select
                  value={targetProjectId}
                  onChange={e => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.projectType || 'Project'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Milestone Title */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khmer Subtitle Timing & Font Verification"
                  value={newMilestoneTitle}
                  onChange={e => setNewMilestoneTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Suggested Presets */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1">
                  {milestonePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewMilestoneTitle(preset.title);
                        setNewMilestoneStage(preset.stage);
                      }}
                      className="text-[10px] px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      {preset.title.split(' ')[0]}... ({preset.stage})
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid: Stage & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={newMilestoneStage}
                    onChange={e => setNewMilestoneStage(e.target.value as MilestoneStage)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="script">Story Script &amp; Outline</option>
                    <option value="transcription">Whisper STT Transcription</option>
                    <option value="subtitles">Subtitles &amp; Khmer SRT</option>
                    <option value="translation">Multilingual Translation</option>
                    <option value="voiceover">TTS &amp; Voiceover Dubbing</option>
                    <option value="review">Editorial Review &amp; QA</option>
                    <option value="export">Final Burn-In &amp; Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newMilestoneDueDate}
                    onChange={e => setNewMilestoneDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Notes &amp; Criteria (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements, reading speeds, target stems, or delivery specs..."
                  value={newMilestoneNotes}
                  onChange={e => setNewMilestoneNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMilestoneOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
