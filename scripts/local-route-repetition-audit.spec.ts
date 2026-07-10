import { describe, expect, it } from "vitest";
import { auditLocalRouteRepetitionForFile } from "./audit-local-route-repetition";

describe("local route repetition audit", () => {
  it("keeps Asa Branca free of local-route repetitions", () => {
    expect(auditLocalRouteRepetitionForFile("asa branca.musicxml")).toEqual([]);
  });
});
