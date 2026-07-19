import {
  auditMelodicMaterialsLibrary,
  writeMelodicMaterialsAudit
} from "./audit-melodic-materials";

const report = auditMelodicMaterialsLibrary();
writeMelodicMaterialsAudit(report);

console.log(JSON.stringify({
  files: report.files,
  rows: report.rows.length,
  primaryMaterialRows: report.primaryMaterialRows,
  availableNonPrimaryRows: report.availableNonPrimaryRows,
  noMaterialRows: report.noMaterialRows,
  materialCounts: report.materialCounts
}, null, 2));
