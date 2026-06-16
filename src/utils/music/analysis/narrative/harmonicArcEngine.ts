import type { FunctionalAnalysis, AnalyticalSection } from '../models/FunctionalAnalysis';
import type { GlobalHarmonicArc, HarmonicPhase, HarmonicPhaseType, GlobalHarmonicMeaning } from '../models/HarmonicNarrative';

/**
 * Infere a Trajetória Dramática (Arc) da obra.
 */
export function inferGlobalHarmonicArc(analysis: FunctionalAnalysis): GlobalHarmonicArc {
  const { analyticalSections } = analysis;

  if (analyticalSections && analyticalSections.length > 0) {
    return inferArcFromSections(analyticalSections);
  }

  // Fallback para quando a obra não possui seções definidas pelo usuário
  return inferArcFromMeaningFallback(analysis);
}

/**
 * Infere o arco a partir da sequência de seções estruturais.
 */
function inferArcFromSections(sections: AnalyticalSection[]): GlobalHarmonicArc {
  const phases: HarmonicPhase[] = [];

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const state = sec.facts.state;
    if (!state) continue;

    let phaseType: HarmonicPhaseType = 'ESTABLISHMENT';
    const causes: string[] = [];

    // Lógica para inferir o Phase Type com base no HarmonicState da seção
    if (i === 0) {
      if (state.tonalClarity === 'clear') {
        phaseType = 'ESTABLISHMENT';
        causes.push('firmeza na declaração do centro de gravidade');
      } else {
        phaseType = 'DESTABILIZATION';
        causes.push('identidade ambígua logo na exposição inicial');
      }
    } else {
      const prevPhase = phases[phases.length - 1]?.type;

      if (state.stability === 'high' && state.tonalClarity === 'clear') {
        if (prevPhase === 'ESTABLISHMENT' || prevPhase === 'CONSOLIDATION') {
          phaseType = 'CONSOLIDATION';
          causes.push('extensão da zona de conforto tonal');
        } else if (prevPhase === 'FRAGMENTATION' || prevPhase === 'DESTABILIZATION') {
          phaseType = 'RECONSTRUCTION';
          causes.push('recuperação gradual da estabilidade prévia');
        } else {
          phaseType = 'ESTABLISHMENT';
          causes.push('nova âncora estabilizadora estrutural');
        }
      } else if (state.stability === 'low' || state.tonalClarity === 'ambiguous') {
        if (state.directionality === 'suspended' || state.directionality === 'static') {
          phaseType = 'FRAGMENTATION';
          causes.push('perda do centro gravitacional e desintegração direcional');
        } else {
          phaseType = 'DESTABILIZATION';
          causes.push('ruptura ativa da estabilidade por movimentos direcionais agressivos');
        }
      } else if (state.directionality === 'forward-moving') {
        phaseType = 'EXPANSION';
        causes.push('movimento linear contínuo explorando novos terrenos sem ruptura severa');
      } else {
        phaseType = 'EXPANSION';
        causes.push('continuação natural do fluxo sem picos de tensão');
      }

      // Se for a última seção, sobrepomos com a lógica de encerramento
      if (i === sections.length - 1) {
        if (state.closureLevel === 'resolved') {
          phaseType = 'RESOLUTION';
          causes.push('condução afirmativa para o repouso definitivo');
        } else if (state.closureLevel === 'open' || state.closureLevel === 'partial') {
          phaseType = 'DISSOLUTION';
          causes.push('enfraquecimento da estrutura sem conclusão explícita');
        }
      }
    }

    // Calcula a duração com base nos compassos (se disponíveis)
    let relativeDuration: 'short' | 'moderate' | 'long' = 'moderate';
    const numChords = (sec.section.endChordIndex || 0) - (sec.section.startChordIndex || 0) + 1;
    if (numChords <= 4) relativeDuration = 'short';
    else if (numChords >= 16) relativeDuration = 'long';

    phases.push({
      type: phaseType,
      confidence: 0.8,
      causes,
      startSectionIndex: i,
      endSectionIndex: i,
      relativeDuration
    });
  }

  // Passo de consolidação: se tivermos fases adjacentes iguais, mesclamos
  return { phases: mergeAdjacentPhases(phases) };
}

/**
 * Fallback inferencial que gera um arco provável a partir do GlobalHarmonicMeaning.
 */
function inferArcFromMeaningFallback(analysis: FunctionalAnalysis): GlobalHarmonicArc {
  const meaning = inferGlobalHarmonicMeaning(analysis);
  const phases: HarmonicPhase[] = [];

  // Fase 1: Início
  if (meaning.identity.strength === 'strong') {
    phases.push({
      type: 'ESTABLISHMENT',
      confidence: 0.9,
      causes: ['firmeza diatônica inquestionável'],
      relativeDuration: 'moderate'
    });
    // Se não há departure, provavelmente consolida
    if (meaning.departure.strength === 'none') {
      phases.push({
        type: 'CONSOLIDATION',
        confidence: 0.8,
        causes: ['permanência extensa em terreno seguro'],
        relativeDuration: 'long'
      });
    }
  } else if (meaning.identity.strength === 'moderate') {
    phases.push({
      type: 'ESTABLISHMENT',
      confidence: 0.7,
      causes: ['estabelecimento parcial sujeito a colorações'],
      relativeDuration: 'short'
    });
  } else {
    phases.push({
      type: 'DESTABILIZATION',
      confidence: 0.8,
      causes: ['fundação ambígua e instável desde a origem'],
      relativeDuration: 'moderate'
    });
  }

  // Fase 2: Meio / Viagem
  if (meaning.departure.strength === 'transformative') {
    phases.push({
      type: 'DESTABILIZATION',
      confidence: 0.85,
      causes: ['afastamento severo e migração profunda'],
      relativeDuration: 'moderate'
    });
    phases.push({
      type: 'FRAGMENTATION',
      confidence: 0.8,
      causes: ['quebra total da expectativa do centro original'],
      relativeDuration: 'short'
    });
  } else if (meaning.departure.strength === 'significant') {
    phases.push({
      type: 'EXPANSION',
      confidence: 0.8,
      causes: ['deslocamento claro, porém legível'],
      relativeDuration: 'moderate'
    });
  } else if (meaning.departure.strength === 'brief') {
    phases.push({
      type: 'DESTABILIZATION',
      confidence: 0.7,
      causes: ['oscilações temporárias e ruídos na fluidez'],
      relativeDuration: 'short'
    });
  }

  // Fase 3: Retorno
  if (meaning.return.strength === 'full' && meaning.departure.strength !== 'none') {
    phases.push({
      type: 'RECONSTRUCTION',
      confidence: 0.8,
      causes: ['movimento direcional de volta ao eixo gravitacional'],
      relativeDuration: 'short'
    });
  }

  // Fase 4: Encerramento
  if (meaning.closure.type === 'resolute') {
    phases.push({
      type: 'RESOLUTION',
      confidence: 0.9,
      causes: ['condução imperativa de repouso'],
      relativeDuration: 'short'
    });
  } else if (meaning.closure.type === 'open' || meaning.closure.type === 'suspended') {
    phases.push({
      type: 'DISSOLUTION',
      confidence: 0.85,
      causes: ['desfazimento gradual da força direcional'],
      relativeDuration: 'moderate'
    });
  } else if (meaning.closure.type === 'deceptive') {
    phases.push({
      type: 'DESTABILIZATION', // Surpresa final
      confidence: 0.8,
      causes: ['desvio subversivo no momento crítico de fechamento'],
      relativeDuration: 'short'
    });
    phases.push({
      type: 'DISSOLUTION',
      confidence: 0.7,
      causes: ['abandono dramático da trajetória no ápice da tensão'],
      relativeDuration: 'short'
    });
  }

  return { phases: mergeAdjacentPhases(phases) };
}

/**
 * Mescla fases iguais que ocorrem em sequência para criar fases longas.
 */
function mergeAdjacentPhases(phases: HarmonicPhase[]): HarmonicPhase[] {
  if (phases.length === 0) return [];
  const merged: HarmonicPhase[] = [phases[0]];

  for (let i = 1; i < phases.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = phases[i];

    if (prev.type === curr.type) {
      prev.causes = Array.from(new Set([...prev.causes, ...curr.causes]));
      prev.relativeDuration = 'long';
      if (curr.endSectionIndex !== undefined) {
        prev.endSectionIndex = curr.endSectionIndex;
      }
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

/**
 * Infere o significado musical global estático (Fallback para o Arc).
 */
export function inferGlobalHarmonicMeaning(analysis: FunctionalAnalysis): GlobalHarmonicMeaning {
  const { summary, chords, cadences } = analysis;
  
  const meaning: GlobalHarmonicMeaning = {
    identity: { strength: 'moderate', reason: '' },
    departure: { strength: 'none', mechanism: '' },
    return: { strength: 'full', mechanism: '' },
    tension: { profile: 'static', source: '' },
    closure: { type: 'open', reason: '' }
  };

  // 1. Identity
  const complexity = summary?.tonalComplexity || 0;
  if (complexity < 0.2) {
    meaning.identity.strength = 'strong';
    meaning.identity.reason = 'construída inteiramente sobre fundamentos estritamente diatônicos';
  } else if (complexity < 0.6) {
    meaning.identity.strength = 'moderate';
    meaning.identity.reason = 'sustentada pelo centro mas enriquecida com cromatismos pontuais';
  } else {
    meaning.identity.strength = 'weak';
    meaning.identity.reason = 'desafiada constantemente por modulações e ambiguidades';
  }

  // 2. Departure
  const modulations = summary?.modulationCount || 0;
  const regionalTransitions = summary?.regionalTransitionCount || 0;
  const totalChords = chords.length;

  if (modulations > 2) {
    meaning.departure.strength = 'transformative';
    meaning.departure.mechanism = 'migração profunda entre múltiplas regiões tonais distantes';
  } else if (modulations > 0) {
    meaning.departure.strength = 'significant';
    meaning.departure.mechanism = 'deslocamento direcional claro para um centro secundário';
  } else if (regionalTransitions > 3) {
    meaning.departure.strength = 'brief';
    meaning.departure.mechanism = 'oscilações fluídas por campos próximos sem consolidar novas tonalidades';
  } else {
    meaning.departure.strength = 'none';
    meaning.departure.mechanism = 'permanência estrita no domínio do centro principal';
  }

  // 2.5 Tension Arc
  const nonDiatonicRatio = (summary?.chromaticChordCount || 0) / totalChords;
  if (nonDiatonicRatio > 0.3) {
    meaning.tension.profile = 'high-frequency';
    meaning.tension.source = 'uso contínuo de cromatismos e funções secundárias';
  } else if (nonDiatonicRatio > 0.1) {
    meaning.tension.profile = 'smooth-waves';
    meaning.tension.source = 'alternância entre atração cadencial e zonas seguras de relaxamento';
  } else {
    meaning.tension.profile = 'static';
    meaning.tension.source = 'permanência dentro da diatonia segura';
  }

  // 3. Return & Closure
  if (cadences && cadences.length > 0) {
    const lastCadence = cadences[cadences.length - 1];
    
    // Simplificando o cálculo de retorno
    if (modulations > 0) {
       meaning.return.strength = 'partial'; // Aproximação temporária
       meaning.return.mechanism = 'tentativa de recuperar a tônica original no trecho final';
    } else {
       meaning.return.strength = 'full';
       meaning.return.mechanism = 'resolução direta no campo de origem';
    }

    if (lastCadence.type === 'AUTHENTIC' && lastCadence.resolution?.status === 'RESOLVED') {
      meaning.closure.type = 'resolute';
      meaning.closure.reason = 'cadência autêntica estabelecendo inegável fechamento';
    } else if (lastCadence.resolution?.status === 'DECEPTIVE') {
      meaning.closure.type = 'deceptive';
      meaning.closure.reason = 'movimento enganoso subvertendo a resolução esperada';
    } else if (lastCadence.type === 'HALF') {
      meaning.closure.type = 'suspended';
      meaning.closure.reason = 'meia-cadência repousando sobre a tensão da dominante';
    } else {
      meaning.closure.type = 'open';
      meaning.closure.reason = 'dissolução gradual sem ênfase cadencial forte';
    }
  } else {
    meaning.closure.type = 'open';
    meaning.closure.reason = 'ausência de marcações cadenciais explícitas';
    meaning.return.strength = 'none';
    meaning.return.mechanism = 'desfazimento natural do discurso no espaço';
  }

  return meaning;
}
