import { Note } from "tonal";
import { fileURLToPath } from "node:url";
import {
  CHORD_REGISTRY,
  type ChordQuality
} from "../src/utils/music/constants/chordRegistry";
import type { ChordCandidate } from "../src/utils/music/models/ChordCandidate";
import { buildLocalChordMaterialReadings } from "../src/utils/music/theory/localChordMaterials";
import { buildWriterMaterialPalette } from "../src/domains/writer/services/writerMaterialPalette";

export interface WriterPlayableIdeasQualityRow {
  quality: ChordQuality;
  chord: string;
  totalItems: number;
  playableIdeas: number;
  supportMaps: number;
  playableSourceTypes: string[];
  supportMapSourceTypes: string[];
}

export interface WriterPlayableIdeasAuditReport {
  qualities: number;
  totalItems: number;
  playableIdeas: number;
  supportMaps: number;
  rows: WriterPlayableIdeasQualityRow[];
}

function uniqueNotes(notes: string[]): string[] {
  const seen = new Set<number>();
  return notes.filter(note => {
    const chroma = Note.chroma(note);
    if (chroma === null || seen.has(chroma)) return false;
    seen.add(chroma);
    return true;
  });
}

function noteForInterval(root: string, interval: string): string {
  return Note.pitchClass(Note.transpose(root, interval)) || Note.transpose(root, interval);
}

export function chordCandidateForAuditQuality(quality: ChordQuality): ChordCandidate {
  const definition = CHORD_REGISTRY[quality];
  const root = "C";
  const notes = uniqueNotes(definition.intervals.map(interval => noteForInterval(root, interval)));
  const notationInternational = `${root}${definition.notation.international}`;

  return {
    root,
    quality,
    intervals: [...definition.intervals],
    notes,
    drawnNotes: notes,
    score: 1,
    confidence: 1,
    omissions: [],
    additions: [],
    notationInternational,
    notationBrazilian: `${root}${definition.notation.brazilian}`,
    notationAcademic: `${root}${definition.notation.academic}`,
    isIncomplete: false
  };
}

export function auditWriterPlayableIdeas(): WriterPlayableIdeasAuditReport {
  const rows = (Object.keys(CHORD_REGISTRY) as ChordQuality[]).map(quality => {
    const chord = chordCandidateForAuditQuality(quality);
    const palette = buildWriterMaterialPalette(buildLocalChordMaterialReadings(chord));
    const playableItems = palette.filter(item => item.hasPlayableIdea);
    const supportMaps = palette.filter(item => !item.hasPlayableIdea);

    return {
      quality,
      chord: chord.notationInternational,
      totalItems: palette.length,
      playableIdeas: playableItems.length,
      supportMaps: supportMaps.length,
      playableSourceTypes: playableItems.map(item => item.source.type),
      supportMapSourceTypes: supportMaps.map(item => item.source.type)
    };
  });

  return {
    qualities: rows.length,
    totalItems: rows.reduce((sum, row) => sum + row.totalItems, 0),
    playableIdeas: rows.reduce((sum, row) => sum + row.playableIdeas, 0),
    supportMaps: rows.reduce((sum, row) => sum + row.supportMaps, 0),
    rows
  };
}

export function renderWriterPlayableIdeasAuditMarkdown(report: WriterPlayableIdeasAuditReport): string {
  const lines = [
    "# F360.3 - Auditoria de ideias tocaveis do Writer",
    "",
    `Qualidades: ${report.qualities}`,
    `Itens de paleta: ${report.totalItems}`,
    `Ideias tocaveis: ${report.playableIdeas}`,
    `Mapas de apoio: ${report.supportMaps}`,
    "",
    "| Qualidade | Acorde | Ideias | Mapas | Fontes sem celula |",
    "|---|---:|---:|---:|---|"
  ];

  for (const row of report.rows) {
    lines.push(`| ${[
      row.quality,
      row.chord,
      String(row.playableIdeas),
      String(row.supportMaps),
      row.supportMapSourceTypes.join(", ") || "-"
    ].join(" | ")} |`);
  }

  return `${lines.join("\n")}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.stdout.write(renderWriterPlayableIdeasAuditMarkdown(auditWriterPlayableIdeas()));
}
