import { Note } from "tonal";
import {
  CHORD_REGISTRY,
  type ChordQuality
} from "../constants/chordRegistry";
import type { ChordCandidate } from "../models/ChordCandidate";
import { simplifyNote } from "../core/pitch";
import { guideTonesFor } from "./contextualMaterialFunction";
import type { ContextualMaterialIntent } from "./contextualMaterialTypes";
import type { MaterialSourceMap } from "./musicTheory";
import type { LocalChordVampMaterialCandidate } from "./localChordVampMaterials";

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

const NATURAL_DOMINANT_VAMP_QUALITIES = new Set<ChordQuality>([
  "dominant7th",
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
): Pick<LocalChordVampMaterialCandidate, "chord" | "chordTones" | "guideTones"> {
  return {
    chord: chord.notationInternational,
    chordTones: chord.notes.map(note => simplifyNote(note)),
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

function chordToneCoreCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  const definition = CHORD_REGISTRY[chord.quality];
  const chordTones = uniqueNotes(
    definition.intervals
      .map(interval => pitch(chord.root, interval))
      .filter((note): note is string => !!note)
  );
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
    ...candidateBase(chord),
    chordTones,
    intent: "inside",
    confidence: 0.9,
    melodicMaterials: [{
      label: "núcleo de notas do acorde",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 0,
      preferredRhythmArchetype: "straight",
      tensionProfile: [...definition.intervals],
      resolutionTargets: [],
      practiceHint
    }],
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
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} eixo diminuto dominante`, "dominant diminished axis", cells);
  const practiceHint = `Use vocabulário menor em ${relatedTwoRoots.join(", ")} e volte para ${chord.root} quando quiser estabilizar.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "tension",
    confidence: 0.72,
    melodicMaterials: [{
      label: "eixo diminuto / ii menores",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      tensionProfile: ["dominantes por terça menor", "ii menor relacionado", "outside controlado"],
      resolutionTargets: [],
      practiceHint
    }],
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
    melodicMaterials: [{
      label: "side slip pentatônico",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["pentatônica interna", "meio tom abaixo", "meio tom acima"],
      resolutionTargets: [],
      practiceHint
    }],
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
    melodicMaterials: [{
      label: "pilha pentatônica dórica",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 2,
      preferredRhythmArchetype: "syncopated",
      tensionProfile: ["pentatônica menor da tônica", "pentatônica menor da quinta", "pentatônica menor do 2º grau"],
      resolutionTargets: [],
      practiceHint
    }],
    practiceHint
  };
}

function susQuartalPentatonicCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!SUS_VAMP_QUALITIES.has(chord.quality)) return null;

  const cells = [
    noteCell([chord.root, pitch(chord.root, "4P"), pitch(chord.root, "7m")]),
    noteCell([pitch(chord.root, "2M"), pitch(chord.root, "5P"), chord.root]),
    noteCell([pitch(chord.root, "5P"), chord.root, pitch(chord.root, "4P")])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} quartal sus pentatonico`, "sus quartal pentatonic", cells);
  const practiceHint = `Empilhe quartas e pentatonica sus sobre ${chord.root}; mantenha a quarta como identidade em vez de resolver rapido para a terca.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "inside",
    confidence: 0.74,
    melodicMaterials: [{
      label: "sus quartal / pentatônico",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      tensionProfile: ["4 suspensa", "9", "b7 como cor mixolídia"],
      resolutionTargets: [],
      practiceHint
    }],
    practiceHint
  };
}

function halfDiminishedUpperStructureCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!HALF_DIMINISHED_VAMP_QUALITIES.has(chord.quality)) return null;

  const cells = [
    noteCell([chord.root, pitch(chord.root, "3m"), pitch(chord.root, "5d"), pitch(chord.root, "7m")]),
    noteCell([pitch(chord.root, "2M"), pitch(chord.root, "4P"), pitch(chord.root, "6m"), chord.root]),
    noteCell([pitch(chord.root, "3m"), pitch(chord.root, "5d"), pitch(chord.root, "7m"), pitch(chord.root, "2M")])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} estruturas meio-diminutas`, "half diminished upper structures", cells);
  const practiceHint = `Use o arpejo meio-diminuto de ${chord.root} e abra a 9 natural como cor, sem depender de um dominante de chegada.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.7,
    melodicMaterials: [{
      label: "ø7 / estruturas superiores",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      tensionProfile: ["9 natural", "11", "b13", "b5"],
      resolutionTargets: [],
      practiceHint
    }],
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
  const cells = cycleRoots.map((_, index) => (
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
    melodicMaterials: [{
      label: isDiminishedTriad
        ? "extensão dim7 opcional"
        : "ciclo diminuto por terças menores",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      tensionProfile: isDiminishedTriad
        ? ["bb7 opcional", "simetria", "terças menores"]
        : ["simetria", "terças menores", "inversões equivalentes"],
      resolutionTargets: [],
      practiceHint
    }],
    practiceHint
  };
}

function augmentedWholeToneCycleCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!AUGMENTED_VAMP_QUALITIES.has(chord.quality)) return null;

  const cells = [
    noteCell([chord.root, pitch(chord.root, "3M"), pitch(chord.root, "5A")]),
    noteCell([pitch(chord.root, "2M"), pitch(chord.root, "4A"), pitch(chord.root, "7m")]),
    noteCell([
      chord.root,
      pitch(chord.root, "2M"),
      pitch(chord.root, "3M"),
      pitch(chord.root, "4A"),
      pitch(chord.root, "5A"),
      pitch(chord.root, "7m")
    ])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} ciclo de tons inteiros`, "augmented whole tone cycle", cells);
  const practiceHint = `Alterne a triade aumentada de ${chord.root} com a triade um tom acima; a cor fica simetrica e suspensa.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "tension",
    confidence: 0.73,
    melodicMaterials: [{
      label: "ciclo aumentado / tons inteiros",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      tensionProfile: ["tríades aumentadas", "tons inteiros", "#5", "#11"],
      resolutionTargets: [],
      practiceHint
    }],
    practiceHint
  };
}

function majorUpperTriadColorsCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MAJOR_VAMP_QUALITIES.has(chord.quality)) return null;

  const cells = [
    noteCell([chord.root, pitch(chord.root, "3M"), pitch(chord.root, "5P"), pitch(chord.root, "7M")]),
    noteCell([pitch(chord.root, "2M"), pitch(chord.root, "4A"), pitch(chord.root, "6M")]),
    noteCell([pitch(chord.root, "5P"), pitch(chord.root, "7M"), pitch(chord.root, "9M")])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} triades superiores maiores`, "major upper triad colors", cells);
  const practiceHint = `Use a triade do II grau para brilho lidio e a triade do V grau para repouso luminoso sobre ${chord.root}.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.69,
    melodicMaterials: [{
      label: "maj / tríades superiores",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "syncopated",
      tensionProfile: ["9", "#11", "13", "7M"],
      resolutionTargets: [],
      practiceHint
    }],
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
    melodicMaterials: [{
      label: "7 / tríades superiores naturais",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      tensionProfile: ["9", "11", "13", "b7"],
      resolutionTargets: [],
      practiceHint
    }],
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
    melodicMaterials: [{
      label: "alteração escrita / resolução curta",
      source: "chromatic-approach",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile,
      resolutionTargets: uniqueNotes(resolutionTargets),
      practiceHint
    }],
    practiceHint
  };
}

function minorMajorMelodicColorsCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MINOR_MAJOR_VAMP_QUALITIES.has(chord.quality)) return null;

  const cells = [
    noteCell([chord.root, pitch(chord.root, "3m"), pitch(chord.root, "5P"), pitch(chord.root, "7M")]),
    noteCell([pitch(chord.root, "2M"), pitch(chord.root, "4P"), pitch(chord.root, "6M")]),
    noteCell([pitch(chord.root, "5P"), pitch(chord.root, "7M"), pitch(chord.root, "9M")])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} cores menor-maior melodicas`, "minor major melodic colors", cells);
  const practiceHint = `Preserve a tensao entre a terca menor e a setima maior de ${chord.root}; use as triades de II menor e V maior como abertura melodica.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "functional",
    confidence: 0.67,
    melodicMaterials: [{
      label: "m(maj7) / cores melódicas",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      tensionProfile: ["7M", "9", "11", "13"],
      resolutionTargets: [],
      practiceHint
    }],
    practiceHint
  };
}

function powerRiffPentatonicAxisCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!POWER_VAMP_QUALITIES.has(chord.quality)) return null;

  const cells = [
    noteCell([chord.root, pitch(chord.root, "5P"), pitch(chord.root, "8P")]),
    noteCell([chord.root, pitch(chord.root, "2M"), pitch(chord.root, "4P"), pitch(chord.root, "5P"), pitch(chord.root, "7m")]),
    noteCell([pitch(chord.root, "5P"), chord.root, pitch(chord.root, "2M"), pitch(chord.root, "4P")])
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const source = materialSource(`${chord.root} eixo pentatonico power`, "power riff pentatonic axis", cells);
  const practiceHint = `Use ${chord.root} e quinta como eixo; mantenha a pentatonica sem terca ate decidir se a cor sera maior ou menor.`;

  return {
    ...source,
    ...candidateBase(chord),
    intent: "inside",
    confidence: 0.75,
    melodicMaterials: [{
      label: "power / eixo pentatônico",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      preferredCellIndex: 1,
      preferredRhythmArchetype: "straight",
      tensionProfile: ["1", "5", "2/4/b7 como cor neutra", "sem terca definida"],
      resolutionTargets: [],
      practiceHint
    }],
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
    id: "dominant-upper-triad-colors",
    sourceType: "dominant upper triad colors",
    label: "7 / tríades superiores naturais",
    qualities: Array.from(NATURAL_DOMINANT_VAMP_QUALITIES),
    intent: "functional",
    build: dominantUpperTriadColorsCandidate
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
