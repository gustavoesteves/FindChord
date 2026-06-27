import { create } from "zustand";
import { simplifyNote, getPitchClass } from "../utils/music/core/pitch";
import { getNoteAt, getOctave } from "../utils/music/core/notes";
import { analyzeChords } from "../utils/music/analysis/chordAnalyzer";
import { enarmonizeChordCandidate } from "../utils/music/theory/enharmonics";
import type { ChordCandidate } from "../utils/music/models/ChordCandidate";
import type { FretPosition } from "../utils/music/models/FretPosition";
import type { VoicingShape } from "../utils/music/models/VoicingShape";
import { INSTRUMENTS } from "../utils/music/models/InstrumentTuning";
import { clearVoicingCache } from "../utils/music/generation/voicingGenerator";

interface ChordStore {
  // --- ESTADO ---
  activeInstrument: string;
  tuningPreset: string;
  tuning: string[];                 // Notas das cordas (index 0 = 1ª corda)
  selectedFrets: (number | null)[]; // Traste selecionado por corda (null se mutado)
  detectedChords: ChordCandidate[];
  selectedChordIndex: number | null;
  activeScale: { name: string; notes: string[] } | null;
  notationStyle: "International" | "Brazilian" | "Academic"; // Estilo de notação ativo
  
  progressionChords: string[];

  // --- AÇÕES ---
  setInstrument: (name: string) => void;
  setTuning: (presetName: string, notes: string[]) => void;
  updateCustomStringTuning: (stringIdx: number, newNote: string) => void;
  toggleFret: (stringIndex: number, fret: number) => void;
  muteString: (stringIndex: number) => void;
  clearFretboard: () => void;
  setSelectedChordIndex: (index: number | null) => void;
  setActiveScale: (scale: { name: string; notes: string[] } | null) => void;
  setSelectedVoicing: (voicing: VoicingShape | null) => void;
  setNotationStyle: (style: "International" | "Brazilian" | "Academic") => void;
  
  setProgressionChords: (chords: string[]) => void;
  
}

export const useChordStore = create<ChordStore>((set, get) => {
  
  // Helper para recalcular acordes a partir do estado atual de selectedFrets e tuning
  const recalculateChords = (frets: (number | null)[], tuning: string[]) => {
    const activePositions: FretPosition[] = [];
    
    frets.forEach((fret, stringIndex) => {
      if (fret !== null) {
        const baseNote = tuning[stringIndex];
        const noteName = getNoteAt(baseNote, fret);
        activePositions.push({
          stringIndex,
          fret,
          noteName,
          pitchClass: getPitchClass(noteName),
          octave: getOctave(noteName)
        });
      }
    });

    const chords = analyzeChords(activePositions);
    
    return chords.map(c => {
      const intended = get().progressionChords.find(chord => chord.startsWith(c.root));
      return intended ? enarmonizeChordCandidate({ ...c, intendedChord: intended }, intended) : c;
    });
  };

  return {
    // --- ESTADO INICIAL ---
    activeInstrument: "Violão",
    tuningPreset: "Padrão (Standard)",
    tuning: [...INSTRUMENTS[0].defaultTuning],
    selectedFrets: Array(INSTRUMENTS[0].defaultTuning.length).fill(null),
    detectedChords: [],
    selectedChordIndex: null,
    activeScale: null,
    notationStyle: "International",
    
    progressionChords: [],

    // --- AÇÕES ---
    setInstrument: (name) => {
      const instr = INSTRUMENTS.find(i => i.name === name);
      if (!instr) return;
      clearVoicingCache();
      set({
        activeInstrument: name,
        tuningPreset: instr.tuningPresets[0].name,
        tuning: [...instr.defaultTuning],
        selectedFrets: Array(instr.defaultTuning.length).fill(null),
        detectedChords: [],
        selectedChordIndex: null,
        activeScale: null
      });
      // Recalcular com o novo afinamento
      const chords = recalculateChords(get().selectedFrets, instr.defaultTuning);
      set({ detectedChords: chords });
      if (chords.length > 0) set({ selectedChordIndex: 0 });
    },

    setTuning: (presetName, notes) => {
      clearVoicingCache();
      set({
        tuningPreset: presetName,
        tuning: [...notes],
        selectedChordIndex: null,
        activeScale: null
      });
      // Recalcular com o novo afinamento
      const chords = recalculateChords(get().selectedFrets, notes);
      set({ detectedChords: chords });
      if (chords.length > 0) set({ selectedChordIndex: 0 });
    },

    updateCustomStringTuning: (stringIdx, newNote) => {
      clearVoicingCache();
      const currentTuning = [...get().tuning];
      currentTuning[stringIdx] = simplifyNote(newNote);
      
      set({
        tuningPreset: "Personalizado",
        tuning: currentTuning,
        selectedChordIndex: null,
        activeScale: null
      });

      const chords = recalculateChords(get().selectedFrets, currentTuning);
      set({ detectedChords: chords });
      if (chords.length > 0) set({ selectedChordIndex: 0 });
    },

    toggleFret: (stringIndex, fret) => {
      const currentFrets = [...get().selectedFrets];
      
      // Se já estiver nessa casa, remove (muta)
      if (currentFrets[stringIndex] === fret) {
        currentFrets[stringIndex] = null;
      } else {
        // Seleciona a nova casa (substituindo qualquer casa anterior na mesma corda)
        currentFrets[stringIndex] = fret;
      }

      set({ selectedFrets: currentFrets });

      const chords = recalculateChords(currentFrets, get().tuning);
      set({ detectedChords: chords });
      
      if (chords.length > 0) {
        // Se tinha um acorde selecionado anteriormente, tenta manter ou reseta para o 1º
        set({ selectedChordIndex: 0 });
      } else {
        set({ selectedChordIndex: null, activeScale: null });
      }
    },

    muteString: (stringIndex) => {
      const currentFrets = [...get().selectedFrets];
      currentFrets[stringIndex] = null;

      set({ selectedFrets: currentFrets });

      const chords = recalculateChords(currentFrets, get().tuning);
      set({ detectedChords: chords });
      
      if (chords.length > 0) {
        set({ selectedChordIndex: 0 });
      } else {
        set({ selectedChordIndex: null, activeScale: null });
      }
    },

    clearFretboard: () => {
      set({
        selectedFrets: Array(get().tuning.length).fill(null),
        detectedChords: [],
        selectedChordIndex: null,
        activeScale: null
      });
    },

    setSelectedChordIndex: (index) => {
      set({
        selectedChordIndex: index,
        activeScale: null     // Limpa escala antiga
      });
    },

    setActiveScale: (scale) => {
      set({ activeScale: scale });
    },

    setSelectedVoicing: (voicing) => {
      if (voicing) {
        // Ao clicar em um voicing gerado, atualizamos o braço físico para refletir essa forma!
        set({ selectedFrets: [...voicing.frets] });
        const chords = recalculateChords(voicing.frets, get().tuning);
        set({ detectedChords: chords });
        if (chords.length > 0) set({ selectedChordIndex: 0 });
        else set({ selectedChordIndex: null });
      }
    },

    setNotationStyle: (style) => {
      set({ notationStyle: style });
      // Recalcular acordes imediatamente para atualizar toda a UI com a nova notação
      const chords = recalculateChords(get().selectedFrets, get().tuning);
      set({ detectedChords: chords });
    },

    setProgressionChords: (chords) => {
      set({ progressionChords: [...chords] });
    }
  };
});
