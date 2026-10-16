import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Sliders, 
  Sparkles, 
  Film, 
  Volume2, 
  Subtitles, 
  Layers, 
  Check 
} from 'lucide-react';
import { 
  ExportPreset, 
  ExportPresetCategory, 
  ExportResolution, 
  ExportVideoCodec, 
  ExportVideoFormat, 
  ExportAudioCodec, 
  ExportAudioBitrate, 
  ExportFrameRate, 
  ExportQualityCrf 
} from '../../types/studio';
import { generateFFmpegCommand } from '../../services/exportPresets';

interface ExportPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: Omit<ExportPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Partial<ExportPreset>;
  mode?: 'create' | 'edit';
}

export const ExportPresetModal: React.FC<ExportPresetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'create'
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<ExportPresetCategory>(initialData?.category || 'social');
  const [videoFormat, setVideoFormat] = useState<ExportVideoFormat>(initialData?.videoFormat || 'mp4');
  const [resolution, setResolution] = useState<ExportResolution>(initialData?.resolution || '1080p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | 'source'>(initialData?.aspectRatio || '16:9');
  const [videoCodec, setVideoCodec] = useState<ExportVideoCodec>(initialData?.videoCodec || 'h264');
  const [audioCodec, setAudioCodec] = useState<ExportAudioCodec>(initialData?.audioCodec || 'aac');
  const [audioBitrate, setAudioBitrate] = useState<ExportAudioBitrate>(initialData?.audioBitrate || '192k');
  const [frameRate, setFrameRate] = useState<ExportFrameRate>(initialData?.frameRate || '30');
  const [crfQuality, setCrfQuality] = useState<ExportQualityCrf>(initialData?.crfQuality || '20');
  const [burnSubtitles, setBurnSubtitles] = useState<boolean>(initialData?.burnSubtitles ?? true);
  const [colorSpace, setColorSpace] = useState<'rec709' | 'bt2020' | 'srgb'>(initialData?.colorSpace || 'rec709');
  const [customFfmpegArgs, setCustomFfmpegArgs] = useState(initialData?.customFfmpegArgs || '');

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a preset title (e.g. Social Media 1080p)');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || `${resolution} ${videoFormat.toUpperCase()} encoded with ${videoCodec.toUpperCase()}`,
      category,
      videoFormat,
      resolution,
      aspectRatio,
      videoCodec,
      audioCodec,
      audioBitrate,
      frameRate,
      crfQuality,
      burnSubtitles,
      colorSpace,
      customFfmpegArgs: customFfmpegArgs.trim() || undefined,
      isBuiltIn: false
    });

    onClose();
  };

  const previewCommand = generateFFmpegCommand({
    videoFormat,
    resolution,
    videoCodec,
    audioCodec,
    audioBitrate,
    frameRate,
    crfQuality,
    burnSubtitles
  }, 'SampleProject');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {mode === 'create' ? 'Save New Export Preset' : 'Edit Export Preset'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure reusable video encoder specifications and subtitle burn-in rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Quick preset suggestions */}
          {mode === 'create' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Quick Inspiration Shortcuts</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Social Media 1080p', cat: 'social' as const, res: '1080p' as const, burn: true, codec: 'h264' as const, crf: '20' as const },
                  { name: 'High-Quality Master 4K', cat: 'master' as const, res: '4k' as const, burn: false, codec: 'hevc' as const, crf: '18' as const },
                  { name: 'Reels / TikTok Vertical', cat: 'social' as const, res: '1080x1920' as const, burn: true, codec: 'h264' as const, crf: '20' as const },
                  { name: 'Web Fast Draft 720p', cat: 'web' as const, res: '720p' as const, burn: true, codec: 'h264' as const, crf: '26' as const },
                ].map(s => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => {
                      setName(s.name);
                      setCategory(s.cat);
                      setResolution(s.res);
                      setBurnSubtitles(s.burn);
                      setVideoCodec(s.codec);
                      setCrfQuality(s.crf);
                      setError(null);
                    }}
                    className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700/60 transition-colors"
                  >
                    + {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preset Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                Preset Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Social Media 1080p, High-Quality Master"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExportPresetCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="social">Social Media</option>
                <option value="master">Master & Archive</option>
                <option value="web">Web & Streaming</option>
                <option value="broadcast">Broadcast / Studio</option>
                <option value="custom">Custom Pipeline</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Usage Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detail target distribution platforms, intended audience, or delivery specifications..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Video Parameters Section */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Video & Container Encoding</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Container Format</label>
                <select
                  value={videoFormat}
                  onChange={e => setVideoFormat(e.target.value as ExportVideoFormat)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="mp4">MP4 (Universal MPEG-4)</option>
                  <option value="mkv">MKV (Matroska Multitrack)</option>
                  <option value="webm">WebM (VP9 Open Format)</option>
                  <option value="mov">MOV (QuickTime Master)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Resolution Scale</label>
                <select
                  value={resolution}
                  onChange={e => {
                    const res = e.target.value as ExportResolution;
                    setResolution(res);
                    if (res === '1080x1920') {
                      setAspectRatio('9:16');
                    } else if (aspectRatio === '9:16') {
                      setAspectRatio('16:9');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="1080p">1080p Full HD (1920x1080)</option>
                  <option value="4k">4K Ultra HD (3840x2160)</option>
                  <option value="720p">720p HD (1280x720)</option>
                  <option value="2k">2K Quad HD (2560x1440)</option>
                  <option value="1080x1920">Vertical Reels/TikTok (1080x1920)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="16:9">16:9 Widescreen (Landscape)</option>
                  <option value="9:16">9:16 Vertical (Shorts/Reels)</option>
                  <option value="1:1">1:1 Square (Instagram Feed)</option>
                  <option value="source">Match Source Video</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Video Codec</label>
                <select
                  value={videoCodec}
                  onChange={e => setVideoCodec(e.target.value as ExportVideoCodec)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="h264">H.264 / AVC (Most Compatible)</option>
                  <option value="hevc">H.265 / HEVC (High Efficiency)</option>
                  <option value="vp9">VP9 (Web / YouTube)</option>
                  <option value="prores">Apple ProRes (Studio Edit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Framerate (FPS)</label>
                <select
                  value={frameRate}
                  onChange={e => setFrameRate(e.target.value as ExportFrameRate)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="30">30 fps (Broadcast / Social)</option>
                  <option value="60">60 fps (Smooth Motion)</option>
                  <option value="24">24 fps (Cinematic Film)</option>
                  <option value="source">Source Rate</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">CRF Quality Score</label>
                <select
                  value={crfQuality}
                  onChange={e => setCrfQuality(e.target.value as ExportQualityCrf)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="18">CRF 18 (Near Lossless / Pristine)</option>
                  <option value="20">CRF 20 (High Fidelity / Clean)</option>
                  <option value="23">CRF 23 (Balanced Standard)</option>
                  <option value="26">CRF 26 (Compact Web)</option>
                  <option value="28">CRF 28 (Ultra Lightweight)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audio & Subtitle Parameters Section */}
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-lg space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audio Mastering & Captions</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Audio Codec</label>
                <select
                  value={audioCodec}
                  onChange={e => setAudioCodec(e.target.value as ExportAudioCodec)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="aac">AAC (MPEG-4 Audio)</option>
                  <option value="mp3">MP3 (MPEG Layer III)</option>
                  <option value="opus">Opus (Modern Low-Bitrate)</option>
                  <option value="pcm">PCM Uncompressed (Master 24-bit)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Audio Bitrate</label>
                <select
                  value={audioBitrate}
                  onChange={e => setAudioBitrate(e.target.value as ExportAudioBitrate)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="192k">192 kbps (Standard High-Fidelity)</option>
                  <option value="320k">320 kbps (Studio Grade Master)</option>
                  <option value="256k">256 kbps (Premium Web)</option>
                  <option value="128k">128 kbps (Draft / Mobile Compact)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={burnSubtitles}
                  onChange={e => setBurnSubtitles(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-600"
                />
                <span className="font-medium text-white">Permanently Burn-In Subtitles on Master Video</span>
              </label>
              <p className="text-[11px] text-slate-400 ml-6 mt-0.5">
                {burnSubtitles 
                  ? 'Captions will be hardcoded onto video pixels using configured Khmer font and outline.'
                  : 'Clean video plate without hardcoded text (subtitles exported separately as .SRT).'}
              </p>
            </div>
          </div>

          {/* Live FFmpeg Pipeline Preview */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Synthesized FFmpeg Command Preview
            </span>
            <div className="p-2.5 bg-black/60 rounded border border-slate-800/80 font-mono text-[11px] text-emerald-400 break-all leading-relaxed">
              {previewCommand}
            </div>
          </div>
        </form>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{mode === 'create' ? 'Save Preset' : 'Update Preset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
