import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { Note } from "tonal";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { analyzeDominantResolution } from "../src/utils/music/analysis/strategies/DominantResolutionAnalysis";
import { analyzeDominantTension } from "../src/utils/music/analysis/strategies/DominantTensionAnalysis";
import { analyzeReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import { chordRoot } from "../src/utils/music/theory/ChordSymbolResolver";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export interface UnresolvedDominantTensionCase {
  file: string;
  title: string;
  measure: number;
  beat: number;
  referenceCenter: string;
  referenceIdiom: string;
  chord: string;
  level: string;
  expectedTarget: string;
  nextChords: string[];
  reviewClass: string;
  notes: string;
}

function allMusicXmlFiles(dir = path.join(process.cwd(), "docs/musics")): string[] {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return allMusicXmlFiles(fullPath);
      return entry.isFile() && entry.name.endsWith(".musicxml") ? [fullPath] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function relativeMusicPath(file: string): string {
  return path.relative(path.join(process.cwd(), "docs/musics"), file);
}

function orderedHarmonies(harmonies: ScoreHarmonyEvent[]): ScoreHarmonyEvent[] {
  return [...harmonies].sort((a, b) => a.tickStart - b.tickStart);
}

function pitchDistance(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;
  return (toChroma - fromChroma + 12) % 12;
}

function expectedDominantTarget(chord: string): string {
  const root = chordRoot(chord);
  return root ? Note.pitchClass(Note.transpose(`${root}4`, "4P")) || "n/a" : "n/a";
}

function classifyReviewCase(chord: string, nextChords: string[], expectedTarget: string): { reviewClass: string; notes: string } {
  if (nextChords.length === 0) {
    return {
      reviewClass: "terminal-dominant",
      notes: "Dominante alterada aparece no fim da janela; revisar se e meia-cadencia, turnaround ou corte de forma."
    };
  }

  const nextRoots = nextChords.map(item => chordRoot(item)).filter((item): item is string => !!item);
  const reachesTargetLater = nextRoots.slice(2).some(root => pitchDistance(root, expectedTarget) === 0);
  if (reachesTargetLater) {
    return {
      reviewClass: "long-delayed-resolution",
      notes: "O alvo aparece alem da janela curta; candidato a aumentar contexto ou reconhecer arco maior."
    };
  }

  const firstDistance = pitchDistance(chordRoot(chord), chordRoot(nextChords[0]));
  if (firstDistance === 1 || firstDistance === 11) {
    return {
      reviewClass: "chromatic-side-step",
      notes: "A dominante alterada escorrega cromaticamente; revisar se e planing, SubV encadeado ou cifra ambigua."
    };
  }

  const targetDistance = pitchDistance(chordRoot(nextChords[0]), expectedTarget);
  if (targetDistance === 8 || targetDistance === 9) {
    return {
      reviewClass: "possible-deceptive-color",
      notes: "A chegada lembra regiao deceptiva, mas nao entrou na regra curta; revisar qualidade e funcao local."
    };
  }

  return {
    reviewClass: "unresolved-review",
    notes: "Sem alvo funcional claro na janela; candidato a penalidade real ou revisao manual da cifra."
  };
}

export function collectUnresolvedDominantTensionCasesFromHarmonies(
  harmonies: ScoreHarmonyEvent[],
  metadata: { file: string; title: string; referenceCenter: string; referenceIdiom: string }
): UnresolvedDominantTensionCase[] {
  const ordered = orderedHarmonies(harmonies);
  const chords = ordered.map(harmony => harmony.harmony);

  return ordered.flatMap((harmony, index) => {
    const tension = analyzeDominantTension(harmony.harmony);
    if (!tension.isDominant || tension.score < 3) return [];

    const resolution = analyzeDominantResolution(chords, index);
    if (resolution.kind !== "unresolved") return [];

    const nextChords = chords.slice(index + 1, index + 5);
    const expectedTarget = expectedDominantTarget(harmony.harmony);
    const review = classifyReviewCase(harmony.harmony, nextChords, expectedTarget);
    return [{
      file: metadata.file,
      title: metadata.title,
      measure: harmony.measure,
      beat: harmony.beat,
      referenceCenter: metadata.referenceCenter,
      referenceIdiom: metadata.referenceIdiom,
      chord: harmony.harmony,
      level: tension.level,
      expectedTarget,
      nextChords,
      reviewClass: review.reviewClass,
      notes: review.notes
    }];
  });
}

export function collectUnresolvedDominantTensionCases(files = allMusicXmlFiles()): UnresolvedDominantTensionCase[] {
  return files.flatMap(file => {
    const snapshot = parseMusicXML(fs.readFileSync(file, "utf8"));
    const harmonies = snapshot.harmonies as ScoreHarmonyEvent[];
    if (harmonies.length === 0) return [];

    const analysis = analyzeReferenceHarmony(harmonies);
    return collectUnresolvedDominantTensionCasesFromHarmonies(harmonies, {
      file: relativeMusicPath(file),
      title: snapshot.metadata.title || path.basename(file, ".musicxml"),
      referenceCenter: analysis.referenceCenter ? `${analysis.referenceCenter.tonic} ${analysis.referenceCenter.mode}` : "n/a",
      referenceIdiom: analysis.idiom?.idiom || "n/a"
    });
  });
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(cases: UnresolvedDominantTensionCase[]): string {
  const headers = [
    "file",
    "title",
    "measure",
    "beat",
    "referenceCenter",
    "referenceIdiom",
    "chord",
    "level",
    "expectedTarget",
    "nextChords",
    "reviewClass",
    "notes"
  ];

  return [
    headers.map(csvEscape).join(","),
    ...cases.map(item => [
      item.file,
      item.title,
      item.measure,
      item.beat,
      item.referenceCenter,
      item.referenceIdiom,
      item.chord,
      item.level,
      item.expectedTarget,
      item.nextChords.join(" / "),
      item.reviewClass,
      item.notes
    ].map(csvEscape).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(cases: UnresolvedDominantTensionCase[]): string {
  const byClass = cases.reduce<Record<string, number>>((sum, item) => ({
    ...sum,
    [item.reviewClass]: (sum[item.reviewClass] || 0) + 1
  }), {});
  const classLines = Object.entries(byClass)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `- ${name}: ${count}`);

  const lines = [
    "# F93 - Fila de dominantes alteradas sem alvo local",
    "",
    "Este relatorio lista os casos que ainda permanecem sem alvo local depois da F92.",
    "",
    "A intencao nao e decidir automaticamente se a cifra esta errada. A fila separa hipoteses de escuta para calibrar a penalidade de tensao alterada.",
    "",
    "## Resumo",
    "",
    `- Casos encontrados: ${cases.length}`,
    ...classLines,
    "",
    "## Casos para revisão",
    "",
    "| # | Arquivo | Comp. | Centro | Idioma | Acorde | Alvo esp. | Próximos acordes | Classe | Nota |",
    "| ---: | --- | ---: | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const [index, item] of cases.entries()) {
    lines.push([
      index + 1,
      item.file,
      item.measure,
      item.referenceCenter,
      item.referenceIdiom,
      item.chord,
      item.expectedTarget,
      item.nextChords.join(" / ") || "fim",
      item.reviewClass,
      item.notes
    ].map(cell => String(cell).replace(/\|/g, "\\|")).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("");
  lines.push("## Leitura para o motor");
  lines.push("");
  if (byClass["terminal-dominant"]) {
    lines.push("- `terminal-dominant` pede leitura de forma: pode ser meia-cadencia, turnaround ou corte da janela.");
  }
  if (byClass["long-delayed-resolution"]) {
    lines.push("- `long-delayed-resolution` sugere que a janela da F92 pode precisar crescer em contextos raros.");
  }
  if (byClass["possible-deceptive-color"]) {
    lines.push("- `possible-deceptive-color` deve ser comparado com a regra F94 de chegada deceptiva por regiao de terca.");
  }
  if (byClass["chromatic-side-step"]) {
    lines.push("- `chromatic-side-step` deve ser tratado com cuidado: pode ser encadeamento cromatico real ou cifra ambigua.");
  }
  if (byClass["unresolved-review"]) {
    lines.push("- `unresolved-review` e a fila mais forte para manter penalidade real no ranking.");
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function writeUnresolvedDominantTensionAudit(cases = collectUnresolvedDominantTensionCases()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f93-unresolved-dominant-tension-audit.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f93-unresolved-dominant-tension-audit.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(cases));
  fs.writeFileSync(csvPath, renderCsv(cases));
  console.log(`Unresolved dominant tension audit complete: ${cases.length} cases.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeUnresolvedDominantTensionAudit();
}
