import type { SectionNarrativeFacts, SectionHarmonicState } from '../models/FunctionalAnalysis';

export function inferHarmonicState(facts: SectionNarrativeFacts): SectionHarmonicState {
  let tonalClarity: SectionHarmonicState['tonalClarity'] = 'clear';
  let stability: SectionHarmonicState['stability'] = 'high';
  let tensionTrend: SectionHarmonicState['tensionTrend'] = 'static';
  let closureLevel: SectionHarmonicState['closureLevel'] = 'resolved';
  let directionality: SectionHarmonicState['directionality'] = 'static';

  // 1. Tonal Clarity
  if (facts.tonalCenters.length > 2) {
    tonalClarity = 'shifting';
  } else if (facts.tonalCenters.length === 2) {
    tonalClarity = 'ambiguous';
  }

  if (facts.notableEvents.includes('regionalShift')) {
    tonalClarity = 'shifting';
  }

  // 2. Stability
  const unstableEventsCount = facts.notableEvents.filter((e) =>
    ['chromaticBorrowing', 'secondaryDominant', 'deceptiveCadence'].includes(e)
  ).length;

  if (unstableEventsCount > 2 || facts.openingCharacter.includes('ambíguo e cromático')) {
    stability = 'low';
  } else if (unstableEventsCount > 0) {
    stability = 'medium';
  }

  // 3. Tension Trend
  if (facts.notableEvents.includes('tonicization') || facts.openingCharacter.includes('tenso e suspensivo')) {
    tensionTrend = 'rising';
  }
  
  if (facts.closingCharacter.includes('resolução autêntica') || facts.closingCharacter.includes('resolução plagal')) {
    tensionTrend = 'falling';
  } else if (facts.closingCharacter.includes('suspensão') || facts.notableEvents.includes('deceptiveCadence')) {
    tensionTrend = 'rising';
  }

  // 4. Closure Level
  if (facts.closingCharacter.includes('resolução autêntica') || facts.closingCharacter.includes('resolução plagal')) {
    closureLevel = 'resolved';
  } else if (facts.closingCharacter.includes('suspensão dominante')) {
    closureLevel = 'partial';
  } else if (facts.closingCharacter.includes('frustrada')) {
    closureLevel = 'deceptive';
  } else if (facts.closingCharacter.includes('aberto e contínuo')) {
    closureLevel = 'open';
  } else if (facts.closingCharacter.includes('suspensão tensional')) {
    closureLevel = 'open';
  }

  // 5. Directionality
  if (tensionTrend === 'rising' || closureLevel === 'open') {
    directionality = 'forward-moving';
  } else if (tensionTrend === 'falling' && closureLevel === 'resolved') {
    directionality = 'returning';
  } else if (closureLevel === 'deceptive' || closureLevel === 'partial') {
    directionality = 'suspended';
  } else if (stability === 'high') {
    directionality = 'static';
  }

  return {
    tonalClarity,
    stability,
    tensionTrend,
    closureLevel,
    directionality
  };
}
