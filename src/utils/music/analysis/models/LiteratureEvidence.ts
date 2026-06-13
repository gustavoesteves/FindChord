export interface LiteratureEvidence {
  id: string;
  author: string;
  work: string;
  year: number;
  concepts: string[];
  supportsLawIds: string[];
  confidence: number; // Academic rigor/confidence score [0.0, 1.0]
  supportStrength: 'DIRECT' | 'INDIRECT';
}
