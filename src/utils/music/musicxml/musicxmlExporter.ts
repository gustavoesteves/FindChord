import type { VoicingShape } from "../models/VoicingShape";
import { parseChord } from "../theory/chordParser";


function getStepAndAlter(note: string) {
  const step = note[0].toUpperCase();
  const acc = note.slice(1);
  let alter = 0;
  if (acc === "#") alter = 1;
  else if (acc === "b") alter = -1;
  return { step, alter };
}

function getMusicXmlKind(quality: string): { kind: string; text: string } {
  switch (quality) {
    case "major": return { kind: "major", text: "" };
    case "minor": return { kind: "minor", text: "m" };
    case "diminished": return { kind: "diminished", text: "dim" };
    case "augmented": return { kind: "augmented", text: "aug" };
    case "power": return { kind: "power", text: "5" };
    case "sus4": return { kind: "suspended-fourth", text: "sus4" };
    case "sus2": return { kind: "suspended-second", text: "sus2" };
    case "major6th": return { kind: "major-sixth", text: "6" };
    case "minor6th": return { kind: "minor-sixth", text: "m6" };
    case "dominant7th": return { kind: "dominant", text: "7" };
    case "major7th": return { kind: "major-seventh", text: "maj7" };
    case "minor7th": return { kind: "minor-seventh", text: "m7" };
    case "minorMajor7th": return { kind: "minor-major-seventh", text: "m(maj7)" };
    case "halfDiminished": return { kind: "half-diminished", text: "m7b5" };
    case "diminished7th": return { kind: "diminished-seventh", text: "dim7" };
    case "dominant7sus4": return { kind: "suspended-fourth", text: "7sus4" };
    case "add9": return { kind: "major-ninth", text: "add9" };
    case "minorAdd9": return { kind: "minor-ninth", text: "m(add9)" };
    case "69": return { kind: "major-sixth", text: "6/9" };
    case "dominant9th": return { kind: "dominant-ninth", text: "9" };
    case "major9th": return { kind: "major-ninth", text: "maj9" };
    case "minor9th": return { kind: "minor-ninth", text: "m9" };
    case "dominant11th": return { kind: "dominant-11th", text: "11" };
    case "minor11th": return { kind: "minor-11th", text: "m11" };
    case "dominant13th": return { kind: "dominant-13th", text: "13" };
    case "major13th": return { kind: "major-13th", text: "maj13" };
    case "minor13th": return { kind: "minor-13th", text: "m13" };
    case "dominant7b9": return { kind: "dominant", text: "7b9" };
    case "dominant7#9": return { kind: "dominant", text: "7#9" };
    case "dominant7#11": return { kind: "dominant", text: "7#11" };
    case "dominant7b13": return { kind: "dominant", text: "7b13" };
    case "major7#11": return { kind: "major-seventh", text: "maj7#11" };
    default: return { kind: "major", text: "" };
  }
}

export function exportMusicXml(
  chords: string[],
  voicings: (VoicingShape | null)[],
  bpm: number
): string {
  const dateStr = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>Find Chord Progression</work-title>
  </work>
  <identification>
    <creator type="composer">Find Chord</creator>
    <encoding>
      <software>Antigravity MusicXML Exporter</software>
      <encoding-date>${dateStr}</encoding-date>
      <supports element="accidental" type="yes"/>
      <supports element="beam" type="yes"/>
      <supports element="print" attribute="new-page" type="no"/>
      <supports element="print" attribute="new-system" type="no"/>
      <supports element="stem" type="yes"/>
    </encoding>
  </identification>
  <defaults>
    <scaling>
      <millimeters>7</millimeters>
      <tenths>40</tenths>
    </scaling>
    <page-layout>
      <page-height>1696.72</page-height>
      <page-width>1200.33</page-width>
      <page-margins type="even">
        <left-margin>85.7143</left-margin>
        <right-margin>85.7143</right-margin>
        <top-margin>85.7143</top-margin>
        <bottom-margin>85.7143</bottom-margin>
      </page-margins>
      <page-margins type="odd">
        <left-margin>85.7143</left-margin>
        <right-margin>85.7143</right-margin>
        <top-margin>85.7143</top-margin>
        <bottom-margin>85.7143</bottom-margin>
      </page-margins>
    </page-layout>
    <music-font font-family="Leland"/>
    <word-font font-family="Edwin" font-size="10"/>
  </defaults>
  <part-list>
    <score-part id="P1">
      <part-name print-object="no">Classical Guitar</part-name>
      <part-abbreviation print-object="no">Guit.</part-abbreviation>
      <score-instrument id="P1-I1">
        <instrument-name>Classical Guitar</instrument-name>
        <instrument-sound>pluck.guitar.nylon-string</instrument-sound>
      </score-instrument>
      <midi-device id="P1-I1" port="1"></midi-device>
      <midi-instrument id="P1-I1">
        <midi-channel>1</midi-channel>
        <midi-program>25</midi-program>
        <volume>78.7402</volume>
        <pan>0</pan>
      </midi-instrument>
    </score-part>
  </part-list>
  <part id="P1">
`;

  chords.forEach((chordSymbol, idx) => {
    const voicing = voicings[idx];
    const measureNum = idx + 1;

    xml += `    <measure number="${measureNum}">\n`;

    if (idx === 0) {
      xml += `      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
          <clef-octave-change>-1</clef-octave-change>
        </clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome parentheses="no">
            <beat-unit>quarter</beat-unit>
            <per-minute>${bpm}</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="${bpm}"/>
      </direction>\n`;
    }

    const parsedChord = parseChord(chordSymbol);
    if (!parsedChord.empty) {
      const rootInfo = getStepAndAlter(parsedChord.root);
      const kindInfo = getMusicXmlKind(parsedChord.quality);

      xml += `      <harmony print-frame="no">
        <root>
          <root-step>${rootInfo.step}</root-step>\n`;
      if (rootInfo.alter !== 0) {
        xml += `          <root-alter>${rootInfo.alter}</root-alter>\n`;
      }
      xml += `        </root>\n`;

      if (kindInfo.text) {
        xml += `        <kind text="${kindInfo.text}">${kindInfo.kind}</kind>\n`;
      } else {
        xml += `        <kind>${kindInfo.kind}</kind>\n`;
      }

      if (parsedChord.bass) {
        const bassInfo = getStepAndAlter(parsedChord.bass);
        xml += `        <bass>
          <bass-step>${bassInfo.step}</bass-step>\n`;
        if (bassInfo.alter !== 0) {
          xml += `          <bass-alter>${bassInfo.alter}</bass-alter>\n`;
        }
        xml += `        </bass>\n`;
      }

      if (voicing) {
        const nonZeroFrets = voicing.frets.filter((f): f is number => f !== null && f > 0);
        let firstFret = 1;
        let frameFrets = 4;
        if (nonZeroFrets.length > 0) {
          const minFret = Math.min(...nonZeroFrets);
          const maxFret = Math.max(...nonZeroFrets);
          if (maxFret > 4) {
            firstFret = minFret;
            frameFrets = Math.max(4, maxFret - firstFret + 1);
          }
        }

        xml += `        <frame>
          <frame-strings>6</frame-strings>
          <frame-frets>${frameFrets}</frame-frets>\n`;
        if (firstFret > 1) {
          xml += `          <first-fret>${firstFret}</first-fret>\n`;
        }

        voicing.frets.forEach((fret, stringIdx) => {
          if (fret !== null) {
            const stringNum = stringIdx + 1;
            xml += `          <frame-note>
            <string>${stringNum}</string>
            <fret>${fret}</fret>
          </frame-note>\n`;
          }
        });

        xml += `        </frame>\n`;
      }

      xml += `      </harmony>\n`;
    }

    xml += `      <note>
        <rest measure="yes"/>
        <duration>4</duration>
        <voice>1</voice>
      </note>\n`;

    xml += `    </measure>\n`;
  });

  xml += `  </part>
</score-partwise>\n`;

  return xml;
}
