# F186 - Materiais de dominante natural e bebop

## Objetivo

Preencher a lacuna exposta pela F185: dominantes comuns não devem depender de material alterado para oferecer vocabulário melódico útil.

## Implementação

- `mixolydian` em dominantes naturais recebe `dominante natural / notas-guia`.
- `bebop dominant` recebe `dominante bebop / notas-guia`.
- O material usa arpejo dominante, resolução de 3 e b7 quando há alvo real, e cromatismo `b7-7-1` na leitura bebop.
- Dominantes alteradas não recebem esse material natural automaticamente.

## Exemplos

`G7 -> Cmaj7`

```text
G-B-D-F
B->C
F->E
```

`G7` com leitura bebop

```text
G-B-D-F
F-F#-G
B->C
F->E
```

## Critério musical

A dominante natural é material interno: arpejo, notas-guia e resolução. A escala alterada continua reservada para cifras explicitamente alteradas ou contextos que realmente sustentem tensão externa.

## Efeito na auditoria F184

- Material no candidato principal subiu de 3.981 para 6.734 leituras.
- Casos sem material voltaram de 2.761 para 152.
- A cobertura foi recuperada sem reabrir a escala alterada como material genérico para todo dominante.
