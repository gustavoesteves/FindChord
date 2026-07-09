import { Note } from "tonal";
import type { PhraseContext } from "../engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { ReharmonizationMeasure, ReharmonizationProposal } from "../models/ReharmonizationProposal";
import { chordPitchClasses, chordRoot } from "../../theory/ChordSymbolResolver";
import { FunctionalRegionPlanner, type MeasureFunctionalRegion } from "./FunctionalRegionPlanner";
import {
  classifyMelodicAnchors,
  melodicAnchorWeight,
  pitchProminence
} from "./MelodicAnchorClassifier";
import {
  noteCoveredByChord,
  validateHarmonicStrategy,
  type HarmonicStrategyId,
  type HarmonicStrategyValidation,
  type HarmonizationCandidate,
  type StrategyFunctionId
} from "./HarmonicStrategyValidator";
import { formatReferenceCenterEvidenceSentence } from "./ReferenceAwarePhraseContext";
import { functionalSubstitutionsFor } from "./FunctionalSubstitutionCatalog";
import { validateFunctionPreservingSubstitution } from "./FunctionPreservingSubstitution";
import { analyzeModalBorrowingColor, type ModalBorrowingColorRole } from "./ModalBorrowingAnalysis";
import { analyzeDominantTension, describeDominantTension } from "./DominantTensionAnalysis";

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

interface FlatMeasureChord {
  measureIndex: number;
  measurePosition: number;
  chordIndex: number;
  chord: string;
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
    const strategyAttempts = strategies
      .map(strategy => this.tryStrategy(strategy, anchors, phraseContext));
    const strategyProposals = strategyAttempts
      .filter((attempt): attempt is StrategyAttempt & { proposal: ReharmonizationProposal } => attempt.proposal !== null)
      .map(attempt => attempt.proposal);
    const hasStrictBasicHarmony = strategyAttempts.some(attempt => (
      attempt.candidate.strategy === "I_IV_V" && attempt.validation.accepted
    ));
    const fundamentalProposals = hasStrictBasicHarmony
      ? []
      : this.buildFundamentalHarmonyProposals(anchors, phraseContext);
    const melodyFirstProposals = strategyProposals.length === 0
      ? this.buildMelodyFirstDiatonicProposals(anchors, phraseContext)
      : [];

    return [
      ...this.buildReferenceCenteredProposals(anchors, phraseContext),
      ...fundamentalProposals,
      ...strategyProposals,
      ...this.buildAlteredDominantProposals(anchors, phraseContext),
      ...this.buildAlteredDominantCycleProposals(anchors, phraseContext),
      ...this.buildFunctionalSubVProposals(anchors, phraseContext),
      ...melodyFirstProposals,
      ...this.buildApparentFunctionProposals(anchors, phraseContext),
      ...this.buildModalBorrowingProposals(anchors, phraseContext),
      ...this.buildLocalIiVProposals(anchors, phraseContext),
      ...this.buildDominantVampProposals(anchors, phraseContext),
      ...this.buildBluesProposals(anchors, phraseContext),
      ...this.buildModalProposals(anchors, phraseContext),
      ...this.buildMinorFunctionalProposals(anchors, phraseContext)
    ].map(proposal => this.attachReferenceAssistedExplanation(proposal, phraseContext));
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
    const proposal = validation.accepted
      ? this.attachReferenceAssistedExplanation(this.toProposal(candidate, validation), phraseContext)
      : null;
    return {
      candidate,
      validation,
      proposal
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

  private static buildReferenceCenteredProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    if (!this.hasStrongReferenceCenter(phraseContext)) return [];

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center) return [];

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length < 2) return [];

    const measures = measureIndexes.map((measureIndex, index) => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      const isFinal = index === measureIndexes.length - 1;
      const isCadentialPreparation = index === measureIndexes.length - 2;
      const palette = this.referencePaletteForMeasure(
        center,
        phraseContext.selectedCenter.mode,
        measureAnchors,
        isCadentialPreparation
      );
      return {
        measureIndex,
        chords: [isFinal ? this.referenceTonicChord(center, phraseContext.selectedCenter.mode, measureAnchors) : this.bestReferenceCenteredChord(palette, measureAnchors, anchors)]
      };
    });

    const coverage = this.coverageForReferenceCenteredMeasures(measures, anchors);
    if (coverage < 0.25) return [];

    return [{
      id: `strategy_reference_center_${center.toLowerCase()}`,
      kind: "validated-harmonization",
      name: "Estratégia — Centro de referência",
      measures,
      explanation: [
        `preserva o centro indicado pela referência em ${center}`,
        "prioriza acordes próximos ao campo funcional antes de explorar cadências locais",
        "acompanha a melodia com harmonia estável e baixa densidade"
      ],
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.rootOfChord(chord) || chord)),
      harmonicIdiom: phraseContext.selectedCenter.mode === "minor" ? "minor-functional" : "major-functional",
      cadentialTarget: center
    }];
  }

  private static buildApparentFunctionProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center || phraseContext.selectedCenter.mode !== "major") return [];

    return [
      this.buildSharpIvApparentFunctionProposal(anchors, center),
      this.buildPredominantSusApparentFunctionProposal(anchors, center),
      this.buildLeadingToneDiminishedApparentFunctionProposal(anchors, center),
      this.buildMinorSixthApparentFunctionProposal(anchors, center)
    ].filter((proposal): proposal is ReharmonizationProposal => proposal !== null);
  }

  private static buildSharpIvApparentFunctionProposal(
    anchors: MelodicAnchor[],
    center: string
  ): ReharmonizationProposal | null {
    const baseMeasures = this.buildMeasuresForStrategy("EXPANSAO_FUNCIONAL_DIATONICA", anchors, center);
    const baseValidation = validateHarmonicStrategy({
      strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
      center,
      measures: baseMeasures,
      melody: anchors
    });
    if (!baseValidation.accepted) return null;

    const sharpIv = functionalSubstitutionsFor("PD", center, "major-functional")
      .find(substitution => substitution.id === "PREDOMINANT_SHARP_IV_HALF_DIMINISHED");
    if (!sharpIv) return null;

    const flatChords = this.flattenMeasureChords(baseMeasures);

    for (let index = 0; index < flatChords.length; index++) {
      const point = flatChords[index];
      const root = this.rootOfChord(point.chord);
      if (this.romanForChordRoot(root, center) !== "IV") continue;

      const melodyPitches = this.pitchClassesForMeasure(anchors, point.measureIndex);
      if (melodyPitches.length === 0) continue;

      const validation = validateFunctionPreservingSubstitution({
        center,
        originalChord: point.chord,
        substituteChord: sharpIv.chord,
        previousChord: flatChords[index - 1]?.chord,
        nextChord: flatChords[index + 1]?.chord,
        melodyPitches,
        expectedBackboneFunction: "PD",
        classificationMode: "major-functional"
      });
      if (!validation.accepted) continue;

      const measures = baseMeasures.map(measure => ({
        measureIndex: measure.measureIndex,
        chords: [...measure.chords]
      }));
      measures[point.measurePosition].chords[point.chordIndex] = sharpIv.chord;

      return {
        id: `strategy_apparent_sharp_iv_${point.measureIndex}_${center.toLowerCase()}`,
        kind: "controlled-reharmonization",
        name: "Estratégia — Função aparente",
        measures,
        explanation: [
          `substitui ${point.chord} por ${sharpIv.chord}`,
          sharpIv.explanation,
          "preserva a preparação subdominante com compatibilidade melódica",
          ...validation.evidence
        ],
        bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
        cadentialTarget: center,
        harmonicIdiom: "major-functional"
      };
    }

    return null;
  }

  private static buildPredominantSusApparentFunctionProposal(
    anchors: MelodicAnchor[],
    center: string
  ): ReharmonizationProposal | null {
    const baseMeasures = this.buildMeasuresForStrategy("EXPANSAO_FUNCIONAL_DIATONICA", anchors, center);
    const baseValidation = validateHarmonicStrategy({
      strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
      center,
      measures: baseMeasures,
      melody: anchors
    });
    if (!baseValidation.accepted) return null;

    const flatChords = this.flattenMeasureChords(baseMeasures);
    const dominantRoot = this.rootOfChord(this.chordFromRoman(center, "V"));
    const predominantRoot = this.rootOfChord(this.chordFromRoman(center, "ii"));
    const substituteChord = `${dominantRoot}7sus4`;
    const impliedPredominant = `${predominantRoot}m7/${dominantRoot}`;

    for (let index = 0; index < flatChords.length; index++) {
      const point = flatChords[index];
      const root = this.rootOfChord(point.chord);
      const isDominantSeventh = this.romanForChordRoot(root, center) === "V" && /7/.test(point.chord);
      if (!isDominantSeventh) continue;

      const recentPredominant = [flatChords[index - 1], flatChords[index - 2]]
        .filter((candidate): candidate is FlatMeasureChord => Boolean(candidate))
        .some(candidate => ["ii", "IV"].includes(this.romanForChordRoot(this.rootOfChord(candidate.chord), center)));
      if (!recentPredominant) continue;

      const melodyPitches = this.pitchClassesForMeasure(anchors, point.measureIndex);
      if (melodyPitches.length === 0) continue;

      const validation = validateFunctionPreservingSubstitution({
        center,
        originalChord: impliedPredominant,
        substituteChord,
        previousChord: flatChords[index - 1]?.chord,
        nextChord: point.chord,
        melodyPitches,
        expectedBackboneFunction: "PD",
        classificationMode: "major-functional"
      });
      if (!validation.accepted) continue;

      const measures = baseMeasures.map(measure => ({
        measureIndex: measure.measureIndex,
        chords: [...measure.chords]
      }));
      measures[point.measurePosition].chords.splice(point.chordIndex, 0, substituteChord);

      return {
        id: `strategy_apparent_sus_predominant_${point.measureIndex}_${center.toLowerCase()}`,
        kind: "controlled-reharmonization",
        name: "Estratégia — Função aparente",
        measures,
        explanation: [
          `insere ${substituteChord} antes de ${point.chord}`,
          "trata o sus como preparação aparente da dominante",
          "preserva a preparação subdominante com compatibilidade melódica",
          ...validation.evidence
        ],
        bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
        cadentialTarget: center,
        harmonicIdiom: "major-functional"
      };
    }

    return null;
  }

  private static buildLeadingToneDiminishedApparentFunctionProposal(
    anchors: MelodicAnchor[],
    center: string
  ): ReharmonizationProposal | null {
    const baseMeasures = this.buildMeasuresForStrategy("EXPANSAO_FUNCIONAL_DIATONICA", anchors, center);
    const baseValidation = validateHarmonicStrategy({
      strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
      center,
      measures: baseMeasures,
      melody: anchors
    });
    if (!baseValidation.accepted) return null;

    const flatChords = this.flattenMeasureChords(baseMeasures);
    const leadingToneRoot = Note.pitchClass(Note.transpose(`${center}4`, "7M"));
    if (!leadingToneRoot) return null;

    const substituteChord = `${leadingToneRoot}dim`;

    for (let index = 0; index < flatChords.length; index++) {
      const point = flatChords[index];
      const nextPoint = flatChords[index + 1];
      const root = this.rootOfChord(point.chord);
      const nextRoot = nextPoint ? this.rootOfChord(nextPoint.chord) : "";
      const isDominantSeventh = this.romanForChordRoot(root, center) === "V" && /7/.test(point.chord);
      const resolvesToTonic = nextPoint && this.romanForChordRoot(nextRoot, center) === "I";
      if (!isDominantSeventh || !resolvesToTonic) continue;

      const melodyPitches = this.pitchClassesForMeasure(anchors, point.measureIndex);
      if (melodyPitches.length === 0) continue;

      const validation = validateFunctionPreservingSubstitution({
        center,
        originalChord: `${root}7(b9)`,
        substituteChord,
        previousChord: flatChords[index - 1]?.chord,
        nextChord: nextPoint.chord,
        melodyPitches,
        expectedBackboneFunction: "D",
        classificationMode: "major-functional"
      });
      if (!validation.accepted) continue;

      const measures = baseMeasures.map(measure => ({
        measureIndex: measure.measureIndex,
        chords: [...measure.chords]
      }));
      measures[point.measurePosition].chords[point.chordIndex] = substituteChord;

      return {
        id: `strategy_apparent_leading_dim_${point.measureIndex}_${center.toLowerCase()}`,
        kind: "controlled-reharmonization",
        name: "Estratégia — Função aparente",
        measures,
        explanation: [
          `substitui ${point.chord} por ${substituteChord}`,
          "trata o diminuto de sensível como dominante aparente",
          "preserva a tensão cadencial com compatibilidade melódica",
          ...validation.evidence
        ],
        bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
        cadentialTarget: center,
        harmonicIdiom: "major-functional"
      };
    }

    return null;
  }

  private static buildMinorSixthApparentFunctionProposal(
    anchors: MelodicAnchor[],
    center: string
  ): ReharmonizationProposal | null {
    const baseMeasures = this.buildMeasuresForStrategy("EXPANSAO_FUNCIONAL_DIATONICA", anchors, center);
    const baseValidation = validateHarmonicStrategy({
      strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
      center,
      measures: baseMeasures,
      melody: anchors
    });
    if (!baseValidation.accepted) return null;

    const flatChords = this.flattenMeasureChords(baseMeasures);
    const predominantRoot = this.rootOfChord(this.chordFromRoman(center, "ii"));
    const substituteChord = `${predominantRoot}m6`;

    for (let index = 0; index < flatChords.length; index++) {
      const point = flatChords[index];
      const root = this.rootOfChord(point.chord);
      const isDominantSeventh = this.romanForChordRoot(root, center) === "V" && /7/.test(point.chord);
      if (!isDominantSeventh) continue;

      const melodyPitches = this.pitchClassesForMeasure(anchors, point.measureIndex);
      if (melodyPitches.length === 0) continue;

      const validation = validateFunctionPreservingSubstitution({
        center,
        originalChord: point.chord,
        substituteChord,
        previousChord: flatChords[index - 1]?.chord,
        nextChord: point.chord,
        melodyPitches,
        expectedBackboneFunction: "D",
        classificationMode: "major-functional"
      });
      if (!validation.accepted) continue;

      const measures = baseMeasures.map(measure => ({
        measureIndex: measure.measureIndex,
        chords: [...measure.chords]
      }));
      measures[point.measurePosition].chords.splice(point.chordIndex, 0, substituteChord);

      return {
        id: `strategy_apparent_minor_sixth_${point.measureIndex}_${center.toLowerCase()}`,
        kind: "controlled-reharmonization",
        name: "Estratégia — Função aparente",
        measures,
        explanation: [
          `insere ${substituteChord} antes de ${point.chord}`,
          "trata o m6 como estrutura dominante aparente",
          "preserva a tensão cadencial com compatibilidade melódica",
          ...validation.evidence
        ],
        bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
        cadentialTarget: center,
        harmonicIdiom: "major-functional"
      };
    }

    return null;
  }

  private static buildModalBorrowingProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center || phraseContext.selectedCenter.mode !== "major") return [];

    const proposals: ReharmonizationProposal[] = [];
    const flatSix = Note.pitchClass(Note.transpose(`${center}4`, "6m"));

    const baseMeasures = this.buildMeasuresForStrategy("EXPANSAO_FUNCIONAL_DIATONICA", anchors, center);
    const flatChords = this.flattenMeasureChords(baseMeasures);

    if (flatSix && anchors.some(anchor => Note.pitchClass(anchor.pitch) === flatSix)) {
      const borrowedSubdominant = `${this.chordFromRoman(center, "IV")}m`;

      for (const point of flatChords) {
        if (this.romanForChordRoot(this.rootOfChord(point.chord), center) !== "IV") continue;

        const melodyPitches = this.pitchClassesForMeasure(anchors, point.measureIndex);
        if (!melodyPitches.includes(flatSix)) continue;
        if (!melodyPitches.every(pitch => noteCoveredByChord(pitch, borrowedSubdominant))) continue;

        const measures = baseMeasures.map(measure => ({
          measureIndex: measure.measureIndex,
          chords: [...measure.chords]
        }));
        measures[point.measurePosition].chords[point.chordIndex] = borrowedSubdominant;

        const validation = validateHarmonicStrategy({
          strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
          center,
          measures,
          melody: anchors
        });
        if (!validation.accepted) continue;

        proposals.push({
          id: `strategy_modal_borrowing_ivm_${point.measureIndex}_${center.toLowerCase()}`,
          kind: "controlled-reharmonization",
          name: "Estratégia — Empréstimo modal",
          measures,
          explanation: [
            `substitui ${point.chord} por ${borrowedSubdominant}`,
            "usa iv menor como cor do modo paralelo",
            "preserva a função subdominante com mistura modal controlada",
            "a melodia traz b6 como assinatura do empréstimo modal"
          ],
          bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
          cadentialTarget: center,
          harmonicIdiom: "major-functional"
        });
        break;
      }
    }

    for (const role of ["BORROWED_FLAT_VII", "BORROWED_FLAT_VI"] as ModalBorrowingColorRole[]) {
      const proposal = this.buildBorrowedModalColorProposal(baseMeasures, flatChords, anchors, center, role);
      if (proposal) proposals.push(proposal);
    }

    return proposals;
  }

  private static buildBorrowedModalColorProposal(
    baseMeasures: ReharmonizationMeasure[],
    flatChords: FlatMeasureChord[],
    anchors: MelodicAnchor[],
    center: string,
    role: ModalBorrowingColorRole
  ): ReharmonizationProposal | null {
    const borrowedChord = this.bestBorrowedModalColorChord(center, role, anchors);
    if (!borrowedChord) return null;

    const analysis = analyzeModalBorrowingColor(borrowedChord, {
      center,
      mode: "major",
      idiom: "major-functional"
    });
    if (!analysis) return null;

    for (const point of flatChords) {
      if (this.classifyBorrowingTarget(point.chord, center) !== "PD") continue;

      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === point.measureIndex);
      if (!this.borrowedModalColorFitsMeasure(borrowedChord, measureAnchors, anchors)) continue;

      const measures = baseMeasures.map(measure => ({
        measureIndex: measure.measureIndex,
        chords: [...measure.chords]
      }));
      measures[point.measurePosition].chords[point.chordIndex] = borrowedChord;

      const validation = validateHarmonicStrategy({
        strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
        center,
        measures,
        melody: anchors
      });
      if (!validation.accepted) continue;

      const roleLabel = role === "BORROWED_FLAT_VII" ? "bVII" : "bVI";
      return {
        id: `strategy_modal_borrowing_${roleLabel.toLowerCase().replace("b", "flat_")}_${point.measureIndex}_${center.toLowerCase()}`,
        kind: "controlled-reharmonization",
        name: "Estratégia — Empréstimo modal",
        measures,
        explanation: [
          `substitui ${point.chord} por ${borrowedChord}`,
          `usa ${roleLabel} como cor do modo paralelo menor`,
          "preserva a região subdominante sem trocar automaticamente o centro tonal",
          ...analysis.explanation
        ],
        bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
        cadentialTarget: center,
        harmonicIdiom: "major-functional"
      };
    }

    return null;
  }

  private static classifyBorrowingTarget(chord: string, center: string): StrategyFunctionId {
    const roman = this.romanForChordRoot(this.rootOfChord(chord), center);
    return ["ii", "IV"].includes(roman) ? "PD" : "OTHER";
  }

  private static bestBorrowedModalColorChord(
    center: string,
    role: ModalBorrowingColorRole,
    anchors: MelodicAnchor[]
  ): string | null {
    const rootInterval = role === "BORROWED_FLAT_VII" ? "7m" : "6m";
    const root = Note.pitchClass(Note.transpose(`${center}4`, rootInterval));
    if (!root) return null;

    const candidates = role === "BORROWED_FLAT_VII"
      ? [root, `${root}7`, `${root}maj7`]
      : [root, `${root}maj7`, `${root}6`];
    const requiredColor = root;
    if (!anchors.some(anchor => Note.pitchClass(anchor.pitch) === requiredColor)) return null;

    return candidates
      .map(candidate => ({ candidate, score: this.melodicFitForChord(candidate, anchors) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.candidate || null;
  }

  private static borrowedModalColorFitsMeasure(
    borrowedChord: string,
    measureAnchors: MelodicAnchor[],
    phraseAnchors: MelodicAnchor[]
  ): boolean {
    if (measureAnchors.length === 0) return false;
    const fit = this.melodicFitForChord(borrowedChord, measureAnchors);
    if (fit < 0.8) return false;

    const classified = classifyMelodicAnchors(measureAnchors, { markFinal: false });
    const root = Note.pitchClass(this.rootOfChord(borrowedChord));
    const rootIsStructural = classified.some(anchor => (
      anchor.role === "structural" && Note.pitchClass(anchor.pitch) === root
    ));
    const weightedMeasureProminence = measureAnchors.reduce((total, anchor) => (
      total + melodicAnchorWeight(anchor, phraseAnchors, { markFinal: false })
    ), 0);
    return rootIsStructural || weightedMeasureProminence >= 0.7;
  }

  private static buildFundamentalHarmonyProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    if (this.hasStrongReferenceCenter(phraseContext)) return [];
    if (phraseContext.selectedCenter.mode !== "major") return [];

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center) return [];

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length < 2) return [];

    const measures = this.buildPrimaryTriadMeasures(anchors, center);
    const coverage = this.coverageForReferenceCenteredMeasures(measures, anchors);
    if (coverage < 0.45) return [];

    const explanation = [
      `Percurso funcional elementar: ${this.fundamentalFunctionPath(measures, center)}`,
      ...this.explainFunctionalRegions(anchors, center),
      "usa somente tônica, subdominante e dominante como primeira leitura da melodia",
      "mantém a harmonia fundamental separada das alternativas diatônicas e cromáticas",
      coverage >= 0.72
        ? "a melodia aceita bem a leitura fundamental I-IV-V"
        : "base pedagógica: I-IV-V cobre parcialmente a melodia, mas pede uma camada diatônica depois"
    ];

    return [{
      id: `strategy_fundamental_i_iv_v_${center.toLowerCase()}`,
      kind: "validated-harmonization",
      name: "Estratégia — Harmonia fundamental I-IV-V",
      measures,
      explanation,
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
      cadentialTarget: center,
      harmonicIdiom: "major-functional"
    }];
  }

  private static buildMelodyFirstDiatonicProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    if (this.hasStrongReferenceCenter(phraseContext)) return [];
    if (phraseContext.selectedCenter.mode !== "major") return [];

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center) return [];

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length < 4) return [];

    const palette = this.melodyFirstDiatonicPalette(center);
    const measures = measureIndexes.map((measureIndex, index) => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      const isFinal = index === measureIndexes.length - 1;
      return {
        measureIndex,
        chords: [isFinal ? this.chordFromRoman(center, "I") : this.bestMelodyFirstChord(palette, measureAnchors, anchors)]
      };
    });

    const coverage = this.coverageForReferenceCenteredMeasures(measures, anchors);
    if (coverage < 0.58) return [];

    return [{
      id: `strategy_melody_first_diatonic_${center.toLowerCase()}`,
      kind: "validated-harmonization",
      name: "Estratégia — Melodia primeiro",
      measures,
      explanation: [
        "prioriza acordes diatônicos que sustentam as notas estruturais da melodia",
        "mantém baixa densidade harmônica enquanto não há cifra de referência",
        "evita forçar cadência local quando a frase pede sustentação por cor"
      ],
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
      cadentialTarget: center,
      harmonicIdiom: "major-functional"
    }];
  }

  private static hasStrongReferenceCenter(phraseContext: PhraseContext): boolean {
    return phraseContext.selectedCenterSource === "reference"
      && (phraseContext.selectedCenter.confidence >= 0.7 || (phraseContext.selectedCenterEvidence?.length || 0) > 0);
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

  private static buildAlteredDominantProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    if (phraseContext.selectedCenter.mode !== "major") return [];

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center) return [];

    const measures = this.buildSecondaryDominantMeasures(anchors, center).map(measure => ({
      measureIndex: measure.measureIndex,
      chords: [...measure.chords]
    }));
    const flatChords = this.flattenMeasureChords(measures);
    const alteredPairs: string[] = [];

    for (let index = 0; index < flatChords.length - 1; index++) {
      const point = flatChords[index];
      const nextPoint = flatChords[index + 1];
      const targetRoman = this.secondaryDominantResolutionTarget(point.chord, nextPoint.chord, center);
      if (!targetRoman) continue;

      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === point.measureIndex);
      const altered = this.alteredDominantForResolution(point.chord, nextPoint.chord, targetRoman, measureAnchors);
      if (!altered || altered === point.chord) continue;

      measures[point.measurePosition].chords[point.chordIndex] = altered;
      alteredPairs.push(`${point.chord} -> ${altered}`);
    }

    if (alteredPairs.length === 0) return [];

    const validation = validateHarmonicStrategy({
      strategy: "DOMINANTES_SECUNDARIAS",
      center,
      measures,
      melody: anchors
    });
    if (!validation.accepted) return [];

    return [{
      id: `strategy_altered_secondary_dominants_${center.toLowerCase()}`,
      kind: "controlled-reharmonization",
      name: "Estratégia — Dominantes alteradas",
      measures,
      explanation: [
        `altera dominantes resolvidas: ${alteredPairs.join("; ")}`,
        `gradua tensão dominante: ${alteredPairs.map(pair => describeDominantTension(pair.split(" -> ")[1])).join("; ")}`,
        "usa tensões de dominante como cor de rearmonização, sem perder a resolução local",
        "mantém a base funcional das dominantes secundárias",
        this.explainMelodyCoverage(validation.report.melodyCoverage),
        ...this.explainExpansions(validation.report.expansions, true, false)
      ],
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
      cadentialTarget: center,
      harmonicIdiom: "major-functional"
    }];
  }

  private static buildAlteredDominantCycleProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    if (phraseContext.selectedCenter.mode !== "major") return [];

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center) return [];

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length !== 4) return [];

    const iiRoot = Note.pitchClass(Note.transpose(`${center}4`, "2M"));
    const vRoot = Note.pitchClass(Note.transpose(`${center}4`, "5P"));
    if (!iiRoot || !vRoot) return [];

    const dominantOfIi = Note.pitchClass(Note.transpose(`${iiRoot}4`, "5P"));
    const dominantOfV = Note.pitchClass(Note.transpose(`${vRoot}4`, "5P"));
    if (!dominantOfIi || !dominantOfV) return [];

    const measures: ReharmonizationMeasure[] = [
      {
        measureIndex: measureIndexes[0],
        chords: [center, `${dominantOfIi}7(b9)`]
      },
      {
        measureIndex: measureIndexes[1],
        chords: [`${iiRoot}m`, `${dominantOfV}7alt`]
      },
      {
        measureIndex: measureIndexes[2],
        chords: [`${vRoot}13`, `${vRoot}7(b13,b9)`]
      },
      {
        measureIndex: measureIndexes[3],
        chords: [`${center}6`]
      }
    ];

    const validation = validateHarmonicStrategy({
      strategy: "DOMINANTES_SECUNDARIAS",
      center,
      measures,
      melody: anchors
    });
    if (!validation.accepted) return [];
    const dominantTensionSummary = measures
      .flatMap(measure => measure.chords)
      .filter(chord => analyzeDominantTension(chord).isDominant)
      .map(describeDominantTension)
      .join("; ");

    return [{
      id: `strategy_altered_dominant_cycle_${center.toLowerCase()}`,
      kind: "controlled-reharmonization",
      name: "Estratégia — Ciclo de dominantes alteradas",
      measures,
      explanation: [
        `encadeia dominantes alteradas em direção a ${center}`,
        "cria uma cadeia ii/V e V/V antes da dominante final",
        `usa tensões graduais de rearmonização: ${dominantTensionSummary}`,
        this.explainMelodyCoverage(validation.report.melodyCoverage),
        ...this.explainExpansions(validation.report.expansions, true, false)
      ],
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
      cadentialTarget: center,
      harmonicIdiom: "major-functional"
    }];
  }

  private static buildFunctionalSubVProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    if (phraseContext.selectedCenter.mode !== "major") return [];

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center) return [];

    const baseMeasures = this.buildDiatonicExpansionMeasures(anchors, center);
    const baseCoverage = this.coverageForReferenceCenteredMeasures(baseMeasures, anchors);
    if (baseCoverage < 0.75) return [];

    const measures = baseMeasures.map(measure => ({
      measureIndex: measure.measureIndex,
      chords: [...measure.chords]
    }));
    const substitutions: string[] = [];
    const preparedTargets = new Set<string>();
    let insertedCount = 0;

    for (let measureIndex = 0; measureIndex < measures.length; measureIndex++) {
      if (insertedCount >= 3) break;
      const measure = measures[measureIndex];

      for (let chordIndex = 0; chordIndex < measure.chords.length; chordIndex++) {
        if (insertedCount >= 3) break;
        const targetChord = measure.chords[chordIndex];
        const targetRoot = this.rootOfChord(targetChord);
        const targetRoman = this.romanForChordRoot(targetRoot, center);
        const isCadentialTonic = measureIndex === measures.length - 1 && targetRoman === "I";
        if (!["IV", "V"].includes(targetRoman) && !isCadentialTonic) continue;
        if (preparedTargets.has(`${targetRoman}:${targetRoot}`)) continue;
        if (this.previousChordInMeasure(measure.chords, chordIndex)?.includes("7")) continue;

        const subV = this.subV7ForTarget(targetRoot);
        const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measure.measureIndex);
        if (!this.resolvesBySubV(subV, targetChord)) continue;
        if (!this.subVHasMelodicSupport(subV, targetChord, measureAnchors)) continue;

        measure.chords.splice(chordIndex, 0, subV);
        substitutions.push(`${subV} -> ${targetChord}`);
        preparedTargets.add(`${targetRoman}:${targetRoot}`);
        insertedCount++;
        chordIndex++;
      }
    }

    if (substitutions.length === 0) return [];

    const coverage = this.coverageForReferenceCenteredMeasures(measures, anchors);
    if (coverage < Math.max(0.72, baseCoverage - 0.1)) return [];

    return [{
      id: `strategy_functional_subv_${center.toLowerCase()}`,
      kind: "controlled-reharmonization",
      name: "Estratégia — SubV funcional",
      measures,
      explanation: [
        `prepara graus diatônicos por SubV: ${substitutions.join("; ")}`,
        "usa SubV como expansão local da função dominante",
        "resolve cada SubV por semitom descendente no acorde-alvo",
        "mantém a cobertura melódica da expansão diatônica"
      ],
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
      cadentialTarget: center,
      harmonicIdiom: "major-functional"
    }];
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

  private static flattenMeasureChords(measures: ReharmonizationMeasure[]): FlatMeasureChord[] {
    return measures.flatMap((measure, measurePosition) => (
      measure.chords.map((chord, chordIndex) => ({
        measureIndex: measure.measureIndex,
        measurePosition,
        chordIndex,
        chord
      }))
    ));
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

  private static pitchClassesForMeasure(anchors: MelodicAnchor[], measureIndex: number): string[] {
    return Array.from(new Set(
      anchors
        .filter(anchor => anchor.measureIndex === measureIndex)
        .map(anchor => Note.pitchClass(anchor.pitch))
        .filter((pitch): pitch is string => Boolean(pitch))
    ));
  }

  private static primaryRomanForFunction(fn: StrategyFunctionId): string {
    if (fn === "PD") return "IV";
    if (fn === "D") return "V";
    return "I";
  }

  private static fundamentalFunctionPath(measures: ReharmonizationMeasure[], center: string): string {
    const functions = measures
      .map(measure => this.romanForChordRoot(this.rootOfChord(measure.chords[0]), center))
      .map(roman => {
        if (roman === "IV") return "preparação";
        if (roman === "V") return "tensão";
        return "repouso";
      });

    return functions.map((fn, index) => (
      index > 0 && fn === functions[index - 1] ? "" : fn
    )).filter(Boolean).join(" -> ");
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
        noteCoveredByChord(anchor.pitch, chord) ? sum + melodicAnchorWeight(anchor, anchors, { markFinal: false }) : sum
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

    return pitchProminence(anchors, pitchClass) >= 0.3;
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

  private static referenceTonicChord(center: string, mode: "major" | "minor", anchors: MelodicAnchor[] = []): string {
    if (mode === "major") return center;

    const notes = new Set(anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean));
    const sixth = Note.pitchClass(Note.transpose(`${center}4`, "6M"));
    const flatSeven = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    if (sixth && notes.has(sixth)) return `${center}m6`;
    if (flatSeven && notes.has(flatSeven)) return `${center}m7`;
    return `${center}m`;
  }

  private static referencePaletteForMeasure(
    center: string,
    mode: "major" | "minor",
    anchors: MelodicAnchor[],
    isCadentialPreparation: boolean
  ): string[] {
    return mode === "minor"
      ? this.referenceMinorPalette(center, anchors, isCadentialPreparation)
      : this.referenceMajorPalette(center);
  }

  private static referenceMajorPalette(center: string): string[] {
    return [
      this.chordFromRoman(center, "I"),
      this.chordFromRoman(center, "IV"),
      `${this.chordFromRoman(center, "V")}7`,
      `${this.chordFromRoman(center, "ii")}7`,
      `${this.chordFromRoman(center, "vi")}7`,
      this.chordFromRoman(center, "iii")
    ];
  }

  private static melodyFirstDiatonicPalette(center: string): string[] {
    const tonic = this.chordFromRoman(center, "I");
    const subdominant = this.chordFromRoman(center, "IV");
    return [
      `${tonic}6/9`,
      this.chordFromRoman(center, "I"),
      `${subdominant}6`,
      `${subdominant}maj7`,
      `${this.chordFromRoman(center, "ii")}7`,
      `${this.chordFromRoman(center, "iii")}7`,
      `${this.chordFromRoman(center, "vi")}7`,
      `${this.chordFromRoman(center, "V")}7sus4`,
      `${this.chordFromRoman(center, "V")}7`,
      this.chordFromRoman(center, "vii")
    ];
  }

  private static bestMelodyFirstChord(
    palette: string[],
    measureAnchors: MelodicAnchor[],
    phraseAnchors: MelodicAnchor[]
  ): string {
    if (measureAnchors.length === 0) return palette[0];

    const classified = classifyMelodicAnchors(measureAnchors, { markFinal: false });
    let best = palette[0];
    let bestScore = -Infinity;

    for (const chord of palette) {
      const root = Note.pitchClass(this.rootOfChord(chord) || chord);
      const coverageScore = measureAnchors.reduce((sum, anchor) => (
        noteCoveredByChord(anchor.pitch, chord)
          ? sum + melodicAnchorWeight(anchor, phraseAnchors, { markFinal: false })
          : sum
      ), 0);
      const structuralRootBonus = classified.some(anchor => (
        anchor.role === "structural" && Note.pitchClass(anchor.pitch) === root
      )) ? 0.35 : 0;
      const compactColorPenalty = /m7b5|7sus4/.test(chord) ? 0.1 : 0;
      const score = coverageScore + structuralRootBonus - compactColorPenalty;
      if (score > bestScore) {
        best = chord;
        bestScore = score;
      }
    }

    return best;
  }

  private static referenceMinorPalette(
    center: string,
    anchors: MelodicAnchor[],
    isCadentialPreparation: boolean
  ): string[] {
    const fourth = Note.pitchClass(Note.transpose(`${center}4`, "4P"));
    const fifth = Note.pitchClass(Note.transpose(`${center}4`, "5P"));
    const flatSix = Note.pitchClass(Note.transpose(`${center}4`, "6m"));
    const flatSeven = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    const second = Note.pitchClass(Note.transpose(`${center}4`, "2M"));
    const tonic = this.referenceTonicChord(center, "minor", anchors);
    const dominant = fifth ? `${fifth}7` : `${center}m`;

    const stable = [
      tonic,
      fourth ? `${fourth}m7` : `${center}m`,
      flatSix ? `${flatSix}maj7` : `${center}m`,
      flatSeven ? `${flatSeven}7` : `${center}m`,
      second ? `${second}m7b5` : `${center}m`
    ];

    return isCadentialPreparation
      ? [tonic, dominant, ...stable.filter(chord => chord !== tonic)]
      : [...stable, dominant];
  }

  private static bestReferenceCenteredChord(
    palette: string[],
    measureAnchors: MelodicAnchor[],
    phraseAnchors: MelodicAnchor[]
  ): string {
    let best = palette[0];
    let bestScore = -Infinity;

    for (const chord of palette) {
      const coverageScore = measureAnchors.reduce((sum, anchor) => (
        noteCoveredByChord(anchor.pitch, chord)
          ? sum + melodicAnchorWeight(anchor, phraseAnchors, { markFinal: false })
          : sum
      ), 0);
      const stabilityBonus = chord === palette[0] ? 0.25 : 0;
      const score = coverageScore + stabilityBonus;
      if (score > bestScore) {
        best = chord;
        bestScore = score;
      }
    }

    return best;
  }

  private static coverageForReferenceCenteredMeasures(
    measures: ReharmonizationMeasure[],
    anchors: MelodicAnchor[]
  ): number {
    const weightedTotal = anchors.reduce((sum, anchor) => (
      sum + melodicAnchorWeight(anchor, anchors, { markFinal: false })
    ), 0);
    if (weightedTotal === 0) return 0;

    const weightedCovered = anchors.reduce((sum, anchor) => {
      const measure = measures.find(item => item.measureIndex === anchor.measureIndex);
      const covered = measure?.chords.some(chord => noteCoveredByChord(anchor.pitch, chord));
      return covered ? sum + melodicAnchorWeight(anchor, anchors, { markFinal: false }) : sum;
    }, 0);

    return weightedCovered / weightedTotal;
  }

  private static secondaryDominantForTarget(targetChord: string, center: string): string | null {
    const targetRoot = this.rootOfChord(targetChord);
    if (!targetRoot) return null;

    const targetRoman = this.romanForChordRoot(targetRoot, center);
    if (!["ii", "IV", "V", "vi"].includes(targetRoman)) return null;

    const dominantRoot = Note.pitchClass(Note.transpose(`${targetRoot}4`, "5P"));
    return `${dominantRoot}7`;
  }

  private static secondaryDominantResolutionTarget(chord: string, nextChord: string, center: string): string | null {
    const root = this.rootOfChord(chord);
    const targetRoot = this.rootOfChord(nextChord);
    if (!root || !targetRoot) return null;
    if (!/(?:^|[A-G](?:#|b)?)(?:7|9|13|alt|\(|b9|b13|#9|#5)/.test(chord)) return null;

    const expectedTarget = Note.pitchClass(Note.transpose(`${root}4`, "4P"));
    if (!expectedTarget || Note.chroma(expectedTarget) !== Note.chroma(targetRoot)) return null;

    const targetRoman = this.romanForChordRoot(targetRoot, center);
    return ["ii", "IV", "V", "vi"].includes(targetRoman) ? targetRoman : null;
  }

  private static alteredDominantForResolution(
    chord: string,
    nextChord: string,
    targetRoman: string,
    anchors: MelodicAnchor[]
  ): string | null {
    const root = this.rootOfChord(chord);
    if (!root) return null;

    const candidates = targetRoman === "V"
      ? [`${root}7(b13)`, `${root}7alt`, `${root}7(b9)`]
      : targetRoman === "vi" || /m/.test(nextChord)
        ? [`${root}7(b9)`, `${root}7(b13)`, `${root}7alt`]
        : [`${root}7(b9)`, `${root}7alt`, `${root}7(b13)`];
    const baseScore = this.melodicFitForChord(chord, anchors);

    return candidates
      .map(candidate => ({ candidate, score: this.melodicFitForChord(candidate, anchors) }))
      .filter(item => item.score >= Math.max(0, baseScore - 0.1))
      .sort((a, b) => b.score - a.score)[0]?.candidate || null;
  }

  private static melodicFitForChord(chord: string, anchors: MelodicAnchor[]): number {
    if (anchors.length === 0) return 1;
    const total = anchors.reduce((sum, anchor) => (
      sum + melodicAnchorWeight(anchor, anchors, { markFinal: false })
    ), 0);
    if (total === 0) return 0;

    const covered = anchors.reduce((sum, anchor) => (
      noteCoveredByChord(anchor.pitch, chord)
        ? sum + melodicAnchorWeight(anchor, anchors, { markFinal: false })
        : sum
    ), 0);
    return covered / total;
  }

  private static passingDiminishedForTarget(targetChord: string): string | null {
    const targetRoot = this.rootOfChord(targetChord);
    if (!targetRoot) return null;

    const leadingRoot = Note.pitchClass(Note.transpose(`${targetRoot}4`, "-2m"));
    return `${leadingRoot}dim7`;
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

  private static resolvesBySubV(subV: string, targetChord: string): boolean {
    const subRoot = this.rootOfChord(subV);
    const targetRoot = this.rootOfChord(targetChord);
    const subChroma = Note.chroma(subRoot);
    const targetChroma = Note.chroma(targetRoot);
    if (subChroma === undefined || targetChroma === undefined) return false;
    return (subChroma - targetChroma + 12) % 12 === 1;
  }

  private static subVHasMelodicSupport(subV: string, targetChord: string, anchors: MelodicAnchor[]): boolean {
    if (anchors.length === 0) return true;
    const subVFit = this.melodicFitForChord(subV, anchors);
    const targetFit = this.melodicFitForChord(targetChord, anchors);
    return subVFit > 0 || targetFit >= 0.5;
  }

  private static previousChordInMeasure(chords: string[], chordIndex: number): string | null {
    return chordIndex > 0 ? chords[chordIndex - 1] : null;
  }

  private static rootOfChord(chord: string): string {
    return chordRoot(chord.split("/")[0]) || chord.match(/^[A-G](?:#|b)?/)?.[0] || "";
  }

  private static bassOrRootOfChord(chord: string): string {
    const bass = chord.match(/\/([A-G](?:#|b)?)$/)?.[1];
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
      const score = anchors.reduce((sum, anchor) => (
        noteCoveredByChord(anchor.pitch, chord) ? sum + melodicAnchorWeight(anchor, anchors, { markFinal: false }) : sum
      ), 0);
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

    const normalizedBass = Note.simplify(bass);
    const root = Note.pitchClass(this.rootOfChord(chord));
    const bassChroma = Note.chroma(normalizedBass);
    const rootChroma = root ? Note.chroma(root) : undefined;
    if (bassChroma !== undefined && rootChroma !== undefined && bassChroma === rootChroma) {
      return chord;
    }

    const chordNotes = chordPitchClasses(chord, false);
    const bassBelongsToChord = chordNotes.some(note => Note.chroma(note) === bassChroma);
    if (bassBelongsToChord) {
      return `${chord}/${normalizedBass}`;
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
    if (phraseContext.cadentialTarget.cadenceType === "HALF") return null;

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
      bassLine: chords.map(chord => this.rootOfChord(chord) || chord),
      cadentialTarget: localTonic
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

  private static buildDominantVampProposals(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext
  ): ReharmonizationProposal[] {
    if (phraseContext.selectedCenter.mode !== "major") return [];
    if (["HALF", "DECEPTIVE"].includes(phraseContext.cadentialTarget.cadenceType)) return [];

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center || !this.hasDominantVampVocabulary(anchors, center)) return [];

    const measureIndexes = this.getMeasureIndexes(anchors);
    if (measureIndexes.length < 4) return [];

    const flatSeven = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    if (!flatSeven) return [];

    const measures = measureIndexes.map(measureIndex => {
      const measureAnchors = anchors.filter(anchor => anchor.measureIndex === measureIndex);
      const root = this.prefersFlatSevenDominantResponse(measureAnchors, center, flatSeven)
        ? flatSeven
        : center;
      return {
        measureIndex,
        chords: this.dominantVampChordsForMeasure(root, measureAnchors)
      };
    });

    if (!this.bluesProposalCoversMelody(measures, anchors)) return [];

    return [{
      id: `strategy_dominant_vamp_${center.toLowerCase()}`,
      kind: "validated-harmonization",
      name: "Estratégia — Vamp dominante",
      measures,
      explanation: [
        "trata I13/I13sus como repouso dominante idiomático",
        "usa bVII13 como resposta de vamp dominante",
        "preserva quarta suspensa e sétima menor como cores estruturais"
      ],
      bassLine: measures.flatMap(measure => measure.chords.map(chord => this.rootOfChord(chord) || chord)),
      harmonicIdiom: "blues"
    }];
  }

  private static hasDominantVampVocabulary(anchors: MelodicAnchor[], center: string): boolean {
    const flatThird = Note.pitchClass(Note.transpose(`${center}4`, "3m"));
    const fourth = Note.pitchClass(Note.transpose(`${center}4`, "4P"));
    const flatSeventh = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    const notes = new Set(anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean));
    return !!flatSeventh
      && notes.has(flatSeventh)
      && (!!flatThird && notes.has(flatThird) || !!fourth && notes.has(fourth));
  }

  private static prefersFlatSevenDominantResponse(
    anchors: MelodicAnchor[],
    center: string,
    flatSeven: string
  ): boolean {
    const centerProminence = pitchProminence(anchors, center);
    const flatSevenProminence = pitchProminence(anchors, flatSeven);
    const flatThird = Note.pitchClass(Note.transpose(`${center}4`, "3m"));
    const fourthOfFlatSeven = Note.pitchClass(Note.transpose(`${flatSeven}4`, "4P"));
    const notes = new Set(anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean));

    return flatSevenProminence > 0
      || centerProminence === 0 && !!flatThird && notes.has(flatThird)
      || centerProminence === 0 && !!fourthOfFlatSeven && notes.has(fourthOfFlatSeven);
  }

  private static dominantVampChordsForMeasure(root: string, anchors: MelodicAnchor[]): string[] {
    const third = Note.pitchClass(Note.transpose(`${root}4`, "3M"));
    const fourth = Note.pitchClass(Note.transpose(`${root}4`, "4P"));
    const notes = new Set(anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean));
    const hasThird = !!third && notes.has(third);
    const hasSuspension = !!fourth && notes.has(fourth);

    if (hasSuspension && hasThird) return [`${root}13sus4`, `${root}13`];
    if (hasSuspension) return [`${root}13sus4`];
    return [`${root}13`];
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
    const classified = classifyMelodicAnchors(anchors, { markFinal: false });
    for (const chord of chords) {
      const root = Note.pitchClass(this.rootOfChord(chord) || chord);
      const structuralRootBonus = classified.some(anchor => (
        anchor.role === "structural" && Note.pitchClass(anchor.pitch) === root
      )) ? 0.6 : 0;
      const score = classified.reduce((sum, anchor) => (
        noteCoveredByChord(anchor.pitch, chord) ? sum + anchor.weight : sum
      ), 0) + structuralRootBonus;
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
    const classified = classifyMelodicAnchors(anchors, { markFinal: false });
    for (const chord of chords) {
      const root = Note.pitchClass(this.rootOfChord(chord) || chord);
      const structuralRootBonus = classified.some(anchor => (
        anchor.role === "structural" && Note.pitchClass(anchor.pitch) === root
      )) ? 0.5 : 0;
      const score = classified.reduce((sum, anchor) => (
        noteCoveredByChord(anchor.pitch, chord) ? sum + anchor.weight : sum
      ), 0) + structuralRootBonus;
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
        bassLine: chords.map(chord => this.rootOfChord(chord) || chord),
        cadentialTarget: localTonic
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

  private static attachReferenceAssistedExplanation(
    proposal: ReharmonizationProposal,
    phraseContext: PhraseContext
  ): ReharmonizationProposal {
    if (phraseContext.selectedCenterSource !== "reference" || !phraseContext.selectedCenterEvidence?.[0]) {
      return proposal;
    }
    if (this.hasDifferentLocalCadenceTarget(proposal, phraseContext)) return proposal;

    const evidence = formatReferenceCenterEvidenceSentence(phraseContext.selectedCenterEvidence[0]);
    const explanation = `Centro da frase: ${evidence}`;
    if (proposal.explanation.includes(explanation)) return proposal;

    return {
      ...proposal,
      explanation: [...proposal.explanation, explanation]
    };
  }

  private static hasDifferentLocalCadenceTarget(
    proposal: ReharmonizationProposal,
    phraseContext: PhraseContext
  ): boolean {
    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center) return false;

    return proposal.explanation.some(explanation => {
      const localCadence = explanation.match(/(?:cria uma cadência local para|reconhece célula ii-V local em) ([A-G](?:#|b)?)/);
      const localTarget = localCadence ? Note.pitchClass(localCadence[1]) : null;
      return !!localTarget && localTarget !== center;
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
      bassLine: candidate.measures.flatMap(measure => measure.chords.map(chord => this.bassOrRootOfChord(chord) || chord)),
      cadentialTarget: candidate.center
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
