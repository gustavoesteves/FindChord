# F101 - Impacto da chegada lateral melodica no corpus

## Contexto

A F100 adicionou uma suavizacao conservadora no ranking para dominantes alteradas que chegam um semitom abaixo do alvo esperado quando a melodia sustenta a chegada lateral.

Era preciso saber se essa regra ja influencia propostas reais ou se apenas cobre um caso teoricamente possivel.

## Decisao

Criar `scripts/audit-melodic-side-arrival-ranking.ts`.

A auditoria varre as musicas reais, gera/rankeia propostas e lista apenas as propostas cuja explicacao contem:

`chegada lateral sustentada pela melodia`

## Resultado

No corpus atual:

- propostas impactadas: 0
- propostas primarias impactadas: 0

## Leitura

A F100 esta ativa e coberta por teste sintético, mas ainda nao aparece nas janelas harmonizaveis atuais do corpus.

Isso indica que, neste momento, a regra nao esta alterando o comportamento normal do app. Ela funciona como uma protecao futura para rotas cromaticas melodicamente sustentadas.

## Consequencia

O proximo gargalo provavelmente nao e o ranking aceitar esse caso.

O gargalo parece estar antes:

- o gerador ainda nao produz esse tipo de rota com frequencia;
- ou as janelas harmonizaveis atuais nao passam por esse gesto;
- ou a referencia contem esses casos, mas eles ainda nao viram candidatos de harmonizacao.

## Proximo refinamento

Investigar se devemos gerar candidatos controlados para:

- chegada um semitom abaixo do alvo esperado;
- chegada plagal em relacao ao alvo esperado;
- tensao dominante expressiva sustentada pela melodia sem resolucao funcional local.

Essa investigacao deve continuar cuidadosa: gerar candidato nao significa torna-lo primaria.
