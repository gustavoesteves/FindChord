import type { FunctionalAnalysis } from '../analysis/models/FunctionalAnalysis';

export interface OntologyIntegrityReport {
  fingerprintAgreement: number;
  roleAgreement: number;
  attractorAgreement: number;
  overallIntegrity: number;
  violations: string[];
}

export function evaluateOntologyIntegrity(analysis: FunctionalAnalysis): OntologyIntegrityReport {
  let fpAgreements = 0;
  let roleAgreements = 0;
  let attrAgreements = 0;
  let totalChecks = 0;
  const violations: string[] = [];

  const chords = analysis.chords;
  const structuralEvents = analysis.fingerprint?.layers?.structural?.events;

  if (!structuralEvents) {
    return { fingerprintAgreement: 0, roleAgreement: 0, attractorAgreement: 0, overallIntegrity: 0, violations: ['No structural events found'] };
  }

  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    const fpEvent = structuralEvents.find(e => e.chordIndex === i);
    const fpState = fpEvent?.state;
    const role = chord.semantic?.phraseRole;
    const attractor = chord.attractorField?.primaryAttractor?.type;
    const func = chord.harmonicFunction;
    const ctxFunc = chord.contextualFunction;

    // 1. Role Agreement
    totalChecks++;
    let roleOk = true;
    if (role === 'CADENTIAL' && func !== 'DOMINANT' && ctxFunc !== 'SECONDARY_DOMINANT' && ctxFunc !== 'TRITONE_SUBSTITUTION') {
      // Sometimes half cadences land on dominant, but sometimes plagal lands on subdominant.
      if (analysis.cadences.some(c => c.endIndex === i || c.endIndex - 1 === i)) {
        // Tolerated if it's part of a cadence
      } else {
        roleOk = false;
        violations.push(`[${chord.chordSymbol}] Role is CADENTIAL but function is ${func}`);
      }
    }
    if (role === 'CLOSING' && func !== 'TONIC' && ctxFunc !== 'SECONDARY_DOMINANT') {
      // Deceptive cadence might land on vi (Tonic substitute) or something else.
      if (chord.romanNumeral?.includes('vi') || chord.romanNumeral?.includes('VI') || chord.romanNumeral?.includes('ii') || chord.romanNumeral?.includes('IV')) {
        // Deceptive resolution to vi or secondary resolution to ii or subdominant closure
      } else {
        roleOk = false;
        violations.push(`[${chord.chordSymbol}] Role is CLOSING but function is ${func} (Not Tonic/vi/ii/IV)`);
      }
    }
    if (roleOk) roleAgreements++;

    // 2. Attractor Agreement
    totalChecks++;
    let attrOk = true;
    if ((role === 'CLOSING' || role === 'CADENTIAL') && attractor !== 'TONAL_RESOLUTION') {
      attrOk = false;
      violations.push(`[${chord.chordSymbol}] Role is ${role} but attractor is ${attractor}`);
    }
    if (role === 'PRE_CADENTIAL' && attractor !== 'CADENTIAL_DOMINANT' && attractor !== 'LOCAL_RESOLUTION') {
      attrOk = false;
      violations.push(`[${chord.chordSymbol}] Role is PRE_CADENTIAL but attractor is ${attractor}`);
    }
    if (role === 'PROLONGATION' && attractor !== 'PROLONGATION_INERTIA') {
      attrOk = false;
      violations.push(`[${chord.chordSymbol}] Role is PROLONGATION but attractor is ${attractor}`);
    }
    if (attrOk) attrAgreements++;

    // 3. Fingerprint (Skeleton/DNA) Agreement
    totalChecks++;
    let fpOk = true;
    if (fpState) {
      if (func === 'DOMINANT' && fpState !== 'TENSION' && fpState !== 'RESOLUTION') {
        // bVII7 backdoor might not be recognized as a formal cadence, sometimes gets PROLONGATION
        if (chord.romanNumeral?.includes('VII') || chord.romanNumeral?.includes('vii')) {
           // Tolerated
        } else {
           fpOk = false;
           violations.push(`[${chord.chordSymbol}] Function is DOMINANT but FP narrative is ${fpState}`);
        }
      }
      if (func === 'TONIC' && fpState !== 'PROLONGATION' && fpState !== 'RESOLUTION') {
        if (role !== 'PROLONGATION' && role !== 'OPENING' && role !== 'BODY') {
           fpOk = false;
           violations.push(`[${chord.chordSymbol}] Function is TONIC but FP narrative is ${fpState}`);
        }
      }
    }
    if (fpOk) fpAgreements++;
  }

  const checksPerCategory = chords.length;
  const fingerprintAgreement = fpAgreements / checksPerCategory;
  const roleAgreement = roleAgreements / checksPerCategory;
  const attractorAgreement = attrAgreements / checksPerCategory;
  
  const overallIntegrity = (fingerprintAgreement + roleAgreement + attractorAgreement) / 3;

  return {
    fingerprintAgreement,
    roleAgreement,
    attractorAgreement,
    overallIntegrity,
    violations
  };
}
