import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { Note, Scale } from "tonal";
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
import { analyzeModalBorrowingColors } from "../src/utils/music/analysis/strategies/ModalBorrowingAnalysis";
import { buildControlledReharmonizationProposals } from "../src/domains/harmonizer/services/harmonizerService";
import { filterDiagnosticsForPrimaryProposal } from "../src/domains/harmonizer/services/harmonizerDiagnostics";
import { resolveChordSymbol } from "../src/utils/music/theory/ChordSymbolResolver";
import {
  summarizeAppliedHarmonicVocabulary,
  type AppliedHarmonicVocabularySummary
} from "./audit-applied-harmonic-vocabulary";
import type { HarmonicDiagnostic } from "../src/utils/music/analysis/models/HarmonicDiagnostic";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import type { ScoreHarmonyEvent, ScoreSnapshot } from "../src/utils/music/analysis/models/ScoreSnapshot";
import {
  measureTicksForMetricContext,
  timelineContextAtTick
} from "../src/utils/music/analysis/scoreTimelineContext";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export const realMusicDir = path.resolve(process.cwd(), "docs/musics");

export interface RealMusicAuditWindow {
  anchors: MelodicAnchor[];
  phraseContext: PhraseContext;
  generation: GravityProposalGenerationResult;
  referenceOverlapCount: number;
}

export interface HarmonizableWindowContextOptions {
  snapshot?: ScoreSnapshot;
  keySignature?: string;
}

export interface FunctionalColorAuditSummary {
  generatedCount: number;
  nonPrimaryCount: number;
  examples: string[];
}

export interface ModalBorrowingReferenceSummary {
  count: number;
  examples: string[];
}

export interface HarmonizationPathSummary {
  status: "harmonized" | "no-proposal";
  windowMeasures: number[];
  selectedCenter?: string;
  selectedCenterSource?: PhraseContext["selectedCenterSource"];
  proposalCount: number;
  primaryProposalName?: string;
  primaryChords?: string;
}

export interface DualHarmonizationPathComparison {
  melodyOnly: HarmonizationPathSummary;
  referenceAware: HarmonizationPathSummary;
  classification: DualPathClassification;
  centerChanged: boolean;
  primaryChanged: boolean;
  chordsChanged: boolean;
}

export type DualPathClassification =
  | "aligned"
  | "reference-unlocks-harmony"
  | "reference-shifts-center"
  | "same-center-different-harmonization"
  | "different-harmonization"
  | "no-comparable-proposal";

type CenterShiftTriageCategory =
  | "likely-reference-local-center"
  | "relative-major-minor-resolved"
  | "review-reference-center"
  | "melody-only-vocabulary-gap";
type CenterShiftReferenceAlignment = "aligned" | "partial" | "divergent";
type SameCenterReferenceContribution = "enriches-route" | "changes-route-for-review";

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
  referenceWindowChords?: string;
  referenceWindowBass?: string;
  referenceBassAgreement?: string;
  referenceBassAgreementRatio?: number;
  referenceVocabulary?: AppliedHarmonicVocabularySummary;
  proposalCount: number;
  primaryProposal?: ReharmonizationProposal;
  functionalColors?: FunctionalColorAuditSummary;
  modalBorrowingReferenceColors?: ModalBorrowingReferenceSummary;
  dualPathComparison?: DualHarmonizationPathComparison;
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
    const measureWindow = melodicMeasures.slice(index, index + size);
    if (melodicMeasures.length >= size && measureWindow.length < size) return [];
    const selectedMeasures = new Set(measureWindow);
    return notes.filter(note => selectedMeasures.has(note.measure));
  }).filter(windowNotes => windowNotes.length > 0);
}

export function findHarmonizableWindow(
  notes: any[],
  keySignatureOrOptions?: string | HarmonizableWindowContextOptions,
  referenceHarmonies: ScoreHarmonyEvent[] = []
): RealMusicAuditWindow | null {
  let bestWindow: RealMusicAuditWindow | null = null;
  const contextOptions = typeof keySignatureOrOptions === "string"
    ? { keySignature: keySignatureOrOptions }
    : keySignatureOrOptions || {};

  for (const windowNotes of melodicWindows(notes)) {
    const anchors = toAnchors(windowNotes);
    const windowTick = anchors[0]?.startTick ?? 0;
    const keySignature = contextOptions.snapshot
      ? timelineContextAtTick(contextOptions.snapshot, windowTick).keySignature
      : contextOptions.keySignature;
    const referenceHarmoniesForWindow = referenceHarmonies.filter(harmony => (
      anchors.some(anchor => anchor.measureIndex === harmony.measure)
    ));
    const phraseContext = applyReferenceCenterToPhraseContext(
      PhraseAnalysisEngine.analyzePhrase(anchors, keySignature),
      referenceHarmoniesForWindow
    );
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(
      anchors,
      phraseContext,
      { measureTicks: measureTicksForMetricContext(contextOptions.snapshot) }
    );
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

function referenceHarmoniesForAnchors(
  referenceHarmonies: ScoreHarmonyEvent[],
  anchors: MelodicAnchor[]
): ScoreHarmonyEvent[] {
  const anchorMeasures = new Set(anchors.map(anchor => anchor.measureIndex));
  return referenceHarmonies.filter(harmony => anchorMeasures.has(harmony.measure));
}

function proposalsForAuditWindow(
  window: RealMusicAuditWindow,
  referenceHarmonies: ScoreHarmonyEvent[]
): ReharmonizationProposal[] {
  const scopedReference = referenceHarmoniesForAnchors(referenceHarmonies, window.anchors);
  return [
    ...buildControlledReharmonizationProposals(scopedReference, window.anchors, window.phraseContext),
    ...window.generation.proposals
  ];
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
    const referenceCenter = timelineContextAtTick(snapshot).keySignature || "C";
    return {
      ...base,
      status: "reference-only",
      windowMeasures: [],
      referenceOverlapCount: 0,
      proposalCount: 0,
      functionalColors: emptyFunctionalColorSummary(),
      modalBorrowingReferenceColors: emptyModalBorrowingReferenceSummary(),
      dualPathComparison: emptyDualPathComparison(),
      referenceComparison: compareProposalToReferenceHarmony(undefined, snapshot.harmonies, referenceCenter),
      diagnostics: []
    };
  }

  const harmonizable = findHarmonizableWindow(snapshot.notes, { snapshot }, snapshot.harmonies);
  if (!harmonizable) {
    const referenceCenter = timelineContextAtTick(snapshot).keySignature || "C";
    return {
      ...base,
      status: "no-proposal",
      windowMeasures: Array.from(new Set(anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b),
      referenceOverlapCount: 0,
      proposalCount: 0,
      functionalColors: emptyFunctionalColorSummary(),
      modalBorrowingReferenceColors: emptyModalBorrowingReferenceSummary(),
      dualPathComparison: compareHarmonizationPaths(null, null, snapshot.harmonies.length > 0),
      referenceComparison: compareProposalToReferenceHarmony(undefined, snapshot.harmonies, referenceCenter),
      diagnostics: []
    };
  }

  const ranked = rankReharmonizationProposalsByVoiceLeading(
    proposalsForAuditWindow(harmonizable, snapshot.harmonies),
    harmonizable.phraseContext,
    harmonizable.anchors,
    { referenceHarmonies: snapshot.harmonies }
  );
  const presented = annotateProposalPresentationRoles(ranked, "balanced", harmonizable.phraseContext);
  const primaryProposal = selectPrimaryProposal(presented);
  const referenceForWindow = referenceHarmoniesForAnchors(snapshot.harmonies, harmonizable.anchors);
  const bassAgreement = referenceBassAgreement(referenceForWindow, primaryProposal);
  const functionalColors = summarizeFunctionalColorAlternatives(presented, primaryProposal);
  const referenceComparison = compareProposalToReferenceHarmony(
    primaryProposal,
    snapshot.harmonies,
    harmonizable.phraseContext.selectedCenter.tonic
  );
  const diagnostics = filterDiagnosticsForPrimaryProposal([
    ...harmonizable.generation.omittedStrategyDiagnostics,
    ...(primaryProposal?.diagnostics || [])
  ], primaryProposal);
  const modalBorrowingReferenceColors = summarizeModalBorrowingReferenceColors(
    snapshot.harmonies,
    harmonizable.anchors,
    harmonizable.phraseContext,
    referenceComparison
  );
  const melodyOnlyHarmonizable = findHarmonizableWindow(snapshot.notes, { snapshot }, []);
  const dualPathComparison = compareHarmonizationPaths(
    melodyOnlyHarmonizable,
    harmonizable,
    snapshot.harmonies.length > 0,
    snapshot.harmonies
  );

  return {
    ...base,
    status: "harmonized",
    windowMeasures: Array.from(new Set(harmonizable.anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b),
    referenceOverlapCount: harmonizable.referenceOverlapCount,
    selectedCenter: `${harmonizable.phraseContext.selectedCenter.tonic} ${harmonizable.phraseContext.selectedCenter.mode}`,
    selectedCenterSource: harmonizable.phraseContext.selectedCenterSource,
    selectedCenterEvidence: harmonizable.phraseContext.selectedCenterEvidence,
    referenceWindowChords: referenceHarmonySummary(referenceForWindow),
    referenceWindowBass: referenceBassSummary(referenceForWindow),
    referenceBassAgreement: bassAgreement ? `${bassAgreement.matching}/${bassAgreement.compared}` : undefined,
    referenceBassAgreementRatio: bassAgreement?.ratio,
    referenceVocabulary: summarizeAppliedHarmonicVocabulary(
      referenceForWindow,
      harmonizable.phraseContext.selectedCenter.tonic,
      harmonizable.phraseContext.selectedCenter.mode
    ),
    proposalCount: presented.length,
    primaryProposal,
    functionalColors,
    modalBorrowingReferenceColors,
    dualPathComparison,
    referenceComparison,
    diagnostics
  };
}

export function auditRealMusicLibrary(): RealMusicAuditResult[] {
  return realMusicXmlFiles().map(auditRealMusicFile);
}

export function renderRealMusicAuditMarkdown(results: RealMusicAuditResult[]): string {
  const functionalColorTotals = summarizeFunctionalColorTotals(results);
  const modalBorrowingReferenceTotals = summarizeModalBorrowingReferenceTotals(results);
  const dualPathTotals = summarizeDualPathClassificationTotals(results);
  const centerShiftTriageTotals = summarizeCenterShiftTriageTotals(results);
  const centerShiftReferenceAlignmentTotals = summarizeCenterShiftReferenceAlignmentTotals(results);
  const sameCenterReferenceContributionTotals = summarizeSameCenterReferenceContributionTotals(results);
  const bassPreservationTotals = summarizeBassPreservationTotals(results);
  const lines = [
    "# F39 — Relatorio musical por obra",
    "",
    "Este relatorio e gerado a partir das partituras em `docs/musics` e resume a leitura atual do motor sobre cada arquivo real.",
    "Escopo: apenas arquivos `.musicxml` no nivel raiz de `docs/musics`; subpastas importadas sao cobertas pelas auditorias F108/F109.",
    "",
    "A leitura nao pretende ser julgamento estetico final. Ela registra o que o sistema conseguiu importar, qual janela melodica foi usada, qual centro foi escolhido e qual proposta primaria saiu do pipeline.",
    "",
    "## Resumo geral",
    "",
    `- Arquivos auditados: ${results.length}`,
    `- Arquivos harmonizados: ${results.filter(result => result.status === "harmonized").length}`,
    `- Arquivos apenas com referencia harmonica: ${results.filter(result => result.status === "reference-only").length}`,
    `- Arquivos sem proposta na janela auditada: ${results.filter(result => result.status === "no-proposal").length}`,
    `- Obras com cores funcionais: ${functionalColorTotals.filesWithFunctionalColors}`,
    `- Cores funcionais geradas: ${functionalColorTotals.generatedCount}`,
    `- Cores funcionais como alternativas: ${functionalColorTotals.nonPrimaryCount}`,
    `- Obras com bVI/bVII na referencia: ${modalBorrowingReferenceTotals.filesWithColors}`,
    `- Cores bVI/bVII na referencia: ${modalBorrowingReferenceTotals.count}`,
    `- Caminhos alinhados: ${dualPathTotals.aligned}`,
    `- Referencia destrava harmonizacao: ${dualPathTotals.referenceUnlocksHarmony}`,
    `- Referencia muda centro: ${dualPathTotals.referenceShiftsCenter}`,
    `- Mesmo centro, harmonizacao diferente: ${dualPathTotals.sameCenterDifferentHarmonization}`,
    `- Mesmo centro, referencia enriquece rota: ${sameCenterReferenceContributionTotals["enriches-route"]}`,
    `- Mesmo centro, revisar rota da referencia: ${sameCenterReferenceContributionTotals["changes-route-for-review"]}`,
    `- Baixo da referencia preservado parcialmente: ${bassPreservationTotals.partial}`,
    `- Baixo da referencia pouco preservado: ${bassPreservationTotals.low}`,
    `- Sem proposta comparavel entre caminhos: ${dualPathTotals.noComparableProposal}`,
    `- Triagem centro local da referencia: ${centerShiftTriageTotals.likelyReferenceLocalCenter}`,
    `- Triagem relativo maior/menor resolvido: ${centerShiftTriageTotals.relativeMajorMinorResolved}`,
    `- Triagem revisar centro inferido: ${centerShiftTriageTotals.reviewReferenceCenter}`,
    `- Triagem vocabulario melodia-only: ${centerShiftTriageTotals.melodyOnlyVocabularyGap}`,
    `- Centros alterados alinhados com a referencia: ${centerShiftReferenceAlignmentTotals.aligned}`,
    `- Centros alterados parcialmente alinhados: ${centerShiftReferenceAlignmentTotals.partial}`,
    `- Centros alterados ainda divergentes: ${centerShiftReferenceAlignmentTotals.divergent}`,
    `- Centros alterados para escuta/revisao da referencia: ${centerShiftReferenceAlignmentTotals.partial}`,
    `- Amostras de triagem - referencia muda centro: ${examplesSummary(dualPathTotals.examples.referenceShiftsCenter)}`,
    `- Amostras de triagem - mesmo centro, harmonizacao diferente: ${examplesSummary(dualPathTotals.examples.sameCenterDifferentHarmonization)}`,
    `- Amostras de triagem - referencia destrava harmonizacao: ${examplesSummary(dualPathTotals.examples.referenceUnlocksHarmony)}`,
    "",
    "## Triagem de centros alterados pela referencia",
    "",
    ...centerShiftTriageLines(results),
    "",
    "## Triagem de mesmo centro",
    "",
    ...sameCenterTriageLines(results),
    "",
    "## Triagem de baixo da referencia",
    "",
    ...referenceBassTriageLines(results),
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
    lines.push(`- Cores funcionais: ${functionalColorSummary(result.functionalColors)}`);
    if (result.functionalColors && result.functionalColors.examples.length > 0) {
      lines.push(`- Cores funcionais alternativas: ${result.functionalColors.examples.join("; ")}`);
    }
    lines.push(`- Cores bVI/bVII na referencia: ${modalBorrowingReferenceSummary(result.modalBorrowingReferenceColors)}`);
    if (result.dualPathComparison) {
      lines.push(`- Caminho melodia-only: ${pathSummary(result.dualPathComparison.melodyOnly)}`);
      lines.push(`- Caminho com referencia: ${pathSummary(result.dualPathComparison.referenceAware)}`);
      lines.push(`- Divergencia dos caminhos: ${pathDivergenceSummary(result.dualPathComparison)}`);
      lines.push(`- Leitura da divergencia: ${dualPathClassificationLabel(result.dualPathComparison.classification, result)}`);
    }
    lines.push(`- Proposta primaria: ${primary?.name || "sem proposta primaria"}`);
    lines.push(`- Camada da proposta: ${primary ? presentationLayerLabel(primary.presentationLayer) : "n/a"}`);
    const cadentialTarget = proposalCadentialTarget(primary);
    lines.push(`- Alvo cadencial da proposta: ${cadentialTarget || "n/a"}`);
    lines.push(`- Resumo: rota ${primary?.routeProfile || "n/a"}; baixo ${primary?.bassLineProfile || "n/a"}; conducao ${formatNumber(primary?.voiceLeadingScore)}`);
    if (result.referenceWindowChords) lines.push(`- Referencia na janela: ${result.referenceWindowChords}`);
    lines.push(`- Cifras: ${primary ? chordSummary(primary) : "n/a"}`);
    if (result.referenceWindowBass) lines.push(`- Baixo da referencia: ${result.referenceWindowBass}`);
    lines.push(`- Baixo: ${primary?.bassLine.join(" -> ") || "n/a"}`);
    if (result.referenceBassAgreement) lines.push(`- Preservacao do baixo: ${result.referenceBassAgreement}`);
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
  lines.push("As cores funcionais aparecem de forma pontual e, no estado atual, ficam como alternativas nao primarias. Isso sugere que elas podem ser expostas como camada de rearmonizacao/cores sem disputar diretamente com a harmonia basica.");
  lines.push("As leituras de bVI/bVII na referencia ajudam a separar emprestimo modal tonal de centro modal antes de liberar novas estrategias gerativas.");
  lines.push("A comparacao melodia-only vs referencia-aware separa duas competencias: harmonizar a partir da melodia e entender a harmonia escrita pelo autor.");
  lines.push("As amostras de triagem nao sao conclusao estatistica: elas apenas indicam quais obras abrir primeiro enquanto o corpus de referencia ainda e pequeno.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

interface DualPathClassificationTotals {
  aligned: number;
  referenceUnlocksHarmony: number;
  referenceShiftsCenter: number;
  sameCenterDifferentHarmonization: number;
  differentHarmonization: number;
  noComparableProposal: number;
  examples: {
    referenceUnlocksHarmony: string[];
    referenceShiftsCenter: string[];
    sameCenterDifferentHarmonization: string[];
    noComparableProposal: string[];
  };
}

function summarizeDualPathClassificationTotals(results: RealMusicAuditResult[]): DualPathClassificationTotals {
  return results.reduce((totals, result) => {
    const classification = result.dualPathComparison?.classification;
    if (classification === "aligned") totals.aligned++;
    if (classification === "reference-unlocks-harmony") {
      totals.referenceUnlocksHarmony++;
      appendExample(totals.examples.referenceUnlocksHarmony, formatDualPathExample(result));
    }
    if (classification === "reference-shifts-center") {
      totals.referenceShiftsCenter++;
      appendExample(totals.examples.referenceShiftsCenter, formatDualPathExample(result));
    }
    if (classification === "same-center-different-harmonization") {
      totals.sameCenterDifferentHarmonization++;
      appendExample(totals.examples.sameCenterDifferentHarmonization, formatDualPathExample(result));
    }
    if (classification === "different-harmonization") totals.differentHarmonization++;
    if (classification === "no-comparable-proposal") {
      totals.noComparableProposal++;
      appendExample(totals.examples.noComparableProposal, formatDualPathExample(result));
    }
    return totals;
  }, {
    aligned: 0,
    referenceUnlocksHarmony: 0,
    referenceShiftsCenter: 0,
    sameCenterDifferentHarmonization: 0,
    differentHarmonization: 0,
    noComparableProposal: 0,
    examples: {
      referenceUnlocksHarmony: [],
      referenceShiftsCenter: [],
      sameCenterDifferentHarmonization: [],
      noComparableProposal: []
    }
  });
}

function appendExample(examples: string[], file: string): void {
  if (examples.length < 3) examples.push(file);
}

function examplesSummary(examples: string[]): string {
  return examples.length > 0 ? examples.join("; ") : "nenhum";
}

function summarizeCenterShiftTriageTotals(results: RealMusicAuditResult[]): Record<
  "likelyReferenceLocalCenter" | "relativeMajorMinorResolved" | "reviewReferenceCenter" | "melodyOnlyVocabularyGap",
  number
> {
  return results.reduce((totals, result) => {
    if (result.dualPathComparison?.classification !== "reference-shifts-center") return totals;

    const category = classifyCenterShiftTriage(result);
    if (category === "likely-reference-local-center") totals.likelyReferenceLocalCenter++;
    if (category === "relative-major-minor-resolved") totals.relativeMajorMinorResolved++;
    if (category === "review-reference-center") totals.reviewReferenceCenter++;
    if (category === "melody-only-vocabulary-gap") totals.melodyOnlyVocabularyGap++;
    return totals;
  }, {
    likelyReferenceLocalCenter: 0,
    relativeMajorMinorResolved: 0,
    reviewReferenceCenter: 0,
    melodyOnlyVocabularyGap: 0
  });
}

function summarizeCenterShiftReferenceAlignmentTotals(results: RealMusicAuditResult[]): Record<CenterShiftReferenceAlignment, number> {
  return results.reduce((totals, result) => {
    if (result.dualPathComparison?.classification !== "reference-shifts-center") return totals;
    totals[classifyCenterShiftReferenceAlignment(result)]++;
    return totals;
  }, {
    aligned: 0,
    partial: 0,
    divergent: 0
  });
}

function summarizeSameCenterReferenceContributionTotals(results: RealMusicAuditResult[]): Record<SameCenterReferenceContribution, number> {
  return results.reduce((totals, result) => {
    if (result.dualPathComparison?.classification !== "same-center-different-harmonization") return totals;
    totals[classifySameCenterReferenceContribution(result)]++;
    return totals;
  }, {
    "enriches-route": 0,
    "changes-route-for-review": 0
  });
}

function summarizeBassPreservationTotals(results: RealMusicAuditResult[]): { partial: number; low: number } {
  return results.reduce((totals, result) => {
    const ratio = result.referenceBassAgreementRatio;
    if (ratio === undefined) return totals;
    if (ratio < 0.5) totals.low++;
    else if (ratio < 0.75) totals.partial++;
    return totals;
  }, {
    partial: 0,
    low: 0
  });
}

function centerShiftTriageLines(results: RealMusicAuditResult[]): string[] {
  const shifted = results.filter(result => result.dualPathComparison?.classification === "reference-shifts-center");
  if (shifted.length === 0) return ["Nenhuma obra nesta categoria."];

  return shifted.map(result => {
    const comparison = result.dualPathComparison!;
    const melody = comparison.melodyOnly.selectedCenter || "sem centro";
    const reference = comparison.referenceAware.selectedCenter || "sem centro";
    const proposal = comparison.referenceAware.primaryProposalName || "sem proposta";
    const referenceCenter = referenceCenterSummary(result.referenceComparison) || "referencia sem centro inferido";
    const triage = centerShiftTriageLabel(classifyCenterShiftTriage(result));
    const alignment = centerShiftReferenceAlignmentLabel(classifyCenterShiftReferenceAlignment(result));
    const comparisonSummary = referenceComparisonSummary(result.referenceComparison);
    return `- ${result.file}: ${triage}; ${alignment}; melodia ${melody}; referencia ${reference}; proposta ${proposal}; ${referenceCenter}; ${comparisonSummary}`;
  });
}

function sameCenterTriageLines(results: RealMusicAuditResult[]): string[] {
  const sameCenter = results.filter(result => result.dualPathComparison?.classification === "same-center-different-harmonization");
  if (sameCenter.length === 0) return ["Nenhuma obra nesta categoria."];

  return sameCenter.map(result => {
    const comparison = result.dualPathComparison!;
    const center = comparison.referenceAware.selectedCenter || comparison.melodyOnly.selectedCenter || "sem centro";
    const melodyProposal = comparison.melodyOnly.primaryProposalName || "sem proposta";
    const referenceProposal = comparison.referenceAware.primaryProposalName || "sem proposta";
    const contribution = sameCenterReferenceContributionLabel(classifySameCenterReferenceContribution(result));
    const comparisonSummary = referenceComparisonSummary(result.referenceComparison);
    const vocabulary = referenceVocabularyLabel(result.referenceVocabulary);
    return `- ${result.file}: ${contribution}; centro ${center}; melodia ${melodyProposal}; referencia ${referenceProposal}; ${comparisonSummary}; ${vocabulary}`;
  });
}

function referenceBassTriageLines(results: RealMusicAuditResult[]): string[] {
  const candidates = results
    .filter(result => result.referenceBassAgreementRatio !== undefined && result.referenceBassAgreementRatio < 0.75)
    .sort((a, b) => (a.referenceBassAgreementRatio || 0) - (b.referenceBassAgreementRatio || 0));

  if (candidates.length === 0) return ["Nenhuma obra nesta categoria."];

  return candidates.map(result => {
    const ratio = result.referenceBassAgreementRatio || 0;
    const label = ratio < 0.5 ? "baixo pouco preservado" : "baixo parcialmente preservado";
    const proposal = result.primaryProposal?.name || "sem proposta";
    return `- ${result.file}: ${label}; ${result.referenceBassAgreement}; proposta ${proposal}`;
  });
}

function classifySameCenterReferenceContribution(result: RealMusicAuditResult): SameCenterReferenceContribution {
  return result.referenceComparison?.status === "aligned"
    ? "enriches-route"
    : "changes-route-for-review";
}

function sameCenterReferenceContributionLabel(category: SameCenterReferenceContribution): string {
  if (category === "enriches-route") return "referencia enriquece rota no mesmo centro";
  return "referencia muda rota para escuta/revisao";
}

function referenceVocabularyLabel(summary: AppliedHarmonicVocabularySummary | undefined): string {
  if (!summary) return "vocabulario da referencia: n/a";
  const labels: string[] = [];
  if (summary.iiVCells > 0) labels.push(`${summary.iiVCells} ii-V`);
  if (summary.appliedDominants > 0) labels.push(`${summary.appliedDominants} dominantes aplicadas`);
  if (summary.primaryDominants > 0) labels.push(`${summary.primaryDominants} dominantes primarias`);
  if (summary.tritoneSubstitutions > 0) labels.push(`${summary.tritoneSubstitutions} SubV`);
  if (summary.resolvedDiminished > 0) labels.push(`${summary.resolvedDiminished} diminutos resolvidos`);
  if (summary.modalBorrowingColors > 0) labels.push(`${summary.modalBorrowingColors} emprestimos modais`);
  if (summary.minorPlagalCadences > 0) labels.push(`${summary.minorPlagalCadences} cadencias plagais menores`);
  if (summary.tonicMajorSixths > 0) labels.push(`${summary.tonicMajorSixths} tonicas 6/6-9`);
  if (summary.slashChordDensity >= 0.25) labels.push(`baixo indicado ${summary.slashChordDensity.toFixed(2)}`);
  return labels.length > 0
    ? `vocabulario da referencia: ${labels.join(", ")}`
    : "vocabulario da referencia: funcional direto";
}

function classifyCenterShiftReferenceAlignment(result: RealMusicAuditResult): CenterShiftReferenceAlignment {
  const status = result.referenceComparison?.status;
  if (status === "aligned") return "aligned";
  if (status === "partially-aligned") return "partial";
  return "divergent";
}

function classifyCenterShiftTriage(result: RealMusicAuditResult): CenterShiftTriageCategory {
  const comparison = result.referenceComparison;
  const dualPath = result.dualPathComparison;
  if (!comparison || !dualPath) return "review-reference-center";

  const referenceAwareCenter = dualPath.referenceAware.selectedCenter;
  const melodyOnlyCenter = dualPath.melodyOnly.selectedCenter;
  const relativePairResolved = comparison.status === "aligned"
    && isRelativeMajorMinorPair(melodyOnlyCenter, referenceAwareCenter);
  const localReferenceCenter = centerName(comparison.localReferenceCenter, comparison.localReferenceCenterMode);
  const globalReferenceCenter = centerName(comparison.globalReferenceCenter, comparison.globalReferenceCenterMode);
  const mainReferenceCenter = centerName(comparison.referenceCenter, comparison.referenceCenterMode);
  const localConfidence = comparison.localReferenceCenterConfidence || "weak";
  const mainConfidence = comparison.referenceCenterConfidence || "weak";
  const hasConfidentLocalReference = localReferenceCenter === referenceAwareCenter && localConfidence !== "weak";
  const hasConfidentReference = mainReferenceCenter === referenceAwareCenter && mainConfidence !== "weak";
  const melodyMatchesGlobalReference = Boolean(globalReferenceCenter && globalReferenceCenter === melodyOnlyCenter);
  const hasNonTonalOrIdiomaticReference = Boolean(
    comparison.referenceIdiom
    && comparison.referenceIdiom !== "major-functional"
    && comparison.referenceIdiom !== "minor-functional"
  );

  if (
    mainConfidence === "weak"
    || (localReferenceCenter && localConfidence === "weak" && localReferenceCenter !== referenceAwareCenter)
  ) {
    if (relativePairResolved) return "relative-major-minor-resolved";
    return "review-reference-center";
  }

  if (relativePairResolved) return "relative-major-minor-resolved";

  if (hasConfidentLocalReference || (hasConfidentReference && melodyMatchesGlobalReference)) {
    return "likely-reference-local-center";
  }

  if (hasNonTonalOrIdiomaticReference || comparison.causes.includes("reference-idiom-context")) {
    return "melody-only-vocabulary-gap";
  }

  return hasConfidentReference ? "likely-reference-local-center" : "review-reference-center";
}

function centerName(center: string | undefined, mode: "major" | "minor" | undefined): string | undefined {
  if (!center) return undefined;
  return `${center} ${mode || "major"}`;
}

function parseCenterName(center: string | undefined): { tonic: string; mode: "major" | "minor" } | null {
  const match = center?.match(/^([A-G](?:#|b)?) (major|minor)$/);
  if (!match) return null;
  const tonic = Note.pitchClass(match[1]);
  if (!tonic) return null;
  return { tonic, mode: match[2] as "major" | "minor" };
}

function isRelativeMajorMinorPair(a: string | undefined, b: string | undefined): boolean {
  const first = parseCenterName(a);
  const second = parseCenterName(b);
  if (!first || !second || first.mode === second.mode) return false;

  const major = first.mode === "major" ? first : second;
  const minor = first.mode === "minor" ? first : second;
  const relativeMinor = Scale.get(`${major.tonic} major`).notes[5];
  return Note.pitchClass(relativeMinor) === minor.tonic;
}

function centerShiftTriageLabel(category: CenterShiftTriageCategory): string {
  if (category === "likely-reference-local-center") return "hipotese: centro local da referencia";
  if (category === "relative-major-minor-resolved") return "hipotese: relativo maior/menor resolvido pela referencia";
  if (category === "review-reference-center") return "hipotese: revisar centro inferido";
  return "hipotese: vocabulario melodia-only insuficiente";
}

function centerShiftReferenceAlignmentLabel(category: CenterShiftReferenceAlignment): string {
  if (category === "aligned") return "referencia alinhada";
  if (category === "partial") return "referencia parcial para escuta/revisao";
  return "referencia divergente";
}

function formatDualPathExample(result: RealMusicAuditResult): string {
  const comparison = result.dualPathComparison;
  if (!comparison) return result.file;

  const melodyCenter = comparison.melodyOnly.selectedCenter || "sem centro";
  const referenceCenter = comparison.referenceAware.selectedCenter || "sem centro";
  const melodyPrimary = comparison.melodyOnly.primaryProposalName || "sem proposta";
  const referencePrimary = comparison.referenceAware.primaryProposalName || "sem proposta";

  if (comparison.classification === "reference-shifts-center") {
    return `${result.file} (${melodyCenter} -> ${referenceCenter})`;
  }

  if (comparison.classification === "same-center-different-harmonization") {
    return `${result.file} (${melodyPrimary} -> ${referencePrimary})`;
  }

  if (comparison.classification === "reference-unlocks-harmony") {
    return `${result.file} (sem proposta -> ${referencePrimary})`;
  }

  return result.file;
}

function emptyPathSummary(): HarmonizationPathSummary {
  return {
    status: "no-proposal",
    windowMeasures: [],
    proposalCount: 0
  };
}

function emptyDualPathComparison(): DualHarmonizationPathComparison {
  const empty = emptyPathSummary();
  return {
    melodyOnly: empty,
    referenceAware: empty,
    classification: "no-comparable-proposal",
    centerChanged: false,
    primaryChanged: false,
    chordsChanged: false
  };
}

function compareHarmonizationPaths(
  melodyOnly: RealMusicAuditWindow | null,
  referenceAware: RealMusicAuditWindow | null,
  hasReferenceHarmony: boolean,
  referenceHarmonies: ScoreHarmonyEvent[] = []
): DualHarmonizationPathComparison | undefined {
  if (!hasReferenceHarmony && !melodyOnly && !referenceAware) return undefined;

  const melodyOnlySummary = summarizeHarmonizationPath(melodyOnly, []);
  const referenceAwareSummary = summarizeHarmonizationPath(referenceAware, referenceHarmonies);

  const comparison = {
    melodyOnly: melodyOnlySummary,
    referenceAware: referenceAwareSummary,
    centerChanged: melodyOnlySummary.selectedCenter !== referenceAwareSummary.selectedCenter,
    primaryChanged: melodyOnlySummary.primaryProposalName !== referenceAwareSummary.primaryProposalName,
    chordsChanged: melodyOnlySummary.primaryChords !== referenceAwareSummary.primaryChords,
    classification: "aligned" as DualPathClassification
  };
  return {
    ...comparison,
    classification: classifyDualPathComparison(comparison)
  };
}

function classifyDualPathComparison(
  comparison: Omit<DualHarmonizationPathComparison, "classification">
): DualPathClassification {
  if (comparison.melodyOnly.status !== "harmonized" && comparison.referenceAware.status === "harmonized") {
    return "reference-unlocks-harmony";
  }

  if (comparison.melodyOnly.status !== "harmonized" || comparison.referenceAware.status !== "harmonized") {
    return "no-comparable-proposal";
  }

  if (comparison.centerChanged) return "reference-shifts-center";
  if (comparison.primaryChanged || comparison.chordsChanged) return "same-center-different-harmonization";
  return "aligned";
}

function summarizeHarmonizationPath(
  window: RealMusicAuditWindow | null,
  referenceHarmonies: ScoreHarmonyEvent[]
): HarmonizationPathSummary {
  if (!window) return emptyPathSummary();

  const ranked = rankReharmonizationProposalsByVoiceLeading(
    proposalsForAuditWindow(window, referenceHarmonies),
    window.phraseContext,
    window.anchors,
    { referenceHarmonies }
  );
  const presented = annotateProposalPresentationRoles(ranked, "balanced", window.phraseContext);
  const primary = selectPrimaryProposal(presented);

  return {
    status: primary ? "harmonized" : "no-proposal",
    windowMeasures: Array.from(new Set(window.anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b),
    selectedCenter: `${window.phraseContext.selectedCenter.tonic} ${window.phraseContext.selectedCenter.mode}`,
    selectedCenterSource: window.phraseContext.selectedCenterSource,
    proposalCount: presented.length,
    primaryProposalName: primary?.name,
    primaryChords: primary ? chordSummary(primary) : undefined
  };
}

function pathSummary(summary: HarmonizationPathSummary): string {
  if (summary.status !== "harmonized") return "sem proposta";
  const source = summary.selectedCenterSource === "reference" ? "referencia" : "melodia";
  return `centro ${summary.selectedCenter || "n/a"} (${source}); primaria ${summary.primaryProposalName || "n/a"}; ${summary.proposalCount} propostas`;
}

function pathDivergenceSummary(comparison: DualHarmonizationPathComparison): string {
  const divergences = [
    comparison.centerChanged ? "centro" : null,
    comparison.primaryChanged ? "proposta primaria" : null,
    comparison.chordsChanged ? "cifras" : null
  ].filter((item): item is string => item !== null);

  return divergences.length > 0 ? divergences.join(", ") : "caminhos alinhados";
}

function dualPathClassificationLabel(
  classification: DualPathClassification,
  result?: RealMusicAuditResult
): string {
  if (classification === "aligned") return "caminhos alinhados";
  if (classification === "reference-unlocks-harmony") return "a referência destrava a harmonização";
  if (classification === "reference-shifts-center") {
    return result && classifyCenterShiftTriage(result) === "relative-major-minor-resolved"
      ? "a harmonia escrita resolve a ambiguidade relativo maior/menor"
      : "a referência muda o centro percebido";
  }
  if (classification === "same-center-different-harmonization") return "mesmo centro, harmonização diferente";
  if (classification === "different-harmonization") return "harmonização diferente";
  return "sem proposta comparável";
}

function presentationLayerLabel(layer: ReharmonizationProposal["presentationLayer"]): string {
  if (layer === "basic") return "harmonia basica";
  if (layer === "reference-aware") return "centro de referencia";
  if (layer === "reharmonization") return "rearmonizacao";
  return "sem camada";
}

function summarizeModalBorrowingReferenceTotals(
  results: RealMusicAuditResult[]
): ModalBorrowingReferenceSummary & { filesWithColors: number } {
  return results.reduce((summary, result) => {
    const colors = result.modalBorrowingReferenceColors || emptyModalBorrowingReferenceSummary();
    return {
      filesWithColors: summary.filesWithColors + (colors.count > 0 ? 1 : 0),
      count: summary.count + colors.count,
      examples: []
    };
  }, {
    filesWithColors: 0,
    count: 0,
    examples: []
  });
}

function summarizeFunctionalColorTotals(results: RealMusicAuditResult[]): FunctionalColorAuditSummary & { filesWithFunctionalColors: number } {
  return results.reduce((summary, result) => {
    const colors = result.functionalColors || emptyFunctionalColorSummary();
    return {
      filesWithFunctionalColors: summary.filesWithFunctionalColors + (colors.generatedCount > 0 ? 1 : 0),
      generatedCount: summary.generatedCount + colors.generatedCount,
      nonPrimaryCount: summary.nonPrimaryCount + colors.nonPrimaryCount,
      examples: []
    };
  }, {
    filesWithFunctionalColors: 0,
    generatedCount: 0,
    nonPrimaryCount: 0,
    examples: []
  });
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
    .map(measure => `${measure.measureIndex}:${measure.chords.join(", ")}`)
    .join(" | ");
}

function normalizedReferenceChord(chord: string): string {
  const resolved = resolveChordSymbol(chord, "plain");
  return resolved.warnings.length === 0 ? resolved.normalized : chord;
}

function bassForChord(chord: string): string {
  const resolved = resolveChordSymbol(chord, "plain");
  if (resolved.bass) return resolved.bass;
  if (resolved.root) return resolved.root;
  return chord.match(/^[A-G](?:#|b)?/)?.[0] || chord;
}

function referenceHarmonySummary(harmonies: ScoreHarmonyEvent[]): string | undefined {
  if (harmonies.length === 0) return undefined;
  const byMeasure = new Map<number, string[]>();
  for (const harmony of harmonies) {
    const chords = byMeasure.get(harmony.measure) || [];
    chords.push(normalizedReferenceChord(harmony.harmony));
    byMeasure.set(harmony.measure, chords);
  }

  return Array.from(byMeasure.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([measure, chords]) => `${measure}:${chords.join(", ")}`)
    .join(" | ");
}

function referenceBassLine(harmonies: ScoreHarmonyEvent[]): string[] {
  return harmonies.map(harmony => bassForChord(normalizedReferenceChord(harmony.harmony)));
}

function referenceBassSummary(harmonies: ScoreHarmonyEvent[]): string | undefined {
  const bass = referenceBassLine(harmonies);
  return bass.length > 0 ? bass.join(" -> ") : undefined;
}

function referenceBassAgreement(
  harmonies: ScoreHarmonyEvent[],
  proposal: ReharmonizationProposal | undefined
): { matching: number; compared: number; ratio: number } | undefined {
  if (!proposal || harmonies.length === 0 || proposal.bassLine.length === 0) return undefined;
  const referenceBass = referenceBassLine(harmonies);
  const compared = Math.min(referenceBass.length, proposal.bassLine.length);
  if (compared === 0) return undefined;
  const matching = referenceBass
    .slice(0, compared)
    .filter((bass, index) => bass === proposal.bassLine[index])
    .length;
  return {
    matching,
    compared,
    ratio: matching / compared
  };
}

function diagnosticSummary(diagnostics: HarmonicDiagnostic[]): string[] {
  return Array.from(new Set(diagnostics.map(item => item.message))).slice(0, 4);
}

function proposalExplanationSummary(proposal: ReharmonizationProposal | undefined): string[] {
  if (!proposal) return [];
  return Array.from(new Set(proposal.explanation)).slice(0, 4);
}

function emptyFunctionalColorSummary(): FunctionalColorAuditSummary {
  return {
    generatedCount: 0,
    nonPrimaryCount: 0,
    examples: []
  };
}

function emptyModalBorrowingReferenceSummary(): ModalBorrowingReferenceSummary {
  return {
    count: 0,
    examples: []
  };
}

function modalBorrowingReferenceSummary(summary: ModalBorrowingReferenceSummary | undefined): string {
  if (!summary || summary.count === 0) return "0 ocorrencias";
  return `${summary.count} ocorrencias (${summary.examples.join("; ")})`;
}

function summarizeModalBorrowingReferenceColors(
  harmonies: ScoreHarmonyEvent[],
  anchors: MelodicAnchor[],
  phraseContext: PhraseContext,
  comparison: ReferenceHarmonyComparison | undefined
): ModalBorrowingReferenceSummary {
  const windowMeasures = new Set(anchors.map(anchor => anchor.measureIndex));
  const idiom = comparison?.referenceIdiom === "modal" || comparison?.referenceIdiom === "minor-functional"
    ? comparison.referenceIdiom
    : comparison?.referenceIdiom === "blues" || comparison?.referenceIdiom === "major-functional"
      ? comparison.referenceIdiom
      : undefined;
  const analyses = harmonies
    .filter(harmony => windowMeasures.has(harmony.measure))
    .flatMap(harmony => analyzeModalBorrowingColors([harmony.harmony], {
      center: phraseContext.selectedCenter.tonic,
      mode: phraseContext.selectedCenter.mode,
      idiom
    }).map(analysis => ({ harmony, analysis })));

  return {
    count: analyses.length,
    examples: analyses.slice(0, 3).map(({ harmony, analysis }) => {
      const role = analysis.role === "BORROWED_FLAT_VI" ? "bVI" : "bVII";
      return `comp. ${harmony.measure}: ${harmony.harmony} como ${role}`;
    })
  };
}

function isFunctionalColorProposal(proposal: ReharmonizationProposal): boolean {
  if (proposal.id === "controlled-reference-rhythm" || proposal.id === "controlled-reference-contour") return false;
  return proposal.name === "Estratégia — Função aparente"
    || proposal.name === "Estratégia — Empréstimo modal"
    || proposal.explanation.some(item => /Função aparente/i.test(item))
    || proposal.explanation.some(item => /empréstimo modal|modo paralelo/i.test(item))
    || (proposal.apparentFunctionReferenceBonus || 0) > 0;
}

function summarizeFunctionalColorAlternatives(
  proposals: ReharmonizationProposal[],
  primaryProposal: ReharmonizationProposal | undefined
): FunctionalColorAuditSummary {
  const functionalColors = proposals.filter(isFunctionalColorProposal);
  const nonPrimary = functionalColors.filter(proposal => proposal.id !== primaryProposal?.id);
  return {
    generatedCount: functionalColors.length,
    nonPrimaryCount: nonPrimary.length,
    examples: nonPrimary.slice(0, 3).map(functionalColorExample)
  };
}

function functionalColorSummary(summary: FunctionalColorAuditSummary | undefined): string {
  if (!summary || summary.generatedCount === 0) return "0 geradas";
  return `${summary.generatedCount} geradas, ${summary.nonPrimaryCount} alternativas nao primarias`;
}

function functionalColorExample(proposal: ReharmonizationProposal): string {
  const evidence = proposal.explanation
    .filter(item => /Função aparente:/i.test(item))
    .map(item => item.replace(/^Função aparente:\s*/i, ""));
  if (evidence.length > 0) return Array.from(new Set(evidence)).slice(0, 2).join(", ");
  const modalBorrowing = proposal.explanation.find(item => /substitui .* por .*m/i.test(item));
  if (modalBorrowing && proposal.name === "Estratégia — Empréstimo modal") return modalBorrowing;
  return chordSummary(proposal);
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
    if (cause === "apparent-function-preserved") return "função aparente preservada";
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
  const ranked = rankReharmonizationProposalsByVoiceLeading(
    proposalsForAuditWindow({ generation, phraseContext, anchors, referenceOverlapCount: 0 }, referenceHarmonies),
    phraseContext,
    anchors,
    { referenceHarmonies }
  );
  const presented = annotateProposalPresentationRoles(ranked, "balanced", phraseContext);
  return Math.max(
    0,
    ...presented
      .filter(proposal => proposal.kind !== "reference")
      .map(proposal => proposal.measures.filter(measure => referenceMeasures.has(measure.measureIndex)).length)
  );
}

function selectPrimaryProposal(
  proposals: ReharmonizationProposal[]
): ReharmonizationProposal | undefined {
  return proposals.find(proposal => proposal.presentationRole === "primary");
}
