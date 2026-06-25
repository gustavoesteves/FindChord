import { Chord, Note } from "tonal";
import type { PhraseContext } from "../engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { ReharmonizationMeasure, ReharmonizationProposal } from "../models/ReharmonizationProposal";
import {
  noteCoveredByChord,
  validateHarmonicStrategy,
  type HarmonicStrategyId,
  type HarmonicStrategyValidation,
  type HarmonizationCandidate,
  type StrategyFunctionId
} from "./HarmonicStrategyValidator";

interface StrategyAttempt {
  candidate: HarmonizationCandidate;
  validation: HarmonicStrategyValidation;
  proposal: ReharmonizationProposal | null;
}

const DIATONIC_ROMAN_INTERVALS: Record<string, string> = {
  I: "1P",
  ii: "2M",
  iii: "3M",
  IV: "4P",
  V: "5P",
  vi: "6M",
  vii: "7M"
};

const ROMAN_QUALITY: Record<string, string> = {
  I: "",
  ii: "m",
  iii: "m",
  IV: "",
  V: "",
  vi: "m",
  vii: "m7b5"
};

const STRATEGY_LABELS: Record<HarmonicStrategyId, string> = {
  I_IV_V: "Estratégia — Harmonia básica I-IV-V",
  EXPANSAO_FUNCIONAL_DIATONICA: "Estratégia — Expansão funcional diatônica",
  DOMINANTES_SECUNDARIAS: "Estratégia — Dominantes secundárias"
};

export class StrategyGuidedHarmonizer {
  public static generateAcceptedProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    const strategies: HarmonicStrategyId[] = ["I_IV_V", "EXPANSAO_FUNCIONAL_DIATONICA", "DOMINANTES_SECUNDARIAS"];
    return strategies
      .map(strategy => this.tryStrategy(strategy, anchors, phraseContext))
      .filter((attempt): attempt is StrategyAttempt & { proposal: ReharmonizationProposal } => attempt.proposal !== null)
      .map(attempt => attempt.proposal);
  }

  public static tryStrategy(
    strategy: HarmonicStrategyId,
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): StrategyAttempt {
    const center = phraseContext.selectedCenter.tonic;
    const measures = this.buildMeasuresForStrategy(strategy, anchors, center);

    const candidate: HarmonizationCandidate = {
      strategy,
      center,
      measures,
      melody: anchors
    };

    const validation = validateHarmonicStrategy(candidate);
    return {
      candidate,
      validation,
      proposal: validation.accepted ? this.toProposal(candidate, phraseContext, validation) : null
    };
  }

  private static buildMeasuresForStrategy(
    strategy: HarmonicStrategyId,
    anchors: MelodicAnchor[],
    center: string
  ): ReharmonizationMeasure[] {
    if (strategy === "I_IV_V") return this.buildPrimaryTriadMeasures(anchors, center);
    if (strategy === "DOMINANTES_SECUNDARIAS") return this.buildSecondaryDominantMeasures(anchors, center);
    return this.buildDiatonicExpansionMeasures(anchors, center);
  }

  private static buildPrimaryTriadMeasures(anchors: MelodicAnchor[], center: string): ReharmonizationMeasure[] {
    const measureIndexes = this.getMeasureIndexes(anchors);
    return measureIndexes.map((measureIndex, idx) => {
      const fn = this.backboneFunctionForIndex(idx, measureIndexes.length);
      const roman = fn === "PD" ? "IV" : fn === "D" ? "V" : "I";
      return {
        measureIndex,
        chords: [this.chordFromRoman(center, roman)]
      };
    });
  }

  private static buildDiatonicExpansionMeasures(anchors: MelodicAnchor[], center: string): ReharmonizationMeasure[] {
    const measureIndexes = this.getMeasureIndexes(anchors);
    return measureIndexes.map((measureIndex, idx) => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      const fn = this.backboneFunctionForIndex(idx, measureIndexes.length);
      const isFinal = idx === measureIndexes.length - 1;

      if (fn === "T" && isFinal) {
        return { measureIndex, chords: [this.chordFromRoman(center, "I")] };
      }

      if (fn === "T") {
        return {
          measureIndex,
          chords: [
            this.chordFromRoman(center, "I"),
            this.bestCoveringChord(center, ["vi", "iii"], measureAnchors)
          ]
        };
      }

      if (fn === "PD") {
        const base = this.bestCoveringChord(center, ["ii", "IV"], measureAnchors);
        return {
          measureIndex,
          chords: [base, this.withOptionalBass(base, measureAnchors[measureAnchors.length - 1]?.pitch)]
        };
      }

      return {
        measureIndex,
        chords: [
          this.chordFromRoman(center, "vii"),
          this.chordFromRoman(center, "V") + "7"
        ]
      };
    });
  }

  private static buildSecondaryDominantMeasures(anchors: MelodicAnchor[], center: string): ReharmonizationMeasure[] {
    const expanded = this.buildDiatonicExpansionMeasures(anchors, center);
    return expanded.map(measure => {
      const enriched: string[] = [];
      let insertedSecondary = false;
      for (const chord of measure.chords) {
        const targetRoman = this.romanForChordRoot(Chord.tokenize(chord.split("/")[0])[0], center);
        const dominant = !insertedSecondary && ["ii", "IV", "V"].includes(targetRoman)
          ? this.secondaryDominantForTarget(chord, center)
          : null;
        if (dominant) enriched.push(dominant);
        if (dominant) insertedSecondary = true;
        enriched.push(chord);
      }

      return {
        measureIndex: measure.measureIndex,
        chords: enriched
      };
    });
  }

  private static getMeasureIndexes(anchors: MelodicAnchor[]): number[] {
    return Array.from(new Set(anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b);
  }

  private static backboneFunctionForIndex(index: number, total: number): StrategyFunctionId {
    if (index === 0 || index === total - 1) return "T";
    if (index === total - 2) return "D";
    return "PD";
  }

  private static chordFromRoman(center: string, roman: string): string {
    const interval = DIATONIC_ROMAN_INTERVALS[roman] || "1P";
    const root = Note.pitchClass(Note.transpose(`${center}4`, interval));
    return `${root}${ROMAN_QUALITY[roman] || ""}`;
  }

  private static secondaryDominantForTarget(targetChord: string, center: string): string | null {
    const targetRoot = Chord.tokenize(targetChord.split("/")[0])[0];
    if (!targetRoot) return null;

    const targetRoman = this.romanForChordRoot(targetRoot, center);
    if (!["ii", "IV", "V", "vi"].includes(targetRoman)) return null;

    const dominantRoot = Note.pitchClass(Note.transpose(`${targetRoot}4`, "5P"));
    return `${dominantRoot}7`;
  }

  private static romanForChordRoot(root: string, center: string): string {
    const centerChroma = Note.chroma(center);
    const rootChroma = Note.chroma(root);
    if (centerChroma === undefined || rootChroma === undefined) return "?";

    const degree = (rootChroma - centerChroma + 12) % 12;
    const romans: Record<number, string> = {
      0: "I",
      2: "ii",
      4: "iii",
      5: "IV",
      7: "V",
      9: "vi",
      11: "vii"
    };

    return romans[degree] || "?";
  }

  private static bestCoveringChord(center: string, romans: string[], anchors: MelodicAnchor[]): string {
    const candidates = romans.map(roman => this.chordFromRoman(center, roman));
    let best = candidates[0];
    let bestScore = -Infinity;

    for (const chord of candidates) {
      const score = anchors.filter(anchor => noteCoveredByChord(anchor.pitch, chord)).length;
      if (score > bestScore) {
        best = chord;
        bestScore = score;
      }
    }

    return best;
  }

  private static withOptionalBass(chord: string, bassPitch?: string): string {
    const bass = bassPitch ? Note.pitchClass(bassPitch) : "";
    if (!bass) return chord;

    const chordNotes = Chord.get(chord).notes.map((note: string) => Note.pitchClass(note));
    if (chordNotes.includes(bass) && bass !== Note.pitchClass(Chord.tokenize(chord)[0])) {
      return `${chord}/${bass}`;
    }

    return chord;
  }

  private static toProposal(
    candidate: HarmonizationCandidate,
    phraseContext: PhraseContext,
    validation: HarmonicStrategyValidation
  ): ReharmonizationProposal {
    return {
      id: `strategy_${candidate.strategy.toLowerCase()}`,
      name: STRATEGY_LABELS[candidate.strategy],
      measures: candidate.measures,
      explanation: [
        `Backbone validado: ${validation.report.backbone.join(" -> ")}`,
        `Cobertura melódica: ${Math.round(validation.report.melodyCoverage * 100)}%`,
        `Densidade: ${validation.report.chordCount} acordes`,
        ...(validation.report.secondaryDominantExcursions > 0
          ? [`Dominantes secundárias resolvidas: ${validation.report.secondaryDominantExcursions}`]
          : []),
        `Expansões: ${validation.report.expansions.join(", ")}`
      ],
      bassLine: candidate.measures.flatMap(measure => measure.chords.map(chord => chord.split("/")[1] || Chord.tokenize(chord)[0] || chord)),
      detectedMotives: [],
      phraseContext
    };
  }
}
