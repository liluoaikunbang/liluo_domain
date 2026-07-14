import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ffmpegPath = require('./audio-splitter-temp/node_modules/@ffmpeg-installer/ffmpeg').path;

const root = process.cwd();
const audioDir = path.join(root, 'src/assets/game/audio/sfx');
const originalInput = path.join(audioDir, '脚镣.mp3');
const renamedInput = path.join(audioDir, 'leg_shackle_source.mp3');
const output = path.join(audioDir, 'leg_shackle_1.mp3');

const silenceNoise = process.env.SILENCE_NOISE ?? '-35dB';
const silenceDuration = Number(process.env.SILENCE_DURATION ?? '0.12');
const padding = Number(process.env.PADDING ?? '0.03');
const minRegionDuration = Number(process.env.MIN_REGION_DURATION ?? '0.12');

if (existsSync(originalInput) && !existsSync(renamedInput)) {
  renameSync(originalInput, renamedInput);
}

if (!existsSync(renamedInput)) {
  throw new Error(`Input audio not found: ${renamedInput}`);
}

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

const duration = getDurationSeconds(renamedInput);
const regions = effectiveRegions(duration, detectSilences(renamedInput));
const firstRegion = regions[0];

if (!firstRegion) {
  throw new Error('No effective audio region detected.');
}

runFfmpeg([
  '-y',
  '-hide_banner',
  '-ss',
  firstRegion.start.toFixed(3),
  '-t',
  (firstRegion.end - firstRegion.start).toFixed(3),
  '-i',
  renamedInput,
  '-vn',
  '-codec:a',
  'libmp3lame',
  '-q:a',
  '2',
  output,
]);

console.log(`source: ${path.relative(root, renamedInput)}`);
console.log(
  `output: ${path.relative(root, output)} ${firstRegion.start.toFixed(3)}s +${(
    firstRegion.end - firstRegion.start
  ).toFixed(3)}s`,
);
console.log(`detected regions: ${regions.length}`);
