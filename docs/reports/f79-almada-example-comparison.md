# F79 - Comparacao com o exemplo de rearmonizacao de Carlos Almada

Esta auditoria contrasta a melodia em `docs/musics/exemplo.musicxml` com as harmonizacoes resumidas em `docs/theory/almada_examples.md`.

A comparacao nao tenta exigir copia literal do Almada. Ela mede se o motor cobre a familia harmonica do exemplo, a densidade aproximada e os recursos de vocabulario envolvidos.

## Leitura geral

- Propostas geradas pelo motor: 14
- Exemplos cobertos: 2
- Familias parcialmente contempladas: 7
- Lacunas praticas de vocabulario: 3

## Propostas do motor

| Rank | Papel | Camada | Proposta | Rota | Cifras | Baixo |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | primary | reharmonization | Estratégia — Tonal Clássico | conservative | Cmaj7 / Fmaj7 / G13 / Cmaj7 | C -> F -> G -> C |
| 2 | alternative | reharmonization | Estratégia — Dominantes alteradas | chromatic | C / Am / C7(b9)/Bb / F/A / F/C / Bm7b5 / D7(b13)/C / G7/B / C | C -> A -> Bb -> A -> C -> B -> C -> B -> C |
| 3 | alternative | reharmonization | Estratégia — Dominantes secundárias | chromatic | C / Am / C7/Bb / F/A / F/C / Bm7b5 / D7/C / G7/B / C | C -> A -> Bb -> A -> C -> B -> C -> B -> C |
| 4 | alternative | reharmonization | Estratégia — Ciclo de dominantes alteradas | chromatic | C / A7(b9)/C# / Dm / D7alt / G13 / G7(b13,b9) / C6 | C -> C# -> D -> D -> G -> G -> C |
| 5 | adventurous | reharmonization | Estratégia — Contraponto de Baixo | radical | Cmaj7 / Fmaj7 / G7/D / G7 / Cmaj7 | C -> F -> D -> G -> C |
| 6 | alternative | reharmonization | Estratégia — Função aparente | chromatic | C / Am / F / F/C / Bm7b5 / Dm6 / G7 / C | C -> A -> F -> C -> B -> D -> G -> C |
| 7 | alternative | reharmonization | Estratégia — Expansão funcional diatônica | chromatic | C / Am / F / F/C / Bm7b5 / G7 / C | C -> A -> F -> C -> B -> G -> C |
| 8 | alternative | reharmonization | Estratégia — Função aparente | chromatic | C / Am / F#m7(b5) / F/C / Bm7b5 / G7 / C | C -> A -> F# -> C -> B -> G -> C |
| 9 | alternative | reharmonization | Estratégia — Cromático Linear | chromatic | Cdim7 / F#dim7/Db / Bm7b5/D / G7 | C -> Db -> D -> G |
| 10 | alternative | reharmonization | Estratégia — Função aparente | chromatic | C / Am / F / F/C / Bm7b5 / Bdim / C | C -> A -> F -> C -> B -> B -> C |
| 11 | alternative | basic | Estratégia — Harmonia básica I-IV-V | conservative | C / F / G / C | C -> F -> G -> C |
| 12 | alternative | reharmonization | Estratégia — Diminutos de passagem | chromatic | C / G#dim7 / Am / Edim7 / F / F/C / Bm7b5 / F#dim7 / G7 / C | C -> G# -> A -> E -> F -> C -> B -> F# -> G -> C |
| 13 | alternative | reharmonization | Estratégia — Cromático Linear | chromatic | Cdim7 / F#dim7/Db / Bm7b5/Db / G7/D | C -> Db -> Db -> D |
| 14 | alternative | reharmonization | Estratégia — SubV funcional | chromatic | C / Am / Gb7/Bb / F/A / F/C / Bm7b5 / G7 / Db7/Ab / C | C -> A -> Bb -> A -> C -> B -> G -> Ab -> C |

## Contraste com Almada

| Ex. | Familia | Referencia Almada | Melhor proposta do motor | Cifras | Recursos | Afinidade | Densidade | Estado | Nota |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| b | harmonia basica funcional | C / F / G / C | Estratégia — Harmonia básica I-IV-V (alternative): C / F / G / C | 100% | 100% | 100% | 0 | covered | Base I-IV-V diretamente contemplada. |
| c | expansao diatonica e cadencia ii-V-I | C / Am / Dm / Dm/C / Bm7(b5) / G7 / C | Estratégia — Expansão funcional diatônica (alternative): C / Am / F / F/C / Bm7b5 / G7 / C | 71% | 100% | 84% | 0 | covered | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| d | dominantes secundarias e preparacao cromatica | C / C7 / F7M / D7/F# / G7 / C7M | Estratégia — Contraponto de Baixo (adventurous): Cmaj7 / Fmaj7 / G7/D / G7 / Cmaj7 | 50% | 75% | 61% | -1 | partial | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| e | dominantes secundarias com dominante alterada | C6 / A7 / Dm7 / D7 / G7+ / C6 | Estratégia — Ciclo de dominantes alteradas (alternative): C / A7(b9)/C# / Dm / D7alt / G13 / G7(b13,b9) / C6 | 33% | 100% | 63% | 1 | partial | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| f | ciclo funcional e cadencias locais | C / Gm7 / C7 / F / Am7 / D7 / Dm7 / G7 / C | Estratégia — Função aparente (alternative): C / Am / F / F/C / Bm7b5 / Dm6 / G7 / C | 44% | 75% | 58% | -1 | partial | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| g | dominantes estendidas e alteradas | Em7(b5) / A7(b9) / Am7 / D7alt / G7(9) / G7(b13 b9) / C7M(9) | Estratégia — Ciclo de dominantes alteradas (alternative): C / A7(b9)/C# / Dm / D7alt / G13 / G7(b13,b9) / C6 | 14% | 100% | 53% | 0 | partial | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |
| h | substituicoes por tritono | C6 / Gb7 / F7M / Ab7 / G7 / Db7 / C7M | Estratégia — Contraponto de Baixo (adventurous): Cmaj7 / Fmaj7 / G7/D / G7 / Cmaj7 | 43% | 50% | 46% | -2 | partial | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |
| i | diminutos de passagem e baixo dirigido | C / Eº / Dm/F / F#º / C7M/G / G7 / C | Estratégia — Diminutos de passagem (alternative): C / G#dim7 / Am / Edim7 / F / F/C / Bm7b5 / F#dim7 / G7 / C | 43% | 100% | 69% | 3 | partial | Familia ja aparece no motor, mas nem sempre com a mesma densidade do exemplo. |
| j | cores cromaticas e emprestimos funcionais | Ab7M / C7M / F#m7(b5) / Fm7 / Em7 / G7 / C7M | Estratégia — Contraponto de Baixo (adventurous): Cmaj7 / Fmaj7 / G7/D / G7 / Cmaj7 | 43% | 67% | 54% | -2 | partial | Comparacao util como alvo de vocabulario futuro. |
| k | rearmonizacao cromatica densa | C / Cº / C / C#º / F / Eb7 / Dm7(b5) / Ab7M / Db7 / Db7M / C7M | Estratégia — Diminutos de passagem (alternative): C / G#dim7 / Am / Edim7 / F / F/C / Bm7b5 / F#dim7 / G7 / C | 27% | 50% | 37% | -1 | gap | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |
| l | mistura modal, inversoes e cadencia plagal menor | Cm7 / C#º / Dm7 / Bb7 / Bm7/F# / G/F / C/E / Fm / C | Estratégia — Dominantes alteradas (alternative): C / Am / C7(b9)/Bb / F/A / F/C / Bm7b5 / D7(b13)/C / G7/B / C | 11% | 67% | 36% | 0 | gap | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |
| m | deslocamento tonal e chegada deceptiva | Eb7M / Em7(b5) / F6 / Fm6 / D7(b5)/F# / G7 / G#º / Am7 | Estratégia — Diminutos de passagem (alternative): C / G#dim7 / Am / Edim7 / F / F/C / Bm7b5 / F#dim7 / G7 / C | 13% | 67% | 37% | 2 | gap | Vocabulário ainda mais avancado: alteracoes, SubV7 encadeado, mistura modal densa ou deslocamento tonal. |

## Diagnostico

- O motor ja cobre bem o ponto de partida: I-IV-V, expansao diatonica, dominantes secundarias e diminutos de passagem aparecem como propostas reais para a melodia.
- A diferenca mais importante e de densidade: Almada demonstra muitas versoes com dois ou mais acordes por compasso, enquanto o motor ainda tende a preferir uma proposta pedagogicamente mais contida.
- As lacunas mais claras estao nas familias mais avancadas: SubV7 encadeado, dominantes alteradas com extensoes, mistura modal cromatica densa, movimentos por mediantes e deslocamentos tonais/deceptivos.
- O proximo bloco teorico-pratico deve transformar essas familias em criterios graduais, nao em receitas fixas do exemplo.

