import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { toMuseScoreChordSymbol } from "../src/utils/musescoreAdapter";

describe("MuseScore chord insertion safety", () => {
  it.each([
    ["Bb7b5(no3)", "Bb7(b5)"],
    ["C7M", "Cmaj7"],
    ["Cø7", "Cm7b5"],
    ["C7alt", "C7alt"],
    ["C7sus", "C7sus4"]
  ])("normaliza %s para %s", (input, expected) => {
    expect(toMuseScoreChordSymbol(input)).toBe(expected);
  });

  it.each(["G(#75)", "N.C.", "", "cifra desconhecida"])("recusa cifra insegura %s", input => {
    expect(toMuseScoreChordSymbol(input)).toBeNull();
  });

  it("anexa a harmonia antes de configurar o texto no plugin QML", () => {
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");
    const attachIndex = plugin.indexOf("cursor.add(harmony)");
    const textIndex = plugin.indexOf("harmony.text = symbol");

    expect(attachIndex).toBeGreaterThan(-1);
    expect(textIndex).toBeGreaterThan(attachIndex);
  });

  it("posiciona o cursor pela selecao antes de inserir", () => {
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");

    expect(plugin).toContain("var targetTick = -1;");
    expect(plugin).toContain("selection.elements");
    expect(plugin).toContain("cursor.tick < targetTick");
    expect(plugin).toContain("cursor.rewind(1)");
  });
});
