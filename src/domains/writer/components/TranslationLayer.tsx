import { Sparkles } from "lucide-react";
import { useWriter } from "../context/WriterContext";
import { presentWriterChordReading } from "../services/writerChordReadingPresenter";

export function TranslationLayer() {
  const { state, actions } = useWriter();
  const { activeChord, detectedChords, selectedChordIndex } = state;
  const reading = activeChord ? presentWriterChordReading(activeChord) : null;
  const hasAlternatives = detectedChords.length > 1;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Leitura do acorde
          </h3>
        </div>

        {activeChord ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black tracking-wider text-purple-400 uppercase">Acorde:</span>
                  <span className="text-3xl font-black text-white tracking-tight">{activeChord.symbol}</span>
                </div>

                {hasAlternatives && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Interpretação:</span>
                    <div className="flex flex-wrap gap-2">
                      {detectedChords.map((candidate, index) => {
                        const isSelected = selectedChordIndex === index;
                        return (
                          <button
                            key={`${candidate.symbol}-${index}`}
                            type="button"
                            onClick={() => actions.setSelectedChordIndex(index)}
                            className={`px-2.5 py-1.5 rounded-lg border text-left transition ${
                              isSelected
                                ? "bg-purple-950/50 border-purple-500/70 text-white"
                                : "bg-zinc-950/60 border-zinc-850 text-zinc-300 hover:border-zinc-650"
                            }`}
                            title={`Confiança ${candidate.confidence}%`}
                          >
                            <span className="block text-xs font-black">{candidate.symbol}</span>
                            <span className="block text-[9px] font-bold text-zinc-500">
                              score {candidate.score} · {candidate.confidence}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Notas tocadas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeChord.notes.map((note, index) => (
                      <span key={`${note}-${index}`} className="px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded-lg font-bold text-xs text-zinc-250">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {reading?.fields.map(field => (
                  <div key={field.label} className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-850">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">{field.label}</span>
                    <p className="text-xs font-bold text-zinc-200 mt-0.5 truncate" title={field.title}>
                      {field.value}
                    </p>
                  </div>
                ))}

                <div className="col-span-2 p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-850 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Tensão</span>
                    <p className="text-xs font-bold text-purple-400 mt-0.5">{reading?.tensionLabel}</p>
                  </div>
                  <div className="w-1/2 bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-850">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                      style={{ width: `${reading?.tensionPercent || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500 text-xs italic">
            Selecione trastes no braço virtual para ler o acorde tocado.
          </div>
        )}
      </div>
    </div>
  );
}
