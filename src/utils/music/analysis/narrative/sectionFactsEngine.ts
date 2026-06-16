import type {
  FunctionalChord,
  CadenceInfo,
  HarmonicRegion,
  ScoreSection,
  TonalCenter,
  AnalyticalSection,
  SectionNarrativeFacts,
  MusicalEvent
} from '../models/FunctionalAnalysis';

function formatChordName(chord: FunctionalChord): string {
  return chord.chordSymbol;
}

export function extractSectionFacts(
  sections: ScoreSection[],
  chords: FunctionalChord[],
  regions: HarmonicRegion[],
  cadences: CadenceInfo[],
  globalCenter: TonalCenter
): AnalyticalSection[] {
  const analyticalSections: AnalyticalSection[] = [];

  for (const section of sections) {
    const sectionChords = chords.filter(
      (c) => c.index >= (section.startChordIndex ?? 0) && c.index <= (section.endChordIndex ?? 0)
    );

    if (sectionChords.length === 0) continue;

    const startIdx = sectionChords[0].index;
    const endIdx = sectionChords[sectionChords.length - 1].index;

    // 2. Extrair Cadências da Seção
    const sectionCadences = cadences.filter(
      (cad) => cad.endIndex >= startIdx && cad.endIndex <= endIdx
    );

    // 3. Centros Tonais
    const sectionRegions = regions.filter(
      (r) =>
        (r.startIndex >= startIdx && r.startIndex <= endIdx) ||
        (r.endIndex >= startIdx && r.endIndex <= endIdx) ||
        (r.startIndex <= startIdx && r.endIndex >= endIdx)
    );

    const tonalCentersSet = new Set<string>();
    sectionRegions.forEach((r) => {
      tonalCentersSet.add(`${r.baseCenter.root} ${r.baseCenter.mode === 'MAJOR' ? 'Maior' : 'Menor'}`);
    });
    const tonalCenters = Array.from(tonalCentersSet);
    if (tonalCenters.length === 0) {
      tonalCenters.push(`${globalCenter.root} ${globalCenter.mode === 'MAJOR' ? 'Maior' : 'Menor'}`);
    }

    // 4. Notable Events
    const notableEvents: MusicalEvent[] = [];
    let chromaticBorrowingCount = 0;
    let secondaryDominantCount = 0;

    sectionChords.forEach((c) => {
      if (c.modal?.modalBorrowing) {
        if (!notableEvents.includes('chromaticBorrowing')) notableEvents.push('chromaticBorrowing');
        chromaticBorrowingCount++;
      }
      if (c.contextualFunction === 'SECONDARY_DOMINANT') {
        if (!notableEvents.includes('secondaryDominant')) notableEvents.push('secondaryDominant');
        secondaryDominantCount++;
      }
      if (
        c.contextualFunction === 'SECONDARY_DOMINANT' ||
        c.contextualFunction === 'SECONDARY_LEADING_TONE' ||
        c.contextualFunction === 'TRITONE_SUBSTITUTION'
      ) {
        if (!notableEvents.includes('tonicization')) notableEvents.push('tonicization');
      }
    });

    sectionCadences.forEach((cad) => {
      if (cad.type === 'AUTHENTIC' && cad.resolution.status === 'DECEPTIVE') {
        if (!notableEvents.includes('deceptiveCadence')) notableEvents.push('deceptiveCadence');
      }
    });

    if (tonalCenters.length > 1) {
      if (!notableEvents.includes('regionalShift')) notableEvents.push('regionalShift');
    }

    // 5. Opening Character
    const firstChord = sectionChords[0];
    let openingCharacter = 'estável';
    if (firstChord.modal?.modalBorrowing || firstChord.secondary) {
      openingCharacter = 'ambíguo e cromático';
    } else if (firstChord.harmonicFunction === 'DOMINANT') {
      openingCharacter = 'tenso e suspensivo';
    } else if (firstChord.harmonicFunction === 'TONIC') {
      openingCharacter = 'estável e afirmativo';
    }

    // 6. Closing Character
    let closingCharacter = 'aberto e contínuo';
    let cadentialSummary = 'Não apresenta cadências conclusivas claras.';

    if (sectionCadences.length > 0) {
      const lastCadence = sectionCadences[sectionCadences.length - 1];
      if (lastCadence.endIndex >= endIdx - 2) {
        if (lastCadence.type === 'AUTHENTIC' && lastCadence.resolution.status === 'RESOLVED') {
          closingCharacter = 'resolução autêntica firme';
          cadentialSummary = `Encerra com uma cadência autêntica, estabelecendo fortemente o centro tonal.`;
          if (!notableEvents.includes('authenticResolution')) notableEvents.push('authenticResolution');
        } else if (lastCadence.type === 'HALF') {
          closingCharacter = 'suspensão dominante (meia-cadência)';
          cadentialSummary = `Encerra em suspensão através de uma meia-cadência, gerando forte expectativa.`;
          if (!notableEvents.includes('halfCadence')) notableEvents.push('halfCadence');
        } else if (lastCadence.type === 'PLAGAL') {
          closingCharacter = 'resolução plagal';
          cadentialSummary = `Encerra de forma suave com uma cadência plagal.`;
          if (!notableEvents.includes('plagalResolution')) notableEvents.push('plagalResolution');
        } else if (lastCadence.resolution.status === 'DECEPTIVE') {
          closingCharacter = 'resolução frustrada';
          cadentialSummary = `A seção desvia a expectativa final com uma cadência enganosa.`;
        }
      }
    } else {
      const lastChord = sectionChords[sectionChords.length - 1];
      if (lastChord.harmonicFunction === 'DOMINANT' || lastChord.secondary) {
        closingCharacter = 'suspensão tensional (sem resolução)';
        if (!notableEvents.includes('suspension')) notableEvents.push('suspension');
      }
    }

    const harmonicSummary = "";

    const facts: SectionNarrativeFacts = {
      tonalCenters,
      openingCharacter,
      closingCharacter,
      notableEvents,
      cadentialSummary,
      harmonicSummary
    };

    analyticalSections.push({
      section,
      facts
    });
  }

  return analyticalSections;
}
