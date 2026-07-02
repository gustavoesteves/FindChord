# F29.1 — ii-SubV7 Cadencial

## Objetivo

Adicionar preparação cromática controlada para SubV7.

A F29 introduziu `Db7 -> C` como SubV7 cadencial. A F29.1 adiciona o ii relacionado ao SubV7:

```text
Abm7 -> Db7 -> C
```

## Tese

O ii-subV7 não deve aparecer como cromatismo solto. Ele só faz sentido quando prepara diretamente um SubV7 que resolve para o alvo cadencial.

Em C:

```text
G7  -> C    dominante original
Db7 -> C    SubV7
Abm7 -> Db7 -> C    ii-subV7
```

O ganho musical é uma aproximação cromática mais rica, mantendo direção cadencial.

## Escopo Implementado

### 1. Nova estratégia

Foi adicionada:

```ts
II_SUBV7_CADENCIAL
```

Ela gera:

```text
Estratégia — ii-SubV7 cadencial
```

### 2. Validação funcional

O validador reconhece:

- ii cromático relacionado ao SubV7;
- SubV7 resolvido cromaticamente;
- expansão `II_SUBV7_PREPARATION`;
- backbone `T -> PD -> D -> T`.

O ii cromático só é aceito quando prepara um SubV7 resolvido. Caso contrário, gera falha específica:

```text
unresolved-ii-subv7
```

### 3. Geração conservadora

O harmonizador só gera ii-subV7 quando:

- a frase tem fechamento autêntico;
- o alvo cadencial está claro;
- a melodia cobre o ii cromático e/ou o SubV7;
- o SubV7 resolve por semitom descendente.

Exemplo aceito:

```text
C -> F -> Abm7 Db7 -> C
```

Exemplo rejeitado:

```text
C -> F -> Abm7 G7 -> C
```

## Fora de Escopo

- Usar ii-subV7 para qualquer alvo secundário.
- Criar cadeias cromáticas longas.
- Resolver equivalências enharmônicas como `B`/`Cb` de forma completa.
- Escolher automaticamente entre dominante original, SubV7 e ii-subV7 por estilo.

## Critérios de Aceitação

- `Abm7 -> Db7 -> C` é aceito como ii-subV7 cadencial em C.
- `Abm7` sem `Db7 -> C` é rejeitado como preparação não resolvida.
- O backbone funcional continua preservado.
- A geração só aceita quando a melodia é compatível.
- A suíte curada continua passando.

## Próximo Passo

A F29.2 deve usar condução de vozes para comparar:

- `G7 -> C`;
- `Db7 -> C`;
- `Abm7 -> Db7 -> C`.

Também vale começar a camada de equivalência enharmônica, porque `Cb` e `B` são musicalmente o mesmo som, mas ainda não são tratados como a mesma escrita no contrato melódico.
