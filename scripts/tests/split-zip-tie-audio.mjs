import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ffmpegPath = require('./audio-splitter-temp/node_modules/@ffmpeg-installer/ffmpeg').path;

const root = process.cwd();
const input = path.join(root, 'src/assets/game/audio/sfx/收紧扎带.mp3');
const outputDir = path.dirname(input);
const outputBase = 'zip_tie_tighten';

const silenceNoise = process.env.SILENCE_NOISE ?? '-35dB';
const silenceDuration = Number(process.env.SILENCE_DURATION ?? '0.12');
const padding = Number(process.env.PADDING ?? '0.03');
const minRegionDuration = Number(process.env.MIN_REGION_DURATION ?? '0.15');

if (!existsSync(input)) {
  throw new Error(`Input audio not found: ${input}`);
}

mkdirSync(outputDir, { recursive: true });

function runFfmpeg(args) {
  const result = spawnSync(ffmpegPath, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.status !== 0) {
    throw new Error(`${result.stderr || result.stdout}`);
  }

  return result;
}

function getDurationSeconds(file) {
  const result = runFfmpeg(['-i', file, '-f', 'null', '-']);
  const match = result.stderr.match(/Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error('Could not read audio duration from ffmpeg output.');
  }
  const [, hours, minutes, seconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function detectSilences(file) {
  const result = runFfmpeg([
    '-hide_banner',
    '-i',
    file,
    '-af',
    `silencedetect=noise=${silenceNoise}:d=${silenceDuration}`,
    '-f',
    'null',
    '-',
  ]);

  const events = [];
  for (const line of result.stderr.split(/\r?\n/)) {
    const start = line.match(/silence_start:\s*([0-9.]+)/);
    if (start) {
      events.push({ type: 'start', time: Number(start[1]) });
      continue;
    }

    const end = line.match(/silence_end:\s*([0-9.]+)/);
    if (end) {
      events.push({ type: 'end', time: Number(end[1]) });
    }
  }

  return events;
}

function effectiveRegions(duration, silenceEvents) {
  const silences = [];
  let currentStart = null;

  for (const event of silenceEvents) {
    if (event.type === 'start') {
      currentStart = event.time;
    } else if (event.type === 'end' && currentStart !== null) {
      silences.push({ start: currentStart, end: event.time });
      currentStart = null;
    }
  }

  if (currentStart !== null) {
    silences.push({ start: currentStart, end: duration });
  }

  const regions = [];
  let cursor = 0;
  for (const silence of silences) {
    if (silence.start > cursor) {
      regions.push({ start: cursor, end: silence.start });
    }
    cursor = Math.max(cursor, silence.end);
  }

  if (duration > cursor) {
    regions.push({ start: cursor, end: duration });
  }

  return regions
    .map((region) => ({
      start: Math.max(0, region.start - padding),
      end: Math.min(duration, region.end + padding),
    }))
    .filter((region) => region.end - region.start >= minRegionDuration);
}

const duration = getDurationSeconds(input);
const silences = detectSilences(input);
const regions = effectiveRegions(duration, silences);

if (regions.length !== 4) {
  console.log(JSON.stringify({ duration, silences, regions }, null, 2));
  throw new Error(
    `Expected 4 effective audio regions, detected ${regions.length}. ` +
      'Adjust SILENCE_NOISE or SILENCE_DURATION and rerun.',
  );
}

regions.forEach((region, index) => {
  const output = path.join(outputDir, `${outputBase}_${index + 1}.mp3`);
  const start = region.start.toFixed(3);
  const length = (region.end - region.start).toFixed(3);

  runFfmpeg([
    '-y',
    '-hide_banner',
    '-ss',
    start,
    '-t',
    length,
    '-i',
    input,
    '-vn',
    '-codec:a',
    'libmp3lame',
    '-q:a',
    '2',
    output,
  ]);

  console.log(`${path.relative(root, output)} ${start}s +${length}s`);
});
