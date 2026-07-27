# Plano de fechamento da auditoria

Documento criado a partir da leitura consolidada de `docs/auditoria.md` e `docs/auditoria funcional.md`.

## Diagnóstico atual

O risco dominante deixou de ser infraestrutura geral, E2E amplo ou acabamento arquitetural. O risco dominante agora é **musical**: o sistema ainda pode produzir respostas sofisticadas, mas funcionalmente erradas, em alguns contextos de harmonia, ritmo e cadência.

Não há P0 aberto. Os P1 principais já possuem remediação ou guardrail operacional. O fechamento da auditoria depende de tratar P2 musicais concretos e de registrar o envelope suportado da integração MuseScore.

## Prioridade de fechamento

| Prioridade | Item | Estado real |
|---|---|---|
| 1 | MuseScore | Happy path já foi usado na prática, mas restam testes manuais específicos de troca de partitura e renovação de sessão. |
| 2 | `FC-HZ-10` | Estrutura temporal está coberta para overlap, eventos e beat importado; resta calibrar intenção rítmica explícita em estratégias densas sem ataques melódicos suficientes. |
| 3 | `FC-HZ-11` | Centro/cadência e modos declarados têm regressões; resta validar geração modal em repertório real quando houver MusicXML com `<mode>` modal explícito. |
| 4 | `FC-HZ-12` | Dominantes alteradas, notas-guia e histórico curto têm regressões; novas inferências devem seguir conservadoras e orientadas por corpus. |
| 5 | `P2-10` | Busca de voicings pode bloquear em sete cordas/acordes extensos; prioridade depende do uso real. |
| 6 | E2E amplo | Importante para manutenção, mas deve ficar como P3/roadmap, não bloqueador do fechamento. |

## Bloco 1 — `FC-HZ-12`

Objetivo: unificar a noção de dominante funcional e impedir que cifras dominantes alteradas válidas sejam tratadas como cor solta quando há alvo real.

Progresso:

- a matriz inicial de dominantes alteradas com alvo real já foi coberta por regressão;
- `contextualMaterialFunction.ts` passou a usar a mesma lista de qualidades dominantes reconhecidas pelo resolvedor de cifras;
- `7#5` e `9#5` deixaram de cair no fallback de tríade aumentada quando há contexto dominante, preservando terça e sétima como notas-guia;
- os candidatos de materiais agora herdam o próximo acorde como alvo real quando a função contextual é dominante, permitindo resoluções como `B->C` e `F->E` mesmo quando o alvo é `Cmaj7`;
- `guideToneResolutions` deixou de tratar nota comum idêntica como resolução, evitando pseudo-resoluções como `B->B` em dominantes que apontam para C;
- o material de tons inteiros continua disponível para acordes aumentados sem sétima, separando cor aumentada de dominante alterada funcional.
- o histórico curto de preparação agora atravessa diminutos de sensível intermediários: `Em7b5 -> G#dim7 -> A7` preserva alvo D menor e resolve `G->F`, sem transformar `G#dim7 -> A7` solto em D menor fabricado.

Casos cobertos:

- `G7(#5) -> C`
- `G7(#9,b13) -> C`
- `G9(b5) -> C`
- `G9(#5) -> C`
- `G9(#9) -> C`
- `G9(#11) -> C`
- `G13(b9) -> C`
- `G13(#11) -> C`
- `G13(b9,#11) -> C`
- `Em7b5 -> G#dim7 -> A7 -> Dm` implícito

Ponto técnico suspeito:

- `contextualMaterialFunction.ts` possui predicados próprios de dominante.
- `contextualMaterialChordContext.ts` agora preserva a família dominante interna para a matriz alterada coberta; o risco remanescente é manter essa matriz sincronizada com futuras qualidades do resolvedor.
- o histórico contextual ainda é curto e deliberadamente conservador; novas inferências devem continuar exigindo preparação reconhecível para não capturar dominantes soltas.

Estado de fechamento:

- o bloco possui regressões para a matriz crítica, notas-guia, alvo real, dominantes aumentadas/alteradas, dominantes soltas e recuperação conservadora de preparação recente;
- novos avanços aqui devem ser guiados por falhas de corpus, não por expansão especulativa de regras.

Critério de aceite:

- Todo dominante alterado com alvo real deve ser `dominant`.
- As notas-guia devem vir da qualidade dominante real, não de fallback aumentado ou maior.
- Em caso ambíguo, o sistema deve preferir `color`, `modal` ou alvo ambíguo, nunca uma resolução fabricada.

## Bloco 2 — `FC-HZ-10`

Objetivo: fechar a coerência temporal das propostas densas.

Progresso:

- validação melódica estratégica, gate experimental e diagnósticos de compatibilidade agora usam o acorde temporizado com maior overlap quando `events` existem;
- foi adicionada regressão para impedir que uma nota no segundo acorde do compasso seja validada por um acorde anterior apenas porque ambos estão agregados em `measure.chords`;
- comparação proposta-referência já usava overlap temporal; este avanço levou a mesma lógica para a cobertura melódica.
- o comparador ganhou um modo estrito para auditoria temporal densa: quando a referência possui um acorde longo e a proposta possui eventos temporizados internos divergentes, ele pode ponderar cada evento pelo overlap real. Assim `C` por meio compasso + `Db7` por meio compasso contra `C` inteiro não aparece como alinhamento total nesse modo.
- o parser MusicXML agora calcula `beat` de cifras a partir do cursor temporal real e respeita `<offset>` em `<harmony>`, preservando cifra em beat 3 após `<forward>` e beat 2 quando o offset desloca a cifra sem mover a melodia.

Problemas residuais:

- slots temporais do ramo experimental podem ser reconstruídos em vez de preservados diretamente;
- decidir onde ativar o modo estrito de overlap sem prejudicar calibrações musicais em que a divisão interna preserva função aparente;
- parte dos MusicXML ainda cai em fallback métrico;
- cifras importadas ainda podem chegar com beat aproximado quando o MusicXML não traz posição confiável; quando há cursor/offset, o beat real já é preservado.

Estado de fechamento:

- o bloco tem regressões para overlap evento-nota, comparação temporal estrita de auditoria, eventos gerados, aplicação no Writer e beat importado por cursor/offset;
- a pendência real é qualitativa: quando a melodia não oferece ataques suficientes, a estratégia densa ainda precisa declarar intenção rítmica em vez de depender apenas de divisão proporcional.

Critério de aceite:

- comparação proposta-referência deve usar overlap temporal;
- validação melódica deve avaliar nota contra acorde simultâneo;
- eventos gerados por estratégias densas devem preservar `tickStart`, `tickEnd`, `durationTicks` e `beat`;
- incerteza temporal deve ser explícita, não mascarada como alinhamento.

## Bloco 3 — `FC-HZ-11`

Objetivo: melhorar centro/cadência sem voltar a fabricar repousos falsos.

Progresso:

- o bloqueio de cadência plagal em seções planares agora tem uma exceção local: uma plagal final limpa, sem baixo independente nos dois últimos acordes, continua sendo reconhecida;
- referência planar tipo Bright Size Life permanece como chegada aberta, preservando o guardrail contra falso `IV-I`;
- há regressões cobrindo os dois lados: plano estrutural aberto e plagal final real após passagem planar.
- modos MusicXML explícitos como `dorian`, `mixolydian`, `lydian`, `phrygian` e `aeolian` agora preservam a tônica modal e o `declaredMode`, mantendo `major/minor` apenas como modo operacional para os motores funcionais existentes.
- a estratégia `Centro modal` passou a consumir `declaredMode`: dórico gera `i-IV-bVII`, mixolídio gera `I-bVII-v`, lídio gera `I-II-V`, frígio gera `i-bII-bVIIm` e eólio gera `i-bVI-bVII`, enquanto o modo operacional continua maior/menor para os validadores funcionais.

Problemas residuais:

- validar a geração modal dedicada contra casos reais de repertório sem transformar toda cor modal em cadência funcional.

Estado de fechamento:

- o bloco possui regressões locais para plagal planar versus plagal final, cadências não autênticas, centro declarado, modos explícitos e geração modal por `declaredMode`;
- o catálogo atual não contém `<mode>` modal explícito em MusicXML real; a validação de repertório fica condicionada à entrada de arquivo real com esse dado.

Critério de aceite:

- criar evidência local para distinguir cadência de baixo estrutural/planar;
- quando a evidência for insuficiente, manter `OPEN`;
- preservar modos explícitos do MusicXML como informação modal, mesmo que a geração funcional ainda use major/minor quando necessário.

## MuseScore

Não abrir uma frente arquitetural grande agora. O objetivo é registrar o envelope suportado e validar dois casos operacionais.

Progresso:

- envelope operacional documentado em `docs/musescore_integration_envelope.md`;
- limitações declaradas: uma instância, uma partitura ativa/sincronizada, ressincronizar ao trocar partitura, inserção de cifra sem diagrama de fretboard;
- cobertura automatizada existente registrada como suporte, separada dos dois testes manuais que dependem do runtime real.

Testes manuais mínimos:

1. Sincronizar partitura A, ativar partitura B sem ressincronizar e tentar inserir acorde.
2. Reiniciar a bridge mantendo o plugin aberto e observar se o plugin renova sessão após rejeição/token antigo.

Envelope suportado a documentar:

- uma instância do MuseScore;
- uma partitura ativa por vez;
- ressincronizar após trocar de partitura;
- inserção de cifra, não de diagrama de fretboard.

Se o plugin não for inserir diagrama de fretboard, isso deve virar limitação declarada, não bug aberto.

## Busca de voicings

Manter como risco técnico condicionado ao uso real.

Medições registradas:

- C maior, seis cordas: cerca de 20 ms;
- Cmaj13, seis cordas: cerca de 210 ms;
- C6, sete cordas: cerca de 264 ms;
- C13, sete cordas: cerca de 406 ms;
- Cmaj13, sete cordas: cerca de 1,17 s.

Antes de Worker, tentar:

- poda/branch-and-bound;
- orçamento explícito de busca;
- limite de qualidade mínima por família de shape.

Progresso aplicado:

- poda conservadora no gerador: ramos são abandonados quando não conseguem mais alcançar três cordas ativas ou cobrir as pitch classes obrigatórias restantes;
- a poda considera cordas soltas como cordas ativas, evitando perder aberturas reais de violão/guitarra;
- testes focados do Writer continuam cobrindo inversões, aplicação de proposta, filtros de shape e leitura do acorde.

## E2E

Rebaixar para P3/roadmap por enquanto.

Já existe cobertura suficiente para fechar a auditoria funcional principal:

- bridge real em porta efêmera;
- fault injection de ACK, timeout e retry;
- handoff Harmonizer -> Writer;
- smoke React;
- uso manual real.

Um checklist manual curto depois de alterações nas fronteiras oferece melhor retorno agora do que montar uma suíte Playwright/Cypress ampla.

## Definição de auditoria fechada

A auditoria pode ser considerada fechada quando:

1. os P2 musicais concretos de `FC-HZ-12`, `FC-HZ-10` e `FC-HZ-11` tiverem regressões;
2. incerteza musical resultar em `OPEN`, `color`, `modal` ou "alvo ambíguo", nunca em certeza fabricada;
3. os dois testes manuais MuseScore forem registrados;
4. o envelope suportado do plugin estiver explícito;
5. `docs/auditoria.md` e `docs/auditoria funcional.md` forem consolidados para não contradizer remediações já implementadas.

## Próxima sequência recomendada

1. Executar e registrar os dois testes manuais MuseScore: troca de partitura sem ressincronizar e renovação de sessão após reiniciar a bridge.
2. Calibrar intenção rítmica explícita para estratégias densas quando não houver ataques melódicos suficientes.
3. Validar geração modal declarada em repertório real assim que houver MusicXML com `<mode>` modal explícito.
4. Tratar novas falhas de `FC-HZ-12` apenas a partir de corpus ou caso musical concreto, mantendo o gate conservador contra dominantes soltas.
5. Declarar E2E amplo e Worker/cancelamento de voicings como roadmap se não forem necessários para o uso real imediato.
