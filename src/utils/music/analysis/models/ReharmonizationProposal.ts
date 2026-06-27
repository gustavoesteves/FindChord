export interface ReharmonizationMeasure {
  measureIndex: number;
  chords: string[];
}

export interface ReharmonizationProposal {
  id: string;
  name: string;
  measures: ReharmonizationMeasure[];
  explanation: string[];
  bassLine: string[];
}
