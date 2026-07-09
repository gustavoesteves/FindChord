import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export interface CatalogSource {
  id: string;
  file: string;
  label: string;
}

export interface CatalogSongStart {
  page: number;
  title: string;
  composer?: string;
}

export interface SplitSongResult extends CatalogSongStart {
  sourceId: string;
  sourceFile: string;
  sourceLabel: string;
  startPage: number;
  endPage: number;
  measureCount: number;
  outputFile: string;
  status: "ok" | "empty";
}

export const importsDir = path.resolve(process.cwd(), "docs/imports");
export const splitOutputDir = path.resolve(process.cwd(), "docs/imports/split");
export const splitReportPath = path.resolve(process.cwd(), "docs/reports/f65-catalog-split-report.md");

interface CreditBlock {
  page: number;
  type?: string;
  words: string;
}

interface MeasureBlock {
  xml: string;
  page: number;
}

const mxlReadBuffer = 128 * 1024 * 1024;

export function extractCatalogSongStarts(xml: string): CatalogSongStart[] {
  const workTitle = decodeXmlText(xml.match(/<work-title>([\s\S]*?)<\/work-title>/)?.[1] ?? "");
  const credits = extractCreditBlocks(xml);
  const composersByPage = new Map<number, string>();

  for (const credit of credits) {
    if (credit.type === "composer" && credit.words) {
      composersByPage.set(credit.page, credit.words);
    }
  }

  return credits
    .filter((credit) => credit.type === "title")
    .filter((credit) => credit.page > 1)
    .filter((credit) => credit.words.length > 0 && normalizeTitle(credit.words) !== normalizeTitle(workTitle))
    .map((credit) => ({
      page: credit.page,
      title: credit.words,
      composer: composersByPage.get(credit.page)
    }))
    .sort((a, b) => a.page - b.page);
}

export function discoverCatalogSources(importDir = importsDir): CatalogSource[] {
  return fs
    .readdirSync(importDir)
    .filter((fileName) => /\.(musicxml|xml|mxl)$/i.test(fileName))
    .filter((fileName) => !fileName.startsWith("."))
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => {
      const file = path.join(importDir, fileName);
      const xml = readCatalogXml(file);
      const title = decodeXmlText(xml.match(/<work-title>([\s\S]*?)<\/work-title>/)?.[1] ?? "");

      return {
        id: catalogSourceId(fileName),
        file: path.relative(process.cwd(), file),
        label: title || readableSourceLabel(fileName)
      };
    });
}

export function splitCatalogXml(source: CatalogSource, xml: string, outputDir: string): SplitSongResult[] {
  const measures = extractMeasuresByPage(xml);
  const maxMeasurePage = Math.max(...measures.map((measure) => measure.page));
  const starts = mergeContinuationTitles(
    extractCatalogSongStarts(xml).filter((start) => start.page <= maxMeasurePage && normalizeTitle(start.title) !== "index")
  );
  const parts = extractScoreParts(xml);
  const scoreHeader = buildScoreHeader(xml);
  const usedNames = new Set<string>();

  if (parts.length !== 1) {
    throw new Error(`${source.file}: esperado 1 <part>, encontrado ${parts.length}`);
  }

  return starts.map((start, index) => {
    const next = starts[index + 1];
    const endPage = next ? next.page - 1 : Math.max(...measures.map((measure) => measure.page));
    const selectedMeasures = measures.filter((measure) => measure.page >= start.page && measure.page <= endPage);
    const fileName = uniqueFileName(
      `${source.id}-${String(start.page).padStart(3, "0")}-${sanitizeFileName(start.title)}.musicxml`,
      usedNames
    );
    const outputPath = path.join(outputDir, fileName);

    if (selectedMeasures.length > 0) {
      const songXml = renderSongXml({
        header: scoreHeader,
        partId: parts[0].id,
        title: start.title,
        composer: start.composer,
        measures: selectedMeasures
      });
      fs.writeFileSync(outputPath, songXml);
    }

    return {
      ...start,
      sourceId: source.id,
      sourceFile: source.file,
      sourceLabel: source.label,
      startPage: start.page,
      endPage,
      measureCount: selectedMeasures.length,
      outputFile: path.relative(process.cwd(), outputPath),
      status: selectedMeasures.length > 0 ? "ok" : "empty"
    };
  });
}

function mergeContinuationTitles(starts: CatalogSongStart[]): CatalogSongStart[] {
  const merged: CatalogSongStart[] = [];

  for (const start of starts) {
    const previous = merged.at(-1);
    if (previous && isContinuationTitle(previous.title, start.title)) {
      continue;
    }
    merged.push(start);
  }

  return merged;
}

function isContinuationTitle(previousTitle: string, nextTitle: string): boolean {
  const continuationPattern = /\(\s*[2-9]\s*\/\s*[2-9]\s*\)\s*$/;
  if (!continuationPattern.test(nextTitle)) {
    return false;
  }

  const baseNextTitle = normalizeTitle(nextTitle.replace(continuationPattern, ""));
  return baseNextTitle === normalizeTitle(previousTitle);
}

export function renderSplitReport(results: SplitSongResult[]): string {
  const bySource = new Map<string, { label: string; file: string; results: SplitSongResult[] }>();
  for (const result of results) {
    const source = bySource.get(result.sourceId) ?? {
      label: result.sourceLabel,
      file: result.sourceFile,
      results: []
    };
    source.results.push(result);
    bySource.set(result.sourceId, source);
  }

  const lines = [
    "# F65 - Split de catalogos MusicXML importados",
    "",
    "Este relatorio registra o primeiro desmembramento automatizado dos arquivos grandes em `docs/imports`.",
    "Os arquivos gerados ficam em `docs/imports/split` como area de staging; eles ainda nao entram no catalogo real em `docs/musics`.",
    "",
    "## Criterio",
    "",
    "- O inicio de cada musica e identificado por um bloco `<credit>` com `<credit-type>title</credit-type>`.",
    "- A pagina 1 de cada livro e tratada como capa e ignorada.",
    "- Paginas sem titulo proprio sao mantidas como continuacao da musica anterior.",
    "- O split preserva o conteudo musical dos compassos dentro de um novo `score-partwise` minimo.",
    "- Os compassos sao renumerados a partir de 1 em cada arquivo gerado.",
    "",
    "## Resultado",
    ""
  ];

  for (const [sourceId, source] of bySource.entries()) {
    const sourceResults = source.results;
    const okCount = sourceResults.filter((result) => result.status === "ok").length;
    const emptyCount = sourceResults.length - okCount;
    lines.push(`### ${source.label} (${sourceId.toUpperCase()})`, "");
    lines.push(`- Fonte: \`${source.file}\``);
    lines.push(`- Musicas detectadas: ${sourceResults.length}`);
    lines.push(`- Arquivos gerados: ${okCount}`);
    lines.push(`- Entradas sem compassos: ${emptyCount}`);
    lines.push("");
    lines.push("| Paginas | Titulo | Compositor | Compassos | Arquivo |");
    lines.push("| --- | --- | --- | ---: | --- |");
    for (const result of sourceResults) {
      const pageRange = result.startPage === result.endPage ? `${result.startPage}` : `${result.startPage}-${result.endPage}`;
      lines.push(
        `| ${pageRange} | ${escapeTable(result.title)} | ${escapeTable(result.composer ?? "")} | ${result.measureCount} | \`${result.outputFile}\` |`
      );
    }
    lines.push("");
  }

  const totalOk = results.filter((result) => result.status === "ok").length;
  lines.push("## Proxima leitura", "");
  lines.push(`Foram gerados ${totalOk} arquivos candidatos. O proximo passo e rodar uma auditoria leve sobre esse staging para separar:`);
  lines.push("");
  lines.push("- arquivos MusicXML estruturalmente legiveis pelo nosso parser;");
  lines.push("- cifras importadas que entram no nosso dicionario sem perda semantica;");
  lines.push("- melodias que servem como bons casos de teste para harmonizacao basica e rearmonizacao;");
  lines.push("- duplicatas, continuacoes ou arranjos que nao devem ir para `docs/musics`.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function extractCreditBlocks(xml: string): CreditBlock[] {
  const blocks: CreditBlock[] = [];
  const creditRegex = /<credit\b([^>]*)>([\s\S]*?)<\/credit>/g;
  let match: RegExpExecArray | null;

  while ((match = creditRegex.exec(xml)) !== null) {
    const page = Number(match[1].match(/page="(\d+)"/)?.[1] ?? "1");
    const body = match[2];
    const type = decodeXmlText(body.match(/<credit-type>([\s\S]*?)<\/credit-type>/)?.[1] ?? "").toLowerCase() || undefined;
    const words = [...body.matchAll(/<credit-words\b[^>]*>([\s\S]*?)<\/credit-words>/g)]
      .map((wordMatch) => decodeXmlText(wordMatch[1]))
      .filter(Boolean)
      .join(" ")
      .trim();

    blocks.push({ page, type, words });
  }

  return blocks;
}

function extractMeasuresByPage(xml: string): MeasureBlock[] {
  const measures: MeasureBlock[] = [];
  const measureRegex = /<measure\b[^>]*>[\s\S]*?<\/measure>/g;
  let currentPage = 1;
  let match: RegExpExecArray | null;

  while ((match = measureRegex.exec(xml)) !== null) {
    const measureXml = match[0];
    const newPagePrint = measureXml.match(/<print\b(?=[^>]*new-page="yes")([^>]*)>/);
    const page = newPagePrint?.[1].match(/page-number="(\d+)"/)?.[1];
    if (page) {
      currentPage = Number(page);
    } else if (newPagePrint) {
      currentPage += 1;
    }
    measures.push({ xml: measureXml, page: currentPage });
  }

  return measures;
}

function extractScoreParts(xml: string): Array<{ id: string }> {
  return [...xml.matchAll(/<part\b[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/part>/g)].map((match) => ({ id: match[1] }));
}

function buildScoreHeader(xml: string): string {
  const identification = xml.match(/<identification>[\s\S]*?<\/identification>/)?.[0] ?? "";
  const defaults = xml.match(/<defaults>[\s\S]*?<\/defaults>/)?.[0] ?? "";
  const partList = xml.match(/<part-list>[\s\S]*?<\/part-list>/)?.[0];

  if (!partList) {
    throw new Error("MusicXML sem <part-list>");
  }

  return [identification, defaults, partList].filter(Boolean).join("\n");
}

function renderSongXml(args: {
  header: string;
  partId: string;
  title: string;
  composer?: string;
  measures: MeasureBlock[];
}): string {
  const composerCredit = args.composer
    ? `  <credit page="1">\n    <credit-type>composer</credit-type>\n    <credit-words justify="right" valign="bottom">${escapeXml(args.composer)}</credit-words>\n  </credit>\n`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n<score-partwise version="4.0">\n  <work>\n    <work-title>${escapeXml(args.title)}</work-title>\n  </work>\n  <movement-title>${escapeXml(args.title)}</movement-title>\n${args.header}\n  <credit page="1">\n    <credit-type>title</credit-type>\n    <credit-words justify="center" valign="top" font-size="28">${escapeXml(args.title)}</credit-words>\n  </credit>\n${composerCredit}  <part id="${escapeXml(args.partId)}">\n${args.measures.map((measure, index) => normalizeSplitMeasure(measure.xml, index + 1, args.measures[0].page)).join("\n")}\n  </part>\n</score-partwise>\n`;
}

function normalizeSplitMeasure(xml: string, measureNumber: number, firstPage: number): string {
  return normalizeRelativePageNumbers(renumberMeasure(xml, measureNumber), firstPage);
}

function renumberMeasure(xml: string, measureNumber: number): string {
  return xml.replace(/<measure\b([^>]*)>/, (_match, rawAttributes: string) => {
    const attributes = rawAttributes.includes("number=")
      ? rawAttributes.replace(/\snumber="[^"]*"/, ` number="${measureNumber}"`)
      : `${rawAttributes} number="${measureNumber}"`;
    return `<measure${attributes}>`;
  });
}

function normalizeRelativePageNumbers(xml: string, firstPage: number): string {
  return xml.replace(/<print\b(?=[^>]*new-page="yes")([^>]*)>/g, (match, rawAttributes: string) => {
    const pageNumberMatch = rawAttributes.match(/page-number="(\d+)"/);
    if (!pageNumberMatch) {
      return match;
    }

    const relativePage = Math.max(1, Number(pageNumberMatch[1]) - firstPage + 1);
    return match.replace(/page-number="\d+"/, `page-number="${relativePage}"`);
  });
}

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function decodeXmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeFileName(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

function uniqueFileName(fileName: string, usedNames: Set<string>): string {
  if (!usedNames.has(fileName)) {
    usedNames.add(fileName);
    return fileName;
  }

  const extension = path.extname(fileName);
  const baseName = fileName.slice(0, -extension.length);
  let index = 2;
  let candidate = `${baseName}-${index}${extension}`;
  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${baseName}-${index}${extension}`;
  }
  usedNames.add(candidate);
  return candidate;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

export function runCatalogSplit(): SplitSongResult[] {
  fs.rmSync(splitOutputDir, { recursive: true, force: true });
  fs.mkdirSync(splitOutputDir, { recursive: true });
  fs.mkdirSync(path.dirname(splitReportPath), { recursive: true });

  const sources = discoverCatalogSources();
  const results = sources.flatMap((source) => {
    const absolutePath = path.resolve(process.cwd(), source.file);
    const xml = readCatalogXml(absolutePath);
    return splitCatalogXml(source, xml, splitOutputDir);
  });

  fs.writeFileSync(splitReportPath, renderSplitReport(results));
  return results;
}

export function readCatalogXml(filePath: string): string {
  if (!/\.mxl$/i.test(filePath)) {
    return fs.readFileSync(filePath, "utf8");
  }

  const entries = execFileSync("unzip", ["-Z1", filePath], { encoding: "utf8", maxBuffer: mxlReadBuffer })
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const scoreEntry =
    entries.find((entry) => entry === "score.xml") ??
    entries.find((entry) => /\.musicxml$/i.test(entry)) ??
    entries.find((entry) => /\.xml$/i.test(entry) && entry !== "META-INF/container.xml");

  if (!scoreEntry) {
    throw new Error(`${filePath}: arquivo .mxl sem score XML`);
  }

  return execFileSync("unzip", ["-p", filePath, scoreEntry], { encoding: "utf8", maxBuffer: mxlReadBuffer });
}

function catalogSourceId(fileName: string): string {
  const baseName = path.basename(fileName, path.extname(fileName));
  const bookSuffix = baseName.match(/(?:^|-)book-([a-z0-9]+)$/i)?.[1];
  const id = bookSuffix ?? baseName;

  return sanitizeFileName(id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readableSourceLabel(fileName: string): string {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = runCatalogSplit();
  const okCount = results.filter((result) => result.status === "ok").length;
  console.log(`Catalog split complete: ${okCount}/${results.length} files generated.`);
  console.log(`Output: ${path.relative(process.cwd(), splitOutputDir)}`);
  console.log(`Report: ${path.relative(process.cwd(), splitReportPath)}`);
}
