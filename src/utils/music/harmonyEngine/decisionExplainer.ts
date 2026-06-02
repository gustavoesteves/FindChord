import type { HarmonyDecision } from "../models/HarmonyDecision";
import type { VoiceLeadingExplanation } from "../models/VoiceLeadingExplanation";

export class DecisionExplainer {
  /**
   * Traduz métricas brutas e caminhos em diagnósticos pedagógicos humanizados.
   */
  static explain(decision: HarmonyDecision, lang: "pt" | "en" = "pt"): VoiceLeadingExplanation {
    const metrics = decision.metrics || {
      totalDistance: 0,
      contraryMotions: 0,
      retainedCommonTones: 0,
      parallelFifths: 0,
      parallelOctaves: 0,
      functionalResolutions: 0
    };

    const isPt = lang === "pt";

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let summary = "";

    // 1. Analisar Pontos Fortes (Strengths)
    if (metrics.parallelFifths === 0 && metrics.parallelOctaves === 0) {
      strengths.push(
        isPt 
          ? "Evitou completamente paralelismos perfeitos proibidos (oitavas e quintas paralelas)." 
          : "Avoided all forbidden parallel perfect octaves and fifths."
      );
    } else {
      if (metrics.parallelFifths > 0) {
        weaknesses.push(
          isPt
            ? `Aceitou ${metrics.parallelFifths} quinta(s) paralela(s) para priorizar a ergonomia física.`
            : `Accepted ${metrics.parallelFifths} parallel fifth(s) to prioritize physical ergonomics.`
        );
      }
      if (metrics.parallelOctaves > 0) {
        weaknesses.push(
          isPt
            ? `Permitiu ${metrics.parallelOctaves} oitava(s) paralela(s) para viabilizar o dedilhado do instrumento.`
            : `Allowed ${metrics.parallelOctaves} parallel octave(s) to make fingering physically viable.`
        );
      }
    }

    if (metrics.contraryMotions > 0) {
      strengths.push(
        isPt
          ? `Promoveu ${metrics.contraryMotions} movimento(s) contrário(s)/oblíquo(s), enriquecendo o contraponto clássico.`
          : `Promoted ${metrics.contraryMotions} contrary/oblique motion(s), enriching the classical counterpoint.`
      );
    }

    if (metrics.retainedCommonTones > 0) {
      strengths.push(
        isPt
          ? `Reteve ${metrics.retainedCommonTones} nota(s) comum(ns) na mesma voz física, reduzindo a fadiga dos dedos.`
          : `Retained ${metrics.retainedCommonTones} common tone(s) in the same physical voice, reducing finger fatigue.`
      );
    }

    if (metrics.functionalResolutions > 0) {
      strengths.push(
        isPt
          ? `Realizou ${metrics.functionalResolutions} resoluções funcionais de graus sensíveis e guias (7ª➔3ª, 3ª➔Tônica).`
          : `Resolved ${metrics.functionalResolutions} guide tones and active scale degrees (7th➔3rd, 3rd➔Root).`
      );
    }

    // 2. Analisar Concessões e Pontos Fracos (Weaknesses)
    if (metrics.totalDistance > 18) {
      weaknesses.push(
        isPt
          ? "Exigiu saltos de trastes e deslocamento considerável ao longo do braço (Timeline ativa distante)."
          : "Required wider fret leaps and substantial physical displacement along the neck."
      );
    } else {
      strengths.push(
        isPt
          ? "Condução de vozes extremamente suave, com deslocamento médio inferior a 2 trastes por troca."
          : "Extremely smooth voice leading, with average fret shift below 2 frets per chord change."
      );
    }

    // 3. Resumo Pedagógico (Summary)
    if (isPt) {
      if (metrics.totalDistance <= 10 && weaknesses.length === 0) {
        summary = "Esta realização harmônica é o ápice do contraponto suave: evitou paralelismos perfeitamente, manteve notas comuns na mesma altura e demandou movimento quase imperceptível da mão.";
      } else if (weaknesses.length === 0) {
        summary = "O motor harmônico priorizou o rigor clássico: resolveu guide tones perfeitamente e blindou as vozes contra paralelismos, mantendo excelente condução contrapontística.";
      } else {
        summary = "Uma condução ergonômica excelente que realizou concessões justificadas nas regras clássicas para preservar a viabilidade de execução do braço.";
      }
    } else {
      if (metrics.totalDistance <= 10 && weaknesses.length === 0) {
        summary = "This harmonic realization is the pinnacle of smooth voice leading: completely avoided parallelism, retained common tones, and required minimal hand movement.";
      } else if (weaknesses.length === 0) {
        summary = "The engine prioritized classical counterpoint standards: perfect guide tone resolutions with no parallel perfect intervals.";
      } else {
        summary = "A highly playable and ergonomic voice leading path that accepted minor compromises on classical rules to stay highly comfortable.";
      }
    }

    return {
      summary,
      strengths,
      weaknesses
    };
  }
}
