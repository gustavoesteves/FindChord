import type { ResolvedProgression } from "../models/ResolvedProgression";
import type { MidiTrack, MidiChordEvent } from "../models/MidiExport";
import { getAbsolutePitch } from "../core/midi";

export function buildMidiTrack(
  progression: ResolvedProgression,
  tuning: string[],
  chordDurationBeats: number = 4
): MidiTrack {
  const events: MidiChordEvent[] = [];

  progression.bestPath.forEach((voicing, idx) => {
    if (!voicing) {
      // Pula nulos representando pausas na timeline
      return;
    }

    const notes: number[] = [];
    voicing.shape.frets.forEach((fret, stringIdx) => {
      if (fret !== null) {
        const baseNote = tuning[stringIdx];
        const pitch = getAbsolutePitch(fret, baseNote);
        if (pitch !== null) {
          notes.push(pitch);
        }
      }
    });

    events.push({
      startBeat: idx * chordDurationBeats,
      durationBeats: chordDurationBeats,
      notes: notes.sort((a, b) => a - b), // Notas ordenadas de baixo a soprano
      velocity: 80, // Volume padrão inicial
      sourceChord: progression.progression[idx]
    });
  });

  return { events };
}

export function buildMultiTrackMidi(
  progression: ResolvedProgression,
  tuning: string[],
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

  progression.bestPath.forEach((voicing, idx) => {
    if (!voicing) {
      return;
    }

    const startBeat = idx * chordDurationBeats;
    const durationBeats = chordDurationBeats;
    const sourceChord = progression.progression[idx];

    const voices = voicing.roles?.voices || [];
    if (voices.length === 0) {
      // Fallback usando voicing.shape.frets caso roles.voices esteja indisponível
      const notes: number[] = [];
      voicing.shape.frets.forEach((fret, stringIdx) => {
        if (fret !== null) {
          const baseNote = tuning[stringIdx];
          const pitch = getAbsolutePitch(fret, baseNote);
          if (pitch !== null) {
            notes.push(pitch);
          }
        }
      });
      if (notes.length > 0) {
        notes.sort((a, b) => a - b);
        const bassPitch = notes[0];
        const restPitches = notes.slice(1);
        bassEvents.push({
          startBeat,
          durationBeats,
          notes: [bassPitch],
          velocity: 80,
          sourceChord
        });
        if (restPitches.length > 0) {
          upperStructureEvents.push({
            startBeat,
            durationBeats,
            notes: restPitches,
            velocity: 80,
            sourceChord
          });
        }
      }
      return;
    }

    // Ordenar vozes por pitch crescente
    const sortedVoices = [...voices].sort((a, b) => a.pitch - b.pitch);
    const bassVoice = sortedVoices[0];
    
    const bassPitches: number[] = [bassVoice.pitch];
    const guideTonePitches: number[] = [];
    const upperStructurePitches: number[] = [];

    for (let i = 1; i < sortedVoices.length; i++) {
      const v = sortedVoices[i];
      if (v.role === "third" || v.role === "seventh") {
        guideTonePitches.push(v.pitch);
      } else {
        upperStructurePitches.push(v.pitch);
      }
    }

    bassEvents.push({
      startBeat,
      durationBeats,
      notes: bassPitches,
      velocity: 80,
      sourceChord
    });

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
    conductor: {
      name: "Conductor",
      events: []
    },
    bass: {
      name: "Bass",
      events: bassEvents,
      instrumentProgram: options?.instrumentProgram,
      channel: baseChannel
    },
    guideTones: {
      name: "Guide Tones",
      events: guideTonesEvents,
      instrumentProgram: options?.instrumentProgram,
      channel: (baseChannel + 1) % 16
    },
    upperStructure: {
      name: "Upper Structure",
      events: upperStructureEvents,
      instrumentProgram: options?.instrumentProgram,
      channel: (baseChannel + 2) % 16
    }
  };
}

