import { useOntologySessionStore } from './src/store/useOntologySessionStore.ts';
import { parseMusicXML } from './scripts/musicxml-parser.cjs';
import fs from 'fs';

const xml = fs.readFileSync('./docs/exemplo.musicxml', 'utf8');
const snapshot = parseMusicXML(xml);
console.log('Snapshot notes:', snapshot.notes.length);

useOntologySessionStore.getState().loadScore(snapshot);
const loaded = useOntologySessionStore.getState().scoreSnapshot;
console.log('Loaded scoreSnapshot notes:', loaded.notes.length);
