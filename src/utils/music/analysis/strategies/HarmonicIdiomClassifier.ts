import { Note } from "tonal";
import { chordPitchClasses, chordRoot, resolveChordSymbol } from "../../theory/ChordSymbolResolver";

export type HarmonicIdiom =
  | "major-functional"
  | "minor-functional"
  | "modal"
  | "blues";

export type HarmonicIdiomConfidence = "strong" | "medium" | "weak";

export interface HarmonicIdiomClassification {
  idiom: HarmonicIdiom;
  confidence: HarmonicIdiomConfidence;
  evidence: string[];
}

function rootOf(chord: string): string | null {
  return chordRoot(chord);
}

function pitch(center: string, interval: string): string {
  return Note.pitchClass(Note.transpose(`${center}4`, interval)) || center;
}

function chromaticDistance(root: string | null, center: string): number | null {
  if (!root) return null;
  const rootChroma = Note.chroma(root);
  const centerChroma = Note.chroma(center);
  if (rootChroma === undefined || centerChroma === undefined) return null;
  return (rootChroma - centerChroma + 12) % 12;
}

function isMinorQuality(chord: string): boolean {
  return ["m", "m6", "m6_9", "m7", "m9", "m11", "mMaj7"].includes(resolveChordSymbol(chord).quality);
}

function isHalfDiminished(chord: string): boolean {
  return resolveChordSymbol(chord).quality === "m7b5";
}

function isDominantSeventh(chord: string): boolean {
  return [
    "7",
    "9",
    "11",
    "13",
    "7sus4",
    "9sus4",
    "13sus4",
    "7alt",
    "7_sharp5",
    "7_b5",
    "7_b9",
    "7_sharp9",
    "7_sharp11",
    "7_b13",
    "7_sharp9_b13"
  ].includes(resolveChordSymbol(chord).quality);
}

function containsPitchClass(chord: string, pitchClass: string): boolean {
  return chordPitchClasses(chord).includes(Note.pitchClass(pitchClass));
}

function isDiminishedQuality(chord: string): boolean {
  return ["dim", "dim7"].includes(resolveChordSymbol(chord).quality);
}

function hasResolution(from: string, to: string, fromDegree: number, toDegree: number, center: string): boolean {
  return chromaticDistance(rootOf(from), center) === fromDegree
    && chromaticDistance(rootOf(to), center) === toDegree;
}

function inferMinorFunctional(chords: string[], center: string): string[] {
  const evidence: string[] = [];
  const tonicMinor = chords.some(chord => (
    chromaticDistance(rootOf(chord), center) === 0 && isMinorQuality(chord)
  ));
  if (tonicMinor) evidence.push("centro aparece como acorde menor");

  const hasMinorCadence = chords.some((chord, index) => (
    isDominantSeventh(chord)
    && hasResolution(chord, chords[index + 1] || "", 7, 0, center)
    && isMinorQuality(chords[index + 1] || "")
  ));
  if (hasMinorCadence) evidence.push("dominante maior resolve em tônica menor");

  const hasHalfDiminishedPreparation = chords.some((chord, index) => (
    isHalfDiminished(chord)
    && chromaticDistance(rootOf(chord), center) === 2
    && isDominantSeventh(chords[index + 1] || "")
    && chromaticDistance(rootOf(chords[index + 1] || ""), center) === 7
  ));
  if (hasHalfDiminishedPreparation) evidence.push("ii meio-diminuto prepara dominante menor");

  const roots = chords.map(rootOf);
  const hasFlatSix = roots.some(root => root === pitch(center, "6m"));
  const hasFlatSeven = roots.some(root => root === pitch(center, "7m"));
  if (tonicMinor && hasFlatSix && hasFlatSeven) {
    evidence.push("menor natural aparece por bVI e bVII");
  } else if (tonicMinor && hasFlatSeven) {
    evidence.push("bVII preserva cor de menor natural");
  }

  const hasLeadingToneDiminished = chords.some(chord => (
    chromaticDistance(rootOf(chord), center) === 11 && isDiminishedQuality(chord)
  ));
  if (hasMinorCadence || hasLeadingToneDiminished) {
    evidence.push("sensível sustenta menor harmônico");
  }

  const raisedSixth = pitch(center, "6M");
  const hasMelodicMinorColor = tonicMinor && chords.some(chord => (
    chromaticDistance(rootOf(chord), center) === 9 || containsPitchClass(chord, raisedSixth)
  ));
  if (hasMelodicMinorColor) {
    evidence.push("sexta maior sugere cor de menor melódico");
  }

  return evidence;
}

function inferBlues(chords: string[], center: string): string[] {
  const evidence: string[] = [];
  const dominantOnTonic = chords.some(chord => (
    chromaticDistance(rootOf(chord), center) === 0 && isDominantSeventh(chord)
  ));
  const dominantOnFourth = chords.some(chord => (
    chromaticDistance(rootOf(chord), center) === 5 && isDominantSeventh(chord)
  ));
  const dominantOnFlatSeven = chords.some(chord => (
    chromaticDistance(rootOf(chord), center) === 10 && isDominantSeventh(chord)
  ));
  const recurringTonicDominant = chords.filter(chord => (
    chromaticDistance(rootOf(chord), center) === 0 && isDominantSeventh(chord)
  )).length >= 2;
  const recurringSusDominant = chords.filter(chord => (
    isDominantSeventh(chord) && resolveChordSymbol(chord).quality.includes("sus4")
  )).length >= 2;

  if (dominantOnTonic) evidence.push("I7 aparece como estabilidade local");
  if (dominantOnFourth) evidence.push("IV7 aparece como estabilidade local");
  if (dominantOnFlatSeven) evidence.push("bVII7 funciona como resposta dominante/modal");
  if (recurringTonicDominant) evidence.push("dominante de tônica é recorrente, não apenas preparação");
  if (recurringSusDominant) evidence.push("dominantes sus recorrentes sugerem vamp dominante");
  return evidence;
}

function inferModal(chords: string[], center: string): string[] {
  const evidence: string[] = [];
  const roots = chords.map(rootOf);
  const centerRecurs = roots.filter(root => root === Note.pitchClass(center)).length >= 2;
  const hasDominantCadence = chords.some((chord, index) => (
    isDominantSeventh(chord)
    && hasResolution(chord, chords[index + 1] || "", 7, 0, center)
  ));
  const hasFlatSeven = roots.some(root => root === pitch(center, "7m"));
  const hasFlatSix = roots.some(root => root === pitch(center, "6m"));
  const hasCharacteristicModalColor = hasFlatSeven || hasFlatSix;

  if (centerRecurs && !hasDominantCadence && hasCharacteristicModalColor) {
    evidence.push("centro recorrente com cor modal e sem cadência dominante");
  }
  if (hasFlatSeven) evidence.push("bVII sustenta cor modal");
  if (hasFlatSix) evidence.push("bVI sugere mistura modal ou modo paralelo");
  return evidence;
}

export function classifyHarmonicIdiom(
  chords: string[],
  center: string
): HarmonicIdiomClassification {
  const minorEvidence = inferMinorFunctional(chords, center);
  const hasFunctionalMinorSignal = minorEvidence.some(item => (
    item.startsWith("dominante maior")
    || item.startsWith("ii meio-diminuto")
    || item.startsWith("sensível")
    || item.startsWith("sexta maior")
  ));
  if (minorEvidence.length >= 2 && hasFunctionalMinorSignal) {
    return { idiom: "minor-functional", confidence: "strong", evidence: minorEvidence };
  }

  const bluesEvidence = inferBlues(chords, center);
  if (bluesEvidence.length >= 2) {
    return { idiom: "blues", confidence: "medium", evidence: bluesEvidence };
  }

  const modalEvidence = inferModal(chords, center);
  if (modalEvidence.some(item => item.startsWith("centro recorrente"))) {
    return { idiom: "modal", confidence: "medium", evidence: modalEvidence };
  }

  return {
    idiom: "major-functional",
    confidence: "weak",
    evidence: ["sem sinais fortes de menor, modal ou blues"]
  };
}
