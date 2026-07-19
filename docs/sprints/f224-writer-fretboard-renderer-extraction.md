# F224 - Renderer compartilhavel de fretboard

## Objetivo

Separar o desenho SVG do `VirtualFretboard` das decisoes especificas do modulo `Escrever`.

## Alterações

- Criado `FretboardRenderer`, um componente visual que recebe geometria, cordas, notas visiveis e callback de clique.
- `VirtualFretboard` passou a montar os dados do braço e delegar o desenho para o renderer.
- O renderer nao conhece acorde, cifra, MuseScore, materiais melodicos ou estado global.

## Resultado

O `Braço` fica mais proximo do modelo desejado: uma experiencia especifica sobre um renderer de fretboard comum. Isso abre caminho para migrar `Materiais do acorde` para o mesmo componente, usando outro conjunto de notas visiveis, legenda e interacoes.
