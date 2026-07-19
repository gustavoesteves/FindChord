# F39 — Relatorio musical por obra

Este relatorio e gerado a partir das partituras em `docs/musics` e resume a leitura atual do motor sobre cada arquivo real.
Escopo: apenas arquivos `.musicxml` no nivel raiz de `docs/musics`; subpastas importadas sao cobertas pelas auditorias F108/F109.

A leitura nao pretende ser julgamento estetico final. Ela registra o que o sistema conseguiu importar, qual janela melodica foi usada, qual centro foi escolhido e qual proposta primaria saiu do pipeline.

## Resumo geral

- Arquivos auditados: 18
- Arquivos harmonizados: 18
- Arquivos apenas com referencia harmonica: 0
- Arquivos sem proposta na janela auditada: 0
- Obras com cores funcionais: 12
- Cores funcionais geradas: 28
- Cores funcionais como alternativas: 28
- Obras com bVI/bVII na referencia: 1
- Cores bVI/bVII na referencia: 3
- Caminhos alinhados: 2
- Referencia destrava harmonizacao: 1
- Referencia muda centro: 11
- Mesmo centro, harmonizacao diferente: 4
- Mesmo centro, referencia enriquece rota: 4
- Mesmo centro, revisar rota da referencia: 0
- Baixo da referencia preservado parcialmente: 0
- Baixo da referencia pouco preservado: 0
- Sem proposta comparavel entre caminhos: 0
- Triagem centro local da referencia: 9
- Triagem relativo maior/menor resolvido: 2
- Triagem revisar centro inferido: 0
- Triagem vocabulario melodia-only: 0
- Centros alterados alinhados com a referencia: 11
- Centros alterados parcialmente alinhados: 0
- Centros alterados ainda divergentes: 0
- Centros alterados para escuta/revisao da referencia: 0
- Amostras de triagem - referencia muda centro: Ain't it the truth.musicxml (Bb minor -> Db major); Ain't misbehavin.musicxml (Eb major -> F minor); Airegin.musicxml (F minor -> Bb minor)
- Amostras de triagem - mesmo centro, harmonizacao diferente: Air mail special.musicxml (Estratégia — Dominantes secundárias -> Rearmonização — contorno da partitura); affirmation.musicxml (Estratégia — Centro modal -> Rearmonização — contorno da partitura); afro blue.musicxml (Estratégia — Tonal Clássico -> Rearmonização — contorno da partitura)
- Amostras de triagem - referencia destrava harmonizacao: Actual proof.musicxml (sem proposta -> Rearmonização — ritmo harmônico da partitura)

## Triagem de centros alterados pela referencia

- Ain't it the truth.musicxml: hipotese: relativo maior/menor resolvido pela referencia; referencia alinhada; melodia Bb minor; referencia Db major; proposta Rearmonização — contorno da partitura; Db major; confiança weak; alinhada; função 6/6; raiz 6/6
- Ain't misbehavin.musicxml: hipotese: centro local da referencia; referencia alinhada; melodia Eb major; referencia F minor; proposta Rearmonização — contorno da partitura; janela F minor; confiança strong; global Eb major; confiança strong; alinhada; função 8/8; raiz 8/8
- Airegin.musicxml: hipotese: centro local da referencia; referencia alinhada; melodia F minor; referencia Bb minor; proposta Rearmonização — contorno da partitura; Bb minor; confiança strong; alinhada; função 4/4; raiz 4/4
- Bright Size Life.musicxml: hipotese: centro local da referencia; referencia alinhada; melodia D major; referencia Bb major; proposta Rearmonização — contorno da partitura; janela Bb major; confiança strong; global D major; confiança strong; alinhada; função 5/5; raiz 5/5
- a child is born.musicxml: hipotese: centro local da referencia; referencia alinhada; melodia C major; referencia Bb major; proposta Rearmonização — contorno da partitura; Bb major; confiança medium; alinhada; função 8/8; raiz 8/8
- a fine romance.musicxml: hipotese: centro local da referencia; referencia alinhada; melodia C major; referencia D minor; proposta Rearmonização — contorno da partitura; janela D minor; confiança medium; global C major; confiança strong; alinhada; função 7/7; raiz 7/7
- african flower.musicxml: hipotese: centro local da referencia; referencia alinhada; melodia Ab minor; referencia Eb minor; proposta Rearmonização — contorno da partitura; Eb minor; confiança strong; alinhada; função 4/4; raiz 4/4
- afron-centric.musicxml: hipotese: centro local da referencia; referencia alinhada; melodia Bb major; referencia C minor; proposta Rearmonização — contorno da partitura; janela C minor; confiança medium; global Gb major; confiança medium; alinhada; função 2/2; raiz 2/2
- after you've gone.musicxml: hipotese: centro local da referencia; referencia alinhada; melodia F major; referencia Bb major; proposta Rearmonização — contorno da partitura; Bb major; confiança strong; alinhada; função 8/8; raiz 8/8
- after you.musicxml: hipotese: relativo maior/menor resolvido pela referencia; referencia alinhada; melodia D major; referencia B minor; proposta Rearmonização — contorno da partitura; janela B minor; confiança strong; global G major; confiança strong; alinhada; função 7/7; raiz 7/7
- afternoon in Paris.musicxml: hipotese: centro local da referencia; referencia alinhada; melodia C major; referencia Bb major; proposta Rearmonização — contorno da partitura; janela Bb major; confiança strong; global C major; confiança strong; alinhada; função 7/7; raiz 7/7

## Triagem de mesmo centro

- Air mail special.musicxml: referencia enriquece rota no mesmo centro; centro Ab major; melodia Estratégia — Dominantes secundárias; referencia Rearmonização — contorno da partitura; alinhada; função 7/7; raiz 7/7; vocabulario da referencia: 2 ii-V, 1 dominantes aplicadas, 2 dominantes primarias, 4 tonicas 6/6-9
- affirmation.musicxml: referencia enriquece rota no mesmo centro; centro B minor; melodia Estratégia — Centro modal; referencia Rearmonização — contorno da partitura; alinhada; função 4/4; raiz 4/4; vocabulario da referencia: funcional direto
- afro blue.musicxml: referencia enriquece rota no mesmo centro; centro F minor; melodia Estratégia — Tonal Clássico; referencia Rearmonização — contorno da partitura; alinhada; função 8/8; raiz 8/8; vocabulario da referencia: funcional direto
- autum leaves.musicxml: referencia enriquece rota no mesmo centro; centro G major; melodia Estratégia — Melodia primeiro; referencia Rearmonização — contorno da partitura; alinhada; função 3/3; raiz 3/3; vocabulario da referencia: 1 ii-V, 1 dominantes primarias

## Triagem de baixo da referencia

Nenhuma obra nesta categoria.

## Obras

### Actual proof.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 23 compassos, 98 notas, 20 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 2, 5, 6, 7, 9, 10, 11, 12
- Sobreposicao com referencia: 4 compassos
- Centro escolhido: E minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam E menor. Acorde final repousa em E.
- Propostas geradas: 3
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: sem proposta
- Caminho com referencia: centro E minor (referencia); primaria Rearmonização — ritmo harmônico da partitura; 3 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência destrava a harmonização
- Proposta primaria: Rearmonização — ritmo harmônico da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo leaping; conducao 3.18
- Referencia na janela: 7:Gb/Bb | 9:A13sus4 | 11:Ebm7b5 | 12:B7sus4, C#7sus4/Bb, Dm7, Em7
- Cifras: 7:Gb/Bb | 9:A13sus4 | 11:Ebm7b5 | 12:B7sus4, C#7sus4/Bb, Dm7, Em7
- Baixo da referencia: Bb -> A -> Eb -> B -> Bb -> D -> E
- Baixo: Bb -> A -> Eb -> B -> Bb -> D -> E
- Preservacao do baixo: 7/7
- Evidencias da proposta:
  - preserva o ritmo harmônico escrito na partitura
  - normaliza a cifragem mantendo a harmonia escrita
  - mantém a densidade da referência sem copiar literalmente a cifra do autor
  - Linha de baixo: saltos estruturais reduzem a continuidade
- Centro da referencia: janela E minor; confiança medium; global Eb major; confiança strong
- Comparacao com referencia: alinhada; função 4/4; raiz 4/4
- Causas da comparacao: acompanha centro local, diverge do global

### Ain't it the truth.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Db
- Material importado: 38 compassos, 153 notas, 36 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 6 compassos
- Centro escolhido: Db major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Db maior. Primeiro acorde apresenta Db maior.
- Propostas geradas: 12
- Cores funcionais: 3 geradas, 3 alternativas nao primarias
- Cores funcionais alternativas: 3:Cm7b5 | 4:F7b13/Db | 5:Bbm6; 1:Dbmaj7 | 8:Ddim7, Ddim7/Eb, Dbdim7/Ab; 1:Dbmaj7 | 8:Ddim7, Ddim7, Eb7
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Bb minor (melodia); primaria Estratégia — Tonal Clássico; 4 propostas
- Caminho com referencia: centro Db major (referencia); primaria Rearmonização — contorno da partitura; 12 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a harmonia escrita resolve a ambiguidade relativo maior/menor
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo functional; conducao 5.44
- Referencia na janela: 1:Db | 4:Ebm7, Ab7, E7 | 5:Eb7 | 6:Ab7 | 7:Db7 | 8:Gb7
- Cifras: 1:Db6 | 4:Ebm, Ab9, E9 | 5:Eb13 | 6:Ab9 | 7:Db13 | 8:Gb13
- Baixo da referencia: Db -> Eb -> Ab -> E -> Eb -> Ab -> Db -> Gb
- Baixo: Db -> Eb -> Ab -> E -> Eb -> Ab -> Db -> Gb
- Preservacao do baixo: 8/8
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: Db major; confiança weak
- Comparacao com referencia: alinhada; função 6/6; raiz 6/6

### Ain't misbehavin.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Eb
- Material importado: 26 compassos, 110 notas, 50 cifras, 3 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 8 compassos
- Centro escolhido: F minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência V-i confirma F menor. Repousos recorrentes sustentam F menor.
- Propostas geradas: 3
- Cores funcionais: 1 geradas, 1 alternativas nao primarias
- Cores funcionais alternativas: 1:Eb7 | 2:Fm | 3:Eb7 | 4:Fm7 | 5:Eb7 | 6:Fm | 7:Eb7 | 8:Fm6
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Eb major (melodia); primaria Estratégia — Melodia primeiro; 10 propostas
- Caminho com referencia: centro F minor (referencia); primaria Rearmonização — contorno da partitura; 3 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo chromatic; conducao 4.45
- Referencia na janela: 1:Eb6, Edim | 2:Fm7, F#dim | 3:Eb/G, G | 4:Ab6, Abm6 | 5:Eb6/G, C7(b9) | 6:Fm7, Bb9 | 7:G7, C7 | 8:F7, Bb7
- Cifras: 1:Eb, Edim | 2:Fm, F#dim | 3:Eb6/G, G6 | 4:Ab, Abm | 5:Eb/G, C7(b9) | 6:Fm, Bb9 | 7:G13, C9 | 8:F13, Bb9
- Baixo da referencia: Eb -> E -> F -> F# -> G -> G -> Ab -> Ab -> G -> C -> F -> Bb -> G -> C -> F -> Bb
- Baixo: Eb -> E -> F -> F# -> G -> G -> Ab -> Ab -> G -> C -> F -> Bb -> G -> C -> F -> Bb
- Preservacao do baixo: 16/16
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: usa aproximação cromática recorrente
- Centro da referencia: janela F minor; confiança strong; global Eb major; confiança strong
- Comparacao com referencia: alinhada; função 8/8; raiz 8/8
- Causas da comparacao: acompanha centro local, diverge do global

### Air mail special.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Ab
- Material importado: 35 compassos, 224 notas, 54 cifras, 4 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 7 compassos
- Centro escolhido: Ab major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência ii-V-I confirma Ab maior. Cadência V-I confirma Ab maior. Repousos recorrentes sustentam Ab maior.
- Propostas geradas: 8
- Cores funcionais: 1 geradas, 1 alternativas nao primarias
- Cores funcionais alternativas: 1:Ab | 2:Db | 3:Ab/C | 4:Ab6 | 5:Ab | 6:Db | 7:Gm7b5, Eb7 | 8:Dbm, Ab6
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Ab major (melodia); primaria Estratégia — Dominantes secundárias; 6 propostas
- Caminho com referencia: centro Ab major (referencia); primaria Rearmonização — contorno da partitura; 8 propostas
- Divergencia dos caminhos: proposta primaria, cifras
- Leitura da divergencia: mesmo centro, harmonização diferente
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo chromatic; conducao 4.41
- Referencia na janela: 2:Ab6, Fm7 | 3:Bbm7, Eb7 | 4:Ab6, Fm7 | 5:Bbm7, Eb7 | 6:Ab6, Ab7 | 7:Db6, Ddim | 8:Ab6/Eb, Fm7
- Cifras: 2:Ab, Fm | 3:Bbm, Eb13 | 4:Ab, Fm | 5:Bbm, Eb9 | 6:Ab, Ab9 | 7:Dbmaj7, Ddim | 8:Ab/Eb, Fm
- Baixo da referencia: Ab -> F -> Bb -> Eb -> Ab -> F -> Bb -> Eb -> Ab -> Ab -> Db -> D -> Eb -> F
- Baixo: Ab -> F -> Bb -> Eb -> Ab -> F -> Bb -> Eb -> Ab -> Ab -> Db -> D -> Eb -> F
- Preservacao do baixo: 14/14
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: usa aproximação cromática recorrente
- Centro da referencia: Ab major; confiança strong
- Comparacao com referencia: alinhada; função 7/7; raiz 7/7

### Airegin.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Ab
- Material importado: 34 compassos, 109 notas, 46 cifras, 3 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 8, 9
- Sobreposicao com referencia: 4 compassos
- Centro escolhido: Bb minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência V-i confirma Bb menor. Repousos recorrentes sustentam Bb menor. Acorde final repousa em Bb.
- Propostas geradas: 5
- Cores funcionais: 1 geradas, 1 alternativas nao primarias
- Cores funcionais alternativas: 1:F7 | 2:Ebm7 | 3:F7 | 4:Ebm7 | 5:F7 | 6:Ebm7 | 8:F7 | 9:Bbm
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro F minor (melodia); primaria Estratégia — Centro modal; 2 propostas
- Caminho com referencia: centro Bb minor (referencia); primaria Rearmonização — contorno da partitura; 5 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota radical; baixo functional; conducao 4.72
- Referencia na janela: 5:Fm | 6:C7alt | 8:F7(b9) | 9:Bbm
- Cifras: 5:Fm7 | 6:C7alt | 8:F7(b9) | 9:Bbm7
- Baixo da referencia: F -> C -> F -> Bb
- Baixo: F -> C -> F -> Bb
- Preservacao do baixo: 4/4
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: Bb minor; confiança strong
- Comparacao com referencia: alinhada; função 4/4; raiz 4/4

### Bright Size Life.musicxml

- Titulo importado: Imported Score
- Tom/armadura: D
- Material importado: 28 compassos, 128 notas, 18 cifras, 3 secoes
- Status: harmonizado
- Janela melodica: compassos 2, 3, 4, 5, 6, 7, 8, 9
- Sobreposicao com referencia: 5 compassos
- Centro escolhido: Bb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Bb maior. Acorde final repousa em Bb.
- Propostas geradas: 2
- Cores funcionais: 1 geradas, 1 alternativas nao primarias
- Cores funcionais alternativas: 2:Dm | 3:Bb | 4:Eb | 5:Bb/D | 6:Eb | 7:Bb/D | 8:Bb | 9:Bb
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro D major (melodia); primaria Estratégia — Melodia primeiro; 3 propostas
- Caminho com referencia: centro Bb major (referencia); primaria Rearmonização — contorno da partitura; 2 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo stepwise; conducao 4.93
- Referencia na janela: 3:Gmaj7 | 5:Bb/A | 7:D9 | 8:D/C | 9:Bbmaj7
- Cifras: 3:G6 | 5:Bb6/A | 7:D13 | 8:D6/C | 9:Bb6
- Baixo da referencia: G -> A -> D -> C -> Bb
- Baixo: G -> A -> D -> C -> Bb
- Preservacao do baixo: 5/5
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: predomina movimento por grau conjunto
- Centro da referencia: janela Bb major; confiança strong; global D major; confiança strong
- Comparacao com referencia: alinhada; função 5/5; raiz 5/5
- Causas da comparacao: acompanha centro local, diverge do global

### a child is born.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 38 compassos, 83 notas, 39 cifras, 2 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 8 compassos
- Centro escolhido: Bb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Bb maior. Primeiro acorde apresenta Bb maior.
- Propostas geradas: 7
- Cores funcionais: 3 geradas, 3 alternativas nao primarias
- Cores funcionais alternativas: 1:Bbmaj7 | 2:Ebmaj7 | 4:F13 | 5:Bbmaj7; 1:Bb | 2:Ebm/Bb | 3:Gm | 4:Ebm/Bb | 5:Bb | 6:Ebm/B | 7:Am7(b5) | 8:D7(#9); 1:Bb | 2:Eb | 3:Bb/D | 4:Eb | 5:Bb/D | 6:Eb | 7:Bb/D | 8:Bb
- Cores bVI/bVII na referencia: 3 ocorrencias (comp. 2: Ebm/Bb como bVII; comp. 4: Ebm/Bb como bVII; comp. 6: Ebm/B como bVII)
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Melodia primeiro; 3 propostas
- Caminho com referencia: centro Bb major (referencia); primaria Rearmonização — contorno da partitura; 7 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo mixed; conducao 4.14
- Referencia na janela: 1:Bb | 2:Ebm/Bb | 3:Bb | 4:Ebm/Bb | 5:Bb | 6:Ebm/B | 7:Am7b5 | 8:D7(#9)
- Cifras: 1:Bb6 | 2:Ebm7/Bb | 3:Bb6 | 4:Ebm7/Bb | 5:Bb6 | 6:Ebm7/B | 7:Am7b5 | 8:D7(#9)
- Baixo da referencia: Bb -> Bb -> Bb -> Bb -> Bb -> B -> A -> D
- Baixo: Bb -> Bb -> Bb -> Bb -> Bb -> B -> A -> D
- Preservacao do baixo: 8/8
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: combina movimentos funcionais e locais
- Centro da referencia: Bb major; confiança medium
- Comparacao com referencia: alinhada; função 8/8; raiz 8/8

### a fine romance.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 25 compassos, 67 notas, 41 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 7 compassos
- Centro escolhido: D minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam D menor. Acorde final repousa em D.
- Propostas geradas: 3
- Cores funcionais: 2 geradas, 2 alternativas nao primarias
- Cores funcionais alternativas: 1:C7 | 2:Dm7 | 3:A7/C# | 4:Dm6 | 5:Dm6 | 6:C7 | 7:Dm7 | 8:Dm; D#dim7 implica B7(b9)
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Tonal Clássico; 7 propostas
- Caminho com referencia: centro D minor (referencia); primaria Rearmonização — contorno da partitura; 3 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo chromatic; conducao 3.11
- Referencia na janela: 2:C6 | 3:C#dim | 4:G7/D | 5:D#dim7 | 6:Em7 | 7:Am7 | 8:Dm7
- Cifras: 2:C | 3:C#dim | 4:G9/D | 5:D#dim7 | 6:Em | 7:Am | 8:Dm
- Baixo da referencia: C -> C# -> D -> D# -> E -> A -> D
- Baixo: C -> C# -> D -> D# -> E -> A -> D
- Preservacao do baixo: 7/7
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: usa aproximação cromática recorrente
- Centro da referencia: janela D minor; confiança medium; global C major; confiança strong
- Comparacao com referencia: alinhada; função 7/7; raiz 7/7
- Causas da comparacao: função aparente preservada; acompanha centro local, diverge do global

### affirmation.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 36 compassos, 214 notas, 21 cifras, 2 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 4 compassos
- Centro escolhido: B minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam B menor. Acorde final repousa em B.
- Propostas geradas: 6
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro B minor (melodia); primaria Estratégia — Centro modal; 4 propostas
- Caminho com referencia: centro B minor (referencia); primaria Rearmonização — contorno da partitura; 6 propostas
- Divergencia dos caminhos: proposta primaria, cifras
- Leitura da divergencia: mesmo centro, harmonização diferente
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota conservative; baixo functional; conducao 2.70
- Referencia na janela: 2:Em9 | 4:Bm7 | 6:Em9 | 8:Bm7
- Cifras: 2:Em | 4:Bm | 6:Em | 8:Bm
- Baixo da referencia: E -> B -> E -> B
- Baixo: E -> B -> E -> B
- Preservacao do baixo: 4/4
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela B minor; confiança strong; global G major; confiança strong
- Comparacao com referencia: alinhada; função 4/4; raiz 4/4
- Causas da comparacao: acompanha centro local, diverge do global

### african flower.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 40 compassos, 165 notas, 23 cifras, 3 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 4 compassos
- Centro escolhido: Eb minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Eb menor. Acorde final repousa em Eb. Primeiro acorde apresenta Eb menor.
- Propostas geradas: 5
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Ab minor (melodia); primaria Estratégia — Tonal Clássico; 1 propostas
- Caminho com referencia: centro Eb minor (referencia); primaria Rearmonização — contorno da partitura; 5 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo mixed; conducao 2.55
- Referencia na janela: 1:Ebm7 | 5:Abm7 | 6:Gbm7 | 7:Ebm7
- Cifras: 1:Ebm | 5:Abm | 6:Gbm | 7:Ebm
- Baixo da referencia: Eb -> Ab -> Gb -> Eb
- Baixo: Eb -> Ab -> Gb -> Eb
- Preservacao do baixo: 4/4
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: combina movimentos funcionais e locais
- Centro da referencia: Eb minor; confiança strong
- Comparacao com referencia: alinhada; função 4/4; raiz 4/4

### afro blue.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Ab
- Material importado: 40 compassos, 75 notas, 38 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 8 compassos
- Centro escolhido: F minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam F menor. Acorde final repousa em F. Primeiro acorde apresenta F menor.
- Propostas geradas: 11
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro F minor (melodia); primaria Estratégia — Tonal Clássico; 9 propostas
- Caminho com referencia: centro F minor (referencia); primaria Rearmonização — contorno da partitura; 11 propostas
- Divergencia dos caminhos: proposta primaria, cifras
- Leitura da divergencia: mesmo centro, harmonização diferente
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota conservative; baixo chromatic; conducao 2.44
- Referencia na janela: 1:Fm7 | 2:Gm7 | 3:Ab | 4:Gm7 | 5:Fm7 | 6:Gm7 | 7:Ab, Gm7 | 8:Fm7
- Cifras: 1:Fm | 2:Gm | 3:Ab6 | 4:Gm | 5:Fm | 6:Gm | 7:Ab6, Gm | 8:Fm
- Baixo da referencia: F -> G -> Ab -> G -> F -> G -> Ab -> G -> F
- Baixo: F -> G -> Ab -> G -> F -> G -> Ab -> G -> F
- Preservacao do baixo: 9/9
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: usa aproximação cromática recorrente
- Centro da referencia: F minor; confiança strong
- Comparacao com referencia: alinhada; função 8/8; raiz 8/8

### afron-centric.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 27 compassos, 87 notas, 12 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 2 compassos
- Centro escolhido: C minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam C menor. Acorde final repousa em C.
- Propostas geradas: 4
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Bb major (melodia); primaria Estratégia — Melodia primeiro; 3 propostas
- Caminho com referencia: centro C minor (referencia); primaria Rearmonização — contorno da partitura; 4 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota moderate; baixo stepwise; conducao 4.65
- Referencia na janela: 2:Dbmaj7(#11) | 6:Cm11
- Cifras: 2:Dbmaj7(#11) | 6:Cm
- Baixo da referencia: Db -> C
- Baixo: Db -> C
- Preservacao do baixo: 2/2
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: predomina movimento por grau conjunto
- Centro da referencia: janela C minor; confiança medium; global Gb major; confiança medium
- Comparacao com referencia: alinhada; função 2/2; raiz 2/2
- Causas da comparacao: acompanha centro local, diverge do global

### after you've gone.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 20 compassos, 93 notas, 34 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 8 compassos
- Centro escolhido: Bb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência V-I confirma Bb maior. Repousos recorrentes sustentam Bb maior.
- Propostas geradas: 15
- Cores funcionais: 1 geradas, 1 alternativas nao primarias
- Cores funcionais alternativas: 1:Bb | 2:F/A | 3:F | 4:Bb6 | 5:Bb | 6:F/A | 7:Am7b5, F7 | 8:Ebm, Bb
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro F major (melodia); primaria Estratégia — Melodia primeiro; 5 propostas
- Caminho com referencia: centro Bb major (referencia); primaria Rearmonização — contorno da partitura; 15 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo functional; conducao 6.18
- Referencia na janela: 1:Eb | 2:Ebm6, Ab7 | 3:Bbm7 | 4:D7, G7 | 5:C7 | 6:F7 | 7:Bb6 | 8:F7
- Cifras: 1:Ebmaj7 | 2:Ebm, Ab9 | 3:Bbm6 | 4:D9, G9 | 5:C9 | 6:F9 | 7:Bbmaj7 | 8:F13
- Baixo da referencia: Eb -> Eb -> Ab -> Bb -> D -> G -> C -> F -> Bb -> F
- Baixo: Eb -> Eb -> Ab -> Bb -> D -> G -> C -> F -> Bb -> F
- Preservacao do baixo: 10/10
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: Bb major; confiança strong
- Comparacao com referencia: alinhada; função 8/8; raiz 8/8

### after you.musicxml

- Titulo importado: Untitled score
- Tom/armadura: D
- Material importado: 34 compassos, 142 notas, 55 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 7 compassos
- Centro escolhido: B minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam B menor. Acorde final repousa em B.
- Propostas geradas: 9
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro D major (melodia); primaria Estratégia — Melodia primeiro; 3 propostas
- Caminho com referencia: centro B minor (referencia); primaria Rearmonização — contorno da partitura; 9 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a harmonia escrita resolve a ambiguidade relativo maior/menor
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota moderate; baixo mixed; conducao 3.95
- Referencia na janela: 2:G/A, F#/A | 3:Bm7 | 4:Em, D, A/C# | 5:G/A | 6:G/A, F#/D | 7:Bm7 | 8:Em, D, Am7, Bm7
- Cifras: 2:Gmaj7/A, F#6/A | 3:Bm | 4:Em7, D6, A6/C# | 5:G6/A | 6:G6/A, F#6/D | 7:Bm | 8:Em7, D6, Am, Bm
- Baixo da referencia: A -> A -> B -> E -> D -> C# -> A -> A -> D -> B -> E -> D -> A -> B
- Baixo: A -> A -> B -> E -> D -> C# -> A -> A -> D -> B -> E -> D -> A -> B
- Preservacao do baixo: 14/14
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: combina movimentos funcionais e locais
- Centro da referencia: janela B minor; confiança strong; global G major; confiança strong
- Comparacao com referencia: alinhada; função 7/7; raiz 7/7
- Causas da comparacao: acompanha centro local, diverge do global

### afternoon in Paris.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 26 compassos, 110 notas, 39 cifras, 2 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 7 compassos
- Centro escolhido: Bb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência ii-V-I confirma Bb maior. Cadência V-I confirma Bb maior. Repousos recorrentes sustentam Bb maior.
- Propostas geradas: 9
- Cores funcionais: 2 geradas, 2 alternativas nao primarias
- Cores funcionais alternativas: 1:Am7b5 | 2:D7b13/Bb | 3:Gm6; Bdim7 implica G7(b9)
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Melodia primeiro; 8 propostas
- Caminho com referencia: centro Bb major (referencia); primaria Rearmonização — contorno da partitura; 9 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota chromatic; baixo functional; conducao 5.79
- Referencia na janela: 2:C | 3:Cm7, F7 | 4:Bb | 5:Bbm7, Eb7 | 6:Ab | 7:Dm7b5, G7(b9) | 8:C, Am7
- Cifras: 2:Cmaj7 | 3:Cm, F13 | 4:Bbmaj7 | 5:Bbm, Eb13 | 6:Abmaj7 | 7:Dm7b5, G7(b9) | 8:C6, Am
- Baixo da referencia: C -> C -> F -> Bb -> Bb -> Eb -> Ab -> D -> G -> C -> A
- Baixo: C -> C -> F -> Bb -> Bb -> Eb -> Ab -> D -> G -> C -> A
- Preservacao do baixo: 11/11
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela Bb major; confiança strong; global C major; confiança strong
- Comparacao com referencia: alinhada; função 7/7; raiz 7/7
- Causas da comparacao: acompanha centro local, diverge do global

### asa branca.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 16 compassos, 37 notas, 0 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 0 compassos
- Centro escolhido: C major
- Propostas geradas: 7
- Cores funcionais: 1 geradas, 1 alternativas nao primarias
- Cores funcionais alternativas: 1:C | 2:C | 3:C | 4:C | 5:C | 6:C | 7:Bm7b5, G7 | 8:Fm, C
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Harmonia básica I-IV-V; 7 propostas
- Caminho com referencia: centro C major (melodia); primaria Estratégia — Harmonia básica I-IV-V; 7 propostas
- Divergencia dos caminhos: caminhos alinhados
- Leitura da divergencia: caminhos alinhados
- Proposta primaria: Estratégia — Harmonia básica I-IV-V
- Camada da proposta: harmonia basica
- Alvo cadencial da proposta: n/a
- Resumo: rota moderate; baixo chromatic; conducao 4.33
- Cifras: 1:C | 2:C | 3:C7 | 4:F | 5:C/E | 6:C | 7:G7/B | 8:C
- Baixo: C -> C -> C -> F -> E -> C -> B -> C
- Evidencias da proposta:
  - Percurso funcional: repouso -> preparação -> repouso -> tensão -> repouso
  - Leitura da frase: a melodia abre espaço para subdominante
  - Leitura da frase: identifica preparação dominante antes da resolução
  - Leitura da frase: final aberto, sem cadência forte
- Comparacao com referencia: sem referencia comparavel
- Diagnosticos principais:
  - ii-V local omitido: a chegada em E não teve cobertura melódica suficiente para uma cadência local.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.
  - Linha de baixo cromática: o baixo aproxima acordes por semitom com boa continuidade.

### autum leaves.musicxml

- Titulo importado: Autumn leaves
- Tom/armadura: G
- Material importado: 71 compassos, 218 notas, 67 cifras, 4 secoes
- Status: harmonizado
- Janela melodica: compassos 4, 5, 6, 7, 8, 9, 10, 11
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: G major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência ii-V-I confirma G maior. Cadência V-I confirma G maior. Repousos recorrentes sustentam G maior.
- Propostas geradas: 6
- Cores funcionais: 3 geradas, 3 alternativas nao primarias
- Cores funcionais alternativas: 4:D7 | 5:C | 6:D7 | 7:G | 8:C | 9:C | 10:D7 | 11:G; 4:D | 5:C | 6:D | 7:G | 8:C | 9:C | 10:F#m7b5, D7 | 11:Cm, G; 4:Eb7, D | 5:Db7, C | 6:D | 7:G | 8:C | 9:C | 10:F#m7b5, D7 | 11:Ab7/Eb, G
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro G major (melodia); primaria Estratégia — Melodia primeiro; 4 propostas
- Caminho com referencia: centro G major (referencia); primaria Rearmonização — contorno da partitura; 6 propostas
- Divergencia dos caminhos: proposta primaria, cifras
- Leitura da divergencia: mesmo centro, harmonização diferente
- Proposta primaria: Rearmonização — contorno da partitura
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota conservative; baixo functional; conducao 5.70
- Referencia na janela: 9:Am7 | 10:D7 | 11:Gmaj7
- Cifras: 9:Am | 10:D9 | 11:G
- Baixo da referencia: A -> D -> G
- Baixo: A -> D -> G
- Preservacao do baixo: 3/3
- Evidencias da proposta:
  - preserva a rota harmônica indicada pela partitura
  - simplifica cores locais quando a melodia permite a leitura
  - mantém as raízes de referência como guia sem copiar literalmente toda a cifra
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela G major; confiança strong; global E minor; confiança strong
- Comparacao com referencia: alinhada; função 3/3; raiz 3/3
- Causas da comparacao: acompanha centro local, diverge do global

### exemplo.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 4 compassos, 6 notas, 0 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4
- Sobreposicao com referencia: 0 compassos
- Centro escolhido: C major
- Propostas geradas: 18
- Cores funcionais: 9 geradas, 9 alternativas nao primarias
- Cores funcionais alternativas: F#m7b5 implica Fmaj7; Dm6 implica Bm7b5 ou G7; F#m7(b5) implica Fmaj7
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Tonal Clássico; 18 propostas
- Caminho com referencia: centro C major (melodia); primaria Estratégia — Tonal Clássico; 18 propostas
- Divergencia dos caminhos: caminhos alinhados
- Leitura da divergencia: caminhos alinhados
- Proposta primaria: Estratégia — Tonal Clássico
- Camada da proposta: rearmonizacao
- Alvo cadencial da proposta: n/a
- Resumo: rota conservative; baixo functional; conducao 5.90
- Cifras: 1:Cmaj7 | 2:Fmaj7 | 3:G13 | 4:Cmaj7
- Baixo: C -> F -> G -> C
- Evidencias da proposta:
  - Progressão orientada por ciclos de 4as/5as até o destino G
  - Estabilidade diatônica em C
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
  - Condução de vozes: sétima dominante resolve descendo para a terça do alvo
- Comparacao com referencia: sem referencia comparavel
- Diagnosticos principais:
  - ii-V local omitido: a chegada em G não teve cobertura melódica suficiente para uma cadência local.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

## Leitura de F39

A bateria real mostra tres tipos de entrada que o sistema precisa continuar distinguindo:

1. melodias sem cifra, onde a engine precisa propor a harmonia inteira;
2. melodias com cifras, onde a engine deve harmonizar sem perder a possibilidade futura de comparar com a referencia;
3. arquivos com cifra mas sem notas importadas, que testam ingestao de referencia mas nao sao entrada melodica harmonizavel.

As cores funcionais aparecem de forma pontual e, no estado atual, ficam como alternativas nao primarias. Isso sugere que elas podem ser expostas como camada de rearmonizacao/cores sem disputar diretamente com a harmonia basica.
As leituras de bVI/bVII na referencia ajudam a separar emprestimo modal tonal de centro modal antes de liberar novas estrategias gerativas.
A comparacao melodia-only vs referencia-aware separa duas competencias: harmonizar a partir da melodia e entender a harmonia escrita pelo autor.
As amostras de triagem nao sao conclusao estatistica: elas apenas indicam quais obras abrir primeiro enquanto o corpus de referencia ainda e pequeno.

