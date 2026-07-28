import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WriterMaterialActionBlock } from "../src/domains/writer/components/WriterMaterialActionBlock";
import type { WriterMaterialAction } from "../src/domains/writer/services/writerMaterialAction";

describe("F258 bloco visual da acao de material", () => {
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
        materialLabel: "maj / tríades superiores",
        materialIndex: 0,
        cellIndex: 1,
        notation: "D-F#-A"
      },
      buttonLabel: "Ouvir ideia"
    };

    const html = renderToStaticMarkup(createElement(WriterMaterialActionBlock, {
      action,
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
    expect(html).toContain("3ª corda, casa 11");
    expect(html).toContain("Parar");
    expect(html).toContain('role="alert"');
  });
});
