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

interface VoiceLeadingRankingOptions {
  referenceHarmonies?: ScoreHarmonyEvent[];
}

function flattenedChords(proposal: ReharmonizationProposal): string[] {
  return proposal.measures.flatMap(measure => measure.chords);
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
  return Number((voiceScore - routeCost * 0.05 + bassBonus + apparentReferenceBonus).toFixed(3));
}

function apparentFunctionReferenceBonus(
  proposal: ReharmonizationProposal,
  phraseContext: PhraseContext,
  referenceHarmonies: ScoreHarmonyEvent[] | undefined
): Pick<ReharmonizationProposal, "apparentFunctionReferenceBonus"> & { evidence: string[] } {
  if (!referenceHarmonies || referenceHarmonies.length === 0) {
    return { apparentFunctionReferenceBonus: 0, evidence: [] };
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
      evidence: ["Referência: confirma o mesmo idioma harmônico"]
    };
  }

  return { apparentFunctionReferenceBonus: 0, evidence: [] };
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
    ...referenceBonus.evidence
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
    apparentFunctionReferenceBonus: referenceBonus.apparentFunctionReferenceBonus,
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
