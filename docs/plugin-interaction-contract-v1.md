# Find Chord Plugins Interaction Contract v1

Este documento estabelece as regras de governança de dados, limites de atuação e especificação funcional para os plugins do ecossistema do Find Chord no MuseScore. O objetivo é garantir que cada interface (Builder, Inspector, Narrative) atue em sua respectiva camada conceitual sem corromper a integridade de dados analíticos ou invadir territórios de responsabilidade alheia.

---

## 🛡️ Matriz de Responsabilidade e Permissões (Read/Write/Trigger)

| Plugin | Nível de Atuação | Modelos Consumidos (Read) | Modelos Produzidos (Write) | Modifica Notas da Partitura? |
| :--- | :--- | :--- | :--- | :--- |
| **Builder (Plugin A)** | Captura & Transcrição (Input) | `Tuning` / `Instrument` | `CanonicalChordEvent` (somente campos físicos e cifra) | **Sim (Escrita de Notas e Diagramas)** |
| **Explorer (Plugin/Tab)** | Busca & Navegação de Voicings | `CanonicalChordEvent` | Voicings e digitações alternativas selecionadas | **Não (Dispara escrita via Builder)** |
| **Inspector (Plugin B)**| Diagnóstico & Rearmonização | `CanonicalChordEvent[]` / `CanonicalProgressionEvent` | Anotações, alertas de paralelismo, substituições locais e rearmonizações conceituais | **Não (Somente overlays, alterações disparadas pelo Builder)** |
| **Narrative (Plugin C)**| Interpretação Metateórica | `CanonicalProgressionEvent[]` / `CanonicalScoreEvent` | Textos explicativos e narrativa metateórica | **Não (Apenas painel lateral descritivo de texto)** |
| **Performer (Plugin D)**| Ergonomia & Prática (Opcional) | `CanonicalChordEvent` / `CanonicalProgressionEvent` | Digitação sugerida, caminhos físicos e modelagem de tensão da mão | **Não (Visualização de auxílio ao estudo)** |

---

## 📥 1. Builder (Plugin A) — O Capturador e Transcritor Assistido
O Builder é a camada de **entrada e captura física assistida** (Input Layer). A premissa central de design do Builder é:
> **Builder ≠ Compositor | Builder = Transcritor Inteligente**

Seu objetivo exclusivo é responder à pergunta do músico: *"Já toquei/compus isso no instrumento. Como coloco isso na partitura em 3 segundos?"*. Ele não deve sugerir o que tocar, apenas capturar.

*   **Fluxo do Músico**:
    1.  O músico está com o instrumento no colo (guitarra, violão, baixo, cavaquinho, etc.).
    2.  Cria ou executa um voicing físico.
    3.  Abre a interface do Builder (braço/fretboard virtual).
    4.  Desenha a digitação/voicing clicando nas cordas e casas correspondentes.
    5.  O plugin reconhece as notas, a cifra, a inversão, o voicing e as cordas utilizadas, inserindo automaticamente na partitura:
        *   Cifra (ex: `Cmaj7`)
        *   Grade/diagrama de acordes (Chord Grid)
        *   Notas físicas reais na pauta (Voices)
        *   Tablatura alinhada (opcional)
        *   Metadados ricos ocultos do Find Chord (`CanonicalChordEvent`)

*   **Recursos de Produtividade**:
    *   **Capturados Recentemente**: Histórico dinâmico de acordes capturados e inseridos nesta sessão.
    *   **Biblioteca**: Banco de dados pessoal de formas e acordes nomeados do usuário.
    *   **Favoritos**: Lista de atalhos rápidos de formas.
    *   **Importação / Exportação**: Capacidade de importar/exportar formas em JSON.

*   **Poder de Escrita**:
    *   Modifica diretamente notas, cifras e tablaturas na partitura.
    *   Gera e escreve o objeto `CanonicalChordEvent`.

---

## 🗺️ 1.5 Explorer — O Google Maps de Voicings
O Explorer é a ferramenta dedicada de **busca, comparação e navegação entre voicings**. Ele atua como um navegador de possibilidades harmônicas a partir de um acorde inicial.

*   **Fluxo do Músico**:
    1.  Desenha ou seleciona um acorde (ex: `Cm11`).
    2.  O Explorer calcula e exibe centenas de voicings possíveis com base em filtros avançados de busca:
        *   Tensão harmônica.
        *   Abertura (largura estrutural).
        *   Facilidade física (ergonomia).
        *   Voice leading ideal em relação ao contexto.
        *   Região do braço (casas específicas).
        *   Tipos formais: *Drop 2*, *Drop 3*, *Quartais*, *Clusters*, etc.
    3.  Ao escolher um voicing alternativo, ele transfere a digitação física para o Builder, que realiza a transcrição na partitura.

---

## 🔍 2. Inspector (Plugin B) — O Diagnosticador e Linter Harmônico
O Inspector atua como o motor de inteligência analítica do ecossistema, auditando e sugerindo caminhos sobre o que já foi escrito na partitura. Ele responde a: *"O que eu escrevi faz sentido?"* e *"O que mais poderia acontecer?"*.

O Inspector é estruturado em **4 níveis de análise e sugestão**:

### Nível 1 — Diagnóstico
Mapeia o estado harmônico e expõe as métricas brutas em tempo real:
*   **Voice Leading Score** da transição (facilidade física e linearidade).
*   **Curva de Tensão** física e harmônica.
*   **Centro tonal** estimado.
*   **Leis Universais** ativas.

### Nível 2 — Explicação
Traduze os comportamentos e resoluções do diagnótico em descritores claros:
*   *Exemplo*: `G7 → Cmaj7`
    *   "Resolução funcional forte."
    *   "Ativação da lei de atração cromática."
    *   "Voice Leading: 0.92"

### Nível 3 — Sugestões Locais
Sugere substituições harmônicas pontuais para a transição, guiadas **estritamente por paradigmas teóricos puros**, sem misturar nomes de estilos ou gêneros (como Jazz, Bossa, Rock, etc.):
*   *Exemplo para o próximo acorde*:
    *   **Funcional**: `Dm7` (resolução tonal tradicional/cadência)
    *   **Transformacional**: `Abmaj7` (operação parsimoniosa de voz)
    *   **Simétrica**: `Db7` (substituição de trítono / eixos)
    *   **Linear**: `Em7` (movimento linear passo a passo)
    *   **Modal**: `Dbm7` (empréstimo de escala paralela)

### Nível 4 — Rearmonização
Permite selecionar um bloco (ex: 8 compassos) e obter propostas de rearmonização completas que **preservam a melodia**, estruturadas pelos autores e correntes clássicas dos paradigmas:
*   **Versão Funcional** (Rameau / Schoenberg)
*   **Versão Transformacional** (Cohn)
*   **Versão Simétrica** (Lendvai)
*   **Versão Linear** (Tymoczko)
*   **Versão Modal** (Intercâmbio modal de escalas)

---

## 📖 3. Narrative (Plugin C) — O Intérprete Metateórico
O Narrative realiza a leitura musicológica profunda da peça a nível macro, decodificando e descrevendo as intenções do compositor em formato textual descritivo. Ele responde a: *"O que essa música está contando harmonicamente?"*.

Em vez de listar os acordes sequencialmente (`Cmaj7 → Am7`), ele gera análises como:
*   *"A peça inicia em estabilidade. O centro tonal é gradualmente enfraquecido. A seção B introduz tensão simétrica. A resolução final restaura parcialmente a gravidade funcional."*
*   *"Esta obra utiliza uma estratégia transformacional. O compositor privilegia continuidade de vozes em vez de resolução tonal."*
*   Exibe o **Paradigma Dominante** da peça com base no motor metateórico (ex: `Neo-Riemanniano | Confiança: 87%`).

---

## 🔮 4. Fase F13 — Camada de Estilo (Futuro)
Para garantir a consistência científica, toda análise de gênero (Jazz, Bossa Nova, Debussy, Bill Evans, Tom Jobim) é isolada e postergada para a **Fase F13**. Essa camada analisará as semelhanças de vocabulário estilístico do usuário com grandes nomes e épocas da música, mas sem poluir os paradigmas harmônicos estruturais do Inspector e da Core API v1.

---

## 🔄 Fluxo de Invalidação de Cache e Recalculação

```
   [Compositor altera uma nota manualmente no MuseScore]
                           ↓
   [Dispara Trigger de Invalidação do Nó de Acorde Modificado]
                           ↓
  [Campos analíticos (laws, score, mechanisms) são limpos (null)]
                           ↓
  [Plugin aciona requisição silenciosa de reanálise ao Engine]
                           ↓
 [Engine recalcula transições e popula novos scores e metadados]
                           ↓
      [Metadados canônicos atualizados são persistidos no score]
```

Este protocolo impede redundâncias de cálculo e garante que o MuseScore atue puramente como renderizador gráfico e controlador de entrada física de notas.
