/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Plus, Check, Info, Star } from 'lucide-react';
import { MediaTitle, WatchProgress } from '../../types/index.ts';

interface PosterCardProps {
  item: MediaTitle;
  onSelect: (item: MediaTitle) => void;
  onPlay: (item: MediaTitle) => void;
  onToggleMyList: (id: string) => void;
  isMyList: boolean;
  progress?: WatchProgress;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  item,
  onSelect,
  onPlay,
  onToggleMyList,
  isMyList,
  progress
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative flex-none w-[160px] sm:w-[190px] md:w-[210px] aspect-[2/3] rounded-md overflow-hidden bg-[#111111] border border-[#292929] cursor-pointer transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl hover:border-[#555555] hover:z-20 select-none"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect(item);
      }}
      aria-label={`View details for ${item.title}`}
    >
      {/* Poster Image */}
      <img
        src={item.poster}
        alt={item.title}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Skeleton while loading */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-[#181818] animate-pulse flex items-center justify-center">
          <span className="text-xs text-[#777777]">Loading...</span>
        </div>
      )}

      {/* Type badge on top corner */}
      <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-[#080808]/85 border border-[#292929] rounded text-[10px] font-bold uppercase tracking-wider text-white">
        {item.type.replace('_', ' ')}
      </div>

      {/* Rating badge on top right */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 bg-[#080808]/85 border border-[#292929] rounded text-[10px] font-bold text-[#ffd700]">
        <Star className="w-2.5 h-2.5 fill-current" />
        <span>{item.rating}</span>
      </div>

      {/* Progress Bar (if watched) */}
      {progress && progress.percentage > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#292929] z-10">
          <div
            className="h-full bg-[#E50914]"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}

      {/* Hover Information Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-end z-10">
        <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">{item.title}</h4>

        <div className="flex items-center gap-2 text-[11px] text-[#B3B3B3] mb-2">
          <span>{item.year}</span>
          <span>•</span>
          <span>{item.duration}</span>
        </div>

        <p className="text-[11px] text-[#D4D4D4] line-clamp-2 mb-3 leading-snug">
          {item.synopsis}
        </p>

        {/* Quick actions bar */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onPlay(item)}
            className="p-2 bg-[#E50914] hover:bg-[#b80710] text-white rounded-full transition-colors"
            title="Play Now"
            aria-label={`Play ${item.title}`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>

          <button
            onClick={() => onToggleMyList(item.id)}
            className={`p-2 rounded-full border transition-colors ${
              isMyList
                ? 'bg-[#E50914] text-white border-[#E50914]'
                : 'bg-[#181818] text-[#B3B3B3] hover:text-white border-[#292929] hover:border-white/50'
            }`}
            title={isMyList ? 'Remove from My List' : 'Add to My List'}
            aria-label={isMyList ? `Remove ${item.title} from list` : `Add ${item.title} to list`}
          >
            {isMyList ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onSelect(item)}
            className="p-2 bg-[#181818] hover:bg-[#252525] text-white border border-[#292929] rounded-full transition-colors ml-auto"
            title="Full Details"
            aria-label={`More details for ${item.title}`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
