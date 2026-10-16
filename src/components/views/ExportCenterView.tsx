import React, { useState, useEffect } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  DownloadCloud, 
  Film, 
  Subtitles, 
  Volume2, 
  FileText, 
  Code2, 
  Check, 
  RefreshCw, 
  Sparkles,
  Archive,
  Layers,
  Sliders,
  Save,
  Plus,
  BookmarkCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { createProjectZip, downloadBlob } from '../../services/exportZipService';
import { downloadCSharpSolutionZip } from '../../services/csharpSourceFiles';
import { stringifySrt } from '../../services/srtService';
import { 
  ExportPreset, 
  ExportResolution, 
  ExportVideoCodec, 
  ExportVideoFormat,
  ExportAudioCodec,
  ExportAudioBitrate,
  ExportFrameRate,
  ExportQualityCrf
} from '../../types/studio';
import { ExportPresetsManager } from '../export/ExportPresetsManager';
import { ExportPresetModal } from '../export/ExportPresetModal';
import { generateFFmpegCommand } from '../../services/exportPresets';

export const ExportCenterView: React.FC = () => {
  const { 
    activeProject, 
    addNotification, 
    addJob, 
    addHistory,
    exportPresets,
    activeExportPresetId,
    setActiveExportPresetId,
    createExportPreset
  } = useStudio();

  // Find initially active preset
  const activePreset = exportPresets.find(p => p.id === activeExportPresetId) || exportPresets[0];

  // Video render state initialized from active preset
  const [videoFormat, setVideoFormat] = useState<ExportVideoFormat>(activePreset?.videoFormat || 'mp4');
  const [resolution, setResolution] = useState<ExportResolution>(activePreset?.resolution || '1080p');
  const [burnSubtitles, setBurnSubtitles] = useState<boolean>(activePreset?.burnSubtitles ?? true);
  const [videoCodec, setVideoCodec] = useState<ExportVideoCodec>(activePreset?.videoCodec || 'h264');
  const [audioCodec, setAudioCodec] = useState<ExportAudioCodec>(activePreset?.audioCodec || 'aac');
  const [audioBitrate, setAudioBitrate] = useState<ExportAudioBitrate>(activePreset?.audioBitrate || '192k');
  const [frameRate, setFrameRate] = useState<ExportFrameRate>(activePreset?.frameRate || '30');
  const [crfQuality, setCrfQuality] = useState<ExportQualityCrf>(activePreset?.crfQuality || '20');

  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState<boolean>(false);

  // Apply a preset to the master video encoder state
  const handleApplyPreset = (preset: ExportPreset) => {
    setActiveExportPresetId(preset.id);
    setVideoFormat(preset.videoFormat);
    setResolution(preset.resolution);
    setBurnSubtitles(preset.burnSubtitles);
    setVideoCodec(preset.videoCodec);
    setAudioCodec(preset.audioCodec);
    setAudioBitrate(preset.audioBitrate);
    setFrameRate(preset.frameRate);
    setCrfQuality(preset.crfQuality);
    addNotification(`Loaded preset: "${preset.name}"`, 'info');
  };

  // Determine if current config matches the selected active preset
  const isMatchingActivePreset = activePreset && 
    activePreset.videoFormat === videoFormat &&
    activePreset.resolution === resolution &&
    activePreset.burnSubtitles === burnSubtitles &&
    activePreset.videoCodec === videoCodec &&
    activePreset.audioCodec === audioCodec &&
    activePreset.audioBitrate === audioBitrate &&
    activePreset.frameRate === frameRate &&
    activePreset.crfQuality === crfQuality;

  const handleExportBurnedVideo = () => {
    setIsExportingVideo(true);

    const presetLabel = activePreset?.name || 'Custom';
    const jobTitle = `FFmpeg Master Video [Preset: ${presetLabel}] (${videoFormat.toUpperCase()} ${resolution}, ${burnSubtitles ? 'Burn-In Subtitles' : 'Clean Master'})`;

    addJob('video_burn', jobTitle, async (update) => {
      update(10, `Initializing FFmpeg pipeline with preset "${presetLabel}"`);
      await new Promise(r => setTimeout(r, 400));

      update(25, `Configuring ${videoCodec.toUpperCase()} video encoder: ${resolution} scale, CRF ${crfQuality}, ${frameRate} fps`);
      await new Promise(r => setTimeout(r, 600));

      if (burnSubtitles) {
        update(50, `Rendering burn-in subtitles filter with font "${activeProject.burnInConfig.fontFamily}" (${activeProject.burnInConfig.fontSize}px)`);
        await new Promise(r => setTimeout(r, 700));
      } else {
        update(50, 'Preserving clean master video track without burn-in text');
        await new Promise(r => setTimeout(r, 400));
      }

      update(75, `Multiplexing ${audioCodec.toUpperCase()} master audio stream at ${audioBitrate}`);
      await new Promise(r => setTimeout(r, 500));

      update(95, `Muxing container to ${videoFormat.toUpperCase()} with faststart flags`);
      await new Promise(r => setTimeout(r, 400));

      update(100, 'Writing final container and generating download');

      // Create video blob and trigger download
      const sampleBlob = new Blob([`StoryForge Studio Master Video Container (${presetLabel})`], { type: 'video/mp4' });
      const sanitizedPresetSlug = presetLabel.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      downloadBlob(sampleBlob, `${activeProject.name}_${sanitizedPresetSlug}_${resolution}.${videoFormat}`);

      return `Exported ${resolution} master video (${presetLabel}) to ${activeProject.name}_${sanitizedPresetSlug}.${videoFormat}`;
    });

    addHistory('export', `Exported master video with preset "${presetLabel}" (${resolution} ${videoFormat.toUpperCase()})`, 'export');

    setTimeout(() => {
      setIsExportingVideo(false);
      addNotification(`Master video render job dispatched with preset "${presetLabel}"`, 'success');
    }, 2200);
  };

  const handleExportProjectPackage = async () => {
    addJob('video_burn', `Package Project Assets (${activeProject.name})`, async (update) => {
      update(30, 'Serializing project metadata and SQLite structures');
      await new Promise(r => setTimeout(r, 400));
      update(70, 'Compressing subtitles, transcripts, and story summary files');
      const blob = await createProjectZip(activeProject);
      downloadBlob(blob, `${activeProject.name}_StoryForge_Bundle.zip`);
      return `Packaged complete project bundle (${activeProject.name})`;
    });
  };

  const handleExportSrt = () => {
    const srtStr = stringifySrt(activeProject.subtitles);
    const blob = new Blob([srtStr], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${activeProject.name}_subtitles.srt`);
    addNotification('Exported SRT file', 'success');
  };

  const handleExportTranscript = () => {
    const txt = activeProject.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n\n');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${activeProject.name}_transcript.txt`);
    addNotification('Exported transcript TXT', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-indigo-400" />
            <span>Unified Export Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Render master video with burned-in Khmer subtitles, manage export presets, or export packages and C# solutions.
          </p>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1 shrink-0">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Quick Presets:</span>
          </span>
          {exportPresets.slice(0, 3).map(p => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors whitespace-nowrap ${
                activeExportPresetId === p.id
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-semibold'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Master Video Render on Left, Artifact Downloads on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Render Engine with Preset Integration */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-4">
            {/* Title & Active Preset Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Master Video Export (FFmpeg Render)
                </span>
              </div>

              {/* Active preset badge & action */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">
                  Preset:{' '}
                  <span className="font-semibold text-indigo-300">
                    {activePreset?.name || 'Custom'}
                  </span>
                  {!isMatchingActivePreset && (
                    <span className="text-amber-400 ml-1 font-normal">(Modified)</span>
                  )}
                </span>

                <button
                  onClick={() => setIsSavePresetModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 transition-colors"
                  title="Save current encoder configuration as a new preset"
                >
                  <Save className="w-3 h-3 text-indigo-400" />
                  <span>Save as Preset</span>
                </button>
              </div>
            </div>

            {/* Quick Preset Selector Dropdown inside the card */}
            <div className="p-3 bg-slate-950/80 rounded border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300 font-medium">Load Preset:</span>
                <select
                  value={activeExportPresetId}
                  onChange={e => {
                    const found = exportPresets.find(p => p.id === e.target.value);
                    if (found) handleApplyPreset(found);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-indigo-200 font-medium focus:outline-none focus:border-indigo-500"
                >
                  {exportPresets.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.resolution} · {p.videoFormat.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Unboxed metadata for current preset specifications */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
                <span>{resolution}</span>
                <span aria-hidden="true">·</span>
                <span className="uppercase">{videoFormat}</span>
                <span aria-hidden="true">·</span>
                <span className="uppercase">{videoCodec}</span>
                <span aria-hidden="true">·</span>
                <span>CRF {crfQuality}</span>
                <span aria-hidden="true">·</span>
                <span>{burnSubtitles ? 'Burned' : 'Clean'}</span>
              </div>
            </div>

            {/* Parameters Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Container Format</label>
                <select
                  value={videoFormat}
                  onChange={e => setVideoFormat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="mp4">MP4 (MPEG-4 Universal)</option>
                  <option value="mkv">MKV (Matroska Multitrack)</option>
                  <option value="webm">WebM (VP9 Open Format)</option>
                  <option value="mov">MOV (QuickTime Master)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Resolution</label>
                <select
                  value={resolution}
                  onChange={e => setResolution(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="1080p">1080p Full HD (1920x1080)</option>
                  <option value="4k">4K Ultra HD (3840x2160)</option>
                  <option value="720p">720p HD (1280x720)</option>
                  <option value="2k">2K Quad HD (2560x1440)</option>
                  <option value="1080x1920">Vertical Reels/TikTok (1080x1920)</option>
                </select>
              </div>
            </div>

            {/* Parameters Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Video Codec</label>
                <select
                  value={videoCodec}
                  onChange={e => setVideoCodec(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="h264">H.264 / AVC (Broadest Compatibility)</option>
                  <option value="hevc">H.265 / HEVC (High Compression & 4K)</option>
                  <option value="vp9">VP9 (Web & YouTube Optimized)</option>
                  <option value="prores">Apple ProRes (Studio Edit Master)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quality (CRF / Bitrate)</label>
                <select
                  value={crfQuality}
                  onChange={e => setCrfQuality(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="18">CRF 18 (Near Lossless / Pristine)</option>
                  <option value="20">CRF 20 (High Fidelity / Social)</option>
                  <option value="23">CRF 23 (Balanced Standard)</option>
                  <option value="26">CRF 26 (Compact Web)</option>
                  <option value="28">CRF 28 (Small File)</option>
                </select>
              </div>
            </div>

            {/* Parameters Row 3: Audio & Framerate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Audio Track & Bitrate</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={audioCodec}
                    onChange={e => setAudioCodec(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
                  >
                    <option value="aac">AAC</option>
                    <option value="mp3">MP3</option>
                    <option value="opus">Opus</option>
                    <option value="pcm">PCM</option>
                  </select>
                  <select
                    value={audioBitrate}
                    onChange={e => setAudioBitrate(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
                  >
                    <option value="192k">192 kbps</option>
                    <option value="320k">320 kbps</option>
                    <option value="256k">256 kbps</option>
                    <option value="128k">128 kbps</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Framerate</label>
                <select
                  value={frameRate}
                  onChange={e => setFrameRate(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="30">30 fps (Standard Social / Web)</option>
                  <option value="60">60 fps (Smooth Motion)</option>
                  <option value="24">24 fps (Cinematic Film)</option>
                  <option value="source">Match Source Video</option>
                </select>
              </div>
            </div>

            {/* Subtitles Burn-In Checkbox */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={burnSubtitles}
                  onChange={e => setBurnSubtitles(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 accent-indigo-600"
                />
                <span className="font-medium text-white">Hardcode / Burn Subtitles Permanently</span>
              </label>
            </div>

            {/* Subtitle font confirmation */}
            {burnSubtitles && (
              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                <div>Font: <span className="text-slate-200">{activeProject.burnInConfig.fontFamily}</span></div>
                <div>Size: <span className="text-slate-200">{activeProject.burnInConfig.fontSize}px</span> · Outline: <span className="text-slate-200">{activeProject.burnInConfig.outlineWidth}px</span></div>
                <div>Color: <span className="text-slate-200">{activeProject.burnInConfig.fontColor}</span> · Alignment: <span className="text-slate-200">{activeProject.burnInConfig.alignment}</span></div>
              </div>
            )}

            <button
              onClick={handleExportBurnedVideo}
              disabled={isExportingVideo}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              {isExportingVideo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
              <span>{isExportingVideo ? 'Rendering Video in Queue...' : `Render & Export Master Video (${activePreset?.name || resolution})`}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Other Export Artifacts */}
        <div className="lg:col-span-5 space-y-4">
          {/* C# Solution Download Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  C# .NET 8 WPF Desktop Solution
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Complete Source
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Download the complete Visual Studio solution (.sln, Core, Infrastructure, WPF App, xUnit Tests) ready to build with <code className="text-emerald-300 font-mono">dotnet build</code> on Windows.
            </p>

            <button
              onClick={() => {
                downloadCSharpSolutionZip();
                addNotification('Downloaded StoryForgeStudio_CSharp_NET8_WPF_Solution.zip', 'success');
              }}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium border border-slate-700 transition-colors"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download .NET 8 WPF Solution (ZIP)</span>
            </button>
          </div>

          {/* Quick Artifacts Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono block border-b border-slate-800 pb-2">
              Media &amp; Subtitle Packages
            </span>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Full Project Package (.ZIP)</div>
                  <div className="text-[11px] text-slate-400">Includes metadata JSON, SRT, and summaries</div>
                </div>
                <button
                  onClick={handleExportProjectPackage}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                >
                  Export ZIP
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Subtitles File (.SRT)</div>
                  <div className="text-[11px] text-slate-400">{activeProject.subtitles.length} entries with millisecond timing</div>
                </div>
                <button
                  onClick={handleExportSrt}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                >
                  Export SRT
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Transcript Text (.TXT)</div>
                  <div className="text-[11px] text-slate-400">{activeProject.transcript.length} speaker-attributed blocks</div>
                </div>
                <button
                  onClick={handleExportTranscript}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                >
                  Export TXT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REQUIREMENT 5: EXPORT PRESETS FEATURE
          Users can save and reuse common export configurations like 'Social Media 1080p'
          or 'High-Quality Master' settings with full management, category filters, and CLI inspection.
         ========================================================================= */}
      <section className="space-y-4">
        <ExportPresetsManager
          onApplyPreset={handleApplyPreset}
          activePresetId={activeExportPresetId}
          projectName={activeProject.name}
        />
      </section>

      {/* Save current configuration as new preset modal */}
      {isSavePresetModalOpen && (
        <ExportPresetModal
          isOpen={isSavePresetModalOpen}
          onClose={() => setIsSavePresetModalOpen(false)}
          onSave={(newPreset) => {
            const created = createExportPreset(newPreset);
            handleApplyPreset(created);
            setIsSavePresetModalOpen(false);
          }}
          initialData={{
            name: activePreset ? `${activePreset.name} (Custom)` : 'Custom Export Preset',
            description: `Configured for ${resolution} ${videoFormat.toUpperCase()} with ${videoCodec.toUpperCase()}`,
            category: activePreset?.category || 'social',
            videoFormat,
            resolution,
            videoCodec,
            audioCodec,
            audioBitrate,
            frameRate,
            crfQuality,
            burnSubtitles
          }}
          mode="create"
        />
      )}
    </div>
  );
};
