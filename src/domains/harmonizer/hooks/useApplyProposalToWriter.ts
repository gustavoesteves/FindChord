import { useChordStore, type WriterProgressionChord } from "../../../store/useChordStore";
import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";

export function proposalToWriterProgression(proposal: ReharmonizationProposal): WriterProgressionChord[] {
  let order = 0;

  if (proposal.events && proposal.events.length > 0) {
    return [...proposal.events]
      .sort((a, b) => (
        a.tickStart - b.tickStart
        || a.measureIndex - b.measureIndex
        || a.chordIndex - b.chordIndex
      ))
      .map(event => ({
        id: event.id,
        eventId: event.id,
        measureIndex: event.measureIndex,
        beat: event.beat,
        chordIndex: event.chordIndex,
        occurrenceInMeasure: event.occurrenceInMeasure,
        order: order++,
        chord: event.chord,
        tickStart: event.tickStart,
        tickEnd: event.tickEnd,
        durationTicks: event.durationTicks
      }));
  }

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
