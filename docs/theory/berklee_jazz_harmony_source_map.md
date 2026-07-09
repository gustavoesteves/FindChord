# Mapa de leitura - The Berklee Book of Jazz Harmony

Fonte local: `docs/theory/the berklee book of jazz harmony.pdf`

## Observacao tecnica

O PDF tem 264 paginas, sem camada textual pesquisavel. A extracao por `pypdf` e `pdfplumber` retorna texto vazio.

A leitura inicial foi feita por paginas renderizadas e OCR em ingles. O OCR funcionou bem nas amostras, entao o livro pode ser usado como fonte local para consultas pontuais.

## Por que este livro importa para o Find Chord

O livro reforca uma premissa muito alinhada com nosso caminho atual: harmonia deve ser entendida como relacao entre funcao, expectativa, tensao, resolucao e vocabulario disponivel.

Para o sistema, isso confirma cinco decisoes:

- a engine deve harmonizar por coerencia melodica e funcional, nao por genero;
- acordes devem ser classificados por funcao e tendencia, nao apenas por nome;
- tensoes devem ser graduadas por expectativa de resolucao;
- SubV, dominantes alteradas, modal interchange e diminutos precisam de validadores proprios;
- o acorde escrito pelo autor deve ser evidencia harmonica, nao gabarito absoluto nem etiqueta estilistica.

## Sumario relevante

O sumario OCR identificou estes blocos:

1. Major Key Harmony.
2. Secondary Dominants, Extended Dominants, and the II-V Progression.
3. Substitute Dominants: SubV's.
4. Minor Key Harmony.
5. Modal Interchange.
6. Blues in Jazz.
7. The Diminished Seventh Chord.
8. Modulation.
9. Modal Harmony in Jazz.
10. Constant Structure Progressions.
11. Jazz Voicings.
12. Appendices sobre resolucoes deceptivas de V7 e dominantes sem resolucao.

## Primeiras leituras confirmadas por OCR

### Funcao em maior

A amostra do capitulo 1 confirma a organizacao funcional em grupos:

- tonica;
- subdominante/predominante;
- dominante.

O ponto mais importante para o Find Chord e que `ii-7` aparece como substituto funcional de `IVMaj7` por compartilhar notas e preservar a funcao subdominante.

Consequencia para o sistema:

- a expansao diatonica deve continuar tratando `ii` e `IV` como membros da mesma regiao;
- o ranking pode preferir `ii-V-I` quando a melodia sustenta movimento cadencial;
- `viiø` em maior nao deve ser promovido automaticamente como dominante principal se o repertorio prefere `V7`.

### Tensoes de dominante

A amostra do final do capitulo 1 mostra dominantes com `b9`, `b13` e combinacoes de tensoes como aumento progressivo de tensao.

Consequencia para o sistema:

- dominantes alteradas devem ser graduais, nao binarias;
- o motor deve distinguir dominante simples, dominante com tensao diatonica, dominante alterada e dominante altamente alterada;
- alteracoes devem aumentar expectativa de resolucao local.

Status aplicado:

- F89 criou uma analise reutilizavel de tensao dominante, separando dominante simples, dominante colorida, dominante alterada e dominante altamente alterada.
- A camada de propostas de dominantes alteradas agora explica a graduacao de tensao sem transformar esse vocabulario em regra de genero.

### SubV

A amostra do capitulo 3 confirma SubV como substituto cromatico de dominante por relacao de tritono.

O livro diferencia SubV de dominante diatonica: as tensoes disponiveis nao devem ser copiadas mecanicamente do campo maior. A escala/tensao precisa concordar com a natureza cromatica do SubV.

Consequencia para o sistema:

- `SubV -> alvo` deve continuar validado por resolucao cromatica;
- SubV deve ter vocabulario proprio de tensoes;
- SubV funcional e dominantes secundarias nao devem compartilhar o mesmo validador de tensoes.

### Modal interchange

A amostra do capitulo 5 confirma `IV -> iv` como caso central de intercambio modal por emprestimo do paralelo menor.

O livro enfatiza que a funcao e o baixo podem permanecer estaveis enquanto a cor muda.

Consequencia para o sistema:

- nossa F85 esta no caminho certo: `ivm`, `bVI` e `bVII` entram como cor funcional, nao como troca automatica de centro;
- emprestimo modal deve exigir funcao preservada ou efeito cadencial claro;
- a melodia precisa sustentar a nota caracteristica quando a cor for forte.

### Diminuto

A amostra do capitulo 7 confirma o diminuto setima como estrutura simetrica.

Consequencia para o sistema:

- nossa F84 tambem esta no caminho certo: `dim7` deve ser validado pela resolucao de qualquer nota do acorde, nao apenas pela raiz escrita;
- inversoes de `dim7` nao devem poluir a cifra publica;
- a grafia deve ser escolhida pela resolucao e pela funcao local.

## Relação com o Almada

Schoenberg, Almada e Berklee se complementam bem:

- Schoenberg sustenta a base estrutural: sucessao, equilibrio, dissonancia, modo menor e modulacao.
- Almada ajuda a conectar harmonia funcional a repertorio popular e rearmonizacao pratica.
- Berklee ajuda a organizar o vocabulario jazzistico por funcao, tensao, escala-acorde e expectativa de resolucao.

Para o Find Chord, nenhuma dessas fontes deve virar regra de estilo. Todas servem como fontes de criterios harmonicos.

## Impacto no roadmap

Este livro sugere os proximos blocos teoricos-praticos:

1. graduar tensoes de dominante por expectativa de resolucao;
2. separar vocabulario de tensoes para SubV;
3. revisar menor funcional como campo de opcoes, nao apenas uma paleta fixa;
4. tratar dominantes sem resolucao e resolucoes deceptivas como caso explicito;
5. auditar voicings apenas como camada posterior de realizacao, nao como decisao primaria de harmonizacao.

## Decisao

O livro deve ser usado como mapa de validadores e vocabulario:

- funcao antes de cor;
- resolucao antes de estilo;
- tensao graduada antes de tensao livre;
- melodia e acorde de referencia como evidencias;
- geracao sempre explicavel em linguagem musical.
