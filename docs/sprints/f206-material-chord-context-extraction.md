# F206 - Extração do contexto de acorde para materiais

## Objetivo

Separar do orquestrador de materiais duas responsabilidades que não pertencem ao ranking musical em si:

- resolver a cifra para a qualidade interna do motor;
- transformar a melodia do contexto em notas ponderadas.

## Mudança

Foi criado `contextualMaterialChordContext.ts`.

Ele concentra:

```ts
resolveMaterialChordQuality(symbol)
weightedMelodyNotesFromContext(melody)
```

`contextualMaterialCandidates.ts` passou a consumir essas funções em vez de carregar internamente:

- tabela de tradução entre o parser de cifras e o DSL harmônico;
- fallback controlado para o parser legado;
- regra de proteção contra cifras ambíguas;
- normalização rítmica da melodia.

## Por que isso importa

Essa separação ajuda diretamente o caminho que estamos construindo para `Escrever > Materiais do acorde`.

O módulo `Escrever` não deve precisar chamar o harmonizador inteiro para entender:

- qual acorde está em jogo;
- qual qualidade harmônica o motor reconhece;
- quais notas da melodia ou do gesto local podem pesar na sugestão.

Com essa camada isolada, fica mais fácil reaproveitar o mesmo contrato tanto para:

- materiais contextuais no `Harmonizar`;
- materiais locais no `Escrever`.

## Proteção importante

A regra que rejeita cifras ambíguas como `G(#75)` continua preservada nessa camada.

Isso mantém a fronteira de segurança que criamos para evitar que o parser legado transforme cifras quebradas em acordes maiores por fallback.
