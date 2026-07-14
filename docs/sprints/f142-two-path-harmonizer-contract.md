# F142 - Contrato dos dois caminhos do Harmonizar

## Ideia central

O Harmonizar deve operar em dois movimentos complementares:

1. Caminho regressivo: reduzir a melodia/obra ao seu fundamento harmonico.
2. Caminho progressivo: partir desse fundamento para alternativas de rearmonizacao cada vez mais ricas.

O primeiro caminho responde: "qual e o chao funcional desta melodia?". Em maior, a primeira reducao deve tentar tônica, subdominante e dominante. Em menor, o equivalente deve preservar repouso menor, preparacao e dominante funcional quando a melodia sustenta essa leitura.

O segundo caminho responde: "para onde posso levar essa harmonia sem perder a coerencia da obra?". Aqui entram expansao diatonica, dominantes secundarias, diminutos, SubV, funcoes aparentes, densidade interna e vocabulario progressivo inspirado no mapa do Almada.

## Como isso existe hoje

- `Estratégia — Harmonia fundamental I-IV-V` explicita a reducao ao vocabulario basico maior.
- `Estratégia — Melodia primeiro` atua quando a reducao I-IV-V pura nao sustenta suficientemente a melodia.
- `Referência — Harmonia da partitura` mostra o que foi escrito pelo autor.
- `Rearmonização — ritmo harmônico da partitura` preserva a densidade da obra e propõe uma derivacao funcional.
- As estrategias de dominantes, diminutos, SubV e funcoes aparentes formam o caminho progressivo.

## Decisao de apresentacao

A UI deve separar os grupos assim:

- `Fundamento harmônico`: primeira leitura estrutural, baseada em melodia e funcao.
- `Leitura da obra`: referencia escrita e centro inferido a partir dela.
- `Rearmonizações progressivas`: alternativas que partem do fundamento ou da referencia para aumentar cor, densidade ou deslocamento.

Essa separacao evita que uma rearmonizacao rica pareca "mais correta" do que a base. Ela e uma possibilidade posterior, nao a fundacao.

## Regra de produto

O sistema nao deve escolher harmonias por genero. A progressao nasce de tres evidencias musicais:

- notas estruturais da melodia;
- funcao harmonica implicada;
- quando existir, ritmo harmonico e centro sugeridos pela referencia escrita.

## Proximo refinamento

Auditar a qualidade do caminho progressivo em exemplos reais e no exemplo do Almada:

- a proposta progressiva conserva a reducao funcional?
- a densidade adicionada tem direcao, ou apenas mais acordes?
- a conducao das vozes ajuda a explicar por que uma rearmonizacao soa natural?
