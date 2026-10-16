import { Project, ProjectSnapshot, BackupSettings, SnapshotTriggerType } from '../types/studio';
import { downloadBlob } from './exportZipService';

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  autoBackupEnabled: true,
  intervalSeconds: 60, // 1 minute auto-backup interval
  maxSnapshotsPerProject: 25,
  cloudSyncEnabled: true,
  saveOnMajorMilestone: true,
  saveBeforeExport: true,
};

export const SNAPSHOT_STORAGE_KEY = 'storyforge_project_snapshots';
export const BACKUP_SETTINGS_STORAGE_KEY = 'storyforge_backup_settings';

/**
 * Calculates byte size of a project snapshot in memory
 */
export function calculateProjectSizeBytes(project: Project): number {
  try {
    const jsonStr = JSON.stringify(project);
    return new Blob([jsonStr]).size;
  } catch {
    return 24500;
  }
}

/**
 * Formats bytes to human-readable string (KB, MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Compares two project states and detects specific incremental changes
 */
export function detectProjectChanges(current: Project, previous?: Project): string[] {
  if (!previous) {
    return ['Initial project state created'];
  }

  const changes: string[] = [];

  // Subtitles
  const currSubCount = current.subtitles?.length || 0;
  const prevSubCount = previous.subtitles?.length || 0;
  if (currSubCount !== prevSubCount) {
    const diff = currSubCount - prevSubCount;
    changes.push(`Subtitles ${diff > 0 ? `+${diff}` : diff} (${prevSubCount} → ${currSubCount})`);
  } else if (JSON.stringify(current.subtitles) !== JSON.stringify(previous.subtitles)) {
    changes.push('Subtitle timings or text content edited');
  }

  // Transcripts
  const currTransCount = current.transcript?.length || 0;
  const prevTransCount = previous.transcript?.length || 0;
  if (currTransCount !== prevTransCount) {
    changes.push(`Transcript segments ${currTransCount > prevTransCount ? `+${currTransCount - prevTransCount}` : currTransCount - prevTransCount}`);
  } else if (JSON.stringify(current.transcript) !== JSON.stringify(previous.transcript)) {
    changes.push('Transcript text or speaker tags updated');
  }

  // Comments
  const currCommentCount = current.comments?.length || 0;
  const prevCommentCount = previous.comments?.length || 0;
  if (currCommentCount !== prevCommentCount) {
    changes.push(`Comments count changed (${prevCommentCount} → ${currCommentCount})`);
  }

  // Milestones
  const currMilestones = current.milestones || [];
  const prevMilestones = previous.milestones || [];
  const currDone = currMilestones.filter(m => m.completed).length;
  const prevDone = prevMilestones.filter(m => m.completed).length;
  if (currDone !== prevDone) {
    changes.push(`Milestones completed: ${currDone}/${currMilestones.length} (was ${prevDone})`);
  }

  // Media
  if ((current.mediaFiles?.length || 0) !== (previous.mediaFiles?.length || 0)) {
    changes.push(`Media files count: ${current.mediaFiles?.length || 0}`);
  }

  // Deadline / Timeline
  if (current.deadline !== previous.deadline) {
    changes.push(`Target deadline updated: ${current.deadline ? new Date(current.deadline).toLocaleDateString() : 'None'}`);
  }

  // Target or source language
  if (current.targetLanguage !== previous.targetLanguage) {
    changes.push(`Target language shifted: ${previous.targetLanguage} → ${current.targetLanguage}`);
  }

  // Default if identical
  if (changes.length === 0) {
    changes.push('Incremental state checkpoint');
  }

  return changes;
}

/**
 * Creates a new project snapshot with versioning and change summary
 */
export function createProjectSnapshot(
  project: Project,
  trigger: SnapshotTriggerType,
  label?: string,
  existingSnapshotsForProject: ProjectSnapshot[] = [],
  destination: 'local' | 'cloud' | 'both' = 'both'
): ProjectSnapshot {
  const versionNum = existingSnapshotsForProject.length + 1;
  const previousSnapshot = existingSnapshotsForProject[existingSnapshotsForProject.length - 1];
  const changes = detectProjectChanges(project, previousSnapshot?.projectData);
  const sizeBytes = calculateProjectSizeBytes(project);

  const versionTag = trigger === 'manual' 
    ? `v1.${versionNum}` 
    : trigger === 'restore_point' 
    ? `v1.${versionNum}-pre-restore`
    : `v1.${versionNum}-${trigger.slice(0, 4)}`;

  const now = new Date().toISOString();

  return {
    id: `snap_${project.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    projectId: project.id,
    projectName: project.name,
    versionTag,
    timestamp: now,
    trigger,
    label: label || (trigger === 'automated' ? 'Automated incremental save' : trigger === 'manual' ? 'Manual user checkpoint' : 'System checkpoint'),
    summary: {
      subtitleCount: project.subtitles?.length || 0,
      transcriptCount: project.transcript?.length || 0,
      mediaCount: project.mediaFiles?.length || 0,
      milestoneCount: project.milestones?.length || 0,
      commentCount: project.comments?.length || 0,
      sizeBytes,
      changesDetected: changes,
    },
    destination,
    cloudSynced: destination === 'cloud' || destination === 'both',
    cloudSyncTimestamp: destination === 'cloud' || destination === 'both' ? now : undefined,
    projectData: JSON.parse(JSON.stringify(project)), // Deep clone
  };
}

/**
 * Exports a snapshot as a downloadable JSON file
 */
export function exportSnapshotJson(snapshot: ProjectSnapshot): void {
  const data = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const filename = `${snapshot.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${snapshot.versionTag}_backup.json`;
  downloadBlob(blob, filename);
}

/**
 * Exports all project snapshots as a master archive JSON file
 */
export function exportAllSnapshotsJson(snapshots: ProjectSnapshot[]): void {
  const data = JSON.stringify({
    exportedAt: new Date().toISOString(),
    totalSnapshots: snapshots.length,
    snapshots
  }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadBlob(blob, `storyforge_all_versions_backup_${Date.now()}.json`);
}

/**
 * Generates initial rich historical sample snapshots for default projects
 */
export function generateInitialSampleSnapshots(projects: Project[]): ProjectSnapshot[] {
  const sampleProject = projects.find(p => p.id === 'proj_khmer_angkor_01') || projects[0];
  if (!sampleProject) return [];

  const now = Date.now();
  const snapshots: ProjectSnapshot[] = [];

  // Snapshot 1: 3 hours ago (Initial import & audio extraction)
  const projV1: Project = JSON.parse(JSON.stringify(sampleProject));
  projV1.subtitles = sampleProject.subtitles.slice(0, 2);
  projV1.transcript = sampleProject.transcript?.slice(0, 2);
  if (projV1.milestones) {
    projV1.milestones = projV1.milestones.map((m, idx) => ({ ...m, completed: idx === 0 }));
  }

  snapshots.push({
    id: `snap_${sampleProject.id}_init`,
    projectId: sampleProject.id,
    projectName: sampleProject.name,
    versionTag: 'v1.0-init',
    timestamp: new Date(now - 1000 * 60 * 180).toISOString(),
    trigger: 'manual',
    label: 'Initial Media Import & Waveform Analysis',
    summary: {
      subtitleCount: 2,
      transcriptCount: 2,
      mediaCount: sampleProject.mediaFiles.length,
      milestoneCount: sampleProject.milestones?.length || 0,
      commentCount: 0,
      sizeBytes: calculateProjectSizeBytes(projV1),
      changesDetected: ['Project created and video source linked', 'Extracted 16kHz mono audio stream'],
    },
    destination: 'both',
    cloudSynced: true,
    cloudSyncTimestamp: new Date(now - 1000 * 60 * 179).toISOString(),
    projectData: projV1,
  });

  // Snapshot 2: 1 hour ago (Gemini & Whisper Transcription complete)
  const projV2: Project = JSON.parse(JSON.stringify(sampleProject));
  projV2.subtitles = sampleProject.subtitles.slice(0, 4);
  if (projV2.milestones) {
    projV2.milestones = projV2.milestones.map((m, idx) => ({ ...m, completed: idx < 2 }));
  }

  snapshots.push({
    id: `snap_${sampleProject.id}_transcription`,
    projectId: sampleProject.id,
    projectName: sampleProject.name,
    versionTag: 'v1.1-transcribe',
    timestamp: new Date(now - 1000 * 60 * 65).toISOString(),
    trigger: 'ai_generation',
    label: 'Whisper & Gemini Speech Recognition Pass',
    summary: {
      subtitleCount: 4,
      transcriptCount: sampleProject.transcript?.length || 4,
      mediaCount: sampleProject.mediaFiles.length,
      milestoneCount: sampleProject.milestones?.length || 0,
      commentCount: 1,
      sizeBytes: calculateProjectSizeBytes(projV2),
      changesDetected: ['Added 4 Khmer Unicode transcript segments', 'Generated draft subtitles with speech timecodes'],
    },
    destination: 'both',
    cloudSynced: true,
    cloudSyncTimestamp: new Date(now - 1000 * 60 * 64).toISOString(),
    projectData: projV2,
  });

  // Snapshot 3: 20 minutes ago (Team Review Notes & Subtitle Polish)
  const projV3: Project = JSON.parse(JSON.stringify(sampleProject));
  projV3.subtitles = sampleProject.subtitles.slice(0, 5);

  snapshots.push({
    id: `snap_${sampleProject.id}_review`,
    projectId: sampleProject.id,
    projectName: sampleProject.name,
    versionTag: 'v1.2-review',
    timestamp: new Date(now - 1000 * 60 * 20).toISOString(),
    trigger: 'milestone',
    label: 'Editorial Review & Khmer Glyph Alignment',
    summary: {
      subtitleCount: 5,
      transcriptCount: sampleProject.transcript?.length || 4,
      mediaCount: sampleProject.mediaFiles.length,
      milestoneCount: sampleProject.milestones?.length || 0,
      commentCount: sampleProject.comments?.length || 3,
      sizeBytes: calculateProjectSizeBytes(projV3),
      changesDetected: ['Subtitle styling set to Noto Sans Khmer', 'Editorial team feedback notes attached'],
    },
    destination: 'both',
    cloudSynced: true,
    cloudSyncTimestamp: new Date(now - 1000 * 60 * 19).toISOString(),
    projectData: projV3,
  });

  return snapshots;
}
