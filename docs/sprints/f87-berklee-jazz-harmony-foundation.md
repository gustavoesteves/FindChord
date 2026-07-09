# F87 - Base teorica pelo Berklee Book of Jazz Harmony

## Objetivo

Incorporar `The Berklee Book of Jazz Harmony` como referencia teorica local para orientar os proximos refinamentos do harmonizador.

## Resultado

Foi criado um mapa de leitura em `docs/theory/berklee_jazz_harmony_source_map.md`.

O PDF confirma uma direcao importante: o Find Chord deve continuar pensando por funcao, tensao, expectativa e resolucao, nao por genero ou estilo musical.

## Pontos confirmados

- `ii-7` e `IVMaj7` pertencem a mesma regiao subdominante/predominante.
- Dominantes alteradas devem ser graduadas por aumento de tensao.
- SubV tem vocabulario cromatico proprio e nao deve herdar automaticamente as tensoes da dominante diatonica.
- Modal interchange, especialmente `IV -> iv`, preserva funcao enquanto muda a cor.
- `dim7` e simetrico e deve ser entendido pela resolucao, nao apenas pela raiz escrita.

## Consequencia para o roadmap

Proximos blocos sugeridos:

1. Graduar tensoes de dominante por expectativa de resolucao.
2. Separar vocabulario de tensoes para SubV.
3. Revisar menor funcional como campo de opcoes.
4. Modelar dominantes sem resolucao e resolucoes deceptivas.
5. Deixar voicings como camada posterior de realizacao, nao como decisao primaria de harmonizacao.

## Observacao tecnica

O PDF nao possui camada textual pesquisavel. A leitura foi feita por paginas renderizadas e OCR em ingles. A qualidade do OCR nas amostras foi boa, entao podemos fazer consultas pontuais ao livro quando uma sprint precisar de um trecho especifico.

## Artefatos

- `docs/theory/the berklee book of jazz harmony.pdf`
- `docs/theory/berklee_jazz_harmony_source_map.md`
