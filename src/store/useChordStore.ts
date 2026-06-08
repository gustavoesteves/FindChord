import { create } from "zustand";
import { simplifyNote, getPitchClass } from "../utils/music/core/pitch";
import { getNoteAt, getOctave } from "../utils/music/core/notes";
import { analyzeChords } from "../utils/music/analysis/chordAnalyzer";
import { enarmonizeChordCandidate } from "../utils/music/theory/enharmonics";
import type { ChordQuality } from "../utils/music/constants/chordRegistry";
import type { VoicingShape } from "../utils/music/models/VoicingShape";
import { clearVoicingCache } from "../utils/music/generation/voicingGenerator";
import { harmonyEngine } from "../utils/music/harmonyEngine";

export interface FretPosition {
  stringIndex: number; // 0 (1ª corda - E4) a 5 (6ª corda - E2)
  fret: number;        // 0 (solta) a 24
  noteName: string;    // ex: "C4"
  pitchClass: number;  // 0 a 11
  octave: number;      // Oitava física
}

export interface HarmonicInterpretation {
  notationJazz: string;
  notationBrazilian: string;
  notationAcademic: string;
  score: number;
  confidence: number;
  category: "literal" | "inversao";
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
  bass?: string;                 // Nota de inversion no baixo
  notationJazz: string;          // ex: "Cmaj7"
  notationBrazilian: string;     // ex: "C7M"
  notationAcademic: string;      // ex: "CΔ7"
  isIncomplete: boolean;         // Se omitiu terça ou fundamental
  equivalentInterpretations?: HarmonicInterpretation[];
  intendedChord?: string;
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

export interface Instrument {
  name: string;
  defaultTuning: string[];
  tuningPresets: TuningPreset[];
}

export const INSTRUMENTS: Instrument[] = [
  {
    name: "Violão",
    defaultTuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
    tuningPresets: [
      { name: "Padrão (Standard)", notes: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      { name: "Drop D", notes: ["E4", "B3", "G3", "D3", "A2", "D2"] },
      { name: "Eb Padrão (Eb Standard)", notes: ["Eb4", "Bb3", "Gb3", "Db3", "Ab2", "Eb2"] },
      { name: "D Padrão (D Standard)", notes: ["D4", "A3", "F3", "C3", "G2", "D2"] },
      { name: "Open G", notes: ["D4", "B3", "G3", "D3", "G2", "D2"] },
      { name: "Open D", notes: ["D4", "A3", "F#3", "D3", "A2", "D2"] }
    ]
  },
  {
    name: "Violão 7 cordas",
    defaultTuning: ["E4", "B3", "G3", "D3", "A2", "E2", "C2"],
    tuningPresets: [
      { name: "Padrão 7 cordas (Baixaria em C)", notes: ["E4", "B3", "G3", "D3", "A2", "E2", "C2"] },
      { name: "Padrão 7 cordas (Baixaria em B)", notes: ["E4", "B3", "G3", "D3", "A2", "E2", "B1"] },
      { name: "Drop A (Sete Cordas)", notes: ["E4", "B3", "G3", "D3", "A2", "E2", "A1"] }
    ]
  },
  {
    name: "Baixo",
    defaultTuning: ["G2", "D2", "A1", "E1"],
    tuningPresets: [
      { name: "Padrão (Bass Standard)", notes: ["G2", "D2", "A1", "E1"] },
      { name: "Drop D Bass", notes: ["G2", "D2", "A1", "D1"] },
      { name: "Meio tom abaixo (Half-Step Down)", notes: ["Gb2", "Db2", "Ab1", "Eb1"] }
    ]
  },
  {
    name: "Baixo 6 cordas",
    defaultTuning: ["C3", "G2", "D2", "A1", "E1", "B0"],
    tuningPresets: [
      { name: "Padrão (Bass 6 Standard)", notes: ["C3", "G2", "D2", "A1", "E1", "B0"] }
    ]
  }
];

interface ChordStore {
  // --- ESTADO ---
  activeInstrument: string;
  tuningPreset: string;
  tuning: string[];                 // Notas das cordas (index 0 = 1ª corda)
  selectedFrets: (number | null)[]; // Traste selecionado por corda (null se mutado)
  detectedChords: ChordCandidate[];
  selectedChordIndex: number | null;
  activeScale: { name: string; notes: string[] } | null;
  fretboardExplorerMode: boolean;   // Se ativado, acende todas as notas do acorde no braço
  selectedVoicing: VoicingShape | null;
  notationStyle: "Jazz" | "Brazilian" | "Academic"; // Estilo de notação ativo
  isVoicingSelectorOpen: boolean;   // Se o modal de voicings está aberto
  isScaleSelectorOpen: boolean;     // Se o modal de escalas está aberto
  isChordDetailsOpen: boolean;      // Se o modal de detalhes do acorde está aberto
  isHarmonicNarrativeOpen: boolean; // Se o modal de narrativa harmônica está aberto
  
  // Voice Leading Explorer
  voiceLeadingSource: (number | null)[] | null; // Voicing A (frets) de origem
  
  // Timeline de Progressão de Acordes (Chord Timeline)
  progressionChords: string[];  // Cifras da progressão atual
  timelineVoicings: (VoicingShape | null)[]; // Voicings ideais calculados via DP Viterbi
  activeTimelineIndex: number | null;        // Índice do acorde atualmente em reprodução/inspeção
  isPlaying: boolean;
  bpm: number;
  userCustomVoicings: Record<number, VoicingShape>; // Dedilhados customizados salvos pelo usuário
  
  // --- AÇÕES ---
  setInstrument: (name: string) => void;
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
  setScaleSelectorOpen: (open: boolean) => void;
  setChordDetailsOpen: (open: boolean) => void;
  setHarmonicNarrativeOpen: (open: boolean) => void;
  
  // Ações de Progressão e Timeline
  addToProgression: (chordName: string) => void;
  removeFromProgression: (idx: number) => void;
  clearProgression: () => void;
  setProgressionChords: (chords: string[]) => void;
  setPlaying: (playing: boolean) => void;
  setActiveTimelineIndex: (index: number | null) => void;
  setBpm: (bpm: number) => void;
  updateTimelineVoicings: () => void;
  saveCustomVoicingToTimeline: (index: number, voicing: VoicingShape, chordName: string) => void;
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
    
    // Tentar associar o acorde intencionado da timeline (se houver)
    const storeState = get();
    const activeIdx = storeState ? storeState.activeTimelineIndex : null;
    const intended = (activeIdx !== null && activeIdx !== undefined && storeState) 
      ? storeState.progressionChords[activeIdx] 
      : undefined;

    return chords.map(c => {
      let mapped: ChordCandidate = { ...c, intendedChord: intended };
      if (intended) {
        mapped = enarmonizeChordCandidate(mapped, intended);
      }
      return mapped;
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
    fretboardExplorerMode: false,
    selectedVoicing: null,
    notationStyle: "Jazz",
    isVoicingSelectorOpen: false,
    isScaleSelectorOpen: false,
    isChordDetailsOpen: false,
    isHarmonicNarrativeOpen: false,
    
    voiceLeadingSource: null,
    
    progressionChords: ["C", "Am", "F", "G"],
    timelineVoicings: harmonyEngine.solve({
      progression: ["C", "Am", "F", "G"],
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"]
    }).solution.bestPath.map(av => av ? av.shape : null),
    activeTimelineIndex: null,
    isPlaying: false,
    bpm: 120,
    userCustomVoicings: {},

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
        selectedVoicing: null,
        activeScale: null
      });
      // Recalcular com o novo afinamento
      const chords = recalculateChords(get().selectedFrets, instr.defaultTuning);
      set({ detectedChords: chords });
      if (chords.length > 0) set({ selectedChordIndex: 0 });
      get().updateTimelineVoicings();
    },

    setTuning: (presetName, notes) => {
      clearVoicingCache();
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
      get().updateTimelineVoicings();
    },

    updateCustomStringTuning: (stringIdx, newNote) => {
      clearVoicingCache();
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
      get().updateTimelineVoicings();
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
        selectedFrets: Array(get().tuning.length).fill(null),
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

    setScaleSelectorOpen: (open) => {
      set({ isScaleSelectorOpen: open });
    },

    setChordDetailsOpen: (open) => {
      set({ isChordDetailsOpen: open });
    },

    setHarmonicNarrativeOpen: (open) => {
      set({ isHarmonicNarrativeOpen: open });
    },

    // Ações de Progressão e Timeline
    addToProgression: (chordName) => {
      const newChords = [...get().progressionChords, chordName];
      set({ progressionChords: newChords });

      // Salva o voicing desenhado no braço como customizado para o novo compasso, se houver notas pressionadas
      const selectedFrets = get().selectedFrets;
      const hasFrets = selectedFrets.some(f => f !== null);
      if (hasFrets) {
        const chords = get().detectedChords;
        const activeChord = get().selectedChordIndex !== null ? chords[get().selectedChordIndex!] : chords[0];
        const activeChordRootPC = activeChord ? getPitchClass(activeChord.root) : -1;
        
        let rootString = -1;
        const tuning = get().tuning;
        selectedFrets.forEach((f, idx) => {
          if (f !== null) {
            const noteName = getNoteAt(tuning[idx], f);
            if (getPitchClass(noteName) === activeChordRootPC) {
              rootString = idx;
            }
          }
        });

        const activeFrets = selectedFrets.filter(f => f !== null && f > 0) as number[];
        const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 0;

        const customVoicing: VoicingShape = {
          chordName,
          frets: [...selectedFrets],
          rootString,
          cageShape: "E",
          positionFret: minFret,
          notes: selectedFrets.map((f, idx) => f !== null ? getNoteAt(tuning[idx], f) : "x")
        };

        const newIndex = newChords.length - 1;
        const userCustomVoicings = { ...get().userCustomVoicings };
        userCustomVoicings[newIndex] = customVoicing;
        set({ userCustomVoicings });
      }

      get().updateTimelineVoicings();
    },

    removeFromProgression: (idx) => {
      const current = [...get().progressionChords];
      current.splice(idx, 1);
      
      // Ajustar/reordenar as customizações do usuário
      const customVoicings = { ...get().userCustomVoicings };
      delete customVoicings[idx];
      
      const adjustedCustoms: Record<number, VoicingShape> = {};
      for (const keyStr in customVoicings) {
        const k = parseInt(keyStr);
        if (k > idx) {
          adjustedCustoms[k - 1] = customVoicings[k];
        } else {
          adjustedCustoms[k] = customVoicings[k];
        }
      }
      
      let newActiveIndex = get().activeTimelineIndex;
      if (newActiveIndex !== null) {
        if (newActiveIndex === idx) {
          newActiveIndex = null;
        } else if (newActiveIndex > idx) {
          newActiveIndex = newActiveIndex - 1;
        }
      }
      
      set({ 
        progressionChords: current,
        activeTimelineIndex: newActiveIndex,
        userCustomVoicings: adjustedCustoms
      });
      get().updateTimelineVoicings();
    },

    clearProgression: () => {
      set({ 
        progressionChords: [],
        activeTimelineIndex: null,
        isPlaying: false,
        userCustomVoicings: {}
      });
      get().updateTimelineVoicings();
    },

    setProgressionChords: (chords) => {
      set({ progressionChords: [...chords] });
      get().updateTimelineVoicings();
    },

    setPlaying: (playing) => {
      set({ isPlaying: playing });
    },

    setActiveTimelineIndex: (index) => {
      set({ activeTimelineIndex: index });
      if (index !== null) {
        const voicings = get().timelineVoicings;
        const targetVoicing = voicings[index];
        if (targetVoicing) {
          set({ selectedVoicing: targetVoicing, selectedFrets: [...targetVoicing.frets] });
          // Recalcular os acordes ativamente no braço
          const chords = recalculateChords(targetVoicing.frets, get().tuning);
          set({ detectedChords: chords });
          if (chords.length > 0) set({ selectedChordIndex: 0 });
        }
      }
    },

    setBpm: (bpm) => {
      set({ bpm });
    },

    updateTimelineVoicings: () => {
      const chords = get().progressionChords;
      const tuning = get().tuning;
      const decision = harmonyEngine.solve({ progression: chords, tuning });
      const voicings = decision.solution.bestPath.map(av => av ? av.shape : null);
      
      // Mesclar as vozes auto-calculadas com as customizadas do usuário
      const customVoicings = get().userCustomVoicings || {};
      const mergedVoicings = voicings.map((v, idx) => {
        if (customVoicings[idx]) {
          return customVoicings[idx];
        }
        return v;
      });
      
      set({ timelineVoicings: mergedVoicings });
    },

    saveCustomVoicingToTimeline: (index, voicing, chordName) => {
      const customVoicings = { ...get().userCustomVoicings };
      customVoicings[index] = voicing;

      const currentChords = [...get().progressionChords];
      currentChords[index] = chordName;

      set({ 
        userCustomVoicings: customVoicings,
        progressionChords: currentChords
      });
      get().updateTimelineVoicings();
    }
  };
});
