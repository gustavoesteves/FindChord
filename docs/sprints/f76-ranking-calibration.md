# F76 - Calibragem de ranking de propostas

## Objetivo

Atacar o bloco `Muitas propostas` da F71: `Donna Lee`, `Firm roots` e `Ask me now`.

Depois da F72/F75, a base ja conseguia gerar respostas musicalmente estaveis. O problema aqui era outro: quando muitas alternativas eram plausiveis, a primaria precisava ser a mais clara para a janela inteira, nao apenas a que tinha melhor conducao interna.

## Achado

Algumas propostas antigas dos campos gravitacionais vinham comprimidas em poucos compassos, especialmente no compasso 1. Como a conducao de vozes era calculada apenas entre os acordes da proposta, essas respostas podiam vencer mesmo sem cobrir temporalmente a frase de 8 compassos.

Tambem apareceu um segundo caso: uma rota cromatica parcialmente alinhada podia vencer uma rota basica conservadora mesmo sem confirmacao forte da referencia.

## Mudancas

- O ranking agora calcula `temporalCoverageRatio`.
- Propostas que cobrem menos da metade dos compassos da frase recebem `temporalCoveragePenalty`.
- Rotas cromaticas/radicais sem bonus de referencia recebem `unsupportedChromaticPenalty`.
- O relatorio F76 explicita cobertura temporal, penalidade temporal e penalidade cromatica.
- A regressao `ranking-calibration.spec.ts` fixa os tres casos do bloco.

## Resultado por caso

### Donna Lee

Mantem `Estratégia — Tonal Clássico` como primaria.

Motivo: a celula curta e conservadora recebe apoio da referencia e funciona melhor como resposta clara do que as rotas mais densas.

### Firm roots

Passa para `Estratégia — Harmonia básica I-IV-V`.

Motivo: a rota cromatica nao tinha confirmacao suficiente da referencia; a resposta basica e mais clara como primeira opcao.

### Ask me now

Mantem `Estratégia — Dominantes secundárias` como primaria.

Motivo: cobre a janela inteira e recebe apoio da referencia.

## Artefatos

- `docs/reports/f76-ranking-calibration-audit.md`
- `docs/reports/f76-ranking-calibration-audit.csv`
- `scripts/audit-ranking-calibration.ts`
- `scripts/ranking-calibration.spec.ts`

## Proxima atencao

O proximo bloco natural e `Cromatico linear`: `Crazeology`, `Detour ahead` e `E.S.P.`.

Ali a pergunta muda: nao basta o cromatismo estar rankeado corretamente; precisamos saber se diminutos, dominantes e baixos cromaticos estao soando como conducao ou como artificio.
