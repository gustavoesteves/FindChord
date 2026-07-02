import { Note } from "tonal";
import type { PhraseContext } from "../engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { ReharmonizationMeasure, ReharmonizationProposal } from "../models/ReharmonizationProposal";
import { chordPitchClasses, chordRoot } from "../../theory/ChordSymbolResolver";
import { FunctionalRegionPlanner, type MeasureFunctionalRegion } from "./FunctionalRegionPlanner";
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
  region: MeasureFunctionalRegion;
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
  DIMINUTO_PASSAGEM: "Estratégia — Diminutos de passagem",
  SUBV7_CADENCIAL: "Estratégia — SubV7 cadencial",
  II_SUBV7_CADENCIAL: "Estratégia — ii-SubV7 cadencial"
};

const EXPANSION_EXPLANATIONS: Record<string, string> = {
  PROLONG_VIA_SECONDARY: "prolonga a região de repouso com um acorde representante",
  SUSTAIN: "sustenta a preparação subdominante sem sair da função",
  PREPARE_NEXT_REGION: "reforça a preparação antes da resolução",
  CADENTIAL_RESOLUTION: "fecha a frase com resolução cadencial",
  SECONDARY_DOMINANT_RESOLUTION: "usa dominante auxiliar com resolução local",
  DIMINISHED_PASSING_RESOLUTION: "usa diminuto de passagem com resolução por aproximação",
  TRITONE_SUBSTITUTION_RESOLUTION: "substitui a dominante por trítono com resolução cromática",
  II_SUBV7_PREPARATION: "encadeia ii cromático diretamente ao SubV7"
};

const FUNCTION_EXPLANATIONS: Record<StrategyFunctionId, string> = {
  T: "repouso",
  PD: "preparação",
  D: "tensão",
  OTHER: "evento auxiliar"
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
      "DIMINUTO_PASSAGEM",
      "SUBV7_CADENCIAL",
      "II_SUBV7_CADENCIAL"
    ];
    const strategyProposals = strategies
      .map(strategy => this.tryStrategy(strategy, anchors, phraseContext))
      .filter((attempt): attempt is StrategyAttempt & { proposal: ReharmonizationProposal } => attempt.proposal !== null)
      .map(attempt => attempt.proposal);

    return [
      ...strategyProposals,
      ...this.buildLocalIiVProposals(anchors, phraseContext),
      ...this.buildBluesProposals(anchors, phraseContext),
      ...this.buildModalProposals(anchors, phraseContext),
      ...this.buildMinorFunctionalProposals(anchors, phraseContext)
    ];
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
          : strategy === "SUBV7_CADENCIAL"
            ? this.buildCadentialSubV7Measures(anchors, center)
            : strategy === "II_SUBV7_CADENCIAL"
              ? this.buildCadentialIiSubV7Measures(anchors, center)
            : this.buildDiatonicExpansionMeasures(anchors, center);

    return this.applyIdiomaticFunctionalPatterns(measures, anchors, center);
  }

  private static buildPrimaryTriadMeasures(anchors: MelodicAnchor[], center: string): ReharmonizationMeasure[] {
    const measureIndexes = this.getMeasureIndexes(anchors);
    const regions = FunctionalRegionPlanner.planFromAnchors(anchors, center);
    return measureIndexes.map((measureIndex, idx) => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      const roman = measureIndexes.length > 4
        ? this.bestPrimaryRomanForMeasure(center, measureAnchors, regions[idx], regions.length)
        : this.primaryRomanForFunction(regions[idx].functionId);
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
      const fn = profile.region.functionId;
      const isFinal = profile.region.isPhraseFinal;

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
        const targetRoman = this.romanForChordRoot(this.rootOfChord(chord), center);
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
        const targetRoman = this.romanForChordRoot(this.rootOfChord(chord), center);
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

  private static buildCadentialSubV7Measures(anchors: MelodicAnchor[], center: string): ReharmonizationMeasure[] {
    const measures = this.buildPrimaryTriadMeasures(anchors, center).map(measure => ({
      ...measure,
      chords: [...measure.chords]
    }));
    const regions = FunctionalRegionPlanner.planFromAnchors(anchors, center);
    const authenticClosures = regions.filter(region => region.cadenceKind === "AUTHENTIC");
    const targetClosure = authenticClosures[authenticClosures.length - 1];
    if (!targetClosure) return measures;

    const closureIndex = measures.findIndex(measure => measure.measureIndex === targetClosure.measureIndex);
    if (closureIndex <= 0) return measures;

    const dominantMeasure = measures[closureIndex - 1];
    dominantMeasure.chords = [this.subV7ForTarget(targetClosure.cadentialTarget || center)];
    return measures;
  }

  private static buildCadentialIiSubV7Measures(anchors: MelodicAnchor[], center: string): ReharmonizationMeasure[] {
    const measures = this.buildPrimaryTriadMeasures(anchors, center).map(measure => ({
      ...measure,
      chords: [...measure.chords]
    }));
    const regions = FunctionalRegionPlanner.planFromAnchors(anchors, center);
    const authenticClosures = regions.filter(region => region.cadenceKind === "AUTHENTIC");
    const targetClosure = authenticClosures[authenticClosures.length - 1];
    if (!targetClosure) return measures;

    const closureIndex = measures.findIndex(measure => measure.measureIndex === targetClosure.measureIndex);
    if (closureIndex <= 0) return measures;

    const target = targetClosure.cadentialTarget || center;
    const dominantMeasure = measures[closureIndex - 1];
    dominantMeasure.chords = [this.iiSubV7ForTarget(target), this.subV7ForTarget(target)];
    return measures;
  }

  private static getMeasureIndexes(anchors: MelodicAnchor[]): number[] {
    return Array.from(new Set(anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b);
  }

  private static classifyMeasureProfiles(anchors: MelodicAnchor[], measureIndexes: number[]): MeasureStructuralProfile[] {
    const regions = FunctionalRegionPlanner.planFromAnchors(anchors);
    return measureIndexes.map((measureIndex, idx) => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      const previousAnchors = idx > 0 ? anchors.filter(anchor => anchor.measureIndex === measureIndexes[idx - 1]) : [];
      const notes = measureAnchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
      const previousNotes = previousAnchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
      const region = regions[idx];
      const isCadential = region.isPhraseFinal || idx === measureIndexes.length - 2;
      const isRepeated = notes.length > 0 && previousNotes.length > 0 && notes.join("-") === previousNotes.join("-");
      const hasPassingMotion = this.hasStepwiseMotion(notes);
      const shouldExpand = measureIndexes.length <= 4 || isCadential || isRepeated;

      return {
        measureIndex,
        region,
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

  private static primaryRomanForFunction(fn: StrategyFunctionId): string {
    if (fn === "PD") return "IV";
    if (fn === "D") return "V";
    return "I";
  }

  private static bestPrimaryRomanForMeasure(
    center: string,
    anchors: MelodicAnchor[],
    region: MeasureFunctionalRegion,
    total: number
  ): string {
    if (region.absoluteIndex === total - 1) return "I";
    if (region.absoluteIndex === total - 2) return "V";

    const phrasePosition = region.localIndex;
    const notes = anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
    const subdominantRoot = Note.pitchClass(Note.transpose(`${center}4`, "4P"));
    const hasProminentSubdominant = this.hasProminentPitch(anchors, subdominantRoot);
    const invitesSubdominantResponse = phrasePosition === 1 && notes.includes(Note.pitchClass(center)) && this.hasStepwiseMotion(notes);
    if (invitesSubdominantResponse) return "IV";
    if (phrasePosition === 3 && hasProminentSubdominant) return "IV";
    if (phrasePosition === 0 && hasProminentSubdominant && this.hasStepwiseMotion(notes)) return "IV";

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

  private static hasProminentPitch(anchors: MelodicAnchor[], pitchClass: string): boolean {
    if (!pitchClass || anchors.length === 0) return false;

    const totalDuration = anchors.reduce((sum, anchor) => sum + Math.max(1, anchor.duration || 1), 0);
    const pitchDuration = anchors.reduce((sum, anchor) => (
      Note.pitchClass(anchor.pitch) === pitchClass
        ? sum + Math.max(1, anchor.duration || 1)
        : sum
    ), 0);

    return pitchDuration / totalDuration >= 0.3;
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
      const isSubdominantTarget = this.romanForChordRoot(this.rootOfChord(currentFirst), center) === "IV";
      const previousIsTonic = this.romanForChordRoot(this.rootOfChord(previousLast), center) === "I";

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
      const currentIsDominant = this.romanForChordRoot(this.rootOfChord(currentLast), center) === "V";
      const nextIsTonic = this.romanForChordRoot(this.rootOfChord(nextFirst), center) === "I";
      const shouldGuideBass = guidedBassCount === 0 || i >= measures.length - 3;
      if (!shouldGuideBass || !currentIsDominant || !nextIsTonic || currentLast.includes("/")) continue;

      const dominantRoot = this.rootOfChord(currentLast) || this.chordFromRoman(center, "V");
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
    const targetRoot = this.rootOfChord(targetChord);
    if (!targetRoot) return null;

    const targetRoman = this.romanForChordRoot(targetRoot, center);
    if (!["ii", "IV", "V", "vi"].includes(targetRoman)) return null;

    const dominantRoot = Note.pitchClass(Note.transpose(`${targetRoot}4`, "5P"));
    return `${dominantRoot}7`;
  }

  private static passingDiminishedForTarget(targetChord: string): string | null {
    const targetRoot = this.rootOfChord(targetChord);
    if (!targetRoot) return null;

    const leadingRoot = Note.pitchClass(Note.transpose(`${targetRoot}4`, "-2m"));
    return `${leadingRoot}dim`;
  }

  private static subV7ForTarget(targetPitch: string): string {
    const target = Note.pitchClass(targetPitch) || "C";
    const subRoot = Note.pitchClass(Note.transpose(`${target}4`, "2m"));
    return `${subRoot}7`;
  }

  private static iiSubV7ForTarget(targetPitch: string): string {
    const target = Note.pitchClass(targetPitch) || "C";
    const subRoot = Note.pitchClass(Note.transpose(`${target}4`, "2m"));
    const iiRoot = Note.pitchClass(Note.transpose(`${subRoot}4`, "5P"));
    return `${iiRoot}m7`;
  }

  private static rootOfChord(chord: string): string {
    return chordRoot(chord.split("/")[0]) || chord.match(/^[A-G](?:#|b)?/)?.[0] || "";
  }

  private static bassOrRootOfChord(chord: string): string {
    const bass = chord.split("/")[1];
    return bass ? Note.pitchClass(bass) || bass : this.rootOfChord(chord);
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

    const chordNotes = chordPitchClasses(chord, false);
    if (chordNotes.includes(bass) && bass !== Note.pitchClass(this.rootOfChord(chord))) {
      return `${chord}/${bass}`;
    }

    return chord;
  }

  private static buildLocalIiVProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    const proposals: ReharmonizationProposal[] = [];
    const phraseEndingProposal = this.buildPhraseEndingIiVProposal(anchors, phraseContext);
    if (phraseEndingProposal) proposals.push(phraseEndingProposal);

    for (const proposal of this.buildWindowedIiVProposals(anchors, phraseContext)) {
      if (!proposals.some(existing => existing.measures.map(measure => measure.measureIndex).join("-") === proposal.measures.map(measure => measure.measureIndex).join("-"))) {
        proposals.push(proposal);
      }
    }

    return proposals;
  }

  private static buildPhraseEndingIiVProposal(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal | null {
    const localTonic = Note.pitchClass(phraseContext.cadentialTarget.targetPitch);
    const globalTonic = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!localTonic || !globalTonic || localTonic === globalTonic) return null;

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length < 3 || phraseContext.cadentialTarget.confidence < 0.5) return null;

    const localMode = this.inferLocalIiVMode(globalTonic, localTonic);
    const chords = this.localIiVChords(localTonic, localMode);
    const targetMeasures = measureIndexes.slice(-3);
    const measures = targetMeasures.map((measureIndex, index) => ({
      measureIndex,
      chords: [chords[index]]
    }));

    if (!this.localIiVCoversMelody(measures, anchors, localTonic)) return null;

    return {
      id: `strategy_local_iiv_${localTonic.toLowerCase()}`,
      kind: "validated-harmonization",
      name: "Estratégia — Gramática funcional ii-V",
      measures,
      explanation: [
        `cria uma cadência local para ${localTonic}`,
        localMode === "minor"
          ? "usa preparação meio-diminuta antes da dominante local"
          : "usa preparação predominante antes da dominante local",
        "preserva a chegada melódica como ponto de resolução"
      ],
      bassLine: chords.map(chord => this.rootOfChord(chord) || chord)
    };
  }

  private static buildBluesProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    if (phraseContext.selectedCenter.mode !== "major") return [];

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center || !this.hasBluesMelodicVocabulary(anchors, center)) return [];

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length < 4) return [];

    const measures = measureIndexes.map((measureIndex, index) => ({
      measureIndex,
      chords: [this.bluesChordForMeasure(center, index, measureIndexes.length)]
    }));

    if (!this.bluesProposalCoversMelody(measures, anchors)) return [];

    return [{
      id: `strategy_blues_${center.toLowerCase()}`,
      kind: "validated-harmonization",
      name: "Estratégia — Blues funcional",
      measures,
      explanation: [
        "trata I7 como repouso idiomático, não como dominante pendente",
        "usa IV7 como região estável de resposta",
        "preserva b3 e b7 como cores estruturais do blues"
      ],
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.rootOfChord(chord) || chord)),
      harmonicIdiom: "blues"
    }];
  }

  private static hasBluesMelodicVocabulary(anchors: MelodicAnchor[], center: string): boolean {
    const flatThird = Note.pitchClass(Note.transpose(`${center}4`, "3m"));
    const flatSeventh = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    const notes = new Set(anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean));
    return !!flatThird && !!flatSeventh && notes.has(flatThird) && notes.has(flatSeventh);
  }

  private static bluesChordForMeasure(center: string, index: number, totalMeasures: number): string {
    const fourth = Note.pitchClass(Note.transpose(`${center}4`, "4P"));
    const fifth = Note.pitchClass(Note.transpose(`${center}4`, "5P"));
    if (index === totalMeasures - 2 && fifth) return `${fifth}7`;
    if ((index === 1 || index === 2) && fourth) return `${fourth}7`;
    return `${center}7`;
  }

  private static bluesProposalCoversMelody(
    measures: ReharmonizationMeasure[],
    anchors: MelodicAnchor[]
  ): boolean {
    return measures.every(measure => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measure.measureIndex);
      if (measureAnchors.length === 0) return true;
      return measureAnchors.some(anchor => measure.chords.some(chord => noteCoveredByChord(anchor.pitch, chord)));
    });
  }

  private static buildModalProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center || !this.hasModalMelodicVocabulary(anchors, center)) return [];
    if (phraseContext.selectedCenter.mode === "minor" && this.hasFunctionalMinorMelodicDirection(anchors, center)) return [];

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length < 4) return [];

    const modalChords = this.modalChordPalette(center);
    const measures = measureIndexes.map(measureIndex => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      return {
        measureIndex,
        chords: [this.bestModalChordForMeasure(modalChords, measureAnchors)]
      };
    });

    if (!this.modalProposalCoversMelody(measures, anchors)) return [];
    if (measures.some(measure => /7$/.test(measure.chords[0]))) return [];

    return [{
      id: `strategy_modal_${center.toLowerCase()}`,
      kind: "validated-harmonization",
      name: "Estratégia — Centro modal",
      measures,
      explanation: [
        "preserva centro recorrente sem depender de cadência dominante",
        "usa bVII/bVI como cor modal estável",
        "mantém a harmonia próxima do campo modal sugerido pela melodia"
      ],
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.rootOfChord(chord) || chord)),
      harmonicIdiom: "modal"
    }];
  }

  private static hasModalMelodicVocabulary(anchors: MelodicAnchor[], center: string): boolean {
    const notes = anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
    const centerCount = notes.filter(note => note === center).length;
    const flatSeven = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    const flatSix = Note.pitchClass(Note.transpose(`${center}4`, "6m"));
    const hasModalColor = (!!flatSeven && notes.includes(flatSeven)) || (!!flatSix && notes.includes(flatSix));
    return centerCount >= 2 && hasModalColor;
  }

  private static modalChordPalette(center: string): string[] {
    const flatSeven = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    const flatSix = Note.pitchClass(Note.transpose(`${center}4`, "6m"));
    return [
      `${center}m`,
      flatSeven ? `${flatSeven}` : null,
      flatSix ? `${flatSix}` : null
    ].filter((chord): chord is string => chord !== null);
  }

  private static bestModalChordForMeasure(chords: string[], anchors: MelodicAnchor[]): string {
    if (anchors.length === 0) return chords[0];
    let best = chords[0];
    let bestScore = -Infinity;
    for (const chord of chords) {
      const root = Note.pitchClass(this.rootOfChord(chord) || chord);
      const score = anchors.reduce((sum, anchor) => (
        noteCoveredByChord(anchor.pitch, chord) ? sum + Math.max(1, anchor.duration || 1) : sum
      ), 0) + (anchors.some(anchor => Note.pitchClass(anchor.pitch) === root) ? 0.5 : 0);
      if (score > bestScore) {
        best = chord;
        bestScore = score;
      }
    }
    return best;
  }

  private static modalProposalCoversMelody(
    measures: ReharmonizationMeasure[],
    anchors: MelodicAnchor[]
  ): boolean {
    return measures.every(measure => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measure.measureIndex);
      if (measureAnchors.length === 0) return true;
      return measureAnchors.some(anchor => measure.chords.some(chord => noteCoveredByChord(anchor.pitch, chord)));
    });
  }

  private static buildMinorFunctionalProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    if (phraseContext.selectedCenter.mode !== "minor") return [];

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center || !this.hasMinorMelodicVocabulary(anchors, center)) return [];

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length < 4) return [];

    const finalPitch = Note.pitchClass(anchors[anchors.length - 1]?.pitch);
    if (finalPitch !== center) return [];

    const measures = measureIndexes.map((measureIndex, index) => {
      const isFinalMeasure = index === measureIndexes.length - 1;
      const isCadentialDominant = index === measureIndexes.length - 2;
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);

      if (isFinalMeasure) {
        return { measureIndex, chords: [`${center}m`] };
      }

      if (isCadentialDominant) {
        return { measureIndex, chords: [this.minorDominantChord(center)] };
      }

      return {
        measureIndex,
        chords: [this.bestMinorFunctionalChordForMeasure(this.minorFunctionalPalette(center), measureAnchors)]
      };
    });

    if (!this.minorFunctionalProposalCoversMelody(measures, anchors)) return [];

    return [{
      id: `strategy_minor_functional_${center.toLowerCase()}`,
      kind: "validated-harmonization",
      name: "Estratégia — Menor funcional",
      measures,
      explanation: [
        "usa bVI/bVII como cores naturais do campo menor",
        "fecha a frase com dominante maior resolvendo em tônica menor",
        "mantém a sexta maior apenas quando ela aparece como cor melódica"
      ],
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.rootOfChord(chord) || chord)),
      harmonicIdiom: "minor-functional"
    }];
  }

  private static hasMinorMelodicVocabulary(anchors: MelodicAnchor[], center: string): boolean {
    const notes = anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
    const hasTonic = notes.includes(center);
    const hasDirectedMinorColor = this.hasFunctionalMinorMelodicDirection(anchors, center);
    return hasTonic && hasDirectedMinorColor;
  }

  private static hasFunctionalMinorMelodicDirection(anchors: MelodicAnchor[], center: string): boolean {
    const notes = anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
    const leadingTone = Note.pitchClass(Note.transpose(`${center}4`, "7M"));
    const raisedSixth = Note.pitchClass(Note.transpose(`${center}4`, "6M"));
    return (!!leadingTone && notes.includes(leadingTone)) || (!!raisedSixth && notes.includes(raisedSixth));
  }

  private static minorFunctionalPalette(center: string): string[] {
    const flatSeven = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    const flatSix = Note.pitchClass(Note.transpose(`${center}4`, "6m"));
    const supertonic = Note.pitchClass(Note.transpose(`${center}4`, "2M"));
    return [
      `${center}m`,
      `${center}m6`,
      flatSeven ? `${flatSeven}` : null,
      flatSix ? `${flatSix}` : null,
      supertonic ? `${supertonic}m7(b5)` : null
    ].filter((chord): chord is string => chord !== null);
  }

  private static minorDominantChord(center: string): string {
    const dominant = Note.pitchClass(Note.transpose(`${center}4`, "5P"));
    return `${dominant || center}7`;
  }

  private static bestMinorFunctionalChordForMeasure(chords: string[], anchors: MelodicAnchor[]): string {
    if (anchors.length === 0) return chords[0];

    let best = chords[0];
    let bestScore = -Infinity;
    for (const chord of chords) {
      const root = Note.pitchClass(this.rootOfChord(chord) || chord);
      const score = anchors.reduce((sum, anchor) => (
        noteCoveredByChord(anchor.pitch, chord) ? sum + Math.max(1, anchor.duration || 1) : sum
      ), 0) + (anchors.some(anchor => Note.pitchClass(anchor.pitch) === root) ? 0.4 : 0);
      if (score > bestScore) {
        best = chord;
        bestScore = score;
      }
    }
    return best;
  }

  private static minorFunctionalProposalCoversMelody(
    measures: ReharmonizationMeasure[],
    anchors: MelodicAnchor[]
  ): boolean {
    return measures.every(measure => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measure.measureIndex);
      if (measureAnchors.length === 0) return true;
      return measureAnchors.some(anchor => measure.chords.some(chord => noteCoveredByChord(anchor.pitch, chord)));
    });
  }

  private static buildWindowedIiVProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    const globalTonic = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!globalTonic) return [];

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length < 3) return [];

    const proposals: ReharmonizationProposal[] = [];
    const localTonicCandidates = this.localIiVTonicCandidates(phraseContext);
    for (let i = 0; i < measureIndexes.length - 2; i++) {
      const targetMeasures = measureIndexes.slice(i, i + 3);
      const proposal = this.bestWindowedIiVProposalForMeasures(targetMeasures, anchors, globalTonic, localTonicCandidates);
      if (proposal) proposals.push(proposal);
    }

    return proposals;
  }

  private static localIiVTonicCandidates(phraseContext: PhraseContext): string[] {
    const candidates = new Set<string>();
    const selected = phraseContext.selectedCenter;
    const selectedTonic = Note.pitchClass(selected.tonic);
    if (selectedTonic) candidates.add(selectedTonic);

    if (selected.mode === "minor") {
      const relativeMajor = Note.pitchClass(Note.transpose(`${selected.tonic}4`, "3m"));
      if (relativeMajor) candidates.add(relativeMajor);
    } else {
      const relativeMinor = Note.pitchClass(Note.transpose(`${selected.tonic}4`, "6M"));
      if (relativeMinor) candidates.add(relativeMinor);
    }

    return Array.from(candidates);
  }

  private static bestWindowedIiVProposalForMeasures(
    targetMeasures: number[],
    anchors: MelodicAnchor[],
    globalTonic: string,
    localTonicCandidates: string[]
  ): ReharmonizationProposal | null {
    for (const localTonic of localTonicCandidates) {
      if (localTonic === globalTonic) continue;

      const localMode = this.inferLocalIiVMode(globalTonic, localTonic);
      const chords = this.localIiVChords(localTonic, localMode);
      const measures = targetMeasures.map((measureIndex, index) => ({
        measureIndex,
        chords: [chords[index]]
      }));

      if (!this.localIiVCoversMelody(measures, anchors, localTonic)) continue;

      return {
        id: `strategy_local_iiv_${targetMeasures.join("_")}_${localTonic.toLowerCase()}`,
        kind: "validated-harmonization",
        name: "Estratégia — Gramática funcional ii-V",
        measures,
        explanation: [
          `reconhece célula ii-V local em ${localTonic}`,
          localMode === "minor"
            ? "usa preparação meio-diminuta antes da dominante local"
            : "usa preparação predominante antes da dominante local",
          "preserva a chegada melódica como ponto de resolução"
        ],
        bassLine: chords.map(chord => this.rootOfChord(chord) || chord)
      };
    }

    return null;
  }

  private static inferLocalIiVMode(globalTonic: string, localTonic: string): "major" | "minor" {
    const globalChroma = Note.chroma(globalTonic);
    const localChroma = Note.chroma(localTonic);
    if (globalChroma === undefined || localChroma === undefined) return "major";
    const degree = (localChroma - globalChroma + 12) % 12;
    return degree === 9 ? "minor" : "major";
  }

  private static localIiVChords(localTonic: string, mode: "major" | "minor"): [string, string, string] {
    const secondDegree = Note.pitchClass(Note.transpose(`${localTonic}4`, "2M"));
    const dominant = Note.pitchClass(Note.transpose(`${localTonic}4`, "5P"));
    if (mode === "minor") return [`${secondDegree}m7b5`, `${dominant}7b13`, `${localTonic}m6`];
    return [`${secondDegree}m7`, `${dominant}7`, `${localTonic}maj7`];
  }

  private static localIiVCoversMelody(
    measures: ReharmonizationMeasure[],
    anchors: MelodicAnchor[],
    localTonic: string
  ): boolean {
    const finalMeasure = measures[measures.length - 1];
    const finalAnchors = anchors.filter(anchor => anchor.measureIndex === finalMeasure.measureIndex);
    const finalHasLocalTonic = finalAnchors.some(anchor => Note.pitchClass(anchor.pitch) === localTonic);
    if (!finalHasLocalTonic) return false;

    return measures.every(measure => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measure.measureIndex);
      return measureAnchors.length === 0 || measureAnchors.some(anchor => (
        measure.chords.some(chord => noteCoveredByChord(anchor.pitch, chord))
      ));
    });
  }

  private static toProposal(
    candidate: HarmonizationCandidate,
    validation: HarmonicStrategyValidation
  ): ReharmonizationProposal {
    return {
      id: `strategy_${candidate.strategy.toLowerCase()}`,
      kind: "validated-harmonization",
      name: STRATEGY_LABELS[candidate.strategy],
      measures: candidate.measures,
      explanation: [
        `Percurso funcional: ${this.explainBackbone(validation.report.backbone)}`,
        ...this.explainFunctionalRegions(candidate.melody, candidate.center),
        this.explainMelodyCoverage(validation.report.melodyCoverage),
        this.explainDensity(validation.report.chordCount, candidate.measures.length),
        ...(validation.report.secondaryDominantExcursions > 0
          ? [this.explainSecondaryDominants(validation.report.secondaryDominantExcursions)]
          : []),
        ...(validation.report.diminishedPassingExcursions > 0
          ? [this.explainDiminishedPassings(validation.report.diminishedPassingExcursions)]
          : []),
        ...(validation.report.subV7Excursions > 0
          ? [this.explainSubV7(validation.report.subV7Excursions)]
          : []),
        ...(validation.report.iiSubV7Preparations > 0
          ? [this.explainIiSubV7(validation.report.iiSubV7Preparations)]
          : []),
        ...this.explainExpansions(
          validation.report.expansions,
          validation.report.secondaryDominantExcursions > 0,
          validation.report.diminishedPassingExcursions > 0
        )
      ],
      bassLine: candidate.measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord))
    };
  }

  private static explainExpansions(
    expansions: string[],
    suppressSecondaryDominants = false,
    suppressDiminishedPassings = false
  ): string[] {
    return expansions
      .filter(expansion => !(suppressSecondaryDominants && expansion === "SECONDARY_DOMINANT_RESOLUTION"))
      .filter(expansion => !(suppressDiminishedPassings && expansion === "DIMINISHED_PASSING_RESOLUTION"))
      .map(expansion => EXPANSION_EXPLANATIONS[expansion])
      .filter((explanation): explanation is string => Boolean(explanation));
  }

  private static explainBackbone(backbone: StrategyFunctionId[]): string {
    return backbone.map(fn => FUNCTION_EXPLANATIONS[fn]).join(" -> ");
  }

  private static explainFunctionalRegions(anchors: MelodicAnchor[], center: string): string[] {
    const regions = FunctionalRegionPlanner.planFromAnchors(anchors, center);
    const evidence = new Set(regions.flatMap(region => region.evidence));
    const explanations: string[] = [];

    if (evidence.has("a melodia sustenta o quarto grau como abertura subdominante")) {
      explanations.push("Leitura da frase: a melodia abre espaço para subdominante");
    }

    if (evidence.has("a melodia sustenta o quinto grau como preparação dominante")) {
      explanations.push("Leitura da frase: identifica preparação dominante antes da resolução");
    }

    if (evidence.has("a melodia repousa no centro tonal no fechamento")) {
      explanations.push("Leitura da frase: reconhece fechamento no centro tonal");
    }

    if (evidence.has("a subfrase fecha com preparação dominante e repouso no centro")) {
      explanations.push("Leitura da frase: fechamento autêntico confirmado pela melodia");
    } else if (evidence.has("a subfrase fecha por gesto plagal em direção ao centro")) {
      explanations.push("Leitura da frase: fechamento plagal sugerido pela melodia");
    } else if (evidence.has("a subfrase termina suspensa no quinto grau")) {
      explanations.push("Leitura da frase: final suspenso com meia-cadência");
    } else if (evidence.has("a subfrase termina aberta, sem repouso tonal forte")) {
      explanations.push("Leitura da frase: final aberto, sem cadência forte");
    }

    return explanations.slice(0, 3);
  }

  private static explainMelodyCoverage(coverage: number): string {
    if (coverage >= 0.98) return "acompanha integralmente as notas estruturais da melodia";
    if (coverage >= 0.85) return "acompanha a melodia preservando as notas estruturais principais";
    return "mantém compatibilidade parcial com a melodia";
  }

  private static explainDensity(chordCount: number, measureCount: number): string {
    const ratio = measureCount > 0 ? chordCount / measureCount : chordCount;
    if (ratio <= 1.15) return "mantém baixa densidade harmônica, próxima de um acorde por compasso";
    if (ratio <= 1.75) return "adiciona movimento harmônico moderado sem saturar a frase";
    return "usa maior densidade harmônica para intensificar a frase";
  }

  private static explainSecondaryDominants(count: number): string {
    return count === 1
      ? "insere uma dominante auxiliar com resolução local"
      : `insere ${count} dominantes auxiliares com resolução local`;
  }

  private static explainDiminishedPassings(count: number): string {
    return count === 1
      ? "insere um diminuto de passagem com resolução por aproximação"
      : `insere ${count} diminutos de passagem com resolução por aproximação`;
  }

  private static explainSubV7(count: number): string {
    return count === 1
      ? "substitui a dominante cadencial por SubV7 com resolução cromática"
      : `substitui ${count} dominantes por SubV7 com resolução cromática`;
  }

  private static explainIiSubV7(count: number): string {
    return count === 1
      ? "prepara o SubV7 com ii cromático relacionado"
      : `prepara ${count} SubV7 com ii cromático relacionado`;
  }
}
