import React, { useState, useEffect } from "react";
import { usePlayground, ContractType } from "./context/PlaygroundContext";
import { FileJson, RefreshCw, FileText } from "lucide-react";
import type { CanonicalChordEvent } from "../../utils/music/analysis/models/CanonicalChordEvent";
import type { CanonicalProgressionEvent } from "../../utils/music/analysis/models/CanonicalProgressionEvent";
import type { CanonicalScoreEvent } from "../../utils/music/analysis/models/CanonicalScoreEvent";

// -------------------------------------------------------------
// TEMPLATE DEFINITIONS
// -------------------------------------------------------------

const CHORD_TEMPLATE: CanonicalChordEvent = {
  id: "ch_Gmaj7_1",
  symbol: "Gmaj7/B",
  voicing: {
    notes: [47, 54, 59, 62], // B2, F#3, B3, D4
    frets: [7, null, 4, 7, 7, null],
  },
  tuning: {
    instrument: "Guitarra",
    strings: ["E4", "B3", "G3", "D3", "A2", "E2"]
  },
  inversion: "First",
  voicingType: "Drop-2",
  tensionLevel: 0.25,
  voiceLeadingScore: 0.94,
  universalLaws: ["law_parsimonious_voice_leading", "law_chromatic_attraction"],
  predictionMechanisms: ["rp_functional", "rp_transformational"]
};

const II_V_I_TEMPLATE: CanonicalProgressionEvent = {
  id: "pr_ii_v_i",
  chordEvents: [
    {
      id: "ch_Dm7_1",
      symbol: "Dm7",
      voicing: { notes: [50, 57, 60, 65], frets: [null, 5, 7, 5, 6, null] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root",
      voicingType: "Drop-3",
      tensionLevel: 0.3,
      voiceLeadingScore: 1.0,
      universalLaws: ["law_parsimonious_voice_leading"]
    },
    {
      id: "ch_G7_2",
      symbol: "G7",
      voicing: { notes: [43, 53, 59, 62], frets: [3, null, 3, 4, 3, null] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root",
      voicingType: "Drop-2",
      tensionLevel: 0.65,
      voiceLeadingScore: 0.88,
      universalLaws: ["law_parsimonious_voice_leading", "law_chromatic_attraction"]
    },
    {
      id: "ch_Cmaj7_3",
      symbol: "Cmaj7",
      voicing: { notes: [48, 55, 59, 64], frets: [null, 3, 5, 4, 5, null] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root",
      voicingType: "Drop-3",
      tensionLevel: 0.15,
      voiceLeadingScore: 0.95,
      universalLaws: ["law_parsimonious_voice_leading", "law_chromatic_attraction"]
    }
  ],
  tonalCenters: ["C"]
};

const PLAGAL_TEMPLATE: CanonicalProgressionEvent = {
  id: "pr_plagal",
  chordEvents: [
    {
      id: "ch_F_1",
      symbol: "F",
      voicing: { notes: [41, 48, 53, 57], frets: [1, 3, 3, 2, 1, 1] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root",
      voicingType: "Closed"
    },
    {
      id: "ch_C_2",
      symbol: "C",
      voicing: { notes: [48, 52, 55, 60], frets: [null, 3, 2, 0, 1, 0] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root",
      voicingType: "Closed"
    }
  ],
  tonalCenters: ["C"]
};

const NEO_RIEMANNIAN_TEMPLATE: CanonicalProgressionEvent = {
  id: "pr_neo_riemannian",
  chordEvents: [
    {
      id: "ch_C_1",
      symbol: "C",
      voicing: { notes: [48, 52, 55], frets: [null, 3, 2, 0, 1, 0] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_Cm_2",
      symbol: "Cm",
      voicing: { notes: [48, 51, 55], frets: [null, 3, 5, 5, 4, 3] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root" // P relation
    },
    {
      id: "ch_Eb_3",
      symbol: "Eb",
      voicing: { notes: [43, 51, 55, 58], frets: [null, 6, 5, 3, 4, 3] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "First" // L relation
    }
  ],
  tonalCenters: ["C", "Eb"]
};

const AXES_TEMPLATE: CanonicalProgressionEvent = {
  id: "pr_axes",
  chordEvents: [
    {
      id: "ch_C_1",
      symbol: "C",
      voicing: { notes: [48, 52, 55], frets: [null, 3, 2, 0, 1, 0] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_Eb_2",
      symbol: "Eb",
      voicing: { notes: [43, 51, 55, 58], frets: [null, 6, 5, 3, 4, 3] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_Fsharp_3",
      symbol: "F#",
      voicing: { notes: [42, 46, 49], frets: [2, 4, 4, 3, 2, 2] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_A_4",
      symbol: "A",
      voicing: { notes: [45, 49, 52], frets: [null, 0, 2, 2, 2, 0] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    }
  ],
  tonalCenters: ["C"] // Axis keys: C, Eb, F#, A share the tonic axis
};

const MODAL_TEMPLATE: CanonicalProgressionEvent = {
  id: "pr_modal",
  chordEvents: [
    {
      id: "ch_Dm_1",
      symbol: "Dm",
      voicing: { notes: [50, 53, 57], frets: [null, 5, 7, 7, 6, 5] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_G_2",
      symbol: "G",
      voicing: { notes: [43, 47, 50], frets: [3, 5, 5, 4, 3, 3] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root" // Dorian major IV
    }
  ],
  tonalCenters: ["D"]
};

const ACADEMIC_DISAGREEMENT_TEMPLATE: CanonicalProgressionEvent = {
  id: "pr_academic_disagreement",
  chordEvents: [
    {
      id: "ch_C_1",
      symbol: "C",
      voicing: { notes: [48, 52, 55], frets: [null, 3, 2, 0, 1, 0] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_Ab_2",
      symbol: "Ab",
      voicing: { notes: [44, 48, 51, 56], frets: [4, 6, 6, 5, 4, 4] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_Fm_3",
      symbol: "Fm",
      voicing: { notes: [41, 48, 53, 56], frets: [1, 3, 3, 1, 1, 1] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_G7_4",
      symbol: "G7",
      voicing: { notes: [43, 53, 59, 62], frets: [3, null, 3, 4, 3, null] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    }
  ],
  tonalCenters: ["C"]
};

const HIGH_FRAGILITY_TEMPLATE: CanonicalProgressionEvent = {
  id: "pr_high_fragility",
  chordEvents: [
    {
      id: "ch_Caug_1",
      symbol: "Caug",
      voicing: { notes: [48, 52, 56], frets: [null, 3, 2, 1, 1, null] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_Gbaug_2",
      symbol: "Gbaug",
      voicing: { notes: [42, 46, 50], frets: [2, null, 0, 3, 3, null] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    },
    {
      id: "ch_C7sharp11_3",
      symbol: "C7#11",
      voicing: { notes: [48, 52, 54, 58], frets: [null, 3, 4, 3, 5, null] },
      tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
      inversion: "Root"
    }
  ],
  tonalCenters: ["C", "Gb"]
};

const SCORE_TEMPLATE: CanonicalScoreEvent = {
  id: "sc_exposition_sonata",
  title: "Sonata Exposé (Mock v1)",
  progressionEvents: [II_V_I_TEMPLATE, PLAGAL_TEMPLATE],
  globalNarrative: "Abertura estrutural contendo resoluções diatônicas estáveis de ii-V-I e cadências plagais secundárias.",
  sections: [
    {
      sectionId: "sec_1",
      name: "Tema A",
      range: { startMeasure: 1, endMeasure: 4 },
      progressionId: "pr_ii_v_i",
      localNarrative: "Frase inicial com cadência autêntica tonal."
    },
    {
      sectionId: "sec_2",
      name: "Tema B",
      range: { startMeasure: 5, endMeasure: 8 },
      progressionId: "pr_plagal",
      localNarrative: "Seção complementar resolvida de forma plagal."
    }
  ],
  metaTheory: {
    id: "mt_traditional_functional_harmony",
    name: "Teoria Funcional Tradicional",
    axioms: ["law_parsimonious_voice_leading", "law_chromatic_attraction"],
    theoreticalUnificationScore: 1.0,
    explanatoryDepth: 1.5,
    historicalSupportScore: 0.91,
    metaNarrative: "Harmonia explicada por cadências funcionais e voice leading parsimonioso.",
    dominantDomains: ["FUNCTIONAL", "VOICE_LEADING"]
  },
  dominantResearchPrograms: ["rp_functional"],
  universalLawsActivated: ["law_parsimonious_voice_leading", "law_chromatic_attraction"]
};

export const PayloadStudio: React.FC = () => {
  const { state, actions } = usePlayground();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  // Set default templates when tab changes
  useEffect(() => {
    applyTemplate(state.activeContractType);
  }, [state.activeContractType]);

  const applyTemplate = (type: ContractType) => {
    setLoadError(null);
    setSuccessMsg(false);
    let tmpl: object = II_V_I_TEMPLATE;
    if (type === "chord") tmpl = CHORD_TEMPLATE;
    else if (type === "score") tmpl = SCORE_TEMPLATE;

    actions.setRawPayload(JSON.stringify(tmpl, null, 2));
  };

  const handleLoad = () => {
    setLoadError(null);
    setSuccessMsg(false);
    const res = actions.loadPayload();
    if (res.success) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2000);
    } else {
      setLoadError(res.error || "Erro ao parsear JSON.");
    }
  };

  return (
    <div className="flex-1 p-5 rounded-2xl border border-zinc-850 glass-panel flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-purple-400" />
          <h2 className="text-sm font-extrabold text-zinc-200 uppercase tracking-wider">Payload Studio</h2>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
          {(["chord", "progression", "score"] as ContractType[]).map(type => (
            <button
              key={type}
              onClick={() => actions.setActiveContractType(type)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer capitalize ${
                state.activeContractType === type
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Actions */}
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400">JSON Editor (v1 Contract Input):</span>
          <button
            onClick={handleLoad}
            className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-extrabold text-xs rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            Load Payload
          </button>
        </div>

        <textarea
          value={state.rawPayload}
          onChange={e => {
            actions.setRawPayload(e.target.value);
            setLoadError(null);
          }}
          className="flex-1 w-full min-h-[260px] max-h-[380px] p-4 bg-zinc-950 text-zinc-300 font-mono text-xs rounded-xl border border-zinc-850 focus:border-purple-500/50 focus:outline-none resize-y leading-relaxed"
          placeholder="Insira o DTO JSON aqui..."
        />

        {loadError && (
          <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-lg text-red-400 text-xs font-semibold">
            ⚠ {loadError}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-lg text-emerald-400 text-xs font-semibold">
            ✓ Payload carregado e validado sintaticamente no contexto compartilhado.
          </div>
        )}
      </div>

      {/* Templates Row */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Modelos Disponíveis (Templates)</span>
        
        {state.activeContractType === "chord" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => actions.setRawPayload(JSON.stringify(CHORD_TEMPLATE, null, 2))}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              Default Gmaj7/B
            </button>
          </div>
        )}

        {state.activeContractType === "progression" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => actions.setRawPayload(JSON.stringify(II_V_I_TEMPLATE, null, 2))}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              ii-V-I
            </button>
            <button
              onClick={() => actions.setRawPayload(JSON.stringify(PLAGAL_TEMPLATE, null, 2))}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              Plagal Cadence
            </button>
            <button
              onClick={() => actions.setRawPayload(JSON.stringify(NEO_RIEMANNIAN_TEMPLATE, null, 2))}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              Neo-Riemannian (LPR)
            </button>
            <button
              onClick={() => actions.setRawPayload(JSON.stringify(AXES_TEMPLATE, null, 2))}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              Axes (Lendvai)
            </button>
            <button
              onClick={() => actions.setRawPayload(JSON.stringify(MODAL_TEMPLATE, null, 2))}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              Modal (Dorian)
            </button>
            <button
              onClick={() => actions.setRawPayload(JSON.stringify(ACADEMIC_DISAGREEMENT_TEMPLATE, null, 2))}
              className="px-3 py-1 bg-purple-950/20 hover:bg-purple-900/10 border border-purple-900/30 text-purple-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              🎓 Academic Disagreement
            </button>
            <button
              onClick={() => actions.setRawPayload(JSON.stringify(HIGH_FRAGILITY_TEMPLATE, null, 2))}
              className="px-3 py-1 bg-pink-950/20 hover:bg-pink-900/10 border border-pink-900/30 text-pink-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              ⚡ High Fragility
            </button>
          </div>
        )}

        {state.activeContractType === "score" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => actions.setRawPayload(JSON.stringify(SCORE_TEMPLATE, null, 2))}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer"
            >
              Sonata Exposé
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
