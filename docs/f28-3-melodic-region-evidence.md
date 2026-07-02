# F28.3 — Evidência Melódica de Região Funcional

## Objetivo

Reduzir a mecanicidade do planejador de regiões funcionais usando peso melódico.

A F28.2 dizia onde cada compasso tende a estar dentro da frase. A F28.3 começa a perguntar se a própria melodia confirma ou corrige essa leitura.

## Tese

Uma região funcional não deve nascer só da posição métrica. A posição ajuda, mas a melodia pode reforçar:

- repouso no centro tonal;
- abertura para subdominante;
- preparação dominante;
- fechamento cadencial.

Essa evidência ainda não é uma análise formal completa. Ela é uma camada auditável para orientar a harmonização e explicar melhor a proposta.

## Escopo Implementado

### 1. Confiança e evidência por região

Cada `MeasureFunctionalRegion` agora carrega:

```ts
confidence: number;
evidence: string[];
```

Isso permite diferenciar uma leitura puramente posicional de uma leitura sustentada pela melodia.

### 2. Peso melódico por grau tonal

Quando o planejador recebe centro tonal, ele procura notas proeminentes no compasso:

| Grau melódico | Leitura |
| --- | --- |
| 1º grau | reforço de centro ou fechamento |
| 4º grau | abertura/resposta subdominante |
| 5º grau | preparação dominante, quando aparece em posição cadencial |

O peso é calculado por duração relativa dentro do compasso.

### 3. Integração na explicação

As propostas do Harmonizar passam a poder explicar leituras como:

- `Leitura da frase: a melodia abre espaço para subdominante`
- `Leitura da frase: identifica preparação dominante antes da resolução`
- `Leitura da frase: reconhece fechamento no centro tonal`

Essas frases aparecem junto da explicação musical da proposta, sem expor nomes internos de enumeração.

### 4. Preservação de comportamento

A F28.3 não libera cromatismo novo. Dominantes secundárias, diminutos, SubV7 e ii-subV7 continuam dependendo de validação própria.

## Critérios de Aceitação

- O planejador reconhece subdominante estrutural quando o 4º grau tem peso melódico suficiente.
- O planejador reconhece preparação dominante quando o 5º grau aparece em posição cadencial.
- O planejador reconhece fechamento quando a melodia repousa no centro tonal.
- Asa Branca mantém a harmonização validada e passa a explicar a leitura de frase.
- A suíte curada continua passando.

## Fora de Escopo

- Detectar motivo, sentença, período ou pergunta/resposta por contorno.
- Trocar centro tonal por subfrase automaticamente.
- Criar SubV7 a partir da evidência dominante.
- Tratar blues/modal/menor como idiomas próprios.

## Próximo Passo

A próxima fronteira é F28.4 ou F29.

F28.4, se quisermos aprofundar antes do cromatismo:

- estimar alvo cadencial local por subfrase;
- separar fechamento autêntico, plagal, meia-cadência e abertura;
- produzir evidência negativa quando a frase não pede cadência forte.

F29, se quisermos avançar para vocabulário:

- implementar SubV7 apenas quando houver dominante funcional clara;
- exigir resolução melódica ou baixo cromático plausível;
- explicar o que a substituição preserva e o que ela altera.
