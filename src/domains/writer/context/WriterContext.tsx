import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useChordStore, type WriterProgressionChord } from "../../../store/useChordStore";
import type { ChordCandidate } from "../../../utils/music/models/ChordCandidate";
import { getPitchClass } from "../../../utils/music/core/pitch";
import { generateVoicings } from "../../../utils/music/generation/voicingGenerator";
import type { VoicingShape } from "../../../utils/music/models/VoicingShape";
import { buildWriterCanonicalChordSymbol } from "../services/writerCanonicalChordSymbol";
import { analyzeWriterChordReading } from "../services/writerChordReadingAnalysis";

interface DetectedChord {
  notes: string[];
  drawnNotes: string[];
  bass: string;
  symbol: string;
  canonicalSymbol: string;
  score: number;
  confidence: number;
  inversion: string;
  voicingType: string;
  tensionLevel: number;
  additions: string[];
  tensions: string[];
  root: string;
  quality: string;
  equivalentInterpretations: ChordCandidate["equivalentInterpretations"];
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
  progressionItems: WriterProgressionChord[];
  activeProgressionIndex: number | null;
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
  selectProgressionItem: (index: number) => void;
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
    setSelectedVoicing,
    progressionItems,
    activeProgressionIndex,
    selectProgressionItem
  } = useChordStore();

  // Map stores ChordCandidate to internal Domain DetectedChord
  const mappedDetectedChords = useMemo<DetectedChord[]>(() => {
    return storeDetectedChords.map(c => {
      // Determine inversion (Fundamental vs Invertido)
      const isRoot = !c.bass || c.bass === c.root;
      const inversion = isRoot ? "Fundamental" : "Invertido";

      const getDrawnChordName = (chord: ChordCandidate) => {
        if (notationStyle === "Brazilian") return chord.notationBrazilian;
        if (notationStyle === "Academic") return chord.notationAcademic;
        return chord.notationInternational;
      };

      const readingAnalysis = analyzeWriterChordReading({
        selectedFrets,
        tuning,
        root: c.root,
        quality: c.quality,
        tensions: c.tensions
      });

      const bass = c.bass || c.root;
      const symbol = getDrawnChordName(c);
      const canonicalSymbol = buildWriterCanonicalChordSymbol({
        root: c.root,
        quality: c.quality,
        bass,
        fallbackSymbol: c.notationInternational
      });

      return {
        notes: c.notes,
        drawnNotes: c.drawnNotes || [],
        bass,
        symbol,
        canonicalSymbol,
        score: c.score,
        confidence: c.confidence,
        inversion,
        voicingType: readingAnalysis.voicingType,
        tensionLevel: readingAnalysis.tensionLevel,
        additions: c.additions || [],
        tensions: c.tensions || [],
        root: c.root,
        quality: c.quality,
        equivalentInterpretations: c.equivalentInterpretations || []
      };
    });
  }, [storeDetectedChords, selectedFrets, tuning, notationStyle]);

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
      const bassPC = activeChord.bass ? getPitchClass(activeChord.bass) : null;
      // Pegamos as notas exatas que o usuário desenhou no braço
      const userPCs = Array.from(new Set(activeChord.drawnNotes.map(n => getPitchClass(n))));

      const results = generateVoicings(
        activeChord.symbol,
        chordRoot,
        userPCs, // Permitimos apenas as notas que o usuário tocou
        tuning,
        activeChord.quality,
        bassPC,
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
    notationStyle,
    progressionItems,
    activeProgressionIndex
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
    },
    selectProgressionItem
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
