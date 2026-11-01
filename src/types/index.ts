/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MediaType = 'movie' | 'series' | 'anime' | 'asian_drama' | 'documentary';

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface SeasonInfo {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterPath: string | null;
  airDate?: string;
}

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration: string;
  synopsis: string;
  streamUrl?: string;
  thumbnail?: string;
  airDate?: string;
}

export interface SubtitleTrack {
  code: string; // e.g. 'ar', 'en', 'es', 'fr', 'ja', 'ko'
  label: string; // e.g. 'العربية (Arabic)', 'English [CC]'
  src?: string; // Path or URL to WebVTT file
  direction?: 'ltr' | 'rtl';
}

export interface MediaTitle {
  id: string;
  tmdbId?: number;
  tmdbMediaType?: 'movie' | 'tv';
  title: string;
  originalTitle?: string;
  originalLanguage?: string;
  type: MediaType;
  categories: string[]; // e.g. ['trending', 'popular', 'top_rated', 'scifi', 'korean', etc.]
  year: number;
  releaseDate?: string;
  maturityRating: 'G' | 'PG' | 'PG-13' | 'TV-14' | 'TV-MA' | 'R' | 'NR';
  duration: string; // e.g. "148m", "2 Seasons", "16 Episodes"
  genres: string[];
  genreIds?: number[];
  country: string;
  language: string;
  rating: number; // e.g. 8.4
  ratingCount: number;
  backdrop: string;
  poster: string;
  synopsis: string;
  tagline?: string;
  director: string;
  cast: string[];
  castMembers?: CastMember[];
  trailerUrl?: string;
  trailerKey?: string; // YouTube video ID from TMDB
  streamUrl?: string;
  isAuthorizedStream: boolean;
  licenseRights: string; // e.g. "CC-BY 3.0", "Streaming Rights in Negotiation"
  quality: '4K UHD' | '1080p FHD' | '720p HD';
  audioTracks: string[];
  subtitles: SubtitleTrack[];
  episodes?: Episode[];
  seasons?: SeasonInfo[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: string;
  externalSource?: 'tmdb' | 'custom';
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
}

export type SubscriptionTier = 'free' | 'vip' | 'family';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatar: string;
  subscriptionTier: SubscriptionTier;
  profiles: UserProfile[];
  activeProfileId: string;
  preferences: {
    autoplayPreviews: boolean;
    subtitleLanguage: string;
    audioLanguage: string;
    playbackQuality: 'auto' | '1080p' | '4k';
  };
}

export interface WatchProgress {
  titleId: string;
  episodeId?: string;
  currentTime: number;
  duration: number;
  percentage: number;
  lastUpdated: number;
}

export interface FilterOptions {
  type: 'all' | MediaType;
  genre: string;
  yearBracket: 'all' | '2024+' | '2020-2023' | '2010s' | 'classics';
  country: string;
  language: string;
  minRating: number;
  searchQuery: string;
  sortBy: 'popularity' | 'rating' | 'year' | 'title';
}
