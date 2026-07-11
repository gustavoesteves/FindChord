# F113 - Auditoria de densidade harmonica

## Objetivo

Medir quando as partituras e o exemplo do Almada justificam mais de uma cifra
por compasso e verificar se o motor ja possui alguma proposta capaz de responder
a esses casos.

## Regra de produto

Baixa densidade continua sendo a resposta principal para melodias simples. A
densidade interna deve aparecer como alternativa controlada quando houver
cobertura melódica, resolução funcional e condução de vozes suficientes.

## Proximo passo

Usar os casos densos do relatório para desenhar uma estratégia de acordes
internos por compasso, começando por preparações ii-V e dominantes alteradas
locais, sem abrir uma geração indiscriminada.

## Resultado da auditoria

- 199 partituras analisadas;
- 182 referencias com mais de uma cifra em algum compasso;
- 107 lacunas de densidade detectadas;
- `asa branca.musicxml`: controle sem referencia e sem proposta densa;
- `exemplo.musicxml`: 9 de 12 ideias geradas usam densidade interna, com maximo
  de 2,5 acordes por compasso.

O numero alto de lacunas nao significa que todas as 107 partituras precisem de
mais acordes. Ele indica apenas que a referencia do autor e mais densa que a
janela principal gerada. A proxima estrategia deve selecionar trechos e alvos
melodicos locais antes de inserir uma segunda cifra no compasso.
