import { useState, useMemo } from "react";
import { useChordStore } from "../store/useChordStore";
import type { FretPosition } from "../store/useChordStore";
import { getPresetVoicingsForChord } from "../utils/music/generation/shapeFinder";
import { generateAnalyzedVoicings, identifyShapeFamily } from "../utils/music/generation/voicingGenerator";
import { buildAnalyzedVoicing } from "../utils/music/analysis/voicingAnalyzer";
import { scoreVoicing, scoreVoicingQuality } from "../utils/music/scoring/voicingScorer";
import { CageShape } from "../utils/music/models/VoicingShape";
import type { AnalyzedVoicing } from "../utils/music/models/AnalyzedVoicing";
import { getPitchClass } from "../utils/music/core/pitch";
import { getNoteAt, getOctave } from "../utils/music/core/notes";
import { analyzeChords } from "../utils/music/analysis/chordAnalyzer";
import { CHORD_REGISTRY } from "../utils/music/constants/chordRegistry";
import type { ChordQuality } from "../utils/music/constants/chordRegistry";
import { playGuitarChord } from "../utils/audioSynth";
import { 
  Map, 
  Filter, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  EyeOff,
  CornerDownRight
} from "lucide-react";

interface ExplorerProps {
  setCurrentTab: (tab: "lab" | "playground" | "builder" | "explorer") => void;
}

const ROOT_OPTIONS = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"];

export default function Explorer({ setCurrentTab }: ExplorerProps) {
  const { tuning, notationStyle } = useChordStore();

  // Estados de Busca
  const [selectedRoot, setSelectedRoot] = useState<string>("C");
  const [selectedQuality, setSelectedQuality] = useState<ChordQuality>("major7th");

  // Estados de Filtros e UI
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState<boolean>(true);
  const [hoveredVoicing, setHoveredVoicing] = useState<AnalyzedVoicing | null>(null);
  const [activeVoicing, setActiveVoicing] = useState<AnalyzedVoicing | null>(null);

  // Filtros Avançados
  const [requiredIntervals, setRequiredIntervals] = useState<Record<string, boolean>>({
    root: false, third: false, fifth: false, seventh: false, ninth: false, eleventh: false, thirteenth: false
  });
  const [omissions, setOmissions] = useState<Record<string, boolean>>({
    omitRoot: false, omitFifth: false, omitSeventh: false
  });
  const [requireGuideTones, setRequireGuideTones] = useState<boolean>(false);
  const [structures, setStructures] = useState<Record<string, boolean>>({
    triad: false, shell: false, drop2: false, drop3: false, quartal: false, cluster: false, extended: false
  });
  const [positionRange, setPositionRange] = useState<"all" | "0-5" | "5-9" | "9-12" | "12+">("all");
  const [voiceCount, setVoiceCount] = useState<"any" | 3 | 4 | 5 | 6>("any");
  const [bassFilter, setBassFilter] = useState<"any" | "root" | "third" | "fifth" | "seventh" | "tension">("any");
  const [sortBy, setSortBy] = useState<"quality" | "tensions" | "position" | "mostComplete" | "leastComplete">("quality");

  const getChordDisplaySymbol = (chordName: string, root: string, quality: ChordQuality) => {
    const def = CHORD_REGISTRY[quality];
    if (!def) return chordName;
    if (notationStyle === "Brazilian") return `${root}${def.notation.brazilian}`;
    if (notationStyle === "Academic") return `${root}${def.notation.academic}`;
    return `${root}${def.notation.jazz}`;
  };

  // 1. Recalcular voicings quando a busca mudar
  const voicings = useMemo(() => {
    const rootPC = getPitchClass(selectedRoot);
    const def = CHORD_REGISTRY[selectedQuality];
    if (!def) return [];

    const chordName = `${selectedRoot}${def.notation.jazz}`;
    const targetPitchClasses = def.semitones.map(s => (rootPC + s) % 12);

    // Buscar do shapeFinder (Presets)
    const presets = getPresetVoicingsForChord(chordName).map(p => {
      const notes = p.frets.map((f, idx) => f !== null ? getNoteAt(tuning[idx], f) : "x");
      const shape = {
        chordName,
        frets: p.frets,
        rootString: p.frets.findIndex(f => f !== null && getPitchClass(getNoteAt(tuning[p.frets.indexOf(f) || 0], f)) === rootPC),
        cageShape: p.cageShape || CageShape.E,
        positionFret: Math.min(...(p.frets.filter(f => f !== null && f > 0) as number[])),
        notes,
        qualityScore: scoreVoicingQuality(p.frets, notes, tuning),
        shapeFamily: identifyShapeFamily(p.frets)
      };

      const analyzed = buildAnalyzedVoicing(shape, tuning);
      const score = scoreVoicing(
        analyzed.roles,
        analyzed.classification,
        analyzed.acoustics,
        selectedQuality,
        rootPC,
        targetPitchClasses,
        null
      );

      return {
        ...analyzed,
        score,
        metadata: {
          source: "preset" as const,
          chordSymbol: chordName
        }
      };
    });

    // Gerar candidatos combinatórios
    const generated = generateAnalyzedVoicings(
      chordName,
      selectedRoot,
      targetPitchClasses,
      tuning,
      selectedQuality,
      null
    );

    const combined: AnalyzedVoicing[] = [...presets];
    generated.forEach(g => {
      const isDuplicate = combined.some(c => c.shape.frets.every((f, idx) => f === g.shape.frets[idx]));
      if (!isDuplicate) {
        combined.push(g);
      }
    });

    return combined;
  }, [selectedRoot, selectedQuality, tuning]);

  // Auxiliar para presenca de graus
  const hasDegree = (v: AnalyzedVoicing, deg: string): boolean => {
    if (deg === "1") return v.roles.root === "present";
    if (deg === "3") return v.roles.third === "present";
    if (deg === "5") return v.roles.fifth === "present";
    if (deg === "7") return v.roles.seventh === "present";
    if (deg === "9" || deg === "11" || deg === "13") {
      const d = parseInt(deg, 10);
      return v.roles.tensions.some(t => t.degree === d && t.state === "present");
    }
    return false;
  };

  // 2. Filtragem dos candidatos
  const filteredVoicings = useMemo(() => {
    return voicings.filter(v => {
      // Região do Braço
      if (positionRange === "0-5") {
        if (v.shape.positionFret < 0 || v.shape.positionFret > 5) return false;
      } else if (positionRange === "5-9") {
        if (v.shape.positionFret < 5 || v.shape.positionFret > 9) return false;
      } else if (positionRange === "9-12") {
        if (v.shape.positionFret < 9 || v.shape.positionFret > 12) return false;
      } else if (positionRange === "12+") {
        if (v.shape.positionFret <= 12) return false;
      }

      // Baixo
      if (bassFilter !== "any") {
        if (v.roles.bassRole !== bassFilter) return false;
      }

      // Vozes Físicas
      if (voiceCount !== "any") {
        if (v.roles.voiceCount !== voiceCount) return false;
      }

      // Guide Tones (3 e 7)
      if (requireGuideTones) {
        if (v.roles.third !== "present" || v.roles.seventh !== "present") return false;
      }

      // Omissões
      if (omissions.omitRoot && v.roles.root !== "omitted") return false;
      if (omissions.omitFifth && v.roles.fifth !== "omitted") return false;
      if (omissions.omitSeventh && v.roles.seventh !== "omitted") return false;

      // Graus Obrigatórios
      const activeRequiredIntervals: string[] = [];
      if (requiredIntervals.root) activeRequiredIntervals.push("1");
      if (requiredIntervals.third) activeRequiredIntervals.push("3");
      if (requiredIntervals.fifth) activeRequiredIntervals.push("5");
      if (requiredIntervals.seventh) activeRequiredIntervals.push("7");
      if (requiredIntervals.ninth) activeRequiredIntervals.push("9");
      if (requiredIntervals.eleventh) activeRequiredIntervals.push("11");
      if (requiredIntervals.thirteenth) activeRequiredIntervals.push("13");

      for (const deg of activeRequiredIntervals) {
        if (!hasDegree(v, deg)) return false;
      }

      // Estrutura
      const activeStructures = Object.keys(structures).filter(k => structures[k]);
      if (activeStructures.length > 0) {
        if (!activeStructures.includes(v.classification.shellType)) return false;
      }

      return true;
    });
  }, [voicings, positionRange, bassFilter, voiceCount, requireGuideTones, omissions, requiredIntervals, structures]);

  // 3. Ordenação dos candidatos
  const sortedVoicings = useMemo(() => {
    return [...filteredVoicings].sort((a, b) => {
      if (sortBy === "quality") {
        return (b.score?.total || b.shape.qualityScore || 0) - (a.score?.total || a.shape.qualityScore || 0);
      }
      if (sortBy === "tensions") {
        const aTensions = a.roles.tensions.filter(t => t.state === "present").length;
        const bTensions = b.roles.tensions.filter(t => t.state === "present").length;
        return bTensions - aTensions;
      }
      if (sortBy === "position") {
        return a.shape.positionFret - b.shape.positionFret;
      }
      if (sortBy === "mostComplete") {
        const weight: Record<string, number> = { extended: 3, complete: 2, minimal: 1 };
        return weight[b.classification.completeness] - weight[a.classification.completeness];
      }
      if (sortBy === "leastComplete") {
        const weight: Record<string, number> = { extended: 3, complete: 2, minimal: 1 };
        return weight[a.classification.completeness] - weight[b.classification.completeness];
      }
      return 0;
    });
  }, [filteredVoicings, sortBy]);

  // 4. Carregar no Builder e alternar aba
  const handleLoadToBuilder = (frets: (number | null)[]) => {
    const activePositions: FretPosition[] = [];
    frets.forEach((fret, stringIndex) => {
      if (fret !== null) {
        const baseNote = tuning[stringIndex];
        const noteName = getNoteAt(baseNote, fret);
        activePositions.push({
          stringIndex,
          fret,
          noteName,
          pitchClass: getPitchClass(noteName),
          octave: getOctave(noteName)
        });
      }
    });

    const chords = analyzeChords(activePositions);
    useChordStore.setState({
      selectedFrets: [...frets],
      detectedChords: chords,
      selectedChordIndex: chords.length > 0 ? 0 : null,
      selectedVoicing: null
    });

    // Navegar
    setCurrentTab("builder");
  };

  // 5. Renderizar Mini SVG Fretboard Diagram
  const renderMiniDiagram = (frets: (number | null)[]) => {
    const dWidth = 70;
    const dHeight = 90;
    const activeFrets = frets.filter(f => f !== null && f > 0) as number[];
    const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
    const capoFret = minFret > 4 ? minFret : 1;

    return (
      <svg width={dWidth} height={dHeight} className="overflow-visible select-none">
        <rect x="12" y="12" width="48" height="64" fill="#09090b" stroke="#27272a" strokeWidth="1" />
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={12 + i * 9.6} y1="12" x2={12 + i * 9.6} y2={76} stroke="#3f3f46" strokeWidth="0.8" />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1={12} y1={12 + i * 16} x2={60} y2={12 + i * 16} stroke="#3f3f46" strokeWidth="0.8" />
        ))}
        {frets.map((f, idx) => {
          const x = 12 + (5 - idx) * 9.6;
          if (f === null) {
            return <text key={idx} x={x} y="8" textAnchor="middle" fontSize="8" fontWeight="black" fill="#EF4444" opacity="0.8">×</text>;
          }
          if (f === 0) {
            return <circle key={idx} cx={x} cy="5" r="2.5" fill="transparent" stroke="#10B981" strokeWidth="0.8" />;
          }
          const relativeFret = f - capoFret + 1;
          if (relativeFret >= 1 && relativeFret <= 4) {
            const y = 12 + (relativeFret - 0.5) * 16;
            return <circle key={idx} cx={x} cy={y} r="3.5" fill="#a855f7" />;
          }
          return null;
        })}
        {capoFret > 1 && (
          <text x="5" y="24" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#71717a">{`fr${capoFret}`}</text>
        )}
      </svg>
    );
  };

  const activeAuditVoicing = hoveredVoicing || activeVoicing || sortedVoicings[0] || null;
  const currentSymbol = getChordDisplaySymbol(`${selectedRoot}${CHORD_REGISTRY[selectedQuality].notation.jazz}`, selectedRoot, selectedQuality);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl text-zinc-100">
      
      {/* Barra de Busca Superior */}
      <div className="col-span-1 lg:col-span-12 flex flex-col md:flex-row items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div className="flex items-center gap-2.5">
          <Map className="h-5 w-5 text-purple-400" />
          <div>
            <h2 className="text-base font-bold text-zinc-200">Explorer — Buscador de Possibilidades</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">Navegue pelas melhores opções harmônicas e de digitação.</p>
          </div>
        </div>

        {/* Seletores de Busca Autônoma */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-500 font-bold uppercase">Fundamental</span>
            <select
              value={selectedRoot}
              onChange={(e) => {
                setSelectedRoot(e.target.value);
                setActiveVoicing(null);
              }}
              className="bg-zinc-950 text-zinc-200 text-xs px-3 py-2 rounded-xl border border-zinc-800 focus:border-purple-500 outline-none transition cursor-pointer"
            >
              {ROOT_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-500 font-bold uppercase">Qualidade do Acorde</span>
            <select
              value={selectedQuality}
              onChange={(e) => {
                setSelectedQuality(e.target.value as ChordQuality);
                setActiveVoicing(null);
              }}
              className="bg-zinc-950 text-zinc-200 text-xs px-3 py-2 rounded-xl border border-zinc-800 focus:border-purple-500 outline-none transition cursor-pointer"
            >
              {Object.keys(CHORD_REGISTRY).map(quality => (
                <option key={quality} value={quality}>
                  {quality} ({CHORD_REGISTRY[quality as ChordQuality].notation.jazz || "M"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-500 font-bold uppercase">Ordenação</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 text-zinc-200 text-xs px-3 py-2 rounded-xl border border-zinc-800 focus:border-purple-500 outline-none transition cursor-pointer"
            >
              <option value="quality">Pontuação (Qualidade)</option>
              <option value="tensions">Mais Tensões</option>
              <option value="position">Casa Inicial</option>
              <option value="mostComplete">Mais Completo</option>
              <option value="leastComplete">Menos Completo</option>
            </select>
          </div>

          <button
            onClick={() => setFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`px-3.5 py-2 mt-4 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${isFilterDrawerOpen ? "bg-purple-950/20 border-purple-500/30 text-purple-400" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {isFilterDrawerOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Grade Principal de Voicings */}
      <div className={`${isFilterDrawerOpen ? "lg:col-span-6" : "lg:col-span-8"} flex flex-col gap-4 overflow-y-auto max-h-[580px] scrollbar-thin`}>
        
        <div className="flex items-center justify-between px-1 select-none">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            {sortedVoicings.length} Formas Encontradas para {currentSymbol}
          </span>
        </div>

        {sortedVoicings.length > 0 ? (
          <div className={`grid grid-cols-2 ${isFilterDrawerOpen ? "sm:grid-cols-2 md:grid-cols-3" : "sm:grid-cols-3 md:grid-cols-4"} gap-4 pr-1`}>
            {sortedVoicings.map((voicing, idx) => {
              const isSelected = activeVoicing && activeVoicing.shape.frets.every((f, i) => f === voicing.shape.frets[i]);
              
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredVoicing(voicing)}
                  onMouseLeave={() => setHoveredVoicing(null)}
                  onClick={() => {
                    setActiveVoicing(voicing);
                    playGuitarChord(voicing.shape.notes);
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${isSelected ? "bg-purple-950/25 border-purple-500/70 shadow-lg shadow-purple-950/25 scale-[1.01]" : "bg-zinc-950/60 border-zinc-850 hover:border-zinc-800 hover:bg-zinc-900/30"}`}
                >
                  <div>
                    {renderMiniDiagram(voicing.shape.frets)}
                  </div>

                  <div className="w-full border-t border-zinc-900 pt-2 flex flex-col items-center gap-0.5 text-center select-none">
                    <span className="text-[10px] font-black text-purple-300">
                      {voicing.shape.shapeFamily && voicing.shape.shapeFamily !== "Standard Shape" ? voicing.shape.shapeFamily : `Fôrma ${voicing.shape.cageShape}`}
                    </span>
                    <span className="text-[9px] text-zinc-500 font-bold">
                      {voicing.shape.positionFret === 0 ? "Cordas Soltas" : `Casa Inicial: ${voicing.shape.positionFret}`}
                    </span>
                    <span className="text-[8.5px] font-black text-emerald-400 mt-1 bg-emerald-950/25 border border-emerald-900/40 px-1.5 py-0.5 rounded uppercase">
                      Q: {voicing.shape.qualityScore || voicing.score?.total || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full h-80 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-2xl text-zinc-500 italic text-xs gap-1.5 select-none">
            <EyeOff className="h-6 w-6 text-zinc-700 animate-pulse" />
            <span>Nenhum voicing corresponde aos filtros de conceitos harmônicos.</span>
          </div>
        )}
      </div>

      {/* Painel Central Collapsible de Filtros Avançados */}
      {isFilterDrawerOpen && (
        <div className="lg:col-span-3 p-4 rounded-xl border border-zinc-850 bg-zinc-950/45 flex flex-col gap-4 max-h-[580px] overflow-y-auto scrollbar-thin text-[10px] font-bold text-zinc-400 select-none">
          <h3 className="text-xs font-bold text-zinc-300 border-b border-zinc-800 pb-2">Filtros Avançados</h3>
          
          {/* Graus */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider">Graus Obrigatórios</span>
            <div className="grid grid-cols-1 gap-2 pl-1">
              {Object.keys(requiredIntervals).map(deg => {
                const labels: Record<string, string> = { root: "Tônica (1)", third: "Terça (3)", fifth: "Quinta (5)", seventh: "Sétima (7)", ninth: "9ª", eleventh: "11ª", thirteenth: "13ª" };
                return (
                  <label key={deg} className="flex items-center gap-2 cursor-pointer hover:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={requiredIntervals[deg]}
                      onChange={(e) => setRequiredIntervals(prev => ({ ...prev, [deg]: e.target.checked }))}
                      className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer"
                    />
                    <span>{labels[deg]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Omissões */}
          <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-3">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider">Omissões & Core</span>
            <div className="flex flex-col gap-2 pl-1">
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200">
                <input
                  type="checkbox"
                  checked={omissions.omitRoot}
                  onChange={(e) => setOmissions(prev => ({ ...prev, omitRoot: e.target.checked }))}
                  className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <span>Sem Tônica (Rootless)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200">
                <input
                  type="checkbox"
                  checked={omissions.omitFifth}
                  onChange={(e) => setOmissions(prev => ({ ...prev, omitFifth: e.target.checked }))}
                  className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <span>Sem Quinta (Omit 5th)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200">
                <input
                  type="checkbox"
                  checked={omissions.omitSeventh}
                  onChange={(e) => setOmissions(prev => ({ ...prev, omitSeventh: e.target.checked }))}
                  className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <span>Sem Sétima (Omit 7th)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200 border-t border-zinc-900/60 pt-2 text-emerald-400">
                <input
                  type="checkbox"
                  checked={requireGuideTones}
                  onChange={(e) => setRequireGuideTones(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <span>Forçar Guide Tones (3ª + 7ª)</span>
              </label>
            </div>
          </div>

          {/* Geografia do Braço */}
          <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-3">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider">Região do Braço</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {(["all", "0-5", "5-9", "9-12", "12+"] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setPositionRange(range)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase border transition cursor-pointer ${positionRange === range ? "bg-purple-950/20 border-purple-500/50 text-purple-300 shadow" : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"}`}
                >
                  {range === "all" ? "Todos" : range}
                </button>
              ))}
            </div>
          </div>

          {/* Baixo */}
          <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-3">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider">Baixo Harmônico</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {(["any", "root", "third", "fifth", "seventh", "tension"] as const).map(bass => {
                const labels: Record<string, string> = { any: "Qualquer", root: "Tônica", third: "3ª", fifth: "5ª", seventh: "7ª", tension: "Tensão" };
                return (
                  <button
                    key={bass}
                    onClick={() => setBassFilter(bass)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase border transition cursor-pointer ${bassFilter === bass ? "bg-purple-950/20 border-purple-500/50 text-purple-300 shadow" : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"}`}
                  >
                    {labels[bass]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vozes Físicas */}
          <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-3">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider">Vozes Físicas</span>
            <div className="flex gap-1 mt-1">
              {(["any", 3, 4, 5, 6] as const).map(count => (
                <button
                  key={count}
                  onClick={() => setVoiceCount(count)}
                  className={`w-7 h-6 flex items-center justify-center rounded-lg text-[9px] font-extrabold border transition cursor-pointer ${voiceCount === count ? "bg-purple-950/20 border-purple-500/50 text-purple-300 shadow" : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"}`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Formatos */}
          <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-3">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider">Formatos Estruturais</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(Object.keys(structures) as string[]).map(type => (
                <button
                  key={type}
                  onClick={() => setStructures(prev => ({ ...prev, [type]: !prev[type] }))}
                  className={`px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase border transition cursor-pointer ${structures[type] ? "bg-purple-950/20 border-purple-500/50 text-purple-300 shadow" : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lado Direito: O Auditor Harmônico Explicável */}
      <div className="lg:col-span-3 flex flex-col gap-4 border-l border-zinc-850/60 pl-4 max-h-[580px] overflow-y-auto scrollbar-thin">
        {activeAuditVoicing ? (
          <div className="flex flex-col gap-4 animate-scale-up">
            
            {/* Cabeçalho Auditor */}
            <div className="flex items-center justify-between select-none">
              <div>
                <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest">Auditor de Voicings</span>
                <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-wider mt-0.5">{currentSymbol}</h3>
              </div>
              <button
                onClick={() => playGuitarChord(activeAuditVoicing.shape.notes)}
                className="p-2 bg-purple-650 hover:bg-purple-550 text-white rounded-full transition active:scale-95 shadow-md shadow-purple-950/20 cursor-pointer"
                title="Ouvir acorde completo"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            </div>

            {/* Ação Principal: Carregar no Builder */}
            <button
              onClick={() => handleLoadToBuilder(activeAuditVoicing.shape.frets)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shadow-purple-950/20"
            >
              <CornerDownRight className="h-4 w-4" />
              Carregar no Builder
            </button>

            {/* Presença de Graus */}
            <div className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-950/40 flex flex-col gap-2.5">
              <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-wider">Presença de Graus</span>
              <div className="flex flex-col gap-2.5 text-[10px]">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">✓ Presentes:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {activeAuditVoicing.roles.root === "present" && <span className="px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">Tônica (1)</span>}
                    {activeAuditVoicing.roles.third === "present" && <span className="px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">Terça (3)</span>}
                    {activeAuditVoicing.roles.fifth === "present" && <span className="px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">Quinta (5)</span>}
                    {activeAuditVoicing.roles.seventh === "present" && <span className="px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">Sétima (7)</span>}
                    {activeAuditVoicing.roles.tensions.filter(t => t.state === "present").map(t => (
                      <span key={t.degree} className="px-2 py-0.5 rounded bg-amber-950/30 border border-amber-900/40 text-amber-300">Tensão ({t.degree}ª)</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-t border-zinc-900/60 pt-2">
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">✗ Omitidos:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {activeAuditVoicing.roles.root === "omitted" && <span className="px-2 py-0.5 rounded bg-zinc-900/40 border border-zinc-800/30 text-zinc-500">Tônica (1)</span>}
                    {activeAuditVoicing.roles.third === "omitted" && <span className="px-2 py-0.5 rounded bg-zinc-900/40 border border-zinc-800/30 text-zinc-500">Terça (3)</span>}
                    {activeAuditVoicing.roles.fifth === "omitted" && <span className="px-2 py-0.5 rounded bg-zinc-900/40 border border-zinc-800/30 text-zinc-500">Quinta (5)</span>}
                    {activeAuditVoicing.roles.seventh === "omitted" && <span className="px-2 py-0.5 rounded bg-zinc-900/40 border border-zinc-800/30 text-zinc-500">Sétima (7)</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* SATB Voice Map */}
            <div className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-950/40 flex flex-col gap-2">
              <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-wider">SATB Voice Map</span>
              <div className="flex flex-col gap-1.5 mt-1 select-none">
                {[...activeAuditVoicing.roles.voices]
                  .sort((a, b) => a.pitch - b.pitch)
                  .map((voice, idx) => {
                    const stringLabels = ["E (1ª)", "B (2ª)", "G (3ª)", "D (4ª)", "A (5ª)", "E (6ª)"];
                    const roleLabels: Record<string, string> = {
                      root: "Tônica",
                      third: "Terça",
                      fifth: "Quinta",
                      seventh: "Sétima",
                      tension: `${voice.info?.degree}ª`
                    };
                    return (
                      <div key={idx} className="flex items-center justify-between text-[9px] font-bold border-b border-zinc-900/50 pb-1.5 last:border-0 last:pb-0">
                        <span className="text-zinc-500 font-semibold">{stringLabels[voice.stringIndex] || `Corda ${voice.stringIndex + 1}`}</span>
                        <span className="text-zinc-200 font-black">{voice.noteName.replace(/\d/, "")}</span>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          voice.role === "root" ? "bg-purple-950/20 text-purple-400 border border-purple-900/30" :
                          voice.role === "third" || voice.role === "seventh" ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30" :
                          voice.role === "fifth" ? "bg-blue-950/20 text-blue-400 border border-blue-900/30" :
                          "bg-amber-950/20 text-amber-400 border border-amber-900/30"
                        }`}>
                          {roleLabels[voice.role] || "Outra"}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Score Breakdown (Auditor de Qualidade) */}
            {activeAuditVoicing.score && (
              <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-950/10 flex flex-col gap-2.5 text-[9.5px] font-bold select-none">
                <div className="flex items-center justify-between border-b border-purple-500/10 pb-2">
                  <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-wider">Score de Auditoria</span>
                  <span className="text-emerald-400 font-black text-[10.5px] bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">
                    Total: {activeAuditVoicing.score.total}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 mt-1 text-zinc-400">
                  <div className="flex justify-between">
                    <span>✓ Cobertura Harmônica</span>
                    <span className="text-zinc-200">+{activeAuditVoicing.score.harmonicCoverage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✓ Guide Tones</span>
                    <span className="text-zinc-200">+{activeAuditVoicing.score.guideTones}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✓ Tensões Adicionadas</span>
                    <span className="text-zinc-200">+{activeAuditVoicing.score.tensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✓ Inversão do Baixo</span>
                    <span className="text-zinc-200">{activeAuditVoicing.score.inversion >= 0 ? `+${activeAuditVoicing.score.inversion}` : activeAuditVoicing.score.inversion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✗ Redundâncias</span>
                    <span className="text-red-400">{activeAuditVoicing.score.redundancy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✗ Espaçamento / Densidade</span>
                    <span className="text-red-400">{activeAuditVoicing.score.density}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>✓ Ergonomia Física</span>
                    <span className="text-zinc-200">+{activeAuditVoicing.score.ergonomics}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Ficha Técnica */}
            <div className="p-3.5 rounded-xl border border-zinc-850 bg-zinc-950/40 flex flex-col gap-2 text-[9px] font-bold text-zinc-400 select-none">
              <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-wider">Ficha Técnica</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex flex-col">
                  <span className="text-zinc-500 text-[8px] uppercase">Estrutura</span>
                  <span className="text-zinc-200 font-black uppercase mt-0.5">{activeAuditVoicing.classification.shellType}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500 text-[8px] uppercase">Densidade</span>
                  <span className="text-zinc-200 font-black uppercase mt-0.5">{activeAuditVoicing.classification.density}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500 text-[8px] uppercase">Inversão</span>
                  <span className="text-zinc-200 font-black uppercase mt-0.5">{activeAuditVoicing.classification.inversionType}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-zinc-500 text-[8px] uppercase">Completeza</span>
                  <span className="text-zinc-200 font-black uppercase mt-0.5">{activeAuditVoicing.classification.completeness}</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-60 rounded-xl border border-dashed border-zinc-850 flex flex-col items-center justify-center p-6 text-center text-zinc-500 text-xs italic gap-1 select-none">
            <Sparkles className="h-5 w-5 text-zinc-700 animate-pulse" />
            <span>Passe o mouse ou selecione um voicing para auditar a teoria e ver a ficha técnica explicável.</span>
          </div>
        )}
      </div>

    </div>
  );
}
