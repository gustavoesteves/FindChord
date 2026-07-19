# F185 - Critério de entrada para material alterado

## Objetivo

Reduzir ruído na auditoria de materiais melódicos impedindo que todo dominante comum carregue automaticamente células da escala alterada.

## Mudanças

- `Células da escala alterada` agora só aparece quando a cifra tem alteração explícita (`b5`, `b9`, `#9`, `#11`, `b13` ou `alt`).
- Dominantes comuns como `A13` continuam podendo ter escala alterada como candidata teórica, mas não recebem material alterado automaticamente.
- Setas cadenciais da escala alterada só aparecem quando o alvo de resolução tem raiz diferente da dominante.

## Efeito na auditoria F184

- `Células da escala alterada` caiu de 3.456 para 549 ocorrências disponíveis.
- Casos com material apenas em candidato secundário caíram de 5.122 para 2.581.
- Casos sem material subiram de 152 para 2.761, expondo uma lacuna real: dominantes naturais/bebop precisam de vocabulário próprio.

## Próximo passo

Implementar material de dominante natural/bebop, com notas-guia `3->1`, `b7->3` e célula cromática `b7-7-1`, sem depender da escala alterada.

Esse passo foi executado em F186.
