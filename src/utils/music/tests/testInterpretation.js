// src/utils/music/analysis/engines/MelodicInterpretationEngine.ts
var MelodicInterpretationEngine = class {
  static getInterpretations(pitchClass, keyRoot = "C") {
    const interpretations = [];
    if (pitchClass === "B") {
      interpretations.push({
        anchorPitch: "B",
        selectedMeaning: {
          anchorPitch: "B",
          meaningId: "ThirdOfDominant",
          meaningLabel: "Third of Dominant",
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
        selectedMeaning: { anchorPitch: "G", meaningId: "FifthOfTonic", meaningLabel: "Fifth of Tonic", impliedChord: "Cmaj7" },
        antecedentOptions: ["G7", "Fmaj7"],
        consequentOptions: ["Fmaj7", "Am7", "Dm7"],
        narrativeType: "TonicArrival"
      });
      interpretations.push({
        anchorPitch: "G",
        selectedMeaning: { anchorPitch: "G", meaningId: "RootOfDominant", meaningLabel: "Root of Dominant", impliedChord: "G7" },
        antecedentOptions: ["Dm7", "D7", "Fmaj7"],
        consequentOptions: ["Cmaj7", "Cm7"],
        narrativeType: "DominantPreparation"
      });
    }
    if (pitchClass === "Ab") {
      interpretations.push({
        anchorPitch: "Ab",
        selectedMeaning: { anchorPitch: "Ab", meaningId: "ThirdOfMinorSubdominant", meaningLabel: "Third of Minor Subdominant", impliedChord: "Fm7" },
        antecedentOptions: ["Cmaj7", "C7"],
        consequentOptions: ["G7", "Cmaj7"],
        narrativeType: "ModalInterchange"
      });
      interpretations.push({
        anchorPitch: "Ab",
        selectedMeaning: { anchorPitch: "Ab", meaningId: "RootOfFlatSix", meaningLabel: "Root of bVI", impliedChord: "Abmaj7" },
        antecedentOptions: ["Eb7", "Fm7"],
        consequentOptions: ["Dbmaj7", "G7"],
        narrativeType: "ChromaticShift"
      });
      interpretations.push({
        anchorPitch: "Ab",
        selectedMeaning: { anchorPitch: "Ab", meaningId: "FlatNineOfDominant", meaningLabel: "Flat Nine of Dominant", impliedChord: "G7(b9)" },
        antecedentOptions: ["Dm7b5", "Fm7"],
        consequentOptions: ["Cmaj7", "Cm7"],
        narrativeType: "AlteredDominant"
      });
    }
    if (pitchClass === "F#") {
      interpretations.push({
        anchorPitch: "F#",
        selectedMeaning: { anchorPitch: "F#", meaningId: "ThirdOfSecondaryDominant", meaningLabel: "Third of Secondary Dominant (V/V)", impliedChord: "D7" },
        antecedentOptions: ["Am7", "E7"],
        consequentOptions: ["G7", "G13"],
        narrativeType: "DirectionalAccumulation"
      });
      interpretations.push({
        anchorPitch: "F#",
        selectedMeaning: { anchorPitch: "F#", meaningId: "SharpElevenOfTonic", meaningLabel: "Lydian #11 of Tonic", impliedChord: "Cmaj7(#11)" },
        antecedentOptions: ["G7", "Fmaj7"],
        consequentOptions: ["Bm7b5", "Em7"],
        narrativeType: "LydianColoration"
      });
    }
    if (pitchClass === "C") {
      interpretations.push({
        anchorPitch: "C",
        selectedMeaning: { anchorPitch: "C", meaningId: "RootOfTonic", meaningLabel: "Root of Tonic", impliedChord: "Cmaj7" },
        antecedentOptions: ["G7", "Fmaj7"],
        consequentOptions: ["Fmaj7", "Am7"],
        narrativeType: "StableTonic"
      });
      interpretations.push({
        anchorPitch: "C",
        selectedMeaning: { anchorPitch: "C", meaningId: "SeventhOfSubdominant", meaningLabel: "Seventh of Subdominant", impliedChord: "Dm7" },
        antecedentOptions: ["A7", "Cmaj7"],
        consequentOptions: ["G7", "G13"],
        narrativeType: "SubdominantPreparation"
      });
    }
    if (pitchClass === "E") {
      interpretations.push({
        anchorPitch: "E",
        selectedMeaning: { anchorPitch: "E", meaningId: "ThirdOfTonic", meaningLabel: "Third of Tonic", impliedChord: "Cmaj7" },
        antecedentOptions: ["G7"],
        consequentOptions: ["Am7", "Fmaj7"],
        narrativeType: "StableTonic"
      });
      interpretations.push({
        anchorPitch: "E",
        selectedMeaning: { anchorPitch: "E", meaningId: "ThirteenthOfDominant", meaningLabel: "Thirteenth of Dominant", impliedChord: "G13" },
        antecedentOptions: ["Dm7"],
        consequentOptions: ["Cmaj7"],
        narrativeType: "ExtendedDominant"
      });
    }
    if (pitchClass === "A") {
      interpretations.push({
        anchorPitch: "A",
        selectedMeaning: { anchorPitch: "A", meaningId: "RootOfRelativeMinor", meaningLabel: "Root of Relative Minor", impliedChord: "Am7" },
        antecedentOptions: ["E7", "G7"],
        consequentOptions: ["Dm7", "Fmaj7"],
        narrativeType: "DeceptiveResolution"
      });
      interpretations.push({
        anchorPitch: "A",
        selectedMeaning: { anchorPitch: "A", meaningId: "ThirdOfSubdominant", meaningLabel: "Third of Subdominant", impliedChord: "Fmaj7" },
        antecedentOptions: ["Cmaj7", "C7"],
        consequentOptions: ["G7", "Dm7"],
        narrativeType: "SubdominantArrival"
      });
    }
    if (pitchClass === "Bb") {
      interpretations.push({
        anchorPitch: "Bb",
        selectedMeaning: { anchorPitch: "Bb", meaningId: "SeventhOfTonicDominant", meaningLabel: "Seventh of Tonic Dominant (V/IV)", impliedChord: "C7" },
        antecedentOptions: ["Gm7", "Cmaj7"],
        consequentOptions: ["Fmaj7", "Fm7"],
        narrativeType: "SecondaryDominant"
      });
      interpretations.push({
        anchorPitch: "Bb",
        selectedMeaning: { anchorPitch: "Bb", meaningId: "RootOfFlatSeven", meaningLabel: "Root of bVII", impliedChord: "Bbmaj7" },
        antecedentOptions: ["Fmaj7", "Fm7"],
        consequentOptions: ["Cmaj7", "Am7"],
        narrativeType: "BackdoorResolution"
      });
    }
    return interpretations;
  }
};

// testInterpretation.ts
var cases = [
  { name: "Caso A (T\xEDpico)", notes: ["C", "A", "B", "G"] },
  { name: "Caso B (Crom\xE1tico)", notes: ["C", "Ab", "B", "G"] },
  { name: "Caso C (Acumula\xE7\xE3o Direcional)", notes: ["C", "E", "F#", "G"] },
  { name: "Caso D (Descida Crom\xE1tica)", notes: ["C", "Bb", "A", "Ab"] }
];
console.log("=== MELODIC INTERPRETATION ENGINE (F18 Fase 1) ===\n");
cases.forEach((c) => {
  console.log(`
======================================`);
  console.log(`\u{1F3B5} ${c.name}: ${c.notes.join(" -> ")}`);
  console.log(`======================================
`);
  c.notes.forEach((note) => {
    console.log(`Anchor: ${note}`);
    const interpretations = MelodicInterpretationEngine.getInterpretations(note);
    if (interpretations.length === 0) {
      console.log(`  (Sem interpreta\xE7\xF5es mapeadas no mock para esta nota)
`);
      return;
    }
    interpretations.forEach((interp, idx) => {
      console.log(`  Interpretation ${idx + 1}`);
      console.log(`  - Meaning: ${interp.selectedMeaning.meaningLabel} (${interp.narrativeType})`);
      console.log(`  - Implied Gravity: [ ${interp.antecedentOptions.join(" / ")} ] \u2794 ${interp.selectedMeaning.impliedChord} \u2794 [ ${interp.consequentOptions.join(" / ")} ]
`);
    });
  });
});
