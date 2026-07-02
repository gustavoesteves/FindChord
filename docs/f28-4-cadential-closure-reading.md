# F28.4 — Leitura de Fechamento Cadencial

## Objetivo

Classificar o tipo de fechamento de uma subfrase antes de liberar vocabulário cromático.

A F28.3 reconhece evidências melódicas de função. A F28.4 usa essas evidências para diferenciar finais autênticos, plagais, suspensos e abertos.

## Tese

Nem todo final de frase pede a mesma harmonia.

Uma melodia que fecha no centro depois de preparação dominante sugere uma cadência autêntica. Uma chegada ao centro depois de subdominante sugere um gesto plagal. Uma frase que termina no quinto grau pode estar pedindo suspensão, não resolução. Uma frase que termina em outro grau pode estar aberta.

Sem essa distinção, SubV7, dominantes secundárias e diminutos tendem a aparecer cedo demais.

## Escopo Implementado

### 1. Tipo de cadência por região final

`MeasureFunctionalRegion` agora pode carregar:

```ts
cadenceKind?: "AUTHENTIC" | "HALF" | "PLAGAL" | "OPEN";
cadentialTarget?: string;
```

Essa informação é atribuída principalmente às regiões de fechamento de subfrase.

### 2. Critérios atuais

| Leitura | Evidência |
| --- | --- |
| `AUTHENTIC` | preparação dominante antes de repouso no centro |
| `PLAGAL` | gesto subdominante antes de repouso no centro |
| `HALF` | final suspenso no quinto grau |
| `OPEN` | final sem repouso tonal forte |

O critério ainda é melódico e local. Ele não pretende substituir uma análise harmônica completa da partitura.

### 3. Explicação

O Harmonizar pode descrever leituras como:

- `Leitura da frase: fechamento autêntico confirmado pela melodia`
- `Leitura da frase: fechamento plagal sugerido pela melodia`
- `Leitura da frase: final suspenso com meia-cadência`
- `Leitura da frase: final aberto, sem cadência forte`

## Fora de Escopo

- Criar cadências novas automaticamente.
- Reharmonizar finais abertos com dominantes cromáticas.
- Detectar cadência composta por cifras reais da partitura.
- Separar estilos em que a cadência V-I não é o centro da gramática.

## Critérios de Aceitação

- V-I melódico é classificado como fechamento autêntico.
- IV-I melódico é classificado como fechamento plagal.
- Final no V é classificado como meia-cadência.
- Final fora de I/V é mantido como aberto.
- A leitura aparece em explicação musical, sem enums expostos ao usuário.
- A suíte curada, build e lint continuam verdes.

## Próximo Passo

Com a F28.4, o sistema já tem uma condição mínima para iniciar a F29.

A F29 deve implementar SubV7 com freios claros:

- só aparece quando há dominante funcional ou fechamento autêntico provável;
- precisa preservar a melodia estrutural;
- precisa resolver cromaticamente de modo audível;
- deve explicar que substitui a dominante por trítono, preservando impulso cadencial.
