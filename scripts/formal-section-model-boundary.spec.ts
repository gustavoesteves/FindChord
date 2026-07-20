import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("formal section model boundary", () => {
  it("keeps FormalSection outside the score session store implementation", () => {
    const storeSource = readFileSync("src/store/useScoreSessionStore.ts", "utf8");
    const modelSource = readFileSync("src/utils/music/analysis/models/FormalSection.ts", "utf8");

    expect(modelSource).toContain("export interface FormalSection");
    expect(storeSource).toContain("../utils/music/analysis/models/FormalSection");
    expect(storeSource).not.toContain("export interface FormalSection");
  });
});
