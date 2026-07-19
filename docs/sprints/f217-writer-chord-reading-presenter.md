# F217 - Presenter da leitura do acorde

## Objetivo

Separar de `TranslationLayer` a preparação dos campos de leitura do acorde.

Depois da remoção da biblioteca antiga, a tela ficou pequena, mas ainda carregava:

- leitura textual da tensão;
- campos fixos de baixo, inversão, estrutura e tensões;
- fallback para tensões vazias;
- percentual visual da barra de tensão.

## Mudança

Foi criado `writerChordReadingPresenter.ts`, com:

```ts
writerTensionReading(level)
presentWriterChordReading(chord)
```

`TranslationLayer` agora recebe uma apresentação pronta e apenas renderiza:

- símbolo;
- notas;
- campos;
- barra de tensão.

## Por que isso importa

Essa separação deixa a tela preparada para melhorias musicais futuras sem acoplar regras de leitura ao JSX.

Também cria um ponto único para revisar se os campos atuais realmente ajudam o compositor/arranjador.
