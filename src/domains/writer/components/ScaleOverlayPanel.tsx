import { useState } from "react";
import { useChordStore } from "../../../store/useChordStore";
import type { ScaleInfo } from "../../../utils/music/theory/musicTheory";
import {
  type LocalMaterialNoteCategory
} from "../../../utils/music/theory/localMaterialNoteRoles";
import type { LocalMaterialFretboardLabelMode } from "../../../utils/music/theory/localMaterialFretboardNotes";
import { playGuitarNote } from "../../../utils/audioSynth";
import { WriterMaterialActionBlock } from "./WriterMaterialActionBlock";
import { WriterMaterialNoChordState, WriterMaterialNoMaterialsState } from "./WriterMaterialEmptyStates";
import { WriterMaterialFretboardPanel } from "./WriterMaterialFretboardPanel";
import { WriterMaterialIdeasColumn } from "./WriterMaterialIdeasColumn";
import { WriterMaterialInsightPanel } from "./WriterMaterialInsightPanel";
import { WriterMaterialPanelHeader } from "./WriterMaterialPanelHeader";
import { WriterMaterialRouteNavigator } from "./WriterMaterialRouteNavigator";
import { defaultWriterMaterialCategoryVisibility } from "../services/writerMaterialCategoryVisibility";
import { buildWriterMaterialScreenModel } from "../services/writerMaterialScreenModel";
import {
  DEFAULT_WRITER_MATERIAL_ROUTE_ID,
  type WriterMaterialRouteId
} from "../services/writerMaterialRoutes";

export default function ScaleOverlayPanel() {
  const {
    detectedChords,
    selectedChordIndex,
    notationStyle,
    tuning
  } = useChordStore();

  const [localActiveSource, setLocalActiveSource] = useState<ScaleInfo | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<WriterMaterialRouteId>(DEFAULT_WRITER_MATERIAL_ROUTE_ID);
  const [labelMode, setLabelMode] = useState<LocalMaterialFretboardLabelMode>("position");
  const [isSupportMapOpen, setIsSupportMapOpen] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Record<LocalMaterialNoteCategory, boolean>>(
    defaultWriterMaterialCategoryVisibility
  );

  const toggleCategoryVisibility = (category: LocalMaterialNoteCategory) => {
    setVisibleCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const playStudyLine = (notes: string[]) => {
    notes.forEach((note, idx) => playGuitarNote(note, idx * 280));
  };

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  if (!activeChord) {
    return <WriterMaterialNoChordState />;
  }

  const materialScreen = buildWriterMaterialScreenModel({
    activeChord,
    notationStyle,
    preferredRouteId: activeRouteId,
    localActiveSource
  });

  const toggleMaterialSourceOverlay = (source: ScaleInfo) => {
    if (localActiveSource && localActiveSource.name === source.name) {
      setLocalActiveSource(null);
    } else {
      setLocalActiveSource(source);
    }
  };

  const selectRoute = (routeId: WriterMaterialRouteId) => {
    setActiveRouteId(routeId);
    setLocalActiveSource(null);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <WriterMaterialPanelHeader
          hasActiveFilter={Boolean(localActiveSource)}
          onClearFilter={() => setLocalActiveSource(null)}
        />

        <div className="flex flex-col gap-4">
          {materialScreen.hasMaterials ? (
            <div className="flex flex-col gap-3">
              <WriterMaterialRouteNavigator
                chordName={materialScreen.chordName}
                activeRoute={materialScreen.effectiveRoute}
                routes={materialScreen.materialRoutes}
                activeRouteId={materialScreen.effectiveRouteId}
                onSelectRoute={selectRoute}
              />

              {materialScreen.activeMaterialAction && (
                <WriterMaterialActionBlock action={materialScreen.activeMaterialAction} onPlay={playStudyLine} />
              )}

              <WriterMaterialFretboardPanel
                tuning={tuning}
                source={materialScreen.focusedMaterialSource}
                activeChord={activeChord}
                focusedTitle={materialScreen.focusedPaletteItem?.title}
                visibleCategories={visibleCategories}
                labelMode={labelMode}
                onLabelModeChange={setLabelMode}
                onToggleCategory={toggleCategoryVisibility}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <WriterMaterialIdeasColumn
                  items={materialScreen.routedMaterialPalette}
                  routePresentation={materialScreen.routePresentation}
                  focusedSource={materialScreen.focusedMaterialSource}
                  onSelect={toggleMaterialSourceOverlay}
                />

                <div className="lg:col-span-5">
                  <WriterMaterialInsightPanel
                    panel={materialScreen.activeMaterialPanel}
                    isSupportMapOpen={isSupportMapOpen}
                    onToggleSupportMap={() => setIsSupportMapOpen(prev => !prev)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <WriterMaterialNoMaterialsState />
          )}
        </div>
      </div>
    </div>
  );
}
