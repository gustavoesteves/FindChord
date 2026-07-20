import { useChordStore, type WriterProgressionChord } from "../../../store/useChordStore";
import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";

export function proposalToWriterProgression(proposal: ReharmonizationProposal): WriterProgressionChord[] {
  let order = 0;

  return proposal.measures.flatMap(measure => (
    measure.chords.map((chord, chordIndex) => ({
      id: `${proposal.id}-${measure.measureIndex}-${chordIndex}`,
      measureIndex: measure.measureIndex,
      chordIndex,
      order: order++,
      chord
    }))
  ));
}

export function useApplyProposalToWriter(onNavigateToWriter?: () => void) {
  const setProgressionItems = useChordStore(state => state.setProgressionItems);

  return (proposal: ReharmonizationProposal) => {
    setProgressionItems(proposalToWriterProgression(proposal));
    if (onNavigateToWriter) onNavigateToWriter();
  };
}
