# F136 - Notas de apoio melodico na leitura por acorde

## Problema

A F135 mostrou o encaixe melodico no detalhe de cada leitura, mas ainda nao
mostrava quais notas da melodia justificavam esse encaixe.

Sem essa informacao, o selo `Melodia apoia` ficava correto, mas pouco
verificavel pelo usuario.

## Decisao

Cada `ContextualScaleCandidate` passa a expor `melodyMatches`: as notas da
melodia que aparecem nos fragmentos lineares da leitura.

O detalhe `Ver leitura` passa a mostrar essas notas como `Apoio`.

## Efeito musical

Em `G7 -> C`, se a leitura traz:

```text
B->C / F->E
```

e a melodia contem `B` ou `C`, essas notas aparecem como apoio direto da
leitura.

No caso da `bebop dominant`, se a melodia contem `F#`, o sistema mostra esse
apoio sem transformar `F#` em tensao sustentavel.

## Limite

`melodyMatches` explica o contato entre melodia e fragmentos lineares. Ele nao
substitui a cobertura melodica total da escala.

## Proximo passo

O proximo refinamento pode diferenciar apoio por nota-guia, apoio por alvo de
resolucao e apoio por passagem cromatica.
