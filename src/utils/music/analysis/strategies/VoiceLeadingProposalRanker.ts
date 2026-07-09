import { Note } from "tonal";
import type { PhraseContext } from "../engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { ReharmonizationProposal } from "../models/ReharmonizationProposal";
import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import { diagnostic, type HarmonicDiagnostic } from "../models/HarmonicDiagnostic";
import {
  evaluateVoiceLeadingTransition,
  type VoiceLeadingTransitionReport
} from "./VoiceLeadingTransitionEvaluator";
import {
  evaluateHarmonicRouteDistance,
  type HarmonicRouteDistanceReport
} from "./HarmonicRouteDistance";
import type { FunctionalClassificationMode } from "./HarmonicStrategyValidator";
import { analyzeApparentFunction } from "./ApparentFunctionAnalysis";
import { suggestBassInversionsForVoiceLeading } from "./BassInversionSuggester";
import { annotateBassLineProfile } from "./BassLineProfile";
import { compareProposalToReferenceHarmony } from "./ReferenceHarmonyComparator";
import { analyzeDominantTension } from "./DominantTensionAnalysis";
import {
  analyzeDominantResolution,
  isDominantResolutionSupported,
  type DominantResolutionKind
} from "./DominantResolutionAnalysis";
import { chordRoot, resolveChordSymbol } from "../../theory/ChordSymbolResolver";

interface VoiceLeadingRankingOptions {
  referenceHarmonies?: ScoreHarmonyEvent[];
}

function flattenedChords(proposal: ReharmonizationProposal): string[] {
  return proposal.measures.flatMap(measure => measure.chords);
}

function measureIndexByChordIndex(proposal: ReharmonizationProposal): number[] {
  return proposal.measures.flatMap(measure => measure.chords.map(() => measure.measureIndex));
}

function anchorsForMeasure(anchors: MelodicAnchor[], measureIndex: number): string[] {
  return Array.from(new Set(
    anchors
      .filter(anchor => anchor.measureIndex === measureIndex)
      .map(anchor => anchor.pitch)
  ));
}

function evidenceSummary(reports: VoiceLeadingTransitionReport[]): string[] {
  const strongEvidence = reports.flatMap(report => report.evidence);
  const deduped = Array.from(new Set(strongEvidence)).sort((a, b) => evidencePriority(b) - evidencePriority(a));
  return deduped.slice(0, 3).map(item => `Condução de vozes: ${item}`);
}

function routeEvidenceSummary(report: HarmonicRouteDistanceReport): string[] {
  return report.evidence.slice(0, 2).map(item => `Rota harmônica: ${item}`);
}

function apparentFunctionEvidence(
  proposal: ReharmonizationProposal,
  phraseContext: PhraseContext
): string[] {
  const chords = flattenedChords(proposal);
  return chords.flatMap((chord, index) => {
    const apparent = analyzeApparentFunction(chord, {
      center: phraseContext.selectedCenter.tonic,
      previousChord: chords[index - 1],
      nextChord: chords[index + 1]
    });
    if (!apparent || apparent.shouldCountAsFunctionalEscape || apparent.impliedChordSymbols.length === 0) {
      return [];
    }
    return [`Função aparente: ${chord} implica ${apparent.impliedChordSymbols.join(" ou ")}`];
  });
}

function evidencePriority(evidence: string): number {
  if (/SubV7|crom/i.test(evidence)) return 4;
  if (/guide tone|dominante|sétima|terça/i.test(evidence)) return 3;
  if (/baixo/i.test(evidence)) return 2;
  if (/nota comum|movimento conjunto/i.test(evidence)) return 1;
  return 0;
}

function evaluateProposalVoiceLeading(
  proposal: ReharmonizationProposal,
  phraseContext: PhraseContext,
  anchors: MelodicAnchor[]
): Pick<ReharmonizationProposal, "voiceLeadingScore" | "voiceLeadingEvidence"> & { transitionReports: VoiceLeadingTransitionReport[] } {
  const chords = flattenedChords(proposal);
  if (chords.length < 2) {
    return {
      voiceLeadingScore: 0,
      voiceLeadingEvidence: [],
      transitionReports: []
    };
  }

  const measureByChordIndex = proposal.measures.flatMap(measure => measure.chords.map(() => measure.measureIndex));
  const reports: VoiceLeadingTransitionReport[] = [];

  for (let i = 0; i < chords.length - 1; i++) {
    reports.push(evaluateVoiceLeadingTransition({
      previousChord: chords[i],
      nextChord: chords[i + 1],
      center: phraseContext.selectedCenter.tonic,
      previousMelodyPitches: anchorsForMeasure(anchors, measureByChordIndex[i]),
      nextMelodyPitches: anchorsForMeasure(anchors, measureByChordIndex[i + 1])
    }));
  }

  const total = reports.reduce((sum, report) => sum + report.score, 0);
  const normalized = Number((total / reports.length).toFixed(2));

  return {
    voiceLeadingScore: normalized,
    voiceLeadingEvidence: evidenceSummary(reports),
    transitionReports: reports
  };
}

function voiceLeadingDiagnosticFor(
  proposal: ReharmonizationProposal,
  score: number,
  reports: VoiceLeadingTransitionReport[]
): HarmonicDiagnostic | undefined {
  const unresolved = reports.reduce((sum, report) => sum + report.unresolvedTendencyCount, 0);
  const leaps = reports.reduce((sum, report) => sum + report.excessiveLeapCount, 0);
  const guideToneResolutions = reports.reduce((sum, report) => sum + report.guideToneResolutionCount, 0);
  const commonTones = reports.reduce((sum, report) => sum + report.commonToneCount, 0);

  if (unresolved > 0 || leaps >= 3) {
    return diagnostic(
      `proposal-${proposal.id}-voice-leading-friction`,
      "generation",
      "compatibility",
      "Condução de vozes áspera: há tendência sem resolução clara ou salto interno relevante.",
      ["balanced", "exploratory"]
    );
  }

  if (score >= 3 && (guideToneResolutions > 0 || commonTones >= 2)) {
    return diagnostic(
      `proposal-${proposal.id}-voice-leading-support`,
      "generation",
      "compatibility",
      "Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.",
      ["simple", "balanced", "exploratory"]
    );
  }

  return undefined;
}

function apparentFunctionDiagnosticFor(
  proposal: ReharmonizationProposal,
  evidence: string[]
): HarmonicDiagnostic | undefined {
  if (evidence.length === 0) return undefined;
  return diagnostic(
    `proposal-${proposal.id}-apparent-function-support`,
    "generation",
    "compatibility",
    "Função aparente resolvida: a cifra sugere uma estrutura funcional implícita no contexto.",
    ["balanced", "exploratory"]
  );
}

function classificationModeForPhrase(phraseContext: PhraseContext): FunctionalClassificationMode {
  return phraseContext.selectedCenter.mode === "minor" ? "minor-functional" : "major-functional";
}

function evaluateProposalRouteDistance(
  proposal: ReharmonizationProposal,
  phraseContext: PhraseContext
): Pick<ReharmonizationProposal, "routeDistanceCost" | "routeProfile" | "routeDistanceEvidence"> {
  const chords = flattenedChords(proposal);
  const report = evaluateHarmonicRouteDistance({
    chords,
    center: phraseContext.selectedCenter.tonic,
    classificationMode: classificationModeForPhrase(phraseContext)
  });

  return {
    routeDistanceCost: report.cost,
    routeProfile: report.profile,
    routeDistanceEvidence: routeEvidenceSummary(report)
  };
}

function routeAwareRankScore(proposal: ReharmonizationProposal): number {
  const voiceScore = proposal.voiceLeadingScore ?? 0;
  const routeCost = proposal.routeDistanceCost ?? 0;
  const bassBonus = proposal.bassLineRankBonus ?? 0;
  const apparentReferenceBonus = proposal.apparentFunctionReferenceBonus ?? 0;
  const temporalCoveragePenalty = proposal.temporalCoveragePenalty ?? 0;
  const unsupportedChromaticPenalty = proposal.unsupportedChromaticPenalty ?? 0;
  const chromaticLegibilityPenalty = proposal.chromaticLegibilityPenalty ?? 0;
  const dominantTensionRankBonus = proposal.dominantTensionRankBonus ?? 0;
  const unsupportedDominantTensionPenalty = proposal.unsupportedDominantTensionPenalty ?? 0;
  return Number((
    voiceScore
    - routeCost * 0.05
    + bassBonus
    + apparentReferenceBonus
    + dominantTensionRankBonus
    - temporalCoveragePenalty
    - unsupportedChromaticPenalty
    - chromaticLegibilityPenalty
    - unsupportedDominantTensionPenalty
  ).toFixed(3));
}

function temporalCoveragePenalty(
  proposal: ReharmonizationProposal,
  anchors: MelodicAnchor[]
): Pick<ReharmonizationProposal, "temporalCoverageRatio" | "temporalCoveragePenalty"> & { evidence: string[] } {
  const anchorMeasures = new Set(anchors.map(anchor => anchor.measureIndex));
  if (anchorMeasures.size < 4) {
    return { temporalCoverageRatio: 1, temporalCoveragePenalty: 0, evidence: [] };
  }

  const proposalMeasures = new Set(proposal.measures.map(measure => measure.measureIndex));
  const chordEventCount = proposal.measures.reduce((count, measure) => count + measure.chords.length, 0);
  const hasReferenceSupport = (proposal.apparentFunctionReferenceBonus || 0) > 0;
  if (hasReferenceSupport && chordEventCount >= Math.ceil(anchorMeasures.size / 2)) {
    return { temporalCoverageRatio: 1, temporalCoveragePenalty: 0, evidence: [] };
  }

  const overlappingMeasures = [...proposalMeasures].filter(measureIndex => anchorMeasures.has(measureIndex)).length;
  const coverageRatio = Number((overlappingMeasures / anchorMeasures.size).toFixed(2));
  if (coverageRatio >= 0.5) {
    return { temporalCoverageRatio: coverageRatio, temporalCoveragePenalty: 0, evidence: [] };
  }

  const penalty = Number(((0.5 - coverageRatio) * 6).toFixed(2));
  return {
    temporalCoverageRatio: coverageRatio,
    temporalCoveragePenalty: penalty,
    evidence: [`Cobertura temporal: proposta cobre ${overlappingMeasures}/${anchorMeasures.size} compassos da frase`]
  };
}

function unsupportedChromaticPenalty(
  proposal: ReharmonizationProposal
): Pick<ReharmonizationProposal, "unsupportedChromaticPenalty"> & { evidence: string[] } {
  const hasReferenceSupport = (proposal.apparentFunctionReferenceBonus || 0) > 0;
  const isChromaticPrimaryCandidate = proposal.routeProfile === "chromatic" || proposal.routeProfile === "radical";
  if (!isChromaticPrimaryCandidate || hasReferenceSupport) {
    return { unsupportedChromaticPenalty: 0, evidence: [] };
  }

  return {
    unsupportedChromaticPenalty: 0.4,
    evidence: ["Ranking: cromatismo sem confirmação forte da referência fica atrás de rotas mais claras"]
  };
}

function apparentFunctionReferenceBonus(
  proposal: ReharmonizationProposal,
  phraseContext: PhraseContext,
  referenceHarmonies: ScoreHarmonyEvent[] | undefined
): Pick<ReharmonizationProposal, "apparentFunctionReferenceBonus" | "referenceFunctionAgreement" | "referenceRootAgreement"> & { evidence: string[] } {
  if (!referenceHarmonies || referenceHarmonies.length === 0) {
    return { apparentFunctionReferenceBonus: 0, referenceFunctionAgreement: 0, referenceRootAgreement: 0, evidence: [] };
  }

  const comparison = compareProposalToReferenceHarmony(
    proposal,
    referenceHarmonies,
    phraseContext.selectedCenter.tonic
  );
  const idiomMatchesReference = !!proposal.harmonicIdiom
    && proposal.harmonicIdiom === comparison.referenceIdiom
    && proposal.harmonicIdiom !== "major-functional";
  if (comparison.status === "aligned") {
    const apparentBonus = comparison.causes.includes("apparent-function-preserved") ? 0.15 : 0;
    const idiomBonus = idiomMatchesReference ? 0.35 : 0;
    return {
      apparentFunctionReferenceBonus: 0.35 + apparentBonus + idiomBonus,
      referenceFunctionAgreement: comparison.functionAgreement,
      referenceRootAgreement: comparison.rootAgreement,
      evidence: [
        "Referência: preserva função no mesmo contexto",
        ...(idiomBonus > 0 ? ["Referência: confirma o mesmo idioma harmônico"] : []),
        ...(apparentBonus > 0 ? ["Referência: confirma função aparente no mesmo contexto"] : [])
      ]
    };
  }

  if (idiomMatchesReference && comparison.rootAgreement >= 0.4) {
    return {
      apparentFunctionReferenceBonus: comparison.rootAgreement >= 0.5 ? 1.1 : 0.75,
      referenceFunctionAgreement: comparison.functionAgreement,
      referenceRootAgreement: comparison.rootAgreement,
      evidence: ["Referência: confirma o mesmo idioma harmônico"]
    };
  }

  return {
    apparentFunctionReferenceBonus: 0,
    referenceFunctionAgreement: comparison.functionAgreement,
    referenceRootAgreement: comparison.rootAgreement,
    evidence: []
  };
}

function slashDensity(proposal: ReharmonizationProposal): number {
  const chords = flattenedChords(proposal);
  if (chords.length === 0) return 0;
  return chords.filter(chord => chord.includes("/")).length / chords.length;
}

function chromaticLegibilityPenalty(
  proposal: ReharmonizationProposal,
  transitionReports: VoiceLeadingTransitionReport[]
): Pick<ReharmonizationProposal, "chromaticLegibilityPenalty"> & { evidence: string[] } {
  const isChromaticRoute = proposal.routeProfile === "chromatic" || proposal.routeProfile === "radical";
  if (!isChromaticRoute) return { chromaticLegibilityPenalty: 0, evidence: [] };

  const density = slashDensity(proposal);
  const guideToneResolutions = transitionReports.reduce((total, report) => total + report.guideToneResolutionCount, 0);
  const referenceRootAgreement = proposal.referenceRootAgreement ?? 0;
  if (density < 0.75 || guideToneResolutions > 0 || referenceRootAgreement >= 0.5) {
    return { chromaticLegibilityPenalty: 0, evidence: [] };
  }

  return {
    chromaticLegibilityPenalty: 1.2,
    evidence: ["Ranking: cromatismo denso sem raiz de referência ou resolução clara fica como alternativa"]
  };
}

function pitchClass(note: string | undefined | null): string | null {
  return note ? Note.pitchClass(note) || null : null;
}

function pitchDistance(from: string | null, to: string | null): number | null {
  const fromChroma = from ? Note.chroma(from) : undefined;
  const toChroma = to ? Note.chroma(to) : undefined;
  if (fromChroma === undefined || toChroma === undefined) return null;
  return (toChroma - fromChroma + 12) % 12;
}

function melodyCoverage(pitches: string[], chordNotes: string[]): number {
  if (pitches.length === 0 || chordNotes.length === 0) return 0;
  const supported = new Set(chordNotes.map(pitchClass).filter((item): item is string => !!item));
  const covered = pitches.filter(pitch => {
    const pc = pitchClass(pitch);
    return !!pc && supported.has(pc);
  }).length;
  return covered / pitches.length;
}

function hasMelodicallySupportedLowerNeighborArrival(
  chords: string[],
  index: number,
  targetRoot: string | null,
  melodyPitches: string[]
): boolean {
  const nextChord = chords[index + 1];
  const nextRoot = pitchClass(chordRoot(nextChord || ""));
  const target = pitchClass(targetRoot);
  if (!nextChord || !nextRoot || !target) return false;
  if (pitchDistance(target, nextRoot) !== 11) return false;

  const sideArrivalCoverage = melodyCoverage(melodyPitches, resolveChordSymbol(nextChord).notes);
  const targetRootCoverage = melodyCoverage(melodyPitches, [target]);
  return sideArrivalCoverage >= 0.6 && targetRootCoverage === 0;
}

function dominantTensionRanking(
  proposal: ReharmonizationProposal,
  anchors: MelodicAnchor[]
): Pick<ReharmonizationProposal, "dominantTensionRankBonus" | "unsupportedDominantTensionPenalty"> & { evidence: string[] } {
  const chords = flattenedChords(proposal);
  const measureIndexes = measureIndexByChordIndex(proposal);
  let bonus = 0;
  let penalty = 0;
  let resolvedAlteredDominants = 0;
  let contextualAlteredDominants = 0;
  let unsupportedAlteredDominants = 0;
  let melodicallySupportedSideArrivals = 0;

  for (let index = 0; index < chords.length; index++) {
    const analysis = analyzeDominantTension(chords[index]);
    if (!analysis.isDominant || analysis.score < 3) continue;

    const resolution = analyzeDominantResolution(chords, index);
    if (resolution.kind === "immediate" || resolution.kind === "subv-immediate") {
      resolvedAlteredDominants++;
      bonus += analysis.level === "high-altered" ? 0.2 : 0.12;
    } else if (isDominantResolutionSupported(resolution.kind)) {
      contextualAlteredDominants++;
      bonus += contextualDominantBonus(resolution.kind);
    } else if (hasMelodicallySupportedLowerNeighborArrival(
      chords,
      index,
      resolution.targetRoot,
      anchorsForMeasure(anchors, measureIndexes[index])
    )) {
      melodicallySupportedSideArrivals++;
      penalty += 0.08;
    } else {
      unsupportedAlteredDominants++;
      penalty += analysis.level === "high-altered" ? 0.45 : 0.25;
    }
  }

  return {
    dominantTensionRankBonus: Number(Math.min(0.4, bonus).toFixed(2)),
    unsupportedDominantTensionPenalty: Number(Math.min(1, penalty).toFixed(2)),
    evidence: [
      ...(resolvedAlteredDominants > 0
        ? [`Ranking: ${resolvedAlteredDominants} tensão dominante alterada resolve localmente`]
        : []),
      ...(contextualAlteredDominants > 0
        ? [`Ranking: ${contextualAlteredDominants} tensão dominante alterada tem resolução contextual`]
        : []),
      ...(unsupportedAlteredDominants > 0
        ? [`Ranking: ${unsupportedAlteredDominants} tensão dominante alterada sem alvo local fica atrás`]
        : []),
      ...(melodicallySupportedSideArrivals > 0
        ? [`Ranking: ${melodicallySupportedSideArrivals} tensão dominante alterada tem chegada lateral sustentada pela melodia`]
        : [])
    ]
  };
}

function contextualDominantBonus(kind: DominantResolutionKind): number {
  if (kind === "prolonged") return 0.1;
  if (kind === "same-root-color-release") return 0.07;
  if (kind === "dominant-reentry") return 0.06;
  if (kind === "terminal-dominant") return 0.03;
  if (kind === "delayed" || kind === "subv-delayed") return 0.08;
  if (kind === "deceptive") return 0.05;
  return 0;
}

export function annotateProposalVoiceLeading(
  proposal: ReharmonizationProposal,
  phraseContext: PhraseContext,
  anchors: MelodicAnchor[],
  options: VoiceLeadingRankingOptions = {}
): ReharmonizationProposal {
  const withBassInversions = suggestBassInversionsForVoiceLeading(proposal);
  const withBassProfile = annotateBassLineProfile(withBassInversions);
  const voiceLeading = evaluateProposalVoiceLeading(withBassProfile, phraseContext, anchors);
  const routeDistance = evaluateProposalRouteDistance(withBassProfile, phraseContext);
  const { transitionReports, ...voiceLeadingFields } = voiceLeading;
  const apparentEvidence = apparentFunctionEvidence(withBassProfile, phraseContext);
  const referenceBonus = apparentFunctionReferenceBonus(withBassProfile, phraseContext, options.referenceHarmonies);
  const withRankingContext = {
    ...withBassProfile,
    ...routeDistance,
    apparentFunctionReferenceBonus: referenceBonus.apparentFunctionReferenceBonus,
    referenceFunctionAgreement: referenceBonus.referenceFunctionAgreement,
    referenceRootAgreement: referenceBonus.referenceRootAgreement
  };
  const temporalCoverage = temporalCoveragePenalty(withRankingContext, anchors);
  const unsupportedChromatic = unsupportedChromaticPenalty(withRankingContext);
  const chromaticLegibility = chromaticLegibilityPenalty(withRankingContext, transitionReports);
  const dominantTension = dominantTensionRanking(withRankingContext, anchors);
  const voiceLeadingDiagnostic = voiceLeadingDiagnosticFor(
    proposal,
    voiceLeadingFields.voiceLeadingScore ?? 0,
    transitionReports
  );
  const apparentFunctionDiagnostic = apparentFunctionDiagnosticFor(proposal, apparentEvidence);
  const evidence = [
    ...(voiceLeadingFields.voiceLeadingEvidence || []),
    ...(routeDistance.routeDistanceEvidence || []),
    ...apparentEvidence.slice(0, 2),
    ...referenceBonus.evidence,
    ...temporalCoverage.evidence,
    ...unsupportedChromatic.evidence,
    ...chromaticLegibility.evidence,
    ...dominantTension.evidence
  ];
  const diagnostics = [
    ...(withBassProfile.diagnostics || []),
    ...(voiceLeadingDiagnostic ? [voiceLeadingDiagnostic] : []),
    ...(apparentFunctionDiagnostic ? [apparentFunctionDiagnostic] : [])
  ];

  return {
    ...proposal,
    ...withBassProfile,
    ...voiceLeadingFields,
    ...routeDistance,
    temporalCoverageRatio: temporalCoverage.temporalCoverageRatio,
    temporalCoveragePenalty: temporalCoverage.temporalCoveragePenalty,
    unsupportedChromaticPenalty: unsupportedChromatic.unsupportedChromaticPenalty,
    chromaticLegibilityPenalty: chromaticLegibility.chromaticLegibilityPenalty,
    dominantTensionRankBonus: dominantTension.dominantTensionRankBonus,
    unsupportedDominantTensionPenalty: dominantTension.unsupportedDominantTensionPenalty,
    apparentFunctionReferenceBonus: referenceBonus.apparentFunctionReferenceBonus,
    referenceFunctionAgreement: referenceBonus.referenceFunctionAgreement,
    referenceRootAgreement: referenceBonus.referenceRootAgreement,
    diagnostics: diagnostics.length > 0
      ? diagnostics.filter((item, index, items) => items.findIndex(other => other.id === item.id) === index)
      : undefined,
    explanation: evidence.length > 0
      ? [...withBassProfile.explanation, ...evidence]
      : withBassProfile.explanation
  };
}

export function rankReharmonizationProposalsByVoiceLeading(
  proposals: ReharmonizationProposal[],
  phraseContext: PhraseContext,
  anchors: MelodicAnchor[],
  options: VoiceLeadingRankingOptions = {}
): ReharmonizationProposal[] {
  return proposals
    .map((proposal, originalIndex) => ({
      proposal: annotateProposalVoiceLeading(proposal, phraseContext, anchors, options),
      originalIndex
    }))
    .sort((a, b) => {
      const aRank = routeAwareRankScore(a.proposal);
      const bRank = routeAwareRankScore(b.proposal);
      if (bRank !== aRank) return bRank - aRank;

      const aScore = a.proposal.voiceLeadingScore ?? 0;
      const bScore = b.proposal.voiceLeadingScore ?? 0;
      if (bScore !== aScore) return bScore - aScore;

      const aRouteCost = a.proposal.routeDistanceCost ?? Number.POSITIVE_INFINITY;
      const bRouteCost = b.proposal.routeDistanceCost ?? Number.POSITIVE_INFINITY;
      if (aRouteCost !== bRouteCost) return aRouteCost - bRouteCost;
      return a.originalIndex - b.originalIndex;
    })
    .map(item => item.proposal);
}
