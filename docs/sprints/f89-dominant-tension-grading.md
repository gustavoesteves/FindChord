# F89 - Graduacao de tensao dominante

## Objetivo

Transformar a leitura teorica das dominantes alteradas em um contrato reutilizavel pelo motor.

O problema nao era apenas reconhecer `G7`, `G13`, `G7(b9)`, `G7(b13)` ou `G7alt`. Era evitar que todos esses acordes fossem tratados como o mesmo peso harmonico. Uma dominante simples, uma dominante com cor diatonica e uma dominante altamente alterada criam expectativas diferentes de resolucao.

## Decisao

Criamos uma analise de tensao dominante com cinco niveis:

- `none`: acorde nao dominante.
- `diatonic`: dominante simples, como `G7`.
- `color`: dominante com tensao de cor, como `G13` ou `Db7(#11)`.
- `altered`: dominante com uma alteracao forte, como `G7(b9)`.
- `high-altered`: dominante com multiplas alteracoes ou abreviatura `alt`, como `G7(b13,b9)` ou `G7alt`.

Essa camada e deliberadamente harmonica, nao estilistica. Ela nao diz "jazz", "MPB" ou "classico"; diz apenas quanta tensao funcional aquela dominante carrega.

## Implementacao

Arquivo principal:

- `src/utils/music/analysis/strategies/DominantTensionAnalysis.ts`

Contratos expostos:

- `analyzeDominantTension(chord)`
- `compareDominantTension(a, b)`
- `describeDominantTension(chord)`

O resolvedor de cifras continua sendo a fonte de verdade para raiz, qualidade e tensoes reconhecidas. A nova camada apenas interpreta esse resultado como expectativa de resolucao.

## Integração atual

A estrategia de dominantes alteradas passou a explicar a graduacao usada nas propostas:

- dominantes secundarias alteradas mostram quais acordes foram promovidos para dominante alterada;
- o ciclo de dominantes alteradas explicita a diferenca entre `A7(b9)`, `D7alt`, `G13` e `G7(b13,b9)`.

Nesta primeira etapa, a graduacao entrou como contrato testavel e linguagem explicativa.

## Testes

Foi criado o teste:

- `scripts/dominant-tension-analysis.spec.ts`

Casos cobertos:

- `G7` como dominante simples;
- `G13` como dominante colorida;
- `G7(b9)` como dominante alterada;
- `G7(b13,b9)` como dominante altamente alterada;
- `G7alt` como dominante altamente alterada;
- `Db7(#11)` como dominante colorida;
- `Cmaj7` como nao dominante.

## Proximo passo

Usar essa graduacao no ranking/validador:

- favorecer tensoes mais fortes perto de resolucoes locais claras;
- penalizar dominante altamente alterada quando nao houver alvo audivel;
- separar a futura regra de tensoes de `SubV` da regra de dominantes secundarias;
- auditar no catalogo real onde o autor usa dominante simples, colorida ou alterada antes de resolucao.
