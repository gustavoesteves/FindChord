const { XMLParser } = require('fast-xml-parser');
const { parseXMLHarmonyBlock } = require('./harmony-normalizer.cjs');

const MAJOR_KEY_BY_FIFTHS = {
  '-7': 'Cb',
  '-6': 'Gb',
  '-5': 'Db',
  '-4': 'Ab',
  '-3': 'Eb',
  '-2': 'Bb',
  '-1': 'F',
  '0': 'C',
  '1': 'G',
  '2': 'D',
  '3': 'A',
  '4': 'E',
  '5': 'B',
  '6': 'F#',
  '7': 'C#'
};

function getFirstTag(obj, tagName) {
  if (!obj || !Array.isArray(obj)) return null;
  for (let item of obj) {
    if (item[tagName] !== undefined) return item[tagName];
  }
  return null;
}

function getText(obj, tagName) {
  const tag = getFirstTag(obj, tagName);
  if (tag && Array.isArray(tag)) {
    for (let item of tag) {
      if (item['#text'] !== undefined) return item['#text'];
    }
  }
  return null;
}

function parseMusicXML(xmlData) {
  const options = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    preserveOrder: true,
    textNodeName: "#text"
  };
  const parser = new XMLParser(options);
  const xmlArr = parser.parse(xmlData);

  const snapshot = {
    timestamp: Date.now(),
    harmonies: [],
    notes: [],
    sections: [],
    metadata: { title: "Imported Score", composer: "", measures: 0 }
  };

  const scorePartwise = getFirstTag(xmlArr, 'score-partwise');
  if (!scorePartwise) throw new Error("Not a valid MusicXML (score-partwise missing)");

  const work = getFirstTag(scorePartwise, 'work');
  if (work) {
    const title = getText(work, 'work-title');
    if (title) snapshot.metadata.title = title;
  }

  const parts = scorePartwise.filter(node => node.part !== undefined);
  if (parts.length === 0) throw new Error("No parts found");

  // Apenas a primeira partitura (P1)
  const part = parts[0].part;
  
  let currentTick = 0;
  let currentDivisions = 240; // Default
  const getTickScale = () => 480 / currentDivisions;

  let measureCount = 0;

  for (let measureNode of part) {
    if (measureNode.measure === undefined) continue;
    
    measureCount++;
    const mAttrs = measureNode[':@'] || {};
    const mNumber = parseInt(mAttrs['@_number'] || String(measureCount));

    // O MusicXML usa divisions para duração
    // Cada compasso avança no tempo apenas pelas notas.
    // <backup> retrocede, <forward> avança.
    // O tempo inicial do compasso é o currentTick atual.
    let measureTickStart = currentTick;
    let measureCursor = measureTickStart; // cursor independente para <backup>
    let measureMaxCursor = measureTickStart;

    for (let el of measureNode.measure) {
      const tag = Object.keys(el).find(k => k !== ':@');
      if (!tag) continue;

      if (tag === 'attributes') {
        const divs = getText(el.attributes, 'divisions');
        if (divs) currentDivisions = parseInt(divs);

        const key = getFirstTag(el.attributes, 'key');
        const fifths = getText(key, 'fifths');
        if (fifths !== null && fifths !== undefined && !snapshot.metadata.keySignature) {
          snapshot.metadata.keySignature = MAJOR_KEY_BY_FIFTHS[fifths] || undefined;
        }
      }

      if (tag === 'direction') {
        const dirType = getFirstTag(el.direction, 'direction-type');
        if (dirType) {
          const rehearsal = getText(dirType, 'rehearsal');
          if (rehearsal) {
            snapshot.sections.push({
              id: "sec_" + mNumber + "_" + Math.random().toString(36).substr(2, 5),
              label: rehearsal,
              startMeasure: mNumber,
              startTick: measureCursor
            });
          }
          const words = getText(dirType, 'words');
          if (words && words.length <= 4 && words.toUpperCase() === words && !rehearsal) {
            snapshot.sections.push({
              id: "sec_" + mNumber + "_" + Math.random().toString(36).substr(2, 5),
              label: words,
              startMeasure: mNumber,
              startTick: measureCursor
            });
          }
        }
      }

      if (tag === 'harmony') {
        // Rebuild the harmony node so the normalizer can parse the full chord symbol.
        const { XMLBuilder } = require('fast-xml-parser');
        const builder = new XMLBuilder({ ignoreAttributes: false, preserveOrder: true });
        const harmonyXml = builder.build([el]);
        
        const fullChord = parseXMLHarmonyBlock(harmonyXml);
        if (fullChord) {
          snapshot.harmonies.push({
            measure: mNumber,
            beat: 1,
            harmony: fullChord,
            tickStart: measureCursor,
            tickEnd: measureCursor // Will calculate after
          });
          measureMaxCursor = Math.max(measureMaxCursor, measureCursor);
        }
      }

      if (tag === 'note') {
        const duration = getText(el.note, 'duration');
        const isChord = getFirstTag(el.note, 'chord') !== null;
        
        let durTicks = 0;
        if (duration) durTicks = parseInt(duration) * getTickScale();

        // Se a nota tiver <chord/> ela toca JUNTO com a anterior (mesmo tickStart)
        let noteTickStart = isChord ? measureCursor - durTicks : measureCursor;
        
        // Vamos apenas salvar como uma ParsedNote
        const pitch = getFirstTag(el.note, 'pitch');
        if (pitch) {
          const step = getText(pitch, 'step') || 'C';
          const octave = parseInt(getText(pitch, 'octave') || '4');
          const alterStr = getText(pitch, 'alter');
          const alter = alterStr ? parseInt(alterStr) : 0;
          
          const voiceStr = getText(el.note, 'voice');
          const voice = voiceStr ? parseInt(voiceStr) : 1;

          const staffStr = getText(el.note, 'staff');
          const staff = staffStr ? parseInt(staffStr) : 1;
          
          snapshot.notes.push({
            id: 'n_' + Math.random().toString(36).substr(2, 9),
            step, alter, octave,
            voice, staff,
            measure: mNumber,
            tickStart: noteTickStart,
            tickEnd: noteTickStart + durTicks,
            durationTicks: durTicks
          });
        }

        if (!isChord) {
          measureCursor += durTicks;
        }
        measureMaxCursor = Math.max(measureMaxCursor, noteTickStart + durTicks, measureCursor);
      }

      if (tag === 'backup') {
        const duration = getText(el.backup, 'duration');
        if (duration) {
          measureCursor -= parseInt(duration) * getTickScale();
        }
      }

      if (tag === 'forward') {
        const duration = getText(el.forward, 'duration');
        if (duration) {
          measureCursor += parseInt(duration) * getTickScale();
          measureMaxCursor = Math.max(measureMaxCursor, measureCursor);
        }
      }
    }
    
    // Avança o tick absoluto pro fim desse compasso.
    // Muitas vezes o measureCursor é igual ao tempo total, mas se houve multivozes,
    // o currentTick deve pular a maior duração. Simplificação: usa o maior cursor.
    currentTick = Math.max(currentTick, measureMaxCursor);
  }

  snapshot.metadata.measures = measureCount;

  // Post process sections
  snapshot.sections.sort((a, b) => a.startTick - b.startTick);
  for (let i = 0; i < snapshot.sections.length; i++) {
    if (i < snapshot.sections.length - 1) {
      snapshot.sections[i].endTick = snapshot.sections[i+1].startTick;
      snapshot.sections[i].endMeasure = snapshot.sections[i+1].startMeasure - 1;
    } else {
      snapshot.sections[i].endTick = currentTick;
      snapshot.sections[i].endMeasure = measureCount;
    }
  }

  // Post process harmonies to set tickEnd and durationTicks
  snapshot.harmonies.sort((a, b) => a.tickStart - b.tickStart);
  for (let i = 0; i < snapshot.harmonies.length; i++) {
    if (i < snapshot.harmonies.length - 1) {
      snapshot.harmonies[i].tickEnd = snapshot.harmonies[i+1].tickStart;
    } else {
      snapshot.harmonies[i].tickEnd = currentTick;
    }
    snapshot.harmonies[i].durationTicks = snapshot.harmonies[i].tickEnd - snapshot.harmonies[i].tickStart;
  }

  return snapshot;
}

module.exports = { parseMusicXML };
