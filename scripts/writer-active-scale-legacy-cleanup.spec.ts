import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chordStoreSource = readFileSync("src/store/useChordStore.ts", "utf8");
const virtualFretboardSource = readFileSync("src/domains/writer/components/VirtualFretboard.tsx", "utf8");

describe("F218 limpeza do activeScale legado no Escrever", () => {
  it("remove estado global legado de escala do store do acorde", () => {
    expect(chordStoreSource).not.toContain("activeScale");
    expect(chordStoreSource).not.toContain("setActiveScale");
  });

  it("remove o overlay antigo de escala do braco principal", () => {
    expect(virtualFretboardSource).not.toContain("MODO SCALE OVERLAY");
    expect(virtualFretboardSource).not.toContain("getDegreeLabel");
    expect(virtualFretboardSource).not.toContain("useChordStore");
  });
});
