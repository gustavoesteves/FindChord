import { useState } from "react";
import { CircleDot, ListMusic } from "lucide-react";
import { useScoreSessionStore } from "../../store/useScoreSessionStore";
import { StandardLayout } from "../suite/components/StandardLayout";
import type { TabConfig } from "../suite/components/StandardLayout";
import HarmonizerHeader from "./components/HarmonizerHeader";
import MelodicAnchorLimitNotice from "./components/MelodicAnchorLimitNotice";
import HarmonizerProposalList from "./components/HarmonizerProposalList";
import HarmonizerSectionSelector from "./components/HarmonizerSectionSelector";
import ContextualScaleSuggestionsPanel from "./components/ContextualScaleSuggestionsPanel";
import { useScoreSync } from "./hooks/useScoreSync";
import { useActiveSection } from "./hooks/useActiveSection";
import { useHarmonizerProposals } from "./hooks/useHarmonizerProposals";
import { useApplyProposalToWriter } from "./hooks/useApplyProposalToWriter";
import type { FormalSection } from "../../store/useScoreSessionStore";

interface HarmonizerScreenProps {
  onNavigateToWriter?: () => void;
}

const EMPTY_SECTIONS: FormalSection[] = [];
type HarmonizerView = "harmony" | "improvisation";

const HARMONIZER_TABS: TabConfig<HarmonizerView>[] = [
  { id: "harmony", label: "Harmonizações", icon: ListMusic },
  { id: "improvisation", label: "Improviso", icon: CircleDot }
];

export default function HarmonizerScreen({ onNavigateToWriter }: HarmonizerScreenProps = {}) {
  const { scoreSnapshot, indexes } = useScoreSessionStore();
  const { canSync, isSyncing, syncScore } = useScoreSync();
  const applyProposalToWriter = useApplyProposalToWriter(onNavigateToWriter);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeView, setActiveView] = useState<HarmonizerView>("harmony");

  const sections = indexes?.formalSections || EMPTY_SECTIONS;
  const { activeSection, selectedSectionId, setSelectedSectionId } = useActiveSection(sections);
  const {
    displayedProposals,
    melodyAnchorsData,
    localSegments,
    phraseContext,
    contextualScaleSuggestionSets,
    rejectedExperimentalCount,
    omittedStrategyDiagnostics
  } = useHarmonizerProposals({
    scoreSnapshot,
    activeSection
  });

  return (
    <StandardLayout
      tabs={HARMONIZER_TABS}
      activeTab={activeView}
      onTabChange={setActiveView}
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

        {activeView === "harmony" && (
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
        )}

        {activeView === "improvisation" && (
          <ContextualScaleSuggestionsPanel
            suggestionSets={contextualScaleSuggestionSets}
            hasMelodicContext={melodyAnchorsData.anchors.length > 0}
          />
        )}
      </div>
    </StandardLayout>
  );
}
