/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Plus,
  Check,
  Star,
  Film,
  Calendar,
  Clock,
  Globe2,
  ShieldCheck,
  Info,
  Tv,
  AlertCircle,
  Video,
  User,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { MediaTitle, Episode, SeasonInfo } from '../../types/index.ts';
import { tmdbService } from '../../services/tmdb.service.ts';
import { verifyPlaybackRights, PlaybackRightsVerification } from '../../services/streamingProvider.service.ts';

interface TitleDetailModalProps {
  media: MediaTitle | null;
  onClose: () => void;
  onPlay: (media: MediaTitle, episode?: Episode) => void;
  onToggleMyList: (id: string) => void;
  isMyList: boolean;
  relatedTitles: MediaTitle[];
  onSelectRelated: (media: MediaTitle) => void;
}

export const TitleDetailModal: React.FC<TitleDetailModalProps> = ({
  media,
  onClose,
  onPlay,
  onToggleMyList,
  isMyList,
  relatedTitles,
  onSelectRelated
}) => {
  const [detailedMedia, setDetailedMedia] = useState<MediaTitle | null>(media);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>(media?.episodes || []);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [showTrailerPlayer, setShowTrailerPlayer] = useState(false);

  // Sync state when selected media prop changes
  useEffect(() => {
    setDetailedMedia(media);
    setEpisodes(media?.episodes || []);
    setShowTrailerPlayer(false);

    if (media && media.tmdbId) {
      setIsLoadingDetails(true);
      tmdbService
        .getTitleDetails(media.tmdbId, media.tmdbMediaType || (media.type === 'movie' ? 'movie' : 'tv'))
        .then((fullData) => {
          setDetailedMedia((prev) => ({
            ...(prev || media),
            ...fullData
          }));
          if (fullData.seasons && fullData.seasons.length > 0) {
            const firstSeason = fullData.seasons.find((s) => s.seasonNumber > 0) || fullData.seasons[0];
            setSelectedSeasonNumber(firstSeason.seasonNumber);
          }
        })
        .catch((err) => console.error('Error fetching extended details from TMDB:', err))
        .finally(() => setIsLoadingDetails(false));
    }
  }, [media]);

  // Fetch TV episodes when season selection changes
  useEffect(() => {
    if (detailedMedia?.tmdbId && (detailedMedia.type === 'series' || detailedMedia.type === 'asian_drama' || detailedMedia.type === 'anime')) {
      setIsLoadingEpisodes(true);
      tmdbService
        .getTVSeasonEpisodes(detailedMedia.tmdbId, selectedSeasonNumber)
        .then((loadedEpisodes) => {
          if (loadedEpisodes.length > 0) {
            setEpisodes(loadedEpisodes);
          }
        })
        .catch((err) => console.error('Error loading season episodes:', err))
        .finally(() => setIsLoadingEpisodes(false));
    }
  }, [detailedMedia?.tmdbId, detailedMedia?.type, selectedSeasonNumber]);

  if (!media) return null;

  const currentMedia = detailedMedia || media;
  const rights: PlaybackRightsVerification = verifyPlaybackRights(currentMedia);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#111111] border border-[#292929] rounded-xl overflow-hidden shadow-2xl my-auto text-white animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-[#080808]/80 hover:bg-[#E50914] text-white border border-[#292929] transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Cover */}
        <div className="relative w-full h-[320px] sm:h-[420px] overflow-hidden bg-[#080808]">
          <img
            src={currentMedia.backdrop || currentMedia.poster}
            alt={currentMedia.title}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/95 via-[#111111]/50 to-transparent" />

          {/* Floating Actions on Backdrop */}
          <div className="absolute bottom-6 left-6 sm:left-10 right-6 sm:right-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              {currentMedia.originalTitle && currentMedia.originalTitle !== currentMedia.title && (
                <p className="text-sm font-medium text-[#E50914] mb-1 font-mono tracking-wide">
                  {currentMedia.originalTitle}
                </p>
              )}
              <h2 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                {currentMedia.title}
              </h2>
              {currentMedia.tagline && (
                <p className="text-xs sm:text-sm text-[#B3B3B3] italic mt-1 font-serif">
                  "{currentMedia.tagline}"
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Cinema Playback Action */}
              <button
                onClick={() => onPlay(currentMedia)}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#E50914] hover:bg-[#b80710] text-white text-sm font-bold rounded shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{rights.hasAuthorizedStream ? 'Stream Master' : 'Play in Cinema Player'}</span>
              </button>

              {/* Distinct Separate Watch Trailer Button */}
              {currentMedia.trailerKey && (
                <button
                  onClick={() => setShowTrailerPlayer(!showTrailerPlayer)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded text-sm font-bold transition-colors ${
                    showTrailerPlayer
                      ? 'bg-[#E50914] text-white'
                      : 'bg-[#181818] hover:bg-[#252525] border border-[#292929] hover:border-white/40 text-white'
                  }`}
                  aria-label="Watch official trailer"
                >
                  <Video className="w-4 h-4 text-[#E50914]" />
                  <span>{showTrailerPlayer ? 'Hide Trailer' : 'Watch Trailer'}</span>
                </button>
              )}

              <button
                onClick={() => onToggleMyList(currentMedia.id)}
                className={`p-2.5 rounded-full border transition-colors ${
                  isMyList
                    ? 'bg-[#E50914] text-white border-[#E50914]'
                    : 'bg-[#181818]/90 text-white border-[#292929] hover:border-white/50'
                }`}
                title={isMyList ? 'In Watchlist' : 'Add to Watchlist'}
                aria-label={isMyList ? 'In Watchlist' : 'Add to Watchlist'}
              >
                {isMyList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Embedded Official YouTube Trailer Modal Overlay */}
        {showTrailerPlayer && currentMedia.trailerKey && (
          <div className="p-4 bg-black border-y border-[#292929] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#B3B3B3]">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Video className="w-4 h-4 text-[#E50914]" />
                Official Promotional Trailer ({currentMedia.title})
              </span>
              <button
                onClick={() => setShowTrailerPlayer(false)}
                className="text-xs text-[#777777] hover:text-white"
              >
                Close Trailer ✕
              </button>
            </div>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#292929]">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${currentMedia.trailerKey}?autoplay=1&rel=0`}
                title={`${currentMedia.title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left 2 Cols: Synopsis, Cast, Episodes */}
            <div className="md:col-span-2 space-y-6">
              {/* Meta tags pills */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#B3B3B3]">
                <span className="px-2 py-0.5 bg-[#ffd700] text-black font-extrabold rounded">
                  ★ {currentMedia.rating} ({currentMedia.ratingCount?.toLocaleString() || '10k+'} votes)
                </span>
                <span className="px-2 py-0.5 border border-[#777777]/50 rounded font-bold uppercase text-white">
                  {currentMedia.maturityRating}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{currentMedia.year}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{currentMedia.duration}</span>
                </span>
                <span className="px-1.5 py-0.5 bg-[#181818] border border-[#292929] rounded text-[11px] font-semibold text-[#E50914]">
                  {currentMedia.quality}
                </span>
              </div>

              {/* Synopsis text */}
              <p className="text-sm sm:text-base text-[#D4D4D4] leading-relaxed">
                {currentMedia.synopsis}
              </p>

              {/* Streaming Rights Status Banner */}
              <div
                className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
                  rights.hasAuthorizedStream
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                    : 'bg-[#181818] border-[#292929] text-[#B3B3B3]'
                }`}
              >
                {rights.hasAuthorizedStream ? (
                  <ShieldCheck className="w-4 h-4 text-[#4ade80] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold text-white block mb-0.5">
                    {rights.hasAuthorizedStream
                      ? 'Authorized Playback Available'
                      : 'Content Licensing Notice'}
                  </span>
                  <span>{rights.disclaimer}</span>
                </div>
              </div>

              {/* Real Cast Members with Profile Pictures */}
              {currentMedia.castMembers && currentMedia.castMembers.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#292929]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-[#777777]">
                    Featured Cast & Characters
                  </h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {currentMedia.castMembers.slice(0, 8).map((actor) => (
                      <div
                        key={actor.id}
                        className="flex-none w-20 text-center space-y-1.5 group"
                      >
                        <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-[#202020] border border-[#292929]">
                          {actor.profilePath ? (
                            <img
                              src={actor.profilePath}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#777777]">
                              <User className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-white truncate leading-tight">
                          {actor.name}
                        </div>
                        <div className="text-[10px] text-[#777777] truncate leading-tight">
                          {actor.character}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TV Series Seasons & Real Episodes */}
              {currentMedia.seasons && currentMedia.seasons.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-[#292929]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Tv className="w-4 h-4 text-[#E50914]" />
                      <span>Episodes & Seasons</span>
                    </h3>

                    {/* Season Selector Dropdown */}
                    <select
                      value={selectedSeasonNumber}
                      onChange={(e) => setSelectedSeasonNumber(parseInt(e.target.value, 10))}
                      className="px-3 py-1 bg-[#181818] border border-[#292929] rounded text-xs text-white focus:outline-none focus:border-[#E50914] cursor-pointer"
                    >
                      {currentMedia.seasons
                        .filter((s) => s.seasonNumber > 0)
                        .map((s) => (
                          <option key={s.seasonNumber} value={s.seasonNumber}>
                            {s.name || `Season ${s.seasonNumber}`} ({s.episodeCount} Episodes)
                          </option>
                        ))}
                    </select>
                  </div>

                  {isLoadingEpisodes ? (
                    <div className="p-6 text-center text-xs text-[#777777]">
                      Loading real season episodes from TMDB...
                    </div>
                  ) : episodes.length > 0 ? (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {episodes.map((ep) => (
                        <div
                          key={ep.id}
                          onClick={() => onPlay(currentMedia, ep)}
                          className="group p-3 bg-[#181818] hover:bg-[#202020] border border-[#292929] hover:border-[#555555] rounded-lg cursor-pointer transition-all flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[#777777] group-hover:text-[#E50914] w-6 text-center">
                              {ep.episodeNumber}
                            </span>
                            <div>
                              <h4 className="text-sm font-semibold text-white group-hover:text-white">
                                {ep.title}
                              </h4>
                              <p className="text-xs text-[#777777] line-clamp-1 mt-0.5">
                                {ep.synopsis}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-[#777777]">{ep.duration}</span>
                            <button
                              className="p-1.5 rounded-full bg-[#292929] group-hover:bg-[#E50914] text-white transition-colors"
                              aria-label={`Play episode ${ep.episodeNumber}`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#777777]">
                      Episode listings for this season are being cataloged.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Col: Metadata Specs, Director, License & External Links */}
            <div className="space-y-5 text-xs text-[#B3B3B3] bg-[#181818]/60 p-5 rounded-lg border border-[#292929]">
              <div>
                <span className="text-[#777777] uppercase text-[10px] font-bold block mb-1">
                  Director / Creator
                </span>
                <span className="text-white font-medium text-sm">{currentMedia.director}</span>
              </div>

              <div>
                <span className="text-[#777777] uppercase text-[10px] font-bold block mb-1">
                  Genres
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentMedia.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 bg-[#202020] border border-[#292929] rounded text-[11px] text-[#B3B3B3]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[#777777] uppercase text-[10px] font-bold block mb-1">
                  Production Origin
                </span>
                <p className="text-white">
                  {currentMedia.country} • {currentMedia.language}
                </p>
                {currentMedia.releaseDate && (
                  <p className="text-[#777777] text-[11px] mt-0.5">
                    Release: {currentMedia.releaseDate}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#292929]">
                <span className="text-[#777777] uppercase text-[10px] font-bold block mb-1">
                  Selectable Subtitles
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {rights.subtitles && rights.subtitles.length > 0 ? (
                    rights.subtitles.map((sub) => (
                      <span
                        key={sub.code}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          sub.code === 'ar'
                            ? 'bg-[#E50914]/20 border-[#E50914]/50 text-white font-bold'
                            : 'bg-[#202020] border-[#292929] text-[#B3B3B3]'
                        }`}
                      >
                        {sub.label}
                      </span>
                    ))
                  ) : currentMedia.subtitles && currentMedia.subtitles.length > 0 ? (
                    currentMedia.subtitles.map((sub) => (
                      <span
                        key={sub.code}
                        className="px-2 py-0.5 bg-[#202020] border border-[#292929] rounded text-[11px] text-[#B3B3B3]"
                      >
                        {sub.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#777777] italic">
                      Subtitles loaded on provider connection
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#292929]">
                <span className="text-[#777777] uppercase text-[10px] font-bold flex items-center gap-1 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
                  <span>Rights & Compliance</span>
                </span>
                <p className="text-[11px] text-[#A3A3A3] leading-normal">
                  {rights.licenseType}
                </p>
              </div>

              {currentMedia.tmdbId && (
                <div className="pt-3 border-t border-[#292929]">
                  <a
                    href={`https://www.themoviedb.org/${currentMedia.tmdbMediaType || 'movie'}/${currentMedia.tmdbId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-[#B3B3B3] hover:text-white"
                  >
                    <span>View on The Movie Database</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Related Titles Row */}
          {relatedTitles.length > 0 && (
            <div className="pt-6 border-t border-[#292929]">
              <h3 className="text-base font-bold text-white mb-4">More Like This</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedTitles.slice(0, 4).map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="group bg-[#181818] border border-[#292929] hover:border-[#555] rounded-lg overflow-hidden cursor-pointer transition-all"
                  >
                    <div className="aspect-video relative overflow-hidden bg-black">
                      <img
                        src={rel.backdrop || rel.poster}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-bold text-[#ffd700]">
                        ★ {rel.rating}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h4 className="text-xs font-bold text-white truncate">{rel.title}</h4>
                      <p className="text-[11px] text-[#777777] mt-0.5">
                        {rel.year} • {rel.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
