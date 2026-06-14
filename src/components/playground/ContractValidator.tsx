import React, { useEffect, useState } from "react";
import { usePlayground } from "./context/PlaygroundContext";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const ContractValidator: React.FC = () => {
  const { state } = usePlayground();
  const [result, setResult] = useState<ValidationResult>({ valid: true, errors: [], warnings: [] });

  useEffect(() => {
    validate(state.loadedPayload, state.activeContractType);
  }, [state.loadedPayload, state.activeContractType]);

  const validate = (payload: any, type: string) => {
    if (!payload) {
      setResult({ valid: true, errors: [], warnings: [] });
      return;
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Helper to validate a single chord event
    const validateChordEvent = (chord: any, path: string) => {
      if (!chord.id) errors.push(`${path}: ID do acorde está ausente.`);
      if (!chord.symbol) errors.push(`${path}: Símbolo/Cifra está ausente.`);
      
      // Voicing checks
      if (!chord.voicing) {
        errors.push(`${path}: Objeto 'voicing' está ausente.`);
      } else {
        const notes = chord.voicing.notes;
        if (!Array.isArray(notes) || notes.length === 0) {
          errors.push(`${path}: Notas MIDI em 'voicing.notes' devem ser um array não vazio.`);
        } else {
          // Check notes sorted ascending
          for (let k = 1; k < notes.length; k++) {
            if (notes[k] < notes[k - 1]) {
              errors.push(`${path}: Notas MIDI em 'voicing.notes' devem estar ordenadas de forma ascendente (Grave para Agudo).`);
              break;
            }
          }
        }

        // Frets checks
        if (chord.voicing.frets) {
          if (!Array.isArray(chord.voicing.frets)) {
            errors.push(`${path}: 'voicing.frets' deve ser um array.`);
          } else if (chord.tuning && chord.tuning.strings && chord.voicing.frets.length !== chord.tuning.strings.length) {
            errors.push(`${path}: Número de posições de trastes em 'voicing.frets' (${chord.voicing.frets.length}) difere do número de cordas configurado na afinação (${chord.tuning.strings.length}).`);
          }
        }
      }

      // Tuning checks
      if (!chord.tuning) {
        errors.push(`${path}: Objeto 'tuning' está ausente.`);
      } else {
        if (!chord.tuning.instrument) {
          errors.push(`${path}: Nome do instrumento ('tuning.instrument') está ausente.`);
        }
        if (!Array.isArray(chord.tuning.strings) || chord.tuning.strings.length === 0) {
          errors.push(`${path}: Cordas de afinação ('tuning.strings') devem ser um array não vazio.`);
        }
      }

      // Numerical scores range checks [0.0, 1.0]
      if (chord.tensionLevel !== undefined && (chord.tensionLevel < 0.0 || chord.tensionLevel > 1.0)) {
        errors.push(`${path}: 'tensionLevel' (${chord.tensionLevel}) deve estar contido no intervalo [0.0, 1.0].`);
      }
      if (chord.voiceLeadingScore !== undefined && (chord.voiceLeadingScore < 0.0 || chord.voiceLeadingScore > 1.0)) {
        errors.push(`${path}: 'voiceLeadingScore' (${chord.voiceLeadingScore}) deve estar contido no intervalo [0.0, 1.0].`);
      }
    };

    // Main validator logic based on type
    if (type === "chord") {
      validateChordEvent(payload, "Chord");
    } else if (type === "progression") {
      if (!payload.id) errors.push("Progression: ID da progressão está ausente.");
      if (!Array.isArray(payload.chordEvents)) {
        errors.push("Progression: 'chordEvents' deve ser um array.");
      } else {
        payload.chordEvents.forEach((c: any, idx: number) => {
          validateChordEvent(c, `Progression.chordEvents[${idx}]`);
        });
      }
      if (!Array.isArray(payload.tonalCenters) || payload.tonalCenters.length === 0) {
        errors.push("Progression: 'tonalCenters' deve ser um array de chaves estimadas não vazio.");
      }
      if (payload.globalTensionCurve) {
        if (!Array.isArray(payload.globalTensionCurve)) {
          errors.push("Progression: 'globalTensionCurve' deve ser um array de números.");
        } else if (payload.chordEvents && payload.globalTensionCurve.length !== payload.chordEvents.length) {
          warnings.push("Progression: Comprimento da curva de tensão difere do número de acordes.");
        }
      }
    } else if (type === "score") {
      if (!payload.id) errors.push("Score: ID da partitura está ausente.");
      if (!payload.title) errors.push("Score: Título ('title') está ausente.");
      
      // ProgressionEvents checks
      if (!Array.isArray(payload.progressionEvents)) {
        errors.push("Score: 'progressionEvents' deve ser um array.");
      } else {
        payload.progressionEvents.forEach((prog: any, pIdx: number) => {
          if (!prog.id) errors.push(`Score.progressionEvents[${pIdx}]: ID da progressão está ausente.`);
          if (Array.isArray(prog.chordEvents)) {
            prog.chordEvents.forEach((c: any, cIdx: number) => {
              validateChordEvent(c, `Score.progressionEvents[${pIdx}].chordEvents[${cIdx}]`);
            });
          }
        });
      }

      // Sections narrative checks
      if (payload.sections) {
        if (!Array.isArray(payload.sections)) {
          errors.push("Score: 'sections' deve ser um array.");
        } else {
          payload.sections.forEach((sec: any, sIdx: number) => {
            if (!sec.sectionId) errors.push(`Score.sections[${sIdx}]: sectionId está ausente.`);
            if (!sec.name) errors.push(`Score.sections[${sIdx}]: name está ausente.`);
            if (!sec.range || sec.range.startMeasure === undefined || sec.range.endMeasure === undefined) {
              errors.push(`Score.sections[${sIdx}]: range de compassos está incompleto.`);
            } else if (sec.range.startMeasure > sec.range.endMeasure) {
              errors.push(`Score.sections[${sIdx}]: Compassos inválidos: startMeasure (${sec.range.startMeasure}) deve ser menor ou igual a endMeasure (${sec.range.endMeasure}).`);
            }
            if (sec.progressionId && payload.progressionEvents) {
              const matchedProg = payload.progressionEvents.find((p: any) => p.id === sec.progressionId);
              if (!matchedProg) {
                errors.push(`Score.sections[${sIdx}]: 'progressionId' ("${sec.progressionId}") não corresponde a nenhuma progressão listada em 'progressionEvents'.`);
              }
            }
          });
        }
      }
    }

    setResult({
      valid: errors.length === 0,
      errors,
      warnings
    });
  };

  if (!state.loadedPayload) {
    return (
      <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/20 flex flex-col items-center justify-center min-h-[160px] text-center">
        <AlertCircle className="h-7 w-7 text-zinc-600 mb-2 animate-pulse" />
        <span className="text-xs font-bold text-zinc-500">Nenhum payload carregado. Use o Payload Studio acima.</span>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-zinc-850 glass-panel flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider">Contract Validator</h3>
        <div className="flex items-center gap-1.5">
          {result.valid ? (
            <div className="px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-[10px] font-black tracking-wide flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              ✓ Contract Valid
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded-full bg-red-950/40 border border-red-900/50 text-red-400 text-[10px] font-black tracking-wide flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              ⚠ Validation Errors
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
        {result.valid && result.warnings.length === 0 && (
          <span className="text-xs text-zinc-400">Todos os contratos e regras de negócio da Core API v1 foram validados com sucesso.</span>
        )}

        {result.errors.map((err, idx) => (
          <div key={idx} className="flex gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg leading-relaxed">
            <span className="font-bold">•</span>
            <span>{err}</span>
          </div>
        ))}

        {result.warnings.map((warn, idx) => (
          <div key={idx} className="flex gap-2 text-xs text-yellow-500 bg-yellow-950/20 border border-yellow-900/30 p-2.5 rounded-lg leading-relaxed">
            <span className="font-bold">•</span>
            <span>{warn}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
