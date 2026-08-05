import { Note } from "tonal";
import {
  CHORD_REGISTRY,
  type ChordQuality
} from "../constants/chordRegistry";
import type { ChordCandidate } from "../models/ChordCandidate";
import { simplifyNote } from "../core/pitch";
import { guideTonesFor } from "./contextualMaterialFunction";
import type {
  ContextualMaterialIntent,
  ContextualMelodicMaterial
} from "./contextualMaterialTypes";
import { contextualMelodicMaterialId } from "./melodicCellMaterialAdapter";
import type { MaterialSourceMap } from "./musicTheory";
import type { LocalChordVampMaterialCandidate } from "./localChordVampMaterials";
import { materialChordIdentityFromChordCandidate } from "./materialChordIdentity";
import { stableMelodicCellToken } from "../models/MelodicCell";

export interface LocalChordVampMaterialCatalogEntry {
  id: string;
  sourceType: string;
  label: string;
  qualities: ChordQuality[];
  intent: ContextualMaterialIntent;
  build: (chord: ChordCandidate) => LocalChordVampMaterialCandidate | null;
}

const DOMINANT_QUALITIES = new Set<ChordQuality>([
  "dominant7th",
  "dominant9th",
  "dominant11th",
  "dominant13th",
  "dominant7sus4",
  "dominant7b5",
  "dominant7b9",
  "dominant7#9",
  "dominant7#11",
  "dominant7b13"
]);

const MINOR_VAMP_QUALITIES = new Set<ChordQuality>([
  "minor",
  "minor6th",
  "minor7th",
  "minor9th",
  "minor11th",
  "minor13th",
  "minorAdd9"
]);

const MINOR_ADDED_COLOR_QUALITIES = new Set<ChordQuality>([
  "minor6th",
  "minorAdd9"
]);

const MINOR_SEVENTH_COLOR_QUALITIES = new Set<ChordQuality>([
  "minor9th",
  "minor13th"
]);

const SUS_VAMP_QUALITIES = new Set<ChordQuality>([
  "sus4",
  "sus2",
  "dominant7sus4"
]);

const HALF_DIMINISHED_VAMP_QUALITIES = new Set<ChordQuality>([
  "halfDiminished"
]);

const DIMINISHED_VAMP_QUALITIES = new Set<ChordQuality>([
  "diminished",
  "diminished7th"
]);

const AUGMENTED_VAMP_QUALITIES = new Set<ChordQuality>([
  "augmented"
]);

const MAJOR_VAMP_QUALITIES = new Set<ChordQuality>([
  "major",
  "major6th",
  "major7th",
  "major9th",
  "major13th",
  "major7#11",
  "add9",
  "69"
]);

const MAJOR_ADDED_COLOR_QUALITIES = new Set<ChordQuality>([
  "major6th",
  "add9",
  "69"
]);

const MAJOR_SEVENTH_COLOR_QUALITIES = new Set<ChordQuality>([
  "major9th",
  "major13th"
]);

const NATURAL_DOMINANT_VAMP_QUALITIES = new Set<ChordQuality>([
  "dominant7th",
  "dominant9th",
  "dominant11th",
  "dominant13th"
]);

const NATURAL_DOMINANT_EXTENSION_QUALITIES = new Set<ChordQuality>([
  "dominant9th",
  "dominant11th",
  "dominant13th"
]);

const WRITTEN_ALTERED_DOMINANT_VAMP_QUALITIES = new Set<ChordQuality>([
  "dominant7b5",
  "dominant7b9",
  "dominant7#9",
  "dominant7#11",
  "dominant7b13"
]);

const MINOR_MAJOR_VAMP_QUALITIES = new Set<ChordQuality>([
  "minorMajor7th"
]);

const POWER_VAMP_QUALITIES = new Set<ChordQuality>([
  "power"
]);

const ALL_CHORD_QUALITIES = Object.keys(CHORD_REGISTRY) as ChordQuality[];

function pitch(root: string, interval: string): string | null {
  const transposed = Note.transpose(root, interval);
  return transposed ? simplifyNote(transposed) : null;
}

function uniqueNotes(notes: string[]): string[] {
  return Array.from(new Set(notes.map(note => simplifyNote(note))));
}

function notesInMaterialCell(cell: string): string[] {
  return cell
    .split(/->|-/)
    .map(note => simplifyNote(note.trim()))
    .filter(Boolean);
}

function materialSource(name: string, type: string, cells: string[]): MaterialSourceMap {
  return {
    name,
    type,
    intervals: [],
    notes: uniqueNotes(cells.flatMap(notesInMaterialCell))
  };
}

function candidateBase(
  chord: ChordCandidate
): Pick<LocalChordVampMaterialCandidate, "chord" | "chordTones" | "materialIdentity" | "guideTones"> {
  const materialIdentity = materialChordIdentityFromChordCandidate(chord);
  return {
    chord: chord.notationInternational,
    chordTones: chord.notes.map(note => simplifyNote(note)),
    materialIdentity,
    guideTones: guideTonesFor(chord.root, chord.quality)
  };
}

function minorSeventhCell(root: string): string {
  return [
    simplifyNote(root),
    pitch(root, "3m"),
    pitch(root, "5P"),
    pitch(root, "7m")
  ].filter((note): note is string => !!note).join("-");
}

function majorChromaticThirdCell(root: string): string {
  return [
    simplifyNote(root),
    pitch(root, "3m"),
    pitch(root, "3M"),
    pitch(root, "5P")
  ].filter((note): note is string => !!note).join("-");
}

function minorPentatonicCell(root: string): string {
  return [
    simplifyNote(root),
    pitch(root, "3m"),
    pitch(root, "4P"),
    pitch(root, "5P"),
    pitch(root, "7m")
  ].filter((note): note is string => !!note).join("-");
}

function noteCell(notes: Array<string | null>): string {
  return notes.filter((note): note is string => !!note).map(note => simplifyNote(note)).join("-");
}

function directedCell(from: string | null, to: string | null): string {
  if (!from || !to) return "";
  return `${simplifyNote(from)}->${simplifyNote(to)}`;
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

function chordToneCoreCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  const base = candidateBase(chord);
  const definition = CHORD_REGISTRY[base.materialIdentity.quality];
  const chordTones = base.materialIdentity.structuralNotes;
  if (chordTones.length === 0) return null;

  const cells = [
    chordTones.join("-"),
    [...chordTones].reverse().join("-")
  ].filter((cell, index, allCells) => allCells.indexOf(cell) === index);
  const source: MaterialSourceMap = {
    name: `${chord.root} nucleo de notas do acorde`,
    type: "chord tone core",
    intervals: [...definition.intervals],
    notes: chordTones
  };
  const practiceHint = `Comece pelas notas exatas de ${chord.notationInternational}; este nucleo nao acrescenta notas externas ao acorde.`;

  return {
    ...source,
    ...base,
    chordTones,
    intent: "inside",
    confidence: 0.9,
    melodicMaterials: [withPreferredCellId({
      label: "núcleo de notas do acorde",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 0,
      preferredRhythmArchetype: "straight",
      tensionProfile: [...definition.intervals],
      resolutionTargets: [],
      practiceHint
    })],
    practiceHint
  };
}

function dominantDiminishedAxisCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!DOMINANT_QUALITIES.has(chord.quality)) return null;

  const axisRoots = [
    chord.root,
    pitch(chord.root, "3m"),
    pitch(chord.root, "5d"),
    pitch(chord.root, "6M")
  ].filter((note): note is string => !!note);
  const relatedTwoRoots = axisRoots
    .map(root => pitch(root, "5P"))
    .filter((note): note is string => !!note);
  const cells = relatedTwoRoots.map(root => minorSeventhCell(root));
  const chromaticThirdCells = axisRoots.map(root => majorChromaticThirdCell(root));
  if (cells.length === 0 && chromaticThirdCells.length === 0) return null;

  const source = materialSource(`${chord.root} eixo diminuto dominante`, "dominant diminished axis", [
    ...cells,
    ...chromaticThirdCells
  ]);
  const practiceHint = `Use vocabulário menor em ${relatedTwoRoots.join(", ")} ou tríades com aproximação cromática da terça para colorir ${chord.notationInternational}.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "tension",
    confidence: 0.72,
    melodicMaterials: [
      withPreferredCellId({
        label: "eixo diminuto / ii menores",
        source: "arpeggio",
        sourceScale: source.name,
        cells,
        tensionProfile: ["dominantes por terça menor", "ii menor relacionado", "outside controlado"],
        resolutionTargets: [],
        practiceHint
      }),
      withPreferredCellId({
        label: "dominante diminuta / tríades com #2",
        source: "arpeggio",
        sourceScale: source.name,
        cells: chromaticThirdCells,
        preferredCellIndex: 0,
        preferredRhythmArchetype: "syncopated",
        tensionProfile: ["H/W diminished", "1-b3-3-5", "terça cromática"],
        resolutionTargets: [],
        practiceHint: `Use cada nota de ${axisRoots.join(", ")} como raiz de uma tríade maior com b3 cromática antes da terça.`
      })
    ],
    practiceHint
  };
}

function dominantSideSlipCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!DOMINANT_QUALITIES.has(chord.quality)) return null;

  const relatedTwoRoot = pitch(chord.root, "5P");
  if (!relatedTwoRoot) return null;
  const lowerSlipRoot = pitch(relatedTwoRoot, "-2m");
  const upperSlipRoot = pitch(relatedTwoRoot, "2m");
  const cells = [
    minorPentatonicCell(relatedTwoRoot),
    lowerSlipRoot ? minorPentatonicCell(lowerSlipRoot) : "",
    upperSlipRoot ? minorPentatonicCell(upperSlipRoot) : ""
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} side slip pentatonico`, "side slip minor pentatonic", cells);
  const practiceHint = `Desloque a pentatonica menor de ${relatedTwoRoot} meio tom para fora e retorne aos apoios de ${chord.root}.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "outside",
    confidence: 0.58,
    melodicMaterials: [withPreferredCellId({
      label: "side slip pentatônico",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["pentatônica interna", "meio tom abaixo", "meio tom acima"],
      resolutionTargets: [],
      practiceHint
    })],
    practiceHint
  };
}

function minorDorianPentatonicStackCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MINOR_VAMP_QUALITIES.has(chord.quality)) return null;

  const fifthRoot = pitch(chord.root, "5P");
  const secondRoot = pitch(chord.root, "2M");
  const cells = [
    minorPentatonicCell(chord.root),
    fifthRoot ? minorPentatonicCell(fifthRoot) : "",
    secondRoot ? minorPentatonicCell(secondRoot) : ""
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} pilha pentatonica dorica`, "minor dorian pentatonic stack", cells);
  const practiceHint = `Alterne pentatonicas menores de ${chord.root}${fifthRoot ? `, ${fifthRoot}` : ""}${secondRoot ? ` e ${secondRoot}` : ""} para abrir 9, 11 e 13 sem abandonar o menor.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.66,
    melodicMaterials: [withPreferredCellId({
      label: "pilha pentatônica dórica",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 2,
      preferredRhythmArchetype: "syncopated",
      tensionProfile: ["pentatônica menor da tônica", "pentatônica menor da quinta", "pentatônica menor do 2º grau"],
      resolutionTargets: [],
      practiceHint
    })],
    practiceHint
  };
}

function minorAddedColorResolutionCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MINOR_ADDED_COLOR_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const minorThird = pitch(chord.root, "3m");
  const fifth = pitch(chord.root, "5P");
  const sixth = pitch(chord.root, "6M");
  const ninth = pitch(chord.root, "9M");
  const cells = [
    noteCell([root, minorThird, fifth]),
    chord.quality === "minor6th" ? directedCell(sixth, fifth) : "",
    chord.quality === "minorAdd9" ? directedCell(ninth, minorThird) : ""
  ].filter(Boolean);
  if (cells.length <= 1) return null;

  const source = materialSource(`${chord.root} cores menores adicionadas`, "minor added color resolutions", cells);
  const practiceHint = `Use a cor adicionada de ${chord.notationInternational} como gesto curto e retorne para b3 ou 5 sem perder a identidade menor.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.77,
    melodicMaterials: [withPreferredCellId({
      label: "m6/madd9 / cores resolvidas",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: [
        ...(chord.quality === "minorAdd9" ? ["9->b3"] : []),
        ...(chord.quality === "minor6th" ? ["6->5"] : [])
      ],
      resolutionTargets: uniqueNotes([minorThird, fifth].filter((note): note is string => !!note)),
      practiceHint
    })],
    practiceHint
  };
}

function minorSeventhColorResolutionCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MINOR_SEVENTH_COLOR_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const minorThird = pitch(chord.root, "3m");
  const fifth = pitch(chord.root, "5P");
  const flatSeven = pitch(chord.root, "7m");
  const ninth = pitch(chord.root, "9M");
  const thirteenth = pitch(chord.root, "13M");
  const cells = [
    noteCell([root, minorThird, fifth, flatSeven]),
    directedCell(ninth, minorThird),
    chord.quality === "minor13th" ? directedCell(thirteenth, fifth) : "",
    chord.quality === "minor13th" ? noteCell([flatSeven, ninth, minorThird, thirteenth, fifth]) : ""
  ].filter(Boolean);
  if (cells.length <= 1) return null;

  const source = materialSource(`${chord.root} cores menores com setima`, "minor seventh color resolutions", cells);
  const practiceHint = `Preserve b3 e b7 de ${chord.notationInternational}; use 9 e 13 como cores que retornam para b3 ou 5.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.76,
    melodicMaterials: [withPreferredCellId({
      label: "m9/m13 / cores com b7",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: [
        "9->b3",
        ...(chord.quality === "minor13th" ? ["13->5"] : []),
        "b7 preservada"
      ],
      resolutionTargets: uniqueNotes([minorThird, fifth].filter((note): note is string => !!note)),
      practiceHint
    })],
    practiceHint
  };
}

function susQuartalPentatonicCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!SUS_VAMP_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const second = pitch(chord.root, "2M");
  const fourth = pitch(chord.root, "4P");
  const fifth = pitch(chord.root, "5P");
  const flatSeven = pitch(chord.root, "7m");
  const cells = [
    chord.quality === "sus2"
      ? noteCell([root, second, fifth])
      : noteCell([root, fourth, chord.quality === "dominant7sus4" ? flatSeven : fifth]),
    chord.quality !== "sus2" ? directedCell(fourth, fifth) : "",
    chord.quality !== "sus4" ? directedCell(second, root) : "",
    chord.quality === "dominant7sus4" ? noteCell([flatSeven, second, fourth, fifth]) : ""
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} quartal sus pentatonico`, "sus quartal pentatonic", cells);
  const practiceHint = `Mantenha a suspensão de ${chord.notationInternational}; use 2 e 4 como tensão estável e retorne para 1 ou 5 sem definir terça.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "inside",
    confidence: 0.74,
    melodicMaterials: [withPreferredCellId({
      label: "sus quartal / pentatônico",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: chord.quality === "sus2"
        ? ["2 suspensa", "2->1", "sem terça"]
        : ["4 suspensa", "4->5", ...(chord.quality === "dominant7sus4" ? ["b7 preservada"] : []), "sem terça"],
      resolutionTargets: uniqueNotes([root, fifth].filter((note): note is string => !!note)),
      practiceHint
    })],
    practiceHint
  };
}

function halfDiminishedUpperStructureCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!HALF_DIMINISHED_VAMP_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const minorThird = pitch(chord.root, "3m");
  const flatFifth = pitch(chord.root, "5d");
  const flatSeven = pitch(chord.root, "7m");
  const naturalNine = pitch(chord.root, "9M");
  const eleventh = pitch(chord.root, "11P");
  const flatThirteen = pitch(chord.root, "6m");
  const cells = [
    noteCell([root, minorThird, flatFifth, flatSeven]),
    directedCell(naturalNine, minorThird),
    directedCell(eleventh, flatFifth),
    directedCell(flatThirteen, flatFifth),
    noteCell([minorThird, flatFifth, flatSeven, naturalNine])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} estruturas meio-diminutas`, "half diminished upper structures", cells);
  const practiceHint = `Use o arpejo meio-diminuto de ${chord.root}; abra 9, 11 e b13 como cores breves e volte para b3 ou b5.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.7,
    melodicMaterials: [withPreferredCellId({
      label: "ø7 / estruturas superiores",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["9 natural", "11", "b13", "retorno para b3/b5"],
      resolutionTargets: uniqueNotes([minorThird, flatFifth].filter((note): note is string => !!note)),
      practiceHint
    })],
    practiceHint
  };
}

function diminishedSymmetricCycleCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!DIMINISHED_VAMP_QUALITIES.has(chord.quality)) return null;

  const isDiminishedTriad = chord.quality === "diminished";
  const cycleRoots = [
    chord.root,
    pitch(chord.root, "3m"),
    pitch(chord.root, "5d"),
    pitch(chord.root, "6M")
  ].filter((note): note is string => !!note);
  const cells = isDiminishedTriad
    ? [
        cycleRoots.slice(0, 3).join("-"),
        directedCell(cycleRoots[3], cycleRoots[0]),
        cycleRoots.join("-")
      ].filter(Boolean)
    : cycleRoots.map((_, index) => (
        [...cycleRoots.slice(index), ...cycleRoots.slice(0, index)].join("-")
      ));
  if (cycleRoots.length !== 4 || cells.length === 0) return null;

  const source = materialSource(`${chord.root} ciclo diminuto simetrico`, "diminished symmetric cycle", cells);
  const optionalDiminishedSeventh = cycleRoots[3];
  const practiceHint = isDiminishedTriad
    ? `Acrescente ${optionalDiminishedSeventh} como bb7 apenas quando quiser expandir a tríade de ${chord.root} para uma tensão dim7 opcional.`
    : `Repita o arpejo diminuto de ${chord.root} por terças menores; a simetria cria tensao controlada sem precisar de destino imediato.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "tension",
    confidence: 0.76,
    melodicMaterials: [withPreferredCellId({
      label: isDiminishedTriad
        ? "extensão dim7 opcional"
        : "ciclo diminuto por terças menores",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: isDiminishedTriad ? 1 : 0,
      preferredRhythmArchetype: isDiminishedTriad ? "space-response" : "syncopated",
      tensionProfile: isDiminishedTriad
        ? ["bb7 opcional", "retorno para a tônica", "sem terça maior implícita"]
        : ["simetria", "terças menores", "inversões equivalentes"],
      resolutionTargets: isDiminishedTriad
        ? [cycleRoots[0]]
        : [],
      practiceHint
    })],
    practiceHint
  };
}

function augmentedWholeToneCycleCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!AUGMENTED_VAMP_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const third = pitch(chord.root, "3M");
  const sharpFive = pitch(chord.root, "5A");
  const ninth = pitch(chord.root, "2M");
  const sharpEleven = pitch(chord.root, "4A");
  const flatSeven = pitch(chord.root, "7m");
  const cells = [
    noteCell([root, third, sharpFive]),
    noteCell([ninth, sharpEleven, flatSeven]),
    directedCell(sharpEleven, sharpFive),
    noteCell([
      root,
      ninth,
      third,
      sharpEleven,
      sharpFive,
      flatSeven
    ])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} ciclo de tons inteiros`, "augmented whole tone cycle", cells);
  const practiceHint = `Afirme a triade aumentada de ${chord.root}; use a triade um tom acima como cor e volte para a #5 escrita.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "tension",
    confidence: 0.73,
    melodicMaterials: [withPreferredCellId({
      label: "ciclo aumentado / tons inteiros",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 2,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["tríade aumentada", "tríade um tom acima", "#11", "retorno para #5"],
      resolutionTargets: sharpFive ? [sharpFive] : [],
      practiceHint
    })],
    practiceHint
  };
}

function majorUpperTriadColorsCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MAJOR_VAMP_QUALITIES.has(chord.quality)) return null;

  const isWrittenLydian = chord.quality === "major7#11";
  const fifth = pitch(chord.root, "5P");
  const sharpEleven = pitch(chord.root, "4A");
  const cells = [
    noteCell([chord.root, pitch(chord.root, "3M"), fifth, pitch(chord.root, "7M")]),
    noteCell([pitch(chord.root, "2M"), sharpEleven, pitch(chord.root, "6M")]),
    isWrittenLydian
      ? directedCell(sharpEleven, fifth)
      : noteCell([fifth, pitch(chord.root, "7M"), pitch(chord.root, "9M")])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} triades superiores maiores`, "major upper triad colors", cells);
  const practiceHint = isWrittenLydian
    ? `Use a triade do II grau para revelar o #11 escrito e retorne ${sharpEleven} para ${fifth} quando quiser estabilizar ${chord.root}.`
    : `Use a triade do II grau para brilho lidio e a triade do V grau para repouso luminoso sobre ${chord.root}.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.69,
    melodicMaterials: [withPreferredCellId({
      label: isWrittenLydian ? "maj7 lídio / tríade do II" : "maj / tríades superiores",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: isWrittenLydian ? "space-response" : "syncopated",
      tensionProfile: ["9", "#11", "13", "7M"],
      resolutionTargets: isWrittenLydian && fifth ? [fifth] : [],
      practiceHint
    })],
    practiceHint
  };
}

function majorAddedColorResolutionCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MAJOR_ADDED_COLOR_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const third = pitch(chord.root, "3M");
  const fifth = pitch(chord.root, "5P");
  const sixth = pitch(chord.root, "6M");
  const ninth = pitch(chord.root, "9M");
  const cells = [
    noteCell([root, third, fifth]),
    chord.quality !== "add9" ? directedCell(sixth, fifth) : "",
    chord.quality !== "major6th" ? directedCell(ninth, third) : "",
    chord.quality === "69" ? noteCell([sixth, ninth, third, fifth]) : ""
  ].filter(Boolean);
  if (cells.length <= 1) return null;

  const source = materialSource(`${chord.root} cores maiores adicionadas`, "major added color resolutions", cells);
  const practiceHint = `Use as cores adicionadas de ${chord.notationInternational} como gestos curtos: 9 volta para 3 e 6 volta para 5.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.78,
    melodicMaterials: [withPreferredCellId({
      label: "6/add9 / cores resolvidas",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: [
        ...(chord.quality !== "major6th" ? ["9->3"] : []),
        ...(chord.quality !== "add9" ? ["6->5"] : [])
      ],
      resolutionTargets: uniqueNotes([third, fifth].filter((note): note is string => !!note)),
      practiceHint
    })],
    practiceHint
  };
}

function majorSeventhColorResolutionCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MAJOR_SEVENTH_COLOR_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const third = pitch(chord.root, "3M");
  const fifth = pitch(chord.root, "5P");
  const majorSeven = pitch(chord.root, "7M");
  const ninth = pitch(chord.root, "9M");
  const thirteenth = pitch(chord.root, "13M");
  const cells = [
    noteCell([root, third, fifth, majorSeven]),
    directedCell(ninth, third),
    chord.quality === "major13th" ? directedCell(thirteenth, fifth) : "",
    chord.quality === "major13th" ? noteCell([majorSeven, ninth, third, thirteenth, fifth]) : ""
  ].filter(Boolean);
  if (cells.length <= 1) return null;

  const source = materialSource(`${chord.root} cores maiores com setima`, "major seventh color resolutions", cells);
  const practiceHint = `Preserve 3 e 7M de ${chord.notationInternational}; use 9 e 13 como cores que retornam para 3 ou 5.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.76,
    melodicMaterials: [withPreferredCellId({
      label: "maj9/maj13 / cores com 7M",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: [
        "9->3",
        ...(chord.quality === "major13th" ? ["13->5"] : []),
        "7M preservada"
      ],
      resolutionTargets: uniqueNotes([third, fifth].filter((note): note is string => !!note)),
      practiceHint
    })],
    practiceHint
  };
}

function dominantUpperTriadColorsCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!NATURAL_DOMINANT_VAMP_QUALITIES.has(chord.quality)) return null;

  const fifthRoot = pitch(chord.root, "5P");
  const flatSevenRoot = pitch(chord.root, "7m");
  const secondRoot = pitch(chord.root, "9M");
  const cells = [
    noteCell([chord.root, pitch(chord.root, "3M"), fifthRoot, flatSevenRoot]),
    noteCell([fifthRoot, flatSevenRoot, secondRoot]),
    noteCell([flatSevenRoot, secondRoot, pitch(chord.root, "11P")]),
    noteCell([secondRoot, pitch(chord.root, "11P"), pitch(chord.root, "13M")])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} triades superiores dominantes`, "dominant upper triad colors", cells);
  const practiceHint = `Use triades de ${fifthRoot}, ${flatSevenRoot} e ${secondRoot} para colorir ${chord.root}7 sem entrar no alterado.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.68,
    melodicMaterials: [withPreferredCellId({
      label: "7 / tríades superiores naturais",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      tensionProfile: ["9", "11", "13", "b7"],
      resolutionTargets: [],
      practiceHint
    })],
    practiceHint
  };
}

function dominantNaturalExtensionResolutionCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!NATURAL_DOMINANT_EXTENSION_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const third = pitch(chord.root, "3M");
  const fifth = pitch(chord.root, "5P");
  const flatSeven = pitch(chord.root, "7m");
  const ninth = pitch(chord.root, "9M");
  const eleventh = pitch(chord.root, "11P");
  const thirteenth = pitch(chord.root, "13M");
  const cells = [
    noteCell([root, third, fifth, flatSeven]),
    directedCell(ninth, third),
    chord.quality !== "dominant9th" ? directedCell(eleventh, third) : "",
    chord.quality === "dominant13th" ? directedCell(thirteenth, fifth) : "",
    chord.quality === "dominant13th" ? noteCell([flatSeven, ninth, third, thirteenth, fifth]) : ""
  ].filter(Boolean);
  if (cells.length <= 1) return null;

  const source = materialSource(`${chord.root} extensoes dominantes naturais`, "dominant natural extension resolutions", cells);
  const practiceHint = `Preserve 3 e b7 de ${chord.notationInternational}; use 9, 11 e 13 como cores que retornam para 3 ou 5.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.77,
    melodicMaterials: [withPreferredCellId({
      label: "9/11/13 dominante / retorno",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: [
        "9->3",
        ...(chord.quality !== "dominant9th" ? ["11->3"] : []),
        ...(chord.quality === "dominant13th" ? ["13->5"] : []),
        "b7 preservada"
      ],
      resolutionTargets: uniqueNotes([third, fifth].filter((note): note is string => !!note)),
      practiceHint
    })],
    practiceHint
  };
}

function writtenAlteredDominantResolutionCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!WRITTEN_ALTERED_DOMINANT_VAMP_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const third = pitch(chord.root, "3M");
  const fifth = pitch(chord.root, "5P");
  const flatFifth = pitch(chord.root, "5d");
  const flatSeven = pitch(chord.root, "7m");
  const flatNine = pitch(chord.root, "9m");
  const sharpNine = pitch(chord.root, "9A");
  const sharpEleven = pitch(chord.root, "11A");
  const flatThirteen = pitch(chord.root, "13m");
  const writtenAlterationCells: string[] = [];
  const tensionProfile: string[] = [];
  const resolutionTargets: string[] = [];

  if (chord.quality === "dominant7b9") {
    writtenAlterationCells.push(directedCell(flatNine, root));
    writtenAlterationCells.push(noteCell([third, flatSeven, flatNine, root]));
    tensionProfile.push("b9");
    resolutionTargets.push(root);
  }

  if (chord.quality === "dominant7#9") {
    writtenAlterationCells.push(directedCell(sharpNine, third));
    writtenAlterationCells.push(noteCell([flatSeven, sharpNine, third, fifth]));
    tensionProfile.push("#9");
    if (third) resolutionTargets.push(third);
  }

  if (chord.quality === "dominant7#11") {
    writtenAlterationCells.push(directedCell(sharpEleven, fifth));
    writtenAlterationCells.push(noteCell([third, sharpEleven, flatSeven, root]));
    tensionProfile.push("#11");
    if (fifth) resolutionTargets.push(fifth);
  }

  if (chord.quality === "dominant7b13") {
    writtenAlterationCells.push(directedCell(flatThirteen, fifth));
    writtenAlterationCells.push(noteCell([flatSeven, flatThirteen, fifth, third]));
    tensionProfile.push("b13");
    if (fifth) resolutionTargets.push(fifth);
  }

  if (chord.quality === "dominant7b5") {
    writtenAlterationCells.push(noteCell([root, third, flatFifth, flatSeven]));
    writtenAlterationCells.push(noteCell([third, flatFifth, flatSeven, root]));
    tensionProfile.push("b5");
    if (third) resolutionTargets.push(third);
    if (flatSeven) resolutionTargets.push(flatSeven);
  }

  const cells = [
    noteCell([root, third, flatSeven]),
    ...writtenAlterationCells
  ].filter(Boolean);
  if (cells.length <= 1) return null;

  const source = materialSource(`${chord.root} alteracoes escritas resolvidas`, "written altered dominant resolutions", cells);
  const practiceHint = `Toque a alteração escrita de ${chord.notationInternational} como tensão consciente e resolva curto para um apoio do próprio dominante.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "tension",
    confidence: 0.84,
    melodicMaterials: [withPreferredCellId({
      label: "alteração escrita / resolução curta",
      source: "chromatic-approach",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile,
      resolutionTargets: uniqueNotes(resolutionTargets),
      practiceHint
    })],
    practiceHint
  };
}

function minorMajorMelodicColorsCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MINOR_MAJOR_VAMP_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const minorThird = pitch(chord.root, "3m");
  const fifth = pitch(chord.root, "5P");
  const majorSeven = pitch(chord.root, "7M");
  const ninth = pitch(chord.root, "9M");
  const sixth = pitch(chord.root, "6M");
  const cells = [
    noteCell([root, minorThird, fifth, majorSeven]),
    directedCell(ninth, minorThird),
    directedCell(sixth, fifth),
    noteCell([minorThird, majorSeven, ninth, sixth, fifth])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} cores menor-maior melodicas`, "minor major melodic colors", cells);
  const practiceHint = `Preserve a tensão entre b3 e 7M de ${chord.notationInternational}; use 9 e 6 como cores que voltam para b3 e 5.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.67,
    melodicMaterials: [withPreferredCellId({
      label: "m(maj7) / cores melódicas",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["b3 + 7M preservadas", "9->b3", "6->5"],
      resolutionTargets: uniqueNotes([minorThird, fifth].filter((note): note is string => !!note)),
      practiceHint
    })],
    practiceHint
  };
}

function powerRiffPentatonicAxisCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!POWER_VAMP_QUALITIES.has(chord.quality)) return null;

  const root = simplifyNote(chord.root);
  const second = pitch(chord.root, "2M");
  const fourth = pitch(chord.root, "4P");
  const fifth = pitch(chord.root, "5P");
  const flatSeven = pitch(chord.root, "7m");
  const octave = pitch(chord.root, "8P");
  const cells = [
    noteCell([root, fifth, octave]),
    directedCell(second, root),
    directedCell(fourth, fifth),
    directedCell(flatSeven, root),
    noteCell([root, second, fourth, fifth, flatSeven]),
    noteCell([fifth, root, second, fourth])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} eixo pentatonico power`, "power riff pentatonic axis", cells);
  const practiceHint = `Use ${chord.root} e quinta como eixo; trate 2, 4 e b7 como cores neutras que voltam para 1 ou 5.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "inside",
    confidence: 0.75,
    melodicMaterials: [withPreferredCellId({
      label: "power / eixo pentatônico",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["1 e 5 como eixo", "2->1", "4->5", "b7->1", "sem terca definida"],
      resolutionTargets: uniqueNotes([root, fifth].filter((note): note is string => !!note)),
      practiceHint
    })],
    practiceHint
  };
}

export const LOCAL_CHORD_VAMP_MATERIAL_CATALOG: LocalChordVampMaterialCatalogEntry[] = [
  {
    id: "chord-tone-core",
    sourceType: "chord tone core",
    label: "núcleo de notas do acorde",
    qualities: ALL_CHORD_QUALITIES,
    intent: "inside",
    build: chordToneCoreCandidate
  },
  {
    id: "dominant-diminished-axis",
    sourceType: "dominant diminished axis",
    label: "eixo diminuto / ii menores",
    qualities: Array.from(DOMINANT_QUALITIES),
    intent: "tension",
    build: dominantDiminishedAxisCandidate
  },
  {
    id: "dominant-side-slip-minor-pentatonic",
    sourceType: "side slip minor pentatonic",
    label: "side slip pentatônico",
    qualities: Array.from(DOMINANT_QUALITIES),
    intent: "outside",
    build: dominantSideSlipCandidate
  },
  {
    id: "minor-dorian-pentatonic-stack",
    sourceType: "minor dorian pentatonic stack",
    label: "pilha pentatônica dórica",
    qualities: Array.from(MINOR_VAMP_QUALITIES),
    intent: "functional",
    build: minorDorianPentatonicStackCandidate
  },
  {
    id: "minor-added-color-resolutions",
    sourceType: "minor added color resolutions",
    label: "m6/madd9 / cores resolvidas",
    qualities: Array.from(MINOR_ADDED_COLOR_QUALITIES),
    intent: "functional",
    build: minorAddedColorResolutionCandidate
  },
  {
    id: "minor-seventh-color-resolutions",
    sourceType: "minor seventh color resolutions",
    label: "m9/m13 / cores com b7",
    qualities: Array.from(MINOR_SEVENTH_COLOR_QUALITIES),
    intent: "functional",
    build: minorSeventhColorResolutionCandidate
  },
  {
    id: "sus-quartal-pentatonic",
    sourceType: "sus quartal pentatonic",
    label: "sus quartal / pentatônico",
    qualities: Array.from(SUS_VAMP_QUALITIES),
    intent: "inside",
    build: susQuartalPentatonicCandidate
  },
  {
    id: "half-diminished-upper-structures",
    sourceType: "half diminished upper structures",
    label: "ø7 / estruturas superiores",
    qualities: Array.from(HALF_DIMINISHED_VAMP_QUALITIES),
    intent: "functional",
    build: halfDiminishedUpperStructureCandidate
  },
  {
    id: "diminished-symmetric-cycle",
    sourceType: "diminished symmetric cycle",
    label: "ciclo diminuto por terças menores",
    qualities: Array.from(DIMINISHED_VAMP_QUALITIES),
    intent: "tension",
    build: diminishedSymmetricCycleCandidate
  },
  {
    id: "augmented-whole-tone-cycle",
    sourceType: "augmented whole tone cycle",
    label: "ciclo aumentado / tons inteiros",
    qualities: Array.from(AUGMENTED_VAMP_QUALITIES),
    intent: "tension",
    build: augmentedWholeToneCycleCandidate
  },
  {
    id: "major-upper-triad-colors",
    sourceType: "major upper triad colors",
    label: "maj / tríades superiores",
    qualities: Array.from(MAJOR_VAMP_QUALITIES),
    intent: "functional",
    build: majorUpperTriadColorsCandidate
  },
  {
    id: "major-added-color-resolutions",
    sourceType: "major added color resolutions",
    label: "6/add9 / cores resolvidas",
    qualities: Array.from(MAJOR_ADDED_COLOR_QUALITIES),
    intent: "functional",
    build: majorAddedColorResolutionCandidate
  },
  {
    id: "major-seventh-color-resolutions",
    sourceType: "major seventh color resolutions",
    label: "maj9/maj13 / cores com 7M",
    qualities: Array.from(MAJOR_SEVENTH_COLOR_QUALITIES),
    intent: "functional",
    build: majorSeventhColorResolutionCandidate
  },
  {
    id: "dominant-upper-triad-colors",
    sourceType: "dominant upper triad colors",
    label: "7 / tríades superiores naturais",
    qualities: Array.from(NATURAL_DOMINANT_VAMP_QUALITIES),
    intent: "functional",
    build: dominantUpperTriadColorsCandidate
  },
  {
    id: "dominant-natural-extension-resolutions",
    sourceType: "dominant natural extension resolutions",
    label: "9/11/13 dominante / retorno",
    qualities: Array.from(NATURAL_DOMINANT_EXTENSION_QUALITIES),
    intent: "functional",
    build: dominantNaturalExtensionResolutionCandidate
  },
  {
    id: "written-altered-dominant-resolutions",
    sourceType: "written altered dominant resolutions",
    label: "alteração escrita / resolução curta",
    qualities: Array.from(WRITTEN_ALTERED_DOMINANT_VAMP_QUALITIES),
    intent: "tension",
    build: writtenAlteredDominantResolutionCandidate
  },
  {
    id: "minor-major-melodic-colors",
    sourceType: "minor major melodic colors",
    label: "m(maj7) / cores melódicas",
    qualities: Array.from(MINOR_MAJOR_VAMP_QUALITIES),
    intent: "functional",
    build: minorMajorMelodicColorsCandidate
  },
  {
    id: "power-riff-pentatonic-axis",
    sourceType: "power riff pentatonic axis",
    label: "power / eixo pentatônico",
    qualities: Array.from(POWER_VAMP_QUALITIES),
    intent: "inside",
    build: powerRiffPentatonicAxisCandidate
  }
];

export function localChordVampCatalogEntriesForQuality(
  quality: ChordQuality
): LocalChordVampMaterialCatalogEntry[] {
  return LOCAL_CHORD_VAMP_MATERIAL_CATALOG.filter(entry => entry.qualities.includes(quality));
}

export function localChordVampCatalogEntriesForIntent(
  intent: ContextualMaterialIntent
): LocalChordVampMaterialCatalogEntry[] {
  return LOCAL_CHORD_VAMP_MATERIAL_CATALOG.filter(entry => entry.intent === intent);
}

export function buildLocalChordVampSupplementalCandidates(chord: ChordCandidate): LocalChordVampMaterialCandidate[] {
  return localChordVampCatalogEntriesForQuality(chord.quality)
    .map(entry => entry.build(chord))
    .filter((candidate): candidate is LocalChordVampMaterialCandidate => !!candidate);
}
