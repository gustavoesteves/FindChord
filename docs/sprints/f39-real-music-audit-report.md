# F39 — Relatorio musical por obra

## Objetivo

A F39 transforma a prova de fogo da F38 em um relatorio musical legivel por obra.

F38 respondia: "o pipeline quebra?". F39 passa a responder: "o que o motor esta ouvindo em cada arquivo real?".

## Arquivos implementados

- `scripts/real-music-audit.ts`
- `scripts/generate-real-music-audit-report.ts`
- `scripts/real-music-audit-report.spec.ts`
- `docs/reports/f39-real-music-audit-report.md`

Tambem foi adicionado o comando:

```text
npm run report:real-music
```

## O que o relatorio mostra

Para cada arquivo em `docs/musics`, o relatorio registra:

- titulo importado;
- tom ou armadura;
- quantidade de compassos, notas, cifras e secoes;
- status da entrada;
- janela melodica usada;
- centro escolhido;
- quantidade de propostas geradas;
- proposta primaria;
- perfil de rota;
- perfil de baixo;
- nota de conducao de vozes;
- cifras propostas;
- linha de baixo;
- diagnosticos principais.

## Estados de entrada

A F39 separa tres estados:

### Harmonizado

O arquivo trouxe notas melodicas suficientes, uma janela harmonizavel foi encontrada e o motor gerou propostas.

### Apenas referencia harmonica

O arquivo trouxe cifras, mas nao trouxe notas melodicas suficientes para harmonizacao melodica.

Esse caso nao deve ser tratado como erro. Ele e util para testar ingestao de cifras e futura comparacao de referencia.

### Sem proposta

O arquivo trouxe melodia, mas nenhuma janela auditada gerou proposta aceita.

Esse estado e importante porque deve virar prioridade musical quando aparecer. Na primeira geracao da F39, nenhum arquivo caiu nessa categoria.

## Resultado inicial

O primeiro relatorio auditou 8 arquivos:

- 7 harmonizados;
- 1 apenas com referencia harmonica;
- 0 sem proposta.

O caso apenas com referencia harmonica e `teste2.musicxml`, que tem cifras importadas mas nenhuma nota melodica.

## Leitura musical

A F39 mostra que o motor ja atravessa repertorio real, mas tambem expõe o proximo limite: em obras com cifras de referencia, ainda nao sabemos se a proposta primaria converge ou diverge musicalmente da harmonia original.

Essa comparacao nao deve virar uma regra de copia. A harmonia de referencia deve servir como evidencia:

- quando confirma o centro;
- quando revela idioma harmonico;
- quando mostra uma cadencia local que a melodia sozinha nao deixou clara;
- quando acusa excesso de cromatismo ou simplificacao demais na proposta.

## Proximo passo

A proxima fase natural e comparar proposta primaria com harmonia de referencia quando ela existe.

Isso deve gerar diagnosticos como:

- centro compativel com a referencia;
- centro divergente;
- funcao equivalente com cifra diferente;
- cadencia da referencia omitida;
- cromatismo da proposta nao sustentado pela referencia;
- referencia preservada como alternativa quando a proposta primaria for mais didatica que idiomatica.

Essa etapa deve ser feita com cuidado: referencia nao e gabarito absoluto, mas e um excelente ponto de escuta.
