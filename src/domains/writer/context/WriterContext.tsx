import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useChordStore } from "../../../store/useChordStore";
import type { ChordCandidate } from "../../../utils/music/models/ChordCandidate";
import { getPitchClass } from "../../../utils/music/core/pitch";
import { generateVoicings, identifyShapeFamily } from "../../../utils/music/generation/voicingGenerator";
import type { VoicingShape } from "../../../utils/music/models/VoicingShape";

interface DetectedChord {
  notes: string[];
  drawnNotes: string[];
  bass: string;
  symbol: string;
  inversion: string;
  voicingType: string;
  tensionLevel: number;
  additions: string[];
  root: string;
  quality: string;
}

interface WriterState {
  activeInstrument: string;
  tuningPreset: string;
  tuning: string[];
  selectedFrets: (number | null)[];
  detectedChords: DetectedChord[];
  selectedChordIndex: number | null;
  activeChord: DetectedChord | null;
  voicingResults: VoicingShape[];
  notationStyle: "International" | "Brazilian" | "Academic";
}

interface WriterActions {
  setInstrument: (name: string) => void;
  setTuning: (presetName: string, notes: string[]) => void;
  updateCustomStringTuning: (stringIdx: number, newNote: string) => void;
  toggleFret: (stringIdx: number, fret: number) => void;
  muteString: (stringIdx: number) => void;
  clearFretboard: () => void;
  setSelectedChordIndex: (idx: number | null) => void;
  loadVoicing: (voicing: VoicingShape) => void;
}

interface WriterContextProps {
  state: WriterState;
  actions: WriterActions;
}

const WriterContext = createContext<WriterContextProps | undefined>(undefined);

export const WriterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  // Map stores ChordCandidate to internal Domain DetectedChord
  const mappedDetectedChords = useMemo<DetectedChord[]>(() => {
    return storeDetectedChords.map(c => {
      // Determine inversion (Fundamental vs Invertido)
      const isRoot = !c.bass || c.bass === c.root;
      const inversion = isRoot ? "Fundamental" : "Invertido";

      // Determine voicingType (Drop 2, Drop 3, Shell, etc.)
      const voicingType = identifyShapeFamily(selectedFrets);

      // Determine tensionLevel estimate
      const symbol = c.notationInternational || "";
      const tensionLevel = (symbol.includes("dim") || symbol.includes("aug") || symbol.includes("7") || symbol.includes("9") || symbol.includes("11") || symbol.includes("13")) ? 0.65 : 0.15;

      const getDrawnChordName = (chord: ChordCandidate) => {
        if (notationStyle === "Brazilian") return chord.notationBrazilian;
        if (notationStyle === "Academic") return chord.notationAcademic;
        return chord.notationInternational;
      };

      return {
        notes: c.notes,
        drawnNotes: c.drawnNotes || [],
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
      // Pegamos as notas exatas que o usuário desenhou no braço
      const userPCs = Array.from(new Set(activeChord.drawnNotes.map(n => getPitchClass(n))));

      const results = generateVoicings(
        activeChord.symbol,
        chordRoot,
        userPCs, // Permitimos apenas as notas que o usuário tocou
        tuning,
        activeChord.quality,
        null,
        userPCs // Obrigamos que o shape contenha TODAS as notas que o usuário tocou
      );
      setVoicingResults(results);
    } catch (e) {
      console.error("Erro ao gerar voicings no WriterContext:", e);
      setVoicingResults([]);
    }
  }, [activeChord, tuning]);

  const state: WriterState = {
    activeInstrument,
    tuningPreset,
    tuning,
    selectedFrets,
    detectedChords: mappedDetectedChords,
    selectedChordIndex,
    activeChord,
    voicingResults,
    notationStyle
  };

  const actions: WriterActions = {
    setInstrument,
    setTuning,
    updateCustomStringTuning,
    toggleFret,
    muteString,
    clearFretboard,
    setSelectedChordIndex,
    loadVoicing: (voicing) => {
      setSelectedVoicing(voicing);
    }
  };

  return (
    <WriterContext.Provider value={{ state, actions }}>
      {children}
    </WriterContext.Provider>
  );
};

export const useWriter = () => {
  const context = useContext(WriterContext);
  if (!context) {
    throw new Error("useWriter deve ser usado dentro de um WriterProvider");
  }
  return context;
};
