import type { 
  HarmonicStateProfile, 
  HarmonicStateTransition, 
  GoalAchievement, 
  HarmonicGoal 
} from '../models/Discovery';
import { analyzeProgression } from '../orchestrators/progressionAnalysis';
import { findAutoVoicingsAdvanced } from '../../voiceLeading/voiceLeading';
import { parseChord } from '../../theory/chordParser';

/**
 * Avalia a qualidade da condução de vozes (voice leading) de uma progressão
 * usando a distância média de transição gerada pelo resolvedor Viterbi.
 */
export function evaluateVoiceLeadingQuality(progression: string[]): number {
  if (progression.length < 2) {
    return 1.0;
  }
  
  try {
    const tuning = ['E', 'A', 'D', 'G', 'B', 'E']; // Afinação padrão de guitarra
    const result = findAutoVoicingsAdvanced(progression, tuning, false);
    const totalCost = result.solution.transitions.reduce((sum, t) => sum + t.voiceLeadingCost, 0);
    const averageCost = totalCost / (progression.length - 1);
    
    return Math.max(0.0, Math.min(1.0, 1.0 - (averageCost / 25.0)));
  } catch (error) {
    console.error('Erro ao avaliar voice leading:', error);
    return 0.5; // Fallback neutro
  }
}

/**
 * Gera o perfil estático de estado harmônico para uma progressão de acordes cifra.
 */
export function evaluateHarmonicState(progression: string[]): HarmonicStateProfile {
  if (progression.length === 0) {
    return {
      tension: 0,
      chromaticism: 0,
      bassSmoothness: 1.0,
      functionalStability: 1.0,
      voiceLeadingQuality: 1.0
    };
  }

  const analysis = analyzeProgression(progression);
  const parsedChords = progression.map(c => parseChord(c));

  // 1. Tensão
  const chordTensions = analysis.chords.map((chord, idx) => {
    let score = 0;
    const parsed = parsedChords[idx];
    const quality = parsed.quality;
    if (['dominant7th', 'dominant7sus4', 'dominant9th', 'dominant11th', 'dominant13th'].includes(quality)) {
      score += 0.6;
    } else if (['dominant7b9', 'dominant7#9', 'dominant7#11', 'dominant7b13', 'major7#11'].includes(quality)) {
      score += 0.8;
    } else if (['diminished', 'diminished7th'].includes(quality)) {
      score += 0.7;
    } else if (['halfDiminished'].includes(quality)) {
      score += 0.5;
    } else if (['augmented'].includes(quality)) {
      score += 0.4;
    } else if (['minorMajor7th'].includes(quality)) {
      score += 0.5;
    } else if (['major7th', 'minor7th', 'sus4', 'sus2', 'major6th', 'minor6th', '69', 'major9th', 'minor9th', 'minor11th', 'minor13th', 'add9', 'minorAdd9'].includes(quality)) {
      score += 0.25;
    } else {
      score += 0.05;
    }

    if (!chord.isDiatonic) {
      score += 0.15;
    }
    if (chord.analysisTags.includes('TRITONE_SUBSTITUTION')) {
      score += 0.15;
    }
    if (chord.analysisTags.includes('CHROMATIC_APPROACH')) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  });
  const tension = Number((chordTensions.reduce((sum, val) => sum + val, 0) / progression.length).toFixed(4));

  // 2. Cromatismo
  const chordChromaticisms = analysis.chords.map((chord) => {
    let score = 0;
    if (!chord.isDiatonic) {
      score += 0.5;
    }
    if (chord.analysisTags.includes('TRITONE_SUBSTITUTION')) {
      score += 0.4;
    } else if (chord.analysisTags.includes('CHROMATIC_APPROACH')) {
      score += 0.3;
    } else if (chord.analysisTags.includes('MODAL_BORROWING')) {
      score += 0.25;
    } else if (chord.analysisTags.includes('SECONDARY_DOMINANT')) {
      score += 0.2;
    }
    return Math.min(1.0, score);
  });
  const chromaticism = Number((chordChromaticisms.reduce((sum, val) => sum + val, 0) / progression.length).toFixed(4));

  // 3. Suavidade do Baixo (bassSmoothness)
  const getNoteSemitone = (note: string): number => {
    const root = note.split('/')[0].replace(/[0-9]/g, '');
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
      'A#': 10, 'Bb': 10, 'B': 11
    };
    return noteMap[root] || 0;
  };
  const getBassNote = (chordSymbol: string): string => {
    const parts = chordSymbol.split('/');
    if (parts.length > 1) return parts[1];
    const rootMatch = chordSymbol.match(/^([A-G][#b]?)/);
    return rootMatch ? rootMatch[1] : 'C';
  };
  
  let bassSmoothness = 1.0;
  if (progression.length >= 2) {
    let totalDist = 0;
    for (let i = 0; i < progression.length - 1; i++) {
      const x = getNoteSemitone(getBassNote(progression[i]));
      const y = getNoteSemitone(getBassNote(progression[i + 1]));
      const dist = Math.min(Math.abs(x - y), 12 - Math.abs(x - y));
      totalDist += dist;
    }
    const averageDistance = totalDist / (progression.length - 1);
    bassSmoothness = Number(Math.max(0.0, 1.0 - (averageDistance / 7.0)).toFixed(4));
  }

  // 4. Estabilidade Funcional
  let functionalStability = 1.0;
  if (analysis.chords.length > 0) {
    const diatonicRatio = analysis.chords.filter(c => c.isDiatonic).length / analysis.chords.length;
    let score = diatonicRatio * 0.6;
    
    if (analysis.chords[analysis.chords.length - 1].harmonicFunction === 'TONIC') {
      score += 0.2;
    }
    
    const hasTonic = analysis.chords.some(c => c.harmonicFunction === 'TONIC');
    const hasSubdominant = analysis.chords.some(c => c.harmonicFunction === 'SUBDOMINANT');
    const hasDominant = analysis.chords.some(c => c.harmonicFunction === 'DOMINANT');
    
    if (hasTonic && hasSubdominant && hasDominant) {
      score += 0.2;
    } else if (hasTonic && hasDominant) {
      score += 0.1;
    }
    
    const chromaticTagsCount = analysis.chords.filter(c => 
      c.analysisTags.includes('TRITONE_SUBSTITUTION') || 
      c.analysisTags.includes('CHROMATIC_APPROACH') ||
      c.analysisTags.includes('PASSING_DIMINISHED')
    ).length;
    const chromaticRatio = chromaticTagsCount / analysis.chords.length;
    score -= chromaticRatio * 0.2;
    
    functionalStability = Number(Math.max(0.0, Math.min(1.0, score)).toFixed(4));
  }

  // 5. Voice Leading Quality
  const voiceLeadingQuality = Number(evaluateVoiceLeadingQuality(progression).toFixed(4));

  return {
    tension,
    chromaticism,
    bassSmoothness,
    functionalStability,
    voiceLeadingQuality
  };
}

/**
 * Calcula a transição e deltas estéticos reais entre duas progressões de acordes.
 */
export function evaluateTransition(
  originalProgression: string[],
  transformedProgression: string[]
): HarmonicStateTransition {
  const before = evaluateHarmonicState(originalProgression);
  const after = evaluateHarmonicState(transformedProgression);
  
  return {
    before,
    after,
    tensionDelta: Number((after.tension - before.tension).toFixed(4)),
    chromaticismDelta: Number((after.chromaticism - before.chromaticism).toFixed(4)),
    bassSmoothnessDelta: Number((after.bassSmoothness - before.bassSmoothness).toFixed(4)),
    functionalStabilityDelta: Number((after.functionalStability - before.functionalStability).toFixed(4)),
    voiceLeadingQualityDelta: Number((after.voiceLeadingQuality - before.voiceLeadingQuality).toFixed(4))
  };
}

/**
 * Mede a taxa real de alcance da meta baseado no circuito fechado de deltas.
 */
export function calculateGoalAchievement(
  goal: HarmonicGoal,
  transition: HarmonicStateTransition
): GoalAchievement {
  let score = 0;
  let confidence = 0.85;

  switch (goal) {
    case 'INCREASE_TENSION':
      score = Math.max(0, Math.min(1.0, transition.tensionDelta / 0.3));
      confidence = 0.90;
      break;
    case 'REDUCE_TENSION':
      score = Math.max(0, Math.min(1.0, -transition.tensionDelta / 0.2));
      confidence = 0.85;
      break;
    case 'INCREASE_CHROMATICISM':
      score = Math.max(0, Math.min(1.0, transition.chromaticismDelta / 0.3));
      confidence = 0.95;
      break;
    case 'SMOOTHER_BASS':
      score = Math.max(0, Math.min(1.0, transition.bassSmoothnessDelta / 0.3));
      confidence = 0.90;
      break;
    case 'PRESERVE_FUNCTION':
      score = Math.max(0, Math.min(1.0, 1.0 - Math.max(0, -transition.functionalStabilityDelta) / 0.3));
      confidence = 0.80;
      break;
    case 'JAZZIFY': {
      const jazzScore = (transition.chromaticismDelta + transition.tensionDelta + transition.voiceLeadingQualityDelta) / 3;
      score = Math.max(0, Math.min(1.0, jazzScore / 0.25));
      confidence = 0.88;
      break;
    }
    case 'SIMPLIFY': {
      const simpScore = (-transition.tensionDelta + transition.functionalStabilityDelta) / 2;
      score = Math.max(0, Math.min(1.0, simpScore / 0.2));
      confidence = 0.80;
      break;
    }
    case 'INCREASE_DRAMA': {
      const dramaScore = (transition.tensionDelta + transition.chromaticismDelta - transition.bassSmoothnessDelta) / 3;
      score = Math.max(0, Math.min(1.0, dramaScore / 0.3));
      confidence = 0.85;
      break;
    }
    default:
      score = 0;
      confidence = 0.5;
  }

  return {
    score: Number(score.toFixed(4)),
    confidence
  };
}
