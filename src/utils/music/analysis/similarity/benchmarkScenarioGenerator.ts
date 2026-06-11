import type { DiscoveryOptions, DiscoveryMatch } from '../functionalAnalysis';

export interface SyntheticScenario {
  id: string;
  name: string;
  progression: string[];
  options: DiscoveryOptions;
  category: string;
  ambiguityRegion: string;
  gradingCriteria: {
    expectedDeltas?: {
      tensionDelta?: { min?: number; max?: number };
      functionalStabilityDelta?: { min?: number; max?: number };
      voiceLeadingQualityDelta?: { min?: number; max?: number };
    };
    expectedMechanisms?: string[];
    minPlayability?: number;
    maxComplexity?: number;
    minSuccessScore?: number;
    expectedFailure?: boolean;
  };
}

/**
 * Programmatic generator for 150 synthetic validation scenarios.
 */
export function generateSyntheticScenarios(): SyntheticScenario[] {
  const scenarios: SyntheticScenario[] = [];

  // 1. Diatonic Major (15 Scenarios)
  const diatonicMajorTemplates = [
    { name: "Cadência Perfeita I-IV-V-I", progression: ["C", "F", "G", "C"] },
    { name: "Cadência ii-V-I Diatônica", progression: ["C", "Dm", "G", "C"] },
    { name: "Progressão de Círculo Diatônico I-vi-ii-V", progression: ["C", "Am", "Dm", "G"] },
  ];
  const majorKeys = ["C", "G", "F", "D", "A"];
  let idCounter = 1;

  for (const root of majorKeys) {
    for (const t of diatonicMajorTemplates) {
      // Transpose template chords relative to the key (for simplicity, we choose preset transposed progressions)
      let prog: string[] = [];
      if (root === "C") {
        prog = t.progression;
      } else if (root === "G") {
        prog = t.progression.map(ch => ch === "C" ? "G" : ch === "F" ? "C" : ch === "G" ? "D" : ch === "Dm" ? "Am" : ch === "Am" ? "Em" : "G");
      } else if (root === "F") {
        prog = t.progression.map(ch => ch === "C" ? "F" : ch === "F" ? "Bb" : ch === "G" ? "C" : ch === "Dm" ? "Gm" : ch === "Am" ? "Dm" : "F");
      } else if (root === "D") {
        prog = t.progression.map(ch => ch === "C" ? "D" : ch === "F" ? "G" : ch === "G" ? "A" : ch === "Dm" ? "Em" : ch === "Am" ? "Bm" : "D");
      } else {
        prog = t.progression.map(ch => ch === "C" ? "A" : ch === "F" ? "D" : ch === "G" ? "E" : ch === "Dm" ? "Bm" : ch === "Am" ? "F#m" : "A");
      }

      scenarios.push({
        id: `synth-diatonic-major-${idCounter++}`,
        name: `${t.name} em ${root}`,
        progression: prog,
        options: { strategy: 'OVERALL', goal: 'PRESERVE_FUNCTION' },
        category: 'DIATONIC_MAJOR',
        ambiguityRegion: 'SINGLE_DOMINANT_SOLUTION',
        gradingCriteria: {
          expectedDeltas: {
            functionalStabilityDelta: { min: -0.1 }
          },
          minPlayability: 0.6
        }
      });
    }
  }

  // 2. Diatonic Minor (15 Scenarios)
  const diatonicMinorTemplates = [
    { name: "i-iv-V-i Clássico Menor", progression: ["Am", "Dm", "E7", "Am"] },
    { name: "i-bVI-bVII-i Epico", progression: ["Am", "F", "G", "Am"] },
    { name: "Cadência Plagal Menor i-iv-i", progression: ["Am", "Dm", "Am"] }
  ];
  const minorKeys = ["Am", "Em", "Dm", "Gm", "Cm"];

  for (const root of minorKeys) {
    for (const t of diatonicMinorTemplates) {
      let prog: string[] = [];
      // Simple manual transpositions
      if (root === "Am") {
        prog = t.progression;
      } else if (root === "Em") {
        prog = t.progression.map(ch => ch === "Am" ? "Em" : ch === "Dm" ? "Am" : ch === "E7" ? "B7" : ch === "F" ? "C" : ch === "G" ? "D" : "Em");
      } else if (root === "Dm") {
        prog = t.progression.map(ch => ch === "Am" ? "Dm" : ch === "Dm" ? "Gm" : ch === "E7" ? "A7" : ch === "F" ? "Bb" : ch === "G" ? "C" : "Dm");
      } else if (root === "Gm") {
        prog = t.progression.map(ch => ch === "Am" ? "Gm" : ch === "Dm" ? "Cm" : ch === "E7" ? "D7" : ch === "F" ? "Eb" : ch === "G" ? "F" : "Gm");
      } else {
        prog = t.progression.map(ch => ch === "Am" ? "Cm" : ch === "Dm" ? "Fm" : ch === "E7" ? "G7" : ch === "F" ? "Ab" : ch === "G" ? "Bb" : "Cm");
      }

      scenarios.push({
        id: `synth-diatonic-minor-${idCounter++}`,
        name: `${t.name} em ${root}`,
        progression: prog,
        options: { strategy: 'OVERALL' },
        category: 'DIATONIC_MINOR',
        ambiguityRegion: 'SINGLE_DOMINANT_SOLUTION',
        gradingCriteria: {
          expectedDeltas: {
            functionalStabilityDelta: { min: -0.2 }
          }
        }
      });
    }
  }

  // 3. Modal Interchange / Borrowed Chords (18 Scenarios)
  const borrowedProgressions = [
    { name: "Tônica com Subdominante Menor", progression: ["C", "Fm", "C"], goal: "INCREASE_TENSION" },
    { name: "Progressão Epica de Empréstimo bVI-bVII", progression: ["C", "Ab", "Bb", "C"], goal: "INCREASE_TENSION" },
    { name: "Progressão com bIII Maj", progression: ["C", "Eb", "F", "C"], goal: "PRESERVE_FUNCTION" }
  ];
  const borrowedRoots = ["C", "G", "F", "D", "A", "E"];

  for (const root of borrowedRoots) {
    for (const t of borrowedProgressions) {
      let prog: string[] = [];
      if (root === "C") {
        prog = t.progression;
      } else if (root === "G") {
        prog = t.progression.map(ch => ch === "C" ? "G" : ch === "Fm" ? "Cm" : ch === "Ab" ? "Eb" : ch === "Bb" ? "F" : ch === "Eb" ? "Bb" : ch === "F" ? "C" : "G");
      } else if (root === "F") {
        prog = t.progression.map(ch => ch === "C" ? "F" : ch === "Fm" ? "Bbm" : ch === "Ab" ? "Db" : ch === "Bb" ? "Eb" : ch === "Eb" ? "Ab" : ch === "F" ? "Bb" : "F");
      } else if (root === "D") {
        prog = t.progression.map(ch => ch === "C" ? "D" : ch === "Fm" ? "Gm" : ch === "Ab" ? "Bb" : ch === "Bb" ? "C" : ch === "Eb" ? "G" : ch === "F" ? "A" : "D");
      } else if (root === "A") {
        prog = t.progression.map(ch => ch === "C" ? "A" : ch === "Fm" ? "Dm" : ch === "Ab" ? "F" : ch === "Bb" ? "G" : ch === "Eb" ? "C" : ch === "F" ? "D" : "A");
      } else {
        prog = t.progression.map(ch => ch === "C" ? "E" : ch === "Fm" ? "Am" : ch === "Ab" ? "C" : ch === "Bb" ? "D" : ch === "Eb" ? "G" : ch === "F" ? "A" : "E");
      }

      scenarios.push({
        id: `synth-modal-interchange-${idCounter++}`,
        name: `${t.name} em ${root}`,
        progression: prog,
        options: { strategy: 'OVERALL', goal: t.goal as any },
        category: 'MODAL_INTERCHANGE',
        ambiguityRegion: 'DUAL_DOMINANT_SOLUTION',
        gradingCriteria: {
          expectedMechanisms: ['modal_borrowing']
        }
      });
    }
  }

  // 4. Secondary Dominants (20 Scenarios)
  const secondaryTemplates = [
    { name: "V7/ii secundário clássico", progression: ["C", "A7", "Dm", "G7"] },
    { name: "V7/vi dominando a tônica relativa", progression: ["C", "E7", "Am", "Dm"] },
    { name: "V7/V secundário cadencial", progression: ["C", "D7", "G", "C"] },
    { name: "V7/IV dominando o quarto grau", progression: ["C", "C7", "F", "C"] }
  ];
  const secondaryRoots = ["C", "G", "F", "D", "A"];

  for (const root of secondaryRoots) {
    for (const t of secondaryTemplates) {
      let prog: string[] = [];
      if (root === "C") {
        prog = t.progression;
      } else if (root === "G") {
        prog = t.progression.map(ch => ch === "C" ? "G" : ch === "A7" ? "E7" : ch === "Dm" ? "Am" : ch === "G7" ? "D7" : ch === "E7" ? "B7" : ch === "Am" ? "Em" : ch === "D7" ? "A7" : ch === "G" ? "D" : ch === "C7" ? "G7" : ch === "F" ? "C" : "G");
      } else if (root === "F") {
        prog = t.progression.map(ch => ch === "C" ? "F" : ch === "A7" ? "D7" : ch === "Dm" ? "Gm" : ch === "G7" ? "C7" : ch === "E7" ? "A7" : ch === "Am" ? "Dm" : ch === "D7" ? "G7" : ch === "G" ? "C" : ch === "C7" ? "F7" : ch === "F" ? "Bb" : "F");
      } else if (root === "D") {
        prog = t.progression.map(ch => ch === "C" ? "D" : ch === "A7" ? "B7" : ch === "Dm" ? "Em" : ch === "G7" ? "A7" : ch === "E7" ? "F#7" : ch === "Am" ? "Bm" : ch === "D7" ? "E7" : ch === "G" ? "A" : ch === "C7" ? "D7" : ch === "F" ? "G" : "D");
      } else {
        prog = t.progression.map(ch => ch === "C" ? "A" : ch === "A7" ? "F#7" : ch === "Dm" ? "Bm" : ch === "G7" ? "E7" : ch === "E7" ? "C#7" : ch === "Am" ? "F#m" : ch === "D7" ? "B7" : ch === "G" ? "E" : ch === "C7" ? "A7" : ch === "F" ? "D" : "A");
      }

      scenarios.push({
        id: `synth-secondary-dominants-${idCounter++}`,
        name: `${t.name} em ${root}`,
        progression: prog,
        options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' },
        category: 'SECONDARY_DOMINANTS',
        ambiguityRegion: 'DUAL_DOMINANT_SOLUTION',
        gradingCriteria: {
          expectedDeltas: {
            tensionDelta: { min: -0.1 }
          }
        }
      });
    }
  }

  // 5. Tritone Substitutions (20 Scenarios)
  const tritoneTemplates = [
    { name: "SubV7/I substituto tritônico cadencial", progression: ["C", "Dm7", "Db7", "C"] },
    { name: "SubV7/V preparando a dominante", progression: ["C", "Ab7", "G7", "C"] },
    { name: "SubV7/ii preparando o segundo grau", progression: ["C", "Eb7", "Dm7", "G7"] },
    { name: "SubV7 descendente cromático triplo", progression: ["C", "Eb7", "Dm7", "Db7"] }
  ];
  const tritoneRoots = ["C", "G", "F", "D", "A"];

  for (const root of tritoneRoots) {
    for (const t of tritoneTemplates) {
      let prog: string[] = [];
      if (root === "C") {
        prog = t.progression;
      } else if (root === "G") {
        prog = t.progression.map(ch => ch === "C" ? "G" : ch === "Dm7" ? "Am7" : ch === "Db7" ? "Ab7" : ch === "Ab7" ? "Eb7" : ch === "G7" ? "D7" : ch === "Eb7" ? "Bb7" : "G");
      } else if (root === "F") {
        prog = t.progression.map(ch => ch === "C" ? "F" : ch === "Dm7" ? "Gm7" : ch === "Db7" ? "Gb7" : ch === "Ab7" ? "Db7" : ch === "G7" ? "C7" : ch === "Eb7" ? "Ab7" : "F");
      } else if (root === "D") {
        prog = t.progression.map(ch => ch === "C" ? "D" : ch === "Dm7" ? "Em7" : ch === "Db7" ? "Eb7" : ch === "Ab7" ? "Bb7" : ch === "G7" ? "A7" : ch === "Eb7" ? "F7" : "D");
      } else {
        prog = t.progression.map(ch => ch === "C" ? "A" : ch === "Dm7" ? "Bm7" : ch === "Db7" ? "Bb7" : ch === "Ab7" ? "F7" : ch === "G7" ? "E7" : ch === "Eb7" ? "C7" : "A");
      }

      scenarios.push({
        id: `synth-tritone-substitutions-${idCounter++}`,
        name: `${t.name} em ${root}`,
        progression: prog,
        options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' },
        category: 'TRITONE_SUBSTITUTIONS',
        ambiguityRegion: 'BROAD_PARETO_FRONTIER',
        gradingCriteria: {
          expectedMechanisms: ['tritone']
        }
      });
    }
  }

  // 6. Jazz Reharmonization (20 Scenarios)
  const jazzProgressions = [
    { name: "Jazz ii-V-I Standard", progression: ["Dm7", "G7", "Cmaj7"] },
    { name: "Jazz Turnaround I-VI-ii-V", progression: ["Cmaj7", "A7", "Dm7", "G7"] },
    { name: "Jazz Minor ii-V-i", progression: ["Bm7b5", "E7", "Am7"] },
    { name: "Jazz Coltrane Centered", progression: ["Dm7", "Db7", "Cmaj7"] }
  ];
  const jazzRoots = ["C", "G", "F", "D", "A"];

  for (const root of jazzRoots) {
    for (const t of jazzProgressions) {
      let prog: string[] = [];
      if (root === "C") {
        prog = t.progression;
      } else if (root === "G") {
        prog = t.progression.map(ch => ch === "Dm7" ? "Am7" : ch === "G7" ? "D7" : ch === "Cmaj7" ? "Gmaj7" : ch === "A7" ? "E7" : ch === "Bm7b5" ? "F#m7b5" : ch === "E7" ? "B7" : ch === "Am7" ? "Em7" : ch === "Db7" ? "Ab7" : "G");
      } else if (root === "F") {
        prog = t.progression.map(ch => ch === "Dm7" ? "Gm7" : ch === "G7" ? "C7" : ch === "Cmaj7" ? "Fmaj7" : ch === "A7" ? "D7" : ch === "Bm7b5" ? "Em7b5" : ch === "E7" ? "A7" : ch === "Am7" ? "Dm7" : ch === "Db7" ? "Gb7" : "F");
      } else if (root === "D") {
        prog = t.progression.map(ch => ch === "Dm7" ? "Em7" : ch === "G7" ? "A7" : ch === "Cmaj7" ? "Dmaj7" : ch === "A7" ? "B7" : ch === "Bm7b5" ? "C#m7b5" : ch === "E7" ? "F#7" : ch === "Am7" ? "Bm7" : ch === "Db7" ? "Eb7" : "D");
      } else {
        prog = t.progression.map(ch => ch === "Dm7" ? "Bm7" : ch === "G7" ? "E7" : ch === "Cmaj7" ? "Amaj7" : ch === "A7" ? "F#7" : ch === "Bm7b5" ? "G#m7b5" : ch === "E7" ? "C#7" : ch === "Am7" ? "F#m7" : ch === "Db7" ? "Bb7" : "A");
      }

      scenarios.push({
        id: `synth-jazz-reharm-${idCounter++}`,
        name: `${t.name} em ${root}`,
        progression: prog,
        options: { strategy: 'OVERALL', optimizationProfile: 'MAX_VOICE_LEADING' },
        category: 'JAZZ_REHARMONIZATION',
        ambiguityRegion: 'BROAD_PARETO_FRONTIER',
        gradingCriteria: {
          minPlayability: 0.5
        }
      });
    }
  }

  // 7. Chromatic Mediants (15 Scenarios)
  const mediantTemplates = [
    { name: "Mediante Cromática bVI", progression: ["C", "Ab", "C"] },
    { name: "Mediante Cromática III", progression: ["C", "E", "C"] },
    { name: "Mediante Cromática bIII", progression: ["C", "Eb", "C"] }
  ];
  const mediantRoots = ["C", "G", "F", "D", "A"];

  for (const root of mediantRoots) {
    for (const t of mediantTemplates) {
      let prog: string[] = [];
      if (root === "C") {
        prog = t.progression;
      } else if (root === "G") {
        prog = t.progression.map(ch => ch === "C" ? "G" : ch === "Ab" ? "Eb" : ch === "E" ? "B" : ch === "Eb" ? "Bb" : "G");
      } else if (root === "F") {
        prog = t.progression.map(ch => ch === "C" ? "F" : ch === "Ab" ? "Db" : ch === "E" ? "A" : ch === "Eb" ? "Ab" : "F");
      } else if (root === "D") {
        prog = t.progression.map(ch => ch === "C" ? "D" : ch === "Ab" ? "Bb" : ch === "E" ? "F#" : ch === "Eb" ? "G" : "D");
      } else {
        prog = t.progression.map(ch => ch === "C" ? "A" : ch === "Ab" ? "F" : ch === "E" ? "C#" : ch === "Eb" ? "C" : "A");
      }

      scenarios.push({
        id: `synth-chromatic-mediants-${idCounter++}`,
        name: `${t.name} em ${root}`,
        progression: prog,
        options: { strategy: 'OVERALL', optimizationProfile: 'MAX_PEDAGOGY' },
        category: 'CHROMATIC_MEDIANTS',
        ambiguityRegion: 'HIGHLY_SYMMETRIC_SOLUTIONS',
        gradingCriteria: {
          minPlayability: 0.4
        }
      });
    }
  }

  // 8. Extended Dominants (15 Scenarios)
  const extendedTemplates = [
    { name: "Cadeia de Dominantes Tripla VI-II-V-I", progression: ["C", "A7", "D7", "G7"] },
    { name: "Cadeia de Dominantes Quadrupla III-VI-II-V", progression: ["C", "E7", "A7", "D7"] },
    { name: "Extended Dominants com turnarounds", progression: ["C", "B7", "E7", "A7"] }
  ];
  const extendedRoots = ["C", "G", "F", "D", "A"];

  for (const root of extendedRoots) {
    for (const t of extendedTemplates) {
      let prog: string[] = [];
      if (root === "C") {
        prog = t.progression;
      } else if (root === "G") {
        prog = t.progression.map(ch => ch === "C" ? "G" : ch === "A7" ? "E7" : ch === "D7" ? "A7" : ch === "G7" ? "D7" : ch === "E7" ? "B7" : ch === "B7" ? "F#7" : "G");
      } else if (root === "F") {
        prog = t.progression.map(ch => ch === "C" ? "F" : ch === "A7" ? "D7" : ch === "D7" ? "G7" : ch === "G7" ? "C7" : ch === "E7" ? "A7" : ch === "B7" ? "E7" : "F");
      } else if (root === "D") {
        prog = t.progression.map(ch => ch === "C" ? "D" : ch === "A7" ? "B7" : ch === "D7" ? "E7" : ch === "G7" ? "A7" : ch === "E7" ? "F#7" : ch === "B7" ? "C#7" : "D");
      } else {
        prog = t.progression.map(ch => ch === "C" ? "A" : ch === "A7" ? "F#7" : ch === "D7" ? "B7" : ch === "G7" ? "E7" : ch === "E7" ? "C#7" : ch === "B7" ? "G#7" : "A");
      }

      scenarios.push({
        id: `synth-extended-dominants-${idCounter++}`,
        name: `${t.name} em ${root}`,
        progression: prog,
        options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' },
        category: 'EXTENDED_DOMINANTS',
        ambiguityRegion: 'HIGHLY_SYMMETRIC_SOLUTIONS',
        gradingCriteria: {
          expectedDeltas: {
            tensionDelta: { min: -0.1 }
          }
        }
      });
    }
  }

  // 9. Extra Borrowed & Symmetry cases to top up exactly to 150 scenarios
  let topUpCount = 150 - scenarios.length;
  for (let i = 0; i < topUpCount; i++) {
    scenarios.push({
      id: `synth-topup-borrowed-${idCounter++}`,
      name: `Top-up Borrowed Progression Variation #${i + 1}`,
      progression: ["C", "F", "Ab", "Bb", "C"],
      options: { strategy: 'OVERALL', optimizationProfile: 'BALANCED' },
      category: 'BORROWED_CHORDS',
      ambiguityRegion: 'BROAD_PARETO_FRONTIER',
      gradingCriteria: {
        expectedMechanisms: ['modal_borrowing']
      }
    });
  }

  return scenarios;
}

/**
 * Automated grading engine to evaluate a synthetic scenario's performance.
 * Returns a score between 1.0 and 5.0.
 */
export function gradeScenarioResult(match: DiscoveryMatch | undefined, scenario: SyntheticScenario): number {
  if (scenario.gradingCriteria.expectedFailure) {
    if (!match || !match.recommendedPaths || match.recommendedPaths.length === 0) {
      return 5.0;
    }
    const confidence = match.recommendationDecision?.confidence ?? 0;
    return confidence < 0.5 ? 5.0 : 3.0;
  }

  if (!match || !match.recommendedPaths || match.recommendedPaths.length === 0) {
    return 1.0;
  }

  let score = 5.0;
  const winner = match.recommendedPaths[0];
  const exec = winner.executionResult;

  // 1. Hard constraint violation check
  const finalScore = winner.finalScore ?? 0;
  const penalty = finalScore < -100 ? 1 : 0;
  if (penalty > 0) {
    score -= 2.0;
  }

  if (exec && exec.stateTransition) {
    const deltas = exec.stateTransition;

    // 2. Goal checks
    if (scenario.options.goal === 'INCREASE_TENSION') {
      const targetMin = scenario.gradingCriteria.expectedDeltas?.tensionDelta?.min ?? -0.05;
      if (deltas.tensionDelta < targetMin) {
        score -= 1.5;
      }
    }
    if (scenario.options.goal === 'PRESERVE_FUNCTION') {
      const targetMin = scenario.gradingCriteria.expectedDeltas?.functionalStabilityDelta?.min ?? -0.05;
      if (deltas.functionalStabilityDelta < targetMin) {
        score -= 1.5;
      }
    }

    // 3. Strategy checks
    if (scenario.options.optimizationProfile === 'MAX_PLAYABILITY') {
      const avgComplexity = winner.steps.reduce((sum, s) => sum + s.physicalComplexity, 0) / winner.steps.length;
      const playability = Math.max(0.0, 1.0 - avgComplexity - 0.05 * winner.steps.length);
      const minPlay = scenario.gradingCriteria.minPlayability ?? 0.6;
      if (playability < minPlay) {
        score -= 1.0;
      }
    }
    if (scenario.options.optimizationProfile === 'MAX_VOICE_LEADING') {
      const targetMin = scenario.gradingCriteria.expectedDeltas?.voiceLeadingQualityDelta?.min ?? -0.1;
      if (deltas.voiceLeadingQualityDelta < targetMin) {
        score -= 1.0;
      }
    }
  }

  // 4. Expected mechanisms check
  if (scenario.gradingCriteria.expectedMechanisms && scenario.gradingCriteria.expectedMechanisms.length > 0) {
    const winnerStepIds = winner.steps.map(s => s.id.toLowerCase());
    const hasExpected = scenario.gradingCriteria.expectedMechanisms.some(mech => 
      winnerStepIds.some(id => id.includes(mech))
    );
    if (!hasExpected) {
      score -= 1.0;
    }
  }

  // Clamp score
  return Math.max(1.0, Math.min(5.0, score));
}
