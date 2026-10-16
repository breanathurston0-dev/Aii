import { ExportPreset } from '../types/studio';

export const DEFAULT_EXPORT_PRESETS: ExportPreset[] = [
  {
    id: 'preset_social_1080p',
    name: 'Social Media 1080p',
    description: 'Optimized for Instagram, Facebook, and YouTube feeds with crisp 1080p H.264 and burned-in subtitles.',
    category: 'social',
    isBuiltIn: true,
    videoFormat: 'mp4',
    resolution: '1080p',
    aspectRatio: '16:9',
    videoCodec: 'h264',
    audioCodec: 'aac',
    audioBitrate: '192k',
    frameRate: '30',
    crfQuality: '20',
    burnSubtitles: true,
    colorSpace: 'rec709',
    customFfmpegArgs: '-preset medium -movflags +faststart -pix_fmt yuv420p',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'preset_master_hq',
    name: 'High-Quality Master',
    description: 'Pristine 4K HEVC master with 320k studio audio for archival, grading, and master distribution.',
    category: 'master',
    isBuiltIn: true,
    videoFormat: 'mp4',
    resolution: '4k',
    aspectRatio: '16:9',
    videoCodec: 'hevc',
    audioCodec: 'aac',
    audioBitrate: '320k',
    frameRate: '60',
    crfQuality: '18',
    burnSubtitles: false,
    colorSpace: 'bt2020',
    customFfmpegArgs: '-tag:v hvc1 -preset slow -pix_fmt yuv420p10le',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'preset_vertical_reels',
    name: 'TikTok & Reels Vertical 1080p',
    description: '9:16 vertical orientation with prominent hardcoded captions for TikTok, Instagram Reels, and YouTube Shorts.',
    category: 'social',
    isBuiltIn: true,
    videoFormat: 'mp4',
    resolution: '1080x1920',
    aspectRatio: '9:16',
    videoCodec: 'h264',
    audioCodec: 'aac',
    audioBitrate: '192k',
    frameRate: '30',
    crfQuality: '20',
    burnSubtitles: true,
    colorSpace: 'rec709',
    customFfmpegArgs: '-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -preset medium',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'preset_web_fast_share',
    name: 'Web Fast Share 720p',
    description: 'Compact 720p encode for speedy upload, client review drafts, Discord, and messaging sharing.',
    category: 'web',
    isBuiltIn: true,
    videoFormat: 'mp4',
    resolution: '720p',
    aspectRatio: '16:9',
    videoCodec: 'h264',
    audioCodec: 'aac',
    audioBitrate: '128k',
    frameRate: '30',
    crfQuality: '26',
    burnSubtitles: true,
    colorSpace: 'rec709',
    customFfmpegArgs: '-preset fast -movflags +faststart',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'preset_youtube_4k_vp9',
    name: 'YouTube 4K WebM / VP9',
    description: 'Ultra HD 4K VP9 open-container optimized to trigger high-bitrate YouTube transcoding servers.',
    category: 'web',
    isBuiltIn: true,
    videoFormat: 'webm',
    resolution: '4k',
    aspectRatio: '16:9',
    videoCodec: 'vp9',
    audioCodec: 'opus',
    audioBitrate: '256k',
    frameRate: '60',
    crfQuality: '20',
    burnSubtitles: true,
    colorSpace: 'rec709',
    customFfmpegArgs: '-b:v 0 -crf 20 -threads 8',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'preset_broadcast_mkv_master',
    name: 'Broadcast Master MKV',
    description: 'Production multitrack Matroska container with separate audio streams and clean master visual plate.',
    category: 'broadcast',
    isBuiltIn: true,
    videoFormat: 'mkv',
    resolution: '1080p',
    aspectRatio: '16:9',
    videoCodec: 'prores',
    audioCodec: 'pcm',
    audioBitrate: '320k',
    frameRate: '24',
    crfQuality: '18',
    burnSubtitles: false,
    colorSpace: 'rec709',
    customFfmpegArgs: '-profile:v 3 -vendor apl0',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const PRESET_STORAGE_KEY = 'storyforge_export_presets';
export const ACTIVE_PRESET_KEY = 'storyforge_active_export_preset_id';

export function loadExportPresetsFromStorage(): ExportPreset[] {
  try {
    const raw = localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) return DEFAULT_EXPORT_PRESETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_EXPORT_PRESETS;
    
    // Ensure all built-in presets still exist
    const userPresetIds = new Set(parsed.map((p: ExportPreset) => p.id));
    const merged = [...parsed];
    for (const def of DEFAULT_EXPORT_PRESETS) {
      if (!userPresetIds.has(def.id)) {
        merged.unshift(def);
      }
    }
    return merged;
  } catch (err) {
    console.warn('Failed to parse export presets from storage:', err);
    return DEFAULT_EXPORT_PRESETS;
  }
}

export function saveExportPresetsToStorage(presets: ExportPreset[]): void {
  try {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.warn('Failed to save export presets to storage:', err);
  }
}

export function generateFFmpegCommand(preset: Partial<ExportPreset>, projectName: string): string {
  const format = preset.videoFormat || 'mp4';
  const res = preset.resolution || '1080p';
  const codec = preset.videoCodec || 'h264';
  const audioCodec = preset.audioCodec || 'aac';
  const audioBitrate = preset.audioBitrate || '192k';
  const crf = preset.crfQuality || '20';
  const fps = preset.frameRate || '30';
  const burn = preset.burnSubtitles;

  let scaleArg = 'scale=1920:1080';
  if (res === '4k') scaleArg = 'scale=3840:2160';
  else if (res === '720p') scaleArg = 'scale=1280:720';
  else if (res === '2k') scaleArg = 'scale=2560:1440';
  else if (res === '1080x1920') scaleArg = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';

  const filterPart = burn 
    ? `-vf "${scaleArg},subtitles=subs.srt:force_style='FontName=Kantumruy Pro,FontSize=22,PrimaryColour=&H00FFFFFF'"`
    : `-vf "${scaleArg}"`;

  const videoEncoder = codec === 'hevc' ? 'libx265' : codec === 'vp9' ? 'libvpx-vp9' : codec === 'prores' ? 'prores_ks' : 'libx264';
  const audioEncoder = audioCodec === 'opus' ? 'libopus' : audioCodec === 'mp3' ? 'libmp3lame' : audioCodec === 'pcm' ? 'pcm_s16le' : 'aac';

  const sanitized = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `ffmpeg -i input_master.mp4 ${filterPart} -c:v ${videoEncoder} -crf ${crf} -r ${fps} -c:a ${audioEncoder} -b:a ${audioBitrate} output_${sanitized}_${res}.${format}`;
}
