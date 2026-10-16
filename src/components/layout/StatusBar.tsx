import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { Activity, Clock, Film, Subtitles, CheckCircle2 } from 'lucide-react';
import { secondsToSrtTimestamp } from '../../services/srtService';

export const StatusBar: React.FC = () => {
  const { activeProject, videoCurrentTime, jobQueue, systemStatus, khmerFont } = useStudio();
  const runningJobs = jobQueue.filter(j => j.status === 'running').length;

  return (
    <footer className="h-7 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none shrink-0 z-20">
      <div className="flex items-center gap-4 truncate">
        <div className="flex items-center gap-1.5 text-slate-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>StoryForge Studio Core Ready</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-slate-300">{secondsToSrtTimestamp(videoCurrentTime)}</span>
          <span className="text-slate-500">/</span>
          <span>{secondsToSrtTimestamp(activeProject.durationSeconds)}</span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="hidden sm:flex items-center gap-1">
          <Film className="w-3 h-3 text-slate-500" />
          <span>{activeProject.mediaFiles.length} Media</span>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <Subtitles className="w-3 h-3 text-slate-500" />
          <span>{activeProject.subtitles.length} Subtitles</span>
        </div>

        <span className="hidden md:inline text-slate-700">|</span>

        <span className="hidden md:inline text-slate-400">
          Font: <span className="text-slate-300">{khmerFont}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {runningJobs > 0 ? (
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <Activity className="w-3 h-3 animate-spin" />
            <span>{runningJobs} job(s) running</span>
          </div>
        ) : (
          <span className="text-slate-400">Queue: Idle</span>
        )}

        <span className="text-slate-700">|</span>

        <span className="text-slate-400">
          FFmpeg: <span className={systemStatus?.dependencies.ffmpeg.installed ? 'text-emerald-400' : 'text-amber-400'}>{systemStatus?.dependencies.ffmpeg.installed ? 'Ready' : 'Fallback'}</span>
        </span>

        <span className="text-slate-700">|</span>

        <span className="text-slate-400">
          Gemini: <span className={systemStatus?.hasGeminiKey ? 'text-emerald-400' : 'text-slate-400'}>{systemStatus?.hasGeminiKey ? 'Active' : 'Offline'}</span>
        </span>
      </div>
    </footer>
  );
};
