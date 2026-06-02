import type { SessionBundle } from "../models/SessionBundle";
import type { DawAdapter, DawExportBundle } from "./DawAdapter";
import { base64ToUint8Array } from "../SessionSerializer";

export interface ReaperTrackDefinition {
  name: string;
  /**
   * Zero-based MIDI channel: 0 = MIDI Channel 1, 15 = MIDI Channel 16.
   */
  midiChannel: number;
  /**
   * 1-based track index in the Standard MIDI File (SMF) Type 1.
   */
  trackIndex: number;
  /**
   * Optional track-specific MIDI file reference. If omitted, falls back to the default project MIDI file.
   */
  midiFilename?: string;
}

export interface ReaperExportOptions {
  projectName?: string;
  midiFilename?: string;
  tracks?: ReaperTrackDefinition[];
}

const defaultTracks: ReaperTrackDefinition[] = [
  { name: "Bass", midiChannel: 0, trackIndex: 1 },
  { name: "Guide Tones", midiChannel: 1, trackIndex: 2 },
  { name: "Upper Structure", midiChannel: 2, trackIndex: 3 }
];

export const reaperAdapter: DawAdapter = {
  /**
   * Converte o SessionBundle canônico em um projeto DAW integrado do Reaper (.RPP)
   * e seu asset MIDI correspondente de forma 100% pura e determinística.
   */
  export(session: SessionBundle, options?: ReaperExportOptions): DawExportBundle {
    const projectName = options?.projectName || session.sessionName || "harmony_session";
    const midiFilename = options?.midiFilename || `${projectName}.mid`;
    const tracks = options?.tracks || defaultTracks;

    // 1. Determinar tempo e andamento a partir da sessão
    const bpm = session.bpm || 120;
    const timeSig = session.timeSignature || { numerator: 4, denominator: 4 };

    // 2. Calcular a duração absoluta em beats e convertê-la em segundos reais
    const totalBeats = session.performanceTimeline.events.reduce(
      (max, ev) => Math.max(max, ev.startBeat + ev.durationBeats),
      0
    ) || (session.voicedProgression.voicings.length * 4);

    const durationSeconds = (totalBeats * 60) / bpm;

    // 3. Montar bloco de anotações nativo do Reaper (<NOTES) a partir de metadados da sessão
    let notesBlock = "";
    const createdStr = `Created: ${session.createdAtUtc}`; // Usamos data estática da sessão para determinismo
    const tagsStr = session.tags && session.tags.length > 0 ? `Tags: ${session.tags.join(", ")}` : "";
    const notesStr = session.notes ? `Notes: ${session.notes}` : "";

    const lines = [projectName !== "harmony_session" ? `Session: ${projectName}` : "", createdStr, tagsStr, notesStr].filter(Boolean);
    if (lines.length > 0) {
      notesBlock = "  <NOTES\n" + lines.map(line => `    |${line}`).join("\n") + "\n  >\n";
    }

    // 4. Montar o conteúdo textual do arquivo .RPP de forma determinística
    let rpp = `<REAPER_PROJECT 0.1 "6.0" 1780000000\n`;
    rpp += `  TEMPO ${bpm} ${timeSig.numerator} ${timeSig.denominator}\n`;
    rpp += notesBlock;

    // 5. Inserir trilhas de forma declarativa e dinâmica
    tracks.forEach(trackDef => {
      rpp += `  <TRACK\n`;
      rpp += `    NAME "${trackDef.name}"\n`;
      rpp += `    <ITEM\n`;
      rpp += `      POSITION 0\n`;
      rpp += `      LENGTH ${durationSeconds.toFixed(6)}\n`;
      rpp += `      NAME "${trackDef.name}"\n`;
      const trackMidiFile = trackDef.midiFilename || midiFilename;
      rpp += `      <SOURCE MIDI\n`;
      rpp += `        FILE "${trackMidiFile}"\n`;
      rpp += `        TRACK ${trackDef.trackIndex}\n`;
      rpp += `      >\n`;
      rpp += `    >\n`;
      rpp += `  >\n`;
    });

    rpp += `>\n`;

    // 6. Decodificar MIDI correspondente a partir do payload Base64 para compor os assets casados
    const decodedMidiBytes = base64ToUint8Array(session.midiBase64);

    return {
      projectFile: {
        filename: `${projectName}.rpp`,
        content: rpp,
        mimeType: "text/plain"
      },
      assets: [
        {
          filename: midiFilename,
          content: decodedMidiBytes,
          mimeType: "audio/midi"
        }
      ]
    };
  }
};
