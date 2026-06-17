export type ArchetypeClass = 'HARMONIC' | 'NARRATIVE';

export const ArchetypeClass = {
  Harmonic: 'HARMONIC' as ArchetypeClass,
  Narrative: 'NARRATIVE' as ArchetypeClass
};

export interface ArchetypeMatch {
  archetypeId: string;
  archetypeClass: ArchetypeClass;
  confidence: number;
  identitySimilarity: number;
  behaviorSimilarity: number;
}
