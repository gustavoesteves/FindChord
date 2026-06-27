import { getPitchClass } from "../core/pitch";
import { getNoteAt } from "../core/notes";
import { noteToMidi } from "../core/midi";
import type { CageShape, VoicingShape } from "../models/VoicingShape";
import { scoreVoicing } from "../scoring/voicingScorer";
import { analyzeVoiceRoles } from "../analysis/voicingAnalyzer";
import { classifyVoicing } from "../analysis/voicingClassifier";
import type { VoicingAcoustics } from "../models/VoicingAcoustics";
import type { SearchContext } from "./searchContext";
import { getRequiredPitchClasses } from "./requiredPitchClasses";
import { isWithinAnatomicalStretch, isPhysicalReachValid } from "./voicingConstraints";
import { hasValidMutedGaps } from "./voicingFilters";

// Cache central de Voicings para otimização de performance (Evita recálculos em tempo real)
const voicingCache = new Map<string, VoicingShape[]>();

export function clearVoicingCache() {
  voicingCache.clear();
}

// Helper para classificar o formato do braço baseado no sistema CAGED
function classifyCAGED(frets: (number | null)[], rootString: number): CageShape {
  const rootFret = frets[rootString];
  if (rootFret === null) return "E";

  if (rootString === 0 || rootString === 5) {
    return rootFret >= 5 && rootFret <= 10 ? "A" : "E";
  }
  if (rootString === 1) {
    return rootFret >= 5 && rootFret <= 9 ? "D" : "A";
  }
  if (rootString === 2) {
    return "G";
  }
  if (rootString === 3) {
    return "D";
  }
  return "C";
}

// Identifica a família ou disposição mecânica do shape
export function identifyShapeFamily(frets: (number | null)[]): string {
  const activeCount = frets.filter(f => f !== null).length;
  if (activeCount === 3) return "Shell Voicing";
  
  const activeStringIndexes = frets
    .map((f, idx) => (f !== null ? idx : null))
    .filter((idx): idx is number => idx !== null);
    
  if (activeStringIndexes.length === 4) {
    const span = activeStringIndexes[activeStringIndexes.length - 1] - activeStringIndexes[0];
    if (span === 3) return "Drop 2";
    if (span === 4 && frets[activeStringIndexes[0] + 1] === null) return "Drop 3";
  }
  return "Standard Shape";
}

/**
 * Motor de Busca Combinatória Recursiva Purificado (Fretboard Search Engine)
 */
export function generateVoicings(
  chordName: string,
  chordRoot: string,
  targetPitchClasses: number[],
  tuning: string[] = ["E4", "B3", "G3", "D3", "A2", "E2"],
  activeQuality?: string,
  bassPC: number | null = null,
  forceRequiredPCs?: number[]
): VoicingShape[] {
  const cacheKey = `${chordName}-${targetPitchClasses.join(",")}-${tuning.join(",")}-${forceRequiredPCs?.join(",") || ""}`;
  if (voicingCache.has(cacheKey)) {
    return voicingCache.get(cacheKey)!;
  }

  const rootPC = getPitchClass(chordRoot);
  const notesOnStrings: { fret: number; pitchClass: number; noteName: string }[][] = [];

  for (let stringIdx = 0; stringIdx < tuning.length; stringIdx++) {
    const baseNote = tuning[stringIdx];
    const stringNotes: { fret: number; pitchClass: number; noteName: string }[] = [];
    
    for (let fret = 0; fret <= 14; fret++) {
      const noteName = getNoteAt(baseNote, fret);
      const pc = getPitchClass(noteName);
      if (targetPitchClasses.includes(pc)) {
        stringNotes.push({ fret, pitchClass: pc, noteName });
      }
    }
    notesOnStrings.push(stringNotes);
  }

  const results: VoicingShape[] = [];
  const req = getRequiredPitchClasses(activeQuality || "major", rootPC);

  // Instanciar o estado de busca recursiva
  const context: SearchContext = {
    currentString: 0,
    frets: Array(tuning.length).fill(null),
    pitchClasses: Array(tuning.length).fill(null),
    lowestFret: Infinity,
    highestFret: -Infinity,
    mutedCount: 0,
    visitedNodes: 0
  };

  const currentNotes: string[] = Array(tuning.length).fill("x");

  function search(stringIdx: number, frettedCount: number) {
    context.visitedNodes++;
    if (frettedCount > 4) return;

    if (!isWithinAnatomicalStretch(context.lowestFret, context.highestFret)) {
      return;
    }

    if (stringIdx === tuning.length) {
      const activeCount = context.frets.filter(f => f !== null).length;
      if (activeCount < 3) return;

      if (!isPhysicalReachValid(context.frets)) return;

      const currentFretting = [...context.frets];
      const coveredPCs = new Set(context.pitchClasses.filter((pc): pc is number => pc !== null));

      const mandatoryPCs = forceRequiredPCs || req.core;
      for (const corePC of mandatoryPCs) {
        if (!coveredPCs.has(corePC)) return;
      }

      // Validar baixo físico obrigatório (se especificado na cifra)
      let minMidi = Infinity;
      let physicalBassPC = -1;
      let physicalBassName = "";
      let physicalSopranoName = "";
      let maxMidi = -Infinity;

      for (let idx = 0; idx < tuning.length; idx++) {
        const fret = currentFretting[idx];
        if (fret !== null && currentNotes[idx] !== "x") {
          const midi = noteToMidi(currentNotes[idx]);
          if (midi < minMidi) {
            minMidi = midi;
            physicalBassPC = context.pitchClasses[idx]!;
            physicalBassName = currentNotes[idx];
          }
          if (midi > maxMidi) {
            maxMidi = midi;
            physicalSopranoName = currentNotes[idx];
          }
        }
      }

      if (bassPC !== null && physicalBassPC !== bassPC) return;

      // Filtro ergonômico mecânico de abafamento
      if (!hasValidMutedGaps(currentFretting)) return;

      // Calcular o score utilizando o motor de pontuação semântico explicável
      const roles = analyzeVoiceRoles(currentFretting, tuning, chordRoot, activeQuality);
      const classification = classifyVoicing(currentFretting, tuning, roles, chordRoot, activeQuality);
      
      const acoustics: VoicingAcoustics = {
        physicalBass: physicalBassName.replace(/\d/, ""),
        physicalSoprano: physicalSopranoName.replace(/\d/, "")
      };

      const breakdown = scoreVoicing(roles, classification, acoustics, activeQuality || "major", rootPC, targetPitchClasses, bassPC);

      let rootStringIdx = -1;
      for (let idx = 0; idx < tuning.length; idx++) {
        if (currentFretting[idx] !== null && context.pitchClasses[idx] === rootPC) {
          rootStringIdx = idx;
          break;
        }
      }
      if (rootStringIdx === -1) {
        rootStringIdx = currentFretting.findIndex(f => f !== null);
      }

      const positionFret = context.highestFret !== -Infinity ? context.lowestFret : 0;
      const cageShape = classifyCAGED(currentFretting, rootStringIdx);
      const isDuplicate = results.some(r => r.frets.every((val, index) => val === currentFretting[index]));
      
      if (!isDuplicate) {
        results.push({
          chordName,
          frets: currentFretting,
          rootString: rootStringIdx,
          cageShape,
          positionFret,
          notes: [...currentNotes],
          qualityScore: breakdown.total,
          shapeFamily: identifyShapeFamily(currentFretting)
        });
      }
      return;
    }

    // Opção A: Mutar corda
    context.frets[stringIdx] = null;
    currentNotes[stringIdx] = "x";
    context.pitchClasses[stringIdx] = null;
    search(stringIdx + 1, frettedCount);

    // Opção B: Tocar nota
    const candidates = notesOnStrings[stringIdx];
    const prevMin = context.lowestFret;
    const prevMax = context.highestFret;

    for (const c of candidates) {
      context.frets[stringIdx] = c.fret;
      currentNotes[stringIdx] = c.noteName;
      context.pitchClasses[stringIdx] = c.pitchClass;

      if (c.fret === 0) {
        search(stringIdx + 1, frettedCount);
      } else {
        context.lowestFret = Math.min(prevMin, c.fret);
        context.highestFret = Math.max(prevMax, c.fret);
        search(stringIdx + 1, frettedCount + 1);
      }
    }

    // Restaurar estado
    context.lowestFret = prevMin;
    context.highestFret = prevMax;
  }

  search(0, 0);

  const finalResults = results
    .sort((a, b) => {
      const scoreA = a.qualityScore || 0;
      const scoreB = b.qualityScore || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      if (a.positionFret !== b.positionFret) return a.positionFret - b.positionFret;
      const aCount = a.frets.filter(f => f !== null).length;
      const bCount = b.frets.filter(f => f !== null).length;
      return bCount - aCount;
    })
    .slice(0, 60);

  voicingCache.set(cacheKey, finalResults);
  return finalResults;
}
