import type { TheoryCandidate } from '../models/TheoryCandidate';

export function classifyFamily(candidate: TheoryCandidate): string {
  if (candidate.family) {
    return candidate.family;
  }

  const desc = (candidate.description || '').toLowerCase();
  const name = (candidate.name || '').toLowerCase();
  const props = (candidate.properties || []).map(p => p.toLowerCase());
  const prototypes = (candidate.prototypeChords || []).map(p => p.toLowerCase());

  // Helper check
  const matches = (term: string) => {
    return desc.includes(term) || 
           name.includes(term) || 
           props.some(p => p.includes(term)) || 
           prototypes.some(p => p.includes(term));
  };

  if (matches('aug') || matches('whole-tone') || matches('tom inteiro')) {
    return 'WHOLE_TONE';
  }

  if (matches('m7b5') || matches('dim7') || matches('symmetric') || matches('simetria')) {
    return 'SYMMETRIC_DIM';
  }

  if (matches('7#11') || matches('acoustic') || matches('acústica')) {
    return 'ACOUSTIC';
  }

  if (matches('maj7') || matches('m7') || matches('7') || matches('tonal') || matches('diatônica')) {
    return 'TONAL_DIATONIC';
  }

  return 'HYBRID';
}

export function calculateEDI(survivors: TheoryCandidate[]): number {
  if (survivors.length === 0) return 0.0;

  const families = new Set<string>();
  survivors.forEach((s) => {
    families.add(classifyFamily(s));
  });

  return Number((families.size / survivors.length).toFixed(4));
}
