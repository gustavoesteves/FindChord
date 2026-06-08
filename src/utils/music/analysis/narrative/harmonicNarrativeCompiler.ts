import type { FunctionalChord } from '../models/FunctionalAnalysis';
import type {
  HarmonicNarrativeFacts,
  HarmonicNarrativeExplanation,
  ChordExplanation,

  PeriodRelationFact,
  StandalonePhraseFact,
  SecondaryDominantPreparationFact,
  PrimaryDominantResolutionFact,
  ModalBorrowingColorationFact,
  RegionalModulationFact,
  PhraseOpeningProlongationFact
} from '../models/HarmonicNarrative';

/**
 * Compila os fatos narrativos estruturados em explicações em linguagem natural (F9B).
 * 
 * @param facts - Fatos harmônicos extraídos do grafo
 * @param chords - Lista de acordes funcionais da progressão
 * @returns HarmonicNarrativeExplanation contendo a visão geral e explicações por acorde
 */
export function compileNarrativeExplanation(
  facts: HarmonicNarrativeFacts,
  chords: FunctionalChord[]
): HarmonicNarrativeExplanation {
  // 1. COMPILAÇÃO DA VISÃO GERAL (OVERVIEW)
  const overviewParts: string[] = [];

  if (facts.overviewFacts.length === 0) {
    overviewParts.push(
      "Esta progressão harmônica apresenta um fluxo contínuo. A condução de vozes e a distribuição das funções harmônicas criam um senso de equilíbrio e coesão diatônica."
    );
  } else {
    facts.overviewFacts.forEach((fact) => {
      if (fact.type === 'PERIOD_RELATION') {
        const f = fact as PeriodRelationFact;
        const periodNamePT = f.periodName === 'Authentic Period' ? 'Período Autêntico' : 
                             f.periodName === 'Half Period' ? 'Período de Meia Cadência' : f.periodName;
        
        overviewParts.push(
          `A progressão está estruturada na forma de um ${periodNamePT}, estabelecendo uma relação formal de pergunta e resposta entre as frases ${f.antecedentPhraseIndex + 1} (Antecedente) e ${f.consequentPhraseIndex + 1} (Consequente). A frase antecedente gera uma expectativa suspensa que é respondida e plenamente resolvida pela frase consequente.`
        );
      } else if (fact.type === 'REGIONAL_MODULATION') {
        const f = fact as RegionalModulationFact;
        let relText: string;

        switch (f.relation) {
          case 'RELATIVE':
            relText = 'relação relativa';
            break;
          case 'PARALLEL':
            relText = 'relação homônima (paralela)';
            break;
          case 'DOMINANT':
            relText = 'relação de dominante (quinto grau)';
            break;
          case 'SUBDOMINANT':
            relText = 'relação de subdominante (quarto grau)';
            break;
          case 'MEDIANT':
            relText = 'relação de mediante';
            break;
          case 'CHROMATIC_MEDIANT':
            relText = 'relação de mediante cromática';
            break;
          case 'TRITONE':
            relText = 'relação de trítono (distante)';
            break;
          default:
            relText = 'região distante';
        }
        
        overviewParts.push(
          `Ocorre uma modulação regional de ${f.fromKey} para ${f.toKey} (${relText}), adicionando contraste dramático e tensão estrutural ao desenvolvimento da música.`
        );
      } else if (fact.type === 'STANDALONE_PHRASE') {
        const f = fact as StandalonePhraseFact;
        overviewParts.push(
          `A Frase ${f.phraseIndex + 1} se comporta como uma estrutura independente e estável, com ponto de partida na tonalidade de ${f.initialKey || 'Tônica'}.`
        );
      }
    });
  }

  const overview = overviewParts.join('\n\n');

  // 2. COMPILAÇÃO DE EXPLICAÇÕES POR ACORDE (CHORD-LEVEL)
  const chordExplanations: ChordExplanation[] = chords.map((chord) => {
    const idx = chord.index;
    const cFacts = facts.chordFacts[idx] || [];

    // Dedução do Papel / Função Principal
    let roleDescription = 'Função de Tônica';
    const functionLabels: Record<string, string> = {
      TONIC: 'Função de Tônica',
      SUBDOMINANT: 'Função de Subdominante',
      DOMINANT: 'Função Dominante'
    };

    if (cFacts.length > 0) {
      const topFact = cFacts[0]; // Ordenados por prioridade decrescente
      switch (topFact.type) {
        case 'SECONDARY_DOMINANT_PREPARATION': {
          const f = topFact as SecondaryDominantPreparationFact;
          if (f.secondaryFunction === 'TRITONE_SUBSTITUTION') {
            roleDescription = 'Substituto de Trítono';
          } else if (f.secondaryFunction === 'SECONDARY_LEADING_TONE') {
            roleDescription = 'Sensível Secundária';
          } else {
            roleDescription = 'Dominante Secundária';
          }
          break;
        }
        case 'PRIMARY_DOMINANT_RESOLUTION': {
          const f = topFact as PrimaryDominantResolutionFact;
          if (f.deceptive) {
            roleDescription = 'Resolução Deceptiva';
          } else if (f.plagal) {
            roleDescription = 'Resolução Plagal';
          } else {
            roleDescription = 'Resolução Autêntica';
          }
          break;
        }
        case 'MODAL_BORROWING_COLORATION':
          roleDescription = 'Empréstimo Modal';
          break;
        case 'CHROMATIC_APPROACH_PASSING':
          roleDescription = 'Aproximação Cromática';
          break;
        case 'PHRASE_OPENING_PROLONGATION':
          roleDescription = 'Prolongamento de Abertura';
          break;
        case 'PHRASE_PRE_CADENTIAL_PREPARATION':
          roleDescription = 'Preparação Pré-Cadencial';
          break;
      }
    } else {
      roleDescription = functionLabels[chord.harmonicFunction] || 'Acorde Diatônico';
    }

    // Compilação do texto detalhado de escolha composicional
    const choiceParts: string[] = [];

    if (cFacts.length === 0) {
      const fnLabel = chord.harmonicFunction === 'TONIC' ? 'tônica (estabilidade e repouso)' :
                      chord.harmonicFunction === 'SUBDOMINANT' ? 'subdominante (afastamento e preparação)' :
                      'dominante (tensão e atração)';
      choiceParts.push(
        `Este acorde desempenha uma função de ${fnLabel} (${chord.romanNumeral}) dentro do campo harmônico local. Ele contribui para o fluxo e direcionamento lógico da progressão diatônica padrão.`
      );
    } else {
      cFacts.forEach((fact) => {
        switch (fact.type) {
          case 'SECONDARY_DOMINANT_PREPARATION': {
            const f = fact as SecondaryDominantPreparationFact;
            const targetChord = chords[f.targetChordIndex];
            const targetText = targetChord ? `${targetChord.chordSymbol} (${targetChord.romanNumeral})` : `grau ${f.targetDegree}`;
            
            if (f.secondaryFunction === 'TRITONE_SUBSTITUTION') {
              choiceParts.push(
                `Atua como um substituto de trítono (subV7) preparando chromaticamente o acorde de destino ${targetText} através de uma resolução suave por meio-tom descendente no baixo.`
              );
            } else if (f.secondaryFunction === 'SECONDARY_LEADING_TONE') {
              choiceParts.push(
                `Atua como uma sensível secundária (vii° ou viiø) gerando uma atração melódica de meio-tom ascendente em direção à fundamental de ${targetText}.`
              );
            } else {
              choiceParts.push(
                `Atua como uma dominante secundária, introduzindo uma tensão passageira não-diatônica com o objetivo de preparar e direcionar o movimento para o acorde de destino ${targetText}.`
              );
            }
            break;
          }
          case 'PRIMARY_DOMINANT_RESOLUTION': {
            const f = fact as PrimaryDominantResolutionFact;
            const targetChord = chords[f.targetChordIndex];
            const targetText = targetChord ? `${targetChord.chordSymbol} (${targetChord.romanNumeral})` : '';

            if (f.deceptive) {
              choiceParts.push(
                `Resolve a tensão da dominante anterior de forma inesperada (resolução deceptiva) em direção ao acorde ${targetText}, prolongando a jornada harmônica em vez de finalizá-la imediatamente.`
              );
            } else if (f.plagal) {
              choiceParts.push(
                `Realiza uma resolução plagal clássica em direção ao acorde ${targetText}, conduzindo a tensão com um caráter solene, estático e repousante.`
              );
            } else {
              choiceParts.push(
                `Realiza uma resolução autêntica, liberando a tensão acumulada da dominante anterior diretamente no acorde de destino estável ${targetText}, gerando forte conclusão e repouso.`
              );
            }
            break;
          }
          case 'MODAL_BORROWING_COLORATION': {
            const f = fact as ModalBorrowingColorationFact;
            // Tradução simples de nomes de modos
            const modeLabelsPT: Record<string, string> = {
              IONIAN: 'Jônio (Maior)',
              DORIAN: 'Dório',
              PHRYGIAN: 'Frígio',
              LYDIAN: 'Lídio',
              MIXOLYDIAN: 'Mixolídio',
              AEOLIAN: 'Eólio (Menor Natural)',
              LOCRIAN: 'Lócrio'
            };
            const modeNamePT = modeLabelsPT[f.sourceMode] || f.modeName;
            choiceParts.push(
              `Este acorde é um empréstimo modal (A.C.M.) importado do modo homônimo de ${modeNamePT}. Ele introduz uma coloração expressiva e dramática, alterando momentaneamente a sonoridade diatônica da tonalidade principal.`
            );
            break;
          }
          case 'CHROMATIC_APPROACH_PASSING':
            choiceParts.push(
              `Atua como uma aproximação linear ou diminuto de passagem, servindo como ponte de condução de vozes para suavizar e ligar a progressão entre os acordes vizinhos.`
            );
            break;
          case 'PHRASE_OPENING_PROLONGATION': {
            const f = fact as PhraseOpeningProlongationFact;
            choiceParts.push(
              `Atua no prolongamento e estabilização da tonalidade em ${f.keyCenter || 'Tônica'}. Ele estabelece a fundação da frase harmônica, proporcionando estabilidade inicial e preparando o ouvinte para a movimentação seguinte.`
            );
            break;
          }
          case 'PHRASE_PRE_CADENTIAL_PREPARATION':
            choiceParts.push(
              `Atua na preparação pré-cadencial (função de subdominante/afastamento). Ele inicia o acúmulo de energia harmônica necessário para impulsionar a progressão rumo à área de tensão cadencial.`
            );
            break;
        }
      });
    }

    const compositionalChoice = choiceParts.join(' ');

    return {
      index: idx,
      chordSymbol: chord.chordSymbol,
      facts: cFacts,
      roleDescription,
      compositionalChoice
    };
  });

  return {
    overview,
    chords: chordExplanations
  };
}
