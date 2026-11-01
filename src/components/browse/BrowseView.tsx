/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Film,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { MediaTitle, FilterOptions, MediaType } from '../../types/index.ts';
import { PosterCard } from '../carousel/PosterCard.tsx';
import { tmdbService, TMDB_GENRES } from '../../services/tmdb.service.ts';

interface BrowseViewProps {
  catalog: MediaTitle[];
  onSelectTitle: (item: MediaTitle) => void;
  onPlayTitle: (item: MediaTitle) => void;
  onToggleMyList: (id: string) => void;
  isMyList: (id: string) => boolean;
  initialCategory?: string;
  initialSearch?: string;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  catalog,
  onSelectTitle,
  onPlayTitle,
  onToggleMyList,
  isMyList,
  initialCategory = 'all',
  initialSearch = ''
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedGenreId, setSelectedGenreId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'year'>('popularity');
  const [titles, setTitles] = useState<MediaTitle[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Catalog' },
    { id: 'trending', label: 'Trending This Week' },
    { id: 'movie', label: 'Feature Films' },
    { id: 'series', label: 'TV Series' },
    { id: 'korean', label: 'Korean Dramas' },
    { id: 'asian_drama', label: 'Asian Dramas' },
    { id: 'anime', label: 'Anime' },
    { id: 'now_playing', label: 'Recently Released' },
    { id: 'top_rated', label: 'Top Rated Masters' }
  ];

  // Fetch real catalog from TMDB
  const fetchCategoryData = useCallback(
    async (cat: string, query: string, genreId: string, pageNum: number, append = false) => {
      try {
        if (!append) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);

        let res: { results: MediaTitle[]; totalPages: number };

        if (query.trim().length > 0) {
          // Search multi in Arabic or English
          res = await tmdbService.searchMulti(query.trim(), pageNum);
        } else if (genreId !== 'all') {
          const numId = parseInt(genreId, 10);
          const type = cat === 'series' || cat === 'anime' || cat === 'korean' ? 'tv' : 'movie';
          res = await tmdbService.getByGenre(numId, type, pageNum);
        } else {
          switch (cat) {
            case 'trending':
              res = await tmdbService.getTrending(pageNum);
              break;
            case 'movie':
              res = await tmdbService.getPopularMovies(pageNum);
              break;
            case 'series':
              res = await tmdbService.getPopularTV(pageNum);
              break;
            case 'korean':
              res = await tmdbService.getKoreanDramas(pageNum);
              break;
            case 'asian_drama':
              res = await tmdbService.getKoreanDramas(pageNum);
              break;
            case 'anime':
              res = await tmdbService.getAnime(pageNum);
              break;
            case 'now_playing':
              res = await tmdbService.getNowPlayingMovies(pageNum);
              break;
            case 'top_rated':
              res = await tmdbService.getTopRated(pageNum);
              break;
            case 'all':
            default:
              res = await tmdbService.getTrending(pageNum);
              break;
          }
        }

        let sorted = [...res.results];
        if (sortBy === 'rating') {
          sorted.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'year') {
          sorted.sort((a, b) => b.year - a.year);
        }

        if (append) {
          setTitles((prev) => [...prev, ...sorted]);
        } else {
          setTitles(sorted);
        }
        setTotalPages(res.totalPages);
      } catch (err: any) {
        console.error('Catalog fetch error:', err);
        setError(err.message || 'Failed to load movie catalog from TMDB API.');
        // Fallback to local catalog if offline
        if (!append) {
          setTitles(catalog);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [sortBy, catalog]
  );

  // Debounced query and category change listener
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCategoryData(activeCategory, searchQuery, selectedGenreId, 1, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [activeCategory, searchQuery, selectedGenreId, fetchCategoryData]);

  // Load next page
  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCategoryData(activeCategory, searchQuery, selectedGenreId, nextPage, true);
    }
  };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setSelectedGenreId('all');
    setSortBy('popularity');
  };

  const hasActiveFilters =
    activeCategory !== 'all' ||
    searchQuery.trim().length > 0 ||
    selectedGenreId !== 'all';

  return (
    <div className="pt-24 pb-20 px-6 md:px-14 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          Curated Discovery & Archive
        </h1>
        <p className="text-sm text-[#B3B3B3]">
          Live cinema catalog powered by The Movie Database API with bilingual Arabic & English search.
        </p>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveCategory(tab.id);
              setSearchQuery('');
              setSelectedGenreId('all');
            }}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === tab.id
                ? 'bg-[#E50914] text-white shadow-md'
                : 'bg-[#181818] text-[#B3B3B3] hover:text-white border border-[#292929] hover:border-[#555]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-[#111111] border border-[#292929] rounded-xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Search Input Supporting Arabic and English */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in Arabic (الجوكر) or English (Oppenheimer, Dune)..."
              className="w-full pl-9 pr-8 py-2 bg-[#181818] border border-[#292929] rounded-lg text-sm text-white placeholder-[#777777] focus:outline-none focus:border-[#E50914] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Real TMDB Genres Selector */}
          <select
            value={selectedGenreId}
            onChange={(e) => setSelectedGenreId(e.target.value)}
            className="px-3 py-2 bg-[#181818] border border-[#292929] rounded-lg text-xs text-white focus:outline-none focus:border-[#E50914] cursor-pointer"
            aria-label="Filter by genre"
          >
            <option value="all">All Genres</option>
            {Object.entries(TMDB_GENRES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          {/* Sort Order Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-[#181818] border border-[#292929] rounded-lg text-xs text-white font-medium focus:outline-none focus:border-[#E50914] cursor-pointer ml-auto"
            aria-label="Sort catalog order"
          >
            <option value="popularity">Sort: Most Popular</option>
            <option value="rating">Sort: Highest Rated</option>
            <option value="year">Sort: Release Date</option>
          </select>
        </div>

        {/* Active Filter Badges Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#292929] text-xs">
            <span className="text-[#777777] font-medium">Active Filters:</span>

            {activeCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#181818] border border-[#292929] rounded text-white">
                <span>Category: {categories.find((c) => c.id === activeCategory)?.label}</span>
                <button
                  onClick={() => setActiveCategory('all')}
                  className="text-[#777777] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedGenreId !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#181818] border border-[#292929] rounded text-white">
                <span>Genre: {TMDB_GENRES[parseInt(selectedGenreId, 10)]}</span>
                <button
                  onClick={() => setSelectedGenreId('all')}
                  className="text-[#777777] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#181818] border border-[#292929] rounded text-white">
                <span>Query: "{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#777777] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="ml-auto text-xs text-[#E50914] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Results Count & TMDB Attribution Notice */}
      <div className="flex items-center justify-between text-xs text-[#B3B3B3]">
        <p>
          Showing <strong className="text-white">{titles.length}</strong> verified titles
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
        <span className="text-[11px] text-[#777777]">
          Data courtesy of The Movie Database (TMDB)
        </span>
      </div>

      {/* Grid of Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] bg-[#181818] rounded-md animate-pulse border border-[#292929]"
            />
          ))}
        </div>
      ) : titles.length > 0 ? (
        <div className="space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {titles.map((item) => (
              <PosterCard
                key={item.id}
                item={item}
                onSelect={onSelectTitle}
                onPlay={onPlayTitle}
                onToggleMyList={onToggleMyList}
                isMyList={isMyList(item.id)}
              />
            ))}
          </div>

          {/* Infinite Scroll / Load More Button */}
          {page < totalPages && (
            <div className="text-center pt-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-8 py-3 bg-[#181818] hover:bg-[#222222] border border-[#292929] hover:border-[#555] rounded-full text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg inline-flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#E50914]" />
                    <span>Loading Titles...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Titles (Page {page + 1} of {totalPages})</span>
                    <ChevronDown className="w-4 h-4 text-[#E50914]" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4 bg-[#111111] rounded-xl border border-[#292929] p-8">
          <Film className="w-12 h-12 text-[#777777] mx-auto" />
          <h3 className="text-lg font-bold text-white">No Matching Titles Found</h3>
          <p className="text-sm text-[#B3B3B3] max-w-md mx-auto">
            We couldn't find any titles in the database matching "{searchQuery}". Try searching with
            different keywords in English or Arabic.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-2.5 bg-[#E50914] text-white text-xs font-bold rounded hover:bg-[#b80710] transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
