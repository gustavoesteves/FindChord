# RFC: F13-A1 — Melody-Aware Contextual Reharmonization
*De Analisador Harmônico para Laboratório Criativo Guiado por Melodia.*

## 1. O Ponto de Inflexão (A Mudança de Pergunta)
O sistema atingiu a maturidade máxima em sua capacidade de descrever o passado ("O que aconteceu?"). Empilhar novas abstrações de identidade ("Quem essa peça é?") torna-se secundário perante a dor principal de um compositor: **"O que mais essa música poderia ser, mantendo a mesma melodia?"**

A F13-A1 opera a grande transição de um sistema *descritivo* para um sistema *generativo-criativo*.

## 2. O Problema Atual
Hoje, as rearmonizações propostas:
- Analisam acordes isoladamente.
- Ignoram a melodia (causando atritos como substituir `C` por `Cmaj7` enquanto a melodia canta um `C natural`... não, pera, um `C` com melodia em `C` não aceita `B` tão bem sem causar m9, por exemplo).
- Ignoram a frase: rearmonizam eventos soltos, não a cadência global.
- Não reinterpretam o material em repetições formais (A vs A').

## 3. A Nova Arquitetura de Motores (F13)
A arquitetura ganha quatro novos motores vitais focados na restrição física primária da música: a **Linha Melódica**.

### 3.1 Melody Extraction Engine
Conecta-se ao MuseScore/MidiTrackBuilder para extrair a linha "lead".
- Identifica **notas estruturais** (tempo forte, longa duração).
- Identifica **notas de passagem**.
- Gera o `MelodicPhrase` (perfil da frase melódica).

### 3.2 Melodic Compatibility Engine
Filtra a "Frente de Pareto" do otimizador atual contra a melodia real.
- Determina se um acorde sugerido colide em dissonância fatal (ex: b9) com uma nota estrutural melódica.
- Mede tensão e consonância da relação melodia-harmonia.
- Output: `CompatibleHarmonySet[]`

### 3.3 Phrase Reharmonization Engine
Destrói o conceito de "trocar acorde por acorde". Passa a fornecer rotas completas de frases.
**Exemplo (Melodia: E - D - C):**
- *Original*: C → Am → G7
- *Modal*: Cmaj7 → Fmaj7(#11) → G7sus4
- *Jazz*: Cmaj9 → A7alt → Dm9 G13

### 3.4 Section Reharmonization Engine
Detecta repetições formais (`A` e `A'`).
Se a seção `A` repete, o motor automaticamente propõe uma roupagem re-harmonizada para `A'` que mantenha a melodia idêntica mas incremente o *Behavior* (expansão/volatilidade).

## 4. Redesenho da UI (ScoreAnalysisDashboard)
A UI atual é acadêmica demais. Ela deve ser focada no fluxo criativo.

### O que Fica e Ganha Destaque
1. **Exploração Harmônica**: Passa a ser o coração do Dashboard (as alternativas de rearmonização).
2. **Narrativa**: Torna-se curta, direta e pragmática ("Estabelece o tom e cria expectativa para a dominante").
3. **Curva Dramática**: Substitui os gráficos matemáticos frios. Mostra: "Compasso 3: Pico dramático da frase com o acorde dominante."

### O que Sai (Move para Advanced/Academic Mode)
1. **Estrutura Formal** ("Frase 1, Período Autêntico"): Baixo valor criativo imediato.
2. **Auditoria / Linter**: Move para Developer Mode. A auditoria (quintas paralelas) é secundária à exploração criativa inicial.

## 5. Critérios de Sucesso
- Dada uma melodia simples (`E D C`) sobre `C -> Am -> G7`, o sistema gera no mínimo 3 alternativas fluidas de frase completa, 100% sem conflitos com as notas estruturais.
- Em formas `A - A'`, o sistema varia a segunda exposição.
- A UI passa a dar vontade de compor, não apenas de estudar.
