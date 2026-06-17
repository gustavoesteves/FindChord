# RFC: F13-A1 — Harmonic Possibility Explorer
*De Analisador Harmônico para Laboratório Criativo Guiado por Melodia.*

## 1. O Ponto de Inflexão (A Mudança de Pergunta)
O sistema atingiu a maturidade máxima em sua capacidade de descrever o passado ("O que aconteceu?"). Empilhar novas abstrações de identidade ("Quem essa peça é?") torna-se secundário perante a dor principal de um compositor: **"Quais são as possibilidades escondidas dentro desta frase?"**

A F13-A1 opera a grande transição de um sistema *descritivo* para um sistema *generativo-criativo*, sem contudo tentar "corrigir" o usuário. O objetivo não é encontrar a versão "melhor", mas revelar **possibilidades harmônicas latentes** compatíveis com a mesma melodia.

## 2. Princípios Fundamentais
### 2.1 A Melodia é Soberana
Toda alternativa proposta deve respeitar notas estruturais, direção melódica e manter estabilidade mínima entre melodia e harmonia. A melodia é tratada como a restrição física principal.

### 2.2 O Sistema não Corrige, Revela
O motor não dita "Aqui deveria ser um Fmaj7". Ele afirma: "Esta frase admite outras leituras harmônicas", e apresenta vetores de exploração.

### 2.3 O Sistema não Fala sobre Gênero (Abolição de Rótulos Estilísticos)
Nenhuma sugestão utilizará conceitos culturais como "Jazz", "Rock", "Clássico" ou "Cinemático". Tais rótulos misturam harmonia com produção e estética. Toda a exploração permanecerá no rigoroso domínio da teoria musical (ex: *Mais Cromático*, *Mais Expansivo*).

## 3. A Nova Arquitetura de Motores (F13)

### 3.2 Phrase Function Engine
Antes de sugerir alternativas, o sistema precisa entender a função estrutural: `Estabelecimento -> Prolongamento -> Dominante`.

### 3.3 Harmonic Intent Engine (A Intenção Oculta)
Mesmos acordes podem ter propósitos diferentes. Este motor infere o que o compositor está tentando realizar antes de alterar a harmonia.
- *Caso A:* Quero chegar na dominante.
- *Caso B:* Quero manter estabilidade.
- *Caso C:* Quero criar tensão crescente.

### 3.4 Harmonic Region Engine (A Unidade de Pensamento)
O compositor não pensa em acordes soltos, ele pensa em trechos. O sistema agrupará a frase em blocos funcionais (Regiões).
- **Região de Estabelecimento** (`C -> Am -> F`)
- **Região Predominante** (`Dm -> F`)
- **Região Dominante** (`G7 -> G7sus -> G13`)
- **Região Cadencial** (`ii -> V -> I`)
A substituição passará a ocorrer no nível da **Região**, não do acorde.

### 3.5 Harmonic Compatibility Engine
Valida a compatibilidade entre a melodia soberana e a harmonia subjacente. Detecta atritos estruturais severos e pontua a tensão geral.

### 3.6 Harmonic Possibility Engine
O novo motor principal. Ele consome a `MelodicPhrase`, a harmonia original, as Regiões e a `HarmonicIntent` para gerar leituras alternativas da mesma frase. As explorações não são rotuladas por estética, mas por comportamento harmônico direto.

## 4. Exploração Formal (F13-A3: Section Reharmonization)
Quando houver repetições formais (`A` e `A'`), o sistema analisa se a segunda ocorrência admite interpretação harmônica diferente mantendo a melodia intacta.
- Exemplo A: `C → Am → G7`
- Exemplo A': `Cmaj7 → Am9 → G13`

## 5. Redesenho da UI (ScoreAnalysisDashboard)
A UI passa a focar no fluxo criativo e empurra ferramentas de "inspeção dura" para segundo plano. A arquitetura passa a servir às escolhas do compositor.

### Núcleo Principal (Painel de Possibilidades Guiado por Intenção)
1. **O que você quer mudar?** (Interface central interativa)
   - `[ ] Mais estabilidade`
   - `[ ] Mais tensão`
   - `[ ] Mais surpresa`
   - `[ ] Mais movimento`
   - `[ ] Mais ambiguidade`
   - `[ ] Mais direção`
2. **Narrativa Harmônica (Encurtada):** Muito resumida. Ex: *"Função da frase: Estabelece o centro tonal e cria expectativa de resolução."*
3. **Curva Dramática:** Apenas suporte visual simplificado para as flutuações de tensão.

### Abas Separadas / Modos
A partir de agora, o Find Chord separa o **Compositor (Análise Criativa)** do **Professor (Auditoria/Teoria)**.
1. **Estrutura Formal:** (Oculto / Modo Acadêmico).
2. **Auditoria / Linter:** (Aba separada para o "Professor").
3. **Métricas Epistêmicas.**

## 6. Critérios de Sucesso e Explicabilidade
1. **Frase simples:** O sistema produz múltiplas leituras harmônicas (Expansivas, Cromáticas, etc.) perfeitamente compatíveis com a melodia.
2. **Explicabilidade baseada em Intenção:** Todas as alternativas justificam suas trocas sob o seguinte formato composicional:
   - *O que foi preservado* (ex: "direção para um ponto de resolução")
   - *O que foi alterado* (ex: "centro tonal percebido")
   - *Efeito produzido* (ex: "sensação de deslocamento e expansão")
3. **Material repetido:** O sistema propõe de forma orgânica alternativas texturais para reapresentações (A').
4. **Restrição Física:** Nenhuma sugestão entra em conflito com a melodia estrutural analisada.
