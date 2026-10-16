import { SubtitleSegment } from '../types/studio';

/**
 * Converts seconds (e.g. 75.32) to SRT timestamp string "00:01:15,320"
 */
export function secondsToSrtTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Converts SRT timestamp "00:01:15,320" or "00:01:15.320" to seconds
 */
export function srtTimestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const clean = timestamp.trim().replace('.', ',');
  const parts = clean.split(':');
  if (parts.length < 3) return 0;

  const hours = parseFloat(parts[0]) || 0;
  const minutes = parseFloat(parts[1]) || 0;
  const secParts = parts[2].split(',');
  const seconds = parseFloat(secParts[0]) || 0;
  const millis = parseFloat(secParts[1]) || 0;

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/**
 * Robust SRT parser handling Khmer Unicode, multiline subtitles, and malformed spacing
 */
export function parseSrt(srtContent: string): SubtitleSegment[] {
  if (!srtContent || !srtContent.trim()) return [];

  // Normalize newlines
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawBlocks = normalized.split(/\n\s*\n/);

  const segments: SubtitleSegment[] = [];
  let generatedId = 1;

  for (const block of rawBlocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timeLineIdx = i;
        break;
      }
    }

    if (timeLineIdx === -1) continue;

    const timeParts = lines[timeLineIdx].split('-->');
    if (timeParts.length !== 2) continue;

    const startTime = timeParts[0].trim();
    const endTime = timeParts[1].trim().split(' ')[0].trim(); // strip coordinates if present

    const startSeconds = srtTimestampToSeconds(startTime);
    const endSeconds = srtTimestampToSeconds(endTime);

    // Text lines are everything after the timeline
    const textLines = lines.slice(timeLineIdx + 1);
    const text = textLines.join('\n');

    // Parse optional speaker name e.g. [Narrator]: Hello or Narrator: Hello
    let speaker: string | undefined;
    let cleanText = text;
    const speakerMatch = text.match(/^\[?([A-Za-z0-9_\u1780-\u17FF\s]+)\]?:\s*(.*)/);
    if (speakerMatch && speakerMatch[1] && speakerMatch[1].length < 30) {
      speaker = speakerMatch[1].trim();
      cleanText = speakerMatch[2].trim();
    }

    const duration = Math.max(0.1, endSeconds - startSeconds);
    const cps = cleanText.length / duration;

    segments.push({
      id: generatedId++,
      startTime: secondsToSrtTimestamp(startSeconds),
      endTime: secondsToSrtTimestamp(endSeconds),
      startSeconds,
      endSeconds,
      text: cleanText,
      speaker,
      cpsAlert: cps > 22,
    });
  }

  // Detect overlaps
  return detectAndMarkOverlaps(segments);
}

/**
 * Generates standard SRT string from segments
 */
export function stringifySrt(segments: SubtitleSegment[]): string {
  return segments
    .map((seg, idx) => {
      const speakerPrefix = seg.speaker ? `[${seg.speaker}]: ` : '';
      return `${idx + 1}\n${seg.startTime} --> ${seg.endTime}\n${speakerPrefix}${seg.text}`;
    })
    .join('\n\n');
}

/**
 * Shifts all segments by a delta in milliseconds (+ or -)
 */
export function shiftTimestamps(segments: SubtitleSegment[], deltaMs: number): SubtitleSegment[] {
  const deltaSec = deltaMs / 1000;
  return segments.map(seg => {
    const newStart = Math.max(0, seg.startSeconds + deltaSec);
    const newEnd = Math.max(newStart + 0.5, seg.endSeconds + deltaSec);
    const duration = newEnd - newStart;
    const cps = seg.text.length / duration;

    return {
      ...seg,
      startSeconds: newStart,
      endSeconds: newEnd,
      startTime: secondsToSrtTimestamp(newStart),
      endTime: secondsToSrtTimestamp(newEnd),
      cpsAlert: cps > 22,
    };
  });
}

/**
 * Checks for overlapping timestamps between consecutive segments
 */
export function detectAndMarkOverlaps(segments: SubtitleSegment[]): SubtitleSegment[] {
  const sorted = [...segments].sort((a, b) => a.startSeconds - b.startSeconds);

  for (let i = 0; i < sorted.length; i++) {
    sorted[i].isOverlapping = false;
    if (i > 0) {
      if (sorted[i].startSeconds < sorted[i - 1].endSeconds) {
        sorted[i].isOverlapping = true;
        sorted[i - 1].isOverlapping = true;
      }
    }
  }

  return sorted;
}

/**
 * Resolves all overlaps by setting end time of previous segment to start time of next minus 50ms
 */
export function fixOverlaps(segments: SubtitleSegment[]): SubtitleSegment[] {
  const sorted = [...segments].sort((a, b) => a.startSeconds - b.startSeconds);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].endSeconds > sorted[i + 1].startSeconds) {
      const fixedEnd = Math.max(sorted[i].startSeconds + 0.3, sorted[i + 1].startSeconds - 0.05);
      sorted[i].endSeconds = fixedEnd;
      sorted[i].endTime = secondsToSrtTimestamp(fixedEnd);
    }
  }

  return detectAndMarkOverlaps(sorted);
}

/**
 * Khmer Unicode text helper: counts characters and preserves Khmer graphemes
 */
export function getKhmerWordCount(text: string): number {
  if (!text) return 0;
  // Khmer doesn't use spaces between words consistently; we use spaces and zero-width spaces
  const parts = text.split(/[\s\u200B\u200C\u200D]+/);
  return parts.filter(Boolean).length;
}
