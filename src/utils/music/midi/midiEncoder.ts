import type { MidiTrack, MidiRenderOptions } from "../models/MidiExport";

/**
 * Codifica um número inteiro positivo para Variable-Length Quantity (VLQ).
 * Utilizado pelo protocolo MIDI oficial para compactar delta-times.
 */
export function toVLQ(value: number): number[] {
  const bytes: number[] = [];
  // O byte menos significativo (que ficará no final após o reverse) tem MSB = 0
  bytes.push(value & 0x7F);
  value = value >> 7;
  while (value > 0) {
    // Os bytes mais significativos anteriores têm MSB = 1 (para indicar continuação)
    bytes.push((value & 0x7F) | 0x80);
    value = value >> 7;
  }
  return bytes.reverse();
}

interface RawMidiEvent {
  tick: number;
  type: "on" | "off";
  pitch: number;
  velocity: number;
}

/**
 * Auxiliar para construir o bloco binário de uma pista (Track Chunk - MTrk)
 */
function buildTrackChunk(eventBytes: number[]): number[] {
  const mtrkBytes: number[] = [
    0x4D, 0x54, 0x72, 0x6B // "MTrk" signature
  ];
  const trkLength = eventBytes.length;
  mtrkBytes.push((trkLength >> 24) & 0xFF);
  mtrkBytes.push((trkLength >> 16) & 0xFF);
  mtrkBytes.push((trkLength >> 8) & 0xFF);
  mtrkBytes.push(trkLength & 0xFF);
  mtrkBytes.push(...eventBytes);
  return mtrkBytes;
}

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}

/**
 * Codifica os eventos de uma única MidiTrack em bytes binários brutos (sem o cabeçalho MTrk).
 * É livre de conceitos de teoria musical do domínio.
 */
export function encodeSingleTrackEvents(
  track: MidiTrack,
  ticksPerBeat: number,
  velocityDefault: number,
  options: MidiRenderOptions
): number[] {
  const trackEventsBytes: number[] = [];
  const channel = track.channel ?? options.channel ?? 0;

  // A. Adicionar Meta Evento de Nome da Trilha (se disponível) no tick 0
  if (track.name) {
    trackEventsBytes.push(0x00); // delta-time 0
    const nameBytes = Array.from(new TextEncoder().encode(track.name));
    trackEventsBytes.push(0xFF, 0x03, nameBytes.length, ...nameBytes);
  }

  // B. Adicionar Program Change (se disponível) no tick 0
  const program = track.instrumentProgram !== undefined ? track.instrumentProgram : options.instrumentProgram;
  if (program !== undefined) {
    trackEventsBytes.push(0x00); // delta-time 0
    trackEventsBytes.push(0xC0 | (channel & 0x0F));
    trackEventsBytes.push(program & 0x7F);
  }

  // C. Desmembrar eventos de acordes em NoteOn/NoteOff com ticks absolutos e humanização (Sprint 3.65)
  const rawEvents: RawMidiEvent[] = [];
  const rng = options.humanize?.seed !== undefined
    ? new SeededRandom(options.humanize.seed)
    : { next: () => Math.random() };

  track.events.forEach(event => {
    const baseStartTick = Math.round(event.startBeat * ticksPerBeat);
    const baseEndTick = Math.round((event.startBeat + event.durationBeats) * ticksPerBeat);
    const baseVelocity = event.velocity ?? velocityDefault;

    event.notes.forEach(pitch => {
      let startTick = baseStartTick;
      let endTick = baseEndTick;
      let velocity = baseVelocity;

      // Aplicar humanização (Sprint 3.65)
      if (options.humanize) {
        if (options.humanize.timingVarianceTicks) {
          const tVar = options.humanize.timingVarianceTicks;
          // Desvio aleatório uniforme entre [-tVar, tVar]
          const tOffset = Math.round((rng.next() - 0.5) * 2 * tVar);
          startTick = Math.max(0, baseStartTick + tOffset);
          endTick = Math.max(startTick + 1, baseEndTick + tOffset);
        }
        if (options.humanize.velocityVariance) {
          const vVar = options.humanize.velocityVariance;
          // Desvio aleatório uniforme entre [-vVar, vVar]
          const vOffset = Math.round((rng.next() - 0.5) * 2 * vVar);
          velocity = Math.max(1, Math.min(127, baseVelocity + vOffset));
        }
      }

      rawEvents.push({
        tick: startTick,
        type: "on",
        pitch,
        velocity
      });
      rawEvents.push({
        tick: endTick,
        type: "off",
        pitch,
        velocity: 0
      });
    });
  });

  // D. Algoritmo Anti-Stuck: Ordenação Cronológica e de Prioridade Crítica
  // Eventos de desligar (NoteOff) devem ser processados rigorosamente ANTES de ligar (NoteOn)
  rawEvents.sort((a, b) => {
    if (a.tick !== b.tick) {
      return a.tick - b.tick;
    }
    if (a.type !== b.type) {
      return a.type === "off" ? -1 : 1;
    }
    return a.pitch - b.pitch;
  });

  // E. Sequenciar eventos NoteOn / NoteOff convertendo tempos absolutos em delta-times
  let lastTick = 0;

  rawEvents.forEach(evt => {
    const delta = evt.tick - lastTick;
    const vlqDelta = toVLQ(delta);

    // Delta-time bytes
    trackEventsBytes.push(...vlqDelta);

    if (evt.type === "on") {
      // Note On: 0x90 | canal, pitch, velocity
      trackEventsBytes.push(0x90 | (channel & 0x0F));
      trackEventsBytes.push(evt.pitch & 0x7F);
      trackEventsBytes.push(evt.velocity & 0x7F);
    } else {
      // Note Off: 0x80 | canal, pitch, 0
      trackEventsBytes.push(0x80 | (channel & 0x0F));
      trackEventsBytes.push(evt.pitch & 0x7F);
      trackEventsBytes.push(0x00);
    }

    lastTick = evt.tick;
  });

  // F. Adicionar Meta Evento de Fim de Trilha (End of Track)
  trackEventsBytes.push(0x00); // Delta-time 0
  trackEventsBytes.push(0xFF, 0x2F, 0x00);

  return trackEventsBytes;
}

/**
 * Codifica uma ou mais pistas MIDI em um arquivo binário SMF (Tipo 0 ou Tipo 1).
 */
export function encodeMidi(
  trackOrTracks: MidiTrack | MidiTrack[],
  options: MidiRenderOptions
): Uint8Array {
  const bpm = options.bpm ?? 120;
  const velocityDefault = options.velocity ?? 80;
  const ticksPerBeat = options.ticksPerBeat ?? 128;
  const format = options.format ?? 0;

  // Converter BPM em microssegundos por semínima para o Meta Event de tempo (Set Tempo)
  const tempoMicroseconds = Math.round(60000000 / bpm);
  const t1 = (tempoMicroseconds >> 16) & 0xFF;
  const t2 = (tempoMicroseconds >> 8) & 0xFF;
  const t3 = tempoMicroseconds & 0xFF;

  // Parâmetros do Time Signature (Fórmula de Compasso)
  const num = options.timeSignature?.numerator ?? 4;
  const den = options.timeSignature?.denominator ?? 4;
  const denPower = Math.round(Math.log2(den));

  if (format === 1) {
    // ==========================================
    // 🎼 FORMATO MULTI-TRILHA (SMF TIPO 1)
    // ==========================================
    const tracksList = Array.isArray(trackOrTracks) ? trackOrTracks : [trackOrTracks];
    const trackChunks: number[][] = [];

    // 1. Criar Track 0 "Conductor" Pura (apenas tempo, fórmula de compasso e metadados)
    const conductorBytes: number[] = [];

    // Delta-time 0: Track Name "Conductor"
    conductorBytes.push(0x00);
    const conductorName = Array.from(new TextEncoder().encode("Conductor"));
    conductorBytes.push(0xFF, 0x03, conductorName.length, ...conductorName);

    // Delta-time 0: Time Signature Meta Event
    conductorBytes.push(0x00);
    conductorBytes.push(0xFF, 0x58, 0x04, num, denPower, 0x18, 0x08);

    // Delta-time 0: Set Tempo Meta Event
    conductorBytes.push(0x00);
    conductorBytes.push(0xFF, 0x51, 0x03, t1, t2, t3);

    // Delta-time 0: End of Track
    conductorBytes.push(0x00);
    conductorBytes.push(0xFF, 0x2F, 0x00);

    trackChunks.push(buildTrackChunk(conductorBytes));

    // 2. Codificar cada pista de notas recebida (Bass, Guide Tones, Upper Structure, etc.)
    tracksList.forEach(track => {
      // Ignorar a trilha Conductor de entrada se ela for passada separadamente
      if (track.name === "Conductor") return;

      const trackEvents = encodeSingleTrackEvents(track, ticksPerBeat, velocityDefault, options);
      trackChunks.push(buildTrackChunk(trackEvents));
    });

    const totalTracksCount = trackChunks.length;

    // 3. Montar Bloco de Cabeçalho (MThd) para Formato Tipo 1
    const mthdBytes: number[] = [
      0x4D, 0x54, 0x68, 0x64, // "MThd" signature
      0x00, 0x00, 0x00, 0x06, // Header length (6)
      0x00, 0x01,             // Format 1 (multi-track)
      (totalTracksCount >> 8) & 0xFF,
      totalTracksCount & 0xFF, // Total tracks
      (ticksPerBeat >> 8) & 0xFF,
      ticksPerBeat & 0xFF     // Ticks per beat division
    ];

    // Concatenar todos os blocos binários das pistas
    let totalSize = mthdBytes.length;
    trackChunks.forEach(chunk => {
      totalSize += chunk.length;
    });

    const finalMidiBytes = new Uint8Array(totalSize);
    let offset = 0;
    finalMidiBytes.set(mthdBytes, offset);
    offset += mthdBytes.length;
    trackChunks.forEach(chunk => {
      finalMidiBytes.set(chunk, offset);
      offset += chunk.length;
    });

    return finalMidiBytes;

  } else {
    // ==========================================
    // 🎼 FORMATO COMPACTO (SMF TIPO 0)
    // ==========================================
    // Garante extração de uma pista unificada
    const singleTrack = Array.isArray(trackOrTracks)
      ? (trackOrTracks.find(t => t.name !== "Conductor") || trackOrTracks[0])
      : trackOrTracks;

    const trackEventsBytes: number[] = [];

    // Delta-time 0: Time Signature Meta Event
    trackEventsBytes.push(0x00);
    trackEventsBytes.push(0xFF, 0x58, 0x04, num, denPower, 0x18, 0x08);

    // Delta-time 0: Set Tempo Meta Event
    trackEventsBytes.push(0x00);
    trackEventsBytes.push(0xFF, 0x51, 0x03, t1, t2, t3);

    // Codifica todos os eventos de notas, nome do track, program change e humanização
    const noteBytes = encodeSingleTrackEvents(singleTrack, ticksPerBeat, velocityDefault, options);
    trackEventsBytes.push(...noteBytes);

    const mtrkBytes = buildTrackChunk(trackEventsBytes);

    // Bloco de Cabeçalho (MThd) para Formato Tipo 0 (Pista única)
    const mthdBytes: number[] = [
      0x4D, 0x54, 0x68, 0x64, // "MThd" signature
      0x00, 0x00, 0x00, 0x06, // Header length (6)
      0x00, 0x00,             // Format 0
      0x00, 0x01,             // 1 track
      (ticksPerBeat >> 8) & 0xFF,
      ticksPerBeat & 0xFF     // Ticks per beat division
    ];

    const finalMidiBytes = new Uint8Array(mthdBytes.length + mtrkBytes.length);
    finalMidiBytes.set(mthdBytes, 0);
    finalMidiBytes.set(mtrkBytes, mthdBytes.length);

    return finalMidiBytes;
  }
}
