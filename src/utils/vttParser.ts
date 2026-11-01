/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VttCue {
  id?: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

/**
 * Parses a WebVTT timestamp string (HH:MM:SS.mmm or MM:SS.mmm) into seconds.
 */
export function parseTimestamp(timestampStr: string): number {
  if (!timestampStr) return 0;
  const cleaned = timestampStr.trim().replace(',', '.');
  const parts = cleaned.split(':');
  
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  
  return parseFloat(cleaned) || 0;
}

/**
 * Strips HTML formatting tags (like <b>, <i>, <c.color>) from WebVTT cue text.
 */
export function stripVttTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim();
}

/**
 * Parses full WebVTT text into an array of structured VttCue objects.
 */
export function parseVtt(vttContent: string): VttCue[] {
  if (!vttContent) return [];

  const cues: VttCue[] = [];
  const normalized = vttContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('NOTE') && !l.startsWith('STYLE') && !l.startsWith('REGION'));

    if (lines.length === 0) continue;

    // Find the timing line containing "-->"
    let timingIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        timingIndex = i;
        break;
      }
    }

    if (timingIndex === -1) continue;

    const cueId = timingIndex > 0 ? lines[0] : undefined;
    const timingLine = lines[timingIndex];
    const [startRaw, endWithSettings] = timingLine.split('-->').map((s) => s.trim());
    
    if (!startRaw || !endWithSettings) continue;

    // Remove any trailing cue settings like line:0% position:50% align:center
    const endRaw = endWithSettings.split(/\s+/)[0];

    const startTime = parseTimestamp(startRaw);
    const endTime = parseTimestamp(endRaw);

    if (isNaN(startTime) || isNaN(endTime) || endTime < startTime) continue;

    const textLines = lines.slice(timingIndex + 1);
    const rawText = textLines.join('\n');
    const text = stripVttTags(rawText);

    if (text) {
      cues.push({
        id: cueId,
        startTime,
        endTime,
        text
      });
    }
  }

  // Sort cues chronologically by start time
  return cues.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Finds the active cue matching current playback time.
 */
export function findActiveCue(cues: VttCue[], currentTime: number): VttCue | null {
  if (!cues || cues.length === 0 || currentTime < 0) return null;
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (currentTime >= cue.startTime && currentTime <= cue.endTime) {
      return cue;
    }
  }
  return null;
}
