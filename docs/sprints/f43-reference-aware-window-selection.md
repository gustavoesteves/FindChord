# F43 — Selecao de janela comparavel com referencia

## Objetivo

A F43 melhora a auditoria do corpus real.

Antes, o relatorio escolhia a primeira janela melodica que gerava proposta. Em musicas com cifras de referencia, isso podia produzir uma proposta valida, mas sem compassos em comum com a harmonia importada.

O resultado era enganoso: a musica tinha cifras, mas o relatorio dizia `sem referencia comparavel`.

## Ajuste implementado

`findHarmonizableWindow` agora pode receber a camada de cifras da partitura.

Quando existe referencia harmonica, a auditoria:

1. percorre janelas melodicas harmonizaveis;
2. gera propostas para cada janela;
3. ranqueia e escolhe a proposta primaria;
4. mede quantos compassos da proposta primaria existem tambem na referencia;
5. prefere a janela com maior sobreposicao.

Se a musica nao tem cifras, o comportamento antigo permanece: a primeira janela harmonizavel e suficiente.

## Arquivos alterados

- `scripts/real-music-audit.ts`
- `scripts/real-music-audit-report.spec.ts`
- `docs/reports/f39-real-music-audit-report.md`

## Resultado no corpus real

Depois da F43, musicas que antes tinham cifras mas pouca ou nenhuma comparacao passaram a gerar leitura comparavel:

- `Actual proof.musicxml`: passou a ter 3 compassos de sobreposicao com referencia;
- `autum leaves.musicxml`: passou a ter 3 compassos de sobreposicao com referencia.

O relatorio agora exibe:

```text
Sobreposicao com referencia: 3 compassos
```

## Leitura musical

Essa fase nao melhora a harmonizacao em si. Ela melhora a escuta da auditoria.

Isso e importante porque, em repertorio real, a melodia e a harmonia podem comecar em compassos diferentes, ter introducoes, pickups, secoes sem cifra ou cifras deslocadas.

Comparar uma proposta contra a referencia so faz sentido quando as janelas se encontram.

## Limite revelado

A F43 tambem deixou mais claro um problema posterior: a inferencia de centro da referencia ainda e simples demais, porque hoje pode tomar o primeiro acorde como centro inicial da referencia.

Em standards e repertorio jazz, isso pode gerar causas como `centro divergente` mesmo quando a referencia esta apenas comecando em ii, vi ou outro acorde preparatorio.

## Proximo passo

A proxima fase natural e melhorar a inferencia de centro da referencia:

- usar armadura quando disponivel;
- usar cadencias locais;
- usar frequencia e duracao de repousos;
- evitar tomar automaticamente o primeiro acorde como centro;
- comparar centro da proposta contra um centro de referencia mais robusto.

Essa etapa deve reduzir falsos alertas de centro divergente e tornar a comparacao com a referencia mais justa.
