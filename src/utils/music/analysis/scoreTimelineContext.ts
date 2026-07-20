import type {
  ScoreKeyTimelineEntry,
  ScoreMeasureTickRange,
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

export function timelineContextForAnchors(
  snapshot: ScoreSnapshot | null | undefined,
  anchors: { startTick?: number }[]
): ScoreTimelineContext {
  return timelineContextAtTick(snapshot, anchors[0]?.startTick ?? 0);
}

export function measureNumberAtTick(
  measureTicks: ScoreMeasureTickRange[] | undefined,
  tick: number,
  fallbackTicksPerMeasure = 1920
): number {
  if (!measureTicks || measureTicks.length === 0) {
    return Math.floor(tick / fallbackTicksPerMeasure) + 1;
  }

  const ordered = [...measureTicks].sort((a, b) => a.startTick - b.startTick);
  const containing = ordered.find(measure => tick >= measure.startTick && tick < measure.endTick);
  if (containing) return containing.measure;

  const previous = ordered.filter(measure => measure.startTick <= tick).at(-1);
  if (previous) {
    if (tick >= previous.endTick) {
      const duration = Math.max(1, previous.endTick - previous.startTick);
      return previous.measure + Math.floor((tick - previous.endTick) / duration) + 1;
    }
    return previous.measure;
  }

  return ordered[0].measure;
}

export function measureTicksForMetricContext(
  snapshot: ScoreSnapshot | null | undefined
): ScoreMeasureTickRange[] | undefined {
  const measureTicks = snapshot?.metadata?.measureTicks;
  if (!measureTicks || measureTicks.length === 0) return undefined;

  const orderedTicks = [...measureTicks].sort((a, b) => a.startTick - b.startTick);
  const hasReliableMeasureMap = orderedTicks.every((measure, index) => {
    const duration = measure.endTick - measure.startTick;
    const previous = orderedTicks[index - 1];
    return Number.isFinite(measure.startTick)
      && Number.isFinite(measure.endTick)
      && duration >= 480
      && (!previous || measure.startTick >= previous.endTick);
  });

  return hasReliableMeasureMap ? measureTicks : undefined;
}
