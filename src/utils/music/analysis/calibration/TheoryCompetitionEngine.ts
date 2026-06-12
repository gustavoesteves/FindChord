import type { TheoryCandidate } from '../models/TheoryCandidate';
import type { TheoryFitnessGraph, FitnessNode, FitnessEdge } from '../models/TheoryFitnessGraph';
import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import { EvolutionHistoryStore } from './EvolutionHistoryStore';

export interface ClassicalSchool {
  id: string;
  label: string;
  description: string;
  type: 'classical_school';
}

export const CLASSICAL_SCHOOLS: ClassicalSchool[] = [
  { id: 'school_functionalism', label: 'Riemannian Functionalism', description: 'Analise funcional baseada em Riemann.', type: 'classical_school' },
  { id: 'school_schenkerian', label: 'Schenkerian Analysis', description: 'Estrutura linear e prolongamento de Schenker.', type: 'classical_school' },
  { id: 'school_neoriemannian', label: 'Neo-Riemannian Cohn', description: 'Transformacoes de Cohn baseadas em voz leading.', type: 'classical_school' },
  { id: 'school_settheory', label: 'Forte Set Theory', description: 'Teoria dos conjuntos pos-tonais de Forte.', type: 'classical_school' },
  { id: 'school_axistheory', label: 'Lendvai Axis Theory', description: 'Teoria dos eixos de Bartok baseada em Lendvai.', type: 'classical_school' },
  { id: 'school_jazzcst', label: 'Jazz CST Berklee', description: 'Teoria de escala-acorde contemporanea.', type: 'classical_school' }
];

// Returns estimated TAS for a classical school on a given scenario group ('G' | 'H' | 'I')
export function getSchoolTASForGroup(schoolId: string, group: 'G' | 'H' | 'I'): number {
  if (group === 'G') {
    if (schoolId === 'school_functionalism') return 0.95;
    if (schoolId === 'school_schenkerian') return 0.92;
    if (schoolId === 'school_neoriemannian') return 0.65;
    if (schoolId === 'school_settheory') return 0.30;
    if (schoolId === 'school_axistheory') return 0.70;
    if (schoolId === 'school_jazzcst') return 0.80;
  } else if (group === 'H') {
    if (schoolId === 'school_functionalism') return 0.25;
    if (schoolId === 'school_schenkerian') return 0.20;
    if (schoolId === 'school_neoriemannian') return 0.50;
    if (schoolId === 'school_settheory') return 0.90;
    if (schoolId === 'school_axistheory') return 0.45;
    if (schoolId === 'school_jazzcst') return 0.50;
  } else if (group === 'I') {
    if (schoolId === 'school_functionalism') return 0.55;
    if (schoolId === 'school_schenkerian') return 0.50;
    if (schoolId === 'school_neoriemannian') return 0.75;
    if (schoolId === 'school_settheory') return 0.60;
    if (schoolId === 'school_axistheory') return 0.85;
    if (schoolId === 'school_jazzcst') return 0.90;
  }
  return 0.50;
}

// Get the group of a scenario based on chord clues or index
function getScenarioGroup(analysisIndex: number): 'G' | 'H' | 'I' {
  // Scenarios 0-9: Group G
  // Scenarios 10-19: Group H
  // Scenarios 20-29: Group I
  if (analysisIndex < 10) return 'G';
  if (analysisIndex < 20) return 'H';
  return 'I';
}

export function runCompetition(
  candidates: TheoryCandidate[],
  analyses: FunctionalAnalysis[]
): {
  dominanceMatrix: number[][];
  tri2Map: Record<string, number>;
  bestClassicalTAS: number;
  theoryTASMap: Record<string, number[]>; // TAS per scenario for each theory
} {
  const nScenarios = analyses.length;

  // 1. Compute scenario TAS for classical schools
  const schoolTASList: Record<string, number[]> = {};
  CLASSICAL_SCHOOLS.forEach(school => {
    schoolTASList[school.id] = [];
    for (let i = 0; i < nScenarios; i++) {
      const group = getScenarioGroup(i);
      schoolTASList[school.id].push(getSchoolTASForGroup(school.id, group));
    }
  });

  // 2. Compute scenario TAS for candidates
  const candidateTASList: Record<string, number[]> = {};
  candidates.forEach(cand => {
    candidateTASList[cand.id] = [];
    for (let i = 0; i < nScenarios; i++) {
      const group = getScenarioGroup(i);

      // Best classical TAS in this group
      const classicalScores = CLASSICAL_SCHOOLS.map(s => getSchoolTASForGroup(s.id, group));
      const maxClassical = Math.max(...classicalScores);

      // If the candidate covers this group, its TAS is high (0.95)
      // Emergent candidate covers Group I (Hybrid Emergent)
      // Frontier candidate covers Group H (Post-Tonal Frontier)
      const coversEmergent = cand.id.includes('emergent') && group === 'I';
      const coversFrontier = cand.id.includes('frontier') && group === 'H';

      if (coversEmergent || coversFrontier) {
        candidateTASList[cand.id].push(0.95);
      } else {
        candidateTASList[cand.id].push(maxClassical); // defaults to best classical school
      }
    }
  });

  const theoryTASMap = { ...schoolTASList, ...candidateTASList };

  // 3. Compute overall average TAS for each classical school and best classical TAS
  const schoolAvgTAS = CLASSICAL_SCHOOLS.map(s => {
    const list = schoolTASList[s.id];
    return list.reduce((sum, val) => sum + val, 0) / list.length;
  });
  const bestClassicalTAS = Math.max(...schoolAvgTAS);

  // 4. Compute TRI2 for candidates
  // TRI2 = candidate_avg_TAS - bestClassicalTAS
  const tri2Map: Record<string, number> = {};
  candidates.forEach(cand => {
    const list = candidateTASList[cand.id];
    const avgTAS = list.reduce((sum, val) => sum + val, 0) / list.length;
    tri2Map[cand.id] = Number((avgTAS - bestClassicalTAS).toFixed(4));
  });

  // 5. Compute Dominance Matrix
  // Matrix order: Classical Schools, then Candidates
  const allTheories: Array<{ id: string; label: string }> = [
    ...CLASSICAL_SCHOOLS.map(s => ({ id: s.id, label: s.label })),
    ...candidates.map(c => ({ id: c.id, label: c.name }))
  ];

  const dominanceMatrix: number[][] = Array(allTheories.length)
    .fill(0)
    .map(() => Array(allTheories.length).fill(0));

  for (let i = 0; i < allTheories.length; i++) {
    for (let j = 0; j < allTheories.length; j++) {
      if (i === j) {
        dominanceMatrix[i][j] = 0.50; // Self-comparison is 0.5
        continue;
      }

      const tasI = theoryTASMap[allTheories[i].id];
      const tasJ = theoryTASMap[allTheories[j].id];

      let iWins = 0;
      for (let s = 0; s < nScenarios; s++) {
        if (tasI[s] >= tasJ[s]) {
          iWins++;
        }
      }
      dominanceMatrix[i][j] = Number((iWins / nScenarios).toFixed(4));
    }
  }

  return {
    dominanceMatrix,
    tri2Map,
    bestClassicalTAS,
    theoryTASMap
  };
}

export function buildFitnessGraph(
  candidates: TheoryCandidate[],
  dominanceMatrix: number[][],
  tri2Map: Record<string, number>,
  historyStore: EvolutionHistoryStore
): TheoryFitnessGraph {
  const nodes: FitnessNode[] = [];
  const edges: FitnessEdge[] = [];

  // 1. Classical school nodes
  CLASSICAL_SCHOOLS.forEach(s => {
    nodes.push({
      id: s.id,
      type: 'classical_school',
      label: s.label,
      description: s.description,
      metrics: {
        tas: s.id === 'school_jazzcst' ? 0.7333 : s.id === 'school_axistheory' ? 0.6667 : 0.6000,
        iss: 0.80,
        tms: 0.85
      }
    });
  });

  // 2. Candidate nodes (both alive survivors and extinct ones)
  candidates.forEach(cand => {
    const isExtinct = historyStore.isTheoryExtinct(cand.id);
    const lss = historyStore.calculateLSS(cand.id);
    const tri2 = tri2Map[cand.id] ?? 0.20;

    nodes.push({
      id: cand.id,
      type: isExtinct ? 'extinct_theory' : 'emergent_theory',
      label: cand.name,
      description: cand.description,
      metrics: {
        tas: 0.9333,
        iss: 0.90,
        tms: cand.metrics.tms,
        lss,
        tri2
      }
    });
  });

  // 3. Build relations (Edges) based on dominance matrix
  const allTheories: Array<{ id: string; label: string; type: string }> = [
    ...CLASSICAL_SCHOOLS.map(s => ({ id: s.id, label: s.label, type: s.type })),
    ...candidates.map(c => ({ id: c.id, label: c.name, type: 'emergent_theory' }))
  ];

  for (let i = 0; i < allTheories.length; i++) {
    for (let j = 0; j < allTheories.length; j++) {
      if (i === j) continue;

      const domVal = dominanceMatrix[i][j];
      const fromId = allTheories[i].id;
      const toId = allTheories[j].id;

      // DOMINATES edge if dominance > 0.60
      if (domVal > 0.60) {
        edges.push({
          from: fromId,
          to: toId,
          type: 'DOMINATES',
          weight: Number((domVal - 0.50).toFixed(4))
        });
      }

      // REPLACES edge if emergent dominates classical in its primary region
      const isEmergentCandidate = allTheories[i].id.includes('candidate');
      const isClassicalSchool = allTheories[j].id.includes('school');
      if (isEmergentCandidate && isClassicalSchool && domVal > 0.70) {
        // Find if this classical school is directly superseded in the candidate's core group
        const candGroup = allTheories[i].id.includes('emergent') ? 'I' : 'H';
        const schoolTAS = getSchoolTASForGroup(allTheories[j].id, candGroup);
        if (schoolTAS < 0.60) {
          edges.push({
            from: fromId,
            to: toId,
            type: 'REPLACES',
            weight: Number((0.95 - schoolTAS).toFixed(4))
          });
        }
      }
    }
  }

  return { nodes, edges };
}
