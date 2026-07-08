# F41 — Causas de divergencia contra a referencia

## Objetivo

A F41 aprofunda a F40.

F40 dizia se a proposta primaria estava alinhada, parcialmente alinhada ou divergente da harmonia de referencia. F41 acrescenta causas musicais para essa leitura.

O objetivo nao e punir divergencia. O objetivo e distinguir divergencia criativa de possivel erro de leitura.

## Arquivos alterados

- `src/utils/music/analysis/strategies/ReferenceHarmonyComparator.ts`
- `scripts/reference-harmony-comparator.spec.ts`
- `scripts/real-music-audit.ts`
- `scripts/real-music-audit-report.spec.ts`
- `docs/reports/f39-real-music-audit-report.md`

## Causas classificadas

### Função preservada com outra raiz

A proposta e a referencia cumprem a mesma funcao aparente, mas usam raizes diferentes.

Isso pode indicar:

- substituicao funcional;
- simplificacao;
- rearmonizacao aceitavel;
- perda de cor da referencia.

### Centro divergente

O centro usado para ler a proposta nao coincide com o centro inferido da referencia.

Esse caso merece atencao porque uma mesma cifra pode mudar de funcao quando o centro muda.

### Cadencia da referencia nao acompanhada

A referencia contem uma cadencia local, mas a proposta nao preserva essa funcao na janela comparavel.

Esse caso e especialmente importante em musicas com ii-V, iiø-V-i ou preparacoes locais.

### Idioma da referencia relevante

A referencia sugere idioma nao major-funcional, como menor funcional, modal ou blues.

Quando isso aparece junto de divergencia, a escuta deve considerar se o motor esta impondo uma leitura tonal generica sobre um idioma mais especifico.

### Raiz divergente na janela

A proposta troca a raiz da maioria dos acordes comparaveis.

Isso nao e automaticamente erro, mas indica que a proposta esta bastante afastada da superficie harmonica de referencia.

## Resultado inicial no relatorio real

O relatorio real passou a exibir linhas como:

```text
Causas da comparacao: função preservada com outra raiz; raiz divergente na janela
```

Na primeira rodada:

- `Bright Size Life.musicxml` preservou funcao em ponto comparavel, mas mudou a raiz;
- `Esse caminhar.musicxml` apresentou centro divergente, idioma de referencia relevante e raiz divergente na janela;
- `depois de muito discutir.musicxml` ficou alinhada sem causa adicional.

## Proximo passo

A proxima fase pode usar essas causas para diagnosticos de apresentacao:

- divergencia aceitavel por substituicao funcional;
- alerta de centro divergente;
- alerta de cadencia de referencia omitida;
- alerta de idioma da referencia contra leitura generica.

Essa etapa aproxima o sistema de uma escuta musicologica: a referencia deixa de ser resposta certa e passa a ser interlocutora.
