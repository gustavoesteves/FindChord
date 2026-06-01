import { getPitchClass } from "../core/pitch";
import { getNoteAt } from "../core/notes";
import { noteToMidi } from "../core/midi";
import type { CageShape, VoicingShape } from "../models/VoicingShape";
import { scoreVoicingQuality } from "../scoring/voicingScorer";
import { SCORING_WEIGHTS } from "../constants/scoringWeights";

/**
 * Mapeia os graus estruturais de Nível 1 (Críticos) e Nível 2 (Preferenciais) de um acorde
 */
export function getRequiredPitchClasses(quality: string, rootPC: number): { core: number[]; preferred: number[] } {
  const core: number[] = [];
  const preferred: number[] = [rootPC]; // A tônica é preferencial (Nível 2)

  if (quality.startsWith("major7") || quality === "major9th" || quality === "major13th" || quality === "major7#11") {
    core.push((rootPC + 4) % 12);  // Terça Maior (Nível 1)
    core.push((rootPC + 11) % 12); // Sétima Maior (Nível 1)
  } else if (quality.startsWith("minor7") || quality === "minor9th" || quality === "minor11th" || quality === "minor13th") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
    core.push((rootPC + 10) % 12); // Sétima menor (Nível 1)
  } else if (quality.startsWith("dominant7") || quality === "dominant9th" || quality === "dominant11th" || quality === "dominant13th" || quality === "dominant7b9" || quality === "dominant7#9" || quality === "dominant7#11" || quality === "dominant7b13") {
    core.push((rootPC + 4) % 12);  // Terça Maior (Nível 1)
    core.push((rootPC + 10) % 12); // Sétima menor (Nível 1)
  } else if (quality === "halfDiminished") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
    core.push((rootPC + 6) % 12);  // Quinta diminuta (Nível 1)
    core.push((rootPC + 10) % 12); // Sétima menor (Nível 1)
  } else if (quality === "diminished7th") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
    core.push((rootPC + 6) % 12);  // Quinta diminuta (Nível 1)
    core.push((rootPC + 9) % 12);  // Sétima diminuta (Nível 1)
  } else if (quality === "major6th" || quality === "69") {
    core.push((rootPC + 4) % 12);  // Terça Maior (Nível 1)
    core.push((rootPC + 9) % 12);  // Sexta Maior (Nível 1)
  } else if (quality === "minor6th") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
    core.push((rootPC + 9) % 12);  // Sexta Maior (Nível 1)
  } else if (quality === "major" || quality === "add9") {
    core.push((rootPC + 4) % 12);  // Terça Maior (Nível 1)
  } else if (quality === "minor" || quality === "minorAdd9") {
    core.push((rootPC + 3) % 12);  // Terça menor (Nível 1)
  }

  // 2. Adicionar Extensões Característica Mandatórias no Core
  if (quality.includes("9th") || quality === "add9" || quality === "minorAdd9" || quality === "69") {
    core.push((rootPC + 2) % 12);  // Nona (Nível 1 Crítico para acordes de 9ª)
  }
  if (quality.includes("11th") || quality === "major7#11" || quality === "dominant7#11") {
    const isSharp11 = quality.includes("#11");
    core.push((rootPC + (isSharp11 ? 6 : 5)) % 12); // 11ª / #11ª (Nível 1 Crítico para acordes de 11ª)
  }
  if (quality.includes("13th") || quality === "dominant7b13") {
    const isFlat13 = quality.includes("b13");
    core.push((rootPC + (isFlat13 ? 8 : 9)) % 12); // 13ª / b13ª (Nível 1 Crítico para acordes de 13ª)
  }

  return { core, preferred };
}

/**
 * Classifica um voicing dinâmico no formato CAGED
 */
export function classifyCAGED(frets: (number | null)[], rootString: number): CageShape {
  if (rootString === 0) { // 6ª corda
    const rootFret = frets[0] || 0;
    const thirdFret = frets[2] || 0;
    return thirdFret > rootFret ? "G" : "E";
  } else if (rootString === 1) { // 5ª corda
    const rootFret = frets[1] || 0;
    const highFret = frets[4] || 0;
    return highFret < rootFret ? "C" : "A";
  } else if (rootString === 2) { // 4ª corda
    return "D";
  }
  
  const minFret = Math.min(...(frets.filter(f => f !== null && f > 0) as number[]));
  const shapes: CageShape[] = ["E", "A", "C", "D", "G"];
  return shapes[minFret % 5];
}

export function identifyShapeFamily(frets: (number | null)[]): string {
  const relativeFrets: (number | string)[] = [];
  let baseFret = -1;
  for (let idx = 5; idx >= 0; idx--) { // Da corda mais grave para a mais aguda
    const f = frets[idx];
    if (f !== null) {
      if (baseFret === -1) {
        baseFret = f;
      }
      relativeFrets.push(f - baseFret);
    } else {
      relativeFrets.push("x");
    }
  }

  const relativePattern = relativeFrets.join(",");
  const cleanRelative = relativePattern
    .replace(/^(x,)+/, "")
    .replace(/(,x)+$/, "");

  if (cleanRelative === "0,2,0,1" || cleanRelative === "0,2,1,2" || cleanRelative === "0,2,1,1") {
    return "Drop 2";
  }
  if (cleanRelative === "0,x,0,0,1" || cleanRelative === "0,x,1,1,0" || cleanRelative === "0,x,1,0,0" || cleanRelative === "0,x,0,0,0") {
    return "Drop 3";
  }
  if (["0,2,2,0,0,0", "0,2,2,1,0,0", "0,2,2,0,2,0", "0,2,2,1,2,0", "0,2,2,1,3,0"].includes(cleanRelative)) {
    return "CAGED (E-Shape)";
  }
  if (["0,2,2,1,0", "0,2,2,2,0", "0,2,0,1,0", "0,2,1,2,0", "0,2,0,2,0"].includes(cleanRelative)) {
    return "CAGED (A-Shape)";
  }
  if (cleanRelative === "0,2,1,2" || cleanRelative === "0,2,2,2") {
    return "D-Shape";
  }

  return "Formato Livre";
}

// Cache global
const VOICING_CACHE = new Map<string, VoicingShape[]>();

export function clearVoicingCache() {
  VOICING_CACHE.clear();
}

/**
 * Algoritmo dinâmico de geração de voicings matematicamente executáveis
 */
export function generateVoicings(
  chordName: string,
  chordRoot: string,
  targetPitchClasses: number[],
  tuning: string[],
  quality?: string
): VoicingShape[] {
  if (targetPitchClasses.length === 0) return [];

  let activeQuality = quality;
  if (!activeQuality) {
    const cleanSym = chordName.replace(/\/[A-G][b#]?$/, "").replace(/^[A-G][b#]?/, "").trim();
    if (cleanSym === "maj7" || cleanSym === "7M") activeQuality = "major7th";
    else if (cleanSym === "m7" || cleanSym === "-7") activeQuality = "minor7th";
    else if (cleanSym === "7") activeQuality = "dominant7th";
    else if (cleanSym === "m7b5" || cleanSym === "ø7") activeQuality = "halfDiminished";
    else if (cleanSym === "dim7" || cleanSym === "o7") activeQuality = "diminished7th";
    else if (cleanSym === "6") activeQuality = "major6th";
    else if (cleanSym === "m6") activeQuality = "minor6th";
    else if (cleanSym === "add9") activeQuality = "add9";
    else if (cleanSym === "madd9") activeQuality = "minorAdd9";
    else if (cleanSym === "69") activeQuality = "69";
    else if (cleanSym === "") activeQuality = "major";
    else if (cleanSym === "m") activeQuality = "minor";
    else activeQuality = "major7th";
  }

  const cacheKey = `${chordName}-${targetPitchClasses.join(",")}-${tuning.join(",")}`;
  if (VOICING_CACHE.has(cacheKey)) {
    return VOICING_CACHE.get(cacheKey)!;
  }

  const rootPC = getPitchClass(chordRoot);
  const results: VoicingShape[] = [];

  let bassPC: number | null = null;
  if (chordName.includes("/")) {
    const parts = chordName.split("/");
    const bassName = parts[parts.length - 1].trim();
    if (bassName) {
      bassPC = getPitchClass(bassName);
    }
  }

  const notesOnStrings: { fret: number; pitchClass: number; noteName: string }[][] = [];

  for (let stringIdx = 0; stringIdx < 6; stringIdx++) {
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

  const currentFretting: (number | null)[] = Array(6).fill(null);
  const currentNotes: string[] = Array(6).fill("");
  const currentPitchClasses: (number | null)[] = Array(6).fill(null);

  function search(
    stringIdx: number,
    frettedMin: number,
    frettedMax: number,
    frettedCount: number
  ) {
    if (frettedCount > 4) return;

    if (frettedMin !== Infinity && frettedMax !== -Infinity && (frettedMax - frettedMin) > 4) {
      return;
    }

    if (stringIdx === 6) {
      const activeFrets = currentFretting.filter(f => f !== null) as number[];
      if (activeFrets.length < 3) return;

      for (let s_low = 0; s_low < 6; s_low++) {
        const f_low = currentFretting[s_low];
        if (f_low === null || f_low === 0) continue;

        for (let s_high = 0; s_high < s_low; s_high++) {
          const f_high = currentFretting[s_high];
          if (f_high === null || f_high === 0) continue;

          if (s_low - s_high <= 2) {
            if (f_low - f_high > 2) {
              return;
            }
          }
        }
      }

      let minMidi = Infinity;
      let physicalBassPC = -1;
      for (let idx = 0; idx < 6; idx++) {
        if (currentFretting[idx] !== null && currentNotes[idx] !== "x") {
          const midi = noteToMidi(currentNotes[idx]);
          if (midi < minMidi) {
            minMidi = midi;
            physicalBassPC = currentPitchClasses[idx]!;
          }
        }
      }

      let bassScore = SCORING_WEIGHTS.bassRootPositionScore;
      if (bassPC !== null) {
        if (physicalBassPC !== bassPC) return;
      } else {
        const dist = (physicalBassPC - rootPC + 12) % 12;
        if (dist === 0) {
          bassScore = SCORING_WEIGHTS.bassRootPositionScore;
        } else if (dist === 3 || dist === 4) {
          bassScore = SCORING_WEIGHTS.bassFirstInversionScore;
        } else if (dist === 7 || dist === 8 || dist === 6) {
          bassScore = SCORING_WEIGHTS.bassSecondInversionScore;
        } else if (dist === 10 || dist === 11 || dist === 9) {
          bassScore = SCORING_WEIGHTS.bassThirdInversionScore;
        } else {
          bassScore = SCORING_WEIGHTS.bassExoticInversionPenalty;
        }
      }

      const coveredPCs = new Set<number>();
      for (let idx = 0; idx < 6; idx++) {
        const pc = currentPitchClasses[idx];
        if (pc !== null) {
          coveredPCs.add(pc);
        }
      }

      const req = getRequiredPitchClasses(activeQuality || "major", rootPC);

      for (const corePC of req.core) {
        if (!coveredPCs.has(corePC)) {
          return;
        }
      }

      let rootlessPenalty = 0;
      for (const prefPC of req.preferred) {
        if (!coveredPCs.has(prefPC)) {
          rootlessPenalty = SCORING_WEIGHTS.rootlessPenalty;
        }
      }

      let essentialMissingCount = 0;
      const isFifthAltered = activeQuality === "halfDiminished" || activeQuality === "diminished7th" || activeQuality === "augmented";
      const fifthPC = isFifthAltered ? (rootPC + 6) % 12 : (rootPC + 7) % 12;
      const ninthPC = (rootPC + 2) % 12;
      const eleventhPC = (rootPC + 5) % 12;

      const missingPCs = targetPitchClasses.filter(tPC => !coveredPCs.has(tPC));
      
      missingPCs.forEach(mPC => {
        const isOptionalFifth = mPC === fifthPC && !isFifthAltered;
        const isOptionalNinth = mPC === ninthPC && activeQuality && (activeQuality.includes("11") || activeQuality.includes("13"));
        const isOptionalEleventh = mPC === eleventhPC && activeQuality && activeQuality.includes("13");
        
        if (!isOptionalFifth && !isOptionalNinth && !isOptionalEleventh) {
          essentialMissingCount++;
        }
      });

      let completenessBonus: number;
      if (missingPCs.length === 0) {
        completenessBonus = SCORING_WEIGHTS.completeVoicingBonus;
      } else if (essentialMissingCount === 0) {
        completenessBonus = SCORING_WEIGHTS.guitarFriendlyOmissionBonus;
      } else {
        completenessBonus = SCORING_WEIGHTS.importantOmissionPenalty * essentialMissingCount;
      }

      let firstPlayed = -1;
      let lastPlayed = -1;
      for (let idx = 0; idx < 6; idx++) {
        if (currentFretting[idx] !== null) {
          if (firstPlayed === -1) firstPlayed = idx;
          lastPlayed = idx;
        }
      }

      let mutedGapCount = 0;
      for (let i = firstPlayed; i <= lastPlayed; i++) {
        if (currentFretting[i] === null) {
          mutedGapCount++;
        }
      }
      if (mutedGapCount > 2) return;

      const pcCounts = new Map<number, number>();
      for (let idx = 0; idx < 6; idx++) {
        const pc = currentPitchClasses[idx];
        if (pc !== null) {
          pcCounts.set(pc, (pcCounts.get(pc) || 0) + 1);
        }
      }

      const isMinor = activeQuality ? (
        activeQuality.startsWith("minor") || 
        activeQuality === "minor7th" || 
        activeQuality === "minor9th" || 
        activeQuality === "minor11th" || 
        activeQuality === "minor13th" || 
        activeQuality === "halfDiminished" || 
        activeQuality === "diminished7th" || 
        activeQuality === "minor6th" || 
        activeQuality === "minorAdd9" || 
        activeQuality === "minorMajor7th"
      ) : false;
      
      const thirdPC = isMinor ? (rootPC + 3) % 12 : (rootPC + 4) % 12;
      
      let seventhPC = -1;
      if (activeQuality) {
        if (activeQuality.startsWith("major7") || activeQuality === "major9th" || activeQuality === "major13th" || activeQuality === "major7#11" || activeQuality === "minorMajor7th") {
          seventhPC = (rootPC + 11) % 12;
        } else if (activeQuality.startsWith("minor7") || activeQuality === "minor9th" || activeQuality === "minor11th" || activeQuality === "minor13th" || activeQuality.startsWith("dominant") || activeQuality === "halfDiminished") {
          seventhPC = (rootPC + 10) % 12;
        } else if (activeQuality === "diminished7th" || activeQuality === "major6th" || activeQuality === "minor6th" || activeQuality === "69") {
          seventhPC = (rootPC + 9) % 12;
        }
      }

      let duplicationPenalty = 0;
      pcCounts.forEach((count, pc) => {
        if (count > 1) {
          const dupTimes = count - 1;
          if (pc === thirdPC) {
            duplicationPenalty += dupTimes * SCORING_WEIGHTS.duplicatedThird;
          } else if (pc === seventhPC && seventhPC !== -1) {
            duplicationPenalty += dupTimes * SCORING_WEIGHTS.duplicatedSeventhOrSix;
          } else if (pc === fifthPC) {
            duplicationPenalty += dupTimes * SCORING_WEIGHTS.duplicatedFifth;
          } else if (pc === rootPC) {
            // Tônica duplicada recomendada
          } else {
            duplicationPenalty += dupTimes * SCORING_WEIGHTS.duplicatedExtension;
          }
        }
      });

      let rootStringIdx = -1;
      for (let idx = 0; idx < 6; idx++) {
        if (currentFretting[idx] !== null && currentPitchClasses[idx] === rootPC) {
          rootStringIdx = idx;
          break;
        }
      }

      if (rootStringIdx === -1) rootStringIdx = firstPlayed;

      const positionFret = frettedMax !== -Infinity ? frettedMin : 0;
      const cageShape = classifyCAGED(currentFretting, rootStringIdx);

      const isDuplicate = results.some(r => r.frets.every((val, index) => val === currentFretting[index]));
      
      if (!isDuplicate) {
        const baseScore = scoreVoicingQuality(currentFretting, currentNotes);
        const qualityScore = baseScore + rootlessPenalty + completenessBonus + bassScore + duplicationPenalty;
        const shapeFamily = identifyShapeFamily(currentFretting);
        results.push({
          chordName,
          frets: [...currentFretting],
          rootString: rootStringIdx,
          cageShape,
          positionFret,
          notes: [...currentNotes],
          qualityScore,
          shapeFamily
        });
      }
      return;
    }

    currentFretting[stringIdx] = null;
    currentNotes[stringIdx] = "x";
    currentPitchClasses[stringIdx] = null;
    search(stringIdx + 1, frettedMin, frettedMax, frettedCount);

    const candidates = notesOnStrings[stringIdx];
    for (const c of candidates) {
      currentFretting[stringIdx] = c.fret;
      currentNotes[stringIdx] = c.noteName;
      currentPitchClasses[stringIdx] = c.pitchClass;

      if (c.fret === 0) {
        search(stringIdx + 1, frettedMin, frettedMax, frettedCount);
      } else {
        const nextMin = Math.min(frettedMin, c.fret);
        const nextMax = Math.max(frettedMax, c.fret);
        search(stringIdx + 1, nextMin, nextMax, frettedCount + 1);
      }
    }
  }

  search(0, Infinity, -Infinity, 0);

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

  VOICING_CACHE.set(cacheKey, finalResults);
  return finalResults;
}
