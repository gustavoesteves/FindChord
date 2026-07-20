import type { MelodicAnchor } from "../models/ProjectionSet";
import type { PhraseContext } from "./PhraseAnalysisEngine";
import type {
  ReharmonizationChordEvent,
  ReharmonizationProposal,
  ReharmonizationMeasure
} from "../models/ReharmonizationProposal";
import { diagnostic, type HarmonicDiagnostic } from "../models/HarmonicDiagnostic";
import { Note } from "tonal";
import { ChordRealizationEngine } from "./ChordRealizationEngine";
import { BassTrajectoryModel } from "./archetypes/BassTrajectoryModel";
import { TemporalSlotAllocator } from "./TemporalSlotAllocator";
import { HarmonicRegionResolver } from "./HarmonicRegionResolver";
import type { GravityField } from "./fields/GravityField";
import type { ScoreMeasureTickRange } from "../models/ScoreSnapshot";
import { TonalGravityField } from "./fields/TonalGravityField";
import { ChromaticGravityField } from "./fields/ChromaticGravityField";
import { ContrapuntalGravityField } from "./fields/ContrapuntalGravityField";
import { StrategyGuidedHarmonizer } from "../strategies/StrategyGuidedHarmonizer";
import {
  melodicCoverageEntriesByAnchor,
  weightedMelodicCoverage
} from "../strategies/MelodicCoverage";

export interface GravityProposalGenerationResult {
  proposals: ReharmonizationProposal[];
  rejectedExperimentalCount: number;
  omittedStrategyDiagnostics: HarmonicDiagnostic[];
}

export interface GravityProposalGenerationOptions {
  measureTicks?: ScoreMeasureTickRange[];
}

export class GravityFieldManager {
  private static fields: GravityField[] = [
    new TonalGravityField(),
    new ChromaticGravityField(),
    new ContrapuntalGravityField()
  ];

  public static generateProposals(
    anchors: MelodicAnchor[], 
    phraseContext: PhraseContext,
    options: GravityProposalGenerationOptions = {}
  ): ReharmonizationProposal[] {
    return this.generateProposalsWithDiagnostics(anchors, phraseContext, options).proposals;
  }

  public static generateProposalsWithDiagnostics(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext,
    options: GravityProposalGenerationOptions = {}
  ): GravityProposalGenerationResult {
    const allProposals: ReharmonizationProposal[] = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, phraseContext)
      .map(proposal => this.withGeneratedEvents(proposal, options.measureTicks));
    let pIdx = 1;
    let rejectedExperimentalCount = 0;

    for (const field of this.fields) {
      
      // 1. Generate Archetype Seeds
      const seeds = field.generateArchetypeSeeds(phraseContext);

      for (const seed of seeds) {
        try {
          // 4. Initialize the Musical Narrative State
          const initialState = {
            tonalAnchor: phraseContext.selectedCenter,
            phase: "EXPOSITION" as const,
            goal: seed.narrativeGoal,
            tension: 0.0,
            memory: []
          };

          const gravityMap = {
            gravityStrength: { "I": 1.0, "IV": 0.7, "V": 0.8 },
            inertia: 0.8 // high inertia = slower harmonic rhythm
          };

          const form = HarmonicRegionResolver.resolve(anchors, seed, gravityMap, initialState, {
            measureTicks: options.measureTicks
          });

          // 3. Allocate Temporal Slots based on the Resolved Form
          const slots = TemporalSlotAllocator.allocateSlots(form, anchors);

          // 3.1 Realize Bass for the resolved regions
          const bassLine = BassTrajectoryModel.realizeBassForSlots(slots, phraseContext.selectedCenter);
          for (let i = 0; i < slots.length; i++) {
            slots[i].bassNote = bassLine[i];
          }

          // 5. Dual-Force Fusion Loop (Realization)
          const pathways = ChordRealizationEngine.realize(slots, phraseContext, seed, initialState);

          if (pathways.length > 0) {
            // Take the best pathway for this realization
            const bestPath = pathways[0];

            // Map to Measures
            const measuresMap = new Map<number, string[]>();
            for (let i = 0; i < slots.length; i++) {
              const mIdx = slots[i].measureIndex;
              if (!measuresMap.has(mIdx)) {
                measuresMap.set(mIdx, []);
              }
              measuresMap.get(mIdx)!.push(bestPath.harmonyEvents[i].chord);
            }

            const measures: ReharmonizationMeasure[] = Array.from(measuresMap.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([measureIndex, chords]) => ({ measureIndex, chords }));

            if (!this.passesModeCompatibilityGate(measures, phraseContext)) {
              rejectedExperimentalCount++;
              continue;
            }

            if (!this.passesMelodicCompatibilityGate(measures, anchors)) {
              rejectedExperimentalCount++;
              continue;
            }

            allProposals.push({
              id: `prop_${pIdx}`,
              kind: "experimental-exploration",
              name: `Estratégia — ${field.name}`,
              measures,
              events: this.proposalEventsFromMeasures(`prop_${pIdx}`, measures, options.measureTicks),
              explanation: seed.explanation, 
              bassLine: bestPath.bassLine
            });

            pIdx++;
          }
        } catch (error) {
          console.warn("[GravityFieldManager] Proposal seed skipped.", {
            field: field.name,
            seed: seed.narrativeGoal,
            error
          });
        }
      }
    }

    return {
      proposals: allProposals,
      rejectedExperimentalCount,
      omittedStrategyDiagnostics: [
        ...this.omittedStrategyDiagnostics(anchors, phraseContext, allProposals),
        ...this.melodicCompatibilityDiagnostics(anchors, allProposals)
      ]
    };
  }

  private static withGeneratedEvents(
    proposal: ReharmonizationProposal,
    measureTicks?: ScoreMeasureTickRange[]
  ): ReharmonizationProposal {
    if (proposal.events && proposal.events.length > 0) return proposal;
    return {
      ...proposal,
      events: this.proposalEventsFromMeasures(proposal.id, proposal.measures, measureTicks)
    };
  }

  private static proposalEventsFromMeasures(
    proposalId: string,
    measures: ReharmonizationMeasure[],
    measureTicks?: ScoreMeasureTickRange[]
  ): ReharmonizationChordEvent[] {
    const orderedTicks = measureTicks ? [...measureTicks].sort((a, b) => a.measure - b.measure) : [];
    return measures.flatMap(measure => {
      const measureRange = orderedTicks.find(item => item.measure === measure.measureIndex);
      const tickStart = measureRange?.startTick ?? (measure.measureIndex - 1) * 1920;
      const tickEnd = measureRange?.endTick ?? measure.measureIndex * 1920;
      const measureDuration = Math.max(1, tickEnd - tickStart);
      const chordCount = Math.max(1, measure.chords.length);
      const eventDuration = Math.max(1, Math.floor(measureDuration / chordCount));

      return measure.chords.map((chord, chordIndex) => {
        const eventStart = tickStart + eventDuration * chordIndex;
        const isLast = chordIndex === measure.chords.length - 1;
        const eventEnd = isLast ? tickEnd : Math.min(tickEnd, eventStart + eventDuration);
        const beat = 1 + (measureDuration > 0 ? ((eventStart - tickStart) / measureDuration) * 4 : 0);
        return {
          id: `${proposalId}-m${measure.measureIndex}-c${chordIndex}`,
          measureIndex: measure.measureIndex,
          beat: Math.round(beat * 100) / 100,
          chord,
          chordIndex,
          occurrenceInMeasure: chordIndex,
          tickStart: eventStart,
          tickEnd: eventEnd,
          durationTicks: Math.max(1, eventEnd - eventStart)
        };
      });
    });
  }

  private static passesModeCompatibilityGate(
    measures: ReharmonizationMeasure[],
    phraseContext: PhraseContext
  ): boolean {
    if (phraseContext.selectedCenter.mode !== "minor") return true;
    if (phraseContext.selectedCenterSource === "reference") return true;

    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center) return true;
    const escapedCenter = center.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tonicMajorPattern = new RegExp(`^${escapedCenter}(?:$|/|maj|M|6|add|Δ)`);
    const boundaryChords = [
      measures[0]?.chords[0],
      measures[measures.length - 1]?.chords.at(-1)
    ].filter((chord): chord is string => Boolean(chord));

    return !boundaryChords.some(chord => tonicMajorPattern.test(chord));
  }

  private static melodicCompatibilityDiagnostics(
    anchors: MelodicAnchor[],
    proposals: ReharmonizationProposal[]
  ): HarmonicDiagnostic[] {
    const primaryProposal = proposals.find(proposal => (
      proposal.kind !== "reference" && proposal.name !== "Estratégia — Harmonia fundamental I-IV-V"
    )) || proposals.find(proposal => proposal.kind !== "reference");
    if (!primaryProposal) return [];

    const entries = melodicCoverageEntriesByAnchor(anchors, anchor => {
      const measure = primaryProposal.measures.find(item => item.measureIndex === anchor.measureIndex);
      return measure?.chords ?? [];
    });

    const hasSuspensionResolution = entries.some(entry => entry.behavior === "suspension-resolution");
    const hasChromaticApproach = entries.some(entry => entry.behavior === "chromatic-approach");
    const hasStepwisePassing = entries.some(entry => entry.behavior === "stepwise-passing");
    const hasUnresolvedStructuralAnchor = entries.some(entry => (
      entry.behavior === "unresolved" && entry.role === "structural" && entry.weight >= 2.5
    ));

    const diagnostics: HarmonicDiagnostic[] = [];

    if (hasUnresolvedStructuralAnchor) {
      diagnostics.push(diagnostic(
        "melodic-coverage-unresolved-structural-anchor",
        "generation",
        "compatibility",
        "Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.",
        ["simple", "balanced", "exploratory"]
      ));
    }

    if (hasSuspensionResolution) {
      diagnostics.push(diagnostic(
        "melodic-coverage-suspension-resolution",
        "generation",
        "compatibility",
        "Suspensão resolvida: a melodia cria tensão momentânea e resolve por grau conjunto em nota sustentada.",
        ["balanced", "exploratory"]
      ));
    }

    if (hasChromaticApproach) {
      diagnostics.push(diagnostic(
        "melodic-coverage-chromatic-approach",
        "generation",
        "compatibility",
        "Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.",
        ["exploratory"]
      ));
    }

    if (hasStepwisePassing) {
      diagnostics.push(diagnostic(
        "melodic-coverage-stepwise-passing",
        "generation",
        "compatibility",
        "Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.",
        ["exploratory"]
      ));
    }

    return diagnostics;
  }

  private static omittedStrategyDiagnostics(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext,
    proposals: ReharmonizationProposal[]
  ): HarmonicDiagnostic[] {
    const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
    if (!center) return [];

    const diagnostics: HarmonicDiagnostic[] = [];

    if (phraseContext.selectedCenter.mode === "minor") {
      const hasMinorFunctionalProposal = proposals.some(proposal => proposal.harmonicIdiom === "minor-functional");
      const hasModalProposal = proposals.some(proposal => proposal.harmonicIdiom === "modal");
      const hasModalVocabulary = this.hasModalMelodicVocabulary(anchors, center);
      const hasFunctionalDirection = this.hasFunctionalMinorMelodicDirection(anchors, center);

      if (hasModalVocabulary && !hasFunctionalDirection && !hasMinorFunctionalProposal) {
        diagnostics.push(diagnostic(
          "minor-functional-omitted-no-leading-tone",
          "generation",
          "omission",
          "Menor funcional omitido: a melodia não traz sensível nem sexta maior para sustentar cadência dominante."
        ));
      }

      if (hasFunctionalDirection && !hasModalProposal) {
        diagnostics.push(diagnostic(
          "modal-center-omitted-functional-direction",
          "generation",
          "omission",
          "Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior."
        ));
      }
    }

    return [
      ...diagnostics,
      ...this.omittedBluesDiagnostics(anchors, phraseContext, proposals, center),
      ...this.omittedLocalIiVDiagnostics(anchors, phraseContext, proposals, center),
      ...this.omittedSubV7Diagnostics(anchors, phraseContext, proposals, center)
    ];
  }

  private static omittedBluesDiagnostics(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext,
    proposals: ReharmonizationProposal[],
    center: string
  ): HarmonicDiagnostic[] {
    if (phraseContext.selectedCenter.mode !== "major") return [];
    if (proposals.some(proposal => proposal.harmonicIdiom === "blues")) return [];

    const flatThird = Note.pitchClass(Note.transpose(`${center}4`, "3m"));
    const flatSeventh = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    const notes = new Set(anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean));
    const hasFlatThird = !!flatThird && notes.has(flatThird);
    const hasFlatSeventh = !!flatSeventh && notes.has(flatSeventh);

    if (hasFlatThird !== hasFlatSeventh) {
      return [diagnostic(
        "blues-omitted-partial-color",
        "generation",
        "omission",
        "Blues funcional omitido: a melodia sugere cor blues parcial, mas não sustenta b3 e b7 como estrutura.",
        ["balanced", "exploratory"]
      )];
    }

    return [];
  }

  private static omittedLocalIiVDiagnostics(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext,
    proposals: ReharmonizationProposal[],
    center: string
  ): HarmonicDiagnostic[] {
    const localTonic = Note.pitchClass(phraseContext.cadentialTarget.targetPitch);
    const hasLocalIiVProposal = proposals.some(proposal => proposal.name === "Estratégia — Gramática funcional ii-V");
    if (!localTonic || localTonic === center || hasLocalIiVProposal) return [];

    const measureCount = new Set(anchors.map(anchor => anchor.measureIndex)).size;
    if (measureCount < 3 || phraseContext.cadentialTarget.confidence < 0.5) return [];

    return [diagnostic(
      `local-iiv-omitted-${localTonic.toLowerCase()}`,
      "generation",
      "omission",
      `ii-V local omitido: a chegada em ${localTonic} não teve cobertura melódica suficiente para uma cadência local.`,
      ["balanced", "exploratory"]
    )];
  }

  private static omittedSubV7Diagnostics(
    anchors: MelodicAnchor[],
    phraseContext: PhraseContext,
    proposals: ReharmonizationProposal[],
    center: string
  ): HarmonicDiagnostic[] {
    const hasSubV7Proposal = proposals.some(proposal => proposal.name === "Estratégia — SubV7 cadencial");
    if (hasSubV7Proposal || !this.hasAuthenticCadentialShape(anchors, center)) return [];

    const attempt = StrategyGuidedHarmonizer.tryStrategy("SUBV7_CADENCIAL", anchors, phraseContext);
    if (attempt.validation.failures.includes("melody-coverage")) {
      return [diagnostic(
        "subv7-omitted-melody-coverage",
        "generation",
        "omission",
        "SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.",
        ["exploratory"]
      )];
    }

    return [];
  }

  private static hasAuthenticCadentialShape(anchors: MelodicAnchor[], center: string): boolean {
    const measureCount = new Set(anchors.map(anchor => anchor.measureIndex)).size;
    const finalPitch = Note.pitchClass(anchors[anchors.length - 1]?.pitch);
    return measureCount >= 4 && finalPitch === center;
  }

  private static hasModalMelodicVocabulary(anchors: MelodicAnchor[], center: string): boolean {
    const notes = anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
    const centerCount = notes.filter(note => note === center).length;
    const flatSeven = Note.pitchClass(Note.transpose(`${center}4`, "7m"));
    const flatSix = Note.pitchClass(Note.transpose(`${center}4`, "6m"));
    const hasModalColor = (!!flatSeven && notes.includes(flatSeven)) || (!!flatSix && notes.includes(flatSix));
    return centerCount >= 2 && hasModalColor;
  }

  private static hasFunctionalMinorMelodicDirection(anchors: MelodicAnchor[], center: string): boolean {
    const notes = anchors.map(anchor => Note.pitchClass(anchor.pitch)).filter(Boolean);
    const leadingTone = Note.pitchClass(Note.transpose(`${center}4`, "7M"));
    const raisedSixth = Note.pitchClass(Note.transpose(`${center}4`, "6M"));
    return (!!leadingTone && notes.includes(leadingTone)) || (!!raisedSixth && notes.includes(raisedSixth));
  }

  private static passesMelodicCompatibilityGate(
    measures: ReharmonizationMeasure[],
    anchors: MelodicAnchor[]
  ): boolean {
    if (measures.length === 0 || anchors.length === 0) return false;

    const sortedMeasures = [...measures].sort((a, b) => a.measureIndex - b.measureIndex);
    const sortedAnchors = [...anchors].sort((a, b) => a.measureIndex - b.measureIndex);
    const firstSegmentAnchors = this.anchorsForCompressedMeasure(sortedMeasures[0], sortedMeasures[1], sortedAnchors);

    const overallCoverage = this.coverageForCompressedMeasures(sortedMeasures, sortedAnchors);
    const firstSegmentCoverage = this.coverageForAnchors(firstSegmentAnchors, sortedMeasures[0].chords);

    return overallCoverage >= 0.65 && firstSegmentCoverage !== null && firstSegmentCoverage >= 0.5;
  }

  private static coverageForCompressedMeasures(
    measures: ReharmonizationMeasure[],
    anchors: MelodicAnchor[]
  ): number {
    const segmentCoverages = measures.map((measure, index) => {
      const segmentAnchors = this.anchorsForCompressedMeasure(measure, measures[index + 1], anchors);
      return this.coverageForAnchors(segmentAnchors, measure.chords);
    }).filter(coverage => coverage !== null);

    if (segmentCoverages.length === 0) return 0;
    return segmentCoverages.reduce((sum, coverage) => sum + coverage, 0) / segmentCoverages.length;
  }

  private static anchorsForCompressedMeasure(
    measure: ReharmonizationMeasure,
    nextMeasure: ReharmonizationMeasure | undefined,
    anchors: MelodicAnchor[]
  ): MelodicAnchor[] {
    return anchors.filter(anchor => (
      anchor.measureIndex >= measure.measureIndex &&
      (!nextMeasure || anchor.measureIndex < nextMeasure.measureIndex)
    ));
  }

  private static coverageForAnchors(
    anchors: MelodicAnchor[],
    chords: string[]
  ): number | null {
    return weightedMelodicCoverage(anchors, chords, { markFinal: false });
  }
}
