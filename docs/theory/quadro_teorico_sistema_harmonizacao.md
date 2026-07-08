# Quadro Teórico do Sistema de Harmonização

Última atualização: 2026-07-04

Este documento descreve o modelo teórico-operacional do Harmonizar. Ele complementa `docs/theory/estado_teorico_harmonizacao.md`: o outro documento explica de onde vêm as ideias; este organiza como essas ideias devem decidir dentro do sistema.

O ponto central é simples:

> O Find Chord não deve gerar acordes possíveis. Ele deve revelar leituras harmônicas plausíveis de uma frase melódica, preservando melodia, função e direção musical.

---

## 1. Princípio de hierarquia

As camadas do sistema não têm o mesmo peso. A ordem correta é:

1. **Melodia**: o que não pode ser traído.
2. **Frase/região**: onde começa e termina a unidade musical que estamos harmonizando.
3. **Centro tonal/modal**: qual campo gravitacional está ativo.
4. **Função**: que papel cada evento cumpre na frase.
5. **Gramática harmônica**: quais estratégias são admitidas nesse contexto.
6. **Cifragem**: como símbolos reais viram acordes sem ambiguidade silenciosa.
7. **Condução de vozes**: qual alternativa se move melhor entre acordes.
8. **Idioma**: que linguagem está sendo evocada: tonal, popular, jazz, modal, blues, menor etc.
9. **Explicabilidade**: por que a proposta funciona e por que outras foram omitidas.

Essa hierarquia evita dois erros:

- sugerir acordes teoricamente possíveis que não respeitam a melodia;
- aceitar uma condução suave que não cumpre função musical.

---

## 2. As perguntas fundamentais

Cada camada responde uma pergunta diferente.

| Camada | Pergunta |
| --- | --- |
| Melodia | Quais notas estruturais precisam ser sustentadas? |
| Frase | Qual trecho deve ser pensado como unidade? |
| Centro | Onde está a gravidade principal ou local? |
| Função | Este evento é repouso, preparação, tensão, prolongamento ou escape? |
| Estratégia | Que tipo de harmonização está sendo proposta? |
| Substituição | O que muda sem perder a função? |
| Cifragem | A cifra real foi entendida de modo musicalmente correto? |
| Condução | Essa passagem chega bem no próximo acorde? |
| Idioma | A regra tonal comum ainda vale aqui? |
| Explicação | O músico entende o motivo da escolha? |

O sistema só deve avançar para uma camada quando a anterior estiver suficientemente clara.

---

## 3. Camada 1 — Melodia soberana

A melodia é o contrato físico da harmonização.

Critérios:

- notas longas pesam mais que notas curtas;
- notas em início/fim de frase pesam mais que ornamentos internos;
- notas repetidas ou cadenciais têm força estrutural;
- notas de passagem podem tolerar atrito momentâneo;
- a nota final da frase ajuda a inferir repouso, meia-cadência ou abertura.

Estado atual:

- já usamos âncoras melódicas;
- já existe cobertura melódica por acorde/proposta;
- já existe classificação inicial de apoio estrutural, nota de passagem e ornamento;
- ainda falta classificar melhor aproximação cromática, suspensão e tensão expressiva.

Regra de ouro:

> Se a proposta não sustenta a melodia estrutural, ela não é harmonização: é outra composição.

---

## 4. Camada 2 — Frase, seção e região

A unidade de pensamento não deve ser sempre a música inteira. A experiência com Asa Branca mostrou isso com clareza: a parte A pode estar quase perfeita enquanto a parte B precisa de leitura própria.

Níveis:

- **Compasso**: unidade local de cobertura melódica.
- **Frase**: unidade musical de pergunta/resposta ou tensão/repouso.
- **Seção**: parte formal, como A, B, Intro, Bridge.
- **Região harmônica**: agrupamento funcional interno, como estabelecimento, predominante, dominante, cadencial.

Estado atual:

- a UI já trabalha com seções formais explícitas ou inferidas;
- quando a partitura não possui marcações, o sistema cria blocos de 8 compassos;
- ainda falta uma camada de região funcional dentro da seção.

Aprendizado recente:

> Antes de sofisticar SubV7, empréstimos ou cromatismos, precisamos garantir que o sistema está harmonizando a frase certa.

---

## 5. Camada 3 — Centro tonal, centro local e centro modal

O centro não é apenas a armadura. Ele pode ser:

- centro global da música;
- centro da seção;
- centro local de uma cadência ii-V-I;
- centro modal sem cadência V-I;
- centro ambíguo, quando a frase ainda não declara repouso.

Estado atual:

- `PhraseAnalysisEngine` escolhe um centro principal;
- já há suporte inicial a cadências locais ii-V;
- ainda falta separar melhor centro global, centro da frase e centro local.

Risco atual:

- uma frase curta pode ser forçada para o centro global;
- uma frase B pode precisar de subdominante ou região local, mas ser lida como continuação do repouso da parte A.

Direção:

> O sistema deve carregar uma pilha de centros: global, seção, frase e alvo cadencial local.

---

## 6. Camada 4 — Função estrutural

A função é o esqueleto da frase. Hoje o sistema usa:

```text
T -> PD -> D -> T
```

Tradução:

- `T`: repouso, prolongamento, estabelecimento;
- `PD`: preparação, subdominante, abertura de caminho;
- `D`: tensão, dominante, impulso resolutivo;
- `OTHER`: evento auxiliar, cromático ou aparente.

Estado atual:

- a validação por backbone funcional já existe;
- a cadência final já pesa;
- dominantes secundários e diminutos são validados por resolução;
- ainda falta modelar regiões de função aparente e menor/modal com mais precisão.

Princípio:

> A cifra é a superfície. A função é o comportamento.

---

## 7. Camada 5 — Estratégias de harmonização

As estratégias devem ser degraus de afastamento, não uma lista solta.

Ordem atual:

| Degrau | Estratégia | Objetivo |
| --- | --- | --- |
| 1 | I-IV-V | harmonização primária |
| 2 | expansão diatônica | relativos, prolongamentos, inversões |
| 3 | ii-V local | cadência funcional em alvo local |
| 4 | dominante secundário | tonicização local |
| 5 | diminuto de passagem | aproximação cromática resolvida |
| 6 | substituição controlada | trocar acorde preservando função |
| 7 | SubV7 / ii-subV7 | cromatismo dominante funcional |
| 8 | empréstimo modal | cor funcional vinda de modo paralelo |
| 9 | modal/blues | gramáticas não dependentes de V-I clássico |

Estado atual:

- degraus 1 a 5 existem em forma inicial;
- degrau 6 existe de modo pequeno;
- degraus 7 a 9 ainda são próximos horizontes.

Regra:

> Cada degrau novo precisa explicar o que preserva e o que altera.

---

## 8. Camada 6 — Funções aparentes e substituições

Função aparente é quando a cifra escrita parece outra coisa, mas o comportamento funcional é claro.

Casos centrais:

- sus como dominante suspenso ou preparação;
- diminuto como dominante com b9 implícita, subdominante ou passagem cromática;
- m6 como dominante implícito ou acorde de função dupla;
- #IVm7(b5) como intensificação predominante;
- SubV7 como dominante por trítono;
- subIIm7 como preparação cromática para SubV7;
- empréstimos modais como mudança de cor com função preservada.

Estado atual:

- sus, diminuto, m6 e #IVm7(b5) já têm leitura contextual inicial;
- substituição controlada ainda precisa virar tabela mais ampla;
- SubV7 e ii-subV7 são candidatos naturais para o próximo ciclo.

Princípio:

> Uma substituição só é boa quando preserva algo reconhecível: função, melodia, baixo, direção ou memória cadencial.

---

## 9. Camada 7 — Condução de vozes

A condução de vozes não decide sozinha o que é harmonia correta. Ela escolhe melhor entre harmonias já aceitáveis.

Ela responde:

```text
Esta progressão se move bem?
```

Critérios:

- notas comuns;
- movimento por grau conjunto;
- resolução de sétima dominante;
- resolução de sensível;
- guide tones em ii-V-I;
- baixo coerente com a função;
- ausência de saltos internos desnecessários.

Estado atual:

- F28 adicionou uma régua de ranking por condução;
- o card já pode mostrar score e evidências;
- F37 adicionou diagnosticos locais de suporte ou atrito de conducao;
- F37.1 adicionou sugestoes conservadoras de inversao simples no baixo;
- F37.2 adicionou perfil proprio da linha de baixo;
- F37.3 passou a usar perfil de baixo como ajuste fino de ranking;
- ainda não há realização completa de vozes internas, nem voicings físicos por instrumento.

Fronteira:

> Nesta fase, condução é ranking e explicação, não motor autônomo de contraponto.

---

## 10. Camada 8 — Cifragem e dialeto harmônico

A cifra não é apenas texto. Ela é uma interface entre repertório real, software, tradição pedagógica e motor interno.

Riscos:

- uma cifra válida como `Bm7(b5)` pode não ser entendida por uma biblioteca;
- aliases como `Cø`, `Cm7b5` e `Cm7(b5)` precisam representar o mesmo acorde;
- grafias como `C7+` são ambíguas por perfil;
- MusicXML é semântico, mas a cifra exibida pode ser apenas aparência.

Estado atual:

- existe um contrato versionável em `docs/theory/chord_symbol_dictionary.md`;
- as fontes estão em `docs/references/chord_symbol_sources.md`;
- F33 criou `ChordSymbolResolver`;
- `noteCoveredByChord` já usa o resolvedor para cobertura melódica.

Princípio:

> A engine deve trabalhar com uma forma interna única; o usuário pode ver o dialeto musical adequado ao contexto.

---

## 11. Camada 9 — Idioma

Nem todo repertório obedece do mesmo jeito à harmonia tonal comum.

Idiomas que precisamos modelar:

### Tonal popular

- funções T/PD/D;
- dominantes secundários;
- SubV7;
- empréstimos;
- cadências idiomáticas.

### Jazz funcional

- ii-V-I local;
- guide tones;
- dominantes alterados;
- tritone substitution;
- diminutos conectivos;
- extensões e tensões.

### Modal

- centro sem V-I;
- nota característica;
- pedal;
- estabilidade por cor, não por cadência.

### Blues

- dominante como estabilidade;
- I7, IV7 e V7 sem obrigação tonal clássica;
- mistura maior/menor;
- cadência e riff como função.

### Menor profundo

- natural, harmônico e melódico como campos funcionais;
- dominante maior em menor;
- iiø-V-i;
- subdominantes menores;
- bVI, bVII, Neapolitano e empréstimos.

Estado atual:

- tonal popular e ii-V local estão mais maduros;
- modal e blues já possuem reconhecimento e primeira geração mínima;
- menor profundo já separa evidências de menor natural, harmônico e melódico no classificador;
- menor funcional já possui primeira geração mínima com `bVI`/`bVII`, `iiø`, `i6` e fechamento `V7 -> i`;
- a fronteira entre menor funcional e centro modal já usa melodia e harmonia de referência como evidência inicial.

---

## 12. Camada 10 — Ranking, distância e curadoria

Quando várias propostas funcionam, o sistema deve ordenar por utilidade musical.

Eixos de ranking:

- cobertura melódica;
- integridade funcional;
- resolução local;
- condução de vozes;
- distância do original;
- densidade harmônica;
- risco melódico;
- clareza idiomática;
- reversibilidade.

Estado atual:

- ranking por condução já começou;
- ainda falta medir distância do original;
- ainda falta separar propostas conservadoras, moderadas, cromáticas e radicais.

Direção:

> O usuário não precisa de 30 acordes possíveis. Precisa de poucas rotas inteligíveis.

---

## 13. Camada 11 — Explicabilidade

A explicação é parte do motor, não decoração de UI.

Boa explicação:

- fala em consequências musicais;
- evita enum interno;
- separa preservado e alterado;
- diz por que funciona;
- pode dizer por que algo foi omitido.

Exemplos bons:

- "acompanha integralmente as notas estruturais da melodia";
- "fecha a frase com resolução cadencial";
- "mantém notas comuns entre os acordes";
- "sétima dominante resolve descendo para a terça do alvo";
- "exploração omitida por baixa compatibilidade melódica".

Exemplos ruins:

- `CADENTIAL_RESOLUTION`;
- `Preserva função PD`;
- `score: 0.742`;
- "melhor acorde".

Regra:

> O sistema pode pensar em métricas, mas deve falar como músico.

---

## 14. Ordem de decisão do Harmonizar

Fluxo ideal:

```text
Partitura / melodia
  -> seleção de seção ou frase
  -> extração de âncoras
  -> centro global e centro local
  -> geração de estratégias por degrau
  -> resolução canônica das cifras
  -> validação melódica
  -> validação funcional
  -> validação de resolução
  -> ranking por condução de vozes
  -> classificação por distância/risco
  -> explicação
  -> aplicação em Escrever
```

O sistema deve evitar atalhos que pulem melodia, frase ou função.

---

## 15. Estados de maturidade

| Camada | Estado |
| --- | --- |
| Melodia como restrição | operacional |
| Seção formal/inferida | operacional inicial |
| Região funcional interna | faltando |
| Centro tonal global | operacional inicial |
| Centro local | parcial |
| Função T/PD/D | operacional |
| Estratégias I-IV-V/expansão | operacional |
| ii-V local | parcial |
| Dominantes secundários | operacional inicial |
| Diminutos de passagem | operacional inicial |
| Função aparente | parcial |
| Substituição controlada | parcial |
| Resolvedor de cifras | operacional inicial |
| Voice leading como ranking | operacional inicial |
| Distância do original | faltando |
| Modal/blues/menor profundo | parcial, com fronteira menor/modal inicial |
| Explicabilidade positiva | operacional inicial |
| Explicabilidade negativa | parcial, com contrato estruturado de diagnósticos |

---

## 16. Próximas perguntas teóricas antes de mais código

Antes de continuar refinando regras, vale responder:

1. Como distinguir nota estrutural de ornamento de forma confiável?
2. Como dividir frases quando a partitura não tem seções explícitas?
3. Como representar centro global, centro de seção e centro local ao mesmo tempo?
4. Qual é a tabela mínima de substituições por função para maior e menor?
5. Quando SubV7 é substituição funcional e quando vira cromatismo sem direção?
6. Como medir distância do original sem transformar isso em julgamento de valor?
7. Como detectar que uma progressão é modal e não "tonal incompleta"?
8. Como modelar blues sem penalizar I7 e IV7 como dominantes não resolvidos?
9. Qual vocabulário de explicação queremos fixar para o usuário?
10. Quais perfis de cifragem devem ser suportados na importação e na exibição?

Essas perguntas devem guiar os próximos sprints.

---

## 17. Roadmap teórico recomendado

### F28.1 — Frase e região

- Especificação: `docs/sprints/f28-1-phrase-region-windowing.md`.
- Melhorar divisão de frases dentro de seções.
- Diferenciar parte A, parte B, pergunta/resposta e região cadencial.
- Evitar que uma seção longa seja tratada como bloco homogêneo.

### F29 — SubV7 e ii-subV7

- Pré-requisito implementado: `docs/sprints/f28-2-functional-region-planner.md`.
- Pré-requisito implementado: `docs/sprints/f28-3-melodic-region-evidence.md`.
- Pré-requisito implementado: `docs/sprints/f28-4-cadential-closure-reading.md`.
- Primeira fatia implementada: `docs/sprints/f29-cadential-subv7.md`.
- Segunda fatia implementada: `docs/sprints/f29-1-ii-subv7-cadential.md`.
- Terceira fatia implementada: `docs/sprints/f29-2-subv7-voice-leading-ranking.md`.
- Implementar substituição tritonal como dominante funcional.
- Usar condução de vozes para premiar resolução cromática.
- Explicar o que foi preservado e alterado.

### F30 — Tabela de substituições por função

- Primeira fatia implementada: `docs/sprints/f30-functional-substitution-table.md`.
- Segunda fatia implementada: `docs/sprints/f30-1-substitution-idioms.md`.
- Terceira fatia implementada: `docs/sprints/f30-2-minor-functional-activation.md`.
- Quarta fatia implementada: `docs/sprints/f30-3-substitution-idiom-inference.md`.
- Sistematizar substitutos de T, PD e D.
- Incluir função aparente: sus, dim, m6, #IVm7(b5).
- Separar maior e menor.

### F31 — Distância e rotas

- Primeira fatia implementada: `docs/sprints/f31-harmonic-route-distance.md`.
- Segunda fatia implementada: `docs/sprints/f31-1-route-aware-proposal-ranking.md`.
- Terceira fatia implementada: `docs/sprints/f31-2-route-profile-classification.md`.
- Quarta fatia implementada: `docs/sprints/f31-3-profile-aware-proposal-presentation.md`.
- Quinta fatia implementada: `docs/sprints/f31-4-boldness-mode.md`.
- Sexta fatia implementada: `docs/sprints/f31-5-local-iiv-window-proposals.md`.
- Classificar propostas em conservadora, moderada, cromática e radical.
- Medir distância do original e distância da proposta anterior.
- Preparar rotas harmônicas por região.

### F32 — Modal, blues e menor profundo

- Primeira fatia implementada: `docs/sprints/f32-harmonic-idiom-classifier.md`.
- Segunda fatia implementada: `docs/sprints/f32-1-idiom-aware-presentation-guard.md`.
- Terceira fatia implementada: `docs/sprints/f32-2-minimal-blues-functional-strategy.md`.
- Quarta fatia implementada: `docs/sprints/f32-3-minimal-modal-center-strategy.md`.
- Quinta fatia implementada: `docs/sprints/f32-4-minor-field-color-classifier.md`.
- Sexta fatia implementada: `docs/sprints/f32-5-minor-functional-strategy.md`.
- Detectar gramáticas não dependentes de V-I.
- Tratar blues e modal como idiomas próprios.
- Expandir tonalidade menor para além de "modo menor genérico".

### F33 — Cifragem como contrato de domínio

- Contrato criado: `docs/theory/chord_symbol_dictionary.md`.
- Fontes criadas: `docs/references/chord_symbol_sources.md`.
- Primeira fatia implementada: `docs/sprints/f33-chord-symbol-resolver.md`.
- Segunda fatia implementada: `docs/sprints/f33-1-chord-resolver-analysis-migration.md`.
- Terceira fatia implementada: `docs/sprints/f33-2-chord-resolver-apparent-voiceleading-migration.md`.
- Quarta fatia implementada: `docs/sprints/f33-3-real-music-chord-compatibility.md`.
- Quinta fatia implementada: `docs/sprints/f33-4-musicxml-semantic-chord-mapping.md`.
- Sexta fatia implementada: `docs/sprints/f33-5-musicxml-harmony-renderer-roundtrip.md`.
- Criar resolvedor próprio de cifras.
- Separar forma interna, forma de exibição e perfil de importação.
- Migrar gradualmente os pontos que dependem diretamente de `Chord.get`.
- Validar o contrato contra cifras reais em `docs/musics`.
- Projetar cifras resolvidas para `MusicXML kind + degree[]`.
- Renderizar blocos `<harmony>` mínimos com round-trip testado.

### F34 — Fronteira menor funcional/modal

- Primeira fatia implementada: `docs/sprints/f34-minor-functional-modal-boundary.md`.
- Segunda fatia implementada: `docs/sprints/f34-1-reference-minor-modal-boundary.md`.
- Terceira fatia implementada: `docs/sprints/f34-2-minor-modal-presentation-priority.md`.
- Quarta fatia implementada: `docs/sprints/f34-3-comparative-presentation-role.md`.
- Quinta fatia implementada: `docs/sprints/f34-4-omitted-strategy-diagnostics.md`.
- Sexta fatia implementada: `docs/sprints/f34-5-expanded-omitted-strategy-diagnostics.md`.
- Separar `i-bVII-bVI` modal de menor funcional cadencial.
- Evitar que o sistema invente `V7 -> i` quando a melodia nao sugere sensivel ou menor melodico.
- Evitar que centro modal concorra com menor funcional quando a melodia traz direcao cadencial clara.
- Usar a harmonia de referencia como evidencia quando ela confirma `V7 -> i`, `iiø-V-i` ou centro modal sem sensivel.
- Usar essa evidencia para preservar referencia modal clara ou priorizar menor funcional cadencial na apresentacao.
- Separar `Comparação` de `Alternativa` quando uma proposta fica subordinada a evidencia contextual.
- Explicar leituras omitidas por falta de sensivel, por direcao cadencial menor ou por referencia modal/funcional clara.
- Expandir diagnosticos de omissao para blues parcial, ii-V local sem cobertura melodica e SubV7 sem compatibilidade melodica.

### F35 — Contrato de diagnosticos harmonicos

- Primeira fatia implementada: `docs/sprints/f35-harmonic-diagnostic-contract.md`.
- Segunda fatia implementada: `docs/sprints/f35-1-diagnostic-source-grouping.md`.
- Terceira fatia implementada: `docs/sprints/f35-2-diagnostic-mode-visibility.md`.
- Quarta fatia implementada: `docs/sprints/f35-3-diagnostic-category-labels.md`.
- Quinta fatia implementada: `docs/sprints/f35-4-presentation-diagnostics.md`.
- Sexta fatia implementada: `docs/sprints/f35-5-causal-presentation-diagnostics.md`.
- Sétima fatia implementada: `docs/sprints/f35-6-card-level-diagnostics.md`.
- Substituir listas soltas de texto por `HarmonicDiagnostic`.
- Separar origem do diagnostico: geracao, referencia e apresentacao.
- Deduplicar diagnosticos por `id`.
- Filtrar diagnosticos por modo simples/equilibrado/exploratorio.
- Agrupar diagnosticos na UI por origem musical.
- Reduzir ruido no modo simples e reservar diagnosticos cromaticos para o modo exploratorio.
- Exibir categoria curta por diagnostico: omissao, comparacao ou compatibilidade.
- Emitir diagnosticos de apresentacao a partir dos papeis `Comparação` e `Exploração`.
- Diferenciar diagnosticos de apresentacao por causa: referencia modal, menor funcional cadencial ou exploracao.
- Anexar diagnosticos especificos ao card da proposta quando seu papel de apresentacao exigir explicacao local.

### F36 — Peso melodico estrutural

- Primeira fatia implementada: `docs/sprints/f36-melodic-anchor-classifier.md`.
- Segunda fatia implementada: `docs/sprints/f36-1-weighted-melodic-coverage.md`.
- Terceira fatia implementada: `docs/sprints/f36-2-melodic-resolution-coverage.md`.
- Quarta fatia implementada: `docs/sprints/f36-3-melodic-coverage-diagnostics.md`.
- Criar um classificador inicial de ancora melodica.
- Separar `structural`, `passing` e `ornamental`.
- Usar peso melodico na escolha de acordes, em vez de contagem bruta de notas.
- Usar peso melodico nos validadores de cobertura.
- Dar credito parcial a suspensao, aproximacao cromatica e passagem por grau conjunto quando ha resolucao.
- Explicar a cobertura melodica como diagnostico musical, nao como porcentagem crua.
- Preservar bonus cadencial apenas quando a classificacao usa a frase inteira.
- Evitar que uma nota curta ornamental vença um apoio melodico estrutural.
- Preparar a futura camada de conducao de vozes sem transformar o sistema em um motor contrapontistico completo.

### F37 — Conducao de vozes como diagnostico

- Primeira fatia implementada: `docs/sprints/f37-voice-leading-diagnostics.md`.
- Segunda fatia implementada: `docs/sprints/f37-1-bass-inversion-suggestions.md`.
- Terceira fatia implementada: `docs/sprints/f37-2-bass-line-profile.md`.
- Quarta fatia implementada: `docs/sprints/f37-3-bass-line-ranking-adjustment.md`.
- Manter conducao como ranking e explicacao, nao como motor autonomo.
- Emitir diagnostico local quando a proposta preserva notas comuns ou resolve tendencias.
- Emitir diagnostico local quando a proposta tem tendencia sem resolucao clara ou salto interno relevante.
- Reutilizar o contrato `HarmonicDiagnostic` com `category: compatibility`.
- Sugerir slash chords simples quando uma nota do proprio acorde suaviza a linha de baixo.
- Classificar a linha de baixo como caminhante, cromatica, pedal, funcional, saltada ou mista.
- Usar o perfil de baixo apenas como desempate/refinamento leve no ranking.

### F38 — Prova de fogo com repertorio real

- Fase implementada: `docs/sprints/f38-real-music-fire-audit.md`.
- Criar uma auditoria executavel sobre todas as partituras em `docs/musics`.
- Validar o pipeline completo: MusicXML -> ancoras melodicas -> frase -> propostas -> ranking -> apresentacao.
- Proteger contratos gerais sem exigir uma harmonizacao autoral perfeita para cada obra.
- Confirmar que cada proposta apresentada tem cifras, baixo, perfil de rota, perfil de baixo, conducao de vozes e papel de apresentacao.
- Confirmar que diagnosticos globais e locais continuam obedecendo `HarmonicDiagnostic`.
- Usar repertorio real como criterio minimo de estabilidade antes de novos refinamentos esteticos.

### F39 — Relatorio musical por obra

- Fase implementada: `docs/sprints/f39-real-music-audit-report.md`.
- Relatorio gerado: `docs/reports/f39-real-music-audit-report.md`.
- Comando de geracao: `npm run report:real-music`.
- Extrair a auditoria real para `scripts/real-music-audit.ts`.
- Registrar por obra: material importado, janela melodica, centro escolhido, proposta primaria, cifras, baixo, perfis e diagnosticos.
- Separar arquivos harmonizaveis de arquivos apenas com referencia harmonica.
- Usar o relatorio como instrumento de escuta antes de refinar regras.
- Preparar a proxima fase: comparar proposta primaria com harmonia de referencia quando ela existir.

### F40 — Comparacao com harmonia de referencia

- Fase implementada: `docs/sprints/f40-reference-harmony-comparison.md`.
- Criar `ReferenceHarmonyComparator`.
- Alinhar proposta primaria e cifras importadas por compasso.
- Comparar funcao aparente e raiz, sem tratar a referencia como gabarito absoluto.
- Reutilizar `ReferenceHarmonyAnalysis` para idioma, cadencias locais e fronteira menor/modal.
- Expor no relatorio real uma sintese de alinhamento, parcialidade ou divergencia.
- Preparar diagnosticos futuros para divergencia aceitavel, centro divergente, cadencia omitida e cromatismo nao sustentado.

### F41 — Causas de divergencia contra a referencia

- Fase implementada: `docs/sprints/f41-reference-divergence-causes.md`.
- Acrescentar causas classificadas a `ReferenceHarmonyComparator`.
- Diferenciar funcao preservada com outra raiz de divergencia funcional real.
- Detectar centro divergente entre proposta e referencia.
- Detectar cadencia de referencia nao acompanhada funcionalmente.
- Marcar idioma de referencia relevante quando a referencia nao e major-funcional.
- Expor as causas no relatorio real sem transformar divergencia em erro automatico.

### F42 — Expansao do corpus real

- Fase implementada: `docs/sprints/f42-expanded-real-music-corpus.md`.
- Incorporar `Actual proof.musicxml`, `a child is born.musicxml` e `a fine romance.musicxml`.
- Aumentar o corpus real de 8 para 11 MusicXML.
- Aumentar o vocabulario real de cifras de 44 para 88 simbolos unicos.
- Expandir `ChordSymbolResolver` para grafias reais de sus dominante, `#11`, `add9+b7` e formas redundantes vindas de MusicXML.
- Regenerar `docs/reports/f39-real-music-audit-report.md` com o corpus ampliado.
- Usar as novas divergencias como fila musical para janelas por secao, leitura de centro e idioma jazz/standard.

### F43 — Selecao de janela comparavel com referencia

- Fase implementada: `docs/sprints/f43-reference-aware-window-selection.md`.
- Fazer a auditoria preferir janelas harmonizaveis que tambem sobrepoem cifras de referencia.
- Medir `referenceOverlapCount` por obra.
- Exibir a sobreposicao no relatorio real.
- Evitar que musicas com cifras aparecam como `sem referencia comparavel` apenas por escolha ruim de janela.
- Revelar o proximo problema: centro de referencia ainda precisa ser inferido com mais contexto que o primeiro acorde.

### F44 — Novo lote de repertorio real

- Fase implementada: `docs/sprints/f44-expanded-standards-corpus.md`.
- Incorporar sete novas musicas reais ao corpus.
- Aumentar o corpus real de 11 para 18 MusicXML.
- Aumentar o vocabulario real de cifras de 88 para 135 simbolos unicos.
- Confirmar que o resolvedor atual absorve o novo lote sem novas regras de cifra.
- Regenerar `docs/reports/f39-real-music-audit-report.md`.
- Confirmar que a proxima prioridade musical e inferir melhor o centro da referencia em repertorio jazz/standard.

### F45 — Inferencia de centro da referencia

- Fase implementada: `docs/sprints/f45-reference-center-inference.md`.
- Inferir centro da referencia por cadencias e repousos, nao pelo primeiro acorde.
- Usar celulas ii-V-I e iiø-V-i como evidencia forte.
- Usar acorde final e acordes de repouso como evidencia media.
- Manter o primeiro acorde apenas como evidencia fraca.
- Exibir centro, modo e confianca da referencia no relatorio real.
- Reduzir falsos alertas de centro divergente em standards.

### F46 — Centro global e centro local da referencia

- Fase implementada: `docs/sprints/f46-local-global-reference-centers.md`.
- Separar centro global da referencia e centro local da janela comparada.
- Usar a harmonia completa para centro global.
- Usar apenas compassos sobrepostos entre proposta e referencia para centro local.
- Preferir o centro local como centro ativo da comparacao quando houver evidencia.
- Exibir centro local e global no relatorio quando eles divergirem.
- Preparar diagnosticos mais ricos para diferenciar divergencia global, divergencia local e tonicizacao acompanhada.

### F47 — Diagnosticos refinados de centro local/global

- Fase implementada: `docs/sprints/f47-refined-center-divergence-diagnostics.md`.
- Refinar `centro divergente` em causas separadas para centro local e centro global.
- Diferenciar proposta que ignora a tonicizacao local de proposta que ignora o centro global da obra.
- Marcar quando a proposta acompanha o centro local, mas diverge do global.
- Marcar quando a proposta acompanha o centro global, mas ignora o centro local.
- Manter `center-mismatch` como fallback para comparacoes sem centro local/global explicito.
- Expor as novas causas no relatorio real com linguagem musical.
- Tornar standards e trechos tonicizantes mais legiveis na auditoria sem transformar a referencia em gabarito absoluto.

### F48 — Centro de frase assistido por referencia

- Fase implementada: `docs/sprints/f48-reference-aware-phrase-center.md`.
- Criar `applyReferenceCenterToPhraseContext`.
- Manter `PhraseAnalysisEngine` como leitura melodica principal.
- Promover centro de referencia apenas quando a confianca for media ou forte.
- Ignorar centro de referencia fraco para nao sequestrar a leitura melodica.
- Usar cifras sobrepostas a cada janela na auditoria real.
- Usar cifras da secao ativa no produto antes da geracao de propostas.
- Fazer propostas nascerem do centro local quando a referencia real sustenta essa leitura.

### F49 — Rastreabilidade do centro assistido por referencia

- Fase implementada: `docs/sprints/f49-reference-center-traceability.md`.
- Adicionar `selectedCenterSource` ao `PhraseContext`.
- Preservar evidencias de centro quando a referencia promove o centro da frase.
- Exibir origem e evidencia do centro no relatorio real.
- Emitir diagnostico de referencia no produto quando o centro da frase foi ajustado pela harmonia da secao.
- Manter essa explicacao fora do modo simples para nao poluir a experiencia inicial.

### F50 — Linguagem musical para evidencia de centro

- Fase implementada: `docs/sprints/f50-reference-center-evidence-language.md`.
- Formatar `selectedCenterEvidence` em linguagem de musico.
- Trocar evidencias internas como `ii-V-I local aponta G maior` por `cadência ii-V-I confirma G maior`.
- Trocar repousos inferidos por frases como `repousos recorrentes sustentam Eb maior`.
- Incluir a primeira evidencia musical no diagnostico de centro assistido pela referencia.
- Regenerar o relatorio real com evidencias mais legiveis.

### F51 — Evidencias de centro como frases completas

- Fase implementada: `docs/sprints/f51-reference-center-evidence-sentences.md`.
- Criar `formatReferenceCenterEvidenceSentence`.
- Capitalizar e pontuar evidencias de centro na superficie final.
- Exibir evidencias do relatorio como frases independentes.
- Incluir evidencia pontuada no diagnostico de centro assistido pela referencia.

### F52 — Evidencia de centro nas explicacoes da proposta

- Fase implementada: `docs/sprints/f52-reference-center-proposal-explanations.md`.
- Anexar evidencia de centro assistido diretamente a explicacao da proposta.
- Cobrir `generateAcceptedProposals` e `tryStrategy`.
- Evitar duplicacao quando a proposta passa por mais de um caminho.
- Manter a decisao harmonica intacta e alterar apenas explicabilidade.

### F53 — Evidencias da proposta no relatorio real

- Fase implementada: `docs/sprints/f53-proposal-evidence-audit-report.md`.
- Exibir ate quatro evidencias da proposta primaria no relatorio real.
- Auditar o "por que funciona" fora da UI.
- Evitar anexar evidencia de centro de frase quando a proposta declara cadencia local para outro alvo.
- Separar centro de frase e alvo cadencial local para evitar explicacoes contraditorias.

### F54 — Alvo cadencial da proposta no relatorio real

- Fase implementada: `docs/sprints/f54-proposal-cadential-target-report.md`.
- Exibir alvo cadencial da proposta primaria quando ele puder ser inferido.
- Separar explicitamente centro da frase e alvo cadencial local.
- Tornar legiveis casos em que a janela esta em um centro, mas a proposta toniciza outro alvo.
- Preparar um futuro campo estruturado de `cadentialTarget` na proposta.

---

## 18. Síntese

O sistema deve pensar como um músico que harmoniza:

1. escuta a melodia;
2. entende a frase;
3. reconhece o centro;
4. escolhe uma função;
5. decide uma estratégia;
6. entende a cifra com segurança;
7. verifica se a voz conduz;
8. respeita o idioma;
9. explica a escolha.

Se mantivermos essa hierarquia, o Find Chord pode crescer sem virar uma coleção de truques harmônicos. Cada nova regra entra em uma camada clara, com responsabilidade clara e justificativa musical.
