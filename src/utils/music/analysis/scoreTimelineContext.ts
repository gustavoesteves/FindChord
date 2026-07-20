import type {
  ScoreKeyTimelineEntry,
  ScoreSnapshot,
  ScoreTimeTimelineEntry
} from "./models/ScoreSnapshot";

interface TimelineSectionLike {
  startMeasure?: number;
  startTick?: number;
}

export interface ScoreTimelineContext {
  tick: number;
  keySignature?: string;
  timeSignature?: string;
  keyTimelineEntry?: ScoreKeyTimelineEntry;
  timeTimelineEntry?: ScoreTimeTimelineEntry;
}

function lastEntryAtOrBeforeTick<T extends { tick: number }>(
  entries: T[] | undefined,
  tick: number
): T | undefined {
  if (!entries || entries.length === 0) return undefined;

  return entries
    .filter(entry => entry.tick <= tick)
    .sort((a, b) => b.tick - a.tick)[0] || entries
      .slice()
      .sort((a, b) => a.tick - b.tick)[0];
}

function normalizeMode(mode?: string): string | undefined {
  return mode?.trim().toLowerCase();
}

export function keySignatureForAnalysis(
  entry: ScoreKeyTimelineEntry | undefined,
  fallbackKeySignature?: string
): string | undefined {
  if (!entry?.keySignature) return fallbackKeySignature;

  const mode = normalizeMode(entry.mode);
  if (mode === "minor" && !/m$/i.test(entry.keySignature)) {
    return `${entry.keySignature}m`;
  }

  return entry.keySignature;
}

export function timelineContextAtTick(
  snapshot: ScoreSnapshot | null | undefined,
  tick = 0
): ScoreTimelineContext {
  const keyTimelineEntry = lastEntryAtOrBeforeTick(snapshot?.metadata?.keyTimeline, tick);
  const timeTimelineEntry = lastEntryAtOrBeforeTick(snapshot?.metadata?.timeTimeline, tick);

  return {
    tick,
    keySignature: keySignatureForAnalysis(keyTimelineEntry, snapshot?.metadata?.keySignature),
    timeSignature: timeTimelineEntry?.timeSignature || snapshot?.metadata?.timeSignature,
    keyTimelineEntry,
    timeTimelineEntry
  };
}

export function timelineContextForSection(
  snapshot: ScoreSnapshot | null | undefined,
  section: TimelineSectionLike | null | undefined
): ScoreTimelineContext {
  const tick = section?.startTick
    ?? snapshot?.metadata?.measureTicks?.find(measure => measure.measure === section?.startMeasure)?.startTick
    ?? 0;

  return timelineContextAtTick(snapshot, tick);
}
