import { describe, expect, it } from "vitest";
import {
  proposalInputContextLabel,
  proposalKindLabel,
  proposalReferenceRelationLabel,
  proposalVariantApplyLabel,
  proposalVariantRelationLabel,
  proposalVariantSectionLabel,
  routeProfileLabel,
  voiceLeadingLabel
} from "../src/domains/harmonizer/components/HarmonizationProposalCard";
import { preferredMaterialSuggestionSet } from "../src/domains/harmonizer/components/ContextualMaterialSuggestionsPanel";
import type { SectionMaterialSuggestionSet } from "../src/domains/harmonizer/services/harmonizerService";
import { evaluateVoiceLeadingTransition } from "../src/utils/music/analysis/strategies/VoiceLeadingTransitionEvaluator";
import type {
  ReharmonizationInputContext,
  ReharmonizationProposal,
  ReharmonizationProposalKind,
  ReharmonizationReferenceRelation,
  ReharmonizationRouteProfile
} from "../src/utils/music/analysis/models/ReharmonizationProposal";
import {
  referenceRelationForProposal,
  resolveHarmonizerInputContext
} from "../src/domains/harmonizer/services/harmonizerInputContext";

describe("Harmonization proposal card labels", () => {
  function proposal(kind: ReharmonizationProposalKind): ReharmonizationProposal {
    return {
      id: kind,
      kind,
      name: kind,
      measures: [],
      explanation: [],
      bassLine: []
    };
  }

  it("uses composer-facing proposal labels instead of engine status labels", () => {
    const labels = ([
      "reference",
      "validated-harmonization",
      "controlled-reharmonization",
      "experimental-exploration"
    ] satisfies ReharmonizationProposalKind[]).map(proposalKindLabel);

    expect(labels).toEqual([
      "Harmonia da partitura",
      "Proposta harmônica",
      "Rearmonização",
      "Exploração distante"
    ]);
    expect(labels.join(" ")).not.toMatch(/validada|controlada|experimental/i);
  });

  it("describes route profile as musical distance without radicalized wording", () => {
    const labels = ([
      "conservative",
      "moderate",
      "chromatic",
      "radical"
    ] satisfies ReharmonizationRouteProfile[]).map(routeProfileLabel);

    expect(labels).toEqual([
      "Próxima",
      "Moderada",
      "Cromática",
      "Mais distante"
    ]);
    expect(labels.join(" ")).not.toMatch(/conservadora|radical/i);
  });

  it("prefers reference and foundation material readings before the primary proposal", () => {
    const set = (
      id: string,
      label: string,
      source: SectionMaterialSuggestionSet["source"],
      presentationRole?: SectionMaterialSuggestionSet["presentationRole"]
    ): SectionMaterialSuggestionSet => ({
      id,
      label,
      source,
      presentationRole,
      suggestions: [],
      regions: [],
      linearRoutes: []
    });

    const primary = set("dominants", "Estratégia — Dominantes secundárias", "proposal", "primary");
    const foundation = set("basic", "Estratégia — Harmonia básica I-IV-V", "proposal", "alternative");
    const reference = set("existing-harmony-reference", "Referência — Harmonia da partitura", "reference");

    expect(preferredMaterialSuggestionSet([primary, foundation])?.id).toBe("basic");
    expect(preferredMaterialSuggestionSet([primary, foundation, reference])?.id).toBe("existing-harmony-reference");
    expect(preferredMaterialSuggestionSet([primary])?.id).toBe("dominants");
  });

  it("maps higher voice-leading scores to stronger composer-facing labels", () => {
    expect(voiceLeadingLabel(7.5)).toBe("Condução forte");
    expect(voiceLeadingLabel(4.2)).toBe("Condução boa");
    expect(voiceLeadingLabel(2.5)).toBe("Condução instável");
    expect(voiceLeadingLabel(-0.5)).toBe("Condução áspera");
  });

  it("does not call unresolved dominant motion smoother than ii-V-I resolution", () => {
    const iiToV = evaluateVoiceLeadingTransition({
      previousChord: "Dm7",
      nextChord: "G7",
      center: "C"
    });
    const vToI = evaluateVoiceLeadingTransition({
      previousChord: "G7",
      nextChord: "Cmaj7",
      center: "C"
    });
    const unresolved = evaluateVoiceLeadingTransition({
      previousChord: "G7",
      nextChord: "F#7",
      center: "C"
    });

    expect(voiceLeadingLabel(iiToV.score + vToI.score)).toBe("Condução forte");
    expect(["Condução instável", "Condução áspera"]).toContain(voiceLeadingLabel(unresolved.score));
  });

  it("labels input contexts as composer-facing source material", () => {
    const labels = ([
      "melody-only",
      "melody-with-reference-harmony",
      "harmony-only-analysis"
    ] satisfies ReharmonizationInputContext[]).map(proposalInputContextLabel);

    expect(labels).toEqual([
      "Criado a partir da melodia",
      "Comparado com a harmonia da partitura",
      "Análise da progressão"
    ]);
    expect(labels.join(" ")).not.toMatch(/input|context|melody-only|harmony-only/i);
  });

  it("resolves the harmonizer input context from available score material", () => {
    expect(resolveHarmonizerInputContext({ melodicAnchorCount: 8, referenceHarmonyCount: 0 })).toBe("melody-only");
    expect(resolveHarmonizerInputContext({ melodicAnchorCount: 8, referenceHarmonyCount: 4 })).toBe("melody-with-reference-harmony");
    expect(resolveHarmonizerInputContext({ melodicAnchorCount: 0, referenceHarmonyCount: 4 })).toBe("harmony-only-analysis");
    expect(resolveHarmonizerInputContext({ melodicAnchorCount: 0, referenceHarmonyCount: 0 })).toBeNull();
  });

  it("labels reference relation as musical comparison instead of numeric agreement", () => {
    const labels = ([
      "reference-original",
      "reference-rhythm-preserved",
      "reference-contour-preserved",
      "reference-close",
      "reference-functional-variation",
      "melody-derived-alternative",
      "harmony-only-reading"
    ] satisfies ReharmonizationReferenceRelation[]).map(proposalReferenceRelationLabel);

    expect(labels).toEqual([
      "Cifra escrita pelo autor",
      "Preserva o ritmo harmônico da partitura",
      "Preserva o contorno da partitura",
      "Próxima da harmonia da partitura",
      "Varia a partitura mantendo função",
      "Alternativa guiada pela melodia",
      "Leitura sem validação melódica"
    ]);
    expect(labels.join(" ")).not.toMatch(/agreement|referenceRoot|percentual/i);
  });

  it("classifies proposal relation to the reference harmony", () => {
    expect(referenceRelationForProposal({
      id: "existing-harmony-reference",
      kind: "reference",
      name: "Referência — Harmonia da partitura",
      measures: [],
      explanation: [],
      bassLine: []
    }, "melody-with-reference-harmony")).toBe("reference-original");

    expect(referenceRelationForProposal({
      id: "controlled-reference-rhythm",
      kind: "controlled-reharmonization",
      name: "Rearmonização — ritmo harmônico da partitura",
      measures: [],
      explanation: [],
      bassLine: []
    }, "melody-with-reference-harmony")).toBe("reference-rhythm-preserved");

    expect(referenceRelationForProposal({
      id: "controlled-reference-contour",
      kind: "controlled-reharmonization",
      name: "Rearmonização — contorno da partitura",
      measures: [],
      explanation: [],
      bassLine: []
    }, "melody-with-reference-harmony")).toBe("reference-contour-preserved");

    expect(referenceRelationForProposal({
      id: "close",
      kind: "validated-harmonization",
      name: "Estratégia — Centro de referência",
      measures: [],
      explanation: [],
      bassLine: [],
      referenceRootAgreement: 0.8
    }, "melody-with-reference-harmony")).toBe("reference-close");

    expect(referenceRelationForProposal({
      id: "melody",
      kind: "validated-harmonization",
      name: "Estratégia — Melodia primeiro",
      measures: [],
      explanation: [],
      bassLine: []
    }, "melody-with-reference-harmony")).toBe("melody-derived-alternative");
  });

  it("uses reference-specific wording for near readings grouped under the score harmony", () => {
    expect(proposalVariantSectionLabel(proposal("reference"))).toBe("Leituras próximas");
    expect(proposalVariantApplyLabel(proposal("reference"))).toBe("Usar leitura");
    expect(proposalVariantSectionLabel(proposal("controlled-reharmonization"))).toBe("Variações de cor");
    expect(proposalVariantApplyLabel(proposal("controlled-reharmonization"))).toBe("Usar variação");
  });

  it("shows composer-facing relation labels inside grouped variants", () => {
    expect(proposalVariantRelationLabel({
      ...proposal("validated-harmonization"),
      referenceRelation: "reference-close"
    })).toBe("Próxima da harmonia da partitura");
    expect(proposalVariantRelationLabel(proposal("validated-harmonization"))).toBeUndefined();
  });
});
