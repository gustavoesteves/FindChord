# F164 - Fila de escuta para referencias parciais

## Objetivo

Registrar uma decisao importante depois da F163: nem toda diferenca entre proposta e cifra autoral deve virar ajuste automatico do motor.

`a fine romance.musicxml` ficou como unico caso parcialmente alinhado na fila de centros alterados. A leitura musical sugere que a proposta autoral/importada dessa janela pode ser peculiar ou estranha o suficiente para merecer escuta e revisao, nao calibracao cega.

## Mudanca

A F39 agora separa explicitamente:

```text
Centros alterados alinhados com a referencia
Centros alterados parcialmente alinhados
Centros alterados ainda divergentes
Centros alterados para escuta/revisao da referencia
```

E a linha detalhada passa a marcar casos parciais como:

```text
referencia parcial para escuta/revisao
```

## Estado atual

```text
Centros alterados alinhados com a referencia: 9
Centros alterados parcialmente alinhados: 1
Centros alterados ainda divergentes: 0
Centros alterados para escuta/revisao da referencia: 1
```

Caso em revisao:

```text
a fine romance.musicxml
```

## Decisao musical

O motor nao deve tentar imitar toda cifra autoral a qualquer custo.

Quando a referencia parece editorialmente estranha, muito idiomatica ou contraditoria com a leitura global/local, ela deve entrar em fila de escuta. O objetivo do Harmonizar continua sendo gerar uma proposta musicalmente coerente para compositor/arranjador, nao otimizar metricas contra toda cifra importada.

## Proximo caminho

Seguir refinando com foco em padroes recorrentes do corpus:

- referencias alinhadas que ainda podem melhorar em baixo/inversao;
- casos de mesmo centro com harmonizacao diferente;
- janelas densas em que a cifra da partitura funciona como rota estrutural;
- validacao musical do que deve aparecer como proposta principal versus alternativa.
