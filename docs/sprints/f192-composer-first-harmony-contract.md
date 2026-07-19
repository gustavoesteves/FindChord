# F192 — Contrato composer-first

## Objetivo

Registrar a virada conceitual do Find Chord: teoria musical, repertório e utilidade composicional passam a ter autoridade acima de categorias herdadas do app, bibliotecas ou listas estáticas.

## Entrega

- Criado `docs/theory/composer_first_harmony_model.md`.
- Atualizado `docs/theory/escala_compativel_diagnostico.md` com nota de direção.

## Decisão

O sistema deve responder primeiro ao compositor/arranjador:

- que harmonia sustenta a melodia;
- que rearmonização preserva direção;
- que material melódico é tocável;
- que tensão resolve para onde;
- que explicação realmente ajuda.

Escalas, cifras e bibliotecas continuam importantes, mas como infraestrutura, mapa ou superfície de escrita.

## Próximo passo

Usar este contrato para auditar a UI e o motor:

- nomes legados;
- componentes ainda centrados em escala;
- funções que deixam bibliotecas decidirem comportamento musical;
- informações exibidas que não ajudam composição/arranjo.
