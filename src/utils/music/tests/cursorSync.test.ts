/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOntologySessionStore } from '../../../store/useOntologySessionStore';
import * as progressionAnalysis from '../analysis/orchestrators/progressionAnalysis';
import type { ScoreSnapshot } from '../analysis/models/ScoreSnapshot';
import type { FunctionalAnalysis, FunctionalChord } from '../analysis/models/FunctionalAnalysis';

// Mock analyzeProgression to avoid doing real heavy computation
vi.mock('../analysis/orchestrators/progressionAnalysis', () => ({
  analyzeProgression: vi.fn()
}));

describe('Cursor Sync (F15.2) - Performance & Accuracy', () => {
  beforeEach(() => {
    useOntologySessionStore.getState().clearSession();
    vi.clearAllMocks();
  });

  it('should preserve ZERO recomputations on CURSOR_CHANGED and accurately track regionChangeCounter', () => {
    // 1. Arrange Mock Data
    // We simulate 4 chords: 2 in region A (BODY), 2 in region B (CADENTIAL)
    const mockChords: Partial<FunctionalChord>[] = [
      {
        index: 0, chordSymbol: "Cmaj7", romanNumeral: "Imaj7",
        semantic: { phraseRole: "BODY" } as any,
        attractorField: { primaryAttractor: { type: "TONAL_RESOLUTION", alignment: 1 } } as any,
        confidence: 0.9
      },
      {
        index: 1, chordSymbol: "Am7", romanNumeral: "VIm7",
        semantic: { phraseRole: "BODY" } as any,
        attractorField: { primaryAttractor: { type: "TONAL_RESOLUTION", alignment: 1 } } as any,
        confidence: 0.9
      },
      {
        index: 2, chordSymbol: "Dm7", romanNumeral: "IIm7",
        semantic: { phraseRole: "CADENTIAL" } as any,
        attractorField: { primaryAttractor: { type: "CADENTIAL_DOMINANT", alignment: 1 } } as any,
        confidence: 0.9
      },
      {
        index: 3, chordSymbol: "G7", romanNumeral: "V7",
        semantic: { phraseRole: "CADENTIAL" } as any,
        attractorField: { primaryAttractor: { type: "CADENTIAL_DOMINANT", alignment: 1 } } as any,
        confidence: 0.9
      }
    ];

    const mockAnalysis: Partial<FunctionalAnalysis> = {
      chords: mockChords as FunctionalChord[]
    };

    const mockSnapshot: Partial<ScoreSnapshot> = {
      harmonies: [
        { harmony: "Cmaj7", measure: 1, beat: 1 },
        { harmony: "Am7", measure: 2, beat: 1 },
        { harmony: "Dm7", measure: 3, beat: 1 },
        { harmony: "G7", measure: 4, beat: 1 }
      ]
    };

    (progressionAnalysis.analyzeProgression as any).mockReturnValue(mockAnalysis);

    // 2. Act: Load Score
    useOntologySessionStore.getState().loadScore(mockSnapshot as ScoreSnapshot);

    const store = useOntologySessionStore.getState();
    expect(progressionAnalysis.analyzeProgression).toHaveBeenCalledTimes(1);
    expect(store.regionChangeCounter).toBe(0); // Starts at 0
    expect(store.indexes?.regions.length).toBe(2); // Two distinct regions created

    // 3. Act: Trigger multiple cursor updates inside Region 1 (Ticks 0 to 3839)
    store.updateCursor(0);
    expect(useOntologySessionStore.getState().regionChangeCounter).toBe(1); // Entered region 1

    store.updateCursor(500);
    store.updateCursor(1000);
    store.updateCursor(2000); // entered measure 2, but STILL in region 1

    expect(useOntologySessionStore.getState().regionChangeCounter).toBe(1); // Stays at 1!

    // 4. Act: Trigger cursor update into Region 2 (Tick 3840+)
    store.updateCursor(3840);
    expect(useOntologySessionStore.getState().regionChangeCounter).toBe(2); // Bumped to 2!
    expect(useOntologySessionStore.getState().activeRegion?.dominantRole).toBe("CADENTIAL");

    // 5. Final assertion: analyzeProgression should NEVER have been called again
    expect(progressionAnalysis.analyzeProgression).toHaveBeenCalledTimes(1);
  });
});
