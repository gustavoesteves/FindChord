import { describe, expect, it } from "vitest";
import { effectiveSectionId } from "../src/domains/harmonizer/hooks/useActiveSection";
import type { FormalSection } from "../src/store/useScoreSessionStore";

const sections: FormalSection[] = [
  { id: "sec_a", label: "A", source: "score", startMeasure: 1, endMeasure: 8 },
  { id: "sec_b", label: "B", source: "score", startMeasure: 9, endMeasure: 16 }
];

describe("active section selection", () => {
  it("preserva a secao selecionada quando ela ainda existe apos sincronizacao", () => {
    const resyncedSections = sections.map(section => ({ ...section }));

    expect(effectiveSectionId(resyncedSections, "sec_b")).toBe("sec_b");
  });

  it("usa a primeira secao no mesmo render quando a selecao ficou invalida", () => {
    expect(effectiveSectionId(sections, "old_random_id")).toBe("sec_a");
  });

  it("retorna null quando nao ha secoes", () => {
    expect(effectiveSectionId([], "sec_b")).toBeNull();
  });
});
