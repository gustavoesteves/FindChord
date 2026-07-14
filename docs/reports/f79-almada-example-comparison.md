# F79 - Comparacao com o exemplo de rearmonizacao de Carlos Almada

Esta auditoria contrasta a melodia em `docs/musics/exemplo.musicxml` com as harmonizacoes resumidas em `docs/theory/almada_examples.md`.

A comparacao nao tenta exigir copia literal do Almada. Ela mede se o motor cobre a familia harmonica do exemplo, a densidade aproximada e os recursos de vocabulario envolvidos.

## Leitura geral

- Propostas geradas pelo motor: 18
- Exemplos cobertos: 8
- Familias parcialmente contempladas: 4
- Lacunas praticas de vocabulario: 0

## Propostas do motor

| Rank | Papel | Camada | Proposta | Rota | Cifras | Baixo |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | primary | reharmonization | Estratégia — Tonal Clássico | conservative | Cmaj7 / Fmaj7 / G13 / Cmaj7 | C -> F -> G -> C |
| 2 | alternative | reharmonization | Estratégia — Dominantes alteradas | chromatic | C / C7(b9) / Fmaj7 / D7(b13)/F# / G7 / Cmaj7 | C -> C -> F -> F# -> G -> C |
| 3 | alternative | reharmonization | Estratégia — Dominantes secundárias | chromatic | C / C7 / Fmaj7 / D7/F# / G7 / Cmaj7 | C -> C -> F -> F# -> G -> C |
| 4 | alternative | reharmonization | Estratégia — Ciclo de dominantes alteradas | chromatic | C / A7(b9)/C# / Dm / D7alt / G13 / G7(b13,b9) / C6 | C -> C# -> D -> D -> G -> G -> C |
| 5 | alternative | reharmonization | Estratégia — Mistura modal densa | chromatic | Abmaj7 / Cmaj7/G / F#m7b5 / Fm7 / Em7 / G7/F / Cmaj7 | Ab -> G -> F# -> F -> E -> F -> C |
| 6 | adventurous | reharmonization | Estratégia — Contraponto de Baixo | radical | Cmaj7 / Fmaj7 / G7/D / G7 / Cmaj7 | C -> F -> D -> G -> C |
| 7 | alternative | reharmonization | Estratégia — Função aparente | chromatic | C / Am / F / F/C / Bm7b5 / Dm6 / G7 / C | C -> A -> F -> C -> B -> D -> G -> C |
| 8 | alternative | reharmonization | Estratégia — Expansão funcional diatônica | chromatic | C / Am / F / F/C / Bm7b5 / G7 / C | C -> A -> F -> C -> B -> G -> C |
| 9 | alternative | reharmonization | Estratégia — Função aparente | chromatic | C / Am / F#m7(b5) / F/C / Bm7b5 / G7 / C | C -> A -> F# -> C -> B -> G -> C |
| 10 | alternative | reharmonization | Estratégia — Diminutos de passagem | chromatic | C / Edim7 / Dm/F / F#dim7 / Cmaj7/G / G7 / C | C -> E -> F -> F# -> G -> G -> C |
| 11 | adventurous | reharmonization | Estratégia — Chegada deceptiva cromática | chromatic | Ebmaj7 / Em7b5 / F6 / Fm6 / D7(b5)/F# / G7 / G#dim7 / Am7 | Eb -> E -> F -> F -> F# -> G -> G# -> A |
| 12 | alternative | reharmonization | Estratégia — Cromático Linear | chromatic | Cdim7 / F#dim7/Db / Bm7b5/D / G7 | C -> Db -> D -> G |
| 13 | alternative | reharmonization | Estratégia — Função aparente | chromatic | C / Am / F / F/C / Bm7b5 / Bdim / C | C -> A -> F -> C -> B -> B -> C |
| 14 | alternative | reharmonization | Estratégia — Cadência plagal menor | chromatic | Cm7 / Dbdim7 / Dm7 / Bb7 / Bm7/F# / G7/F / C/E / Fm / C | C -> Db -> D -> Bb -> F# -> F -> E -> F -> C |
| 15 | alternative | basic | Estratégia — Harmonia básica I-IV-V | conservative | C / F / G / C | C -> F -> G -> C |
| 16 | adventurous | reharmonization | Estratégia — Cromático Linear | chromatic | Cdim7 / F#dim7/Db / Bm7b5/Db / G7/D | C -> Db -> Db -> D |
| 17 | alternative | reharmonization | Estratégia — Cromatismo de vizinhança | chromatic | C / Cdim7 / C / Dbdim7 / F/C / Eb7/Db / Dm7b5 / Abmaj7/Eb / Db7 / Dbmaj7 / Cmaj7 | C -> C -> C -> Db -> C -> Db -> D -> Eb -> Db -> Db -> C |
| 18 | adventurous | reharmonization | Estratégia — SubV funcional | radical | C / Am / Gb7/Bb / F/A / F/C / Bm7b5 / Ab7/C / G7/B / Db7 / C | C -> A -> Bb -> A -> C -> B -> C -> B -> Db -> C |

## Contraste com Almada

| Ex. | Familia | Referencia Almada | Melhor proposta do motor | Cifras | Recursos | Afinidade | Densidade | Estado | Nota |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| b | harmonia basica funcional | C / F / G / C | Estratégia — Harmonia básica I-IV-V (alternative): C / F / G / C | 100% | 100% | 100% | 0 | covered | Base I-IV-V diretamente contemplada. |
| c | expansao diatonica e cadencia ii-V-I | C / Am / Dm / Dm/C / Bm7(b5) / G7 / C | Estratégia — Expansão funcional diatônica (alternative): C / Am / F / F/C / Bm7b5 / G7 / C | 71% | 100% | 84% | 0 | covered | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| d | dominantes secundarias e preparacao cromatica | C / C7 / F7M / D7/F# / G7 / C7M | Estratégia — Dominantes secundárias (alternative): C / C7 / Fmaj7 / D7/F# / G7 / Cmaj7 | 100% | 100% | 100% | 0 | covered | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| e | dominantes secundarias com dominante alterada | C6 / A7 / Dm7 / D7 / G7+ / C6 | Estratégia — Ciclo de dominantes alteradas (alternative): C / A7(b9)/C# / Dm / D7alt / G13 / G7(b13,b9) / C6 | 33% | 100% | 63% | 1 | partial | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| f | ciclo funcional e cadencias locais | C / Gm7 / C7 / F / Am7 / D7 / Dm7 / G7 / C | Estratégia — Cadência plagal menor (alternative): Cm7 / Dbdim7 / Dm7 / Bb7 / Bm7/F# / G7/F / C/E / Fm / C | 44% | 100% | 69% | 0 | partial | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| g | dominantes estendidas e alteradas | Em7(b5) / A7(b9) / Am7 / D7alt / G7(9) / G7(b13 b9) / C7M(9) | Estratégia — Ciclo de dominantes alteradas (alternative): C / A7(b9)/C# / Dm / D7alt / G13 / G7(b13,b9) / C6 | 29% | 100% | 61% | 0 | partial | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |
| h | substituicoes por tritono | C6 / Gb7 / F7M / Ab7 / G7 / Db7 / C7M | Estratégia — SubV funcional (adventurous): C / Am / Gb7/Bb / F/A / F/C / Bm7b5 / Ab7/C / G7/B / Db7 / C | 57% | 75% | 65% | 3 | partial | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |
| i | diminutos de passagem e baixo dirigido | C / Eº / Dm/F / F#º / C7M/G / G7 / C | Estratégia — Diminutos de passagem (alternative): C / Edim7 / Dm/F / F#dim7 / Cmaj7/G / G7 / C | 71% | 100% | 84% | 0 | covered | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| j | cores cromaticas e emprestimos funcionais | Ab7M / C7M / F#m7(b5) / Fm7 / Em7 / G7 / C7M | Estratégia — Mistura modal densa (alternative): Abmaj7 / Cmaj7/G / F#m7b5 / Fm7 / Em7 / G7/F / Cmaj7 | 100% | 100% | 100% | 0 | covered | Mistura modal densa contemplada como percurso dirigido, nao como cor isolada. |
| k | rearmonizacao cromatica densa | C / Cº / C / C#º / F / Eb7 / Dm7(b5) / Ab7M / Db7 / Db7M / C7M | Estratégia — Cromatismo de vizinhança (alternative): C / Cdim7 / C / Dbdim7 / F/C / Eb7/Db / Dm7b5 / Abmaj7/Eb / Db7 / Dbmaj7 / Cmaj7 | 82% | 100% | 90% | 0 | covered | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |
| l | mistura modal, inversoes e cadencia plagal menor | Cm7 / C#º / Dm7 / Bb7 / Bm7/F# / G/F / C/E / Fm / C | Estratégia — Cadência plagal menor (alternative): Cm7 / Dbdim7 / Dm7 / Bb7 / Bm7/F# / G7/F / C/E / Fm / C | 78% | 100% | 88% | 0 | covered | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |
| m | deslocamento tonal e chegada deceptiva | Eb7M / Em7(b5) / F6 / Fm6 / D7(b5)/F# / G7 / G#º / Am7 | Estratégia — Chegada deceptiva cromática (adventurous): Ebmaj7 / Em7b5 / F6 / Fm6 / D7(b5)/F# / G7 / G#dim7 / Am7 | 88% | 100% | 93% | 0 | covered | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |

## Diagnostico

- O motor ja cobre bem o ponto de partida: I-IV-V, expansao diatonica, dominantes secundarias e diminutos de passagem aparecem como propostas reais para a melodia.
- A densidade deixou de ser apenas uma lacuna quantitativa: o motor ja consegue gerar alternativas densas, mas ainda precisa qualificar melhor a direcao cromatica dessas densidades.
- A cadeia SubV funcional passou a reconhecer preparacoes por tritono para IV, V e I, aproximando a familia do exemplo `h` sem copiar literalmente a solucao do Almada.
- As dominantes secundarias passaram a cobrir o exemplo `d` com V7/IV e V7/V em baixo cromatico #IV.
- Os diminutos de passagem passaram a cobrir o exemplo `i` com baixo dirigido: I -> IIIº -> ii/IV -> #IVº -> I/V -> V -> I.
- A mistura modal densa passou a cobrir o exemplo `j` como percurso bVImaj7 -> Imaj7 -> #IVø -> ivm7 -> iii7 -> V7 -> Imaj7.
- O cromatismo de vizinhanca passou a cobrir o exemplo `k` como percurso I -> Iº -> I -> bIIº, regiao cromatica e retorno napolitano para I.
- A chegada deceptiva cromatica passou a cobrir o exemplo `m` como familia intervalar: bIII -> iiiø -> IV -> iv -> II7 -> V -> #Vº -> vi.
- A cadencia plagal menor agora cobre o exemplo `l` com mistura modal, diminuto cromatico, bVII7 e baixos dirigidos ate iv -> I.
- As proximas lacunas qualitativas estao menos em vocabulario isolado e mais em graduar quando mediantes e cromatismos densos devem virar alternativas exploratorias.

