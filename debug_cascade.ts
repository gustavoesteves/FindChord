import { analyzeProgression } from './src/utils/music/analysis/functionalAnalysis';
const res = analyzeProgression(['C', 'E7', 'A7', 'D7', 'G7', 'C']);
const lastC = res.chords[5];
console.log(lastC.chordSymbol, lastC.romanNumeral, lastC.harmonicFunction);
