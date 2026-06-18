import { analyzeProgression } from './src/utils/music/analysis/functionalAnalysis';
const res = analyzeProgression(['C', 'G', 'Am', 'F', 'C']);
console.log(!!res.fingerprint, !!res.fingerprint?.timeline);
