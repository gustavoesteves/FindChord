# F47 — Diagnosticos refinados de centro local/global

## Objetivo

Refinar a causa generica de `centro divergente` na comparacao com harmonia de referencia.

Depois da F46, o sistema passou a distinguir:

- centro global da referencia;
- centro local da janela comparada;
- centro escolhido pela proposta.

A F47 transforma essa distincao em diagnostico musical. A pergunta deixa de ser apenas "o centro divergiu?" e passa a ser:

> A proposta ignorou o centro global da obra, a tonicizacao local da janela, ou acompanhou um deles de modo musicalmente defensavel?

## Problema observado

No repertorio real, especialmente standards e obras com linguagem jazzistica, a harmonia de referencia frequentemente toniciza regioes locais.

Nesses casos, duas situacoes diferentes estavam recebendo o mesmo rotulo:

1. a proposta escolhe um centro que nao coincide com a referencia em nenhum nivel;
2. a proposta acompanha o centro global, mas perde uma tonicizacao local clara;
3. a proposta acompanha o centro local, mas se afasta do centro global da obra.

Musicalmente, esses casos nao significam a mesma coisa. O primeiro sugere erro de leitura ou estrategia deslocada. O segundo sugere simplificacao funcional excessiva. O terceiro pode ser uma leitura local valida, especialmente em ii-V-I, iiø-V-i ou trechos modulantes.

## Decisao teorica

A comparacao com referencia deve tratar centro como uma pilha, nao como valor unico.

Camadas usadas nesta fase:

| Camada | Papel |
| --- | --- |
| Centro da proposta | centro usado para classificar a proposta primaria |
| Centro local da referencia | centro inferido somente na janela sobreposta |
| Centro global da referencia | centro inferido pela harmonia completa da obra |

A F47 preserva o principio de que a referencia nao e gabarito absoluto. Divergir da referencia continua sendo informacao de escuta, nao erro automatico.

## Contrato de causas

Novas causas em `ReferenceHarmonyComparator`:

| Causa | Leitura musical |
| --- | --- |
| `local-center-mismatch` | a proposta nao acompanha o centro local da janela |
| `global-center-mismatch` | a proposta nao acompanha o centro global da referencia |
| `local-center-aligned-global-mismatch` | a proposta acompanha a tonicizacao local, mas se afasta do centro global |
| `global-center-aligned-local-mismatch` | a proposta acompanha o centro global, mas ignora a tonicizacao local |

O antigo `center-mismatch` permanece como fallback para comparacoes sem centro local/global explicito.

## Explicacao musical

No relatorio real, as causas aparecem em linguagem de musico:

- `centro local divergente`;
- `centro global divergente`;
- `acompanha centro local, diverge do global`;
- `acompanha centro global, ignora centro local`.

Isso melhora a leitura das obras porque uma divergencia de centro passa a indicar qual camada precisa ser ouvida.

## Resultado na auditoria real

Com o corpus atual em `docs/musics`, o relatorio passa a auditar 22 MusicXML.

Exemplos de leitura que a F47 torna visiveis:

- quando a proposta acompanha o centro global mas perde uma tonicizacao local, o relatorio mostra `acompanha centro global, ignora centro local`;
- quando a proposta nao coincide com nenhum centro relevante, o relatorio separa `centro local divergente` e `centro global divergente`;
- quando a referencia tem centro local e global diferentes, o relatorio exibe ambos como `janela ...; global ...`.

## O que isso prepara

A F47 abre caminho para tres refinamentos proximos:

1. melhorar a escolha de centro da proposta quando a janela tem ii-V-I local claro;
2. usar tonicizacoes locais como evidencia positiva para propostas comparativas, nao apenas como divergencia;
3. diferenciar simplificacao aceitavel de perda de idioma em standards.

## Verificacao

- `npx vitest run --config vitest.curated.config.ts scripts/reference-harmony-comparator.spec.ts scripts/real-music-audit-report.spec.ts`
- `npm run report:real-music`
