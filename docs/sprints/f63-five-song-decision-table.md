# F63 - Mesa de decisao das 5 obras

## Objetivo

Usar as mesmas 5 obras da F61 para transformar diagnostico em decisao de refinamento.

A pergunta desta sprint nao e "quantas musicas o app consegue harmonizar?". A pergunta agora e:

> Quando o app gera uma proposta, ela deve ser resposta basica, leitura de referencia ou rearmonizacao?

## Base

- `docs/reports/f61-small-catalog-research-report.md`
- `docs/sprints/f62-proposal-presentation-layers.md`

## Decisao geral

Antes de ampliar o catalogo, precisamos fechar a regua de apresentacao:

1. harmonia basica deve ser a primeira resposta quando for suficiente;
2. centro de referencia deve aparecer como leitura contextual/autoral;
3. rearmonizacao deve aparecer como alternativa criativa;
4. quando melodia-only nao basta, o sistema deve dizer isso musicalmente.

## Mesa de decisao

| Obra | Leitura atual | Decisao | Refinamento sugerido |
| --- | --- | --- | --- |
| `asa branca.musicxml` | Harmonia basica; caminhos alinhados | Usar como controle de resposta padrao | Preservar baixa densidade, I-IV-V e inversoes simples; evitar que estrategias mais coloridas tomem o lugar da resposta basica |
| `Bright Size Life.musicxml` | Centro de referencia; centro local Bb contra global D | Tratar como leitura contextual, nao como erro da melodia-only | Exibir centro local e global com linguagem clara; manter melodia-only como alternativa possivel quando a referencia nao existir |
| `afternoon in Paris.musicxml` | Rearmonizacao; centro local Bb contra global C | Manter como alternativa criativa/contextual, nao resposta basica padrao | Investigar se o campo Tonal Classico deve ser promovido apenas quando o modo do usuario pedir rearmonizacao ou contexto de referencia |
| `Ain't misbehavin.musicxml` | Centro de referencia; mesmo centro, harmonizacao diferente | Tratar a referencia como densidade/habito estilistico | Mostrar a proposta basica e a leitura de referencia como niveis diferentes, nao como uma corrigindo a outra |
| `Actual proof.musicxml` | Centro de referencia; referencia destrava a harmonizacao | Reconhecer insuficiencia da melodia isolada | Criar fallback honesto: "a melodia isolada nao define centro suficiente; use mais contexto, baixo ou harmonia de referencia" |

## Regras extraidas

### 1. A resposta basica deve sobreviver

Mesmo quando existe uma leitura de referencia mais rica, a resposta basica continua importante. Ela e a primeira coisa que um usuario espera ao pedir "harmonizar uma melodia".

Implicacao:

- o modo padrao deve favorecer `presentationLayer = basic` quando a proposta e musicalmente suficiente;
- propostas `reference-aware` e `reharmonization` devem ser legiveis como camadas posteriores.

### 2. Centro local nao e necessariamente rearmonizacao

Quando a referencia aponta um centro local forte, o app deve apresentar isso como leitura contextual.

Implicacao:

- `Bright Size Life` e `Ain't misbehavin` nao devem ser usados para forcar cromatismo;
- eles devem calibrar a linguagem "centro local / centro global".

### 3. Rearmonizacao precisa pedir permissao musical

`afternoon in Paris` mostra que uma proposta pode fazer sentido, mas ainda pertencer a uma camada mais criativa.

Implicacao:

- campos exploratorios ou controlados nao devem tomar automaticamente o papel de resposta principal do modo basico;
- o app precisa separar "funciona" de "deve ser a primeira resposta".

### 4. Nem toda melodia basta

`Actual proof` e importante porque impede falsa certeza.

Implicacao:

- quando melodia-only falha, o app deve comunicar a causa musical;
- a referencia pode destravar a harmonizacao, mas isso deve aparecer como dependencia de contexto.

## Proximo refinamento de codigo

Criar uma selecao de proposta por camada para o modo `Harmonizar`:

1. escolher a melhor proposta `basic` como resposta inicial quando existir;
2. manter a melhor `reference-aware` como leitura contextual;
3. manter a melhor `reharmonization` como alternativa;
4. expor no relatorio/UI quando uma camada nao existe.

Esse refinamento deve ser feito antes de aumentar o catalogo, porque ele define como vamos interpretar os proximos resultados.
