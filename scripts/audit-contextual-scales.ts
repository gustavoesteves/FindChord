import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { applyReferenceCenterToPhraseContext } from "../src/utils/music/analysis/strategies/ReferenceAwarePhraseContext";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { buildContextualMaterialCandidates, type ContextualMaterialCandidate } from "../src/utils/music/theory/contextualMaterialCandidates";
import { selectMelodyForHarmony } from "../src/domains/harmonizer/services/harmonizerService";
import { timelineContextForAnchors } from "../src/utils/music/analysis/scoreTimelineContext";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");
const MUSIC_DIR = path.resolve(process.cwd(), "docs/musics");

export interface ContextualMaterialAuditRow {
  file: string;
  measure: number;
  chord: string;
  primary?: string;
  primaryFunction?: string;
  melodyCoverage?: number;
  status: "ok" | "no-candidate" | "low-melody-coverage" | "generic-altered-fallback";
}

export interface ContextualMaterialAuditReport {
  files: number;
  harmonyEvents: number;
  rows: ContextualMaterialAuditRow[];
  noCandidateCount: number;
  lowMelodyCoverageCount: number;
  genericAlteredFallbackCount: number;
}

function musicXmlFiles(directory: string, relative = ""): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryRelative = path.join(relative, entry.name);
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return musicXmlFiles(fullPath, entryRelative);
    return entry.name.endsWith(".musicxml") ? [entryRelative] : [];
  }).sort();
}

function toAnchors(notes: any[]): MelodicAnchor[] {
  return notes.map(note => ({
    measureIndex: note.measure,
    pitch: note.alter === 1 ? `${note.step}#` : note.alter === -1 ? `${note.step}b` : note.step,
    duration: note.durationTicks,
    startTick: note.tickStart,
    endTick: note.tickEnd
  }));
}

function isAlteredChord(chord: string): boolean {
  return /(?:b5|#5|b9|#9|#11|b13|alt)/i.test(chord);
}

function isGenericFallback(candidate: ContextualMaterialCandidate | undefined): boolean {
  return candidate?.type === "major" || candidate?.type === "minor pentatonic";
}

export function auditContextualMaterialLibrary(): ContextualMaterialAuditReport {
  const rows: ContextualMaterialAuditRow[] = [];
  let harmonyEvents = 0;

  for (const file of musicXmlFiles(MUSIC_DIR)) {
    const snapshot = parseMusicXML(fs.readFileSync(path.join(MUSIC_DIR, file), "utf8"));
    const anchors = toAnchors(snapshot.notes);
    const phraseContext = applyReferenceCenterToPhraseContext(
      PhraseAnalysisEngine.analyzePhrase(
        anchors,
        timelineContextForAnchors(snapshot, anchors).keySignature
      ),
      snapshot.harmonies
    );

    for (let index = 0; index < snapshot.harmonies.length; index++) {
      const harmony = snapshot.harmonies[index];
      harmonyEvents++;
      const candidates = buildContextualMaterialCandidates({
        chord: harmony.harmony,
        previousChord: snapshot.harmonies[index - 1]?.harmony,
        nextChord: snapshot.harmonies[index + 1]?.harmony,
        tonalCenter: phraseContext.selectedCenter,
        melody: selectMelodyForHarmony(harmony, anchors),
        resolutionTarget: snapshot.harmonies[index + 1]?.harmony.match(/^[A-G](?:#|b)?/)?.[0]
      });
      const primary = candidates[0];
      const status: ContextualMaterialAuditRow["status"] = candidates.length === 0
        ? "no-candidate"
        : isAlteredChord(harmony.harmony) && isGenericFallback(primary)
          ? "generic-altered-fallback"
          : primary.melodyNotes.length > 0 && primary.melodyCoverage < 0.5
            ? "low-melody-coverage"
            : "ok";

      rows.push({
        file,
        measure: harmony.measure,
        chord: harmony.harmony,
        primary: primary?.name,
        primaryFunction: primary?.harmonicFunction,
        melodyCoverage: primary?.melodyCoverage,
        status
      });
    }
  }

  return {
    files: musicXmlFiles(MUSIC_DIR).length,
    harmonyEvents,
    rows,
    noCandidateCount: rows.filter(row => row.status === "no-candidate").length,
    lowMelodyCoverageCount: rows.filter(row => row.status === "low-melody-coverage").length,
    genericAlteredFallbackCount: rows.filter(row => row.status === "generic-altered-fallback").length
  };
}

export function renderContextualMaterialAuditMarkdown(report: ContextualMaterialAuditReport): string {
  const issues = report.rows.filter(row => row.status !== "ok");
  const lines = [
    "# F119 - Auditoria temporal de materiais contextuais no catalogo real",
    "",
    "## Resumo",
    "",
    `- Arquivos analisados: ${report.files}`,
    `- Eventos de cifra analisados: ${report.harmonyEvents}`,
    `- Sem candidata: ${report.noCandidateCount}`,
    `- Baixa cobertura melódica: ${report.lowMelodyCoverageCount}`,
    `- Fallback generico em acorde alterado: ${report.genericAlteredFallbackCount}`,
    "",
    "## Casos para revisao",
    "",
    issues.length === 0
      ? "Nenhum caso foi marcado pela triagem automatica."
      : "| Arquivo | Compasso | Cifra | Principal | Funcao | Cobertura | Status |\n| --- | ---: | --- | --- | --- | ---: | --- |\n"
        + issues.slice(0, 80).map(row => `| ${row.file} | ${row.measure} | ${row.chord} | ${row.primary || "-"} | ${row.primaryFunction || "-"} | ${row.melodyCoverage === undefined ? "-" : `${Math.round(row.melodyCoverage * 100)}%`} | ${row.status} |`).join("\n"),
    "",
    "A triagem indica pontos de leitura para revisão teórica e musical; não substitui a escuta nem a comparação com a partitura do autor."
  ];
  return `${lines.join("\n")}\n`;
}

// Compatibilidade com a nomenclatura antiga de "escala contextual".
export type ContextualScaleAuditRow = ContextualMaterialAuditRow;
export type ContextualScaleAuditReport = ContextualMaterialAuditReport;
export const auditContextualScaleLibrary = auditContextualMaterialLibrary;
export const renderContextualScaleAuditMarkdown = renderContextualMaterialAuditMarkdown;
