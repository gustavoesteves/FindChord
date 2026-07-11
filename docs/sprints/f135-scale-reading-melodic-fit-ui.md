# F135 - Encaixe melodico no detalhe da leitura

## Problema

A F134 passou a calcular `melodicFit` para cada leitura por acorde, mas a UI
ainda escondia essa informacao no detalhe de `Ver leitura`.

Isso deixava a leitura principal mais inteligente internamente, mas pouco
explicavel para o usuario.

## Decisao

O componente `ScaleReading` passa a mostrar o encaixe melodico da candidata com
os mesmos rotulos usados nas rotas lineares:

- `Melodia apoia`;
- `Neutra`;
- `Revisar com a melodia`.

O mesmo rotulo tambem aparece junto da porcentagem de cobertura melodica quando
a leitura esta expandida.

## Efeito musical

O usuario consegue distinguir rapidamente:

- uma escala que apenas cabe no acorde;
- uma escala que explica uma nota real da melodia;
- uma escala que deve ser revisada com mais cuidado.

## Limite

Essa etapa nao muda o ranking. Ela apenas torna visivel o que a F134 ja calcula.

## Proximo passo

Um proximo refinamento pode mostrar, no detalhe da leitura por acorde, quais
notas da melodia apoiam o fragmento linear, como ja acontece nas rotas
agregadas.
