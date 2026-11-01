/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PosterCard } from './PosterCard.tsx';
import { MediaTitle, WatchProgress } from '../../types/index.ts';

interface ContentRowProps {
  title: string;
  items: MediaTitle[];
  onSelectTitle: (item: MediaTitle) => void;
  onPlayTitle: (item: MediaTitle) => void;
  onToggleMyList: (id: string) => void;
  isMyList: (id: string) => boolean;
  onExploreMore?: () => void;
  watchProgressMap?: Record<string, WatchProgress>;
}

export const ContentRow: React.FC<ContentRowProps> = ({
  title,
  items,
  onSelectTitle,
  onPlayTitle,
  onToggleMyList,
  isMyList,
  onExploreMore,
  watchProgressMap = {}
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative my-6 px-6 md:px-14 group">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          {title}
        </h3>
        {onExploreMore && (
          <button
            onClick={onExploreMore}
            className="text-xs sm:text-sm font-semibold text-[#B3B3B3] hover:text-[#E50914] transition-colors flex items-center gap-1"
          >
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation Arrow Left */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#080808]/85 border border-[#292929] text-white items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 hover:bg-[#E50914] transition-all"
        aria-label={`Scroll ${title} left`}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Scrollable Track */}
      <div
        ref={rowRef}
        className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"
      >
        {items.map((item) => (
          <PosterCard
            key={item.id}
            item={item}
            onSelect={onSelectTitle}
            onPlay={onPlayTitle}
            onToggleMyList={onToggleMyList}
            isMyList={isMyList(item.id)}
            progress={watchProgressMap[item.id]}
          />
        ))}
      </div>

      {/* Navigation Arrow Right */}
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#080808]/85 border border-[#292929] text-white items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 hover:bg-[#E50914] transition-all"
        aria-label={`Scroll ${title} right`}
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </section>
  );
};
