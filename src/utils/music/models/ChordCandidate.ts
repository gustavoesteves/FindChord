import type { ChordQuality } from "../constants/chordRegistry";

export interface HarmonicInterpretation {
  notationInternational: string;
  notationBrazilian: string;
  notationAcademic: string;
  score: number;
  confidence: number;
  category: "literal" | "inversao";
}

export interface ChordCandidate {
  root: string;
  quality: ChordQuality;
  intervals: string[];
  notes: string[];
  drawnNotes: string[];
  score: number;
  confidence: number;
  omissions: string[];
  additions: string[];
  tensions?: string[];
  bass?: string;
  notationInternational: string;
  notationBrazilian: string;
  notationAcademic: string;
  isIncomplete: boolean;
  equivalentInterpretations?: HarmonicInterpretation[];
  intendedChord?: string;
}
