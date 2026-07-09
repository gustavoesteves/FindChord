# F61 - Pesquisa dirigida com catalogo pequeno

## Objetivo

Usar o catalogo atual de `docs/musics` como laboratorio controlado para comparar duas coisas:

1. o que o app ja consegue fazer a partir da melodia;
2. o que queremos que ele aprenda ao encontrar a harmonia escrita por um compositor ou arranjador.

O corpus ainda e pequeno demais para conclusao estatistica. Mesmo assim, ele ja e grande o suficiente para uma pesquisa qualitativa, porque contem casos de cancao tonal simples, standards com centros locais, harmonia modal/menor, baixo estrutural, dominantes secundarias e rearmonizacoes com baixa densidade.

## Fotografia atual

Base: `docs/reports/f39-real-music-audit-report.md`.

- Arquivos auditados: 22
- Arquivos harmonizados: 21
- Arquivos apenas com referencia harmonica: 1
- Arquivos sem proposta na janela auditada: 0
- Caminhos alinhados: 5
- Referencia destrava harmonizacao: 1
- Referencia muda centro: 10
- Mesmo centro, harmonizacao diferente: 5
- Sem proposta comparavel entre caminhos: 1

Leitura imediata:

- O motor ja tem boa cobertura operacional: quase todo arquivo com melodia gera proposta.
- O caminho melodia-only ja resolve casos simples e alguns casos funcionais.
- A referencia harmonica muda muito a leitura: em 10 obras ela aponta um centro local diferente daquele que a melodia isolada sugere.
- Em 5 obras o centro e o mesmo, mas a proposta primaria muda, o que indica que a referencia esta alterando vocabulario, densidade ou prioridade de estrategia.

## Grupos de pesquisa

### Grupo A - Caminhos alinhados

Pergunta: quando melodia-only e referencia-aware concordam, o resultado e musicalmente suficiente?

Obras candidatas:

- `asa branca.musicxml`
- `palhaço.musicxml`
- `exemplo.musicxml`
- `Ain't it the truth.musicxml`
- `after you've gone.musicxml`

O que observar:

- se a harmonia basica preserva notas estruturais da melodia;
- se a condução do baixo e das vozes soa natural;
- se a cadencia final esta clara;
- se o app evita complexidade desnecessaria.

Uso para o produto:

- definir o patamar minimo de "harmonizacao basica";
- calibrar o modo padrao antes de expor rearmonizacoes;
- proteger casos simples contra excesso de substituicoes.

### Grupo B - Referencia muda centro

Pergunta: a melodia sozinha e insuficiente ou o app ainda nao reconhece sinais melodicos de centro local?

Obras candidatas:

- `Airegin.musicxml`
- `Bright Size Life.musicxml`
- `Esse caminhar.musicxml`
- `a child is born.musicxml`
- `a fine romance.musicxml`
- `afternoon in Paris.musicxml`
- `depois de muito discutir.musicxml`

O que observar:

- se o centro da referencia e um centro local real;
- se o centro global continua presente como contexto superior;
- se ha cadencias locais que a melodia-only deveria perceber;
- se a mudanca de centro depende de cifras, baixo, ou apenas da melodia.

Uso para o produto:

- separar centro global, centro local e centro da frase;
- decidir quando uma proposta deve dizer "estou harmonizando em uma regiao local";
- impedir que a armadura ou o primeiro centro melodico domine frases com modulacao/localizacao clara.

### Grupo C - Mesmo centro, harmonizacao diferente

Pergunta: quando o centro e o mesmo, a referencia esta ensinando outra densidade, outro idioma ou outra prioridade funcional?

Obras candidatas:

- `Ain't misbehavin.musicxml`
- `Air mail special.musicxml`
- `affirmation.musicxml`
- `afro blue.musicxml`
- `autum leaves.musicxml`

O que observar:

- se a proposta melodia-only e aceitavel como harmonizacao simples;
- se a referencia usa dominantes secundarias, ii-V locais, baixo estrutural ou substituicoes;
- se a diferenca deve aparecer como alternativa de rearmonizacao, nao como correcao da harmonia basica;
- se o app esta escolhendo a proposta primaria certa para o modo "balanceado".

Uso para o produto:

- desenhar uma hierarquia: basico, funcional, referencia-aware, rearmonizacao;
- calibrar a promocao de dominantes secundarias e centros de referencia;
- separar "funciona" de "parece com a referencia".

### Grupo D - Referencia destrava harmonizacao

Pergunta: por que a melodia-only nao gerou proposta, e qual informacao da referencia resolveu o problema?

Obra candidata:

- `Actual proof.musicxml`

O que observar:

- se falta densidade melodica estrutural;
- se a frase depende de baixo/harmonia para definir centro;
- se o app deveria produzir uma proposta cautelosa mesmo sem referencia;
- se a melhor resposta e "preciso de contexto harmonico" em vez de inventar uma harmonia fraca.

Uso para o produto:

- criar mensagens honestas quando a melodia e insuficiente;
- evitar falsa certeza;
- identificar quando pedir mais compassos, baixo ou cifra de referencia.

## Matriz de avaliacao manual

Para cada obra aberta manualmente, registrar:

1. centro global percebido;
2. centro local da janela;
3. se a melodia sozinha sustenta esse centro;
4. se a referencia confirma, contradiz ou amplia a leitura;
5. qualidade da proposta melodia-only;
6. qualidade da proposta reference-aware;
7. se a divergencia e erro, alternativa aceitavel ou rearmonizacao desejavel;
8. qual vocabulario teorico esta faltando, se houver.

## Criterios de sucesso

O app nao precisa copiar a referencia do compositor. Ele precisa:

1. gerar uma harmonia basica plausivel quando a melodia sustenta o centro;
2. reconhecer quando a referencia aponta um centro local forte;
3. explicar divergencias em linguagem musical;
4. oferecer rearmonizacoes como alternativas, nao como substituicao automatica da harmonia basica;
5. saber quando a melodia sozinha nao basta.

## Proximo passo sugerido

Abrir manualmente um pequeno conjunto inicial:

1. `asa branca.musicxml` como controle tonal simples;
2. `Bright Size Life.musicxml` como centro local forte contra centro global;
3. `afternoon in Paris.musicxml` como frase com centro local Bb e centro global C;
4. `Ain't misbehavin.musicxml` como mesmo centro com harmonizacao diferente;
5. `Actual proof.musicxml` como caso em que a referencia destrava a harmonizacao.

Esse conjunto cobre os principais comportamentos atuais sem exigir uma auditoria longa. Depois dele, podemos decidir se o proximo bloco deve ser melhoria do centro melodia-only, hierarquia de propostas, ou vocabulario de rearmonizacao.
