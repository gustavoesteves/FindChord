import type { OntologyRegion } from "../regions/OntologyRegion";
import type { ParsedScore } from "../models/ParsedScore";
import type { FunctionalChord } from "../models/FunctionalAnalysis";
import type { SuggestedRoute, HarmonicStrategy, MusicalGoal, SelectionScope, MutationIntent } from "../models/SuggestedRoute";
import { HarmonicTransformer } from "./HarmonicTransformer";
import { RouteScoringEngine } from "./RouteScoringEngine";
import { MelodyExtractor } from "./MelodyExtractor";
import { ChordEnrichmentEngine } from "./ChordEnrichmentEngine";
import { OntologyValidator } from "./OntologyValidator";
import { SectionValidator } from "./SectionValidator";
import { PerspectiveComparator } from "./PerspectiveComparator";
import { PerspectiveClusterer } from "./PerspectiveClusterer";
import { DEFAULT_PRIORITIES } from "../models/HarmonicPriorities";
import type { HarmonicPriorities } from "../models/HarmonicPriorities";
import type { ExplorationResult } from "../models/SuggestedRoute";

/**
 * Route Exploration Engine (F13.2)
 * Gera MutationIntents baseados na região e os envia ao HarmonicTransformer
 * para gerar SuggestedRoutes reais usando Tonal.js.
 */
export class RouteExplorationEngine {
  
  public static exploreScope(
    scope: SelectionScope,
    region: OntologyRegion,
    activeNode: FunctionalChord | null,
    _context: ParsedScore | null,
    priorities: HarmonicPriorities = DEFAULT_PRIORITIES,
    userIntentId?: string
  ): ExplorationResult | null {
    
    // MVP: Não rearmonizamos seções inteiras de uma vez
    if (scope === 'SECTION') {
      return null;
    }

    const routes: SuggestedRoute[] = [];
    const intents = this.generateIntents(region, userIntentId);

    const originalChords = region.nodes.map(n => n.chordSymbol);
    const affectedTicks = { start: region.tickStart, end: region.tickEnd };

    // Extract melody
    const melody = MelodyExtractor.extractMelody(_context, region.tickStart, region.tickEnd);

    for (const intent of intents) {
      const suggestedChords = HarmonicTransformer.applyIntent(intent, scope, region, activeNode, _context);
      
      // F17.5: Chord Enrichment Phase
      ChordEnrichmentEngine.enrichTrajectory(suggestedChords, melody, region.tickStart);

      // Se a transformação falhou ou não mudou nada, não sugerimos a rota
      const hasChanges = suggestedChords.some(c => c.suggested !== c.original);
      if (!hasChanges) continue;

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (['TRITONE_SUBSTITUTION', 'OMNIBUS_PROGRESSION'].includes(intent.strategy)) riskLevel = 'HIGH';
      if (['MODAL_BORROWING', 'BACKDOOR_CADENCE', 'CHROMATIC_APPROACH'].includes(intent.strategy)) riskLevel = 'MEDIUM';

      let perspective: SuggestedRoute = {
        id: 'route_' + Math.random().toString(36).substring(2, 11),
        sourceRegionId: region.id,
        sourceRegionType: region.regionType,
        strategy: intent.strategy,
        goal: this.mapStrategyToGoal(intent.strategy),
        category: intent.category,
        originalChords,
        examples: suggestedChords,
        affectedTicks,
        confidence: intent.confidence,
        riskLevel,
        expectedEffects: this.getEffectsForStrategy(intent.strategy),
        voiceLeadingScore: {
          smoothness: 100, melodicCompatibility: 100, bassCoherence: 100, harmonicPlausibility: 100, overall: 100
        },
        observations: []
      };

      // F17.5: Global Voice Leading & Melodic Evaluation
      perspective = RouteScoringEngine.scorePerspective(perspective, _context, melody);
      
      const { score: ontScore, obs: ontObs } = OntologyValidator.validate(perspective);
      perspective.ontologicalCohesionScore = ontScore;
      perspective.ontologicalObservations = ontObs;

      // F13.5 Section Validation
      let sectionFunction: 'PRESENTATION' | 'DEVELOPMENT' | 'CLIMAX' | 'TRANSITION' | 'RESOLUTION' | 'UNKNOWN' = 'UNKNOWN';
      if (_context && _context.sections) {
        const activeSection = _context.sections.find(s => 
          region.tickStart >= s.startTick && region.tickStart < s.endTick
        );
        if (activeSection) {
          sectionFunction = activeSection.function || SectionValidator.mapLabelToFunction(activeSection.type || activeSection.label);
        }
      }

      const { score: secScore, obs: secObs } = SectionValidator.validate(perspective, sectionFunction);
      perspective.sectionAlignmentScore = secScore;
      perspective.sectionObservations = secObs;

      // F13.7.1 Harmonic Priorities Weighting
      
      // Ajuste de Pesos dinâmicos baseados nas Prioridades
      const wMelody = 0.20 + (priorities.preserveMelody * 0.30); // 20% a 50%
      const wVoiceLeading = 0.10 + (priorities.rewardGravity * 0.20); // 10% a 30%
      const wOntology = 0.20 + (((priorities.rewardTension + priorities.rewardSurprise) / 2) * 0.10); // 20% a 30%
      const wSection = Math.max(0, 1.0 - (wMelody + wOntology + wVoiceLeading)); // Restante (geralmente ~10 a 20%)

      let overall = (perspective.voiceLeadingScore.melodicCompatibility * wMelody) +
                    (perspective.voiceLeadingScore.overall * wVoiceLeading) +
                    (ontScore * wOntology) +
                    (secScore * wSection);

      // Bônus de categoria baseados nas prioridades
      if (perspective.category === 'TENSION') overall += (priorities.rewardTension - 0.5) * 10;
      if (perspective.category === 'SURPRISE') overall += (priorities.rewardSurprise - 0.5) * 10;
      if (perspective.category === 'COLOR') overall += (priorities.rewardColor - 0.5) * 10;
      if (perspective.category === 'MOTION') overall += (priorities.rewardMotion - 0.5) * 10;

      // Penalidade de risco se a tensão não é valorizada
      if (perspective.riskLevel === 'HIGH' && priorities.rewardTension < 0.3) {
        overall -= (0.3 - priorities.rewardTension) * 50; 
      }

      perspective.overallPerspectiveScore = Math.max(0, Math.min(100, Math.round(overall)));

      // Gerar rankingReason
      const bestObs = ontObs.find(o => o.description.startsWith('✔')) 
                   || secObs.find(o => o.description.startsWith('✔'))
                   || perspective.observations.find(o => o.description.startsWith('✔'));
                   
      perspective.rankingReason = bestObs ? bestObs.description : "Opção viável harmonicamente.";

      routes.push(perspective);
    }

    // Ordenar as rotas geradas pelo overallPerspectiveScore dinâmico das Prioridades
    routes.sort((a, b) => (b.overallPerspectiveScore || 0) - (a.overallPerspectiveScore || 0));

    // F13.6 e F13.7.1 Generate Comparisons
    PerspectiveComparator.generateComparisons(routes, priorities);

    if (routes.length === 0) return null;

    // F14.0 Clusterization
    const clusters = PerspectiveClusterer.clusterize(routes);

    return {
      winningPerspectiveId: routes[0].id,
      linearRanking: routes,
      clusters
    };
  }

  private static generateIntents(region: OntologyRegion, userIntentId?: string): MutationIntent[] {
    const intents: MutationIntent[] = [];

    // F16.6 Desacoplamento Arquitetural: Intenção -> Efeito Desejado -> Estratégias
    // O usuário fala linguagem de produtor (userIntentId). Nós mapeamos para o modelo dramático.
    
    // Se o usuário não escolheu nenhuma intenção, cai no fallback da região original (F14)
    if (!userIntentId || userIntentId === 'nao_sei') {
      if (region.regionType === 'CADENTIAL') {
        intents.push({ category: 'SURPRISE', strategy: 'TRITONE_SUBSTITUTION', targetRegionId: region.id, intensity: 0.9, confidence: 0.88 });
        intents.push({ category: 'COLOR', strategy: 'BACKDOOR_CADENCE', targetRegionId: region.id, intensity: 0.7, confidence: 0.92 });
      } else if (region.regionType === 'PROLONGATION') {
        intents.push({ category: 'MOTION', strategy: 'SECONDARY_DOMINANT', targetRegionId: region.id, intensity: 0.8, confidence: 0.90 });
        intents.push({ category: 'COLOR', strategy: 'MODAL_BORROWING', targetRegionId: region.id, intensity: 0.6, confidence: 0.82 });
        intents.push({ category: 'MOTION', strategy: 'PASSING_DIMINISHED', targetRegionId: region.id, intensity: 0.5, confidence: 0.75 });
      } else if (region.regionType === 'TRANSITION') {
        intents.push({ category: 'TENSION', strategy: 'CHROMATIC_APPROACH', targetRegionId: region.id, intensity: 0.7, confidence: 0.87 });
      }
      return intents;
    }

    // Mapeamento Desired Effect
    switch (userIntentId) {
      case 'maior':
        // Efeito Desejado: IMPACTO / EXPECTATIVA
        intents.push({ category: 'TENSION', strategy: 'SECONDARY_DOMINANT', targetRegionId: region.id, intensity: 0.9, confidence: 0.95 });
        intents.push({ category: 'COLOR', strategy: 'MODAL_BORROWING', targetRegionId: region.id, intensity: 0.8, confidence: 0.85 });
        intents.push({ category: 'SURPRISE', strategy: 'TRITONE_SUBSTITUTION', targetRegionId: region.id, intensity: 0.9, confidence: 0.80 });
        break;
      
      case 'escurecer':
        // Efeito Desejado: MISTÉRIO / MELANCOLIA
        intents.push({ category: 'COLOR', strategy: 'MODAL_BORROWING', targetRegionId: region.id, intensity: 0.9, confidence: 0.95 });
        intents.push({ category: 'MOTION', strategy: 'PASSING_DIMINISHED', targetRegionId: region.id, intensity: 0.7, confidence: 0.80 });
        break;

      case 'segurar':
        // Efeito Desejado: SUSPENSÃO / ATRASAR RECOMPENSA
        intents.push({ category: 'SURPRISE', strategy: 'BACKDOOR_CADENCE', targetRegionId: region.id, intensity: 0.8, confidence: 0.85 });
        intents.push({ category: 'SURPRISE', strategy: 'TRITONE_SUBSTITUTION', targetRegionId: region.id, intensity: 0.9, confidence: 0.90 });
        intents.push({ category: 'TENSION', strategy: 'OMNIBUS_PROGRESSION', targetRegionId: region.id, intensity: 0.9, confidence: 0.75 });
        break;

      case 'movimento':
        // Efeito Desejado: URGÊNCIA / DIREÇÃO
        intents.push({ category: 'MOTION', strategy: 'SECONDARY_DOMINANT', targetRegionId: region.id, intensity: 0.9, confidence: 0.95 });
        intents.push({ category: 'MOTION', strategy: 'PASSING_DIMINISHED', targetRegionId: region.id, intensity: 0.8, confidence: 0.90 });
        intents.push({ category: 'TENSION', strategy: 'CHROMATIC_APPROACH', targetRegionId: region.id, intensity: 0.8, confidence: 0.85 });
        break;

      case 'contraste':
        // Efeito Desejado: CONTRASTE NARRATIVO
        intents.push({ category: 'COLOR', strategy: 'MODAL_BORROWING', targetRegionId: region.id, intensity: 0.9, confidence: 0.95 });
        intents.push({ category: 'SURPRISE', strategy: 'TRITONE_SUBSTITUTION', targetRegionId: region.id, intensity: 0.8, confidence: 0.85 });
        intents.push({ category: 'COLOR', strategy: 'BACKDOOR_CADENCE', targetRegionId: region.id, intensity: 0.8, confidence: 0.80 });
        break;

      case 'espaco':
        // Efeito Desejado: LIBERAR PRESSÃO (Less is more)
        intents.push({ category: 'MOTION', strategy: 'PASSING_DIMINISHED', targetRegionId: region.id, intensity: 0.5, confidence: 0.70 });
        // Na F17, adicionaríamos 'DIATONIC_SIMPLIFICATION' ou 'DROP_EXTENSIONS'
        break;
        
      default:
        break;
    }

    return intents;
  }

  private static mapStrategyToGoal(strategy: HarmonicStrategy): MusicalGoal {
    switch (strategy) {
      case 'TRITONE_SUBSTITUTION': return 'CREATE_SURPRISE';
      case 'BACKDOOR_CADENCE': return 'SOFTEN_RESOLUTION';
      case 'SECONDARY_DOMINANT': return 'INCREASE_TENSION';
      case 'MODAL_BORROWING': return 'ADD_COLOR';
      case 'PASSING_DIMINISHED': return 'INCREASE_FORWARD_MOTION';
      case 'CHROMATIC_APPROACH': return 'INCREASE_TENSION';
      default: return 'ADD_COLOR';
    }
  }

  private static getEffectsForStrategy(strategy: HarmonicStrategy): string[] {
    switch (strategy) {
      case 'TRITONE_SUBSTITUTION': return ['chromatic bass motion', 'altered dominant tension'];
      case 'BACKDOOR_CADENCE': return ['modal-plagal color', 'softer resolution', 'plagal gravity'];
      case 'SECONDARY_DOMINANT': return ['increased forward pull', 'local tension'];
      case 'MODAL_BORROWING': return ['darker emotional shade', 'parallel minor flavor'];
      case 'PASSING_DIMINISHED': return ['smooth chromatic voice leading', 'passing diminished resolution'];
      case 'CHROMATIC_APPROACH': return ['aggressive lead-in', 'chromatic approach tension'];
      default: return ['harmonic variation'];
    }
  }
}
