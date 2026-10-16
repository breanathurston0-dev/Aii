import React, { useState } from 'react';
import { 
  Clock, 
  Play, 
  CheckCircle2, 
  Circle, 
  MessageSquare, 
  CornerDownRight, 
  Send, 
  Trash2, 
  Edit3, 
  Film, 
  FileText, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Share2,
  SmilePlus,
  ExternalLink
} from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { ProjectComment } from '../../types/studio';
import { 
  formatTimestampShort, 
  getCategoryMeta, 
  getPriorityMeta, 
  getStatusMeta 
} from '../../services/commentsService';

interface CommentItemCardProps {
  comment: ProjectComment;
  onEdit: (comment: ProjectComment) => void;
  isSelected?: boolean;
}

const COMMON_REACTIONS = ['👍', '❤️', '👀', '🎯', '🎉'];

export const CommentItemCard: React.FC<CommentItemCardProps> = ({
  comment,
  onEdit,
  isSelected = false,
}) => {
  const { 
    setVideoCurrentTime, 
    setIsVideoPlaying,
    resolveComment, 
    deleteComment, 
    addCommentReply, 
    deleteCommentReply,
    toggleCommentReaction,
    setActiveCommentId,
    setActivePage,
    currentTeamUser,
    activeProject
  } = useStudio();

  const [showReplies, setShowReplies] = useState<boolean>(comment.replies.length > 0);
  const [replyText, setReplyText] = useState<string>('');
  const [showActions, setShowActions] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  const categoryMeta = getCategoryMeta(comment.category);
  const priorityMeta = getPriorityMeta(comment.priority);
  const isResolved = comment.status === 'resolved';

  // Seek video and play
  const handleJumpToTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoCurrentTime(comment.timestamp);
    setActiveCommentId(comment.id);
  };

  const handleToggleResolve = (e: React.MouseEvent) => {
    e.stopPropagation();
    resolveComment(comment.id, !isResolved);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addCommentReply(comment.id, replyText);
    setReplyText('');
    setShowReplies(true);
  };

  const linkedSegment = comment.transcriptSegmentId 
    ? activeProject.transcript.find(s => s.id === comment.transcriptSegmentId) 
    : null;

  return (
    <div 
      onClick={() => setActiveCommentId(comment.id)}
      className={`rounded-xl border transition-all duration-150 overflow-hidden ${
        isSelected 
          ? 'bg-slate-800/90 border-indigo-500/70 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/30' 
          : isResolved
            ? 'bg-slate-900/50 border-slate-800/80 opacity-80 hover:opacity-100'
            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700/80'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between gap-2 border-b border-slate-800/50">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Jump Pill */}
          <button
            onClick={handleJumpToTime}
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-300 hover:text-white font-mono text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="Click to jump video playhead to this note"
          >
            <Play className="w-3 h-3 fill-current group-hover:scale-110 transition-transform" />
            <span>{formatTimestampShort(comment.timestamp)}</span>
            {comment.endTimestamp && (
              <span className="opacity-75"> - {formatTimestampShort(comment.endTimestamp)}</span>
            )}
          </button>

          {/* Target Pill */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 border border-slate-700/60">
            {comment.targetType === 'video' ? (
              <>
                <Film className="w-3 h-3 text-sky-400" />
                <span>Video</span>
              </>
            ) : comment.targetType === 'transcript' ? (
              <>
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Transcript #{comment.transcriptSegmentId || 'All'}</span>
              </>
            ) : (
              <>
                <Film className="w-3 h-3 text-indigo-400" />
                <span>Video & Transcript</span>
              </>
            )}
          </span>

          {/* Category Chip */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${categoryMeta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${categoryMeta.dot}`}></span>
            {categoryMeta.label}
          </span>

          {/* Priority Badge */}
          {comment.priority !== 'low' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold uppercase ${priorityMeta.badge}`}>
              {comment.priority}
            </span>
          )}
        </div>

        {/* Resolve Quick Button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleToggleResolve}
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isResolved
                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isResolved ? 'Re-open note' : 'Mark as resolved'}
          >
            {isResolved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] hidden sm:inline">Resolved</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-slate-500 hover:text-indigo-400" />
                <span className="text-[11px] text-slate-400 hover:text-slate-200 hidden sm:inline">Resolve</span>
              </>
            )}
          </button>

          {/* Actions Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showActions && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 py-1 text-xs"
              >
                <button
                  onClick={() => {
                    setShowActions(false);
                    onEdit(comment);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Edit Note</span>
                </button>
                <button
                  onClick={() => {
                    setShowActions(false);
                    deleteComment(comment.id);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 text-rose-300 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Note</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Comment Content */}
      <div className="p-4 space-y-3">
        {/* Author Header */}
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${comment.author.avatarColor || 'bg-indigo-600'} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs`}>
            {comment.author.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">{comment.author.name}</span>
              <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700/50 truncate">
                {comment.author.role}
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Linked Transcript Preview */}
        {linkedSegment && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setVideoCurrentTime(linkedSegment.startTime);
              setActivePage('transcript-editor');
            }}
            className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300 flex items-center justify-between gap-2 hover:bg-emerald-500/10 cursor-pointer group transition-colors"
            title="Click to view line in Transcript Editor"
          >
            <div className="truncate flex items-center gap-2">
              <span className="font-mono text-emerald-400 text-[11px] font-semibold">#{linkedSegment.id}</span>
              <span className="text-emerald-300 font-medium">[{linkedSegment.speaker}]:</span>
              <span className="text-slate-200 truncate font-khmer">"{linkedSegment.text}"</span>
            </div>
            <span className="text-[10px] text-emerald-400 group-hover:underline flex items-center gap-1 shrink-0">
              Transcript <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        )}

        {/* Comment Text */}
        <p className={`text-xs sm:text-sm leading-relaxed ${isResolved ? 'text-slate-400 line-through decoration-slate-600' : 'text-slate-200'}`}>
          {comment.content}
        </p>

        {/* Resolved Details Banner */}
        {isResolved && comment.resolvedBy && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-[11px] text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Resolved by {comment.resolvedBy.authorName} on {new Date(comment.resolvedBy.resolvedAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Reactions & Thread Controls */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Existing Reactions */}
            {comment.reactions && Object.entries(comment.reactions).map(([emoji, count]) => {
              if (count <= 0) return null;
              return (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCommentReaction(comment.id, emoji);
                  }}
                  className="px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs border border-slate-700 flex items-center gap-1 text-slate-300 transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-mono">{count}</span>
                </button>
              );
            })}

            {/* Add Reaction Button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                title="Add reaction"
              >
                <SmilePlus className="w-3.5 h-3.5" />
              </button>

              {showEmojiPicker && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full left-0 mb-1 flex items-center gap-1 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-20"
                >
                  {COMMON_REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        toggleCommentReaction(comment.id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1 hover:bg-slate-800 rounded text-sm transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Replies Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReplies(!showReplies);
            }}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              {comment.replies.length > 0 
                ? `${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}` 
                : 'Reply'}
            </span>
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Reply Thread */}
      {showReplies && (
        <div className="bg-slate-950/60 border-t border-slate-800/80 p-4 space-y-3">
          {comment.replies.map(reply => (
            <div key={reply.id} className="flex items-start gap-2.5 text-xs group">
              <div className={`w-6 h-6 rounded-md ${reply.author.avatarColor || 'bg-slate-700'} text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5`}>
                {reply.author.initials}
              </div>
              <div className="flex-1 min-w-0 bg-slate-900/80 rounded-xl p-2.5 border border-slate-800">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-[11px]">{reply.author.name}</span>
                    <span className="text-[9px] text-slate-400">{reply.author.role}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500">
                      {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCommentReply(comment.id, reply.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity"
                      title="Delete reply"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-300 leading-normal">{reply.content}</p>
              </div>
            </div>
          ))}

          {/* Quick Reply Form */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <div className={`w-6 h-6 rounded-md ${currentTeamUser.avatarColor} text-white flex items-center justify-center text-[10px] font-bold shrink-0`}>
              {currentTeamUser.initials}
            </div>
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply as ${currentTeamUser.name}...`}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
              title="Post reply"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
