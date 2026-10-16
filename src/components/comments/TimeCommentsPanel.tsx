import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  FileText, 
  Film, 
  SlidersHorizontal,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { 
  CommentCategory, 
  CommentStatus, 
  CommentTargetType, 
  ProjectComment 
} from '../../types/studio';
import { CommentItemCard } from './CommentItemCard';
import { NewCommentModal } from './NewCommentModal';
import { 
  DEFAULT_TEAM_MEMBERS, 
  formatTimestampShort, 
  exportCommentsAsMarkdown 
} from '../../services/commentsService';
import { downloadBlob } from '../../services/exportZipService';

interface TimeCommentsPanelProps {
  filterTarget?: CommentTargetType;
  filterSegmentId?: number;
  compact?: boolean;
  onNavigateToTime?: (time: number) => void;
}

export const TimeCommentsPanel: React.FC<TimeCommentsPanelProps> = ({
  filterTarget,
  filterSegmentId,
  compact = false,
  onNavigateToTime,
}) => {
  const { 
    activeProject, 
    comments, 
    videoCurrentTime, 
    setVideoCurrentTime,
    activeCommentId, 
    setActiveCommentId,
    currentTeamUser,
    setCurrentTeamUser,
    addNotification
  } = useStudio();

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | CommentStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CommentCategory>('all');
  const [targetFilter, setTargetFilter] = useState<'all' | CommentTargetType>(filterTarget || 'all');
  const [sortBy, setSortBy] = useState<'time' | 'newest'>('time');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingComment, setEditingComment] = useState<ProjectComment | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);

  // Filtered comments
  const filteredComments = useMemo(() => {
    return comments.filter(c => {
      // Target filter
      if (filterSegmentId !== undefined && c.transcriptSegmentId !== filterSegmentId) {
        return false;
      }
      if (targetFilter !== 'all' && c.targetType !== targetFilter && c.targetType !== 'both') {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && c.category !== categoryFilter) {
        return false;
      }
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesContent = c.content.toLowerCase().includes(query);
        const matchesAuthor = c.author.name.toLowerCase().includes(query);
        if (!matchesContent && !matchesAuthor) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'time') {
        return a.timestamp - b.timestamp;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [comments, targetFilter, statusFilter, categoryFilter, search, sortBy, filterSegmentId]);

  // Counts
  const totalCount = comments.length;
  const openCount = comments.filter(c => c.status !== 'resolved').length;
  const resolvedCount = comments.filter(c => c.status === 'resolved').length;

  // Next / Prev Note Navigation
  const handleJumpNext = () => {
    const nextComment = comments
      .filter(c => c.timestamp > videoCurrentTime + 0.2)
      .sort((a, b) => a.timestamp - b.timestamp)[0];
    if (nextComment) {
      setVideoCurrentTime(nextComment.timestamp);
      setActiveCommentId(nextComment.id);
      onNavigateToTime?.(nextComment.timestamp);
    } else {
      addNotification('No later comments in timeline', 'info');
    }
  };

  const handleJumpPrev = () => {
    const prevComment = comments
      .filter(c => c.timestamp < videoCurrentTime - 0.2)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    if (prevComment) {
      setVideoCurrentTime(prevComment.timestamp);
      setActiveCommentId(prevComment.id);
      onNavigateToTime?.(prevComment.timestamp);
    } else {
      addNotification('No earlier comments in timeline', 'info');
    }
  };

  // Export report
  const handleCopyReport = async () => {
    const md = exportCommentsAsMarkdown(activeProject, comments);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedReport(true);
      addNotification('Feedback report copied to clipboard in Markdown format', 'success');
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      addNotification('Clipboard write failed', 'warning');
    }
  };

  const handleDownloadReport = () => {
    const md = exportCommentsAsMarkdown(activeProject, comments);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${activeProject.name.replace(/\s+/g, '_')}_Feedback_Report.md`);
    addNotification('Downloaded review report as Markdown file', 'success');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
      {/* Panel Top Header */}
      <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white truncate">Team Comments & Notes</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {totalCount}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span className="text-amber-400">{openCount} open</span>
              <span>•</span>
              <span className="text-emerald-400">{resolvedCount} resolved</span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Playhead Nav */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-slate-400">
            <button
              onClick={handleJumpPrev}
              className="p-1 rounded hover:bg-slate-700 hover:text-white transition-colors"
              title="Jump to previous note in timeline"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-slate-300">Notes</span>
            <button
              onClick={handleJumpNext}
              className="p-1 rounded hover:bg-slate-700 hover:text-white transition-colors"
              title="Jump to next note in timeline"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Note Button */}
          <button
            onClick={() => {
              setEditingComment(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Note</span>
            <span className="text-[10px] font-mono opacity-80">({formatTimestampShort(videoCurrentTime)})</span>
          </button>
        </div>
      </div>

      {/* Reviewer Persona Bar & Export Bar */}
      <div className="px-3.5 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs flex-wrap">
        {/* Reviewer Persona Selector */}
        <div className="relative">
          <button
            onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 transition-colors"
            title="Click to switch your review persona"
          >
            <div className={`w-4 h-4 rounded-full ${currentTeamUser.avatarColor} text-white text-[9px] font-bold flex items-center justify-center`}>
              {currentTeamUser.initials}
            </div>
            <span className="text-[11px] font-medium truncate max-w-[120px]">
              {currentTeamUser.name}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">({currentTeamUser.role})</span>
          </button>

          {showMemberDropdown && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 p-1.5 space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400">
                Switch Reviewing Persona
              </div>
              {DEFAULT_TEAM_MEMBERS.map(member => (
                <button
                  key={member.id}
                  onClick={() => {
                    setCurrentTeamUser(member);
                    setShowMemberDropdown(false);
                    addNotification(`Reviewing as ${member.name} (${member.role})`, 'info');
                  }}
                  className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-colors ${
                    currentTeamUser.id === member.id ? 'bg-indigo-600/20 text-indigo-300' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md ${member.avatarColor} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                    {member.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{member.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{member.role}</div>
                  </div>
                  {currentTeamUser.id === member.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feedback Report Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] transition-colors"
            title="Copy feedback report to clipboard"
          >
            {copiedReport ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedReport ? 'Copied' : 'Copy Report'}</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Download review report as Markdown"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3 bg-slate-900/80 border-b border-slate-800 space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes, tags, or team members..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Row: Status + Category + Target + Sort */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap text-xs">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                statusFilter === 'open' ? 'bg-amber-500/20 text-amber-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                statusFilter === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="edit_request">Edit Requests</option>
            <option value="translation_fix">Translation & Khmer</option>
            <option value="audio_note">Audio & Mix</option>
            <option value="pacing">Pacing & Cuts</option>
            <option value="feedback">Creative Feedback</option>
          </select>

          {/* Sort Switcher */}
          <button
            onClick={() => setSortBy(sortBy === 'time' ? 'newest' : 'time')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-[11px] transition-colors"
            title={sortBy === 'time' ? 'Sorted by timeline timestamp' : 'Sorted by most recent'}
          >
            <ArrowUpDown className="w-3 h-3 text-indigo-400" />
            <span>{sortBy === 'time' ? 'Timeline' : 'Newest'}</span>
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {filteredComments.length > 0 ? (
          filteredComments.map(comment => (
            <CommentItemCard
              key={comment.id}
              comment={comment}
              onEdit={c => {
                setEditingComment(c);
                setIsModalOpen(true);
              }}
              isSelected={activeCommentId === comment.id}
            />
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-semibold text-slate-300 mb-1">No comments found</h4>
            <p className="text-[11px] text-slate-500 max-w-xs mb-4">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : `Leave time-stamped feedback at playhead (${formatTimestampShort(videoCurrentTime)}) for video cuts or transcript lines.`}
            </p>
            <button
              onClick={() => {
                setEditingComment(null);
                setIsModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
            >
              Add Note at {formatTimestampShort(videoCurrentTime)}
            </button>
          </div>
        )}
      </div>

      {/* New / Edit Comment Modal */}
      <NewCommentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingComment(null);
        }}
        initialTime={videoCurrentTime}
        initialTargetType={filterTarget || 'video'}
        initialSegmentId={filterSegmentId}
        editingComment={editingComment}
      />
    </div>
  );
};
