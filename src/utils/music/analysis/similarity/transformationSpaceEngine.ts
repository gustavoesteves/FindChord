import type { 
  TransformationTemplate, 
  TransformationOpportunity
} from '../models/Discovery';

export const TRANSFORMATION_TEMPLATES: TransformationTemplate[] = [
  {
    id: 'template:tritone_substitution',
    mechanism: 'TRITONE_SUBSTITUTION',
    preconditions: ['DOMINANT_7TH', 'V7'],
    effects: ['VOICE_LEADING_PRESERVATION', 'FUNCTION_PRESERVATION'],
    reversibility: 0.9,
    confidence: 0.95
  },
  {
    id: 'template:modal_borrowing',
    mechanism: 'MODAL_BORROWING',
    preconditions: ['MAJOR_CHORD', 'IV_DEGREE'],
    effects: ['FUNCTION_PRESERVATION', 'TENSION_PRESERVATION'],
    reversibility: 0.85,
    confidence: 0.90
  },
  {
    id: 'template:cadential_reinterpretation',
    mechanism: 'CADENTIAL_REINTERPRETATION',
    preconditions: ['CADENTIAL_64_RESOLUTION', 'I_V_MOTION'],
    effects: ['BASS_SMOOTHING', 'FUNCTION_PRESERVATION'],
    reversibility: 0.7,
    confidence: 0.85
  },
  {
    id: 'template:functional_compression',
    mechanism: 'FUNCTIONAL_COMPRESSION',
    preconditions: ['PREDOMINANT_DOMINANT_SEQUENCE', 'II_V_I'],
    effects: ['FUNCTION_PRESERVATION'],
    reversibility: 0.6,
    confidence: 0.80
  },
  {
    id: 'template:functional_expansion',
    mechanism: 'FUNCTIONAL_EXPANSION',
    preconditions: ['DIRECT_TONIC_DOMINANT_MOTION'],
    effects: ['TENSION_PRESERVATION'],
    reversibility: 0.8,
    confidence: 0.85
  }
];

/**
 * Detecta oportunidades de transformações harmônicas baseadas nos acordes de uma progressão.
 */
export function detectOpportunities(progression: string[]): TransformationOpportunity[] {
  const opportunities: TransformationOpportunity[] = [];

  for (let i = 0; i < progression.length; i++) {
    const chord = progression[i];
    
    // 1. TRITONE_SUBSTITUTION
    // Se o acorde for uma dominante (ex: G7, C7, D7, E7, A7, etc.)
    if (/^[A-G][#b]?7$/.test(chord)) {
      opportunities.push({
        chordIndex: i,
        mechanism: 'TRITONE_SUBSTITUTION',
        confidence: 0.91,
        expectedImpact: 0.91
      });
    }

    // 2. MODAL_BORROWING
    // Se o acorde for um acorde maior (como F, C, G, Db, Eb, Ab, Bb, etc.) e puder ser menorizado
    // Evita o primeiro acorde (comumente a tônica) para não sugerir modal borrowing na tônica inicial
    if (i > 0 && /^[A-G][#b]?$/.test(chord)) {
      opportunities.push({
        chordIndex: i,
        mechanism: 'MODAL_BORROWING',
        confidence: 0.88,
        expectedImpact: 0.85
      });
    }

    // 3. FUNCTIONAL_COMPRESSION
    // Se tivermos uma sequência ii - V ou IV - V (ex: Dm -> G7, F -> G7, Dm7 -> G7)
    if (i < progression.length - 1) {
      const nextChord = progression[i + 1];
      const isPredominant = /^(Dm|F|Dm7|Fmaj7|Fm|Fm7)$/.test(chord);
      const isDominant = /^(G|G7|G9|Bdim|Bdim7)$/.test(nextChord);
      if (isPredominant && isDominant) {
        opportunities.push({
          chordIndex: i,
          mechanism: 'FUNCTIONAL_COMPRESSION',
          confidence: 0.82,
          expectedImpact: 0.75
        });
      }
    }

    // 4. FUNCTIONAL_EXPANSION
    // Se tivermos um movimento direto de Tônica para Dominante (ex: C -> G7)
    if (i < progression.length - 1) {
      const nextChord = progression[i + 1];
      const isTonic = /^(C|Cmaj7|Am|Am7)$/.test(chord);
      const isDominant = /^(G|G7|G9)$/.test(nextChord);
      if (isTonic && isDominant) {
        opportunities.push({
          chordIndex: i,
          mechanism: 'FUNCTIONAL_EXPANSION',
          confidence: 0.85,
          expectedImpact: 0.80
        });
      }
    }
  }

  return opportunities;
}
