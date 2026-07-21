import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

interface RemovedSymbolRegistry {
  schemaVersion: number;
  removedSymbols: Array<{
    symbol: string;
    removedPath: string;
    replacementSymbol: string;
    replacementPath: string;
    activeDocRoots: string[];
    historicalDocRoots: string[];
  }>;
}

function registry(): RemovedSymbolRegistry {
  return JSON.parse(readFileSync("docs/removed_symbol_registry.json", "utf8")) as RemovedSymbolRegistry;
}

function markdownFilesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  const stat = statSync(root);
  if (stat.isFile()) return root.endsWith(".md") ? [root] : [];

  return readdirSync(root)
    .flatMap(entry => markdownFilesUnder(join(root, entry)));
}

function activeDocumentationFiles(): string[] {
  return [
    ...markdownFilesUnder("docs/theory"),
    ...markdownFilesUnder("docs")
      .filter(path => /^docs\/auditoria(?: funcional)?\.md$/.test(path))
  ];
}

describe("removed symbol registry", () => {
  it("declara substitutos existentes para simbolos removidos", () => {
    const data = registry();

    expect(data.schemaVersion).toBe(1);
    for (const item of data.removedSymbols) {
      expect(item.symbol.length).toBeGreaterThan(0);
      expect(existsSync(item.removedPath), item.removedPath).toBe(false);
      expect(existsSync(item.replacementPath), item.replacementPath).toBe(true);
    }
  });

  it("impede documentos ativos de apontarem para simbolos removidos", () => {
    const docs = activeDocumentationFiles();
    const data = registry();

    expect(docs.length).toBeGreaterThan(0);
    for (const item of data.removedSymbols) {
      const offenders = docs.filter(path => readFileSync(path, "utf8").includes(item.symbol));
      expect(offenders, `${item.symbol} ainda aparece em docs ativos`).toEqual([]);
    }
  });
});
