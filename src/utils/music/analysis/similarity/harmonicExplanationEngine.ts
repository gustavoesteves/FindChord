import { 
  analyzeProgression,
  analyzeProgressionUnderKey,
  detectOpportunities,
  buildTransformationGraph,
  generateRecommendedPaths,
  computeParetoFrontier,
  explainRecommendationDecision
} from '../functionalAnalysis';
import type { HarmonicGoal, HarmonicConstraint } from '../models/Discovery';

export interface FeatureAttribution {
  dominantFeature: string;
  contributionRanking: [string, string, string, string];
}

export interface HarmonicExplanation {
  tonalCenter: string;
  harmonicFunction: string;
  contextualFunction?: string;
  confidenceFactors: {
    scoreGap: number;
    goalAlignment: number;
    geometry: number;
    informationGain: number;
  };
  attribution: FeatureAttribution;
  narrative: string;
}

export function generateExplanation(
  progression: string[],
  targetChordIndex?: number,
  goal?: HarmonicGoal,
  constraints?: HarmonicConstraint[],
  expectedTonalCenter?: { root: string; mode: 'MAJOR' | 'MINOR' }
): HarmonicExplanation {
  const targetIndex = targetChordIndex !== undefined ? targetChordIndex : progression.length - 1;
  
  // 1. Executar análise harmônica
  let analysis;
  if (expectedTonalCenter) {
    const candidateState = {
      root: expectedTonalCenter.root,
      mode: (expectedTonalCenter.mode === 'MAJOR' ? 'IONIAN' : 'AEOLIAN') as any
    };
    const chordsUnderKey = analyzeProgressionUnderKey(progression, candidateState);
    
    // Map the winner functional hypothesis to each chord
    const mappedChords = chordsUnderKey.map((chord) => {
      const winner = chord.debug?.functionalHypotheses?.[0];
      if (winner) {
        return {
          ...chord,
          harmonicFunction: winner.harmonicFunction,
          contextualFunction: winner.contextualFunction,
          romanNumeral: winner.romanNumeral,
          secondary: winner.contextualFunction === 'SECONDARY_DOMINANT' ? {
            secondaryTarget: winner.secondaryTarget || '',
            contextualAnalysis: winner.contextualAnalysis!,
            contextualFunction: 'SECONDARY_DOMINANT' as const
          } : undefined
        };
      }
      return chord;
    });

    analysis = {
      tonalCenter: expectedTonalCenter,
      chords: mappedChords,
      cadences: []
    };
  } else {
    analysis = analyzeProgression(progression);
  }
  
  if (targetIndex < 0 || targetIndex >= analysis.chords.length) {
    throw new Error(`Target chord index ${targetIndex} is out of bounds for progression of length ${progression.length}`);
  }
  
  const targetChord = analysis.chords[targetIndex];
  const root = expectedTonalCenter 
    ? expectedTonalCenter.root 
    : (targetChord.tonal?.tonalCenter?.root || 'C');
  const mode = expectedTonalCenter
    ? expectedTonalCenter.mode
    : (targetChord.tonal?.tonalCenter?.mode || 'MAJOR');
  
  const tonalCenter = `${root} ${mode === 'MINOR' ? 'Minor' : 'Major'}`;
  const harmonicFunction = targetChord.harmonicFunction || 'TONIC';
  const contextualFunction = targetChord.contextualFunction;
  
  // 2. Simular/Obter Decisão de Confiança
  let scoreGap = 0.85;
  let goalAlignment = 0.75;
  let geometry = 0.65;
  let informationGain = 0.55;
  
  if (goal) {
    const opportunities = detectOpportunities(progression);
    const graph = buildTransformationGraph(opportunities);
    const recommendedPaths = generateRecommendedPaths(opportunities, graph, goal, constraints, progression, true);
    
    if (recommendedPaths && recommendedPaths.length > 0) {
      const paretoFrontier = computeParetoFrontier(recommendedPaths);
      const decision = explainRecommendationDecision(
        recommendedPaths[0],
        recommendedPaths,
        goal,
        constraints,
        paretoFrontier
      );
      scoreGap = decision.confidenceBreakdown?.scoreGapRaw ?? 0.0;
      goalAlignment = decision.confidenceBreakdown?.goalAlignmentRaw ?? 0.0;
      geometry = decision.confidenceBreakdown?.geometryRaw ?? 0.0;
      informationGain = decision.informationGain ?? 0.0;
    }
  }
  
  // 3. Determinar Atribuição Causal de Features via Ablação Virtual
  const ATTRIBUTION_WEIGHTS = {
    scoreGapWeight: 0.55,
    goalAlignmentWeight: 0.25,
    geometryWeight: 0.12,
    ambiguityWeight: 0.08
  };
  const A_coeff = 23.9;
  const B_coeff = -13.4;

  const calculateAttributionConf = (gap: number, goalVal: number, geom: number, gain: number) => {
    const raw = (gap * ATTRIBUTION_WEIGHTS.scoreGapWeight) +
                (goalVal * ATTRIBUTION_WEIGHTS.goalAlignmentWeight) +
                (geom * ATTRIBUTION_WEIGHTS.geometryWeight) +
                (gain * ATTRIBUTION_WEIGHTS.ambiguityWeight);
    const calibrated = 1.0 / (1.0 + Math.exp(-(A_coeff * raw + B_coeff)));
    return Math.max(0.0, Math.min(1.0, calibrated));
  };

  const confOriginal = calculateAttributionConf(scoreGap, goalAlignment, geometry, informationGain);
  const deltaGap = confOriginal - calculateAttributionConf(0, goalAlignment, geometry, informationGain);
  const deltaGoal = confOriginal - calculateAttributionConf(scoreGap, 0, geometry, informationGain);
  const deltaGeom = confOriginal - calculateAttributionConf(scoreGap, goalAlignment, 0, informationGain);
  const deltaGain = confOriginal - calculateAttributionConf(scoreGap, goalAlignment, geometry, 0);

  const features = [
    { name: 'scoreGap', value: deltaGap },
    { name: 'goalAlignment', value: deltaGoal },
    { name: 'geometry', value: deltaGeom },
    { name: 'informationGain', value: deltaGain }
  ];
  
  // Ordenar decrescente. Em caso de empate, priorizar: scoreGap, goalAlignment, geometry, informationGain
  features.sort((a, b) => {
    if (Math.abs(b.value - a.value) > 0.0001) {
      return b.value - a.value;
    }
    const order = ['scoreGap', 'goalAlignment', 'geometry', 'informationGain'];
    return order.indexOf(a.name) - order.indexOf(b.name);
  });
  
  const dominantFeature = features[0].name;
  const contributionRanking: [string, string, string, string] = [
    features[0].name,
    features[1].name,
    features[2].name,
    features[3].name
  ];
  
  const attribution: FeatureAttribution = {
    dominantFeature,
    contributionRanking
  };
  
  // 4. Gerar Narrativa
  const chordName = targetChord.chordSymbol;
  const romanNumeral = targetChord.romanNumeral || 'I';
  const keyNamePt = `${root} ${mode === 'MINOR' ? 'menor' : 'maior'}`;
  
  let functionNamePt = 'Tônica';
  if (harmonicFunction === 'SUBDOMINANT') functionNamePt = 'Subdominante';
  if (harmonicFunction === 'DOMINANT') functionNamePt = 'Dominante';
  
  let narrative = '';
  
  if (contextualFunction === 'SECONDARY_DOMINANT') {
    // Dominante Secundária
    let secondaryTarget = targetChord.secondary?.secondaryTarget || 'V';
    let resolutionChord = '';
    if (secondaryTarget === 'ii') resolutionChord = progression[targetIndex + 1] || 'Dm';
    else if (secondaryTarget === 'V') resolutionChord = progression[targetIndex + 1] || 'G';
    else if (secondaryTarget === 'vi') resolutionChord = progression[targetIndex + 1] || 'Am';
    else resolutionChord = progression[targetIndex + 1] || secondaryTarget;
    
    narrative = `${chordName} funciona como dominante secundária (${romanNumeral}) em ${keyNamePt}. Resolução esperada em ${resolutionChord}.`;
  } else if (targetIndex > 0 && analysis.chords[targetIndex - 1]?.contextualFunction === 'SECONDARY_DOMINANT') {
    // Resolução de Dominante Secundária
    const prevChord = analysis.chords[targetIndex - 1];
    const prevChordName = prevChord.chordSymbol;
    const prevRoman = prevChord.romanNumeral || 'V7/ii';
    narrative = `${prevChordName} funciona como dominante secundária (${prevRoman}) em ${keyNamePt}. Resolução esperada em ${chordName}.`;
  } else if (contextualFunction === 'MODAL_BORROWING') {
    // Empréstimo Modal
    if (romanNumeral === 'iv') {
      narrative = `${functionNamePt} iv menor emprestada do modo paralelo em ${keyNamePt}.`;
    } else {
      narrative = `${functionNamePt} ${romanNumeral} emprestado do modo paralelo em ${keyNamePt}.`;
    }
  } else if (contextualFunction === 'CHROMATIC_APPROACH') {
    // Neapolitan ou bII
    narrative = `${functionNamePt} ${romanNumeral} atuando como acorde napolitano ou aproximação cromática em ${keyNamePt}.`;
  } else {
    // Diatônico simples ou modulação
    const firstKey = analysis.chords[0]?.tonal?.tonalCenter;
    const currentKey = targetChord.tonal?.tonalCenter;
    const isModulated = firstKey && currentKey && (firstKey.root !== currentKey.root || firstKey.mode !== currentKey.mode);
    
    if (isModulated) {
      narrative = `Mudança gradual do centro tonal para ${currentKey.root} ${currentKey.mode === 'MINOR' ? 'menor' : 'maior'}.`;
    } else {
      const romanProgression = analysis.chords.map(c => c.romanNumeral).join('–');
      narrative = `${functionNamePt} diatônica em ${keyNamePt}. Completa a progressão ${romanProgression}.`;
    }
  }
  
  // Adicionar sentença de atribuição de confiança
  const translatedNames: Record<string, string> = {
    scoreGap: 'Score Gap',
    goalAlignment: 'Goal Alignment',
    geometry: 'Geometry',
    informationGain: 'Information Gain'
  };
  const f1 = translatedNames[contributionRanking[0]];
  const f2 = translatedNames[contributionRanking[1]];
  const f3 = translatedNames[contributionRanking[2]];
  const f4 = translatedNames[contributionRanking[3]];
  
  const confidenceSentence = `${f1} alto é o principal responsável pela confiança. Ranking: ${f1} > ${f2} > ${f3} > ${f4}.`;
  narrative += ` ${confidenceSentence}`;
  
  return {
    tonalCenter,
    harmonicFunction,
    contextualFunction,
    confidenceFactors: {
      scoreGap,
      goalAlignment,
      geometry,
      informationGain
    },
    attribution,
    narrative
  };
}
