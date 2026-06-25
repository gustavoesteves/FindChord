const assert = require('assert');
const { parseMusicXML } = require('../scripts/musicxml-parser.cjs');

// To run this suite, we mock a few test cases with inline MusicXML.
// Our parseXMLHarmonyBlock currently expects to run in a certain context,
// but for these structural tests we can mock it or provide very simple XML.

// We need to mock harmony-normalizer.cjs if it crashes, but let's try the real one first.

console.log("=========================================");
console.log(" F15.4.x Parser Validation Suite         ");
console.log("=========================================");

function testChordsCrossingMeasures() {
  const xml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <score-partwise>
      <work><work-title>Test Crossing</work-title></work>
      <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
      <part id="P1">
        <measure number="1">
          <attributes>
            <divisions>240</divisions>
          </attributes>
          <harmony>
            <root><root-step>D</root-step></root>
            <kind>minor-seventh</kind>
          </harmony>
          <note>
            <pitch><step>D</step><octave>4</octave></pitch>
            <duration>960</duration>
          </note>
        </measure>
        <measure number="2">
          <note>
            <pitch><step>F</step><octave>4</octave></pitch>
            <duration>960</duration>
          </note>
        </measure>
      </part>
    </score-partwise>
  `;
  const result = parseMusicXML(xml);
  
  assert.strictEqual(result.metadata.measures, 2, "Should have 2 measures");
  assert.strictEqual(result.harmonies.length, 1, "Should have 1 harmony");
  
  const chord = result.harmonies[0];
  // 1920 ticks in measure 1 (240 divisions * 4 beats), plus 1920 in measure 2 = total 3840
  // Wait, the note durations are 960 (4 quarters = 960 divisions, so 4 quarters = 1920 ticks).
  // 960 divisions at tickScale (480/240 = 2) = 1920 ticks.
  // So measure 1 has 1920 ticks, measure 2 has 1920 ticks. Total 3840.
  // The chord starts at 0 and should stretch to the end of the song (3840).
  assert.strictEqual(chord.tickStart, 0, "Chord starts at 0");
  assert.strictEqual(chord.tickEnd, 3840, "Chord extends across measure 2 to 3840");
  assert.strictEqual(chord.durationTicks, 3840, "Chord duration is 3840");
  
  console.log("✅ A. Chords crossing measures - PASSED");
}

function testRepeatedRehearsalMarks() {
  const xml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <score-partwise>
      <work><work-title>Test Rehearsal</work-title></work>
      <part-list><score-part id="P1"></score-part></part-list>
      <part id="P1">
        <measure number="1">
          <attributes><divisions>240</divisions></attributes>
          <direction><direction-type><rehearsal>A</rehearsal></direction-type></direction>
          <note><duration>960</duration></note>
        </measure>
        <measure number="2">
          <direction><direction-type><rehearsal>B</rehearsal></direction-type></direction>
          <note><duration>960</duration></note>
        </measure>
        <measure number="3">
          <direction><direction-type><rehearsal>A</rehearsal></direction-type></direction>
          <note><duration>960</duration></note>
        </measure>
      </part>
    </score-partwise>
  `;
  const result = parseMusicXML(xml);
  
  assert.strictEqual(result.sections.length, 3, "Should have 3 sections");
  assert.strictEqual(result.sections[0].label, "A");
  assert.strictEqual(result.sections[1].label, "B");
  assert.strictEqual(result.sections[2].label, "A");
  
  // Verify uniqueness
  assert.notStrictEqual(result.sections[0].id, result.sections[2].id, "Repeated labels must have unique IDs");
  
  // Verify boundaries
  assert.strictEqual(result.sections[0].startTick, 0);
  assert.strictEqual(result.sections[0].endTick, 1920); // measure 1 is 960*2 = 1920 ticks
  
  console.log("✅ B. Repeated Rehearsal Marks - PASSED");
}

function testSimultaneousVoices() {
  const xml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <score-partwise>
      <work><work-title>Test Voices</work-title></work>
      <part-list><score-part id="P1"></score-part></part-list>
      <part id="P1">
        <measure number="1">
          <attributes><divisions>240</divisions></attributes>
          <note>
            <pitch><step>C</step><octave>4</octave></pitch>
            <duration>480</duration>
            <voice>1</voice>
          </note>
          <note>
            <chord/>
            <pitch><step>E</step><octave>4</octave></pitch>
            <duration>480</duration>
            <voice>1</voice>
          </note>
          <backup><duration>480</duration></backup>
          <note>
            <pitch><step>C</step><octave>3</octave></pitch>
            <duration>480</duration>
            <voice>2</voice>
          </note>
        </measure>
      </part>
    </score-partwise>
  `;
  const result = parseMusicXML(xml);
  
  assert.strictEqual(result.notes.length, 3, "Should have 3 notes");
  
  const c4 = result.notes[0];
  const e4 = result.notes[1];
  const c3 = result.notes[2];
  
  assert.strictEqual(c4.step, "C");
  assert.strictEqual(c4.voice, 1);
  assert.strictEqual(c4.tickStart, 0);
  
  assert.strictEqual(e4.step, "E");
  assert.strictEqual(e4.voice, 1);
  assert.strictEqual(e4.tickStart, 0, "<chord/> should make it start simultaneously");
  
  assert.strictEqual(c3.step, "C");
  assert.strictEqual(c3.voice, 2);
  assert.strictEqual(c3.tickStart, 0, "<backup> should rewind cursor to 0");
  
  console.log("✅ C. Simultaneous Voices & Chords - PASSED");
}

try {
  testChordsCrossingMeasures();
  testRepeatedRehearsalMarks();
  testSimultaneousVoices();
  console.log("=========================================");
  console.log("🚀 All validation tests passed!");
  console.log("=========================================");
} catch (e) {
  console.error("❌ Test failed:", e.message);
  process.exit(1);
}
