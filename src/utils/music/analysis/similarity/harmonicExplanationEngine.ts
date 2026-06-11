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
  certaintyLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
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
  
  // A. Determinar nível de certeza e sentença correspondente
  let certaintyLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  let certaintySentence = '';
  const adaptiveState = targetChord.debug?.adaptiveTonalState;
  
  if (adaptiveState) {
    certaintyLevel = adaptiveState.certaintyLevel;
    const prim = adaptiveState.primary;
    const primModePt = prim.mode === 'MINOR' ? 'menor' : 'maior';
    
    if (certaintyLevel === 'HIGH') {
      certaintySentence = `O contexto favorece claramente ${prim.root} ${primModePt}.`;
    } else if (certaintyLevel === 'MEDIUM') {
      const alt = adaptiveState.alternatives[0];
      if (alt) {
        const altModePt = alt.mode === 'MINOR' ? 'menor' : 'maior';
        const primFuncPt = prim.harmonicFunction === 'TONIC' ? 'tônica' : prim.harmonicFunction === 'SUBDOMINANT' ? 'subdominante' : 'dominante';
        const altFuncPt = alt.harmonicFunction === 'TONIC' ? 'tônica' : alt.harmonicFunction === 'SUBDOMINANT' ? 'subdominante' : 'dominante';
        certaintySentence = `Existem duas interpretações competitivas: o acorde pode atuar como ${primFuncPt} em ${prim.root} ${primModePt} ou como ${altFuncPt} em ${alt.root} ${altModePt}.`;
      } else {
        certaintySentence = `Existem interpretações competitivas no contexto local.`;
      }
    } else {
      certaintySentence = `Não há evidência suficiente para privilegiar um único centro tonal.`;
    }
  } else {
    certaintySentence = `O contexto favorece claramente ${root} ${mode === 'MINOR' ? 'menor' : 'maior'}.`;
  }

  let baseNarrative = '';
  
  if (contextualFunction === 'SECONDARY_DOMINANT') {
    // Dominante Secundária
    let secondaryTarget = targetChord.secondary?.secondaryTarget || 'V';
    let resolutionChord = '';
    if (secondaryTarget === 'ii') resolutionChord = progression[targetIndex + 1] || 'Dm';
    else if (secondaryTarget === 'V') resolutionChord = progression[targetIndex + 1] || 'G';
    else if (secondaryTarget === 'vi') resolutionChord = progression[targetIndex + 1] || 'Am';
    else resolutionChord = progression[targetIndex + 1] || secondaryTarget;
    
    baseNarrative = `${chordName} funciona como dominante secundária (${romanNumeral}) em ${keyNamePt}. Resolução esperada em ${resolutionChord}.`;
  } else if (targetIndex > 0 && analysis.chords[targetIndex - 1]?.contextualFunction === 'SECONDARY_DOMINANT') {
    // Resolução de Dominante Secundária
    const prevChord = analysis.chords[targetIndex - 1];
    const prevChordName = prevChord.chordSymbol;
    const prevRoman = prevChord.romanNumeral || 'V7/ii';
    baseNarrative = `${prevChordName} funciona como dominante secundária (${prevRoman}) em ${keyNamePt}. Resolução esperada em ${chordName}.`;
  } else if (contextualFunction === 'MODAL_BORROWING') {
    // Empréstimo Modal
    if (romanNumeral === 'iv') {
      baseNarrative = `${functionNamePt} iv menor emprestada do modo paralelo em ${keyNamePt}.`;
    } else {
      baseNarrative = `${functionNamePt} ${romanNumeral} emprestado do modo paralelo em ${keyNamePt}.`;
    }
  } else if (contextualFunction === 'CHROMATIC_APPROACH') {
    // Neapolitan ou bII
    baseNarrative = `${functionNamePt} ${romanNumeral} atuando como acorde napolitano ou aproximação cromática em ${keyNamePt}.`;
  } else {
    // Diatônico simples ou modulação
    const firstKey = analysis.chords[0]?.tonal?.tonalCenter;
    const currentKey = targetChord.tonal?.tonalCenter;
    const isModulated = firstKey && currentKey && (firstKey.root !== currentKey.root || firstKey.mode !== currentKey.mode);
    
    if (isModulated) {
      baseNarrative = `Mudança gradual do centro tonal para ${currentKey.root} ${currentKey.mode === 'MINOR' ? 'menor' : 'maior'}.`;
    } else {
      const romanProgression = analysis.chords.map(c => c.romanNumeral).join('–');
      baseNarrative = `${functionNamePt} diatônica em ${keyNamePt}. Completa a progressão ${romanProgression}.`;
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
  
  let narrative = `${certaintySentence} ${baseNarrative} ${confidenceSentence}`;
  
  if (adaptiveState && adaptiveState.mig) {
    const mig = adaptiveState.mig;
    const adi = adaptiveState.adi ?? 0;
    const cfs = adaptiveState.cfs ?? 0;

    if (adi >= 0.15) {
      let consensusText = `\n[Desacordo Musicológico] Há divergência teórica ativa sobre este acorde (ADI: ${adi.toFixed(2)}).`;
      
      const conflicts = mig.nodes.filter(n => n.type === 'conflict');
      if (conflicts.length > 0) {
        consensusText += ' Conflitos detectados: ' + conflicts.map((c: any) => c.description).join(' ');
      }

      const SCHOOLS_LOCAL = [
        { name: 'functionalism', author: 'Riemann' },
        { name: 'schenkerian', author: 'Schenker' },
        { name: 'neo-riemannian', author: 'Cohn' },
        { name: 'set-theory', author: 'Forte' },
        { name: 'axis-theory', author: 'Lendvai' },
        { name: 'jazz-cst', author: 'Berklee' }
      ];

      const schoolEdges = mig.edges.filter(e => e.type === 'supports');
      const schoolSupports: Record<string, string[]> = {};
      schoolEdges.forEach(e => {
        const schoolName = e.from.replace('school_', '');
        const interpNode = mig.nodes.find(n => n.id === e.to);
        if (interpNode) {
          const label = (interpNode as any).label || (interpNode as any).nonDiatonicRepresentation || (interpNode as any).tonalCenter;
          if (!schoolSupports[schoolName]) schoolSupports[schoolName] = [];
          schoolSupports[schoolName].push(`${label} (P: ${e.weight})`);
        }
      });

      const schoolSentences = Object.entries(schoolSupports).map(([school, targets]) => {
        const schoolRef = SCHOOLS_LOCAL.find(s => s.name === school);
        const authorStr = schoolRef ? ` (${schoolRef.author})` : '';
        return `${school.toUpperCase()}${authorStr} apoia: ${targets.join(', ')}`;
      });
      if (schoolSentences.length > 0) {
        consensusText += ` Perspectivas teóricas: ${schoolSentences.join('; ')}.`;
      }

      if (cfs >= 0.4) {
        consensusText += ` O consenso local é frágil (CFS: ${cfs.toFixed(2)}), com alta dependência de eixos específicos.`;
      } else {
        consensusText += ` O consenso local é robusto (CFS: ${cfs.toFixed(2)}).`;
      }
      
      narrative += consensusText;
    }
  }

  if (adaptiveState && (adaptiveState.iss !== undefined || adaptiveState.icr !== undefined)) {
    const iss = adaptiveState.iss ?? 1.0;
    const icr = adaptiveState.icr ?? 1.0;
    const sis = adaptiveState.sis ?? 1.0;
    let causalText = `\n[Análise Causal] A interpretação dominante possui estabilidade global ISS de ${iss.toFixed(2)}, estabilidade semântica SIS de ${sis.toFixed(2)} e robustez causal ICR de ${icr.toFixed(2)}.`;
    
    if (adaptiveState.causalityGraph && adaptiveState.causalityGraph.nodes.length > 0) {
      const causeNodes = adaptiveState.causalityGraph.nodes.filter(n => n.type === 'cause');
      if (causeNodes.length > 0) {
        let bestCause = causeNodes[0];
        let maxWeight = 0;
        causeNodes.forEach(node => {
          const edge = adaptiveState.causalityGraph!.edges.find(e => e.from === node.id);
          if (edge && (edge.weight ?? 0) > maxWeight) {
            maxWeight = edge.weight ?? 0;
            bestCause = node;
          }
        });
        
        const chordName = bestCause.label.replace('Acorde Causal: ', '');
        causalText += ` A interpretação dominante depende principalmente da presença do acorde ${chordName}. Sua remoção reduz a probabilidade da leitura tonal em ${(maxWeight * 100).toFixed(0)}%.`;
        
        if (chordName.includes('7')) {
          causalText += ` Se o acorde ${chordName} fosse substituído por seu substituto de trítono, a análise migraria para uma interpretação com centro tonal alternativo.`;
        } else {
          causalText += ` Se o acorde ${chordName} sofresse intercâmbio modal ou fosse removido, o equilíbrio de forças entre as escolas analíticas mudaria.`;
        }
      }
    }
    narrative += causalText;
  }

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
    narrative,
    certaintyLevel
  };
}
