import { 
  ProjectComment, 
  CommentAuthor, 
  CommentCategory, 
  CommentPriority, 
  CommentStatus,
  Project
} from '../types/studio';
import { secondsToSrtTimestamp } from './srtService';

export const DEFAULT_TEAM_MEMBERS: CommentAuthor[] = [
  { id: 'user_maisie', name: 'Maisie Clarke', role: 'Director & Producer', avatarColor: 'bg-indigo-600', initials: 'MC' },
  { id: 'user_sophea', name: 'Sophea Kem', role: 'Lead Video Editor', avatarColor: 'bg-emerald-600', initials: 'SK' },
  { id: 'user_dara', name: 'Dara Chan', role: 'Khmer Translator & Linguist', avatarColor: 'bg-amber-600', initials: 'DC' },
  { id: 'user_vanna', name: 'Vanna Meas', role: 'Sound & Foley Engineer', avatarColor: 'bg-purple-600', initials: 'VM' },
  { id: 'user_elena', name: 'Elena Rostova', role: 'Client Review Lead', avatarColor: 'bg-rose-600', initials: 'ER' },
];

export const formatTimestampShort = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
};

export const getCategoryMeta = (cat: CommentCategory) => {
  switch (cat) {
    case 'edit_request':
      return {
        label: 'Edit Request',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'translation_fix':
      return {
        label: 'Translation & Text',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'audio_note':
      return {
        label: 'Audio & Mix',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        dot: 'bg-cyan-400',
      };
    case 'pacing':
      return {
        label: 'Pacing / Trim',
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
        dot: 'bg-purple-400',
      };
    case 'feedback':
      return {
        label: 'Review Feedback',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        dot: 'bg-indigo-400',
      };
    default:
      return {
        label: 'General Note',
        color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
        dot: 'bg-slate-400',
      };
  }
};

export const getPriorityMeta = (pri: CommentPriority) => {
  switch (pri) {
    case 'critical':
      return { label: 'Critical / Blocker', badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/40' };
    case 'high':
      return { label: 'High Priority', badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/40' };
    case 'medium':
      return { label: 'Medium', badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' };
    default:
      return { label: 'Low', badge: 'bg-slate-500/20 text-slate-300 border border-slate-500/40' };
  }
};

export const getStatusMeta = (status: CommentStatus) => {
  switch (status) {
    case 'resolved':
      return { label: 'Resolved', badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' };
    case 'in_progress':
      return { label: 'In Progress', badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/40' };
    default:
      return { label: 'Open', badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' };
  }
};

export const generateSampleComments = (projectId: string): ProjectComment[] => {
  const now = Date.now();
  return [
    {
      id: `comm_${projectId}_1`,
      projectId,
      targetType: 'video',
      timestamp: 2.4,
      endTimestamp: 4.8,
      author: DEFAULT_TEAM_MEMBERS[0], // Maisie Clarke (Director)
      content: 'Opening sunrise cut feels slightly abrupt against the title overlay. Can we lengthen the fade-in transition by +0.6s so the glowing horizon settles before the text pops in?',
      category: 'edit_request',
      priority: 'medium',
      status: 'in_progress',
      createdAt: new Date(now - 1000 * 60 * 180).toISOString(),
      replies: [
        {
          id: `rep_${projectId}_1_1`,
          author: DEFAULT_TEAM_MEMBERS[1], // Sophea Kem (Lead Editor)
          content: 'Applied a smoother exponential ease-in ramp on the transition track. Check preview at 00:02.0.',
          createdAt: new Date(now - 1000 * 60 * 95).toISOString(),
        },
      ],
      reactions: { '👍': 2, '👀': 1 },
    },
    {
      id: `comm_${projectId}_2`,
      projectId,
      targetType: 'both',
      timestamp: 7.8,
      transcriptSegmentId: 2,
      author: DEFAULT_TEAM_MEMBERS[2], // Dara Chan (Khmer Translator)
      content: 'Khmer phonetic nuance: "ព្រះបាទសូរ្យវរ្ម័នទី២" (King Suryavarman II) should have a slight rhythmic pause after "ព្រះបាទ" for historical royal honorific reverence. The synthetic TTS pronunciation was slightly rushed.',
      category: 'translation_fix',
      priority: 'high',
      status: 'open',
      createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
      replies: [
        {
          id: `rep_${projectId}_2_1`,
          author: DEFAULT_TEAM_MEMBERS[3], // Vanna Meas (Audio Engineer)
          content: 'I will splice in a 250ms silence marker in the Voice Studio timeline or adjust the SSML break tag.',
          createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
        },
      ],
      reactions: { '🎯': 3, '❤️': 1 },
    },
    {
      id: `comm_${projectId}_3`,
      projectId,
      targetType: 'video',
      timestamp: 13.5,
      endTimestamp: 16.0,
      author: DEFAULT_TEAM_MEMBERS[3], // Vanna Meas (Audio Engineer)
      content: 'Field recording on the Apsara stone wall pan had slight wind rumble around 120Hz. Ran a high-pass filter + vocal isolator to keep narration pristine.',
      category: 'audio_note',
      priority: 'high',
      status: 'resolved',
      createdAt: new Date(now - 1000 * 60 * 300).toISOString(),
      resolvedBy: {
        authorName: 'Vanna Meas',
        resolvedAt: new Date(now - 1000 * 60 * 60).toISOString(),
      },
      replies: [
        {
          id: `rep_${projectId}_3_1`,
          author: DEFAULT_TEAM_MEMBERS[0], // Maisie Clarke
          content: 'Cleaned up remarkably well, background ambience is very crisp now!',
          createdAt: new Date(now - 1000 * 60 * 50).toISOString(),
        },
      ],
      reactions: { '🙌': 3 },
    },
    {
      id: `comm_${projectId}_4`,
      projectId,
      targetType: 'transcript',
      timestamp: 19.2,
      transcriptSegmentId: 4,
      author: DEFAULT_TEAM_MEMBERS[4], // Elena Rostova (Client Lead)
      content: 'Client loves the emotional arc of this closing line! Let us ensure this sentence remains front-and-center in the social media 60-second cut as well.',
      category: 'feedback',
      priority: 'low',
      status: 'open',
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
      replies: [],
      reactions: { '❤️': 4, '🎉': 2 },
    },
  ];
};

export const exportCommentsAsMarkdown = (project: Project, comments: ProjectComment[]): string => {
  const openCount = comments.filter(c => c.status === 'open').length;
  const inProgressCount = comments.filter(c => c.status === 'in_progress').length;
  const resolvedCount = comments.filter(c => c.status === 'resolved').length;

  let md = `# Team Feedback & Review Notes: ${project.name}\n\n`;
  md += `**Client/Workspace**: ${project.clientName || 'General Workspace'} | **Target**: ${project.targetLanguage.toUpperCase()}\n`;
  md += `**Total Notes**: ${comments.length} (${openCount} Open, ${inProgressCount} In Progress, ${resolvedCount} Resolved)\n`;
  md += `**Exported**: ${new Date().toLocaleString()}\n\n`;
  md += `---\n\n`;

  const sorted = [...comments].sort((a, b) => a.timestamp - b.timestamp);

  sorted.forEach((c, idx) => {
    const timeStr = formatTimestampShort(c.timestamp);
    const rangeStr = c.endTimestamp ? ` - ${formatTimestampShort(c.endTimestamp)}` : '';
    const statusStr = c.status.toUpperCase();
    const catStr = getCategoryMeta(c.category).label;
    const priStr = getPriorityMeta(c.priority).label;

    md += `### ${idx + 1}. [${timeStr}${rangeStr}] ${catStr} (${statusStr} - ${priStr})\n`;
    md += `**Author**: ${c.author.name} (${c.author.role}) | **Target**: ${c.targetType}\n`;
    if (c.transcriptSegmentId) {
      md += `**Linked Transcript Line**: #${c.transcriptSegmentId}\n`;
    }
    md += `\n> ${c.content}\n\n`;

    if (c.resolvedBy) {
      md += `*Resolved by ${c.resolvedBy.authorName} on ${new Date(c.resolvedBy.resolvedAt).toLocaleDateString()}*\n\n`;
    }

    if (c.replies.length > 0) {
      md += `**Replies (${c.replies.length}):**\n`;
      c.replies.forEach(r => {
        md += `- **${r.author.name}** (${r.author.role}): ${r.content} *(at ${new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})*\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  });

  return md;
};
