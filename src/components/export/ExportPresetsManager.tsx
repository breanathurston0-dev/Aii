import React, { useState, useMemo, useRef } from 'react';
import { 
  Sliders, 
  Plus, 
  Check, 
  Copy, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw, 
  Search, 
  Film, 
  Terminal, 
  Sparkles,
  Share2,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStudio } from '../../context/StudioContext';
import { ExportPreset, ExportPresetCategory } from '../../types/studio';
import { generateFFmpegCommand } from '../../services/exportPresets';
import { ExportPresetModal } from './ExportPresetModal';

interface ExportPresetsManagerProps {
  onApplyPreset: (preset: ExportPreset) => void;
  activePresetId?: string;
  projectName: string;
}

export const ExportPresetsManager: React.FC<ExportPresetsManagerProps> = ({
  onApplyPreset,
  activePresetId,
  projectName
}) => {
  const { 
    exportPresets, 
    createExportPreset, 
    updateExportPreset, 
    deleteExportPreset, 
    resetExportPresets, 
    duplicateExportPreset,
    addNotification 
  } = useStudio();

  const [activeCategory, setActiveCategory] = useState<ExportPresetCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingFfmpegId, setInspectingFfmpegId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPreset, setEditingPreset] = useState<ExportPreset | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories count
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: exportPresets.length };
    exportPresets.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [exportPresets]);

  // Filtered presets
  const filteredPresets = useMemo(() => {
    return exportPresets.filter(p => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.videoFormat.toLowerCase().includes(q) ||
        p.videoCodec.toLowerCase().includes(q) ||
        p.resolution.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [exportPresets, activeCategory, searchQuery]);

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setEditingPreset(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditModal = (preset: ExportPreset) => {
    setEditingPreset(preset);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Handle save from modal
  const handleSaveModal = (presetData: Omit<ExportPreset, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (modalMode === 'edit' && editingPreset) {
      updateExportPreset(editingPreset.id, presetData);
    } else {
      const created = createExportPreset(presetData);
      onApplyPreset(created);
    }
  };

  // Export Presets as JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(exportPresets, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyforge_export_presets_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Exported preset library JSON', 'success');
  };

  // Import Presets from JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) {
          throw new Error('File does not contain a presets array');
        }

        let importedCount = 0;
        imported.forEach((item: any) => {
          if (item && item.name && item.videoFormat && item.resolution) {
            createExportPreset({
              name: item.name,
              description: item.description || '',
              category: item.category || 'custom',
              videoFormat: item.videoFormat || 'mp4',
              resolution: item.resolution || '1080p',
              aspectRatio: item.aspectRatio || '16:9',
              videoCodec: item.videoCodec || 'h264',
              audioCodec: item.audioCodec || 'aac',
              audioBitrate: item.audioBitrate || '192k',
              frameRate: item.frameRate || '30',
              crfQuality: item.crfQuality || '20',
              burnSubtitles: item.burnSubtitles ?? true,
              colorSpace: item.colorSpace || 'rec709',
              customFfmpegArgs: item.customFfmpegArgs
            });
            importedCount++;
          }
        });

        addNotification(`Imported ${importedCount} export presets successfully`, 'success');
      } catch (err: any) {
        addNotification(`Failed to parse presets file: ${err.message}`, 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Export Presets Library
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Save and reuse standard configurations like <span className="text-indigo-300 font-medium">Social Media 1080p</span> or <span className="text-indigo-300 font-medium">High-Quality Master</span>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Hidden File Input for import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJson}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import presets from JSON"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportJson}
            title="Export presets as JSON"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset all presets to default factory collection? Custom presets will be cleared.')) {
                resetExportPresets();
              }
            }}
            title="Reset to factory presets"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-sm shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Preset</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Presets' },
            { id: 'social', label: 'Social Media' },
            { id: 'master', label: 'Master & Archive' },
            { id: 'web', label: 'Web & Share' },
            { id: 'broadcast', label: 'Broadcast' },
            { id: 'custom', label: 'Custom' },
          ].map(tab => {
            const count = tab.id === 'all' ? exportPresets.length : (categoryCounts[tab.id] || 0);
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search preset by name, codec..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPresets.map(preset => {
          const isSelected = preset.id === activePresetId;
          const isInspectingFfmpeg = inspectingFfmpegId === preset.id;
          const ffmpegCommand = generateFFmpegCommand(preset, projectName);

          return (
            <div
              key={preset.id}
              className={`rounded-lg border p-4 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-950/25 border-indigo-500/60 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700/80'
              }`}
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-semibold text-white truncate" title={preset.name}>
                        {preset.name}
                      </h3>
                      {isSelected && (
                        <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20 whitespace-nowrap">
                          Active
                        </span>
                      )}
                    </div>
                    {/* Unboxed category metadata adhering to zero-pill discipline */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <span className="capitalize">{preset.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{preset.isBuiltIn ? 'Factory Preset' : 'Custom Preset'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => duplicateExportPreset(preset.id)}
                      title="Duplicate preset"
                      className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {!preset.isBuiltIn && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(preset)}
                          title="Edit preset"
                          className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteExportPreset(preset.id)}
                          title="Delete preset"
                          className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>

                {/* Technical Specifications Grid */}
                <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800/80 text-[11px] font-mono grid grid-cols-2 gap-y-1.5 gap-x-2 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Container:</span>
                    <span className="text-white font-semibold uppercase">{preset.videoFormat}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Resolution:</span>
                    <span className="text-indigo-300">{preset.resolution}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Video Codec:</span>
                    <span className="text-slate-200 uppercase">{preset.videoCodec}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Audio:</span>
                    <span className="text-emerald-400">{preset.audioCodec.toUpperCase()} · {preset.audioBitrate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Quality:</span>
                    <span>CRF {preset.crfQuality} · {preset.frameRate}fps</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Subtitles:</span>
                    <span className={preset.burnSubtitles ? 'text-amber-300' : 'text-slate-400'}>
                      {preset.burnSubtitles ? 'Burned-In' : 'Clean Master'}
                    </span>
                  </div>
                </div>

                {/* Inspect FFmpeg Collapsible */}
                {isInspectingFfmpeg && (
                  <div className="p-2.5 bg-black/70 rounded border border-slate-800 text-[10px] font-mono text-emerald-400 break-all leading-relaxed">
                    <div className="text-[10px] text-slate-500 mb-1 flex items-center justify-between">
                      <span>CLI COMMAND:</span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(ffmpegCommand);
                          addNotification('Copied FFmpeg command to clipboard', 'info');
                        }}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        Copy
                      </button>
                    </div>
                    {ffmpegCommand}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingFfmpegId(isInspectingFfmpeg ? null : preset.id)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Terminal className="w-3 h-3" />
                  <span>{isInspectingFfmpeg ? 'Hide CLI' : 'Inspect CLI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onApplyPreset(preset)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{isSelected ? 'Applied' : 'Apply Preset'}</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredPresets.length === 0 && (
          <div className="col-span-full p-8 text-center bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
            <Sliders className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-slate-300">No matching presets found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or create a new export preset.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Preset</span>
            </button>
          </div>
        )}
      </div>

      {/* Preset Modal */}
      {isModalOpen && (
        <ExportPresetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveModal}
          initialData={editingPreset || undefined}
          mode={modalMode}
        />
      )}
    </div>
  );
};
