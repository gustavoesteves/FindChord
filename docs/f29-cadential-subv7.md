# F29 — SubV7 Cadencial

## Objetivo

Introduzir substituição tritonal de dominante de forma controlada.

A F29 começa pequena: o sistema só usa SubV7 quando existe fechamento cadencial claro e a melodia aceita o acorde substituto. Isso evita transformar cromatismo em enfeite automático.

## Tese

SubV7 não é apenas um acorde cromático bonito. Ele substitui uma dominante porque preserva impulso resolutivo e ganha resolução cromática no baixo:

```text
G7 -> C
Db7 -> C
```

No segundo caso, `Db7` substitui `G7` porque compartilha o trítono funcional e resolve meio tom abaixo para o alvo.

## Escopo Implementado

### 1. Nova estratégia

Foi adicionada a estratégia:

```ts
SUBV7_CADENCIAL
```

Ela gera propostas com o rótulo:

```text
Estratégia — SubV7 cadencial
```

### 2. Validação funcional

O validador reconhece:

- SubV7 resolvido cromaticamente;
- SubV7 não resolvido;
- expansão `TRITONE_SUBSTITUTION_RESOLUTION`;
- manutenção do backbone funcional `T -> PD -> D -> T`.

SubV7 resolvido conta como dominante funcional substituta. SubV7 sem resolução continua sendo escape cromático.

### 3. Geração conservadora

O harmonizador só troca a dominante cadencial por SubV7 quando:

- a região final é lida como fechamento autêntico;
- o alvo cadencial está claro;
- o acorde substituto cobre a melodia estrutural;
- a resolução cromática é validada.

Exemplo aceito:

```text
C -> F -> Db7 -> C
```

Exemplo rejeitado:

```text
C -> F -> Db7 -> G
```

### 4. Explicação

As propostas podem explicar:

- `substitui a dominante cadencial por SubV7 com resolução cromática`
- `substitui a dominante por trítono com resolução cromática`

## Fora de Escopo

- ii-subV7 completo.
- SubV7 para alvos secundários em qualquer ponto da frase.
- Cadeias cromáticas de dominantes substitutas.
- Reinterpretação modal/blues de dominantes.
- Correção enharmônica avançada de notas como `Cb`/`B`.

## Critérios de Aceitação

- `Db7 -> C` em C maior é reconhecido como SubV7 resolvido.
- SubV7 resolvido preserva o backbone dominante.
- SubV7 não resolvido gera falha específica.
- O harmonizador só aceita a estratégia quando a melodia é compatível.
- Asa Branca e a suíte curada não regrediram.

## Próximo Passo

A próxima fatia natural é F29.1:

- adicionar ii-subV7 como preparação cromática controlada;
- permitir SubV7 de alvos locais quando a região cadencial local estiver clara;
- melhorar leitura enharmônica para equivalências como `B` e `Cb`;
- usar o ranking de condução de vozes para comparar `G7 -> C` e `Db7 -> C`.
