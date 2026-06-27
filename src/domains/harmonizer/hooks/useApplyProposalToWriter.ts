import { useChordStore } from "../../../store/useChordStore";
import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";
import { flattenProposalChords } from "../services/harmonizerService";

export function useApplyProposalToWriter(onNavigateToWriter?: () => void) {
  const setProgressionChords = useChordStore(state => state.setProgressionChords);

  return (proposal: ReharmonizationProposal) => {
    setProgressionChords(flattenProposalChords(proposal));
    if (onNavigateToWriter) onNavigateToWriter();
  };
}

