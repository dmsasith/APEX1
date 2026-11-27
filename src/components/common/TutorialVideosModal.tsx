import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  X,
  Video,
  ExternalLink,
  Film,
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useStock } from '../../context/StockContext';
import {
  normalizeTutorialVideos,
  resolveTutorialVideoSource,
  TutorialVideoItem,
} from '../../types';

interface TutorialVideosModalProps {
  isOpen: boolean;
  isMinimized?: boolean;
  onMinimizeChange?: (minimized: boolean) => void;
  onClose: () => void;
}

export const TutorialVideosModal: React.FC<TutorialVideosModalProps> = ({
  isOpen,
  isMinimized: controlledMinimized,
  onMinimizeChange,
  onClose,
}) => {
  const { platformPricing } = useStock();

  const tutorialVideos: TutorialVideoItem[] = useMemo(
    () => normalizeTutorialVideos(platformPricing.tutorialVideos),
    [platformPricing.tutorialVideos]
  );

  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [internalMinimized, setInternalMinimized] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const isMinimized =
    typeof controlledMinimized === 'boolean' ? controlledMinimized : internalMinimized;

  const setMinimized = useCallback(
    (next: boolean) => {
      if (onMinimizeChange) {
        onMinimizeChange(next);
      } else {
        setInternalMinimized(next);
      }
      if (!next) {
        setIsDockCollapsed(false);
      }
    },
    [onMinimizeChange]
  );

  useEffect(() => {
    if (!isOpen) {
      setInternalMinimized(false);
      setIsDockCollapsed(false);
      setIsPaused(false);
      return;
    }
    if (tutorialVideos.length > 0 && !tutorialVideos.some((v) => v.id === selectedVideoId)) {
      setSelectedVideoId(tutorialVideos[0].id);
      setIsPaused(false);
    }
  }, [isOpen, tutorialVideos, selectedVideoId]);

  useEffect(() => {
    if (!isOpen || isMinimized) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isMinimized, onClose]);

  const activeIndex = Math.max(
    0,
    tutorialVideos.findIndex((v) => v.id === selectedVideoId)
  );
  const activeVideo = tutorialVideos[activeIndex] || tutorialVideos[0] || null;
  const activeSource = activeVideo
    ? resolveTutorialVideoSource(activeVideo.videoUrl)
    : { kind: 'invalid' as const, provider: 'None', embedUrl: '', directUrl: '' };

  const canControlPlayback =
    activeSource.kind === 'video' ||
    activeSource.provider === 'YouTube' ||
    activeSource.provider === 'Vimeo';

  // Sync play/pause state when YouTube posts player state events
  useEffect(() => {
    if (!isOpen) return;
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return;
      try {
        const parsed = JSON.parse(event.data);
        const playerState =
          parsed?.event === 'onStateChange'
            ? parsed?.info
            : parsed?.info?.playerState;
        if (typeof playerState === 'number') {
          if (playerState === 1) setIsPaused(false);
          if (playerState === 2 || playerState === 0) setIsPaused(true);
        }
      } catch {
        // Ignore unrelated postMessages
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen]);

  const sendPlaybackCommand = useCallback(
    (action: 'pause' | 'play') => {
      if (activeSource.kind === 'video' && videoRef.current) {
        if (action === 'pause') {
          videoRef.current.pause();
        } else {
          videoRef.current.play().catch(() => {});
        }
        setIsPaused(action === 'pause');
        return;
      }

      if (activeSource.kind === 'iframe' && iframeRef.current?.contentWindow) {
        if (activeSource.provider === 'YouTube') {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: action === 'pause' ? 'pauseVideo' : 'playVideo',
              args: [],
            }),
            '*'
          );
          setIsPaused(action === 'pause');
          return;
        }
        if (activeSource.provider === 'Vimeo') {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ method: action === 'pause' ? 'pause' : 'play' }),
            '*'
          );
          setIsPaused(action === 'pause');
        }
      }
    },
    [activeSource.kind, activeSource.provider]
  );

  const handleTogglePlayPause = () => {
    if (isPaused) {
      if (isMinimized && isDockCollapsed) {
        setIsDockCollapsed(false);
      }
      sendPlaybackCommand('play');
    } else {
      sendPlaybackCommand('pause');
    }
  };

  const handlePauseAndMinimize = () => {
    sendPlaybackCommand('pause');
    setIsDockCollapsed(false);
    setMinimized(true);
  };

  const handleMinimizeOnly = () => {
    setIsDockCollapsed(false);
    setMinimized(true);
  };

  const handleSelectVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    setIsPaused(false);
  };

  const handleStepVideo = (dir: -1 | 1) => {
    if (tutorialVideos.length <= 1) return;
    const nextIdx = (activeIndex + dir + tutorialVideos.length) % tutorialVideos.length;
    handleSelectVideo(tutorialVideos[nextIdx].id);
  };

  if (!isOpen) return null;

  return (
    <div
      className={
        isMinimized
          ? 'fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-[120] w-[calc(100vw-1.5rem)] sm:w-[410px] pointer-events-auto'
          : 'fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto'
      }
      onClick={isMinimized ? undefined : onClose}
    >
      <div
        className={
          isMinimized
            ? 'w-full bg-slate-900 border border-emerald-400/45 rounded-2xl shadow-[0_24px_70px_-10px_rgba(2,6,23,0.92)] overflow-hidden flex flex-col'
            : 'w-full max-w-4xl bg-slate-900 border border-white/15 rounded-3xl shadow-[0_28px_80px_-12px_rgba(2,6,23,0.85)] overflow-hidden flex flex-col max-h-[92vh]'
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header (Full Mode vs Minimized Bottom Dock Bar) */}
        {isMinimized ? (
          <div className="px-3 py-2.5 bg-gradient-to-r from-[#09152f] via-[#0e2246] to-[#09152f] border-b border-white/12 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 text-[10px] font-black shrink-0 tabular-nums">
                #{activeIndex + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-extrabold text-white truncate">
                  {activeVideo ? activeVideo.title : 'System Tutorial Videos'}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300 truncate">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  <span>
                    {isPaused ? 'Paused · Work in system & resume anytime' : 'Mini Player · Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {canControlPlayback && activeVideo && activeSource.kind !== 'invalid' && (
                <button
                  type="button"
                  onClick={handleTogglePlayPause}
                  className={`h-7 px-2 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                    isPaused
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40'
                  }`}
                  title={isPaused ? 'Resume Video' : 'Pause Video'}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 fill-current" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              )}

              {tutorialVideos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStepVideo(-1)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition cursor-pointer"
                    title="Previous Tutorial Video"
                    aria-label="Previous Tutorial Video"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepVideo(1)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition cursor-pointer"
                    title="Next Tutorial Video"
                    aria-label="Next Tutorial Video"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsDockCollapsed((prev) => !prev)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition cursor-pointer"
                title={isDockCollapsed ? 'Show Mini Video Screen' : 'Collapse Video to Bottom Bar'}
                aria-label={isDockCollapsed ? 'Show Mini Video Screen' : 'Collapse Video to Bottom Bar'}
              >
                {isDockCollapsed ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setMinimized(false)}
                className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 text-sky-200 hover:text-white border border-sky-400/35 transition cursor-pointer"
                title="Expand Full Tutorial Window"
                aria-label="Expand Full Tutorial Window"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 hover:text-white border border-rose-400/35 transition cursor-pointer"
                title="Close Tutorial Player"
                aria-label="Close Tutorial Player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 bg-gradient-to-r from-[#09152f] via-[#0e2246] to-[#09152f] border-b border-white/12 flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center shadow-md shrink-0">
                <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    System Tutorial Videos
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/35">
                    {tutorialVideos.length} Video{tutorialVideos.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  {activeVideo
                    ? `${isPaused ? 'Paused' : 'Now Playing'} #${activeIndex + 1}: ${activeVideo.title}`
                    : 'Step-by-step system walkthroughs & operational guides'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {activeVideo && activeSource.kind !== 'invalid' && (
                <>
                  {canControlPlayback && (
                    <button
                      type="button"
                      onClick={handleTogglePlayPause}
                      className={`h-9 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer ${
                        isPaused
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300'
                          : 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border-amber-400/40'
                      }`}
                      title={isPaused ? 'Resume Video' : 'Pause Video'}
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handlePauseAndMinimize}
                    className="h-9 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 border border-sky-400/45 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                    title="Pause video and minimize to bottom corner so you can work inside the system"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-sky-300" />
                    <span>Pause &amp; Minimize</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMinimizeOnly}
                    className="h-9 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 border border-white/15 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    title="Keep mini player floating at bottom while working"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="hidden sm:inline">Mini Player</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15 transition cursor-pointer shrink-0"
                aria-label="Close Tutorial Videos"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Body: Keeps video player mounted in identical React tree position when minimized */}
        <div className={isMinimized ? '' : 'flex-1 overflow-y-auto p-4 sm:p-5 space-y-5'}>
          {/* TOP (or Mini Floating Screen): Active Video Player */}
          <div
            className={
              isMinimized
                ? isDockCollapsed
                  ? 'h-0 overflow-hidden opacity-0 pointer-events-none'
                  : 'bg-slate-950'
                : 'rounded-2xl overflow-hidden border border-white/15 bg-slate-950 shadow-xl'
            }
          >
            {!activeVideo || tutorialVideos.length === 0 ? (
              <div className="aspect-video flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-slate-950 to-slate-900">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-sky-400 mb-3">
                  <Film className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  No Tutorial Videos Added Yet
                </h3>
                <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
                  Tutorial videos published from the SaaS Master Admin Panel will appear here automatically. You can also open the English or Sinhala User Guides from the header anytime.
                </p>
              </div>
            ) : activeSource.kind === 'invalid' ? (
              <div className="aspect-video flex flex-col items-center justify-center text-center p-6 bg-slate-950">
                <Video className="w-10 h-10 text-amber-400 mb-2" />
                <div className="text-sm font-bold text-white">{activeVideo.title}</div>
                <p className="text-xs text-slate-400 mt-1">
                  Video link is missing or invalid. Please update the video link in SaaS Master Panel.
                </p>
              </div>
            ) : (
              <>
                {/* Currently Playing Title Strip (Hidden in compact mini-dock to save vertical space) */}
                {!isMinimized && (
                  <div className="px-4 py-2.5 bg-slate-900/95 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-black shrink-0 tabular-nums">
                        #{activeIndex + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {activeVideo.title}
                      </span>
                      {activeVideo.subtitle && (
                        <span className="text-[11px] text-slate-400 truncate hidden sm:inline">
                          · {activeVideo.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-sky-300 border border-white/10">
                        {activeSource.provider}
                      </span>
                      {activeSource.directUrl && (
                        <a
                          href={activeSource.directUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Link</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* 16:9 Video Viewport (Persistent across Full & Minimized states) */}
                <div className="aspect-video w-full bg-black relative">
                  {activeSource.kind === 'video' ? (
                    <video
                      ref={videoRef}
                      key={activeVideo.id}
                      src={activeSource.embedUrl}
                      controls
                      autoPlay
                      playsInline
                      onPause={() => setIsPaused(true)}
                      onPlay={() => setIsPaused(false)}
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <iframe
                      ref={iframeRef}
                      key={`${activeVideo.id}-${activeSource.embedUrl}`}
                      src={activeSource.embedUrl}
                      title={activeVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      onLoad={() => {
                        if (activeSource.provider === 'YouTube') {
                          iframeRef.current?.contentWindow?.postMessage(
                            JSON.stringify({ event: 'listening', id: activeVideo.id }),
                            '*'
                          );
                        }
                      }}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* BOTTOM: Numbered Tutorial Video Selector List (1, 2, 3...) — Only in Expanded Window */}
          {!isMinimized && tutorialVideos.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Select Tutorial Video ({tutorialVideos.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Click any video below to play above · Minimize anytime to keep working
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tutorialVideos.map((vid, idx) => {
                  const isPlaying = activeVideo?.id === vid.id;
                  const srcInfo = resolveTutorialVideoSource(vid.videoUrl);
                  return (
                    <button
                      key={vid.id}
                      type="button"
                      onClick={() => handleSelectVideo(vid.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isPlaying
                          ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-sky-500/15 border-emerald-400 shadow-md ring-1 ring-emerald-400/50'
                          : 'bg-slate-950/80 hover:bg-slate-800/85 border-white/10 hover:border-white/25'
                      }`}
                    >
                      {/* Number Badge: 1, 2, 3... */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 tabular-nums ${
                          isPlaying
                            ? 'bg-emerald-400 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-200 border border-white/10'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Thumbnail or Play Icon */}
                      {srcInfo.thumbnailUrl ? (
                        <div className="relative w-16 h-10 rounded-lg overflow-hidden border border-white/15 shrink-0 bg-black">
                          <img
                            src={srcInfo.thumbnailUrl}
                            alt={vid.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                            <Play className="w-3.5 h-3.5 text-white fill-white" />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isPlaying
                              ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-300'
                              : 'bg-slate-900 border-white/10 text-sky-400'
                          }`}
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      )}

                      {/* Video Title & Subtitle */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-extrabold truncate ${
                              isPlaying ? 'text-emerald-200' : 'text-white'
                            }`}
                          >
                            {vid.title}
                          </span>
                        </div>
                        {vid.subtitle ? (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {vid.subtitle}
                          </div>
                        ) : (
                          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                            {srcInfo.provider} Tutorial
                          </div>
                        )}
                      </div>

                      {isPlaying && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black shrink-0">
                          {isPaused ? 'Paused' : 'Playing'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
