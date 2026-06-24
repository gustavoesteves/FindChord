# ADR-015 — F15.0: A Virada Epistemológica para o Diagnóstico Musical

**Status:** Aceito

**Data:** Junho de 2026

## Contexto

As Fases F13 e F14 construíram um motor harmônico robusto, capaz de gerar ontologias, comparar perspectivas e agrupar caminhos de decisão (clusters). A F14.2 melhorou a interface de decisão introduzindo trade-offs e caminhos concorrentes.

Entretanto, o fluxo do sistema continuou sendo um reflexo da arquitetura interna:
`Região -> Gerar Perspectivas -> Comparar Perspectivas -> Escolher Caminho`

O músico, por outro lado, opera com um fluxo mental diferente:
`Problema Percebido -> Diagnóstico -> Hipóteses -> Escolha`

Atualmente, o músico chega com dúvidas práticas ("Por que esse refrão não cresce?", "Por que soa mecânico?") e o sistema responde oferecendo soluções sem antes explicar o que está acontecendo (o diagnóstico) no nível do resultado musical percebido.

Além disso, as opções oferecidas (ex: "Adicionar Cor", "Intensificar Resolução") descrevem os mecanismos técnicos (Intents), não o impacto no ouvinte (ex: "Escurecer o clima", "Fazer o refrão chegar com mais força").

## Decisão

A Fase F15.0 redireciona o foco da apresentação arquitetural para a **UX Musical focada em Diagnóstico e Resultado Percebido**.

Estabelecemos os seguintes princípios para o novo design da interface (telas Entender e Decidir):

1. **Diagnóstico Primeiro:** O sistema deve sempre apresentar o diagnóstico do trecho atual *antes* de oferecer caminhos ou clusters. O músico deve entender o que está acontecendo (ex: estabilidade excessiva, falta de direção) e quais são as consequências prováveis (ex: baixo contraste, refrão fraco).
2. **Ação Prescritiva:** Substituir painéis descritivos (ex: Linter, Attractor Compass) por perguntas e recomendações agressivas ("O que está faltando?", "O que eu poderia tentar?").
3. **Mapeamento Intent -> Resultado Percebido:** A interface deve traduzir as intenções sistêmicas (Tensão, Cor, Movimento) em objetivos musicais centrados no ouvinte ("Escurecer o clima", "Aumentar impacto da chegada").

## Consequências

- A tela "Entender" passará a ser primariamente um painel de "Diagnóstico Musical" que contextualiza as leituras do linter e da ontologia.
- A tela "Decidir" não iniciará listando clusters. Ela iniciará com o diagnóstico e perguntará ao músico "O que você quer mudar?" usando vocabulário focado em resultado percebido.
- Essa mudança não exige novos motores pesados, mas uma reestruturação profunda da apresentação (UX), permitindo que a ferramenta se torne verdadeiramente indispensável e não apenas tecnicamente impressionante.
