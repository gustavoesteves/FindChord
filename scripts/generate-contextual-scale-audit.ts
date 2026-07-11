import fs from "node:fs";
import path from "node:path";
import {
  auditContextualScaleLibrary,
  renderContextualScaleAuditMarkdown
} from "./audit-contextual-scales";

const report = auditContextualScaleLibrary();
const outputPath = path.resolve(process.cwd(), "docs/reports/f119-contextual-scale-temporal-audit.md");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, renderContextualScaleAuditMarkdown(report), "utf8");
console.log(`Wrote ${outputPath}`);
console.log(JSON.stringify({
  files: report.files,
  harmonyEvents: report.harmonyEvents,
  noCandidate: report.noCandidateCount,
  lowMelodyCoverage: report.lowMelodyCoverageCount,
  genericAlteredFallback: report.genericAlteredFallbackCount
}, null, 2));
