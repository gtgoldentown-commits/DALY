/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimestamp, stripVttTags, parseVtt, findActiveCue } from './vttParser.ts';

test('parseTimestamp parses HH:MM:SS.mmm and MM:SS.mmm accurately', () => {
  assert.equal(parseTimestamp('00:01:25.500'), 85.5);
  assert.equal(parseTimestamp('01:10.200'), 70.2);
  assert.equal(parseTimestamp('02:00:00.000'), 7200);
  assert.equal(parseTimestamp('00:00:00.000'), 0);
  // Handles comma decimal separator as in SRT/WebVTT variants
  assert.equal(parseTimestamp('00:01:15,250'), 75.25);
});

test('stripVttTags removes formatting tags and trims text', () => {
  assert.equal(stripVttTags('<b>Bold text</b>'), 'Bold text');
  assert.equal(stripVttTags('<i>Italic</i> and <c.yellow>colored</c>'), 'Italic and colored');
  assert.equal(stripVttTags('   Clean caption text   '), 'Clean caption text');
});

test('parseVtt parses standard WebVTT cue blocks', () => {
  const sampleVtt = `WEBVTT - Sample Presentation

00:00:02.000 --> 00:00:06.000
TEATRO Cinema Presentation

00:00:15.000 --> 00:00:20.000 line:80%
What are you doing here, Thom?

00:00:25.000 --> 00:00:30.000
<b>The timeline is resetting.</b>
`;

  const cues = parseVtt(sampleVtt);
  assert.equal(cues.length, 3);
  assert.equal(cues[0].startTime, 2);
  assert.equal(cues[0].endTime, 6);
  assert.equal(cues[0].text, 'TEATRO Cinema Presentation');

  assert.equal(cues[1].startTime, 15);
  assert.equal(cues[1].endTime, 20);
  assert.equal(cues[1].text, 'What are you doing here, Thom?');

  assert.equal(cues[2].startTime, 25);
  assert.equal(cues[2].endTime, 30);
  assert.equal(cues[2].text, 'The timeline is resetting.');
});

test('parseVtt handles Arabic RTL text correctly', () => {
  const arabicVtt = `WEBVTT - Arabic Sample

00:00:14.000 --> 00:00:19.000
ما الذي تفعله هنا يا توم؟

00:00:20.000 --> 00:00:26.000
محطة الذاكرة تبدأ بالمزامنة الآن.
`;

  const cues = parseVtt(arabicVtt);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].text, 'ما الذي تفعله هنا يا توم؟');
  assert.equal(cues[1].text, 'محطة الذاكرة تبدأ بالمزامنة الآن.');
});

test('findActiveCue returns matching cue based on current time', () => {
  const cues = [
    { startTime: 5, endTime: 10, text: 'Cue 1' },
    { startTime: 15, endTime: 25, text: 'Cue 2' }
  ];

  assert.equal(findActiveCue(cues, 2), null);
  assert.equal(findActiveCue(cues, 7)?.text, 'Cue 1');
  assert.equal(findActiveCue(cues, 12), null);
  assert.equal(findActiveCue(cues, 20)?.text, 'Cue 2');
  assert.equal(findActiveCue(cues, 30), null);
});
