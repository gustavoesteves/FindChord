import { CALIBRATION_CORPUS } from '../analysis/calibration/calibrationCorpus';
import { analyzeProgression } from '../analysis/functionalAnalysis';

const scenario = CALIBRATION_CORPUS.find(s => s.id === 'a-petrushka-loop')!;
console.log('Running debug on scenario:', scenario.name);
console.log('Progression:', scenario.progression);

const analysis = analyzeProgression(scenario.progression);
const targetChord = analysis.chords[scenario.targetChordIndex];
const adState = targetChord.debug?.adaptiveTonalState;

console.log('Target Chord Symbol:', targetChord.chordSymbol);
console.log('Target index:', scenario.targetChordIndex);
console.log('Adaptive State:', JSON.stringify(adState, null, 2));
console.log('Expected Centers:', JSON.stringify(scenario.expectedTonalCenters, null, 2));
