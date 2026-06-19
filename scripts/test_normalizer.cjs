const { parseXMLHarmonyBlock } = require('./harmony-normalizer.cjs');

const tests = [
  // C6/9 exported by MS4
  `<harmony print-frame="no">
    <root><root-step>C</root-step></root>
    <kind text="/6">major-sixth</kind>
    <degree><degree-value>9</degree-value><degree-alter>0</degree-alter><degree-type>add</degree-type></degree>
  </harmony>`,
  
  // G7alt
  `<harmony>
    <root><root-step>G</root-step></root>
    <kind text="7alt">dominant</kind>
    <degree><degree-value>9</degree-value><degree-alter>-1</degree-alter><degree-type>alter</degree-type></degree>
    <degree><degree-value>5</degree-value><degree-alter>1</degree-alter><degree-type>alter</degree-type></degree>
  </harmony>`,
  
  // Cmaj7(add9)
  `<harmony>
    <root><root-step>C</root-step></root>
    <kind text="maj7">major-seventh</kind>
    <degree><degree-value>9</degree-value><degree-alter>0</degree-alter><degree-type>add</degree-type></degree>
  </harmony>`,
  
  // m7(b5)
  `<harmony>
    <root><root-step>G</root-step></root>
    <kind text="m7(b5)">half-diminished</kind>
  </harmony>`,

  // sus4
  `<harmony>
    <root><root-step>C</root-step></root>
    <kind text="sus">suspended-fourth</kind>
  </harmony>`,

  // 7sus4
  `<harmony>
    <root><root-step>G</root-step></root>
    <kind text="7sus">suspended-fourth</kind>
  </harmony>`,

  // G7(b9,#11)
  `<harmony>
    <root><root-step>G</root-step></root>
    <kind text="7">dominant</kind>
    <degree><degree-value>9</degree-value><degree-alter>-1</degree-alter><degree-type>alter</degree-type></degree>
    <degree><degree-value>11</degree-value><degree-alter>1</degree-alter><degree-type>alter</degree-type></degree>
  </harmony>`
];

for (const t of tests) {
  console.log("Raw => ", parseXMLHarmonyBlock(t));
}
