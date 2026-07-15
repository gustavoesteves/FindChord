import { Note } from "tonal";
import type { ReharmonizationProposal } from "../models/ReharmonizationProposal";
import { chordPitchClasses, chordRoot } from "../../theory/ChordSymbolResolver";
import { analyzeApparentFunction } from "./ApparentFunctionAnalysis";
import { analyzeDominantResolution } from "./DominantResolutionAnalysis";
import { analyzeDominantTension } from "./DominantTensionAnalysis";
import {
  classifyFunctionInMode,
  type FunctionalClassificationMode
} from "./HarmonicStrategyValidator";

export type ProposalConsequenceRelationship =
  | "different-scope"
  | "near-equivalent-color"
  | "distinct";

export interface ProposalConsequenceSimilarityReport {
  relationship: ProposalConsequenceRelationship;
  comparableSlots: number;
  functionAgreement: number;
  rootAgreement: number;
  bassAgreement: number;
  sonorityAgreement: number;
  evidence: string[];
}

interface ProposalSlot {
  measureIndex: number;
  chordIndex: number;
  chord: string;
}

export interface CompareProposalConsequencesOptions {
  center: string;
  classificationMode?: FunctionalClassificationMode;
}

function dominantColorIntensity(proposal: ReharmonizationProposal): number {
  return proposal.measures
    .flatMap(measure => measure.chords)
    .reduce((sum, chord) => sum + analyzeDominantTension(chord).score, 0);
}

function withoutColorVariants(proposal: ReharmonizationProposal): ReharmonizationProposal {
  const plainProposal = { ...proposal };
  delete plainProposal.colorVariants;
  return plainProposal;
}

function canGroupAsColorVariant(
  first: ReharmonizationProposal,
  second: ReharmonizationProposal,
  options: CompareProposalConsequencesOptions
): boolean {
  if (first.kind === "reference" || second.kind === "reference") return false;
  return compareProposalConsequences(first, second, options).relationship === "near-equivalent-color";
}

export function groupNearEquivalentColorVariants(
  proposals: ReharmonizationProposal[],
  options: CompareProposalConsequencesOptions
): ReharmonizationProposal[] {
  const grouped: ReharmonizationProposal[] = [];

  for (const candidate of proposals) {
    const groupIndex = grouped.findIndex(proposal => canGroupAsColorVariant(proposal, candidate, options));
    if (groupIndex < 0) {
      grouped.push(withoutColorVariants(candidate));
      continue;
    }

    const current = grouped[groupIndex];
    const currentVariants = current.colorVariants || [];
    if (dominantColorIntensity(candidate) < dominantColorIntensity(current)) {
      grouped[groupIndex] = {
        ...withoutColorVariants(candidate),
        colorVariants: [withoutColorVariants(current), ...currentVariants]
      };
    } else {
      grouped[groupIndex] = {
        ...current,
        colorVariants: [...currentVariants, withoutColorVariants(candidate)]
      };
    }
  }

  return grouped;
}

export function groupNearReferenceVariants(
  proposals: ReharmonizationProposal[],
  options: CompareProposalConsequencesOptions
): ReharmonizationProposal[] {
  const referenceIndex = proposals.findIndex(proposal => proposal.kind === "reference");
  if (referenceIndex < 0) return proposals;

  const reference = proposals[referenceIndex];
  const referenceVariants: ReharmonizationProposal[] = [];
  const kept: ReharmonizationProposal[] = [];

  for (const proposal of proposals) {
    if (proposal.id === reference.id) continue;
    const report = compareProposalConsequences(reference, proposal, options);
    if (report.relationship === "near-equivalent-color") {
      referenceVariants.push(withoutColorVariants(proposal));
    } else {
      kept.push(proposal);
    }
  }

  return [
    {
      ...withoutColorVariants(reference),
      colorVariants: [
        ...(reference.colorVariants || []).map(withoutColorVariants),
        ...referenceVariants
      ].filter((proposal, index, variants) => (
        variants.findIndex(candidate => candidate.id === proposal.id) === index
      ))
    },
    ...kept
  ];
}

const MIN_NEAR_EQUIVALENT_SONORITY_AGREEMENT = 0.6;

function proposalSlots(proposal: ReharmonizationProposal): ProposalSlot[] {
  return [...proposal.measures]
    .sort((a, b) => a.measureIndex - b.measureIndex)
    .flatMap(measure => measure.chords.map((chord, chordIndex) => ({
      measureIndex: measure.measureIndex,
      chordIndex,
      chord
    })));
}

function sameScope(a: ProposalSlot[], b: ProposalSlot[]): boolean {
  return a.length === b.length && a.every((slot, index) => (
    slot.measureIndex === b[index].measureIndex
    && slot.chordIndex === b[index].chordIndex
  ));
}

function pitchClass(note: string | undefined): string {
  if (!note) return "?";
  const chroma = Note.chroma(note);
  return chroma === undefined ? note : String(chroma);
}

function rootIdentity(chord: string): string {
  return pitchClass(chordRoot(chord) || undefined);
}

function bassIdentity(chord: string): string {
  const explicitBass = chord.match(/\/([A-G](?:#|b)?)$/)?.[1];
  return pitchClass(explicitBass || chordRoot(chord) || undefined);
}

function functionalIdentity(
  slots: ProposalSlot[],
  index: number,
  center: string,
  mode: FunctionalClassificationMode
): string {
  const chords = slots.map(slot => slot.chord);
  const chord = chords[index];
  const dominant = analyzeDominantResolution(chords, index);
  if (dominant.kind !== "non-dominant") {
    return `D>${pitchClass(dominant.targetRoot || undefined)}:${dominant.kind}`;
  }

  const apparent = analyzeApparentFunction(chord, {
    center,
    previousChord: chords[index - 1],
    nextChord: chords[index + 1]
  });
  if (
    apparent
    && !apparent.shouldCountAsFunctionalEscape
    && ["T", "PD", "D", "OTHER"].includes(apparent.apparentFunction)
  ) {
    return `${apparent.apparentFunction}:${apparent.apparentRole}`;
  }

  return classifyFunctionInMode(chord, center, mode);
}

function setSimilarity(a: string[], b: string[]): number {
  const aSet = new Set(a.map(pitchClass));
  const bSet = new Set(b.map(pitchClass));
  const union = new Set([...aSet, ...bSet]);
  if (union.size === 0) return 1;
  const intersection = [...aSet].filter(note => bSet.has(note)).length;
  return intersection / union.size;
}

function agreement(matches: number, total: number): number {
  return total === 0 ? 0 : Number((matches / total).toFixed(2));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export function compareProposalConsequences(
  first: ReharmonizationProposal,
  second: ReharmonizationProposal,
  options: CompareProposalConsequencesOptions
): ProposalConsequenceSimilarityReport {
  const firstSlots = proposalSlots(first);
  const secondSlots = proposalSlots(second);
  if (!sameScope(firstSlots, secondSlots)) {
    return {
      relationship: "different-scope",
      comparableSlots: 0,
      functionAgreement: 0,
      rootAgreement: 0,
      bassAgreement: 0,
      sonorityAgreement: 0,
      evidence: ["As propostas ocupam pontos temporais diferentes"]
    };
  }

  const mode = options.classificationMode || "major-functional";
  let matchingFunctions = 0;
  let matchingRoots = 0;
  let matchingBasses = 0;
  const sonoritySimilarities: number[] = [];

  for (let index = 0; index < firstSlots.length; index++) {
    const firstChord = firstSlots[index].chord;
    const secondChord = secondSlots[index].chord;
    if (
      functionalIdentity(firstSlots, index, options.center, mode)
      === functionalIdentity(secondSlots, index, options.center, mode)
    ) matchingFunctions++;
    if (rootIdentity(firstChord) === rootIdentity(secondChord)) matchingRoots++;
    if (bassIdentity(firstChord) === bassIdentity(secondChord)) matchingBasses++;
    sonoritySimilarities.push(setSimilarity(
      chordPitchClasses(firstChord, false),
      chordPitchClasses(secondChord, false)
    ));
  }

  const comparableSlots = firstSlots.length;
  const functionAgreement = agreement(matchingFunctions, comparableSlots);
  const rootAgreement = agreement(matchingRoots, comparableSlots);
  const bassAgreement = agreement(matchingBasses, comparableSlots);
  const sonorityAgreement = average(sonoritySimilarities);
  const nearEquivalent = functionAgreement === 1
    && rootAgreement === 1
    && bassAgreement === 1
    && sonorityAgreement >= MIN_NEAR_EQUIVALENT_SONORITY_AGREEMENT;

  return {
    relationship: nearEquivalent ? "near-equivalent-color" : "distinct",
    comparableSlots,
    functionAgreement,
    rootAgreement,
    bassAgreement,
    sonorityAgreement,
    evidence: nearEquivalent
      ? ["Mesmo percurso funcional, mesmas raízes e mesmo baixo; varia principalmente a cor dos acordes"]
      : ["A proposta altera percurso funcional, baixo, raiz ou conteúdo sonoro de forma relevante"]
  };
}
