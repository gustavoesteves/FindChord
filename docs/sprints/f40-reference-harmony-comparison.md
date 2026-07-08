# F40 — Comparacao com harmonia de referencia

## Objetivo

A F40 compara a proposta primaria do motor com as cifras ja presentes no MusicXML.

Essa comparacao nao transforma a referencia em gabarito absoluto. A referencia funciona como evidencia musical: ela pode confirmar centro, idioma, cadencias locais e escolhas de baixo, ou pode revelar onde a proposta do motor esta se afastando demais da leitura original.

## Arquivos implementados

- `src/utils/music/analysis/strategies/ReferenceHarmonyComparator.ts`
- `scripts/reference-harmony-comparator.spec.ts`

Tambem foi atualizado:

- `scripts/real-music-audit.ts`
- `scripts/real-music-audit-report.spec.ts`
- `docs/reports/f39-real-music-audit-report.md`

## Como a comparacao funciona

O comparador:

1. recebe a proposta primaria;
2. recebe a camada de cifras importada do MusicXML;
3. alinha proposta e referencia por compasso;
4. compara a funcao aparente dos acordes;
5. compara a raiz dos acordes;
6. consulta a analise da referencia para idioma, cadencias locais e fronteira menor/modal;
7. produz uma sintese musical.

## Estados de comparacao

### Alinhada

A maior parte dos compassos comparaveis preserva a mesma funcao aparente da referencia.

Isso nao significa que a cifra seja identica. Exemplo: `C` e `Cmaj7` podem ser tratados como alinhados quando cumprem a mesma funcao.

### Parcial

A proposta preserva parte da funcao, mas se afasta em pontos importantes.

Esse estado e interessante para rearmonizacao controlada: pode indicar substituicao aceitavel, simplificacao ou divergencia que precisa ser escutada.

### Divergente

A proposta diverge funcionalmente da referencia na maior parte da janela.

Isso nao e automaticamente erro. Em modo exploratorio pode ser desejado. Em modo simples, porem, deve acender alerta.

### Sem referencia

Nao ha cifras de referencia suficientes nos compassos comparaveis.

## Resultado inicial no relatorio real

O relatorio `docs/reports/f39-real-music-audit-report.md` agora mostra uma linha como:

```text
Comparacao com referencia: alinhada; função 3/3; raiz 3/3
```

Na primeira rodada:

- `depois de muito discutir.musicxml` apareceu alinhada na janela comparavel;
- `Esse caminhar.musicxml` apareceu divergente;
- `Bright Size Life.musicxml` preservou funcao em um ponto comparavel, mas nao a mesma raiz;
- arquivos sem cifra na janela auditada ficaram sem referencia comparavel.

## Limites atuais

A F40 ainda compara apenas a primeira cifra por compasso e apenas compassos em que proposta e referencia se sobrepoem.

Ela ainda nao distingue:

- substituicao funcional idiomatica;
- equivalencia por dominante secundaria;
- equivalencia por SubV7;
- acordes de aproximacao;
- harmonia de referencia fora da janela melodica selecionada;
- comparacao por secao formal.

## Proximo passo

A proxima evolucao deve transformar divergencias recorrentes em diagnosticos mais musicais:

- divergencia aceitavel por substituicao funcional;
- divergencia por centro tonal diferente;
- cadencia de referencia omitida;
- cromatismo da proposta nao sustentado pela referencia;
- referencia mais idiomatica que a proposta primaria.

Essa fase abre uma porta importante: o sistema passa a ouvir a partitura real como interlocutora, nao como alvo a ser copiado.
