import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { PhraseAnalysisEngine, type PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { GravityFieldManager, type GravityProposalGenerationResult } from "../src/utils/music/analysis/engines/GravityFieldManager";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import {
  compareProposalToReferenceHarmony,
  type ReferenceHarmonyComparison
} from "../src/utils/music/analysis/strategies/ReferenceHarmonyComparator";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import {
  applyReferenceCenterToPhraseContext,
  formatReferenceCenterEvidenceSentence
} from "../src/utils/music/analysis/strategies/ReferenceAwarePhraseContext";
import type { HarmonicDiagnostic } from "../src/utils/music/analysis/models/HarmonicDiagnostic";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export const realMusicDir = path.resolve(process.cwd(), "docs/musics");

export interface RealMusicAuditWindow {
  anchors: MelodicAnchor[];
  phraseContext: PhraseContext;
  generation: GravityProposalGenerationResult;
  referenceOverlapCount: number;
}

export interface RealMusicAuditResult {
  file: string;
  title: string;
  keySignature?: string;
  measures: number;
  noteCount: number;
  harmonyCount: number;
  sectionCount: number;
  status: "harmonized" | "reference-only" | "no-proposal";
  windowMeasures: number[];
  referenceOverlapCount: number;
  selectedCenter?: string;
  selectedCenterSource?: PhraseContext["selectedCenterSource"];
  selectedCenterEvidence?: string[];
  proposalCount: number;
  primaryProposal?: ReharmonizationProposal;
  referenceComparison?: ReferenceHarmonyComparison;
  diagnostics: HarmonicDiagnostic[];
}

export function realMusicXmlFiles(): string[] {
  return fs.readdirSync(realMusicDir)
    .filter(file => file.endsWith(".musicxml"))
    .sort();
}

export function pitchClassFromNote(note: any): string {
  if (note.alter === 1) return `${note.step}#`;
  if (note.alter === -1) return `${note.step}b`;
  return note.step;
}

export function toAnchors(notes: any[]): MelodicAnchor[] {
  return notes.map(note => ({
    measureIndex: note.measure,
    pitch: pitchClassFromNote(note),
    duration: note.durationTicks,
    startTick: note.tickStart,
    endTick: note.tickEnd
  }));
}

export function firstMelodicWindow(notes: any[], size = 8): any[] {
  const melodicMeasures = melodicMeasureIndexes(notes);
  const selectedMeasures = new Set(melodicMeasures.slice(0, size));
  return notes.filter(note => selectedMeasures.has(note.measure));
}

export function melodicWindows(notes: any[], size = 8): any[][] {
  const melodicMeasures = melodicMeasureIndexes(notes);

  return melodicMeasures.map((_, index) => {
    const selectedMeasures = new Set(melodicMeasures.slice(index, index + size));
    return notes.filter(note => selectedMeasures.has(note.measure));
  }).filter(windowNotes => windowNotes.length > 0);
}

export function findHarmonizableWindow(
  notes: any[],
  keySignature?: string,
  referenceHarmonies: ScoreHarmonyEvent[] = []
): RealMusicAuditWindow | null {
  let bestWindow: RealMusicAuditWindow | null = null;

  for (const windowNotes of melodicWindows(notes)) {
    const anchors = toAnchors(windowNotes);
    const referenceHarmoniesForWindow = referenceHarmonies.filter(harmony => (
      anchors.some(anchor => anchor.measureIndex === harmony.measure)
    ));
    const phraseContext = applyReferenceCenterToPhraseContext(
      PhraseAnalysisEngine.analyzePhrase(anchors, keySignature),
      referenceHarmoniesForWindow
    );
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext);
    if (generation.proposals.length > 0) {
      const referenceOverlapCount = referenceOverlapForPrimaryProposal(
        generation,
        phraseContext,
        anchors,
        referenceHarmonies
      );
      const candidate = { anchors, phraseContext, generation, referenceOverlapCount };
      if (referenceHarmonies.length === 0) return candidate;
      if (!bestWindow || candidate.referenceOverlapCount > bestWindow.referenceOverlapCount) {
        bestWindow = candidate;
      }
      if (candidate.referenceOverlapCount >= 3) return candidate;
    }
  }

  return bestWindow;
}

export function auditRealMusicFile(file: string): RealMusicAuditResult {
  const snapshot = parseMusicXML(fs.readFileSync(path.join(realMusicDir, file), "utf8"));
  const base = {
    file,
    title: snapshot.metadata.title || file.replace(/\.musicxml$/i, ""),
    keySignature: snapshot.metadata.keySignature,
    measures: snapshot.metadata.measures,
    noteCount: snapshot.notes.length,
    harmonyCount: snapshot.harmonies.length,
    sectionCount: snapshot.sections.length
  };
  const anchors = toAnchors(firstMelodicWindow(snapshot.notes));

  if (anchors.length === 0) {
    return {
      ...base,
      status: "reference-only",
      windowMeasures: [],
      referenceOverlapCount: 0,
      proposalCount: 0,
      referenceComparison: compareProposalToReferenceHarmony(undefined, snapshot.harmonies, snapshot.metadata.keySignature || "C"),
      diagnostics: []
    };
  }

  const harmonizable = findHarmonizableWindow(snapshot.notes, snapshot.metadata.keySignature, snapshot.harmonies);
  if (!harmonizable) {
    return {
      ...base,
      status: "no-proposal",
      windowMeasures: Array.from(new Set(anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b),
      referenceOverlapCount: 0,
      proposalCount: 0,
      referenceComparison: compareProposalToReferenceHarmony(undefined, snapshot.harmonies, snapshot.metadata.keySignature || "C"),
      diagnostics: []
    };
  }

  const ranked = rankReharmonizationProposalsByVoiceLeading(
    harmonizable.generation.proposals,
    harmonizable.phraseContext,
    harmonizable.anchors
  );
  const presented = annotateProposalPresentationRoles(ranked, "balanced");
  const primaryProposal = presented.find(proposal => proposal.presentationRole === "primary") || presented[0];
  const diagnostics = [
    ...harmonizable.generation.omittedStrategyDiagnostics,
    ...(primaryProposal?.diagnostics || [])
  ];
  const referenceComparison = compareProposalToReferenceHarmony(
    primaryProposal,
    snapshot.harmonies,
    harmonizable.phraseContext.selectedCenter.tonic
  );

  return {
    ...base,
    status: "harmonized",
    windowMeasures: Array.from(new Set(harmonizable.anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b),
    referenceOverlapCount: harmonizable.referenceOverlapCount,
    selectedCenter: `${harmonizable.phraseContext.selectedCenter.tonic} ${harmonizable.phraseContext.selectedCenter.mode}`,
    selectedCenterSource: harmonizable.phraseContext.selectedCenterSource,
    selectedCenterEvidence: harmonizable.phraseContext.selectedCenterEvidence,
    proposalCount: presented.length,
    primaryProposal,
    referenceComparison,
    diagnostics
  };
}

export function auditRealMusicLibrary(): RealMusicAuditResult[] {
  return realMusicXmlFiles().map(auditRealMusicFile);
}

export function renderRealMusicAuditMarkdown(results: RealMusicAuditResult[]): string {
  const lines = [
    "# F39 — Relatorio musical por obra",
    "",
    "Este relatorio e gerado a partir das partituras em `docs/musics` e resume a leitura atual do motor sobre cada arquivo real.",
    "",
    "A leitura nao pretende ser julgamento estetico final. Ela registra o que o sistema conseguiu importar, qual janela melodica foi usada, qual centro foi escolhido e qual proposta primaria saiu do pipeline.",
    "",
    "## Resumo geral",
    "",
    `- Arquivos auditados: ${results.length}`,
    `- Arquivos harmonizados: ${results.filter(result => result.status === "harmonized").length}`,
    `- Arquivos apenas com referencia harmonica: ${results.filter(result => result.status === "reference-only").length}`,
    `- Arquivos sem proposta na janela auditada: ${results.filter(result => result.status === "no-proposal").length}`,
    "",
    "## Obras",
    ""
  ];

  for (const result of results) {
    lines.push(`### ${result.file}`);
    lines.push("");
    lines.push(`- Titulo importado: ${result.title}`);
    lines.push(`- Tom/armadura: ${result.keySignature || "nao informado"}`);
    lines.push(`- Material importado: ${result.measures} compassos, ${result.noteCount} notas, ${result.harmonyCount} cifras, ${result.sectionCount} secoes`);
    lines.push(`- Status: ${statusLabel(result.status)}`);

    if (result.status !== "harmonized") {
      lines.push("");
      lines.push(statusComment(result));
      lines.push("");
      continue;
    }

    const primary = result.primaryProposal;
    lines.push(`- Janela melodica: compassos ${result.windowMeasures.join(", ")}`);
    lines.push(`- Sobreposicao com referencia: ${result.referenceOverlapCount} compassos`);
    lines.push(`- Centro escolhido: ${result.selectedCenter}`);
    if (result.selectedCenterSource === "reference") {
      lines.push(`- Origem do centro: referencia harmonica da janela`);
      if (result.selectedCenterEvidence && result.selectedCenterEvidence.length > 0) {
        lines.push(`- Evidencia do centro: ${result.selectedCenterEvidence.map(formatReferenceCenterEvidenceSentence).join(" ")}`);
      }
    }
    lines.push(`- Propostas geradas: ${result.proposalCount}`);
    lines.push(`- Proposta primaria: ${primary?.name || "sem proposta primaria"}`);
    const cadentialTarget = proposalCadentialTarget(primary);
    if (cadentialTarget) lines.push(`- Alvo cadencial da proposta: ${cadentialTarget}`);
    lines.push(`- Perfil: rota ${primary?.routeProfile || "n/a"}; baixo ${primary?.bassLineProfile || "n/a"}; conducao ${formatNumber(primary?.voiceLeadingScore)}`);
    lines.push(`- Cifras: ${primary ? chordSummary(primary) : "n/a"}`);
    lines.push(`- Baixo: ${primary?.bassLine.join(" -> ") || "n/a"}`);
    const proposalEvidence = proposalExplanationSummary(primary);
    if (proposalEvidence.length > 0) {
      lines.push("- Evidencias da proposta:");
      for (const item of proposalEvidence) lines.push(`  - ${item}`);
    }
    const referenceCenter = referenceCenterSummary(result.referenceComparison);
    if (referenceCenter) lines.push(`- Centro da referencia: ${referenceCenter}`);
    lines.push(`- Comparacao com referencia: ${referenceComparisonSummary(result.referenceComparison)}`);
    const causes = referenceCauseSummary(result.referenceComparison);
    if (causes) lines.push(`- Causas da comparacao: ${causes}`);

    const diagnostics = diagnosticSummary(result.diagnostics);
    if (diagnostics.length > 0) {
      lines.push("- Diagnosticos principais:");
      for (const item of diagnostics) lines.push(`  - ${item}`);
    }

    lines.push("");
  }

  lines.push("## Leitura de F39");
  lines.push("");
  lines.push("A bateria real mostra tres tipos de entrada que o sistema precisa continuar distinguindo:");
  lines.push("");
  lines.push("1. melodias sem cifra, onde a engine precisa propor a harmonia inteira;");
  lines.push("2. melodias com cifras, onde a engine deve harmonizar sem perder a possibilidade futura de comparar com a referencia;");
  lines.push("3. arquivos com cifra mas sem notas importadas, que testam ingestao de referencia mas nao sao entrada melodica harmonizavel.");
  lines.push("");
  lines.push("O proximo refinamento natural e comparar a proposta primaria com a harmonia de referencia quando ela existe, separando divergencia aceitavel de erro de leitura funcional.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function melodicMeasureIndexes(notes: any[]): number[] {
  return Array.from(new Set(
    notes
      .filter(note => note.durationTicks > 0)
      .map(note => note.measure)
  )).sort((a, b) => a - b);
}

function statusLabel(status: RealMusicAuditResult["status"]): string {
  if (status === "harmonized") return "harmonizado";
  if (status === "reference-only") return "apenas referencia harmonica";
  return "sem proposta";
}

function statusComment(result: RealMusicAuditResult): string {
  if (result.status === "reference-only") {
    return "O arquivo tem material harmonico importado, mas nao trouxe notas melodicas suficientes para acionar a harmonizacao melodica.";
  }

  return "O arquivo tem material melodico, mas nenhuma janela auditada produziu proposta aceita no estado atual do motor.";
}

function formatNumber(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "n/a";
}

function chordSummary(proposal: ReharmonizationProposal): string {
  return proposal.measures
    .map(measure => `${measure.measureIndex}:${measure.chords.join("/")}`)
    .join(" | ");
}

function diagnosticSummary(diagnostics: HarmonicDiagnostic[]): string[] {
  return Array.from(new Set(diagnostics.map(item => item.message))).slice(0, 4);
}

function proposalExplanationSummary(proposal: ReharmonizationProposal | undefined): string[] {
  if (!proposal) return [];
  return Array.from(new Set(proposal.explanation)).slice(0, 4);
}

function proposalCadentialTarget(proposal: ReharmonizationProposal | undefined): string | null {
  if (!proposal) return null;
  for (const explanation of proposal.explanation) {
    const localCadence = explanation.match(/(?:cria uma cadência local para|reconhece célula ii-V local em) ([A-G](?:#|b)?)/);
    if (localCadence) return localCadence[1];
  }
  return null;
}

function referenceComparisonSummary(comparison: ReferenceHarmonyComparison | undefined): string {
  if (!comparison || comparison.status === "no-reference") return "sem referencia comparavel";
  const status = comparison.status === "aligned"
    ? "alinhada"
    : comparison.status === "partially-aligned"
      ? "parcial"
      : "divergente";
  return `${status}; função ${comparison.matchingFunctionCount}/${comparison.comparedMeasures}; raiz ${comparison.matchingRootCount}/${comparison.comparedMeasures}`;
}

function referenceCenterSummary(comparison: ReferenceHarmonyComparison | undefined): string | null {
  if (!comparison?.referenceCenter) return null;
  const local = comparison.localReferenceCenter
    ? `${comparison.localReferenceCenter} ${comparison.localReferenceCenterMode || "major"}; confiança ${comparison.localReferenceCenterConfidence || "weak"}`
    : null;
  const global = comparison.globalReferenceCenter
    ? `${comparison.globalReferenceCenter} ${comparison.globalReferenceCenterMode || "major"}; confiança ${comparison.globalReferenceCenterConfidence || "weak"}`
    : null;
  const localIdentity = `${comparison.localReferenceCenter || ""}:${comparison.localReferenceCenterMode || "major"}`;
  const globalIdentity = `${comparison.globalReferenceCenter || ""}:${comparison.globalReferenceCenterMode || "major"}`;
  if (local && global && localIdentity !== globalIdentity) return `janela ${local}; global ${global}`;

  const mode = comparison.referenceCenterMode || "major";
  const confidence = comparison.referenceCenterConfidence || "weak";
  return `${comparison.referenceCenter} ${mode}; confiança ${confidence}`;
}

function referenceCauseSummary(comparison: ReferenceHarmonyComparison | undefined): string | null {
  if (!comparison || comparison.causes.length === 0) return null;
  const labels = comparison.causes.map(cause => {
    if (cause === "function-preserved-root-changed") return "função preservada com outra raiz";
    if (cause === "center-mismatch") return "centro divergente";
    if (cause === "local-center-mismatch") return "centro local divergente";
    if (cause === "global-center-mismatch") return "centro global divergente";
    if (cause === "local-center-aligned-global-mismatch") return "acompanha centro local, diverge do global";
    if (cause === "global-center-aligned-local-mismatch") return "acompanha centro global, ignora centro local";
    if (cause === "reference-cadence-not-matched") return "cadência da referência não acompanhada";
    if (cause === "reference-idiom-context") return "idioma da referência relevante";
    return "raiz divergente na janela";
  });
  return labels.join("; ");
}

function referenceOverlapForPrimaryProposal(
  generation: GravityProposalGenerationResult,
  phraseContext: PhraseContext,
  anchors: MelodicAnchor[],
  referenceHarmonies: ScoreHarmonyEvent[]
): number {
  if (referenceHarmonies.length === 0) return 0;
  const referenceMeasures = new Set(referenceHarmonies.map(harmony => harmony.measure));
  const ranked = rankReharmonizationProposalsByVoiceLeading(generation.proposals, phraseContext, anchors);
  const presented = annotateProposalPresentationRoles(ranked, "balanced");
  const primaryProposal = presented.find(proposal => proposal.presentationRole === "primary") || presented[0];
  if (!primaryProposal) return 0;
  return primaryProposal.measures.filter(measure => referenceMeasures.has(measure.measureIndex)).length;
}
