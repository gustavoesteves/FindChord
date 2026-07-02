# Quadro Teórico do Sistema de Harmonização

Última atualização: 2026-07-02

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
- ainda falta classificar melhor nota estrutural, nota ornamental, aproximação cromática, suspensão e tensão expressiva.

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

- Especificação: `docs/f28-1-phrase-region-windowing.md`.
- Melhorar divisão de frases dentro de seções.
- Diferenciar parte A, parte B, pergunta/resposta e região cadencial.
- Evitar que uma seção longa seja tratada como bloco homogêneo.

### F29 — SubV7 e ii-subV7

- Pré-requisito implementado: `docs/f28-2-functional-region-planner.md`.
- Pré-requisito implementado: `docs/f28-3-melodic-region-evidence.md`.
- Pré-requisito implementado: `docs/f28-4-cadential-closure-reading.md`.
- Primeira fatia implementada: `docs/f29-cadential-subv7.md`.
- Segunda fatia implementada: `docs/f29-1-ii-subv7-cadential.md`.
- Terceira fatia implementada: `docs/f29-2-subv7-voice-leading-ranking.md`.
- Implementar substituição tritonal como dominante funcional.
- Usar condução de vozes para premiar resolução cromática.
- Explicar o que foi preservado e alterado.

### F30 — Tabela de substituições por função

- Primeira fatia implementada: `docs/f30-functional-substitution-table.md`.
- Segunda fatia implementada: `docs/f30-1-substitution-idioms.md`.
- Terceira fatia implementada: `docs/f30-2-minor-functional-activation.md`.
- Quarta fatia implementada: `docs/f30-3-substitution-idiom-inference.md`.
- Sistematizar substitutos de T, PD e D.
- Incluir função aparente: sus, dim, m6, #IVm7(b5).
- Separar maior e menor.

### F31 — Distância e rotas

- Primeira fatia implementada: `docs/f31-harmonic-route-distance.md`.
- Segunda fatia implementada: `docs/f31-1-route-aware-proposal-ranking.md`.
- Terceira fatia implementada: `docs/f31-2-route-profile-classification.md`.
- Quarta fatia implementada: `docs/f31-3-profile-aware-proposal-presentation.md`.
- Quinta fatia implementada: `docs/f31-4-boldness-mode.md`.
- Sexta fatia implementada: `docs/f31-5-local-iiv-window-proposals.md`.
- Classificar propostas em conservadora, moderada, cromática e radical.
- Medir distância do original e distância da proposta anterior.
- Preparar rotas harmônicas por região.

### F32 — Modal, blues e menor profundo

- Primeira fatia implementada: `docs/f32-harmonic-idiom-classifier.md`.
- Segunda fatia implementada: `docs/f32-1-idiom-aware-presentation-guard.md`.
- Terceira fatia implementada: `docs/f32-2-minimal-blues-functional-strategy.md`.
- Quarta fatia implementada: `docs/f32-3-minimal-modal-center-strategy.md`.
- Quinta fatia implementada: `docs/f32-4-minor-field-color-classifier.md`.
- Sexta fatia implementada: `docs/f32-5-minor-functional-strategy.md`.
- Detectar gramáticas não dependentes de V-I.
- Tratar blues e modal como idiomas próprios.
- Expandir tonalidade menor para além de "modo menor genérico".

### F33 — Cifragem como contrato de domínio

- Contrato criado: `docs/theory/chord_symbol_dictionary.md`.
- Fontes criadas: `docs/references/chord_symbol_sources.md`.
- Primeira fatia implementada: `docs/f33-chord-symbol-resolver.md`.
- Segunda fatia implementada: `docs/f33-1-chord-resolver-analysis-migration.md`.
- Terceira fatia implementada: `docs/f33-2-chord-resolver-apparent-voiceleading-migration.md`.
- Quarta fatia implementada: `docs/f33-3-real-music-chord-compatibility.md`.
- Quinta fatia implementada: `docs/f33-4-musicxml-semantic-chord-mapping.md`.
- Sexta fatia implementada: `docs/f33-5-musicxml-harmony-renderer-roundtrip.md`.
- Criar resolvedor próprio de cifras.
- Separar forma interna, forma de exibição e perfil de importação.
- Migrar gradualmente os pontos que dependem diretamente de `Chord.get`.
- Validar o contrato contra cifras reais em `docs/musics`.
- Projetar cifras resolvidas para `MusicXML kind + degree[]`.
- Renderizar blocos `<harmony>` mínimos com round-trip testado.

### F34 — Fronteira menor funcional/modal

- Primeira fatia implementada: `docs/f34-minor-functional-modal-boundary.md`.
- Segunda fatia implementada: `docs/f34-1-reference-minor-modal-boundary.md`.
- Terceira fatia implementada: `docs/f34-2-minor-modal-presentation-priority.md`.
- Quarta fatia implementada: `docs/f34-3-comparative-presentation-role.md`.
- Quinta fatia implementada: `docs/f34-4-omitted-strategy-diagnostics.md`.
- Sexta fatia implementada: `docs/f34-5-expanded-omitted-strategy-diagnostics.md`.
- Separar `i-bVII-bVI` modal de menor funcional cadencial.
- Evitar que o sistema invente `V7 -> i` quando a melodia nao sugere sensivel ou menor melodico.
- Evitar que centro modal concorra com menor funcional quando a melodia traz direcao cadencial clara.
- Usar a harmonia de referencia como evidencia quando ela confirma `V7 -> i`, `iiø-V-i` ou centro modal sem sensivel.
- Usar essa evidencia para preservar referencia modal clara ou priorizar menor funcional cadencial na apresentacao.
- Separar `Comparação` de `Alternativa` quando uma proposta fica subordinada a evidencia contextual.
- Explicar leituras omitidas por falta de sensivel, por direcao cadencial menor ou por referencia modal/funcional clara.
- Expandir diagnosticos de omissao para blues parcial, ii-V local sem cobertura melodica e SubV7 sem compatibilidade melodica.

### F35 — Contrato de diagnosticos harmonicos

- Primeira fatia implementada: `docs/f35-harmonic-diagnostic-contract.md`.
- Segunda fatia implementada: `docs/f35-1-diagnostic-source-grouping.md`.
- Substituir listas soltas de texto por `HarmonicDiagnostic`.
- Separar origem do diagnostico: geracao, referencia e apresentacao.
- Deduplicar diagnosticos por `id`.
- Filtrar diagnosticos por modo simples/equilibrado/exploratorio.
- Agrupar diagnosticos na UI por origem musical.

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
