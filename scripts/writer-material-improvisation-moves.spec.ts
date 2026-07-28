import { describe, expect, it } from "vitest";
import {
  buildWriterMaterialImprovisationMoves,
  resolveWriterMaterialImprovisationMove,
  writerMaterialImprovisationMoveId
} from "../src/domains/writer/services/writerMaterialImprovisationMoves";
import type { ContextualMelodicMaterial } from "../src/utils/music/theory/contextualMaterialTypes";

const lydianMaterials: ContextualMelodicMaterial[] = [
  {
    label: "maj7 lídio / tríade do II",
    source: "arpeggio",
    cells: ["C-E-G-B", "D-F#-A", "F#->G"],
    preferredCellIndex: 1,
    tensionProfile: ["9", "#11", "13"],
    resolutionTargets: [],
    practiceHint: "Abra a #11 sem perder o apoio do acorde."
  },
  {
    label: "Extensão lídia",
    source: "arpeggio",
    cells: ["E-A-D"],
    tensionProfile: ["9", "#11", "13"],
    resolutionTargets: ["G"],
    practiceHint: "Use quartas como extensão da mesma cor."
  }
];

describe("projeção de gestos de improvisação do Writer", () => {
  it("preserva todas as células, usa ids estáveis e ordena a preferida primeiro", () => {
    const moves = buildWriterMaterialImprovisationMoves({
      melodicMaterials: lydianMaterials,
      chordNotes: ["C", "E", "G", "B"],
      intent: "functional"
    });

    expect(moves.map(move => move.id)).toEqual(["0:1", "0:0", "0:2", "1:0"]);
    expect(moves).toHaveLength(4);
    expect(moves[0]).toMatchObject({
      id: writerMaterialImprovisationMoveId(0, 1),
      materialIndex: 0,
      cellIndex: 1,
      materialLabel: "maj7 lídio / tríade do II",
      notation: "D-F#-A",
      notes: ["D", "F#", "A"],
      isPreferred: true
    });
    expect(moves.map(move => move.notation)).toEqual([
      "D-F#-A",
      "C-E-G-B",
      "F#->G",
      "E-A-D"
    ]);
  });

  it("classifica apoio e retorno por pitch class antes da intenção", () => {
    const support = buildWriterMaterialImprovisationMoves({
      melodicMaterials: [{
        label: "Apoio enarmônico",
        source: "arpeggio",
        cells: ["Db-F-Ab"],
        tensionProfile: [],
        resolutionTargets: [],
        practiceHint: "Afirme o acorde."
      }],
      chordNotes: ["C#", "E#", "G#"],
      intent: "tension"
    })[0];
    const returning = buildWriterMaterialImprovisationMoves({
      melodicMaterials: lydianMaterials,
      chordNotes: ["C", "E", "G", "B"],
      intent: "outside"
    }).find(move => move.id === "0:2");

    expect(support).toMatchObject({
      kind: "support",
      actionLabel: "Apoiar o acorde"
    });
    expect(returning).toMatchObject({
      kind: "return",
      actionLabel: "Voltar ao acorde",
      notes: ["F#", "G"]
    });
  });

  it.each([
    { intent: "functional" as const, kind: "color", actionLabel: "Abrir uma cor" },
    { intent: "tension" as const, kind: "tension", actionLabel: "Criar tensão" },
    { intent: "outside" as const, kind: "outside", actionLabel: "Sair e voltar" }
  ])("classifica célula não estrutural como $kind para intenção $intent", ({ intent, kind, actionLabel }) => {
    const [move] = buildWriterMaterialImprovisationMoves({
      melodicMaterials: [{
        label: "Célula contrastante",
        source: "chromatic-approach",
        cells: ["Db-Eb-F#"],
        tensionProfile: ["b9", "#9", "#11"],
        resolutionTargets: ["C"],
        practiceHint: "Crie contraste e volte."
      }],
      chordNotes: ["C", "E", "G", "B"],
      intent
    });

    expect(move).toMatchObject({ kind, actionLabel });
  });

  it("resolve a seleção por id e usa a primeira opção ordenada como fallback", () => {
    const moves = buildWriterMaterialImprovisationMoves({
      melodicMaterials: lydianMaterials,
      chordNotes: ["C", "E", "G", "B"],
      intent: "functional"
    });

    expect(resolveWriterMaterialImprovisationMove(moves, "1:0")?.notation).toBe("E-A-D");
    expect(resolveWriterMaterialImprovisationMove(moves, "inexistente")?.id).toBe("0:1");
    expect(resolveWriterMaterialImprovisationMove([], "0:0")).toBeNull();
  });

  it("foca a célula mais característica quando o catálogo não declara preferência", () => {
    const moves = buildWriterMaterialImprovisationMoves({
      melodicMaterials: [{
        ...lydianMaterials[0],
        preferredCellIndex: undefined
      }],
      chordNotes: ["C", "E", "G", "B"],
      intent: "functional"
    });

    expect(moves[0]).toMatchObject({
      id: "0:1",
      notation: "D-F#-A",
      isPreferred: true,
      kind: "color"
    });
    expect(moves.filter(move => move.isPreferred)).toHaveLength(1);
  });

  it("copia os metadados das fontes sem compartilhar os arrays mutáveis", () => {
    const [move] = buildWriterMaterialImprovisationMoves({
      melodicMaterials: lydianMaterials,
      chordNotes: ["C", "E", "G", "B"],
      intent: "functional"
    });
    const material = lydianMaterials[0];

    expect(move.tensionProfile).toEqual(material.tensionProfile);
    expect(move.resolutionTargets).toEqual(material.resolutionTargets);
    expect(move.tensionProfile).not.toBe(material.tensionProfile);
    expect(move.resolutionTargets).not.toBe(material.resolutionTargets);
  });
});
