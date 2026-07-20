import { CHORD_REGISTRY, type ChordQuality } from "../../../utils/music/constants/chordRegistry";

const EXPORT_SUFFIX_OVERRIDES: Partial<Record<ChordQuality, string>> = {
  minorMajor7th: "mMaj7",
  dominant7b5: "7(b5)",
  dominant7b9: "7(b9)",
  "dominant7#9": "7(#9)",
  "dominant7#11": "7(#11)",
  dominant7b13: "7(b13)",
  "major7#11": "maj7(#11)"
};

interface WriterCanonicalChordSymbolInput {
  root: string;
  quality: ChordQuality | string;
  bass?: string;
  fallbackSymbol?: string;
}

export function buildWriterCanonicalChordSymbol(input: WriterCanonicalChordSymbolInput): string {
  const root = input.root.trim();
  const bass = input.bass?.trim();
  const quality = input.quality as ChordQuality;
  const suffix = EXPORT_SUFFIX_OVERRIDES[quality] ?? CHORD_REGISTRY[quality]?.notation.international;
  const base = suffix !== undefined ? `${root}${suffix}` : input.fallbackSymbol?.trim() || root;

  if (!bass || bass === root || base.includes("/")) return base;
  return `${base}/${bass}`;
}
