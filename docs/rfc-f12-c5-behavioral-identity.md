# RFC: Arquitetura Ontológica (F12-C5 a F12-C8)
*De Analisador Harmônico a Simulador de Identidade Composicional.*

## 1. O Problema Histórico
Até a F12-C4, o sistema tratava a música primariamente através de observações (O que está acontecendo?) e trajetórias (Como isso evolui?).
Embora o `Arc` seja um avanço formidável, ele possui um teto de vidro metodológico: **múltiplas músicas completamente distintas podem gerar o exato mesmo Arco.**
Um Mozart heroico, um Debussy contemplativo e um Brubeck repetitivo podem todos iniciar em `ESTABLISHMENT`, migrar para `DESTABILIZATION` e finalizar em `RESOLUTION`.

A resposta para contornar isso não reside em gerar "mais motores factuais", mas em construir a pirâmide da **Emergência**.

## 2. O Pipeline Fenomenológico Final
A evolução da arquitetura do ecossistema Find Chord está pavimentada da seguinte forma:

| Nível / Sprint | Camada | Pergunta que responde | Exemplo de Output |
| :--- | :--- | :--- | :--- |
| **Nível 1** | **Facts** | O que aconteceu? | *Empréstimo modal (bVI)* |
| **Nível 2** | **Meaning** | O que isso produz localmente? | *Ruptura de fundação diatônica* |
| **F12-C4** | **Arc** | Em que ordem isso acontece? | *ESTABLISHMENT -> DESTABILIZATION* |
| **F12-C5** | **Behavior** | Que padrão emerge dessa sequência? | *Perfil Acumulativo (expansão vetorial)* |
| **F12-C6** | **Temporal Profile**| Qual a dinâmica no tempo? | *Curta duração, mudanças frenéticas* |
| **F12-C7** | **Identity Traits** | Como isso se traduz psicologicamente? | *Alta exploração, baixo ritualismo* |
| **F12-C8** | **Identity** | Quem essa música é? | *Heroica, Teleológica, Contemplativa* |
| **F12-C9** | **Style Fingerprint**| Com quem ela se parece? | *"Aja mais como Ravel do que Chopin"* |

## 3. As Sprints de Emergência

### F12-C5: Emergent Harmonic Behavior
Modelagem baseada em **vetores**, não rótulos. O sistema medirá métricas contínuas (`recurrence`, `expansion`, `volatility`, `cohesion`) a partir dos arcos, para deduzir o Comportamento (ex: *Cíclico*, *Centrífugo*).

### F12-C6: Temporal Profile Engine
O comportamento de uma música não vem apenas da harmonia, mas do tempo. Uma mesma fase de `FRAGMENTATION` de 2 compassos ou de 80 compassos geram perfis completamente díspares.
Vetores alvo:
- **Duração média de fase**
- **Velocidade de mudança (Pace)**
- **Periodicidade e Assimetria Temporal**

### F12-C7: Identity Traits Engine
Impede o erro de rotulação precoce ("Essa música é Heróica"). Traduz a combinação de `Behavior` e `Temporal Profile` em uma malha de traços contínuos.
```typescript
interface IdentityTraits {
  persistence: number;
  exploration: number;
  certainty: number;
  ritualism: number;
  impulsiveness: number;
  gravity: number;
}
```

### F12-C8: Compositional Identity Engine
O clímax da abstração musical. O motor consome os Traços (Traits) para descobrir "A Alma da Obra".
- **Identidade Teleológica**: Alto direcionamento, persistência e gravidade (ex: Sinfonias Clássicas).
- **Identidade Contemplativa**: Alto ritualismo, exploração difusa, baixa certeza (ex: Ambient, Satie).
*Evolução Epistêmica:* Os motores antigos da trilha metateórica (`TheoryDiscoveryEngine`, `OntologyTournamentEngine`) serão redirecionados. Em vez de descobrir teorias harmônicas, eles executarão Machine Learning não-supervisionado para **clusterizar e descobrir novas identidades** (agrupando Mahler, Bruckner e Sibelius em clusters comportamentais autônomos que musicólogos ainda nem nomearam).

### F12-C9: Style Fingerprint Engine
Com a Identidade parametrizada, o sistema entra na fase comparativa. Ele consegue afirmar: *"Seus acordes e sua métrica são pop, mas a simetria de comportamento e a coesão de memória são estritamente Bachianas."*
Esta é a ferramenta definitiva para o Compositor/Estudante e o coração absoluto do assistente criativo de `Reharmonization` guiado por Identidade.

## 4. Conclusão
Com a pavimentação de F12-C5 a F12-C8, o Find Chord rompe a barreira tradicional de "analisador harmônico". A arquitetura consolida-se oficialmente como um **Sistema de Modelagem de Comportamento Musical**.
