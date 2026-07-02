import { Note } from "tonal";

export type ChordDisplayProfile = "br" | "jazz" | "plain" | "ireal";

export type ChordQuality =
  | "maj"
  | "m"
  | "aug"
  | "dim"
  | "5"
  | "sus2"
  | "sus4"
  | "7"
  | "maj7"
  | "m7"
  | "mMaj7"
  | "m9"
  | "m11"
  | "6"
  | "m6"
  | "6_9"
  | "m6_9"
  | "9"
  | "11"
  | "13"
  | "7sus4"
  | "9sus4"
  | "13sus4"
  | "dim7"
  | "m7b5"
  | "7alt"
  | "7_sharp5"
  | "7_b5"
  | "7_b9"
  | "7_sharp9"
  | "7_sharp11"
  | "7_b13"
  | "7_sharp9_b13"
  | "maj7_sharp11"
  | "add9"
  | "N.C.";

export type ChordTension = "b9" | "9" | "#9" | "11" | "#11" | "b13" | "13";
export type ChordResolverConfidence = "exact" | "profile" | "ambiguous" | "legacy";

export interface ResolvedChordSymbol {
  raw: string;
  root?: string;
  bass?: string;
  quality: ChordQuality;
  tensions: ChordTension[];
  omissions: Array<"no3" | "no5" | "noRoot">;
  normalized: string;
  display: string;
  aliasesMatched: string[];
  confidence: ChordResolverConfidence;
  warnings: string[];
  notes: string[];
}

const QUALITY_INTERVALS: Record<ChordQuality, string[]> = {
  "N.C.": [],
  maj: ["1P", "3M", "5P"],
  m: ["1P", "3m", "5P"],
  aug: ["1P", "3M", "5A"],
  dim: ["1P", "3m", "5d"],
  "5": ["1P", "5P"],
  sus2: ["1P", "2M", "5P"],
  sus4: ["1P", "4P", "5P"],
  "7": ["1P", "3M", "5P", "7m"],
  maj7: ["1P", "3M", "5P", "7M"],
  m7: ["1P", "3m", "5P", "7m"],
  mMaj7: ["1P", "3m", "5P", "7M"],
  m9: ["1P", "3m", "5P", "7m", "9M"],
  m11: ["1P", "3m", "5P", "7m", "9M", "11P"],
  "6": ["1P", "3M", "5P", "6M"],
  m6: ["1P", "3m", "5P", "6M"],
  "6_9": ["1P", "3M", "5P", "6M", "9M"],
  m6_9: ["1P", "3m", "5P", "6M", "9M"],
  "9": ["1P", "3M", "5P", "7m", "9M"],
  "11": ["1P", "3M", "5P", "7m", "9M", "11P"],
  "13": ["1P", "3M", "5P", "7m", "9M", "13M"],
  "7sus4": ["1P", "4P", "5P", "7m"],
  "9sus4": ["1P", "4P", "5P", "7m", "9M"],
  "13sus4": ["1P", "4P", "5P", "7m", "9M", "13M"],
  dim7: ["1P", "3m", "5d", "6M"],
  m7b5: ["1P", "3m", "5d", "7m"],
  "7alt": ["1P", "3M", "7m"],
  "7_sharp5": ["1P", "3M", "5A", "7m"],
  "7_b5": ["1P", "3M", "5d", "7m"],
  "7_b9": ["1P", "3M", "5P", "7m", "9m"],
  "7_sharp9": ["1P", "3M", "5P", "7m", "9A"],
  "7_sharp11": ["1P", "3M", "5P", "7m", "11A"],
  "7_b13": ["1P", "3M", "5P", "7m", "13m"],
  "7_sharp9_b13": ["1P", "3M", "5P", "7m", "9A", "13m"],
  maj7_sharp11: ["1P", "3M", "5P", "7M", "11A"],
  add9: ["1P", "3M", "5P", "9M"]
};

const TENSION_ORDER: ChordTension[] = ["b9", "9", "#9", "11", "#11", "b13", "13"];

function normalizeInput(raw: string): string {
  return raw
    .trim()
    .replace(/[♭]/g, "b")
    .replace(/[♯]/g, "#")
    .replace(/[−–—]/g, "-")
    .replace(/[△∆]/g, "Δ")
    .replace(/[º]/g, "°")
    .replace(/\s+/g, "");
}

function splitBass(symbol: string): { body: string; bass?: string } {
  const match = symbol.match(/^(.*)\/([A-G](?:#|b)?)$/);
  if (!match) return { body: symbol };
  return { body: match[1], bass: Note.pitchClass(match[2]) || match[2] };
}

function extractTensions(suffix: string): { cleaned: string; tensions: ChordTension[] } {
  const tensions = new Set<ChordTension>();
  const collect = (text: string) => {
    for (const token of text.split(",")) {
      const normalized = token.trim();
      if (TENSION_ORDER.includes(normalized as ChordTension)) {
        tensions.add(normalized as ChordTension);
      }
    }
  };

  let cleaned = suffix.replace(/\(([^)]*)\)/g, (_match, content: string) => {
    collect(content);
    return "";
  });

  cleaned = cleaned.replace(/(b9|#9|#11|b13|13|11|9)/g, (token: string) => {
    if (TENSION_ORDER.includes(token as ChordTension)) {
      tensions.add(token as ChordTension);
    }
    return "";
  });

  return {
    cleaned,
    tensions: Array.from(tensions).sort((a, b) => TENSION_ORDER.indexOf(a) - TENSION_ORDER.indexOf(b))
  };
}

function qualityFromSuffix(
  suffix: string,
  profile: ChordDisplayProfile
): { quality: ChordQuality; tensions: ChordTension[]; confidence: ChordResolverConfidence; warnings: string[]; aliasesMatched: string[] } {
  const warnings: string[] = [];
  const aliasesMatched: string[] = [];
  const original = suffix;
  const lower = suffix.toLowerCase();

  if (suffix === "") return { quality: "maj", tensions: [], confidence: "exact", warnings, aliasesMatched };
  if (/^(maj|ma)$/i.test(suffix) || suffix === "M") {
    return { quality: "maj", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  }

  if (/^(maj7|ma7|M7|7M|Δ7?|\^7?)$/.test(suffix)) {
    return { quality: "maj7", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  }

  if (/^(m7\(b5\)|m7b5|-7b5|mi7b5|min7b5|ø7?|Ø7?|0)$/.test(suffix)) {
    return { quality: "m7b5", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  }

  if (/^(dim7|°7|o7)$/.test(suffix)) return { quality: "dim7", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(dim|°|o)$/.test(suffix)) return { quality: "dim", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };

  if (/^(m\(maj7\)|mmaj7|mM7|m7M|-\^|-Δ)$/.test(suffix)) {
    return { quality: "mMaj7", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  }

  if (/^(m6\/9|-6\/9|m69)$/.test(suffix)) return { quality: "m6_9", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(m11|-11|min11|mi11)$/.test(suffix)) return { quality: "m11", tensions: ["9", "11"], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(m9|-9|min9|mi9)$/.test(suffix)) return { quality: "m9", tensions: ["9"], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(m6|-6|min6|mi6)$/.test(suffix)) return { quality: "m6", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(m7|-7|min7|mi7)$/.test(suffix)) return { quality: "m7", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(m|-|min|mi)$/.test(suffix)) return { quality: "m", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };

  if (/^(6\/9|69|6add9)$/.test(suffix)) return { quality: "6_9", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(6|maj6|M6)$/.test(suffix)) return { quality: "6", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };

  if (/^(7alt|alt|7\(alt\))$/i.test(suffix)) return { quality: "7alt", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(sus|sus4)$/.test(suffix)) return { quality: "sus4", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(sus2)$/.test(suffix)) return { quality: "sus2", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(7sus|7sus4)$/.test(suffix)) return { quality: "7sus4", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(9sus|9sus4)$/.test(suffix)) return { quality: "9sus4", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(13sus|13sus4)$/.test(suffix)) return { quality: "13sus4", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };

  if (/^(add9|\(add9\))$/.test(suffix)) return { quality: "add9", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  if (/^(5)$/.test(suffix)) return { quality: "5", tensions: [], confidence: "exact", warnings, aliasesMatched };
  if (/^(aug|\+|\(#5\))$/.test(suffix)) return { quality: "aug", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };

  if (/^(7\+|\+7|7aug|7#5|7\(#5\))$/.test(suffix)) {
    if (suffix === "7+" && profile === "br") {
      warnings.push("Cifra 7+ e ambigua; em perfil br foi tratada como 7M legado.");
      return { quality: "maj7", tensions: [], confidence: "legacy", warnings, aliasesMatched: [original] };
    }
    return { quality: "7_sharp5", tensions: [], confidence: "profile", warnings, aliasesMatched: [original] };
  }

  if (/^(maj7|7M|Δ7?|\^7?)(.*)$/.test(suffix)) {
    const { tensions } = extractTensions(suffix.replace(/^(maj7|7M|Δ7?|\^7?)/, ""));
    if (tensions.includes("#11")) {
      return { quality: "maj7_sharp11", tensions, confidence: "profile", warnings, aliasesMatched: [original] };
    }
  }

  const dominantBase = lower.startsWith("7") || ["9", "11", "13"].includes(lower);
  if (dominantBase) {
    const baseQuality: ChordQuality = lower.startsWith("13")
      ? "13"
      : lower.startsWith("11")
        ? "11"
        : lower.startsWith("9")
          ? "9"
          : "7";
    const { tensions } = extractTensions(suffix.replace(/^(7|9|11|13)/, ""));
    if (tensions.includes("#9") && tensions.includes("b13")) {
      return { quality: "7_sharp9_b13", tensions, confidence: "profile", warnings, aliasesMatched: [original] };
    }
    if (tensions.includes("b9")) return { quality: "7_b9", tensions, confidence: "profile", warnings, aliasesMatched: [original] };
    if (tensions.includes("#9")) return { quality: "7_sharp9", tensions, confidence: "profile", warnings, aliasesMatched: [original] };
    if (tensions.includes("#11")) return { quality: "7_sharp11", tensions, confidence: "profile", warnings, aliasesMatched: [original] };
    if (tensions.includes("b13")) return { quality: "7_b13", tensions, confidence: "profile", warnings, aliasesMatched: [original] };
    if (/7\(b5\)|7b5/.test(suffix)) return { quality: "7_b5", tensions, confidence: "profile", warnings, aliasesMatched: [original] };
    return { quality: baseQuality, tensions, confidence: "exact", warnings, aliasesMatched };
  }

  warnings.push(`Cifra nao reconhecida pelo contrato Find Chord: ${original}`);
  return { quality: "maj", tensions: [], confidence: "ambiguous", warnings, aliasesMatched };
}

function notesFor(root: string | undefined, quality: ChordQuality): string[] {
  if (!root || quality === "N.C.") return [];
  return QUALITY_INTERVALS[quality]
    .map(interval => Note.pitchClass(Note.transpose(`${root}4`, interval)))
    .filter((note): note is string => !!note);
}

function suffixForQuality(quality: ChordQuality): string {
  const suffixes: Record<ChordQuality, string> = {
    "N.C.": "",
    maj: "",
    m: "m",
    aug: "aug",
    dim: "dim",
    "5": "5",
    sus2: "sus2",
    sus4: "sus4",
    "7": "7",
    maj7: "maj7",
    m7: "m7",
    mMaj7: "m(maj7)",
    m9: "m9",
    m11: "m11",
    "6": "6",
    m6: "m6",
    "6_9": "6/9",
    m6_9: "m6/9",
    "9": "9",
    "11": "11",
    "13": "13",
    "7sus4": "7sus4",
    "9sus4": "9sus4",
    "13sus4": "13sus4",
    dim7: "dim7",
    m7b5: "m7b5",
    "7alt": "7alt",
    "7_sharp5": "7(#5)",
    "7_b5": "7(b5)",
    "7_b9": "7(b9)",
    "7_sharp9": "7(#9)",
    "7_sharp11": "7(#11)",
    "7_b13": "7(b13)",
    "7_sharp9_b13": "7(#9,b13)",
    maj7_sharp11: "maj7(#11)",
    add9: "add9"
  };
  return suffixes[quality];
}

function displaySuffix(quality: ChordQuality, profile: ChordDisplayProfile): string {
  if (profile === "br") {
    const br: Partial<Record<ChordQuality, string>> = {
      maj7: "7M",
      mMaj7: "m7M",
      m7b5: "m7(b5)",
      dim: "°",
      dim7: "°7",
      "7_sharp5": "7(#5)",
      maj7_sharp11: "7M(#11)"
    };
    return br[quality] ?? suffixForQuality(quality);
  }

  if (profile === "jazz") {
    const jazz: Partial<Record<ChordQuality, string>> = {
      maj7: "maj7",
      m7b5: "ø",
      dim7: "°7",
      "7sus4": "7sus",
      "7_sharp9_b13": "7(#9,b13)"
    };
    return jazz[quality] ?? suffixForQuality(quality);
  }

  if (profile === "ireal") {
    const ireal: Partial<Record<ChordQuality, string>> = {
      maj7: "^",
      m: "-",
      m7: "-7",
      m6: "-6",
      m7b5: "ø",
      dim: "o",
      dim7: "o7",
      aug: "+"
    };
    return ireal[quality] ?? suffixForQuality(quality);
  }

  return suffixForQuality(quality);
}

export function resolveChordSymbol(
  raw: string,
  profile: ChordDisplayProfile = "plain"
): ResolvedChordSymbol {
  const normalizedInput = normalizeInput(raw);
  if (/^(N\.?C\.?|nochord)$/i.test(normalizedInput)) {
    return {
      raw,
      quality: "N.C.",
      tensions: [],
      omissions: [],
      normalized: "N.C.",
      display: "N.C.",
      aliasesMatched: [raw],
      confidence: "exact",
      warnings: [],
      notes: []
    };
  }

  const { body, bass } = splitBass(normalizedInput);
  const match = body.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) {
    return {
      raw,
      quality: "maj",
      tensions: [],
      omissions: [],
      normalized: normalizedInput,
      display: normalizedInput,
      aliasesMatched: [],
      confidence: "ambiguous",
      warnings: [`Cifra sem raiz reconhecivel: ${raw}`],
      notes: []
    };
  }

  const root = Note.pitchClass(match[1]) || match[1];
  const suffix = match[2];
  const quality = qualityFromSuffix(suffix, profile);
  const normalized = `${root}${suffixForQuality(quality.quality)}${bass ? `/${bass}` : ""}`;
  const display = `${root}${displaySuffix(quality.quality, profile)}${bass ? `/${bass}` : ""}`;

  return {
    raw,
    root,
    bass,
    quality: quality.quality,
    tensions: quality.tensions,
    omissions: [],
    normalized,
    display,
    aliasesMatched: quality.aliasesMatched,
    confidence: quality.confidence,
    warnings: quality.warnings,
    notes: notesFor(root, quality.quality)
  };
}

export function chordPitchClasses(chord: string, includeBass = true): string[] {
  const resolved = resolveChordSymbol(chord);
  const notes = [...resolved.notes];
  if (includeBass && resolved.bass) notes.push(resolved.bass);
  return Array.from(new Set(notes.map(note => Note.pitchClass(note)).filter(Boolean)));
}

export function chordRoot(chord: string): string | null {
  return resolveChordSymbol(chord).root || null;
}
