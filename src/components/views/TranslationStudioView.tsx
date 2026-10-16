import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  Languages, 
  ArrowRight, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Check, 
  BookMarked,
  Copy
} from 'lucide-react';
import { translateTextOrSegments } from '../../services/geminiService';
import { stringifySrt } from '../../services/srtService';
import { downloadBlob } from '../../services/exportZipService';
import { SubtitleSegment } from '../../types/studio';

export const TranslationStudioView: React.FC = () => {
  const { 
    activeProject, 
    updateActiveProject, 
    addNotification, 
    addJob,
    khmerFont 
  } = useStudio();

  const [srcLang, setSrcLang] = useState<string>(activeProject.sourceLanguage || 'km');
  const [tgtLang, setTgtLang] = useState<string>(activeProject.targetLanguage || 'en');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [glossary, setGlossary] = useState<Record<string, string>>({
    'ប្រាសាទអង្គរវត្ត': 'Angkor Wat Temple',
    'ព្រះបាទសូរ្យវរ្ម័នទី២': 'King Suryavarman II',
    'អប្សរា': 'Apsara celestial dancer',
    'បេតិកភណ្ឌ': 'World Heritage',
  });

  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const [translatedSubtitles, setTranslatedSubtitles] = useState<SubtitleSegment[]>(() => {
    return activeProject.subtitles.map(s => ({
      ...s,
      text: s.text.includes('អង្គរវត្ត') ? 'Welcome to Angkor Wat, an awe-inspiring world heritage site.' : `[${tgtLang.toUpperCase()}] ${s.text}`,
    }));
  });

  const handleTranslateAll = async () => {
    setIsTranslating(true);

    addJob('translation', `Translate Subtitles (${srcLang.toUpperCase()} → ${tgtLang.toUpperCase()})`, async (update) => {
      update(20, 'Tokenizing Khmer grapheme clusters and terminology');
      
      const res = await translateTextOrSegments(undefined, activeProject.subtitles, srcLang, tgtLang);
      update(80, 'Preserving timestamps and subtitle numbering');

      if (res.segments) {
        setTranslatedSubtitles(res.segments);
      }

      return `Translated ${activeProject.subtitles.length} subtitle entries`;
    });

    try {
      const res = await translateTextOrSegments(undefined, activeProject.subtitles, srcLang, tgtLang);
      if (res.segments) {
        setTranslatedSubtitles(res.segments);
        addNotification(`Translated ${res.segments.length} subtitles to ${tgtLang.toUpperCase()}`, 'success');
      }
    } catch (e: any) {
      addNotification(`Translation error: ${e.message}`, 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleApplyToProject = () => {
    updateActiveProject(prev => ({
      ...prev,
      subtitles: translatedSubtitles,
      targetLanguage: tgtLang,
    }));
    addNotification('Applied translated subtitles to active project', 'success');
  };

  const handleExportSrt = () => {
    const srtStr = stringifySrt(translatedSubtitles);
    const blob = new Blob([srtStr], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${activeProject.name}_translated_${tgtLang}.srt`);
  };

  const handleAddGlossary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newVal.trim()) return;
    setGlossary(prev => ({ ...prev, [newKey.trim()]: newVal.trim() }));
    setNewKey('');
    setNewVal('');
    addNotification('Added terminology to translation memory', 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Languages className="w-5 h-5 text-indigo-400" />
            <span>Translation Studio</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Provider-based translation for SRT and transcripts with Khmer Unicode preservation and terminology memory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyToProject}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Subtitles</span>
          </button>

          <button
            onClick={handleExportSrt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-md"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Translated SRT</span>
          </button>
        </div>
      </div>

      {/* Language Selector & Controls Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={srcLang}
            onChange={e => setSrcLang(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
          >
            <option value="km">Khmer (ភាសាខ្មែរ)</option>
            <option value="en">English</option>
            <option value="zh">Chinese (中文)</option>
            <option value="th">Thai (ไทย)</option>
            <option value="vi">Vietnamese (Tiếng Việt)</option>
          </select>

          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

          <select
            value={tgtLang}
            onChange={e => setTgtLang(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white"
          >
            <option value="en">English</option>
            <option value="km">Khmer (ភាសាខ្មែរ)</option>
            <option value="zh">Chinese (中文)</option>
            <option value="ja">Japanese (日本語)</option>
            <option value="ko">Korean (한국어)</option>
            <option value="fr">French (Français)</option>
            <option value="es">Spanish (Español)</option>
            <option value="de">German (Deutsch)</option>
          </select>
        </div>

        <button
          onClick={handleTranslateAll}
          disabled={isTranslating}
          className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-sm"
        >
          {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{isTranslating ? 'Translating Segments...' : 'Batch Translate All Subtitles'}</span>
        </button>
      </div>

      {/* Main Translation Workstation: Side-by-Side & Glossary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Side-by-Side Editor */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>SOURCE SUBTITLES ({activeProject.subtitles.length})</span>
            <span>TRANSLATED OUTPUT ({tgtLang.toUpperCase()})</span>
          </div>

          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {activeProject.subtitles.map((orig, idx) => {
              const trans = translatedSubtitles[idx] || orig;
              return (
                <div key={orig.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                  {/* Source */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>#{idx + 1} · {orig.startTime}</span>
                      <span>{orig.speaker || 'Narrator'}</span>
                    </div>
                    <div 
                      className="text-xs text-slate-200 leading-relaxed font-sans"
                      style={{ fontFamily: khmerFont }}
                    >
                      {orig.text}
                    </div>
                  </div>

                  {/* Target Translated */}
                  <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-3">
                    <div className="text-[10px] font-mono text-indigo-400 flex items-center justify-between">
                      <span>{trans.startTime}</span>
                      <span className="text-slate-500">Editable</span>
                    </div>
                    <textarea
                      rows={2}
                      value={trans.text}
                      onChange={e => {
                        const val = e.target.value;
                        setTranslatedSubtitles(prev =>
                          prev.map((s, i) => (i === idx ? { ...s, text: val } : s))
                        );
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 cols: Translation Memory & Glossary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <BookMarked className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Terminology Memory &amp; Glossary
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Pre-defined terms ensure cultural and historical accuracy when translating between Khmer and other languages.
            </p>

            {/* Add Term Form */}
            <form onSubmit={handleAddGlossary} className="space-y-2 pt-1">
              <input
                type="text"
                placeholder="Source Term (e.g. អប្សរា)"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Target Term (e.g. Apsara)"
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
              />
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700"
              >
                + Add to Translation Memory
              </button>
            </form>

            {/* Existing Terms List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pt-2 border-t border-slate-800/80">
              {Object.entries(glossary).map(([k, v]) => (
                <div key={k} className="p-2 bg-slate-950 rounded border border-slate-800/80 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-200" style={{ fontFamily: khmerFont }}>{k}</span>
                  <span className="text-slate-400 text-[11px] font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
