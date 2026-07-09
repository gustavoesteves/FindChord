# F96 - Retomada de dominante como suporte contextual

## Contexto

A fila F93 ainda continha dominantes alteradas que nao resolviam diretamente no alvo esperado, mas voltavam a aparecer como dominante da mesma raiz poucos acordes depois.

Isso e diferente de uma dominante alterada solta: a tensao nao foi abandonada, ela foi retomada dentro do mesmo gesto harmonico.

## Decisao

Adicionar a classe `dominant-reentry` em `DominantResolutionAnalysis`.

A regra reconhece o caso quando:

- o acorde analisado e dominante;
- nao houve resolucao imediata, SubV, chegada deceptiva, atraso ou prolongamento ja reconhecido;
- uma dominante da mesma raiz reaparece dentro da janela curta.

## Exemplos cobertos

- `Bb7(b9,b13) -> Fm7 -> Bb7(9)`
- `E7(#9) -> Dm -> E7(#9)`

## Impacto

- A resolucao passa a ser considerada contextualmente sustentada.
- O ranking recebe bonus pequeno, menor que prolongamento e atraso real.
- A auditoria F91 deixa de contar esses casos como `alteradas sem alvo local`.
- A auditoria F93 cai para 17 casos: 9 `terminal-dominant` e 8 `unresolved-review`.

## Proximo refinamento

Os 8 `unresolved-review` restantes devem ser tratados com escuta e com mais cautela. Muitos envolvem cromatismo lateral ou regioes vizinhas ao alvo esperado, e aceitar tudo automaticamente poderia esconder cifra ruim ou leitura funcional fraca.
