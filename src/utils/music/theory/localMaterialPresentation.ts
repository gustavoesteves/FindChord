import { Note as TonalNote } from "tonal";

export interface LocalMaterialSourceDescription {
  desc: string;
  mood: string;
  tip: string;
}

export interface LocalMaterialSuggestedLine {
  name: string;
  theoryDesc: string;
  intervals: string[];
}

const DEFAULT_SOURCE_DESCRIPTION: LocalMaterialSourceDescription = {
  desc: "Material melodico ligado ao acorde, com apoios e cores para explorar no instrumento.",
  mood: "Combinação harmônica fluida.",
  tip: "Comece pelos apoios do acorde e abra as cores quando a frase pedir."
};

const SOURCE_DESCRIPTIONS: Record<string, LocalMaterialSourceDescription> = {
  major: {
    desc: "Jônio (Maior Padrão) — A base de toda a harmonia ocidental clássica.",
    mood: "Claro, resoluto, brilhante e estável.",
    tip: "Funciona bem para repouso tonal direto. Evite sustentar a 4ª justa contra a terça maior quando quiser estabilidade."
  },
  lydian: {
    desc: "Lídio — O quarto modo da escala maior, com uma 4ª aumentada (#11).",
    mood: "Aberto, suspenso e estável com brilho modal.",
    tip: "Explore a #11 (4ª aumentada) como cor de suspensão sem enfraquecer a terça maior."
  },
  mixolydian: {
    desc: "Mixolídio — O quinto modo da escala maior, contendo a marcante 7ª menor (b7).",
    mood: "Aberto, direcional e dominante sem alteração forte.",
    tip: "Acentue a 7ª menor (b7) para deixar clara a função dominante sem aumentar demais a tensão."
  },
  dorian: {
    desc: "Dórico — Segundo modo da escala maior, caracterizado pela 6ª maior (13).",
    mood: "Melancólico, sofisticado, moderno, misterioso e suingado.",
    tip: "A 6ª maior é a cor decisiva. Use-a para diferenciar o menor dórico do menor natural."
  },
  aeolian: {
    desc: "Eólio (Menor Natural) — O clássico modo menor natural da música tonal.",
    mood: "Escuro, denso e expressivo.",
    tip: "Use a 6ª menor como cor característica quando quiser manter uma sonoridade menor natural."
  },
  phrygian: {
    desc: "Frígio — Terceiro modo da escala maior, caracterizado pela 2ª menor (b9).",
    mood: "Sombrio, fechado e tenso.",
    tip: "A 2ª menor (b9) é a cor decisiva. Use-a com cuidado quando quiser tensão modal logo acima da tônica."
  },
  locrian: {
    desc: "Lócrio — O sétimo modo da escala maior, tenso e instável devido à 5ª diminuta (b5).",
    mood: "Instável, tenso, sombrio e misterioso.",
    tip: "Use sobre o acorde meio-diminuto (m7b5) quando quiser enfatizar instabilidade antes da resolução."
  },
  pentatonic: {
    desc: "Pentatônica Maior — Escala de 5 notas sem intervalos de semitom.",
    mood: "Fluida, aberta, estável e direta.",
    tip: "Por evitar semitons internos, cria linhas simples e claras. Use como material de repouso ou simplificação melódica."
  },
  "minor pentatonic": {
    desc: "Pentatônica Menor — Escala menor de 5 notas sem semitons internos.",
    mood: "Direta, expressiva e concentrada.",
    tip: "A terça menor pode funcionar como cor expressiva ou aproximação para a terça maior do acorde de fundo."
  },
  blues: {
    desc: "Escala de Blues — Pentatônica menor enriquecida pela blue note (b5).",
    mood: "Sofrida, maliciosa, expressiva, clássica e autêntica.",
    tip: "Use a blue note (b5) como passagem cromática entre a 4ª justa e a 5ª justa."
  },
  "melodic minor": {
    desc: "Menor Melódica — Escala menor com 6ª e 7ª maiores ascendentes.",
    mood: "Intrigante, moderna, sofisticada e ambígua.",
    tip: "Muito usada para improvisar sobre acordes menor/maior ou para desenhar tensões modernas de fusão."
  },
  "phrygian dominant": {
    desc: "Frígio Dominante — O 5º modo da escala menor harmônica.",
    mood: "Assimétrico, tenso e direcional para centros menores.",
    tip: "Funciona sobre acordes dominantes secundários que resolvem em acordes menores (V7 -> im)."
  },
  altered: {
    desc: "Escala Alterada — A escala superlócria (7º modo da menor melódica).",
    mood: "Tensa, cromática, sofisticada e direcional.",
    tip: "Use tensões alteradas (b9, #9, b5, #5) sobre dominantes antes de resolver no acorde de chegada."
  },
  "lydian dominant": {
    desc: "Lídio Dominante — Escala mixolídia com a 4ª aumentada (#11).",
    mood: "Moderna, sofisticada, brilhante e misteriosa.",
    tip: "Use sobre dominantes não-funcionais ou dominantes por substituição quando quiser #11 com 7ª menor."
  },
  "bebop major": {
    desc: "Bebop Maior — Escala maior com uma nota de passagem cromática (#5/b6) adicionada.",
    mood: "Fluida, clássica de swing e improvisação tradicional.",
    tip: "A nota de passagem cromática ajuda as notas de arpejo a caírem nas batidas fortes."
  },
  bebop: {
    desc: "Bebop Dominante — Escala mixolídia com uma 7ª maior de passagem cromática.",
    mood: "Ágil, linear e cromática.",
    tip: "Use para descer linhas rápidas sobre acordes dominantes mantendo direção rítmica clara."
  },
  diminished: {
    desc: "Diminuta Tom/Semitom — Escala simétrica de 8 notas alternando tons e semitons.",
    mood: "Simétrica, instável e de forte tensão.",
    tip: "Aplique sobre acordes diminutos para criar desenhos simétricos que se deslocam por terças menores."
  },
  "half-whole diminished": {
    desc: "Diminuta Semitom/Tom (Dom-Dim) — Alterna semitons e tons a partir da tônica.",
    mood: "Altamente tensa, intrigante, sofisticada e simétrica.",
    tip: "Recurso forte sobre dominantes estáticos, gerando b9, #9, #11 e 13 em uma única coleção."
  },
  "dominant diminished axis": {
    desc: "Eixo diminuto dominante — Dominantes separados por terças menores, com ii menores relacionados como vocabulário de tensão.",
    mood: "Tensão organizada, cromática e expansiva.",
    tip: "Use os ii menores do eixo como degraus de tensão e volte às notas-guia do dominante para estabilizar."
  },
  "side slip minor pentatonic": {
    desc: "Side slip pentatônico — Deslocamento de pentatônica menor meio tom para fora antes de retornar ao acorde.",
    mood: "Externo, direto e de alto contraste.",
    tip: "Toque o deslocamento como gesto breve. O efeito depende de voltar com clareza aos apoios do acorde."
  },
  "minor dorian pentatonic stack": {
    desc: "Pilha pentatônica dórica — Pentatônicas menores da tônica, quinta e segundo grau para abrir 9, 11 e 13.",
    mood: "Menor modal, fluido e expansivo sem perder repouso.",
    tip: "Comece na pentatônica menor da tônica; use as outras como abertura de cor e retorne à terça menor."
  },
  "sus quartal pentatonic": {
    desc: "Sus quartal/pentatônico — Empilhamento de quartas e pentatônica sus para manter a suspensão como centro.",
    mood: "Aberto, modal, suspenso e estável sem terça definida.",
    tip: "Use a quarta como identidade. A b7 e a 9 podem colorir o vamp sem forçar resolução para maior ou menor."
  },
  "half diminished upper structures": {
    desc: "Estruturas meio-diminutas — Arpejo ø7 com 9 natural e extensões da coleção lócria #2.",
    mood: "Instável, refinado e sombrio, mas tocável como cor local.",
    tip: "Apoie b3, b5 e b7; abra a 9 natural quando quiser sofisticação sem escolher ainda um acorde de chegada."
  },
  "diminished symmetric cycle": {
    desc: "Ciclo diminuto simétrico — O mesmo arpejo dim7 repetido por terças menores.",
    mood: "Simétrico, suspenso e instável com tensão controlada.",
    tip: "Explore o deslocamento por terças menores. Cada ponto de partida preserva a mesma coleção de notas."
  },
  "augmented whole tone cycle": {
    desc: "Ciclo aumentado/tom inteiro — Tríades aumentadas e fragmentos de tons inteiros dentro da mesma coleção simétrica.",
    mood: "Flutuante, brilhante e instável, com tensão sem gravidade tonal forte.",
    tip: "Use como cor breve ou vamp suspenso. A força do material está na simetria, não em uma resolução obrigatória."
  },
  "major upper triad colors": {
    desc: "Tríades superiores maiores — Arpejo da tônica com tríades do II e V grau para abrir 9, #11, 13 e 7M.",
    mood: "Luminoso, lídio e estável, com cor moderna sem perder repouso.",
    tip: "Use a tríade do II grau para brilho #11 e a do V grau para reforçar repouso sem tocar apenas o acorde básico."
  },
  "dominant upper triad colors": {
    desc: "Tríades superiores dominantes — Arpejo 7 com tríades naturais para colorir 9, 11, 13 e b7.",
    mood: "Dominante aberto, blues/modal e direcional sem alteração pesada.",
    tip: "Use as tríades sobre 5, b7 e 9 para criar movimento sem sair do dominante natural."
  },
  "minor major melodic colors": {
    desc: "Cores menor-maior melódicas — Arpejo m(maj7) com tríades do II menor e V maior.",
    mood: "Menor sofisticado, cinematográfico e suspenso pela sétima maior.",
    tip: "Preserve a tensão entre b3 e 7M. Abra 9, 11 e 13 como cor melódica sem transformar o acorde em menor dórico."
  },
  "power riff pentatonic axis": {
    desc: "Eixo pentatônico power — Tônica e quinta como âncora, com pentatônicas maior e menor como escolhas expressivas.",
    mood: "Direto, físico e ambíguo entre maior e menor.",
    tip: "Mantenha 1 e 5 como centro. Use b3 ou 3 como cor de frase, não como definição obrigatória do acorde."
  }
};

const SUGGESTED_LINES: Record<string, LocalMaterialSuggestedLine> = {
  major: {
    name: "Contorno maior descendente",
    theoryDesc: "Conecta a sétima maior descendo linearmente até a terça, com a 11 como passagem rápida.",
    intervals: ["7M", "6M", "5P", "4P", "3M", "2M", "1P"]
  },
  lydian: {
    name: "Ascensão pela #11",
    theoryDesc: "Destaca a #11 como cor suspensa, subindo em direção à estabilidade da quinta e da tônica.",
    intervals: ["1P", "3M", "4A", "5P", "7M", "6M", "8P"]
  },
  mixolydian: {
    name: "Dominante com aproximação",
    theoryDesc: "Conecta a sétima menor com a terça maior através de aproximações melódicas cromáticas.",
    intervals: ["3M", "2M", "1P", "7m", "6M", "5P", "8P"]
  },
  dorian: {
    name: "Menor com 6ª maior",
    theoryDesc: "Enfatiza a sexta maior como assinatura modal do modo dórico.",
    intervals: ["1P", "3m", "5P", "6M", "7m", "6M", "5P"]
  },
  aeolian: {
    name: "Arpejo Menor Natural Dramático",
    theoryDesc: "Marca tônica e terça antes de apoiar na carga dramática da sexta menor.",
    intervals: ["1P", "3m", "5P", "6m", "5P", "3m", "1P"]
  },
  phrygian: {
    name: "Tensão da b9 para tônica",
    theoryDesc: "Inicia na segunda menor e resolve passo a passo na tônica.",
    intervals: ["2m", "1P", "7m", "6m", "5P", "3m", "1P"]
  },
  locrian: {
    name: "Contorno meio-diminuto",
    theoryDesc: "Contorna a quinta diminuta para criar instabilidade antes da resolução.",
    intervals: ["1P", "3m", "5d", "7m", "8P", "5d", "1P"]
  },
  "dominant diminished axis": {
    name: "Eixo por ii menores",
    theoryDesc: "Abre o dominante pelo ii menor relacionado e fecha voltando às notas-guia do acorde.",
    intervals: ["5P", "7m", "9M", "11P", "7m", "3M", "1P"]
  },
  "side slip minor pentatonic": {
    name: "Pentatônica fora e volta",
    theoryDesc: "Desloca a pentatônica menor meio tom para fora e retorna para a terça e a tônica.",
    intervals: ["4A", "6M", "7M", "1A", "3M", "1P"]
  },
  "minor dorian pentatonic stack": {
    name: "Pentatônicas dóricas",
    theoryDesc: "Abre o menor por pentatônicas relacionadas e volta para a terça menor como identidade do acorde.",
    intervals: ["1P", "3m", "4P", "5P", "7m", "9M", "11P", "13M", "5P", "3m"]
  },
  "sus quartal pentatonic": {
    name: "Quartas sobre sus",
    theoryDesc: "Sustenta a quarta e move por células quartais para preservar a abertura do acorde.",
    intervals: ["1P", "4P", "7m", "9M", "5P", "8P", "5P", "4P", "1P"]
  },
  "half diminished upper structures": {
    name: "ø7 com 9 natural",
    theoryDesc: "Afirma o arpejo meio-diminuto e abre a 9 natural como cor antes de voltar para b5 e b3.",
    intervals: ["1P", "3m", "5d", "7m", "9M", "11P", "6m", "5d", "3m"]
  },
  "diminished symmetric cycle": {
    name: "Ciclo por terças menores",
    theoryDesc: "Repete o arpejo diminuto por terças menores para mostrar a simetria do acorde.",
    intervals: ["1P", "3m", "5d", "7d", "10m", "12d", "13M", "15P"]
  },
  "augmented whole tone cycle": {
    name: "Tríades aumentadas",
    theoryDesc: "Alterna a tríade aumentada do acorde com a tríade um tom acima e percorre tons inteiros.",
    intervals: ["1P", "3M", "5A", "9M", "11A", "7m", "5A", "3M", "1P"]
  },
  "major upper triad colors": {
    name: "Tríades superiores maiores",
    theoryDesc: "Sai do arpejo maior para a tríade do II grau e retorna pela tríade do V.",
    intervals: ["1P", "3M", "5P", "7M", "9M", "11A", "13M", "5P", "7M", "9M", "8P"]
  },
  "dominant upper triad colors": {
    name: "Tríades naturais do dominante",
    theoryDesc: "Afirma o acorde 7 e abre cores naturais por tríades sobre 5, b7 e 9.",
    intervals: ["1P", "3M", "5P", "7m", "9M", "11P", "13M", "7m", "5P", "3M", "1P"]
  },
  "minor major melodic colors": {
    name: "Menor-maior melódico",
    theoryDesc: "Mostra a tensão b3/7M e abre a cor por tríades de II menor e V maior.",
    intervals: ["1P", "3m", "5P", "7M", "9M", "11P", "13M", "5P", "7M", "9M", "8P"]
  },
  "power riff pentatonic axis": {
    name: "Riff pentatônico power",
    theoryDesc: "Afirma tônica e quinta, toca a cor menor e responde com a cor maior sem fechar a terça do acorde.",
    intervals: ["1P", "5P", "8P", "7m", "5P", "3m", "1P", "2M", "3M", "5P", "1P"]
  }
};

export function describeLocalMaterialSource(sourceType: string): LocalMaterialSourceDescription {
  return SOURCE_DESCRIPTIONS[sourceType]
    ?? SOURCE_DESCRIPTIONS[
      Object.keys(SOURCE_DESCRIPTIONS)
        .sort((a, b) => b.length - a.length)
        .find(key => sourceType.includes(key)) || ""
    ]
    ?? DEFAULT_SOURCE_DESCRIPTION;
}

export function suggestedLineForLocalMaterial(sourceType: string): LocalMaterialSuggestedLine | undefined {
  return SUGGESTED_LINES[sourceType];
}

export function notesForLocalMaterialLine(root: string, intervals: string[]): string[] {
  return intervals.map(interval => (
    TonalNote.simplify(TonalNote.transpose(`${root}4`, interval))
  ));
}
