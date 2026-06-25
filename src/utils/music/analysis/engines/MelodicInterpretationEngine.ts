import type { TrajectoryInterpretation } from "../models/MelodicInterpretation";
import type { TonalCenter } from "./LocalTonalCenterEngine";
import { Note, Chord, Interval } from "tonal";

export class MelodicInterpretationEngine {
  
  public static getInterpretations(pitchClass: string, tonalCenter?: TonalCenter): TrajectoryInterpretation[] {
    const tonic = tonalCenter?.tonic || "C";
    
    // Calculate how far the current tonic is from C
    const upInterval = Interval.distance("C4", tonic + (Note.get(tonic).chroma! < Note.get("C").chroma! ? "5" : "4"));
    const downInterval = Interval.invert(upInterval);

    // To find the relative pitch in C, transpose the input pitch DOWN by the interval
    let relativePitch = Note.transpose(pitchClass + "4", downInterval);
    // strip the octave
    relativePitch = Note.get(relativePitch).pc;

    const rawInterpretations = this.getCInterpretations(relativePitch);

    // Transpose the implied chords UP to the target tonic
    return rawInterpretations.map(raw => {
      let transposedChord = raw.selectedMeaning.impliedChord;
      if (tonic !== "C") {
        const tokens = Chord.tokenize(transposedChord);
        const newRoot = Note.transpose(tokens[0] + "4", upInterval);
        transposedChord = Note.get(newRoot).pc + tokens[1];
      }

      return {
        ...raw,
        anchorPitch: pitchClass,
        selectedMeaning: {
          ...raw.selectedMeaning,
          anchorPitch: pitchClass,
          impliedChord: transposedChord
        }
      };
    });
  }

  private static getCInterpretations(pitchClass: string): TrajectoryInterpretation[] {
    const interpretations: TrajectoryInterpretation[] = [];

    const add = (meaningId: string, label: string, behavior: "DIATONIC" | "DOMINANT" | "MODAL" | "CHROMATIC", impliedChord: string, narrativeType: string) => {
      interpretations.push({
        anchorPitch: pitchClass,
        selectedMeaning: { anchorPitch: pitchClass, meaningId, meaningLabel: label, behavior, impliedChord },
        antecedentOptions: [], 
        consequentOptions: [],
        narrativeType
      });
    };

    const pc = pitchClass.replace('Cb', 'B').replace('Fb', 'E').replace('E#', 'F').replace('B#', 'C');

    if (pc === "C") {
      add("C_RootTonic", "Root of Tonic", "DIATONIC", "Cmaj7", "StableTonic");
      add("C_ThirdAm", "Minor 3rd of Am", "DIATONIC", "Am7", "DeceptiveResolution");
      add("C_FifthF", "Fifth of F", "DIATONIC", "Fmaj7", "SubdominantArrival");
      add("C_SeventhDm", "Minor 7th of Dm", "DIATONIC", "Dm7", "SubdominantPreparation");
      add("C_FlatSevenD7", "Minor 7th of V/V", "DOMINANT", "D7", "SecondaryDominant");
      add("C_ThirdAb7", "Major 3rd of Ab7", "DOMINANT", "Ab7", "SubstituteDominant");
      add("C_FifthFm", "Fifth of Fm", "MODAL", "Fm6", "ModalInterchange");
      add("C_ThirdAbmaj", "Major 3rd of Abmaj", "MODAL", "Abmaj7", "ChromaticShift");
      add("C_DimRoot", "Root of Cdim7", "CHROMATIC", "Cdim7", "PassingDiminished");
    }

    if (pc === "C#" || pc === "Db") {
      add("Db_Root", "Root of bII", "MODAL", "Dbmaj7", "NeapolitanShift");
      add("Db_RootSubV", "Root of SubV7", "DOMINANT", "Db7", "SubstituteDominant");
      add("Db_FlatNineC", "Flat 9 of V/IV", "DOMINANT", "C7(b9)", "AlteredDominant");
      add("Db_ThirdA7", "Major 3rd of VI7", "DOMINANT", "A7", "SecondaryDominant");
      add("Db_DimRoot", "Root of C#dim7", "CHROMATIC", "C#dim7", "PassingDiminished");
      add("Db_FifthFsm", "Fifth of F#m", "MODAL", "F#m7b5", "ModalInterchange");
    }

    if (pc === "D") {
      add("D_NinthC", "Ninth of Tonic", "DIATONIC", "Cmaj9", "StableTonic");
      add("D_RootDm", "Root of II", "DIATONIC", "Dm7", "SubdominantPreparation");
      add("D_FifthG", "Fifth of V", "DIATONIC", "G7", "DominantPreparation");
      add("D_ThirdBb", "Major 3rd of bVII", "MODAL", "Bbmaj7", "BackdoorResolution");
      add("D_RootD7", "Root of V/V", "DOMINANT", "D7", "SecondaryDominant");
      add("D_FlatNineDb7", "Flat 9 of SubV", "DOMINANT", "Db7(b9)", "SubstituteDominant");
    }

    if (pc === "D#" || pc === "Eb") {
      add("Eb_MinorThirdC", "Minor 3rd of i", "MODAL", "Cm7", "ModalInterchange");
      add("Eb_RootEb", "Root of bIII", "MODAL", "Ebmaj7", "ChromaticShift");
      add("Eb_SeventhF", "Minor 7th of F7", "DOMINANT", "F7", "SecondaryDominant");
      add("Eb_ThirdB7", "Major 3rd of B7", "DOMINANT", "B7", "SecondaryDominant");
      add("Eb_DimRoot", "Root of D#dim7", "CHROMATIC", "D#dim7", "PassingDiminished");
    }

    if (pc === "E") {
      add("E_ThirdC", "Major 3rd of Tonic", "DIATONIC", "Cmaj7", "StableTonic");
      add("E_RootEm", "Root of III", "DIATONIC", "Em7", "MedianTonicization");
      add("E_FifthAm", "Fifth of VI", "DIATONIC", "Am7", "DeceptiveResolution");
      add("E_SeventhF", "Major 7th of IV", "DIATONIC", "Fmaj7", "SubdominantArrival");
      add("E_ThirteenthG", "Thirteenth of V", "DOMINANT", "G13", "ExtendedDominant");
      add("E_ThirdC7", "Major 3rd of V/IV", "DOMINANT", "C7", "SecondaryDominant");
      add("E_DimThird", "Minor 3rd of C#dim", "CHROMATIC", "C#dim7", "PassingDiminished");
    }

    if (pc === "F") {
      add("F_RootF", "Root of IV", "DIATONIC", "Fmaj7", "SubdominantArrival");
      add("F_ThirdDm", "Minor 3rd of II", "DIATONIC", "Dm7", "SubdominantPreparation");
      add("F_SeventhG", "Minor 7th of V", "DOMINANT", "G7", "DominantPreparation");
      add("F_RootFm", "Root of Minor IV", "MODAL", "Fm6", "ModalInterchange");
      add("F_ThirdDb", "Major 3rd of bII", "MODAL", "Dbmaj7", "NeapolitanShift");
      add("F_FlatNineE", "Flat 9 of III7", "DOMINANT", "E7(b9)", "SecondaryDominant");
    }

    if (pc === "F#" || pc === "Gb") {
      add("Fs_ThirdD7", "Major 3rd of V/V", "DOMINANT", "D7", "SecondaryDominant");
      add("Fs_SharpElevenC", "Lydian #11 of Tonic", "MODAL", "Cmaj7(#11)", "LydianColoration");
      add("Fs_DimRoot", "Root of F#dim7", "CHROMATIC", "F#dim7", "PassingDiminished");
      add("Fs_FifthB", "Fifth of B7", "DOMINANT", "B7", "SecondaryDominant");
      add("Gb_Root", "Root of bV", "MODAL", "Gbmaj7", "ChromaticShift");
    }

    if (pc === "G") {
      add("G_FifthC", "Fifth of Tonic", "DIATONIC", "Cmaj7", "StableTonic");
      add("G_RootG", "Root of V", "DOMINANT", "G7", "DominantPreparation");
      add("G_ThirdEm", "Minor 3rd of III", "DIATONIC", "Em7", "MedianTonicization");
      add("G_SeventhAm", "Minor 7th of VI", "DIATONIC", "Am7", "DeceptiveResolution");
      add("G_ThirdEb", "Major 3rd of bIII", "MODAL", "Ebmaj7", "ChromaticShift");
      add("G_FifthCm", "Fifth of Minor i", "MODAL", "Cm7", "ModalInterchange");
      add("G_SeventhA7", "Minor 7th of VI7", "DOMINANT", "A7", "SecondaryDominant");
      add("G_DimThird", "Minor 3rd of Edim", "CHROMATIC", "Edim7", "PassingDiminished");
    }

    if (pc === "G#" || pc === "Ab") {
      add("Ab_RootAb", "Root of bVI", "MODAL", "Abmaj7", "ChromaticShift");
      add("Ab_ThirdFm", "Minor 3rd of iv", "MODAL", "Fm6", "ModalInterchange");
      add("Ab_FlatNineG", "Flat 9 of V", "DOMINANT", "G7(b9)", "AlteredDominant");
      add("Ab_ThirdE7", "Major 3rd of III7", "DOMINANT", "E7", "SecondaryDominant");
      add("Gs_DimRoot", "Root of G#dim7", "CHROMATIC", "G#dim7", "PassingDiminished");
    }

    if (pc === "A") {
      add("A_RootAm", "Root of VI", "DIATONIC", "Am7", "DeceptiveResolution");
      add("A_ThirdF", "Major 3rd of IV", "DIATONIC", "Fmaj7", "SubdominantArrival");
      add("A_FifthDm", "Fifth of II", "DIATONIC", "Dm7", "SubdominantPreparation");
      add("A_ThirteenthC", "Thirteenth of Tonic", "DIATONIC", "C6", "StableTonic");
      add("A_FifthD7", "Fifth of V/V", "DOMINANT", "D7", "SecondaryDominant");
      add("A_ThirdF7", "Major 3rd of SubV/III", "DOMINANT", "F7", "SubstituteDominant");
      add("A_DimThird", "Minor 3rd of F#dim", "CHROMATIC", "F#dim7", "PassingDiminished");
    }

    if (pc === "A#" || pc === "Bb") {
      add("Bb_RootBb", "Root of bVII", "MODAL", "Bbmaj7", "BackdoorResolution");
      add("Bb_SeventhC", "Minor 7th of V/IV", "DOMINANT", "C7", "SecondaryDominant");
      add("Bb_ThirdGm", "Minor 3rd of v", "MODAL", "Gm7", "ModalInterchange");
      add("Bb_FlatNineA", "Flat 9 of VI7", "DOMINANT", "A7(b9)", "AlteredDominant");
      add("As_DimRoot", "Root of A#dim7", "CHROMATIC", "A#dim7", "PassingDiminished");
    }

    if (pc === "B") {
      add("B_SeventhC", "Major 7th of Tonic", "DIATONIC", "Cmaj7", "StableTonic");
      add("B_ThirdG", "Major 3rd of V", "DOMINANT", "G7", "DominantPreparation");
      add("B_RootB", "Root of vii", "DIATONIC", "Bm7b5", "MinorTonicization");
      add("B_FifthEm", "Fifth of III", "DIATONIC", "Em7", "MedianTonicization");
      add("B_ThirdG13", "Major 3rd of V", "DOMINANT", "G13", "ExtendedDominant");
      add("B_FifthE7", "Fifth of III7", "DOMINANT", "E7", "SecondaryDominant");
      add("B_FlatNineBb7", "Flat 9 of SubV/VI", "DOMINANT", "Bb7(b9)", "SubstituteDominant");
      add("B_DimThird", "Minor 3rd of G#dim", "CHROMATIC", "G#dim7", "PassingDiminished");
    }

    if (interpretations.length === 0) {
      add(`Generic_${pc}`, `Generic Diatonic`, "DIATONIC", "Cmaj7", "StableTonic");
    }

    return interpretations;
  }
}
