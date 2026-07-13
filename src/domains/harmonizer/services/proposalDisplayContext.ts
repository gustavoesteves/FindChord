import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";

const MAX_TITLE_DETAIL_CHORDS = 5;

export function proposalDisplayNameCounts(proposals: ReharmonizationProposal[]): Map<string, number> {
  return proposals.reduce((counts, proposal) => {
    counts.set(proposal.name, (counts.get(proposal.name) || 0) + 1);
    return counts;
  }, new Map<string, number>());
}

export function proposalTitleDetail(
  proposal: ReharmonizationProposal,
  nameCounts: Map<string, number>
): string | undefined {
  if ((nameCounts.get(proposal.name) || 0) <= 1) return undefined;

  const chords = proposal.measures.flatMap(measure => measure.chords);
  const visibleChords = chords.slice(0, MAX_TITLE_DETAIL_CHORDS);
  const suffix = chords.length > visibleChords.length ? "..." : "";
  const measureIndexes = proposal.measures.map(measure => measure.measureIndex).sort((a, b) => a - b);
  const firstMeasure = measureIndexes[0];
  const lastMeasure = measureIndexes[measureIndexes.length - 1];
  const scope = firstMeasure === lastMeasure ? `Comp. ${firstMeasure}` : `Comp. ${firstMeasure}-${lastMeasure}`;
  const route = `${scope} · Percurso: ${visibleChords.join(" - ")}${suffix}`;
  const apparentFunctionLabel = apparentFunctionDetail(proposal);

  if (proposal.cadentialTarget && /ii-V/i.test(proposal.name)) {
    return `Alvo: ${proposal.cadentialTarget} · ${route}`;
  }

  if (proposal.cadentialTarget && /Centro de referência/i.test(proposal.name)) {
    return `Centro: ${proposal.cadentialTarget} · ${route}`;
  }

  if (apparentFunctionLabel) {
    return `${apparentFunctionLabel} · ${route}`;
  }

  return route;
}

function apparentFunctionDetail(proposal: ReharmonizationProposal): string | undefined {
  if (!/Função aparente/i.test(proposal.name)) return undefined;

  const substitution = proposal.explanation.find(item => /substitui .* por /i.test(item));
  if (substitution) return `Leitura: ${substitution}`;

  const insertion = proposal.explanation.find(item => /insere .* antes de /i.test(item));
  if (insertion) return `Leitura: ${insertion}`;

  const role = proposal.explanation.find(item => /trata .* como /i.test(item));
  if (role) return `Leitura: ${role}`;

  return undefined;
}

export function proposalVisibleSignature(
  proposal: ReharmonizationProposal,
  nameCounts: Map<string, number>
): string {
  const detail = proposalTitleDetail(proposal, nameCounts);
  return detail ? `${proposal.name} — ${detail}` : proposal.name;
}
