import type { FunctionalAnalysis, FunctionalChord } from '../models/FunctionalAnalysis';
import type { FunctionalEquivalenceLayerData } from '../models/FunctionalEquivalence';
import type { VoiceLeadingLayerData } from '../models/VoiceLeadingLayer';
import type { 
  ApparentFunctionLayerData, 
  ApparentFunctionEvent, 
  ApparentRole, 
  ApparentSubtype,
  ResolutionAnalysis,
  ResolutionStrength
} from '../models/ApparentFunctionLayer';
import { getPitchClass } from '../../core/pitch';
import { parseChord } from '../../theory/chordParser';

const DEFAULT_LOOKAHEAD = 3;

function safeModulo(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function normalizeScaleDegree(sd: string): string {
  return sd.replace(/[7°øø7maj/]/g, '').replace(/m$/, '');
}

export function resolveApparentFunctions(
  analysis: FunctionalAnalysis,
  feData: FunctionalEquivalenceLayerData,
  vlData: VoiceLeadingLayerData
): ApparentFunctionLayerData {
  const events: ApparentFunctionEvent[] = [];

  if (!analysis || !analysis.chords || analysis.chords.length === 0) {
    return {
      events: [],
      apparentSignature: ''
    };
  }

  const chords = analysis.chords;
  const N = chords.length;

  for (let i = 0; i < N; i++) {
    const chord = chords[i];
    const originalFE = feData?.events?.[i];
    const originalRoman = originalFE ? originalFE.originalRoman : chord.romanNumeral;
    const originalRole = originalFE ? originalFE.role : 'UNRESOLVED';

    // 1. Check special case: Augmented Sixth (geometrical voice leading resolution)
    const aug6Result = checkAugmentedSixth(i, chords, vlData);
    if (aug6Result) {
      events.push({
        chordIndex: i,
        originalRoman,
        originalRole,
        apparentRole: aug6Result.apparentRole,
        apparentSubtype: aug6Result.apparentSubtype,
        resolution: aug6Result.resolution!
      });
      continue;
    }

    // 2. Check special case: Cadential 6/4 (second inversion tonic resolving to dominant)
    const cad64Result = checkCadential64(i, chords, feData);
    if (cad64Result) {
      events.push({
        chordIndex: i,
        originalRoman,
        originalRole,
        apparentRole: cad64Result.apparentRole,
        apparentSubtype: cad64Result.apparentSubtype,
        resolution: cad64Result.resolution!
      });
      continue;
    }

    // 3. Normal / Default roles mapping
    let apparentRole: ApparentRole = 'UNRESOLVED';
    if (originalRole === 'TONIC') apparentRole = 'TONIC';
    else if (originalRole === 'PREDOMINANT') apparentRole = 'PREDOMINANT';
    else if (originalRole === 'DOMINANT') apparentRole = 'DOMINANT';
    else if (originalRole === 'LINEAR') apparentRole = 'LINEAR';

    // Build default ResolutionAnalysis
    let resolution: ResolutionAnalysis = {
      status: 'UNCONFIRMED',
      strength: 'NONE',
      distance: 0,
      evidence: 'No retrospective resolution observed within lookahead window.'
    };

    let apparentSubtype: ApparentSubtype | undefined = undefined;

    // Only chords that create expectation are analyzed for resolution status
    const hasExpectation = 
      apparentRole === 'DOMINANT' || 
      apparentRole === 'PREDOMINANT';

    if (hasExpectation) {
      // Lookahead loop
      for (let k = 1; k <= DEFAULT_LOOKAHEAD; k++) {
        if (i + k >= N) break;

        const targetChord = chords[i + k];
        const targetFE = feData?.events?.[i + k];
        const targetRole = targetFE ? targetFE.role : 'UNRESOLVED';

        // A) Check for deceptive resolution (INTERRUPTED)
        // If DOMINANT resolving to vi or bVI
        if (apparentRole === 'DOMINANT') {
          const sd = normalizeScaleDegree(targetChord.scaleDegree);
          if (sd === 'vi' || sd === 'bVI') {
            resolution = {
              status: 'INTERRUPTED',
              strength: 'WEAK',
              distance: k,
              targetChordIndex: i + k,
              evidence: `Deceptive resolution to ${targetChord.chordSymbol} (vi/bVI) instead of expected tonic.`
            };
            apparentSubtype = 'DECEPTIVE_RESOLUTION';
            break;
          }
        }

        // B) Check for resolution to expected target
        let resolved = false;

        if (apparentRole === 'DOMINANT') {
          // If secondary dominant, we expect resolution to the targetDegree
          const targetDegree = originalFE?.targetDegree;
          if (targetDegree) {
            const targetBase = normalizeScaleDegree(targetDegree).toLowerCase();
            const chordBase = normalizeScaleDegree(targetChord.scaleDegree).toLowerCase();
            if (targetBase === chordBase) {
              resolved = true;
            }
          } else {
            // Primary dominant: expects TONIC
            if (targetRole === 'TONIC') {
              resolved = true;
            }
          }
        } else if (apparentRole === 'PREDOMINANT') {
          // Predominant: expects DOMINANT or DOMINANT_PROLONGATION (cadencial 6/4)
          const isTargetCadential = checkCadential64(i + k, chords, feData) !== null;
          if (targetRole === 'DOMINANT' || isTargetCadential) {
            resolved = true;
          }
        }

        if (resolved) {
          // Check voice-leading transition into the target chord
          const vlEvent = vlData?.events?.[i + k - 1]; // transition leading to target chord (index i+k)
          let strength: ResolutionStrength = 'WEAK';
          let leadingToneResolved = false;
          let seventhResolved = false;

          if (vlEvent) {
            const resolutions = vlEvent.resolutions;
            leadingToneResolved = resolutions.thirdToRoot;
            seventhResolved = resolutions.seventhToThird;
            
            if (resolutions.tritone && (leadingToneResolved || seventhResolved)) {
              strength = 'STRONG';
            } else if (leadingToneResolved || seventhResolved) {
              strength = 'MODERATE';
            }
          }

          resolution = {
            status: k === 1 ? 'RESOLVED' : 'DEFERRED',
            strength,
            distance: k,
            targetChordIndex: i + k,
            leadingToneResolved,
            seventhResolved,
            evidence: `Resolved to expected target ${targetChord.chordSymbol} at index ${i + k}. Voice leading strength: ${strength}.`
          };
          break;
        }
      }
    } else {
      // TONIC, LINEAR, or UNRESOLVED default
      resolution = {
        status: 'RESOLVED',
        strength: 'STRONG',
        distance: 0,
        evidence: 'Tonic/linear stable state.'
      };
    }

    events.push({
      chordIndex: i,
      originalRoman,
      originalRole,
      apparentRole,
      apparentSubtype,
      resolution
    });
  }

  // Build apparentSignature
  const sigParts: string[] = [];
  events.forEach(e => {
    // Only expectative apparent roles are registered in the signature
    if (
      e.apparentRole === 'DOMINANT' ||
      e.apparentRole === 'PREDOMINANT' ||
      e.apparentRole === 'DOMINANT_PROLONGATION'
    ) {
      let statusChar = '';
      if (e.resolution.status === 'RESOLVED') {
        statusChar = `R${e.resolution.distance}`;
      } else if (e.resolution.status === 'DEFERRED') {
        statusChar = `D${e.resolution.distance}`;
      } else if (e.resolution.status === 'INTERRUPTED') {
        statusChar = 'I';
      } else if (e.resolution.status === 'UNCONFIRMED') {
        statusChar = 'U';
      }
      sigParts.push(`${e.apparentRole}:${statusChar}`);
    }
  });
  const apparentSignature = sigParts.join('>');

  return {
    events,
    apparentSignature
  };
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function checkAugmentedSixth(
  chordIndex: number,
  chords: FunctionalChord[],
  vlData: VoiceLeadingLayerData
): { apparentRole: ApparentRole; apparentSubtype?: ApparentSubtype; resolution?: ResolutionAnalysis } | null {
  if (chordIndex >= chords.length - 1 || !vlData || !vlData.events) return null;
  const vlEvent = vlData.events[chordIndex];
  if (!vlEvent || !vlEvent.movements) return null;

  for (let u = 0; u < vlEvent.movements.length; u++) {
    for (let v = 0; v < vlEvent.movements.length; v++) {
      if (u === v) continue;
      const mA = vlEvent.movements[u]; // mA is the lower note
      const mB = vlEvent.movements[v]; // mB is the higher note

      if (mA.fromPitch >= mB.fromPitch) continue;

      const interval = safeModulo(mB.fromPitch - mA.fromPitch, 12);
      if (interval === 10) {
        const diffA = mA.toPitch - mA.fromPitch;
        const diffB = mB.toPitch - mB.fromPitch;

        if (diffA === -1 && diffB === 1) {
          const targetPC_A = safeModulo(mA.toPitch, 12);
          const targetPC_B = safeModulo(mB.toPitch, 12);

          if (targetPC_A === targetPC_B) {
            const Z = targetPC_A;
            const pcs = new Set(vlEvent.movements.map(m => safeModulo(m.fromPitch, 12)));

            const parsed = parseChord(chords[chordIndex].chordSymbol);
            const theoreticalPCs = new Set<number>();
            if (!parsed.empty) {
              parsed.notes.forEach(noteName => {
                theoreticalPCs.add(safeModulo(getPitchClass(noteName), 12));
              });
            }

            let apparentSubtype: ApparentSubtype = 'ITALIAN_AUGMENTED_SIXTH';
            if (pcs.has(safeModulo(Z + 7, 12)) || theoreticalPCs.has(safeModulo(Z + 7, 12))) {
              apparentSubtype = 'FRENCH_AUGMENTED_SIXTH';
            } else if (pcs.has(safeModulo(Z + 8, 12)) || theoreticalPCs.has(safeModulo(Z + 8, 12))) {
              apparentSubtype = 'GERMAN_AUGMENTED_SIXTH';
            }

            return {
              apparentRole: 'PREDOMINANT',
              apparentSubtype,
              resolution: {
                status: 'RESOLVED',
                strength: 'STRONG',
                distance: 1,
                targetChordIndex: chordIndex + 1,
                leadingToneResolved: true,
                seventhResolved: true,
                evidence: `Augmented sixth interval (${mA.fromNote}-${mB.fromNote}) resolved outwards to octave/unison (${mA.toNote}) at target chord.`
              }
            };
          }
        }
      }
    }
  }

  return null;
}

function checkCadential64(
  chordIndex: number,
  chords: FunctionalChord[],
  feData: FunctionalEquivalenceLayerData
): { apparentRole: ApparentRole; apparentSubtype?: ApparentSubtype; resolution?: ResolutionAnalysis } | null {
  if (chordIndex >= chords.length - 1 || !feData || !feData.events) return null;
  const currentFE = feData.events[chordIndex];
  const nextFE = feData.events[chordIndex + 1];

  if (!currentFE || !nextFE) return null;

  if (currentFE.role === 'TONIC' && nextFE.role === 'DOMINANT') {
    const chordSymbol = chords[chordIndex].chordSymbol;
    if (chordSymbol.includes('/')) {
      const parts = chordSymbol.split('/');
      const bassNote = parts[parts.length - 1];
      const parsedNext = parseChord(chords[chordIndex + 1].chordSymbol);
      if (!parsedNext.empty) {
        const nextChordRoot = parsedNext.root;
        if (getPitchClass(bassNote) === getPitchClass(nextChordRoot)) {
          return {
            apparentRole: 'DOMINANT_PROLONGATION',
            apparentSubtype: 'CADENTIAL_64',
            resolution: {
              status: 'RESOLVED',
              strength: 'STRONG',
              distance: 1,
              targetChordIndex: chordIndex + 1,
              evidence: `Cadential 6/4 chord (bass ${bassNote} matches dominant root ${nextChordRoot}) resolving to dominant.`
            }
          };
        }
      }
    }
  }
  return null;
}
