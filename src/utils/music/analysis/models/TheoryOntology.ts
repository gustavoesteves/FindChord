export interface OntologicalNode {
  id: string;
  name: string;
  level: number; // 0 = Paradigm, 1 = School/Theory, 2 = Chord Category/Concept
  parentId: string | null;
  description: string;
  associatedTheories: string[]; // IDs of TheoryCandidate or ClassicalSchool
  concepts: string[]; // list of musical concepts/chord classes
}

export interface OntologicalTaxonomy {
  nodes: OntologicalNode[];
  edges: { source: string; target: string; type: 'SUB_CLASS_OF' | 'UNIFIES' | 'INSTANCE_OF' }[];
  metadata: {
    generationIndex: number;
    generationsCount: number;
    taxonomicDistance: number;
    ocs: number;
  };
}

export interface TheoryPrediction {
  id: string;
  candidateId: string;
  scenarioId: string;
  predictedResolution: string; // Expected chord resolution or function
  actualResolution: string;
  isCorrect: boolean;
  confidence: number;
  context: {
    progression: string[];
    isExotic: boolean;
    isEnigmatic: boolean;
  };
}
