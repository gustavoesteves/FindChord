import type { TheoryCandidate } from '../models/TheoryCandidate';
import type { EvolutionHistoryEntry } from '../models/TheoryHistory';

export class EvolutionHistoryStore {
  private static instance: EvolutionHistoryStore | null = null;

  private history: Record<string, EvolutionHistoryEntry[]> = {};
  private extinctStatus: Record<string, boolean> = {};
  private extinctionReasons: Record<string, string> = {};
  private totalGenerations = 0;

  private constructor() {}

  public static getInstance(): EvolutionHistoryStore {
    if (!EvolutionHistoryStore.instance) {
      EvolutionHistoryStore.instance = new EvolutionHistoryStore();
    }
    return EvolutionHistoryStore.instance;
  }

  public clear(): void {
    this.history = {};
    this.extinctStatus = {};
    this.extinctionReasons = {};
    this.totalGenerations = 0;
  }

  public setTotalGenerations(count: number): void {
    this.totalGenerations = count;
  }

  public getTotalGenerations(): number {
    return this.totalGenerations;
  }

  public addGeneration(generationIdx: number, candidates: TheoryCandidate[]): void {
    if (generationIdx > this.totalGenerations) {
      this.totalGenerations = generationIdx;
    }

    candidates.forEach((cand) => {
      // If already marked extinct, do not record further metrics
      if (this.extinctStatus[cand.id]) {
        return;
      }

      if (!this.history[cand.id]) {
        this.history[cand.id] = [];
      }

      // Find average TAS and ISS if they exist in debug/state, otherwise use placeholder or defaults
      this.history[cand.id].push({
        generation: generationIdx,
        stage: cand.stage,
        metrics: {
          tcs: cand.metrics.tcs,
          tri: cand.metrics.tri,
          gs: cand.metrics.gs,
          egsw: cand.metrics.egsw,
          ns: cand.metrics.ns,
          tms: cand.metrics.tms
        }
      });
    });
  }

  public getHistory(candidateId: string): EvolutionHistoryEntry[] {
    return this.history[candidateId] || [];
  }

  public markExtinct(candidateId: string, reason: string): void {
    this.extinctStatus[candidateId] = true;
    this.extinctionReasons[candidateId] = reason;
  }

  public isTheoryExtinct(candidateId: string): boolean {
    return !!this.extinctStatus[candidateId];
  }

  public getExtinctionReason(candidateId: string): string | null {
    return this.extinctionReasons[candidateId] || null;
  }

  public calculateLSS(candidateId: string): number {
    const entries = this.history[candidateId] || [];
    if (entries.length === 0) return 0.0;

    const generationsAlive = entries.length;
    
    // Find the maximum generation index recorded so far
    let totalGen = 1;
    Object.values(this.history).forEach((entryList) => {
      entryList.forEach((e) => {
        if (e.generation > totalGen) {
          totalGen = e.generation;
        }
      });
    });

    const initialTMS = entries[0].metrics.tms;
    const finalTMS = entries[entries.length - 1].metrics.tms;

    // Formula: LSS = (GenerationsAlive / TotalGenerations) * (TMS_final / max(0.01, TMS_initial))
    const ratioAlive = generationsAlive / totalGen;
    const tmsRatio = finalTMS / Math.max(0.01, initialTMS);

    return Number(Math.max(0.0, ratioAlive * tmsRatio).toFixed(4));
  }

  public calculateEPS(candidateId: string): number {
    const entries = this.history[candidateId] || [];
    if (entries.length === 0) return 0.0;
    if (entries.length === 1) return 1.0; // 0 standard deviation -> EPS = 1.0

    // Standard deviation of EGS_w
    const egswList = entries.map(e => e.metrics.egsw);
    const mean = egswList.reduce((sum, val) => sum + val, 0) / egswList.length;
    const variance = egswList.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / egswList.length;
    const stdDev = Math.sqrt(variance);

    // Formula: EPS = 1.0 - stdDev
    return Number(Math.max(0.0, Math.min(1.0, 1.0 - stdDev)).toFixed(4));
  }

  public getLSSMap(): Record<string, number> {
    const map: Record<string, number> = {};
    Object.keys(this.history).forEach((id) => {
      map[id] = this.calculateLSS(id);
    });
    return map;
  }

  public getEPSMap(): Record<string, number> {
    const map: Record<string, number> = {};
    Object.keys(this.history).forEach((id) => {
      map[id] = this.calculateEPS(id);
    });
    return map;
  }

  public getSurvivorsCount(): number {
    let count = 0;
    Object.keys(this.history).forEach((id) => {
      if (!this.extinctStatus[id]) {
        count++;
      }
    });
    return count;
  }

  public getGeneratedCount(): number {
    return Object.keys(this.history).length;
  }
}
