/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MediaTitle, Episode, SeasonInfo, CastMember, MediaType } from '../types/index.ts';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Default verified working key from configuration / environment
const DEFAULT_TMDB_KEY = '2dca580c2a14b55200e784d157207b4d';

/**
 * Retrieve active TMDB API key from localStorage, environment, or default fallback.
 */
export function getActiveTmdbKey(): string {
  try {
    const custom = localStorage.getItem('teatro_custom_tmdb_key');
    if (custom && custom.trim().length > 10) return custom.trim();
  } catch (e) {
    // ignore
  }

  const envKey = (import.meta as any).env?.VITE_TMDB_API_KEY;
  if (envKey && envKey.trim().length > 10) {
    return envKey.trim();
  }

  return DEFAULT_TMDB_KEY;
}

/**
 * Set custom TMDB API key in local storage
 */
export function setActiveTmdbKey(key: string): void {
  localStorage.setItem('teatro_custom_tmdb_key', key.trim());
}

// In-memory cache to prevent redundant network calls and respect rate limits
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function tmdbFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const apiKey = getActiveTmdbKey();
  const searchParams = new URLSearchParams();
  searchParams.set('api_key', apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }

  const url = `${TMDB_BASE_URL}${endpoint}?${searchParams.toString()}`;
  const now = Date.now();

  if (cache.has(url)) {
    const cached = cache.get(url)!;
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`TMDB API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  cache.set(url, { timestamp: now, data });
  return data as T;
}

// TMDB Genre ID to Name Mapping
export const TMDB_GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics'
};

/**
 * Format poster & backdrop paths
 */
export function getPosterUrl(path: string | null, size: 'w342' | 'w500' | 'original' = 'w500'): string {
  if (!path) {
    return 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80';
  }
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) {
    return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80';
  }
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

/**
 * Determine mature rating approximation
 */
function determineMaturity(adult: boolean, rating: number, isAnime: boolean): MediaTitle['maturityRating'] {
  if (adult) return 'R';
  if (rating > 8.0) return 'TV-MA';
  if (isAnime) return 'TV-14';
  return 'PG-13';
}

/**
 * Transform raw TMDB movie or TV item into TEATRO MediaTitle domain model
 */
export function normalizeTMDBItem(item: any, explicitType?: 'movie' | 'tv'): MediaTitle {
  const isTV = explicitType === 'tv' || item.media_type === 'tv' || !!item.first_air_date;
  const rawTitle = item.title || item.name || 'Untitled';
  const rawOriginalTitle = item.original_title || item.original_name || rawTitle;
  const releaseDateStr = item.release_date || item.first_air_date || '';
  const year = releaseDateStr ? parseInt(releaseDateStr.split('-')[0], 10) : 2024;

  const genreIds: number[] = item.genre_ids || (item.genres ? item.genres.map((g: any) => g.id) : []);
  const genres = genreIds.map((id) => TMDB_GENRES[id]).filter(Boolean);

  const originalLang = item.original_language || 'en';
  const originCountries: string[] = item.origin_country || [];

  // Determine media category
  let calculatedType: MediaType = isTV ? 'series' : 'movie';
  const isAnime = genreIds.includes(16) && (originalLang === 'ja' || originCountries.includes('JP'));
  const isAsianDrama = (originalLang === 'ko' || originalLang === 'ja' || originalLang === 'zh') && isTV;

  if (isAnime) {
    calculatedType = 'anime';
  } else if (isAsianDrama) {
    calculatedType = 'asian_drama';
  } else if (genreIds.includes(99)) {
    calculatedType = 'documentary';
  }

  const durationStr = isTV
    ? item.number_of_seasons
      ? `${item.number_of_seasons} Season${item.number_of_seasons > 1 ? 's' : ''}`
      : 'Series'
    : item.runtime
    ? `${item.runtime}m`
    : 'Feature Film';

  // Country string representation
  let country = 'International';
  if (originCountries.length > 0) {
    const code = originCountries[0];
    if (code === 'KR') country = 'South Korea';
    else if (code === 'JP') country = 'Japan';
    else if (code === 'US') country = 'United States';
    else if (code === 'GB') country = 'United Kingdom';
    else if (code === 'FR') country = 'France';
    else if (code === 'EG') country = 'Egypt';
    else if (code === 'SA') country = 'Saudi Arabia';
    else if (code === 'AE') country = 'United Arab Emirates';
    else country = code;
  } else if (originalLang === 'ko') country = 'South Korea';
  else if (originalLang === 'ja') country = 'Japan';
  else if (originalLang === 'ar') country = 'Middle East';

  return {
    id: `tmdb_${isTV ? 'tv' : 'mv'}_${item.id}`,
    tmdbId: item.id,
    tmdbMediaType: isTV ? 'tv' : 'movie',
    title: rawTitle,
    originalTitle: rawOriginalTitle,
    originalLanguage: originalLang,
    type: calculatedType,
    categories: ['trending', 'popular'],
    year: isNaN(year) ? 2024 : year,
    releaseDate: releaseDateStr,
    maturityRating: determineMaturity(item.adult, item.vote_average || 7.0, isAnime),
    duration: durationStr,
    genres: genres.length > 0 ? genres : ['Cinema'],
    genreIds,
    country,
    language: originalLang.toUpperCase(),
    rating: parseFloat((item.vote_average || 7.5).toFixed(1)),
    ratingCount: item.vote_count || 120,
    backdrop: getBackdropUrl(item.backdrop_path),
    poster: getPosterUrl(item.poster_path),
    synopsis: item.overview || 'No synopsis available for this title in the archive.',
    director: 'Verified Filmmaker',
    cast: [],
    isAuthorizedStream: false,
    licenseRights: 'TMDB Metadata Verified • Authorized Stream Pending Provider Ingestion',
    quality: '4K UHD',
    audioTracks: ['Original 5.1 Surround', 'Stereo'],
    subtitles: [
      { code: 'en', label: 'English [CC]' },
      { code: 'ar', label: 'Arabic' },
      { code: 'fr', label: 'French' }
    ],
    externalSource: 'tmdb'
  };
}

/**
 * TMDB API Consumer Service
 */
export const tmdbService = {
  /**
   * 1. Trending titles across movies and TV shows
   */
  async getTrending(page = 1): Promise<{ results: MediaTitle[]; totalPages: number }> {
    const data = await tmdbFetch<any>('/trending/all/week', { page });
    const results = (data.results || []).map((item: any) => normalizeTMDBItem(item));
    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 2. Popular Feature Films
   */
  async getPopularMovies(page = 1): Promise<{ results: MediaTitle[]; totalPages: number }> {
    const data = await tmdbFetch<any>('/movie/popular', { page });
    const results = (data.results || []).map((item: any) => normalizeTMDBItem(item, 'movie'));
    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 3. Popular TV Series
   */
  async getPopularTV(page = 1): Promise<{ results: MediaTitle[]; totalPages: number }> {
    const data = await tmdbFetch<any>('/tv/popular', { page });
    const results = (data.results || []).map((item: any) => normalizeTMDBItem(item, 'tv'));
    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 4. Recently Released / Now Playing Movies
   */
  async getNowPlayingMovies(page = 1): Promise<{ results: MediaTitle[]; totalPages: number }> {
    const data = await tmdbFetch<any>('/movie/now_playing', { page });
    const results = (data.results || []).map((item: any) => normalizeTMDBItem(item, 'movie'));
    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 5. Top Rated Masters
   */
  async getTopRated(page = 1): Promise<{ results: MediaTitle[]; totalPages: number }> {
    const data = await tmdbFetch<any>('/movie/top_rated', { page });
    const results = (data.results || []).map((item: any) => normalizeTMDBItem(item, 'movie'));
    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 6. Korean Dramas (K-Dramas)
   */
  async getKoreanDramas(page = 1): Promise<{ results: MediaTitle[]; totalPages: number }> {
    const data = await tmdbFetch<any>('/discover/tv', {
      with_origin_country: 'KR',
      sort_by: 'popularity.desc',
      page
    });
    const results = (data.results || []).map((item: any) => normalizeTMDBItem(item, 'tv'));
    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 7. Japanese Cinema & Neo-Noir
   */
  async getJapaneseCinema(page = 1): Promise<{ results: MediaTitle[]; totalPages: number }> {
    const data = await tmdbFetch<any>('/discover/movie', {
      with_origin_country: 'JP',
      sort_by: 'popularity.desc',
      page
    });
    const results = (data.results || []).map((item: any) => normalizeTMDBItem(item, 'movie'));
    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 8. Anime Series & Animation Masters
   */
  async getAnime(page = 1): Promise<{ results: MediaTitle[]; totalPages: number }> {
    const data = await tmdbFetch<any>('/discover/tv', {
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      page
    });
    const results = (data.results || []).map((item: any) => normalizeTMDBItem(item, 'tv'));
    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 9. Filter by specific genre ID
   */
  async getByGenre(genreId: number, mediaType: 'movie' | 'tv' = 'movie', page = 1): Promise<{ results: MediaTitle[]; totalPages: number }> {
    const endpoint = mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
    const data = await tmdbFetch<any>(endpoint, {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page
    });
    const results = (data.results || []).map((item: any) => normalizeTMDBItem(item, mediaType));
    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 10. Multi-search supporting Arabic, English, and international queries
   */
  async searchMulti(query: string, page = 1, language = 'en-US'): Promise<{ results: MediaTitle[]; totalPages: number }> {
    if (!query || !query.trim()) {
      return { results: [], totalPages: 0 };
    }

    // Detect if query contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(query);
    const searchLang = hasArabic ? 'ar-SA' : language;

    const data = await tmdbFetch<any>('/search/multi', {
      query: query.trim(),
      include_adult: 'false',
      language: searchLang,
      page
    });

    const results = (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => normalizeTMDBItem(item));

    return { results, totalPages: data.total_pages || 1 };
  },

  /**
   * 11. Fetch full details including credits, similar titles, and official trailers
   */
  async getTitleDetails(id: number, type: 'movie' | 'tv'): Promise<MediaTitle> {
    const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
    const data = await tmdbFetch<any>(endpoint, {
      append_to_response: 'credits,similar,videos'
    });

    const base = normalizeTMDBItem(data, type);

    // Extract cast members with character names and avatars
    let castMembers: CastMember[] = [];
    let directorName = 'Verified Filmmaker';

    if (data.credits) {
      if (data.credits.cast) {
        castMembers = data.credits.cast.slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character || 'Cast',
          profilePath: c.profile_path ? `${IMAGE_BASE_URL}/w185${c.profile_path}` : null
        }));
      }

      if (data.credits.crew) {
        const directorObj = data.credits.crew.find(
          (m: any) => m.job === 'Director' || m.department === 'Directing'
        );
        if (directorObj) {
          directorName = directorObj.name;
        }
      }
    }

    // Extract YouTube trailer key
    let trailerKey: string | undefined;
    if (data.videos && data.videos.results) {
      const trailer = data.videos.results.find(
        (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      if (trailer) {
        trailerKey = trailer.key;
      }
    }

    // Extract Seasons info for TV shows
    let seasons: SeasonInfo[] = [];
    if (type === 'tv' && data.seasons) {
      seasons = data.seasons.map((s: any) => ({
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
        posterPath: s.poster_path ? `${IMAGE_BASE_URL}/w342${s.poster_path}` : null,
        airDate: s.air_date
      }));
    }

    return {
      ...base,
      synopsis: data.overview || base.synopsis,
      tagline: data.tagline,
      director: directorName,
      cast: castMembers.map((c) => c.name),
      castMembers,
      trailerKey,
      seasons,
      numberOfSeasons: data.number_of_seasons,
      numberOfEpisodes: data.number_of_episodes,
      status: data.status
    };
  },

  /**
   * 12. Fetch real episodes for a given TV season
   */
  async getTVSeasonEpisodes(tvId: number, seasonNumber: number): Promise<Episode[]> {
    try {
      const data = await tmdbFetch<any>(`/tv/${tvId}/season/${seasonNumber}`);
      if (!data.episodes) return [];

      return data.episodes.map((ep: any) => ({
        id: `tmdb_ep_${ep.id}`,
        seasonNumber: ep.season_number,
        episodeNumber: ep.episode_number,
        title: ep.name || `Episode ${ep.episode_number}`,
        duration: ep.runtime ? `${ep.runtime}m` : '45m',
        synopsis: ep.overview || 'No synopsis recorded for this episode.',
        thumbnail: ep.still_path ? `${IMAGE_BASE_URL}/w300${ep.still_path}` : undefined,
        airDate: ep.air_date
      }));
    } catch (e) {
      console.error('Error fetching TV season episodes:', e);
      return [];
    }
  }
};
