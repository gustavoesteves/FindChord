# Performance Report — F11-AUD
**Empirical Benchmarks, Scaling Limits & Algorithmic Complexity**

Este relatório documenta os testes de escala agressivos realizados no motor harmônico do **Find Chord**, identificando limites físicos de memória RAM (V8 Heap) e gargalos de processamento.

---

## 1. Tabela Comparativa de Escala e Performance

Os testes foram executados localmente utilizando progressões sintéticas lineares variando de 50 a 10.000 acordes. O comportamento foi medido em duas condições:
1. **Raw Viterbi Pipeline**: Resolução global de caminhos sem o cálculo de estabilidade contrafactual.
2. **Full Pipeline**: Pipeline completo, incluindo perturbações contrafactuais e causalidade.

| Tamanho (Acordes) | CPU Raw Viterbi | RAM Raw Viterbi (Heap) | CPU Full Pipeline | RAM Full Pipeline (Heap) | Status do Teste / Observações |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **50** | 167 ms | 58 MB | 26.9 s | 112 MB | **Sucesso**: Comportamento estável, mas latência do loop contrafactual já é perceptível. |
| **500** | 1.48 s | 245 MB | > 10 min (Aborted) | > 1.2 GB | **Estouro de CPU**: O loop contrafactual inviabiliza a execução do pipeline completo. |
| **5.000** | Crash (OOM) | > 1.8 GB | Crash (OOM) | > 1.8 GB | **Falha por Memória**: O Raw Viterbi estoura o heap padrão do V8 e causa travamento. |
| **10.000** | Crash (OOM) | > 1.8 GB | Crash (OOM) | > 1.8 GB | **Falha por Memória**: Travamento instantâneo do Node.js por falta de memória na pré-alocação. |

---

## 2. Análise Assintótica e Complexidade de Algoritmos

### Raw Viterbi: Complexidade Linear de Caminho $O(N \cdot K^2)$

O resolvedor de caminho global Viterbi percorre a progressão sequencialmente. Para $N$ acordes e $K$ estados candidatos (onde $K = 27$ no Find Chord):
* A complexidade teórica de tempo é linear com relação ao tamanho da peça: $O(N \cdot K^2)$.
* **O Gargalo de RAM**: Embora o tempo de processamento escale de forma linear (como visto no teste de 500 acordes com $1.48\text{ s}$), a decisão de pré-calcular e manter em cache todas as interpretações locais de acordes para cada chave gera um consumo excessivo de memória de $O(N \cdot K)$ objetos complexos do tipo `FunctionalChord`. Aos 2.000 acordes, esse cache atinge $802\text{ MB}$, estourando o heap do Node.js nos 5.000 acordes.

### Estabilidade Contrafactual: Complexidade Quadrática $O(M \cdot N^2)$

O motor de estabilidade e causalidade (`computeStabilityAndCausality`) realiza perturbações em tempo de execução para verificar o impacto de cada alteração:
1. O motor faz um loop sobre todos os acordes da progressão ($N$ iterações).
2. Para cada acorde $i$, gera $M$ perturbações físicas (onde $M = 4$ mutações por acorde: exclusão, substituição, modal e trítono).
3. Para cada perturbação gerada, realiza-se uma execução recursiva completa da análise de Viterbi de tamanho $N$.

Isso resulta em uma complexidade de tempo de:

$$\text{Complexidade de Tempo} = O(N \times M \times N) = O(M \cdot N^2)$$

Como $M$ é constante ($4$), a complexidade é puramente **quadrática $O(N^2)$**.

> [!WARNING]
> **Diagnóstico (Criticidade: P1)**: O algoritmo de estabilidade contrafactual é impraticável para uso em produção com progressões de tamanho médio a grande. Uma progressão simples de 500 acordes (tamanho comum em partituras de jazz ou clássicas exportadas) levaria mais de 10 minutos para concluir a análise, bloqueando a interface do usuário e o plugin QML.

---

## 3. Diagnóstico de Gargalos (Memória e Processamento)

1. **Vazamento na Pré-Alocação de Chaves**: O orquestrador pré-analisa todas as opções de acordes nas 27 chaves de forma eager (antecipada) em vez de lazy (sob demanda).
2. **Avaliação Contrafactual Recursiva Completa**: Em vez de recalcular apenas a vizinhança do acorde mutado, o sistema executa o Viterbi em toda a partitura novamente, descartando o estado anterior.
3. **Falta de Compressão de Dados**: Os objetos persistidos no cache contêm dados redundantes de depuração (por exemplo, strings explicativas geradas previamente repetidas vezes) que nunca são limpos antes do fechamento do pipeline.
