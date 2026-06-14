import React, { useState, useMemo } from "react";
import { BuilderProvider } from "./builder/context/BuilderContext";
import { TuningSelector } from "./builder/TuningSelector";
import { StringSelector } from "./builder/StringSelector";
import { VirtualFretboard } from "./builder/VirtualFretboard";
import { TranslationLayer } from "./builder/TranslationLayer";
import { VoicingSearchLayer } from "./builder/VoicingSearchLayer";
import { MuseScoreExportLayer } from "./builder/MuseScoreExportLayer";
import { InspectorDashboard } from "./InspectorDashboard";
import { InspectorEngine } from "../utils/music/analysis/inspector/InspectorEngine";
import { useChordStore } from "../store/useChordStore";
import { noteToMidi } from "../utils/music/core/midi";
import { getNoteAt } from "../utils/music/core/notes";
import type { CanonicalProgressionEvent } from "../utils/music/analysis/models/CanonicalProgressionEvent";
import type { CanonicalChordEvent } from "../utils/music/analysis/models/CanonicalChordEvent";
import { 
  Sliders, 
  BookOpen, 
  Search, 
  ShieldAlert, 
  Send 
} from "lucide-react";

type BuilderTab = "input" | "translation" | "voicings" | "inspector" | "export";

const BuilderContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BuilderTab>("input");
  
  // Acessa a progressão e timelime globais do store
  const { progressionChords, timelineVoicings, tuning, activeInstrument } = useChordStore();

  // Constrói o evento de progressão canônico para o Inspector
  const progressionEvent = useMemo<CanonicalProgressionEvent>(() => {
    const chordEvents: CanonicalChordEvent[] = progressionChords.map((symbol, idx) => {
      const voicing = timelineVoicings[idx];
      const frets = voicing ? voicing.frets : Array(tuning.length).fill(null);
      const notes = voicing 
        ? voicing.frets
            .map((f, stringIdx) => f !== null ? noteToMidi(getNoteAt(tuning[stringIdx], f)) : null)
            .filter((n): n is number => n !== null)
        : [];

      return {
        id: `ch_${symbol}_${idx}`,
        symbol,
        voicing: {
          notes,
          frets
        },
        tuning: {
          instrument: activeInstrument,
          strings: tuning
        },
        inversion: voicing ? "Root" : "Root",
        voicingType: voicing ? voicing.shapeFamily || "Unknown" : "Unknown",
        tensionLevel: 0.5,
        voiceLeadingScore: 1.0
      };
    });

    return {
      id: `progression_${progressionChords.join("_")}`,
      chordEvents,
      tonalCenters: []
    };
  }, [progressionChords, timelineVoicings, tuning, activeInstrument]);

  // Executa as regras de lint harmônico
  const diagnostics = useMemo(() => {
    return InspectorEngine.inspect(progressionEvent);
  }, [progressionEvent]);

  return (
    <div className="w-full flex flex-col gap-6 text-zinc-100">
      
      {/* Abas de Navegação Premium */}
      <div className="flex border-b border-zinc-800 pb-0.5 overflow-x-auto gap-2">
        {[
          { id: "input" as BuilderTab, label: "Captura & Afinador", icon: Sliders, alertCount: undefined as number | undefined },
          { id: "translation" as BuilderTab, label: "Teoria & Biblioteca", icon: BookOpen, alertCount: undefined as number | undefined },
          { id: "voicings" as BuilderTab, label: "Shapes Alternativos", icon: Search, alertCount: undefined as number | undefined },
          { id: "inspector" as BuilderTab, label: "Linter Inspector", icon: ShieldAlert, alertCount: diagnostics.length as number | undefined },
          { id: "export" as BuilderTab, label: "Ponte MuseScore", icon: Send, alertCount: undefined as number | undefined }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BuilderTab)}
              className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-0.5 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? "border-purple-500 text-purple-400 font-extrabold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.alertCount !== undefined && tab.alertCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-purple-600/30 text-purple-300 rounded-full text-[9px] font-black border border-purple-500/20">
                  {tab.alertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Renderização Dinâmica de Abas */}
      <div className="flex flex-col gap-6">
        {activeTab === "input" && (
          <div className="flex flex-col gap-6 animate-scale-up">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TuningSelector />
              <StringSelector />
            </div>
            <VirtualFretboard />
          </div>
        )}

        {activeTab === "translation" && (
          <div className="animate-scale-up">
            <TranslationLayer />
          </div>
        )}

        {activeTab === "voicings" && (
          <div className="animate-scale-up">
            <VoicingSearchLayer />
          </div>
        )}

        {activeTab === "inspector" && (
          <div className="animate-scale-up p-5 rounded-2xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col gap-2 border-b border-zinc-850 pb-4 mb-4">
              <h2 className="text-sm font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-purple-400" />
                Linter Harmônico & Observabilidade
              </h2>
              <p className="text-[11px] text-zinc-400">
                Audite a condução de vozes, estabilidade interpretativa e conflitos teóricos da progressão timeline.
              </p>
            </div>
            {progressionChords.length === 0 ? (
              <div className="p-8 rounded-xl border border-zinc-900 bg-zinc-950/40 text-center text-zinc-500 text-xs font-bold font-sans">
                A progressão de acordes está vazia. Adicione acordes usando o Afinador e Fretboard para auditar a sua harmonia.
              </div>
            ) : (
              <InspectorDashboard 
                diagnostics={diagnostics} 
                totalMeasures={progressionChords.length} 
              />
            )}
          </div>
        )}

        {activeTab === "export" && (
          <div className="animate-scale-up">
            <MuseScoreExportLayer />
          </div>
        )}
      </div>

    </div>
  );
};

export default function BuilderMVP() {
  return (
    <BuilderProvider>
      <BuilderContent />
    </BuilderProvider>
  );
}
