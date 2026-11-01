import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTMDBItem, getActiveTmdbKey, TMDB_GENRES } from './tmdb.service.ts';

test('normalizeTMDBItem converts movie data accurately', () => {
  const rawMovie = {
    id: 550,
    title: 'Fight Club',
    original_title: 'Fight Club',
    overview: 'An insomniac office worker and a devil-may-care soap maker.',
    release_date: '1999-10-15',
    vote_average: 8.433,
    vote_count: 26000,
    genre_ids: [18, 53],
    backdrop_path: '/c6OLXfKAk5BKeR6broC8pYiCquX.jpg',
    poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    original_language: 'en',
    origin_country: ['US'],
    adult: false
  };

  const normalized = normalizeTMDBItem(rawMovie, 'movie');

  assert.equal(normalized.id, 'tmdb_mv_550');
  assert.equal(normalized.title, 'Fight Club');
  assert.equal(normalized.year, 1999);
  assert.equal(normalized.rating, 8.4);
  assert.equal(normalized.type, 'movie');
  assert.ok(normalized.genres.includes('Drama'));
  assert.ok(normalized.genres.includes('Thriller'));
  assert.ok(normalized.poster.includes('https://image.tmdb.org/t/p/w500'));
  assert.ok(normalized.backdrop.includes('https://image.tmdb.org/t/p/w1280'));
  assert.equal(normalized.isAuthorizedStream, false);
});

test('normalizeTMDBItem detects Korean drama category and original name', () => {
  const rawKDrama = {
    id: 68814,
    name: 'Strong Girl Bong-soon',
    original_name: '힘쎈여자 도봉순',
    overview: 'Born with supernatural strength.',
    first_air_date: '2017-02-24',
    vote_average: 8.3,
    vote_count: 550,
    genre_ids: [35, 18],
    origin_country: ['KR'],
    original_language: 'ko',
    adult: false
  };

  const normalized = normalizeTMDBItem(rawKDrama, 'tv');

  assert.equal(normalized.id, 'tmdb_tv_68814');
  assert.equal(normalized.title, 'Strong Girl Bong-soon');
  assert.equal(normalized.originalTitle, '힘쎈여자 도봉순');
  assert.equal(normalized.type, 'asian_drama');
  assert.equal(normalized.country, 'South Korea');
  assert.equal(normalized.year, 2017);
});

test('normalizeTMDBItem detects Japanese anime', () => {
  const rawAnime = {
    id: 65733,
    name: 'Doraemon',
    original_name: 'ドラえもん',
    first_air_date: '1979-04-02',
    genre_ids: [16, 35],
    origin_country: ['JP'],
    original_language: 'ja',
    vote_average: 8.1
  };

  const normalized = normalizeTMDBItem(rawAnime, 'tv');
  assert.equal(normalized.type, 'anime');
  assert.equal(normalized.country, 'Japan');
});

test('getActiveTmdbKey returns configured key', () => {
  const key = getActiveTmdbKey();
  assert.ok(key && key.length > 10);
});
