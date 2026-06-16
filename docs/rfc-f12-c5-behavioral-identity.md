# RFC: F12-C5 — Emergent Harmonic Behavior

## 1. O Problema Ontológico
As versões anteriores do motor (F12-C1 a F12-C4) estabeleceram a seguinte taxonomia temporal:
`Facts -> Meaning -> Arc -> Narrative`

O **Arc** resolve o problema do "estado estático", transformando-o em "linha do tempo" (ex: `ESTABLISHMENT -> DESTABILIZATION -> RESOLUTION`). 
Contudo, o Arc é linear e reducionista. Ele falha em capturar o **padrão fractal** da peça. Uma peça que repete o mesmo arco 10 vezes (como *Take Five*) e uma peça que executa esse arco uma única vez em 10 minutos (como *Boléro*) gerarão o mesmo Arc.

O Arc descreve **em que ordem os eventos acontecem**, mas não descreve **que tipo de movimento essa ordem produz**.

## 2. A Solução: Vetores Comportamentais (Behavior)
Se modelarmos o Behavior como classificadores literais (`type Behavior = "CYCLIC" | "ACCUMULATIVE"`), cometeremos o mesmo erro do passado (rotulação forçada). 

A inovação central desta RFC é modelar o Comportamento Harmônico como uma **Matriz de Vetores Contínuos**.

```typescript
export interface BehavioralProfile {
  recurrence: number;       // O quanto a obra itera sobre os mesmos arcos (ex: 0.95 em obras cíclicas)
  expansion: number;        // O quanto a energia estrutural cresce ao longo do tempo (ex: 0.90 no Boléro)
  volatility: number;       // A frequência e severidade de quebras da inércia (ex: alta em Debussy)
  directionalForce: number; // Força gravitacional empurrando em uma direção (ex: alta em peças teleológicas clássicas)
  symmetry: number;         // Equilíbrio estrutural de proporções de tempo entre Fases e Seções
  cohesion: number;         // "Memória" da peça: o quanto o material harmônico anterior continua relevante (alta = material reutilizado; baixa = abandono constante)
}
```

Diferente do Compiler atual, o `BehaviorEngine` não dependerá unicamente da ordem do Arco. Sua inferência será multidimensional:

```typescript
function inferBehavior(arc: GlobalHarmonicArc, durations: DurationData, transitions: TransitionScale): BehavioralProfile
```

## 3. O Novo Pipeline
A hierarquia fenomenológica final do sistema torna-se:

1. **Facts**: "O que está acontecendo fisicamente?" *(Acordes, Funções)*
2. **Meaning**: "O que isso significa isoladamente?" *(Estabelece, Modula)*
3. **Arc**: "Em que ordem essas coisas acontecem?" *(ESTABLISHMENT -> DESTABILIZATION -> RESOLUTION)*
4. **Behavior**: "Que tipo de movimento essa sucessão de arcos e tempos gera?" *(Vetores: alta recorrência, baixa volatilidade)*
5. **Narrative Compiler**: "Como eu conto a história dessa obra baseada em seu comportamento vetorial?"

### Behavior ≠ Composer Identity
*Nota ontológica crucial:* "Comportamento Acumulativo" não é a assinatura completa de um compositor. Ravel, John Williams e Mahler podem ter comportamentos acumulativos. A verdadeira **Identidade Composicional** surgiria apenas no futuro, em uma camada que soma: `Behavior + Harmonic Language + Formal Design + Rhythmic Organization`. Por isso, esta camada isola estritamente o *Comportamento Emergente*.

## 4. Conclusão
Ao separar o `Arc` (resumo da ordem) do `Behavior` (percepção emergente do movimento gerado por essa ordem, suas durações e transições), a arquitetura consolida sua primeira camada de verdadeira **Emergência**. 

Esta RFC permite que o sistema distinga duas obras que possuem os exatos mesmos fatos e arcos harmônicos, apenas por avaliá-las sob a ótica de vetores como *cohesion* (memória) e repetição.
