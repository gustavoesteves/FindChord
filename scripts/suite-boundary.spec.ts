import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = "src";
const SCRIPTS_ROOT = "scripts";
const CURATED_CONFIG = "vitest.curated.config.ts";
const LEGACY_COMPONENTS_DIR = join(SOURCE_ROOT, "components");
const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const IMPORT_PATTERN = /from\s+["']([^"']+)["']/g;

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension)) ? [path] : [];
  });
}

function collectSpecFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectSpecFiles(path);
    return path.endsWith(".spec.ts") ? [path] : [];
  });
}

describe("suite boundary", () => {
  it("keeps product UI inside explicit domains", () => {
    expect(existsSync(LEGACY_COMPONENTS_DIR)).toBe(false);
  });

  it("does not import from the removed generic components layer", () => {
    const offenders = collectSourceFiles(SOURCE_ROOT).filter((file) => {
      const contents = readFileSync(file, "utf8");
      const imports = [...contents.matchAll(IMPORT_PATTERN)].map((match) => match[1]);
      return imports.some((specifier) => {
        if (!specifier.startsWith(".")) return specifier.startsWith("src/components/");
        const resolved = normalize(resolve(dirname(file), specifier));
        return resolved.includes(`${normalize(resolve(LEGACY_COMPONENTS_DIR))}/`);
      });
    });

    expect(offenders).toEqual([]);
  });

  it("keeps every script spec in the curated suite", () => {
    const config = readFileSync(CURATED_CONFIG, "utf8");
    const curatedSpecs = new Set(
      [...config.matchAll(/"([^"]+\.spec\.ts)"/g)].map((match) => normalize(match[1]))
    );
    const allSpecs = collectSpecFiles(SCRIPTS_ROOT).map((file) => normalize(file));

    expect(allSpecs.filter((file) => !curatedSpecs.has(file))).toEqual([]);
  });
});
