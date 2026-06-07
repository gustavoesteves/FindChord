import type { HarmonyDecision } from "../models/HarmonyDecision";
import type { VoicingLayout } from "./models/VoicingLayout";
import type { VoicingTransform } from "./models/VoicingTransform";
import type { VoicedChord } from "./models/VoicedChord";
import type { VoicedProgression } from "./models/VoicedProgression";
import { calculateVoicingMetrics } from "./metrics/voicingMetrics";
import { realizeNativeVoicing } from "./realizers/GuitarStandardRealizer";
import { realizeSatbVoicing } from "./realizers/SatbRealizer";
import { applyRootlessTransform } from "./realizers/RootlessRealizer";
import { applyDrop2Transform } from "./realizers/Drop2Realizer";
import { applyShellTransform } from "./realizers/ShellRealizer";
import { applyQuartalTransform } from "./realizers/QuartalRealizer";

export const progressionRealizer = {
  /**
   * Realiza e materializa uma HarmonyDecision abstrata em uma VoicedProgression
   * aplicando um Layout de vozes e uma Transformação harmônica conservativa.
   */
  realize(
    decision: HarmonyDecision,
    layout: VoicingLayout,
    transform: VoicingTransform
  ): VoicedProgression {
    const voicedChords: VoicedChord[] = [];

    decision.solution.bestPath.forEach((voicing, idx) => {
      const chordSymbol = decision.solution.progression[idx] || "C";
      if (!voicing) {
        // Ignora pausas ou elementos nulos na timeline
        return;
      }

      // 1. Aplicar o Layout (Disposição de Vozes)
      let voiced: VoicedChord | null;
      if (layout === "satb") {
        voiced = realizeSatbVoicing(voicing, chordSymbol);
      } else {
        // Padrão: native
        voiced = realizeNativeVoicing(voicing, chordSymbol);
      }

      if (!voiced) return;

      // 2. Aplicar o Transform (Manipulação de Vozes)
      if (transform === "rootless") {
        voiced = applyRootlessTransform(voiced);
      } else if (transform === "drop2") {
        voiced = applyDrop2Transform(voiced);
      } else if (transform === "shell") {
        voiced = applyShellTransform(voiced);
      } else if (transform === "quartal") {
        voiced = applyQuartalTransform(voiced);
      }

      if (voiced) {
        voicedChords.push(voiced);
      }
    });

    // 3. Calcular Métricas de Voicing específicas
    const metrics = calculateVoicingMetrics(voicedChords);

    return {
      layout,
      transform,
      sourceDecision: decision,
      voicings: voicedChords,
      metrics
    };
  }
};
