// src/utils/music/analysis/engines/MelodicInterpretationEngine.ts
var MelodicInterpretationEngine = class {
  static getInterpretations(pitchClass) {
    const interpretations = [];
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
    return interpretations;
  }
};

// src/utils/music/analysis/engines/NarrativeWorldGenerator.ts
var NarrativeWorldGenerator = class {
  /**
   * Generates all competing narrative worlds based on a sequence of melodic anchors.
   */
  static generateWorlds(anchors) {
    const optionsPerAnchor = anchors.map(
      (anchor) => MelodicInterpretationEngine.getInterpretations(anchor)
    );
    const allTimelines = this.cartesianProduct(optionsPerAnchor);
    const worlds = [];
    allTimelines.forEach((timeline, index) => {
      const events = timeline.map((interp, i) => ({
        measureIndex: i + 1,
        anchorPitch: interp.anchorPitch,
        interpretation: interp,
        resolvedChord: interp.selectedMeaning.impliedChord
      }));
      const world = this.evaluateWorld(events, `World_${index + 1}`);
      if (world.isViable) {
        worlds.push(world);
      }
    });
    return worlds.sort((a, b) => b.coherenceScore - a.coherenceScore);
  }
  /**
   * Evaluates if a sequence of events constitutes a logically consistent narrative world.
   */
  static evaluateWorld(events, fallbackId) {
    let matches = 0;
    let ruptures = 0;
    let ruptureDesc = "";
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      const currentExpectsNext = current.interpretation.consequentOptions.includes(next.resolvedChord);
      const nextExpectsCurrent = next.interpretation.antecedentOptions.includes(current.resolvedChord);
      if (currentExpectsNext || nextExpectsCurrent) {
        matches++;
      } else {
        const currentBehavior = current.interpretation.selectedMeaning.behavior;
        const nextBehavior = next.interpretation.selectedMeaning.behavior;
        if (currentBehavior === "DIATONIC" && (nextBehavior === "MODAL" || nextBehavior === "CHROMATIC")) {
          ruptures++;
          ruptureDesc = `Ruptura Estil\xEDstica no Compasso ${next.measureIndex}: Transi\xE7\xE3o de Diat\xF4nico para ${nextBehavior}.`;
        } else if (currentBehavior !== "DIATONIC" && (nextBehavior === "MODAL" || nextBehavior === "CHROMATIC")) {
          ruptures++;
        } else {
          return {
            id: fallbackId,
            structuralCategory: "Incoherent",
            structuralProfile: { diatonicStability: 0, dominantDensity: 0, modalAmbiguity: 0, chromaticDisruption: 0 },
            events,
            coherenceScore: 0,
            isViable: false,
            isStructuralRupture: false
          };
        }
      }
    }
    const totalTransitions = events.length - 1;
    const coherenceScore = totalTransitions === 0 ? 1 : matches / totalTransitions;
    if (ruptures > 1 && totalTransitions <= 3) {
      return {
        id: fallbackId,
        structuralCategory: "Highly Fragmented",
        structuralProfile: { diatonicStability: 0, dominantDensity: 0, modalAmbiguity: 0, chromaticDisruption: 0 },
        events,
        coherenceScore: 0.2,
        isViable: false,
        isStructuralRupture: true
      };
    }
    const structuralProfile = this.calculateStructuralProfile(events);
    const structuralCategory = this.determineStructuralCategory(structuralProfile, ruptures > 0);
    return {
      id: fallbackId,
      structuralCategory,
      structuralProfile,
      events,
      coherenceScore,
      isViable: true,
      isStructuralRupture: ruptures > 0,
      ruptureDescription: ruptures > 0 ? ruptureDesc : void 0
    };
  }
  static calculateStructuralProfile(events) {
    const total = events.length;
    if (total === 0) return { diatonicStability: 0, dominantDensity: 0, modalAmbiguity: 0, chromaticDisruption: 0 };
    let diatonic = 0;
    let dominant = 0;
    let modal = 0;
    let chromatic = 0;
    events.forEach((e) => {
      const b = e.interpretation.selectedMeaning.behavior;
      if (b === "DIATONIC") diatonic++;
      else if (b === "DOMINANT") dominant++;
      else if (b === "MODAL") modal++;
      else if (b === "CHROMATIC") chromatic++;
    });
    return {
      diatonicStability: diatonic / total,
      dominantDensity: dominant / total,
      modalAmbiguity: modal / total,
      chromaticDisruption: chromatic / total
    };
  }
  static determineStructuralCategory(profile, hasRupture) {
    if (hasRupture) {
      if (profile.modalAmbiguity > 0) return "Mundo de Ruptura Modal";
      if (profile.chromaticDisruption > 0) return "Mundo de Ruptura Crom\xE1tica Estruturada";
      return "Mundo H\xEDbrido com Ruptura Funcional";
    }
    if (profile.diatonicStability === 1) return "Mundo de Coer\xEAncia Funcional Diat\xF4nica";
    if (profile.dominantDensity >= 0.5) return "Mundo de Tens\xE3o Dominante Estendida";
    if (profile.modalAmbiguity >= 0.5) return "Mundo de Ambiguidade Modal Controlada";
    if (profile.chromaticDisruption >= 0.5) return "Mundo de Predomin\xE2ncia Substitucional";
    if (profile.diatonicStability >= 0.5 && profile.dominantDensity > 0) {
      return "Mundo Funcional Expandido";
    }
    return "Mundo de Coer\xEAncia H\xEDbrida";
  }
  // Utility to generate combinations
  static cartesianProduct(arrays) {
    return arrays.reduce(
      (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
      [[]]
    );
  }
};

// testWorlds.ts
var cases = [
  { name: "Caso A (T\xEDpico)", notes: ["C", "A", "B", "G"] },
  { name: "Caso B (Crom\xE1tico)", notes: ["C", "Ab", "B", "G"] },
  { name: "Caso C (Acumula\xE7\xE3o Direcional)", notes: ["C", "E", "F#", "G"] },
  { name: "Caso D (Descida Crom\xE1tica)", notes: ["C", "Bb", "A", "Ab"] }
];
console.log("=== NARRATIVE WORLD GENERATOR (F18.5 - Structural Vectors) ===\n");
cases.forEach((c) => {
  console.log(`
======================================`);
  console.log(`\u{1F3B5} ${c.name}: ${c.notes.join(" -> ")}`);
  console.log(`======================================
`);
  const worlds = NarrativeWorldGenerator.generateWorlds(c.notes);
  if (worlds.length === 0) {
    console.log(`\u274C Todos os mundos colapsaram por inconsist\xEAncia gravitacional.
`);
    return;
  }
  console.log(`\u2728 ${worlds.length} Mundos Sobreviventes:
`);
  worlds.forEach((world) => {
    console.log(`\u{1F310} ${world.structuralCategory} (Score: ${world.coherenceScore.toFixed(2)})`);
    const p = world.structuralProfile;
    console.log(`   Perfil: [Diat\xF4nico: ${(p.diatonicStability * 100).toFixed(0)}%, Dominante: ${(p.dominantDensity * 100).toFixed(0)}%, Modal: ${(p.modalAmbiguity * 100).toFixed(0)}%, Crom\xE1tico: ${(p.chromaticDisruption * 100).toFixed(0)}%]`);
    if (world.isStructuralRupture) {
      console.log(`   \u26A0\uFE0F Ruptura: ${world.ruptureDescription}`);
    }
    world.events.forEach((event) => {
      console.log(`   Comp ${event.measureIndex} [${event.anchorPitch}]: ${event.resolvedChord} (${event.interpretation.selectedMeaning.meaningLabel})`);
    });
    console.log("");
  });
});
