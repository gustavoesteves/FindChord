import { useState, useEffect } from "react";
import { useChordStore } from "../store/useChordStore";
import { getPresetVoicingsForChord } from "../utils/music/generation/shapeFinder";
import { generateAnalyzedVoicings, identifyShapeFamily } from "../utils/music/generation/voicingGenerator";
import { buildAnalyzedVoicing } from "../utils/music/analysis/voicingAnalyzer";
import { scoreVoicing, scoreVoicingQuality } from "../utils/music/scoring/voicingScorer";
import { CageShape } from "../utils/music/models/VoicingShape";
import type { AnalyzedVoicing } from "../utils/music/models/AnalyzedVoicing";
import { getPitchClass } from "../utils/music/core/pitch";
import { getNoteAt } from "../utils/music/core/notes";
import { CHORD_REGISTRY } from "../utils/music/constants/chordRegistry";
import { Layers, Sparkles, Filter, ChevronDown, ChevronUp, Play, EyeOff } from "lucide-react";
import { playGuitarChord } from "../utils/audioSynth";

export default function VoicingSelector() {
  const {
    detectedChords,
    selectedChordIndex,
    tuning,
    selectedVoicing,
    setSelectedVoicing,
    notationStyle,
    isVoicingSelectorOpen,
    setVoicingSelectorOpen
  } = useChordStore();

  const getChordName = (chord: typeof detectedChords[0]) => {
    if (notationStyle === "Brazilian") return chord.notationBrazilian;
    if (notationStyle === "Academic") return chord.notationAcademic;
    return chord.notationJazz;
  };

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  // --- ESTADOS DO EXPLORADOR SEMÂNTICO SPRINT 2.5 ---
  const [voicings, setVoicings] = useState<AnalyzedVoicing[]>([]);
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [hoveredVoicing, setHoveredVoicing] = useState<AnalyzedVoicing | null>(null);

  // 1. Filtros Avançados
  const [requiredIntervals, setRequiredIntervals] = useState<Record<string, boolean>>({
    root: false,
    third: false,
    fifth: false,
    seventh: false,
    ninth: false,
    eleventh: false,
    thirteenth: false
  });
  const [omissions, setOmissions] = useState<Record<string, boolean>>({
    omitRoot: false,
    omitFifth: false,
    omitSeventh: false
  });
  const [requireGuideTones, setRequireGuideTones] = useState(false);
  const [structures, setStructures] = useState<Record<string, boolean>>({
    triad: false,
    shell: false,
    drop2: false,
    drop3: false,
    quartal: false,
    cluster: false,
    extended: false
  });
  const densities: Record<string, boolean> = {
    light: false,
    medium: false,
    dense: false
  };
  const inversions: Record<string, boolean> = {
    root: false,
    first: false,
    second: false,
    third: false,
    fourth: false // quarto modo = Tension Bass no classificador
  };
  const completeness: Record<string, boolean> = {
    minimal: false,
    complete: false,
    extended: false
  };
  const [voiceCount, setVoiceCount] = useState<3 | 4 | 5 | 6 | "any">("any");
  const [positionRange, setPositionRange] = useState<"0-5" | "5-9" | "9-12" | "12+" | "all">("all");
  const [bassFilter, setBassFilter] = useState<"root" | "third" | "fifth" | "seventh" | "tension" | "any">("any");
  const [sortBy, setSortBy] = useState<"quality" | "tensions" | "position" | "mostComplete" | "leastComplete">("quality");

  // Reseta estados temporários ao fechar o modal
  useEffect(() => {
    if (!isVoicingSelectorOpen) {
      setHoveredVoicing(null);
      setFilterDrawerOpen(false);
    }
  }, [isVoicingSelectorOpen]);

  // Carrega e analisa voicings (Presets + Gerador Combinatório) na camada de DTOs
  useEffect(() => {
    if (!activeChord) {
      setVoicings([]);
      return;
    }

    const chordRoot = activeChord.root;
    const rootPC = getPitchClass(chordRoot);
    const def = CHORD_REGISTRY[activeChord.quality];
    const targetPitchClasses = def
      ? def.semitones.map(s => (rootPC + s) % 12)
      : [rootPC];

    const refChordName = activeChord.notationJazz;
    const displayChordName = getChordName(activeChord);

    // 1. Buscar presets transpostos e analisá-los no domínio
    const presets = getPresetVoicingsForChord(refChordName).map(p => {
      const notes = p.frets.map((f, idx) => f !== null ? getNoteAt(tuning[idx], f) : "x");
      const shape = {
        chordName: displayChordName,
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
        activeChord.quality,
        rootPC,
        targetPitchClasses,
        null
      );
      
      return {
        ...analyzed,
        score,
        metadata: {
          source: "preset" as const,
          chordSymbol: displayChordName
        }
      };
    });

    // 2. Gerar candidatos combinatórios e analisá-los no domínio
    const generated = generateAnalyzedVoicings(
      displayChordName,
      chordRoot,
      targetPitchClasses,
      tuning,
      activeChord.quality,
      null
    );

    // Combinar presets e gerados removendo duplicatas geométricas
    const combined: AnalyzedVoicing[] = [...presets];

    generated.forEach(g => {
      const isDuplicate = combined.some(c => c.shape.frets.every((f, idx) => f === g.shape.frets[idx]));
      if (!isDuplicate) {
        combined.push(g);
      }
    });

    setVoicings(combined);
  }, [activeChord, tuning, notationStyle]);

  if (!activeChord || !isVoicingSelectorOpen) return null;

  // --- MÚSICO INTELIGENTE: VERIFICADOR DE PRESENÇA DE GRAUS E ALTERAÇÕES ---
  const hasDegree = (v: AnalyzedVoicing, deg: string): boolean => {
    if (deg === "1") return v.roles.root === "present";
    if (deg === "3") return v.roles.third === "present";
    if (deg === "5") return v.roles.fifth === "present";
    if (deg === "7") return v.roles.seventh === "present";

    // Tensões padrão
    if (deg === "9" || deg === "11" || deg === "13") {
      const d = parseInt(deg, 10);
      return v.roles.tensions.some(t => t.degree === d && t.state === "present");
    }

    // Graus com alterações cromáticas (suporte futuro e de DTO)
    return v.roles.orderedVoiceRoles.some(vr => {
      const vrDeg = vr.degree?.toString() || "";
      const vrAlt = vr.alteration || "";
      const fullDegreeStr = `${vrAlt}${vrDeg}`;
      return fullDegreeStr === deg;
    });
  };

  // --- FILTRAGEM SEMÂNTICA ---
  const filteredVoicings = voicings.filter(v => {
    // 1. Faixa Geográfica do Braço (positionRange)
    if (positionRange === "0-5") {
      if (v.shape.positionFret < 0 || v.shape.positionFret > 5) return false;
    } else if (positionRange === "5-9") {
      if (v.shape.positionFret < 5 || v.shape.positionFret > 9) return false;
    } else if (positionRange === "9-12") {
      if (v.shape.positionFret < 9 || v.shape.positionFret > 12) return false;
    } else if (positionRange === "12+") {
      if (v.shape.positionFret <= 12) return false;
    }

    // 2. Seletor de Baixo Harmônico (bassFilter)
    if (bassFilter !== "any") {
      if (v.roles.bassRole !== bassFilter) return false;
    }

    // 3. Número de Vozes Físicas (voiceCount)
    if (voiceCount !== "any") {
      if (v.roles.voiceCount !== voiceCount) return false;
    }

    // 4. Guide Tones (3ª e 7ª obrigatórias)
    if (requireGuideTones) {
      if (v.roles.third !== "present" || v.roles.seventh !== "present") return false;
    }

    // 5. Filtros de Omissão
    if (omissions.omitRoot && v.roles.root !== "omitted") return false;
    if (omissions.omitFifth && v.roles.fifth !== "omitted") return false;
    if (omissions.omitSeventh && v.roles.seventh !== "omitted") return false;

    // 6. Graus/Intervalos Obrigatórios (requiredIntervals)
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

    // 7. Estruturas Harmônicas (shellType)
    const activeStructures = Object.keys(structures).filter(k => structures[k]);
    if (activeStructures.length > 0) {
      if (!activeStructures.includes(v.classification.shellType)) return false;
    }

    // 8. Densidade
    const activeDensities = Object.keys(densities).filter(k => densities[k]);
    if (activeDensities.length > 0) {
      if (!activeDensities.includes(v.classification.density)) return false;
    }

    // 9. Inversão
    const activeInversions = Object.keys(inversions).filter(k => inversions[k]);
    if (activeInversions.length > 0) {
      if (!activeInversions.includes(v.classification.inversionType)) return false;
    }

    // 10. Completeza
    const activeCompleteness = Object.keys(completeness).filter(k => completeness[k]);
    if (activeCompleteness.length > 0) {
      if (!activeCompleteness.includes(v.classification.completeness)) return false;
    }

    return true;
  });

  // --- ORDENAÇÃO SEMÂNTICA ---
  const sortedVoicings = [...filteredVoicings].sort((a, b) => {
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

  // Visor reativo da auditoria (Hover ➔ Selecionado ➔ Primeiro colocado)
  const activeAuditVoicing = hoveredVoicing || (selectedVoicing && sortedVoicings.find(v => v.shape.frets.every((f, idx) => f === selectedVoicing.frets[idx]))) || sortedVoicings[0] || null;

  // --- RENDERIZADOR DE MINI DIAGRAMA DE ACORDE SVG ---
  const renderMiniDiagram = (frets: (number | null)[]) => {
    const dWidth = 74;
    const dHeight = 90;
    const activeFrets = frets.filter(f => f !== null && f > 0) as number[];
    const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
    const capoFret = minFret > 4 ? minFret : 1;

    return (
      <svg width={dWidth} height={dHeight} className="overflow-visible select-none">
        <rect x="12" y="12" width="50" height="64" fill="#0A0A0C" stroke="#27272A" strokeWidth="1" />
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={12 + i * 10} y1="12" x2={12 + i * 10} y2="76" stroke="#3F3F46" strokeWidth="1" />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1="12" y1={12 + i * 16} x2="62" y2={12 + i * 16} stroke="#3F3F46" strokeWidth="1" />
        ))}
        {frets.map((f, idx) => {
          const x = 12 + idx * 10;
          if (f === null) {
            return (
              <text key={idx} x={x} y="8" textAnchor="middle" fontSize="7.5" fontWeight="black" fill="#EF4444" opacity="0.8">×</text>
            );
          }
          if (f === 0) {
            return (
              <circle key={idx} cx={x} cy="5" r="3" fill="transparent" stroke="#10B981" strokeWidth="1" />
            );
          }
          const relativeFret = f - capoFret + 1;
          if (relativeFret >= 1 && relativeFret <= 4) {
            const y = 12 + (relativeFret - 0.5) * 16;
            return (
              <circle key={idx} cx={x} cy={y} r="3.8" fill="#BD00FF" className="shadow-md shadow-purple-500/50" />
            );
          }
          return null;
        })}
        {capoFret > 1 && (
          <text x="4" y="24" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#A1A1AA">{`fr${capoFret}`}</text>
        )}
      </svg>
    );
  };

  const displayChordName = getChordName(activeChord);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      onClick={() => setVoicingSelectorOpen(false)}
    >
      <div 
        className="bg-[#0E0E12]/98 border border-zinc-800/85 rounded-2xl p-5 w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] glass-panel relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Botão Fechar */}
        <button 
          onClick={() => setVoicingSelectorOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold bg-zinc-900 hover:bg-zinc-850 w-8 h-8 rounded-full flex items-center justify-center transition border border-zinc-800 cursor-pointer hover:scale-105 active:scale-95 z-10"
          title="Fechar"
        >
          ×
        </button>

        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/40 pb-3 gap-3 pr-8 select-none">
          <div className="flex items-center gap-2.5">
            <Layers className="h-5 w-5 text-purple-400" />
            <div>
              <h2 className="text-base font-extrabold text-zinc-100 uppercase tracking-wider">Explorador de Voicings Semântico</h2>
              <p className="text-[10px] text-zinc-400 font-medium">Acorde Base: <span className="text-purple-300 font-bold">{displayChordName}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Seletor de Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 text-zinc-300 text-[10px] font-black uppercase px-2.5 py-1.5 rounded border border-zinc-800 outline-none cursor-pointer focus:border-purple-600 transition"
            >
              <option value="quality">Ordenar por: Qualidade</option>
              <option value="tensions">Ordenar por: Mais Tensões</option>
              <option value="position">Ordenar por: Casa Inicial</option>
              <option value="mostComplete">Ordenar por: Mais Completo</option>
              <option value="leastComplete">Ordenar por: Menos Completo</option>
            </select>

            {/* Toggle Filtros Avançados */}
            <button
              onClick={() => setFilterDrawerOpen(!isFilterDrawerOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-all duration-200 ${
                isFilterDrawerOpen
                  ? "bg-purple-950/30 border-purple-500/50 text-purple-300"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Conceitos Harmônicos
              {isFilterDrawerOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* GAVETA DE FILTROS AVANÇADOS COLLAPSIBLE */}
        {isFilterDrawerOpen && (
          <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-zinc-800/60 bg-zinc-950/70 mt-3 animate-fade-in text-[10px] font-bold text-zinc-400 max-h-[220px] overflow-y-auto scrollbar-thin">
            
            {/* Coluna 1: Graus Obrigatórios */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest border-b border-zinc-900 pb-1 mb-0.5">Graus Obrigatórios</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(requiredIntervals) as string[]).map(deg => {
                  const labels: Record<string, string> = { root: "Tônica (1)", third: "Terça (3)", fifth: "Quinta (5)", seventh: "Sétima (7)", ninth: "9ª", eleventh: "11ª", thirteenth: "13ª" };
                  return (
                    <label key={deg} className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 select-none">
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

            {/* Coluna 2: Omissões & Guide Tones */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest border-b border-zinc-900 pb-1 mb-0.5">Omissões & Core</span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 select-none">
                  <input
                    type="checkbox"
                    checked={omissions.omitRoot}
                    onChange={(e) => setOmissions(prev => ({ ...prev, omitRoot: e.target.checked }))}
                    className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Sem Tônica (Rootless)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 select-none">
                  <input
                    type="checkbox"
                    checked={omissions.omitFifth}
                    onChange={(e) => setOmissions(prev => ({ ...prev, omitFifth: e.target.checked }))}
                    className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Sem Quinta (Omit 5th)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 select-none">
                  <input
                    type="checkbox"
                    checked={omissions.omitSeventh}
                    onChange={(e) => setOmissions(prev => ({ ...prev, omitSeventh: e.target.checked }))}
                    className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Sem Sétima (Omit 7th)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200 select-none border-t border-zinc-900/60 pt-1.5">
                  <input
                    type="checkbox"
                    checked={requireGuideTones}
                    onChange={(e) => setRequireGuideTones(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-emerald-400">Guide Tones (3ª + 7ª)</span>
                </label>
              </div>
            </div>

            {/* Coluna 3: Região do Braço & Baixo */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest border-b border-zinc-900 pb-1">Geografia & Baixo</span>
              
              {/* Posição no Braço */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Região do Braço</span>
                <div className="flex flex-wrap gap-1">
                  {(["all", "0-5", "5-9", "9-12", "12+"] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setPositionRange(range)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border transition cursor-pointer select-none ${
                        positionRange === range
                          ? "bg-purple-950/20 border-purple-500/50 text-purple-300 shadow"
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {range === "all" ? "Todos" : range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro do Baixo */}
              <div className="flex flex-col gap-1 mt-1 border-t border-zinc-900/60 pt-1.5">
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Baixo Harmônico</span>
                <div className="flex flex-wrap gap-1">
                  {(["any", "root", "third", "fifth", "seventh", "tension"] as const).map(bass => {
                    const labels: Record<string, string> = { any: "Qualquer", root: "Tônica", third: "3ª", fifth: "5ª", seventh: "7ª", tension: "Tensão" };
                    return (
                      <button
                        key={bass}
                        onClick={() => setBassFilter(bass)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border transition cursor-pointer select-none ${
                          bassFilter === bass
                            ? "bg-purple-950/20 border-purple-500/50 text-purple-300 shadow"
                            : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {labels[bass]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Coluna 4: Estrutura, Vozes & Densidade */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest border-b border-zinc-900 pb-1">Estrutura & Vozes</span>
              
              {/* Vozes */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Vozes Físicas</span>
                <div className="flex gap-1">
                  {(["any", 3, 4, 5, 6] as const).map(count => (
                    <button
                      key={count}
                      onClick={() => setVoiceCount(count)}
                      className={`w-6 h-4.5 flex items-center justify-center rounded text-[8px] font-extrabold border transition cursor-pointer select-none ${
                        voiceCount === count
                          ? "bg-purple-950/20 border-purple-500/50 text-purple-300 shadow"
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estruturas */}
              <div className="flex flex-col gap-1 mt-1 border-t border-zinc-900/60 pt-1.5">
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Formato Estrutural</span>
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(structures) as string[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setStructures(prev => ({ ...prev, [type]: !prev[type] }))}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border transition cursor-pointer select-none ${
                        structures[type]
                          ? "bg-purple-950/20 border-purple-500/50 text-purple-300 shadow"
                          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* CORPO PRINCIPAL COM LAYOUT SPLIT-SCREEN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 overflow-hidden h-[62vh] min-h-[400px]">
          
          {/* LADO ESQUERDO (col-span-8): Grade de Voicings com Scroll */}
          <div className="lg:col-span-8 flex flex-col h-full overflow-y-auto pr-1 scrollbar-thin select-none">
            {sortedVoicings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3.5 pr-1 py-1">
                {sortedVoicings.map((voicing, idx) => {
                  const isSelected = selectedVoicing && selectedVoicing.frets.every((f, index) => f === voicing.shape.frets[index]);
                  
                  return (
                    <div
                      key={`${voicing.shape.cageShape}-${idx}`}
                      onMouseEnter={() => setHoveredVoicing(voicing)}
                      onMouseLeave={() => setHoveredVoicing(null)}
                      onClick={() => {
                        setSelectedVoicing(voicing.shape);
                        setVoicingSelectorOpen(false);
                      }}
                      className={`flex flex-col items-center p-2.5 rounded-xl border text-center cursor-pointer transition-all duration-200 hover:scale-102 ${
                        isSelected 
                          ? "bg-purple-950/20 border-purple-500/70 shadow-[0_0_12px_rgba(168,85,247,0.15)] scale-[1.01]" 
                          : "bg-zinc-950 border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900/30"
                      }`}
                    >
                      {/* Mini Diagrama */}
                      <div className="mb-2">
                        {renderMiniDiagram(voicing.shape.frets)}
                      </div>

                      {/* Informações Básicas da Forma */}
                      <div className="flex flex-col items-center gap-0.5 mt-1 border-t border-zinc-900 w-full pt-1.5">
                        <span className="text-[10px] font-black text-purple-300 leading-none">
                          {voicing.shape.shapeFamily && voicing.shape.shapeFamily !== "Formato Livre" ? voicing.shape.shapeFamily : `Fôrma ${voicing.shape.cageShape}`}
                        </span>
                        <span className="text-[8.5px] text-zinc-500 font-semibold leading-none mt-1">
                          {voicing.shape.positionFret === 0 ? "Cordas Soltas" : `Casa Inicial: ${voicing.shape.positionFret}`}
                        </span>
                        {voicing.shape.qualityScore !== undefined && (
                          <span className="text-[8px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-1.5 py-0.5 rounded mt-1.5 font-black uppercase tracking-wider">
                            Q: {voicing.shape.qualityScore}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-xl text-zinc-500 text-xs italic gap-1">
                <EyeOff className="h-5 w-5 text-zinc-700 animate-pulse" />
                <span>Nenhum voicing corresponde aos filtros de conceitos harmônicos selecionados.</span>
              </div>
            )}
          </div>

          {/* LADO DIREITO (col-span-4): O AUDITOR HARMÔNICO EXPLICÁVEL */}
          <div className="lg:col-span-4 h-full overflow-y-auto pl-1 border-l border-zinc-850/50 flex flex-col gap-4 scrollbar-thin">
            {activeAuditVoicing ? (
              <div className="flex flex-col gap-3.5 animate-scale-up">
                
                {/* Nome e Cabeçalho do Auditor */}
                <div className="flex items-center justify-between select-none">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Auditor Harmônico</span>
                    <h3 className="text-sm font-extrabold text-zinc-100 uppercase tracking-wider mt-0.5">{displayChordName}</h3>
                  </div>
                  <button
                    onClick={() => playGuitarChord(activeAuditVoicing.shape.notes)}
                    className="flex items-center gap-1.5 text-[9px] font-black px-3 py-1 rounded-full bg-purple-650 hover:bg-purple-550 text-white transition cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:scale-105"
                    title="Ouvir arpejo do voicing"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    Ouvir
                  </button>
                </div>

                {/* VISUALIZAÇÃO: PRESENTES VS OMITIDOS (A Pedagogia de Ouro!) */}
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 shadow-inner">
                  <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-wider">Presença de Graus</span>
                  <div className="flex flex-col gap-1.5">
                    {/* Presentes */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">✓ Presentes:</span>
                      <div className="flex flex-wrap gap-1">
                        {activeAuditVoicing.roles.root === "present" && <span className="text-[8.5px] font-bold px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">Tônica (1)</span>}
                        {activeAuditVoicing.roles.third === "present" && <span className="text-[8.5px] font-bold px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">Terça (3)</span>}
                        {activeAuditVoicing.roles.fifth === "present" && <span className="text-[8.5px] font-bold px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">Quinta (5)</span>}
                        {activeAuditVoicing.roles.seventh === "present" && <span className="text-[8.5px] font-bold px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">Sétima (7)</span>}
                        {activeAuditVoicing.roles.tensions.filter(t => t.state === "present").map(t => (
                          <span key={t.degree} className="text-[8.5px] font-bold px-2 py-0.5 rounded bg-amber-950/30 border border-amber-900/40 text-amber-300">Tensão ({t.degree}ª)</span>
                        ))}
                      </div>
                    </div>
                    {/* Omitidos */}
                    <div className="flex flex-col gap-1 mt-1 border-t border-zinc-900 pt-1.5">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">✗ Omitidos:</span>
                      <div className="flex flex-wrap gap-1">
                        {activeAuditVoicing.roles.root === "omitted" && <span className="text-[8.5px] font-semibold px-2 py-0.5 rounded bg-zinc-900/40 border border-zinc-800/30 text-zinc-500">Tônica (1)</span>}
                        {activeAuditVoicing.roles.third === "omitted" && <span className="text-[8.5px] font-semibold px-2 py-0.5 rounded bg-zinc-900/40 border border-zinc-800/30 text-zinc-500">Terça (3)</span>}
                        {activeAuditVoicing.roles.fifth === "omitted" && <span className="text-[8.5px] font-semibold px-2 py-0.5 rounded bg-zinc-900/40 border border-zinc-800/30 text-zinc-500">Quinta (5)</span>}
                        {activeAuditVoicing.roles.seventh === "omitted" && <span className="text-[8.5px] font-semibold px-2 py-0.5 rounded bg-zinc-900/40 border border-zinc-800/30 text-zinc-500">Sétima (7)</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SATB VOICE MAP (Radiografia Corda por Corda) */}
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 shadow-inner select-none">
                  <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-wider">SATB Voice Map (Grave a Agudo)</span>
                  <div className="flex flex-col gap-1 mt-1">
                    {[...activeAuditVoicing.roles.voices]
                      .sort((a, b) => a.pitch - b.pitch)
                      .map((voice, idx) => {
                        const stringNames = ["E (6ª)", "A (5ª)", "D (4ª)", "G (3ª)", "B (2ª)", "E (1ª)"];
                        const roleNames: Record<string, string> = {
                          root: "Tônica",
                          third: "Terça",
                          fifth: "Quinta",
                          seventh: "Sétima",
                          tension: `Tensão (${voice.info?.degree}ª)`
                        };
                        return (
                          <div key={idx} className="flex items-center justify-between text-[9px] font-bold border-b border-zinc-900/50 pb-1.5 last:border-b-0 last:pb-0">
                            <span className="text-zinc-400 font-semibold">{stringNames[voice.stringIndex]}</span>
                            <span className="text-zinc-100 font-black">{voice.noteName.replace(/\d/, "")}</span>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              voice.role === "root" ? "bg-red-950/20 text-red-400 border border-red-900/30" :
                              voice.role === "third" || voice.role === "seventh" ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30" :
                              voice.role === "fifth" ? "bg-blue-950/20 text-blue-400 border border-blue-900/30" :
                              "bg-amber-950/20 text-amber-400 border border-amber-900/30"
                            }`}>
                              {roleNames[voice.role] || "Nenhuma"}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* FICHA TÉCNICA E CLASSIFICAÇÃO */}
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/80 shadow-inner text-[9px] font-bold text-zinc-400 select-none">
                  <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-wider">Ficha Técnica e Estrutura</span>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Estrutura</span>
                      <span className="text-zinc-200 text-[10px] font-black uppercase mt-0.5">{activeAuditVoicing.classification.shellType}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Densidade</span>
                      <span className="text-zinc-200 text-[10px] font-black uppercase mt-0.5">{activeAuditVoicing.classification.density}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Inversão</span>
                      <span className="text-zinc-200 text-[10px] font-black uppercase mt-0.5">{activeAuditVoicing.classification.inversionType}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Completeza</span>
                      <span className="text-zinc-200 text-[10px] font-black uppercase mt-0.5">{activeAuditVoicing.classification.completeness}</span>
                    </div>
                  </div>
                </div>

                {/* SCORE BREAKDOWN EXPLATIVO (A Auditoria de Qualidade!) */}
                {activeAuditVoicing.score && (
                  <div className="flex flex-col gap-2 p-3 rounded-xl border border-purple-500/20 bg-purple-950/10 shadow-inner text-[9.5px] font-bold text-zinc-400 select-none animate-fade-in">
                    <div className="flex items-center justify-between border-b border-purple-500/10 pb-1.5">
                      <span className="text-[8.5px] font-black text-purple-400 uppercase tracking-wider">Auditoria de Qualidade (Score)</span>
                      <span className="text-emerald-400 font-extrabold text-[11px] bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded leading-none">
                        Total: {activeAuditVoicing.score.total}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">✓ Cobertura Harmônica (Tônica/Graus)</span>
                        <span className="text-zinc-200 font-extrabold">+{activeAuditVoicing.score.harmonicCoverage}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">✓ Presença de Guide Tones (3ª/7ª)</span>
                        <span className="text-zinc-200 font-extrabold">+{activeAuditVoicing.score.guideTones}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">✓ Extensões & Tensões Adicionadas</span>
                        <span className="text-zinc-200 font-extrabold">+{activeAuditVoicing.score.tensions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">✓ Inversão do Baixo Acústico</span>
                        <span className="text-zinc-200 font-extrabold">{activeAuditVoicing.score.inversion >= 0 ? `+${activeAuditVoicing.score.inversion}` : activeAuditVoicing.score.inversion}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">✗ Redundância / Notas Duplicadas</span>
                        <span className="text-red-400 font-extrabold">{activeAuditVoicing.score.redundancy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">✗ Espaçamento de Cordas (Gaps)</span>
                        <span className="text-red-400 font-extrabold">{activeAuditVoicing.score.density}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">✓ Conforto Físico (Ergonomia)</span>
                        <span className="text-zinc-200 font-extrabold">+{activeAuditVoicing.score.ergonomics}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-[260px] rounded-xl border border-dashed border-zinc-850 flex flex-col items-center justify-center p-6 text-center text-zinc-500 text-xs italic gap-1 select-none">
                <Sparkles className="h-5 w-5 text-zinc-700 animate-pulse" />
                <span>Passe o mouse sobre os dedilhados à esquerda para auditar e detalhar a teoria de cada acorde!</span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
