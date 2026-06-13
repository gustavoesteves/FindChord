import React, { useState, useEffect } from "react";
import { musescoreAdapter } from "../utils/musescoreAdapter";
import { 
  FileJson, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Copy, 
  RefreshCw,
  Info,
  Layers,
  Activity,
  Award
} from "lucide-react";

// Types corresponding to docs/core-api-v1.md
interface CanonicalChordEvent {
  id: string;
  symbol: string;
  voicing: {
    notes: number[];
    frets?: (number | null)[];
  };
  tuning: {
    instrument: string;
    strings: string[];
  };
  inversion: string;
  voicingType?: string;
  tensionLevel?: number;
  voiceLeadingScore?: number;
  universalLaws?: string[];
  predictionMechanisms?: string[];
}

interface CanonicalProgressionEvent {
  id: string;
  chordEvents: CanonicalChordEvent[];
  tonalCenters: string[];
  narrativeSegments?: string[];
  globalTensionCurve?: number[];
  activeParadigms?: string[];
  metaTheoryId?: string;
}

interface SectionNarrative {
  sectionId: string;
  name: string;
  range: { startMeasure: number; endMeasure: number };
  progressionId: string;
  localNarrative: string;
}

interface CanonicalScoreEvent {
  id: string;
  title: string;
  progressionEvents: CanonicalProgressionEvent[];
  globalNarrative: string;
  sections: SectionNarrative[];
  metaTheory: {
    id: string;
    name: string;
    axioms: string[];
    theoreticalUnificationScore: number;
    explanatoryDepth: number;
    historicalSupportScore: number;
    metaNarrative: string;
    dominantDomains: string[];
  };
  dominantResearchPrograms: string[];
  universalLawsActivated: string[];
}

// -------------------------------------------------------------
// TEMPLATES
// -------------------------------------------------------------

const CHORD_TEMPLATE: CanonicalChordEvent = {
  id: "ch_Gmaj7_1",
  symbol: "Gmaj7/B",
  voicing: {
    notes: [47, 54, 59, 62], // B2, F#3, B3, D4
    frets: [7, null, 4, 7, 7, null], // Guitar Standard: B2 on A string, F#3 on D string, B3 on G string, D4 on B string
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

const PROGRESSION_TEMPLATE: CanonicalProgressionEvent = {
  id: "pr_ii_V_I_1",
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
      universalLaws: ["law_parsimonious_voice_leading"],
      predictionMechanisms: ["rp_functional"]
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
      universalLaws: ["law_parsimonious_voice_leading", "law_chromatic_attraction"],
      predictionMechanisms: ["rp_functional"]
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
      universalLaws: ["law_parsimonious_voice_leading", "law_chromatic_attraction"],
      predictionMechanisms: ["rp_functional"]
    }
  ],
  tonalCenters: ["C"],
  narrativeSegments: [
    "A progressão se inicia em estabilidade relativa com o Dm7 como acorde subdominante.",
    "A tensão atinge seu pico na dominante instável G7, impulsionada pelo trítono entre F e B.",
    "A resolução ocorre em Cmaj7, gerando forte liberação de energia funcional."
  ],
  globalTensionCurve: [0.3, 0.65, 0.15],
  activeParadigms: ["rp_functional"],
  metaTheoryId: "mt_traditional_functional_harmony"
};

const SCORE_TEMPLATE: CanonicalScoreEvent = {
  id: "sc_sonata_c_major",
  title: "Sonata em Dó Maior (Mock)",
  progressionEvents: [
    PROGRESSION_TEMPLATE,
    {
      id: "pr_modulation_am_2",
      chordEvents: [
        {
          id: "ch_Cmaj7_4",
          symbol: "Cmaj7",
          voicing: { notes: [48, 55, 59, 64], frets: [null, 3, 5, 4, 5, null] },
          tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
          inversion: "Root",
          voicingType: "Drop-3",
          tensionLevel: 0.15,
          voiceLeadingScore: 1.0,
          universalLaws: [],
          predictionMechanisms: ["rp_functional"]
        },
        {
          id: "ch_E7_5",
          symbol: "E7/G#",
          voicing: { notes: [44, 56, 59, 62], frets: [4, null, 2, 4, 3, null] },
          tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
          inversion: "First",
          voicingType: "Drop-2",
          tensionLevel: 0.75,
          voiceLeadingScore: 0.85,
          universalLaws: ["law_chromatic_attraction"],
          predictionMechanisms: ["rp_functional", "rp_axis"]
        },
        {
          id: "ch_Am_6",
          symbol: "Am",
          voicing: { notes: [45, 52, 57, 60], frets: [null, 0, 2, 2, 1, 0] },
          tuning: { instrument: "Guitarra", strings: ["E4", "B3", "G3", "D3", "A2", "E2"] },
          inversion: "Root",
          voicingType: "Closed",
          tensionLevel: 0.1,
          voiceLeadingScore: 0.93,
          universalLaws: ["law_parsimonious_voice_leading"],
          predictionMechanisms: ["rp_functional"]
        }
      ],
      tonalCenters: ["C", "Am"],
      narrativeSegments: [
        "Transição da tônica principal Cmaj7 para a dominante secundária E7/G#.",
        "Resolução na tônica menor paralela Am, marcando a modulação tonal."
      ],
      globalTensionCurve: [0.15, 0.75, 0.1],
      activeParadigms: ["rp_functional", "rp_axis"],
      metaTheoryId: "mt_unified_axis_functional"
    }
  ],
  globalNarrative: "A Sonata transiciona de uma estabilidade em Dó Maior para uma atmosfera reflexiva em Lá Menor, utilizando dominantes secundárias sob a ótica funcional clássica.",
  sections: [
    {
      sectionId: "sec_exposition",
      name: "Exposição Tonal",
      range: { startMeasure: 1, endMeasure: 4 },
      progressionId: "pr_ii_V_I_1",
      localNarrative: "Abertura clássica com cadência ii-V-I."
    },
    {
      sectionId: "sec_transition",
      name: "Transição e Modulação",
      range: { startMeasure: 5, endMeasure: 8 },
      progressionId: "pr_modulation_am_2",
      localNarrative: "Desvio modulatória em direção a Lá Menor."
    }
  ],
  metaTheory: {
    id: "mt_unified_axis_functional",
    name: "Teoria Harmônica Unificada: Funcionalismo & Eixos Simétricos",
    axioms: ["law_parsimonious_voice_leading", "law_chromatic_attraction"],
    theoreticalUnificationScore: 0.95,
    explanatoryDepth: 1.8,
    historicalSupportScore: 0.82,
    metaNarrative: "Fusão da atração cadencial clássica com eixos de simetria do círculo de quintas.",
    dominantDomains: ["FUNCTIONAL", "SYMMETRIC"]
  },
  dominantResearchPrograms: ["rp_functional"],
  universalLawsActivated: ["law_parsimonious_voice_leading", "law_chromatic_attraction"]
};

export default function Playground() {
  const [activeTab, setActiveTab] = useState<"chord" | "progression" | "score">("progression");
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(PROGRESSION_TEMPLATE, null, 2)
  );
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>({ valid: true, errors: [], warnings: [] });
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  // Telemetria da Bridge (Sprint B.5)
  const [telemetry, setTelemetry] = useState<{
    apiVersion: string;
    bridgeVersion: string;
    bridgeOnline: boolean;
    queueSize: number;
    eventsReceived: number;
    eventsAccepted: number;
    eventsRejected: number;
    pluginPollCount: number;
    pluginLastSeen: string | null;
    frontendLastSeen: string | null;
  }>({
    apiVersion: "—",
    bridgeVersion: "—",
    bridgeOnline: false,
    queueSize: 0,
    eventsReceived: 0,
    eventsAccepted: 0,
    eventsRejected: 0,
    pluginPollCount: 0,
    pluginLastSeen: null,
    frontendLastSeen: null
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:9000/api/v1/status", {
          headers: {
            "X-FindChord-Client": "compose-suite"
          }
        });
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data);
        } else {
          setTelemetry(prev => ({ ...prev, bridgeOnline: false }));
        }
      } catch (e) {
        setTelemetry(prev => ({ ...prev, bridgeOnline: false }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Carregar outro template
  const handleLoadTemplate = (type: "chord" | "progression" | "score") => {
    setActiveTab(type);
    let tmpl: any = CHORD_TEMPLATE;
    if (type === "progression") tmpl = PROGRESSION_TEMPLATE;
    if (type === "score") tmpl = SCORE_TEMPLATE;

    const text = JSON.stringify(tmpl, null, 2);
    setJsonText(text);
    validateJson(text, type);
  };

  // Validar JSON
  const validateJson = (text: string, type: "chord" | "progression" | "score") => {
    const errors: string[] = [];
    const warnings: string[] = [];

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e: any) {
      setValidationResult({
        valid: false,
        errors: [`JSON Inválido: ${e.message}`],
        warnings: []
      });
      return;
    }

    if (type === "chord") {
      validateChordSchema(data, errors, warnings);
    } else if (type === "progression") {
      validateProgressionSchema(data, errors, warnings);
    } else if (type === "score") {
      validateScoreSchema(data, errors, warnings);
    }

    setValidationResult({
      valid: errors.length === 0,
      errors,
      warnings
    });
  };

  // Validação de Chord
  const validateChordSchema = (data: any, errors: string[], _warnings: string[]) => {
    if (!data.id) errors.push("Campo obrigatório ausente: 'id'.");
    if (!data.symbol) errors.push("Campo obrigatório ausente: 'symbol'.");
    
    if (!data.voicing) {
      errors.push("Campo obrigatório ausente: 'voicing'.");
    } else {
      const notes = data.voicing.notes;
      if (!Array.isArray(notes)) {
        errors.push("voicing.notes precisa ser uma Array de números MIDI.");
      } else {
        // Regra 1: Ordenação Crescente
        const sorted = [...notes].sort((a, b) => a - b);
        const isSorted = notes.every((n, i) => n === sorted[i]);
        if (!isSorted) {
          errors.push("Restrição violada: voicing.notes precisa estar ordenado de forma crescente (pitches MIDI crescentes).");
        }
      }
    }

    if (!data.tuning) {
      errors.push("Campo obrigatório ausente: 'tuning'.");
    } else {
      const strings = data.tuning.strings;
      if (!Array.isArray(strings)) {
        errors.push("tuning.strings precisa ser uma Array de notas.");
      }

      // Regra 2: Alinhamento de casas
      if (data.voicing && data.voicing.frets) {
        if (!Array.isArray(data.voicing.frets)) {
          errors.push("voicing.frets precisa ser uma Array.");
        } else if (data.voicing.frets.length !== strings.length) {
          errors.push(`Restrição violada: o tamanho de voicing.frets (${data.voicing.frets.length}) deve coincidir com strings (${strings.length}).`);
        }
      }
    }

    // Regra 3: Escalonamento de scores
    if (data.tensionLevel !== undefined && (data.tensionLevel < 0 || data.tensionLevel > 1)) {
      errors.push("tensionLevel deve estar contido no intervalo decimal [0.0, 1.0].");
    }
    if (data.voiceLeadingScore !== undefined && (data.voiceLeadingScore < 0 || data.voiceLeadingScore > 1)) {
      errors.push("voiceLeadingScore deve estar contido no intervalo decimal [0.0, 1.0].");
    }
  };

  // Validação de Progression
  const validateProgressionSchema = (data: any, errors: string[], _warnings: string[]) => {
    if (!data.id) errors.push("Campo obrigatório ausente: 'id'.");
    
    if (!data.chordEvents || !Array.isArray(data.chordEvents)) {
      errors.push("Campo obrigatório ausente ou malformado: 'chordEvents'.");
    } else {
      // Regra 1: Cardinalidade Mínima
      if (data.chordEvents.length < 1) {
        errors.push("Restrição violada: a progressão precisa de no mínimo 1 chordEvent.");
      }
      
      data.chordEvents.forEach((ch: any, idx: number) => {
        const subErrors: string[] = [];
        validateChordSchema(ch, subErrors, []);
        subErrors.forEach(err => errors.push(`[Acorde #${idx + 1}] ${err}`));
      });
    }

    if (!data.tonalCenters || !Array.isArray(data.tonalCenters)) {
      errors.push("Campo obrigatório ausente: 'tonalCenters'.");
    }

    // Regra 2: Correspondência de Curva
    if (data.globalTensionCurve && Array.isArray(data.globalTensionCurve)) {
      if (data.chordEvents && data.globalTensionCurve.length !== data.chordEvents.length) {
        errors.push(`Restrição violada: o tamanho de globalTensionCurve (${data.globalTensionCurve.length}) deve coincidir com chordEvents (${data.chordEvents.length}).`);
      }
    }
  };

  // Validação de Score
  const validateScoreSchema = (data: any, errors: string[], warnings: string[]) => {
    if (!data.id) errors.push("Campo obrigatório ausente: 'id'.");
    if (!data.title) errors.push("Campo obrigatório ausente: 'title'.");

    if (!data.progressionEvents || !Array.isArray(data.progressionEvents)) {
      errors.push("Campo obrigatório ausente ou malformado: 'progressionEvents'.");
    } else {
      if (data.progressionEvents.length < 1) {
        errors.push("Restrição violada: o score precisa de no mínimo 1 progressionEvent.");
      }
      data.progressionEvents.forEach((prog: any, idx: number) => {
        const subErrors: string[] = [];
        validateProgressionSchema(prog, subErrors, []);
        subErrors.forEach(err => errors.push(`[Progressão #${idx + 1}] ${err}`));
      });
    }

    // Regra 3: Consistência de compassos e ranges
    if (data.sections && Array.isArray(data.sections)) {
      data.sections.forEach((sec: any, idx: number) => {
        if (!sec.sectionId || !sec.name || !sec.range || !sec.progressionId) {
          errors.push(`[Seção #${idx + 1}] Ausência de campos básicos.`);
          return;
        }

        // Verificar consistência de ID de progressão
        if (data.progressionEvents) {
          const found = data.progressionEvents.some((p: any) => p.id === sec.progressionId);
          if (!found) {
            errors.push(`Restrição violada: a seção referenciou o progressionId '${sec.progressionId}' que não existe no progressionEvents.`);
          }
        }

        // Validação de compassos lógicos
        if (sec.range.startMeasure > sec.range.endMeasure) {
          errors.push(`[Seção '${sec.name}'] startMeasure (${sec.range.startMeasure}) não pode ser maior que endMeasure (${sec.range.endMeasure}).`);
        }
      });

      // Validação de sobreposição contígua de compassos
      const ranges = data.sections
        .map((s: any) => ({ start: s.range.startMeasure, end: s.range.endMeasure, name: s.name }))
        .sort((a: any, b: any) => a.start - b.start);

      for (let i = 0; i < ranges.length - 1; i++) {
        if (ranges[i].end >= ranges[i + 1].start) {
          warnings.push(`Sobreposição detectada: a seção '${ranges[i].name}' (termina em ${ranges[i].end}) se sobrepõe com a seção '${ranges[i + 1].name}' (inicia em ${ranges[i + 1].start}).`);
        }
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    validateJson(val, activeTab);
  };

  // Realizar / Simular transmissão
  const handleSimulateSend = async () => {
    try {
      const data = JSON.parse(jsonText);
      validateJson(jsonText, activeTab);
      
      if (validationResult.errors.length > 0) {
        setSimulationLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ❌ Transmissão cancelada: Contrato inválido com o Core API v1.`,
          ...prev
        ]);
        return;
      }

      setSimulationLogs(prev => [
        `[${new Date().toLocaleTimeString()}] 📡 [Transmitindo payload...] Tipo: ${activeTab.toUpperCase()} | ID: ${data.id}`,
        ...prev
      ]);

      let success = false;
      if (activeTab === "chord") {
        success = await musescoreAdapter.sendChord(data);
      } else if (activeTab === "progression") {
        success = await musescoreAdapter.sendProgression(data);
      } else {
        // Para Score completo
        try {
          const response = await fetch("http://localhost:9000/api/v1/send", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "X-FindChord-Client": "compose-suite"
            },
            body: JSON.stringify({ type: "score", data }),
            mode: "cors"
          });
          success = response.ok;
        } catch (e) {
          success = false;
        }
      }

      if (success) {
        setSimulationLogs(prev => [
          `[${new Date().toLocaleTimeString()}] 🟢 [Transmissão bem-sucedida] Host gravando metadados na partitura.`,
          ...prev
        ]);
      } else {
        setSimulationLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ⚠️ [Falha na ponte] Host offline. Transmissão registrada localmente apenas.`,
          ...prev
        ]);
      }
    } catch (e: any) {
      setSimulationLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ Falha: JSON corrompido ou erro na rede.`,
        ...prev
      ]);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonText);
    alert("JSON copiado para a área de transferência!");
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl text-zinc-100">
      
      {/* Lado Esquerdo: Editor e Validador */}
      <div className="col-span-1 lg:col-span-7 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold tracking-tight text-zinc-200">Editor do API Playground</h2>
          </div>
          
          <div className="flex items-center gap-1.5 bg-zinc-950/50 p-1 rounded-lg border border-zinc-850">
            <button
              onClick={() => handleLoadTemplate("chord")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === "chord" ? "bg-purple-500/25 border border-purple-500/30 text-purple-400" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Chord
            </button>
            <button
              onClick={() => handleLoadTemplate("progression")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === "progression" ? "bg-purple-500/25 border border-purple-500/30 text-purple-400" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Progression
            </button>
            <button
              onClick={() => handleLoadTemplate("score")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === "score" ? "bg-purple-500/25 border border-purple-500/30 text-purple-400" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              Score
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={jsonText}
            onChange={handleTextChange}
            rows={18}
            className="w-full p-4 rounded-xl border border-zinc-850 bg-zinc-950 font-mono text-xs text-purple-200 focus:outline-none focus:border-purple-500/50 resize-y leading-relaxed box-border"
          />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all"
              title="Copiar JSON"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleLoadTemplate(activeTab)}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all"
              title="Resetar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Validador de Regras */}
        <div className={`p-4 rounded-xl border flex flex-col gap-2 ${validationResult.valid ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-red-500/5 border-red-500/20 text-red-400"}`}>
          <div className="flex items-center gap-2">
            {validationResult.valid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
            <span className="font-bold text-sm">
              {validationResult.valid ? "Contrato Válido (Core API v1)" : "Validação Falhou"}
            </span>
          </div>

          {validationResult.errors.length > 0 && (
            <ul className="text-xs list-disc pl-5 space-y-1 mt-1 text-red-300 leading-relaxed">
              {validationResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="text-xs border-t border-zinc-800/40 pt-2 mt-1 space-y-1 text-amber-300 leading-relaxed flex flex-col">
              <span className="font-bold flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-amber-400" /> Alertas Secundários:
              </span>
              <ul className="list-disc pl-5 space-y-0.5">
                {validationResult.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Lado Direito: Visualizador de Metadados e Logs de Simulação */}
      <div className="col-span-1 lg:col-span-5 flex flex-col gap-4">
        
        {/* Painel de Diagnóstico da Ponte (Sprint B.5) */}
        <div className="p-5 rounded-xl border border-zinc-850 bg-zinc-950/40 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-zinc-300 border-b border-zinc-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Painel de Diagnóstico da Ponte
            </span>
            <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${telemetry.bridgeOnline ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              {telemetry.bridgeOnline ? "Bridge Online" : "Bridge Offline"}
            </span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-850 flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Fila de Eventos</span>
              <span className="text-sm font-black text-zinc-200">{telemetry.queueSize} / 50</span>
            </div>
            <div className="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-850 flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Polls do Plugin</span>
              <span className="text-sm font-black text-zinc-200">{telemetry.pluginPollCount}</span>
            </div>
            <div className="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-850 flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Eventos Aceitos</span>
              <span className="text-sm font-black text-emerald-400">{telemetry.eventsAccepted}</span>
            </div>
            <div className="p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-850 flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Eventos Rejeitados</span>
              <span className={`text-sm font-black ${telemetry.eventsRejected > 0 ? "text-red-400" : "text-zinc-400"}`}>{telemetry.eventsRejected}</span>
            </div>
          </div>

          <div className="text-[10px] text-zinc-550 flex flex-col gap-1.5 border-t border-zinc-850/60 pt-2.5">
            <div className="flex justify-between">
              <span>Última Atividade Plugin:</span>
              <span className="font-mono text-zinc-400 font-bold">
                {telemetry.pluginLastSeen ? new Date(telemetry.pluginLastSeen).toLocaleTimeString() : "Nenhuma"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Última Atividade Frontend:</span>
              <span className="font-mono text-zinc-400 font-bold">
                {telemetry.frontendLastSeen ? new Date(telemetry.frontendLastSeen).toLocaleTimeString() : "Nenhuma"}
              </span>
            </div>
            <div className="flex justify-between text-[9px] text-zinc-600 font-bold mt-1 uppercase tracking-wider">
              <span>API v{telemetry.apiVersion}</span>
              <span>Bridge v{telemetry.bridgeVersion}</span>
            </div>
          </div>
        </div>

        {/* Renderizador de Detalhes Harmônicos */}
        <div className="p-5 rounded-xl border border-zinc-850 bg-zinc-950/40 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-300 border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            Inspetor de Estrutura Canônica
          </h3>

          <div className="flex flex-col gap-3 text-xs">
            {activeTab === "chord" && (
              <>
                <div className="flex justify-between border-b border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-500">Cifragem / Símbolo:</span>
                  <span className="font-bold text-zinc-200">{CHORD_TEMPLATE.symbol}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-500">Inversão / Voicing:</span>
                  <span className="text-zinc-300">{CHORD_TEMPLATE.inversion} ({CHORD_TEMPLATE.voicingType})</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-500">Tensão / Voice Leading:</span>
                  <span className="text-zinc-300">T:{CHORD_TEMPLATE.tensionLevel} | VL:{CHORD_TEMPLATE.voiceLeadingScore}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-500">Leis Universais Ativadas:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {CHORD_TEMPLATE.universalLaws?.map((l, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-md text-[10px]">{l}</span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "progression" && (
              <>
                <div className="flex justify-between border-b border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-500">Centro Tonal Estável:</span>
                  <span className="font-bold text-zinc-200">{PROGRESSION_TEMPLATE.tonalCenters.join(", ")}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-500">Cadeia de Acordes:</span>
                  <span className="text-zinc-300 font-bold">{PROGRESSION_TEMPLATE.chordEvents.map(c => c.symbol).join(" → ")}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-zinc-800/40 pb-2">
                  <span className="text-zinc-500">Curva de Tensão por Acorde:</span>
                  <div className="flex items-end gap-2 h-16 pt-3 px-2">
                    {PROGRESSION_TEMPLATE.globalTensionCurve?.map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                        <div 
                          className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-sm"
                          style={{ height: `${val * 32}px` }}
                        />
                        <span className="text-[9px] text-zinc-500">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-500">Narrativa Gerada:</span>
                  <p className="text-[11px] text-zinc-400 italic leading-relaxed mt-1">
                    "{PROGRESSION_TEMPLATE.narrativeSegments?.[0]}"
                  </p>
                </div>
              </>
            )}

            {activeTab === "score" && (
              <>
                <div className="flex justify-between border-b border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-500">Título da Obra:</span>
                  <span className="font-bold text-zinc-200">{SCORE_TEMPLATE.title}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-500">Seções Estruturais:</span>
                  <span className="text-zinc-300">{SCORE_TEMPLATE.sections.map(s => s.name).join(", ")}</span>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/40 flex flex-col gap-2 mt-1">
                  <span className="font-bold text-zinc-300 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-purple-400" />
                    Metateoria Dominante (F11-X)
                  </span>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Unificação (TUS):</span>
                    <span className="text-purple-400 font-bold">{(SCORE_TEMPLATE.metaTheory.theoreticalUnificationScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-400">Profundidade Explicativa (ED):</span>
                    <span className="text-purple-400 font-bold">{SCORE_TEMPLATE.metaTheory.explanatoryDepth.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-normal mt-1 border-t border-zinc-800/20 pt-1">
                    {SCORE_TEMPLATE.metaTheory.metaNarrative}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Simulador de Transmissão */}
        <div className="flex-1 p-5 rounded-xl border border-zinc-850 bg-zinc-950/40 flex flex-col gap-3 min-h-[200px]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Simulação de Comunicação Host
            </h3>
            
            <button
              onClick={handleSimulateSend}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Send className="h-3 w-3" />
              Transmitir
            </button>
          </div>

          <div className="flex-1 bg-zinc-950 p-3 rounded-lg border border-zinc-850/80 font-mono text-[10px] text-zinc-400 overflow-y-auto max-h-[220px] leading-relaxed flex flex-col gap-1.5">
            {simulationLogs.length === 0 ? (
              <span className="text-zinc-600 italic">Aguardando gatilho de transmissão...</span>
            ) : (
              simulationLogs.map((log, idx) => (
                <div key={idx} className="border-b border-zinc-900/50 pb-1 last:border-0">{log}</div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
