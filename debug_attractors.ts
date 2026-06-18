import { analyzeProgression } from './src/utils/music/analysis/functionalAnalysis';
const res = analyzeProgression(['Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7']);
res.chords.forEach(c => {
  const primary = c.attractorField?.primaryAttractor;
  console.log(`[${c.chordSymbol}] -> ${primary?.type} | Weight: ${primary?.weight} | Align: ${primary?.alignment}`);
});
console.log('---');
const res2 = analyzeProgression(['Dm9', 'Dm9', 'Dm9', 'Dm9']);
res2.chords.forEach(c => {
  const primary = c.attractorField?.primaryAttractor;
  console.log(`[${c.chordSymbol}] -> ${primary?.type} | Weight: ${primary?.weight} | Align: ${primary?.alignment}`);
});
