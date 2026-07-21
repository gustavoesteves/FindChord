import { describe, expect, it } from "vitest";
import { cadenceLabel } from "../src/domains/harmonizer/components/HarmonizerHeader";

describe("Harmonizer header labels", () => {
  it("translates cadence types into musician-facing labels", () => {
    expect(cadenceLabel("HALF")).toBe("meia cadência");
    expect(cadenceLabel("AUTHENTIC")).toBe("cadência autêntica");
    expect(cadenceLabel("PLAGAL")).toBe("cadência plagal");
    expect(cadenceLabel("DECEPTIVE")).toBe("cadência deceptiva");
    expect(cadenceLabel("PHRYGIAN")).toBe("cadência frígia");
    expect(cadenceLabel("UNKNOWN")).toBe("chegada aberta");
  });
});
