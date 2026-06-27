/**
 * Normalizes MusicXML harmony blocks into chord symbols used by Harmonizar.
 */

const CANONICAL_CHORD_FORMAT = {
  "major": "",
  "minor": "m",
  "augmented": "aug",
  "diminished": "dim",
  "dominant": "7",
  "major-seventh": "maj7",
  "minor-seventh": "m7",
  "diminished-seventh": "dim7",
  "half-diminished": "m7(b5)",
  "augmented-seventh": "aug7",
  "major-minor": "mM7",
  "major-sixth": "6",
  "minor-sixth": "m6",
  "suspended-second": "sus2",
  "suspended-fourth": "sus4"
};

// Map degree alterations to strings
function alterToStr(alter) {
  if (alter === "1") return "#";
  if (alter === "-1") return "b";
  if (alter === "2") return "##";
  if (alter === "-2") return "bb";
  return "";
}

/**
 * 1. Extract RawHarmony from MusicXML <harmony> block
 */
function parseRawHarmony(block) {
  const rootStepMatch = block.match(/<root-step>([A-G])<\/root-step>/);
  if (!rootStepMatch) return null;

  const rootStep = rootStepMatch[1];
  const rootAlterMatch = block.match(/<root-alter>([^<]+)<\/root-alter>/);
  const rootAlter = rootAlterMatch ? alterToStr(rootAlterMatch[1]) : "";
  const root = rootStep + rootAlter;

  const kindMatch = block.match(/<kind[^>]*>([^<]+)<\/kind>/);
  const kindType = kindMatch ? kindMatch[1].trim() : "major";
  const kindTextMatch = block.match(/<kind[^>]*text="([^"]*)"/);
  const kindText = kindTextMatch ? kindTextMatch[1] : "";

  const bassStepMatch = block.match(/<bass-step>([A-G])<\/bass-step>/);
  let bass = null;
  if (bassStepMatch) {
    const bassStep = bassStepMatch[1];
    const bassAlterMatch = block.match(/<bass-alter>([^<]+)<\/bass-alter>/);
    const bassAlter = bassAlterMatch ? alterToStr(bassAlterMatch[1]) : "";
    bass = bassStep + bassAlter;
  }

  const degrees = [];
  const degreeRegex = /<degree>([\s\S]*?)<\/degree>/g;
  let dMatch;
  while ((dMatch = degreeRegex.exec(block)) !== null) {
    const dBlock = dMatch[1];
    const valMatch = dBlock.match(/<degree-value>([^<]+)<\/degree-value>/);
    const altMatch = dBlock.match(/<degree-alter>([^<]+)<\/degree-alter>/);
    const typeMatch = dBlock.match(/<degree-type[^>]*>([^<]+)<\/degree-type>/);
    
    if (valMatch) {
      degrees.push({
        value: valMatch[1],
        alter: altMatch ? altMatch[1] : "0",
        type: typeMatch ? typeMatch[1] : "add" // add, alter, subtract
      });
    }
  }

  return { root, kindType, kindText, bass, degrees };
}

/**
 * 2. Normalize to structured Harmony
 */
function normalizeHarmony(raw) {
  let quality = raw.kindType;
  let extensions = [];
  let alterations = [];

  // Edge cases from MusicXML weirdness
  
  // Case: <kind text="sus">suspended-second/fourth
  if (quality.startsWith("suspended")) {
    if (raw.kindText.includes("7sus") || raw.kindText.includes("7(sus")) {
      quality = "dominant-sus"; // custom intermediate
    } else if (raw.kindText.includes("13sus")) {
      quality = "dominant-13-sus";
    } else if (raw.kindText.includes("9sus")) {
      quality = "dominant-9-sus";
    }
  }

  // Parse degrees
  for (const d of raw.degrees) {
    const mod = alterToStr(d.alter) + d.value;
    if (d.type === "add" || d.type === "alter") {
      alterations.push(mod);
    } else if (d.type === "subtract") {
      // omit5 etc, usually ignored in simple canonical formatting
    }
  }

  return {
    root: raw.root,
    quality: quality,
    kindText: raw.kindText, // keep for reference
    alterations: alterations,
    bass: raw.bass
  };
}

/**
 * 3. Format Normalized Harmony to string
 */
function formatHarmony(norm) {
  let symbol = norm.root;
  let baseQuality = CANONICAL_CHORD_FORMAT[norm.quality];

  // Custom overrides
  if (norm.quality === "dominant-sus") baseQuality = "7sus4";
  if (norm.quality === "dominant-9-sus") baseQuality = "9sus4";
  if (norm.quality === "dominant-13-sus") baseQuality = "13sus4";
  
  if (baseQuality === undefined) {
    baseQuality = norm.kindText.replace(/^\//, ''); // fallback to raw text if unknown
  }

  // Handle 6/9
  if (norm.quality === "major-sixth" && norm.alterations.includes("9")) {
    baseQuality = "6/9";
    norm.alterations = norm.alterations.filter(a => a !== "9");
  }

  // Handle add9 on major/minor
  if (norm.alterations.includes("9") && (norm.quality === "major" || norm.quality === "minor")) {
    norm.alterations = norm.alterations.filter(a => a !== "9");
    if (baseQuality === "") baseQuality = "(add9)"; // C(add9)
    else if (baseQuality === "m") baseQuality = "m(add9)";
    else baseQuality += "(add9)";
  }
  
  // Handle maj7(add9)
  if (norm.alterations.includes("9") && norm.quality === "major-seventh") {
    norm.alterations = norm.alterations.filter(a => a !== "9");
    baseQuality = "maj7(add9)";
  }

  symbol += baseQuality;

  // Handle 'alt' (b9, #9, b5, #5) on dominant chords
  if (norm.quality === "dominant" || norm.quality === "dominant-seventh") {
    const hasB9 = norm.alterations.includes("b9");
    const hasS9 = norm.alterations.includes("#9");
    const hasB5 = norm.alterations.includes("b5");
    const hasS5 = norm.alterations.includes("#5");
    
    // If it has at least 3 of the 4, or specifically the common alt clusters, call it "alt"
    if ((hasB9 || hasS9) && (hasB5 || hasS5) && norm.alterations.length >= 2) {
      symbol += "alt";
      // Remove them
      norm.alterations = norm.alterations.filter(a => !["b9", "#9", "b5", "#5"].includes(a));
    }
  }

  // Append remaining alterations in parentheses
  if (norm.alterations.length > 0) {
    symbol += `(${norm.alterations.join(",")})`;
  }

  if (norm.bass) {
    symbol += `/${norm.bass}`;
  }

  return symbol;
}

/**
 * Main Entry Point
 */
function parseXMLHarmonyBlock(block) {
  const raw = parseRawHarmony(block);
  if (!raw) return null;
  const norm = normalizeHarmony(raw);
  return formatHarmony(norm);
}

module.exports = {
  parseXMLHarmonyBlock,
  parseRawHarmony,
  normalizeHarmony,
  formatHarmony
};
