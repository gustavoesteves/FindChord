import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useChordStore } from "../../../store/useChordStore";
import type { ChordCandidate } from "../../../store/useChordStore";
import { getPitchClass } from "../../../utils/music/core/pitch";
import { CHORD_REGISTRY } from "../../../utils/music/constants/chordRegistry";
import type { ChordQuality } from "../../../utils/music/constants/chordRegistry";
import { generateVoicings, identifyShapeFamily } from "../../../utils/music/generation/voicingGenerator";
import type { VoicingShape } from "../../../utils/music/models/VoicingShape";

export interface DetectedChord {
  notes: string[];
  bass: string;
  symbol: string;
  inversion: string;
  voicingType: string;
  tensionLevel: number;
  additions: string[];
  root: string;
  quality: string;
}

export interface BuilderState {
  activeInstrument: string;
  tuningPreset: string;
  tuning: string[];
  selectedFrets: (number | null)[];
  detectedChords: DetectedChord[];
  selectedChordIndex: number | null;
  activeChord: DetectedChord | null;
  voicingResults: VoicingShape[];
  bridgeLogs: string[];
  notationStyle: "Jazz" | "Brazilian" | "Academic";
}

export interface BuilderActions {
  setInstrument: (name: string) => void;
  setTuning: (presetName: string, notes: string[]) => void;
  updateCustomStringTuning: (stringIdx: number, newNote: string) => void;
  toggleFret: (stringIdx: number, fret: number) => void;
  muteString: (stringIdx: number) => void;
  clearFretboard: () => void;
  setSelectedChordIndex: (idx: number | null) => void;
  loadVoicing: (voicing: VoicingShape) => void;
  addBridgeLog: (log: string) => void;
  clearBridgeLogs: () => void;
}

interface BuilderContextProps {
  state: BuilderState;
  actions: BuilderActions;
}

const BuilderContext = createContext<BuilderContextProps | undefined>(undefined);

export const BuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeInstrument,
    tuningPreset,
    tuning,
    selectedFrets,
    detectedChords: storeDetectedChords,
    selectedChordIndex,
    notationStyle,
    setInstrument,
    setTuning,
    updateCustomStringTuning,
    toggleFret,
    muteString,
    clearFretboard,
    setSelectedChordIndex,
    setSelectedVoicing
  } = useChordStore();

  const [bridgeLogs, setBridgeLogs] = useState<string[]>([]);

  // Map stores ChordCandidate to internal Domain DetectedChord
  const mappedDetectedChords = useMemo<DetectedChord[]>(() => {
    return storeDetectedChords.map(c => {
      // Determine inversion (Fundamental vs Invertido)
      const isRoot = !c.bass || c.bass === c.root;
      const inversion = isRoot ? "Fundamental" : "Invertido";

      // Determine voicingType (Drop 2, Drop 3, Shell, etc.)
      const voicingType = identifyShapeFamily(selectedFrets);

      // Determine tensionLevel estimate
      const symbol = c.notationJazz || "";
      const tensionLevel = (symbol.includes("dim") || symbol.includes("aug") || symbol.includes("7") || symbol.includes("9") || symbol.includes("11") || symbol.includes("13")) ? 0.65 : 0.15;

      const getDrawnChordName = (chord: ChordCandidate) => {
        if (notationStyle === "Brazilian") return chord.notationBrazilian;
        if (notationStyle === "Academic") return chord.notationAcademic;
        return chord.notationJazz;
      };

      return {
        notes: c.notes,
        bass: c.bass || c.root,
        symbol: getDrawnChordName(c),
        inversion,
        voicingType,
        tensionLevel,
        additions: c.additions || [],
        root: c.root,
        quality: c.quality
      };
    });
  }, [storeDetectedChords, selectedFrets, notationStyle]);

  const activeChord = useMemo<DetectedChord | null>(() => {
    if (selectedChordIndex === null || selectedChordIndex >= mappedDetectedChords.length) return null;
    return mappedDetectedChords[selectedChordIndex];
  }, [selectedChordIndex, mappedDetectedChords]);

  // Combine alternate voicings search
  const [voicingResults, setVoicingResults] = useState<VoicingShape[]>([]);

  useEffect(() => {
    if (!activeChord) {
      setVoicingResults([]);
      return;
    }

    try {
      const chordRoot = activeChord.root;
      const rootPC = getPitchClass(chordRoot);
      const def = activeChord.quality in CHORD_REGISTRY
        ? CHORD_REGISTRY[activeChord.quality as ChordQuality]
        : undefined;
      const targetPitchClasses = def
        ? def.semitones.map((s: number) => (rootPC + s) % 12)
        : [rootPC];

      const results = generateVoicings(
        activeChord.symbol,
        chordRoot,
        targetPitchClasses,
        tuning,
        activeChord.quality,
        null
      );
      setVoicingResults(results);
    } catch (e) {
      console.error("Erro ao gerar voicings no BuilderContext:", e);
      setVoicingResults([]);
    }
  }, [activeChord, tuning]);

  const addBridgeLog = (log: string) => {
    setBridgeLogs(prev => [log, ...prev]);
  };

  const clearBridgeLogs = () => {
    setBridgeLogs([]);
  };

  const state: BuilderState = {
    activeInstrument,
    tuningPreset,
    tuning,
    selectedFrets,
    detectedChords: mappedDetectedChords,
    selectedChordIndex,
    activeChord,
    voicingResults,
    bridgeLogs,
    notationStyle
  };

  const actions: BuilderActions = {
    setInstrument,
    setTuning,
    updateCustomStringTuning,
    toggleFret,
    muteString,
    clearFretboard,
    setSelectedChordIndex,
    loadVoicing: (voicing) => {
      setSelectedVoicing(voicing);
    },
    addBridgeLog,
    clearBridgeLogs
  };

  return (
    <BuilderContext.Provider value={{ state, actions }}>
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder deve ser usado dentro de um BuilderProvider");
  }
  return context;
};
