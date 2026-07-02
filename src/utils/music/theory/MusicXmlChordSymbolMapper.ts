import type { ChordQuality, ResolvedChordSymbol } from "./ChordSymbolResolver";
import { resolveChordSymbol } from "./ChordSymbolResolver";

export type MusicXmlDegreeType = "add" | "alter" | "subtract";

export interface MusicXmlPitchStepAlter {
  step: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  alter: -2 | -1 | 0 | 1 | 2;
}

export interface MusicXmlHarmonyDegree {
  value: number;
  alter: -2 | -1 | 0 | 1 | 2;
  type: MusicXmlDegreeType;
}

export interface MusicXmlHarmonyMapping {
  root?: MusicXmlPitchStepAlter;
  bass?: MusicXmlPitchStepAlter;
  kind: string;
  kindText?: string;
  degrees: MusicXmlHarmonyDegree[];
  display: string;
  normalized: string;
  warnings: string[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const QUALITY_KIND: Partial<Record<ChordQuality, string>> = {
  maj: "major",
  m: "minor",
  aug: "augmented",
  dim: "diminished",
  "5": "power",
  sus2: "suspended-second",
  sus4: "suspended-fourth",
  "7": "dominant",
  maj7: "major-seventh",
  m7: "minor-seventh",
  mMaj7: "major-minor",
  m9: "minor-ninth",
  m11: "minor-11th",
  "6": "major-sixth",
  m6: "minor-sixth",
  "9": "dominant-ninth",
  "11": "dominant-11th",
  "13": "dominant-13th",
  dim7: "diminished-seventh",
  m7b5: "half-diminished",
  add9: "major"
};

function degree(value: number, alter: MusicXmlHarmonyDegree["alter"], type: MusicXmlDegreeType): MusicXmlHarmonyDegree {
  return { value, alter, type };
}

function pitchToStepAlter(pitch: string | undefined): MusicXmlPitchStepAlter | undefined {
  const match = pitch?.match(/^([A-G])((?:#|b){0,2})$/);
  if (!match) return undefined;
  const accidental = match[2];
  const alter = accidental === "##"
    ? 2
    : accidental === "#"
      ? 1
      : accidental === "b"
        ? -1
        : accidental === "bb"
          ? -2
          : 0;
  return {
    step: match[1] as MusicXmlPitchStepAlter["step"],
    alter
  };
}

function qualityDegrees(quality: ChordQuality): MusicXmlHarmonyDegree[] {
  switch (quality) {
    case "6_9":
    case "m6_9":
      return [degree(9, 0, "add")];
    case "7sus4":
      return [degree(7, -1, "add")];
    case "9sus4":
      return [degree(7, -1, "add"), degree(9, 0, "add")];
    case "13sus4":
      return [degree(7, -1, "add"), degree(9, 0, "add"), degree(13, 0, "add")];
    case "7_sharp5":
      return [degree(5, 1, "alter")];
    case "7_b5":
      return [degree(5, -1, "alter")];
    case "7_b9":
      return [degree(9, -1, "add")];
    case "7_sharp9":
      return [degree(9, 1, "add")];
    case "7_sharp11":
      return [degree(11, 1, "add")];
    case "7_b13":
      return [degree(13, -1, "add")];
    case "7_sharp9_b13":
      return [degree(9, 1, "add"), degree(13, -1, "add")];
    case "maj7_sharp11":
      return [degree(11, 1, "add")];
    case "add9":
      return [degree(9, 0, "add")];
    default:
      return [];
  }
}

function qualityKind(quality: ChordQuality): string {
  if (quality === "6_9") return "major-sixth";
  if (quality === "m6_9") return "minor-sixth";
  if (["7sus4", "9sus4", "13sus4"].includes(quality)) return "suspended-fourth";
  if (quality === "7alt") return "dominant";
  if (quality.startsWith("7_")) return "dominant";
  if (quality === "maj7_sharp11") return "major-seventh";
  return QUALITY_KIND[quality] || "major";
}

function qualityKindText(resolved: ResolvedChordSymbol): string | undefined {
  if (resolved.quality === "N.C.") return undefined;
  if (resolved.quality === "maj") return resolved.display.replace(/^[A-G](?:#|b)?/, "").replace(/\/[A-G](?:#|b)?$/, "") || undefined;
  return resolved.display.replace(/^[A-G](?:#|b)?/, "").replace(/\/[A-G](?:#|b)?$/, "");
}

export function toMusicXmlHarmony(rawChord: string): MusicXmlHarmonyMapping {
  const resolved = resolveChordSymbol(rawChord, "plain");
  if (resolved.quality === "N.C.") {
    return {
      kind: "none",
      degrees: [],
      display: resolved.display,
      normalized: resolved.normalized,
      warnings: resolved.warnings
    };
  }

  const root = pitchToStepAlter(resolved.root);
  const bass = pitchToStepAlter(resolved.bass);
  const warnings = [...resolved.warnings];
  if (!root) warnings.push(`MusicXML root nao resolvido para ${rawChord}`);

  return {
    root,
    bass,
    kind: qualityKind(resolved.quality),
    kindText: qualityKindText(resolved),
    degrees: qualityDegrees(resolved.quality),
    display: resolved.display,
    normalized: resolved.normalized,
    warnings
  };
}

function renderStepAlter(prefix: "root" | "bass", pitch: MusicXmlPitchStepAlter): string {
  const alter = pitch.alter !== 0 ? `\n    <${prefix}-alter>${pitch.alter}</${prefix}-alter>` : "";
  return `  <${prefix}>\n    <${prefix}-step>${pitch.step}</${prefix}-step>${alter}\n  </${prefix}>`;
}

function renderDegree(degreeItem: MusicXmlHarmonyDegree): string {
  return [
    "  <degree>",
    `    <degree-value>${degreeItem.value}</degree-value>`,
    `    <degree-alter>${degreeItem.alter}</degree-alter>`,
    `    <degree-type>${degreeItem.type}</degree-type>`,
    "  </degree>"
  ].join("\n");
}

export function renderMusicXmlHarmony(rawChord: string): string {
  const mapping = toMusicXmlHarmony(rawChord);
  const parts = ["<harmony>"];

  if (mapping.root) {
    parts.push(renderStepAlter("root", mapping.root));
  }

  const kindText = mapping.kindText ? ` text="${escapeXml(mapping.kindText)}"` : "";
  parts.push(`  <kind${kindText}>${escapeXml(mapping.kind)}</kind>`);

  if (mapping.bass) {
    parts.push(renderStepAlter("bass", mapping.bass));
  }

  for (const degreeItem of mapping.degrees) {
    parts.push(renderDegree(degreeItem));
  }

  parts.push("</harmony>");
  return parts.join("\n");
}
