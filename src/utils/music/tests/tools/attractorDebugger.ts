import { analyzeProgression } from '../../analysis/functionalAnalysis';

function runDebugger(args: string[]) {
  if (args.length === 0) {
    console.log('Usage: npx tsx attractorDebugger.ts <chord1> <chord2> ...');
    console.log('Example: npx tsx attractorDebugger.ts Dm7 G7 Cmaj7');
    return;
  }

  const chords = args;
  console.log(`\n🔍 Attractor Debugger`);
  console.log(`Progression: ${chords.join(' -> ')}\n`);

  const result = analyzeProgression(chords);

  result.chords.forEach((chord, i) => {
    const semantic = chord.semantic;
    const attractor = chord.attractorField?.primaryAttractor;
    const fingerprint = result.fingerprint?.layers?.structural?.events ? result.fingerprint.layers.structural.events[i] : undefined;
    
    // Invariants (Mocked extraction from fingerprint if available, or just from knowledge graph later. For now, pull from fingerprint)
    let closureWeight = 'N/A';
    let dominanceWeight = 'N/A';
    const locks = [];

    if (fingerprint) {
      if (fingerprint.relativeTension !== undefined) closureWeight = fingerprint.relativeTension.toFixed(2);
      
      if (fingerprint.state === 'RESOLUTION') locks.push('preserve_resolution (critical)');
      if (fingerprint.state === 'TENSION') locks.push('is_harmonic_pillar (critical)');
    }

    console.log(`[${i + 1}] ${chord.chordSymbol}`);
    if (semantic) {
      console.log(`    Role: ${semantic.phraseRole} (Conf: ${semantic.phraseRoleConfidence?.toFixed(2) || 'N/A'})`);
      console.log(`    Intent: ${semantic.intent}`);
    } else {
      console.log(`    Role: UNKNOWN`);
    }

    if (attractor) {
      console.log(`    Attractor: ${attractor.type}`);
      console.log(`    Field Weight: ${attractor.weight.toFixed(2)}`);
      console.log(`    Alignment: ${attractor.alignment.toFixed(2)}`);
    } else {
      console.log(`    Attractor: NONE`);
    }

    console.log(`    Invariant Locks`);
    console.log(`      closureWeight: ${closureWeight}`);
    console.log(`      dominanceWeight: ${dominanceWeight}`);
    
    if (locks.length > 0) {
      console.log(`    Forbidden Changes`);
      locks.forEach(lock => console.log(`      - ${lock}`));
    }
    
    console.log('');
  });
}

if (process.argv.length > 2) {
  const args = process.argv.slice(2);
  runDebugger(args);
}
