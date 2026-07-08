import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { resolveChordSymbol } from "../src/utils/music/theory/ChordSymbolResolver";
import { renderMusicXmlHarmony, toMusicXmlHarmony } from "../src/utils/music/theory/MusicXmlChordSymbolMapper";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");
const { parseXMLHarmonyBlock } = require("./harmony-normalizer.cjs");

interface RealMusicChordUsage {
  chord: string;
  files: string[];
}

function realMusicChordUsages(): RealMusicChordUsage[] {
  const musicDir = path.resolve(process.cwd(), "docs/musics");
  const byChord = new Map<string, Set<string>>();

  for (const file of fs.readdirSync(musicDir).filter(item => item.endsWith(".musicxml"))) {
    const snapshot = parseMusicXML(fs.readFileSync(path.join(musicDir, file), "utf8"));
    for (const harmony of snapshot.harmonies) {
      if (!byChord.has(harmony.harmony)) byChord.set(harmony.harmony, new Set());
      byChord.get(harmony.harmony)?.add(file);
    }
  }

  return Array.from(byChord.entries())
    .map(([chord, files]) => ({ chord, files: Array.from(files).sort() }))
    .sort((a, b) => a.chord.localeCompare(b.chord));
}

describe("F33.3 Real Music Chord Symbol Compatibility", () => {
  it("resolves every chord symbol found in docs/musics", () => {
    const usages = realMusicChordUsages();
    const unresolved = usages
      .map(usage => ({
        ...usage,
        resolved: resolveChordSymbol(usage.chord)
      }))
      .filter(item => (
        item.resolved.confidence === "ambiguous"
        || (item.resolved.quality !== "N.C." && item.resolved.notes.length === 0)
      ));

    expect(usages.length).toBeGreaterThan(0);
    expect(unresolved).toEqual([]);
  });

  it("documents the current unique real-music chord vocabulary size", () => {
    expect(realMusicChordUsages()).toHaveLength(162);
  });

  it("maps every real-music chord symbol to a semantic MusicXML harmony shape", () => {
    const unmapped = realMusicChordUsages()
      .map(usage => ({
        ...usage,
        mapping: toMusicXmlHarmony(usage.chord)
      }))
      .filter(item => (
        item.mapping.kind !== "none"
        && (!item.mapping.root || item.mapping.warnings.length > 0)
      ));

    expect(unmapped).toEqual([]);
  });

  it("round-trips every real-music chord through the minimal MusicXML harmony renderer", () => {
    const failed = realMusicChordUsages()
      .map(usage => {
        const parsed = parseXMLHarmonyBlock(renderMusicXmlHarmony(usage.chord));
        return {
          ...usage,
          parsed,
          expected: resolveChordSymbol(usage.chord).normalized,
          actual: parsed ? resolveChordSymbol(parsed).normalized : null
        };
      })
      .filter(item => item.actual !== item.expected)
      .filter(item => !item.expected.endsWith("7alt") || item.actual !== item.expected.replace("alt", ""));

    expect(failed).toEqual([]);
  });
});
