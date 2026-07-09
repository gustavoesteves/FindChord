# F79 - Comparacao Almada

## Objetivo

Contrastar a melodia de `docs/musics/exemplo.musicxml` com as rearmonizacoes resumidas em `docs/theory/almada_examples.md`, usando o exemplo do Carlos Almada como mapa teorico para o proximo refinamento do harmonizador.

## Resultado

- Propostas geradas pelo motor: 12
- Exemplos cobertos: 2
- Familias parcialmente contempladas: 7
- Lacunas praticas de vocabulario: 3

## Leitura musical

O motor esta bem posicionado no primeiro degrau pedagogico:

- harmonizacao basica I-IV-V;
- expansao diatonica;
- dominantes secundarias em nivel inicial;
- dominantes alteradas como camada alternativa inicial;
- diminutos de passagem;
- conducoes de baixo com inversoes.

O contraste com Almada mostra que ainda falta transformar em geracao controlada algumas familias mais avancadas:

- dominantes alteradas com extensoes reais (`b9`, `#5`, `b13`, `alt`);
- SubV7 encadeado e substituicoes por tritono em mais de um ponto da frase;
- mistura modal mais densa, especialmente menor/plagal;
- cromatismo de alta densidade com dois ou mais acordes por compasso;
- deslocamento tonal e chegada deceptiva sem perder legibilidade.

## Decisao

O exemplo do Almada deve virar uma referencia de cobertura por familias, nao uma lista de receitas fixas. O proximo refinamento deve priorizar criterios graduais: primeiro gerar a familia, depois controlar densidade, depois escolher exibicao/ranqueamento conforme perfil do usuario.

## Artefatos

- `scripts/audit-almada-example.ts`
- `scripts/almada-example-comparison.spec.ts`
- `docs/reports/f79-almada-example-comparison.md`
- `docs/reports/f79-almada-example-comparison.csv`
