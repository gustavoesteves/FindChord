# F63 - Relatorio de decisao das 5 obras

Este relatorio consolida a avaliacao das mesmas 5 obras da F61. O objetivo e definir o proximo refinamento do harmonizador antes de ampliar o catalogo.

## Conclusao

O proximo passo nao deve ser adicionar mais vocabulario harmonico. Deve ser criar uma **selecao por camada**:

- melhor harmonia basica;
- melhor leitura de centro de referencia;
- melhor rearmonizacao.

Hoje o sistema ja calcula camadas (`presentationLayer`), mas o modo `Harmonizar` ainda precisa usar essa informacao para organizar a resposta.

## Decisoes por obra

### asa branca.musicxml

- Camada atual: harmonia basica.
- Leitura: controle tonal simples.
- Decisao: usar como padrao minimo de resposta.
- Ajuste desejado: garantir que I-IV-V, baixa densidade e inversoes simples continuem vencendo no modo basico.

### Bright Size Life.musicxml

- Camada atual: centro de referencia.
- Leitura: centro local Bb contra centro global D.
- Decisao: tratar como leitura contextual/autoral.
- Ajuste desejado: mostrar centro local e centro global sem fazer parecer que a leitura melodia-only e simplesmente errada.

### afternoon in Paris.musicxml

- Camada atual: rearmonizacao.
- Leitura: centro local Bb contra centro global C, com proposta do campo Tonal Classico.
- Decisao: manter como alternativa criativa/contextual.
- Ajuste desejado: impedir que campos exploratorios tomem a resposta basica quando uma harmonia mais simples tambem existe.

### Ain't misbehavin.musicxml

- Camada atual: centro de referencia.
- Leitura: mesmo centro, harmonizacao diferente.
- Decisao: tratar a referencia como densidade/habito estilistico.
- Ajuste desejado: apresentar a proposta basica e a leitura de referencia como niveis diferentes, nao como uma anulando a outra.

### Actual proof.musicxml

- Camada atual: centro de referencia.
- Leitura: a referencia destrava a harmonizacao.
- Decisao: reconhecer insuficiencia da melodia isolada.
- Ajuste desejado: criar fallback musical quando melodia-only nao produz proposta: pedir mais contexto, baixo ou harmonia de referencia.

## Ajuste recomendado

Implementar um agrupamento de propostas por camada no pipeline de apresentacao:

| Camada | Papel no produto | Regra de exibicao |
| --- | --- | --- |
| Harmonia basica | primeira resposta | mostrar primeiro quando existir e for validada |
| Centro de referencia | leitura contextual/autoral | mostrar como leitura da referencia ou centro local |
| Rearmonizacao | alternativa criativa | mostrar como opcao, nao como substituta automatica |

## Criterio para ampliar o catalogo

So aumentar o range depois que o app conseguir responder, para qualquer obra auditada:

1. qual e a melhor proposta basica;
2. qual e a melhor proposta reference-aware;
3. qual e a melhor rearmonizacao;
4. qual camada esta ausente;
5. quando a melodia isolada e insuficiente.
