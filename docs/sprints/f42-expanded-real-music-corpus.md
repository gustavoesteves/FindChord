# F42 — Expansao do corpus real

## Objetivo

A F42 incorpora tres novas musicas reais ao corpus de auditoria:

- `Actual proof.musicxml`
- `a child is born.musicxml`
- `a fine romance.musicxml`

Essa fase testa duas coisas ao mesmo tempo:

1. se o motor continua atravessando repertorio real maior;
2. se o contrato de cifras suporta dialetos encontrados em partituras reais.

## Impacto no corpus

O corpus passou de 8 para 11 arquivos MusicXML.

O relatorio real passou a mostrar:

- 11 arquivos auditados;
- 10 arquivos harmonizados;
- 1 arquivo apenas com referencia harmonica;
- 0 arquivos sem proposta na janela auditada.

## Impacto no vocabulário de cifras

O vocabulário unico de cifras reais passou de 44 para 88 simbolos.

As novas musicas trouxeram grafias que ainda nao estavam cobertas:

- `sus4(7)`;
- `sus4(7,9)`;
- `sus4(7,9,11,13)`;
- `(#11)` em acordes maiores;
- `(add9)(b7)`;
- `7alt` em repertorio real.

## Ajustes implementados

O resolvedor de cifras agora entende:

- dominantes suspensos escritos como `Csus4(7)`, `Csus4(7,9)` e `Csus4(7,9,11,13)`;
- formas redundantes que voltam do round-trip MusicXML, como `C7sus4(b7)` e `C9sus4(b7,9)`;
- maior com `#11`;
- maior com `add9` e `b7`, normalizado como dominante-nona.

O teste de compatibilidade real foi atualizado para o novo tamanho do vocabulário.

## Resultado musical inicial

O relatorio real mostra novas divergencias uteis:

- `Actual proof.musicxml`: proposta primaria em Gb maior, sem referencia comparavel na janela atual;
- `a child is born.musicxml`: divergencia contra referencia com cadencia nao acompanhada;
- `a fine romance.musicxml`: divergencia contra referencia com cadencia nao acompanhada, idioma relevante e raiz divergente.

Esses resultados nao devem ser tratados como falhas imediatas. Eles indicam onde a proxima escuta deve focar.

## Limite observado

O round-trip MusicXML minimo ainda nao preserva perfeitamente o rótulo idiomatico `alt`, porque MusicXML separa `<kind>` e `<degree>` e a renderizacao minima de `7alt` volta como dominante simples quando nao ha graus alterados explicitos.

Por enquanto, o teste aceita essa perda controlada apenas no round-trip minimo. O resolvedor continua entendendo `7alt` como cifra de entrada.

## Proximo passo

A proxima fase deve investigar janelas e centros em musicas com harmonia de referencia rica.

Em especial:

- `Actual Proof` pode exigir leitura modal/fusion ou janela por secao;
- `A Child Is Born` provavelmente precisa de comparacao por secao e cadencias locais;
- `A Fine Romance` pode exigir leitura mais idiomatica de standard/jazz funcional.

Essa expansao confirma que o corpus real esta fazendo seu papel: ele aumenta a pressao sobre o contrato teorico sem deixar o motor esconder fragilidades em exemplos pequenos.
