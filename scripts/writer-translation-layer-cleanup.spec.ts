import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const translationLayerSource = readFileSync("src/domains/writer/components/TranslationLayer.tsx", "utf8");
const writerTabsSource = readFileSync("src/domains/writer/components/WriterTabSurface.tsx", "utf8");

describe("F216 limpeza da biblioteca no Escrever", () => {
  it("mantem a aba como leitura do acorde, sem biblioteca", () => {
    expect(writerTabsSource).toContain("Leitura do acorde");
    expect(writerTabsSource).not.toContain("Acorde & Biblioteca");
  });

  it("remove persistencia e import/export da antiga biblioteca", () => {
    expect(translationLayerSource).not.toContain("localStorage");
    expect(translationLayerSource).not.toContain("findchord_library");
    expect(translationLayerSource).not.toContain("findchord_captured");
    expect(translationLayerSource).not.toContain("findchord_favorites");
    expect(translationLayerSource).not.toContain("handleImportJSON");
    expect(translationLayerSource).not.toContain("handleExportJSON");
  });
});
