/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { MediaTitle } from '../../types/index.ts';

interface CinematicHeroProps {
  featuredTitles: MediaTitle[];
  onPlay: (title: MediaTitle) => void;
  onMoreInfo: (title: MediaTitle) => void;
  onToggleMyList: (titleId: string) => void;
  isMyList: (titleId: string) => boolean;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  featuredTitles,
  onPlay,
  onMoreInfo,
  onToggleMyList,
  isMyList
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  if (!featuredTitles || featuredTitles.length === 0) {
    return (
      <div className="w-full h-[60vh] bg-[#111111] flex items-center justify-center text-[#777777]">
        No featured titles available.
      </div>
    );
  }

  const current = featuredTitles[currentIndex];
  const inList = isMyList(current.id);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredTitles.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredTitles.length) % featuredTitles.length);
  };

  return (
    <section className="relative w-full h-[82vh] min-h-[580px] max-h-[850px] flex items-end pb-16 md:pb-24 px-6 md:px-14 overflow-hidden select-none">
      {/* Dynamic Backdrop Media with Graceful Fallback */}
      <div className="absolute inset-0 z-0">
        <img
          key={current.id}
          src={current.backdrop || current.poster}
          alt={current.title}
          className="w-full h-full object-cover object-center transition-opacity duration-700 animate-fadeIn"
          onError={(e) => {
            // Fallback gradient if network drops image
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />

        {/* Sophisticated Cinematic Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/95 via-[#080808]/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-transparent via-[#080808]/30 to-[#080808]" />
      </div>

      {/* Hero Content Information */}
      <div className="relative z-10 max-w-3xl">
        {/* Curated Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E50914]/20 border border-[#E50914]/50 text-[#ff4d58] text-xs font-semibold uppercase tracking-wider rounded mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curated Premiere • {current.quality}</span>
        </div>

        {/* Title */}
        <h1 className="font-cinzel text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md mb-3">
          {current.title}
        </h1>

        {/* Metadata Chips */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-[#B3B3B3] mb-4">
          <span className="px-2 py-0.5 bg-[#ffd700] text-black font-extrabold text-xs rounded">
            ★ {current.rating}
          </span>
          <span className="px-1.5 py-0.5 border border-[#777777]/50 rounded text-xs text-white uppercase font-bold">
            {current.maturityRating}
          </span>
          <span>{current.year}</span>
          <span>•</span>
          <span>{current.duration}</span>
          <span>•</span>
          <span className="capitalize">{current.country}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            {current.genres.slice(0, 3).map((g) => (
              <span key={g} className="text-white/80">
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Synopsis */}
        <p className="text-sm sm:text-base text-[#D4D4D4] leading-relaxed line-clamp-3 md:line-clamp-4 max-w-2xl mb-7 drop-shadow">
          {current.synopsis}
        </p>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={() => onPlay(current)}
            className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-[#E50914] hover:bg-[#b80710] text-white text-sm sm:text-base font-bold rounded shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Play Now</span>
          </button>

          <button
            onClick={() => onMoreInfo(current)}
            className="flex items-center gap-2 px-5 sm:px-6 py-3 bg-white/15 hover:bg-white/25 text-white text-sm sm:text-base font-semibold rounded backdrop-blur-md border border-white/20 transition-colors"
          >
            <Info className="w-5 h-5" />
            <span>More Info</span>
          </button>

          <button
            onClick={() => onToggleMyList(current.id)}
            className={`flex items-center justify-center p-3 rounded-full border transition-colors ${
              inList
                ? 'bg-[#E50914] text-white border-[#E50914]'
                : 'bg-[#181818]/80 text-[#B3B3B3] hover:text-white border-[#292929] hover:border-white/50'
            }`}
            title={inList ? 'Remove from My List' : 'Add to My List'}
            aria-label={inList ? 'Remove from My List' : 'Add to My List'}
          >
            {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Hero Navigator Arrows & Mute Simulator */}
      <div className="absolute right-6 md:right-14 bottom-16 md:bottom-24 z-20 flex items-center gap-2.5">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2.5 bg-[#181818]/70 hover:bg-[#181818] border border-[#292929] rounded-full text-white backdrop-blur transition-colors"
          aria-label={isMuted ? 'Unmute Audio Preview' : 'Mute Audio Preview'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {featuredTitles.length > 1 && (
          <div className="flex items-center gap-1 bg-[#181818]/70 border border-[#292929] rounded-full p-1 backdrop-blur">
            <button
              onClick={handlePrev}
              className="p-1.5 text-[#B3B3B3] hover:text-white transition-colors"
              aria-label="Previous Featured Title"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-semibold text-[#777777] px-1">
              {currentIndex + 1} / {featuredTitles.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 text-[#B3B3B3] hover:text-white transition-colors"
              aria-label="Next Featured Title"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
