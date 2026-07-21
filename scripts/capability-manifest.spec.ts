import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";
import { buildContextualMaterialCandidates } from "../src/utils/music/theory/contextualMaterialCandidates";

interface CapabilityManifest {
  schemaVersion: number;
  asOfCommit: string;
  capabilities: Array<{
    id: string;
    status: "implemented" | "partial" | "planned";
    journeys: string[];
    theorySources: string[];
    implementationFiles: string[];
    tests: string[];
    ruleIds: string[];
  }>;
}

function manifest(): CapabilityManifest {
  return JSON.parse(readFileSync("docs/capability_manifest.json", "utf8")) as CapabilityManifest;
}

describe("capability manifest", () => {
  it("mantem um snapshot versionado e validavel das capacidades do sistema", () => {
    const data = manifest();

    expect(data.schemaVersion).toBe(1);
    expect(data.asOfCommit).toMatch(/^[0-9a-f]{7,12}$/);
    expect(data.capabilities.length).toBeGreaterThanOrEqual(5);
  });

  it("mantem ids de capacidade e regra unicos", () => {
    const data = manifest();
    const capabilityIds = data.capabilities.map(capability => capability.id);
    const ruleIds = data.capabilities.flatMap(capability => capability.ruleIds);

    expect(new Set(capabilityIds).size).toBe(capabilityIds.length);
    expect(new Set(ruleIds).size).toBe(ruleIds.length);
    expect(capabilityIds.every(id => /^FC-CAP-[A-Z]+-[A-Z0-9-]+$/.test(id))).toBe(true);
    expect(ruleIds.every(id => /^FC-RULE-[A-Z0-9-]+$/.test(id))).toBe(true);
  });

  it("aponta apenas para fontes teoricas, codigo e testes existentes", () => {
    const data = manifest();
    const allPaths = data.capabilities.flatMap(capability => [
      ...capability.theorySources,
      ...capability.implementationFiles,
      ...capability.tests
    ]);

    expect(allPaths).not.toHaveLength(0);
    for (const path of allPaths) {
      expect(existsSync(path), path).toBe(true);
    }
  });

  it("cobre as frentes principais da auditoria funcional", () => {
    const data = manifest();
    const journeys = data.capabilities.flatMap(capability => capability.journeys);

    expect(journeys).toEqual(expect.arrayContaining([
      "Escrever",
      "Harmonizar",
      "Improviso",
      "MuseScore"
    ]));
    expect(data.capabilities.map(capability => capability.id)).toEqual(expect.arrayContaining([
      "FC-CAP-HZ-CADENTIAL-CONTEXT",
      "FC-CAP-MAT-LOCAL-MELODIC-MATERIALS",
      "FC-CAP-MS-BRIDGE-SAFETY"
    ]));
  });

  it("declara os ruleIds emitidos pelos materiais melodicos contextuais", () => {
    const declaredRuleIds = new Set(manifest().capabilities.flatMap(capability => capability.ruleIds));
    const runtimeRuleIds = new Set([
      ...buildContextualMaterialCandidates({ chord: "A7(b9)" }).flatMap(candidate => candidate.ruleIds),
      ...buildContextualMaterialCandidates({ chord: "Bm7b5" }).flatMap(candidate => candidate.ruleIds),
      ...buildContextualMaterialCandidates({ chord: "G#dim7" }).flatMap(candidate => candidate.ruleIds),
      ...buildContextualMaterialCandidates({ chord: "Db7", nextChord: "C", resolutionTarget: "C" }).flatMap(candidate => candidate.ruleIds)
    ]);

    expect(runtimeRuleIds.size).toBeGreaterThan(0);
    for (const ruleId of runtimeRuleIds) {
      expect(declaredRuleIds.has(ruleId), ruleId).toBe(true);
    }
  });

  it("declara os ruleIds emitidos por propostas de rearmonizacao validadas", () => {
    const declaredRuleIds = new Set(manifest().capabilities.flatMap(capability => capability.ruleIds));
    const melody: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "Db", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(melody, "C");
    const runtimeRuleIds = new Set([
      ...(StrategyGuidedHarmonizer.tryStrategy("I_IV_V", melody, phraseContext).proposal?.ruleIds ?? []),
      ...(StrategyGuidedHarmonizer.tryStrategy("SUBV7_CADENCIAL", melody, phraseContext).proposal?.ruleIds ?? [])
    ]);

    expect(runtimeRuleIds.size).toBeGreaterThan(0);
    for (const ruleId of runtimeRuleIds) {
      expect(declaredRuleIds.has(ruleId), ruleId).toBe(true);
    }
  });
});
