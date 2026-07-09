# Mapa de leitura - Arnold Schoenberg, Harmonia

Fonte local: `docs/theory/harmonia arnold schoenberg.pdf`

## Observacao tecnica

O PDF tem 577 paginas e nao possui camada textual pesquisavel. A extracao por `pypdf` e `pdfplumber` retorna texto vazio.

A leitura inicial foi feita por paginas renderizadas e OCR em portugues. A qualidade do OCR nas amostras foi boa, mas o livro e extenso e deve ser consultado por blocos quando cada sprint precisar de fundamentacao especifica.

## Por que este livro importa para o Find Chord

Schoenberg entra como fundamento estrutural. Ele nao deve ser usado como manual de proibicoes, mas como uma lente para entender:

- relacao entre consonancia e dissonancia;
- sucessao harmonica como construcao de equilibrio;
- tonalidade como sistema historico de expectativas;
- modo maior/menor como campos de comportamento;
- modulacao como relacao entre regioes;
- ensino da harmonia como formacao de criterio, nao como lista de respostas prontas.

Para o Find Chord, isso reforca uma decisao central: a engine deve propor harmonia por coerencia interna, nao por genero, estilo ou colecao de receitas.

## Leituras iniciais confirmadas por OCR

### Harmonia como teoria a servico da pratica

Nas paginas iniciais, o prefacio e a introducao destacam que a teoria de Schoenberg nasce da pratica de composicao e ensino.

Consequencia para o sistema:

- documentos teoricos devem alimentar validadores e criterios, nao virar ornamentacao;
- a engine precisa explicar por que uma sucessao funciona;
- analise harmonica deve ser meio para compreender relacoes, nao rotulo final.

### Analise de obra inteira e relacoes de equilibrio

Em amostra OCR do inicio do livro, Schoenberg critica analises superficiais que apenas mostram por quais tonalidades um tema passa. Ele aponta como mais relevante examinar a construcao harmonica de uma obra inteira e as relacoes de equilibrio entre acordes e sucessoes harmonicas.

Consequencia para o sistema:

- a comparacao com acordes do autor nao deve ser gabarito literal;
- progressao e regiao devem pesar mais que acorde isolado;
- o Harmonizar deve avaliar arco de frase, nao apenas cobertura nota-a-nota.

### Consonancia e dissonancia

A amostra do capitulo "Consonancia e dissonancia" mostra que o problema nao e apenas classificar intervalos, mas entender como sensacao, material e relacao sonora se organizam.

Consequencia para o sistema:

- dissonancia nao deve ser tratada como erro;
- tensao precisa ser avaliada pelo contexto e pela resolucao;
- dominantes alteradas, diminutos, SubV e emprestimos devem ter regras proprias de expectativa.

### Modo menor

A amostra do capitulo "O modo menor" relaciona maior/menor aos modos historicos e ao desenvolvimento posterior da linguagem tonal.

Consequencia para o sistema:

- menor funcional nao deve ser apenas "maior transposto";
- a engine deve diferenciar menor natural, harmonico e melodico quando a melodia ou a cifra sustentarem essa leitura;
- fronteira entre menor funcional e modal precisa continuar sendo tratada com evidencia, nao por chute.

### Liberdade e limites

Nas paginas OCRadas, Schoenberg discute liberdade no tratamento das dissonancias, mas tambem a necessidade de compreender os limites dessa liberdade como sistema de relacoes.

Consequencia para o sistema:

- rearmonizacao avancada precisa de restricoes explicitas;
- "mais cromatico" nao significa "melhor";
- cada afastamento deve declarar o que preserva: melodia, funcao, centro, baixo, resolucao ou condução de vozes.

## Relacao com Masson, Almada e Berklee

Os quatro blocos agora se organizam assim:

- Masson: base pedagogica funcional, cifragem, campo harmonico, dominantes, SubV e rearmonizacao didatica.
- Almada: aplicacao popular e rearmonizacao progressiva por familias de recursos.
- Berklee: vocabulario jazz funcional, tensoes, SubV, modal interchange, diminutos e chord-scale.
- Schoenberg: fundamento estrutural da harmonia tonal, equilibrio, progressao, dissonancia, modo menor e modulacao.

Nenhuma dessas fontes deve virar etiqueta de estilo para a engine. Todas devem virar criterios verificaveis.

## Impacto no roadmap

Schoenberg sugere um bloco teorico anterior a novas expansoes cromaticas:

1. Reforcar a nocao de progressao como arco de frase.
2. Diferenciar tensao local, tensao estrutural e dissonancia ornamental.
3. Revisar menor funcional a partir de comportamento melodico e cadencial.
4. Modelar modulacao/tonicizacao como relacao entre regioes, nao como simples acorde distante.
5. Tornar a explicacao do sistema menos "nome do recurso" e mais "relacao musical preservada".

## Decisao

Schoenberg deve servir como ancora de criterio:

- funcao antes de cifra;
- sucessao antes de acorde isolado;
- equilibrio antes de densidade;
- tensao com resolucao antes de cromatismo livre;
- liberdade como consequencia de relacoes compreendidas.
