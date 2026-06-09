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
        id: `opp:tritone_substitution:${i}`,
        chordIndex: i,
        mechanism: 'TRITONE_SUBSTITUTION',
        confidence: 0.91,
        musicalImpact: 0.8,
        similarityImpact: 0.6,
        pedagogicalValue: 0.9,
        physicalComplexity: 0.8,
        evidenceNodeIds: [`layer5:function:${i}`, `evidence:tritone:${i}`],
        references: i > 0 && /^(Dm|F|Dm7|Fmaj7|Fm|Fm7)$/.test(progression[i - 1]) ? [i - 1] : []
      });
    }

    // 2. MODAL_BORROWING
    // Se o acorde for um acorde maior ou dominante (como F, C, G, G7, Db, Eb, Ab, Bb, etc.) e puder ser menorizado
    // Evita o primeiro acorde (comumente a tônica) para não sugerir modal borrowing na tônica inicial
    if (i > 0 && /^[A-G][#b]?(7)?$/.test(chord)) {
      opportunities.push({
        id: `opp:modal_borrowing:${i}`,
        chordIndex: i,
        mechanism: 'MODAL_BORROWING',
        confidence: 0.88,
        musicalImpact: 0.7,
        similarityImpact: 0.4,
        pedagogicalValue: 0.8,
        physicalComplexity: 0.5,
        evidenceNodeIds: [`layer5:function:${i}`, `evidence:modal:${i}`],
        references: []
      });
    }

    // 3. CADENTIAL_REINTERPRETATION
    // Se o acorde for dominante (ex: G7, G) e o anterior for um predominante (ex: Dm, F)
    if (i > 0 && /^(G|G7|G9|Bdim|Bdim7)$/.test(chord)) {
      const prevChord = progression[i - 1];
      if (/^(Dm|F|Dm7|Fmaj7|Fm|Fm7)$/.test(prevChord)) {
        opportunities.push({
          id: `opp:cadential_reinterpretation:${i}`,
          chordIndex: i,
          mechanism: 'CADENTIAL_REINTERPRETATION',
          confidence: 0.85,
          musicalImpact: 0.6,
          similarityImpact: 0.5,
          pedagogicalValue: 0.85,
          physicalComplexity: 0.6,
          evidenceNodeIds: [`layer5:function:${i}`, `evidence:cadential:${i}`],
          references: [i - 1]
        });
      }
    }

    // 4. FUNCTIONAL_COMPRESSION
    // Se tivermos uma sequência ii - V ou IV - V (ex: Dm -> G7, F -> G7, Dm7 -> G7)
    if (i < progression.length - 1) {
      const nextChord = progression[i + 1];
      const isPredominant = /^(Dm|F|Dm7|Fmaj7|Fm|Fm7)$/.test(chord);
      const isDominant = /^(G|G7|G9|Bdim|Bdim7)$/.test(nextChord);
      if (isPredominant && isDominant) {
        opportunities.push({
          id: `opp:functional_compression:${i}`,
          chordIndex: i,
          mechanism: 'FUNCTIONAL_COMPRESSION',
          confidence: 0.82,
          musicalImpact: 0.4,
          similarityImpact: 0.7,
          pedagogicalValue: 0.7,
          physicalComplexity: 0.3,
          evidenceNodeIds: [`layer5:function:${i}`, `evidence:compression:${i}`],
          references: [i + 1]
        });
      }
    }

    // 5. FUNCTIONAL_EXPANSION
    // Se tivermos um movimento direto de Tônica para Dominante ou Tônica para Predominante
    if (i < progression.length - 1) {
      const nextChord = progression[i + 1];
      const isTonic = /^(C|Cmaj7|Am|Am7)$/.test(chord);
      const isDominantOrPredominant = /^(G|G7|G9|Dm|Dm7|F|Fmaj7)$/.test(nextChord);
      if (isTonic && isDominantOrPredominant) {
        opportunities.push({
          id: `opp:functional_expansion:${i + 1}`,
          chordIndex: i + 1,
          mechanism: 'FUNCTIONAL_EXPANSION',
          confidence: 0.85,
          musicalImpact: 0.5,
          similarityImpact: 0.8,
          pedagogicalValue: 0.75,
          physicalComplexity: 0.4,
          evidenceNodeIds: [`layer5:function:${i + 1}`, `evidence:expansion:${i + 1}`],
          references: [i]
        });
      }
    }
  }

  // Preenche opcionalmente conflitos do mesmo acorde
  opportunities.forEach(opp1 => {
    const conflicts = opportunities
      .filter(opp2 => opp2.id !== opp1.id && opp2.chordIndex === opp1.chordIndex)
      .map(opp2 => opp2.id);
    if (conflicts.length > 0) {
      opp1.conflictingOpportunities = conflicts;
    }
  });

  return opportunities;
}
