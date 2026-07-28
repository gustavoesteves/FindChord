# Auditoria funcional completa — Find Chord

Auditoria originalmente concluída sobre o commit `16f346c`; este documento agora também registra a remediação incremental.

Não encontrei P0. Encontrei P1 que quebram jornadas centrais e P2 que podem induzir decisões musicais incorretas.

## Estado atual da remediação funcional

Atualizado incrementalmente durante a remediação dos blocos P1/P2.

| Área | Feito | Ainda aberto |
|---|---|---|
| Escrever | Seleção de interpretações ambíguas; preservação de baixo nas aberturas; filtros aberto/fechado; opções de afinação do catálogo; ergonomia centralizada; exportação MuseScore agora separa cifra visual de cifra canônica; Materiais já distingue nota soando, nota estrutural implícita e tensão no mapa do braço quando há qualidade canônica; Materiais agora prioriza mapas que preservam alteração escrita (`7#9`, `7#11`, `maj7#11`), evita definir terça automaticamente em `sus`/`power`, limita o mapa à janela do shape desenhado e cria uma linha tocável apoio-cor-apoio perto da forma ativa; Leitura usa análise semântica de vozes para estrutura/tensão, omissões, notas estruturais presentes, papéis por corda e vozes externas. | Ainda falta propagar condução interna para explicações mais completas e relações entre acordes; Materiais ainda precisa melhorar ritmo/fingering visual das frases e rootless; QML real ainda não usa shape/fretboard. |
| Harmonizar | Modo menor ganhou guardrail no ramo experimental; handoff Harmonizar→Writer cria sessão navegável e preserva eventos temporizados quando existem; timelines/ticks/seleção estrutural foram amplamente remediados; mapas reais de compasso agora alimentam consumidores temporais também em 4/4 quando confiáveis; o parser MusicXML preserva beat real de cifras por cursor/offset; harmony-only, vocabulário aplicado e auditorias de corpus/calibração usam armadura/modo da seção ou da janela antes de fallbacks maiores; distância harmônica já diferencia terças diatônicas de raiz alterada; apresentação preserva fundação I-IV-V contra expansões sem apoio; rótulos de condução de vozes foram alinhados ao score; função contextual e resoluções de notas-guia respeitam alvo real; Improviso usa sets canônicos com referência/variantes aplicáveis; propostas vindas da partitura e propostas geradas pela melodia preservam eventos com tick, beat, duração, identidade e origem temporal; propostas densas por divisão uniforme recebem penalidade leve no ranking; materiais contextuais recuperam preparação recente quando uma dominante é prolongada na mesma raiz ou preparada por diminuto de sensível intermediário; dominante primária sem próximo acorde explícito em centro menor sintetiza alvo menor para as resoluções; `Centro modal` consome `declaredMode` em modos dórico, mixolídio, lídio, frígio e eólio. | Estratégias gerativas densas que caem em `uniform-division` ainda precisam apresentar essa incerteza com clareza ao compositor; validação modal em repertório real depende de MusicXML com `<mode>` modal explícito. |
| MuseScore | Segurança/pareamento/ACK/origin Pages avançaram bastante; ações inexistentes foram removidas do protocolo tipado; status já mostra plugin e última partitura sincronizada; inserção no Writer agora retorna resultado tipado e feedback visível; mutações endereçadas à sessão renovada do plugin não são consumidas pela sessão antiga. | Falta validação real QML/MuseScore e fila completa por instância/score para cenário multi-MuseScore. |
| Testes/documentação | CI já roda lint e suíte curada; smoke React cobre SuiteShell/Writer/Harmonizer; bridge efêmera, transporte com fault injection e rastreabilidade teoria→regra→UI avançaram. | Falta E2E interativo e validação QML/MuseScore real. |

Próximo bloco recomendado: registrar os testes manuais MuseScore que ainda exigem runtime real e, em paralelo, seguir ajustes musicais finos apenas quando houver caso de corpus ou lacuna temporal/modal concreta.

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
| Escrever | Materiais | Acorde completo isolado | Progrediu | C maior gera rotas/material; alterações escritas e suspensões têm invariantes locais; mapa pode focar a janela do shape desenhado | Tab mais madura, mas ainda precisa virar frase/fingering |
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
- **Progresso:** o Writer agora preserva `score`, `confidence` e interpretações equivalentes no DTO da leitura; a tab “Leitura do acorde” mostra alternativas detectadas e chama `setSelectedChordIndex` para trocar a interpretação ativa. Regressão coberta em `writer-ambiguous-chord-selection.spec.ts`, incluindo escolha de `G6/D` e propagação para payload MuseScore e Materiais.
- **Esperado:** mostrar alternativas, confiança e permitir que o músico escolha a interpretação.
- **Observado:** o analisador retorna até oito candidatos, mas o Writer descarta `score`, `confidence` e equivalências; nenhuma UI chama `setSelectedChordIndex`; alterações sempre restauram o índice zero.
- **Evidência:** [chordAnalyzer.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/chordAnalyzer.ts:387>), [WriterContext.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/context/WriterContext.tsx:71>), [TranslationLayer.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/components/TranslationLayer.tsx:5>) e [useChordStore.ts](</Volumes/Documents/Development/Find Chord/src/store/useChordStore.ts:127>).
- **Reprodução:** frets `[0,0,0,0,null,null]`, notas E–B–G–D. `Em7/D` e `G6/D` empatam com score 63/confiança 96; somente `Em7/D` aparece.
- **Impacto:** músico — materiais e exportação podem usar a interpretação indesejada; produto — Jornada B inexiste apesar de o motor já produzir as alternativas.
- **Causa provável:** adaptação `ChordCandidate → DetectedChord` perde informação e a UI foi construída apenas para `activeChord`.
- **Correção recomendada:** conservar IDs, score, confiança e equivalências; seletor explícito; persistir escolha por identidade, não por índice.
- **Testes necessários:** clique/render real para Leitura e Aberturas; serviços puros já verificam escolha de `G6/D`, payload e Materiais.
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
- **Progresso:** o Writer agora transporta `symbol` como apresentação e `canonicalSymbol` como identidade de exportação; o adapter prefere a cifra canônica confiável e preserva extensões como `Cmaj9`, `Cmaj13`, `CmMaj7` e baixos como `G7(b9)/B`. A matriz local cobre estilos visuais críticos como `C7M(13) → Cmaj13`, `Cm(7M) → CmMaj7` e `C7(9) → C9` antes do envio.
- **Correção recomendada:** ampliar gradualmente a matriz `CHORD_REGISTRY × três estilos`, preservar pitch classes no mapper canônico e enviar fretboard somente se o plugin realmente o suportar.
- **Testes necessários:** matriz ampliada de estilos já iniciada em `writer-musescore-payload.spec.ts`; ainda falta QML real para cifra+fretboard.
- **Confiança:** alta para transformação/contrato; inserção externa não verificada.

### FC-WR-03 — P1 — escolher uma abertura pode remover a inversão

- **Módulo/tab/jornada:** Escrever / Aberturas / A e B.
- **Progresso:** o Writer passa `bassPC` para `generateVoicings`, a chave de cache inclui baixo/raiz/qualidade, e a regressão `writer-voicing-inversion.spec.ts` cobre inversão física preservada em `C/E`, `G7/B` e `Cdim7/Eb`.
- **Esperado:** aberturas de `C/E` devem manter E no baixo ou declarar que são apenas formas de C.
- **Observado:** `generateVoicings` recebe `bassPC=null`; ao carregar uma forma, o store recalcula e escolhe novamente o candidato zero.
- **Evidência:** [WriterContext.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/context/WriterContext.tsx:121>) e [useChordStore.ts](</Volumes/Documents/Development/Find Chord/src/store/useChordStore.ts:181>).
- **Reprodução:** entrada `C/E` `[null,null,5,5,3,0]`; primeira sugestão `[3,1,0,2,3,null]` tem C no baixo e, após o clique, vira `C`.
- **Impacto:** músico — baixo estrutural e função podem mudar; produto — a tab quebra a identidade recebida da tab anterior.
- **Causa provável:** baixo conhecido não participa do contrato do gerador.
- **Correção recomendada:** passar o pitch class do baixo e remapear o resultado por raiz/qualidade/baixo.
- **Testes necessários:** clique e exportação em UI/QML real para inversões; a matriz pura do gerador já cobre `C/E`, `G7/B` e `Cdim7/Eb`.
- **Confiança:** alta.

### FC-WR-04 — P2 — Leitura e Materiais perdem semântica e fabricam dados simplificados

- **Módulo/tab/jornada:** Escrever / Leitura e Materiais / A-B.
- **Progresso:** o mapa do braço em Materiais agora pode receber a qualidade canônica do acorde e usa a fórmula do `CHORD_REGISTRY` para distinguir notas soantes, notas estruturais implícitas e tensões. Uma shell como `Bb7b5` sem a terça desenhada passa a rotular D como `3a (Impl.)`, não como tensão. A seleção inicial de Materiais passou a preservar alterações escritas antes da preferência genérica por `inside`: `C7#9` abre em alterado, `C7#11` em lídio dominante e `Cmaj7#11` em lídio; `sus2`, `sus4` e `power` usam mapas pentatônicos neutros que não introduzem terça automaticamente; `Cdim` compartilha o ciclo diminuto simétrico sem injetar terça maior; os rótulos estruturais do braço agora distinguem 4ª suspensa, 6ª e add9. O mapa de Materiais também recebe `selectedFrets`, calcula uma janela de 4-6 casas ao redor do shape e sobrepõe as notas exatas do acorde desenhado, mesmo quando a fonte do material não as traria. A ação `Ouvir ideia` usa essa mesma forma para criar uma linha tocável perto da mão antes de cair na frase teórica por intervalos; a linha agora parte de apoio do shape, prioriza cor característica do material, como a #11 lídia, e fecha em nota estrutural quando possível. A Leitura do acorde passou a usar `analyzeVoiceRoles`/`classifyVoicing` por meio de `writerChordReadingAnalysis`, com precedência semântica para tríades e shells antes da geometria, já exibe omissões estruturais, notas estruturais presentes, papéis por corda e vozes externas quando eles existem e cobre uma matriz inicial de Drop 2, quartal e rootless.
- **Esperado:** estrutura, tensão e graus devem derivar do mesmo modelo canônico do acorde.
- **Observado:**
  - resolvido parcialmente: tríades de três vozes deixam de virar shell automaticamente e a tensão não depende mais de substring da cifra;
  - Materiais já recebe fórmula canônica no mapa do braço, mas outras leituras ainda dependem parcialmente do DTO simplificado.
- **Evidência:** [voicingGenerator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/generation/voicingGenerator.ts:41>), [WriterContext.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/context/WriterContext.tsx:78>), [writerChordReadingPresenter.ts](</Volumes/Documents/Development/Find Chord/src/domains/writer/services/writerChordReadingPresenter.ts:21>) e [localMaterialNoteRoles.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/theory/localMaterialNoteRoles.ts:67>).
- **Reprodução:** tríade C de três vozes é apresentada como `Tríade`, mostra `tônica, terça maior, quinta`, detalha `corda 1 C5: tônica`, `corda 2 G4: quinta`, `corda 3 E4: terça maior` e resume vozes externas como `baixo E4: terça maior`, `topo C5: tônica`; shell C7 com raiz, terça e sétima sem quinta é apresentada como `Shell`, mostra omissão de quinta, notas estruturais `tônica, terça maior, sétima menor`, seus papéis por corda e baixo/topo; Cmaj7 em quatro cordas adjacentes é lido como `Drop 2`; empilhamento C-F-Bb é lido como `Quartal`; shape E-G-B sobre Cmaj7 é lido como `Sem tônica`, omite tônica e mostra `terça maior, quinta, sétima maior`; cluster cromático/alterado consegue atingir tensão alta e nomear tensão por voz; shell Bb7b5 sem D agora mostra D como `3a (Impl.)` no braço de Materiais; `C7#9`, `C7#11`, `Cmaj7#11`, `Csus2`, `Csus4`, `Cdim` e `C5` possuem regressões para foco inicial e células coerentes com a cifra; shape desenhado nas casas 8-10 limita o mapa às casas 7-12, marca as notas do próprio acorde e faz a ação tocável usar uma linha perto da forma que inclui a #11 lídia e termina em apoio estrutural. Ainda falta levar relações entre acordes para explicações mais completas e explicitar ritmo/fingering dessas frases.
- **Impacto:** músico — explicação factual e pedagógica incorreta; produto — tabs contradizem analisadores mais ricos já existentes.
- **Causa provável:** DTO do Writer elimina fórmula, omissões e papéis de voz, substituindo-os por heurísticas locais.
- **Correção recomendada:** propagar explicitamente condução entre acordes para explicações e estados da UI.
- **Testes necessários:** ampliar matriz para mais variações de acordes alterados e shapes rootless; cobertura inicial de tríade/shell/Drop 2/quartal/rootless/cluster existe em `writer-chord-reading-analysis.spec.ts` e de nota implícita em `local-material-note-roles.spec.ts`/`local-material-fretboard-notes.spec.ts`.
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
- **Observado:** resolvido no comparador. Referências com múltiplas cifras no mesmo compasso agora são comparadas por slot intra-compasso, sem descartar os eventos seguintes; quando proposta e referência têm ticks, o pareamento usa sobreposição temporal antes do índice e os agregados de agreement são ponderados pela duração da referência.
- **Evidência:** [ReferenceHarmonyComparator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/ReferenceHarmonyComparator.ts:74>). No corpus, 182/199 referências têm mais de um acorde em algum compasso.
- **Reprodução:** referência `[C,G7]`, proposta `[C,Db7]`: `partially-aligned`, `rootAgreement=0.5` e `functionAgreement=0.5`; quando C dura 3/4 do compasso e o erro ocupa 1/4, o agreement ponderado fica `0.75`.
- **Impacto:** músico — proposta divergente parece alinhada; produto — bônus/ranking e agrupamento incorretos.
- **Causa provável:** comparação agregada por medida eliminou identidade temporal.
- **Progresso:** `ReferenceHarmonyComparator` mantém todos os acordes da referência por compasso; quando a referência tem um único acorde, preserva a escolha do melhor acorde da proposta no compasso; quando a referência é densa, compara eventos por ordem interna e penaliza divergências como `C / Db7` contra `C / G7`; quando há `tickStart/tickEnd` nos dois lados, escolhe o acorde comparável por maior overlap temporal, com desempate por proximidade musical; quando a referência carrega duração, `functionAgreement` e `rootAgreement` ponderam acertos longos e curtos por `tickEnd - tickStart`.
- **Correção recomendada:** calibrar thresholds/ranking no corpus real para confirmar quando um erro curto deve ou não derrubar a proposta.
- **Testes necessários:** ampliar corpus com propostas mais curtas/longas que a referência e casos de síncope harmônica.
- **Confiança:** muito alta.

### FC-HZ-04 — P1 — “Usar harmonia” não aplica a proposta no Writer

- **Módulo/tab/jornada:** Harmonizar→Escrever / C-D-E.
- **Progresso:** propostas aplicadas ao Writer viram uma sessão explícita de progressão com compasso, índice, ordem e cifra; o Writer carrega uma abertura tocável do primeiro acorde e exibe faixa navegável. O rótulo visível da progressão agora usa presenter compartilhado e preserva compassos com beat interno. Regressão coberta em `apply-proposal-to-writer.spec.ts`.
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
- **Observado:** resolvido parcialmente. Sem notas, o Harmonizar agora constrói contexto harmônico, leitura funcional, uma variação conservadora de cor diatônica e materiais derivados da referência, explicitando ausência de validação melódica.
- **Evidência:** [useHarmonizerProposals.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useHarmonizerProposals.ts:76>) e [ContextualMaterialSuggestionsPanel.tsx](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/components/ContextualMaterialSuggestionsPanel.tsx:280>).
- **Reprodução original:** C–Am–Dm7–G7–C sem notas produzia apenas a referência/leitura e nenhum material contextual.
- **Impacto:** músico — Jornada E não existe; produto — um dos três modos prometidos não é entregue.
- **Causa provável:** pipeline depende obrigatoriamente de `melodicAnchors`.
- **Progresso:** `buildHarmonyOnlyPhraseContext` infere centro/cadência pela referência; `buildHarmonyOnlyAnalysisProposals` cria a proposta `Leitura — Função da progressão` e `Variação — Cores diatônicas da progressão`, preservando raízes/baixo/cadência e evitando critérios de cobertura melódica. Materiais contextuais passam a usar a harmonia mesmo com `melody=[]`. Regressão coberta em `harmony-only-analysis.spec.ts` e incluída na suíte curada.
- **Correção recomendada:** evoluir para transformações harmony-only mais musicais além da coloração diatônica, ainda sem usar critérios de cobertura melódica.
- **Testes necessários:** UI sem notas, corpus real somente cifras e novas famílias de transformação que preservem função/baixo/cadência.
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
- **Observado:** resolvido. A referência escrita agora vem do set canônico da proposta `existing-harmony-reference`, variantes aplicáveis geram seus próprios materiais, e a seleção inicial segue `reference > foundation > primary`.
- **Evidência:** [useHarmonizerProposals.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useHarmonizerProposals.ts:159>), [ProposalConsequenceSimilarity.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/ProposalConsequenceSimilarity.ts:59>) e [ContextualMaterialSuggestionsPanel.tsx](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/components/ContextualMaterialSuggestionsPanel.tsx:281>).
- **Reprodução:** C–F–G7–C cria apenas `existing-harmony-reference` para a partitura; sem referência, a tela abre em “Harmonia básica I-IV-V” antes de alternativas primary mais cromáticas; `colorVariants` aparecem como leituras aplicáveis.
- **Impacto:** músico — opções duplicadas ou sem consequência melódica; produto — tab não corresponde à opção efetivamente aplicável.
- **Causa provável:** dois pipelines independentes constroem sets e não compartilham seleção.
- **Progresso:** `buildProposalMaterialSuggestionSets` expande propostas e variantes deduplicadas; referência preserva `source=reference`; painel usa `preferredMaterialSuggestionSet`; variantes sem eventos próprios herdam `eventId/tick/duration` da proposta base quando preservam a mesma estrutura temporal.
- **Correção recomendada:** ampliar o mesmo vínculo temporal para variantes que mudam densidade rítmica mais complexa, mantendo intenção rítmica explícita quando a divisão proporcional não for suficiente.
- **Testes necessários:** seleção com várias seções reais e variantes com mesmo ID vindas de agrupamentos distintos; variantes com densidade diferente já geram eventos próprios em `temporal-melody-window.spec.ts`.
- **Confiança:** alta.

### FC-HZ-10 — P2 — modelo de proposta elimina ritmo e identidade dos eventos

- **Módulo/tab/jornada:** Harmonizar / Harmonizações-Improviso / D.
- **Progresso:** resolvido parcialmente. Substituições controladas já miravam `measure + chord + tick`; agora `ReharmonizationProposal` aceita `events` com `id`, `measureIndex`, `beat`, `tickStart`, `tickEnd`, `durationTicks`, índice, ocorrência no compasso e `timingSource`. Propostas de referência, ritmo/contorno da partitura, substituição controlada, análise harmony-only e propostas geradas só pela melodia carregam esses eventos; Improviso consome a janela temporal real quando ela existe. O parser MusicXML agora calcula `beat` de cifras pelo cursor temporal real e respeita `<offset>` em `<harmony>`, evitando que cifras deslocadas entrem sempre como beat 1 quando o arquivo traz posição suficiente. Eventos densos gerados pela melodia usam ataques internos como pontos de troca quando há evidência suficiente e calculam beat pelo numerador da métrica; quando não há ataques suficientes, os eventos ficam marcados como `uniform-division`, enquanto acordes únicos de compasso ficam como `measure-level`. O ranking aplica uma penalidade leve para propostas densas marcadas como `uniform-division`, preferindo alternativas ritmicamente ancoradas quando a condução restante empata. Leituras de materiais para `colorVariants` herdam a janela temporal da proposta base quando a variante preserva o mesmo desenho de medidas/acordes; quando a variante muda a densidade dentro de um compasso, o sistema sintetiza eventos próprios dentro da janela real do compasso-base e marca a origem como `source-timeline`. O handoff Harmonizar→Writer agora prefere `events` temporizados antes de reconstruir a progressão por compasso e renderiza posições como `Comp. N · beat X` quando há troca interna. A comparação com referência usa overlap temporal quando os dois lados têm ticks e pondera agreement pela duração da referência; o comparador também ganhou modo estrito para auditar acorde de referência longo contra proposta internamente densa/divergente, sem tornar esse modo padrão do ranking calibrado. A validação melódica estratégica, o gate experimental e os diagnósticos de compatibilidade também passaram a preferir o acorde temporizado com maior overlap para cada nota, evitando que a união de acordes de um compasso valide uma nota contra o acorde errado.
- **Esperado:** preservar posição, duração e identidade de cada acorde.
- **Observado:** parcialmente resolvido. Propostas derivadas de cifras reais preservam evento/duração reais e, quando o MusicXML posiciona cifras por `<forward>` ou `<offset>`, preservam também o beat real. Propostas geradas puramente da melodia criam eventos temporizados a partir de `measureTicks` ou fallback métrico; quando há acordes múltiplos em um compasso, ataques melódicos internos agora podem definir os pontos de troca antes do fallback uniforme, e a fonte dessa decisão fica explícita em `timingSource`. Variantes de cor com densidade diferente também recebem `eventId`, beat proporcional por ticks, ticks e duração próprios. Ao aplicar no Writer, os itens preservam `eventId`, beat, ticks e duração.
- **Evidência:** [ReharmonizationProposal.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/models/ReharmonizationProposal.ts:1>), [ControlledSubstitutionProposals.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/ControlledSubstitutionProposals.ts:30>) e [harmonizerService.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/services/harmonizerService.ts:507>).
- **Reprodução:** C→G7 em janelas diferentes no mesmo compasso mantém eventos distintos; dois Fmaj7 no mesmo compasso substituem apenas a ocorrência-alvo, preservando o segundo acorde; cifra MusicXML após `<forward>960</forward>` em 4/4 entra como beat 3; cifra com `<offset>480</offset>` em 3/4 entra como beat 2 sem mover o cursor da melodia; a recalibração de Donna Lee passa a aceitar `Dominantes secundárias` como primária básica quando a referência temporal fica mais precisa, preservando cobertura total e ausência de penalidade cromática; `strategy_i_iv_v` em 3/4 gera eventos de 1440 ticks; propostas densas dividem o compasso em janelas distintas; em 3/4 com ataque interno no segundo tempo, o segundo acorde gerado começa nesse ataque e recebe beat 2; uma nota E no trecho temporizado de G7 em um compasso `C / G7` não é mais considerada coberta pelo C anterior.
- **Impacto:** músico — ritmo harmônico, síncope e validação local são perdidos; produto — comparação, Improviso e Writer não podem reconstruir a proposta.
- **Causa provável:** agrupamento de apresentação virou modelo de domínio.
- **Correção recomendada:** apresentar `timingSource=uniform-division` como incerteza musical clara quando a divisão uniforme não for musicalmente adequada.
- **Testes necessários:** estratégias com ritmo harmônico interno não uniforme em corpus real; aplicação Writer e variantes densas já têm cobertura unitária de eventos temporizados.
- **Confiança:** muito alta.

### FC-HZ-11 — P2 — parser e inferência cadencial simplificam demais o contexto tonal

- **Módulo/tab/jornada:** Harmonizar / Importação-Harmonizações / C-D.
- **Progresso:** o snapshot preserva `keyTimeline` e `timeTimeline`; auditorias e geração temporal consomem essas timelines. A melodia isolada deixou de nomear `AUTHENTIC/HALF/DECEPTIVE/PLAGAL` só pelo grau final: ela mantém o alvo melódico, mas a cadência fica `OPEN` até haver evidência harmônica. UI e campos gravitacionais agora chamam esse caso de chegada melódica/aberta, sem prometer repouso cadencial. A harmonia escrita também reconhece meia cadência quando uma dominante final aponta para um centro já sustentado, cadência plagal final em IV-I/iv-I, cadência deceptiva V-vi/V-VI sem trocar o centro para o acorde de chegada e cadência frígia `iv6-V` em menor quando o baixo confirma b6→5. A apresentação e a gramática ii-V tratam `DECEPTIVE` como alvo evitado, não como repouso automático. `measureTicksForMetricContext` agora entrega o mapa real de compassos sempre que ele é confiável, inclusive em 4/4, reduzindo fallbacks fixos de `1920` ticks por compasso. `PhraseAnalysisEngine` calibra a confiança da chegada melódica pela duração real do compasso quando recebe `measureTicks`, aceita `keyContext` estruturado, usa parser explícito de tônica/modo e, mesmo sem âncoras melódicas, respeita a tonalidade declarada antes do fallback fraco em C maior. O contexto tonal agora expõe `keyContext` estruturado, aceita rótulos `major/minor/maior/menor/m`, o caminho somente-cifras e os segmentos locais usam `keyContext` da seção antes de aceitar fallbacks legados, inclusive passando o objeto estruturado para a análise de frase, as auditorias de corpus usam esse mesmo contexto quando não há melodia selecionável, a auditoria real, a comparação Almada, a curadoria de propostas e as auditorias de materiais contextuais/melódicos passam o `keyContext` da timeline diretamente para a análise de frase, a auditoria de vocabulário aplicado prefere a timeline quando a referência só oferece centro fraco pelo primeiro acorde, as auditorias real/curadoria/materiais/contexto passam `measureTicks` para calibrar chegadas métricas e as auditorias de side-arrival/ranking passam o snapshot para avaliar a janela pelo tick correto. Quando a referência harmônica promove um centro sem evidência cadencial explícita, o alvo cadencial agora acompanha esse centro como `OPEN`, separando centro autoral de cadência funcional. O caminho somente-cifras também preserva `PHRYGIAN` quando a referência detecta `iv6-V` em menor. O guardrail de baixo estrutural/planar agora é local: ele continua evitando falsa plagal em referência planar, mas não suprime uma plagal final limpa quando os dois últimos acordes não têm baixo independente. Modos MusicXML explícitos, como `dorian`, `mixolydian`, `lydian`, `phrygian` e `aeolian`, agora preservam tônica modal e `declaredMode`, mantendo `major/minor` apenas como modo operacional para os motores funcionais existentes.
- **Esperado:** preservar `<mode>`, mudanças de armadura e só nomear cadência quando houver evidência.
- **Observado:** parcialmente resolvido. Parser/timelines já preservam mudanças de armadura/modo em metadados; `timelineContextAtTick` entrega tônica/modo estruturados e preserva `declaredMode` modal quando o MusicXML informa modos como `dorian`, `mixolydian`, `lydian`, `phrygian` ou `aeolian`; `PhraseAnalysisEngine` não inventa mais tipo cadencial pela última nota, calcula força de chegada com duração métrica real, não decide modo por substring solta, aceita `keyContext` estruturado, preserva `declaredMode` no centro escolhido e não força C maior quando recebe tonalidade explícita sem melodia; consumidores temporais principais recebem `measureTicks` confiável mesmo quando a métrica é 4/4; harmony-only e segmentos locais recebem `keyContext` via `useHarmonizerProposals`; auditorias `real-music`, `proposal-curation`, `applied-harmonic-vocabulary`, `side-arrival`, `ranking-calibration`, `contextual-scales`, `melodic-materials`, `presentable-windows` e `almada-example` usam centro/mode estruturados, `measureTicks` ou snapshot por janela também na análise de frase; a curadoria de propostas também passa `keyContext` aos segmentos locais, as auditorias de janelas apresentáveis/chegada lateral passam `keyContext` diretamente para cada janela avaliada, e os diagnósticos reais de repertório não chamam mais `timelineContextForAnchors(...).keySignature` sem preservar o `keyContext`; parser tonal não perde modo quando recebe rótulos em português; referência harmônica distingue cadências autêntica, meia, plagal, deceptiva e frígia; harmony-only preserva essa cadência frígia no `PhraseContext`; labels gravitacionais e candidatos ii-V não transformam cadência deceptiva em repouso local; o IV-I final deixa de virar evidência plagal quando a própria camada autoral está marcada como baixo estrutural/planar com baixa dependência cadencial; no caminho UI, esse tipo de centro planar vira chegada aberta no centro de referência, não cadência plagal nem alvo herdado da melodia. Quando uma passagem planar termina em IV-I limpo, sem baixo independente nos dois últimos acordes, a cadência plagal volta a ser reconhecida localmente. A estratégia `Centro modal` agora consome `declaredMode`: `D dorian` gera `Dm-G-C-Dm`, `G mixolydian` gera `G-F-Dm-G`, `C lydian` gera `C-D-G-C`, `E phrygian` gera `Em-F-Dm-Em` e `A aeolian` gera `Am-F-G-Am`, sem trocar o modo operacional usado pelos validadores funcionais. A pendência restante é validar essa geração modal dedicada em repertório real, sem quebrar casos como E.S.P., onde cromatismo e centro modal dependem da referência local.
- **Evidência:** [musicxml-parser.cjs](</Volumes/Documents/Development/Find Chord/scripts/musicxml-parser.cjs:4>) e [PhraseAnalysisEngine.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/PhraseAnalysisEngine.ts:143>).
- **Reprodução:** final em tônica, quinta ou quarta preserva `targetPitch`, mas retorna `cadenceType=OPEN` sem harmonia; Blue in Green mantém chegada melódica em F sem promover ii-V-I local como resposta principal; o cabeçalho exibe "chegada aberta" e os campos gravitacionais dizem "chegada melódica" em vez de repouso/destino cadencial; `C-F-G7` vira `HALF` em C e `G7` isolado não captura o centro; `C-F-C` e `C-Fm-C` viram `PLAGAL`; `C-F-G7-Am` vira `DECEPTIVE` em C maior e `Am-Dm-E7-F` vira `DECEPTIVE` em A menor; `Dm/F-E7` vira `PHRYGIAN` em A menor pela condução de baixo F→E também no caminho somente-cifras; mapa explícito de compasso em 4/4 agora é preservado para geração temporal, enquanto mapas com resolução implausível continuam rejeitados; chegada de 1440 ticks em 3/4 satura confiança como compasso inteiro, não como 75% de 4/4; `C major`, `C minor`, `F#m`, `Bb maior` e `Eb menor` são normalizados como tônica/modo explícitos; `D dorian` vira centro D com `declaredMode=dorian`; `<fifths>0</fifths><mode>mixolydian</mode>` vira centro modal G, não C maior; `D dorian` produz paleta modal `Dm-G-C-Dm`; `G mixolydian` produz `G-F-Dm-G`; `C lydian` produz `C-D-G-C`; `E phrygian` produz `Em-F-Dm-Em`; `A aeolian` produz `Am-F-G-Am`; `analyzePhrase([], "F#m")` retorna F# menor como centro desconhecido, não C maior; `analyzePhrase(..., "C", { keyContext: Cm })` prefere C menor à string legada; curadoria melódica com `metadata.keySignature=C` e `keyTimeline=C minor` fica em `minor-functional`; `D7` sozinho em seção com `Cm` usa C menor como centro aberto antes de cair no primeiro acorde; segmentos locais preferem `keyContext=Am` mesmo quando o `keySignature` legado ainda chega como C e mesmo quando o `label` do contexto não codifica menor; referência planar tipo Bright Size Life mantém D como centro autoral possível, mas não usa `IV-I plagal aponta D maior` como evidência e chega em D como `OPEN` no contexto de frase; uma passagem planar que termina em `F-C` limpo volta a produzir `PLAGAL` em C.
- **Impacto:** músico — centro/cadência falsos; produto — estratégias e Improviso são ativados por metadados incorretos.
- **Causa provável:** armadura e grau final usados como aproximações definitivas.
- **Correção recomendada:** criar um classificador explícito para cadência versus baixo estrutural/planar antes de suprimir centros aparentes; não reaproveitar heurística global em janelas locais sem testar ranking cromático.
- **Testes necessários:** referência planar tipo Bright Size Life, E.S.P. como controle cromático/modal, MusicXML menor, modulação e casos negativos adicionais para cadências não autênticas.
- **Confiança:** muito alta.

### FC-HZ-12 — P2 — regras contextuais ensinam função e resoluções erradas

- **Módulo/tab/jornada:** Harmonizar / Improviso / C-D.
- **Esperado:** reconhecer dominantes pelo alvo real e produzir notas-guia da qualidade/alvo.
- **Observado:** resolvido parcialmente. Dominantes secundárias/SubV agora dependem de alvo real; D7→C não vira dominante funcional; notas-guia vêm da fórmula do acorde; resoluções usam a qualidade do acorde de chegada; diminutos em inversão também podem ser lidos como dominantes auxiliares quando o baixo conduz ao alvo por semitom; dominantes sem próximo acorde explícito inferem alvo regional local quando vêm preparados por ii/iiø, por ii→SubV, por IV/iv, por IV maior local em movimento de quarta ascendente, por dominante anterior em cadeia ou por diminuto de sensível preparando a dominante local, preservando alvo menor quando a preparação é meio-diminuta, subdominante menor ou quando a própria dominante primária atua em centro menor sem próximo acorde escrito. Quando o acorde anterior é um prolongamento na mesma raiz (`A7sus→A7`) ou um diminuto de sensível intermediário (`Em7b5→G#dim7→A7`), o motor consulta a preparação recente sem liberar dominantes soltas. SubV solto no centro global permanece cor, não dominante funcional; dominante sobre a própria tônica e dominante que segue para acorde de mesma raiz são tratados como material modal/blues sem alvo resolutivo artificial mesmo quando a raiz também é dominante primária do centro tonal, inclusive em materiais H/W diminutos. Materiais predominantes com alvo claro, como iiø lócrio #2 antes da dominante, agora também carregam esse alvo no card principal, na dica prática e no suporte de ranking, mas não aparecem como preparação quando o próximo acorde explícito não é a dominante relacionada. Ainda falta ampliar outros alvos ambíguos que dependem de histórico maior do que o acorde anterior.
- **Evidência:** [contextualMaterialFunction.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/theory/contextualMaterialFunction.ts:1>).
- **Reprodução:**
  - `A7→Dm`, `E7→Am` e `Db7→C` são `dominant`;
  - `D7→C` fica `color`;
  - `A7` sem próximo acorde, mas com `resolutionTarget=D`, é `dominant`;
  - `G7` sem próximo acorde em C infere alvo regional C; `D7` solto em C continua `color`;
  - `Em7→A7`, `Em7→A9sus` e `Em7→A13sus` sem próximo acorde inferem alvo regional D; `Em7→A7sus→A7` preserva o alvo D; `A7`/`A9sus`/`A13sus` soltos em C continuam `color`;
  - `Dm7→Db7` sem próximo acorde infere alvo regional C por SubV; `Db7` solto em C continua `color`;
  - `Em7b5→A7` e `Em7b5→A7sus→A7` sem próximo acorde inferem D menor e resolvem `G→F`, não `G→F#`;
  - `Em7b5→G#dim7→A7` também preserva D menor e resolve `G→F`, enquanto `G#dim7→A7` sem iiø anterior não fabrica qualidade menor;
  - `C→D7` sem próximo acorde infere alvo regional G, mas `D7` solto em C continua `color`;
  - `Bbm7→C7` e `Bbm7→C7sus→C7` sem próximo acorde inferem F menor e resolvem `Bb→Ab`, não `Bb→A`;
  - `Bm7b5→E7(b13)` mostra o alvo E no card e na dica prática do material iiø, soma suporte de resolução no ranking, além das células `A→G#` e `D→C`;
  - `Bm7b5→Cmaj7` não oferece `iiø lócrio #2` como preparação, embora `Bm7b5` isolado preserve esse material como exploração segura;
  - `Fmaj7→Bb7` sem próximo acorde infere alvo regional Eb, mas `Bb7` solto em C permanece `color`;
  - `C7` em centro C permanece material modal sem `resolutionTarget`;
  - `A7alt→A13` permanece continuidade modal e não fabrica resolução cadencial;
  - `A7(b9)→A13` em D maior oferece vocabulário H/W diminuto como continuidade modal sem prometer resolução enquanto o alvo real não aparece;
  - `A7→D7` sem próximo acorde infere alvo regional G, mas `G7→C7` em C não transforma C7 em V/IV automático;
  - `G#dim7→Am` é dominante auxiliar por resolução semitonal; `Edim7/C#→Dm` também é dominante auxiliar pelo baixo dirigido; `Cdim7→Am` permanece `color`;
  - `G#dim7→A7` sem próximo acorde infere alvo regional D, mas `Bdim7→C7` em C não transforma C7 em V/IV automático;
  - `G7` em centro C menor, sem próximo acorde explícito, resolve notas-guia para `Cm`, com `B→C` e `F→Eb`;
  - `G7(#5)`, `G7(#9,b13)`, `G9(b5)`, `G9(#5)`, `G9(#9)`, `G9(#11)`, `G13(b9)`, `G13(#11)` e `G13(b9,#11)` com alvo real em C são dominantes, não cores soltas;
  - `G7(#5)→Cmaj7` preserva B/F como notas-guia dominantes, enquanto `Gaug` isolado continua podendo oferecer material de tons inteiros;
  - C, C6, Cadd9 produzem apenas a terça; Csus/F#5 não fabricam terça+sétima;
  - E7→Am sugere D→C; G7→Cm sugere F→Eb.
- **Impacto:** músico — recebe resolução melódica objetivamente errada; produto — ranking, região e rota linear usam a classificação defeituosa.
- **Causa provável:** predicados incompletos e alvo representado apenas pela raiz.
- **Progresso:** `determineContextualHarmonicFunction` valida V/SubV por movimento de raiz; `guideTonesFor` usa `CHORD_REGISTRY`; `guideToneResolutions` e `nearestGuideToneTargets` recebem o acorde-alvo efetivo; dominantes sem próximo acorde explícito agora usam `resolutionTarget` para classificar função e resoluções; diminutos resolvidos por semitom ascendente são classificados como dominantes auxiliares; diminutos invertidos consideram o baixo indicado na cifra; dominante primária, diminuto de sensível e dominante preparada por ii/iiø, ii→SubV, IV/iv, IV maior local, dominante anterior em cadeia ou diminuto de sensível para a dominante sem `nextChord`/`resolutionTarget` inferem alvo regional sem capturar dominantes secundárias/SubV soltos; iiø-V, iv-V e V em centro menor implícitos sintetizam alvo menor para notas-guia e células melódicas. Dominantes com mesma raiz do centro global passam a priorizar alvo resolutivo real antes de repouso por raiz; dominantes sobre a própria tônica e dominantes prolongados por acorde de mesma raiz ficam como continuidade modal quando não há alvo explícito, inclusive quando o centro tonal faria essa raiz parecer dominante primária; `9sus4` e `13sus4` preparados também entram nessa leitura dominante sem liberar o caso solto; H/W diminuta não exibe alvo quando o próximo acorde mantém a mesma raiz; candidatos herdam alvo de materiais melódicos quando o próprio vocabulário já declara a direção e usam esse alvo no ranking; candidatos dominantes também herdam o próximo acorde como alvo real quando há função dominante explícita; `guideToneResolutions` deixou de registrar nota comum idêntica como resolução, evitando `B→B` onde a condução funcional esperada é `B→C`; materiais iiø só viram preparação contextual quando o próximo acorde valida a dominante relacionada; a apresentação dos predominantes nomeia o alvo quando ele existe. A leitura contextual recebe histórico curto de acordes no Harmonizar e nas auditorias de materiais, atravessando prolongamentos de mesma raiz e diminutos de sensível intermediários para recuperar preparações recentes, como `Em7→A7sus→A7` e `Em7b5→G#dim7→A7`. A matriz de dominantes alteradas do resolvedor agora alimenta diretamente o predicado contextual e a qualidade interna dos materiais; `7#5`/`9#5` são tratados como dominantes com b13 quando têm alvo real, sem perder a sétima nem a função.
- **Correção recomendada:** aprofundar alvo regional para outras cadências locais não centradas no centro global, mantendo gates de preparação para não capturar dominantes soltas.
- **Testes necessários:** alvos ambíguos que dependem de histórico maior do que o acorde anterior.
- **Confiança:** alta.

## MuseScore, concorrência e segurança

### FC-MS-01 — P1 — fila e sincronização não são vinculadas à operação/partitura

- **Módulo/tab/jornada:** Integração / A-C-D-F.
- **Esperado:** pedido expira e só a instância/partitura destinatária pode consumi-lo.
- **Observado:** resolvido parcialmente. `request_score` agora carrega `expiresAt`, o bridge poda mensagens expiradas, pedidos de sync pendentes são coalescidos, o snapshot/status carregam identidade de partitura (`scoreId/title`) e o adapter só carrega snapshots com `requestId` quando pertencem ao pedido ativo. O bridge emite `pluginSessionId`, direciona `request_score` à sessão de plugin mais recente e mutações do Writer também carregam `targetPluginSessionId` e `targetScoreId` quando o status conhece plugin/score ativos; polling e entrega imediata por WebSocket só liberam mutações cujo score alvo bate com a última identidade sincronizada, mutações endereçadas à sessão renovada não são consumidas pela sessão antiga, e o ACK precisa vir da sessão que recebeu o comando. A fila ainda não é totalmente segregada por múltiplos scores simultâneos.
- **Evidência:** [musescoreAdapter.ts](</Volumes/Documents/Development/Find Chord/src/utils/musescoreAdapter.ts:109>), [musescore-bridge.cjs](</Volumes/Documents/Development/Find Chord/scripts/musescore-bridge.cjs:118>) e [FindChordBridge.qml](</Volumes/Documents/Development/Find Chord/plugins/FindChordBridge.qml:162>).
- **Reprodução:** sincronizar com plugin fechado, esperar timeout e abrir o plugin; pedido antigo não deve mais substituir o estado no dashboard, pois o `requestId` ativo foi limpo. Disparar dois syncs antes do polling deixa apenas o pedido mais recente na fila. Com duas instâncias, `request_score` novo e mutações do Writer podem ser marcados com a sessão de plugin ativa; se a identidade de score conhecida mudou, a mutação com `targetScoreId` diferente não é entregue por WebSocket nem consumida pelo polling atual.
- **Impacto:** músico — partitura errada ou obsoleta pode aparecer; produto — estado global parcial e não determinístico.
- **Causa provável:** fila FIFO global sem `pluginId`, `scoreId` ou lifecycle de request.
- **Progresso:** sync tardio deixa de permanecer indefinidamente na fila; parser MusicXML gera `metadata.scoreId`; `/api/v1/status` expõe a identidade da última partitura sincronizada e `pluginSessionId`; respostas de snapshot com `requestId` fora do pedido ativo são ignoradas antes de tocar o store; novo `request_score` substitui pedidos de sync anteriores ainda não consumidos; `/api/v1/plugin-session` entrega `pluginSessionId`, o QML envia esse ID no `/consume` e no `/ack`, e o bridge marca `request_score` com `targetPluginSessionId` antes de enfileirar ou transmitir. O adapter consulta o status e inclui `targetPluginSessionId` e `targetScoreId` em `INSERT_CHORD` quando disponíveis; o bridge preserva na fila mensagens cujo `targetScoreId` não corresponde ao score ativo conhecido, bloqueia a entrega imediata por WebSocket nesse caso, preserva mutações de sessão renovada quando a sessão antiga faz polling e rejeita ACK de sessão diferente.
- **Envelope suportado:** registrado em [musescore_integration_envelope.md](</Volumes/Documents/Development/Find Chord/docs/musescore_integration_envelope.md:1>). O contrato atual cobre uma instância do MuseScore, uma partitura ativa/sincronizada por vez, ressincronização após troca de partitura e inserção de cifra textual, não diagrama de fretboard.
- **Correção recomendada:** filas por destino também para mutações em cenários multi-score reais, pending/cancelled requests no bridge e validação efetiva de `scoreId/sessionId` quando houver múltiplos plugins.
- **Testes necessários:** duas instâncias reais, troca de score em runtime QML, resposta fora de ordem rejeitada e mutações com alvo de partitura. Cobertura efêmera já garante que mutação endereçada ao score B não chega por WebSocket/polling enquanto o score ativo é A, que mutação de sessão renovada não é consumida pela sessão antiga e que ACK de outra sessão é rejeitado.
- **Confiança:** alta; cenário multi-MuseScore não executado externamente.

### FC-MS-02 — P1 — interface confunde bridge com MuseScore e o deploy publicado é incompatível

- **Módulo/tab/jornada:** Integração / A-C-D-F.
- **Progresso:** o Origin publicado `https://gustavoesteves.github.io` foi incluído no allowlist padrão do bridge e origens adicionais podem ser configuradas por `FIND_CHORD_DASHBOARD_ORIGINS`. A UI agora chama o WebSocket de `Bridge Conectado/Offline`, consulta `/api/v1/status` com token da sessão, mostra `Plugin ativo/Aguardando plugin`, exibe a partitura sincronizada e mostra erro visível quando o plugin não responde ao sync. Se a conexão cai antes do ACK de inserção, o transporte rejeita o comando imediatamente e libera retry, sem aguardar o timeout completo.
- **Esperado:** estados separados para bridge, plugin e score; erro visível; ambiente publicado compatível.
- **Observado:** resolvido parcialmente. O badge não promete mais disponibilidade do MuseScore quando só o bridge está conectado e já consome `pluginLastSeen`; inserção no Writer agora diferencia sucesso, cifra rejeitada, timeout, bridge offline, queda de conexão antes do ACK e rejeição do plugin com mensagem visível. Existe vínculo de sessão de plugin para sync e mutações quando o status está disponível, mas ainda não há vínculo completo com score específico.
- **Evidência:** [useScoreSync.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useScoreSync.ts:19>), [MuseScoreConnectionBadge.tsx](</Volumes/Documents/Development/Find Chord/src/domains/suite/components/MuseScoreConnectionBadge.tsx:4>), [VirtualFretboard.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/components/VirtualFretboard.tsx:41>) e [deploy.yml](</Volumes/Documents/Development/Find Chord/.github/workflows/deploy.yml:1>).
- **Reprodução:** bridge ativo e plugin fechado: interface pode dizer “MuseScore Conectado”; sync espera e termina sem mensagem. Na origem Pages, o bridge rejeita a sessão.
- **Impacto:** músico — não sabe se a operação funcionou; produto — integração indisponível no deploy oficial.
- **Causa provável:** conexão técnica usada como proxy de disponibilidade funcional; topologia de deploy não foi alinhada ao allowlist.
- **Correção recomendada:** rejeição de snapshot de score trocado e pareamento seguro compatível com múltiplas instâncias/partituras.
- **Testes necessários:** score trocado e origem de produção em runtime real. Cobertura de fault injection já garante rejeição imediata quando o socket cai antes do ACK e retry com o mesmo `commandId`.
- **Confiança:** alta.

### FC-MS-03 — P2 — mutações não são idempotentes e o protocolo promete ações inexistentes

- **Módulo/tab/jornada:** Integração / A-F.
- **Progresso:** o protocolo tipado restringe mutations a `INSERT_CHORD`, remove `REPLACE/DELETE`, adiciona `commandId`, expiração, ACK e alvo opcional de score. O plugin agora mantém um ledger curto por `commandId` + `targetScoreId` quando disponível: reentrega do mesmo comando para a mesma partitura reenvia o ACK anterior sem mutar novamente. O Writer preserva o `commandId` de uma falha e oferece retry idempotente da mesma operação. O bridge mantém um lease curto para mutações consumidas e remove o lease no ACK, podendo recolocar comandos não confirmados antes de expirarem; ACK sem comando em lease agora é rejeitado antes de chegar ao dashboard. O transporte também limpa ACKs pendentes ao desconectar. Ledger por instância real ainda continua pendente.
- **Esperado:** retry seguro; ações desconhecidas rejeitadas; pareamento não recuperável por qualquer processo local.
- **Observado:** resolvido parcialmente. `/consume` remove a mutação da fila visível, mas agora a mantém em lease até ACK ou expiração do lease; reentrega com mesmo `commandId` e mesmo `targetScoreId` não duplica a mutação no QML. Retry explícito do Writer reutiliza o mesmo ID quando há falha retornada pelo adapter, e a mutação pode carregar `targetPluginSessionId` e `targetScoreId`; ACK órfão ou vindo de outra sessão é rejeitado pelo bridge. Ainda não há ledger por instância real do plugin. `REPLACE_CHORD`/`DELETE_CHORD` não pertencem mais ao tipo público. `/plugin-session` entrega token sem autenticação para cliente local.
- **Evidência:** [Protocol.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/bridge/Protocol.ts:7>), [musescore-bridge.cjs](</Volumes/Documents/Development/Find Chord/scripts/musescore-bridge.cjs:221>) e [FindChordBridge.qml](</Volumes/Documents/Development/Find Chord/plugins/FindChordBridge.qml:223>).
- **Reprodução:** perder ACK após inserção e repetir; ou enviar ação DELETE/REPLACE.
- **Impacto:** músico — possível duplicação ou inserção em vez de remoção; produto — contrato público não corresponde à implementação. Um processo local pode consumir/forjar o canal.
- **Causa provável:** ACK confirma depois da mutação sem armazenamento de resultado; protocolo antecipou capacidades.
- **Correção recomendada:** ledger por instância real e pareamento aprovado.
- **Testes necessários:** fault injection antes/depois da mutação em runtime real, replay por instância e cada ação do protocolo. Cobertura efêmera já rejeita ACK para comando nunca entregue ao plugin.
- **Confiança:** alta; forma visual exata da duplicação depende do MuseScore.

## Documentação e testes

### FC-DOC-01 — P2 — rastreabilidade teórica é manual e os estados documentais contradizem o runtime

- **Escopo:** transversal / todas as jornadas.
- **Progresso:** criado `docs/capability_manifest.json` com `asOfCommit`, capacidades, fontes teoricas, arquivos de implementacao, specs e primeiros `ruleIds`; `scripts/capability-manifest.spec.ts` valida IDs unicos, caminhos existentes, sincroniza o índice runtime `ruleSourceIndex` com o manifest e cobre `ruleIds` emitidos pelos materiais contextuais, por propostas validadas, por propostas controladas principais, por propostas controladas de serviço (`substituição funcional`, `ritmo/contorno da referência`, `harmony-only`) e por famílias estratégicas/exploratórias amostradas. A UI de materiais contextuais e os cards de proposta do Harmonizar mostram base/fonte teórica no detalhe expandido, sem ocupar o estado compacto. `docs/removed_symbol_registry.json` e `scripts/removed-symbol-registry.spec.ts` impedem documentos ativos de apontarem para símbolos removidos. Ambos foram incluidos no `test:curated`.
- **Esperado:** documento→regra→algoritmo→serviço→estado→UI rastreável.
- **Observado:** quase resolvido. Existe agora um manifest canônico validável para as capacidades principais; materiais contextuais, estratégias validadas, propostas controladas de função aparente/empréstimo modal/cadência plagal menor, propostas de serviço do Harmonizar e famílias estratégicas/exploratórias amostradas carregam `ruleIds` rastreáveis. Materiais contextuais e cards de proposta já conseguem resolver `ruleIds` para capacidade e fontes teóricas na UI. Documentos ativos também passam por registro de símbolos removidos. Documentos históricos ainda podem contradizer o estado atual.
- **Evidência:**
  - `estado_teorico_harmonizacao.md` diz que voice leading/modal/SubV ainda são futuros, embora existam.
  - `quadro_teorico_sistema_harmonizacao.md` marca distância/região como ausentes e depois registra implementação.
  - `analise_ebooks_erica_masson.md` marca SubV simultaneamente implementado e não implementado.
  - documentos históricos permanecem narrativos; documentos ativos passam por registro de integridade documental.
- **Impacto:** músico — não consegue auditar por que recebeu uma sugestão; produto — status funcional depende da seção do documento consultada.
- **Causa provável:** documentação evolutiva usada também como status vigente, sem manifest canônico.
- **Correção recomendada:** manter o registro de símbolos removidos atualizado conforme refactors e separar documentos históricos de documentos de status vigente.
- **Testes necessários:** integridade regra→fonte já ligada aos materiais/propostas principais, propostas controladas de serviço, famílias estratégicas/exploratórias amostradas e detalhe dos cards de proposta; falta apenas uma suíte React/E2E para validar visualmente a presença das fontes renderizadas.
- **Confiança:** alta.

### FC-TST-01 — P2 — cobertura extensa em funções, mas fraca nas jornadas e no deploy

- **Escopo:** transversal.
- **Progresso:** o workflow de deploy já executa `npm run lint` e `npm run test:curated`, além do build. A suíte curada agora inclui todos os `scripts/*.spec.ts` e `suite-boundary.spec.ts` falha quando uma nova spec fica fora da configuração. `react-screen-smoke.spec.ts` renderiza SuiteShell, Writer e Harmonizer via `react-dom/server`, garantindo uma primeira cobertura React sem depender de browser/screenshot. `apply-proposal-to-writer.spec.ts` cobre o handoff até o estado tocável do Writer e o rótulo de compasso/beat usado na faixa aplicada. `transport-layer-fault-injection.spec.ts` usa WebSocket/fetch falsos para cobrir ACK aceito, ACK rejeitado, timeout e retry por `commandId`. `musescore-bridge-ephemeral.spec.ts` sobe a bridge real em porta efêmera quando o ambiente permite socket local e valida `health`, sessão dashboard, sessão plugin, status, o ciclo dashboard -> plugin simulado -> ACK e a propagação do ACK ao dashboard por WebSocket. Ainda faltam E2E e QML real/simulado.
- **Esperado:** lint/build/test e integrações críticas executadas no CI.
- **Observado:** existem specs em `scripts/*.spec.ts` e todas estão cobertas pelo `test:curated`, sem duplicatas. Há smoke React server-side do SuiteShell e das jornadas Writer/Harmonizer, fault injection unitária do transporte WebSocket e teste oportunista da bridge real em porta efêmera com plugin HTTP simulado e dashboard WebSocket; em sandbox sem permissão de socket local, a spec registra a indisponibilidade do ambiente sem mascarar outros erros. Ainda não há E2E do Harmonizer ou QML.
- **Evidência:** [vitest.curated.config.ts](</Volumes/Documents/Development/Find Chord/vitest.curated.config.ts:3>), [real-music-audit-report.spec.ts](</Volumes/Documents/Development/Find Chord/scripts/real-music-audit-report.spec.ts:9>) e [deploy.yml](</Volumes/Documents/Development/Find Chord/.github/workflows/deploy.yml:37>).
- **Reprodução original:** teste explicitamente solicitado com a configuração curada era ignorado se não estivesse no include. Uma execução curada sob carga excedeu o timeout fixo; isolada e repetida passou.
- **Impacto:** músico — regressões de UI/integração podem chegar ao produto; produto — sucesso da suíte não prova as jornadas A–F.
- **Causa provável:** crescimento por specs puras e auditorias estáticas, sem pirâmide de integração. A lacuna de inclusão manual da suíte curada foi fechada por guardrail.
- **Correção recomendada:** E2E com fluxo Harmonizer/Writer e expansão gradual da cobertura React além do smoke inicial; QML real/simulado continua como camada posterior.
- **Testes necessários:** as próprias jornadas A–F, incluindo offline, atraso, retry, estado tardio e interação real entre abas.
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
