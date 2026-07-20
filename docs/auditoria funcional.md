# Auditoria funcional completa — Find Chord

Auditoria originalmente concluída sobre o commit `16f346c`; este documento agora também registra a remediação incremental.

Não encontrei P0. Encontrei P1 que quebram jornadas centrais e P2 que podem induzir decisões musicais incorretas.

## Estado atual da remediação funcional

Atualizado incrementalmente durante a remediação dos blocos P1/P2.

| Área | Feito | Ainda aberto |
|---|---|---|
| Escrever | Seleção de interpretações ambíguas; preservação de baixo nas aberturas; filtros aberto/fechado; opções de afinação do catálogo; ergonomia centralizada; exportação MuseScore agora separa cifra visual de cifra canônica. | Leitura/estrutura/tensão ainda dependem parcialmente de DTO simplificado; Materiais ainda precisa distinguir melhor nota soando, nota implícita e tensão; QML real ainda não usa shape/fretboard. |
| Harmonizar | Modo menor ganhou guardrail no ramo experimental; handoff Harmonizar→Writer cria sessão navegável; timelines/ticks/seleção estrutural foram amplamente remediados; distância harmônica já diferencia terças diatônicas de raiz alterada; apresentação preserva fundação I-IV-V contra expansões sem apoio; rótulos de condução de vozes foram alinhados ao score. | Regras contextuais e Improviso ainda precisam refinamento funcional. |
| MuseScore | Segurança/pareamento/ACK/origin Pages avançaram bastante; ações inexistentes foram removidas do protocolo tipado; status já mostra plugin e última partitura sincronizada. | Falta validação real QML/MuseScore e fila por instância/score. |
| Testes/documentação | CI já roda lint e suíte curada; documentos agora possuem trilha de progresso. | Falta E2E/React/bridge em porta efêmera e rastreabilidade teoria→regra→UI. |

Próximo bloco recomendado: `FC-HZ-12`, corrigir regras contextuais que ainda ensinam função, dominante e resolução de forma simplificada demais.

## Parecer executivo

1. **O módulo Escrever cumpre sua proposta?**  
   Parcialmente, com avanço importante. Seleção no braço, detecção básica, escolha explícita de interpretação ambígua, atualização das tabs, aberturas com baixo preservado, filtros de abertura, materiais locais e exportação canônica funcionam melhor. Ainda restam leitura semântica completa, distinção pedagógica fina em Materiais e validação QML real.

2. **O módulo Harmonizar cumpre sua proposta?**  
   Parcialmente para somente melodia, melodia+cifras e somente cifras. O handoff para o Writer já cria uma progressão navegável, o modo menor tem guardrail, e somente cifras agora gera leitura funcional e materiais sem validação melódica.

3. **Quais tabs estão completas?**  
   Nenhuma cumpre integralmente o contrato descrito. “Materiais do acorde” é a mais próxima para acordes completos e isolados.

4. **Quais são parciais?**  
   Braço, Leitura do acorde, Aberturas, Materiais do acorde, Harmonizações e Improviso.

5. **O que parece conectado, mas não está?**

   - Somente cifras ainda não vira análise funcional/Improviso.
   - O payload MuseScore leva shape e afinação, mas o plugin ignora esses dados.
   - Variantes de harmonia podem ser aplicadas sem possuírem leitura de Improviso.
   - O badge verde ainda mede dashboard↔bridge, não necessariamente MuseScore/plugin/score.

6. **Maior risco funcional vigente:** perda de identidade e tempo nas fronteiras restantes. A escolha de interpretação e o handoff de progressão melhoraram, mas eventos harmônicos densos, exportação canônica e requisições MuseScore ainda precisam vínculo mais forte.

7. **Maior risco musical:** resultados convincentes, mas incorretos, em modo menor, função dominante, cadências, notas-guia e resoluções.

8. **Maior risco MuseScore:** fila global e não idempotente, sem vínculo à partitura. Um comando pode chegar à instância errada, uma resposta tardia pode substituir o estado e um retry pode duplicar a inserção.

## Validações executadas

| Verificação | Resultado |
|---|---|
| `npm run build` | Aprovado. Estado original: bundle principal 596,39 kB minificado. Estado atual: chunks por domínio, com `main` em torno de 282 kB minificado. |
| `npm run lint` | Aprovado |
| `npx tsc --noEmit -p tsconfig.app.json` | Aprovado |
| `npx vitest run` | Estado original: 122 arquivos aprovados, 2 ignorados; 644 testes aprovados, 6 ignorados |
| `npm run test:curated` | Estado atual: passa localmente; ainda há timeout intermitente sob carga em testes pesados que passam isolados e em repetição |
| Bridge e parser | `node --check` aprovado; health check local aprovado |
| Interface | Jornada com C aberto executada no navegador: Braço → Leitura → Aberturas → Materiais |
| MuseScore real/QML | Não verificável neste ambiente; o caminho foi confirmado por código, protocolo, bridge e probes |
| Corpus MusicXML | 199 arquivos promovidos: 2 somente melodia, 197 melodia+cifras, 0 somente cifras |

## Arquitetura e limites observados

Os pontos de entrada são [main.tsx](</Volumes/Documents/Development/Find Chord/src/main.tsx:1>), [App.tsx](</Volumes/Documents/Development/Find Chord/src/App.tsx:1>) e [SuiteShell.tsx](</Volumes/Documents/Development/Find Chord/src/domains/suite/SuiteShell.tsx:8>).

A separação visual Writer/Harmonizer é clara, mas os limites de domínio falham em três pontos:

- Writer converte o analisador rico em um `DetectedChord` empobrecido.
- Harmonizer descarta identidade temporal ao converter eventos em `measureIndex + string[]`.
- A integração MuseScore reparsa uma cifra de apresentação em vez de transportar a identidade harmônica canônica.

Há também duplicação de regras musicais: dominante, nota-guia, distância harmônica, qualidade de cifra e classificação de voicing são decididas por implementações diferentes em tabs distintas.

## Matriz funcional

| Módulo | Tab | Capacidade | Estado | Evidência | Impacto |
|---|---|---|---|---|---|
| Escrever | Braço | Selecionar/remover notas, afinação padrão e reset | Funciona | C aberto detectado e propagado | Fluxo básico disponível |
| Escrever | Braço | Acordes ambíguos | Progrediu | Detector retorna alternativas e UI permite escolher interpretação | Leitura deixa de ser arbitrária no caso principal |
| Escrever | Leitura | Cifra, notas, baixo e inversão | Funciona parcialmente | Dados básicos aparecem | Útil em casos simples |
| Escrever | Leitura | Estrutura e tensão | Simulado | Heurísticas por número de cordas/substrings | Explicação musical enganosa |
| Escrever | Aberturas | Gerar e carregar shapes simples | Funciona parcialmente | Clique atualiza o braço | Participa do fluxo |
| Escrever | Aberturas | Preservar baixo/inversão | Progrediu | `bassPC` participa da busca e há regressão de inversões | Intenção harmônica mais estável |
| Escrever | Aberturas | Filtros aberto/fechado | Corrigido | Corda solta e gap interno classificam abertura | Busca visível ficou coerente |
| Escrever | Materiais | Acorde completo isolado | Funciona | C maior gera rotas/material | Tab mais madura |
| Escrever | Materiais | Shells e omissões | Funciona parcialmente | Nota omitida vira tensão | Orientação pedagógica errada |
| Escrever | MuseScore | Payload | Funciona parcialmente | Symbol/shape/MIDI são produzidos | Base estrutural existe |
| Escrever | MuseScore | Preservar identidade e fretboard | Parcial | `canonicalSymbol` evita reparse do estilo visual; QML ainda usa só a cifra | Identidade melhor preservada; shape ainda não é inserido |
| Harmonizar | Importação | Melodia+cifras comuns | Funciona parcialmente | Parser e timeline possuem testes | Casos menores/modulações falham |
| Harmonizar | Harmonizações | Somente melodia | Funciona parcialmente | Geração/ranking existem; menor e truncamento tiveram guardrails | Cadência/contexto ainda pedem refinamento |
| Harmonizar | Harmonizações | Melodia+cifras | Funciona parcialmente | Referência e alternativas existem | Comparação densa perde acordes |
| Harmonizar | Harmonizações | Somente cifras | Quebrado | Só cartão da referência | Jornada E não entregue |
| Harmonizar | Harmonizações | Aplicar no Writer | Corrigido no fluxo básico | Sessão de progressão navegável no Writer | Ação terminal passa a ter efeito visível |
| Harmonizar | Improviso | Progressão com melodia | Funciona parcialmente | Materiais/rotas são gerados | Função e resolução podem estar erradas |
| Harmonizar | Improviso | Somente cifras | Ausente | Painel retorna `null` | Sem estratégia harmônica |
| Integração | MuseScore | Estado offline/erro/retry | Enganoso para o usuário | Falhas ficam em `console.warn` | Usuário não sabe o resultado |
| Integração | MuseScore | Publicação GitHub Pages | Progrediu | Origin publicado entrou no allowlist do bridge | Deploy deixa de ser bloqueado por Origin padrão |
| Transversal | Teoria | Regra → fonte → saída | Desconectado | Sem IDs bibliográficos no runtime | Resultado não é auditável |
| Transversal | Testes | Serviços musicais puros | Funciona parcialmente | Cobertura extensa | Boa regressão local |
| Transversal | Testes | UI, QML, bridge e jornadas | Ausente | Sem E2E/comportamento real | Falhas de integração escapam |

## Estado das jornadas

| Jornada | Resultado |
|---|---|
| A — criação e exportação | Parcial: criação, leitura, abertura e materiais funcionam; exportação não é confiável |
| B — acorde ambíguo | Progrediu: alternativas aparecem e podem ser selecionadas; falta propagar identidade canônica até exportação |
| C — somente melodia | Parcial: gera propostas e Improviso; menor, truncamento e handoff tiveram correções; cadência/contexto ainda pedem refinamento |
| D — melodia e cifras | Parcial: referência e transformações existem; comparação/timing/Improviso têm inconsistências |
| E — somente cifras | Parcial: mostra referência, leitura funcional e materiais; transformações ainda são conservadoras |
| F — falha de integração | Parcial: segurança/ACK/origin melhoraram; status bridge/plugin/score e fila por instância ainda faltam |

# Achados confirmados

## Escrever

### FC-WR-01 — P1 — interpretações ambíguas não podem ser escolhidas

- **Módulo/tab/jornada:** Escrever / Braço e tabs dependentes / B.
- **Progresso:** o Writer agora preserva `score`, `confidence` e interpretações equivalentes no DTO da leitura; a tab “Leitura do acorde” mostra alternativas detectadas e chama `setSelectedChordIndex` para trocar a interpretação ativa. Regressão coberta em `writer-ambiguous-chord-selection.spec.ts`.
- **Esperado:** mostrar alternativas, confiança e permitir que o músico escolha a interpretação.
- **Observado:** o analisador retorna até oito candidatos, mas o Writer descarta `score`, `confidence` e equivalências; nenhuma UI chama `setSelectedChordIndex`; alterações sempre restauram o índice zero.
- **Evidência:** [chordAnalyzer.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/chordAnalyzer.ts:387>), [WriterContext.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/context/WriterContext.tsx:71>), [TranslationLayer.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/components/TranslationLayer.tsx:5>) e [useChordStore.ts](</Volumes/Documents/Development/Find Chord/src/store/useChordStore.ts:127>).
- **Reprodução:** frets `[0,0,0,0,null,null]`, notas E–B–G–D. `Em7/D` e `G6/D` empatam com score 63/confiança 96; somente `Em7/D` aparece.
- **Impacto:** músico — materiais e exportação podem usar a interpretação indesejada; produto — Jornada B inexiste apesar de o motor já produzir as alternativas.
- **Causa provável:** adaptação `ChordCandidate → DetectedChord` perde informação e a UI foi construída apenas para `activeChord`.
- **Correção recomendada:** conservar IDs, score, confiança e equivalências; seletor explícito; persistir escolha por identidade, não por índice.
- **Testes necessários:** escolher `G6/D` e verificar Leitura, Aberturas, Materiais e payload.
- **Confiança:** alta.

### FC-WR-02 — P1 — a exportação reparsa o estilo visual e pode alterar a cifra

- **Módulo/tab/jornada:** Escrever / Braço-MuseScore / A e B.
- **Esperado:** exportar a identidade canônica escolhida, com baixo, extensões e shape real.
- **Observado:** resolvido parcialmente. O Writer ainda mostra o símbolo formatado em Internacional/Brasileiro/Acadêmico, mas a exportação agora transporta uma cifra canônica separada. O QML usa apenas a cifra e ainda ignora frets, MIDI, afinação e tipo de voicing.
- **Evidência:** [writerMuseScorePayload.ts](</Volumes/Documents/Development/Find Chord/src/domains/writer/services/writerMuseScorePayload.ts:22>), [musescoreAdapter.ts](</Volumes/Documents/Development/Find Chord/src/utils/musescoreAdapter.ts:21>) e [FindChordBridge.qml](</Volumes/Documents/Development/Find Chord/plugins/FindChordBridge.qml:294>).
- **Reprodução:**
  - `Cmaj9`: `Cmaj9` e `CΔ9` são rejeitados; `C7M(9)` vira `C7`.
  - `Cmaj13`: estilos Internacional/Acadêmico são rejeitados; `C7M(13)` vira `C7`.
  - `CmMaj7`: falha nos três estilos.
  - `C9`: `C7(9)` vira `C7`.
- **Impacto:** músico — pode inserir outro acorde ou nada; shape não é associado; produto — preferência visual altera correção funcional.
- **Causa provável:** integração baseada em reparse de texto de apresentação e contratos divergentes entre `CHORD_REGISTRY` e `ChordSymbolResolver`.
- **Progresso:** o Writer agora transporta `symbol` como apresentação e `canonicalSymbol` como identidade de exportação; o adapter prefere a cifra canônica confiável e preserva extensões como `Cmaj9`, `Cmaj13`, `CmMaj7` e baixos como `G7(b9)/B`.
- **Correção recomendada:** ampliar a matriz `CHORD_REGISTRY × três estilos`, preservar pitch classes no mapper canônico e enviar fretboard somente se o plugin realmente o suportar.
- **Testes necessários:** matriz completa de estilos; QML real para cifra+fretboard.
- **Confiança:** alta para transformação/contrato; inserção externa não verificada.

### FC-WR-03 — P1 — escolher uma abertura pode remover a inversão

- **Módulo/tab/jornada:** Escrever / Aberturas / A e B.
- **Progresso:** o Writer passa `bassPC` para `generateVoicings`, a chave de cache inclui baixo/raiz/qualidade, e a regressão `writer-voicing-inversion.spec.ts` cobre inversão física preservada.
- **Esperado:** aberturas de `C/E` devem manter E no baixo ou declarar que são apenas formas de C.
- **Observado:** `generateVoicings` recebe `bassPC=null`; ao carregar uma forma, o store recalcula e escolhe novamente o candidato zero.
- **Evidência:** [WriterContext.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/context/WriterContext.tsx:121>) e [useChordStore.ts](</Volumes/Documents/Development/Find Chord/src/store/useChordStore.ts:181>).
- **Reprodução:** entrada `C/E` `[null,null,5,5,3,0]`; primeira sugestão `[3,1,0,2,3,null]` tem C no baixo e, após o clique, vira `C`.
- **Impacto:** músico — baixo estrutural e função podem mudar; produto — a tab quebra a identidade recebida da tab anterior.
- **Causa provável:** baixo conhecido não participa do contrato do gerador.
- **Correção recomendada:** passar o pitch class do baixo e remapear o resultado por raiz/qualidade/baixo.
- **Testes necessários:** C/E, G7/B e Cdim7/Eb, incluindo clique e exportação.
- **Confiança:** alta.

### FC-WR-04 — P2 — Leitura e Materiais perdem semântica e fabricam dados simplificados

- **Módulo/tab/jornada:** Escrever / Leitura e Materiais / A-B.
- **Esperado:** estrutura, tensão e graus devem derivar do mesmo modelo canônico do acorde.
- **Observado:**
  - qualquer shape de três cordas é classificado como `Shell Voicing`;
  - tensão só pode ser 0,15 ou 0,65 por substring, embora a UI tenha faixa alta a partir de 0,72;
  - Materiais recebe notas soantes, não a fórmula canônica, e classifica notas omitidas como tensões.
- **Evidência:** [voicingGenerator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/generation/voicingGenerator.ts:41>), [WriterContext.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/context/WriterContext.tsx:78>), [writerChordReadingPresenter.ts](</Volumes/Documents/Development/Find Chord/src/domains/writer/services/writerChordReadingPresenter.ts:21>) e [localMaterialNoteRoles.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/theory/localMaterialNoteRoles.ts:67>).
- **Reprodução:** tríade C `[null,null,null,5,7,8]` aparece como Shell; Cmaj7 e C7b9 recebem 65%; shell Bb7b5 sem D mostra D como tensão/grau 4, apesar de D ser a terça estrutural.
- **Impacto:** músico — explicação factual e pedagógica incorreta; produto — tabs contradizem analisadores mais ricos já existentes.
- **Causa provável:** DTO do Writer elimina fórmula, omissões e papéis de voz, substituindo-os por heurísticas locais.
- **Correção recomendada:** usar `analyzeVoiceRoles`, `classifyVoicing` e fórmula canônica; distinguir nota soando, nota implícita e tensão.
- **Testes necessários:** tríade, shell 1–3–7, Drop 2, quartal, acorde alterado e shapes rootless.
- **Confiança:** alta.

### FC-WR-05 — P2 — seletor de afinação não cobre afinações do próprio catálogo

- **Módulo/tab/jornada:** Escrever / Braço / A-B.
- **Progresso:** o seletor de nota por corda agora usa `tuningNoteOptions.ts`, com cromatismo em sustenidos e bemóis, oitava 0 e inclusão automática das notas presentes nos presets do catálogo. Regressão coberta em `tuning-note-options.spec.ts`.
- **Esperado:** toda nota de preset deve ser representável no seletor controlado.
- **Observado:** opções só usam sustenidos e oitavas 1–5.
- **Evidência:** [TuningSettings.tsx](</Volumes/Documents/Development/Find Chord/src/domains/suite/components/TuningSettings.tsx:6>) e [InstrumentTuning.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/models/InstrumentTuning.ts:19>).
- **Reprodução:** Eb Standard contém Eb/Bb/Gb/Db/Ab; baixo de seis cordas contém B0. Esses valores não existem nas opções.
- **Impacto:** músico — afinação corrente pode ser representada incorretamente; produto — presets válidos violam o contrato do controle.
- **Causa provável:** domínio do seletor menor que o domínio dos presets.
- **Correção recomendada:** gerar opções a partir do catálogo, suportar oitava 0 e preservar flats.
- **Testes necessários:** invariant para todos os presets e teste renderizado de Eb Standard/B0.
- **Confiança:** alta.

### FC-WR-06 — P2 — filtros “Abertos/Fechados” usam critério incorreto

- **Módulo/tab/jornada:** Escrever / Aberturas / A.
- **Progresso:** os filtros da aba Aberturas agora usam `voicingShapeFilters.ts`: corda solta ou gap interno classificam a forma como aberta, enquanto “Fechados” exige ausência de cordas soltas e de gaps internos. Regressão coberta em `writer-voicing-shape-filters.spec.ts`.
- **Esperado:** shape com corda solta deve aparecer em “Abertos”.
- **Observado:** a implementação procura gaps `null` entre cordas tocadas, não `fret === 0`.
- **Evidência:** [VoicingSearchLayer.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/components/VoicingSearchLayer.tsx:83>).
- **Reprodução:** `[3,1,0,2,3,null]` contém G solto, mas é excluído de Abertos e incluído em Fechados.
- **Impacto:** músico — filtro retorna conjunto semanticamente oposto; produto — controle visível parece funcional, mas não cumpre o rótulo.
- **Causa provável:** corda solta, gap físico e abertura intervalar foram conflados.
- **Correção recomendada:** definir se o filtro é mecânico ou harmônico; usar `fret===0` ou espaçamento MIDI, respectivamente.
- **Testes necessários:** C aberto, shape sem cordas soltas, Drop 2 e Drop 3.
- **Confiança:** alta.

## Harmonizar e Improviso

### FC-HZ-01 — P1 — modo menor é ignorado pelo ramo experimental

- **Módulo/tab/jornada:** Harmonizar / Harmonizações e Improviso / C-D.
- **Progresso:** realizações experimentais em centro menor passam por gate de compatibilidade modal; abertura/fechamento em tônica maior sobre centro menor vindo da melodia são rejeitados. Regressão coberta em `minor-modal-boundary.spec.ts`.
- **Esperado:** tônica e modo escolhidos governam interpretação e realização.
- **Observado:** `MelodicInterpretationEngine` consome apenas a tônica e `ChordRealizationEngine` usa mapeamento maior.
- **Evidência:** [MelodicInterpretationEngine.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/MelodicInterpretationEngine.ts:7>), [ChordRealizationEngine.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/ChordRealizationEngine.ts:91>) e `ProposalPresentationPlanner`.
- **Reprodução:** C–Eb–G–C, key Cm: centro C minor 0,79, mas surgem Cmaj7 e rota `Cdim7–D#dim7/Db–Edim7/Db–D7` como primary.
- **Impacto:** músico — harmonia e materiais inadequados para melodia menor elementar; produto — proposta experimental pode superar a fundação correta.
- **Causa provável:** `TonalCenterCandidate.mode` é parcialmente consumido e não há gate de suporte.
- **Correção recomendada:** modo obrigatório nas camadas, paletas menores e impedimento de experimental-primary sem fundação validada.
- **Testes necessários:** C minor no fluxo Gravity→ranker→planner.
- **Confiança:** muito alta.

### FC-HZ-02 — P1 — mudança de centro preserva cadência incompatível

- **Módulo/tab/jornada:** Harmonizar / Harmonizações / C-D.
- **Esperado:** mudar o centro deve recomputar chegada, cadência e confiança.
- **Observado:** resolvido no contexto de frase. `selectedCenter`, `cadentialTarget` e confiança agora são atualizados juntos quando a referência muda o centro.
- **Evidência:** [ReferenceAwarePhraseContext.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/ReferenceAwarePhraseContext.ts:73>) e [HarmonizerHeader.tsx](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/components/HarmonizerHeader.tsx:35>).
- **Reprodução:** melodia forte em C major gera C/AUTHENTIC; referência Bm7b5–E7–Am6 muda centro para Am 0,95, mas mantém C/AUTHENTIC.
- **Impacto:** músico — cabeçalho contraditório; produto — gates de ii–V, vamp e tonicização usam estado inválido.
- **Causa provável:** atualização parcial de estado derivado.
- **Progresso:** `applyReferenceCenterToPhraseContext` só herda confiança de candidato centro/modo compatível; cadência funcional de referência redefine alvo para a nova tônica com tipo `AUTHENTIC`. Regressão cobre C maior melódico contra Bm7(b5)–E7–Am6.
- **Correção recomendada:** ampliar validações para cadências menos diretas, repousos recorrentes e cabeçalho UI.
- **Testes necessários:** matriz de referência conflitante, repouso modal e invariantes centro↔alvo↔cadência.
- **Confiança:** muito alta.

### FC-HZ-03 — P1 — comparação com referência densa descarta acordes

- **Módulo/tab/jornada:** Harmonizar / Harmonizações / D.
- **Esperado:** comparar todos os eventos pelo tempo/duração.
- **Observado:** resolvido no comparador. Referências com múltiplas cifras no mesmo compasso agora são comparadas por slot intra-compasso, sem descartar os eventos seguintes.
- **Evidência:** [ReferenceHarmonyComparator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/ReferenceHarmonyComparator.ts:74>). No corpus, 182/199 referências têm mais de um acorde em algum compasso.
- **Reprodução:** referência `[C,G7]`, proposta `[C,Db7]`: `aligned`, `rootAgreement=1` e `functionAgreement=1`.
- **Impacto:** músico — proposta divergente parece alinhada; produto — bônus/ranking e agrupamento incorretos.
- **Causa provável:** comparação agregada por medida eliminou identidade temporal.
- **Progresso:** `ReferenceHarmonyComparator` mantém todos os acordes da referência por compasso; quando a referência tem um único acorde, preserva a escolha do melhor acorde da proposta no compasso; quando a referência é densa, compara eventos por ordem interna e penaliza divergências como `C / Db7` contra `C / G7`.
- **Correção recomendada:** evoluir de slots por ordem para pesos por tick/duração real quando as propostas também carregarem duração.
- **Testes necessários:** ampliar casos com proposta mais curta/longa que a referência e métricas ponderadas por duração.
- **Confiança:** muito alta.

### FC-HZ-04 — P1 — “Usar harmonia” não aplica a proposta no Writer

- **Módulo/tab/jornada:** Harmonizar→Escrever / C-D-E.
- **Progresso:** propostas aplicadas ao Writer viram uma sessão explícita de progressão com compasso, índice, ordem e cifra; o Writer carrega uma abertura tocável do primeiro acorde e exibe faixa navegável. Regressão coberta em `apply-proposal-to-writer.spec.ts`.
- **Esperado:** carregar uma progressão ativa, navegável e realizável.
- **Observado:** apenas `setProgressionChords(string[])` e navegação. Nenhum componente Writer exibe a lista; ela só influencia uma futura heurística enarmônica.
- **Evidência:** [useApplyProposalToWriter.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useApplyProposalToWriter.ts:5>) e [useChordStore.ts](</Volumes/Documents/Development/Find Chord/src/store/useChordStore.ts:199>).
- **Reprodução:** clicar “Usar harmonia/trecho/variação”; Writer abre vazio ou com o acorde anterior.
- **Impacto:** músico — ação principal aparenta sucesso sem entregar conteúdo; produto — final das três jornadas está desconectado.
- **Causa provável:** contrato reduzido a strings; não há sessão compartilhada de progressão.
- **Correção recomendada:** eventos com ID, medida, tempo, acorde ativo e realização do primeiro evento antes da navegação.
- **Testes necessários:** clique→store→Writer, incluindo raízes C/C# para evitar o `startsWith`.
- **Confiança:** muito alta.

### FC-HZ-05 — P1 — somente cifras não possui pipeline funcional

- **Módulo/tab/jornada:** Harmonizar / Harmonizações e Improviso / E.
- **Esperado:** analisar centro, função, trajetória e cadência; propor transformações sem alegar validação melódica.
- **Observado:** resolvido parcialmente. Sem notas, o Harmonizar agora constrói contexto harmônico, leitura funcional e materiais derivados da referência, explicitando ausência de validação melódica.
- **Evidência:** [useHarmonizerProposals.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useHarmonizerProposals.ts:76>) e [ContextualMaterialSuggestionsPanel.tsx](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/components/ContextualMaterialSuggestionsPanel.tsx:280>).
- **Reprodução:** C–Am–Dm7–G7–C sem notas: `harmony-only-analysis`, uma referência, zero materiais e painel nulo.
- **Impacto:** músico — Jornada E não existe; produto — um dos três modos prometidos não é entregue.
- **Causa provável:** pipeline depende obrigatoriamente de `melodicAnchors`.
- **Progresso:** `buildHarmonyOnlyPhraseContext` infere centro/cadência pela referência; `buildHarmonyOnlyAnalysisProposals` cria a proposta `Leitura — Função da progressão`; materiais contextuais passam a usar a harmonia mesmo com `melody=[]`. Regressão coberta em `harmony-only-analysis.spec.ts` e incluída na suíte curada.
- **Correção recomendada:** evoluir para transformações harmony-only mais musicais, sem usar critérios de cobertura melódica.
- **Testes necessários:** UI sem notas, corpus real somente cifras e transformações que preservem função/baixo/cadência.
- **Confiança:** muito alta.

### FC-HZ-06 — P2 — limite de 32 notas corta seções no meio

- **Módulo/tab/jornada:** Harmonizar / Harmonizações / C-D.
- **Progresso:** a seleção estrutural passou a amostrar a seção inteira, preservar cadência final e carregar `startTick/endTick`; regressões cobertas em `temporal-melody-window.spec.ts` e `score-timeline-context.spec.ts`.
- **Esperado:** reduzir complexidade preservando eventos estruturalmente importantes e fronteiras.
- **Observado:** são escolhidas as primeiras 32 notas cronológicas.
- **Evidência:** [harmonizerService.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/services/harmonizerService.ts:152>) e `MelodicAnchorLimitNotice`.
- **Reprodução:** 64 notas/8 compassos: seleção termina no compasso 4, ignora o C final no compasso 8 e infere G/HALF.
- **Impacto:** músico — cadência e centro incorretos; produto — proposta cobre apenas parte da seção.
- **Causa provável:** cap de desempenho tratado como slice, não amostragem musical.
- **Correção recomendada:** saliência distribuída, final/fronteiras garantidos ou processamento por janelas.
- **Testes necessários:** seção >32 eventos com cadência final obrigatória.
- **Confiança:** muito alta.

### FC-HZ-07 — P2 — distância harmônica chama terças diatônicas de cromáticas

- **Módulo/tab/jornada:** Harmonizar / Harmonizações / C-D.
- **Esperado:** cromatismo deve depender do centro, escala e função.
- **Observado:** resolvido. Distâncias de raiz 3/4 deixam de receber penalidade quando ambas as raízes pertencem ao campo funcional do centro/modo.
- **Evidência:** [HarmonicRouteDistance.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/HarmonicRouteDistance.ts:43>).
- **Reprodução:** em C, `C–Am–Dm–G7–C` e `C–Em–F–G7–C` não carregam penalidade cromática; `C–F#7–F` continua mais caro que movimento diatônico.
- **Impacto:** músico — rota diatônica recebe rótulo falso; produto — proposta pode ser demovida/agrupada incorretamente.
- **Causa provável:** distância geométrica usada como substituto de pertencimento tonal.
- **Progresso:** `chromaticPenalty` agora consulta centro, modo e função; o custo neutro de movimento de raiz foi separado do rótulo cromático; o planner preserva fundação I-IV-V contra expansões moderadas sem apoio de referência. Regressões cobrem terças diatônicas versus raízes alteradas, dominantes alteradas, SubV, calibração de ranking e relatório real.
- **Correção recomendada:** acompanhar corpus real para calibrar custo de cromatismo por semitom controlado versus raiz distante.
- **Testes necessários:** modos menores/modais adicionais e comparação auditiva no ranking de propostas reais.
- **Confiança:** muito alta.

### FC-HZ-08 — P2 — rótulos de voice leading têm a escala invertida

- **Módulo/tab/jornada:** Harmonizar / Harmonizações / C-D.
- **Esperado:** score melhor deve gerar rótulo melhor.
- **Observado:** resolvido. A UI agora trata score alto como condução forte/boa e score baixo como instável/áspera.
- **Evidência:** [VoiceLeadingTransitionEvaluator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/VoiceLeadingTransitionEvaluator.ts:289>) e [HarmonizationProposalCard.tsx](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/components/HarmonizationProposalCard.tsx:81>).
- **Reprodução:** Dm7→G7 e G7→Cmaj7 somados aparecem como “Condução forte”; G7→F#7 fica em faixa instável/áspera.
- **Impacto:** músico — explicação contradiz o comportamento musical e o ranking; produto — confiança nos cards é reduzida.
- **Causa provável:** presenter interpretou score de suporte como custo.
- **Progresso:** `voiceLeadingLabel` foi exportado e calibrado; regressões conectam labels a ii-V-I resolvido e dominante não resolvida.
- **Correção recomendada:** acompanhar corpus real para ajustar limites numéricos finos, se necessário.
- **Testes necessários:** exemplos adicionais de condução por nota comum, baixo cromático e SubV.
- **Confiança:** muito alta.

### FC-HZ-09 — P2 — Improviso duplica referência, omite variantes e escolhe default inadequado

- **Módulo/tab/jornada:** Harmonizar / Improviso / C-D.
- **Esperado:** uma leitura por harmonia aplicável; referência escrita como default quando existir.
- **Observado:**
  - referência vira dois sets;
  - `colorVariants` aplicáveis não recebem material;
  - effect seleciona a proposta `primary`, frequentemente cromática, em vez da referência/fundação.
- **Evidência:** [useHarmonizerProposals.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useHarmonizerProposals.ts:159>), [ProposalConsequenceSimilarity.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/ProposalConsequenceSimilarity.ts:59>) e [ContextualMaterialSuggestionsPanel.tsx](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/components/ContextualMaterialSuggestionsPanel.tsx:281>).
- **Reprodução:** C–F–G7–C cria `reference-harmony` e `existing-harmony-reference`; abre em “Dominantes secundárias”.
- **Impacto:** músico — opções duplicadas ou sem consequência melódica; produto — tab não corresponde à opção efetivamente aplicável.
- **Causa provável:** dois pipelines independentes constroem sets e não compartilham seleção.
- **Correção recomendada:** set canônico; incluir variantes; prioridade `reference > foundation > primary`.
- **Testes necessários:** unicidade e invariant “toda opção aplicável tem material”.
- **Confiança:** alta.

### FC-HZ-10 — P2 — modelo de proposta elimina ritmo e identidade dos eventos

- **Módulo/tab/jornada:** Harmonizar / Harmonizações-Improviso / D.
- **Progresso:** substituições controladas passaram a carregar `targetTickStart` e a aplicação exige `measure + chord + tick`, evitando trocar ocorrências idênticas no mesmo compasso. O modelo completo de proposta temporizada ainda segue pendente.
- **Esperado:** preservar posição, duração e identidade de cada acorde.
- **Observado:** proposta guarda apenas `measureIndex + chords`; materiais fabricam ticks zero; substituição identifica `measure+symbol`, trocando todas as ocorrências iguais.
- **Evidência:** [ReharmonizationProposal.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/models/ReharmonizationProposal.ts:1>), [ControlledSubstitutionProposals.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/ControlledSubstitutionProposals.ts:30>) e [harmonizerService.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/services/harmonizerService.ts:507>).
- **Reprodução:** C→G7 nos ticks 480 e 1440 viram o mesmo DTO; dois Fmaj7 no mesmo compasso são ambos trocados embora `maxSubstitutions=1`.
- **Impacto:** músico — ritmo harmônico, síncope e validação local são perdidos; produto — comparação, Improviso e Writer não podem reconstruir a proposta.
- **Causa provável:** agrupamento de apresentação virou modelo de domínio.
- **Correção recomendada:** eventos com ID, tick inicial/final, beat e duração; agrupar apenas na view.
- **Testes necessários:** round-trip temporal e acordes repetidos no mesmo compasso.
- **Confiança:** muito alta.

### FC-HZ-11 — P2 — parser e inferência cadencial simplificam demais o contexto tonal

- **Módulo/tab/jornada:** Harmonizar / Importação-Harmonizações / C-D.
- **Progresso:** o snapshot preserva `keyTimeline` e `timeTimeline`; auditorias e parte da geração temporal já consomem essas timelines. Ainda falta eliminar fallbacks e refinar inferência cadencial negativa.
- **Esperado:** preservar `<mode>`, mudanças de armadura e só nomear cadência quando houver evidência.
- **Observado:** parser lê apenas o primeiro `<fifths>`, converte para nome maior e ignora `<mode>`; `PhraseAnalysisEngine` nomeia cadência apenas pela última nota.
- **Evidência:** [musicxml-parser.cjs](</Volumes/Documents/Development/Find Chord/scripts/musicxml-parser.cjs:4>) e [PhraseAnalysisEngine.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/PhraseAnalysisEngine.ts:143>).
- **Reprodução:** `fifths=-3, mode=minor` retorna Eb; tônica final vira AUTHENTIC, quinta HALF, sexta DECEPTIVE e quarta PLAGAL sem harmonia.
- **Impacto:** músico — centro/cadência falsos; produto — estratégias e Improviso são ativados por metadados incorretos.
- **Causa provável:** armadura e grau final usados como aproximações definitivas.
- **Correção recomendada:** timeline de key/mode e estado `UNKNOWN/OPEN`; separar grau de chegada de cadência.
- **Testes necessários:** MusicXML menor, modulação e casos negativos de cadência.
- **Confiança:** muito alta.

### FC-HZ-12 — P2 — regras contextuais ensinam função e resoluções erradas

- **Módulo/tab/jornada:** Harmonizar / Improviso / C-D.
- **Esperado:** reconhecer dominantes pelo alvo real e produzir notas-guia da qualidade/alvo.
- **Observado:**
  - dominantes alteradas e secundárias podem virar `color`;
  - D7→C pode virar dominante sem relação V/SubV;
  - toda qualidade recebe terça+sétima;
  - todo alvo recebe terça maior.
- **Evidência:** [contextualMaterialFunction.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/theory/contextualMaterialFunction.ts:23>).
- **Reprodução:**
  - `A7→Dm` e `E7→Am` em C = `color`;
  - `D7→C` = `dominant`;
  - C, C6, Cadd9 → guide tones E/Bb;
  - Csus/F#5 recebem terceiras;
  - E7→Am sugere D→C#; G7→Cm sugere F→E.
- **Impacto:** músico — recebe resolução melódica objetivamente errada; produto — ranking, região e rota linear usam a classificação defeituosa.
- **Causa provável:** predicados incompletos e alvo representado apenas pela raiz.
- **Correção recomendada:** qualidade dominante canônica; validar quinta/SubV/alvo local; derivar guide tones da fórmula do acorde-alvo.
- **Testes necessários:** V–I, V–i, dominantes secundárias, SubV, sus, power, tríades e diminutos.
- **Confiança:** alta.

## MuseScore, concorrência e segurança

### FC-MS-01 — P1 — fila e sincronização não são vinculadas à operação/partitura

- **Módulo/tab/jornada:** Integração / A-C-D-F.
- **Esperado:** pedido expira e só a instância/partitura destinatária pode consumi-lo.
- **Observado:** resolvido parcialmente. `request_score` agora carrega `expiresAt`, o bridge poda mensagens expiradas e o snapshot/status carregam identidade de partitura (`scoreId/title`). Listener/fila ainda não rejeitam respostas fora de ordem por `scoreId`.
- **Evidência:** [musescoreAdapter.ts](</Volumes/Documents/Development/Find Chord/src/utils/musescoreAdapter.ts:109>), [musescore-bridge.cjs](</Volumes/Documents/Development/Find Chord/scripts/musescore-bridge.cjs:118>) e [FindChordBridge.qml](</Volumes/Documents/Development/Find Chord/plugins/FindChordBridge.qml:162>).
- **Reprodução:** sincronizar com plugin fechado, esperar timeout e abrir o plugin; pedido antigo é consumido e o snapshot substitui o estado. Com duas instâncias, a primeira a consultar `/consume` leva toda a fila.
- **Impacto:** músico — partitura errada ou obsoleta pode aparecer; produto — estado global parcial e não determinístico.
- **Causa provável:** fila FIFO global sem `pluginId`, `scoreId` ou lifecycle de request.
- **Progresso:** sync tardio deixa de permanecer indefinidamente na fila; parser MusicXML gera `metadata.scoreId`; `/api/v1/status` expõe a identidade da última partitura sincronizada.
- **Correção recomendada:** filas por destino, pending/cancelled requests e validação efetiva de `scoreId/sessionId` no recebimento do snapshot.
- **Testes necessários:** duas instâncias, troca de score e resposta fora de ordem rejeitada.
- **Confiança:** alta; cenário multi-MuseScore não executado externamente.

### FC-MS-02 — P1 — interface confunde bridge com MuseScore e o deploy publicado é incompatível

- **Módulo/tab/jornada:** Integração / A-C-D-F.
- **Progresso:** o Origin publicado `https://gustavoesteves.github.io` foi incluído no allowlist padrão do bridge e origens adicionais podem ser configuradas por `FIND_CHORD_DASHBOARD_ORIGINS`. A UI agora chama o WebSocket de `Bridge Conectado/Offline`, consulta `/api/v1/status` com token da sessão, mostra `Plugin ativo/Aguardando plugin`, exibe a partitura sincronizada e mostra erro visível quando o plugin não responde ao sync.
- **Esperado:** estados separados para bridge, plugin e score; erro visível; ambiente publicado compatível.
- **Observado:** resolvido parcialmente. O badge não promete mais disponibilidade do MuseScore quando só o bridge está conectado e já consome `pluginLastSeen`; export ainda só faz `console.warn` e não há vínculo com score específico.
- **Evidência:** [useScoreSync.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useScoreSync.ts:19>), [MuseScoreConnectionBadge.tsx](</Volumes/Documents/Development/Find Chord/src/domains/suite/components/MuseScoreConnectionBadge.tsx:4>), [VirtualFretboard.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/components/VirtualFretboard.tsx:41>) e [deploy.yml](</Volumes/Documents/Development/Find Chord/.github/workflows/deploy.yml:1>).
- **Reprodução:** bridge ativo e plugin fechado: interface pode dizer “MuseScore Conectado”; sync espera e termina sem mensagem. Na origem Pages, o bridge rejeita a sessão.
- **Impacto:** músico — não sabe se a operação funcionou; produto — integração indisponível no deploy oficial.
- **Causa provável:** conexão técnica usada como proxy de disponibilidade funcional; topologia de deploy não foi alinhada ao allowlist.
- **Correção recomendada:** resultado tipado também para export, rejeição de snapshot de score trocado e pareamento seguro compatível.
- **Testes necessários:** score trocado e origem de produção em runtime real.
- **Confiança:** alta.

### FC-MS-03 — P2 — mutações não são idempotentes e o protocolo promete ações inexistentes

- **Módulo/tab/jornada:** Integração / A-F.
- **Progresso:** o protocolo tipado restringe mutations a `INSERT_CHORD`, remove `REPLACE/DELETE`, adiciona `commandId`, expiração e ACK. Ledger/idempotência real por score ainda continua pendente.
- **Esperado:** retry seguro; ações desconhecidas rejeitadas; pareamento não recuperável por qualquer processo local.
- **Observado:** `/consume` remove antes de processar; QML muta antes do ACK; retry usa novo ID e não há ledger. `REPLACE_CHORD`/`DELETE_CHORD` são aceitos pelo tipo, mas todo `MUTATION` chama `transcribeChord`. `/plugin-session` entrega token sem autenticação para cliente local.
- **Evidência:** [Protocol.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/bridge/Protocol.ts:7>), [musescore-bridge.cjs](</Volumes/Documents/Development/Find Chord/scripts/musescore-bridge.cjs:221>) e [FindChordBridge.qml](</Volumes/Documents/Development/Find Chord/plugins/FindChordBridge.qml:223>).
- **Reprodução:** perder ACK após inserção e repetir; ou enviar ação DELETE/REPLACE.
- **Impacto:** músico — possível duplicação ou inserção em vez de remoção; produto — contrato público não corresponde à implementação. Um processo local pode consumir/forjar o canal.
- **Causa provável:** ACK confirma depois da mutação sem armazenamento de resultado; protocolo antecipou capacidades.
- **Correção recomendada:** mesmo `commandId` no retry, ledger por score, lease até ACK, `switch` exaustivo e pareamento aprovado.
- **Testes necessários:** fault injection antes/depois da mutação, replay e cada ação do protocolo.
- **Confiança:** alta; forma visual exata da duplicação depende do MuseScore.

## Documentação e testes

### FC-DOC-01 — P2 — rastreabilidade teórica é manual e os estados documentais contradizem o runtime

- **Escopo:** transversal / todas as jornadas.
- **Esperado:** documento→regra→algoritmo→serviço→estado→UI rastreável.
- **Observado:** propostas não carregam `theoryRuleId` ou referências; `materialOrigin` só distingue catálogo/mapa. Documentos misturam histórico e estado atual e citam símbolos removidos.
- **Evidência:**
  - `estado_teorico_harmonizacao.md` diz que voice leading/modal/SubV ainda são futuros, embora existam.
  - `quadro_teorico_sistema_harmonizacao.md` marca distância/região como ausentes e depois registra implementação.
  - `analise_ebooks_erica_masson.md` marca SubV simultaneamente implementado e não implementado.
  - `composer_first_harmony_model.md` e `escala_compativel_diagnostico.md` citam `ScaleOverlayPanel`, já removido.
- **Impacto:** músico — não consegue auditar por que recebeu uma sugestão; produto — status funcional depende da seção do documento consultada.
- **Causa provável:** documentação evolutiva usada também como status vigente, sem manifest canônico.
- **Correção recomendada:** capability manifest com `asOfCommit`; IDs de regras e fontes versionadas no domínio/UI; validador de links e símbolos.
- **Testes necessários:** integridade regra→fonte e verificação automática de símbolos citados.
- **Confiança:** alta.

### FC-TST-01 — P2 — cobertura extensa em funções, mas fraca nas jornadas e no deploy

- **Escopo:** transversal.
- **Progresso:** o workflow de deploy já executa `npm run lint` e `npm run test:curated`, além do build. Ainda faltam testes React/E2E, bridge real em porta efêmera, fault injection e MuseScore simulado.
- **Esperado:** lint/build/test e integrações críticas executadas no CI.
- **Observado:** 124 specs existem; `test:curated` cobre 122 caminhos únicos, duplica uma spec e omite `musicxml-parser-timeline.spec.ts` e `active-section-selection.spec.ts`. Não há teste React/E2E do Harmonizer, handoff, bridge ou QML. O deploy executa somente build.
- **Evidência:** [vitest.curated.config.ts](</Volumes/Documents/Development/Find Chord/vitest.curated.config.ts:3>), [real-music-audit-report.spec.ts](</Volumes/Documents/Development/Find Chord/scripts/real-music-audit-report.spec.ts:9>) e [deploy.yml](</Volumes/Documents/Development/Find Chord/.github/workflows/deploy.yml:37>).
- **Reprodução:** teste explicitamente solicitado com a configuração curada é ignorado se não estiver no include. Uma execução curada sob carga excedeu o timeout fixo; isolada e repetida passou.
- **Impacto:** músico — regressões de UI/integração podem chegar ao produto; produto — sucesso da suíte não prova as jornadas A–F.
- **Causa provável:** crescimento por specs puras e auditorias estáticas, sem pirâmide de integração.
- **Correção recomendada:** CI com lint/build/test; inclusão automática de specs; servidor em porta efêmera, transporte falso/fault injection, React e E2E com MuseScore simulado.
- **Testes necessários:** as próprias jornadas A–F, incluindo offline, atraso, retry e estado tardio.
- **Confiança:** alta.

## Inventário de `docs/theory`

Foram encontrados 20 artefatos: 12 Markdown e 8 PDFs.

| Documento | Conceito | Estado e ligação real |
|---|---|---|
| `almada_examples.md` | Progressões/rearmonizações Almada | Simulado: cópia hardcoded em script, sem estado/UI |
| `almada_harmonia_funcional_source_map.md` | Função, SubV, diminutos, empréstimos | Parcial; ligação manual com estratégias |
| `analise_ebooks_erica_masson.md` | Maior, menor, função aparente | Parcial e contraditório |
| `berklee_jazz_harmony_source_map.md` | Jazz funcional, dominantes, menor, modal | Parcial; sem IDs de fonte |
| `bert ligon - connecting chords with linear harmony.pdf` | Linhas e guide tones | Fundamento conceitual; sem mapa executável próprio |
| `carlos almada - harmonia.pdf` | Harmonia/rearmonização aplicada | Parcial via source map e auditorias |
| `chord_symbol_dictionary.md` | Cifragem, parsing e MusicXML | Implementado parcialmente; diverge do registry do Writer |
| `composer_first_harmony_model.md` | Hierarquia melodia→função→condução | Parcial; direção chega às UIs, referências antigas permanecem |
| `ebook+1.pdf` | Função tonal maior | Parcial via análise Masson |
| `ebook+2.pdf` | Menor/modal | Parcial; erros de modo permanecem |
| `ebook+3.pdf` | Funções aparentes/substituições | Parcial |
| `escala_compativel_diagnostico.md` | Transição escala→material | Histórico/parcialmente superado |
| `estado_teorico_harmonizacao.md` | Estado arquitetural teórico | Desatualizado |
| `harmonia arnold schoenberg.pdf` | Região, coerência, tensão | Conceitual; sem regra direta rastreável |
| `improvisação.md` | Bibliografia e orientação de estudo | Desconectado do runtime |
| `levine mark - the jazz theory book.pdf` | Chord-scale e tensões | Parcial; sem source map por regra |
| `melodic_materials_vocabulary.md` | Materiais, células e resoluções | Implementado parcialmente, com FC-HZ-12 |
| `quadro_teorico_sistema_harmonizacao.md` | Modelo completo em camadas | Abrangente, mas mistura estados antigos/atuais |
| `schoenberg_harmonia_source_map.md` | Coerência/região/função | Conceitual; sem metadado de proposta |
| `the berklee book of jazz harmony.pdf` | Jazz harmony | Parcial via source map |

Os PDFs foram inventariados, renderizados e inspecionados por metadados/amostras; não foi feita validação página a página dos oito livros.

## Hipóteses e itens não verificáveis

Estes pontos não foram tratados como fatos funcionais definitivos:

- Não executei o QML dentro de uma instância real do MuseScore. A lógica de fila, ACK e mutação está confirmada; a forma visual exata de uma reinserção depende do MuseScore.
- Mixed Content/Private Network Access pode bloquear o Pages antes da rejeição de Origin; a rejeição pelo allowlist já é suficiente para confirmar a incompatibilidade.
- O limite de 512 KiB pode rejeitar partituras normais grandes; a frequência real não foi medida.
- O bundle de 596 kB pode afetar carregamento, mas não medi desempenho de dispositivo/rede.
- Sair de uma tab Writer desmonta filtros e estados locais. O comportamento está confirmado; classificá-lo como defeito depende da intenção de UX.
- Não houve avaliação auditiva ou estudo com músicos. Preferências estilísticas não foram classificadas como bugs.
- A primeira falha do teste de corpus ocorreu durante execução concorrente da auditoria; portanto, confirma fragilidade do timeout, não uma regressão determinística do motor.

## Backlog recomendado por dependência

1. **Restaurar as jornadas quebradas:** seletor de interpretação, handoff Harmonizer→Writer e pipeline somente cifras.
2. **Criar contratos canônicos:** `ChordIdentity`, `TimedHarmonyEvent`, `ProgressionSession` e `MuseScoreTarget`.
3. **Corrigir resultados musicais P1:** modo menor, mudança de centro/cadência e comparação de referência densa.
4. **Corrigir exportação:** mapper canônico de cifra, baixo/extensões e suporte real ou remoção explícita do fretboard.
5. **Corrigir materiais e Improviso:** dominantes, notas-guia, alvos menores, deduplicação e variantes.
6. **Preservar tempo e identidade:** ticks/durações em propostas, substituições e materiais.
7. **Tornar MuseScore seguro operacionalmente:** filas por instância/score, expiração, idempotência e status bridge/plugin/score.
8. **Alinhar o deploy:** servir a UI localmente ou criar pareamento loopback compatível e seguro.
9. **Unificar regras duplicadas:** qualidade dominante, voicing, tensão, distância e cifra.
10. **Criar rastreabilidade teórica:** IDs de regra/fonte e manifest de capacidade vigente.
11. **Cobrir jornadas no CI:** lint, build, todas as specs, React, bridge, fault injection e E2E simulado.
12. **Depois, melhorar UX funcional:** estados vazios/erro/ambiguidade, persistência entre tabs e mensagens de limites suportados.
