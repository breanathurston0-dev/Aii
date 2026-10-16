import React, { useRef, useEffect, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, FastForward } from 'lucide-react';
import { secondsToSrtTimestamp } from '../../services/srtService';

export const VideoCanvasPlayer: React.FC = () => {
  const { 
    activeProject, 
    videoCurrentTime, 
    setVideoCurrentTime, 
    isVideoPlaying, 
    setIsVideoPlaying,
    activeSubtitle,
    khmerFont
  } = useStudio();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  const activeMedia = activeProject.mediaFiles[0];

  // Sync video element time
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - videoCurrentTime) > 0.5) {
      videoRef.current.currentTime = videoCurrentTime;
    }
  }, [videoCurrentTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setVideoCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    videoRef.current.muted = nextMute;
  };

  const changePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden border border-slate-800 flex flex-col group">
      {/* Video Viewport */}
      <div className="relative aspect-video w-full flex items-center justify-center bg-slate-950">
        {activeMedia ? (
          <video
            ref={videoRef}
            src={activeMedia.url}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsVideoPlaying(false)}
            className="w-full h-full object-contain"
            playsInline
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 text-xs">
            <span>No video clip in current timeline</span>
            <span className="text-[10px] text-slate-600 mt-1">Import video via Media Library</span>
          </div>
        )}

        {/* Real-time Subtitle Overlay with Khmer Typography */}
        {activeSubtitle && (
          <div 
            className="absolute bottom-6 left-6 right-6 pointer-events-none flex justify-center text-center transition-all"
            style={{
              fontFamily: khmerFont || 'Noto Sans Khmer, sans-serif',
            }}
          >
            <div className="inline-block px-4 py-1.5 rounded-md bg-black/60 backdrop-blur-xs text-white max-w-[85%] text-base sm:text-lg font-semibold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {activeSubtitle.speaker && (
                <span className="text-indigo-300 font-bold mr-2">[{activeSubtitle.speaker}]:</span>
              )}
              <span>{activeSubtitle.text}</span>
            </div>
          </div>
        )}
      </div>

      {/* Media Control Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur-sm border-t border-slate-800 px-3 py-2 flex flex-col gap-1.5 select-none">
        {/* Scrubbing Bar */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={activeProject.durationSeconds || 60}
            step={0.1}
            value={videoCurrentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded hover:bg-slate-800 text-white transition-colors"
              title={isVideoPlaying ? 'Pause' : 'Play'}
            >
              {isVideoPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={() => {
                setVideoCurrentTime(0);
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Return to Start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={changePlaybackRate}
              className="px-2 py-0.5 rounded hover:bg-slate-800 font-mono text-[11px] text-slate-400 hover:text-white"
              title="Playback Rate"
            >
              {playbackRate}x
            </button>

            <span className="font-mono text-[11px] text-slate-400 ml-2">
              <span className="text-slate-200">{secondsToSrtTimestamp(videoCurrentTime)}</span>
              <span className="text-slate-600"> / </span>
              <span>{secondsToSrtTimestamp(activeProject.durationSeconds || 60)}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <button onClick={toggleMute} className="text-slate-400 hover:text-white">
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button
              onClick={() => {
                if (videoRef.current?.requestFullscreen) {
                  videoRef.current.requestFullscreen();
                }
              }}
              className="p-1 text-slate-400 hover:text-white"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
