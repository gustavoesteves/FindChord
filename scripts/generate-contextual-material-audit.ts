import fs from "node:fs";
import path from "node:path";
import {
  auditContextualMaterialLibrary,
  renderContextualMaterialAuditMarkdown
} from "./audit-contextual-scales";

const report = auditContextualMaterialLibrary();
const outputPath = path.resolve(process.cwd(), "docs/reports/f119-contextual-material-temporal-audit.md");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, renderContextualMaterialAuditMarkdown(report), "utf8");
console.log(`Wrote ${outputPath}`);
console.log(JSON.stringify({
  files: report.files,
  harmonyEvents: report.harmonyEvents,
  noCandidate: report.noCandidateCount,
  lowMelodyCoverage: report.lowMelodyCoverageCount,
  genericAlteredFallback: report.genericAlteredFallbackCount
}, null, 2));
