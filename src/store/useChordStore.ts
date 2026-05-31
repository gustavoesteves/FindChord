import { create } from "zustand";
import { analyzeChords, simplifyNote, getNoteAt, getPitchClass, getOctave } from "../utils/musicTheory";
import type { ChordQuality } from "../utils/musicTheory";
import type { VoicingShape } from "../utils/voicingGenerator";

export interface FretPosition {
  stringIndex: number; // 0 (1ª corda - E4) a 5 (6ª corda - E2)
  fret: number;        // 0 (solta) a 24
  noteName: string;    // ex: "C4"
  pitchClass: number;  // 0 a 11
  octave: number;      // Oitava física
}

export interface ChordCandidate {
  root: string;                  // ex: "C"
  quality: ChordQuality;         // Enum de qualidade estrita
  intervals: string[];           // ex: ["Fundamental (1)", "Terça Maior (3)"]
  notes: string[];               // Notas da fórmula teoricamente enarmonizadas (ex: ["E", "G#", "B", "D", "G"])
  score: number;                 // Pontuação absoluta
  confidence: number;            // 0% a 100% de confiança para UX
  omissions: string[];           // Notas omitidas (ex: ["5"])
  additions: string[];           // Notas estendidas extras
  bass?: string;                 // Nota de inversão no baixo
  notationJazz: string;          // ex: "Cmaj7"
  notationBrazilian: string;     // ex: "C7M"
  notationAcademic: string;      // ex: "CΔ7"
  isIncomplete: boolean;         // Se omitiu terça ou fundamental
}

export interface TuningPreset {
  name: string;
  notes: string[]; // 0 (1ª corda) a 5 (6ª corda)
}

export const TUNING_PRESETS: TuningPreset[] = [
  { name: "Padrão (Standard)", notes: ["E4", "B3", "G3", "D3", "A2", "E2"] },
  { name: "Drop D", notes: ["E4", "B3", "G3", "D3", "A2", "D2"] },
  { name: "Eb Padrão (Eb Standard)", notes: ["Eb4", "Bb3", "Gb3", "Db3", "Ab2", "Eb2"] },
  { name: "D Padrão (D Standard)", notes: ["D4", "A3", "F3", "C3", "G2", "D2"] },
  { name: "Open G", notes: ["D4", "B3", "G3", "D3", "G2", "D2"] },
  { name: "Open D", notes: ["D4", "A3", "F#3", "D3", "A2", "D2"] }
];

interface ChordStore {
  // --- ESTADO ---
  tuningPreset: string;
  tuning: string[];                 // 6 notas das cordas (index 0 = 1ª corda)
  selectedFrets: (number | null)[]; // Traste selecionado por corda (null se mutado)
  detectedChords: ChordCandidate[];
  selectedChordIndex: number | null;
  activeScale: { name: string; notes: string[] } | null;
  fretboardExplorerMode: boolean;   // Se ativado, acende todas as notas do acorde no braço
  selectedVoicing: VoicingShape | null;
  notationStyle: "Jazz" | "Brazilian" | "Academic"; // Estilo de notação ativo
  isVoicingSelectorOpen: boolean;   // Se o modal de voicings está aberto
  
  // Voice Leading Explorer
  voiceLeadingSource: (number | null)[] | null; // Voicing A (frets) de origem
  
  // Progression Explorer
  progressionChords: string[];  // Cifras da progressão atual (ex: ["Cmaj7", "Am7"])
  
  // --- AÇÕES ---
  setTuning: (presetName: string, notes: string[]) => void;
  updateCustomStringTuning: (stringIdx: number, newNote: string) => void;
  toggleFret: (stringIndex: number, fret: number) => void;
  muteString: (stringIndex: number) => void;
  clearFretboard: () => void;
  setSelectedChordIndex: (index: number | null) => void;
  setActiveScale: (scale: { name: string; notes: string[] } | null) => void;
  setFretboardExplorerMode: (active: boolean) => void;
  setSelectedVoicing: (voicing: VoicingShape | null) => void;
  setVoiceLeadingSource: (frets: (number | null)[] | null) => void;
  setNotationStyle: (style: "Jazz" | "Brazilian" | "Academic") => void;
  setVoicingSelectorOpen: (open: boolean) => void;
  
  // Ações de Progressão
  addToProgression: (chordName: string) => void;
  removeFromProgression: (idx: number) => void;
  clearProgression: () => void;
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
    return chords;
  };

  return {
    // --- ESTADO INICIAL ---
    tuningPreset: "Padrão (Standard)",
    tuning: [...TUNING_PRESETS[0].notes],
    selectedFrets: Array(6).fill(null),
    detectedChords: [],
    selectedChordIndex: null,
    activeScale: null,
    fretboardExplorerMode: false,
    selectedVoicing: null,
    notationStyle: "Jazz",
    isVoicingSelectorOpen: false,
    
    voiceLeadingSource: null,
    
    progressionChords: [],

    // --- AÇÕES ---
    setTuning: (presetName, notes) => {
      set({
        tuningPreset: presetName,
        tuning: [...notes],
        selectedChordIndex: null,
        selectedVoicing: null,
        activeScale: null
      });
      // Recalcular com o novo afinamento
      const chords = recalculateChords(get().selectedFrets, notes);
      set({ detectedChords: chords });
      if (chords.length > 0) set({ selectedChordIndex: 0 });
    },

    updateCustomStringTuning: (stringIdx, newNote) => {
      const currentTuning = [...get().tuning];
      currentTuning[stringIdx] = simplifyNote(newNote);
      
      set({
        tuningPreset: "Personalizado",
        tuning: currentTuning,
        selectedChordIndex: null,
        selectedVoicing: null,
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

      set({
        selectedFrets: currentFrets,
        selectedVoicing: null // Reseta voicing manual ativo
      });

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

      set({
        selectedFrets: currentFrets,
        selectedVoicing: null
      });

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
        selectedFrets: Array(6).fill(null),
        detectedChords: [],
        selectedChordIndex: null,
        activeScale: null,
        selectedVoicing: null
      });
    },

    setSelectedChordIndex: (index) => {
      set({
        selectedChordIndex: index,
        selectedVoicing: null, // Reseta seleção do diagrama ao mudar de acorde
        activeScale: null     // Limpa escala antiga
      });
    },

    setActiveScale: (scale) => {
      set({ activeScale: scale });
    },

    setFretboardExplorerMode: (active) => {
      set({ fretboardExplorerMode: active });
    },

    setSelectedVoicing: (voicing) => {
      set({ selectedVoicing: voicing });
      if (voicing) {
        // Ao clicar em um voicing gerado, atualizamos o braço físico para refletir essa forma!
        set({ selectedFrets: [...voicing.frets] });
      }
    },

    setVoiceLeadingSource: (frets) => {
      set({ voiceLeadingSource: frets });
    },

    setNotationStyle: (style) => {
      set({ notationStyle: style });
      // Recalcular acordes imediatamente para atualizar toda a UI com a nova notação
      const chords = recalculateChords(get().selectedFrets, get().tuning);
      set({ detectedChords: chords });
    },

    setVoicingSelectorOpen: (open) => {
      set({ isVoicingSelectorOpen: open });
    },

    // Ações de Progressão
    addToProgression: (chordName) => {
      set({ progressionChords: [...get().progressionChords, chordName] });
    },

    removeFromProgression: (idx) => {
      const current = [...get().progressionChords];
      current.splice(idx, 1);
      set({ progressionChords: current });
    },

    clearProgression: () => {
      set({ progressionChords: [] });
    },

    setProgressionChords: (chords) => {
      set({ progressionChords: [...chords] });
    }
  };
});
