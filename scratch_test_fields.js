import { Chord } from "tonal";

const c = Chord.get("CM");
console.log("c.root:", c.root);
console.log("c.tonic:", c.tonic);
console.log("c.aliases:", c.aliases);
console.log("c.name:", c.name);
console.log("c.notes:", c.notes);
