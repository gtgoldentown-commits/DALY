/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Subtitles,
  AudioLines,
  SkipForward,
  X,
  AlertTriangle,
  RefreshCw,
  Tv,
  ShieldCheck,
  Video,
  Film,
  Link as LinkIcon,
  Check
} from 'lucide-react';
import { MediaTitle, Episode, WatchProgress, SubtitleTrack } from '../../types/index.ts';
import { formatSeconds, calculateProgressPercentage } from '../../utils/filterEngine.ts';
import {
  verifyPlaybackRights,
  registerAuthorizedStream,
  AUTHORIZED_FULL_LENGTH_MASTERS
} from '../../services/streamingProvider.service.ts';
import { parseVtt, findActiveCue, VttCue } from '../../utils/vttParser.ts';

interface CinemaPlayerProps {
  media: MediaTitle;
  initialEpisode?: Episode;
  onClose: () => void;
  onSaveProgress: (progress: WatchProgress) => void;
  savedProgress?: WatchProgress;
  onSelectNextEpisode?: () => void;
}

export const CinemaPlayer: React.FC<CinemaPlayerProps> = ({
  media,
  initialEpisode,
  onClose,
  onSaveProgress,
  savedProgress,
  onSelectNextEpisode
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stream Resolution
  const resolvedRights = verifyPlaybackRights(media);
  const initialStreamUrl =
    initialEpisode?.streamUrl ||
    (resolvedRights.hasAuthorizedStream ? resolvedRights.streamUrl : media.streamUrl) ||
    '';

  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(initialStreamUrl);
  const [activeLicenseType, setActiveLicenseType] = useState<string>(resolvedRights.licenseType);
  const [isPlayingTestStream, setIsPlayingTestStream] = useState<boolean>(false);
  const [testStreamLabel, setTestStreamLabel] = useState<string>('');

  // Subtitles System
  const availableSubtitles = useMemo<SubtitleTrack[]>(() => {
    if (resolvedRights.subtitles && resolvedRights.subtitles.length > 0) {
      return resolvedRights.subtitles;
    }
    if (media.subtitles && media.subtitles.length > 0) {
      return media.subtitles;
    }
    return [];
  }, [resolvedRights.subtitles, media.subtitles]);

  // Default subtitle: if Arabic is available, or English, or off
  const [activeSubtitle, setActiveSubtitle] = useState<string>(() => {
    if (availableSubtitles.some((s) => s.code === 'ar')) return 'ar';
    if (availableSubtitles.some((s) => s.code === 'en')) return 'en';
    return availableSubtitles.length > 0 ? availableSubtitles[0].code : 'off';
  });

  const [parsedCues, setParsedCues] = useState<VttCue[]>([]);
  const [currentCueText, setCurrentCueText] = useState<string>('');
  const [activeTrackDirection, setActiveTrackDirection] = useState<'ltr' | 'rtl'>('ltr');

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeAudioTrack, setActiveAudioTrack] = useState(media.audioTracks?.[0] || 'Original 5.1');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Menus & Modals
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isSubtitleMenuOpen, setIsSubtitleMenuOpen] = useState(false);
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  // Quick Ingest Form for titles without stream
  const [customStreamInput, setCustomStreamInput] = useState('');
  const [customSubArInput, setCustomSubArInput] = useState('');
  const [customSubEnInput, setCustomSubEnInput] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  const activeTitle = initialEpisode
    ? `${media.title} — S${initialEpisode.seasonNumber}:E${initialEpisode.episodeNumber} "${initialEpisode.title}"`
    : isPlayingTestStream
    ? `${media.title} [Preview Master: ${testStreamLabel}]`
    : media.title;

  // Load WebVTT subtitles when activeSubtitle changes
  useEffect(() => {
    if (activeSubtitle === 'off') {
      setParsedCues([]);
      setCurrentCueText('');
      return;
    }

    const track = availableSubtitles.find((s) => s.code === activeSubtitle);
    if (!track) {
      setParsedCues([]);
      setCurrentCueText('');
      return;
    }

    setActiveTrackDirection(track.direction || (track.code === 'ar' ? 'rtl' : 'ltr'));

    if (track.src) {
      fetch(track.src)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((vttText) => {
          const cues = parseVtt(vttText);
          setParsedCues(cues);
        })
        .catch((err) => {
          console.warn(`Could not load WebVTT file from ${track.src}:`, err);
          setParsedCues([]);
        });
    } else {
      setParsedCues([]);
      setCurrentCueText('');
    }
  }, [activeSubtitle, availableSubtitles]);

  // Autohide controls on inactivity
  const triggerActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setIsSpeedMenuOpen(false);
        setIsSubtitleMenuOpen(false);
        setIsAudioMenuOpen(false);
      }
    }, 3500);
  }, [isPlaying]);

  // Video Source / HLS setup & teardown
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStreamUrl) return;

    setIsError(false);
    setErrorMessage('');
    setIsBuffering(true);

    // Clean up previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsStream =
      activeStreamUrl.includes('.m3u8') ||
      activeStreamUrl.includes('audio/mpegurl') ||
      activeStreamUrl.includes('application/x-mpegURL');

    if (isHlsStream) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hlsRef.current = hls;

        hls.loadSource(activeStreamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch((err) => {
                console.log('Autoplay policy caught:', err);
                video.muted = true;
                setIsMuted(true);
                video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
              });
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.warn('HLS stream event:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS network error, attempting recovery...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS media error, recovering...');
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setIsError(true);
                setErrorMessage('HLS adaptive streaming playback encountered a fatal network error.');
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS for Safari
        video.src = activeStreamUrl;
        video.load();
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        setIsError(true);
        setErrorMessage('HLS playback is unsupported in this browser environment.');
      }
    } else {
      // Standard MP4 stream
      video.src = activeStreamUrl;
      video.load();

      if (savedProgress && savedProgress.currentTime > 5 && savedProgress.percentage < 95) {
        video.currentTime = savedProgress.currentTime;
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch((err) => {
            console.log('Autoplay policy caught:', err);
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          });
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamUrl]);

  // Periodic progress saving
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && duration > 0 && !isPlayingTestStream) {
        const curr = videoRef.current.currentTime;
        onSaveProgress({
          titleId: media.id,
          episodeId: initialEpisode?.id,
          currentTime: curr,
          duration: duration,
          percentage: calculateProgressPercentage(curr, duration),
          lastUpdated: Date.now()
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [media.id, initialEpisode?.id, duration, isPlayingTestStream, onSaveProgress]);

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      triggerActivity();
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        skipTime(10);
      } else if (e.key === 'ArrowLeft') {
        skipTime(-10);
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, triggerActivity, onClose]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(console.error);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const curr = video.currentTime;
    setCurrentTime(curr);

    if (video.buffered.length > 0) {
      setBufferedEnd(video.buffered.end(video.buffered.length - 1));
    }

    // Match active subtitle cue
    if (parsedCues.length > 0) {
      const activeCue = findActiveCue(parsedCues, curr);
      setCurrentCueText(activeCue ? activeCue.text : '');
    } else {
      setCurrentCueText('');
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    setIsBuffering(false);
    setIsError(false);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const video = videoRef.current;
    if (!video || !duration) return;
    video.currentTime = pos * duration;
    setCurrentTime(pos * duration);
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
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setIsSpeedMenuOpen(false);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleError = () => {
    if (activeStreamUrl) {
      setIsError(true);
      setIsBuffering(false);
      setErrorMessage(
        'Video stream encountered a playback error or network block. Verify CORS and content headers.'
      );
    }
  };

  // Launch verified full-length master test within player
  const handleLaunchMaster = (key: 'tears_of_steel' | 'sintel' | 'adaptive_hls') => {
    const target = AUTHORIZED_FULL_LENGTH_MASTERS[key];
    setActiveStreamUrl(target.streamUrl);
    setActiveLicenseType(target.licenseType);
    setIsPlayingTestStream(true);
    setTestStreamLabel(target.title);
    setIsError(false);
  };

  // Inline stream registration for this specific title
  const handleQuickIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStreamInput.trim()) return;

    const streamUrl = customStreamInput.trim();
    const isHls = streamUrl.includes('.m3u8');
    const subs: SubtitleTrack[] = [];

    // Arabic Subtitles track
    const arSrc = customSubArInput.trim() || '/subtitles/tears-of-steel-ar.vtt';
    subs.push({
      code: 'ar',
      label: 'العربية (Arabic)',
      src: arSrc,
      direction: 'rtl'
    });

    // English Subtitles track
    const enSrc = customSubEnInput.trim() || '/subtitles/tears-of-steel-en.vtt';
    subs.push({
      code: 'en',
      label: 'English [CC]',
      src: enSrc,
      direction: 'ltr'
    });

    registerAuthorizedStream(
      media.id,
      streamUrl,
      isHls ? 'hls' : 'mp4',
      'Authorized Custom Stream Ingest (Live Operator)',
      subs
    );

    setActiveStreamUrl(streamUrl);
    setActiveLicenseType('Authorized Custom Stream Ingest');
    setActiveSubtitle('ar');
    setIsIngesting(false);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={triggerActivity}
      onClick={triggerActivity}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      {activeStreamUrl ? (
        <video
          ref={videoRef}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onError={handleError}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        >
          {/* HTML5 Native Subtitle Tracks */}
          {availableSubtitles.map((track) => (
            <track
              key={track.code}
              kind="subtitles"
              src={track.src}
              srcLang={track.code}
              label={track.label}
              default={track.code === activeSubtitle}
            />
          ))}
        </video>
      ) : null}

      {/* Buffering Indicator */}
      {isBuffering && activeStreamUrl && !isError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10">
            <RefreshCw className="w-8 h-8 text-[#E50914] animate-spin" />
            <span className="text-xs uppercase tracking-widest text-[#B3B3B3] font-semibold">
              Buffering Master Stream...
            </span>
          </div>
        </div>
      )}

      {/* Real WebVTT Subtitles Overlay with Authentic Arabic RTL Support */}
      {activeSubtitle !== 'off' && currentCueText && isPlaying && (
        <div
          data-testid="subtitles-overlay"
          className="absolute bottom-24 sm:bottom-28 left-0 right-0 flex justify-center text-center pointer-events-none px-6 z-30 transition-all duration-150 animate-fadeIn"
        >
          <span
            dir={activeTrackDirection}
            lang={activeSubtitle}
            className={`text-white px-6 py-2.5 rounded-lg border border-white/15 backdrop-blur-md shadow-2xl leading-relaxed max-w-3xl text-center select-none ${
              activeTrackDirection === 'rtl'
                ? 'font-sans text-xl sm:text-2xl md:text-3xl font-bold bg-black/90 text-right tracking-normal'
                : 'font-sans text-base sm:text-xl font-semibold bg-black/85 text-center tracking-wide'
            }`}
          >
            {currentCueText}
          </span>
        </div>
      )}

      {/* Missing Stream / Content Provider Notice (Preserves Media ID without playing fake video) */}
      {!activeStreamUrl && (
        <div
          data-testid="provider-notice"
          className="absolute inset-0 bg-[#080808]/95 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto z-40 animate-fadeIn"
        >
          <div className="w-16 h-16 rounded-full bg-[#181818] border border-[#292929] flex items-center justify-center mb-4 text-[#E50914]">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="font-cinzel text-2xl font-bold text-white mb-1.5">
            Content Provider Stream Required
          </h3>
          <p className="text-xs font-mono text-[#E50914] mb-3">
            Title: {media.title} • ID: {media.id}
          </p>
          <p className="text-xs sm:text-sm text-[#B3B3B3] mb-4 leading-relaxed">
            Full-movie streaming for <span className="text-white font-semibold">"{media.title}"</span>{' '}
            requires a connected commercial streaming provider (HLS / MP4) or licensed distribution endpoint.
            TEATRO never substitutes a generic 1-minute demo video.
          </p>

          {/* Quick Ingest Stream Form */}
          {isIngesting ? (
            <form onSubmit={handleQuickIngest} className="w-full bg-[#111111] border border-[#292929] rounded-lg p-4 mb-4 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>Map Stream & Subtitles to ID: {media.id}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsIngesting(false)}
                  className="text-[11px] text-[#777777] hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Quick Fill Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="text-[10px] text-[#777777] font-semibold uppercase">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomStreamInput('https://archive.org/download/Tears-of-Steel/tears_of_steel_1080p.mp4');
                    setCustomSubArInput('/subtitles/tears-of-steel-ar.vtt');
                    setCustomSubEnInput('/subtitles/tears-of-steel-en.vtt');
                  }}
                  className="px-2 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333333] text-[10px] text-white rounded transition-colors"
                >
                  Tears of Steel (12m Master)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomStreamInput('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                    setCustomSubArInput('/subtitles/hls-master-ar.vtt');
                    setCustomSubEnInput('/subtitles/hls-master-en.vtt');
                  }}
                  className="px-2 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333333] text-[10px] text-white rounded transition-colors"
                >
                  Adaptive HLS Ladder (.m3u8)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomStreamInput('https://archive.org/download/Sintel/sintel-2048-surround.mp4');
                    setCustomSubArInput('/subtitles/sintel-ar.vtt');
                    setCustomSubEnInput('/subtitles/sintel-en.vtt');
                  }}
                  className="px-2 py-0.5 bg-[#181818] hover:bg-[#252525] border border-[#333333] text-[10px] text-white rounded transition-colors"
                >
                  Sintel (15m Master)
                </button>
              </div>

              {/* Stream URL */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#B3B3B3] block mb-1">
                  Video Stream URL (HLS .m3u8 or MP4) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://provider-cdn.com/stream/master.m3u8 or .mp4"
                  value={customStreamInput}
                  onChange={(e) => setCustomStreamInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#333333] rounded text-xs text-white placeholder-[#777777] focus:outline-none focus:border-[#E50914]"
                />
              </div>

              {/* Subtitles: Arabic and English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#B3B3B3] block mb-1">
                    Arabic Subtitles WebVTT (.vtt)
                  </label>
                  <input
                    type="text"
                    placeholder="/subtitles/tears-of-steel-ar.vtt or CDN URL"
                    value={customSubArInput}
                    onChange={(e) => setCustomSubArInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#333333] rounded text-xs text-white placeholder-[#777777] focus:outline-none focus:border-[#E50914]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#B3B3B3] block mb-1">
                    English Subtitles WebVTT (.vtt)
                  </label>
                  <input
                    type="text"
                    placeholder="/subtitles/tears-of-steel-en.vtt or CDN URL"
                    value={customSubEnInput}
                    onChange={(e) => setCustomSubEnInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#333333] rounded text-xs text-white placeholder-[#777777] focus:outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold rounded transition-colors shadow-lg"
              >
                Connect Stream & Start Playback
              </button>
            </form>
          ) : (
            <div className="w-full bg-[#111111] border border-[#292929] rounded-lg p-3.5 mb-5 text-xs text-left text-[#B3B3B3] space-y-1.5">
              <p className="text-white font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Streaming Integration Status:</span>
              </p>
              <p>• Commercial title requires valid HLS (.m3u8) / MP4 ingest endpoint from CDN.</p>
              <p>• You can map a licensed stream URL for this title, watch the trailer, or test playback engines using authorized full-length masters.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
            {!isIngesting && (
              <button
                onClick={() => setIsIngesting(true)}
                className="px-4 py-2 bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Map Stream for this Title</span>
              </button>
            )}

            <button
              onClick={() => handleLaunchMaster('tears_of_steel')}
              className="px-4 py-2 bg-[#181818] hover:bg-[#252525] border border-[#333333] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#E50914]" />
              <span>Preview 12m Cinema Master</span>
            </button>

            {media.trailerKey && (
              <button
                onClick={() => setShowTrailerModal(true)}
                className="px-4 py-2 bg-[#181818] hover:bg-[#252525] border border-[#292929] text-white text-xs font-semibold rounded flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-[#B3B3B3]" />
                <span>Watch Official Trailer</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-transparent text-[#777777] hover:text-white text-xs font-medium"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      )}

      {/* Stream Error Modal */}
      {isError && (
        <div className="absolute inset-0 bg-[#080808]/95 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto z-40 animate-fadeIn">
          <AlertTriangle className="w-12 h-12 text-[#E50914] mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Stream Playback Blocked</h3>
          <p className="text-sm text-[#B3B3B3] mb-6">{errorMessage}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleLaunchMaster('tears_of_steel')}
              className="px-5 py-2.5 bg-[#E50914] text-white rounded text-xs font-bold flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Load Verified 12m Master</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#181818] border border-[#292929] text-white rounded text-xs font-semibold"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      )}

      {/* Top Header HUD (Visible on Activity) */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 bg-[#181818]/90 hover:bg-[#E50914] text-white rounded-full transition-colors border border-white/10"
            aria-label="Exit cinema playback"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow line-clamp-1">
              {activeTitle}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#B3B3B3]">
              {activeStreamUrl ? (
                <>
                  <span className="flex items-center gap-1 text-[#4ade80]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {activeStreamUrl.includes('.m3u8')
                        ? 'Adaptive HLS (hls.js Active)'
                        : 'Authorized HTML5 MP4 Full Master'}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="text-[#E50914] font-mono font-bold">4K HDR</span>
                  {activeSubtitle !== 'off' && (
                    <>
                      <span>•</span>
                      <span className="text-amber-400 font-bold uppercase">
                        Subtitles: {activeSubtitle}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Content Provider Stream Ingest Pending</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPlayingTestStream && (
            <span className="px-2.5 py-1 bg-[#E50914]/20 border border-[#E50914] text-[#E50914] rounded text-xs font-bold uppercase tracking-wider">
              Preview Master Active
            </span>
          )}
        </div>
      </div>

      {/* Bottom Controls HUD */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Timeline Scrubber */}
        <div
          onClick={handleSeek}
          className="relative w-full h-2.5 bg-white/20 hover:h-3.5 rounded-full cursor-pointer transition-all duration-150 mb-4 group"
          role="slider"
          aria-label="Video timeline scrubber"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration || 100}
        >
          {/* Buffered track */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/35 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Played track */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-[#E50914] rounded-full flex items-center justify-end"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform -mr-1" />
          </div>
        </div>

        {/* Buttons Bar */}
        <div className="flex items-center justify-between gap-4 text-white">
          {/* Left Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={togglePlay}
              className="p-2 sm:p-2.5 bg-[#E50914] hover:bg-[#b80710] text-white rounded-full transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skipTime(-10)}
              className="p-2 text-[#B3B3B3] hover:text-white transition-colors"
              title="Rewind 10 seconds (Left Arrow)"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-2 text-[#B3B3B3] hover:text-white transition-colors"
              title="Forward 10 seconds (Right Arrow)"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-2 text-[#B3B3B3] hover:text-white transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-white/20 accent-[#E50914] rounded-lg cursor-pointer"
                aria-label="Volume slider"
              />
            </div>

            {/* Time Display */}
            <div className="text-xs font-mono text-[#B3B3B3] hidden sm:block">
              <span>{formatSeconds(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                className="px-2 py-1 text-xs font-bold text-[#B3B3B3] hover:text-white border border-white/10 rounded transition-colors"
              >
                {playbackSpeed}x
              </button>
              {isSpeedMenuOpen && (
                <div className="absolute bottom-10 right-0 bg-[#181818] border border-[#292929] rounded-lg p-1.5 shadow-xl min-w-[70px] space-y-1 z-50">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`block w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                        playbackSpeed === s
                          ? 'bg-[#E50914] text-white font-bold'
                          : 'text-[#B3B3B3] hover:bg-[#252525] hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selectable Subtitles Menu (Displays Available Languages Only) */}
            <div className="relative">
              <button
                onClick={() => setIsSubtitleMenuOpen(!isSubtitleMenuOpen)}
                className={`p-2 rounded transition-colors ${
                  activeSubtitle !== 'off' ? 'text-[#E50914]' : 'text-[#B3B3B3] hover:text-white'
                }`}
                title="Subtitles & Closed Captions"
                aria-label="Subtitles menu"
              >
                <Subtitles className="w-5 h-5" />
              </button>
              {isSubtitleMenuOpen && (
                <div
                  data-testid="subtitles-menu"
                  className="absolute bottom-10 right-0 bg-[#181818] border border-[#292929] rounded-lg p-2 shadow-2xl min-w-[170px] space-y-1 z-50"
                >
                  <p className="text-[10px] uppercase font-bold text-[#777777] px-2 mb-1">
                    Selectable Subtitles
                  </p>

                  <button
                    onClick={() => {
                      setActiveSubtitle('off');
                      setIsSubtitleMenuOpen(false);
                    }}
                    className={`flex items-center justify-between w-full text-left px-2.5 py-1.5 text-xs rounded transition-colors ${
                      activeSubtitle === 'off'
                        ? 'bg-[#E50914] text-white font-bold'
                        : 'text-[#B3B3B3] hover:bg-[#252525] hover:text-white'
                    }`}
                  >
                    <span>Off</span>
                    {activeSubtitle === 'off' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {availableSubtitles.length === 0 ? (
                    <p className="text-[11px] text-[#777777] px-2 py-1 italic">
                      No Subtitle Tracks For This Title
                    </p>
                  ) : (
                    availableSubtitles.map((track) => (
                      <button
                        key={track.code}
                        onClick={() => {
                          setActiveSubtitle(track.code);
                          setIsSubtitleMenuOpen(false);
                        }}
                        className={`flex items-center justify-between w-full text-left px-2.5 py-1.5 text-xs rounded transition-colors ${
                          activeSubtitle === track.code
                            ? 'bg-[#E50914] text-white font-bold'
                            : 'text-[#B3B3B3] hover:bg-[#252525] hover:text-white'
                        }`}
                      >
                        <span className={track.code === 'ar' ? 'font-medium' : ''}>
                          {track.label}
                        </span>
                        {activeSubtitle === track.code && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Audio Track */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsAudioMenuOpen(!isAudioMenuOpen)}
                className="p-2 text-[#B3B3B3] hover:text-white transition-colors"
                title="Audio Channels"
                aria-label="Audio menu"
              >
                <AudioLines className="w-5 h-5" />
              </button>
              {isAudioMenuOpen && (
                <div className="absolute bottom-10 right-0 bg-[#181818] border border-[#292929] rounded-lg p-2 shadow-xl min-w-[160px] space-y-1 z-50">
                  <p className="text-[10px] uppercase font-bold text-[#777777] px-2 mb-1">
                    Audio Format
                  </p>
                  {['Original 5.1 Surround', 'Stereo 2.0 (Direct)', 'Dolby Atmos Spatial'].map((aud) => (
                    <button
                      key={aud}
                      onClick={() => {
                        setActiveAudioTrack(aud);
                        setIsAudioMenuOpen(false);
                      }}
                      className={`block w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                        activeAudioTrack === aud
                          ? 'bg-[#E50914] text-white font-bold'
                          : 'text-[#B3B3B3] hover:bg-[#252525] hover:text-white'
                      }`}
                    >
                      {aud}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Next Episode if TV */}
            {onSelectNextEpisode && (
              <button
                onClick={onSelectNextEpisode}
                className="p-2 text-[#B3B3B3] hover:text-white transition-colors"
                title="Next Episode"
                aria-label="Next episode"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-[#B3B3B3] hover:text-white transition-colors"
              title="Fullscreen (F)"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Separate Official Trailer Modal Overlay */}
      {showTrailerModal && media.trailerKey && (
        <div
          className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setShowTrailerModal(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#111111] border border-[#292929] rounded-xl overflow-hidden p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-[#E50914]" />
                <span>Official Promotional Trailer — {media.title}</span>
              </span>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="text-xs text-[#B3B3B3] hover:text-white p-1"
              >
                ✕ Close Trailer
              </button>
            </div>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#292929] bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${media.trailerKey}?autoplay=1&rel=0`}
                title={`${media.title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
