import {
  xForFret,
  xForFretLine,
  type FretboardGeometry,
  type FretboardStringGeometry
} from "../../../../utils/music/presentation/fretboardGeometry";

export interface FretboardRenderedString extends FretboardStringGeometry {
  isVibrating?: boolean;
}

export interface FretboardRenderedNote {
  stringIndex: number;
  fret: number;
  noteName?: string;
  displayLabel: string;
  color: string;
  tooltip?: string;
  strokeClassName?: string;
  glowRadius?: number;
}

export interface FretboardRendererTheme {
  idPrefix: string;
  bodyInset: number;
  bodyRadius: number;
  inlayRadius: number;
  doubleInlayRadius: number;
  doubleInlayOffset: number;
  fretStrokeWidth: number;
  noteRadius: number;
  noteFontSize: number;
  noteTextDy: number;
  clickHeight: number;
  noteClickRadius: number;
}

export interface FretboardRendererProps {
  geometry: FretboardGeometry;
  strings: FretboardRenderedString[];
  notes: FretboardRenderedNote[];
  minWidthClassName?: string;
  woodClassName?: string;
  theme?: Partial<FretboardRendererTheme>;
  onFretClick?: (stringIndex: number, fret: number) => void;
  onNoteClick?: (note: FretboardRenderedNote) => void;
}

const DEFAULT_THEME: FretboardRendererTheme = {
  idPrefix: "writer-fretboard",
  bodyInset: 10,
  bodyRadius: 4,
  inlayRadius: 6,
  doubleInlayRadius: 5.5,
  doubleInlayOffset: 40,
  fretStrokeWidth: 1.5,
  noteRadius: 13.5,
  noteFontSize: 10,
  noteTextDy: 4,
  clickHeight: 36,
  noteClickRadius: 18
};

export function FretboardRenderer({
  geometry,
  strings,
  notes,
  minWidthClassName = "min-w-[1360px]",
  woodClassName = "fretboard-wood",
  theme,
  onFretClick,
  onNoteClick
}: FretboardRendererProps) {
  const resolvedTheme = { ...DEFAULT_THEME, ...theme };
  const notesByString = new Map<number, FretboardRenderedNote[]>();
  notes.forEach(note => {
    const stringNotes = notesByString.get(note.stringIndex) || [];
    stringNotes.push(note);
    notesByString.set(note.stringIndex, stringNotes);
  });

  return (
    <div className={`${minWidthClassName} relative ${woodClassName}`}>
      <svg
        width={geometry.width}
        height={geometry.height}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`${resolvedTheme.idPrefix}-wood-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#252528" />
            <stop offset="50%" stopColor="#1a1a1c" />
            <stop offset="100%" stopColor="#131315" />
          </linearGradient>
          <linearGradient id={`${resolvedTheme.idPrefix}-nut-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#444" />
            <stop offset="50%" stopColor="#777" />
            <stop offset="100%" stopColor="#222" />
          </linearGradient>
          <radialGradient id={`${resolvedTheme.idPrefix}-inlay-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#E5E5DB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#B5B5A5" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        <rect
          x={geometry.nutWidth}
          y={resolvedTheme.bodyInset}
          width={geometry.width - geometry.nutWidth}
          height={geometry.height - resolvedTheme.bodyInset * 2}
          fill={`url(#${resolvedTheme.idPrefix}-wood-grad)`}
          rx={resolvedTheme.bodyRadius}
        />

        {geometry.singleMarkers.map(fret => {
          const x = xForFret(geometry, fret);
          return (
            <circle
              key={`inlay-${fret}`}
              cx={x}
              cy={geometry.height / 2}
              r={resolvedTheme.inlayRadius}
              fill={`url(#${resolvedTheme.idPrefix}-inlay-glow)`}
            />
          );
        })}

        {geometry.doubleMarkers.map(fret => {
          const x = xForFret(geometry, fret);
          return (
            <g key={`inlay-double-${fret}`}>
              <circle
                cx={x}
                cy={geometry.height / 2 - resolvedTheme.doubleInlayOffset}
                r={resolvedTheme.doubleInlayRadius}
                fill={`url(#${resolvedTheme.idPrefix}-inlay-glow)`}
              />
              <circle
                cx={x}
                cy={geometry.height / 2 + resolvedTheme.doubleInlayOffset}
                r={resolvedTheme.doubleInlayRadius}
                fill={`url(#${resolvedTheme.idPrefix}-inlay-glow)`}
              />
            </g>
          );
        })}

        <rect
          x={geometry.nutWidth - 6}
          y={resolvedTheme.bodyInset - 2}
          width="6"
          height={geometry.height - (resolvedTheme.bodyInset - 2) * 2}
          fill={`url(#${resolvedTheme.idPrefix}-nut-grad)`}
          rx="1"
        />

        {Array.from({ length: geometry.fretCount }).map((_, idx) => {
          const x = xForFretLine(geometry, idx + 1);
          return (
            <line
              key={`fret-${idx + 1}`}
              x1={x}
              y1={resolvedTheme.bodyInset}
              x2={x}
              y2={geometry.height - resolvedTheme.bodyInset}
              stroke="hsl(0, 0%, 27%)"
              strokeWidth={resolvedTheme.fretStrokeWidth}
            />
          );
        })}

        {strings.map((stringGeometry, idx) => (
          <line
            key={`string-${idx}`}
            x1="0"
            y1={stringGeometry.y}
            x2={geometry.width}
            y2={stringGeometry.y}
            stroke={stringGeometry.isVibrating ? "#FFFFFF" : "hsl(0, 0%, 37%)"}
            strokeWidth={stringGeometry.gauge}
            opacity={stringGeometry.isVibrating ? 1.0 : stringGeometry.idleOpacity ?? 0.6}
            className={stringGeometry.isVibrating ? "animate-vibrate" : ""}
          />
        ))}

        {onFretClick && strings.map((stringGeometry, stringIndex) => (
          <g key={`click-row-${stringIndex}`}>
            <rect
              x="0"
              y={stringGeometry.y - resolvedTheme.clickHeight / 2}
              width={geometry.nutWidth}
              height={resolvedTheme.clickHeight}
              fill="transparent"
              className="cursor-pointer hover:fill-zinc-800/10"
              onClick={() => onFretClick(stringIndex, 0)}
            />

            {Array.from({ length: geometry.fretCount }).map((_, fretIdx) => {
              const fret = fretIdx + 1;
              const xStart = xForFretLine(geometry, fretIdx);

              return (
                <rect
                  key={`click-${stringIndex}-${fret}`}
                  x={xStart}
                  y={stringGeometry.y - resolvedTheme.clickHeight / 2}
                  width={geometry.fretWidth}
                  height={resolvedTheme.clickHeight}
                  fill="transparent"
                  className="cursor-pointer hover:fill-zinc-400/5 transition-colors"
                  onClick={() => onFretClick(stringIndex, fret)}
                />
              );
            })}
          </g>
        ))}

        {strings.map((stringGeometry, stringIdx) => {
          const stringNotes = notesByString.get(stringIdx) || [];
          return (
            <g key={`marks-row-${stringIdx}`}>
              {stringNotes.map(note => {
                const x = xForFret(geometry, note.fret);

                return (
                  <g
                    key={`note-${note.stringIndex}-${note.fret}-${note.displayLabel}`}
                    className={onNoteClick ? "cursor-pointer transition-transform duration-150 hover:scale-115 active:scale-95" : "pointer-events-none"}
                    style={{ transformOrigin: `${x}px ${stringGeometry.y}px` }}
                    onClick={() => onNoteClick?.(note)}
                  >
                    {onNoteClick && (
                      <circle
                        cx={x}
                        cy={stringGeometry.y}
                        r={resolvedTheme.noteClickRadius}
                        fill="transparent"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={stringGeometry.y}
                      r={resolvedTheme.noteRadius}
                      className={`stroke-2 animate-scale-up ${note.strokeClassName || "stroke-zinc-900"}`}
                      style={{
                        fill: note.color,
                        filter: `drop-shadow(0 0 ${note.glowRadius ?? 8}px ${note.color})`
                      }}
                    />
                    <text
                      x={x}
                      y={stringGeometry.y + resolvedTheme.noteTextDy}
                      textAnchor="middle"
                      fontSize={resolvedTheme.noteFontSize}
                      fontWeight="900"
                      fill="#FFFFFF"
                    >
                      {note.displayLabel}
                    </text>
                    {note.tooltip && <title>{note.tooltip}</title>}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
