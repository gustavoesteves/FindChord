import type { ReharmonizationProposal } from "../models/ReharmonizationProposal";
import { resolveChordSymbol } from "../../theory/ChordSymbolResolver";

function chordIdentity(chord: string): string {
  return resolveChordSymbol(chord).normalized;
}

export function proposalHarmonicIdentity(proposal: ReharmonizationProposal): string {
  return [...proposal.measures]
    .sort((a, b) => a.measureIndex - b.measureIndex)
    .map(measure => (
      `${measure.measureIndex}:${measure.chords.map(chordIdentity).join(",")}`
    ))
    .join("|");
}

export function proposalChordSequenceIdentity(proposal: ReharmonizationProposal): string {
  return [...proposal.measures]
    .sort((a, b) => a.measureIndex - b.measureIndex)
    .flatMap(measure => measure.chords.map(chordIdentity))
    .join(",");
}

export function dedupeHarmonicallyEquivalentProposals(
  proposals: ReharmonizationProposal[]
): ReharmonizationProposal[] {
  const seen = new Set<string>();

  return proposals.filter(proposal => {
    const identity = proposalHarmonicIdentity(proposal);
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}
