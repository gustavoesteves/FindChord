# F305 - Espectro de tensao em vamp dominante

## Objetivo

Adicionar ao `Escrever` parte do vocabulario de dominante estatico discutido a partir do video: sair do material interno para tensoes organizadas e outside controlado.

## Alteracoes

- `localChordVampMaterials` passa a criar um candidato local `dominant diminished axis`.
- O eixo diminuto gera ii menores relacionados aos dominantes em tercas menores.
- Para `G7`, o eixo oferece:
  - `D-F-A-C`;
  - `F-Ab-C-Eb`;
  - `Ab-B-Eb-Gb`;
  - `B-D-F#-A`.
- Criado o candidato local `side slip minor pentatonic`.
- Para `G7`, o side slip usa:
  - pentatonica menor interna de `D`;
  - deslocamento meio tom abaixo;
  - deslocamento meio tom acima.

## Decisao

Esse vocabulario pertence ao `Escrever` como navegacao de vamp. Ele nao pressupoe proximo acorde, centro tonal ou alvo de resolucao. A volta para dentro e uma decisao do musico, nao uma inferencia do motor.

## Validacao

- `npx vitest run --config vitest.curated.config.ts scripts/local-chord-vamp-materials.spec.ts scripts/local-chord-materials.spec.ts scripts/writer-material-screen-model.spec.ts scripts/writer-material-routes.spec.ts`
- `npm run build`
