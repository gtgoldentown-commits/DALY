/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilterOptions, MediaTitle } from '../types/index.ts';

/**
 * Pure function to filter and sort catalog titles based on multi-faceted criteria.
 */
export function filterAndSortCatalog(
  catalog: MediaTitle[],
  options: FilterOptions
): MediaTitle[] {
  const query = options.searchQuery.trim().toLowerCase();

  return catalog
    .filter((item) => {
      // 1. Content Type Filter
      if (options.type !== 'all' && item.type !== options.type) {
        return false;
      }

      // 2. Genre Filter
      if (options.genre && options.genre !== 'all') {
        const hasGenre = item.genres.some(
          (g) => g.toLowerCase() === options.genre.toLowerCase()
        );
        if (!hasGenre) return false;
      }

      // 3. Year Bracket Filter
      if (options.yearBracket !== 'all') {
        if (options.yearBracket === '2024+' && item.year < 2024) return false;
        if (options.yearBracket === '2020-2023' && (item.year < 2020 || item.year > 2023)) return false;
        if (options.yearBracket === '2010s' && (item.year < 2010 || item.year > 2019)) return false;
        if (options.yearBracket === 'classics' && item.year >= 2000) return false;
      }

      // 4. Country Filter
      if (options.country && options.country !== 'all') {
        if (item.country.toLowerCase() !== options.country.toLowerCase()) {
          return false;
        }
      }

      // 5. Language Filter
      if (options.language && options.language !== 'all') {
        if (!item.language.toLowerCase().includes(options.language.toLowerCase())) {
          return false;
        }
      }

      // 6. Minimum Rating Filter
      if (options.minRating > 0 && item.rating < options.minRating) {
        return false;
      }

      // 7. Search Query (title, original title, director, cast, genres, synopsis)
      if (query.length > 0) {
        const inTitle = item.title.toLowerCase().includes(query);
        const inOriginal = item.originalTitle?.toLowerCase().includes(query);
        const inDirector = item.director.toLowerCase().includes(query);
        const inCast = item.cast.some((c) => c.toLowerCase().includes(query));
        const inGenres = item.genres.some((g) => g.toLowerCase().includes(query));
        const inSynopsis = item.synopsis.toLowerCase().includes(query);

        if (!inTitle && !inOriginal && !inDirector && !inCast && !inGenres && !inSynopsis) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (options.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'year':
          return b.year - a.year;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'popularity':
        default:
          return (b.ratingCount || 0) - (a.ratingCount || 0);
      }
    });
}

/**
 * Extract unique genres across catalog
 */
export function getUniqueGenres(catalog: MediaTitle[]): string[] {
  const set = new Set<string>();
  for (const item of catalog) {
    for (const g of item.genres) {
      set.add(g);
    }
  }
  return Array.from(set).sort();
}

/**
 * Extract unique countries
 */
export function getUniqueCountries(catalog: MediaTitle[]): string[] {
  const set = new Set<string>();
  for (const item of catalog) {
    if (item.country) set.add(item.country);
  }
  return Array.from(set).sort();
}

/**
 * Extract unique primary languages
 */
export function getUniqueLanguages(catalog: MediaTitle[]): string[] {
  const set = new Set<string>();
  for (const item of catalog) {
    if (item.language) set.add(item.language);
  }
  return Array.from(set).sort();
}

/**
 * Format playback seconds to mm:ss or hh:mm:ss
 */
export function formatSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculate percentage completed
 */
export function calculateProgressPercentage(currentTime: number, duration: number): number {
  if (!duration || duration <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));
}
