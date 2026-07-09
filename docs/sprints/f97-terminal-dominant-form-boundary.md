# F97 - Dominante terminal como borda formal

## Contexto

Depois das regras F94-F96, a fila F93 ainda continha varios casos `terminal-dominant`: dominantes alteradas no fim da janela analisada.

Esses casos nao devem ser tratados como resolucoes fortes, mas tambem nao sao necessariamente erro harmonico. Podem representar meia-cadencia, chamada para repeticao, turnaround, fim de secao ou apenas limite do trecho extraido do MusicXML.

## Decisao

Mover a leitura de `terminal-dominant` para `DominantResolutionAnalysis`.

A regra e conservadora:

- so entra quando nao ha acorde seguinte na sequencia analisada;
- nao inventa um alvo realizado;
- preserva o alvo esperado por quinta/quarta;
- classifica como suporte contextual fraco.

## Impacto no ranking

`terminal-dominant` entra em `isDominantResolutionSupported`, mas recebe bonus menor que resolucao, atraso, prolongamento, retomada de dominante ou chegada deceptiva.

Isso evita punir automaticamente uma borda formal, sem transformar fim de frase em cadencia resolvida.

## Impacto na auditoria

- F91 passa a contar esses casos como resolucao contextual.
- F93 deixa de misturar borda formal com dominantes realmente sem alvo.
- A fila F93 cai para 8 casos, todos `unresolved-review`.

## Proximo refinamento

Os 8 casos restantes devem ser avaliados como cromatismo/ambiguidade real, provavelmente com inspeção de melodia e cifra:

- vizinhanca cromatica do alvo esperado;
- dominantes em cadeia sem alvo local claro;
- possivel erro ou simplificacao de cifra no corpus;
- casos em que a melodia talvez explique uma escolha aparentemente lateral.
