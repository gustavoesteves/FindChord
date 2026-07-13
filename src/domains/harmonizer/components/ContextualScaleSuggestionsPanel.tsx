import { useEffect, useState } from "react";
import { ChevronDown, CircleDot, Target } from "lucide-react";
import type { SectionScaleSuggestion, SectionScaleSuggestionSet } from "../services/harmonizerService";
import type { ContextualScaleCandidate, MelodySupportRole } from "../../../utils/music/theory/contextualScaleCandidates";

interface ContextualScaleSuggestionsPanelProps {
  suggestionSets: SectionScaleSuggestionSet[];
  hasMelodicContext: boolean;
}

const FUNCTION_LABELS: Record<ContextualScaleCandidate["harmonicFunction"], string> = {
  tonic: "Repouso",
  predominant: "Preparação",
  dominant: "Resolução",
  modal: "Modal",
  color: "Cor"
};

const INTENT_LABELS: Record<ContextualScaleCandidate["intent"], string> = {
  inside: "Dentro",
  functional: "Funcional",
  tension: "Tensão",
  outside: "Fora"
};

const INTENT_CLASSNAMES: Record<ContextualScaleCandidate["intent"], string> = {
  inside: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
  functional: "text-sky-200 bg-sky-500/10 border-sky-500/20",
  tension: "text-amber-200 bg-amber-500/10 border-amber-500/20",
  outside: "text-rose-200 bg-rose-500/10 border-rose-500/20"
};

const ROLE_LABELS: Record<NonNullable<SectionScaleSuggestionSet["presentationRole"]>, string> = {
  primary: "Principal",
  alternative: "Alternativa",
  comparative: "Contraste",
  adventurous: "Afastamento"
};

const MELODIC_FIT_LABELS: Record<SectionScaleSuggestionSet["linearRoutes"][number]["melodicFit"], string> = {
  aligned: "Melodia apoia",
  neutral: "Neutra",
  caution: "Revisar com a melodia"
};

const MELODIC_FIT_CLASSNAMES: Record<SectionScaleSuggestionSet["linearRoutes"][number]["melodicFit"], string> = {
  aligned: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
  neutral: "text-zinc-300 bg-zinc-500/10 border-zinc-500/20",
  caution: "text-amber-200 bg-amber-500/10 border-amber-500/20"
};

const SUPPORT_ROLE_LABELS: Record<MelodySupportRole, string> = {
  "guide-tone": "nota-guia",
  "resolution-target": "alvo",
  "passing-tone": "passagem",
  "linear-fragment": "fragmento"
};

function melodyCoverageLabel(candidate: ContextualScaleCandidate): string {
  if (candidate.melodicFit === "aligned") return "melodia apoia";
  if (candidate.melodicFit === "caution") return "revisar com a melodia";
  if (candidate.melodyCoverage >= 0.65) return "apoio parcial";
  return "apoio discreto";
}

function groupSuggestionsByMeasure(suggestions: SectionScaleSuggestion[]): Array<{
  measure: number;
  suggestions: SectionScaleSuggestion[];
}> {
  const groups = new Map<number, SectionScaleSuggestion[]>();
  for (const suggestion of suggestions) {
    const measureSuggestions = groups.get(suggestion.measure) || [];
    measureSuggestions.push(suggestion);
    groups.set(suggestion.measure, measureSuggestions);
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([measure, measureSuggestions]) => ({
      measure,
      suggestions: measureSuggestions.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    }));
}

function ScaleReading({ candidate, compact = false }: { candidate: ContextualScaleCandidate; compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const melodySupportLabels = candidate.melodyMatches.map(note => {
    const roles = candidate.melodySupportRoles[note] || [];
    return roles.length > 0
      ? `${note} (${roles.map(role => SUPPORT_ROLE_LABELS[role]).join(", ")})`
      : note;
  });

  return (
    <div className={`flex flex-col gap-2 border-l-2 border-sky-500/40 pl-3 ${compact ? "min-w-0" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-bold text-white">{candidate.name}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-sky-300">
          {FUNCTION_LABELS[candidate.harmonicFunction]}
        </span>
        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${INTENT_CLASSNAMES[candidate.intent]}`}>
          {INTENT_LABELS[candidate.intent]}
        </span>
        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${MELODIC_FIT_CLASSNAMES[candidate.melodicFit]}`}>
          {MELODIC_FIT_LABELS[candidate.melodicFit]}
        </span>
        {candidate.resolutionTarget && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
            <Target className="h-3 w-3" /> {candidate.resolutionTarget}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-fit items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-sky-300 transition cursor-pointer"
      >
        Ver leitura
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="flex flex-col gap-1 text-xs text-zinc-400">
          <span>{candidate.practiceHint}</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {candidate.guideTones.length > 0 && (
              <span>Notas-guia: <strong className="text-emerald-200">{candidate.guideTones.join(", ")}</strong></span>
            )}
            {candidate.guideToneTargets.length > 0 && (
              <span>Alvos: <strong className="text-sky-200">{candidate.guideToneTargets.join(", ")}</strong></span>
            )}
            {candidate.guideToneResolutions.length > 0 && (
              <span>Resoluções: <strong className="text-sky-200">{candidate.guideToneResolutions.join(", ")}</strong></span>
            )}
            {candidate.linearFragments.length > 0 && (
              <span>Fragmentos: <strong className="text-emerald-100">{candidate.linearFragments.join(", ")}</strong></span>
            )}
            {candidate.supportedTensions.length > 0 && (
              <span>Tensões: <strong className="text-amber-200">{candidate.supportedTensions.join(", ")}</strong></span>
            )}
            {candidate.passingNotes.length > 0 && (
              <span>Passagens: <strong className="text-amber-100">{candidate.passingNotes.join(", ")}</strong></span>
            )}
            {candidate.melodyNotes.length > 0 && (
              <span>Melodia: <strong className={candidate.melodicFit === "aligned" ? "text-emerald-200" : candidate.melodicFit === "caution" ? "text-amber-200" : "text-zinc-300"}>{melodyCoverageLabel(candidate)}</strong></span>
            )}
            {candidate.melodyMatches.length > 0 && (
              <span>Apoio: <strong className="text-emerald-200">{melodySupportLabels.join(", ")}</strong></span>
            )}
            {candidate.avoidNotes.length > 0 && (
              <span>Evitar: <strong className="text-rose-200">{candidate.avoidNotes.join(", ")}</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContextualScaleSuggestionsPanel({ suggestionSets, hasMelodicContext }: ContextualScaleSuggestionsPanelProps) {
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const selectedSet = suggestionSets.find(set => set.id === selectedSetId) || suggestionSets[0];
  const suggestions = selectedSet?.suggestions || [];
  const regions = selectedSet?.regions || [];
  const linearRoutes = selectedSet?.linearRoutes || [];
  const isProposalContext = selectedSet?.source === "proposal";
  const measureGroups = groupSuggestionsByMeasure(suggestions);

  useEffect(() => {
    if (suggestionSets.length === 0) {
      setSelectedSetId(null);
      return;
    }
    if (!selectedSetId || !suggestionSets.some(set => set.id === selectedSetId)) {
      const primarySet = suggestionSets.find(set => set.presentationRole === "primary") || suggestionSets[0];
      setSelectedSetId(primarySet.id);
    }
  }, [selectedSetId, suggestionSets]);

  if (suggestionSets.length === 0 && !hasMelodicContext) return null;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-sky-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-200">
              Leituras de escala por contexto
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            {isProposalContext
              ? "Baseada na harmonia proposta selecionada."
              : "Baseada na harmonia escrita na partitura."}
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          {suggestionSets.length} leituras
        </span>
      </div>

      {suggestionSets.length === 0 ? (
        <div className="rounded-lg border border-zinc-800/70 bg-zinc-900/25 px-4 py-3 text-xs text-zinc-500">
          Sincronize uma melodia para que o sistema gere uma harmonia e leia as possibilidades de escala por acorde.
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestionSets.map(set => {
              const isSelected = selectedSet?.id === set.id;
              return (
                <button
                  key={set.id}
                  type="button"
                  onClick={() => setSelectedSetId(set.id)}
                  className={`flex min-w-[11rem] flex-col gap-1 rounded-lg border px-3 py-2 text-left transition cursor-pointer ${
                    isSelected
                      ? "border-sky-500/50 bg-sky-500/10 text-sky-100"
                      : "border-zinc-800/80 bg-zinc-900/25 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <span className="line-clamp-2 text-xs font-bold leading-snug">
                    {set.label.replace(/^Estratégia —\s*/i, "")}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    {set.source === "reference" ? "Partitura" : set.presentationRole ? ROLE_LABELS[set.presentationRole] : "Proposta"}
                    {" / "}
                    {set.suggestions.length} acordes
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/70 bg-zinc-900/25 px-4 py-3">
            <span className="text-sm font-bold text-zinc-200">
              {selectedSet?.label}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {measureGroups.length} compassos / {suggestions.length} acordes
            </span>
          </div>

          {regions.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-200">
                Leituras regionais
              </span>
              <div className="grid gap-2 md:grid-cols-2">
                {regions.map(region => (
                  <div key={region.id} className="flex flex-col gap-1 border-l-2 border-sky-500/40 pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Comp. {region.startMeasure === region.endMeasure ? region.startMeasure : `${region.startMeasure}-${region.endMeasure}`}
                      </span>
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${INTENT_CLASSNAMES[region.intent]}`}>
                        {INTENT_LABELS[region.intent]}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-zinc-100">{region.scaleName}</span>
                    <span className="text-xs text-zinc-500">
                      {region.chordCount} acordes: {Array.from(new Set(region.chords)).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {linearRoutes.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                Rotas lineares
              </span>
              <div className="grid gap-2 md:grid-cols-2">
                {linearRoutes.map(route => (
                  <div key={route.id} className="flex flex-col gap-1 border-l-2 border-emerald-500/40 pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Comp. {route.startMeasure === route.endMeasure ? route.startMeasure : `${route.startMeasure}-${route.endMeasure}`}
                      </span>
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${INTENT_CLASSNAMES[route.intent]}`}>
                        {INTENT_LABELS[route.intent]}
                      </span>
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${MELODIC_FIT_CLASSNAMES[route.melodicFit]}`}>
                        {MELODIC_FIT_LABELS[route.melodicFit]}
                      </span>
                      {route.target && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                          <Target className="h-3 w-3" /> {route.target}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-zinc-100">{route.fragments.join(" / ")}</span>
                    <span className="text-xs text-zinc-500">
                      {Array.from(new Set(route.chords)).join(", ")}
                    </span>
                    {route.melodyMatches.length > 0 && (
                      <span className="text-xs text-zinc-500">
                        Melodia: <strong className="text-indigo-200">{route.melodyMatches.join(", ")}</strong>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-zinc-800/70 bg-zinc-950/20">
            {measureGroups.map(group => (
              <div
                key={group.measure}
                className="grid gap-3 border-b border-zinc-800/70 px-4 py-4 last:border-b-0 md:grid-cols-[7rem_1fr]"
              >
                <div className="flex flex-row items-baseline gap-2 md:flex-col md:gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Compasso
                  </span>
                  <span className="text-lg font-black text-zinc-100">
                    {group.measure}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {group.suggestions.map(suggestion => (
                    <div key={`${suggestion.measure}-${suggestion.position ?? 0}-${suggestion.chord}`} className="grid gap-3 md:grid-cols-[6rem_1fr]">
                      <div className="flex min-w-0 items-center">
                        <span className="rounded border border-zinc-700/70 bg-zinc-900 px-2 py-1 text-sm font-bold text-zinc-100">
                          {suggestion.chord}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-col gap-2">
                        <ScaleReading candidate={suggestion.candidates[0]} compact />
                        {suggestion.candidates.slice(1, 3).length > 0 && (
                          <div className="flex flex-wrap gap-2 pl-3">
                            {suggestion.candidates.slice(1, 3).map(candidate => (
                              <span
                                key={`${suggestion.measure}-${suggestion.position ?? 0}-${candidate.type}`}
                                className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${INTENT_CLASSNAMES[candidate.intent]}`}
                              >
                                {INTENT_LABELS[candidate.intent]} / {candidate.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
