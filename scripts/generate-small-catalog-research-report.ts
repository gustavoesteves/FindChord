import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  auditRealMusicFile,
  type RealMusicAuditResult
} from "./real-music-audit";

export interface ResearchCase {
  file: string;
  role: string;
  question: string;
}

const researchCases: ResearchCase[] = [
  {
    file: "asa branca.musicxml",
    role: "controle tonal simples",
    question: "A harmonia basica gerada so pela melodia e suficiente?"
  },
  {
    file: "Bright Size Life.musicxml",
    role: "centro local forte contra centro global",
    question: "A referencia revela uma regiao local que a melodia-only nao fixa?"
  },
  {
    file: "afternoon in Paris.musicxml",
    role: "centro local com centro global preservado",
    question: "O app consegue separar centro local da frase e centro global da obra?"
  },
  {
    file: "Ain't misbehavin.musicxml",
    role: "mesmo centro com harmonizacao diferente",
    question: "A divergencia e outra densidade harmonica, nao erro de centro?"
  },
  {
    file: "Actual proof.musicxml",
    role: "referencia destrava harmonizacao",
    question: "Quando a melodia sozinha nao basta, qual contexto a referencia fornece?"
  }
];

export const smallCatalogResearchOutputPath = path.resolve(process.cwd(), "docs/reports/f61-small-catalog-research-report.md");

export function renderSmallCatalogResearchCase(result: RealMusicAuditResult, researchCase: ResearchCase): string[] {
  const comparison = result.dualPathComparison;
  const melodyPath = comparison ? pathSummary(comparison.melodyOnly) : "sem caminho melodia-only";
  const referencePath = comparison ? pathSummary(comparison.referenceAware) : "sem caminho com referencia";
  const divergence = comparison ? classificationLabel(comparison.classification) : "sem comparacao";
  const referenceCenter = referenceCenterSummary(result);
  const referenceComparison = referenceComparisonSummary(result);
  const primary = result.primaryProposal;

  return [
    `## ${result.file}`,
    "",
    `- Papel na pesquisa: ${researchCase.role}`,
    `- Pergunta: ${researchCase.question}`,
    `- Status: ${statusLabel(result.status)}`,
    `- Janela melodica: ${result.windowMeasures.length > 0 ? result.windowMeasures.join(", ") : "sem janela"}`,
    `- Centro escolhido: ${result.selectedCenter || "sem centro"}`,
    `- Melodia-only: ${melodyPath}`,
    `- Com referencia: ${referencePath}`,
    `- Leitura da divergencia: ${divergence}`,
    `- Centro da referencia: ${referenceCenter}`,
    `- Comparacao com referencia: ${referenceComparison}`,
    `- Proposta primaria: ${primary?.name || "sem proposta"}`,
    `- Camada da proposta: ${primary ? presentationLayerLabel(primary.presentationLayer) : "sem camada"}`,
    `- Cifras geradas: ${primary ? chordSummary(primary) : "sem cifras"}`,
    `- Hipotese de produto: ${productHypothesis(result)}`,
    `- Proxima decisao: ${nextDecision(result)}`,
    ""
  ];
}

export function renderSmallCatalogResearchReport(results: Array<{ result: RealMusicAuditResult; researchCase: ResearchCase }>): string {
  const lines = [
    "# F61 - Relatorio da pesquisa dirigida",
    "",
    "Este relatorio roda o conjunto inicial definido em `docs/sprints/f61-small-catalog-research.md`.",
    "A leitura e qualitativa: cada obra funciona como caso de teste musical para decidir o proximo refinamento do harmonizador.",
    "",
    "## Resumo",
    "",
    `- Obras rodadas: ${results.length}`,
    `- Caminhos alinhados: ${countByClassification(results, "aligned")}`,
    `- Referencia muda centro: ${countByClassification(results, "reference-shifts-center")}`,
    `- Mesmo centro, harmonizacao diferente: ${countByClassification(results, "same-center-different-harmonization")}`,
    `- Referencia destrava harmonizacao: ${countByClassification(results, "reference-unlocks-harmony")}`,
    "",
    "## Leitura geral",
    "",
    "O conjunto confirma que a proxima melhoria nao deve ser simplesmente adicionar acordes mais complexos. O ponto central e hierarquizar leituras: harmonia basica por melodia, centro local da referencia, densidade funcional e rearmonizacao como alternativa.",
    "",
    ...results.flatMap(({ result, researchCase }) => renderSmallCatalogResearchCase(result, researchCase))
  ];

  return `${lines.join("\n")}\n`;
}

function countByClassification(
  results: Array<{ result: RealMusicAuditResult }>,
  classification: string
): number {
  return results.filter(({ result }) => result.dualPathComparison?.classification === classification).length;
}

function pathSummary(summary: RealMusicAuditResult["dualPathComparison"]["melodyOnly"]): string {
  if (summary.status !== "harmonized") return "sem proposta";
  return `centro ${summary.selectedCenter || "n/a"}; primaria ${summary.primaryProposalName || "n/a"}; ${summary.proposalCount} propostas`;
}

function classificationLabel(classification: string): string {
  if (classification === "aligned") return "caminhos alinhados";
  if (classification === "reference-shifts-center") return "a referencia muda o centro percebido";
  if (classification === "same-center-different-harmonization") return "mesmo centro, harmonizacao diferente";
  if (classification === "reference-unlocks-harmony") return "a referencia destrava a harmonizacao";
  return "sem proposta comparavel";
}

function referenceCenterSummary(result: RealMusicAuditResult): string {
  const comparison = result.referenceComparison;
  if (!comparison?.referenceCenter) return "sem referencia comparavel";

  const local = comparison.localReferenceCenter
    ? `${comparison.localReferenceCenter} ${comparison.localReferenceCenterMode || "major"} (${comparison.localReferenceCenterConfidence || "weak"})`
    : null;
  const global = comparison.globalReferenceCenter
    ? `${comparison.globalReferenceCenter} ${comparison.globalReferenceCenterMode || "major"} (${comparison.globalReferenceCenterConfidence || "weak"})`
    : null;

  if (local && global && local !== global) return `local ${local}; global ${global}`;
  return `${comparison.referenceCenter} ${comparison.referenceCenterMode || "major"} (${comparison.referenceCenterConfidence || "weak"})`;
}

function referenceComparisonSummary(result: RealMusicAuditResult): string {
  const comparison = result.referenceComparison;
  if (!comparison || comparison.status === "no-reference") return "sem referencia comparavel";
  return `${comparisonStatusLabel(comparison.status)}; funcao ${comparison.matchingFunctionCount}/${comparison.comparedMeasures}; raiz ${comparison.matchingRootCount}/${comparison.comparedMeasures}`;
}

function chordSummary(proposal: NonNullable<RealMusicAuditResult["primaryProposal"]>): string {
  return proposal.measures
    .map(measure => `${measure.measureIndex}:${measure.chords.join("/")}`)
    .join(" | ");
}

function presentationLayerLabel(layer: NonNullable<RealMusicAuditResult["primaryProposal"]>["presentationLayer"]): string {
  if (layer === "basic") return "harmonia basica";
  if (layer === "reference-aware") return "centro de referencia";
  if (layer === "reharmonization") return "rearmonizacao";
  return "sem camada";
}

function productHypothesis(result: RealMusicAuditResult): string {
  const classification = result.dualPathComparison?.classification;
  if (classification === "aligned") return "usar como referencia de harmonia basica e controle contra excesso de complexidade";
  if (classification === "reference-shifts-center") return "separar centro local, centro global e centro melodico antes de promover a proposta";
  if (classification === "same-center-different-harmonization") return "tratar a referencia como densidade ou vocabulario alternativo, nao como correcao absoluta";
  if (classification === "reference-unlocks-harmony") return "admitir que a melodia isolada pode exigir mais contexto harmonico";
  return "manter como caso de ingestao/comparacao antes de gerar regra";
}

function nextDecision(result: RealMusicAuditResult): string {
  const classification = result.dualPathComparison?.classification;
  if (classification === "aligned") return "validar se a proposta deve ser o padrao de harmonizacao simples";
  if (classification === "reference-shifts-center") return "escutar se a melodia sustenta o centro local ou se ele depende da cifra/baixo";
  if (classification === "same-center-different-harmonization") return "decidir se a referencia entra como alternativa de rearmonizacao";
  if (classification === "reference-unlocks-harmony") return "definir mensagem e fallback quando melodia-only nao gera proposta";
  return "abrir manualmente para classificar a causa";
}

function statusLabel(status: RealMusicAuditResult["status"]): string {
  if (status === "harmonized") return "harmonizado";
  if (status === "reference-only") return "apenas referencia harmonica";
  return "sem proposta";
}

function comparisonStatusLabel(status: NonNullable<RealMusicAuditResult["referenceComparison"]>["status"]): string {
  if (status === "aligned") return "alinhada";
  if (status === "partially-aligned") return "parcial";
  if (status === "divergent") return "divergente";
  return "sem referencia";
}

export function auditSmallCatalogResearchCases(): Array<{ result: RealMusicAuditResult; researchCase: ResearchCase }> {
  return researchCases.map(researchCase => ({
    researchCase,
    result: auditRealMusicFile(researchCase.file)
  }));
}

function isExecutedDirectly(): boolean {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isExecutedDirectly()) {
  const results = auditSmallCatalogResearchCases();
  fs.mkdirSync(path.dirname(smallCatalogResearchOutputPath), { recursive: true });
  fs.writeFileSync(smallCatalogResearchOutputPath, renderSmallCatalogResearchReport(results), "utf8");
  console.log(`Wrote ${smallCatalogResearchOutputPath}`);
}
