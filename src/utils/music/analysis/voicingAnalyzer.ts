import { getNoteAt, getOctave } from "../core/notes";
import { getPitchClass } from "../core/pitch";
import { getPhysicalBassInfo, getPhysicalSopranoInfo } from "../core/physicalVoice";
import type { VoiceRoleAnalysis, VoiceRole, HarmonicRole, TensionPresence, VoiceRoleInfo } from "../models/VoiceRoleAnalysis";
import { analyzeChords } from "./chordAnalyzer";
import type { FretPosition } from "../models/FretPosition";
import { parseChord } from "../theory/chordParser";

// Mapeia a distância em semitônios para a função harmônica correspondente
export function getHarmonicRole(interval: number, quality: string): HarmonicRole {
  if (interval === 0) return "root";
  if (interval === 3 || interval === 4) return "third";
  
  // Tratar quintas de acordo com a qualidade do acorde
  const isDiminished = quality === "diminished" || quality === "halfDiminished" || quality === "diminished7th";
  const isAugmented = quality === "augmented";
  if (isDiminished && interval === 6) return "fifth";
  if (isAugmented && interval === 8) return "fifth";
  if (!isDiminished && !isAugmented && interval === 7) return "fifth";

  // Tratar sétimas e sextas estruturais
  const isSixthChord = quality === "major6th" || quality === "minor6th" || quality === "69";
  if (isSixthChord && interval === 9) return "seventh";
  if (interval === 10 || interval === 11) return "seventh";

  // Outros intervalos são considerados extensões/tensões
  if (interval === 1 || interval === 2 || interval === 5 || interval === 6 || interval === 8 || interval === 9) {
    return "tension";
  }

  return "none";
}

export function getVoiceRoleInfo(interval: number, quality: string): VoiceRoleInfo {
  const role = getHarmonicRole(interval, quality);
  if (role === "root" || role === "none") return { role };

  if (role === "third") {
    if (interval === 3) return { role, degree: 3, alteration: "b" };
    return { role, degree: 3, alteration: null };
  }
  if (role === "fifth") {
    if (interval === 6) return { role, degree: 5, alteration: "b" };
    if (interval === 8) return { role, degree: 5, alteration: "#" };
    return { role, degree: 5, alteration: null };
  }
  if (role === "seventh") {
    const isSixthChord = quality === "major6th" || quality === "minor6th" || quality === "69";
    if (isSixthChord && interval === 9) return { role, degree: 6, alteration: null };
    if (quality === "diminished7th" && interval === 9) return { role, degree: 7, alteration: "bb" };
    if (interval === 10) return { role, degree: 7, alteration: "b" };
    if (interval === 11) return { role, degree: 7, alteration: null };
    return { role, degree: 7, alteration: "b" };
  }
  if (role === "tension") {
    if (interval === 1) return { role, degree: 9, alteration: "b" };
    if (interval === 2) return { role, degree: 9, alteration: null };
    if (interval === 5) return { role, degree: 11, alteration: null };
    if (interval === 6) return { role, degree: 11, alteration: "#" };
    if (interval === 8) return { role, degree: 13, alteration: "b" };
    if (interval === 9) return { role, degree: 13, alteration: null };
  }
  return { role };
}

export function analyzeVoiceRoles(
  frets: (number | null)[],
  tuning: string[],
  chordRoot?: string,
  quality?: string
): VoiceRoleAnalysis {
  let physicalVoices = 0;
  const activePositions: FretPosition[] = [];
  
  // 1. Coletar posições de trastes que estão ativas
  frets.forEach((fret, stringIdx) => {
    if (fret !== null) {
      physicalVoices++;
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

  // 2. Determinar a tônica e a qualidade de referência
  let activeRoot = chordRoot || "";
  let activeQuality = quality || "major";

  if (chordRoot && (chordRoot.includes("/") || chordRoot.length > 2 || !/^[A-G][b#]?$/.test(chordRoot))) {
    const parsed = parseChord(chordRoot);
    if (!parsed.empty) {
      activeRoot = parsed.root;
      activeQuality = parsed.quality;
    }
  }

  if (!activeRoot && activePositions.length > 0) {
    const candidates = analyzeChords(activePositions);
    if (candidates.length > 0) {
      activeRoot = candidates[0].root;
      activeQuality = candidates[0].quality;
    } else {
      // Fallback
      const bassFret = activePositions.reduce((lowest, curr) => {
        const lowestFreq = lowest.octave * 12 + lowest.pitchClass;
        const currFreq = curr.octave * 12 + curr.pitchClass;
        return currFreq < lowestFreq ? curr : lowest;
      });
      activeRoot = bassFret.noteName.replace(/\d/, "");
    }
  }

  const rootPC = getPitchClass(activeRoot);

  // 3. Mapear cada nota ativada para uma VoiceRole
  const voices: VoiceRole[] = activePositions.map(pos => {
    const midi = pos.octave * 12 + pos.pitchClass;
    const interval = (pos.pitchClass - rootPC + 12) % 12;
    return {
      stringIndex: pos.stringIndex,
      pitch: midi,
      pitchClass: pos.pitchClass,
      noteName: pos.noteName,
      role: getHarmonicRole(interval, activeQuality)
    };
  });

  // 4. Identificar baixo e soprano físicos
  const bassInfo = getPhysicalBassInfo(frets, tuning);
  const sopranoInfo = getPhysicalSopranoInfo(frets, tuning);

  let bassStrIdx = -1;
  let sopranoStrIdx = -1;
  voices.forEach(v => {
    if (v.pitch === bassInfo.midi) bassStrIdx = v.stringIndex;
    if (v.pitch === sopranoInfo.midi) sopranoStrIdx = v.stringIndex;
  });

  const bassVoiceRole = voices.find(v => v.stringIndex === bassStrIdx) || {
    stringIndex: bassStrIdx !== -1 ? bassStrIdx : 0,
    pitch: bassInfo.midi,
    pitchClass: bassInfo.pc,
    noteName: bassInfo.name,
    role: getHarmonicRole((bassInfo.pc - rootPC + 12) % 12, activeQuality)
  };

  const sopranoVoiceRole = voices.find(v => v.stringIndex === sopranoStrIdx) || {
    stringIndex: sopranoStrIdx !== -1 ? sopranoStrIdx : 5,
    pitch: sopranoInfo.midi,
    pitchClass: sopranoInfo.pc,
    noteName: sopranoInfo.name,
    role: getHarmonicRole((sopranoInfo.pc - rootPC + 12) % 12, activeQuality)
  };

  // 5. Mapear graus estruturais presentes/omitidos
  const uniquePCs = new Set(voices.map(v => v.pitchClass));
  const rootPresent = uniquePCs.has(rootPC);
  
  // Terça
  const thirdPC = (rootPC + (activeQuality.includes("minor") || activeQuality === "halfDiminished" || activeQuality === "diminished7th" ? 3 : 4)) % 12;
  const thirdPresent = uniquePCs.has(thirdPC);

  // Quinta
  const isDiminished = activeQuality === "diminished" || activeQuality === "halfDiminished" || activeQuality === "diminished7th";
  const isAugmented = activeQuality === "augmented";
  const fifthPC = (rootPC + (isDiminished ? 6 : isAugmented ? 8 : 7)) % 12;
  const fifthPresent = uniquePCs.has(fifthPC);

  // Sétima / Sexta
  let seventhPC = (rootPC + 10) % 12; // default minor 7th
  if (activeQuality.includes("major7") || activeQuality === "minorMajor7th" || activeQuality === "major9th" || activeQuality === "major13th" || activeQuality === "major7#11") {
    seventhPC = (rootPC + 11) % 12;
  } else if (activeQuality === "diminished7th") {
    seventhPC = (rootPC + 9) % 12;
  } else if (activeQuality === "major6th" || activeQuality === "minor6th" || activeQuality === "69") {
    seventhPC = (rootPC + 9) % 12;
  }
  
  const hasSeventhInFormula = activeQuality !== "major" && activeQuality !== "minor" && activeQuality !== "power" && activeQuality !== "sus4" && activeQuality !== "sus2" && activeQuality !== "add9" && activeQuality !== "minorAdd9";
  const seventhPresent = hasSeventhInFormula ? uniquePCs.has(seventhPC) : false;

  // 6. Mapear tensões (9, 11, 13)
  const tensions: TensionPresence[] = [
    { degree: 9, pitchClass: (rootPC + 2) % 12, state: "omitted" },
    { degree: 11, pitchClass: (rootPC + (activeQuality.includes("#11") ? 6 : 5)) % 12, state: "omitted" },
    { degree: 13, pitchClass: (rootPC + (activeQuality.includes("b13") ? 8 : 9)) % 12, state: "omitted" }
  ];
  
  tensions.forEach(t => {
    if (uniquePCs.has(t.pitchClass)) {
      t.state = "present";
    }
  });

  // 7. Mapear duplicações e omissões gerais
  const omittedRoles: HarmonicRole[] = [];
  const duplicatedRoles: HarmonicRole[] = [];

  if (!rootPresent) omittedRoles.push("root");
  if (!thirdPresent) omittedRoles.push("third");
  if (!fifthPresent) omittedRoles.push("fifth");
  if (hasSeventhInFormula && !seventhPresent) omittedRoles.push("seventh");

  const roleCounts: Record<HarmonicRole, number> = {
    root: 0,
    third: 0,
    fifth: 0,
    seventh: 0,
    tension: 0,
    none: 0
  };

  voices.forEach(v => {
    roleCounts[v.role]++;
  });

  (Object.keys(roleCounts) as HarmonicRole[]).forEach(role => {
    if (role !== "none" && roleCounts[role] > 1) {
      duplicatedRoles.push(role);
    }
  });

  const voiceRoleMap: (VoiceRoleInfo | null)[] = Array(tuning.length).fill(null);
  voices.forEach(v => {
    const vInterval = (v.pitchClass - rootPC + 12) % 12;
    const info = getVoiceRoleInfo(vInterval, activeQuality);
    v.info = info;
    voiceRoleMap[v.stringIndex] = info;
  });

  const orderedVoiceRoles: VoiceRoleInfo[] = [...voices]
    .sort((a, b) => a.pitch - b.pitch)
    .map(v => v.info || { role: v.role });

  const effectiveVoices = uniquePCs.size;

  return {
    voiceRoleMap,
    orderedVoiceRoles,
    bassRole: bassVoiceRole.role,
    sopranoRole: sopranoVoiceRole.role,
    root: rootPresent ? "present" : "omitted",
    third: thirdPresent ? "present" : "omitted",
    fifth: fifthPresent ? "present" : "omitted",
    seventh: seventhPresent ? "present" : "omitted",
    tensions,
    duplicatedRoles,
    omittedRoles,
    physicalVoices,
    effectiveVoices,
    voiceCount: physicalVoices,
    voices
  };
}
