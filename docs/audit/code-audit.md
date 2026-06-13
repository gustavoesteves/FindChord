# Code Audit — F11-AUD
**Auditoria Profunda de Código: Qualidade, Estrutura, Riscos e Recomendações**

> **Documento de referência executiva para avaliação da saúde do código-fonte do Find Chord.**
> Escopo: Todo o diretório `src/` do projeto. Versão auditada: `v0.0.0` (pré-F12).
> Data: Junho de 2026.

---

## Sumário Executivo

O **Find Chord** é um sistema de análise harmônica avançada composto por **329 arquivos TypeScript/TSX** totalizando **62.596 linhas de código**. A base é dividida entre **41.559 linhas de código de produção** e **21.037 linhas de testes/benchmarks**.

O sistema demonstra uma arquitetura científica ambiciosa, com um motor Viterbi de Beam Search altamente sofisticado e um modelo probabilístico multi-paradigma raro na indústria de software musical. Contudo, a auditoria revela um desequilíbrio significativo entre a profundidade teórica implementada e o código efetivamente utilizado em produção, resultando em uma base de código com alto peso morto acadêmico e riscos concretos de performance e manutenibilidade.

---

## 1. Inventário Quantitativo da Base de Código

### 1.1 Distribuição por Categoria

| Categoria | Arquivos | Linhas | % do Total |
| :--- | :---: | :---: | :---: |
| **Motor de Análise Harmônica** (`analysis/`) | 148 | 25.948 | 41.5% |
| **Testes e Benchmarks** (`tests/`) | 75+15 | 21.037 | 33.6% |
| **Componentes React** (`components/`) | 13 | 7.174 | 11.5% |
| **Utilitários Musicais** (theory, midi, voiceLeading) | 25 | 5.472 | 8.7% |
| **Infraestrutura** (store, bridge adapter, scripts) | 5 | 2.965 | 4.7% |
| **Total** | **329** | **62.596** | **100%** |

### 1.2 Decomposição do Motor de Análise

O motor de análise harmônica — o coração intelectual do sistema — subdivide-se internamente em:

| Submódulo | Arquivos | Linhas | Função |
| :--- | :---: | :---: | :--- |
| `calibration/` | 44 | 6.585 | Motores científicos: MIG, Bayesiana, Leis Universais, Metateorias |
| `similarity/` | 39 | 9.912 | Recomendação, explicabilidade, otimização multi-objetivo |
| `narrative/` | 13 | 2.657 | Geração de narrativas textuais e fingerprints |
| `models/` | 33 | 2.142 | Interfaces e DTOs de tipagem |
| `viterbi/` | 2 | 652 | Resolvedor global de caminhos (Beam Search) |
| Outros (facade, regions, helpers, _experimental) | 17 | 4.000 | Classificadores, segmentadores, orquestradores |

> [!IMPORTANT]
> O diretório `calibration/` sozinho contém **44 arquivos** — mais do que o dobro dos componentes React do projeto inteiro. A maioria desses motores não é chamada no pipeline principal de análise (ver auditoria científica ASC = 9.09%).

### 1.3 Top 10 Maiores Arquivos de Produção (Hotspots)

| # | Arquivo | Linhas | Observação |
| :---: | :--- | :---: | :--- |
| 1 | [resolveGlobalPath.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/viterbi/resolveGlobalPath.ts) | 652 | Motor Viterbi. Complexidade concentrada. |
| 2 | [Discovery.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/models/Discovery.ts) | 638 | Interface de tipos. Volume desproporcional para DTOs. |
| 3 | [narrativeRenderer.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/narrativeRenderer.ts) | 597 | Gerador de texto explanatório. |
| 4 | [multiObjectiveOptimizationEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/multiObjectiveOptimizationEngine.ts) | 553 | Otimizador Pareto. Não chamado no runtime. |
| 5 | [ConsensusModelingEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/ConsensusModelingEngine.ts) | 547 | MIG. Motor de consenso acadêmico. |
| 6 | [useChordStore.ts](file:///Volumes/Documents/Development/Find%20Chord/src/store/useChordStore.ts) | 545 | Store Zustand. Tamanho elevado para state management. |
| 7 | [FunctionalAnalysis.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/models/FunctionalAnalysis.ts) | 532 | DTO principal da análise. |
| 8 | [recommendationAnalyticsEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/recommendationAnalyticsEngine.ts) | 517 | Motor de analytics de recomendações. |
| 9 | [evidenceGraphBuilder.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/similarity/evidenceGraphBuilder.ts) | 477 | Construtor de grafos de evidência. |
| 10 | [voiceLeading.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/voiceLeading/voiceLeading.ts) | 461 | Motor de condução de vozes. |

### 1.4 Top 10 Maiores Componentes React

| # | Componente | Linhas | Observação |
| :---: | :--- | :---: | :--- |
| 1 | [HarmonicNarrativeOverlayPanel.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/HarmonicNarrativeOverlayPanel.tsx) | 971 | Painel de sobreposição narrativa. Complexo. |
| 2 | [Playground.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/Playground.tsx) | 821 | Playground de API com validações e templates. |
| 3 | [ScaleOverlayPanel.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/ScaleOverlayPanel.tsx) | 819 | Visualização de escalas. |
| 4 | [BuilderMVP.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/BuilderMVP.tsx) | 815 | Builder de acordes com braço interativo. |
| 5 | [VoicingSelector.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/VoicingSelector.tsx) | 785 | Seletor de voicings com ranking de score. |
| 6 | [VoiceLeadingPanel.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/VoiceLeadingPanel.tsx) | 744 | Painel de condução de vozes e partitura. |
| 7 | [Explorer.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/Explorer.tsx) | 734 | Explorador interativo de resultados harmônicos. |
| 8 | [Fretboard.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/Fretboard.tsx) | 620 | Braço visual interativo SVG. |
| 9 | [ChordList.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/ChordList.tsx) | 466 | Lista de shapes de acordes. |

> [!NOTE]
> Nenhum componente ultrapassa 1.000 linhas, o que é um sinal positivo de modularidade no frontend. Mas a média de ~730 linhas por componente complexo sugere oportunidade de decomposição em subcomponentes reutilizáveis.

---

## 2. Qualidade de Código

### 2.1 Segurança de Tipos (Type Safety)

| Indicador | Valor | Avaliação |
| :--- | :---: | :--- |
| Coerções para `any` (`as any`) | **59** | 🔴 Alto. Concentradas em motores de estabilidade e consenso. |
| Interfaces de modelo tipadas | 33 arquivos | 🟢 Cobertura adequada. |
| Uso de tipos genéricos (`Record<>`, etc.) | Frequente | 🟢 Uso correto e idiomático. |

**Diagnóstico**: As 59 ocorrências de `as any` representam pontos cegos para o compilador TypeScript. Cada uma é uma brecha potencial para erros de runtime silenciosos. Os arquivos mais afetados são:
- [InterpretiveStabilityEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/InterpretiveStabilityEngine.ts) — Acessa propriedades de `debug` forçando tipo.
- [resolveGlobalPath.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/viterbi/resolveGlobalPath.ts) — Coerção na passagem de hipóteses para o motor de consenso.
- [Playground.tsx](file:///Volumes/Documents/Development/Find%20Chord/src/components/Playground.tsx) — Templates de dados coagidos para parse de JSON.

### 2.2 Tratamento de Erros (Error Handling)

| Indicador | Valor | Avaliação |
| :--- | :---: | :--- |
| Blocos `try/catch` (produção) | **17** | 🟡 Moderado. |
| Instruções `throw` (produção) | **6** | 🟡 Moderado. |
| Chamadas `console.log/warn/error` (produção) | **10** | 🟢 Limpo. |

**Diagnóstico**: O código de produção é notavelmente silencioso em logs, o que é positivo para performance, mas perigoso para depuração. A maioria dos `try/catch` está concentrada no adaptador do MuseScore ([musescoreAdapter.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/musescoreAdapter.ts)) e no plugin QML. O motor analítico de harmonia opera quase inteiramente sem tratamento de exceções explícito — se uma divisão por zero ou um acesso a `undefined` ocorrer dentro do loop Viterbi, o crash será silencioso e não-recuperável.

### 2.3 Complexidade e Legibilidade

| Indicador | Valor | Avaliação |
| :--- | :---: | :--- |
| Linhas de comentário (produção) | 1.329 / 41.559 | 🟡 3.2% — abaixo do recomendado (5-10%). |
| Marcadores de débito (`TODO`, `FIXME`, `HACK`) | **0** | 🟢 Excelente. Nenhum débito reconhecido pendente. |
| Funções/classes exportadas (API pública) | **263** | 🔴 Superfície de API excessiva para o tamanho do projeto. |
| Módulos exportadores | **223** | 🔴 Alta granularidade de módulos. |

**Diagnóstico**: A ausência total de marcadores `TODO`/`FIXME` pode indicar disciplina ou, alternativamente, débitos não-reconhecidos que foram normalizados no código. A superfície de API pública com 263 funções/classes exportadas é desproporcional — sistemas desta escala tipicamente expõem 50–80 exports públicos, delegando o restante para encapsulamento interno.

### 2.4 Hardcoded Values e Constantes Mágicas

O motor de estabilidade e o motor de priors musicológicos contêm extensas tabelas de overrides estáticos para cenários específicos. Um exemplo crítico é encontrado em [InterpretiveStabilityEngine.ts](file:///Volumes/Documents/Development/Find%20Chord/src/utils/music/analysis/calibration/InterpretiveStabilityEngine.ts#L140-L210), onde progressões inteiras são comparadas por igualdade de string e substituídas por valores numéricos fixos:

```typescript
if (progStr === 'C,F,G7,C') {
  overrideISS = 0.96;
  overrideSIS = 1.0;
  overridePIS = 0.92;
}
```

Esse padrão é repetido para mais de 15 progressões nomeadas. Embora funcional para benchmarks, é:
- **Frágil**: Qualquer variação na escrita da cifra (ex: `Cmaj` vs `C`) quebraria a correspondência.
- **Não-escalável**: Adicionar novos cenários exige edição manual de código-fonte.
- **Opaco**: Os valores numéricos não possuem justificativa de derivação documentada.

---

## 3. Arquitetura de Testes

### 3.1 Métricas de Cobertura de Testes

| Indicador | Valor | Avaliação |
| :--- | :---: | :--- |
| Arquivos de teste | **90** | 🟢 Volume alto. |
| Linhas de teste | **21.037** | 🟢 33.6% da base total. |
| Ratio teste:produção | **1 : 1.98** | 🟢 Excelente ratio. |
| Framework de teste | `assert` manual + `npx tsx` | 🟡 Sem framework padrão (Vitest, Jest). |
| Cobertura de branches | Não medida | 🔴 Sem instrumentação de cobertura. |

### 3.2 Natureza dos Testes

Os testes do Find Chord não são testes unitários tradicionais. São **benchmarks de aceitação científica** — scripts que executam cenários musicológicos completos, verificam métricas de correlação com opiniões de especialistas e assertam limiares de aceitação:

```typescript
assert(adiCorr >= 0.80, 'ADI expert correlation >= 0.80');
assert(cfsStability >= 0.85, 'CFS Stability score >= 0.85');
```

**Pontos positivos**:
- Validação end-to-end do pipeline de análise harmônica.
- Cenários reais de repertório clássico, jazz e pós-tonal.
- Medições de estabilidade sob perturbação.

**Pontos negativos**:
- Nenhum teste unitário isolado para funções puras individuais.
- Sem mocking de dependências — cada teste executa o pipeline inteiro.
- Sem instrumentação de cobertura de código (`istanbul`, `c8`).
- Sem framework de teste padrão (`vitest`, `jest`) — usa `assert()` manual com `process.exit(1)`.
- Nenhum teste de componentes React (sem `@testing-library/react`).
- Nenhum teste de integração para a bridge HTTP/WebSocket.

---

## 4. Análise de Dependências Externas

### 4.1 Dependências de Produção

| Pacote | Versão | Função | Risco |
| :--- | :--- | :--- | :--- |
| `react` | ^19.2.6 | Framework de UI | 🟢 Baixo |
| `react-dom` | ^19.2.6 | Renderização DOM | 🟢 Baixo |
| `zustand` | ^5.0.14 | State management | 🟢 Baixo. Leve e bem mantido. |
| `tonal` | ^6.4.3 | Teoria musical (pitches, escalas, acordes) | 🟢 Baixo. Biblioteca canônica. |
| `lucide-react` | ^1.17.0 | Ícones SVG | 🟢 Baixo |

**Diagnóstico**: A árvore de dependências de produção é **extremamente enxuta** (5 pacotes). Esse é um ponto de excelência arquitetural. O projeto evitou propositalmente a acumulação de bibliotecas externas, mantendo o controle total sobre seu motor harmônico proprietário.

### 4.2 Dependências de Desenvolvimento

| Pacote | Função | Risco |
| :--- | :--- | :--- |
| `vite` v8 | Bundler/dev server | 🟢 |
| `typescript` ~6.0 | Compilação de tipos | 🟢 |
| `tailwindcss` v4 | Estilização por utilidade | 🟢 |
| `eslint` v10 | Linter | 🟢 |

**Diagnóstico**: A cadeia de ferramentas de desenvolvimento é moderna e padrão. Não há dependências desatualizadas ou vulneráveis conhecidas.

---

## 5. Segurança

### 5.1 Superfície de Ataque

| Vetor | Status | Criticidade |
| :--- | :--- | :---: |
| **Bridge Local (Porta 9000)** | Protegida por CORS + `X-FindChord-Client` header | 🟢 |
| **Limite de Payload HTTP** | 128 KB | 🟢 |
| **Injeção de Eventos WebSocket** | Sem autenticação de sessão no WebSocket | 🟡 P2 |
| **Execução de Código Remoto** | N/A — aplicação local sem servidor externo | 🟢 |
| **XSS / Injeção de HTML** | React escapa por padrão. Sem `dangerouslySetInnerHTML`. | 🟢 |

### 5.2 Dados Sensíveis

O Find Chord não processa dados pessoais, credenciais ou informações sensíveis. Toda a comunicação ocorre exclusivamente em `localhost`. O risco de vazamento de dados é **negligível**.

---

## 6. Manutenibilidade

### 6.1 Índice de Manutenibilidade Estimado

Baseado nos indicadores quantitativos coletados, calculamos um índice de manutenibilidade ponderado:

| Fator | Peso | Nota (0-100) | Ponderado |
| :--- | :---: | :---: | :---: |
| Modularidade (separação de responsabilidades) | 0.20 | 82 | 16.4 |
| Cobertura de testes | 0.15 | 70 | 10.5 |
| Segurança de tipos | 0.15 | 72 | 10.8 |
| Documentação interna (comentários, JSDoc) | 0.10 | 45 | 4.5 |
| Complexidade ciclomática (hotspots) | 0.15 | 60 | 9.0 |
| Peso morto / código inativo | 0.10 | 40 | 4.0 |
| Superfície de API (encapsulamento) | 0.10 | 50 | 5.0 |
| Dependências externas (risco de supply chain) | 0.05 | 98 | 4.9 |
| **Total** | **1.00** | | **65.1 / 100** |

### 6.2 Interpretação

| Faixa | Classificação | Status Atual |
| :--- | :--- | :---: |
| 80–100 | Altamente manutenível | |
| 65–79 | Manutenível com atenção | **✓ (65.1)** |
| 50–64 | Risco de degradação | |
| < 50 | Débito técnico crítico | |

---

## 7. Padrões de Código e Anti-Padrões Identificados

### 7.1 Padrões Positivos (a preservar)

| Padrão | Onde | Impacto |
| :--- | :--- | :--- |
| **Pipeline orquestrado sequencial** | `progressionAnalysis.ts` | Facilita rastreamento e debugging do fluxo. |
| **Tipagem via interfaces canônicas** | `models/*.ts` | Garante contratos claros entre camadas. |
| **Isolamento de Transição Teórica vs Corpus** | `transitionModels.ts` | Permite trocar a gramática sem alterar o Viterbi. |
| **Zero dependências no motor científico** | `calibration/`, `viterbi/` | Máxima portabilidade e controle. |
| **State management centralizado** | `useChordStore.ts` (Zustand) | Single source of truth para todo o frontend. |

### 7.2 Anti-Padrões Identificados (a corrigir)

| Anti-Padrão | Onde | Risco | Criticidade |
| :--- | :--- | :--- | :---: |
| **God Object** | `FunctionalAnalysis.ts` (532 linhas de interface) | DTO monolítico com dezenas de campos opcionais, difícil de versionar. | P2 |
| **Shotgun Surgery** | `InterpretiveStabilityEngine` override tables | Qualquer alteração nos valores mágicos exige mudanças em cascata nos testes. | P2 |
| **Speculative Generality** | 44 engines em `calibration/` com ASC de 9% | Código escrito para funcionalidades futuras que nunca foram integradas ao pipeline principal. | P1 |
| **Primitive Obsession** | Modos e funções harmônicas como strings literais | Enums formais evitariam typos silenciosos em comparações `===`. | P3 |
| **Callback Coupling** | Stability → analyzeProgression callback | Circularidade lógica que impede testes isolados e gera $O(N^2)$. | P1 |

---

## 8. Riscos Técnicos Consolidados

### 8.1 Matriz de Risco

| Risco | Probabilidade | Impacto | Severidade | Mitigação |
| :--- | :---: | :---: | :---: | :--- |
| Crash por OOM em progressões longas | Alta | Alto | **Crítico** | Lazy evaluation do cache Viterbi |
| Travamento da UI por estabilidade $O(N^2)$ | Alta | Alto | **Crítico** | Desacoplar contrafactual do pipeline ou limitar N |
| Erro silencioso por `as any` em produção | Média | Médio | **Alto** | Eliminar coerções e tipar `debug` formalmente |
| Regressão não-detectada por falta de cobertura | Média | Médio | **Alto** | Adotar Vitest + instrumentação `c8` |
| Inconsistência de dados pela store monolítica | Baixa | Médio | **Moderado** | Dividir `useChordStore` em slices temáticos |
| Vulnerabilidade via WebSocket sem autenticação | Baixa | Baixo | **Baixo** | Adicionar token de sessão efêmero ao WS |

---

## 9. Recomendações Prioritárias

### Imediatas (Antes da F12)

1. **Adotar framework de testes**: Migrar os 90 scripts de benchmark para Vitest. Isso habilita cobertura de branches, mocking, paralelismo e integração CI.
2. **Instrumentar cobertura de código**: Configurar `c8` ou `istanbul` para medir cobertura real de branches e identificar caminhos não testados no Viterbi e nos classificadores.
3. **Eliminar `as any` nos motores críticos**: Tipar formalmente as propriedades `debug` e `adaptiveTonalState` para restaurar a segurança do compilador TypeScript.

### Curto Prazo (Durante F12)

4. **Extrair tabelas de override para configuração externa**: Mover os valores hardcoded de estabilidade e priors para arquivos JSON carregados em runtime.
5. **Reduzir superfície de API pública**: Internalizar exports de módulos auxiliares que não são consumidos fora de seu pacote.
6. **Adicionar JSDoc nos pontos de entrada**: Documentar `analyzeProgression`, `resolveGlobalPath`, `computeConsensus` e os contratos canônicos com JSDoc formal.

### Médio Prazo (Pós-F12)

7. **Decompor componentes React maiores**: Extrair subcomponentes do `HarmonicNarrativeOverlayPanel` (971 linhas) e do `Playground` (821 linhas).
8. **Avaliar remoção de motores acadêmicos inativos**: Considerar mover os 44 arquivos de `calibration/` para um pacote separado de pesquisa, mantendo no core apenas o `ConsensusModelingEngine`.
9. **Introduzir testes de componentes React**: Adicionar `@testing-library/react` para validar interações críticas do Fretboard e Builder.
