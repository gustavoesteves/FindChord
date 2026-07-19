import { Note } from "tonal";
import type { ReharmonizationMeasure, ReharmonizationProposal } from "../models/ReharmonizationProposal";
import { chordPitchClasses, chordRoot, resolveChordSymbol } from "../../theory/ChordSymbolResolver";
import { diagnostic } from "../models/HarmonicDiagnostic";

function chordSymbol(chord: string): string {
  return chord.replace(/\/[A-G](?:#|b)?$/, "");
}

function explicitBass(chord: string): string | undefined {
  return chord.match(/\/([A-G](?:#|b)?)$/)?.[1];
}

function rootOfChord(chord: string): string {
  const symbol = chordSymbol(chord);
  return chordRoot(symbol) || symbol.match(/^[A-G](?:#|b)?/)?.[0] || symbol;
}

function bassOfChord(chord: string): string {
  const bass = explicitBass(chord);
  return bass ? Note.pitchClass(bass) || bass : rootOfChord(chord);
}

function chromaticDistance(from: string, to: string): number | null {
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;

  const ascending = (toChroma - fromChroma + 12) % 12;
  const descending = (fromChroma - toChroma + 12) % 12;
  return Math.min(ascending, descending);
}

function structuralBassCandidates(chord: string): string[] {
  const symbol = chordSymbol(chord);
  const resolved = resolveChordSymbol(symbol);
  if (!resolved.root) return [];
  if (resolved.quality === "dim7") return [];

  const root = Note.pitchClass(resolved.root);
  const allowedOffsets = new Set([3, 4, 6, 7, 8, 10, 11]);
  return chordPitchClasses(symbol, false)
    .map(note => Note.pitchClass(note))
    .filter((note): note is string => {
      if (!note || note === root) return false;
      const noteChroma = Note.chroma(note);
      const rootChroma = Note.chroma(root || "");
      if (noteChroma === undefined || rootChroma === undefined) return false;
      return allowedOffsets.has((noteChroma - rootChroma + 12) % 12);
    });
}

function bestInversionForContinuity(chord: string, previousBass: string): string {
  if (explicitBass(chord)) return chord;

  const root = Note.pitchClass(rootOfChord(chord));
  const previous = Note.pitchClass(previousBass);
  if (!root || !previous) return chord;

  const currentDistance = chromaticDistance(previous, root);
  if (currentDistance === null || currentDistance <= 2) return chord;

  const candidates = structuralBassCandidates(chord);

  const best = candidates
    .map(candidate => ({
      bass: candidate,
      distance: chromaticDistance(previous, candidate)
    }))
    .filter((candidate): candidate is { bass: string; distance: number } => (
      candidate.distance !== null && candidate.distance > 0
    ))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!best || best.distance > 2 || currentDistance - best.distance < 2) return chord;
  return `${chord}/${best.bass}`;
}

function flatChordLocations(measures: ReharmonizationMeasure[]): Array<{
  measureIndex: number;
  chordIndex: number;
  chord: string;
}> {
  return measures.flatMap(measure => measure.chords.map((chord, chordIndex) => ({
    measureIndex: measure.measureIndex,
    chordIndex,
    chord
  })));
}

function updateChord(
  measures: ReharmonizationMeasure[],
  measureIndex: number,
  chordIndex: number,
  chord: string
): ReharmonizationMeasure[] {
  return measures.map(measure => {
    if (measure.measureIndex !== measureIndex) return measure;
    return {
      ...measure,
      chords: measure.chords.map((item, index) => index === chordIndex ? chord : item)
    };
  });
}

export function suggestBassInversionsForVoiceLeading(
  proposal: ReharmonizationProposal
): ReharmonizationProposal {
  if (proposal.id === "controlled-reference-contour" || proposal.id === "controlled-reference-rhythm") {
    return proposal;
  }

  const locations = flatChordLocations(proposal.measures);
  if (locations.length < 3) return proposal;

  let measures = proposal.measures;
  let changed = false;
  let previousBass = bassOfChord(locations[0].chord);

  for (let index = 1; index < locations.length - 1; index++) {
    const location = locations[index];
    const suggested = bestInversionForContinuity(location.chord, previousBass);
    if (suggested !== location.chord) {
      measures = updateChord(measures, location.measureIndex, location.chordIndex, suggested);
      changed = true;
    }
    previousBass = bassOfChord(suggested);
  }

  if (!changed) return proposal;

  const bassLine = flatChordLocations(measures).map(location => bassOfChord(location.chord));
  const inversionDiagnostic = diagnostic(
    `proposal-${proposal.id}-bass-inversion-continuity`,
    "generation",
    "compatibility",
    "Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.",
    ["balanced", "exploratory"]
  );

  return {
    ...proposal,
    measures,
    bassLine,
    diagnostics: proposal.diagnostics?.some(item => item.id === inversionDiagnostic.id)
      ? proposal.diagnostics
      : [...(proposal.diagnostics || []), inversionDiagnostic],
    explanation: proposal.explanation.includes("Condução de vozes: usa inversão simples para suavizar o baixo")
      ? proposal.explanation
      : [...proposal.explanation, "Condução de vozes: usa inversão simples para suavizar o baixo"]
  };
}
