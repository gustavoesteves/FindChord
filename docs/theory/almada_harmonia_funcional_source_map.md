# Mapa de leitura - Carlos Almada, Harmonia Funcional

Fonte local: `docs/theory/carlos almada - harmonia.pdf`

## Observacao tecnica

O PDF esta como digitalizacao de paginas, sem camada textual pesquisavel. A leitura abaixo foi feita por inspecao visual das paginas renderizadas. Por isso, as referencias combinam pagina impressa e pagina do PDF quando util.

## Por que este livro e importante para o Find Chord

O livro confirma uma premissa central do nosso caminho: a harmonia funcional popular deve ser tratada como uma derivacao pratica da harmonia tradicional, mas com regras proprias de cifragem, funcao, preparacao e aplicacao em repertorio real.

Para o sistema, isso reforca quatro decisoes:

- a engine deve trabalhar por funcao e resolucao, nao por copia literal de cifras;
- a cifragem e um contrato semantico, nao apenas string de exibicao;
- dominantes secundarias, SubV, diminutos e alteracoes pertencem a uma mesma familia maior: expansao da funcao dominante;
- repertorios analisados no livro devem ser usados como corpus de padroes harmonicos, nao como gatilhos de genero para a engine.

## Estrutura relevante do livro

### Parte I - Introducao

- Revisao da teoria musical: intervalos, escala maior, tonalidade, circulo das quartas e cifragem harmonica.
- Formacao dos acordes: triades, tetrades, voicings e inversoes.

Uso no sistema:

- manter `ChordSymbolResolver` e `MusicXmlChordSymbolMapper` como base semantica;
- separar formacao do acorde de funcao harmonica;
- preservar inversao/baixo como informacao musical, nao apenas sintaxe de slash chord.

### Parte II - Harmonia funcional

#### Acordes diatonicos

Topicos: triades diatonicas, movimento de fundamentais, tritono, cadencias, ritmo harmonico, harmonizacao/rearmonizacao, tetrades, escalas de acordes, analise melodica e analises sugeridas.

Uso no sistema:

- manter o caminho "melodia primeiro" como primeiro nivel de harmonizacao;
- escolher entre T, PD e D antes de aplicar cromatismos;
- usar ritmo harmonico como restricao de densidade;
- separar harmonia basica, expansao diatonica e rearmonizacao.

#### Expansao da funcao dominante

O sumario localiza este bloco nas paginas impressas 103-144. Ele e o bloco mais diretamente conectado ao que estamos refinando.

Topicos:

- dominantes secundarios;
- acordes SubV;
- tetrades diminutas;
- alteracoes em acordes dominantes;
- analises harmonicas.

Leitura para o motor:

- `DOMINANTES_SECUNDARIAS` deve continuar sendo validada por alvo e resolucao;
- `SUBV7_CADENCIAL` deve ser expandido para SubV de graus diatonicos, nao apenas cadencia final;
- diminutos devem ser tratados por simetria e por resolucao de fundamental, com cuidado para enharmonia;
- dominantes alteradas devem nascer de dominantes resolvidas, usando tensoes como cor funcional;
- o grupo inteiro deve ser visto como expansao da funcao dominante, nao como estrategias isoladas sem parentesco.

Pontos visuais confirmados:

- p. 105 / PDF 99: dominante secundario e deduzido a partir do acorde-alvo e deve resolver como uma cadencia local.
- p. 126 / PDF 120: SubV aparece como outra preparacao possivel para graus diatonicos, com raiz a segunda menor acima do alvo.
- p. 134 / PDF 128: acordes diminutos sao simetricos; a escolha da fundamental orienta a resolucao.
- p. 144 / PDF 138: dominante alterada e associada a escala alterada e a analises especificas.

#### Acordes de emprestimo

Topicos:

- emprestimos da regiao dominante;
- emprestimos da regiao subdominante;
- emprestimos da regiao homonima menor;
- harmonizacao e rearmonizacao com emprestimos.

Uso no sistema:

- a estrategia de emprestimo modal deve diferenciar origem funcional: dominante, subdominante e homonima menor;
- `ivm`, `bVII`, `bVI`, `bII` e cores afins precisam de validacao por funcao e por assinatura melodica;
- emprestimo deve ser exibido como cor de rearmonizacao quando nao for a leitura basica mais provavel.

#### Tonalidade menor

Topicos: escalas menores, acordes diatonicos de uso pratico, funcoes tonais, modos, harmonizacao/rearmonizacao diatonica, dominantes secundarios, emprestimos e analises.

Uso no sistema:

- menor funcional precisa de caminho proprio, nao apenas "maior transposto";
- iiø, V7(b13), i6/m6 e acordes da menor harmonica/melodica devem virar criterios de geracao e validacao;
- nossa camada `minor-functional` deve ser auditada contra esses capitulos antes de ganhar mais cromatismo.

#### Modulacao

Topicos: definicoes, tipos e analises.

Uso no sistema:

- antes de implementar modulacao completa, tratar centro local e regioes temporarias;
- diferenciar rearmonizacao cromatica de mudanca real de centro;
- usar cadencias e acordes-pivo como evidencias, nao como chute por acorde isolado.

### Parte III - Harmonia aplicada

#### Samba

Topicos: relacao dos sambas analisados, classes de acordes, forma, relacao melodia-harmonia e formulas harmonicas.

Uso no sistema:

- comparar frequencia de classes de acordes sem transformar genero em regra;
- usar forma e relacao melodia-harmonia como contexto de ranking;
- observar padroes recorrentes de funcao, cadencia, baixo e densidade harmonica;
- evitar que a engine dependa de etiquetas como samba, choro ou jazz para decidir a harmonia.

#### Choro

Topicos: relacao dos choros analisados, classes de acordes, forma, relacao melodia-harmonia, formulas harmonicas e consideracoes finais.

Uso no sistema:

- catalogar formulas por secao;
- observar modulacoes de parte B/C;
- avaliar dominantes secundarias e diminutos como recursos estruturais recorrentes;
- comparar nossas musicas reais importadas com essas formulas.

## Implicacoes para os proximos blocos

### F83 - SubV funcional ampliado

Objetivo: sair do SubV apenas cadencial e gerar SubV para alvos diatonicos.

Regras iniciais:

- alvo deve ser grau diatonico funcional;
- raiz do SubV deve estar um semitom acima do alvo;
- a resolucao deve ser local e explicita;
- a proposta deve ficar como alternativa se o cromatismo nao for sustentado pela melodia/referencia.

### F84 - Diminutos por resolucao e enharmonia

Status: executado em `docs/sprints/f84-diminished-resolution-enharmony.md`.

Objetivo: melhorar diminutos para alem de passagem simples.

Regras iniciais:

- tratar a simetria do diminuto;
- escolher a fundamental pelo alvo de resolucao;
- distinguir diminuto dominante, cromatico e auxiliar;
- evitar cifragem enganosa quando outra fundamental explica melhor a resolucao.

Resultado atual:

- `dim7` e validado pela resolucao de qualquer nota do acorde por semitom para o alvo funcional;
- o gerador usa `dim7` para diminutos de passagem;
- o sugeridor de baixo nao adiciona slash bass em diminutos completos.

### F85 - Emprestimos funcionais

Status: executado em `docs/sprints/f85-functional-modal-borrowing.md`.

Objetivo: separar emprestimos por origem funcional.

Regras iniciais:

- dominante, subdominante e homonima menor devem ter validadores diferentes;
- emprestimo precisa de funcao preservada ou efeito cadencial claro;
- a melodia deve justificar pelo menos uma nota caracteristica quando a cor for forte.

Resultado atual:

- `ivm`, `bVI` e `bVII` podem ser gerados como cores do modo paralelo menor em contexto maior;
- `bVI` e `bVII` preservam a leitura de região subdominante, sem trocar automaticamente o centro tonal;
- a geração exige apoio melodico estrutural e validacao do arco funcional.

### F86 - Vocabulario harmonico aplicado

Status: executado em `docs/sprints/f86-applied-harmonic-vocabulary-audit.md`.

Objetivo: usar a parte aplicada do livro como lente teorica para auditar formulas harmonicas em musicas reais.

Regras iniciais:

- classificar formulas harmonicas por funcao e resolucao;
- medir classes de acordes e regioes modulantes;
- comparar a saida do harmonizador com formulas recorrentes;
- produzir relatorios separados de "harmonizacao geral" e "vocabulario harmonico aplicado".

Resultado atual:

- criada auditoria separada de vocabulario harmonico aplicado;
- o relatorio mede formulas, nao genero ou estilo;
- a primeira lista prioriza obras/trechos com ii-V, dominantes aplicadas, SubV, diminutos resolvidos, emprestimos modais, cadencia plagal menor, tonicas 6/6-9 e baixos indicados.

## Atualizacao do nosso estado teorico

O projeto esta em um ponto coerente com a arquitetura do livro:

1. Ja temos harmonizacao basica por melodia.
2. Ja temos expansao diatonica e dominantes secundarias.
3. Ja comecamos a expansao da funcao dominante com dominantes alteradas.
4. O proximo salto natural e completar o mesmo bloco teorico: SubV ampliado, diminutos por funcao e alteracoes com melhor contexto melodico.
5. Depois disso, a engine deve entrar em emprestimos, menor funcional e aplicacao estilistica.
