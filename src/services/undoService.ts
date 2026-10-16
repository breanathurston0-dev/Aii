import { Project, UndoHistoryEntry, UndoActionCategory } from '../types/studio';

export const MAX_UNDO_STACK_SIZE = 50;
export const DEBOUNCE_COALESCE_MS = 1000;

/**
 * Checks whether two project states differ in meaningful content
 * (ignoring superficial timestamp updates like updatedAt).
 */
export function hasMeaningfulProjectChange(prev: Project, next: Project): boolean {
  if (prev === next) return false;

  // Quick reference check on main complex fields
  if (
    prev.subtitles !== next.subtitles ||
    prev.transcript !== next.transcript ||
    prev.mediaFiles !== next.mediaFiles ||
    prev.burnInConfig !== next.burnInConfig ||
    prev.milestones !== next.milestones ||
    prev.comments !== next.comments ||
    prev.voiceMappings !== next.voiceMappings ||
    prev.durationSeconds !== next.durationSeconds ||
    prev.name !== next.name ||
    prev.description !== next.description ||
    prev.sourceLanguage !== next.sourceLanguage ||
    prev.targetLanguage !== next.targetLanguage ||
    prev.deadline !== next.deadline ||
    prev.startDate !== next.startDate ||
    prev.status !== next.status
  ) {
    // If references differ, verify if deep content actually differs
    if (JSON.stringify({ ...prev, updatedAt: '' }) !== JSON.stringify({ ...next, updatedAt: '' })) {
      return true;
    }
  }

  return false;
}

/**
 * Automatically infers a user-friendly action description and category
 * when an editor updates the active project without an explicit description.
 */
export function inferActionDescriptionAndCategory(
  prev: Project,
  next: Project,
  explicitDescription?: string
): { description: string; category: UndoActionCategory } {
  if (explicitDescription && explicitDescription.trim()) {
    const descLower = explicitDescription.toLowerCase();
    let category: UndoActionCategory = 'general';
    if (descLower.includes('sub') || descLower.includes('caption')) category = 'subtitles';
    else if (descLower.includes('transcript') || descLower.includes('speech')) category = 'transcript';
    else if (descLower.includes('clip') || descLower.includes('trim') || descLower.includes('split') || descLower.includes('media')) category = 'media';
    else if (descLower.includes('font') || descLower.includes('burn') || descLower.includes('style')) category = 'burnin';
    else if (descLower.includes('audio') || descLower.includes('volume') || descLower.includes('stem')) category = 'audio';
    else if (descLower.includes('milestone') || descLower.includes('deadline')) category = 'milestones';
    else if (descLower.includes('comment') || descLower.includes('feedback') || descLower.includes('note')) category = 'comments';
    else if (descLower.includes('project') || descLower.includes('title') || descLower.includes('name')) category = 'metadata';

    return { description: explicitDescription.trim(), category };
  }

  // Infer based on field differences
  if (prev.subtitles !== next.subtitles) {
    const prevLen = prev.subtitles.length;
    const nextLen = next.subtitles.length;
    if (nextLen > prevLen) return { description: `Add Subtitle Segment (${nextLen})`, category: 'subtitles' };
    if (nextLen < prevLen) return { description: `Delete Subtitle Segment`, category: 'subtitles' };
    return { description: 'Edit Subtitle Text / Timings', category: 'subtitles' };
  }

  if (prev.transcript !== next.transcript) {
    const prevLen = prev.transcript.length;
    const nextLen = next.transcript.length;
    if (nextLen > prevLen) return { description: `Add Transcript Segment`, category: 'transcript' };
    if (nextLen < prevLen) return { description: `Delete Transcript Segment`, category: 'transcript' };
    return { description: 'Edit Transcript Text', category: 'transcript' };
  }

  if (prev.mediaFiles !== next.mediaFiles || prev.durationSeconds !== next.durationSeconds) {
    if (prev.durationSeconds !== next.durationSeconds) {
      return { description: `Trim / Adjust Video Timeline (${next.durationSeconds.toFixed(1)}s)`, category: 'media' };
    }
    return { description: 'Update Video Clips', category: 'media' };
  }

  if (prev.burnInConfig !== next.burnInConfig) {
    return { description: 'Update Subtitle Styling & Burn-in', category: 'burnin' };
  }

  if (prev.milestones !== next.milestones) {
    return { description: 'Update Project Milestones', category: 'milestones' };
  }

  if (prev.voiceMappings !== next.voiceMappings) {
    return { description: 'Update Voice Profiles & Clones', category: 'audio' };
  }

  if (prev.name !== next.name || prev.description !== next.description) {
    return { description: `Rename Project: "${next.name}"`, category: 'metadata' };
  }

  if (prev.comments !== next.comments) {
    return { description: 'Update Comments & Notes', category: 'comments' };
  }

  return { description: 'Project Edit', category: 'general' };
}

/**
 * Creates a pristine deep clone snapshot of a project for undo/redo state preservation.
 */
export function cloneProjectForUndo(project: Project): Project {
  return JSON.parse(JSON.stringify(project));
}
