export type SchoolName = 
  | 'functionalism'
  | 'schenkerian'
  | 'neo-riemannian'
  | 'set-theory'
  | 'axis-theory'
  | 'jazz-cst';

export interface SchoolNode {
  id: string;
  type: 'school';
  name: SchoolName;
  referenceAuthor: string;
}

export interface InterpretationNode {
  id: string;
  type: 'interpretation';
  tonalCenter: string; // e.g. "C", "F#"
  romanNumeral?: string; // e.g. "I", "V/V"
  harmonicFunction?: string; // e.g. "TONIC", "DOMINANT"
  nonDiatonicRepresentation?: string; // e.g. "4-Z15", "L-Transform"
  label: string; // user-friendly label for display
}

export interface EvidenceNode {
  id: string;
  type: 'evidence';
  evidenceType: 'common_notes' | 'linear_resolutions' | 'cadences' | 'voice_leading' | 'structural_symmetry';
  weight: number; // 0.0 to 1.0
  strength: number; // 0.0 to 1.0
  description: string;
}

export type ConflictType = 
  | 'FUNCTION'
  | 'TONAL_CENTER'
  | 'PROLONGATION'
  | 'SET_THEORY'
  | 'MODULATION'
  | 'ONTOLOGY'
  | 'NOMENCLATURE';

export interface ConflictNode {
  id: string;
  type: 'conflict';
  conflictType: ConflictType;
  severity: number; // 0.0 to 1.0
  structuralDistance: number; // D_structural (0.0 to 1.0)
  description: string;
}

export type MIGNode = SchoolNode | InterpretationNode | EvidenceNode | ConflictNode;

export interface Edge {
  from: string; // Node ID
  to: string;   // Node ID
  type: 'supports' | 'based_on' | 'conflicts';
  weight?: number; // conditional probability P(I|S) for supports, or significance for conflicts
}

export interface MusicologicalInterpretationGraph {
  nodes: MIGNode[];
  edges: Edge[];
}
