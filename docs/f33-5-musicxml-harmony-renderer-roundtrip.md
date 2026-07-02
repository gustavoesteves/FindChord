# F33.5 — Renderizador MusicXML de Harmony e Round-trip Minimo

## Objetivo

Renderizar a estrutura semantica criada na F33.4 como bloco MusicXML `<harmony>` e validar a volta pelo normalizador existente.

A F33.4 criou:

```text
ResolvedChordSymbol -> MusicXmlHarmonyMapping
```

A F33.5 cria:

```text
MusicXmlHarmonyMapping -> <harmony>...</harmony>
```

## Implementacao

Arquivo:

```text
src/utils/music/theory/MusicXmlChordSymbolMapper.ts
```

Nova funcao:

```ts
renderMusicXmlHarmony(rawChord)
```

Ela emite:

- `<root>`;
- `<kind>`;
- `kind text`, quando necessario;
- `<bass>`, quando houver slash chord;
- `<degree>`, para adicoes e alteracoes.

## Exemplos

### Dominante alterada

```text
Bb7(#11)
```

Vira:

```xml
<harmony>
  <root>
    <root-step>B</root-step>
    <root-alter>-1</root-alter>
  </root>
  <kind text="7(#11)">dominant</kind>
  <degree>
    <degree-value>11</degree-value>
    <degree-alter>1</degree-alter>
    <degree-type>add</degree-type>
  </degree>
</harmony>
```

### Slash chord

```text
F#ø/A
```

Preserva:

- raiz `F#`;
- baixo `A`;
- `kind` como `half-diminished`.

### Sem acorde

```text
N.C.
```

Renderiza:

```xml
<kind>none</kind>
```

## Garantia de round-trip

Os testes validam:

```text
cifra -> renderMusicXmlHarmony -> parseXMLHarmonyBlock -> resolveChordSymbol
```

Para casos como:

```text
C
C7M
Cm7(b5)
C6/9
Bb7(#11)
Db7(#9,b13)
F#ø/A
```

O teste de repertorio real tambem roda esse round-trip em todas as 44 cifras unicas de `docs/musics`.

## Fora do escopo

- Gerar um arquivo MusicXML completo.
- Inserir `<harmony>` em compassos reais.
- Preservar layout/posicionamento visual.
- Fazer round-trip completo de partitura.
- Resolver polychords.

## Proxima fatia

F34 pode voltar para harmonizacao musical com mais seguranca:

1. refinar menor funcional versus modal;
2. usar o resolvedor para comparar proposta e referencia;
3. aplicar o contrato de cifras na UI de exibicao/importacao.

Alternativamente, F33.6 pode criar um exportador MusicXML minimo de uma lista de cifras, caso a prioridade vire interoperabilidade.
