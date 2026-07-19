# F174 - Auditoria de densidade melodica no Harmonizar

## Objetivo

Separar, no relatorio de densidade harmonica, tres situacoes que antes apareciam misturadas:

- densidade realmente sugerida por propostas geradas a partir da melodia;
- densidade preservada por contorno ou ritmo da harmonia de referencia;
- lacunas em que a referencia e densa, mas o motor ainda nao cria uma alternativa interna densa.

## Mudanca

O relatorio F113 agora preserva a leitura anterior de densidade total gerada, mas adiciona uma classificacao melodica:

- `densidade-gerada-pela-melodia`
- `densidade-apenas-referencia`
- `lacuna-de-densidade`
- `referencia-sem-densidade`
- `sem-referencia`

Tambem foram adicionadas colunas para contar separadamente ideias densas vindas da melodia e ideias densas derivadas diretamente da referencia.

## Resultado no catalogo atual

- Partituras analisadas: 199
- Referencias com mais de uma cifra em algum compasso: 182
- Densidade sugerida por propostas da melodia: 85
- Densidade coberta apenas por contorno/ritmo da referencia: 84
- Lacunas de densidade na leitura melodica: 13
- Partituras sem referencia: 2

## Leitura musical

O numero mais importante nao e apenas a quantidade de lacunas. A auditoria mostra que o motor ja consegue preservar muita densidade quando existe cifra escrita, mas ainda precisa ampliar o vocabulario interno para chegar a essa densidade sem copiar a partitura.

Isso confirma o caminho de refinamento: usar as musicas reais como calibracao de vocabulario e comportamento, sem criar excecoes por musica.

## Decisao

Nao foi adicionada uma regra nova de densidade neste sprint. Ao testar `Air mail special`, a frase analisada aparecia como um percurso `T -> PD -> T`, sem cadencia dominante clara. Nesse caso, simplesmente inserir mais acordes por compasso seria uma solucao mecanica e musicalmente fraca.

O proximo refinamento deve partir dos casos classificados como `densidade-apenas-referencia` e `lacuna-de-densidade`, procurando padroes gerais como:

- prolongamento de tonica por `I -> vi`;
- preparacao por `ii -> V` quando a melodia confirma movimento dominante;
- dominantes secundarias internas quando ha alvo diatonico claro;
- baixo funcional ou cromatico quando a condução de vozes justificar a subdivisao.

## Validacao

- `npm run test:curated -- scripts/harmonization-density-audit.spec.ts`
- `npm run report:harmonization-density`
