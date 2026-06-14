# Filosofia do Builder — Diretriz de Governança de Produto

Este documento formaliza a filosofia de design e as regras de governança para o desenvolvimento do componente **Builder** (Aba de Criação/Edição de Acordes e Voicings) no ecossistema do **Find Chord**.

---

## 1. O Princípio Core: Builder = Transcritor Mecânico

A premissa fundamental do Builder é a **fidelidade mecânica**. O Builder deve agir estritamente como um digitalizador ou transcritor de voicings:
*   **Captura Passiva**: O usuário seleciona trastes, cordas e notas no braço interativo (fretboard) ou teclado virtual. O Builder registra e traduz essa entrada física diretamente em um vetor de notas MIDI e posições de trastes (`voicing.notes` e `voicing.frets` no `CanonicalChordEvent`).
*   **Ausência de Iniciativa**: O Builder não sugere modificações, não corrige notas "erradas" e não impõe regras de condução de voz durante a digitação.

---

## 2. Blindagem Contra Inteligência Artificial e Sugestões

> [!WARNING]
> **Regra de Produto**: É terminantemente proibido o acoplamento de motores de sugestão automática baseados em IA, redes neurais ou regras gerativas dentro do escopo do Builder.

### Raciocínio de Arquitetura:
1.  **Separação de Preocupações (Separation of Concerns)**: A inteligência musical do Find Chord está encapsulada nos motores analíticos (`resolveGlobalPath`, `ConsensusModelingEngine`, etc.). O Builder deve permanecer limpo de lógica interpretativa para garantir portabilidade e estabilidade de entrada.
2.  **Controle do Compositor**: O Builder é o espaço onde o usuário expressa sua intenção bruta (o que ele tocou ou deseja escrever). Adicionar sugestões automáticas neste ponto gera ruído de experiência e remove a agência artística do usuário.
3.  **Complexidade Desnecessária**: Acoplar motores gerativos de voicings ao Builder aumenta a complexidade de renderização e introduz lag de digitação no editor de partituras (um risco de manutenibilidade severo).

---

## 3. Divisão de Responsabilidades no Ecossistema F12

O ecossistema é dividido em papéis claros:

| Papel | Onde Ocorre | O que Faz |
| :--- | :--- | :--- |
| **Transcrição** | `Builder` | Captura exatamente as cordas pressionadas e envia o `CanonicalChordEvent`. |
| **Análise** | `Viterbi / Core` | Lê os eventos do Builder e calcula funções harmônicas, tonalidades e graus. |
| **Sugestão Criativa** | `Reharmonizer / Inspector` | Propõe novos voicings ou substituições de acordes (sem alterar a entrada bruta do Builder até que o usuário aprove). |

---

## 4. Diretrizes de Interface (UI/UX)

*   **Responsividade Física**: Cliques no fretboard devem atualizar a representação sonora e MIDI instantaneamente (latência < 15ms).
*   **Validação Visual Passiva**: O Builder pode exibir estatísticas do acorde desenhado (ex: nome inferido do acorde pela biblioteca `tonal`, notas ativas), mas essa informação é estritamente informativa e não-bloqueante. O usuário é livre para registrar um "acorde impossível" ou sem nome formal na teoria tradicional.
*   **Foco em Acessibilidade**: O Builder deve suportar diferentes afinações (`tuning`) e número de cordas, delegando o cálculo de notas correspondentes a utilitários puros de teoria física de cordas.
