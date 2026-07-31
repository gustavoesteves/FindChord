import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/domains/writer/components/WriterMaterialIdeaCard.tsx", "utf8");

describe("F360.3 copy dos cards de materiais do acorde", () => {
  it("nao expoe mapa de apoio como categoria musical no card de ideias", () => {
    expect(source).not.toContain("mapa de apoio");
    expect(source).not.toContain(' : "mapa"');
  });
});
