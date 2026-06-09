import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import type { 
  HarmonicFingerprint, 
  FingerprintOptions, 
  StructuralEvent, 
  HarmonicDeviceEvent, 
  FormalPhraseEvent, 
  RegionTransition, 
  FingerprintLayer 
} from '../models/HarmonicFingerprint';
import { getChroma } from '../../theory/pitchClass';
import { getDiatonicTargetDegree } from '../../theory/scaleDegree';
import { resolveFunctionalEquivalences } from './functionalEquivalenceEngine';
import { resolveVoiceLeadingNarrative } from './voiceLeadingNarrativeEngine';
import { resolveApparentFunctions } from './apparentFunctionsEngine';
import type { FunctionalEquivalenceLayerData } from '../models/FunctionalEquivalence';
import type { VoiceLeadingLayerData } from '../models/VoiceLeadingLayer';

export function generateFingerprint(analysis: FunctionalAnalysis, options?: FingerprintOptions): HarmonicFingerprint {
  const density = options?.density || (options?.layers ? undefined : 'CORE');
  
  // Decide which layers to compute
  const layersToCompute = new Set<FingerprintLayer>();
  
  // 1. Density generates the base set
  if (density) {
    if (density === 'CORE' || density === 'STANDARD' || density === 'FULL') {
      layersToCompute.add('STRUCTURAL');
      layersToCompute.add('HARMONIC');
      layersToCompute.add('FORMAL');
      layersToCompute.add('REGIONAL');
    }
    if (density === 'STANDARD' || density === 'FULL') {
      layersToCompute.add('FUNCTIONAL_EQUIVALENCE');
      layersToCompute.add('VOICE_LEADING');
    }
    if (density === 'FULL') {
      layersToCompute.add('APPARENT_FUNCTION');
      layersToCompute.add('STYLE_EXTENSIONS');
    }
  }

  // 2. Explicit layers are added as extensions (union)
  if (options?.layers) {
    options.layers.forEach(l => layersToCompute.add(l));
  }

  const chordsCount = analysis.chords.length;
  const phrasesCount = analysis.phrases?.length || 0;
  const sourceKey = `${analysis.tonalCenter.root} ${analysis.tonalCenter.mode}`;

  const fingerprint: HarmonicFingerprint = {
    version: '1.0.0',
    metadata: {
      sourceKey,
      transpositionInvariant: true,
      chordsCount,
      phrasesCount,
      queryProgression: analysis.chords.map(c => c.chordSymbol)
    },
    layers: {}
  };

  // 1. LAYER 1: STRUCTURAL
  if (layersToCompute.has('STRUCTURAL')) {
    const events: StructuralEvent[] = analysis.chords.map(chord => {
      let state: StructuralEvent['state'] = 'UNKNOWN';
      let relativeTension = 0.2; // default prolongation tension
      
      const intent = chord.semantic?.intent;
      if (intent) {
        switch (intent) {
          case 'PROLONGATION':
            state = 'PROLONGATION';
            relativeTension = 0.2;
            break;
          case 'PREPARATION':
            state = 'PREPARATION';
            relativeTension = 0.5;
            break;
          case 'INTENSIFICATION':
            state = 'TENSION';
            relativeTension = 0.7;
            break;
          case 'ATTRACTION':
            state = 'TENSION';
            relativeTension = 0.9;
            break;
          case 'RESOLUTION':
            state = 'RESOLUTION';
            relativeTension = 0.0;
            break;
          case 'COLORATION':
            state = 'PROLONGATION';
            relativeTension = 0.3;
            break;
        }
      } else {
        // Fallback on harmonicFunction
        switch (chord.harmonicFunction) {
          case 'TONIC':
            state = 'PROLONGATION';
            relativeTension = 0.2;
            break;
          case 'SUBDOMINANT':
            state = 'PREPARATION';
            relativeTension = 0.5;
            break;
          case 'DOMINANT':
            state = 'TENSION';
            relativeTension = 0.8;
            break;
        }
      }

      // Check for cadential tension adjustments
      const isCadentialTension = chord.semantic?.supports?.includes('CADENCE_TENSION');
      if (isCadentialTension && state === 'TENSION') {
        relativeTension = 1.0;
      }
      
      return {
        chordIndex: chord.index,
        state,
        relativeTension
      };
    });
    
    fingerprint.layers.structural = { events };
  }

  // 2. LAYER 2: HARMONIC
  if (layersToCompute.has('HARMONIC')) {
    const devices: HarmonicDeviceEvent[] = [];
    const deviceFrequency: Record<string, number> = {};

    analysis.chords.forEach(chord => {
      let deviceType: HarmonicDeviceEvent['deviceType'] | null = null;
      let sourceDegree: string | undefined = undefined;

      // Secondary dominant
      if (chord.secondary?.contextualFunction === 'SECONDARY_DOMINANT') {
        deviceType = 'SECONDARY_DOMINANT';
        sourceDegree = chord.romanNumeral;
      }
      // Tritone substitution
      else if (chord.secondary?.contextualFunction === 'TRITONE_SUBSTITUTION') {
        deviceType = 'TRITONE_SUBSTITUTION';
        sourceDegree = chord.romanNumeral;
      }
      // Modal borrowing
      else if (chord.modal?.contextualFunction === 'MODAL_BORROWING') {
        deviceType = 'MODAL_BORROWING';
        sourceDegree = chord.romanNumeral;
      }
      // Chromatic approach / passing
      else if (chord.modal?.contextualFunction === 'CHROMATIC_APPROACH') {
        deviceType = 'PASSING_CHROMATIC';
        sourceDegree = chord.romanNumeral;
      }
      
      // Deceptive resolution check
      const deceptiveCadence = analysis.cadences?.find(
        c => c.endIndex === chord.index && c.resolution?.status === 'DECEPTIVE'
      );
      if (deceptiveCadence) {
        deviceType = 'DECEPTIVE_CADENCE';
        sourceDegree = chord.romanNumeral;
      }

      // If a device type was found, record it
      if (deviceType) {
        devices.push({
          chordIndex: chord.index,
          deviceType,
          sourceDegree
        });
        deviceFrequency[deviceType] = (deviceFrequency[deviceType] || 0) + 1;
      }
    });

    fingerprint.layers.harmonic = {
      devices,
      deviceFrequency
    };
  }

  // 3. LAYER 3: FORMAL
  if (layersToCompute.has('FORMAL')) {
    const phrases: FormalPhraseEvent[] = (analysis.phrases || []).map(phrase => {
      return {
        phraseIndex: phrase.index,
        role: phrase.formalRole || 'STANDALONE',
        startChordIndex: phrase.startIndex,
        endChordIndex: phrase.endIndex,
        cadenceType: phrase.terminatingCadence?.type || 'NONE',
        cadenceResolution: phrase.terminatingCadence?.resolution?.status || 'NONE'
      };
    });

    const isPeriodBased = analysis.phraseGroups?.some(g => g.type === 'PERIOD') || false;

    fingerprint.layers.formal = {
      phrases,
      isPeriodBased,
      totalPhrases: phrases.length
    };
  }

  // 4. LAYER 4: REGIONAL
  if (layersToCompute.has('REGIONAL')) {
    const homeKey = sourceKey;
    const regionsVisited: string[] = [];
    const transitions: RegionTransition[] = [];

    const mapModalModeToTonalMode = (m: string): 'MAJOR' | 'MINOR' => {
      return ['MAJOR', 'IONIAN', 'LYDIAN', 'MIXOLYDIAN'].includes(m.toUpperCase()) ? 'MAJOR' : 'MINOR';
    };

    const getRelativeRoman = (target: { root: string; mode: string }) => {
      const homeChroma = getChroma(analysis.tonalCenter.root);
      const targetChroma = getChroma(target.root);
      const offset = (targetChroma - homeChroma + 12) % 12;
      
      const targetTonalMode = mapModalModeToTonalMode(target.mode);
      const diatonic = getDiatonicTargetDegree(offset, analysis.tonalCenter.mode);
      if (diatonic) {
        let roman = diatonic.replace(/[°]/g, '');
        if (targetTonalMode === 'MINOR') {
          roman = roman.toLowerCase();
        } else {
          roman = roman.toUpperCase();
        }
        return roman;
      }
      
      const majorChordsFallback: Record<number, string> = {
        0: 'I', 1: 'bII', 2: 'II', 3: 'bIII', 4: 'III', 5: 'IV',
        6: 'bV', 7: 'V', 8: 'bVI', 9: 'VI', 10: 'bVII', 11: 'VII'
      };
      const minorChordsFallback: Record<number, string> = {
        0: 'i', 1: 'bii', 2: 'ii', 3: 'biii', 4: 'iii', 5: 'iv',
        6: 'bv', 7: 'v', 8: 'bvi', 9: 'vi', 10: 'bvii', 11: 'vii'
      };
      
      return targetTonalMode === 'MAJOR' ? majorChordsFallback[offset] : minorChordsFallback[offset];
    };

    // Home key roman representation
    const homeRoman = analysis.tonalCenter.mode === 'MAJOR' ? 'I' : 'i';
    regionsVisited.push(homeRoman);

    const regions = analysis.regions;
    if (regions && regions.length > 0) {
      regions.forEach((region, rIdx) => {
        const relRoman = getRelativeRoman({ root: region.state.root, mode: region.state.mode });
        
        // Add to regions visited list if not last
        if (regionsVisited[regionsVisited.length - 1] !== relRoman) {
          regionsVisited.push(relRoman);
        }

        // Build transition
        if (rIdx > 0) {
          const prevRegion = regions[rIdx - 1];
          const fromRoman = getRelativeRoman({ root: prevRegion.state.root, mode: prevRegion.state.mode });
          
          transitions.push({
            fromRegion: fromRoman,
            toRegion: relRoman,
            startChordIndex: region.startIndex,
            durationInChords: (region.endIndex - region.startIndex) + 1
          });
        } else {
          // Transition from home key if first region starts after index 0
          if (region.startIndex > 0) {
            transitions.push({
              fromRegion: homeRoman,
              toRegion: relRoman,
              startChordIndex: region.startIndex,
              durationInChords: (region.endIndex - region.startIndex) + 1
            });
          }
        }
      });
    }

    fingerprint.layers.regional = {
      homeKey,
      regionsVisited,
      transitions
    };
  }

  // Extensibility placeholders for layers 5-8 (F11 - F14)
  const extendedLayers: Record<string, unknown> = {};
  let hasExtended = false;

  if (layersToCompute.has('FUNCTIONAL_EQUIVALENCE')) {
    extendedLayers.functionalEquivalence = resolveFunctionalEquivalences(analysis);
    hasExtended = true;
  }
  if (layersToCompute.has('VOICE_LEADING')) {
    extendedLayers.voiceLeading = resolveVoiceLeadingNarrative(analysis, options?.tuning);
    hasExtended = true;
  }
  if (layersToCompute.has('APPARENT_FUNCTION')) {
    const feData = (extendedLayers.functionalEquivalence || resolveFunctionalEquivalences(analysis)) as FunctionalEquivalenceLayerData;
    const vlData = (extendedLayers.voiceLeading || resolveVoiceLeadingNarrative(analysis, options?.tuning)) as VoiceLeadingLayerData;
    extendedLayers.apparentFunction = resolveApparentFunctions(analysis, feData, vlData);
    hasExtended = true;
  }
  if (layersToCompute.has('STYLE_EXTENSIONS')) {
    extendedLayers.styleExtensions = { placeholder: true, description: 'F14 style extensions data' };
    hasExtended = true;
  }

  if (hasExtended) {
    fingerprint.layers.extendedLayers = extendedLayers;
  }

  return fingerprint;
}
