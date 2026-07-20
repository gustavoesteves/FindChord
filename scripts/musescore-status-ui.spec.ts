import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("MuseScore status UI", () => {
  it("labels dashboard connectivity as bridge status, not MuseScore readiness", () => {
    const badge = readFileSync("src/domains/suite/components/MuseScoreConnectionBadge.tsx", "utf8");

    expect(badge).toContain("Bridge Conectado");
    expect(badge).toContain("Bridge Offline");
    expect(badge).not.toContain("MuseScore Conectado");
  });

  it("surfaces plugin timeout as a visible sync error", () => {
    const hook = readFileSync("src/domains/harmonizer/hooks/useScoreSync.ts", "utf8");
    const screen = readFileSync("src/domains/harmonizer/HarmonizerScreen.tsx", "utf8");

    expect(hook).toContain("syncError");
    expect(hook).toContain("Não recebi resposta do plugin do MuseScore");
    expect(hook).toContain("return success;");
    expect(screen).toContain("syncError");
    expect(screen).toContain("{syncError}");
  });
});
