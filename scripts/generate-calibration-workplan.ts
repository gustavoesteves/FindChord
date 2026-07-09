import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { calibrationSetCsvPath } from "./select-promoted-import-calibration-set";

export const calibrationWorkplanReportPath = path.resolve(process.cwd(), "docs/reports/f71-calibration-workplan.md");
export const calibrationWorkplanCsvPath = path.resolve(process.cwd(), "docs/reports/f71-calibration-workplan.csv");

export interface CalibrationWorkplanCase {
  bucketId: string;
  bucketTitle: string;
  question: string;
  file: string;
  title: string;
  selectedCenter: string;
  selectedCenterSource: string;
  proposalCount: number;
  referenceOverlapCount: number;
  primaryProposalName: string;
  primaryChords: string;
  decisionType: string;
  action: string;
  risk: "baixo" | "medio" | "alto";
}

export function readCalibrationSet(csvPath = calibrationSetCsvPath): CalibrationWorkplanCase[] {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const [header, ...dataRows] = rows;
  const indexByName = new Map(header.map((name, index) => [name, index]));

  return dataRows
    .filter((row) => row.length > 1)
    .map((row) => {
      const base = {
        bucketId: cell(row, indexByName, "bucketId"),
        bucketTitle: cell(row, indexByName, "bucketTitle"),
        question: cell(row, indexByName, "question"),
        file: cell(row, indexByName, "file"),
        title: cell(row, indexByName, "title"),
        selectedCenter: cell(row, indexByName, "selectedCenter"),
        selectedCenterSource: cell(row, indexByName, "selectedCenterSource"),
        proposalCount: numberCell(row, indexByName, "proposalCount"),
        referenceOverlapCount: numberCell(row, indexByName, "referenceOverlapCount"),
        primaryProposalName: cell(row, indexByName, "primaryProposalName"),
        primaryChords: cell(row, indexByName, "primaryChords")
      };

      return {
        ...base,
        ...classifyWorkplanCase(base)
      };
    });
}

export function renderCalibrationWorkplanReport(cases: CalibrationWorkplanCase[]): string {
  const byDecision = groupBy(cases, (item) => item.decisionType);
  const byBucket = groupBy(cases, (item) => item.bucketId);
  const lines = [
    "# F71 - Plano de calibragem do Harmonizar",
    "",
    "Este plano transforma o conjunto F70 em uma pauta de escuta e decisao para o Harmonizar.",
    "A intencao e separar validacao positiva de pontos que pedem ajuste de centro, ranking, baixo, cromatismo ou linguagem.",
    "",
    "## Leitura geral",
    "",
    `- Casos analisados: ${cases.length}`,
    `- Tipos de decisao: ${byDecision.size}`,
    `- Categorias de origem: ${byBucket.size}`,
    "",
    "## Ordem sugerida",
    "",
    "1. Validar `harmonia basica` e `referencia forte` antes de mexer em rearmonizacao.",
    "2. Revisar `ranking` apenas depois que centro e janela estiverem coerentes.",
    "3. Testar `cromatismo` e `contraponto de baixo` com escuta, porque podem soar artificiais mesmo quando passam na métrica.",
    "4. Usar `menor`, `forma curta` e `alta densidade` como bordas de regressao.",
    "",
    "## Decisoes por tipo",
    ""
  ];

  for (const [decisionType, items] of byDecision.entries()) {
    lines.push(`### ${decisionType}`, "");
    lines.push("| Arquivo | Categoria | Centro | Risco | Acao |");
    lines.push("| --- | --- | --- | --- | --- |");
    for (const item of items) {
      lines.push(
        `| \`${item.file}\` | ${item.bucketTitle} | ${item.selectedCenter} (${centerSourceLabel(item.selectedCenterSource)}) | ${item.risk} | ${escapeTable(item.action)} |`
      );
    }
    lines.push("");
  }

  lines.push("## Pauta completa", "");
  lines.push("| Arquivo | Categoria | Proposta | Sobreposicao | Cifras geradas | Acao |");
  lines.push("| --- | --- | --- | ---: | --- | --- |");
  for (const item of cases) {
    lines.push(
      `| \`${item.file}\` | ${item.bucketTitle} | ${item.primaryProposalName} | ${item.referenceOverlapCount} | ${escapeTable(item.primaryChords)} | ${escapeTable(item.action)} |`
    );
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function renderCalibrationWorkplanCsv(cases: CalibrationWorkplanCase[]): string {
  const header = [
    "decisionType",
    "risk",
    "bucketId",
    "bucketTitle",
    "file",
    "title",
    "selectedCenter",
    "selectedCenterSource",
    "proposalCount",
    "referenceOverlapCount",
    "primaryProposalName",
    "action",
    "primaryChords"
  ];
  const rows = cases.map((item) => [
    item.decisionType,
    item.risk,
    item.bucketId,
    item.bucketTitle,
    item.file,
    item.title,
    item.selectedCenter,
    item.selectedCenterSource,
    String(item.proposalCount),
    String(item.referenceOverlapCount),
    item.primaryProposalName,
    item.action,
    item.primaryChords
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function runCalibrationWorkplan(): CalibrationWorkplanCase[] {
  const cases = readCalibrationSet();
  fs.mkdirSync(path.dirname(calibrationWorkplanReportPath), { recursive: true });
  fs.writeFileSync(calibrationWorkplanReportPath, renderCalibrationWorkplanReport(cases), "utf8");
  fs.writeFileSync(calibrationWorkplanCsvPath, renderCalibrationWorkplanCsv(cases), "utf8");
  return cases;
}

function classifyWorkplanCase(item: {
  bucketId: string;
  selectedCenterSource: string;
  proposalCount: number;
  referenceOverlapCount: number;
  primaryProposalName: string;
  primaryChords: string;
}): Pick<CalibrationWorkplanCase, "decisionType" | "action" | "risk"> {
  if (item.bucketId === "reference-strong") {
    return {
      decisionType: "Centro de referencia",
      action: "Comparar centro escolhido, baixo e cifra do autor; aceitar como ancora se a melodia nao contradiz.",
      risk: item.primaryProposalName.includes("Centro de referência") ? "baixo" : "medio"
    };
  }

  if (item.bucketId === "melody-first") {
    return {
      decisionType: "Harmonia basica",
      action: "Validar se a proposta melodia-primeiro ja serve como resposta simples antes de usar rearmonizacao.",
      risk: hasSlashBass(item.primaryChords) ? "medio" : "baixo"
    };
  }

  if (item.bucketId === "many-proposals") {
    return {
      decisionType: "Ranking de propostas",
      action: "Inspecionar as alternativas; se a primaria nao for a mais cantavel, ajustar criterio de ranking.",
      risk: item.proposalCount >= 14 ? "alto" : "medio"
    };
  }

  if (item.bucketId === "chromatic-linear") {
    return {
      decisionType: "Cromatismo",
      action: "Ouvir se diminutos e dominantes cromaticos funcionam como conducao ou se viraram artificio.",
      risk: "alto"
    };
  }

  if (item.bucketId === "bass-counterpoint") {
    return {
      decisionType: "Conducao de baixo",
      action: "Verificar se as inversoes suavizam a progressao sem esconder a funcao harmonica.",
      risk: hasSlashBass(item.primaryChords) ? "medio" : "baixo"
    };
  }

  if (item.bucketId === "minor-centers") {
    return {
      decisionType: "Centro menor",
      action: "Checar se o centro menor escolhido e funcional, modal ou apenas induzido pela cifra de referencia.",
      risk: item.selectedCenterSource === "reference" ? "medio" : "alto"
    };
  }

  if (item.bucketId === "short-forms") {
    return {
      decisionType: "Forma curta",
      action: "Validar se a primeira janela representa a obra ou se a escolha precisa de contexto formal.",
      risk: "medio"
    };
  }

  if (item.bucketId === "dense-harmony") {
    return {
      decisionType: "Legibilidade",
      action: "Conferir se a cifra gerada e legivel para usuario antes de mostrar alternativas mais densas.",
      risk: item.primaryChords.length > 80 ? "alto" : "medio"
    };
  }

  return {
    decisionType: "Revisao geral",
    action: "Inspecionar musicalmente antes de promover ajuste.",
    risk: "medio"
  };
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

function hasSlashBass(chords: string): boolean {
  return /\/[A-G](?:#|b)?(?:\s|$)/.test(chords);
}

function cell(row: string[], indexByName: Map<string, number>, name: string): string {
  return row[indexByName.get(name) ?? -1] ?? "";
}

function numberCell(row: string[], indexByName: Map<string, number>, name: string): number {
  return Number(cell(row, indexByName, name) || "0");
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const group = key(item);
    grouped.set(group, [...(grouped.get(group) ?? []), item]);
  }
  return grouped;
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
  const cases = runCalibrationWorkplan();
  console.log(`Calibration workplan generated: ${cases.length} cases.`);
  console.log(`Report: ${path.relative(process.cwd(), calibrationWorkplanReportPath)}`);
  console.log(`CSV: ${path.relative(process.cwd(), calibrationWorkplanCsvPath)}`);
}
