import JSZip from 'jszip';
import { Project } from '../types/studio';
import { stringifySrt } from './srtService';

export async function createProjectZip(project: Project): Promise<Blob> {
  const zip = new JSZip();

  // Project metadata
  zip.file('project.json', JSON.stringify(project, null, 2));

  // Subtitles
  if (project.subtitles && project.subtitles.length > 0) {
    zip.file('subtitles.srt', stringifySrt(project.subtitles));
  }

  // Transcripts
  if (project.transcript && project.transcript.length > 0) {
    const txtTranscript = project.transcript
      .map(t => `[${t.startTime.toFixed(2)}s - ${t.endTime.toFixed(2)}s] ${t.speaker}: ${t.text}`)
      .join('\n');
    zip.file('transcript.txt', txtTranscript);
    zip.file('transcript.json', JSON.stringify(project.transcript, null, 2));
  }

  // Story Summaries
  if (project.storySummary) {
    const summaryMd = `# ${project.storySummary.title}
## Synopsis
${project.storySummary.synopsis}

## Key Events
${project.storySummary.keyEvents.map(e => `- ${e}`).join('\n')}

## Scene Breakdown
${project.storySummary.sceneOutline.map(s => `### Scene ${s.sceneNumber}: ${s.title} (${s.durationSeconds}s)\n${s.description}`).join('\n\n')}

## Narration Script
${project.storySummary.narrationScript}
`;
    zip.file('story_summary.md', summaryMd);
  }

  return zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
