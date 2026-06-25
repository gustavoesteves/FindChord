// @ts-nocheck
import { Chord, Interval } from "tonal";
import type { HarmonicPerspective, ValidationObservation, MusicalInterpretation, VoiceLeadingScore, MelodyExtractionResult } from "../models/SuggestedRoute";
import type { ParsedScore, ParsedNote } from "../models/ParsedScore";

interface WeightedNote {
  pitchClass: string; // Ex: 'C', 'C#', 'D'
  weight: number; // 0.0 to 1.0
  sourceNote: ParsedNote;
}

export class RouteScoringEngine {
  
  // Tonal.js naive chroma calculation for MVP
  private static chromaOf(note: string): number {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const n = note.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#');
    return notes.indexOf(n) !== -1 ? notes.indexOf(n) : 0;
  }
  
  public static scorePerspective(
    perspective: HarmonicPerspective,
    context: ParsedScore | null,
    melody: MelodyExtractionResult
  ): HarmonicPerspective {
    
    const observations: ValidationObservation[] = [];
    
    let totalInteractionScore = 100;
    let totalSmoothness = 100;
    let totalBassCoherence = 100;
    let totalPlausibility = 100;
    
    // Default baseline if no context is available
    if (!context) {
      perspective.voiceLeadingScore = {
        smoothness: 100,
        melodicCompatibility: 100,
        bassCoherence: 100,
        harmonicPlausibility: 100,
        overall: 100
      };
      perspective.observations = [];
      return perspective;
    }

    let previousRoot: string | null = null;
    let previousSuggestedRoot: string | null = null;

    let currentTick = perspective.affectedTicks.start;

    for (const example of perspective.examples) {
      const parsedSuggested = Chord.get(example.suggested);
      if (parsedSuggested.empty || !parsedSuggested.root) {
        currentTick += 1920;
        continue;
      }

      // 1. Melodic Interaction against MelodyConstraint
      const chordEndTick = currentTick + 1920;
      const overlappingMelodyNotes = melody.notes.filter(n => n.tickStart < chordEndTick && n.tickEnd > currentTick);
      
      const weightedNotes = overlappingMelodyNotes.map(n => ({
        pitchClass: n.pitchClass,
        weight: 1.0, // Simplification
        sourceNote: { step: n.pitchClass.charAt(0), alter: n.pitchClass.includes('#') ? 1 : n.pitchClass.includes('b') ? -1 : 0 } as any
      }));

      const { score: mScore, obs: mObs } = this.analyzeMelodicInteraction(parsedSuggested, weightedNotes);
      totalInteractionScore = Math.min(totalInteractionScore, mScore); 
      observations.push(...mObs);

      // 2. Voice Leading & Bass
      if (previousRoot && previousSuggestedRoot) {
        const { score: vlScore, obs: vlObs } = this.analyzeVoiceLeading(previousSuggestedRoot, parsedSuggested.root);
        totalSmoothness = Math.min(totalSmoothness, vlScore);
        
        // Basic Bass Coherence check
        const bassDist = Interval.distance(previousSuggestedRoot, parsedSuggested.root);
        if (bassDist && (bassDist.includes('A') || bassDist.includes('d'))) {
          totalBassCoherence -= 10;
          observations.push({ type: 'FRICTION', severity: 'MEDIUM', description: `Salto dissonante no baixo: ${previousSuggestedRoot} -> ${parsedSuggested.root}` });
        }

        observations.push(...vlObs);
      }
      
      // 3. Harmonic Plausibility (Punish extremely chaotic progression)
      // (Using riskLevel as a base heuristic for now, plus unexpected non-diatonic jumps)
      if (perspective.riskLevel === 'HIGH') {
        totalPlausibility -= 15;
      } else if (perspective.riskLevel === 'MEDIUM') {
        totalPlausibility -= 5;
      }

      previousRoot = Chord.get(example.original).root || null;
      previousSuggestedRoot = parsedSuggested.root;
      currentTick = chordEndTick;
    }

    const vlScore: VoiceLeadingScore = {
      smoothness: Math.max(0, totalSmoothness),
      melodicCompatibility: Math.max(0, totalInteractionScore),
      bassCoherence: Math.max(0, totalBassCoherence),
      harmonicPlausibility: Math.max(0, totalPlausibility),
      overall: 0
    };

    // Calculate overall using a weighted average
    vlScore.overall = Math.round((vlScore.smoothness * 0.25) + (vlScore.melodicCompatibility * 0.40) + (vlScore.bassCoherence * 0.15) + (vlScore.harmonicPlausibility * 0.20));

    perspective.voiceLeadingScore = vlScore;
    // For backwards compat
    perspective.melodicInteractionScore = vlScore.melodicCompatibility;
    
    perspective.observations = observations;

    return perspective;
  }

  private static getOverlappingNotes(notes: ParsedNote[], tickStart: number, tickEnd: number): ParsedNote[] {
    return notes.filter(n => n.tickStart < tickEnd && n.tickEnd > tickStart);
  }

  private static weightNotes(notes: ParsedNote[], chordTickStart: number): WeightedNote[] {
    return notes.map(n => {
      let weight = 0.5; // Base weight

      // Duração da nota influencia no peso
      if (n.durationTicks > 480) weight += 0.2; // Nota longa (> semínima)

      // Downbeat (se começa exatamente com o acorde)
      if (Math.abs(n.tickStart - chordTickStart) < 20) {
        weight += 0.3;
      }

      return {
        pitchClass: n.step + (n.alter === 1 ? '#' : n.alter === -1 ? 'b' : ''),
        weight: Math.min(1.0, weight),
        sourceNote: n
      };
    });
  }

  private static analyzeMelodicInteraction(
    parsedChord: ReturnType<typeof Chord.get>,
    notes: WeightedNote[]
  ): { score: number; obs: ValidationObservation[] } {
    let score = 100;
    const obs: ValidationObservation[] = [];
    const processedPitchClasses = new Set<string>();

    const root = parsedChord.root || 'C';
    const chordLabel = parsedChord.name || parsedChord.aliases[0] || parsedChord.root || 'o acorde';

    for (const wn of notes) {
      if (processedPitchClasses.has(wn.pitchClass)) continue;
      processedPitchClasses.add(wn.pitchClass);

      // F13.4: Análise Ortográfica Funcional usando Tonal
      let dist = Interval.distance(root, wn.pitchClass);
      if (!dist) dist = "1P"; // fallback seguro
      let simpleInterval = Interval.simplify(dist);

      let interpretation: MusicalInterpretation | null = null;

      switch (simpleInterval) {
        case '1P':
        case '8P':
          if (wn.weight >= 0.6) {
            interpretation = { intervalClass: 'UNISON', relation: 'CHORD_TONE', severity: 'LOW', message: `Melodia repousa sobre nota estrutural (${wn.pitchClass}) do acorde.` };
          }
          break;
        case '3m':
        case '3M':
        case '5P':
        case '7m':
        case '7M':
          if (wn.weight >= 0.6) {
            const iClass = simpleInterval.includes('3') ? (simpleInterval === '3M' ? 'MAJOR_THIRD' : 'MINOR_THIRD') : simpleInterval === '5P' ? 'PERFECT_FIFTH' : (simpleInterval === '7M' ? 'MAJOR_SEVENTH' : 'MINOR_SEVENTH');
            interpretation = { intervalClass: iClass, relation: 'CHORD_TONE', severity: 'LOW', message: `Melodia repousa sobre nota estrutural (${wn.pitchClass}) do acorde.` };
          }
          break;
        case '2M':
        case '6M':
          interpretation = { intervalClass: simpleInterval === '2M' ? 'MAJOR_SECOND' : 'MAJOR_SIXTH', relation: 'EXTENSION', severity: 'LOW', message: `Melodia adiciona extensão consonante (${wn.pitchClass}).` };
          break;
        case '4A': // #11
          score -= 5;
          interpretation = { intervalClass: 'TRITONE', relation: 'UNSTABLE_COLOR', severity: 'MEDIUM', message: `A melodia enfatiza ${wn.pitchClass} sobre ${chordLabel}.\n\nInterpretação:\n#11 implícita.\n\nImpacto:\nAumenta a tensão cromática\nsem comprometer a estabilidade da frase.` };
          break;
        case '5d': // b5
          score -= 5;
          interpretation = { intervalClass: 'TRITONE', relation: 'UNSTABLE_COLOR', severity: 'MEDIUM', message: `A melodia enfatiza a b5 (${wn.pitchClass}) sobre ${chordLabel}.\n\nA sonoridade adiciona instabilidade de cor diminuta.` };
          break;
        case '6m': // b13
          interpretation = { intervalClass: 'MINOR_SIXTH', relation: 'UNSTABLE_COLOR', severity: 'MEDIUM', message: `A melodia cria uma b13 implícita sobre o acorde.\n\nA sonoridade adiciona instabilidade e cor de resolução.` };
          break;
        case '5A': // #5
          interpretation = { intervalClass: 'MINOR_SIXTH', relation: 'UNSTABLE_COLOR', severity: 'MEDIUM', message: `A melodia sugere uma #5 (${wn.pitchClass}).\n\nA sonoridade traz tensão aumentada e propulsão de movimento.` };
          break;
        case '4P':
          if (wn.weight >= 0.7) {
            score -= 10;
            interpretation = { intervalClass: 'PERFECT_FOURTH', relation: 'FRICTION', severity: 'MEDIUM', message: `Melodia repousa sobre uma 4ª justa (${wn.pitchClass})\ncontra a 3ª do acorde.\n\nA sonoridade tende a pedir resolução.` };
          }
          break;
        case '2m': // b9
          if (wn.weight >= 0.7) {
            score -= 15;
            interpretation = { intervalClass: 'MINOR_SECOND', relation: 'CLASH', severity: 'HIGH', message: `Atrito severo (b9) da melodia contra a raiz do acorde.` };
          } else {
            interpretation = { intervalClass: 'MINOR_SECOND', relation: 'UNSTABLE_COLOR', severity: 'LOW', message: `Tensão passageira de b9 na melodia.` };
          }
          break;
        case '1A': // #1
          if (wn.weight >= 0.7) {
            score -= 5;
            interpretation = { intervalClass: 'MINOR_SECOND', relation: 'FRICTION', severity: 'MEDIUM', message: `A melodia enfatiza uma fundamental aumentada (#1), gerando atrito cromático com a raiz.` };
          } else {
            interpretation = { intervalClass: 'MINOR_SECOND', relation: 'UNSTABLE_COLOR', severity: 'LOW', message: `Tensão cromática passageira (#1) na melodia.` };
          }
          break;
      }

      if (interpretation) {
        obs.push({
          type: interpretation.relation,
          severity: interpretation.severity,
          description: interpretation.message
        });
      }
    }

    return { score, obs };
  }

  private static analyzeVoiceLeading(
    suggestedPrevRoot: string,
    suggestedCurrentRoot: string
  ): { score: number; obs: ValidationObservation[] } {
    const obs: ValidationObservation[] = [];
    let score = 100;

    const c1 = this.chromaOf(suggestedPrevRoot);
    const c2 = this.chromaOf(suggestedCurrentRoot);
    
    // Directional calculation
    const diffUp = (c2 - c1 + 12) % 12;
    const diffDown = (c1 - c2 + 12) % 12;
    const minDiff = Math.min(diffUp, diffDown);

    if (minDiff === 0) {
      obs.push({
        type: 'PEDAL',
        severity: 'LOW',
        description: `✔ Pedal preservado (baixo estático em ${suggestedCurrentRoot}).`
      });
    } else if (diffDown === 1 || diffUp === 1) {
      obs.push({
        type: 'CHROMATIC_RESOLUTION',
        severity: 'LOW',
        description: `✔ Resolução cromática (${diffDown === 1 ? 'descendente' : 'ascendente'}) para ${suggestedCurrentRoot}.`
      });
    } else if (minDiff === 2) {
      obs.push({
        type: 'STEPWISE',
        severity: 'LOW',
        description: `✔ Movimento conjunto no baixo para ${suggestedCurrentRoot}.`
      });
    } else if (minDiff === 5 || minDiff === 7) {
      obs.push({
        type: 'FUNCTIONAL',
        severity: 'LOW',
        description: `✔ Movimento funcional (salto de quarta/quinta) no baixo para ${suggestedCurrentRoot}.`
      });
    } else if (minDiff === 6) {
      score -= 5;
      obs.push({
        type: 'TRITONE_LEAP',
        severity: 'MEDIUM',
        description: `⚠ Salto de trítono no baixo (${suggestedPrevRoot} → ${suggestedCurrentRoot}).`
      });
    } else {
      score -= 10;
      obs.push({
        type: 'ABRUPT',
        severity: 'MEDIUM',
        description: `⚠ Movimento abrupto do baixo (${suggestedPrevRoot} → ${suggestedCurrentRoot}).`
      });
    }

    return { score, obs };
  }
}
