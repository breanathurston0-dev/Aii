import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  Mic, 
  Check, 
  RefreshCw,
  Sparkles,
  Subtitles,
  MessageSquare,
  MessageSquarePlus,
  Play,
  CornerDownRight,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { secondsToSrtTimestamp } from '../../services/srtService';
import { formatTimestampShort } from '../../services/commentsService';
import { TranscriptSegment } from '../../types/studio';
import { downloadBlob } from '../../services/exportZipService';
import { TimeCommentsPanel } from '../comments/TimeCommentsPanel';
import { NewCommentModal } from '../comments/NewCommentModal';
import { UndoRedoControls } from '../common/UndoRedoControls';

export const TranscriptEditorView: React.FC = () => {
  const { 
    activeProject, 
    updateActiveProject, 
    addNotification, 
    addJob, 
    setActivePage,
    comments,
    setVideoCurrentTime,
    setActiveCommentId
  } = useStudio();

  const [search, setSearch] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<'gemini' | 'whisper_cpp' | 'faster_whisper'>('gemini');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState<boolean>(true);
  const [targetSegmentForComment, setTargetSegmentForComment] = useState<TranscriptSegment | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState<boolean>(false);

  const transcript = activeProject.transcript || [];

  const filtered = transcript.filter(t => 
    t.text.toLowerCase().includes(search.toLowerCase()) || 
    t.speaker.toLowerCase().includes(search.toLowerCase())
  );

  const transcriptComments = comments.filter(c => 
    c.targetType === 'transcript' || c.targetType === 'both' || c.transcriptSegmentId !== undefined
  );

  const handleTranscribeMedia = () => {
    setIsTranscribing(true);

    addJob('transcription', `Audio Transcription via ${selectedEngine.toUpperCase()}`, async (update) => {
      update(15, 'Extracting 16kHz mono audio stream via FFmpeg');
      await new Promise(r => setTimeout(r, 600));

      update(55, `Running speech recognition model (${selectedEngine}) with Khmer Unicode support`);
      await new Promise(r => setTimeout(r, 800));

      const newSegments: TranscriptSegment[] = [
        {
          id: 1,
          startTime: 0.5,
          endTime: 4.8,
          speaker: 'Narrator',
          text: 'សូមស្វាគមន៍មកកាន់ប្រាសាទអង្គរវត្ត ដែលជាបេតិកភណ្ឌពិភពលោកដ៏អស្ចារ្យ។',
          confidence: 0.98,
        },
        {
          id: 2,
          startTime: 5.2,
          endTime: 10.5,
          speaker: 'Narrator',
          text: 'ប្រាសាទនេះត្រូវបានកសាងឡើងនៅដើមសតវត្សរ៍ទី១២ ដោយព្រះបាទសូរ្យវរ្ម័នទី២។',
          confidence: 0.96,
        },
        {
          id: 3,
          startTime: 11.0,
          endTime: 17.2,
          speaker: 'Historian',
          text: 'ក្បាច់ចម្លាក់អប្សរាជាងបីពាន់រូបនៅលើជញ្ជាំងថ្មឆ្លុះបញ្ចាំងពីសិល្បៈនិងជំនឿបុរាណដ៏រុងរឿង។',
          confidence: 0.94,
        },
        {
          id: 4,
          startTime: 18.0,
          endTime: 24.5,
          speaker: 'Narrator',
          text: 'រឿងនិទាននិងប្រវត្តិសាស្ត្រខ្មែរនៅតែបន្តរស់រវើកនៅក្នុងដួងចិត្តប្រជាជនកម្ពុជាគ្រប់ជំនាន់។',
          confidence: 0.97,
        },
      ];

      updateActiveProject(prev => ({
        ...prev,
        transcript: newSegments,
      }));

      return `Transcribed ${newSegments.length} segments with timestamps`;
    });

    setTimeout(() => {
      setIsTranscribing(false);
      addNotification('Audio transcribed successfully', 'success');
    }, 1800);
  };

  const handleUpdateSegment = (id: number, text: string, speaker: string) => {
    updateActiveProject(prev => ({
      ...prev,
      transcript: prev.transcript.map(t => (t.id === id ? { ...t, text, speaker } : t)),
    }), 'Edit Transcript Segment');
  };

  const handleDeleteSegment = (id: number) => {
    updateActiveProject(prev => ({
      ...prev,
      transcript: prev.transcript.filter(t => t.id !== id),
    }), 'Delete Transcript Segment');
    addNotification('Transcript segment deleted', 'info');
  };

  const handleAddSegment = () => {
    const lastSeg = transcript[transcript.length - 1];
    const newStart = lastSeg ? lastSeg.endTime + 0.5 : 0;
    const newSeg: TranscriptSegment = {
      id: Date.now(),
      startTime: newStart,
      endTime: newStart + 4.0,
      speaker: 'Speaker 1',
      text: 'New transcript segment text...',
      confidence: 1.0,
    };

    updateActiveProject(prev => ({
      ...prev,
      transcript: [...prev.transcript, newSeg],
    }), 'Add Transcript Segment');
    addNotification('Segment added', 'success');
  };

  const handleExportTxt = () => {
    const content = transcript.map(t => `[${secondsToSrtTimestamp(t.startTime)} - ${secondsToSrtTimestamp(t.endTime)}] ${t.speaker}: ${t.text}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${activeProject.name}_transcript.txt`);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${activeProject.name}_transcript.json`);
  };

  const handleSyncToSubtitles = () => {
    const subs = transcript.map(t => ({
      id: t.id,
      startTime: secondsToSrtTimestamp(t.startTime),
      endTime: secondsToSrtTimestamp(t.endTime),
      startSeconds: t.startTime,
      endSeconds: t.endTime,
      text: t.text,
      speaker: t.speaker,
      isOverlapping: false,
      cpsAlert: false,
    }));

    updateActiveProject(prev => ({ ...prev, subtitles: subs }), 'Sync Transcript to Subtitles');
    setActivePage('subtitle-editor');
    addNotification('Transcript synchronized to Subtitle Editor', 'success');
  };

  const handleOpenAddCommentForSegment = (seg: TranscriptSegment) => {
    setTargetSegmentForComment(seg);
    setIsCommentModalOpen(true);
  };

  // Get comments belonging to a specific segment
  const getCommentsForSegment = (seg: TranscriptSegment) => {
    return comments.filter(c => 
      c.transcriptSegmentId === seg.id || 
      (c.targetType !== 'video' && c.timestamp >= seg.startTime - 0.2 && c.timestamp <= seg.endTime + 0.2)
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Transcript Editor &amp; Team Notes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic speech-to-text with Whisper &amp; Gemini, line-anchored feedback, and Khmer Unicode support.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Central Undo/Redo Engine inline toolbar */}
          <UndoRedoControls variant="compact" showDropdown={true} />

          <button
            onClick={() => setShowCommentsSidebar(!showCommentsSidebar)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
              showCommentsSidebar
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-xs'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Team Notes ({transcriptComments.length})</span>
          </button>

          <button
            onClick={handleSyncToSubtitles}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>Convert to Subtitles</span>
          </button>

          <button
            onClick={handleExportTxt}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>TXT</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Transcript Segments on Left, Comments Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Transcription Toolbar & Segments List */}
        <div className={showCommentsSidebar ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* Transcription Engine Trigger Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-600/20 flex items-center justify-center shrink-0">
                <Mic className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Transcribe Video Audio Track</div>
                <div className="text-[11px] text-slate-400">Supported: Whisper.cpp (CPU Local), Faster-Whisper, and Gemini API</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedEngine}
                onChange={e => setSelectedEngine(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="gemini">Gemini 3.5 Transcribe (Cloud API)</option>
                <option value="whisper_cpp">Whisper.cpp (Local CPU Low-Resource)</option>
                <option value="faster_whisper">Faster-Whisper (Local GPU/CPU)</option>
              </select>

              <button
                onClick={handleTranscribeMedia}
                disabled={isTranscribing}
                className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs whitespace-nowrap cursor-pointer"
              >
                {isTranscribing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isTranscribing ? 'Transcribing...' : 'Run Transcription'}</span>
              </button>
            </div>
          </div>

          {/* Search and Add Segment Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search transcript text or speaker..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleAddSegment}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Segment</span>
            </button>
          </div>

          {/* Segments List */}
          <div className="space-y-3">
            {filtered.map((seg, idx) => {
              const segComments = getCommentsForSegment(seg);
              const hasNotes = segComments.length > 0;

              return (
                <div 
                  key={seg.id} 
                  className={`bg-slate-900/70 border rounded-xl p-4 space-y-2 transition-all ${
                    hasNotes 
                      ? 'border-indigo-500/40 shadow-xs shadow-indigo-500/5 bg-slate-900/90' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-500 font-bold">#{idx + 1}</span>
                      
                      {/* Playhead Seek Button */}
                      <button
                        onClick={() => setVideoCurrentTime(seg.startTime)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-colors"
                        title="Seek video player to segment start"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{secondsToSrtTimestamp(seg.startTime)} → {secondsToSrtTimestamp(seg.endTime)}</span>
                      </button>

                      <span className="text-slate-600">({(seg.endTime - seg.startTime).toFixed(1)}s)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Add Note Button for this specific line */}
                      <button
                        onClick={() => handleOpenAddCommentForSegment(seg)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-200 border border-slate-700 text-[10px] font-sans font-medium transition-colors"
                        title="Leave a time-stamped note on this transcript line"
                      >
                        <MessageSquarePlus className="w-3 h-3 text-indigo-400" />
                        <span>Add Note</span>
                      </button>

                      <input
                        type="text"
                        value={seg.speaker}
                        onChange={e => handleUpdateSegment(seg.id, seg.text, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-300 w-28 text-right focus:outline-hidden focus:border-indigo-500"
                        placeholder="Speaker Name"
                      />
                      <button
                        onClick={() => handleDeleteSegment(seg.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Delete segment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Segment Textarea */}
                  <textarea
                    rows={2}
                    value={seg.text}
                    onChange={e => handleUpdateSegment(seg.id, e.target.value, seg.speaker)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded p-2.5 text-xs text-white font-sans leading-relaxed focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />

                  {/* Inline Segment Comments / Notes Bar */}
                  {hasNotes && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" />
                        <span>Team Notes on this line ({segComments.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {segComments.map(sc => (
                          <div 
                            key={sc.id}
                            onClick={() => {
                              setActiveCommentId(sc.id);
                              setVideoCurrentTime(sc.timestamp);
                            }}
                            className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                              sc.status === 'resolved'
                                ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                                : 'bg-slate-950/80 border-slate-700/80 hover:border-indigo-500/60 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                              <span className="font-bold text-indigo-300">{sc.author.name} ({sc.author.role})</span>
                              <span className="font-mono">{formatTimestampShort(sc.timestamp)}</span>
                            </div>
                            <div className="line-clamp-2">{sc.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-lg">
                <p className="text-xs text-slate-500">No transcript segments found. Click "Run Transcription" or "Add Segment".</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Time-Stamped Comments Panel */}
        {showCommentsSidebar && (
          <div className="lg:col-span-5 sticky top-4 h-[680px]">
            <TimeCommentsPanel 
              filterTarget="transcript"
              onNavigateToTime={time => setVideoCurrentTime(time)}
            />
          </div>
        )}
      </div>

      {/* Segment-Anchored Add Note Modal */}
      <NewCommentModal
        isOpen={isCommentModalOpen}
        onClose={() => {
          setIsCommentModalOpen(false);
          setTargetSegmentForComment(null);
        }}
        initialTime={targetSegmentForComment?.startTime}
        initialTargetType="transcript"
        initialSegmentId={targetSegmentForComment?.id}
      />
    </div>
  );
};
