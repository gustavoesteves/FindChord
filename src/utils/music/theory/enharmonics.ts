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
  _omissions: string[],
  bass?: string,
  style: "Jazz" | "Brazilian" | "Academic" = "Jazz"
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

  // A regra antiga de adicionar "(no5)" para acordes que omitem a quinta 
  // foi desativada pois confunde a notação (ex: Dm9(no5) deve ser lido apenas como Dm9)
  // if (omissions.includes("5") && !omissions.includes("3") && !omissions.includes("1") && quality !== "power") {
  //   if (!finalName.includes("(no5)")) {
  //     finalName = `${finalName}(no5)`;
  //   }
  // }

  // Baixo invertido
  if (bass) {
    finalName = `${finalName}/${bass}`;
  }

  return correctChordSpelling(finalName, root);
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
      notationJazz: formatChordName(newRoot, c.quality, c.omissions, newBass, "Jazz"),
      notationBrazilian: formatChordName(newRoot, c.quality, c.omissions, newBass, "Brazilian"),
      notationAcademic: formatChordName(newRoot, c.quality, c.omissions, newBass, "Academic"),
      intendedChord: intendedChordName
    };
  }

  return c;
}
