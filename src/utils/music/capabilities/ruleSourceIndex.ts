export interface RuleSourceInfo {
  ruleId: string;
  capabilityId: string;
  capabilityTitle: string;
  theorySources: string[];
}

export const RULE_SOURCE_INDEX: Record<string, RuleSourceInfo> = {
  "FC-RULE-CHORD-CANONICAL-INTERNAL": {
    ruleId: "FC-RULE-CHORD-CANONICAL-INTERNAL",
    capabilityId: "FC-CAP-WR-CHORD-SYMBOL-CONTRACT",
    capabilityTitle: "Contrato de cifragem canonica",
    theorySources: [
      "docs/theory/chord_symbol_dictionary.md",
      "docs/references/chord_symbol_sources.md"
    ]
  },
  "FC-RULE-MUSESCORE-OMISSION-SANITIZATION": {
    ruleId: "FC-RULE-MUSESCORE-OMISSION-SANITIZATION",
    capabilityId: "FC-CAP-WR-CHORD-SYMBOL-CONTRACT",
    capabilityTitle: "Contrato de cifragem canonica",
    theorySources: [
      "docs/theory/chord_symbol_dictionary.md",
      "docs/references/chord_symbol_sources.md"
    ]
  },
  "FC-RULE-MUSICXML-KIND-DEGREE-MAPPING": {
    ruleId: "FC-RULE-MUSICXML-KIND-DEGREE-MAPPING",
    capabilityId: "FC-CAP-WR-CHORD-SYMBOL-CONTRACT",
    capabilityTitle: "Contrato de cifragem canonica",
    theorySources: [
      "docs/theory/chord_symbol_dictionary.md",
      "docs/references/chord_symbol_sources.md"
    ]
  },
  "FC-RULE-MELODIC-ARRIVAL-NOT-CADENCE": {
    ruleId: "FC-RULE-MELODIC-ARRIVAL-NOT-CADENCE",
    capabilityId: "FC-CAP-HZ-CADENTIAL-CONTEXT",
    capabilityTitle: "Contexto tonal e cadencial por evidencia harmonica",
    theorySources: [
      "docs/theory/schoenberg_harmonia_source_map.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/berklee_jazz_harmony_source_map.md",
      "docs/theory/quadro_teorico_sistema_harmonizacao.md"
    ]
  },
  "FC-RULE-REFERENCE-AUTHENTIC-CADENCE": {
    ruleId: "FC-RULE-REFERENCE-AUTHENTIC-CADENCE",
    capabilityId: "FC-CAP-HZ-CADENTIAL-CONTEXT",
    capabilityTitle: "Contexto tonal e cadencial por evidencia harmonica",
    theorySources: [
      "docs/theory/schoenberg_harmonia_source_map.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/berklee_jazz_harmony_source_map.md",
      "docs/theory/quadro_teorico_sistema_harmonizacao.md"
    ]
  },
  "FC-RULE-REFERENCE-HALF-CADENCE": {
    ruleId: "FC-RULE-REFERENCE-HALF-CADENCE",
    capabilityId: "FC-CAP-HZ-CADENTIAL-CONTEXT",
    capabilityTitle: "Contexto tonal e cadencial por evidencia harmonica",
    theorySources: [
      "docs/theory/schoenberg_harmonia_source_map.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/berklee_jazz_harmony_source_map.md",
      "docs/theory/quadro_teorico_sistema_harmonizacao.md"
    ]
  },
  "FC-RULE-REFERENCE-PLAGAL-CADENCE": {
    ruleId: "FC-RULE-REFERENCE-PLAGAL-CADENCE",
    capabilityId: "FC-CAP-HZ-CADENTIAL-CONTEXT",
    capabilityTitle: "Contexto tonal e cadencial por evidencia harmonica",
    theorySources: [
      "docs/theory/schoenberg_harmonia_source_map.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/berklee_jazz_harmony_source_map.md",
      "docs/theory/quadro_teorico_sistema_harmonizacao.md"
    ]
  },
  "FC-RULE-REFERENCE-DECEPTIVE-CADENCE": {
    ruleId: "FC-RULE-REFERENCE-DECEPTIVE-CADENCE",
    capabilityId: "FC-CAP-HZ-CADENTIAL-CONTEXT",
    capabilityTitle: "Contexto tonal e cadencial por evidencia harmonica",
    theorySources: [
      "docs/theory/schoenberg_harmonia_source_map.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/berklee_jazz_harmony_source_map.md",
      "docs/theory/quadro_teorico_sistema_harmonizacao.md"
    ]
  },
  "FC-RULE-REFERENCE-PHRYGIAN-CADENCE": {
    ruleId: "FC-RULE-REFERENCE-PHRYGIAN-CADENCE",
    capabilityId: "FC-CAP-HZ-CADENTIAL-CONTEXT",
    capabilityTitle: "Contexto tonal e cadencial por evidencia harmonica",
    theorySources: [
      "docs/theory/schoenberg_harmonia_source_map.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/berklee_jazz_harmony_source_map.md",
      "docs/theory/quadro_teorico_sistema_harmonizacao.md"
    ]
  },
  "FC-RULE-BASIC-I-IV-V-FOUNDATION": {
    ruleId: "FC-RULE-BASIC-I-IV-V-FOUNDATION",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-SUBV-CHROMATIC-RESOLUTION": {
    ruleId: "FC-RULE-SUBV-CHROMATIC-RESOLUTION",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-DIMINISHED-PASSING-RESOLUTION": {
    ruleId: "FC-RULE-DIMINISHED-PASSING-RESOLUTION",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-APPARENT-FUNCTION-PRESERVATION": {
    ruleId: "FC-RULE-APPARENT-FUNCTION-PRESERVATION",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-MODAL-BORROWING-PARALLEL-MINOR": {
    ruleId: "FC-RULE-MODAL-BORROWING-PARALLEL-MINOR",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-MINOR-PLAGAL-CADENCE": {
    ruleId: "FC-RULE-MINOR-PLAGAL-CADENCE",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-CONTROLLED-FUNCTIONAL-SUBSTITUTION": {
    ruleId: "FC-RULE-CONTROLLED-FUNCTIONAL-SUBSTITUTION",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-REFERENCE-CONTOUR-PRESERVATION": {
    ruleId: "FC-RULE-REFERENCE-CONTOUR-PRESERVATION",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-REFERENCE-RHYTHM-PRESERVATION": {
    ruleId: "FC-RULE-REFERENCE-RHYTHM-PRESERVATION",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-HARMONY-ONLY-FUNCTIONAL-READING": {
    ruleId: "FC-RULE-HARMONY-ONLY-FUNCTIONAL-READING",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-HARMONY-ONLY-DIATONIC-COLOR": {
    ruleId: "FC-RULE-HARMONY-ONLY-DIATONIC-COLOR",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-VOICE-LEADING-RANKING": {
    ruleId: "FC-RULE-VOICE-LEADING-RANKING",
    capabilityId: "FC-CAP-HZ-REHARMONIZATION-VOCABULARY",
    capabilityTitle: "Vocabulario progressivo de rearmonizacao",
    theorySources: [
      "docs/theory/almada_examples.md",
      "docs/theory/almada_harmonia_funcional_source_map.md",
      "docs/theory/analise_ebooks_erica_masson.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-WRITER-VAMP-NO-CONTEXT": {
    ruleId: "FC-RULE-WRITER-VAMP-NO-CONTEXT",
    capabilityId: "FC-CAP-MAT-LOCAL-MELODIC-MATERIALS",
    capabilityTitle: "Materiais melodicos locais para acorde/vamp e contexto",
    theorySources: [
      "docs/theory/melodic_materials_vocabulary.md",
      "docs/theory/improvisação.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-DOMINANT-DIMINISHED-AXIS": {
    ruleId: "FC-RULE-DOMINANT-DIMINISHED-AXIS",
    capabilityId: "FC-CAP-MAT-LOCAL-MELODIC-MATERIALS",
    capabilityTitle: "Materiais melodicos locais para acorde/vamp e contexto",
    theorySources: [
      "docs/theory/melodic_materials_vocabulary.md",
      "docs/theory/improvisação.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-SUBV-LYDIAN-DOMINANT": {
    ruleId: "FC-RULE-SUBV-LYDIAN-DOMINANT",
    capabilityId: "FC-CAP-MAT-LOCAL-MELODIC-MATERIALS",
    capabilityTitle: "Materiais melodicos locais para acorde/vamp e contexto",
    theorySources: [
      "docs/theory/melodic_materials_vocabulary.md",
      "docs/theory/improvisação.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-HALF-DIMINISHED-LOC2": {
    ruleId: "FC-RULE-HALF-DIMINISHED-LOC2",
    capabilityId: "FC-CAP-MAT-LOCAL-MELODIC-MATERIALS",
    capabilityTitle: "Materiais melodicos locais para acorde/vamp e contexto",
    theorySources: [
      "docs/theory/melodic_materials_vocabulary.md",
      "docs/theory/improvisação.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-CONTEXTUAL-MATERIAL-RANKING": {
    ruleId: "FC-RULE-CONTEXTUAL-MATERIAL-RANKING",
    capabilityId: "FC-CAP-MAT-LOCAL-MELODIC-MATERIALS",
    capabilityTitle: "Materiais melodicos locais para acorde/vamp e contexto",
    theorySources: [
      "docs/theory/melodic_materials_vocabulary.md",
      "docs/theory/improvisação.md",
      "docs/theory/berklee_jazz_harmony_source_map.md"
    ]
  },
  "FC-RULE-MS-ACK-LEDGER": {
    ruleId: "FC-RULE-MS-ACK-LEDGER",
    capabilityId: "FC-CAP-MS-BRIDGE-SAFETY",
    capabilityTitle: "Integracao MuseScore com ACK e feedback tipado",
    theorySources: [
      "docs/theory/chord_symbol_dictionary.md"
    ]
  },
  "FC-RULE-MS-TYPED-SEND-RESULT": {
    ruleId: "FC-RULE-MS-TYPED-SEND-RESULT",
    capabilityId: "FC-CAP-MS-BRIDGE-SAFETY",
    capabilityTitle: "Integracao MuseScore com ACK e feedback tipado",
    theorySources: [
      "docs/theory/chord_symbol_dictionary.md"
    ]
  },
  "FC-RULE-MS-PLUGIN-STATUS-SEPARATION": {
    ruleId: "FC-RULE-MS-PLUGIN-STATUS-SEPARATION",
    capabilityId: "FC-CAP-MS-BRIDGE-SAFETY",
    capabilityTitle: "Integracao MuseScore com ACK e feedback tipado",
    theorySources: [
      "docs/theory/chord_symbol_dictionary.md"
    ]
  }
};

export function ruleSourceInfoFor(ruleIds: string[] | undefined): RuleSourceInfo[] {
  if (!ruleIds || ruleIds.length === 0) return [];
  const seen = new Set<string>();
  return ruleIds.flatMap(ruleId => {
    const info = RULE_SOURCE_INDEX[ruleId];
    if (!info || seen.has(ruleId)) return [];
    seen.add(ruleId);
    return [info];
  });
}

export function compactTheorySourceLabel(sourcePath: string): string {
  return sourcePath
    .replace(/^docs\/(?:theory|references)\//, "")
    .replace(/\.(?:md|pdf|json)$/i, "");
}

export function theorySourceLabelsForRuleIds(ruleIds: string[] | undefined, limit = 3): string[] {
  const labels = new Set<string>();
  for (const info of ruleSourceInfoFor(ruleIds)) {
    for (const source of info.theorySources) {
      labels.add(compactTheorySourceLabel(source));
      if (labels.size >= limit) return Array.from(labels);
    }
  }
  return Array.from(labels);
}
