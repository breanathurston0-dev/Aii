import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { 
  BookOpen, 
  Sparkles, 
  Volume2, 
  Subtitles, 
  Copy, 
  Check, 
  RefreshCw, 
  Sliders,
  FileText
} from 'lucide-react';
import { generateStorySummary } from '../../services/geminiService';
import { StorySummary } from '../../types/studio';

export const StorySummarizerView: React.FC = () => {
  const { 
    activeProject, 
    updateActiveProject, 
    addNotification, 
    setActivePage,
    addJob 
  } = useStudio();

  // Load existing summary or initialize from transcript
  const [sourceText, setSourceText] = useState<string>(() => {
    if (activeProject.transcript.length > 0) {
      return activeProject.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
    }
    return 'សូមស្វាគមន៍មកកាន់ StoryForge Studio។ ប្រាសាទអង្គរវត្តជាសម្បត្តិបេតិកភណ្ឌវប្បធម៌ដ៏អស្ចារ្យរបស់កម្ពុជា។';
  });

  const [summaryMode, setSummaryMode] = useState<'short' | 'medium' | 'detailed'>('medium');
  const [tone, setTone] = useState<string>('Documentary');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const currentSummary: StorySummary | undefined = activeProject.storySummary;

  const handleGenerate = async () => {
    if (!sourceText.trim()) {
      addNotification('Please enter source text or transcript to summarize', 'warning');
      return;
    }

    setIsLoading(true);

    addJob('summarization', `AI Story Summarize (${tone} tone, ${summaryMode})`, async (update) => {
      update(20, 'Analyzing narrative arcs and entities');
      const result = await generateStorySummary(sourceText, summaryMode, tone, targetLang);
      update(70, 'Formatting scene breakdown and narration script');
      
      updateActiveProject(prev => ({
        ...prev,
        storySummary: result,
      }));

      return `Generated "${result.title}" with ${result.sceneOutline.length} scenes`;
    });

    try {
      const summary = await generateStorySummary(sourceText, summaryMode, tone, targetLang);
      updateActiveProject(prev => ({
        ...prev,
        storySummary: summary,
      }));
      addNotification('Story outline & narration generated successfully', 'success');
    } catch (e: any) {
      addNotification(`Summarization error: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (!currentSummary?.narrationScript) return;
    navigator.clipboard.writeText(currentSummary.narrationScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
    addNotification('Narration script copied to clipboard', 'info');
  };

  const handleSendToTts = () => {
    if (!currentSummary?.narrationScript) return;
    setActivePage('tts-studio');
    addNotification('Navigated to Text-to-Speech Studio with narration script', 'info');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>AI Story Summarizer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transform transcripts, video dialogues, and scripts into scene breakdowns and voiceover narration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentSummary && (
            <>
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-md"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Script</span>
              </button>

              <button
                onClick={handleSendToTts}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Send to Khmer TTS</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Configuration & Inputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Source Input & Generator Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Source Transcript / Text
              </span>
              <button
                onClick={() => {
                  if (activeProject.transcript.length > 0) {
                    setSourceText(activeProject.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n'));
                    addNotification('Populated from project transcript', 'info');
                  }
                }}
                className="text-[11px] text-indigo-400 hover:underline"
              >
                Pull from Project Transcript
              </button>
            </div>

            <textarea
              rows={8}
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              placeholder="Paste dialogue transcript, video text, or story excerpt here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
            />

            {/* Controls */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">STORY TONE</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Dramatic">Dramatic (Suspenseful)</option>
                    <option value="Documentary">Documentary (Reverent)</option>
                    <option value="Enthusiastic">Enthusiastic (Upbeat)</option>
                    <option value="Educational">Educational (Informative)</option>
                    <option value="Casual">Casual (Friendly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">LENGTH</label>
                  <select
                    value={summaryMode}
                    onChange={e => setSummaryMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="short">Short (30-45s)</option>
                    <option value="medium">Medium (60-90s)</option>
                    <option value="detailed">Detailed (2-3 min)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">OUTPUT LANGUAGE</label>
                <select
                  value={targetLang}
                  onChange={e => setTargetLang(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="en">English</option>
                  <option value="km">Khmer (ភាសាខ្មែរ)</option>
                  <option value="zh">Chinese (中文)</option>
                  <option value="fr">French (Français)</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isLoading ? 'Generating Outline...' : 'Generate Story Outline & Narration'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Output Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {currentSummary ? (
            <div className="space-y-4">
              {/* Synopsis & Title Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">
                    {currentSummary.tone} Story Outline · {currentSummary.length.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(currentSummary.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white">{currentSummary.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed">{currentSummary.synopsis}</p>

                {currentSummary.socialHook && (
                  <div className="mt-3 p-2 rounded bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300">
                    <span className="font-bold mr-1">Social Hook:</span> {currentSummary.socialHook}
                  </div>
                )}
              </div>

              {/* Narration Script Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Narration Script (Voiceover Ready)
                  </h3>
                  <button
                    onClick={handleCopyScript}
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={currentSummary.narrationScript}
                  onChange={e => {
                    const text = e.target.value;
                    updateActiveProject(prev => ({
                      ...prev,
                      storySummary: prev.storySummary ? { ...prev.storySummary, narrationScript: text } : undefined,
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md p-3 text-xs text-white leading-relaxed font-sans"
                />
              </div>

              {/* Scene Outline Accordion */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Scene-by-Scene Story Breakdown
                </h3>

                <div className="space-y-2">
                  {currentSummary.sceneOutline.map((scene, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-md border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-indigo-300">Scene {scene.sceneNumber}: {scene.title}</span>
                        <span className="text-slate-500">{scene.durationSeconds}s</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-normal">{scene.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Characters / Speakers List */}
              {currentSummary.characters.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Detected Characters &amp; Voice Casting
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentSummary.characters.map((char, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-white">{char.name}</div>
                        <div className="text-[11px] text-slate-400">Role: {char.role}</div>
                        <div className="text-[10px] font-mono text-indigo-400">Voice: {char.suggestedVoiceTone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center bg-slate-900/50 border border-dashed border-slate-800 rounded-lg text-center p-6">
              <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
              <h3 className="text-sm font-semibold text-slate-300 mb-1">No Story Outline Generated</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Enter source text or select a transcript on the left and click "Generate Story Outline" to extract scene-by-scene scripts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
