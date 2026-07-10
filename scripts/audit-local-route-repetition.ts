import fs from "node:fs";
import path from "node:path";
import { proposalChordSequenceIdentity } from "../src/utils/music/analysis/strategies/ProposalHarmonicIdentity";
import {
  analyzeProposalCurationForFile,
  proposalCurationMusicXmlFiles,
  type CuratedProposalIdea
} from "./audit-proposal-curation";

export interface LocalRouteRepetitionRow {
  file: string;
  title: string;
  sequence: string;
  occurrences: number;
  locations: string;
  names: string;
}

export function auditLocalRouteRepetitionForFile(file: string): LocalRouteRepetitionRow[] {
  const analysis = analyzeProposalCurationForFile(file);
  const grouped = new Map<string, CuratedProposalIdea[]>();

  for (const idea of analysis.visibleIdeas.filter(idea => idea.origin === "local")) {
    const sequence = proposalChordSequenceIdentity(idea.proposal);
    grouped.set(sequence, [...(grouped.get(sequence) || []), idea]);
  }

  return Array.from(grouped.entries())
    .filter(([, ideas]) => ideas.length > 1)
    .map(([sequence, ideas]) => ({
      file,
      title: analysis.row.title,
      sequence,
      occurrences: ideas.length,
      locations: ideas.map(idea => idea.label.split(":")[0]).join("; "),
      names: Array.from(new Set(ideas.map(idea => idea.label.split(": ").slice(1).join(": ")))).join("; ")
    }));
}

export function collectLocalRouteRepetitionAudit(): LocalRouteRepetitionRow[] {
  return proposalCurationMusicXmlFiles().flatMap(auditLocalRouteRepetitionForFile);
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: LocalRouteRepetitionRow[]): string {
  const headers: (keyof LocalRouteRepetitionRow)[] = [
    "file", "title", "sequence", "occurrences", "locations", "names"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(rows: LocalRouteRepetitionRow[]): string {
  const files = new Set(rows.map(row => row.file));
  const lines = [
    "# F111 - Repeticao de rotas nos trechos locais",
    "",
    "A auditoria compara trechos locais pela sequencia de cifras, ignorando apenas os numeros dos compassos.",
    "",
    `- Partituras com repeticao local: ${files.size}`,
    `- Grupos de rotas repetidas: ${rows.length}`,
    `- Ocorrencias nesses grupos: ${rows.reduce((sum, row) => sum + row.occurrences, 0)}`,
    "",
    "| Arquivo | Ocorrencias | Locais | Estrategias | Sequencia |",
    "| --- | ---: | --- | --- | --- |"
  ];
  for (const row of rows.slice(0, 80)) {
    lines.push(`| ${[row.file, row.occurrences, row.locations, row.names, row.sequence].join(" | ")} |`);
  }
  lines.push("", "## Leitura", "", "Uma rota repetida em locais diferentes pode ser válida, mas pode ocupar um único card com vários locais aplicáveis.", "");
  return lines.join("\n");
}

export function writeLocalRouteRepetitionAudit(rows = collectLocalRouteRepetitionAudit()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f111-local-route-repetition.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f111-local-route-repetition.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
}
