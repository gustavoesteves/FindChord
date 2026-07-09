# F99 - Mapa da chegada lateral nos casos ainda unresolved

## Contexto

A F98 mostrou que os 8 casos restantes nao eram iguais entre si. Alguns eram sustentados pela dominante, outros pela chegada lateral, e outros tinham evidência melodica fraca.

Faltava uma segunda pergunta: qual e a relacao entre a chegada real e o alvo funcional esperado?

## Decisao

Adicionar `sideArrivalRelation` na auditoria F98.

A classificacao compara a raiz do primeiro acorde seguinte com o alvo esperado da dominante:

- `target-lower-chromatic-neighbor`
- `target-upper-chromatic-neighbor`
- `target-lower-whole-neighbor`
- `target-upper-whole-neighbor`
- `target-plagal-region`
- `target-dominant-region`
- `target-tritone-region`
- `remote-side-arrival`

## Resultado

Nos 8 casos atuais:

- `target-lower-chromatic-neighbor`: 4
- `target-plagal-region`: 2
- `target-lower-whole-neighbor`: 1
- `target-upper-whole-neighbor`: 1

## Leitura musical

O principal achado e que metade da fila envolve chegada um semitom abaixo do alvo esperado.

Isso nao deve virar regra geral automaticamente. Nos casos analisados, dois desses semitons inferiores sao sustentados melodicamente pela propria dominante e dois sustentam a chegada lateral.

O segundo achado e a recorrencia de chegada plagal em relacao ao alvo esperado, que tambem precisa ser separada de erro de cifra e de cromatismo livre.

## Proximo refinamento

O proximo passo deve escolher entre duas direcoes:

- criar uma classe conservadora de `target-lower-chromatic-neighbor` apenas quando a melodia sustenta a chegada lateral;
- ou manter tudo como diagnostico e investigar manualmente os 4 casos cromaticos antes de qualquer mudanca no motor.

Por enquanto, a F99 permanece diagnostica. Ela melhora a leitura do corpus sem liberar novas dominantes no ranking.
