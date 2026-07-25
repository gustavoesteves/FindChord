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
  keyContext?: ScoreTonalKeyContext;
  timeSignature?: string;
  keyTimelineEntry?: ScoreKeyTimelineEntry;
  timeTimelineEntry?: ScoreTimeTimelineEntry;
}

export interface ScoreTonalKeyContext {
  tonic: string;
  mode: "major" | "minor";
  declaredMode?: string;
  label: string;
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

function analysisModeForDeclaredMode(mode?: string): "major" | "minor" {
  const normalized = normalizeMode(mode);
  return normalized === "minor" || normalized === "menor" || normalized === "aeolian"
    ? "minor"
    : "major";
}

function labelForKeyContext(tonic: string, mode: "major" | "minor", declaredMode?: string): string {
  if (declaredMode && declaredMode !== mode) return `${tonic} ${declaredMode}`;
  return mode === "minor" ? `${tonic}m` : tonic;
}

export function keyContextFromSignature(keySignature?: string): ScoreTonalKeyContext | undefined {
  const normalized = keySignature?.trim();
  if (!normalized) return undefined;

  const modalMatch = normalized.match(/^([A-G](?:#|b)?)\s+(ionian|dorian|phrygian|lydian|mixolydian|aeolian|locrian)$/i);
  if (modalMatch) {
    const tonic = modalMatch[1];
    const declaredMode = modalMatch[2].toLowerCase();
    const mode = analysisModeForDeclaredMode(declaredMode);
    return {
      tonic,
      mode,
      declaredMode,
      label: labelForKeyContext(tonic, mode, declaredMode)
    };
  }

  const explicitMinor = /\b(?:minor|menor)\b/i.test(normalized);
  const explicitMajor = /\b(?:major|maior)\b/i.test(normalized);
  const compactMinor = !explicitMajor && /m$/i.test(normalized);
  const mode = explicitMinor || compactMinor ? "minor" : "major";
  const tonic = normalized
    .replace(/\b(?:major|minor|maior|menor)\b/gi, "")
    .replace(/m$/i, "")
    .trim();

  if (!/^[A-G](?:#|b)?$/.test(tonic)) return undefined;

  return {
    tonic,
    mode,
    label: labelForKeyContext(tonic, mode)
  };
}

export function keyContextForAnalysis(
  entry: ScoreKeyTimelineEntry | undefined,
  fallbackKeySignature?: string
): ScoreTonalKeyContext | undefined {
  if (!entry?.keySignature) return keyContextFromSignature(fallbackKeySignature);

  const declaredMode = normalizeMode(entry.mode);
  const mode = analysisModeForDeclaredMode(declaredMode);
  return {
    tonic: entry.keySignature,
    mode,
    declaredMode: declaredMode && declaredMode !== mode ? declaredMode : undefined,
    label: labelForKeyContext(entry.keySignature, mode, declaredMode)
  };
}

export function keySignatureForAnalysis(
  entry: ScoreKeyTimelineEntry | undefined,
  fallbackKeySignature?: string
): string | undefined {
  return keyContextForAnalysis(entry, fallbackKeySignature)?.label;
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
    keyContext: keyContextForAnalysis(keyTimelineEntry, snapshot?.metadata?.keySignature),
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
