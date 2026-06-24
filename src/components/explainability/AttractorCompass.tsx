import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import type { AttractorField } from "../../utils/music/analysis/models/FunctionalAnalysis";

interface AttractorCompassProps {
  field: AttractorField | null;
}

export function AttractorCompass({ field }: AttractorCompassProps) {
  if (!field) {
    return (
      <div className="w-full flex items-center justify-center h-48 border border-zinc-800/60 rounded-xl bg-zinc-900/40 text-xs text-zinc-600 font-bold uppercase tracking-wider">
        Sem Gravidade Detectada
      </div>
    );
  }

  // Mapeamos os attractors para eixos visuais:
  // Cima: Desvio Modal (MODAL_SHIFT / SUB_V / PLAGAL_RESOLUTION)
  // Direita: Resolução Tonal (TONAL_RESOLUTION / AUTHENTIC_RESOLUTION)
  // Esquerda: Prolongamento (PROLONGATION / SUSPENSION)
  // Baixo: Estabilidade (STATIC) - podemos inferir estabilidade como o inverso do delta geral, ou mapear diretamente.

  const attractors = field.attractors || [];

  let modalScore = 0;
  let tonalScore = 0;
  let prolongationScore = 0;
  
  attractors.forEach(a => {
    if (["MODAL_SHIFT", "SUB_V", "PLAGAL_RESOLUTION"].includes(a.type)) {
      modalScore += a.alignment;
    }
    if (["TONAL_RESOLUTION", "AUTHENTIC_RESOLUTION"].includes(a.type)) {
      tonalScore += a.alignment;
    }
    if (["PROLONGATION", "SUSPENSION"].includes(a.type)) {
      prolongationScore += a.alignment;
    }
  });

  // Estabilidade pode ser inversamente proporcional aos outros 3
  const totalTension = Math.min(1, modalScore + tonalScore + prolongationScore);
  const stabilityScore = Math.max(0, 1 - totalTension);

  const getIntensityLabel = (val: number) => {
    if (val >= 0.8) return "Muito Alta";
    if (val >= 0.5) return "Alta";
    if (val >= 0.2) return "Moderada";
    if (val > 0) return "Fraca";
    return "Nenhuma";
  };

  const renderBar = (val: number, activeColor: string, dimColor: string) => {
    const bars = Math.round(val * 5);
    return (
      <div className="flex gap-0.5 mt-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-1.5 w-4 rounded-[1px] ${i <= bars ? activeColor : dimColor}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-64 flex items-center justify-center">
      {/* Background cross */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="w-px h-full bg-zinc-500"></div>
        <div className="w-full h-px absolute bg-zinc-500"></div>
      </div>

      {/* Center dot */}
      <div className="w-2 h-2 rounded-full bg-zinc-700 absolute z-10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"></div>

      {/* Up: Modal Diversion */}
      <div className="absolute top-0 flex flex-col items-center gap-1.5 transform -translate-y-2">
        <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Desvio Modal</span>
        <div className="text-sm font-black text-rose-300 tracking-wide uppercase">{getIntensityLabel(modalScore)}</div>
        {renderBar(modalScore, "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]", "bg-rose-950/40")}
        <ArrowUp className="h-4 w-4 text-rose-500/50 mt-1" />
      </div>

      {/* Right: Tonal Resolution */}
      <div className="absolute right-0 flex flex-col items-center gap-1.5 transform translate-x-4">
        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Resolução Tonal</span>
        <div className="text-sm font-black text-emerald-300 tracking-wide uppercase">{getIntensityLabel(tonalScore)}</div>
        {renderBar(tonalScore, "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]", "bg-emerald-950/40")}
        <ArrowRight className="h-4 w-4 text-emerald-500/50 mt-1" />
      </div>

      {/* Left: Prolongation */}
      <div className="absolute left-0 flex flex-col items-center gap-1.5 transform -translate-x-4">
        <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">Prolongamento</span>
        <div className="text-sm font-black text-sky-300 tracking-wide uppercase">{getIntensityLabel(prolongationScore)}</div>
        {renderBar(prolongationScore, "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]", "bg-sky-950/40")}
        <ArrowLeft className="h-4 w-4 text-sky-500/50 mt-1" />
      </div>

      {/* Down: Stability */}
      <div className="absolute bottom-0 flex flex-col items-center gap-1.5 transform translate-y-2">
        <ArrowDown className="h-4 w-4 text-amber-500/50 mb-1" />
        {renderBar(stabilityScore, "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]", "bg-amber-950/40")}
        <div className="text-sm font-black text-amber-300 tracking-wide uppercase">{getIntensityLabel(stabilityScore)}</div>
        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Estabilidade</span>
      </div>
    </div>
  );
}
