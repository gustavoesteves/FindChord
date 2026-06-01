export interface ChordAnalysis {
  rootNote: string;
  bassNote: string;
  quality: string;
  notes: string[];
  intervals: string[];
  isSlashChord: boolean;
  isIncomplete: boolean;
}
