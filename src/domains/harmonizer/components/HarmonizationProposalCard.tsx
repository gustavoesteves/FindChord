import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type {
  ReharmonizationInputContext,
  ReharmonizationProposal,
  ReharmonizationProposalKind,
  ReharmonizationRouteProfile
} from "../../../utils/music/analysis/models/ReharmonizationProposal";
import type { LocalSegmentOccurrence } from "../services/localSegmentHarmonization";
import { inputContextLabel } from "../services/harmonizerInputContext";
import type {
  HarmonicDiagnosticCategory
} from "../../../utils/music/analysis/models/HarmonicDiagnostic";

interface HarmonizationProposalCardProps {
  proposal: ReharmonizationProposal;
  onApply: (proposal: ReharmonizationProposal) => void;
  applyLabel?: string;
  titleDetail?: string;
  localOccurrences?: LocalSegmentOccurrence[];
}

function measureLabel(currentMeasure: number, nextMeasure?: number): string {
  if (!nextMeasure || nextMeasure <= currentMeasure + 1) return `Comp. ${currentMeasure}`;
  return `Comp. ${currentMeasure}-${nextMeasure - 1}`;
}

interface ChordChange {
  measureIndex: number;
  from: string;
  to: string;
}

function chordChanges(
  proposal: ReharmonizationProposal,
  variant: ReharmonizationProposal
): ChordChange[] {
  const baseByMeasure = new Map(proposal.measures.map(measure => [measure.measureIndex, measure.chords]));
  return variant.measures.flatMap(measure => measure.chords.flatMap((chord, chordIndex) => {
    const baseChord = baseByMeasure.get(measure.measureIndex)?.[chordIndex];
    if (!baseChord || baseChord === chord) return [];
    return [{ measureIndex: measure.measureIndex, from: baseChord, to: chord }];
  }));
}

const KIND_LABELS: Record<ReharmonizationProposalKind, string> = {
  reference: "Harmonia da partitura",
  "validated-harmonization": "Proposta harmônica",
  "controlled-reharmonization": "Rearmonização",
  "experimental-exploration": "Exploração distante"
};

const ROUTE_PROFILE_LABELS: Record<ReharmonizationRouteProfile, string> = {
  conservative: "Próxima",
  moderate: "Moderada",
  chromatic: "Cromática",
  radical: "Mais distante"
};

const DIAGNOSTIC_CATEGORY_LABELS: Record<HarmonicDiagnosticCategory, string> = {
  omission: "Fora da seleção",
  comparison: "Contexto",
  compatibility: "Melodia"
};
const INPUT_CONTEXT_TONE: Record<ReharmonizationInputContext, string> = {
  "melody-only": "text-emerald-300",
  "melody-with-reference-harmony": "text-sky-300",
  "harmony-only-analysis": "text-amber-300"
};

function voiceLeadingLabel(score: number): string {
  if (score <= 3) return "Condução muito próxima";
  if (score <= 6) return "Condução suave";
  if (score <= 10) return "Movimento moderado";
  return "Movimento amplo";
}

export function proposalKindLabel(kind: ReharmonizationProposalKind): string {
  return KIND_LABELS[kind];
}

export function routeProfileLabel(profile: ReharmonizationRouteProfile): string {
  return ROUTE_PROFILE_LABELS[profile];
}

export function proposalInputContextLabel(context: ReharmonizationInputContext): string {
  return inputContextLabel(context);
}

export default function HarmonizationProposalCard({
  proposal,
  onApply,
  applyLabel = "Usar harmonia",
  titleDetail,
  localOccurrences = []
}: HarmonizationProposalCardProps) {
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [areVariantsOpen, setAreVariantsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-xl hover:border-zinc-700 transition">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {proposalKindLabel(proposal.kind)}
            </span>
            <span className="text-sm font-black text-zinc-300 uppercase tracking-widest">{proposal.name}</span>
            {titleDetail && (
              <span className="text-xs font-medium text-zinc-500 normal-case tracking-normal">
                {titleDetail}
              </span>
            )}
            {proposal.inputContext && (
              <span className={`text-[10px] font-black uppercase tracking-widest ${INPUT_CONTEXT_TONE[proposal.inputContext]}`}>
                {proposalInputContextLabel(proposal.inputContext)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => onApply(proposal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
            >
              {applyLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            {proposal.bassLine && proposal.bassLine.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2">Baixo:</span>
                <span className="text-sm font-mono text-zinc-300">
                  {proposal.bassLine.join(" → ")}
                </span>
              </div>
            )}

            {proposal.voiceLeadingScore !== undefined && proposal.voiceLeadingEvidence && proposal.voiceLeadingEvidence.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2">Condução:</span>
                <span className="text-sm font-semibold text-emerald-300">
                  {voiceLeadingLabel(proposal.voiceLeadingScore)}
                </span>
              </div>
            )}

            {proposal.routeProfile && (
              <div className="mb-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2">Distância:</span>
                <span className="text-sm font-semibold text-sky-300">
                  {routeProfileLabel(proposal.routeProfile)}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center text-sm font-medium">
              <span className="text-zinc-600 font-light">|</span>
              {proposal.measures.map((measure, measureIndex) => {
                const nextMeasure = proposal.measures[measureIndex + 1]?.measureIndex;
                const label = measureLabel(measure.measureIndex, nextMeasure);

                return (
                  <div key={measure.measureIndex} className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                      {label}
                    </span>
                    <div className="flex gap-2 items-center">
                      {measure.chords.map((chord, index) => (
                        <span key={`${measure.measureIndex}-${chord}-${index}`} className="text-white bg-zinc-800 px-2 py-1 rounded">
                          {chord}
                        </span>
                      ))}
                      <span className="text-zinc-600 font-light">|</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {proposal.colorVariants && proposal.colorVariants.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setAreVariantsOpen(!areVariantsOpen)}
                  className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-amber-300 hover:text-amber-200 transition cursor-pointer"
                  aria-expanded={areVariantsOpen}
                >
                  Variações de cor ({proposal.colorVariants.length})
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${areVariantsOpen ? "rotate-180" : ""}`} />
                </button>

                {areVariantsOpen && (
                  <div className="mt-3 flex flex-col gap-3">
                    {proposal.colorVariants.map(variant => (
                      <div
                        key={variant.id}
                        className="flex flex-col gap-2 border-l-2 border-amber-500/30 pl-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-zinc-300">{variant.name}</span>
                          <button
                            type="button"
                            onClick={() => onApply(variant)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 text-xs font-bold transition cursor-pointer"
                          >
                            Usar variação
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {chordChanges(proposal, variant).map((change, index) => (
                            <span
                              key={`${variant.id}-${change.measureIndex}-${index}`}
                              className="text-xs text-zinc-400"
                            >
                              Comp. {change.measureIndex}: <span className="text-zinc-500">{change.from}</span>
                              {" → "}<span className="text-amber-200">{change.to}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {localOccurrences.length > 1 && (
              <div className="mt-4 pt-3 border-t border-zinc-800/50">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                  Outras ocorrências ({localOccurrences.length - 1})
                </span>
                <div className="mt-3 flex flex-col gap-2">
                  {localOccurrences.slice(1).map(occurrence => (
                    <div key={occurrence.id} className="flex flex-wrap items-center justify-between gap-2 border-l-2 border-emerald-500/30 pl-3">
                      <span className="text-xs text-zinc-300">{occurrence.title}</span>
                      <button
                        type="button"
                        onClick={() => onApply(occurrence.primaryProposal)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 text-xs font-bold transition cursor-pointer"
                      >
                        Usar neste trecho
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(proposal.explanation.length > 0 || (proposal.diagnostics && proposal.diagnostics.length > 0)) && (
              <div className="mt-3 pt-3 border-t border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                  className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-indigo-300 transition cursor-pointer"
                  aria-expanded={isAnalysisOpen}
                >
                  Por que funciona
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAnalysisOpen ? "rotate-180" : ""}`} />
                </button>

                {isAnalysisOpen && (
                  <div className="mt-3 flex flex-col gap-2">
                    {proposal.explanation.map((motive, index) => (
                      <div key={`${motive}-${index}`} className="flex items-center gap-2 text-xs text-indigo-300/80">
                        <span className="text-indigo-400">✓</span> {motive}
                      </div>
                    ))}
                    {proposal.diagnostics?.map((diagnostic, index) => (
                      <div key={`${diagnostic.id}-${index}`} className="flex flex-wrap items-baseline gap-2 text-xs text-sky-300/80">
                        <span className="text-[9px] font-black uppercase tracking-widest text-sky-300/70">
                          {DIAGNOSTIC_CATEGORY_LABELS[diagnostic.category]}
                        </span>
                        <span>{diagnostic.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
