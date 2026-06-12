export interface ParadigmState {
  generation: number;
  odi2: number;
  pps: number;
  nar: number;
  activeOntologyId: string;
  status: 'stable' | 'drifting' | 'crisis' | 'replaced';
}
