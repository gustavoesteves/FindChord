import type { WhyNotExclusion } from '../models/HarmonicRoute';

export class WhyNotEngine {
  private exclusions: WhyNotExclusion[] = [];

  /**
   * Logs a route that was rejected during the generation pipeline.
   */
  public logExclusion(exclusion: WhyNotExclusion): void {
    this.exclusions.push(exclusion);
  }

  /**
   * Retrieves all logged exclusions.
   */
  public getExclusions(): WhyNotExclusion[] {
    return this.exclusions;
  }

  /**
   * Clears the current log. Useful for resetting between orchestrator runs.
   */
  public clear(): void {
    this.exclusions = [];
  }
}
