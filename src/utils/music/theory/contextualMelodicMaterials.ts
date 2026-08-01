import { Note } from "tonal";
import type { ChordQuality } from "../constants/chordRegistry";
import { chordPitchClasses, resolveChordSymbol } from "./ChordSymbolResolver";
import { simplifyNote } from "../core/pitch";
import type { MaterialSourceMap } from "./musicTheory";
import type {
  ContextualHarmonicFunction,
  ContextualMelodicMaterial
} from "./contextualMaterialTypes";
import { contextualMelodicMaterialId } from "./melodicCellMaterialAdapter";
import { stableMelodicCellToken } from "../models/MelodicCell";

function rootsEqual(left: string | undefined, right: string | undefined): boolean {
  return !!left && !!right && Note.pitchClass(left) === Note.pitchClass(right);
}

function chordRoot(symbol: string | undefined): string | undefined {
  if (!symbol) return undefined;
  return resolveChordSymbol(symbol, "plain").root || undefined;
}

function transposePitchClass(root: string, interval: string): string | null {
  const transposed = Note.transpose(root, interval);
  return Note.pitchClass(transposed) || null;
}

function noteFromScaleByChroma(scale: MaterialSourceMap, note: string | null): string | null {
  if (!note) return null;
  const chroma = Note.chroma(note);
  if (chroma === undefined) return null;
  return scale.notes.find(scaleNote => Note.chroma(scaleNote) === chroma) || Note.pitchClass(note) || null;
}

function displayNote(note: string | null): string | null {
  return note ? simplifyNote(note) : null;
}

function withPreferredCellId(material: ContextualMelodicMaterial): ContextualMelodicMaterial {
  if (material.preferredCellId || material.preferredCellIndex === undefined) return material;
  const preferredNotation = material.cells[material.preferredCellIndex];
  if (!preferredNotation) return material;
  return {
    ...material,
    preferredCellId: `${contextualMelodicMaterialId(material)}:${stableMelodicCellToken(preferredNotation)}`
  };
}

function majorSharpTwoCellFromScale(root: string, scale: MaterialSourceMap): string[] {
  return [
    Note.pitchClass(root),
    transposePitchClass(root, "3m"),
    noteFromScaleByChroma(scale, transposePitchClass(root, "3M")),
    transposePitchClass(root, "5P")
  ].filter((note): note is string => !!note);
}

function halfWholeDiminishedMaterials(
  scale: MaterialSourceMap,
  root: string,
  resolutionTarget: string | undefined
): ContextualMelodicMaterial[] {
  if (scale.type !== "half-whole diminished") return [];
  const diminishedRoots = [
    root,
    transposePitchClass(root, "3m"),
    transposePitchClass(root, "5d"),
    transposePitchClass(root, "6M")
  ].filter((note): note is string => !!note);
  const cells = diminishedRoots
    .map(cellRoot => majorSharpTwoCellFromScale(cellRoot, scale))
    .filter(cell => cell.length === 4)
    .map(cell => cell.join("-"));
  if (cells.length === 0) return [];

  const targetRoot = displayNote(hasRealResolutionTarget(root, resolutionTarget) ? resolutionTarget || null : null);

  return [{
    label: "Arpejos diminutos H/W",
    source: "arpeggio",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["b9", "#9", "#11", "13"],
    resolutionTargets: targetRoot ? [targetRoot] : [],
    practiceHint: targetRoot
      ? `Use as celulas 1-#2-3-5 por tercas menores e resolva em ${targetRoot}.`
      : "Use as celulas 1-#2-3-5 por tercas menores como vocabulario de dominante diminuta."
  }];
}

function targetThirdFor(nextChord: string | undefined, resolutionTarget: string | undefined): string | null {
  if (!resolutionTarget) return null;
  const resolved = nextChord ? resolveChordSymbol(nextChord, "plain") : null;
  const isMinorTarget = !!resolved && ["m", "m6", "m6_9", "m7", "m9", "m11", "m13", "mMaj7"].includes(resolved.quality);
  return transposePitchClass(resolutionTarget, isMinorTarget ? "3m" : "3M");
}

function directedSemitones(from: string | undefined, to: string | undefined): number | null {
  if (!from || !to) return null;
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;
  return (toChroma - fromChroma + 12) % 12;
}

const EXPLICIT_ALTERED_DOMINANT_QUALITIES = new Set<ChordQuality>([
  "dominant7b5",
  "dominant7b9",
  "dominant7#9",
  "dominant7#11",
  "dominant7b13"
]);

const NATURAL_DOMINANT_QUALITIES = new Set<ChordQuality>([
  "dominant7th",
  "dominant9th",
  "dominant11th",
  "dominant13th"
]);

const LOCAL_DOMINANT_COLOR_QUALITIES = new Set<ChordQuality>([
  ...NATURAL_DOMINANT_QUALITIES,
  ...EXPLICIT_ALTERED_DOMINANT_QUALITIES,
  "dominant7sus4"
]);

const FUNCTIONAL_DOMINANT_QUALITIES = new Set([
  "7",
  "9",
  "11",
  "13",
  "7sus4",
  "9sus4",
  "13sus4",
  "7_b5",
  "7_b9",
  "7_sharp9",
  "7_sharp11",
  "7_b13",
  "7alt"
]);

function hasRealResolutionTarget(root: string, resolutionTarget: string | undefined): boolean {
  return !!resolutionTarget && !rootsEqual(root, resolutionTarget);
}

function resolutionCell(from: string | null, to: string | null): string {
  if (!from || !to || rootsEqual(from, to)) return "";
  return `${from}->${to}`;
}

function alteredDominantMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality,
  resolutionTarget: string | undefined,
  nextChord: string | undefined
): ContextualMelodicMaterial[] {
  if (scale.type !== "altered" || !EXPLICIT_ALTERED_DOMINANT_QUALITIES.has(quality)) return [];
  const flatNine = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2m")));
  const sharpNine = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2A")));
  const third = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "3M")));
  const sharpEleven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "4A")));
  const flatThirteen = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6m")));
  const flatSeven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "7m")));
  const hasResolution = hasRealResolutionTarget(root, resolutionTarget);
  const targetRoot = displayNote(hasResolution ? resolutionTarget || null : null);
  const targetThird = displayNote(hasResolution ? targetThirdFor(nextChord, resolutionTarget) : null);
  const cells = [
    [flatNine, sharpNine, third].filter(Boolean).join("-"),
    [sharpEleven, flatThirteen, flatSeven].filter(Boolean).join("-"),
    resolutionCell(third, targetRoot),
    resolutionCell(flatSeven, targetThird)
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "Células da escala alterada",
    source: "chromatic-approach",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["b9", "#9", "#11", "b13"],
    resolutionTargets: targetRoot ? [targetRoot] : [],
    practiceHint: targetRoot
      ? `Use as tensoes alteradas como aproximacao cromatica e resolva em ${targetRoot}.`
      : "Use as tensoes alteradas como cor dominante, cuidando da resolucao."
  }];
}

function localOptionalAlteredDominantMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality
): ContextualMelodicMaterial[] {
  if (scale.type !== "altered" || !NATURAL_DOMINANT_QUALITIES.has(quality)) return [];
  const flatNine = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2m")));
  const sharpNine = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2A")));
  const third = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "3M")));
  const sharpEleven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "4A")));
  const flatThirteen = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6m")));
  const flatSeven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "7m")));
  const rootNote = displayNote(root);
  const fifth = displayNote(transposePitchClass(root, "5P"));
  const cells = [
    [flatNine, sharpNine, third].filter(Boolean).join("-"),
    [sharpEleven, flatThirteen, flatSeven].filter(Boolean).join("-"),
    resolutionCell(flatNine, rootNote),
    resolutionCell(flatThirteen, fifth)
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "alterada opcional / tensão local",
    source: "chromatic-approach",
    sourceScale: scale.name,
    cells,
    preferredCellIndex: 0,
    tensionProfile: ["b9", "#9", "#11", "b13", "b7"],
    resolutionTargets: [],
    practiceHint: "Use como tensao breve sobre dominante natural e retorne para 3, 5 ou b7; nao trate como resolucao obrigatoria."
  }];
}

function naturalDominantMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality,
  resolutionTarget: string | undefined,
  nextChord: string | undefined
): ContextualMelodicMaterial[] {
  if (!["mixolydian", "bebop dominant"].includes(scale.type) || !NATURAL_DOMINANT_QUALITIES.has(quality)) return [];
  const arpeggio = [
    displayNote(root),
    displayNote(transposePitchClass(root, "3M")),
    displayNote(transposePitchClass(root, "5P")),
    displayNote(transposePitchClass(root, "7m"))
  ].filter(Boolean).join("-");
  const flatSeven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "7m")));
  const chromaticSeven = scale.type === "bebop dominant"
    ? displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "7M")))
    : null;
  const tonic = displayNote(root);
  const hasResolution = hasRealResolutionTarget(root, resolutionTarget);
  const third = displayNote(transposePitchClass(root, "3M"));
  const targetRoot = displayNote(hasResolution ? resolutionTarget || null : null);
  const targetThird = displayNote(hasResolution ? targetThirdFor(nextChord, resolutionTarget) : null);
  const cells = [
    arpeggio,
    flatSeven && chromaticSeven && tonic ? `${flatSeven}-${chromaticSeven}-${tonic}` : "",
    resolutionCell(third, targetRoot),
    resolutionCell(flatSeven, targetThird)
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: scale.type === "bebop dominant" ? "dominante bebop / notas-guia" : "dominante natural / notas-guia",
    source: scale.type === "bebop dominant" ? "chromatic-approach" : "guide-tones",
    sourceScale: scale.name,
    cells,
    tensionProfile: scale.type === "bebop dominant" ? ["3", "5", "b7", "7 cromática"] : ["3", "5", "b7", "9", "13"],
    resolutionTargets: targetRoot ? [targetRoot] : [],
    practiceHint: targetRoot
      ? `Use o arpejo dominante e conduza 3 e b7 para ${targetRoot}.`
      : "Use o arpejo dominante e as notas-guia como material interno antes de buscar tensoes externas."
  }];
}

function relatedTwoMinorDominantMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality
): ContextualMelodicMaterial[] {
  if (scale.type !== "mixolydian" || !NATURAL_DOMINANT_QUALITIES.has(quality)) return [];
  const relatedTwoRoot = displayNote(transposePitchClass(root, "5P"));
  const minorThird = displayNote(relatedTwoRoot ? transposePitchClass(relatedTwoRoot, "3m") : null);
  const fifth = displayNote(relatedTwoRoot ? transposePitchClass(relatedTwoRoot, "5P") : null);
  const flatSeven = displayNote(relatedTwoRoot ? transposePitchClass(relatedTwoRoot, "7m") : null);
  const ninth = displayNote(relatedTwoRoot ? transposePitchClass(relatedTwoRoot, "2M") : null);
  const minorArpeggio = [
    relatedTwoRoot,
    minorThird,
    fifth,
    flatSeven
  ].filter(Boolean).join("-");
  const minorPentatonicCell = [
    relatedTwoRoot,
    minorThird,
    displayNote(relatedTwoRoot ? transposePitchClass(relatedTwoRoot, "4P") : null),
    fifth,
    flatSeven
  ].filter(Boolean).join("-");
  const upperColorCell = [
    minorThird,
    fifth,
    flatSeven,
    ninth
  ].filter(Boolean).join("-");
  const cells = [
    minorArpeggio,
    minorPentatonicCell,
    upperColorCell
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "ii menor sobre dominante",
    source: "arpeggio",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["5", "b7", "9", "11", "13"],
    resolutionTargets: [],
    practiceHint: relatedTwoRoot
      ? `Use linguagem de ${relatedTwoRoot}m para colorir o dominante sem sair do centro.`
      : "Use linguagem do ii menor relacionado para colorir o dominante sem sair do centro."
  }];
}

function resolvesAsSubV(root: string, resolutionTarget: string | undefined): boolean {
  if (!resolutionTarget) return false;
  const rootChroma = Note.chroma(root);
  const targetChroma = Note.chroma(resolutionTarget);
  if (rootChroma === undefined || targetChroma === undefined) return false;
  return (rootChroma - targetChroma + 12) % 12 === 1;
}

function lydianDominantSubVMaterials(
  scale: MaterialSourceMap,
  root: string,
  resolutionTarget: string | undefined,
  nextChord: string | undefined
): ContextualMelodicMaterial[] {
  if (scale.type !== "lydian dominant" || !resolvesAsSubV(root, resolutionTarget)) return [];
  const sharpEleven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "4A")));
  const third = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "3M")));
  const flatSeven = transposePitchClass(root, "7m");
  const targetRoot = displayNote(resolutionTarget || null);
  const targetThird = displayNote(targetThirdFor(nextChord, resolutionTarget));
  const cells = [
    [displayNote(root), sharpEleven, flatSeven].filter(Boolean).join("-"),
    targetRoot ? `${displayNote(root)}->${targetRoot}` : "",
    third && targetThird ? `${third}->${targetThird}` : "",
    flatSeven && targetRoot ? `${flatSeven}->${targetRoot}` : ""
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "SubV lídio dominante",
    source: "chromatic-approach",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["#11", "9", "13"],
    resolutionTargets: resolutionTarget ? [resolutionTarget] : [],
    practiceHint: resolutionTarget
      ? `Use #11 como cor do SubV e resolva cromaticamente em ${resolutionTarget}.`
      : "Use #11 como cor do SubV e mantenha a resolucao cromatica."
  }];
}

function halfDiminishedMinorPreparationMaterials(
  scale: MaterialSourceMap,
  root: string,
  nextChord: string | undefined
): ContextualMelodicMaterial[] {
  if (scale.type !== "locrian #2") return [];
  const resolvedNextChord = nextChord ? resolveChordSymbol(nextChord, "plain") : null;
  const dominantRoot = displayNote(resolvedNextChord?.root || null);
  const hasExplicitNextChord = !!nextChord;
  const preparesRelatedDominant = !!resolvedNextChord
    && !!dominantRoot
    && FUNCTIONAL_DOMINANT_QUALITIES.has(resolvedNextChord.quality)
    && directedSemitones(root, dominantRoot) === 5;
  if (hasExplicitNextChord && !preparesRelatedDominant) return [];

  const arpeggio = [
    displayNote(root),
    displayNote(transposePitchClass(root, "3m")),
    displayNote(transposePitchClass(root, "5d")),
    displayNote(transposePitchClass(root, "7m"))
  ].filter(Boolean).join("-");
  const naturalNine = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M")));
  const flatSeven = displayNote(transposePitchClass(root, "7m"));
  const minorThird = displayNote(transposePitchClass(root, "3m"));
  const dominantThird = displayNote(dominantRoot ? transposePitchClass(dominantRoot, "3M") : null);
  const dominantFlatThirteen = displayNote(dominantRoot ? transposePitchClass(dominantRoot, "6m") : null);
  const cells = [
    arpeggio,
    naturalNine && arpeggio ? `${naturalNine}-${minorThird}-${root}` : "",
    flatSeven && dominantThird ? `${flatSeven}->${dominantThird}` : "",
    minorThird && dominantFlatThirteen ? `${minorThird}->${dominantFlatThirteen}` : ""
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "iiø lócrio #2",
    source: "arpeggio",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["9", "b5", "b7"],
    resolutionTargets: dominantRoot ? [dominantRoot] : [],
    practiceHint: dominantRoot
      ? `Use o arpejo meio-diminuto com 9 natural e conduza para ${dominantRoot}.`
      : "Use o arpejo meio-diminuto com 9 natural como preparacao menor."
  }];
}

function semitoneResolutionsToChord(note: string, targetChord: string | undefined): string[] {
  if (!targetChord) return [];
  const targetNotes = chordPitchClasses(targetChord);
  const noteChroma = Note.chroma(note);
  if (noteChroma === undefined) return [];
  return targetNotes
    .filter(target => {
      const targetChroma = Note.chroma(target);
      if (targetChroma === undefined) return false;
      const distance = Math.min((targetChroma - noteChroma + 12) % 12, (noteChroma - targetChroma + 12) % 12);
      return distance === 1;
    })
    .map(target => `${note}->${target}`);
}

function resolvedDiminishedMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality,
  nextChord: string | undefined
): ContextualMelodicMaterial[] {
  if (
    scale.type !== "whole-half diminished"
    || !["diminished", "diminished7th"].includes(quality)
  ) return [];

  const diminishedTriadNotes = [
    displayNote(root),
    displayNote(transposePitchClass(root, "3m")),
    displayNote(transposePitchClass(root, "5d"))
  ].filter((note): note is string => !!note);
  const optionalDiminishedSeventh = displayNote(transposePitchClass(root, "6M"));
  const completeDiminishedNotes = [
    ...diminishedTriadNotes,
    optionalDiminishedSeventh
  ].filter((note): note is string => !!note);
  const targetRoot = displayNote(chordRoot(nextChord) || null);

  if (diminishedTriadNotes.length === 0) return [];

  if (quality === "diminished") {
    const triadResolutions = diminishedTriadNotes.flatMap(note => (
      semitoneResolutionsToChord(note, nextChord)
    ));
    const triadMaterial: ContextualMelodicMaterial = {
      label: "Tríade diminuta / núcleo",
      source: "arpeggio",
      sourceScale: scale.name,
      cells: [diminishedTriadNotes.join("-"), ...triadResolutions],
      tensionProfile: ["b3", "b5", "resolução por semitom"],
      resolutionTargets: targetRoot ? [targetRoot] : [],
      practiceHint: targetRoot
        ? `Afirme a tríade diminuta e resolva suas notas por semitom em ${targetRoot}.`
        : "Afirme 1-b3-b5; a sétima diminuta não pertence à tríade escrita."
    };

    if (!optionalDiminishedSeventh) return [triadMaterial];

    const optionalResolution = semitoneResolutionsToChord(
      optionalDiminishedSeventh,
      nextChord
    );
    return [
      triadMaterial,
      {
        label: "Extensão dim7 opcional",
        source: "arpeggio",
        sourceScale: scale.name,
        cells: [completeDiminishedNotes.join("-"), ...optionalResolution],
        tensionProfile: ["bb7 opcional", "simetria por terças menores"],
        resolutionTargets: targetRoot ? [targetRoot] : [],
        practiceHint: `Acrescente ${optionalDiminishedSeventh} como bb7 apenas para transformar a tríade em tensão dim7 opcional.`
      }
    ];
  }

  const resolutions = completeDiminishedNotes.flatMap(note => (
    semitoneResolutionsToChord(note, nextChord)
  ));
  const cells = [completeDiminishedNotes.join("-"), ...resolutions];

  return [{
    label: "Diminuto resolvido",
    source: "arpeggio",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["dim7", "simetria", "resolução por semitom"],
    resolutionTargets: targetRoot ? [targetRoot] : [],
    practiceHint: targetRoot
      ? `Use o arpejo diminuto completo e resolva por semitom em ${targetRoot}.`
      : "Use o arpejo diminuto completo como material simetrico; procure resolucao por semitom."
  }];
}

function modalMinorMaterials(scale: MaterialSourceMap, root: string): ContextualMelodicMaterial[] {
  if (scale.type !== "dorian") return [];
  const arpeggio = [
    displayNote(root),
    displayNote(transposePitchClass(root, "3m")),
    displayNote(transposePitchClass(root, "5P")),
    displayNote(transposePitchClass(root, "7m"))
  ].filter(Boolean).join("-");
  const sixthCell = [
    displayNote(root),
    displayNote(transposePitchClass(root, "3m")),
    displayNote(transposePitchClass(root, "5P")),
    displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6M")))
  ].filter(Boolean).join("-");
  const naturalNine = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M")));
  const minorThird = displayNote(transposePitchClass(root, "3m"));
  const cells = [
    arpeggio,
    sixthCell,
    naturalNine && minorThird ? `${naturalNine}-${minorThird}-${displayNote(root)}` : ""
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "m7 dórico / 6",
    source: "arpeggio",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["9", "11", "13"],
    resolutionTargets: [],
    practiceHint: "Use o arpejo menor com 7 e destaque a 6 maior para abrir a cor dorica sem perder o acorde."
  }];
}

function majorLydianMaterials(scale: MaterialSourceMap, root: string): ContextualMelodicMaterial[] {
  if (scale.type !== "lydian") return [];
  const arpeggio = [
    displayNote(root),
    displayNote(transposePitchClass(root, "3M")),
    displayNote(transposePitchClass(root, "5P")),
    displayNote(transposePitchClass(root, "7M"))
  ].filter(Boolean).join("-");
  const secondDegreeTriadRoot = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M")));
  const sharpEleven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "4A")));
  const fifth = displayNote(transposePitchClass(root, "5P"));
  const upperTriad = [
    secondDegreeTriadRoot,
    sharpEleven,
    displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6M")))
  ].filter(Boolean).join("-");
  const cells = [
    arpeggio,
    upperTriad,
    sharpEleven && fifth ? `${sharpEleven}->${fifth}` : ""
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "maj7 lídio / tríade do II",
    source: "arpeggio",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["9", "#11", "13"],
    resolutionTargets: [],
    practiceHint: "Use a triade do II grau para colorir o maj7 com #11 mantendo repouso luminoso."
  }];
}

function suspendedDominantMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality,
  nextChord: string | undefined
): ContextualMelodicMaterial[] {
  if (scale.type !== "mixolydian" || !["sus4", "sus2", "dominant7sus4"].includes(quality)) return [];
  const suspendedCell = [
    displayNote(root),
    displayNote(transposePitchClass(root, "4P")),
    displayNote(transposePitchClass(root, "5P")),
    displayNote(transposePitchClass(root, "7m"))
  ].filter(Boolean).join("-");
  const pentatonicCell = [
    displayNote(transposePitchClass(root, "2M")),
    displayNote(transposePitchClass(root, "4P")),
    displayNote(transposePitchClass(root, "5P")),
    displayNote(root)
  ].filter(Boolean).join("-");
  const fourth = displayNote(transposePitchClass(root, "4P"));
  const nextRoot = chordRoot(nextChord);
  const nextThird = displayNote(nextRoot && rootsEqual(nextRoot, root) ? transposePitchClass(root, "3M") : null);
  const cells = [
    suspendedCell,
    pentatonicCell,
    fourth && nextThird ? `${fourth}->${nextThird}` : ""
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "dominante sus / pentatônica",
    source: "pentatonic",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["4", "9", "13", "b7"],
    resolutionTargets: nextThird ? [nextThird] : [],
    practiceHint: nextThird
      ? `Sustente a quarta como suspensao e resolva em ${nextThird} quando o acorde abrir para dominante.`
      : "Sustente a quarta como cor principal e use a pentatonica do sus para manter a sonoridade aberta."
  }];
}

function wholeToneAugmentedMaterials(scale: MaterialSourceMap, root: string, quality: ChordQuality): ContextualMelodicMaterial[] {
  if (scale.type !== "whole tone" || quality !== "augmented") return [];
  const augmentedArpeggio = [
    displayNote(root),
    displayNote(transposePitchClass(root, "3M")),
    displayNote(transposePitchClass(root, "5A"))
  ].filter(Boolean).join("-");
  const wholeToneCell = [
    displayNote(root),
    displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M"))),
    displayNote(transposePitchClass(root, "3M")),
    displayNote(transposePitchClass(root, "5A"))
  ].filter(Boolean).join("-");
  const cells = [augmentedArpeggio, wholeToneCell].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "tons inteiros / aumentado",
    source: "arpeggio",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["3", "#5", "9", "#11"],
    resolutionTargets: [],
    practiceHint: "Use o arpejo aumentado e a celula de tons inteiros como cor simetrica; resolva pela melodia ou pelo proximo acorde."
  }];
}

function minorMajorMaterials(scale: MaterialSourceMap, root: string, quality: ChordQuality): ContextualMelodicMaterial[] {
  if (!["melodic minor", "harmonic minor"].includes(scale.type) || quality !== "minorMajor7th") return [];
  const arpeggio = [
    displayNote(root),
    displayNote(transposePitchClass(root, "3m")),
    displayNote(transposePitchClass(root, "5P")),
    displayNote(transposePitchClass(root, "7M"))
  ].filter(Boolean).join("-");
  const sixth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, scale.type === "melodic minor" ? "6M" : "6m")));
  const leadingTone = displayNote(transposePitchClass(root, "7M"));
  const tonic = displayNote(root);
  const cells = [
    arpeggio,
    sixth && leadingTone && tonic ? `${sixth}-${leadingTone}-${tonic}` : ""
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: scale.type === "melodic minor" ? "menor-maior melódica" : "menor-maior harmônica",
    source: "arpeggio",
    sourceScale: scale.name,
    cells,
    tensionProfile: scale.type === "melodic minor" ? ["6", "7M", "9"] : ["b6", "7M"],
    resolutionTargets: [],
    practiceHint: "Use a setima maior como sensivel interna do acorde menor, sem tratar o acorde como dominante."
  }];
}

function majorAddNineMaterials(scale: MaterialSourceMap, root: string, quality: ChordQuality): ContextualMelodicMaterial[] {
  if (!["major", "major pentatonic"].includes(scale.type) || quality !== "add9") return [];
  const addNineCell = [
    displayNote(root),
    displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M"))),
    displayNote(transposePitchClass(root, "3M")),
    displayNote(transposePitchClass(root, "5P"))
  ].filter(Boolean).join("-");
  const pentatonicCell = [
    displayNote(root),
    displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M"))),
    displayNote(transposePitchClass(root, "3M")),
    displayNote(transposePitchClass(root, "5P")),
    displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6M")))
  ].filter(Boolean).join("-");
  const cells = [addNineCell, pentatonicCell].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "add9 maior / pentatônica",
    source: "pentatonic",
    sourceScale: scale.name,
    cells,
    tensionProfile: ["9", "6", "3", "5"],
    resolutionTargets: [],
    practiceHint: "Use a 9 como cor de repouso e a pentatonica maior para manter o acorde aberto."
  }];
}

function powerChordPentatonicMaterials(scale: MaterialSourceMap, root: string, quality: ChordQuality): ContextualMelodicMaterial[] {
  if (!["major pentatonic", "minor pentatonic"].includes(scale.type) || quality !== "power") return [];
  const rootNote = displayNote(root);
  const fifth = displayNote(transposePitchClass(root, "5P"));
  const second = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M")));
  const sixth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6M")));
  const minorThird = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "3m")));
  const fourth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "4P")));
  const flatSeven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "7m")));
  const cells = scale.type === "major pentatonic"
    ? [
      [rootNote, fifth, second].filter(Boolean).join("-"),
      [rootNote, second, fifth, sixth].filter(Boolean).join("-")
    ].filter(Boolean)
    : [
      [rootNote, fifth, flatSeven].filter(Boolean).join("-"),
      [rootNote, minorThird, fourth, fifth].filter(Boolean).join("-")
    ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "power chord / pentatônica",
    source: "pentatonic",
    sourceScale: scale.name,
    cells,
    tensionProfile: scale.type === "major pentatonic" ? ["1", "5", "9", "6"] : ["1", "b3", "4", "5", "b7"],
    resolutionTargets: [],
    practiceHint: "Use a pentatonica como material aberto, sem impor terça maior ou menor ao power chord."
  }];
}

function neutralSuspendedPentatonicMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality
): ContextualMelodicMaterial[] {
  const validSourceForQuality = (
    (quality === "power" && scale.type === "power neutral pentatonic")
    || (quality === "sus2" && scale.type === "sus2 pentatonic")
    || (quality === "sus4" && scale.type === "sus4 pentatonic")
  );
  if (!validSourceForQuality) return [];

  const rootNote = displayNote(root);
  const second = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M")));
  const fourth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "4P")));
  const fifth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "5P")));
  const flatSeven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "7m")));
  const cells = quality === "power"
    ? [
        [rootNote, fifth, rootNote].filter(Boolean).join("-"),
        [rootNote, second, fourth, fifth, flatSeven].filter(Boolean).join("-"),
        [fifth, rootNote, second, fourth].filter(Boolean).join("-")
      ]
    : quality === "sus2"
      ? [
          [rootNote, second, fifth].filter(Boolean).join("-"),
          [second, fourth, flatSeven].filter(Boolean).join("-"),
          [fifth, rootNote, second].filter(Boolean).join("-")
        ]
      : [
          [rootNote, fourth, flatSeven].filter(Boolean).join("-"),
          [second, fifth, rootNote].filter(Boolean).join("-"),
          [fifth, rootNote, fourth].filter(Boolean).join("-")
        ];

  return [{
    label: quality === "power"
      ? "power / pentatônica neutra"
      : quality === "sus2"
        ? "sus2 / eixo 1–2–5"
        : "sus4 / eixo 1–4–b7",
    source: "pentatonic",
    sourceScale: scale.name,
    cells,
    preferredCellIndex: quality === "power" ? 1 : 0,
    preferredRhythmArchetype: "straight",
    tensionProfile: ["1", "2", "4", "5", "b7", "sem terça definida"],
    resolutionTargets: [],
    practiceHint: quality === "power"
      ? "Use 1 e 5 como eixo e abra 2, 4 e b7 sem decidir entre maior e menor."
      : "Preserve a suspensão como identidade e evite introduzir uma terça na frase."
  }];
}

const MAJOR_STABLE_QUALITIES = new Set<ChordQuality>([
  "major",
  "major6th",
  "major7th",
  "major9th",
  "major13th",
  "69"
]);

const MINOR_STABLE_QUALITIES = new Set<ChordQuality>([
  "minor",
  "minor6th",
  "minor7th",
  "minor9th",
  "minor11th",
  "minor13th",
  "minorAdd9"
]);

function localMajorSourceMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality
): ContextualMelodicMaterial[] {
  if (!MAJOR_STABLE_QUALITIES.has(quality)) return [];
  if (!["major", "major pentatonic", "bebop major"].includes(scale.type)) return [];

  const rootNote = displayNote(root);
  const third = displayNote(transposePitchClass(root, "3M"));
  const fifth = displayNote(transposePitchClass(root, "5P"));
  const sixth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6M")));
  const majorSeventh = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "7M")));
  const ninth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M")));
  const chromaticSixth = scale.type === "bebop major"
    ? displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6m")))
    : null;
  const core = quality === "major" || quality === "major6th" || quality === "69"
    ? [rootNote, third, fifth, sixth].filter(Boolean).join("-")
    : [rootNote, third, fifth, majorSeventh].filter(Boolean).join("-");
  const colorCell = scale.type === "major pentatonic"
    ? [ninth, third, fifth, sixth].filter(Boolean).join("-")
    : scale.type === "bebop major"
      ? [sixth, chromaticSixth, fifth].filter(Boolean).join("-")
      : [ninth, third, fifth].filter(Boolean).join("-");
  const returnCell = ninth && rootNote ? `${ninth}->${rootNote}` : "";
  const cells = [core, colorCell, returnCell].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: scale.type === "major pentatonic"
      ? "maior pentatônica / repouso"
      : scale.type === "bebop major"
        ? "maior bebop / passagem"
        : "maior diatônico / apoio",
    source: scale.type === "bebop major" ? "chromatic-approach" : "arpeggio",
    sourceScale: scale.name,
    cells,
    preferredCellIndex: 0,
    tensionProfile: scale.type === "bebop major" ? ["6", "b6 cromática", "5"] : ["1", "3", "5", "6", "7M", "9"],
    resolutionTargets: [],
    practiceHint: scale.type === "bebop major"
      ? "Use a passagem cromatica entre 6 e 5 como movimento breve, sem trocar o repouso do acorde."
      : "Use apoios do acorde e abra 6 ou 9 como cor local de repouso."
  }];
}

function localMinorSourceMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality
): ContextualMelodicMaterial[] {
  if (!MINOR_STABLE_QUALITIES.has(quality)) return [];
  if (!["aeolian", "minor pentatonic", "phrygian", "melodic minor"].includes(scale.type)) return [];

  const rootNote = displayNote(root);
  const minorThird = displayNote(transposePitchClass(root, "3m"));
  const fifth = displayNote(transposePitchClass(root, "5P"));
  const flatSeven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "7m")));
  const fourth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "4P")));
  const naturalSixth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6M")));
  const flatSixth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6m")));
  const flatNine = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2m")));
  const ninth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M")));
  const core = [rootNote, minorThird, fifth, flatSeven].filter(Boolean).join("-");
  const colorCell = scale.type === "minor pentatonic"
    ? [minorThird, fourth, fifth, flatSeven].filter(Boolean).join("-")
    : scale.type === "phrygian"
      ? [flatNine, rootNote, flatSeven].filter(Boolean).join("-")
      : scale.type === "melodic minor"
        ? [rootNote, minorThird, fifth, naturalSixth].filter(Boolean).join("-")
        : [flatSixth, fifth, minorThird].filter(Boolean).join("-");
  const returnCell = ninth && minorThird ? `${ninth}->${minorThird}` : "";
  const cells = [core, colorCell, returnCell].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: scale.type === "minor pentatonic"
      ? "menor pentatônica / apoio"
      : scale.type === "phrygian"
        ? "menor frígio / b9 local"
        : scale.type === "melodic minor"
          ? "menor melódica / 6 maior"
          : "menor natural / apoio",
    source: scale.type === "minor pentatonic" ? "pentatonic" : "arpeggio",
    sourceScale: scale.name,
    cells,
    preferredCellIndex: 0,
    tensionProfile: scale.type === "phrygian"
      ? ["b9", "b7", "b3", "5"]
      : scale.type === "melodic minor"
        ? ["6", "9", "b3", "5"]
        : ["b3", "5", "b7", "11", "b6"],
    resolutionTargets: [],
    practiceHint: scale.type === "phrygian"
      ? "Use a b9 como cor modal breve e retorne para a tonica ou b7."
      : "Afirme o arpejo menor e abra a cor modal sem abandonar b3 e 5."
  }];
}

function localHalfDiminishedLocrianMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality
): ContextualMelodicMaterial[] {
  if (scale.type !== "locrian" || quality !== "halfDiminished") return [];
  const rootNote = displayNote(root);
  const minorThird = displayNote(transposePitchClass(root, "3m"));
  const flatFive = displayNote(transposePitchClass(root, "5d"));
  const flatSeven = displayNote(transposePitchClass(root, "7m"));
  const flatNine = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2m")));
  const cells = [
    [rootNote, minorThird, flatFive, flatSeven].filter(Boolean).join("-"),
    [flatNine, rootNote, flatSeven].filter(Boolean).join("-")
  ].filter(Boolean);

  if (cells.length === 0) return [];

  return [{
    label: "ø lócrio / núcleo",
    source: "arpeggio",
    sourceScale: scale.name,
    cells,
    preferredCellIndex: 0,
    tensionProfile: ["b3", "b5", "b7", "b9"],
    resolutionTargets: [],
    practiceHint: "Afirme b3, b5 e b7; use a b9 como cor escura sem trocar a identidade meio-diminuta."
  }];
}

function localDominantColorSourceMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality
): ContextualMelodicMaterial[] {
  const isDominantQuality = LOCAL_DOMINANT_COLOR_QUALITIES.has(quality);
  if (!isDominantQuality || !["lydian dominant", "phrygian dominant"].includes(scale.type)) return [];
  const rootNote = displayNote(root);
  const third = displayNote(transposePitchClass(root, "3M"));
  const fifth = displayNote(transposePitchClass(root, "5P"));
  const flatSeven = displayNote(transposePitchClass(root, "7m"));
  const ninth = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2M")));
  const flatNine = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "2m")));
  const sharpEleven = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "4A")));
  const flatThirteen = displayNote(noteFromScaleByChroma(scale, transposePitchClass(root, "6m")));
  const cells = scale.type === "lydian dominant"
    ? [
        [rootNote, third, flatSeven].filter(Boolean).join("-"),
        [ninth, sharpEleven, flatSeven].filter(Boolean).join("-"),
        sharpEleven && fifth ? `${sharpEleven}->${fifth}` : ""
      ]
    : [
        [rootNote, third, fifth, flatSeven].filter(Boolean).join("-"),
        [flatNine, rootNote, flatSeven].filter(Boolean).join("-"),
        flatThirteen && fifth ? `${flatThirteen}->${fifth}` : ""
      ];

  const filteredCells = cells.filter(Boolean);
  if (filteredCells.length === 0) return [];

  return [{
    label: scale.type === "lydian dominant"
      ? "dominante lídio / #11"
      : "dominante frígio / b9-b13",
    source: "arpeggio",
    sourceScale: scale.name,
    cells: filteredCells,
    preferredCellIndex: 0,
    tensionProfile: scale.type === "lydian dominant" ? ["#11", "9", "b7"] : ["b9", "b13", "3", "b7"],
    resolutionTargets: [],
    practiceHint: scale.type === "lydian dominant"
      ? "Use #11 como cor local do dominante e volte para 5 ou b7."
      : "Use b9 e b13 como tensoes locais do dominante e retorne para 5 ou b7."
  }];
}

export function buildContextualMelodicMaterials(
  scale: MaterialSourceMap,
  root: string,
  quality: ChordQuality,
  harmonicFunction: ContextualHarmonicFunction,
  resolutionTarget: string | undefined,
  nextChord: string | undefined,
  options: { surface?: "contextual" | "local-vamp" } = {}
): ContextualMelodicMaterial[] {
  const includeLocalVampVocabulary = options.surface === "local-vamp";
  if (
    harmonicFunction !== "dominant"
    && scale.type !== "half-whole diminished"
    && scale.type !== "altered"
    && scale.type !== "lydian dominant"
    && scale.type !== "locrian #2"
    && scale.type !== "whole-half diminished"
    && scale.type !== "dorian"
    && scale.type !== "lydian"
    && !["mixolydian", "bebop dominant"].includes(scale.type)
    && scale.type !== "whole tone"
    && !["melodic minor", "harmonic minor"].includes(scale.type)
    && !["major", "major pentatonic", "bebop major"].includes(scale.type)
    && !["aeolian", "minor pentatonic", "phrygian", "locrian"].includes(scale.type)
    && !["phrygian dominant"].includes(scale.type)
    && !(quality === "add9" && ["major", "major pentatonic"].includes(scale.type))
    && !(quality === "power" && ["major pentatonic", "minor pentatonic"].includes(scale.type))
    && !["sus2 pentatonic", "sus4 pentatonic", "power neutral pentatonic"].includes(scale.type)
    && !(scale.type === "mixolydian" && ["sus4", "sus2", "dominant7sus4"].includes(quality))
  ) return [];
  return [
    ...halfWholeDiminishedMaterials(scale, root, resolutionTarget),
    ...alteredDominantMaterials(scale, root, quality, resolutionTarget, nextChord),
    ...naturalDominantMaterials(scale, root, quality, resolutionTarget, nextChord),
    ...relatedTwoMinorDominantMaterials(scale, root, quality),
    ...lydianDominantSubVMaterials(scale, root, resolutionTarget, nextChord),
    ...halfDiminishedMinorPreparationMaterials(scale, root, nextChord),
    ...resolvedDiminishedMaterials(scale, root, quality, nextChord),
    ...modalMinorMaterials(scale, root),
    ...majorLydianMaterials(scale, root),
    ...suspendedDominantMaterials(scale, root, quality, nextChord),
    ...wholeToneAugmentedMaterials(scale, root, quality),
    ...minorMajorMaterials(scale, root, quality),
    ...majorAddNineMaterials(scale, root, quality),
    ...powerChordPentatonicMaterials(scale, root, quality),
    ...neutralSuspendedPentatonicMaterials(scale, root, quality),
    ...(includeLocalVampVocabulary ? localMajorSourceMaterials(scale, root, quality) : []),
    ...(includeLocalVampVocabulary ? localMinorSourceMaterials(scale, root, quality) : []),
    ...(includeLocalVampVocabulary ? localHalfDiminishedLocrianMaterials(scale, root, quality) : []),
    ...(includeLocalVampVocabulary ? localDominantColorSourceMaterials(scale, root, quality) : []),
    ...(includeLocalVampVocabulary ? localOptionalAlteredDominantMaterials(scale, root, quality) : [])
  ].map(withPreferredCellId);
}
