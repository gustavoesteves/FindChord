# F15 — Intelligence Delivery Layer (RFC)

## Visão Geral
A evolução da Fase F14 construiu um backend ontológico formidável: *Fingerprints*, *Harmonic DNA*, *Structural Skeletons*, *Attractors*, *Invariants* e *Drift Profiles*. No entanto, falta uma camada que sirva de ponte entre a produção ontológica bruta e a experiência do músico. 

A **F15 (Intelligence Delivery Layer)** é exatamente essa camada intermediária. Ela não cria novas análises, mas resolve o problema do "Delivery", transformando inteligência passiva em fluxos visuais bidirecionais (MuseScore ↔ Dashboard).

---

## 1. Auditoria de Entrega Ontológica (Ontology Delivery Audit)

Mapeamento do destino final de cada objeto do Core na camada de UX:

| Objeto F14 Core | Destino de Exibição (Dashboard) | Destino de Exibição (MuseScore) |
| :--- | :--- | :--- |
| **FunctionalFingerprint** | Inspector Paramétrico | - |
| **PhraseRole** / **HarmonicDNA** | Timeline de Estrutura Formal | Overlay Textual (`[OPENING]`, `[CADENTIAL]`) |
| **StructuralSkeleton** | Grafo de Pilares vs Ornamentos | Colorização de Notas (`Anchor` = Azul, etc) |
| **Attractors** | Painel de Mutações (Gravidade) | - |
| **Invariants** | Painel de Substituição Segura | - |
| **DriftProfile** | Avaliador de Impacto (Behavioral/Cosmetic)| Ícone de Alerta `⚠` no Compasso |
| **ExplanationReport** | Tradutor em Linguagem Natural | - |

> *Nota sobre Semantic PhraseRole*: O Core já calcula a tipagem da frase (OPENING, BODY, PRE_CADENTIAL, CADENTIAL, CLOSING, BRIDGE). O desafio da F15 é puramente expor essa inteligência nativamente.

---

## 2. Arquitetura de Estado: OntologySession

Em vez de troca esparsa de mensagens (HTTP REST), o Plugin e o Dashboard compartilharão um **Session State** constante através de WebSockets. 

```typescript
interface OntologySession {
  version: string;             // Ex: "15.0" - Essencial para versionar integrações futuras
  scoreId: string;
  
  // Elemento focal expandido (cursor/seleção)
  selectedElement: {
    type: "note" | "chord" | "measure" | "phrase";
    id: string;
  };
  
  // Análise Ativa Completa (Dashboard ↔ MuseScore)
  activeAnalysis?: {
    fingerprint?: FunctionalFingerprint;
    dna?: HarmonicDNA;
    skeleton?: StructuralSkeleton;
    attractor?: AttractorNode;
    invariant?: HarmonicInvariant;
    phraseRole?: PhraseRole;
  };
  
  // Modos interativos
  activeMutation?: MutationPlan;
  activeExplanation?: ExplanationReport;
}
```

Isso garante que:
1. O Músico seleciona uma nota no MuseScore (Atualiza `selectedElement`).
2. O WebSocket espelha no Dashboard React instantaneamente.
3. O Dashboard React atualiza a `activeAnalysis` no *Session State*.
4. O MuseScore visualiza as consequências automaticamente se necessário.

---

## 3. Protocolo de Comandos: Render vs Mutation

No fluxo WebSocket, a injeção na partitura é estritamente dividida:

### 3.1. Render Layer (RenderCommand)
Operações puramente visuais e reversíveis (Overlays da Ontologia).
```typescript
interface RenderCommand {
  measure: number;
  action: "color_notes" | "add_staff_text" | "clear_overlays";
  payload: any;
}
// Ex: { action: "add_staff_text", payload: "[CADENTIAL]" }
```

### 3.2. Mutation Layer (MutationCommand)
Operações destrutivas na partitura, geradas pela aceitação de um Workflow de Substituição.
```typescript
interface MutationCommand {
  measure: number;
  action: "replace_symbol" | "rewrite_voicing";
  payload: any;
}
// Ex: { action: "replace_symbol", payload: "Db7" }
```

---

## 4. O Mapa de Prioridades Estratégicas

Para evitar a "Montanha de Inteligência Invisível", a ordem de implementação será rígida. Antes mesmo de iniciar a F15, formalizaremos a última peça ontológica.

### Pré-requisito: F14-A6.8 — Phrase Role Engine
- Criação de um módulo formal para `PhraseRole` (`Opening`, `Body`, `PreCadential`, `Cadential`, `Closing`, `Bridge`).
- O elo final semântico para a interface e os Attractors.

### Prioridade 1: F15.1 — Protocol Upgrade
- Migração para **WebSocket**.
- Instanciação do `OntologySession` com Versionamento.
- Camadas `RenderCommand` e `MutationCommand`.

### Prioridade 2: F15.2 — Cursor Sync
- O Dashboard React reage em tempo real à seleção no MuseScore (`selectedElement`).

### Prioridade 3: F15.3 — MuseScore Canvas
- O Plugin QML consome `RenderCommands`.
- Colorização estrutural e Overlays textuais (DNA, Drift).

### Prioridade 4: F15.4 — Substitution Workflow
- O usuário seleciona um acorde. O Dashboard mostra mutações.
- Confirmação dispara um `MutationCommand` na partitura.

### Próximas Fases (Bloqueadas até F15)
- **F14-A7** — Attractors
- **F13-A3** — Route Mutation
