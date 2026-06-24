# ADR-013: Route → Perspective Shift

**Data:** 23 de Junho de 2026
**Status:** Aceito
**Contexto:** F13.5 Concluída

## Decisão
A arquitetura originalmente concebida como *Route Discovery Engine* (F13.1) evoluiu substancialmente durante as sprints até a F13.5, transformando-se de fato em um **Motor de Perspectivas Harmônicas**. O sistema não age mais como um "rearmonizador" focado em substituição de acordes, mas como um motor analítico que avalia e ranqueia hipóteses interpretativas baseadas em 4 eixos (Melodia, Voice Leading, Ontologia, Macro-Forma).

## Consequências
- Assumimos conceitualmente a transição para *Motor de Perspectivas Harmônicas*.
- O vocabulário interno contendo a palavra *Route* (e.g., `RouteExplorationEngine`, `SuggestedRoute`, `RouteValidator`) permanece temporariamente intocado por razões de estabilidade de código, testes e infraestrutura.
- A presença de nomes de classes ligados a *Route* reflete o momento histórico do desenvolvimento e é tratada como legado ativo (`ancestral do PerspectiveEngine`).

## Próximos Passos
A renomeação estrutural (refactoring profundo) e a adoção definitiva da nomenclatura `Perspective` em todo o código-fonte estão agendadas para quando surgir a camada de comparação multicritério entre perspectivas ou no ciclo arquitetural da **F14**.

## Nota Arquitetural
A mudança de nomenclatura não é apenas semântica.

"Route" representa uma transformação potencial dentro da harmonia.

"Perspective" representa uma interpretação musical completa, avaliada simultaneamente pelos eixos:
- Melodia
- Voice Leading
- Ontologia
- Macro-Forma

A futura renomeação refletirá uma mudança de abstração do sistema e não apenas uma reorganização de código.
