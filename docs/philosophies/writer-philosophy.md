# Filosofia do Escrever — Diretriz de Governança de Produto

Este documento formaliza a filosofia de design e as regras de governança para a tela **Escrever** no ecossistema do **Find Chord**.

---

## 1. O Princípio Core: Escrever = Transcritor Mecânico

A premissa fundamental do Escrever é a **fidelidade mecânica**. A tela deve agir como um digitalizador ou transcritor de voicings:
*   **Captura Passiva**: O usuário seleciona trastes, cordas e notas no braço interativo. O sistema registra e traduz essa entrada física diretamente em notas MIDI e posições de trastes.
*   **Ausência de Iniciativa**: O Escrever não sugere modificações, não corrige notas "erradas" e não impõe regras de condução de voz durante a digitação.

---

## 2. Blindagem Contra Inteligência Artificial e Sugestões

> [!WARNING]
> **Regra de Produto**: É terminantemente proibido o acoplamento de motores de sugestão automática baseados em IA, redes neurais ou regras gerativas dentro do escopo do Escrever.

### Raciocínio de Arquitetura:
1.  **Separação de Preocupações (Separation of Concerns)**: A inteligência musical do Find Chord vive na tela Harmonizar e nos motores de análise/estratégia. O Escrever deve permanecer limpo de lógica gerativa para garantir estabilidade de entrada.
2.  **Controle do Compositor**: O Escrever é o espaço onde o usuário expressa sua intenção bruta (o que ele tocou ou deseja escrever). Adicionar sugestões automáticas neste ponto gera ruído de experiência e remove a agência artística do usuário.
3.  **Complexidade Desnecessária**: Acoplar motores gerativos de voicings ao Escrever aumenta a complexidade de renderização e introduz lag de digitação no editor de partituras (um risco de manutenibilidade severo).

---

## 3. Divisão de Responsabilidades

O ecossistema é dividido em papéis claros:

| Papel | Onde Ocorre | O que Faz |
| :--- | :--- | :--- |
| **Transcrição** | `Escrever` | Captura exatamente as cordas pressionadas e envia o acorde quando solicitado. |
| **Análise de partitura** | `Harmonizar` | Lê melodia/cifras do MuseScore e organiza propostas por estratégia. |
| **Rearmonização** | `Harmonizar` | Propõe alternativas sem alterar a entrada bruta do Escrever até que o usuário aplique. |

---

## 4. Diretrizes de Interface (UI/UX)

*   **Responsividade Física**: Cliques no fretboard devem atualizar a representação sonora e MIDI instantaneamente (latência < 15ms).
*   **Validação Visual Passiva**: O Escrever pode exibir estatísticas do acorde desenhado (ex: nome inferido, intervalos e notas ativas), mas essa informação é estritamente informativa e não-bloqueante.
*   **Foco em Acessibilidade**: O Escrever deve suportar diferentes afinações e número de cordas, delegando o cálculo de notas correspondentes a utilitários puros de teoria física de cordas.
