import { useState } from "react";
import { useScoreSessionStore } from "../../store/useScoreSessionStore";
import { StandardLayout } from "../suite/components/StandardLayout";
import HarmonizerHeader from "./components/HarmonizerHeader";
import MelodicAnchorLimitNotice from "./components/MelodicAnchorLimitNotice";
import HarmonizerProposalList from "./components/HarmonizerProposalList";
import HarmonizerSectionSelector from "./components/HarmonizerSectionSelector";
import { useScoreSync } from "./hooks/useScoreSync";
import { useActiveSection } from "./hooks/useActiveSection";
import { useHarmonizerProposals } from "./hooks/useHarmonizerProposals";
import { useApplyProposalToWriter } from "./hooks/useApplyProposalToWriter";
import type { FormalSection } from "../../store/useScoreSessionStore";

interface HarmonizerScreenProps {
  onNavigateToWriter?: () => void;
}

const EMPTY_SECTIONS: FormalSection[] = [];

export default function HarmonizerScreen({ onNavigateToWriter }: HarmonizerScreenProps = {}) {
  const { scoreSnapshot, indexes } = useScoreSessionStore();
  const { canSync, isSyncing, syncScore } = useScoreSync();
  const applyProposalToWriter = useApplyProposalToWriter(onNavigateToWriter);
  const [isExpanded, setIsExpanded] = useState(false);

  const sections = indexes?.formalSections || EMPTY_SECTIONS;
  const { activeSection, selectedSectionId, setSelectedSectionId } = useActiveSection(sections);
  const {
    displayedProposals,
    melodyAnchorsData,
    localSegments,
    phraseContext,
    rejectedExperimentalCount,
    omittedStrategyDiagnostics
  } = useHarmonizerProposals({
    scoreSnapshot,
    activeSection
  });

  return (
    <StandardLayout
      headerContent={
        <HarmonizerHeader
          phraseContext={phraseContext}
          canSync={canSync}
          isSyncing={isSyncing}
          onSync={syncScore}
        />
      }
    >
      <div className="flex flex-col gap-10 animate-fade-in pb-10 max-w-4xl mx-auto w-full">
        <HarmonizerSectionSelector
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
        />

        <MelodicAnchorLimitNotice visible={melodyAnchorsData.isTruncated} />

        <HarmonizerProposalList
          proposals={displayedProposals}
          localSegments={localSegments}
          hasMelodicAnchors={melodyAnchorsData.anchors.length > 0}
          rejectedExperimentalCount={rejectedExperimentalCount}
          omittedStrategyDiagnostics={omittedStrategyDiagnostics}
          isExpanded={isExpanded}
          onToggleExpanded={() => setIsExpanded(!isExpanded)}
          onApplyProposal={applyProposalToWriter}
        />
      </div>
    </StandardLayout>
  );
}
