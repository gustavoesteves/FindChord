# Auditoria concluída

A árvore original permaneceu intacta e limpa: `main...origin/main`, sem diferenças staged ou unstaged. Build, lint, testes e análises que poderiam escrever artefatos foram executados numa cópia descartável em `/tmp`.

Resultado: **0 P0, 9 P1, 12 P2 e 3 P3 confirmados**. Questões apenas estéticas foram excluídas.

## Escopo e arquitetura observada

Foram examinados 164 arquivos TypeScript/TSX, aproximadamente 24 mil linhas, os scripts Node, o plugin QML, workflows, configuração e 122 specs.

Pontos de entrada e fluxos principais:

- Web: `index.html` → `src/main.tsx` → `App` → `SuiteShell`.
- Writer: fretboard → `useChordStore` → detecção → `WriterContext` → voicings/UI.
- Harmonizer: snapshot → store de sessão → seção → anchors → análise/frase → estratégias → ranking/propostas.
- MuseScore, ida: Writer → `musescoreAdapter` → WebSocket → bridge Node → fila HTTP → QML.
- MuseScore, volta: QML exporta MusicXML → `/api/v1/score` → parser → `SCORE_SNAPSHOT`.
- Aplicação: proposta → flatten → `progressionChords` → navegação ao Writer.

## Validações executadas

| Verificação | Resultado |
|---|---|
| `npm run lint` | Passou |
| `npm run build` (`tsc -b` + Vite) | Passou |
| TypeScript sem emissão | Passou para app e config Node |
| Bundle | JS 593,39 kB minificado / 169,62 kB gzip; aviso acima de 500 kB |
| `npm run test:curated` | Falhou duas vezes: 624 passaram, 6 ignorados, 1 timeout |
| Teste problemático isolado | Passou em cerca de 12 s |
| 5 suítes focadas | 36/36 passaram |
| `npm audit --omit=dev` online | 0 vulnerabilidades de produção |
| `npm audit` completo online | 1 dependência direta vulnerável: Vite 8.0.14 |
| Estado Git final | Limpo; nenhum arquivo modificado |

# Fatos confirmados — P1

## P1-1 — Execução arbitrária de JavaScript no plugin MuseScore

**Arquivos/símbolos:** [musescore-bridge.cjs](</Volumes/Documents/Development/Find Chord/scripts/musescore-bridge.cjs:28>), `validateOrigin`, `/api/v1/send`, `handleNewEvent`, `server.listen`; [FindChordBridge.qml](</Volumes/Documents/Development/Find Chord/plugins/FindChordBridge.qml:163>), `processEvent`.

**Progresso:** o plugin não expõe mais `EVAL`/`eval(`, o bridge escuta explicitamente em `127.0.0.1`, e há tokens efêmeros separados para dashboard e plugin. Regressão coberta em `musescore-insertion-safety.spec.ts`.

**Evidência:** requisições sem `Origin` são aceitas, não existe autenticação e `/send` exige apenas `type` ou `protocolVersion`. Um evento `EVAL` chega à fila e o QML executa `eval(payload.code)`. O servidor escuta em `*:9000`, não apenas loopback.

**Cenário:** com bridge e plugin ativos, um cliente local ou da LAN envia `{"type":"EVAL","code":"..."}` sem `Origin`.

**Impacto:** execução arbitrária no contexto JS/QML do plugin, incluindo acesso e alteração da partitura e recursos expostos pelo MuseScore.

**Correção:** remover `EVAL`; bind explícito em `127.0.0.1`; token efêmero obrigatório; schema e allowlist; papéis separados para dashboard e plugin.

**Confiança:** muito alta.

## P1-2 — Bypass de Origin no WebSocket permite injeção e exposição de snapshots

**Arquivos/símbolos:** [musescore-bridge.cjs](</Volumes/Documents/Development/Find Chord/scripts/musescore-bridge.cjs:333>), handler WebSocket; [TransportLayer.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/bridge/TransportLayer.ts:57>), `onmessage`; [musescoreAdapter.ts](</Volumes/Documents/Development/Find Chord/src/utils/musescoreAdapter.ts:39>), `isScoreSessionPayload`.

**Progresso:** rotas WebSocket passaram a validar pathname exato (`/plugin` e `/dashboard`) e mensagens recebidas passam por schema/runtime guard. O pareamento por sessão/token reduz o risco de cliente não autorizado. Ainda falta teste comportamental HTTP/WS em porta efêmera.

**Evidência:** qualquer Origin é aceito quando a URL contém `/plugin`; o teste usa `includes`, não pathname exato. Todo JSON recebido é retransmitido a todos os clientes. O frontend só verifica `protocolVersion` truthy, `SESSION` e `payload.type`.

**Cenário:** um cliente conecta em `/plugin`, recebe sincronizações legítimas ou injeta `SESSION/SCORE_SNAPSHOT` forjado.

**Impacto:** exposição de título, compositor, notas e cifras; corrupção do estado do Harmonizer; possível DoS por payload grande.

**Correção:** autenticação por sessão, autorização por papel/direção, pathname exato, canais separados, schemas runtime e `maxPayload` reduzido.

**Confiança:** alta; políticas de navegador podem restringir alguns cenários, mas clientes locais/LAN não-browser continuam exploráveis.

## P1-3 — `/score` aceita leitura arbitrária de caminho e arquivo sem limite

**Arquivo/símbolo:** [musescore-bridge.cjs](</Volumes/Documents/Development/Find Chord/scripts/musescore-bridge.cjs:176>), rota `/api/v1/score`, ação `PARSE_XML`.

**Progresso:** a sincronização passou a usar caminho temporário controlado pelo bridge, com `realpath`, `stat`, limite de tamanho e rejeição de caminhos fora do local permitido. Regressão coberta em `musescore-insertion-safety.spec.ts`.

**Evidência:** `payload.path` passa diretamente para `existsSync` e `readFileSync`, sem `realpath`, allowlist, `stat`, verificação de arquivo regular ou limite de tamanho. O limite de 512 KiB cobre somente o JSON da requisição.

**Cenário:** cliente não autenticado aponta para um MusicXML local conhecido ou para arquivo/dispositivo muito grande.

**Impacto:** conteúdo musical é transmitido aos clientes WebSocket; leitura síncrona grande pode bloquear ou derrubar o único event loop.

**Correção:** receber bytes limitados em vez de paths; alternativamente restringir a diretório temporário conhecido após `realpath`/`stat`, usar leitura assíncrona e impor limite.

**Confiança:** muito alta.

## P1-4 — Fila pode aplicar mutações antigas na partitura errada ou perdê-las

**Arquivos/símbolos:** [TransportLayer.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/bridge/TransportLayer.ts:105>), `send`; [musescoreAdapter.ts](</Volumes/Documents/Development/Find Chord/src/utils/musescoreAdapter.ts:79>), `sendChord`; [musescore-bridge.cjs](</Volumes/Documents/Development/Find Chord/scripts/musescore-bridge.cjs:78>), `/consume`; [FindChordBridge.qml](</Volumes/Documents/Development/Find Chord/plugins/FindChordBridge.qml:127>), polling/inserção.

**Progresso:** mutações passaram a carregar `commandId`, `expiresAt` e ACK do plugin; o transporte aguarda `sendWithAck`, e o protocolo remove actions não suportadas (`REPLACE/DELETE`). Ainda falta validação real dentro do MuseScore.

**Evidência:** `sendChord` retorna sucesso assim que `WebSocket.send` aceita os bytes. A fila é global, não possui sessão, score ID, TTL, idempotência ou ACK. `/consume` limpa antes do processamento; acima de 50 itens, o mais antigo é descartado. Erros QML são engolidos.

**Cenário:** enviar acorde com o plugin fechado e depois abrir outro score; duas instâncias do plugin; falha após `/consume`; rajada acima de 50 comandos.

**Impacto:** alteração tardia do documento errado ou perda silenciosa, enquanto a UI informa sucesso/MuseScore conectado.

**Correção:** heartbeat do plugin, sessão e score ID, command ID/TTL, fila por sessão, ACK/NACK depois de `endCmd`, retry idempotente e erro visível.

**Confiança:** muito alta.

## P1-5 — Sincronização é não portável, concorrente e aparenta sucesso

**Arquivos/símbolos:** [FindChordBridge.qml](</Volumes/Documents/Development/Find Chord/plugins/FindChordBridge.qml:197>), `extractScoreSnapshot`; [useScoreSync.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useScoreSync.ts:19>); [musescoreAdapter.ts](</Volumes/Documents/Development/Find Chord/src/utils/musescoreAdapter.ts:106>).

**Progresso:** o caminho fixo em `dist/findchord_sync.musicxml` foi removido; o bridge fornece `scoreUploadPath` temporário. A sincronização usa `requestId`, ignora respostas antigas e não encerra spinner por timeout fixo. Regressão coberta em `musescore-insertion-safety.spec.ts`.

**Evidência:** o plugin grava exclusivamente em `/Volumes/Documents/Development/Find Chord/dist/findchord_sync.musicxml`. `dist` é ignorado e `npm run dev` não o cria. A UI ignora o retorno booleano e encerra o spinner após 800 ms. O QML reutiliza o mesmo arquivo e libera a flag antes da resposta HTTP.

**Cenário:** clone em outro caminho/SO, clone sem build anterior, plugin fechado, parse lento ou duas sincronizações próximas.

**Impacto:** o fluxo principal não funciona fora da máquina/caminho do autor; respostas fora de ordem podem substituir score novo por snapshot antigo.

**Correção:** upload direto ou arquivo temporário por requisição; request ID/revision; estados `requested/received/failed/timeout`; rejeitar respostas antigas.

**Confiança:** muito alta.

## P1-6 — A ingestão descarta os ticks necessários aos motores temporais

**Arquivos/símbolos:** [harmonizerService.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/services/harmonizerService.ts:327>), `selectMelodicAnchors`; [HarmonicRegionResolver.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/HarmonicRegionResolver.ts:16>); [TemporalSlotAllocator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/TemporalSlotAllocator.ts:24>).

**Progresso:** anchors agora preservam `startTick/endTick`; seleção estrutural usa a frase inteira; `measureTicks` é consumido por seleção de anchors e por geração temporal quando a métrica/resolução são compatíveis. Regressões cobertas em `temporal-melody-window.spec.ts`, `score-timeline-context.spec.ts` e auditorias F359.

**Evidência:** `ScoreNoteEvent.tickStart/tickEnd` existem, mas o mapper cria anchors apenas com compasso, pitch e duração. Os consumidores usam zero, `anchors.length * 1920` ou non-null assertions sobre os ticks ausentes.

**Reprodução:** notas reais do compasso 5 produziram regiões nos compassos 1–2, durações `NaN` e seleção de todas as notas do compasso. Em 32 notas/8 compassos, propostas saíram em `[1,9,17,25]` e slots serializaram `duration:null`.

**Impacto:** regiões, compatibilidade melódica e propostas podem ser atribuídas a compassos inexistentes ou às notas erradas.

**Correção:** preservar `startTick/endTick`, torná-los obrigatórios após ingestão e validar finitude/ordem antes de gerar.

**Confiança:** muito alta.

## P1-7 — “Usar harmonia/trecho” não aplica uma progressão ao Writer

**Arquivos/símbolos:** [useApplyProposalToWriter.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useApplyProposalToWriter.ts:5>), [useChordStore.ts](</Volumes/Documents/Development/Find Chord/src/store/useChordStore.ts:61>), `progressionChords`/`setProgressionChords`.

**Evidência:** a proposta perde `measureIndex`, vira `string[]`, é gravada e a aplicação navega. Nenhuma tela carrega, exibe ou percorre essa progressão. O único leitor tenta ajustar enarmonia durante um recálculo futuro; o setter não recalcula. Esse leitor ainda usa `startsWith(root)`, fazendo C encontrar C# antes de C.

**Cenário:** clicar “Usar harmonia” ou “Usar trecho”.

**Impacto:** o Writer permanece vazio ou com o acorde anterior; só sobra contexto oculto e potencialmente obsoleto.

**Correção:** sessão de progressão explícita, preservando compasso/ordem/score; seleção e renderização atômica do primeiro item ou timeline navegável.

**Confiança:** muito alta.

## P1-8 — A versão publicada no GitHub Pages não consegue conectar ao bridge

**Arquivos:** [deploy.yml](</Volumes/Documents/Development/Find Chord/.github/workflows/deploy.yml:37>), [musescoreAdapter.ts](</Volumes/Documents/Development/Find Chord/src/utils/musescoreAdapter.ts:45>), [musescore-bridge.cjs](</Volumes/Documents/Development/Find Chord/scripts/musescore-bridge.cjs:336>).

**Evidência:** o workflow publica o site; o frontend usa `ws://localhost:9000/dashboard`; o bridge só aceita Origins `http(s)://localhost|127.0.0.1:5173|5174`. O Origin do GitHub Pages é necessariamente rejeitado.

**Cenário:** abrir a aplicação publicada e tentar usar MuseScore.

**Impacto:** a integração principal fica permanentemente desconectada em produção.

**Correção:** definir uma arquitetura de pareamento local autenticado compatível com página HTTPS/PNA, usando WSS/loopback seguro e allowlist configurada; ou servir a UI junto do bridge local.

**Confiança:** muito alta para a rejeição por Origin.

## P1-9 — O gerador experimental ignora modo menor

**Arquivos/símbolos:** [MelodicInterpretationEngine.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/MelodicInterpretationEngine.ts:7>), [ChordRealizationEngine.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/ChordRealizationEngine.ts:91>), [HarmonicStrategyValidator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/HarmonicStrategyValidator.ts:47>).

**Progresso:** realizações experimentais em centro menor agora passam por um gate de compatibilidade modal que rejeita abertura/fechamento em tônica maior/maj6/maj7 quando o centro menor veio da melodia. Centros corrigidos pela harmonia de referência não são bloqueados por esse guardrail. Estratégias menores validadas continuam ativas, e ideias experimentais úteis que não contradizem a tônica menor não são bloqueadas. Regressão coberta em `minor-modal-boundary.spec.ts`.

**Evidência:** o vocabulário é construído em Dó maior e apenas transposto; `selectedCenter.mode` não participa do candidato nem da validação.

**Reprodução:** C–Eb–G–C em Cm produziu `Cmaj7, Cm7/F, G7, Cdim7`; a proposta contrapontística também terminou em `Cmaj7`.

**Impacto:** propostas incompatíveis com a tonalidade declarada podem ser as únicas opções apresentadas.

**Correção:** tornar modo obrigatório em interpretação, candidatos, paletas e validação; até isso existir, suprimir essa rota em modos não suportados.

**Confiança:** muito alta.

# Fatos confirmados — P2

## P2-1 — O parser achata tempo, métrica e mudanças tonais

**Arquivos:** [musicxml-parser.cjs](</Volumes/Documents/Development/Find Chord/scripts/musicxml-parser.cjs:97>), [ScoreSnapshot.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/models/ScoreSnapshot.ts:40>), [HarmonicRegionResolver.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/HarmonicRegionResolver.ts:19>).

**Progresso:** F358 preservou `keyTimeline` e `timeTimeline` no snapshot. F359 iniciou o consumo dessas timelines pelo Harmonizar, por auditorias/calibrações reais, por chamadas diretas de `PhraseAnalysisEngine` com snapshot e por parte da geração temporal via `measureTicks` conservador. Ainda falta remover fallbacks 4/4 onde o motor não recebe `divisions/PPQ` explícito.

**Evidência:** após `<backup>`, o parser guarda apenas o cursor final, não o maior cursor alcançado. Fixture válida com voz 1 até tick 1920, backup e voz 2 até 480 fez o compasso seguinte começar em 480. Só a primeira armadura é preservada; fórmula de compasso/modo não entram no snapshot; vários motores fixam 1920 ticks por compasso.

**Corpus/reprodução:** `after you.musicxml` modula nos compassos 15 e 23, mas retorna apenas a tonalidade inicial. Quatro compassos 3/4 foram mapeados como apenas três.

**Impacto:** notas, harmonias, regiões e tonalidade ficam erradas em multivozes, métricas diferentes de 4/4 ou modulações.

**Correção:** mapa canônico de medidas e timeline de `key/time`; rastrear o máximo cursor por compasso; resolver compasso pelo mapa, não por divisão fixa.

**Confiança:** muito alta.

## P2-2 — Todas as vozes/staves viram “melodia” e acidentes duplos são perdidos

**Arquivos:** [musicxml-parser.cjs](</Volumes/Documents/Development/Find Chord/scripts/musicxml-parser.cjs:150>), [harmonizerService.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/services/harmonizerService.ts:334>).

**Progresso:** `selectMelodicAnchors` seleciona linha melódica primária por staff/voz em vez de misturar tudo, e `spellScoreNotePitch` preserva alterações múltiplas como `Bbb`. Regressão coberta em `temporal-melody-window.spec.ts`.

**Evidência:** o parser preserva `voice`, `staff` e `alter`, mas `selectMelodicAnchors` mistura todos os eventos e só converte `alter` igual a `1` ou `-1`.

**Cenário real:** `african flower.musicxml` contém 119 notas da voz 1, 46 da voz 2 e `alter=-2`; Bbb se torna B natural.

**Impacto:** acompanhamento/contracanto contamina centro e cadência; acidentes duplos mudam o pitch em dois semitons.

**Correção:** escolha explícita e determinística de parte/staff/voz e conversão geral de alterações, preservando spelling.

**Confiança:** muito alta.

## P2-3 — O limite de 32 notas cria um falso final de frase com confiança máxima

**Arquivos:** [harmonizerService.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/services/harmonizerService.ts:344>), [PhraseAnalysisEngine.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/engines/PhraseAnalysisEngine.ts:81>).

**Progresso:** a seleção estrutural passou a amostrar a seção inteira e preservar a cadência final; a confiança cadencial usa duração em ticks sem saturar notas curtas. Regressões cobertas em `temporal-melody-window.spec.ts`.

**Evidência:** as primeiras 32 notas são cortadas antes de seleção estrutural. `duration`, documentada e alimentada em ticks, é multiplicada como se estivesse em beats; poucos ticks já saturam a confiança em `0.9`.

**Reprodução:** em 33 notas, a 32ª era G/120 ticks e a última C/1920; o alvo cadencial escolhido foi G, confiança `0.9`.

**Impacto:** centro, tipo de cadência, ii–V locais e ranking seguem uma nota intermediária.

**Correção:** amostragem estrutural sobre toda a seção, preservando limites; normalizar duração pelo PPQ/métrica.

**Confiança:** muito alta.

## P2-4 — Uma substituição controlada altera todas as ocorrências iguais

**Arquivos:** [ControlledSubstitutionProposals.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/ControlledSubstitutionProposals.ts:30>), [harmonizerService.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/services/harmonizerService.ts:683>).

**Progresso:** propostas controladas carregam `targetTickStart` e a aplicação exige `measure + chord + tick`, evitando trocar ocorrências idênticas no mesmo compasso. Regressão coberta em `controlled-substitution-proposals.spec.ts`.

**Evidência:** o alvo é identificado apenas por `measureIndex + chordSymbol`, e a aplicação usa o mesmo predicado.

**Reprodução:** dois `Fmaj7` no compasso 2 foram ambos trocados por `F#m7(b5)` por uma única proposta.

**Impacto:** mais eventos são alterados do que explicado/validado; notas de outro instante são usadas na validação.

**Correção:** ID/tick/índice do evento e anchors temporalmente sobrepostos.

**Confiança:** muito alta.

## P2-5 — Regras duplicadas tratam `6/9` como inversão

**Arquivos:** [ChordSymbolResolver.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/theory/ChordSymbolResolver.ts:133>), [chordParser.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/theory/chordParser.ts:60>), [HarmonicStrategyValidator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/strategies/HarmonicStrategyValidator.ts:165>).

**Progresso:** parser legado e helpers funcionais preservam `6/9` como qualidade, sem criar baixo falso. Regressão coberta em `chord-parser-slash-quality.spec.ts`.

**Evidência:** o resolver canônico entende `C6/9`; parsers e validadores paralelos usam `split("/")`.

**Reprodução:** resolver → qualidade `6_9`, notas C–E–G–A–D; parser legado → `major6th`, sem D. `C6` gerou substituição Am, mas `C6/9` gerou zero. `D6/9 → G6` recebeu direção oposta a `D6 → G6`.

**Impacto:** propostas válidas são suprimidas e subsistemas discordam sobre baixo, qualidade e notas.

**Correção:** `resolveChordSymbol` como única fronteira; helpers canônicos de root/body/bass; remover `split("/")`.

**Confiança:** muito alta.

## P2-6 — Contrato TypeScript diverge do protocolo executado

**Arquivos:** [Protocol.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/bridge/Protocol.ts:1>), [TransportLayer.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/bridge/TransportLayer.ts:57>), [FindChordBridge.qml](</Volumes/Documents/Development/Find Chord/plugins/FindChordBridge.qml:163>).

**Progresso:** o protocolo agora rejeita versões/tipos não suportados, restringe mutations a `INSERT_CHORD`, remove `REPLACE/DELETE` não implementados e inclui ACK. Regressão coberta em `musescore-insertion-safety.spec.ts`.

**Evidência:** TS declara apenas versão `1.0`, `SESSION/MUTATION` e `INSERT/REPLACE/DELETE`; o servidor também gera `RENDER`; a recepção aceita qualquer versão truthy. QML trata toda `MUTATION` como inserção e ignora `action` e `targetTick`.

**Cenário:** caller usa a action tipada `DELETE_CHORD` ou `REPLACE_CHORD`.

**Impacto:** em vez de deletar/substituir, o plugin tenta inserir na seleção atual; mensagens incompatíveis atravessam a validação.

**Correção:** união discriminada compartilhada, schema runtime e negociação de versão; implementar ou remover actions não suportadas.

**Confiança:** muito alta.

## P2-7 — Cache de voicings ignora baixo, raiz e qualidade

**Arquivos:** [voicingGenerator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/generation/voicingGenerator.ts:61>), `generateVoicings`; [WriterContext.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/context/WriterContext.tsx:121>).

**Progresso:** a chave de cache inclui cifra, raiz, qualidade ativa, baixo físico, pitch classes, afinação e pitch classes obrigatórias; o Writer passa `bassPC` a partir de `activeChord.bass`. Regressão coberta em `writer-voicing-inversion.spec.ts`.

**Evidência:** `bassPC`, `chordRoot` e `activeQuality` afetam filtragem/pontuação, mas não entram na cache key. O chamador atual sempre passa `bassPC=null`, mesmo quando `activeChord.bass` existe.

**Reprodução:** consulta Cmaj sem baixo seguida de Cmaj/E retornou a mesma referência; 57/60 shapes tinham baixo incorreto. Após limpar cache e consultar Cmaj/E diretamente, 0/60 estavam errados.

**Impacto:** inversões e ordenação podem pertencer a outro contexto; a UI atual não preserva slash bass nos voicings alternativos.

**Correção:** chave canônica com todos os parâmetros; passar o baixo físico; congelar/copiar valores cacheados; testar chamadas conflitantes sequenciais.

**Confiança:** muito alta.

## P2-8 — Seleção de seção se perde e provoca análise transitória do score inteiro

**Arquivos:** [useActiveSection.ts](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/hooks/useActiveSection.ts:4>), [musicxml-parser.cjs](</Volumes/Documents/Development/Find Chord/scripts/musicxml-parser.cjs:108>), [useScoreSessionStore.ts](</Volumes/Documents/Development/Find Chord/src/store/useScoreSessionStore.ts:119>).

**Progresso:** seção efetiva é calculada sincronicamente por `effectiveSectionId`, evitando render transitório sem seção válida. IDs de seção sincronizados são determinísticos o bastante para preservar `sec_b` entre resyncs. Regressão coberta em `active-section-selection.spec.ts`.

**Evidência:** IDs de seção incluem `Math.random`; toda sincronização os altera. `selectedSectionId` começa/invalida como `null` e só é corrigido em `useEffect`; nesse render a pipeline recebe todas as notas/harmonias.

**Cenário:** usuário está na seção B e sincroniza novamente.

**Impacto:** ocorre análise cara e semanticamente errada do score inteiro; em seguida a seleção cai silenciosamente para A.

**Correção:** IDs determinísticos, preservação por chave semântica e cálculo síncrono de uma seção efetiva; suspender geração durante troca de snapshot.

**Confiança:** muito alta.

## P2-9 — “Ver mais” não pode voltar a “Ver menos”

**Arquivo:** [HarmonizerProposalList.tsx](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/components/HarmonizerProposalList.tsx:171>).

**Progresso:** o toggle agora depende do overflow colapsado total (`collapsedHiddenCount > 0`), separado da contagem atualmente escondida; portanto continua visível em modo expandido e mostra “Ver menos”. Regressão coberta em `harmonizer-proposal-list-curation.spec.ts`.

**Evidência:** quando `isExpanded=true`, `hiddenCount` é forçado a zero; o botão só é renderizado quando `hiddenCount > 0`. Portanto desaparece após expandir e o texto “Ver menos” é inalcançável.

**Impacto:** lista longa não pode ser recolhida sem recarregar/trocar estado.

**Correção:** decidir a existência do toggle pelo overflow total, separadamente da contagem atualmente escondida; teste DOM da interação expandir/recolher.

**Confiança:** muito alta.

## P2-10 — Busca de voicings bloqueia o main thread

**Arquivos:** [WriterContext.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/context/WriterContext.tsx:115>), [voicingGenerator.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/generation/voicingGenerator.ts:78>).

**Evidência:** busca recursiva, deduplicação, scoring e sort são síncronos; somente depois o resultado é cortado para 60. A chamada ocorre em effect após alterações do acorde/afinação.

**Medição:** aproximadamente 250 ms no caminho de UI de sete cordas e 640 ms numa variante permissiva; seis cordas permissivo, aproximadamente 121 ms.

**Impacto:** congelamento perceptível após cliques, sobretudo em instrumentos de sete cordas.

**Correção:** Web Worker com cancelamento, debounce, branch-and-bound/top-k precoce e deduplicação por `Set`.

**Confiança:** alta; os tempos variam por máquina, o bloqueio síncrono é confirmado.

## P2-11 — O gate de testes falha e as fronteiras críticas não têm cobertura comportamental

**Arquivos:** [real-music-audit-report.spec.ts](</Volumes/Documents/Development/Find Chord/scripts/real-music-audit-report.spec.ts:9>), [vitest.curated.config.ts](</Volumes/Documents/Development/Find Chord/vitest.curated.config.ts:3>), [deploy.yml](</Volumes/Documents/Development/Find Chord/.github/workflows/deploy.yml:37>).

**Progresso:** o workflow agora executa `npm run lint` e `npm run test:curated`; a suíte curada atual passa localmente com 126 arquivos aprovados, 2 ignorados, 662 testes aprovados e 6 ignorados. Ainda falta cobertura comportamental real de HTTP/WS, DOM e execução dentro do MuseScore.

**Evidência:** a suíte completa expirou duas vezes em 20 s; o teste levou 22–23 s, embora isolado passe em 12 s. O CI executa apenas build, não lint/testes. Não há cobertura configurada nem testes DOM; nenhuma spec exerce o servidor bridge. O teste QML verifica strings/ordem, não comportamento. ESLint aplica `rules:{}` ao CJS e ignora QML.

**Impacto:** o gate local é instável e regressões de autenticação, fila, ACK, UI e sincronização podem chegar ao deploy com build verde.

**Correção:** separar auditoria de corpus num job serial; incluir lint/testes no CI; testes HTTP/WS em porta efêmera, integração de ingestão/aplicação e testes DOM; cobertura baseada em risco.

**Confiança:** muito alta.

## P2-12 — Vite bloqueado no lockfile possui advisories atuais

**Arquivos:** [package.json](</Volumes/Documents/Development/Find Chord/package.json:44>), [package-lock.json](</Volumes/Documents/Development/Find Chord/package-lock.json:3662>).

**Progresso:** `vite` foi atualizado para `^8.0.16`, e o lockfile aponta `node_modules/vite` para `8.0.16`.

**Evidência:** está instalado Vite 8.0.14. O audit online reportou uma dependência direta com severidade agregada alta: bypass de `server.fs.deny` e exposição de arquivos em cenários Windows/network, além de vazamento de hash NTLMv2 pelo endpoint de editor. A versão corrigida é 8.0.16. [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff), [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3).

**Cenário:** desenvolvimento no Windows; a segunda falha pode ser acionada contra o Vite local quando o desenvolvedor visita conteúdo malicioso. A primeira requer exposição do dev server à rede.

**Impacto:** possível exposição de arquivo ou credencial do ambiente de desenvolvimento. Dependências de produção tiveram zero advisories no audit atual.

**Correção:** atualizar Vite e lockfile para pelo menos 8.0.16 e manter o dev server em loopback.

**Confiança:** muito alta.

# Fatos confirmados — P3

## P3-1 — Bundle inicial monolítico

**Arquivos:** [SuiteDomainOutlet.tsx](</Volumes/Documents/Development/Find Chord/src/domains/suite/components/SuiteDomainOutlet.tsx:1>), [vite.config.ts](</Volumes/Documents/Development/Find Chord/vite.config.ts:6>).

**Evidência:** Writer e Harmonizer são imports estáticos. O único chunk JS tem 593,39 kB minificado e gera aviso do Vite.

**Impacto:** custo de download/parse do motor Harmonic inteiro mesmo para usuários que abrem somente Writer.

**Correção:** `React.lazy`/imports dinâmicos por domínio, análise de bundle e possível worker/chunk próprio para os motores.

**Confiança:** muito alta.

## P3-2 — Limites entre domínios são bidirecionais

**Arquivos:** [SuiteDomainOutlet.tsx](</Volumes/Documents/Development/Find Chord/src/domains/suite/components/SuiteDomainOutlet.tsx:1>), [WriterTabSurface.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/components/WriterTabSurface.tsx:7>), [HarmonizerScreen.tsx](</Volumes/Documents/Development/Find Chord/src/domains/harmonizer/HarmonizerScreen.tsx:4>), [musescoreAdapter.ts](</Volumes/Documents/Development/Find Chord/src/utils/musescoreAdapter.ts:45>).

**Evidência:** `suite` importa Writer/Harmonizer, enquanto ambos importam layout de `suite`; o header depende diretamente do store do Writer; o adapter de infraestrutura muta diretamente o store de sessão; `FormalSection` é definido dentro da implementação do store.

**Impacto:** features, transporte e composição não podem ser testados ou reutilizados isoladamente; alterações atravessam fronteiras em ambas as direções.

**Correção:** `suite` apenas como composition root; layout/tipos em módulo neutro; porta de aplicação injetada no adapter; modelos fora do store.

**Confiança:** muito alta.

## P3-3 — Duas regras contraditórias definem ergonomia de voicings

**Arquivos:** [VoicingSearchLayer.tsx](</Volumes/Documents/Development/Find Chord/src/domains/writer/components/VoicingSearchLayer.tsx:14>), [voicingScorer.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/scoring/voicingScorer.ts:93>), [voicingClassifier.ts](</Volumes/Documents/Development/Find Chord/src/utils/music/analysis/voicingClassifier.ts:175>).

**Evidência:** a UI penaliza pestana em `-12`; o motor dá bônus `+10`. A UI aceita stretch até 4; o motor até 3. As penalidades por notas pressionadas também divergem.

**Cenário:** alternar entre “Todos” e “Confortáveis”.

**Impacto:** o mesmo shape recebe ordenação e explicação contraditórias; mudanças no motor não chegam ao filtro visível.

**Correção:** uma única política no núcleo, com breakdown carregado no `VoicingShape` e consumido pela UI.

**Confiança:** muito alta na divergência; impacto musical específico depende da preferência de produto.

# Hipóteses e limitações — não promovidas a achado

- Se Vite avançar automaticamente para a porta 5175, o bridge provavelmente rejeitará a UI; não reproduzi a ocupação simultânea de 5173/5174.
- `selectSectionHarmonies` filtra apenas por compasso e provavelmente diverge em seções parciais dentro de um compasso; o snapshot atual não fornece um caso real desse tipo.
- `voicingCache` não possui LRU/limite e pode crescer em sessões longas; não foi medido heap real.
- Políticas de mixed-content e Private Network Access podem acrescentar outro bloqueio ao GitHub Pages; a rejeição explícita de Origin já basta para confirmar o P1.
- Não foi possível executar o plugin dentro do MuseScore nesta auditoria; os achados QML foram confirmados pelo fluxo completo do código, testes focados e semântica direta das APIs.
- `StrategyGuidedHarmonizer.ts` concentra 2.791 linhas e muitas responsabilidades. É risco arquitetural relevante, mas tamanho isolado não foi contado como defeito.

Prioridade recomendada: primeiro fechar o bridge (`EVAL`, autenticação, bind, papéis, ACK/sessão); depois reparar o contrato temporal/MusicXML; em seguida tornar Harmonizer→Writer e modo menor funcionais; por fim estabilizar o gate e adicionar testes comportamentais das fronteiras críticas.
