import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promotedImportAuditCsvPath } from "./audit-promoted-import-corpus";

export const calibrationSetReportPath = path.resolve(process.cwd(), "docs/reports/f70-promoted-import-calibration-set.md");
export const calibrationSetCsvPath = path.resolve(process.cwd(), "docs/reports/f70-promoted-import-calibration-set.csv");

export interface CalibrationCandidate {
  file: string;
  sourceId: string;
  title: string;
  status: string;
  measures: number;
  noteCount: number;
  harmonyCount: number;
  keySignature: string;
  proposalCount: number;
  referenceOverlapCount: number;
  selectedCenter: string;
  selectedCenterSource: string;
  primaryProposalName: string;
  primaryChords: string;
}

interface CalibrationBucket {
  id: string;
  title: string;
  question: string;
  candidates: CalibrationCandidate[];
}

interface SelectedCalibrationCase {
  bucketId: string;
  bucketTitle: string;
  question: string;
  candidate: CalibrationCandidate;
}

export function readCalibrationCandidates(csvPath = promotedImportAuditCsvPath): CalibrationCandidate[] {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const [header, ...dataRows] = rows;
  const indexByName = new Map(header.map((name, index) => [name, index]));

  return dataRows
    .filter((row) => row.length > 1)
    .map((row) => ({
      file: cell(row, indexByName, "file"),
      sourceId: cell(row, indexByName, "sourceId"),
      title: cell(row, indexByName, "title"),
      status: cell(row, indexByName, "status"),
      measures: numberCell(row, indexByName, "measures"),
      noteCount: numberCell(row, indexByName, "noteCount"),
      harmonyCount: numberCell(row, indexByName, "harmonyCount"),
      keySignature: cell(row, indexByName, "keySignature"),
      proposalCount: numberCell(row, indexByName, "proposalCount"),
      referenceOverlapCount: numberCell(row, indexByName, "referenceOverlapCount"),
      selectedCenter: cell(row, indexByName, "selectedCenter"),
      selectedCenterSource: cell(row, indexByName, "selectedCenterSource"),
      primaryProposalName: cell(row, indexByName, "primaryProposalName"),
      primaryChords: cell(row, indexByName, "primaryChords")
    }));
}

export function selectCalibrationSet(candidates: CalibrationCandidate[]): SelectedCalibrationCase[] {
  const harmonized = candidates.filter((candidate) => candidate.status === "harmonized");
  const buckets: CalibrationBucket[] = [
    {
      id: "reference-strong",
      title: "Referencia forte",
      question: "Quando a cifra do autor e muito presente, o centro escolhido e a proposta fazem sentido musical?",
      candidates: rank(harmonized.filter((candidate) => candidate.selectedCenterSource === "reference" && candidate.referenceOverlapCount >= 8))
    },
    {
      id: "melody-first",
      title: "Melodia primeiro",
      question: "Quando a melodia sustenta a escolha, a harmonia basica evita excesso de dependencia da referencia?",
      candidates: rank(harmonized.filter((candidate) => candidate.selectedCenterSource === "melody"))
    },
    {
      id: "many-proposals",
      title: "Muitas propostas",
      question: "Quando ha muitas rotas possiveis, o ranking escolhe a proposta mais clara?",
      candidates: rank(harmonized.filter((candidate) => candidate.proposalCount >= 12))
    },
    {
      id: "chromatic-linear",
      title: "Cromatico linear",
      question: "Quando o motor escolhe cromatismo, isso soa como condução funcional ou como artificio?",
      candidates: rank(harmonized.filter((candidate) => candidate.primaryProposalName.includes("Cromático")))
    },
    {
      id: "bass-counterpoint",
      title: "Contraponto de baixo",
      question: "A conducao do baixo esta ajudando a frase ou criando complexidade antes da hora?",
      candidates: rank(harmonized.filter((candidate) => candidate.primaryProposalName.includes("Contraponto")))
    },
    {
      id: "minor-centers",
      title: "Centros menores",
      question: "O sistema separa bem menor funcional, menor modal e centro local sugerido pela referencia?",
      candidates: rank(harmonized.filter((candidate) => candidate.selectedCenter.includes("minor")))
    },
    {
      id: "short-forms",
      title: "Formas curtas",
      question: "Em musicas curtas, o app encontra uma janela representativa sem superinterpretar pouca informacao?",
      candidates: rank(harmonized.filter((candidate) => candidate.measures <= 16))
    },
    {
      id: "dense-harmony",
      title: "Alta densidade harmonica",
      question: "Em cifras densas, a proposta gerada permanece legivel para o usuario?",
      candidates: rank(harmonized.filter((candidate) => candidate.harmonyCount >= 60))
    }
  ];

  const selected: SelectedCalibrationCase[] = [];
  const used = new Set<string>();

  for (const bucket of buckets) {
    const uniqueCandidates = bucket.candidates.filter((candidate) => !used.has(candidate.file)).slice(0, 3);
    for (const candidate of uniqueCandidates) {
      used.add(candidate.file);
      selected.push({
        bucketId: bucket.id,
        bucketTitle: bucket.title,
        question: bucket.question,
        candidate
      });
    }
  }

  return selected;
}

export function renderCalibrationSetReport(selected: SelectedCalibrationCase[], allCandidates: CalibrationCandidate[]): string {
  const byBucket = new Map<string, SelectedCalibrationCase[]>();
  for (const item of selected) {
    byBucket.set(item.bucketId, [...(byBucket.get(item.bucketId) ?? []), item]);
  }

  const lines = [
    "# F70 - Conjunto de calibragem do corpus importado",
    "",
    "Este relatorio escolhe um subconjunto pequeno das musicas importadas para calibrar o Harmonizar sem depender de olhar os 181 arquivos de uma vez.",
    "",
    "## Leitura geral",
    "",
    `- Corpus de entrada: ${allCandidates.length} arquivos auditados na F69`,
    `- Casos selecionados: ${selected.length}`,
    `- Categorias: ${byBucket.size}`,
    "",
    "## Casos selecionados",
    ""
  ];

  for (const [bucketId, items] of byBucket.entries()) {
    const first = items[0];
    lines.push(`### ${first.bucketTitle}`, "");
    lines.push(`- Pergunta: ${first.question}`);
    lines.push("");
    lines.push("| Arquivo | Centro | Origem centro | Propostas | Sobreposicao | Cifras geradas |");
    lines.push("| --- | --- | --- | ---: | ---: | --- |");
    for (const item of items) {
      const candidate = item.candidate;
      lines.push(
        `| \`${candidate.file}\` | ${candidate.selectedCenter} | ${centerSourceLabel(candidate.selectedCenterSource)} | ${candidate.proposalCount} | ${candidate.referenceOverlapCount} | ${escapeTable(candidate.primaryChords)} |`
      );
    }
    lines.push("");
    void bucketId;
  }

  lines.push("## Como usar", "");
  lines.push("- Primeiro, ouvir/inspecionar os casos de `Referencia forte` e `Melodia primeiro` para calibrar o caminho basico.");
  lines.push("- Depois, usar `Cromatico linear`, `Contraponto de baixo` e `Muitas propostas` para testar ranking e linguagem de explicacao.");
  lines.push("- Por fim, usar `Centros menores`, `Formas curtas` e `Alta densidade harmonica` como testes de borda musical.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function renderCalibrationSetCsv(selected: SelectedCalibrationCase[]): string {
  const header = [
    "bucketId",
    "bucketTitle",
    "question",
    "file",
    "title",
    "selectedCenter",
    "selectedCenterSource",
    "proposalCount",
    "referenceOverlapCount",
    "primaryProposalName",
    "primaryChords"
  ];
  const rows = selected.map(({ bucketId, bucketTitle, question, candidate }) => [
    bucketId,
    bucketTitle,
    question,
    candidate.file,
    candidate.title,
    candidate.selectedCenter,
    candidate.selectedCenterSource,
    String(candidate.proposalCount),
    String(candidate.referenceOverlapCount),
    candidate.primaryProposalName,
    candidate.primaryChords
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function runCalibrationSetSelection(): SelectedCalibrationCase[] {
  const candidates = readCalibrationCandidates();
  const selected = selectCalibrationSet(candidates);
  fs.mkdirSync(path.dirname(calibrationSetReportPath), { recursive: true });
  fs.writeFileSync(calibrationSetReportPath, renderCalibrationSetReport(selected, candidates), "utf8");
  fs.writeFileSync(calibrationSetCsvPath, renderCalibrationSetCsv(selected), "utf8");
  return selected;
}

function rank(candidates: CalibrationCandidate[]): CalibrationCandidate[] {
  return [...candidates].sort((a, b) => (
    b.referenceOverlapCount - a.referenceOverlapCount
    || b.proposalCount - a.proposalCount
    || b.harmonyCount - a.harmonyCount
    || a.file.localeCompare(b.file)
  ));
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cellValue = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (quoted && char === "\"" && next === "\"") {
      cellValue += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      quoted = !quoted;
      continue;
    }

    if (!quoted && char === ",") {
      row.push(cellValue);
      cellValue = "";
      continue;
    }

    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cellValue);
      rows.push(row);
      row = [];
      cellValue = "";
      continue;
    }

    cellValue += char;
  }

  if (cellValue || row.length > 0) {
    row.push(cellValue);
    rows.push(row);
  }

  return rows.filter((item) => item.some(Boolean));
}

function cell(row: string[], indexByName: Map<string, number>, name: string): string {
  return row[indexByName.get(name) ?? -1] ?? "";
}

function numberCell(row: string[], indexByName: Map<string, number>, name: string): number {
  return Number(cell(row, indexByName, name) || "0");
}

function centerSourceLabel(source: string): string {
  if (source === "reference") return "referencia";
  if (source === "melody") return "melodia";
  return source || "sem origem";
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const selected = runCalibrationSetSelection();
  console.log(`Calibration set selected: ${selected.length} cases.`);
  console.log(`Report: ${path.relative(process.cwd(), calibrationSetReportPath)}`);
  console.log(`CSV: ${path.relative(process.cwd(), calibrationSetCsvPath)}`);
}
