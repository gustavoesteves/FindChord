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

function cChord(partial: Partial<ChordCandidate>): ChordCandidate {
  return {
    ...cmaj7,
    ...partial
  };
}

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

  it.each([
    {
      chord: cChord({
        quality: "major7#11",
        intervals: ["1P", "3M", "5P", "7M", "9M", "11A"],
        notes: ["C", "E", "G", "B", "D", "F#"],
        drawnNotes: ["C", "E", "G", "B", "D", "F#"],
        notationInternational: "Cmaj7#11"
      }),
      expectedRouteId: "color",
      expectedSourceType: "lydian"
    },
    {
      chord: cChord({
        quality: "dominant7#9",
        intervals: ["1P", "3M", "5P", "7m", "9A"],
        notes: ["C", "E", "G", "Bb", "D#"],
        drawnNotes: ["C", "E", "G", "Bb", "D#"],
        notationInternational: "C7#9"
      }),
      expectedRouteId: "tension",
      expectedSourceType: "altered"
    },
    {
      chord: cChord({
        quality: "dominant7#11",
        intervals: ["1P", "3M", "5P", "7m", "9M", "11A"],
        notes: ["C", "E", "G", "Bb", "D", "F#"],
        drawnNotes: ["C", "E", "G", "Bb", "D", "F#"],
        notationInternational: "C7#11"
      }),
      expectedRouteId: "inside",
      expectedSourceType: "chord tone core"
    },
    {
      chord: cChord({
        quality: "power",
        intervals: ["1P", "5P"],
        notes: ["C", "G"],
        drawnNotes: ["C", "G"],
        notationInternational: "C5"
      }),
      expectedRouteId: "inside",
      expectedSourceType: "power neutral pentatonic"
    }
  ])(
    "deriva o foco inicial global para $expectedSourceType",
    ({ chord, expectedRouteId, expectedSourceType }) => {
      const model = buildWriterMaterialScreenModel({
        activeChord: chord,
        notationStyle: "International",
        selectedMaterialSource: null
      });

      expect(model.effectiveRouteId).toBe(expectedRouteId);
      expect(model.focusedMaterialSource?.type).toBe(expectedSourceType);
      expect(model.focusedPaletteItem?.source.type).toBe(expectedSourceType);
      expect(model.activeMaterialPanel?.sourceType).toBe(expectedSourceType);
      expect(model.activeMaterialAction).toBeTruthy();
    }
  );

  it("mantem a colecao neutra de C5 sem terca maior ou menor no modelo completo", () => {
    const model = buildWriterMaterialScreenModel({
      activeChord: cChord({
        quality: "power",
        intervals: ["1P", "5P"],
        notes: ["C", "G"],
        drawnNotes: ["C", "G"],
        notationInternational: "C5"
      }),
      notationStyle: "International",
      selectedMaterialSource: null
    });

    expect(model.focusedMaterialSource).toMatchObject({
      type: "power neutral pentatonic"
    });
    expect(model.focusedMaterialSource?.notes).not.toContain("E");
    expect(model.focusedMaterialSource?.notes).not.toContain("Eb");
    expect(model.activeMaterialAction?.displayNotes).not.toContain("E");
    expect(model.activeMaterialAction?.displayNotes).not.toContain("Eb");
  });

  it("realiza a celula neutra de C5 no shape sem introduzir terca", () => {
    const model = buildWriterMaterialScreenModel({
      activeChord: cChord({
        quality: "power",
        intervals: ["1P", "5P"],
        notes: ["C", "G"],
        drawnNotes: ["C", "G"],
        notationInternational: "C5"
      }),
      notationStyle: "International",
      selectedMaterialSource: null,
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      selectedFrets: [8, 8, null, 10, 10, 8]
    });

    expect(model.activeMaterialAction).toMatchObject({
      name: "power / pentatônica neutra",
      realizedCell: {
        notation: "C-D-F-G-Bb"
      }
    });
    expect(model.activeMaterialAction?.displayNotes).not.toContain("E");
    expect(model.activeMaterialAction?.displayNotes).not.toContain("Eb");
    expect(model.activeMaterialAction?.steps.every(step => step.position)).toBe(true);
  });

  it("preserva uma rota escolhida explicitamente mesmo quando o foco global esta em outra rota", () => {
    const model = buildWriterMaterialScreenModel({
      activeChord: cChord({
        quality: "dominant7#9",
        intervals: ["1P", "3M", "5P", "7m", "9A"],
        notes: ["C", "E", "G", "Bb", "D#"],
        drawnNotes: ["C", "E", "G", "Bb", "D#"],
        notationInternational: "C7#9"
      }),
      notationStyle: "International",
      preferredRouteId: "inside",
      selectedMaterialSource: null
    });

    expect(model.effectiveRouteId).toBe("inside");
    expect(model.focusedMaterialSource?.type).toBe("chord tone core");
    expect(model.routedMaterialPalette.every(item => item.intent === "inside")).toBe(true);
  });

  it("expõe dominante alterada escrita como célula selecionável de resolução curta", () => {
    const baseModel = buildWriterMaterialScreenModel({
      activeChord: cChord({
        quality: "dominant7#9",
        intervals: ["1P", "3M", "5P", "7m", "9A"],
        notes: ["C", "E", "G", "Bb", "D#"],
        drawnNotes: ["C", "E", "G", "Bb", "D#"],
        notationInternational: "C7#9"
      }),
      notationStyle: "International",
      preferredRouteId: "tension",
      selectedMaterialSource: null
    });
    const writtenResolution = baseModel.routedMaterialPalette.find(item => (
      item.source.type === "written altered dominant resolutions"
    ));

    const model = buildWriterMaterialScreenModel({
      activeChord: cChord({
        quality: "dominant7#9",
        intervals: ["1P", "3M", "5P", "7m", "9A"],
        notes: ["C", "E", "G", "Bb", "D#"],
        drawnNotes: ["C", "E", "G", "Bb", "D#"],
        notationInternational: "C7#9"
      }),
      notationStyle: "International",
      preferredRouteId: "tension",
      selectedMaterialSource: writtenResolution?.source || null,
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      selectedFrets: [8, 8, 9, 8, null, null]
    });

    expect(model.effectiveRouteId).toBe("tension");
    expect(model.focusedMaterialSource?.type).toBe("written altered dominant resolutions");
    expect(model.focusedImprovisationMove).toMatchObject({
      notation: "D#->E",
      kind: "return",
      actionLabel: "Voltar ao acorde"
    });
    expect(model.activeMaterialAction).toMatchObject({
      name: "alteração escrita / resolução curta",
      realizedCell: {
        notation: "D#->E"
      }
    });
    expect(model.activeMaterialAction?.displayNotes.slice(0, 2)).toEqual(["D#", "E"]);
  });

  it("expõe meio-diminuto como cor breve que retorna ao núcleo do acorde", () => {
    const baseModel = buildWriterMaterialScreenModel({
      activeChord: cChord({
        quality: "halfDiminished",
        intervals: ["1P", "3m", "5d", "7m"],
        notes: ["C", "Eb", "Gb", "Bb"],
        drawnNotes: ["C", "Eb", "Gb", "Bb"],
        notationInternational: "Cm7b5"
      }),
      notationStyle: "International",
      preferredRouteId: "color",
      selectedMaterialSource: null
    });
    const halfDiminishedColor = baseModel.routedMaterialPalette.find(item => (
      item.source.type === "half diminished upper structures"
    ));

    const model = buildWriterMaterialScreenModel({
      activeChord: cChord({
        quality: "halfDiminished",
        intervals: ["1P", "3m", "5d", "7m"],
        notes: ["C", "Eb", "Gb", "Bb"],
        drawnNotes: ["C", "Eb", "Gb", "Bb"],
        notationInternational: "Cm7b5"
      }),
      notationStyle: "International",
      preferredRouteId: "color",
      selectedMaterialSource: halfDiminishedColor?.source || null,
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      selectedFrets: [8, 7, 8, 8, null, null]
    });

    expect(model.focusedMaterialSource?.type).toBe("half diminished upper structures");
    expect(model.focusedImprovisationMove).toMatchObject({
      notation: "D->Eb",
      kind: "return",
      actionLabel: "Voltar ao acorde"
    });
    expect(model.activeMaterialAction).toMatchObject({
      name: "ø7 / estruturas superiores",
      realizedCell: {
        notation: "D->Eb"
      }
    });
    expect(model.activeMaterialAction?.displayNotes.slice(0, 2)).toEqual(["D", "Eb"]);
  });

  it("volta ao foco musical global quando a rota explicita nao existe para o novo acorde", () => {
    const model = buildWriterMaterialScreenModel({
      activeChord: cChord({
        quality: "major7#11",
        intervals: ["1P", "3M", "5P", "7M", "9M", "11A"],
        notes: ["C", "E", "G", "B", "D", "F#"],
        drawnNotes: ["C", "E", "G", "B", "D", "F#"],
        notationInternational: "Cmaj7#11"
      }),
      notationStyle: "International",
      preferredRouteId: "outside",
      selectedMaterialSource: null
    });

    expect(model.effectiveRouteId).toBe("color");
    expect(model.focusedMaterialSource?.type).toBe("lydian");
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

  it("usa o shape desenhado para criar a acao tocavel do material", () => {
    const model = buildWriterMaterialScreenModel({
      activeChord: cmaj7,
      notationStyle: "International",
      preferredRouteId: "inside",
      selectedMaterialSource: null,
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      selectedFrets: [8, 8, 9, 10, null, null]
    });

    expect(model.activeMaterialAction).toMatchObject({
      name: "núcleo de notas do acorde",
      eyebrowLabel: "Tocar agora",
      buttonLabel: "Ouvir ideia"
    });
    expect(model.activeMaterialAction?.notes.every(note => /\d$/.test(note))).toBe(true);
  });

  it("mantem a mesma identidade entre card, celula e acao realizada no shape", () => {
    const colorRoute = buildWriterMaterialScreenModel({
      activeChord: cmaj7,
      notationStyle: "International",
      preferredRouteId: "color",
      selectedMaterialSource: null
    });
    const upperTriads = colorRoute.routedMaterialPalette.find(item => (
      item.source.type === "major upper triad colors"
    ));
    expect(upperTriads).toBeTruthy();

    const model = buildWriterMaterialScreenModel({
      activeChord: cmaj7,
      notationStyle: "International",
      preferredRouteId: "color",
      selectedMaterialSource: upperTriads?.source || null,
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      selectedFrets: [8, 8, 9, 10, null, null]
    });

    expect(model.focusedPaletteItem?.title).toBe("maj / tríades superiores");
    expect(model.activeMaterialAction).toMatchObject({
      name: "maj / tríades superiores",
      realizedCell: {
        notation: "D-F#-A"
      }
    });
    expect(model.activeMaterialAction?.displayNotes.slice(0, 3)).toEqual(["D", "F#", "A"]);
    expect(model.activeMaterialAction?.steps.every(step => step.position)).toBe(true);
  });

  it("faz um move nao prioritario comandar a celula realizada no shape", () => {
    const colorRoute = buildWriterMaterialScreenModel({
      activeChord: cmaj7,
      notationStyle: "International",
      preferredRouteId: "color",
      selectedMaterialSource: null
    });
    const upperTriads = colorRoute.routedMaterialPalette.find(item => (
      item.source.type === "major upper triad colors"
    ));

    const model = buildWriterMaterialScreenModel({
      activeChord: cmaj7,
      notationStyle: "International",
      preferredRouteId: "color",
      preferredMoveId: "0:0",
      selectedMaterialSource: upperTriads?.source || null,
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      selectedFrets: [8, 8, 9, 10, null, null]
    });

    expect(model.improvisationMoves.map(move => move.id)).toEqual(["0:1", "0:0", "0:2"]);
    expect(model.focusedImprovisationMove).toMatchObject({
      id: "0:0",
      notation: "C-E-G-B"
    });
    expect(model.activeMaterialAction).toMatchObject({
      name: "maj / tríades superiores",
      realizedCell: {
        materialIndex: 0,
        cellIndex: 0,
        notation: "C-E-G-B"
      }
    });
    expect(model.activeMaterialAction?.displayNotes.slice(0, 4)).toEqual(["C", "E", "G", "B"]);
  });
});
