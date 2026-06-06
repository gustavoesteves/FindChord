// Sprint 10A — Tonal Hierarchy & Tonal Region Tree Tests
// Run with: npx tsx src/utils/music/tests/tonalHierarchy.test.ts

import { analyzeProgression, buildTonalRegionTree, getRegionRank } from '../analysis/functionalAnalysis';
import type { TonalRegion, TonalCenter } from '../analysis/models/FunctionalAnalysis';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// Helper para criar mock de TonalCenter
function makeMockCenter(root: string, mode: 'MAJOR' | 'MINOR'): TonalCenter {
  return { root, mode, confidence: 1.0 };
}

// Helper para criar mock de TonalRegion
function makeMockRegion(
  root: string,
  mode: 'MAJOR' | 'MINOR',
  type: 'TONICIZATION' | 'REGIONAL_SHIFT' | 'ESTABLISHED_MODULATION',
  isHomeKey: boolean
): TonalRegion {
  return {
    key: makeMockCenter(root, mode),
    startIndex: 0,
    endIndex: 0,
    duration: 1,
    type,
    isHomeKey,
    stabilityScore: 1.0,
    cadenceIndexes: []
  };
}

// ═══════════════════════════════════════════════════════════
// Caso 1 — Diatonic Stable (Apenas nó raiz estável, sem filhos)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Diatonic Stable (Cmaj7 -> Am7 -> Dm7 -> G7 -> Cmaj7)');
{
  const analysis = analyzeProgression(['Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7']);
  
  assert(analysis.regionTree !== undefined, 'regionTree is defined in analysis output');
  if (analysis.regionTree) {
    const root = analysis.regionTree;
    assert(root.id === 'region-node-0', 'Root has correct ID');
    assert(root.region.key.root === 'C' && root.region.key.mode === 'MAJOR', 'Root region is C MAJOR');
    assert(root.region.isHomeKey === true, 'Root has isHomeKey: true');
    assert(root.children.length === 0, `Root has 0 children (got ${root.children.length})`);
    assert(root.parent === undefined, 'Root has no parent');
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Tonicização (Nó raiz com filho de Rank 0)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Unit Test: Tonicização Sob Home Key (C Major -> D Minor Tonicization)');
{
  const home = makeMockRegion('C', 'MAJOR', 'ESTABLISHED_MODULATION', true);
  const tonicization = makeMockRegion('D', 'MINOR', 'TONICIZATION', false);
  
  const root = buildTonalRegionTree([home, tonicization]);
  
  assert(root !== null, 'Tree built successfully');
  if (root) {
    assert(root.region.key.root === 'C', 'Root is C');
    assert(root.children.length === 1, `Root has exactly 1 child (got ${root.children.length})`);
    
    const child = root.children[0];
    assert(child.id === 'region-node-1', 'Child has ID region-node-1');
    assert(child.region.key.root === 'D' && child.region.key.mode === 'MINOR', 'Child is D Minor');
    assert(getRegionRank(child.region) === 0, 'Child has rank 0');
    assert(child.parent === root, 'Child parent points to Root');
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Hierarquia Complexa Encadeada (C -> Dm -> Am -> Em -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Unit Test: Hierarquia Complexa (C -> Dm -> Am -> Em -> C)');
{
  // Configura as regiões como o usuário desenhou no caso de uso
  const reg0 = makeMockRegion('C', 'MAJOR', 'ESTABLISHED_MODULATION', true);      // Rank 3 (Home Key)
  const reg1 = makeMockRegion('D', 'MINOR', 'TONICIZATION', false);               // Rank 0 (Tonicization of ii)
  const reg2 = makeMockRegion('A', 'MINOR', 'ESTABLISHED_MODULATION', false);     // Rank 2 (Modulation to vi)
  const reg3 = makeMockRegion('E', 'MINOR', 'TONICIZATION', false);               // Rank 0 (Tonicization of v in Am)
  const reg4 = makeMockRegion('C', 'MAJOR', 'ESTABLISHED_MODULATION', true);      // Rank 3 (Return to Home Key)
  
  const root = buildTonalRegionTree([reg0, reg1, reg2, reg3, reg4]);
  
  assert(root !== null, 'Tree built successfully');
  if (root) {
    // A raiz deve ser C Major (reg0)
    assert(root.id === 'region-node-0', 'Root node is region-node-0 (C Major)');
    
    // reg0 deve ter como filhos: reg1 (Dm), reg2 (Am) e reg4 (C Major de retorno)
    assert(root.children.length === 3, `Root has 3 children (got ${root.children.length})`);
    
    if (root.children.length === 3) {
      const child0 = root.children[0]; // Dm (Tonicization, Rank 0)
      const child1 = root.children[1]; // Am (Modulation, Rank 2)
      const child2 = root.children[2]; // C (Return, Rank 3)
      
      assert(child0.region.key.root === 'D' && child0.region.key.mode === 'MINOR', 'First child is D Minor');
      assert(child0.parent === root, 'D Minor parent is Root');
      assert(child0.children.length === 0, 'D Minor has 0 children');
      
      assert(child1.region.key.root === 'A' && child1.region.key.mode === 'MINOR', 'Second child is A Minor');
      assert(child1.parent === root, 'A Minor parent is Root');
      
      // A Minor deve ter como filho o Em (reg3, Rank 0)
      assert(child1.children.length === 1, `A Minor has 1 child (got ${child1.children.length})`);
      if (child1.children.length === 1) {
        const grandChild = child1.children[0];
        assert(grandChild.region.key.root === 'E' && grandChild.region.key.mode === 'MINOR', 'A Minor child is E Minor');
        assert(grandChild.parent === child1, 'E Minor parent is A Minor');
        assert(grandChild.children.length === 0, 'E Minor has 0 children');
      }
      
      assert(child2.region.key.root === 'C' && child2.region.key.mode === 'MAJOR', 'Third child is C Major Return');
      assert(child2.parent === root, 'C Major Return parent is Root');
      assert(child2.children.length === 0, 'C Major Return has 0 children');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Serialização Sem Loops (JSON)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — JSON Serialization Safety');
{
  const reg0 = makeMockRegion('C', 'MAJOR', 'ESTABLISHED_MODULATION', true);
  const reg1 = makeMockRegion('D', 'MINOR', 'TONICIZATION', false);
  const tree = buildTonalRegionTree([reg0, reg1]);
  
  let jsonString = '';
  let didThrow = false;
  
  try {
    jsonString = JSON.stringify(tree);
  } catch (err) {
    didThrow = true;
  }
  
  assert(!didThrow, 'JSON.stringify does not throw circular structure exception');
  assert(!jsonString.includes('"parent"'), 'JSON string does not contain parent references');
  
  // Garante que outras propriedades relevantes foram mantidas na string serializada
  assert(jsonString.includes('"id":"region-node-0"'), 'JSON string includes root node ID');
  assert(jsonString.includes('"children"'), 'JSON string includes children field');
}

// ═══════════════════════════════════════════════════════════
// Resumo Geral
// ═══════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed!`);
}
