import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortCatalog,
  formatSeconds,
  calculateProgressPercentage,
  getUniqueGenres
} from './filterEngine.ts';
import { MediaTitle, FilterOptions } from '../types/index.ts';

const SAMPLE_TITLES: MediaTitle[] = [
  {
    id: '1',
    title: 'Tears of Steel',
    originalTitle: 'Tears of Steel',
    type: 'movie',
    categories: ['trending', 'scifi'],
    year: 2012,
    maturityRating: 'PG-13',
    duration: '12m',
    genres: ['Sci-Fi', 'Cyberpunk', 'Action'],
    country: 'Netherlands',
    language: 'English',
    rating: 8.6,
    ratingCount: 15400,
    backdrop: '',
    poster: '',
    synopsis: 'A dystopian Amsterdam future terminal.',
    director: 'Ian Hubert',
    cast: ['Derek de Lint', 'Sergio Hasselbaink'],
    isAuthorizedStream: true,
    licenseRights: 'CC-BY 3.0',
    quality: '4K UHD',
    audioTracks: ['5.1 Surround', 'Stereo'],
    subtitles: [{ code: 'en', label: 'English' }]
  },
  {
    id: '2',
    title: 'The Seoul Protocol',
    originalTitle: '서울 프로토콜',
    type: 'asian_drama',
    categories: ['trending', 'korean'],
    year: 2024,
    maturityRating: 'TV-MA',
    duration: '16 Episodes',
    genres: ['Korean Drama', 'Thriller', 'Crime'],
    country: 'South Korea',
    language: 'Korean',
    rating: 9.2,
    ratingCount: 28900,
    backdrop: '',
    poster: '',
    synopsis: 'Cybersecurity crisis in Seoul.',
    director: 'Park Chan-kyong',
    cast: ['Lee Jung-jae', 'Bae Doona'],
    isAuthorizedStream: true,
    licenseRights: 'Authorized Distribution',
    quality: '4K UHD',
    audioTracks: ['Korean Stereo'],
    subtitles: [{ code: 'en', label: 'English' }, { code: 'ko', label: 'Korean' }]
  },
  {
    id: '3',
    title: 'Carnival of Souls',
    originalTitle: 'Carnival of Souls',
    type: 'movie',
    categories: ['classics', 'horror'],
    year: 1962,
    maturityRating: 'PG',
    duration: '78m',
    genres: ['Horror', 'Mystery', 'Classic'],
    country: 'United States',
    language: 'English',
    rating: 8.1,
    ratingCount: 9400,
    backdrop: '',
    poster: '',
    synopsis: 'A classic phantom organist mystery.',
    director: 'Herk Harvey',
    cast: ['Candace Hilligoss'],
    isAuthorizedStream: true,
    licenseRights: 'Public Domain Master',
    quality: '1080p FHD',
    audioTracks: ['Mono'],
    subtitles: [{ code: 'en', label: 'English' }]
  }
];

const DEFAULT_OPTIONS: FilterOptions = {
  type: 'all',
  genre: 'all',
  yearBracket: 'all',
  country: 'all',
  language: 'all',
  minRating: 0,
  searchQuery: '',
  sortBy: 'popularity'
};

test('filterAndSortCatalog filters by media type', () => {
  const result = filterAndSortCatalog(SAMPLE_TITLES, {
    ...DEFAULT_OPTIONS,
    type: 'asian_drama'
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '2');
});

test('filterAndSortCatalog filters by genre case-insensitively', () => {
  const result = filterAndSortCatalog(SAMPLE_TITLES, {
    ...DEFAULT_OPTIONS,
    genre: 'sci-fi'
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '1');
});

test('filterAndSortCatalog filters by year bracket classics', () => {
  const result = filterAndSortCatalog(SAMPLE_TITLES, {
    ...DEFAULT_OPTIONS,
    yearBracket: 'classics'
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, '3');
});

test('filterAndSortCatalog searches across titles, directors, and original titles', () => {
  const byDirector = filterAndSortCatalog(SAMPLE_TITLES, {
    ...DEFAULT_OPTIONS,
    searchQuery: 'ian hubert'
  });
  assert.equal(byDirector.length, 1);
  assert.equal(byDirector[0].id, '1');

  const byOriginal = filterAndSortCatalog(SAMPLE_TITLES, {
    ...DEFAULT_OPTIONS,
    searchQuery: '서울'
  });
  assert.equal(byOriginal.length, 1);
  assert.equal(byOriginal[0].id, '2');
});

test('filterAndSortCatalog sorts by rating descending', () => {
  const result = filterAndSortCatalog(SAMPLE_TITLES, {
    ...DEFAULT_OPTIONS,
    sortBy: 'rating'
  });
  assert.equal(result[0].rating, 9.2);
  assert.equal(result[result.length - 1].rating, 8.1);
});

test('getUniqueGenres extracts unique genre list', () => {
  const genres = getUniqueGenres(SAMPLE_TITLES);
  assert.ok(genres.includes('Sci-Fi'));
  assert.ok(genres.includes('Korean Drama'));
  assert.ok(genres.includes('Horror'));
});

test('formatSeconds converts seconds to mm:ss and hh:mm:ss', () => {
  assert.equal(formatSeconds(75), '01:15');
  assert.equal(formatSeconds(3665), '1:01:05');
  assert.equal(formatSeconds(0), '00:00');
});

test('calculateProgressPercentage returns bounded percentage', () => {
  assert.equal(calculateProgressPercentage(50, 100), 50);
  assert.equal(calculateProgressPercentage(120, 100), 100);
  assert.equal(calculateProgressPercentage(0, 100), 0);
});
