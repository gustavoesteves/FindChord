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

interface MeasureStructuralProfile {
  measureIndex: number;
  isCadential: boolean;
  isRepeated: boolean;
  hasPassingMotion: boolean;
  shouldExpand: boolean;
  shouldIntensify: boolean;
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
  DOMINANTES_SECUNDARIAS: "Estratégia — Dominantes secundárias",
  DIMINUTO_PASSAGEM: "Estratégia — Diminutos de passagem"
};

export class StrategyGuidedHarmonizer {
  public static generateAcceptedProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    const strategies: HarmonicStrategyId[] = [
      "I_IV_V",
      "EXPANSAO_FUNCIONAL_DIATONICA",
      "DOMINANTES_SECUNDARIAS",
      "DIMINUTO_PASSAGEM"
    ];
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
      proposal: validation.accepted ? this.toProposal(candidate, validation) : null
    };
  }

  private static buildMeasuresForStrategy(
    strategy: HarmonicStrategyId,
    anchors: MelodicAnchor[],
    center: string
  ): ReharmonizationMeasure[] {
    const measures = strategy === "I_IV_V"
      ? this.buildPrimaryTriadMeasures(anchors, center)
      : strategy === "DOMINANTES_SECUNDARIAS"
        ? this.buildSecondaryDominantMeasures(anchors, center)
        : strategy === "DIMINUTO_PASSAGEM"
          ? this.buildPassingDiminishedMeasures(anchors, center)
          : this.buildDiatonicExpansionMeasures(anchors, center);

    return this.applyIdiomaticFunctionalPatterns(measures, anchors, center);
  }

  private static buildPrimaryTriadMeasures(anchors: MelodicAnchor[], center: string): ReharmonizationMeasure[] {
    const measureIndexes = this.getMeasureIndexes(anchors);
    return measureIndexes.map((measureIndex, idx) => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      const roman = measureIndexes.length > 4
        ? this.bestPrimaryRomanForMeasure(center, measureAnchors, idx, measureIndexes.length)
        : this.primaryRomanForFunction(this.backboneFunctionForIndex(idx, measureIndexes.length));
      return {
        measureIndex,
        chords: [this.chordFromRoman(center, roman)]
      };
    });
  }

  private static buildDiatonicExpansionMeasures(anchors: MelodicAnchor[], center: string): ReharmonizationMeasure[] {
    const measureIndexes = this.getMeasureIndexes(anchors);
    const profiles = this.classifyMeasureProfiles(anchors, measureIndexes);
    const primaryByMeasure = new Map(this.buildPrimaryTriadMeasures(anchors, center).map(measure => [measure.measureIndex, measure.chords[0]]));
    return measureIndexes.map((measureIndex, idx) => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      const base = primaryByMeasure.get(measureIndex) || this.chordFromRoman(center, "I");
      const profile = profiles[idx];
      const fn = this.backboneFunctionForIndex(idx, measureIndexes.length);
      const isFinal = this.isPhraseFinalIndex(idx, measureIndexes.length);

      if (measureIndexes.length > 4 && !profile.shouldExpand) {
        return { measureIndex, chords: [base] };
      }

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
    const measureIndexes = this.getMeasureIndexes(anchors);
    const profiles = this.classifyMeasureProfiles(anchors, measureIndexes);
    return expanded.map((measure, idx) => {
      const enriched: string[] = [];
      let insertedSecondary = false;
      const profile = profiles[idx];
      for (const chord of measure.chords) {
        const targetRoman = this.romanForChordRoot(Chord.tokenize(chord.split("/")[0])[0], center);
        const dominant = profile.shouldIntensify && !insertedSecondary && ["ii", "IV", "V"].includes(targetRoman)
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

  private static buildPassingDiminishedMeasures(anchors: MelodicAnchor[], center: string): ReharmonizationMeasure[] {
    const expanded = this.buildDiatonicExpansionMeasures(anchors, center);
    const measureIndexes = this.getMeasureIndexes(anchors);
    const profiles = this.classifyMeasureProfiles(anchors, measureIndexes);
    return expanded.map((measure, idx) => {
      const enriched: string[] = [];
      let insertedDiminished = false;
      const profile = profiles[idx];

      for (const chord of measure.chords) {
        const targetRoman = this.romanForChordRoot(Chord.tokenize(chord.split("/")[0])[0], center);
        const passingDiminished = profile.shouldIntensify && !insertedDiminished && ["IV", "V", "vi"].includes(targetRoman)
          ? this.passingDiminishedForTarget(chord)
          : null;

        if (passingDiminished) {
          enriched.push(passingDiminished);
          insertedDiminished = true;
        }
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

  private static classifyMeasureProfiles(anchors: MelodicAnchor[], measureIndexes: number[]): MeasureStructuralProfile[] {
    return measureIndexes.map((measureIndex, idx) => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      const previousAnchors = idx > 0 ? anchors.filter(anchor => anchor.measureIndex === measureIndexes[idx - 1]) : [];
      const notes = measureAnchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
      const previousNotes = previousAnchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
      const isCadential = this.isPhraseFinalIndex(idx, measureIndexes.length) || idx === measureIndexes.length - 2;
      const isRepeated = notes.length > 0 && previousNotes.length > 0 && notes.join("-") === previousNotes.join("-");
      const hasPassingMotion = this.hasStepwiseMotion(notes);
      const shouldExpand = measureIndexes.length <= 4 || isCadential || isRepeated;

      return {
        measureIndex,
        isCadential,
        isRepeated,
        hasPassingMotion,
        shouldExpand,
        shouldIntensify: measureIndexes.length <= 4 || isCadential || (isRepeated && !hasPassingMotion)
      };
    });
  }

  private static hasStepwiseMotion(notes: string[]): boolean {
    for (let i = 1; i < notes.length; i++) {
      const previous = Note.chroma(notes[i - 1]);
      const current = Note.chroma(notes[i]);
      if (previous === undefined || current === undefined) continue;
      const interval = Math.min((current - previous + 12) % 12, (previous - current + 12) % 12);
      if (interval <= 2) return true;
    }
    return false;
  }

  private static backboneFunctionForIndex(index: number, total: number): StrategyFunctionId {
    const phraseStart = total > 4 ? Math.floor(index / 4) * 4 : 0;
    const phraseEnd = total > 4 ? Math.min(phraseStart + 4, total) : total;
    const localIndex = index - phraseStart;
    const localTotal = phraseEnd - phraseStart;

    if (localIndex === 0 || localIndex === localTotal - 1) return "T";
    if (localIndex === localTotal - 2) return "D";
    return "PD";
  }

  private static isPhraseFinalIndex(index: number, total: number): boolean {
    if (total <= 4) return index === total - 1;
    const phraseStart = Math.floor(index / 4) * 4;
    const phraseEnd = Math.min(phraseStart + 4, total);
    return index === phraseEnd - 1;
  }

  private static primaryRomanForFunction(fn: StrategyFunctionId): string {
    if (fn === "PD") return "IV";
    if (fn === "D") return "V";
    return "I";
  }

  private static bestPrimaryRomanForMeasure(
    center: string,
    anchors: MelodicAnchor[],
    index: number,
    total: number
  ): string {
    if (index === total - 1) return "I";
    if (index === total - 2) return "V";

    const phrasePosition = index % 4;
    const notes = anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
    const invitesSubdominantResponse = phrasePosition === 1 && notes.includes(Note.pitchClass(center)) && this.hasStepwiseMotion(notes);
    if (invitesSubdominantResponse) return "IV";

    const candidates = ["I", "IV", "V"];
    const positionBias: Record<string, number> = {
      I: phrasePosition === 0 || phrasePosition === 3 ? 0.45 : 0.2,
      IV: phrasePosition === 1 ? 0.25 : 0,
      V: phrasePosition === 2 ? 0.35 : 0
    };

    let bestRoman = "I";
    let bestScore = -Infinity;

    for (const roman of candidates) {
      const chord = this.chordFromRoman(center, roman);
      const coverage = anchors.reduce((sum, anchor) => (
        noteCoveredByChord(anchor.pitch, chord) ? sum + Math.max(1, anchor.duration || 1) : sum
      ), 0);
      const score = coverage + positionBias[roman];
      if (score > bestScore) {
        bestRoman = roman;
        bestScore = score;
      }
    }

    return bestRoman;
  }

  private static applyIdiomaticFunctionalPatterns(
    measures: ReharmonizationMeasure[],
    anchors: MelodicAnchor[],
    center: string
  ): ReharmonizationMeasure[] {
    if (this.getMeasureIndexes(anchors).length <= 4) return measures;

    const idiomatic = measures.map(measure => ({
      ...measure,
      chords: [...measure.chords]
    }));

    this.prepareSubdominantWithTonicDominant(idiomatic, center);
    this.realizeCadentialDominantWithGuidedBass(idiomatic, center);

    return idiomatic;
  }

  private static prepareSubdominantWithTonicDominant(measures: ReharmonizationMeasure[], center: string): void {
    for (let i = 1; i < measures.length; i++) {
      const currentFirst = measures[i].chords[0];
      const previous = measures[i - 1];
      const previousLastIndex = previous.chords.length - 1;
      const previousLast = previous.chords[previousLastIndex];
      const isSubdominantTarget = this.romanForChordRoot(Chord.tokenize(currentFirst.split("/")[0])[0], center) === "IV";
      const previousIsTonic = this.romanForChordRoot(Chord.tokenize(previousLast.split("/")[0])[0], center) === "I";

      if (i === 1 || !isSubdominantTarget || !previousIsTonic || previousLast.includes("7")) continue;
      previous.chords[previousLastIndex] = `${this.chordFromRoman(center, "I")}7`;
    }
  }

  private static realizeCadentialDominantWithGuidedBass(measures: ReharmonizationMeasure[], center: string): void {
    let guidedBassCount = 0;
    for (let i = 0; i < measures.length - 1; i++) {
      const current = measures[i];
      const currentLastIndex = current.chords.length - 1;
      const currentLast = current.chords[currentLastIndex];
      const nextFirst = measures[i + 1].chords[0];
      const currentIsDominant = this.romanForChordRoot(Chord.tokenize(currentLast.split("/")[0])[0], center) === "V";
      const nextIsTonic = this.romanForChordRoot(Chord.tokenize(nextFirst.split("/")[0])[0], center) === "I";
      const shouldGuideBass = guidedBassCount === 0 || i >= measures.length - 3;
      if (!shouldGuideBass || !currentIsDominant || !nextIsTonic || currentLast.includes("/")) continue;

      const dominantRoot = Chord.tokenize(currentLast)[0] || this.chordFromRoman(center, "V");
      const leadingBass = Note.pitchClass(Note.transpose(`${center}4`, "-2m"));
      current.chords[currentLastIndex] = `${dominantRoot}7/${leadingBass}`;
      guidedBassCount++;
    }
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

  private static passingDiminishedForTarget(targetChord: string): string | null {
    const targetRoot = Chord.tokenize(targetChord.split("/")[0])[0];
    if (!targetRoot) return null;

    const leadingRoot = Note.pitchClass(Note.transpose(`${targetRoot}4`, "-2m"));
    return `${leadingRoot}dim`;
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
        ...(validation.report.diminishedPassingExcursions > 0
          ? [`Diminutos de passagem resolvidos: ${validation.report.diminishedPassingExcursions}`]
          : []),
        `Expansões: ${validation.report.expansions.join(", ")}`
      ],
      bassLine: candidate.measures.flatMap(measure => measure.chords.map(chord => chord.split("/")[1] || Chord.tokenize(chord)[0] || chord))
    };
  }
}
