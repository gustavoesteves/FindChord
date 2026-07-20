import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("suite domain code splitting", () => {
  it("loads Writer and Harmonizer through lazy domain chunks", () => {
    const source = readFileSync("src/domains/suite/components/SuiteDomainOutlet.tsx", "utf8");

    expect(source).toContain("lazy(() => import(\"../../writer/WriterScreen\"))");
    expect(source).toContain("lazy(() => import(\"../../harmonizer/HarmonizerScreen\"))");
    expect(source).toContain("<Suspense fallback={fallback}>");
    expect(source).not.toContain("import WriterScreen from");
    expect(source).not.toContain("import HarmonizerScreen from");
  });
});
