import type { VoicedChord } from "../../realization/models/VoicedChord";
import type { RuntimePattern } from "../models/RuntimePattern";
import type { PerformanceEvent, VoiceRole, VoiceId } from "../models/PerformanceEvent";

/**
 * Materializa as notas de um acorde individual no tempo absoluto de acordo com o padrão selecionado.
 */
export function materializePattern(
  voicedChord: VoicedChord,
  pattern: RuntimePattern,
  chordStartBeat: number,
  chordDurationBeats: number,
  velocity: number
): PerformanceEvent[] {
  if (voicedChord.midiNotes.length === 0) {
    return [];
  }

  // Auxiliar para obter a função de voz de cada nota a partir do voiceMap
  const getRoleForMidi = (midi: number): VoiceRole => {
    const match = voicedChord.voiceMap.find(v => v.midi === midi);
    return match ? match.role : "tension";
  };

  // Auxiliar para obter a VoiceId correspondente ao pitch (essencial para notação score/SATB)
  const getVoiceIdForMidi = (midi: number): VoiceId => {
    const match = voicedChord.voiceMap.find(v => v.midi === midi);
    if (!match) return "none";
    const label = match.label.toLowerCase();
    if (label.includes("bass")) return "bass";
    if (label.includes("tenor")) return "tenor";
    if (label.includes("alto")) return "alto";
    if (label.includes("soprano")) return "soprano";
    if (match.role === "bass") return "bass";
    if (match.role === "tension") return "tension";
    return "none";
  };

  const allRoles = voicedChord.midiNotes.map(getRoleForMidi);
  const allVoiceIds = voicedChord.midiNotes.map(getVoiceIdForMidi);

  switch (pattern) {
    case "block": {
      return [{
        startBeat: chordStartBeat,
        durationBeats: chordDurationBeats,
        midiNotes: [...voicedChord.midiNotes],
        velocity,
        sourceChord: voicedChord.chord,
        voiceRoles: allRoles,
        voiceIds: allVoiceIds
      }];
    }

    case "half-note": {
      const duration = chordDurationBeats / 2;
      return [
        {
          startBeat: chordStartBeat,
          durationBeats: duration,
          midiNotes: [...voicedChord.midiNotes],
          velocity,
          sourceChord: voicedChord.chord,
          voiceRoles: allRoles,
          voiceIds: allVoiceIds
        },
        {
          startBeat: chordStartBeat + duration,
          durationBeats: duration,
          midiNotes: [...voicedChord.midiNotes],
          velocity,
          sourceChord: voicedChord.chord,
          voiceRoles: allRoles,
          voiceIds: allVoiceIds
        }
      ];
    }

    case "quarter-note": {
      const step = chordDurationBeats / 4;
      const events: PerformanceEvent[] = [];
      for (let i = 0; i < 4; i++) {
        events.push({
          startBeat: chordStartBeat + i * step,
          durationBeats: step,
          midiNotes: [...voicedChord.midiNotes],
          velocity,
          sourceChord: voicedChord.chord,
          voiceRoles: allRoles,
          voiceIds: allVoiceIds
        });
      }
      return events;
    }

    case "arpeggio-up": {
      // Ordena ascendentemente (do mais grave ao mais agudo)
      const sortedMidi = [...voicedChord.midiNotes].sort((a, b) => a - b);
      const step = 0.5; // colcheia por padrão
      const events: PerformanceEvent[] = [];

      sortedMidi.forEach((midi, i) => {
        const offset = i * step;
        if (offset >= chordDurationBeats) return;
        const dur = chordDurationBeats - offset; // sustenta até o fim do acorde
        events.push({
          startBeat: chordStartBeat + offset,
          durationBeats: dur,
          midiNotes: [midi],
          velocity,
          sourceChord: voicedChord.chord,
          voiceRoles: [getRoleForMidi(midi)],
          voiceIds: [getVoiceIdForMidi(midi)]
        });
      });
      return events;
    }

    case "arpeggio-down": {
      // Ordena descendentemente (do mais agudo ao mais grave)
      const sortedMidi = [...voicedChord.midiNotes].sort((a, b) => b - a);
      const step = 0.5;
      const events: PerformanceEvent[] = [];

      sortedMidi.forEach((midi, i) => {
        const offset = i * step;
        if (offset >= chordDurationBeats) return;
        const dur = chordDurationBeats - offset;
        events.push({
          startBeat: chordStartBeat + offset,
          durationBeats: dur,
          midiNotes: [midi],
          velocity,
          sourceChord: voicedChord.chord,
          voiceRoles: [getRoleForMidi(midi)],
          voiceIds: [getVoiceIdForMidi(midi)]
        });
      });
      return events;
    }

    case "broken-chord": {
      // Localiza o baixo estrutural
      const sortedVoices = [...voicedChord.voiceMap].sort((a, b) => a.midi - b.midi);
      const bassVoice = sortedVoices.find(v => v.role === "bass") || sortedVoices[0];
      const bassMidi = bassVoice ? bassVoice.midi : Math.min(...voicedChord.midiNotes);
      const bassRole = getRoleForMidi(bassMidi);
      const bassVoiceId = getVoiceIdForMidi(bassMidi);

      // Notas e roles superiores
      const upperNotes = voicedChord.midiNotes.filter(m => m !== bassMidi);
      const upperRoles = upperNotes.map(getRoleForMidi);
      const upperVoiceIds = upperNotes.map(getVoiceIdForMidi);

      const events: PerformanceEvent[] = [];

      // A. O baixo ataca na cabeça e sustenta pelo compasso inteiro
      events.push({
        startBeat: chordStartBeat,
        durationBeats: chordDurationBeats,
        midiNotes: [bassMidi],
        velocity,
        sourceChord: voicedChord.chord,
        voiceRoles: [bassRole],
        voiceIds: [bassVoiceId]
      });

      // B. As vozes superiores atacam juntas nos offsets relativos 0.25, 0.5, 0.75 da duração total
      if (upperNotes.length > 0) {
        const offsets = [0.25, 0.5, 0.75];
        const hitDuration = 0.25 * chordDurationBeats;
        offsets.forEach(offsetRatio => {
          events.push({
            startBeat: chordStartBeat + offsetRatio * chordDurationBeats,
            durationBeats: hitDuration,
            midiNotes: [...upperNotes],
            velocity,
            sourceChord: voicedChord.chord,
            voiceRoles: upperRoles,
            voiceIds: upperVoiceIds
          });
        });
      }
      return events;
    }

    case "pedal-bass": {
      // Localiza o baixo estrutural
      const sortedVoices = [...voicedChord.voiceMap].sort((a, b) => a.midi - b.midi);
      const bassVoice = sortedVoices.find(v => v.role === "bass") || sortedVoices[0];
      const bassMidi = bassVoice ? bassVoice.midi : Math.min(...voicedChord.midiNotes);
      const bassRole = getRoleForMidi(bassMidi);
      const bassVoiceId = getVoiceIdForMidi(bassMidi);

      // Notas e roles superiores
      const upperNotes = voicedChord.midiNotes.filter(m => m !== bassMidi);
      const upperRoles = upperNotes.map(getRoleForMidi);
      const upperVoiceIds = upperNotes.map(getVoiceIdForMidi);

      const events: PerformanceEvent[] = [];

      // A. O baixo ataca na cabeça e sustenta pelo compasso inteiro
      events.push({
        startBeat: chordStartBeat,
        durationBeats: chordDurationBeats,
        midiNotes: [bassMidi],
        velocity,
        sourceChord: voicedChord.chord,
        voiceRoles: [bassRole],
        voiceIds: [bassVoiceId]
      });

      // B. As vozes superiores pulsam juntas nas semínimas derivadas da duração
      if (upperNotes.length > 0) {
        const count = Math.max(1, Math.floor(chordDurationBeats));
        const step = chordDurationBeats / count;
        for (let i = 0; i < count; i++) {
          events.push({
            startBeat: chordStartBeat + i * step,
            durationBeats: step,
            midiNotes: [...upperNotes],
            velocity,
            sourceChord: voicedChord.chord,
            voiceRoles: upperRoles,
            voiceIds: upperVoiceIds
          });
        }
      }
      return events;
    }

    default:
      return [];
  }
}
