import { create } from "zustand";
import type { ScoreSnapshot } from "../utils/music/analysis/models/ScoreSnapshot";

export interface FormalSection {
  id: string;
  label: string;
  startMeasure: number;
  endMeasure: number;
  startTick?: number;
  endTick?: number;
  startChordIndex?: number;
  endChordIndex?: number;
}

interface AnalysisIndexes {
  formalSections: FormalSection[];
}

interface ScoreSession {
  analysisVersion: string;
  analysisTimestamp: number;
  scoreSnapshot: ScoreSnapshot | null;
  indexes: AnalysisIndexes | null;
  cursorTick: number | null;
  loadScore: (snapshot: ScoreSnapshot) => void;
  updateCursor: (tick: number) => void;
  clearSession: () => void;
}

function buildMeasureBounds(snapshot: ScoreSnapshot) {
  const eventsByMeasure = new Map<number, { start: number; end: number }>();

  for (const event of [...(snapshot.notes || []), ...(snapshot.harmonies || [])]) {
    const measure = event.measure || 1;
    const current = eventsByMeasure.get(measure);
    eventsByMeasure.set(measure, {
      start: Math.min(current?.start ?? event.tickStart, event.tickStart),
      end: Math.max(current?.end ?? event.tickEnd, event.tickEnd)
    });
  }

  const measureNumbers = Array.from(eventsByMeasure.keys()).sort((a, b) => a - b);

  const getMeasureStartTick = (measure: number): number => {
    if (measure <= 1) return 0;
    return eventsByMeasure.get(measure)?.start
      ?? eventsByMeasure.get(measure - 1)?.end
      ?? (measure - 1) * 1920;
  };

  const getMeasureEndTick = (measure: number): number => {
    const nextMeasure = measureNumbers.find(item => item > measure);
    if (nextMeasure !== undefined) return getMeasureStartTick(nextMeasure);
    return eventsByMeasure.get(measure)?.end
      ?? getMeasureStartTick(measure + 1);
  };

  return { getMeasureStartTick, getMeasureEndTick };
}

function inferFormalSections(snapshot: ScoreSnapshot): FormalSection[] {
  const normalizedSections = snapshot.sections || [];
  const { getMeasureStartTick, getMeasureEndTick } = buildMeasureBounds(snapshot);

  const explicitSections = normalizedSections.map(section => ({
    id: section.id,
    label: section.label,
    startMeasure: section.startMeasure,
    endMeasure: section.endMeasure,
    startTick: section.startTick ?? getMeasureStartTick(section.startMeasure),
    endTick: section.endTick ?? getMeasureEndTick(section.endMeasure),
    startChordIndex: section.startChordIndex,
    endChordIndex: section.endChordIndex
  }));

  if (explicitSections.length > 0) {
    return explicitSections;
  }

  const inferredMeasures = snapshot.metadata?.measures
    || Math.max(0, ...(snapshot.notes || []).map(note => note.measure || 0), ...(snapshot.harmonies || []).map(chord => chord.measure || 0));

  if (inferredMeasures <= 0) {
    return [];
  }

  const sections: FormalSection[] = [];
  const labels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  let currentMeasure = 1;
  let partIndex = 1;

  while (currentMeasure <= inferredMeasures) {
    const endMeasure = Math.min(currentMeasure + 7, inferredMeasures);
    sections.push({
      id: `auto_sec_${partIndex}`,
      label: `Parte ${labels[(partIndex - 1) % labels.length]}`,
      startMeasure: currentMeasure,
      endMeasure,
      startTick: getMeasureStartTick(currentMeasure),
      endTick: getMeasureEndTick(endMeasure)
    });
    currentMeasure = endMeasure + 1;
    partIndex++;
  }

  return sections;
}

export const useScoreSessionStore = create<ScoreSession>((set) => ({
  analysisVersion: crypto.randomUUID(),
  analysisTimestamp: Date.now(),
  scoreSnapshot: null,
  indexes: null,
  cursorTick: null,

  loadScore: (snapshot) => {
    const normalizedSnapshot: ScoreSnapshot = {
      ...snapshot,
      harmonies: snapshot.harmonies || [],
      notes: snapshot.notes || [],
      sections: snapshot.sections || []
    };

    set({
      analysisVersion: crypto.randomUUID(),
      analysisTimestamp: Date.now(),
      scoreSnapshot: normalizedSnapshot,
      indexes: {
        formalSections: inferFormalSections(normalizedSnapshot)
      },
      cursorTick: null
    });
  },

  updateCursor: (tick) => {
    set({ cursorTick: tick });
  },

  clearSession: () => {
    set({
      analysisVersion: crypto.randomUUID(),
      analysisTimestamp: Date.now(),
      scoreSnapshot: null,
      indexes: null,
      cursorTick: null
    });
  }
}));
