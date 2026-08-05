import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  prioritizeWriterMaterialActionMoves,
  splitWriterMaterialActionMoves,
  WriterMaterialActionBlock
} from "../src/domains/writer/components/WriterMaterialActionBlock";
import type { WriterMaterialAction } from "../src/domains/writer/services/writerMaterialAction";
import type { WriterMaterialImprovisationMove } from "../src/domains/writer/services/writerMaterialImprovisationMoves";

describe("F258 bloco visual da acao de material", () => {
  function move(
    id: string,
    notation: string,
    overrides: Partial<WriterMaterialImprovisationMove> = {}
  ): WriterMaterialImprovisationMove {
    const [materialIndex = "0"] = id.split(":");
    return {
      id,
      cellId: id.split(":").slice(1).join(":") || id,
      materialIndex: Number(materialIndex),
      cellIndex: overrides.cellIndex ?? 0,
      kind: "color",
      actionLabel: "Colorir e voltar",
      materialLabel: "Material",
      notation,
      notes: notation.split("-"),
      practiceHint: "Toque a célula.",
      tensionProfile: [],
      resolutionTargets: [],
      isPreferred: false,
      ...overrides
    };
  }

  it("prioriza gesto ativo e depois gesto preferido na renderizacao", () => {
    const preferred = move("0:preferred", "D-F#-A", { isPreferred: true, cellIndex: 0 });
    const neutral = move("0:neutral", "E-G-B", { cellIndex: 1 });
    const active = move("0:active", "C-E-G", { cellIndex: 2 });

    expect(prioritizeWriterMaterialActionMoves([
      preferred,
      neutral,
      active
    ], "0:2").map(item => item.id)).toEqual([
      "0:active",
      "0:preferred",
      "0:neutral"
    ]);
  });

  it("agrupa apenas listas densas preservando ativo e preferido em destaque", () => {
    const moves = [
      move("0:preferred", "D-F#-A", { isPreferred: true, cellIndex: 0 }),
      move("0:neutral-a", "E-G-B", { cellIndex: 1 }),
      move("0:active", "C-E-G", { cellIndex: 2 }),
      move("0:neutral-b", "F#-G", { cellIndex: 3 }),
      move("0:neutral-c", "A-G", { cellIndex: 4 }),
      move("0:neutral-d", "B-C", { cellIndex: 5 }),
      move("0:neutral-e", "D-E", { cellIndex: 6 })
    ];

    const grouped = splitWriterMaterialActionMoves(moves, "0:2");

    expect(grouped.primaryMoves.map(item => item.id)).toEqual([
      "0:active",
      "0:preferred",
      "0:neutral-a",
      "0:neutral-b"
    ]);
    expect(grouped.secondaryMoves.map(item => item.id)).toEqual([
      "0:neutral-c",
      "0:neutral-d",
      "0:neutral-e"
    ]);
  });

  it("mantem listas pequenas totalmente visiveis", () => {
    const moves = Array.from({ length: 6 }, (_, index) => (
      move(`0:${index}`, `C-${index}`, { cellIndex: index })
    ));

    const grouped = splitWriterMaterialActionMoves(moves, null);

    expect(grouped.primaryMoves).toHaveLength(6);
    expect(grouped.secondaryMoves).toHaveLength(0);
  });

  it("mostra celula, caminho ordenado, posicao e passo ativo", () => {
    const action: WriterMaterialAction = {
      name: "maj / tríades superiores",
      eyebrowLabel: "Tocar agora",
      theoryDesc: "Realiza a tríade do II grau e retorna ao acorde.",
      notes: ["D4", "F#4", "A4", "G4"],
      displayNotes: ["D", "F#", "A", "G"],
      rhythm: {
        id: "syncopated",
        label: "Síncope curta",
        description: "Ataques deslocados criam impulso.",
        cycleDurationMs: 1320,
        timings: [
          { onsetMs: 0, durationMs: 260, accent: true },
          { onsetMs: 160, durationMs: 190, accent: false },
          { onsetMs: 440, durationMs: 260, accent: true },
          { onsetMs: 580, durationMs: 560, accent: true }
        ]
      },
      steps: [
        {
          note: "D4",
          displayNote: "D",
          onsetMs: 0,
          durationMs: 260,
          accent: true,
          position: { stringIndex: 3, fret: 12 },
          phraseRole: "color"
        },
        {
          note: "F#4",
          displayNote: "F#",
          onsetMs: 160,
          durationMs: 190,
          accent: false,
          position: { stringIndex: 2, fret: 11 },
          phraseRole: "color"
        },
        {
          note: "A4",
          displayNote: "A",
          onsetMs: 440,
          durationMs: 260,
          accent: true,
          position: { stringIndex: 1, fret: 10 },
          phraseRole: "color"
        },
        {
          note: "G4",
          displayNote: "G",
          onsetMs: 580,
          durationMs: 560,
          accent: true,
          position: { stringIndex: 1, fret: 8 },
          phraseRole: "return"
        }
      ],
      realizedCell: {
        cellId: "maj-triades-superiores:d-fsharp-a",
        materialLabel: "maj / tríades superiores",
        materialIndex: 0,
        cellIndex: 1,
        notation: "D-F#-A"
      },
      buttonLabel: "Ouvir ideia"
    };
    const improvisationMoves: WriterMaterialImprovisationMove[] = [
      {
        id: "0:maj-triades-superiores:d-fsharp-a",
        cellId: "maj-triades-superiores:d-fsharp-a",
        materialIndex: 0,
        cellIndex: 1,
        kind: "color",
        actionLabel: "Abrir uma cor",
        materialLabel: "maj / tríades superiores",
        notation: "D-F#-A",
        notes: ["D", "F#", "A"],
        practiceHint: "Experimente a tríade do II grau.",
        tensionProfile: ["9", "#11", "13"],
        resolutionTargets: ["C", "E", "G", "B"],
        isPreferred: true
      },
      {
        id: "0:maj-triades-superiores:c-e-g-b",
        cellId: "maj-triades-superiores:c-e-g-b",
        materialIndex: 0,
        cellIndex: 0,
        kind: "support",
        actionLabel: "Apoiar o acorde",
        materialLabel: "maj / tríades superiores",
        notation: "C-E-G-B",
        notes: ["C", "E", "G", "B"],
        practiceHint: "Comece pelo arpejo.",
        tensionProfile: [],
        resolutionTargets: ["C", "E", "G", "B"],
        isPreferred: false
      }
    ];

    const html = renderToStaticMarkup(createElement(WriterMaterialActionBlock, {
      action,
      improvisationMoves,
      // Compatibilidade com seleções gravadas antes dos IDs baseados em cellId.
      activeMoveId: "0:1",
      onSelectMove: () => undefined,
      onPlay: () => undefined,
      onStop: () => undefined,
      onToggleLoop: () => undefined,
      activeStepIndex: 1,
      isPlaying: true,
      loopEnabled: true,
      playbackError: "Não foi possível iniciar o áudio."
    }));

    expect(html).toContain("<ol");
    expect(html).toContain("Célula realizada:");
    expect(html).toContain("D – F# – A");
    expect(html).toContain("Ritmo:");
    expect(html).toContain("Síncope curta");
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Gestos");
    expect(html).not.toContain("escolha uma célula");
    expect(html).toContain("Abrir uma cor");
    expect(html).toContain("Apoiar o acorde");
    expect(html).toContain("C – E – G – B");
    expect(html).toContain('title="maj / tríades superiores: Experimente a tríade do II grau."');
    expect(html).toContain("3ª corda, casa 11");
    expect(html).toContain("Parar");
    expect(html).toContain('role="alert"');
  });

  it("recolhe gestos excedentes sem remover vocabulario do markup", () => {
    const action: WriterMaterialAction = {
      name: "dominante diminuta",
      eyebrowLabel: "Tocar agora",
      theoryDesc: "Recortes simétricos para dominante.",
      notes: ["C4"],
      displayNotes: ["C"],
      rhythm: {
        id: "straight",
        label: "Direto",
        description: "Ataques simples.",
        cycleDurationMs: 400,
        timings: [{ onsetMs: 0, durationMs: 260, accent: true }]
      },
      steps: [{
        note: "C4",
        displayNote: "C",
        onsetMs: 0,
        durationMs: 260,
        accent: true
      }],
      buttonLabel: "Ouvir ideia"
    };
    const denseMoves = Array.from({ length: 7 }, (_, index) => (
      move(`0:${index}`, `C-${index}`, {
        cellIndex: index,
        isPreferred: index === 0
      })
    ));

    const html = renderToStaticMarkup(createElement(WriterMaterialActionBlock, {
      action,
      improvisationMoves: denseMoves,
      activeMoveId: "0:6",
      onSelectMove: () => undefined,
      onPlay: () => undefined
    }));

    expect(html).toContain("+3 gestos");
    expect(html).toContain("C – 6");
    expect(html).toContain("C – 4");
  });
});
