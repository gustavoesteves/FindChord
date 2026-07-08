# F38 — Prova de fogo com musicas reais

## Objetivo

A F38 cria uma auditoria executavel sobre todas as partituras reais em `docs/musics`.

A intencao nao e exigir que cada resultado seja a harmonizacao final ideal. A prova de fogo aqui e mais estrutural: o sistema precisa ler repertorio real, escolher uma janela melodica concreta, gerar propostas harmonicas, ranquear por conducao de vozes e preparar apresentacao sem quebrar os contratos musicais que acumulamos nas fases anteriores.

## Arquivo implementado

- `scripts/real-music-fire-audit.spec.ts`

O spec percorre:

- `Bright Size Life.musicxml`
- `Esse caminhar.musicxml`
- `asa branca.musicxml`
- `autum leaves.musicxml`
- `depois de muito discutir.musicxml`
- `exemplo.musicxml`
- `palhaço.musicxml`
- `teste2.musicxml`

## Pipeline auditado

Para cada MusicXML, o teste executa:

1. ingestao pelo parser MusicXML;
2. selecao das primeiras medidas que contem material melodico;
3. conversao das notas em ancoras melodicas;
4. analise de frase e centro tonal/modal;
5. geracao por `GravityFieldManager.generateProposalsWithDiagnostics`;
6. ranking por `rankReharmonizationProposalsByVoiceLeading`;
7. atribuicao de papel de apresentacao por `annotateProposalPresentationRoles`.

## Contratos protegidos

A F38 valida que:

- cada arquivo real continua visivel para a suite curada;
- cada partitura tem compassos e algum material musical importado;
- a janela melodica escolhida contem ancoras;
- o motor gera pelo menos uma proposta;
- sempre existe uma proposta primaria;
- cada proposta apresentada tem nome, id, compassos, cifras, baixo, perfil de rota, custo de rota, perfil de baixo e nota de conducao de vozes;
- diagnosticos de geracao e diagnosticos locais seguem o contrato `HarmonicDiagnostic`.

## O que esta fase ainda nao tenta provar

A F38 nao compara as propostas com uma versao autoral nem tenta julgar se a harmonizacao e a melhor possivel para cada obra. Isso seria uma etapa posterior, mais estetica e musicologica.

Ela tambem nao fixa expectativas especificas de acorde por compasso, porque esse tipo de expectativa deve ficar nos specs diagnosticos de repertorio individual, como Asa Branca, Palhaco, Autumn Leaves e Bright Size Life.

## Proximo passo natural

Com a F38 em pe, o proximo refinamento pode ser mais musical:

- criar relatorios de auditoria por obra com a proposta primaria, perfil de baixo e diagnosticos;
- selecionar janelas A/B por secao, nao apenas as primeiras medidas melodicas;
- comparar proposta primaria com harmonia de referencia quando o MusicXML trouxer cifras;
- separar falhas de ingestao, falhas de gramatica harmonica e falhas de apresentacao;
- transformar divergencias recorrentes em novas fases pequenas.

Essa fase marca uma mudanca importante: alem de melhorar exemplos isolados, o sistema passa a carregar uma bateria minima de repertorio real como criterio de estabilidade.
