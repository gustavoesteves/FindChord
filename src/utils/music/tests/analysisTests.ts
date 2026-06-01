import { getPitchClass } from "../core/pitch";
import { getNoteAt, getOctave } from "../core/notes";
import { analyzeChords } from "../analysis/chordAnalyzer";
import { analyzeVoiceRoles } from "../analysis/voicingAnalyzer";
import { classifyVoicing } from "../analysis/voicingClassifier";
import { enarmonizeChordCandidate } from "../theory/enharmonics";
import type { FretPosition, ChordCandidate } from "../../../store/useChordStore";

console.log("=============================================");
console.log("INICIANDO TESTES DO DOMÍNIO: analysis / theory");
console.log("=============================================\n");

let passed = true;

const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

// Helper para converter trastes de teste em FretPositions
function createFretPositions(frets: (number | null)[]): FretPosition[] {
  const positions: FretPosition[] = [];
  frets.forEach((fret, idx) => {
    if (fret === null) return;
    const noteName = getNoteAt(tuning[idx], fret);
    positions.push({
      stringIndex: idx,
      fret,
      noteName,
      pitchClass: getPitchClass(noteName),
      octave: getOctave(noteName)
    });
  });
  return positions;
}

// 1. Testar analyzeChords (C/E)
const ceFrets = [0, 1, 0, 2, 3, 0];
const cePositions = createFretPositions(ceFrets);
const ceCandidates = analyzeChords(cePositions);

if (ceCandidates.length === 0 || ceCandidates[0].notationJazz !== "C/E") {
  console.log(`❌ ERRO: analyzeChords falhou para C/E! (foi: ${ceCandidates[0]?.notationJazz})`);
  passed = false;
} else {
  console.log("✅ analyzeChords (C/E): OK");
}

// 2. Testar enarmonização
const ebm7Voicing: ChordCandidate = {
  root: "D#",
  quality: "minor7th",
  intervals: ["1P", "3m", "5P", "7m"],
  notes: ["D#", "F#", "A#", "C#"],
  omissions: [],
  additions: [],
  score: 220,
  confidence: 96,
  notationJazz: "D#m7",
  notationBrazilian: "D#m7",
  notationAcademic: "D#-7",
  isIncomplete: false
};
const enarmonized = enarmonizeChordCandidate(ebm7Voicing, "Ebm7");

if (enarmonized.root !== "Eb" || enarmonized.notationJazz !== "Ebm7") {
  console.log(`❌ ERRO: enarmonizeChordCandidate falhou! (foi: ${enarmonized.notationJazz})`);
  passed = false;
} else {
  console.log("✅ enarmonizeChordCandidate (D#m7 -> Ebm7): OK");
}

// 3. Testar analyzeVoiceRoles
const voiceRoles = analyzeVoiceRoles(ceFrets, tuning, "C", "major");
if (voiceRoles.physicalVoices !== 6 || voiceRoles.bassRole !== "third" || voiceRoles.sopranoRole !== "third") {
  console.log(`❌ ERRO: analyzeVoiceRoles falhou! (Físicas=${voiceRoles.physicalVoices}, BaixoRole=${voiceRoles.bassRole}, SopranoRole=${voiceRoles.sopranoRole})`);
  passed = false;
} else {
  console.log("✅ analyzeVoiceRoles (VoiceRoleAnalysis): OK");
}

// 4. Testar classifyVoicing (C/E)
const classification = classifyVoicing(ceFrets, tuning, voiceRoles, "C", "major");
if (classification.inversionType !== "first" || classification.shellType !== "extended") {
  console.log(`❌ ERRO: classifyVoicing falhou! (Inversão=${classification.inversionType}, Abertura=${classification.shellType})`);
  passed = false;
} else {
  console.log("✅ classifyVoicing (VoicingClassification): OK");
}

if (!passed) {
  throw new Error("Analysis tests failed!");
} else {
  console.log("\n🎉 TODOS OS TESTES DO DOMÍNIO analysis PASSARAM COM SUCESSO!\n");
}
