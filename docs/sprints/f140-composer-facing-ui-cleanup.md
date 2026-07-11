# F140 - Limpeza da superficie compositor/arranjador

## Objetivo

Remover da UI principal informacoes que funcionavam como metricas internas do motor, mas nao ajudavam diretamente a leitura musical do compositor/arranjador.

## Alteracoes

- `Harmonizar`: a conducao de vozes deixou de aparecer como score numerico e passou a ser uma leitura qualitativa.
- `Harmonizar`: a leitura de escala deixou de exibir cobertura melodica em percentual e passou a indicar se a melodia apoia, se o apoio e parcial ou se a leitura deve ser revisada.
- `Harmonizar`: os intentos de escala `Interna` e `Outside` foram traduzidos para `Dentro` e `Fora`.
- `Escrever`: o painel `Cognição Harmônica (Tradução)` virou `Leitura do acorde`.
- `Escrever`: `Acorde Identificado` virou `Acorde`.
- `Escrever`: `Notas Físicas` virou `Notas tocadas`.
- `Escrever`: o bloco de `Pitches MIDI Absolutos` foi removido da UI principal.
- `Escrever`: `Tensão Estimada` deixou de mostrar valor decimal e passou a mostrar `Tensão baixa`, `Tensão moderada` ou `Tensão alta`.
- `Escrever`: o buscador de voicings virou `Variações de voicing`.
- `Escrever`: os badges `E:` e `Delta:` foram substituidos por etiquetas de execucao como `confortável`, `tocável`, `movimento curto`, `mesma posição` e `nova região`.

## Decisao de produto

O motor pode continuar calculando score, distancia, cobertura, tensao e ranking. Esses dados seguem uteis para ordenacao, testes e diagnosticos. A UI principal, porem, deve entregar leitura musical e acao possivel.

## Validacao esperada

- Nenhum score numerico interno deve aparecer na superficie principal sem traducao musical.
- A ordenacao interna dos cards deve permanecer igual.
- O compositor deve conseguir escolher uma proposta sem interpretar metricas de engenharia.

