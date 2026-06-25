import type { TrajectoryInterpretation } from "../models/MelodicInterpretation";

// Basic knowledge base matching the F18 Phase 1 experiment requirements
// Note: In a full implementation, this would be dynamically computed based on intervals and tonality.
export class MelodicInterpretationEngine {
  public static getInterpretations(pitchClass: string): TrajectoryInterpretation[] {
    const interpretations: TrajectoryInterpretation[] = [];

    if (pitchClass === "B") {
      interpretations.push({
        anchorPitch: "B",
        selectedMeaning: {
          anchorPitch: "B",
          meaningId: "ThirdOfDominant",
          meaningLabel: "Third of Dominant",
          behavior: "DOMINANT",
          impliedChord: "G7"
        },
        antecedentOptions: ["Dm7", "Am7", "Fmaj7", "D7"],
        consequentOptions: ["Cmaj7", "Am7"],
        narrativeType: "AuthenticCadence"
      });

      interpretations.push({
        anchorPitch: "B",
        selectedMeaning: {
          anchorPitch: "B",
          meaningId: "FifthOfRelativeMinor",
          meaningLabel: "Fifth of Relative Minor",
          behavior: "DIATONIC",
          impliedChord: "Em7"
        },
        antecedentOptions: ["Bm7b5", "Fmaj7"],
        consequentOptions: ["Am7", "Fmaj7"],
        narrativeType: "Deceptive/Modal"
      });

      interpretations.push({
        anchorPitch: "B",
        selectedMeaning: {
          anchorPitch: "B",
          meaningId: "RootOfLeadingToneChord",
          meaningLabel: "Root of Leading Tone Chord",
          behavior: "DOMINANT",
          impliedChord: "Bm7b5"
        },
        antecedentOptions: ["Fmaj7", "Dm7"],
        consequentOptions: ["E7", "Am7"],
        narrativeType: "MinorTonicization"
      });
    }

    if (pitchClass === "G") {
      interpretations.push({
        anchorPitch: "G",
        selectedMeaning: { anchorPitch: "G", meaningId: "FifthOfTonic", meaningLabel: "Fifth of Tonic", behavior: "DIATONIC", impliedChord: "Cmaj7" },
        antecedentOptions: ["G7", "Fmaj7"],
        consequentOptions: ["Fmaj7", "Am7", "Dm7"],
        narrativeType: "TonicArrival"
      });
      interpretations.push({
        anchorPitch: "G",
        selectedMeaning: { anchorPitch: "G", meaningId: "RootOfDominant", meaningLabel: "Root of Dominant", behavior: "DOMINANT", impliedChord: "G7" },
        antecedentOptions: ["Dm7", "D7", "Fmaj7"],
        consequentOptions: ["Cmaj7", "Cm7"],
        narrativeType: "DominantPreparation"
      });
    }

    if (pitchClass === "Ab") {
      interpretations.push({
        anchorPitch: "Ab",
        selectedMeaning: { anchorPitch: "Ab", meaningId: "ThirdOfMinorSubdominant", meaningLabel: "Third of Minor Subdominant", behavior: "MODAL", impliedChord: "Fm7" },
        antecedentOptions: ["Cmaj7", "C7"],
        consequentOptions: ["G7", "Cmaj7"],
        narrativeType: "ModalInterchange"
      });
      interpretations.push({
        anchorPitch: "Ab",
        selectedMeaning: { anchorPitch: "Ab", meaningId: "RootOfFlatSix", meaningLabel: "Root of bVI", behavior: "MODAL", impliedChord: "Abmaj7" },
        antecedentOptions: ["Eb7", "Fm7"],
        consequentOptions: ["Dbmaj7", "G7"],
        narrativeType: "ChromaticShift"
      });
      interpretations.push({
        anchorPitch: "Ab",
        selectedMeaning: { anchorPitch: "Ab", meaningId: "FlatNineOfDominant", meaningLabel: "Flat Nine of Dominant", behavior: "DOMINANT", impliedChord: "G7(b9)" },
        antecedentOptions: ["Dm7b5", "Fm7"],
        consequentOptions: ["Cmaj7", "Cm7"],
        narrativeType: "AlteredDominant"
      });
    }

    if (pitchClass === "F#") {
      interpretations.push({
        anchorPitch: "F#",
        selectedMeaning: { anchorPitch: "F#", meaningId: "ThirdOfSecondaryDominant", meaningLabel: "Third of Secondary Dominant (V/V)", behavior: "DOMINANT", impliedChord: "D7" },
        antecedentOptions: ["Am7", "E7"],
        consequentOptions: ["G7", "G13"],
        narrativeType: "DirectionalAccumulation"
      });
      interpretations.push({
        anchorPitch: "F#",
        selectedMeaning: { anchorPitch: "F#", meaningId: "SharpElevenOfTonic", meaningLabel: "Lydian #11 of Tonic", behavior: "MODAL", impliedChord: "Cmaj7(#11)" },
        antecedentOptions: ["G7", "Fmaj7"],
        consequentOptions: ["Bm7b5", "Em7"],
        narrativeType: "LydianColoration"
      });
    }

    if (pitchClass === "C") {
      interpretations.push({
        anchorPitch: "C",
        selectedMeaning: { anchorPitch: "C", meaningId: "RootOfTonic", meaningLabel: "Root of Tonic", behavior: "DIATONIC", impliedChord: "Cmaj7" },
        antecedentOptions: ["G7", "Fmaj7"],
        consequentOptions: ["Fmaj7", "Am7"],
        narrativeType: "StableTonic"
      });
      interpretations.push({
        anchorPitch: "C",
        selectedMeaning: { anchorPitch: "C", meaningId: "SeventhOfSubdominant", meaningLabel: "Seventh of Subdominant", behavior: "DIATONIC", impliedChord: "Dm7" },
        antecedentOptions: ["A7", "Cmaj7"],
        consequentOptions: ["G7", "G13"],
        narrativeType: "SubdominantPreparation"
      });
    }

    if (pitchClass === "E") {
      interpretations.push({
        anchorPitch: "E",
        selectedMeaning: { anchorPitch: "E", meaningId: "ThirdOfTonic", meaningLabel: "Third of Tonic", behavior: "DIATONIC", impliedChord: "Cmaj7" },
        antecedentOptions: ["G7"],
        consequentOptions: ["Am7", "Fmaj7"],
        narrativeType: "StableTonic"
      });
      interpretations.push({
        anchorPitch: "E",
        selectedMeaning: { anchorPitch: "E", meaningId: "ThirteenthOfDominant", meaningLabel: "Thirteenth of Dominant", behavior: "DOMINANT", impliedChord: "G13" },
        antecedentOptions: ["Dm7"],
        consequentOptions: ["Cmaj7"],
        narrativeType: "ExtendedDominant"
      });
    }

    if (pitchClass === "A") {
      interpretations.push({
        anchorPitch: "A",
        selectedMeaning: { anchorPitch: "A", meaningId: "RootOfRelativeMinor", meaningLabel: "Root of Relative Minor", behavior: "DIATONIC", impliedChord: "Am7" },
        antecedentOptions: ["E7", "G7"],
        consequentOptions: ["Dm7", "Fmaj7"],
        narrativeType: "DeceptiveResolution"
      });
      interpretations.push({
        anchorPitch: "A",
        selectedMeaning: { anchorPitch: "A", meaningId: "ThirdOfSubdominant", meaningLabel: "Third of Subdominant", behavior: "DIATONIC", impliedChord: "Fmaj7" },
        antecedentOptions: ["Cmaj7", "C7"],
        consequentOptions: ["G7", "Dm7"],
        narrativeType: "SubdominantArrival"
      });
    }

    if (pitchClass === "Bb") {
      interpretations.push({
        anchorPitch: "Bb",
        selectedMeaning: { anchorPitch: "Bb", meaningId: "SeventhOfTonicDominant", meaningLabel: "Seventh of Tonic Dominant (V/IV)", behavior: "DOMINANT", impliedChord: "C7" },
        antecedentOptions: ["Gm7", "Cmaj7"],
        consequentOptions: ["Fmaj7", "Fm7"],
        narrativeType: "SecondaryDominant"
      });
      interpretations.push({
        anchorPitch: "Bb",
        selectedMeaning: { anchorPitch: "Bb", meaningId: "RootOfFlatSeven", meaningLabel: "Root of bVII", behavior: "MODAL", impliedChord: "Bbmaj7" },
        antecedentOptions: ["Fmaj7", "Fm7"],
        consequentOptions: ["Cmaj7", "Am7"],
        narrativeType: "BackdoorResolution"
      });
    }

    if (interpretations.length === 0) {
      interpretations.push({
        anchorPitch: pitchClass,
        selectedMeaning: { 
          anchorPitch: pitchClass, 
          meaningId: `GenericDiatonic_${pitchClass}`, 
          meaningLabel: `Generic Diatonic (${pitchClass})`, 
          behavior: "DIATONIC", 
          impliedChord: "Cmaj7" 
        },
        antecedentOptions: ["G7", "Fmaj7"],
        consequentOptions: ["Fmaj7", "G7"],
        narrativeType: "StableTonic"
      });
    }

    return interpretations;
  }
}
