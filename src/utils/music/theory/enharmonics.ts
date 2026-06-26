import { Note as TonalNote, Interval as TonalInterval } from "tonal";
import { PREFERRED_SPELLINGS, getPitchClass, simplifyNote } from "../core/pitch";
import type { ChordCandidate } from "../../../store/useChordStore";
import type { ChordQuality } from "../constants/chordRegistry";
import { CHORD_REGISTRY } from "../constants/chordRegistry";
import { parseChord } from "./chordParser";

export function correctChordSpelling(chordName: string, root: string): string {
  if (PREFERRED_SPELLINGS[root]) {
    const newRoot = PREFERRED_SPELLINGS[root];
    return chordName.replace(root, newRoot);
  }
  return chordName;
}

// Formatador Limpo e Centralizado de Nomenclatura baseada na DSL
export function formatChordName(
  root: string,
  quality: ChordQuality,
  omissions: string[],
  bass?: string,
  style: "Jazz" | "Brazilian" | "Academic" = "Jazz",
  additions: string[] = []
): string {
  const def = CHORD_REGISTRY[quality];
  if (!def) return `${root}${quality}`;

  let qualityString: string;
  if (style === "Brazilian") {
    qualityString = def.notation.brazilian;
  } else if (style === "Academic") {
    qualityString = def.notation.academic;
  } else {
    qualityString = def.notation.jazz;
  }

  let finalName = `${root}${qualityString}`;

  const additionLabels = additions
    .map(addition => describeAddedTone(root, addition))
    .filter((label): label is string => Boolean(label));
  const explicitOmissions = omissions
    .filter(omission => (
      omission === "1" ||
      omission === "3" ||
      omission === "b3"
    ))
    .map(omission => `no${omission}`);
  const qualifiers = [...explicitOmissions, ...additionLabels];

  if (qualifiers.length > 0) {
    finalName = `${finalName}(${Array.from(new Set(qualifiers)).join(" ")})`;
  }

  // Baixo invertido
  if (bass) {
    finalName = `${finalName}/${bass}`;
  }

  return correctChordSpelling(finalName, root);
}

function describeAddedTone(root: string, addition: string): string | null {
  const rootPC = getPitchClass(root);
  const additionPC = getPitchClass(addition);
  if (rootPC < 0 || additionPC < 0) return null;

  const offset = (additionPC - rootPC + 12) % 12;
  const labels: Record<number, string | null> = {
    0: null,
    1: "addb9",
    2: "add9",
    3: "add#9",
    4: "add3",
    5: "add11",
    6: "addb5",
    7: null,
    8: "add#5",
    9: "add6",
    10: "addb7",
    11: "addmaj7"
  };

  return labels[offset] ?? null;
}

/**
 * Corrige enarmonicamente os metadados de um acorde detectado para alinhar-se perfeitamente 
 * com a cifragem solicitada na timeline (ex: Ebm7 re-escrito como D#m7).
 */
export function enarmonizeChordCandidate(
  c: ChordCandidate,
  intendedChordName: string
): ChordCandidate {
  const intendedInfo = parseChord(intendedChordName);
  if (intendedInfo.empty) return c;

  const intendedRootPC = getPitchClass(intendedInfo.root);
  const candRootPC = getPitchClass(c.root);

  // Se tiver o mesmo pitch class de tônica, são equivalentes enarmônicos de raiz!
  if (candRootPC === intendedRootPC) {
    const newRoot = intendedInfo.root;
    
    // Alinhamento enarmônico do baixo invertido (slash chord) se necessário
    let newBass = c.bass;
    if (newBass) {
      if (intendedInfo.bass && getPitchClass(newBass) === getPitchClass(intendedInfo.bass)) {
        newBass = intendedInfo.bass;
      } else {
        const isSharpStyle = newRoot.includes("#");
        const baseName = newBass.replace(/\d/, "");
        const pc = getPitchClass(baseName);
        
        if (isSharpStyle) {
          const sharps: Record<number, string> = {
            1: "C#", 3: "D#", 6: "F#", 8: "G#", 10: "A#"
          };
          newBass = sharps[pc] || baseName;
        } else {
          const flats: Record<number, string> = {
            1: "Db", 3: "Eb", 6: "Gb", 8: "Ab", 10: "Bb"
          };
          newBass = flats[pc] || baseName;
        }
      }
    }

    const def = CHORD_REGISTRY[c.quality];
    const newNotes = def.semitones.map(s => {
      return simplifyNote(TonalNote.transpose(newRoot, TonalInterval.fromSemitones(s))).replace(/\d/, "");
    });

    return {
      ...c,
      root: newRoot,
      notes: newNotes,
      bass: newBass,
      notationJazz: formatChordName(newRoot, c.quality, c.omissions, newBass, "Jazz", c.additions),
      notationBrazilian: formatChordName(newRoot, c.quality, c.omissions, newBass, "Brazilian", c.additions),
      notationAcademic: formatChordName(newRoot, c.quality, c.omissions, newBass, "Academic", c.additions),
      intendedChord: intendedChordName
    };
  }

  return c;
}
