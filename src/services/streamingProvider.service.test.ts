/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyPlaybackRights,
  registerAuthorizedStream,
  getCustomRightsMap,
  AUTHORIZED_FULL_LENGTH_MASTERS
} from './streamingProvider.service.ts';
import { MediaTitle } from '../types/index.ts';

const baseTitle: MediaTitle = {
  id: 'test_commercial',
  title: 'Gladiator II',
  originalTitle: 'Gladiator II',
  type: 'movie',
  categories: ['trending'],
  year: 2024,
  maturityRating: 'R',
  duration: '148m',
  genres: ['Action', 'Drama'],
  country: 'United States',
  language: 'English',
  rating: 8.5,
  ratingCount: 15000,
  backdrop: 'https://example.com/backdrop.jpg',
  poster: 'https://example.com/poster.jpg',
  synopsis: 'A warrior seeks vengeance in ancient Rome.',
  director: 'Ridley Scott',
  cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington'],
  isAuthorizedStream: false,
  licenseRights: 'Commercial Rights Required',
  quality: '4K UHD',
  audioTracks: ['English Dolby Atmos'],
  subtitles: []
};

test('verifyPlaybackRights recognizes authorized CC-BY master tt001 with Arabic & English subtitles', () => {
  const result = verifyPlaybackRights({
    ...baseTitle,
    id: 'tt001',
    title: 'Tears of Steel'
  });

  assert.equal(result.hasAuthorizedStream, true);
  assert.equal(result.streamFormat, 'mp4');
  assert.match(result.streamUrl || '', /tears_of_steel_1080p\.mp4/);
  // Verify subtitles include both English and Arabic
  assert.ok(result.subtitles.some((s) => s.code === 'en'));
  assert.ok(result.subtitles.some((s) => s.code === 'ar' && s.direction === 'rtl'));
  assert.ok(!result.streamUrl?.includes('oceans.mp4'), 'Must not use oceans.mp4');
});

test('verifyPlaybackRights returns license required for commercial TMDB title without fake fallback', () => {
  const result = verifyPlaybackRights(baseTitle);

  assert.equal(result.hasAuthorizedStream, false);
  assert.equal(result.streamUrl, undefined);
  assert.equal(result.licenseType, 'Commercial Rights Required');
  assert.ok(result.disclaimer.includes('Gladiator II'));
  assert.equal(result.subtitles.length, 0, 'No fake subtitles for uningested commercial title');
});

test('verifyPlaybackRights associates Spider-Man with authorized stream and Arabic subtitles', () => {
  const spiderManTitle: MediaTitle = {
    ...baseTitle,
    id: 'tmdb_mv_634649',
    title: 'Spider-Man: No Way Home'
  };

  const result = verifyPlaybackRights(spiderManTitle);
  assert.equal(result.hasAuthorizedStream, true);
  assert.ok(result.streamUrl !== undefined);
  assert.ok(!result.streamUrl.includes('oceans.mp4'), 'Must not use oceans.mp4');
  const arSub = result.subtitles.find((s) => s.code === 'ar');
  assert.ok(arSub, 'Arabic subtitle must be available for Spider-Man');
  assert.equal(arSub.direction, 'rtl');
  const enSub = result.subtitles.find((s) => s.code === 'en');
  assert.ok(enSub, 'English subtitle must be available for Spider-Man');
});

test('verifyPlaybackRights detects registered custom HLS stream with subtitles', () => {
  registerAuthorizedStream(
    'custom_film_99',
    'https://example.com/stream/index.m3u8',
    'hls',
    'Authorized Licensed Stream',
    [
      { code: 'en', label: 'English', src: '/subtitles/tears-of-steel-en.vtt' },
      { code: 'ar', label: 'العربية', src: '/subtitles/tears-of-steel-ar.vtt', direction: 'rtl' }
    ]
  );

  const result = verifyPlaybackRights({
    ...baseTitle,
    id: 'custom_film_99'
  });

  assert.equal(result.hasAuthorizedStream, true);
  assert.equal(result.streamFormat, 'hls');
  assert.equal(result.streamUrl, 'https://example.com/stream/index.m3u8');
  assert.equal(result.subtitles.length, 2);
});

test('AUTHORIZED_FULL_LENGTH_MASTERS are long-form verified masters', () => {
  assert.ok(AUTHORIZED_FULL_LENGTH_MASTERS.tears_of_steel.streamUrl.includes('tears_of_steel'));
  assert.ok(AUTHORIZED_FULL_LENGTH_MASTERS.sintel.streamUrl.includes('sintel'));
  assert.ok(AUTHORIZED_FULL_LENGTH_MASTERS.adaptive_hls.streamUrl.includes('.m3u8'));
  // Verify none are oceans.mp4
  assert.ok(!AUTHORIZED_FULL_LENGTH_MASTERS.tears_of_steel.streamUrl.includes('oceans.mp4'));
  assert.ok(!AUTHORIZED_FULL_LENGTH_MASTERS.sintel.streamUrl.includes('oceans.mp4'));
  assert.ok(!AUTHORIZED_FULL_LENGTH_MASTERS.adaptive_hls.streamUrl.includes('oceans.mp4'));
});
