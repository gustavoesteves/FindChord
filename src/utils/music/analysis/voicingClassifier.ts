import { getNoteAt, getOctave } from "../core/notes";
import { noteToMidi } from "../core/midi";
import { getPitchClass } from "../core/pitch";
import { getPhysicalBassInfo } from "../core/physicalVoice";
import type { VoicingClassification } from "../models/VoicingClassification";
import type { VoiceRoleAnalysis } from "../models/VoiceRoleAnalysis";
import { analyzeChords } from "./chordAnalyzer";
import type { FretPosition } from "../models/FretPosition";
import { parseChord } from "../theory/chordParser";

// Classifica a inversão harmônica baseando-se no papel harmônico do baixo acústico
function classifyInversion(bassPC: number, rootPC: number, quality: string): "root" | "first" | "second" | "third" | "fourth" {
  const diff = (bassPC - rootPC + 12) % 12;
  
  if (diff === 0) return "root";
  if (diff === 3 || diff === 4) return "first";
  
  const isDiminished = quality === "diminished" || quality === "halfDiminished" || quality === "diminished7th";
  const isAugmented = quality === "augmented";
  if (isDiminished && diff === 6) return "second";
  if (isAugmented && diff === 8) return "second";
  if (!isDiminished && !isAugmented && diff === 7) return "second";

  const isSixth = quality === "major6th" || quality === "minor6th" || quality === "69";
  if (isSixth && diff === 9) return "third";
  if (diff === 10 || diff === 11) return "third";

  return "fourth"; // Baixo soa uma tensão (9, 11, 13)
}

export function classifyVoicing(
  frets: (number | null)[],
  tuning: string[],
  roles: VoiceRoleAnalysis,
  chordRoot?: string,
  quality?: string
): VoicingClassification {
  // 1. Resolver tônica e qualidade
  let activeRoot = chordRoot || "";
  let activeQuality = quality || "major";

  if (chordRoot && (chordRoot.includes("/") || chordRoot.length > 2 || !/^[A-G][b#]?$/.test(chordRoot))) {
    const parsed = parseChord(chordRoot);
    if (!parsed.empty) {
      activeRoot = parsed.root;
      activeQuality = parsed.quality;
    }
  }

  if (!activeRoot) {
    const activePositions: FretPosition[] = [];
    frets.forEach((fret, stringIdx) => {
      if (fret !== null) {
        const noteName = getNoteAt(tuning[stringIdx], fret);
        activePositions.push({
          stringIndex: stringIdx,
          fret,
          noteName,
          pitchClass: getPitchClass(noteName),
          octave: getOctave(noteName)
        });
      }
    });
    if (activePositions.length > 0) {
      const candidates = analyzeChords(activePositions);
      if (candidates.length > 0) {
        activeRoot = candidates[0].root;
        activeQuality = candidates[0].quality;
      }
    }
  }

  const rootPC = activeRoot ? getPitchClass(activeRoot) : getPitchClass(tuning[0]);

  // 2. Classificar Inversão
  const bassInfo = getPhysicalBassInfo(frets, tuning);
  const inversionType = classifyInversion(bassInfo.pc, rootPC, activeQuality);

  // 3. Classificar Densidade Acústica
  const activePitches = frets
    .map((fret, idx) => (fret !== null ? noteToMidi(getNoteAt(tuning[idx], fret)) : null))
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);

  let density: "light" | "medium" | "dense" = "medium";
  if (activePitches.length >= 2) {
    const intervals: number[] = [];
    for (let i = 0; i < activePitches.length - 1; i++) {
      intervals.push(activePitches[i + 1] - activePitches[i]);
    }
    
    const hasTightCluster = intervals.some(diff => diff <= 2);
    if (hasTightCluster || (activePitches.length >= 5 && activePitches[activePitches.length - 1] - activePitches[0] <= 12)) {
      density = "dense";
    } else if (intervals.every(diff => diff >= 8)) {
      density = "light";
    }
  }

  // 4. Classificar Completeza
  let completeness: "minimal" | "complete" | "extended" = "minimal";
  if (roles.tensions.some(t => t.state === "present")) {
    completeness = "extended";
  } else if (roles.root === "present" && roles.third === "present" && roles.fifth === "present" && (roles.voices.length >= 4 || roles.seventh === "present")) {
    completeness = "complete";
  } else if (roles.physicalVoices === 3) {
    completeness = "minimal";
  }

  // 5. Classificar tipo de abertura (shellType) sob a Matriz de Precedência Estrita
  // Precedência: 1. quartal, 2. cluster, 3. drop2, 4. drop3, 5. shell, 6. triad, 7. extended
  let shellType: "triad" | "shell" | "drop2" | "drop3" | "quartal" | "cluster" | "extended";

  const activeStringIndexes = frets
    .map((f, idx) => (f !== null ? idx : null))
    .filter((idx): idx is number => idx !== null);

  const physicalCount = roles.physicalVoices;

  // Analisar intervalos consecutivos para quartal e cluster
  const soundingPitchesSorted = [...activePitches];
  let isQuartal = false;
  let isCluster = false;

  if (soundingPitchesSorted.length >= 3) {
    const consecutiveIntervals: number[] = [];
    for (let i = 0; i < soundingPitchesSorted.length - 1; i++) {
      consecutiveIntervals.push(soundingPitchesSorted[i + 1] - soundingPitchesSorted[i]);
    }
    // Quartal: a maioria dos intervalos consecutivos é 5 semitônios (quarta justa)
    const quartalIntervalsCount = consecutiveIntervals.filter(diff => diff === 5).length;
    if (quartalIntervalsCount >= consecutiveIntervals.length - 1 && consecutiveIntervals.length >= 2) {
      isQuartal = true;
    }
    // Cluster: contém pelo menos um atrito de segundas (1 ou 2 semitônios)
    isCluster = consecutiveIntervals.some(diff => diff === 1 || diff === 2);
  }

  // Verificar estrutura Drop 2 e Drop 3 baseando-se na adjacência de cordas
  let isDrop2Structure = false;
  let isDrop3Structure = false;

  if (physicalCount === 4) {
    const stringSpan = activeStringIndexes[activeStringIndexes.length - 1] - activeStringIndexes[0];
    if (stringSpan === 3) {
      // 4 vozes em cordas adjacentes consecutivas
      isDrop2Structure = true;
    } else if (stringSpan === 4) {
      // 4 vozes contendo exatamente um gap (corda mutada) entre o baixo e as outras cordas
      const hasSingleBassGap = frets[activeStringIndexes[0] + 1] === null;
      if (hasSingleBassGap) {
        isDrop3Structure = true;
      }
    }
  }

  // Determinação final usando a Matriz de Precedência
  if (isQuartal) {
    shellType = "quartal";
  } else if (isCluster) {
    shellType = "cluster";
  } else if (isDrop2Structure) {
    shellType = "drop2";
  } else if (isDrop3Structure) {
    shellType = "drop3";
  } else if (physicalCount === 3 && roles.root === "present" && roles.third === "present" && roles.seventh === "present" && roles.fifth === "omitted") {
    shellType = "shell";
  } else if (physicalCount === 3 && roles.root === "present" && roles.third === "present" && roles.fifth === "present") {
    shellType = "triad";
  } else {
    shellType = "extended";
  }

  // 6. Calcular parâmetros ergonômicos estruturados
  let minFret = Infinity;
  let maxFret = -Infinity;
  frets.forEach(f => {
    if (f !== null && f > 0) {
      if (f < minFret) minFret = f;
      if (f > maxFret) maxFret = f;
    }
  });
  const stretch = minFret !== Infinity && maxFret !== -Infinity ? maxFret - minFret : 0;
  const hasBarre = stretch === 0 && physicalCount >= 4;

  let internalGaps = 0;
  if (activeStringIndexes.length >= 2) {
    for (let idx = activeStringIndexes[0] + 1; idx < activeStringIndexes[activeStringIndexes.length - 1]; idx++) {
      if (frets[idx] === null) {
        internalGaps++;
      }
    }
  }

  return {
    classificationVersion: 1,
    shellType,
    density,
    inversionType,
    completeness,
    hasBarre,
    stretch,
    internalGaps
  };
}
