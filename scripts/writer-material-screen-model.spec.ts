import { describe, expect, it } from "vitest";
import {
  buildWriterMaterialScreenModel,
  chordNameForWriterMaterialScreen
} from "../src/domains/writer/services/writerMaterialScreenModel";
import type { ChordCandidate } from "../src/utils/music/models/ChordCandidate";

const cmaj7: ChordCandidate = {
  root: "C",
  quality: "major7th",
  notes: ["C", "E", "G", "B"],
  drawnNotes: ["C", "E", "G", "B"],
  bass: "C",
  omissions: [],
  additions: [],
  intervals: ["1P", "3M", "5P", "7M"],
  score: 1,
  confidence: 1,
  notationInternational: "Cmaj7",
  notationBrazilian: "C7M",
  notationAcademic: "CΔ7",
  isIncomplete: false
};

const g7: ChordCandidate = {
  root: "G",
  quality: "dominant7th",
  notes: ["G", "B", "D", "F"],
  drawnNotes: ["G", "B", "D", "F"],
  bass: "G",
  omissions: [],
  additions: [],
  intervals: ["1P", "3M", "5P", "7m"],
  score: 1,
  confidence: 1,
  notationInternational: "G7",
  notationBrazilian: "G7",
  notationAcademic: "G7",
  isIncomplete: false
};

describe("F253 modelo da tela de materiais do acorde", () => {
  it("resolve nome do acorde conforme estilo de notacao", () => {
    expect(chordNameForWriterMaterialScreen(cmaj7, "International")).toBe("Cmaj7");
    expect(chordNameForWriterMaterialScreen(cmaj7, "Brazilian")).toBe("C7M");
    expect(chordNameForWriterMaterialScreen(cmaj7, "Academic")).toBe("CΔ7");
  });

  it("monta rotas, foco, painel e acao para o acorde ativo", () => {
    const model = buildWriterMaterialScreenModel({
      activeChord: cmaj7,
      notationStyle: "Brazilian",
      preferredRouteId: "inside",
      selectedMaterialSource: null
    });

    expect(model.chordName).toBe("C7M");
    expect(model.hasMaterials).toBe(true);
    expect(model.materialRoutes.map(route => route.id)).toEqual(["inside", "color", "tension", "outside"]);
    expect(model.effectiveRouteId).toBe("inside");
    expect(model.focusedMaterialSource).toBeTruthy();
    expect(model.focusedPaletteItem).toBeTruthy();
    expect(model.activeMaterialPanel).toBeTruthy();
    expect(model.activeMaterialAction).toBeTruthy();
  });

  it("descarta fonte escolhida quando ela nao pertence a rota efetiva", () => {
    const model = buildWriterMaterialScreenModel({
      activeChord: cmaj7,
      notationStyle: "International",
      preferredRouteId: "inside",
      selectedMaterialSource: {
        name: "Fonte externa",
        type: "outside",
        intervals: ["1P"],
        notes: ["C"]
      }
    });

    expect(model.focusedMaterialSource?.name).not.toBe("Fonte externa");
  });

  it("expoe caminho outside para dominante em vamp local", () => {
    const model = buildWriterMaterialScreenModel({
      activeChord: g7,
      notationStyle: "International",
      preferredRouteId: "outside",
      selectedMaterialSource: null
    });

    expect(model.effectiveRouteId).toBe("outside");
    expect(model.effectiveRoute?.label).toBe("Sair e voltar");
    expect(model.routedMaterialPalette.map(item => item.source.type)).toContain("side slip minor pentatonic");
    expect(model.focusedMaterialSource?.type).toBe("side slip minor pentatonic");
    expect(model.focusedPaletteItem).toMatchObject({
      intentLabel: "Fora",
      actionLabel: "Sair e voltar"
    });
    expect(model.activeMaterialAction).toMatchObject({
      name: "Pentatônica fora e volta",
      buttonLabel: "Ouvir ideia"
    });
  });
});
