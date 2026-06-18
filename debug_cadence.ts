import { analyzeProgression } from './src/utils/music/analysis/functionalAnalysis';
const res = analyzeProgression(['Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7']);
console.log(JSON.stringify(res.phrases, null, 2));
