import { useEffect, useRef, useState } from "react";
import { useChordStore } from "../../../store/useChordStore";
import type { MaterialSourceMap } from "../../../utils/music/theory/musicTheory";
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
import {
  defaultWriterMaterialCategoryVisibility,
  effectiveWriterMaterialCategoryVisibility
} from "../services/writerMaterialCategoryVisibility";
import { buildWriterMaterialScreenModel } from "../services/writerMaterialScreenModel";
import {
  type WriterMaterialRouteId
} from "../services/writerMaterialRoutes";
import type { WriterMaterialActionStep } from "../services/writerMaterialAction";
import {
  createWriterMaterialPlaybackController,
  type WriterMaterialPlaybackState
} from "../services/writerMaterialPlaybackController";

export default function WriterMaterialPanel() {
  const {
    detectedChords,
    selectedChordIndex,
    notationStyle,
    tuning,
    selectedFrets
  } = useChordStore();

  const [selectedMaterialSource, setSelectedMaterialSource] = useState<MaterialSourceMap | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<WriterMaterialRouteId | null>(null);
  const [labelMode, setLabelMode] = useState<LocalMaterialFretboardLabelMode>("position");
  const [isSupportMapOpen, setIsSupportMapOpen] = useState(false);
  const [activePlaybackIdentity, setActivePlaybackIdentity] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<WriterMaterialPlaybackState>({
    status: "stopped",
    stepIndex: null,
    loop: false
  });
  const playbackControllerRef = useRef<ReturnType<typeof createWriterMaterialPlaybackController> | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<Record<LocalMaterialNoteCategory, boolean>>(
    defaultWriterMaterialCategoryVisibility
  );
  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;
  const materialPlaybackIdentity = [
    activeChord?.notationInternational || "sem-acorde",
    activeChord?.notes.join(",") || "",
    selectedFrets.map(fret => fret ?? "x").join(","),
    tuning.join(","),
    activeRouteId || "rota-automatica",
    selectedMaterialSource?.name || "material-automatico"
  ].join("|");

  const toggleCategoryVisibility = (category: LocalMaterialNoteCategory) => {
    setVisibleCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  useEffect(() => {
    const controller = createWriterMaterialPlaybackController({
      playStep: step => playGuitarNote(step.note, 0, {
        durationMs: step.durationMs,
        velocity: step.accent ? 1 : 0.78
      }),
      onStateChange: state => {
        setPlaybackState(state);
        if (state.status === "stopped") setActivePlaybackIdentity(null);
      }
    });
    playbackControllerRef.current = controller;

    return () => {
      if (playbackControllerRef.current === controller) {
        playbackControllerRef.current = null;
      }
      controller.dispose();
    };
  }, []);

  useEffect(() => {
    playbackControllerRef.current?.stop();
  }, [materialPlaybackIdentity]);

  const stopStudyLine = () => {
    playbackControllerRef.current?.stop();
  };

  const playStudyLine = (steps: WriterMaterialActionStep[]) => {
    if (steps.length === 0) return;
    setActivePlaybackIdentity(materialPlaybackIdentity);
    playbackControllerRef.current?.play(steps);
  };

  if (!activeChord) {
    return <WriterMaterialNoChordState />;
  }

  const materialScreen = buildWriterMaterialScreenModel({
    activeChord,
    notationStyle,
    preferredRouteId: activeRouteId,
    selectedMaterialSource,
    tuning,
    selectedFrets
  });

  const selectMaterialSource = (source: MaterialSourceMap) => {
    stopStudyLine();
    setSelectedMaterialSource(source);
  };

  const selectRoute = (routeId: WriterMaterialRouteId) => {
    stopStudyLine();
    setActiveRouteId(routeId);
    setSelectedMaterialSource(null);
  };
  const effectiveVisibleCategories = effectiveWriterMaterialCategoryVisibility(
    materialScreen.effectiveRouteId,
    visibleCategories
  );
  const visibleActiveStepIndex = activePlaybackIdentity === materialPlaybackIdentity
    ? playbackState.stepIndex
    : null;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <WriterMaterialPanelHeader
          hasSelectedMaterial={Boolean(selectedMaterialSource)}
          onClearSelection={() => {
            stopStudyLine();
            setSelectedMaterialSource(null);
          }}
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
                <WriterMaterialActionBlock
                  action={materialScreen.activeMaterialAction}
                  onPlay={playStudyLine}
                  onStop={stopStudyLine}
                  onToggleLoop={() => playbackControllerRef.current?.setLoop(!playbackState.loop)}
                  activeStepIndex={visibleActiveStepIndex}
                  isPlaying={playbackState.status === "playing"}
                  loopEnabled={playbackState.loop}
                  playbackError={playbackState.error === "audio-unavailable"
                    ? "Não foi possível iniciar o áudio neste navegador."
                    : undefined}
                />
              )}

              <WriterMaterialFretboardPanel
                tuning={tuning}
                source={materialScreen.focusedMaterialSource}
                activeChord={activeChord}
                selectedFrets={selectedFrets}
                sequenceSteps={materialScreen.activeMaterialAction?.steps}
                activeStepIndex={visibleActiveStepIndex}
                focusedTitle={materialScreen.focusedPaletteItem?.title}
                visibleCategories={effectiveVisibleCategories}
                labelMode={labelMode}
                onLabelModeChange={setLabelMode}
                onToggleCategory={toggleCategoryVisibility}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <WriterMaterialIdeasColumn
                  items={materialScreen.routedMaterialPalette}
                  routePresentation={materialScreen.routePresentation}
                  focusedSource={materialScreen.focusedMaterialSource}
                  onSelect={selectMaterialSource}
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
