# F71 - Plano de calibragem do Harmonizar

Este plano transforma o conjunto F70 em uma pauta de escuta e decisao para o Harmonizar.
A intencao e separar validacao positiva de pontos que pedem ajuste de centro, ranking, baixo, cromatismo ou linguagem.

## Leitura geral

- Casos analisados: 24
- Tipos de decisao: 8
- Categorias de origem: 8

## Ordem sugerida

1. Validar `harmonia basica` e `referencia forte` antes de mexer em rearmonizacao.
2. Revisar `ranking` apenas depois que centro e janela estiverem coerentes.
3. Testar `cromatismo` e `contraponto de baixo` com escuta, porque podem soar artificiais mesmo quando passam na métrica.
4. Usar `menor`, `forma curta` e `alta densidade` como bordas de regressao.

## Decisoes por tipo

### Centro de referencia

| Arquivo | Categoria | Centro | Risco | Acao |
| --- | --- | --- | --- | --- |
| `a-010-After you.musicxml` | Referencia forte | Bb major (referencia) | medio | Comparar centro escolhido, baixo e cifra do autor; aceitar como ancora se a melodia nao contradiz. |
| `a-006-African flower.musicxml` | Referencia forte | F minor (referencia) | medio | Comparar centro escolhido, baixo e cifra do autor; aceitar como ancora se a melodia nao contradiz. |
| `a-013-Ain't it the truth.musicxml` | Referencia forte | Eb major (referencia) | medio | Comparar centro escolhido, baixo e cifra do autor; aceitar como ancora se a melodia nao contradiz. |

### Harmonia basica

| Arquivo | Categoria | Centro | Risco | Acao |
| --- | --- | --- | --- | --- |
| `b-032-Blue in green.musicxml` | Melodia primeiro | Bb major (melodia) | medio | Validar se a proposta melodia-primeiro ja serve como resposta simples antes de usar rearmonizacao. |
| `f-033-Freight trane.musicxml` | Melodia primeiro | C major (melodia) | baixo | Validar se a proposta melodia-primeiro ja serve como resposta simples antes de usar rearmonizacao. |
| `e-011-End of a love affair.musicxml` | Melodia primeiro | F# major (melodia) | medio | Validar se a proposta melodia-primeiro ja serve como resposta simples antes de usar rearmonizacao. |

### Ranking de propostas

| Arquivo | Categoria | Centro | Risco | Acao |
| --- | --- | --- | --- | --- |
| `d-025-Donna Lee.musicxml` | Muitas propostas | C major (referencia) | medio | Inspecionar as alternativas; se a primaria nao for a mais cantavel, ajustar criterio de ranking. |
| `f-015-Firm roots.musicxml` | Muitas propostas | C major (referencia) | alto | Inspecionar as alternativas; se a primaria nao for a mais cantavel, ajustar criterio de ranking. |
| `a-052-Ask me now.musicxml` | Muitas propostas | C major (referencia) | medio | Inspecionar as alternativas; se a primaria nao for a mais cantavel, ajustar criterio de ranking. |

### Cromatismo

| Arquivo | Categoria | Centro | Risco | Acao |
| --- | --- | --- | --- | --- |
| `c-034-Crazeology.musicxml` | Cromatico linear | Eb major (referencia) | alto | Ouvir se diminutos e dominantes cromaticos funcionam como conducao ou se viraram artificio. |
| `d-017-Detour ahead.musicxml` | Cromatico linear | Bb major (referencia) | alto | Ouvir se diminutos e dominantes cromaticos funcionam como conducao ou se viraram artificio. |
| `e-002-E.S.P..musicxml` | Cromatico linear | C major (referencia) | alto | Ouvir se diminutos e dominantes cromaticos funcionam como conducao ou se viraram artificio. |

### Conducao de baixo

| Arquivo | Categoria | Centro | Risco | Acao |
| --- | --- | --- | --- | --- |
| `b-037-Blueberry hill.musicxml` | Contraponto de baixo | D minor (referencia) | medio | Verificar se as inversoes suavizam a progressao sem esconder a funcao harmonica. |
| `a-039-Another Time.musicxml` | Contraponto de baixo | Bb major (referencia) | medio | Verificar se as inversoes suavizam a progressao sem esconder a funcao harmonica. |
| `e-008-Eighty one.musicxml` | Contraponto de baixo | F minor (referencia) | medio | Verificar se as inversoes suavizam a progressao sem esconder a funcao harmonica. |

### Centro menor

| Arquivo | Categoria | Centro | Risco | Acao |
| --- | --- | --- | --- | --- |
| `b-035-Blue room.musicxml` | Centros menores | C minor (referencia) | medio | Checar se o centro menor escolhido e funcional, modal ou apenas induzido pela cifra de referencia. |
| `b-043-Boplicity.musicxml` | Centros menores | C minor (referencia) | medio | Checar se o centro menor escolhido e funcional, modal ou apenas induzido pela cifra de referencia. |
| `c-006-Casa forte.musicxml` | Centros menores | D minor (referencia) | medio | Checar se o centro menor escolhido e funcional, modal ou apenas induzido pela cifra de referencia. |

### Forma curta

| Arquivo | Categoria | Centro | Risco | Acao |
| --- | --- | --- | --- | --- |
| `a-053-At last.musicxml` | Formas curtas | F major (referencia) | medio | Validar se a primeira janela representa a obra ou se a escolha precisa de contexto formal. |
| `c-003-Caravan.musicxml` | Formas curtas | F major (referencia) | medio | Validar se a primeira janela representa a obra ou se a escolha precisa de contexto formal. |
| `b-031-Blue Daniel.musicxml` | Formas curtas | Bb major (referencia) | medio | Validar se a primeira janela representa a obra ou se a escolha precisa de contexto formal. |

### Legibilidade

| Arquivo | Categoria | Centro | Risco | Acao |
| --- | --- | --- | --- | --- |
| `b-026-Black Orpheus.musicxml` | Alta densidade harmonica | Eb major (referencia) | medio | Conferir se a cifra gerada e legivel para usuario antes de mostrar alternativas mais densas. |
| `c-013-Chameleon.musicxml` | Alta densidade harmonica | C major (referencia) | medio | Conferir se a cifra gerada e legivel para usuario antes de mostrar alternativas mais densas. |
| `a-027-All of you.musicxml` | Alta densidade harmonica | A minor (referencia) | medio | Conferir se a cifra gerada e legivel para usuario antes de mostrar alternativas mais densas. |

## Pauta completa

| Arquivo | Categoria | Proposta | Sobreposicao | Cifras geradas | Acao |
| --- | --- | --- | ---: | --- | --- |
| `a-010-After you.musicxml` | Referencia forte | Estratégia — Cromático Linear | 8 | Bb6 / Bdim7 / C7 / F7 | Comparar centro escolhido, baixo e cifra do autor; aceitar como ancora se a melodia nao contradiz. |
| `a-006-African flower.musicxml` | Referencia forte | Estratégia — Tonal Clássico | 8 | Fmaj7 / Fm7/Bb / Fmaj7/C / Fm7 | Comparar centro escolhido, baixo e cifra do autor; aceitar como ancora se a melodia nao contradiz. |
| `a-013-Ain't it the truth.musicxml` | Referencia forte | Estratégia — Tonal Clássico | 8 | Ebmaj7 / Bb7/Ab / Ebmaj7/Bb / Ebmaj7 | Comparar centro escolhido, baixo e cifra do autor; aceitar como ancora se a melodia nao contradiz. |
| `b-032-Blue in green.musicxml` | Melodia primeiro | Estratégia — Tonal Clássico | 8 | Bbmaj7 / F7/Eb / Bb6/F / Bbmaj7 | Validar se a proposta melodia-primeiro ja serve como resposta simples antes de usar rearmonizacao. |
| `f-033-Freight trane.musicxml` | Melodia primeiro | Estratégia — Vamp dominante | 8 | C13 \| C13 \| Bb13 \| C13 \| Bb13 \| C13sus4 / C13 \| Bb13sus4 / Bb13 \| C13sus4 / C13 | Validar se a proposta melodia-primeiro ja serve como resposta simples antes de usar rearmonizacao. |
| `e-011-End of a love affair.musicxml` | Melodia primeiro | Estratégia — Cromático Linear | 8 | F#maj7 / A#dim7/G / B#dim7/G / G#7 | Validar se a proposta melodia-primeiro ja serve como resposta simples antes de usar rearmonizacao. |
| `d-025-Donna Lee.musicxml` | Muitas propostas | Estratégia — Tonal Clássico | 8 | Cmaj7 / Fmaj7 \| G7 / C6 | Inspecionar as alternativas; se a primaria nao for a mais cantavel, ajustar criterio de ranking. |
| `f-015-Firm roots.musicxml` | Muitas propostas | Estratégia — Tonal Clássico | 7 | Cmaj7 / G7/F / Cmaj7/G / Cmaj7 | Inspecionar as alternativas; se a primaria nao for a mais cantavel, ajustar criterio de ranking. |
| `a-052-Ask me now.musicxml` | Muitas propostas | Estratégia — Tonal Clássico | 7 | Cmaj7 / Dm7/F / Gm7 / Cmaj7 | Inspecionar as alternativas; se a primaria nao for a mais cantavel, ajustar criterio de ranking. |
| `c-034-Crazeology.musicxml` | Cromatico linear | Estratégia — Cromático Linear | 8 | Ebmaj7 / Adim7/E / F7 / D7/Bb | Ouvir se diminutos e dominantes cromaticos funcionam como conducao ou se viraram artificio. |
| `d-017-Detour ahead.musicxml` | Cromatico linear | Estratégia — Cromático Linear | 8 | Bbmaj7 / Ddim7/B / Ddim7/B \| Am7b5/C | Ouvir se diminutos e dominantes cromaticos funcionam como conducao ou se viraram artificio. |
| `e-002-E.S.P..musicxml` | Cromatico linear | Estratégia — Cromático Linear | 8 | Cmaj7 / Cdim7/Db / D7 / G#dim7/G | Ouvir se diminutos e dominantes cromaticos funcionam como conducao ou se viraram artificio. |
| `b-037-Blueberry hill.musicxml` | Contraponto de baixo | Estratégia — Contraponto de Baixo | 8 | Dm7 / Gm6 / E7/G# / A7 / Dmaj7 | Verificar se as inversoes suavizam a progressao sem esconder a funcao harmonica. |
| `a-039-Another Time.musicxml` | Contraponto de baixo | Estratégia — Contraponto de Baixo | 8 | Bbmaj7 / F7/Eb / C7/E / A7/F / G#dim7/Bb | Verificar se as inversoes suavizam a progressao sem esconder a funcao harmonica. |
| `e-008-Eighty one.musicxml` | Contraponto de baixo | Estratégia — Contraponto de Baixo | 8 | Fmaj9 / Bbmaj7 / G7/B / E7/C / Fmaj9 | Verificar se as inversoes suavizam a progressao sem esconder a funcao harmonica. |
| `b-035-Blue room.musicxml` | Centros menores | Estratégia — Tonal Clássico | 8 | Cmaj7 / G7/F / Cmaj7/G / Cmaj7 | Checar se o centro menor escolhido e funcional, modal ou apenas induzido pela cifra de referencia. |
| `b-043-Boplicity.musicxml` | Centros menores | Estratégia — Centro de referência | 8 | Abmaj7 \| Cm6/G \| Cm \| Cm \| Fm7 \| Fm7 \| Dm7b5 \| Cm | Checar se o centro menor escolhido e funcional, modal ou apenas induzido pela cifra de referencia. |
| `c-006-Casa forte.musicxml` | Centros menores | Estratégia — Contraponto de Baixo | 8 | Dmaj7 / Gmaj7 / Fmaj7/E / A7 / Dmaj7 | Checar se o centro menor escolhido e funcional, modal ou apenas induzido pela cifra de referencia. |
| `a-053-At last.musicxml` | Formas curtas | Estratégia — Tonal Clássico | 8 | Fmaj7 / Gm7/Bb / Fmaj7(#11)/C / Fmaj7 | Validar se a primeira janela representa a obra ou se a escolha precisa de contexto formal. |
| `c-003-Caravan.musicxml` | Formas curtas | Estratégia — Tonal Clássico | 8 | Fmaj7 / Bbmaj7 / C13 / Fmaj9 | Validar se a primeira janela representa a obra ou se a escolha precisa de contexto formal. |
| `b-031-Blue Daniel.musicxml` | Formas curtas | Estratégia — Contraponto de Baixo | 8 | Edim7/Bb / Ebmaj7 / Dm7/C / F7 / Bbmaj7 | Validar se a primeira janela representa a obra ou se a escolha precisa de contexto formal. |
| `b-026-Black Orpheus.musicxml` | Alta densidade harmonica | Estratégia — Tonal Clássico | 8 | Ebmaj7 / Fm7/Ab / Bb7 / Ebmaj7 | Conferir se a cifra gerada e legivel para usuario antes de mostrar alternativas mais densas. |
| `c-013-Chameleon.musicxml` | Alta densidade harmonica | Estratégia — Tonal Clássico | 8 | C6 / Fmaj7 / C6/G / Cmaj7 | Conferir se a cifra gerada e legivel para usuario antes de mostrar alternativas mais densas. |
| `a-027-All of you.musicxml` | Alta densidade harmonica | Estratégia — Cromático Linear | 8 | Amaj7 / C#dim7/Bb / C#dim7/Bb / B#dim7/B | Conferir se a cifra gerada e legivel para usuario antes de mostrar alternativas mais densas. |

