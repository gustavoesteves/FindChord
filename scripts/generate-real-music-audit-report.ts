import fs from "node:fs";
import path from "node:path";
import {
  auditRealMusicLibrary,
  renderRealMusicAuditMarkdown
} from "./real-music-audit";

const outputPath = path.resolve(process.cwd(), "docs/reports/f39-real-music-audit-report.md");
const markdown = renderRealMusicAuditMarkdown(auditRealMusicLibrary());

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, markdown, "utf8");
console.log(`Wrote ${outputPath}`);
