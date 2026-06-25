import { HarmonicFunction } from "../src/utils/music/analysis/engines/hsmk/HSMKState";
import { 
  RelativeOperator, 
  SustainedOperator, 
  CadentialOperator, 
  StaticOperator,
  FunctionalRegion,
  ExpandedRegion
} from "../src/utils/music/analysis/engines/hsmk/ExpansionOperator";

// Test F26.1a: Functional Expansion (Almada Exemplo c)

console.log("--- F26.1a: Functional Expansion Validation (Almada c) ---");

// 1. Backbone Original (Extraído da melodia no F26.0)
const backbone: FunctionalRegion[] = [
  { func: "T" },
  { func: "PD" },
  { func: "D" },
  { func: "T" }
];

console.log("1. Backbone Original:");
console.log(backbone.map(r => r.func).join(" -> "));

// 2. Operadores de Expansão (A intenção estrutural)
const operators = [
  RelativeOperator,     // T -> T(STATIC) + T(RELATIVE)
  SustainedOperator,    // PD -> PD(STATIC) + PD(SUSTAINED)
  CadentialOperator,    // D -> D(CADENTIAL) + D(STATIC)
  StaticOperator        // T -> T(STATIC)
];

// 3. Aplicar a Expansão
const expandedBackbone: ExpandedRegion[] = [];
for (let i = 0; i < backbone.length; i++) {
  const op = operators[i];
  const expanded = op.transform(backbone[i]);
  expandedBackbone.push(...expanded);
}

console.log("\n2. Expanded Backbone (Estratégias Aplicadas):");
const expandedStrings = expandedBackbone.map(r => `${r.func}(${r.strategy})`);
console.log(expandedStrings.join(" -> "));

// Validação Estrutural
const expectedExpanded = [
  "T(STATIC)", "T(RELATIVE)", 
  "PD(STATIC)", "PD(SUSTAINED)", 
  "D(CADENTIAL)", "D(STATIC)", 
  "T(STATIC)"
];

const isValid = JSON.stringify(expandedStrings) === JSON.stringify(expectedExpanded);

if (isValid) {
  console.log("\n✅ Expansão Estrutural (b -> c): PASSED");
} else {
  console.log("\n❌ Expansão Estrutural: FAILED");
  console.log("Expected:", expectedExpanded.join(" -> "));
}

// 4. Realização Harmônica (Apenas simulada para validação final das restrições diatônicas)
// Em uma versão real, isso usaria a topologia do HarmonicWorld para minimizar energia obedecendo as restrições.
function mockRealize(region: ExpandedRegion, center: string): string {
  if (region.func === "T") {
    if (region.strategy === "STATIC") return "C";
    if (region.strategy === "RELATIVE" && region.constraints.allowedRomanNumerals?.includes("vi")) return "Am";
  }
  if (region.func === "PD") {
    if (region.strategy === "STATIC") return "Dm";
    if (region.strategy === "SUSTAINED" && region.constraints.bassBehavior === "DESCENDING_STEP") return "Dm/C";
  }
  if (region.func === "D") {
    if (region.strategy === "CADENTIAL" && region.constraints.allowedRomanNumerals?.includes("vii°")) return "Bm7b5";
    if (region.strategy === "STATIC" && region.constraints.allowedRomanNumerals?.includes("V")) return "G7";
  }
  return "?";
}

console.log("\n3. Realização Harmônica Sob Restrições:");
const realization = expandedBackbone.map(r => mockRealize(r, "C"));
console.log(realization.join(" -> "));

const expectedRealization = ["C", "Am", "Dm", "Dm/C", "Bm7b5", "G7", "C"];
if (JSON.stringify(realization) === JSON.stringify(expectedRealization)) {
  console.log("\n✅ Equivalência Funcional Almada c: PASSED");
} else {
  console.log("\n❌ Equivalência Funcional: FAILED");
}
