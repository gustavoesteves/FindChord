import { describe, expect, it } from "vitest";
import { improvisationPhraseFromCell } from "../src/utils/music/models/ImprovisationPhrase";
import {
  baseMelodicCellFromNotation,
  melodicCellDirection,
  notesInMelodicCellNotation
} from "../src/utils/music/models/MelodicCell";
import { buildWriterMaterialImprovisationMoves } from "../src/domains/writer/services/writerMaterialImprovisationMoves";
import type { ContextualMelodicMaterial } from "../src/utils/music/theory/contextualMaterialTypes";
import {
  contextualMelodicMaterialId,
  preferredStructuredCellIdForMaterial,
  structuredCellsForContextualMaterial
} from "../src/utils/music/theory/melodicCellMaterialAdapter";
import { resolveChordSymbol } from "../src/utils/music/theory/ChordSymbolResolver";
import { materialChordIdentityFromResolvedSymbol } from "../src/utils/music/theory/materialChordIdentity";

function identity(symbol: string) {
  const resolved = resolveChordSymbol(symbol, "plain");
  const materialIdentity = materialChordIdentityFromResolvedSymbol(resolved);
  if (!materialIdentity) throw new Error(`Acorde não resolvido no teste: ${symbol}`);
  return materialIdentity;
}

describe("F360.2 contrato de células melódicas", () => {
  it("gera ids determinísticos a partir do material e da notação, não do índice", () => {
    const material: ContextualMelodicMaterial = {
      label: "maj7 lídio / tríade do II",
      source: "arpeggio",
      sourceScale: "C lydian",
      cells: ["C-E-G-B", "D-F#-A"],
      preferredCellIndex: 1,
      tensionProfile: ["9", "#11", "13"],
      resolutionTargets: ["G"],
      practiceHint: "Use uma cor lídia sobre o acorde."
    };
    const cells = structuredCellsForContextualMaterial({
      material,
      intent: "functional",
      materialIdentity: identity("Cmaj7(#11)")
    });

    expect(contextualMelodicMaterialId(material)).toBe("arpeggio-c-lydian-maj7-lidio-triade-do-ii");
    expect(cells.map(cell => cell.id)).toEqual([
      "arpeggio-c-lydian-maj7-lidio-triade-do-ii:c-e-g-b",
      "arpeggio-c-lydian-maj7-lidio-triade-do-ii:d-fsharp-a"
    ]);
    expect(preferredStructuredCellIdForMaterial(material, cells)).toBe(cells[1].id);
  });

  it("preserva papéis harmônicos para apoio, cor e tensão escrita", () => {
    const support = baseMelodicCellFromNotation({
      materialId: "Cmaj7#11 core",
      notation: "C-E-G-B",
      intent: "inside",
      materialIdentity: identity("Cmaj7(#11)")
    });
    const withWrittenTension = baseMelodicCellFromNotation({
      materialId: "Cmaj7#11 core",
      notation: "C-E-G-B-F#",
      intent: "functional",
      materialIdentity: identity("Cmaj7(#11)")
    });

    expect(support.events.map(event => event.harmonicRole)).toEqual([
      "support",
      "support",
      "support",
      "support"
    ]);
    expect(withWrittenTension.events.at(-1)).toMatchObject({
      note: "F#",
      intervalDegree: "#11",
      harmonicRole: "tension"
    });
  });

  it("distingue direção descendente e retorno local sem criar chegada contextual no Writer", () => {
    expect(notesInMelodicCellNotation("B-G-E-C")).toEqual(["B", "G", "E", "C"]);
    expect(melodicCellDirection(["B", "G", "E", "C"])).toBe("descending");

    const returning = baseMelodicCellFromNotation({
      materialId: "C lydian return",
      notation: "F#->G",
      intent: "functional",
      materialIdentity: identity("Cmaj7(#11)"),
      resolutionTargets: ["G"]
    });

    expect(returning).toMatchObject({
      direction: "ascending",
      resolutionScope: "local-return",
      localReturnDegrees: ["5"]
    });
    expect(returning.events.at(-1)).toMatchObject({
      note: "G",
      harmonicRole: "support",
      gestureRole: "return"
    });
    expect(returning.resolutionScope).not.toBe("contextual-arrival");
  });

  it("mantém side-slip interno como gesto estrutural quando as notas pertencem ao acorde", () => {
    const dominantCore = baseMelodicCellFromNotation({
      materialId: "G7 internal side slip landing",
      notation: "G-B-D-F",
      intent: "outside",
      materialIdentity: identity("G7")
    });

    expect(dominantCore.events.map(event => event.harmonicRole)).toEqual([
      "support",
      "support",
      "support",
      "support"
    ]);
  });

  it("projeta a célula para frase com unidade rítmica explícita em semínimas", () => {
    const cell = baseMelodicCellFromNotation({
      materialId: "Cmaj7 core",
      notation: "C-E-G-B",
      intent: "inside",
      materialIdentity: identity("Cmaj7")
    });
    const phrase = improvisationPhraseFromCell({
      cell,
      surface: "writer-vamp",
      startBeat: 1,
      durationBeats: 0.5
    });

    expect(phrase).toMatchObject({
      id: `writer-vamp:${cell.id}`,
      beatUnit: "quarter-note",
      sourceCellIds: [cell.id]
    });
    expect(phrase.events.map(event => [event.note, event.onsetBeats, event.durationBeats])).toEqual([
      ["C", 1, 0.5],
      ["E", 1.5, 0.5],
      ["G", 2, 0.5],
      ["B", 2.5, 0.5]
    ]);
  });

  it("carrega cellId estável nos movimentos do Writer como ponte para UI e áudio", () => {
    const moves = buildWriterMaterialImprovisationMoves({
      melodicMaterials: [{
        label: "Lídio local",
        source: "arpeggio",
        sourceScale: "C lydian",
        cells: ["C-E-G-B", "D-F#-A"],
        preferredCellIndex: 1,
        tensionProfile: ["9", "#11", "13"],
        resolutionTargets: [],
        practiceHint: "Abra a cor lídia."
      }],
      chordNotes: ["C", "E", "G", "B"],
      materialIdentity: identity("Cmaj7(#11)"),
      intent: "functional"
    });

    expect(moves[0]).toMatchObject({
      id: "0:arpeggio-c-lydian-lidio-local:d-fsharp-a",
      cellId: "arpeggio-c-lydian-lidio-local:d-fsharp-a",
      isPreferred: true
    });
    expect(new Set(moves.map(move => move.cellId)).size).toBe(moves.length);
  });
});
