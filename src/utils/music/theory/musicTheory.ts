import { Note as TonalNote, Scale as TonalScale, Interval as TonalInterval } from "tonal";
import { simplifyNote } from "../core/pitch";
import type { ChordQuality } from "../constants/chordRegistry";
import { CHORD_REGISTRY } from "../constants/chordRegistry";
import type { ChordCandidate } from "../../../store/useChordStore";

export interface ScaleInfo {
  name: string;
  type: string;
  intervals: string[];
  notes: string[];
}

export interface ProgressionTemplate {
  name: string;
  romanNumerals: string[];
  description: string;
  degrees: number[];
}

export const COMMON_PROGRESSIONS: ProgressionTemplate[] = [
  {
    name: "ii - V - I (Jazz)",
    romanNumerals: ["ii", "V", "I"],
    description: "A cadência mais famosa do Jazz e Bossa Nova, resolvendo na tônica.",
    degrees: [2, 5, 1]
  },
  {
    name: "I - vi - ii - V (Pop/Jazz)",
    romanNumerals: ["I", "vi", "ii", "V"],
    description: "Progressão circular clássica usada em centenas de clássicos dos anos 50 e jazz standard.",
    degrees: [1, 6, 2, 5]
  },
  {
    name: "I - V - vi - IV (Pop Standard)",
    romanNumerals: ["I", "V", "vi", "IV"],
    description: "A progressão pop mais famosa do mundo (ex: Let It Be, No Woman No Cry).",
    degrees: [1, 5, 6, 4]
  },
  {
    name: "i - bVI - bIII - bVII (Rock/Epic)",
    romanNumerals: ["i", "VI", "III", "VII"],
    description: "Progressão menor muito comum no Rock e trilhas épicas (ex: Zombie).",
    degrees: [1, 6, 3, 7]
  },
  {
    name: "ii - bII7 - I (Tritone Sub)",
    romanNumerals: ["ii", "subV", "I"],
    description: "Substituição de trítono clássica do acorde dominante (V) por um bII7.",
    degrees: [2, 2, 1]
  }
];

export const SCALE_CATEGORIES = {
  greek: [
    { name: "Jônio (Maior)", key: "major" },
    { name: "Dórico", key: "dorian" },
    { name: "Frígio", key: "phrygian" },
    { name: "Lídio", key: "lydian" },
    { name: "Mixolídio", key: "mixolydian" },
    { name: "Eólio (Menor Natural)", key: "aeolian" },
    { name: "Lócrio", key: "locrian" }
  ],
  minorModes: [
    { name: "Menor Harmônica", key: "harmonic minor" },
    { name: "Frígio Dominante (5º grau Harm.)", key: "phrygian dominant" },
    { name: "Menor Melódica", key: "melodic minor" },
    { name: "Lídio Dominante (4º grau Melód.)", key: "lydian dominant" },
    { name: "Escala Alterada (Superlócria)", key: "altered" }
  ],
  symmetrical: [
    { name: "Diminuta Tom/Semitom", key: "diminished" },
    { name: "Diminuta Semitom/Tom", key: "half-whole diminished" },
    { name: "Tons Inteiros (Whole Tone)", key: "augmented" }
  ],
  jazzPop: [
    { name: "Pentatônica Maior", key: "pentatonic" },
    { name: "Pentatônica Menor", key: "minor pentatonic" },
    { name: "Escala de Blues", key: "blues" },
    { name: "Bebop Dominante", key: "bebop" },
    { name: "Bebop Maior", key: "bebop major" }
  ]
};

// Escalas compatíveis com base em qualidade DSL proprietária
export function getCompatibleScales(chord: ChordCandidate): ScaleInfo[] {
  const root = chord.root;
  const quality = chord.quality;
  
  const compatibleTypes: string[] = [];
  
  if (quality === "major" || quality === "major7th" || quality === "major6th" || quality === "major9th" || quality === "major13th") {
    compatibleTypes.push("major", "lydian", "pentatonic", "bebop major");
  } else if (quality === "minor" || quality === "minor7th" || quality === "minor6th" || quality === "minor9th" || quality === "minor11th" || quality === "minor13th") {
    compatibleTypes.push("dorian", "aeolian", "phrygian", "minor pentatonic", "blues", "melodic minor");
  } else if (quality === "dominant7th" || quality === "dominant9th" || quality === "dominant11th" || quality === "dominant13th" || quality === "dominant7sus4") {
    compatibleTypes.push("mixolydian", "blues", "bebop", "phrygian dominant", "altered", "lydian dominant");
  } else if (quality === "halfDiminished") {
    compatibleTypes.push("locrian", "half-whole diminished");
  } else if (quality === "diminished" || quality === "diminished7th") {
    compatibleTypes.push("diminished", "locrian");
  } else {
    compatibleTypes.push("major", "minor pentatonic");
  }

  const results: ScaleInfo[] = [];

  compatibleTypes.forEach(scaleType => {
    const scale = TonalScale.get(`${root} ${scaleType}`);
    if (!scale.empty) {
      const rawName = scale.name || scaleType;
      const startsWithRoot = rawName.toLowerCase().startsWith(`${root.toLowerCase()} `) || rawName.toLowerCase() === root.toLowerCase();
      const displayName = startsWithRoot ? rawName : `${root} ${rawName}`;

      results.push({
        name: displayName,
        type: scaleType,
        intervals: scale.intervals,
        notes: scale.notes.map(n => simplifyNote(n))
      });
    }
  });

  return results;
}

export function getDiatonicChords(keyRoot: string, isMajor: boolean = true): { degree: string; chord: string }[] {
  const mode = isMajor ? "major" : "minor";
  const scale = TonalScale.get(`${keyRoot} ${mode}`);
  if (scale.empty) return [];

  const degrees = isMajor 
    ? ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
    : ["i", "ii°", "bIII", "iv", "v", "bVI", "bVII"];
    
  const suffixes = isMajor
    ? ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"]
    : ["m7", "m7b5", "maj7", "m7", "m7", "maj7", "7"];

  return scale.notes.map((note, index) => {
    const simplifiedNote = simplifyNote(note);
    const suffix = suffixes[index] || "";
    return {
      degree: degrees[index] || `${index + 1}`,
      chord: `${simplifiedNote}${suffix}`
    };
  });
}

export function getNotesForChord(root: string, type: string): string[] {
  const chordDef = CHORD_REGISTRY[type as ChordQuality];
  if (!chordDef) return [];
  return chordDef.semitones.map(s => {
    return simplifyNote(TonalNote.transpose(root, TonalInterval.fromSemitones(s))).replace(/\d/, "");
  });
}
