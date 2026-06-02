import type { ResolvedProgression } from "../models/ResolvedProgression";
import type { MidiRenderOptions, MidiExportResult, MidiTrack, MidiChordEvent } from "../models/MidiExport";
import type { VoicedProgression } from "../realization/models/VoicedProgression";
import { buildMidiTrack, buildMultiTrackMidi } from "./midiTrackBuilder";
import { encodeMidi } from "./midiEncoder";
import { harmonyRuntime } from "../runtime/HarmonyRuntime";
import type { PerformanceTimeline } from "../runtime/models/PerformanceTimeline";

/**
 * Constrói uma MidiTrack a partir de uma PerformanceTimeline de tempo absoluto
 */
export function buildMidiTrackFromTimeline(
  timeline: PerformanceTimeline
): MidiTrack {
  const events: MidiChordEvent[] = timeline.events.map(ev => ({
    startBeat: ev.startBeat,
    durationBeats: ev.durationBeats,
    notes: [...ev.midiNotes].sort((a, b) => a - b),
    velocity: ev.velocity,
    sourceChord: ev.sourceChord
  }));
  return { events };
}

/**
 * Constrói uma partição multicanal de MidiTrack a partir de uma PerformanceTimeline
 * mapeando os metadados de vozes dinamicamente de acordo com as janelas dos acordes originais.
 */
export function buildMultiTrackMidiFromTimeline(
  voiced: VoicedProgression,
  timeline: PerformanceTimeline,
  chordDurationBeats: number,
  options?: { instrumentProgram?: number; channel?: number }
): {
  conductor: MidiTrack;
  bass: MidiTrack;
  guideTones: MidiTrack;
  upperStructure: MidiTrack;
} {
  const bassEvents: MidiChordEvent[] = [];
  const guideTonesEvents: MidiChordEvent[] = [];
  const upperStructureEvents: MidiChordEvent[] = [];

  timeline.events.forEach(event => {
    // Localiza qual acorde correspondente da progressão original este evento em tempo absoluto pertence
    const chordIdx = Math.floor(event.startBeat / chordDurationBeats);
    const vc = voiced.voicings[Math.max(0, Math.min(voiced.voicings.length - 1, chordIdx))];
    if (!vc) return;

    const getRoleForMidi = (midi: number) => {
      const match = vc.voiceMap.find(v => v.midi === midi);
      return match ? match.role : "tension";
    };

    const voices = vc.voiceMap;
    if (voices.length === 0) {
      // Fallback simples se não houver mapa de vozes
      const sorted = [...event.midiNotes].sort((a, b) => a - b);
      if (sorted.length > 0) {
        bassEvents.push({
          startBeat: event.startBeat,
          durationBeats: event.durationBeats,
          notes: [sorted[0]],
          velocity: event.velocity,
          sourceChord: event.sourceChord
        });
        if (sorted.length > 1) {
          upperStructureEvents.push({
            startBeat: event.startBeat,
            durationBeats: event.durationBeats,
            notes: sorted.slice(1),
            velocity: event.velocity,
            sourceChord: event.sourceChord
          });
        }
      }
      return;
    }

    const sortedVoices = [...voices].sort((a, b) => a.midi - b.midi);
    const bassVoice = sortedVoices.find(v => v.role === "bass") || sortedVoices[0];
    const bassMidi = bassVoice ? bassVoice.midi : -1;
    const guideToneMidis = sortedVoices
      .filter(v => v !== bassVoice && (v.role === "third" || v.role === "seventh"))
      .map(v => v.midi);

    const bassPitches: number[] = [];
    const guideTonePitches: number[] = [];
    const upperStructurePitches: number[] = [];

    event.midiNotes.forEach(pitch => {
      const role = getRoleForMidi(pitch);
      if (pitch === bassMidi || role === "bass") {
        bassPitches.push(pitch);
      } else if (role === "third" || role === "seventh" || guideToneMidis.includes(pitch)) {
        guideTonePitches.push(pitch);
      } else {
        upperStructurePitches.push(pitch);
      }
    });

    if (bassPitches.length > 0) {
      bassEvents.push({
        startBeat: event.startBeat,
        durationBeats: event.durationBeats,
        notes: bassPitches.sort((a, b) => a - b),
        velocity: event.velocity,
        sourceChord: event.sourceChord
      });
    }

    if (guideTonePitches.length > 0) {
      guideTonesEvents.push({
        startBeat: event.startBeat,
        durationBeats: event.durationBeats,
        notes: guideTonePitches.sort((a, b) => a - b),
        velocity: event.velocity,
        sourceChord: event.sourceChord
      });
    }

    if (upperStructurePitches.length > 0) {
      upperStructureEvents.push({
        startBeat: event.startBeat,
        durationBeats: event.durationBeats,
        notes: upperStructurePitches.sort((a, b) => a - b),
        velocity: event.velocity,
        sourceChord: event.sourceChord
      });
    }
  });

  const baseChannel = options?.channel ?? 0;

  return {
    conductor: { name: "Conductor", events: [] },
    bass: { name: "Bass", events: bassEvents, instrumentProgram: options?.instrumentProgram, channel: baseChannel },
    guideTones: { name: "Guide Tones", events: guideTonesEvents, instrumentProgram: options?.instrumentProgram, channel: (baseChannel + 1) % 16 },
    upperStructure: { name: "Upper Structure", events: upperStructureEvents, instrumentProgram: options?.instrumentProgram, channel: (baseChannel + 2) % 16 }
  };
}

/**
 * Constrói uma MidiTrack unificada a partir de uma VoicedProgression (legada/fallback)
 */
export function buildMidiTrackFromVoiced(
  voiced: VoicedProgression,
  chordDurationBeats: number = 4
): MidiTrack {
  const events: MidiChordEvent[] = voiced.voicings.map((vc, idx) => {
    return {
      startBeat: idx * chordDurationBeats,
      durationBeats: chordDurationBeats,
      notes: vc.midiNotes,
      velocity: 80,
      sourceChord: vc.chord
    };
  });
  return { events };
}

/**
 * Constrói uma partição multicanal de MidiTrack a partir de uma VoicedProgression (legada/fallback)
 */
export function buildMultiTrackMidiFromVoiced(
  voiced: VoicedProgression,
  chordDurationBeats: number = 4,
  options?: { instrumentProgram?: number; channel?: number }
): {
  conductor: MidiTrack;
  bass: MidiTrack;
  guideTones: MidiTrack;
  upperStructure: MidiTrack;
} {
  const bassEvents: MidiChordEvent[] = [];
  const guideTonesEvents: MidiChordEvent[] = [];
  const upperStructureEvents: MidiChordEvent[] = [];

  voiced.voicings.forEach((vc, idx) => {
    const startBeat = idx * chordDurationBeats;
    const durationBeats = chordDurationBeats;
    const sourceChord = vc.chord;

    const voices = vc.voiceMap;
    if (voices.length === 0) return;

    // Achar o baixo (role === "bass" ou menor pitch como fallback)
    const sortedVoices = [...voices].sort((a, b) => a.midi - b.midi);
    const bassVoice = sortedVoices.find(v => v.role === "bass") || sortedVoices[0];
    
    const bassPitches = [bassVoice.midi];
    const guideTonePitches: number[] = [];
    const upperStructurePitches: number[] = [];

    sortedVoices.forEach(v => {
      if (v === bassVoice) return;
      if (v.role === "third" || v.role === "seventh") {
        guideTonePitches.push(v.midi);
      } else {
        upperStructurePitches.push(v.midi);
      }
    });

    bassEvents.push({ startBeat, durationBeats, notes: bassPitches, velocity: 80, sourceChord });
    
    if (guideTonePitches.length > 0) {
      guideTonesEvents.push({
        startBeat,
        durationBeats,
        notes: guideTonePitches.sort((a, b) => a - b),
        velocity: 80,
        sourceChord
      });
    }

    if (upperStructurePitches.length > 0) {
      upperStructureEvents.push({
        startBeat,
        durationBeats,
        notes: upperStructurePitches.sort((a, b) => a - b),
        velocity: 80,
        sourceChord
      });
    }
  });

  const baseChannel = options?.channel ?? 0;

  return {
    conductor: { name: "Conductor", events: [] },
    bass: { name: "Bass", events: bassEvents, instrumentProgram: options?.instrumentProgram, channel: baseChannel },
    guideTones: { name: "Guide Tones", events: guideTonesEvents, instrumentProgram: options?.instrumentProgram, channel: (baseChannel + 1) % 16 },
    upperStructure: { name: "Upper Structure", events: upperStructureEvents, instrumentProgram: options?.instrumentProgram, channel: (baseChannel + 2) % 16 }
  };
}

/**
 * Exporta uma progressão física de guitarra (ResolvedProgression) em formato MIDI SMF.
 */
export function exportMidi(
  progression: ResolvedProgression,
  tuning: string[],
  options: MidiRenderOptions
): MidiExportResult {
  const durationBeats = options.chordDurationBeats ?? 4;

  if (options.format === 1) {
    const multi = buildMultiTrackMidi(progression, tuning, durationBeats, {
      instrumentProgram: options.instrumentProgram,
      channel: options.channel
    });
    
    const tracksList = [multi.conductor, multi.bass, multi.guideTones, multi.upperStructure];
    const bytes = encodeMidi(tracksList, options);

    const unifiedTrack = buildMidiTrack(progression, tuning, durationBeats);

    return {
      bytes,
      track: unifiedTrack,
      tracks: tracksList
    };
  } else {
    const track = buildMidiTrack(progression, tuning, durationBeats);
    const bytes = encodeMidi(track, options);
    
    return {
      bytes,
      track
    };
  }
}

/**
 * Exporta uma progressão materializada/estilizada (VoicedProgression) em formato MIDI SMF,
 * integrando a camada de execução de tempo (PerformanceTimeline) e padrões rítmicos.
 */
export function exportMidiFromVoiced(
  voiced: VoicedProgression,
  options: MidiRenderOptions
): MidiExportResult {
  const durationBeats = options.chordDurationBeats ?? 4;
  const pattern = options.pattern ?? "block";

  // 1. Gera a timeline performada a partir da progressão estilizada e do padrão
  const timeline = harmonyRuntime.perform(voiced, pattern, {
    chordDurationBeats: durationBeats,
    velocity: options.velocity ?? 80
  });

  // 2. Encoda os bytes no formato solicitado
  if (options.format === 1) {
    const multi = buildMultiTrackMidiFromTimeline(voiced, timeline, durationBeats, {
      instrumentProgram: options.instrumentProgram,
      channel: options.channel
    });

    const tracksList = [multi.conductor, multi.bass, multi.guideTones, multi.upperStructure];
    const bytes = encodeMidi(tracksList, options);

    const unifiedTrack = buildMidiTrackFromTimeline(timeline);

    return {
      bytes,
      track: unifiedTrack,
      tracks: tracksList
    };
  } else {
    const track = buildMidiTrackFromTimeline(timeline);
    const bytes = encodeMidi(track, options);

    return {
      bytes,
      track
    };
  }
}
