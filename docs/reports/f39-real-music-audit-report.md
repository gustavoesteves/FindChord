# F39 — Relatorio musical por obra

Este relatorio e gerado a partir das partituras em `docs/musics` e resume a leitura atual do motor sobre cada arquivo real.

A leitura nao pretende ser julgamento estetico final. Ela registra o que o sistema conseguiu importar, qual janela melodica foi usada, qual centro foi escolhido e qual proposta primaria saiu do pipeline.

## Resumo geral

- Arquivos auditados: 18
- Arquivos harmonizados: 18
- Arquivos apenas com referencia harmonica: 0
- Arquivos sem proposta na janela auditada: 0
- Obras com cores funcionais: 3
- Cores funcionais geradas: 8
- Cores funcionais como alternativas: 8
- Obras com bVI/bVII na referencia: 0
- Cores bVI/bVII na referencia: 0
- Caminhos alinhados: 4
- Referencia destrava harmonizacao: 1
- Referencia muda centro: 8
- Mesmo centro, harmonizacao diferente: 5
- Sem proposta comparavel entre caminhos: 0
- Triagem centro local da referencia: 8
- Triagem revisar centro inferido: 0
- Triagem vocabulario melodia-only: 0
- Amostras de triagem - referencia muda centro: Airegin.musicxml (F minor -> Bb minor); Bright Size Life.musicxml (D major -> Bb major); a child is born.musicxml (C major -> Bb major)
- Amostras de triagem - mesmo centro, harmonizacao diferente: Ain't misbehavin.musicxml (Estratégia — Melodia primeiro -> Estratégia — Centro de referência); Air mail special.musicxml (Estratégia — Gramática funcional ii-V -> Estratégia — Dominantes secundárias); affirmation.musicxml (Estratégia — Gramática funcional ii-V -> Estratégia — Centro de referência)
- Amostras de triagem - referencia destrava harmonizacao: Actual proof.musicxml (sem proposta -> Estratégia — Centro de referência)

## Triagem de centros alterados pela referencia

- Airegin.musicxml: hipotese: centro local da referencia; melodia F minor; referencia Bb minor; proposta Estratégia — Centro de referência; janela Bb minor; confiança medium; global Ab major; confiança strong
- Bright Size Life.musicxml: hipotese: centro local da referencia; melodia D major; referencia Bb major; proposta Estratégia — Centro de referência; janela Bb major; confiança strong; global D major; confiança strong
- a child is born.musicxml: hipotese: centro local da referencia; melodia C major; referencia Bb major; proposta Estratégia — Tonal Clássico; Bb major; confiança strong
- a fine romance.musicxml: hipotese: centro local da referencia; melodia C major; referencia D minor; proposta Estratégia — Centro de referência; janela D minor; confiança medium; global C major; confiança strong
- african flower.musicxml: hipotese: centro local da referencia; melodia Ab minor; referencia Eb minor; proposta Estratégia — Centro de referência; Eb minor; confiança strong
- afron-centric.musicxml: hipotese: centro local da referencia; melodia Bb major; referencia C minor; proposta Estratégia — Centro de referência; janela C minor; confiança medium; global Gb major; confiança medium
- after you.musicxml: hipotese: centro local da referencia; melodia D major; referencia B minor; proposta Estratégia — Tonal Clássico; janela B minor; confiança strong; global G major; confiança strong
- afternoon in Paris.musicxml: hipotese: centro local da referencia; melodia C major; referencia Bb major; proposta Estratégia — Tonal Clássico; janela Bb major; confiança strong; global C major; confiança strong

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
- Propostas geradas: 1
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: sem proposta
- Caminho com referencia: centro E minor (referencia); primaria Estratégia — Centro de referência; 1 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência destrava a harmonização
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Perfil: rota chromatic; baixo chromatic; conducao 3.24
- Cifras: 2:Em7 | 5:Em | 6:Em | 7:Em | 9:B7/D# | 10:D7 | 11:B7/D# | 12:Em
- Baixo: E -> E -> E -> E -> D# -> D -> D# -> E
- Evidencias da proposta:
  - preserva o centro indicado pela referência em E
  - prioriza acordes próximos ao campo funcional antes de explorar cadências locais
  - acompanha a melodia com harmonia estável e baixa densidade
  - Centro da frase: Repousos recorrentes sustentam E menor.
- Centro da referencia: janela E minor; confiança medium; global Eb major; confiança strong
- Comparacao com referencia: divergente; função 1/4; raiz 0/4
- Causas da comparacao: função preservada com outra raiz; centro global divergente; acompanha centro local, diverge do global; idioma da referência relevante; raiz divergente na janela
- Diagnosticos principais:
  - ii-V local omitido: a chegada em B não teve cobertura melódica suficiente para uma cadência local.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.

### Ain't it the truth.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 38 compassos, 153 notas, 36 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 6 compassos
- Centro escolhido: Bb minor
- Propostas geradas: 4
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Bb minor (melodia); primaria Estratégia — Gramática funcional ii-V; 4 propostas
- Caminho com referencia: centro Bb minor (melodia); primaria Estratégia — Gramática funcional ii-V; 4 propostas
- Divergencia dos caminhos: caminhos alinhados
- Leitura da divergencia: caminhos alinhados
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Camada da proposta: harmonia basica
- Alvo cadencial da proposta: Db
- Perfil: rota moderate; baixo functional; conducao 7.50
- Cifras: 6:Ebm7 | 7:Ab7 | 8:Dbmaj7
- Baixo: Eb -> Ab -> Db
- Evidencias da proposta:
  - reconhece célula ii-V local em Db
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela Ab major; confiança weak; global Db major; confiança strong
- Comparacao com referencia: divergente; função 1/3; raiz 0/3
- Causas da comparacao: função preservada com outra raiz; centro local divergente; centro global divergente; idioma da referência relevante; raiz divergente na janela
- Diagnosticos principais:
  - Menor funcional omitido: a melodia não traz sensível nem sexta maior para sustentar cadência dominante.
  - SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### Ain't misbehavin.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Eb
- Material importado: 26 compassos, 110 notas, 50 cifras, 3 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 8 compassos
- Centro escolhido: Eb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Eb maior. Primeiro acorde apresenta Eb maior.
- Propostas geradas: 8
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Eb major (melodia); primaria Estratégia — Melodia primeiro; 9 propostas
- Caminho com referencia: centro Eb major (referencia); primaria Estratégia — Centro de referência; 8 propostas
- Divergencia dos caminhos: proposta primaria, cifras
- Leitura da divergencia: mesmo centro, harmonização diferente
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Perfil: rota conservative; baixo stepwise; conducao 3.64
- Cifras: 1:Eb | 2:Fm7 | 3:Cm7/Eb | 4:Fm7 | 5:Eb | 6:Fm7 | 7:Eb | 8:Eb
- Baixo: Eb -> F -> Eb -> F -> Eb -> F -> Eb -> Eb
- Evidencias da proposta:
  - preserva o centro indicado pela referência em Eb
  - prioriza acordes próximos ao campo funcional antes de explorar cadências locais
  - acompanha a melodia com harmonia estável e baixa densidade
  - Centro da frase: Repousos recorrentes sustentam Eb maior.
- Centro da referencia: Eb major; confiança medium
- Comparacao com referencia: alinhada; função 6/8; raiz 5/8
- Causas da comparacao: função preservada com outra raiz
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.

### Air mail special.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Ab
- Material importado: 35 compassos, 224 notas, 54 cifras, 4 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 7 compassos
- Centro escolhido: Ab major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência ii-V-I confirma Ab maior. Repousos recorrentes sustentam Ab maior. Primeiro acorde apresenta Ab maior.
- Propostas geradas: 6
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Ab major (melodia); primaria Estratégia — Gramática funcional ii-V; 6 propostas
- Caminho com referencia: centro Ab major (referencia); primaria Estratégia — Dominantes secundárias; 6 propostas
- Divergencia dos caminhos: proposta primaria, cifras
- Leitura da divergencia: mesmo centro, harmonização diferente
- Proposta primaria: Estratégia — Dominantes secundárias
- Camada da proposta: rearmonizacao
- Perfil: rota chromatic; baixo chromatic; conducao 4.53
- Cifras: 1:Ab | 2:Db | 3:Ab/C | 4:Ab | 5:Ab7 | 6:Db | 7:Gm7b5/Bb7/Ab/Eb7/G | 8:Ab
- Baixo: Ab -> Db -> C -> Ab -> Ab -> Db -> G -> Ab -> G -> Ab
- Evidencias da proposta:
  - Percurso funcional: repouso -> preparação -> repouso -> preparação -> tensão -> repouso
  - Leitura da frase: reconhece fechamento no centro tonal
  - acompanha a melodia preservando as notas estruturais principais
  - adiciona movimento harmônico moderado sem saturar a frase
- Centro da referencia: Ab major; confiança strong
- Comparacao com referencia: parcial; função 3/7; raiz 2/7
- Causas da comparacao: função preservada com outra raiz; cadência da referência não acompanhada; raiz divergente na janela
- Diagnosticos principais:
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.
  - Linha de baixo cromática: o baixo aproxima acordes por semitom com boa continuidade.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### Airegin.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Ab
- Material importado: 34 compassos, 109 notas, 46 cifras, 3 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 8, 9
- Sobreposicao com referencia: 4 compassos
- Centro escolhido: Bb minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Bb menor. Acorde final repousa em Bb.
- Propostas geradas: 4
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro F minor (melodia); primaria Estratégia — Gramática funcional ii-V; 2 propostas
- Caminho com referencia: centro Bb minor (referencia); primaria Estratégia — Centro de referência; 4 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Perfil: rota radical; baixo stepwise; conducao 3.56
- Cifras: 1:F7 | 2:Ebm7 | 3:F7 | 4:Ebm7 | 5:F7 | 6:Ebm7 | 8:F7 | 9:Bbm
- Baixo: F -> Eb -> F -> Eb -> F -> Eb -> F -> Bb
- Evidencias da proposta:
  - preserva o centro indicado pela referência em Bb
  - prioriza acordes próximos ao campo funcional antes de explorar cadências locais
  - acompanha a melodia com harmonia estável e baixa densidade
  - Centro da frase: Repousos recorrentes sustentam Bb menor.
- Centro da referencia: janela Bb minor; confiança medium; global Ab major; confiança strong
- Comparacao com referencia: alinhada; função 4/4; raiz 3/4
- Causas da comparacao: função preservada com outra raiz; acompanha centro local, diverge do global
- Diagnosticos principais:
  - Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Linha de baixo caminhante: o baixo conecta acordes por grau conjunto.

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
- Propostas geradas: 1
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro D major (melodia); primaria Estratégia — Melodia primeiro; 3 propostas
- Caminho com referencia: centro Bb major (referencia); primaria Estratégia — Centro de referência; 1 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Perfil: rota chromatic; baixo chromatic; conducao 3.02
- Cifras: 2:Dm | 3:Bb | 4:Eb | 5:Bb/D | 6:Eb | 7:Bb/D | 8:Bb | 9:Bb
- Baixo: D -> Bb -> Eb -> D -> Eb -> D -> Bb -> Bb
- Evidencias da proposta:
  - preserva o centro indicado pela referência em Bb
  - prioriza acordes próximos ao campo funcional antes de explorar cadências locais
  - acompanha a melodia com harmonia estável e baixa densidade
  - Centro da frase: Repousos recorrentes sustentam Bb maior.
- Centro da referencia: janela Bb major; confiança strong; global D major; confiança strong
- Comparacao com referencia: alinhada; função 5/5; raiz 3/5
- Causas da comparacao: função preservada com outra raiz; acompanha centro local, diverge do global
- Diagnosticos principais:
  - ii-V local omitido: a chegada em D não teve cobertura melódica suficiente para uma cadência local.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.

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
- Propostas geradas: 5
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Melodia primeiro; 2 propostas
- Caminho com referencia: centro Bb major (referencia); primaria Estratégia — Tonal Clássico; 5 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Estratégia — Tonal Clássico
- Camada da proposta: rearmonizacao
- Perfil: rota conservative; baixo functional; conducao 5.90
- Cifras: 1:Bbmaj7 | 2:Ebmaj7 | 4:F13 | 5:Bbmaj7
- Baixo: Bb -> Eb -> F -> Bb
- Evidencias da proposta:
  - Progressão orientada por ciclos de 4as/5as até o destino C
  - Estabilidade diatônica em Bb
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
  - Condução de vozes: sétima dominante resolve descendo para a terça do alvo
- Centro da referencia: Bb major; confiança strong
- Comparacao com referencia: alinhada; função 3/4; raiz 3/4
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

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
- Propostas geradas: 2
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Gramática funcional ii-V; 8 propostas
- Caminho com referencia: centro D minor (referencia); primaria Estratégia — Centro de referência; 2 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Perfil: rota radical; baixo chromatic; conducao 4.76
- Cifras: 1:C7 | 2:Dm7 | 3:A7/C# | 4:Dm6 | 5:Dm6 | 6:C7 | 7:Dm7 | 8:Dm
- Baixo: C -> D -> C# -> D -> D -> C -> D -> D
- Evidencias da proposta:
  - preserva o centro indicado pela referência em D
  - prioriza acordes próximos ao campo funcional antes de explorar cadências locais
  - acompanha a melodia com harmonia estável e baixa densidade
  - Centro da frase: Repousos recorrentes sustentam D menor.
- Centro da referencia: janela D minor; confiança medium; global C major; confiança strong
- Comparacao com referencia: divergente; função 2/7; raiz 3/7
- Causas da comparacao: centro global divergente; acompanha centro local, diverge do global; idioma da referência relevante
- Diagnosticos principais:
  - Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.
  - Linha de baixo cromática: o baixo aproxima acordes por semitom com boa continuidade.

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
- Propostas geradas: 5
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro B minor (melodia); primaria Estratégia — Gramática funcional ii-V; 4 propostas
- Caminho com referencia: centro B minor (referencia); primaria Estratégia — Centro de referência; 5 propostas
- Divergencia dos caminhos: proposta primaria, cifras
- Leitura da divergencia: mesmo centro, harmonização diferente
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Perfil: rota chromatic; baixo mixed; conducao 4.67
- Cifras: 1:Bm7 | 2:Bm7 | 3:Bm7 | 4:Em7 | 5:C#m7b5 | 6:Bm7 | 7:Bm7 | 8:Bm7
- Baixo: B -> B -> B -> E -> C# -> B -> B -> B
- Evidencias da proposta:
  - preserva o centro indicado pela referência em B
  - prioriza acordes próximos ao campo funcional antes de explorar cadências locais
  - acompanha a melodia com harmonia estável e baixa densidade
  - Centro da frase: Repousos recorrentes sustentam B menor.
- Centro da referencia: B minor; confiança strong
- Comparacao com referencia: divergente; função 1/4; raiz 1/4
- Causas da comparacao: raiz divergente na janela
- Diagnosticos principais:
  - SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.

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
- Propostas geradas: 4
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Ab minor (melodia); primaria Estratégia — Tonal Clássico; 1 propostas
- Caminho com referencia: centro Eb minor (referencia); primaria Estratégia — Centro de referência; 4 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Perfil: rota radical; baixo mixed; conducao 3.67
- Cifras: 1:Bb7 | 2:Abm7 | 3:Abm7 | 4:Ebm/Gb | 5:Ebm | 6:Ebm | 7:Fm7b5 | 8:Ebm
- Baixo: Bb -> Ab -> Ab -> Gb -> Eb -> Eb -> F -> Eb
- Evidencias da proposta:
  - preserva o centro indicado pela referência em Eb
  - prioriza acordes próximos ao campo funcional antes de explorar cadências locais
  - acompanha a melodia com harmonia estável e baixa densidade
  - Centro da frase: Repousos recorrentes sustentam Eb menor.
- Centro da referencia: Eb minor; confiança strong
- Comparacao com referencia: divergente; função 0/4; raiz 0/4
- Causas da comparacao: raiz divergente na janela
- Diagnosticos principais:
  - SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.

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
- Cores funcionais: 1 geradas, 1 alternativas nao primarias
- Cores funcionais alternativas: Bdim/F implica G7(b9)
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro F minor (melodia); primaria Estratégia — Gramática funcional ii-V; 10 propostas
- Caminho com referencia: centro F minor (referencia); primaria Estratégia — Dominantes secundárias; 11 propostas
- Divergencia dos caminhos: proposta primaria, cifras
- Leitura da divergencia: mesmo centro, harmonização diferente
- Proposta primaria: Estratégia — Dominantes secundárias
- Camada da proposta: rearmonizacao
- Perfil: rota chromatic; baixo chromatic; conducao 4.53
- Cifras: 1:F | 2:Bb | 3:Bb | 4:F/A | 5:F7 | 6:Bb | 7:Em7b5/G7/F/C7/E | 8:F
- Baixo: F -> Bb -> Bb -> A -> F -> Bb -> E -> F -> E -> F
- Evidencias da proposta:
  - Percurso funcional: repouso -> preparação -> repouso -> preparação -> tensão -> repouso
  - Leitura da frase: a melodia abre espaço para subdominante
  - Leitura da frase: reconhece fechamento no centro tonal
  - Leitura da frase: fechamento plagal sugerido pela melodia
- Centro da referencia: F minor; confiança strong
- Comparacao com referencia: parcial; função 5/8; raiz 3/8
- Causas da comparacao: função preservada com outra raiz; idioma da referência relevante; raiz divergente na janela
- Diagnosticos principais:
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.
  - Linha de baixo cromática: o baixo aproxima acordes por semitom com boa continuidade.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

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
- Propostas geradas: 3
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro Bb major (melodia); primaria Estratégia — Melodia primeiro; 3 propostas
- Caminho com referencia: centro C minor (referencia); primaria Estratégia — Centro de referência; 3 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Perfil: rota moderate; baixo mixed; conducao 4.56
- Cifras: 1:Cm | 2:Cm | 3:Fm7 | 4:Cm/Eb | 5:Cm | 6:Fm7 | 7:Bb7 | 8:Cm7
- Baixo: C -> C -> F -> Eb -> C -> F -> Bb -> C
- Evidencias da proposta:
  - preserva o centro indicado pela referência em C
  - prioriza acordes próximos ao campo funcional antes de explorar cadências locais
  - acompanha a melodia com harmonia estável e baixa densidade
  - Centro da frase: Repousos recorrentes sustentam C menor.
- Centro da referencia: janela C minor; confiança medium; global Gb major; confiança medium
- Comparacao com referencia: divergente; função 0/2; raiz 0/2
- Causas da comparacao: centro global divergente; acompanha centro local, diverge do global; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Suspensão resolvida: a melodia cria tensão momentânea e resolve por grau conjunto em nota sustentada.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.

### after you've gone.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 20 compassos, 93 notas, 34 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 8 compassos
- Centro escolhido: F major
- Propostas geradas: 5
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro F major (melodia); primaria Estratégia — Melodia primeiro; 5 propostas
- Caminho com referencia: centro F major (melodia); primaria Estratégia — Melodia primeiro; 5 propostas
- Divergencia dos caminhos: caminhos alinhados
- Leitura da divergencia: caminhos alinhados
- Proposta primaria: Estratégia — Melodia primeiro
- Camada da proposta: harmonia basica
- Perfil: rota moderate; baixo pedal; conducao 5.89
- Cifras: 1:F6/9 | 2:F6/9 | 3:F6/9 | 4:F6/9 | 5:F6/9 | 6:C7/E | 7:F6/9 | 8:F
- Baixo: F -> F -> F -> F -> F -> E -> F -> F
- Evidencias da proposta:
  - prioriza acordes diatônicos que sustentam as notas estruturais da melodia
  - mantém baixa densidade harmônica enquanto não há cifra de referência
  - evita forçar cadência local quando a frase pede sustentação por cor
  - Condução de vozes: usa inversão simples para suavizar o baixo
- Centro da referencia: janela Eb major; confiança weak; global Bb major; confiança strong
- Comparacao com referencia: divergente; função 3/8; raiz 1/8
- Causas da comparacao: função preservada com outra raiz; centro local divergente; centro global divergente; idioma da referência relevante; raiz divergente na janela
- Diagnosticos principais:
  - SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.
  - Linha de baixo em pedal: a repetição sustenta a região harmônica.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

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
- Propostas geradas: 8
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro D major (melodia); primaria Estratégia — Melodia primeiro; 3 propostas
- Caminho com referencia: centro B minor (referencia); primaria Estratégia — Tonal Clássico; 8 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Estratégia — Tonal Clássico
- Camada da proposta: rearmonizacao
- Perfil: rota moderate; baixo functional; conducao 5.05
- Cifras: 1:F#m7/B | 3:F#m7/E | 5:F#m7 | 7:F#m7/B
- Baixo: B -> E -> F# -> B
- Evidencias da proposta:
  - Progressão orientada por ciclos de 4as/5as até o destino D
  - Estabilidade diatônica em B
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
  - Condução de vozes: baixo sustenta movimento por quarta/quinta
- Centro da referencia: janela B minor; confiança strong; global G major; confiança strong
- Comparacao com referencia: divergente; função 1/3; raiz 1/3
- Causas da comparacao: centro global divergente; acompanha centro local, diverge do global; idioma da referência relevante; raiz divergente na janela
- Diagnosticos principais:
  - Suspensão resolvida: a melodia cria tensão momentânea e resolve por grau conjunto em nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### afternoon in Paris.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 26 compassos, 110 notas, 39 cifras, 2 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 7 compassos
- Centro escolhido: Bb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência ii-V-I confirma Bb maior. Repousos recorrentes sustentam Bb maior.
- Propostas geradas: 7
- Cores funcionais: 1 geradas, 1 alternativas nao primarias
- Cores funcionais alternativas: Bdim7/Cb implica G7(b9)
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Melodia primeiro; 7 propostas
- Caminho com referencia: centro Bb major (referencia); primaria Estratégia — Tonal Clássico; 7 propostas
- Divergencia dos caminhos: centro, proposta primaria, cifras
- Leitura da divergencia: a referência muda o centro percebido
- Proposta primaria: Estratégia — Tonal Clássico
- Camada da proposta: rearmonizacao
- Perfil: rota conservative; baixo functional; conducao 5.05
- Cifras: 1:Bbmaj7(#11)/Bb | 3:Ebmaj7 | 5:F7 | 7:Bb6
- Baixo: Bb -> Eb -> F -> Bb
- Evidencias da proposta:
  - Progressão orientada por ciclos de 4as/5as até o destino G
  - Estabilidade diatônica em Bb
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
  - Condução de vozes: sétima dominante resolve descendo para a terça do alvo
- Centro da referencia: janela Bb major; confiança strong; global C major; confiança strong
- Comparacao com referencia: parcial; função 2/3; raiz 0/3
- Causas da comparacao: função preservada com outra raiz; centro global divergente; acompanha centro local, diverge do global; cadência da referência não acompanhada; idioma da referência relevante; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### asa branca.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 16 compassos, 37 notas, 0 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 0 compassos
- Centro escolhido: C major
- Propostas geradas: 5
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Harmonia básica I-IV-V; 5 propostas
- Caminho com referencia: centro C major (melodia); primaria Estratégia — Harmonia básica I-IV-V; 5 propostas
- Divergencia dos caminhos: caminhos alinhados
- Leitura da divergencia: caminhos alinhados
- Proposta primaria: Estratégia — Harmonia básica I-IV-V
- Camada da proposta: harmonia basica
- Perfil: rota moderate; baixo chromatic; conducao 4.33
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
- Evidencia do centro: Cadência ii-V-I confirma G maior. Repousos recorrentes sustentam G maior. Acorde final repousa em G.
- Propostas geradas: 3
- Cores funcionais: 0 geradas
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro G major (melodia); primaria Estratégia — Contraponto de Baixo; 4 propostas
- Caminho com referencia: centro G major (referencia); primaria Estratégia — Centro de referência; 3 propostas
- Divergencia dos caminhos: proposta primaria, cifras
- Leitura da divergencia: mesmo centro, harmonização diferente
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Perfil: rota radical; baixo mixed; conducao 4.21
- Cifras: 4:D7 | 5:C | 6:D7 | 7:G | 8:C | 9:C | 10:D7 | 11:G
- Baixo: D -> C -> D -> G -> C -> C -> D -> G
- Evidencias da proposta:
  - preserva o centro indicado pela referência em G
  - prioriza acordes próximos ao campo funcional antes de explorar cadências locais
  - acompanha a melodia com harmonia estável e baixa densidade
  - Centro da frase: Cadência ii-V-I confirma G maior.
- Centro da referencia: janela G major; confiança strong; global E minor; confiança strong
- Comparacao com referencia: alinhada; função 3/3; raiz 2/3
- Causas da comparacao: função preservada com outra raiz; acompanha centro local, diverge do global
- Diagnosticos principais:
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Condução de vozes áspera: há tendência sem resolução clara ou salto interno relevante.

### exemplo.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 4 compassos, 6 notas, 0 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4
- Sobreposicao com referencia: 0 compassos
- Centro escolhido: C major
- Propostas geradas: 11
- Cores funcionais: 6 geradas, 6 alternativas nao primarias
- Cores funcionais alternativas: Cdim7 implica F7; Dm6 implica Bm7b5 ou G7; F#m7(b5) implica Fmaj7
- Cores bVI/bVII na referencia: 0 ocorrencias
- Caminho melodia-only: centro C major (melodia); primaria Estratégia — Tonal Clássico; 11 propostas
- Caminho com referencia: centro C major (melodia); primaria Estratégia — Tonal Clássico; 11 propostas
- Divergencia dos caminhos: caminhos alinhados
- Leitura da divergencia: caminhos alinhados
- Proposta primaria: Estratégia — Tonal Clássico
- Camada da proposta: rearmonizacao
- Perfil: rota conservative; baixo functional; conducao 5.90
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

