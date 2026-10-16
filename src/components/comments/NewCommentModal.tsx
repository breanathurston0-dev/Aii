import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Clock, 
  Film, 
  FileText, 
  Tag, 
  Send, 
  AlertCircle,
  UserCheck,
  Check,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { 
  CommentAuthor, 
  CommentCategory, 
  CommentPriority, 
  CommentStatus, 
  CommentTargetType,
  ProjectComment 
} from '../../types/studio';
import { 
  DEFAULT_TEAM_MEMBERS, 
  formatTimestampShort, 
  getCategoryMeta, 
  getPriorityMeta 
} from '../../services/commentsService';

interface NewCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTime?: number;
  initialTargetType?: CommentTargetType;
  initialSegmentId?: number;
  editingComment?: ProjectComment | null;
}

const CATEGORIES: { id: CommentCategory; label: string; desc: string }[] = [
  { id: 'edit_request', label: 'Edit Request', desc: 'Trim, cut, transition or visual change' },
  { id: 'translation_fix', label: 'Translation & Text', desc: 'Khmer grammar, spelling, phrasing, or subtitles' },
  { id: 'audio_note', label: 'Audio & Mix', desc: 'Volume ducking, EQ, noise reduction, or TTS inflection' },
  { id: 'pacing', label: 'Pacing / Flow', desc: 'Scene rhythm, duration, or silence adjustments' },
  { id: 'feedback', label: 'Review Feedback', desc: 'General creative approval or directorial note' },
  { id: 'general', label: 'General Note', desc: 'Misc task or reminder' },
];

const PRIORITIES: { id: CommentPriority; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
];

const QUICK_TAGS = [
  '@editor',
  '@translator',
  '@sound',
  '#trim-cut',
  '#khmer-honorific',
  '#audio-duck',
  '#subtitle-sync',
  '#client-request',
];

export const NewCommentModal: React.FC<NewCommentModalProps> = ({
  isOpen,
  onClose,
  initialTime,
  initialTargetType = 'video',
  initialSegmentId,
  editingComment,
}) => {
  const { 
    activeProject, 
    videoCurrentTime, 
    setVideoCurrentTime, 
    addComment, 
    updateComment,
    currentTeamUser,
    setCurrentTeamUser 
  } = useStudio();

  const [targetType, setTargetType] = useState<CommentTargetType>(initialTargetType);
  const [timestamp, setTimestamp] = useState<number>(0);
  const [hasRange, setHasRange] = useState<boolean>(false);
  const [endTimestamp, setEndTimestamp] = useState<number>(0);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | undefined>(initialSegmentId);
  const [author, setAuthor] = useState<CommentAuthor>(currentTeamUser);
  const [category, setCategory] = useState<CommentCategory>('feedback');
  const [priority, setPriority] = useState<CommentPriority>('medium');
  const [status, setStatus] = useState<CommentStatus>('open');
  const [content, setContent] = useState<string>('');

  // Sync state when opened or changed
  useEffect(() => {
    if (editingComment) {
      setTargetType(editingComment.targetType);
      setTimestamp(editingComment.timestamp);
      setHasRange(!!editingComment.endTimestamp);
      setEndTimestamp(editingComment.endTimestamp || editingComment.timestamp + 2);
      setSelectedSegmentId(editingComment.transcriptSegmentId);
      setAuthor(editingComment.author);
      setCategory(editingComment.category);
      setPriority(editingComment.priority);
      setStatus(editingComment.status);
      setContent(editingComment.content);
    } else {
      const defaultTime = initialTime !== undefined ? initialTime : videoCurrentTime;
      setTargetType(initialTargetType);
      setTimestamp(Number(defaultTime.toFixed(1)));
      setHasRange(false);
      setEndTimestamp(Number((defaultTime + 3).toFixed(1)));
      setSelectedSegmentId(initialSegmentId);
      setAuthor(currentTeamUser);
      setCategory(initialTargetType === 'transcript' ? 'translation_fix' : 'feedback');
      setPriority('medium');
      setStatus('open');
      setContent('');
    }
  }, [isOpen, editingComment, initialTime, initialTargetType, initialSegmentId, videoCurrentTime, currentTeamUser]);

  if (!isOpen) return null;

  const durationMax = Math.max(activeProject.durationSeconds || 60, 10);
  const transcriptSegments = activeProject.transcript || [];

  const handleUseCurrentPlayhead = () => {
    const time = Number(videoCurrentTime.toFixed(1));
    setTimestamp(time);
    if (hasRange && endTimestamp <= time) {
      setEndTimestamp(Number(Math.min(time + 2, durationMax).toFixed(1)));
    }
  };

  const handleSelectSegment = (segId: number) => {
    setSelectedSegmentId(segId);
    const seg = transcriptSegments.find(s => s.id === segId);
    if (seg) {
      setTimestamp(seg.startTime);
      setEndTimestamp(seg.endTime);
      setHasRange(true);
    }
  };

  const handleInsertTag = (tag: string) => {
    setContent(prev => (prev ? `${prev} ${tag} ` : `${tag} `));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (editingComment) {
      updateComment(editingComment.id, {
        targetType,
        timestamp: Math.max(0, timestamp),
        endTimestamp: hasRange ? Math.max(timestamp, endTimestamp) : undefined,
        transcriptSegmentId: targetType !== 'video' ? selectedSegmentId : undefined,
        author,
        category,
        priority,
        status,
        content: content.trim(),
      });
    } else {
      addComment({
        projectId: activeProject.id,
        targetType,
        timestamp: Math.max(0, timestamp),
        endTimestamp: hasRange ? Math.max(timestamp, endTimestamp) : undefined,
        transcriptSegmentId: targetType !== 'video' ? selectedSegmentId : undefined,
        author,
        category,
        priority,
        status,
        content: content.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {editingComment ? 'Edit Time-Stamped Note' : 'Add Time-Stamped Team Note'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-normal">
                  {formatTimestampShort(timestamp)}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Collaborate on video cuts, subtitle timing, audio mix, and Khmer translation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Target Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Feedback Anchor Target
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('video')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  targetType === 'video'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video Clip</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('transcript')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  targetType === 'transcript'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Transcript Line</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('both')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  targetType === 'both'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Video & Transcript</span>
              </button>
            </div>
          </div>

          {/* Timestamp Controls */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Time Position</span>
              </div>
              <button
                type="button"
                onClick={handleUseCurrentPlayhead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-mono hover:underline flex items-center gap-1"
                title="Sync with current video playhead"
              >
                Use current playhead ({formatTimestampShort(videoCurrentTime)})
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Start Seconds (0 - {durationMax.toFixed(0)}s)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={durationMax}
                    step={0.1}
                    value={timestamp}
                    onChange={e => setTimestamp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-hidden focus:border-indigo-500"
                  />
                  <span className="font-mono text-xs text-indigo-300 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800 shrink-0">
                    {formatTimestampShort(timestamp)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-400">
                    Duration Range End
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasRange}
                      onChange={e => {
                        setHasRange(e.target.checked);
                        if (e.target.checked && endTimestamp <= timestamp) {
                          setEndTimestamp(Number(Math.min(timestamp + 3, durationMax).toFixed(1)));
                        }
                      }}
                      className="accent-indigo-500 rounded"
                    />
                    <span>Range</span>
                  </label>
                </div>
                {hasRange ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={timestamp}
                      max={durationMax}
                      step={0.1}
                      value={endTimestamp}
                      onChange={e => setEndTimestamp(parseFloat(e.target.value) || timestamp)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-hidden focus:border-indigo-500"
                    />
                    <span className="font-mono text-xs text-purple-300 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800 shrink-0">
                      {formatTimestampShort(endTimestamp)}
                    </span>
                  </div>
                ) : (
                  <div className="h-[34px] flex items-center px-3 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs text-slate-500 italic">
                    Single time point (instant note)
                  </div>
                )}
              </div>
            </div>

            {/* Quick Seek Test */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
              <span className="text-slate-400">Jump player to this position:</span>
              <button
                type="button"
                onClick={() => setVideoCurrentTime(timestamp)}
                className="px-2 py-0.5 rounded bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Seek Video Player to {formatTimestampShort(timestamp)}
              </button>
            </div>
          </div>

          {/* Transcript Segment Anchor (if target involves transcript) */}
          {targetType !== 'video' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Anchor to Transcript Segment
              </label>
              <select
                value={selectedSegmentId || ''}
                onChange={e => handleSelectSegment(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
              >
                <option value="">-- Optional: Link directly to transcript line --</option>
                {transcriptSegments.map(seg => (
                  <option key={seg.id} value={seg.id}>
                    #{seg.id} [{formatTimestampShort(seg.startTime)} - {formatTimestampShort(seg.endTime)}] {seg.speaker}: "{seg.text.slice(0, 50)}..."
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Author / Reviewer Persona */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Comment Author & Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEFAULT_TEAM_MEMBERS.map(member => {
                const isSelected = author.id === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setAuthor(member);
                      setCurrentTeamUser(member);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg ${member.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                      {member.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate leading-tight">{member.name}</div>
                      <div className="text-[10px] text-slate-400 truncate leading-tight">{member.role}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as CommentCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.desc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITIES.map(p => {
                  const isSelected = priority === p.id;
                  const meta = getPriorityMeta(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`py-1.5 text-xs rounded-lg font-medium border text-center transition-all ${
                        isSelected
                          ? `${meta.badge} ring-1 ring-white/20`
                          : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Note Content Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Note & Feedback Content *
              </label>
              <span className="text-[11px] text-slate-500">Khmer Unicode & Markdown supported</span>
            </div>
            <textarea
              required
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Leave specific review guidance for the team (e.g., 'Trim 0.5s pause after line 2', or 'Clarify Khmer phrasing for Angkor stone inscriptions...')"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500 transition-colors"
            />

            {/* Quick Tag Chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] text-slate-500 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Insert tags:
              </span>
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleInsertTag(tag)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 font-mono transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Visible to all workspace collaborators</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{editingComment ? 'Update Note' : 'Post Time Note'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
