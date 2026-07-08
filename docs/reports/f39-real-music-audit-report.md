# F39 — Relatorio musical por obra

Este relatorio e gerado a partir das partituras em `docs/musics` e resume a leitura atual do motor sobre cada arquivo real.

A leitura nao pretende ser julgamento estetico final. Ela registra o que o sistema conseguiu importar, qual janela melodica foi usada, qual centro foi escolhido e qual proposta primaria saiu do pipeline.

## Resumo geral

- Arquivos auditados: 22
- Arquivos harmonizados: 21
- Arquivos apenas com referencia harmonica: 1
- Arquivos sem proposta na janela auditada: 0

## Obras

### Actual proof.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 23 compassos, 98 notas, 20 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 6, 7, 9, 10, 11, 12, 13, 14
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: Eb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Eb maior. Acorde final repousa em Eb.
- Propostas geradas: 1
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: A
- Perfil: rota moderate; baixo functional; conducao 7.50
- Cifras: 12:Bm7 | 13:E7 | 14:Amaj7
- Baixo: B -> E -> A
- Evidencias da proposta:
  - cria uma cadência local para A
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: Eb major; confiança medium
- Comparacao com referencia: parcial; função 2/3; raiz 1/3
- Causas da comparacao: função preservada com outra raiz; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### Ain't it the truth.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 38 compassos, 153 notas, 36 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: Bb minor
- Propostas geradas: 4
- Proposta primaria: Estratégia — Gramática funcional ii-V
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
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: Eb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Eb maior. Primeiro acorde apresenta Eb maior.
- Propostas geradas: 7
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: C
- Perfil: rota radical; baixo leaping; conducao 6.17
- Cifras: 1:Dm7b5 | 2:G7b13/Eb | 3:Cm6
- Baixo: D -> Eb -> C
- Evidencias da proposta:
  - reconhece célula ii-V local em C
  - usa preparação meio-diminuta antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Condução de vozes: usa inversão simples para suavizar o baixo
- Centro da referencia: Eb major; confiança strong
- Comparacao com referencia: divergente; função 1/3; raiz 0/3
- Causas da comparacao: função preservada com outra raiz; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes.
  - Linha de baixo saltada: há saltos estruturais que reduzem a continuidade da progressão.
  - Condução de vozes áspera: há tendência sem resolução clara ou salto interno relevante.

### Air mail special.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Ab
- Material importado: 35 compassos, 224 notas, 54 cifras, 4 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: Ab major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência ii-V-I confirma Ab maior. Repousos recorrentes sustentam Ab maior. Primeiro acorde apresenta Ab maior.
- Propostas geradas: 5
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: Eb
- Perfil: rota conservative; baixo functional; conducao 7.50
- Cifras: 6:Fm7 | 7:Bb7 | 8:Ebmaj7
- Baixo: F -> Bb -> Eb
- Evidencias da proposta:
  - cria uma cadência local para Eb
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: Ab major; confiança strong
- Comparacao com referencia: parcial; função 2/3; raiz 0/3
- Causas da comparacao: função preservada com outra raiz; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### Airegin.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Ab
- Material importado: 34 compassos, 109 notas, 46 cifras, 3 secoes
- Status: harmonizado
- Janela melodica: compassos 3, 4, 5, 6, 8, 9, 10, 12
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: Ab major
- Propostas geradas: 5
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: Db
- Perfil: rota conservative; baixo functional; conducao 7.50
- Cifras: 9:Ebm7 | 10:Ab7 | 12:Dbmaj7
- Baixo: Eb -> Ab -> Db
- Evidencias da proposta:
  - cria uma cadência local para Db
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela Bb minor; confiança weak; global Ab major; confiança strong
- Comparacao com referencia: divergente; função 0/3; raiz 0/3
- Causas da comparacao: centro local divergente; acompanha centro global, ignora centro local; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### Bright Size Life.musicxml

- Titulo importado: Imported Score
- Tom/armadura: D
- Material importado: 28 compassos, 128 notas, 18 cifras, 3 secoes
- Status: harmonizado
- Janela melodica: compassos 3, 4, 5, 6, 7, 8, 9, 10
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: G major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam G maior. Acorde final repousa em G. Primeiro acorde apresenta G maior.
- Propostas geradas: 5
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: D
- Perfil: rota conservative; baixo functional; conducao 7.50
- Cifras: 8:Em7 | 9:A7 | 10:Dmaj7
- Baixo: E -> A -> D
- Evidencias da proposta:
  - cria uma cadência local para D
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela G major; confiança medium; global D major; confiança strong
- Comparacao com referencia: divergente; função 0/3; raiz 0/3
- Causas da comparacao: centro global divergente; acompanha centro local, diverge do global; raiz divergente na janela
- Diagnosticos principais:
  - Blues funcional omitido: a melodia sugere cor blues parcial, mas não sustenta b3 e b7 como estrutura.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### Esse caminhar.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 33 compassos, 176 notas, 10 cifras, 2 secoes
- Status: harmonizado
- Janela melodica: compassos 5, 6, 7, 8, 9, 10, 11, 12
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: D minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam D menor. Acorde final repousa em D. Primeiro acorde apresenta D menor.
- Propostas geradas: 5
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: F
- Perfil: rota moderate; baixo functional; conducao 7.50
- Cifras: 5:Gm7 | 6:C7 | 7:Fmaj7
- Baixo: G -> C -> F
- Evidencias da proposta:
  - reconhece célula ii-V local em F
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: D minor; confiança strong
- Comparacao com referencia: divergente; função 0/3; raiz 0/3
- Causas da comparacao: raiz divergente na janela
- Diagnosticos principais:
  - Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### a child is born.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 38 compassos, 83 notas, 39 cifras, 2 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: Bb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Bb maior. Primeiro acorde apresenta Bb maior.
- Propostas geradas: 4
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: C
- Perfil: rota conservative; baixo functional; conducao 7.50
- Cifras: 6:Dm7 | 7:G7 | 8:Cmaj7
- Baixo: D -> G -> C
- Evidencias da proposta:
  - cria uma cadência local para C
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela Eb minor; confiança weak; global Bb major; confiança strong
- Comparacao com referencia: divergente; função 1/3; raiz 0/3
- Causas da comparacao: função preservada com outra raiz; centro local divergente; acompanha centro global, ignora centro local; idioma da referência relevante; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### a fine romance.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 25 compassos, 67 notas, 41 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: D minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam D menor. Acorde final repousa em D.
- Propostas geradas: 1
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: G
- Perfil: rota conservative; baixo functional; conducao 7.50
- Cifras: 6:Am7 | 7:D7 | 8:Gmaj7
- Baixo: A -> D -> G
- Evidencias da proposta:
  - cria uma cadência local para G
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela D minor; confiança medium; global C major; confiança strong
- Comparacao com referencia: divergente; função 0/3; raiz 0/3
- Causas da comparacao: centro global divergente; acompanha centro local, diverge do global; idioma da referência relevante; raiz divergente na janela
- Diagnosticos principais:
  - Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### affirmation.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 36 compassos, 214 notas, 21 cifras, 2 secoes
- Status: harmonizado
- Janela melodica: compassos 5, 6, 7, 8, 9, 10, 11, 12
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: G major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência ii-V-I confirma G maior. Repousos recorrentes sustentam G maior. Acorde final repousa em G.
- Propostas geradas: 6
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: D
- Perfil: rota conservative; baixo functional; conducao 7.50
- Cifras: 10:Em7 | 11:A7 | 12:Dmaj7
- Baixo: E -> A -> D
- Evidencias da proposta:
  - cria uma cadência local para D
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela G major; confiança medium; global B minor; confiança strong
- Comparacao com referencia: parcial; função 2/3; raiz 1/3
- Causas da comparacao: função preservada com outra raiz; centro global divergente; acompanha centro local, diverge do global; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### african flower.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 40 compassos, 165 notas, 23 cifras, 3 secoes
- Status: harmonizado
- Janela melodica: compassos 12, 13, 14, 15, 16, 17, 18, 19
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: Eb minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam Eb menor. Acorde final repousa em Eb. Primeiro acorde apresenta Eb menor.
- Propostas geradas: 5
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: Gb
- Perfil: rota moderate; baixo functional; conducao 7.50
- Cifras: 17:Abm7 | 18:Db7 | 19:Gbmaj7
- Baixo: Ab -> Db -> Gb
- Evidencias da proposta:
  - cria uma cadência local para Gb
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: Eb minor; confiança medium
- Comparacao com referencia: parcial; função 2/3; raiz 1/3
- Causas da comparacao: função preservada com outra raiz; raiz divergente na janela
- Diagnosticos principais:
  - Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### afro blue.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Ab
- Material importado: 40 compassos, 75 notas, 38 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: F minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam F menor. Acorde final repousa em F. Primeiro acorde apresenta F menor.
- Propostas geradas: 10
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: Ab
- Perfil: rota moderate; baixo functional; conducao 7.50
- Cifras: 1:Bbm7 | 2:Eb7 | 3:Abmaj7
- Baixo: Bb -> Eb -> Ab
- Evidencias da proposta:
  - reconhece célula ii-V local em Ab
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela Ab major; confiança medium; global F minor; confiança strong
- Comparacao com referencia: divergente; função 0/3; raiz 1/3
- Causas da comparacao: centro local divergente; acompanha centro global, ignora centro local; raiz divergente na janela
- Diagnosticos principais:
  - Suspensão resolvida: a melodia cria tensão momentânea e resolve por grau conjunto em nota sustentada.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### afron-centric.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 27 compassos, 87 notas, 12 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 16, 17, 18, 19, 20, 21, 27
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: C major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam C maior. Acorde final repousa em C.
- Propostas geradas: 2
- Proposta primaria: Estratégia — Contraponto de Baixo
- Perfil: rota chromatic; baixo functional; conducao 4.80
- Cifras: 16:Cmaj7 | 18:Fmaj7 | 20:Bbmaj7/D | 23:G7 | 25:Cmaj7
- Baixo: C -> F -> D -> G -> C
- Evidencias da proposta:
  - Movimento contrário (oblíquo) priorizado em relação ao contorno melódico
  - Baixo linear e fluido, focando na independência das vozes
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
  - Condução de vozes: sétima dominante resolve descendo para a terça do alvo
- Centro da referencia: Gb major; confiança strong
- Comparacao com referencia: divergente; função 1/3; raiz 0/3
- Causas da comparacao: função preservada com outra raiz; centro local divergente; centro global divergente; raiz divergente na janela
- Diagnosticos principais:
  - ii-V local omitido: a chegada em G não teve cobertura melódica suficiente para uma cadência local.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### after you've gone.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 20 compassos, 93 notas, 34 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 4 compassos
- Centro escolhido: F major
- Propostas geradas: 3
- Proposta primaria: Estratégia — Tonal Clássico
- Perfil: rota moderate; baixo functional; conducao 3.27
- Cifras: 1:Fmaj9 | 3:Bbmaj7 | 5:C7 | 7:Fdim7
- Baixo: F -> Bb -> C -> F
- Evidencias da proposta:
  - Progressão orientada por ciclos de 4as/5as até o destino F
  - Estabilidade diatônica em F
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
  - Condução de vozes: sétima dominante sem resolução clara
- Centro da referencia: Bb major; confiança medium
- Comparacao com referencia: divergente; função 1/4; raiz 2/4
- Causas da comparacao: função preservada com outra raiz; centro local divergente; centro global divergente; idioma da referência relevante
- Diagnosticos principais:
  - SubV7 omitido: o substituto cromático não cobre as notas estruturais da melodia nesse fechamento.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Suspensão resolvida: a melodia cria tensão momentânea e resolve por grau conjunto em nota sustentada.
  - Condução de vozes áspera: há tendência sem resolução clara ou salto interno relevante.

### after you.musicxml

- Titulo importado: Untitled score
- Tom/armadura: D
- Material importado: 34 compassos, 142 notas, 55 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: B minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam B menor. Acorde final repousa em B.
- Propostas geradas: 7
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: D
- Perfil: rota moderate; baixo functional; conducao 7.50
- Cifras: 6:Em7 | 7:A7 | 8:Dmaj7
- Baixo: E -> A -> D
- Evidencias da proposta:
  - cria uma cadência local para D
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela E minor; confiança medium; global G major; confiança strong
- Comparacao com referencia: divergente; função 0/3; raiz 0/3
- Causas da comparacao: centro local divergente; centro global divergente; raiz divergente na janela
- Diagnosticos principais:
  - Menor funcional omitido: a melodia não traz sensível nem sexta maior para sustentar cadência dominante.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Suspensão resolvida: a melodia cria tensão momentânea e resolve por grau conjunto em nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.

### afternoon in Paris.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 26 compassos, 110 notas, 39 cifras, 2 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: Bb major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência ii-V-I confirma Bb maior. Repousos recorrentes sustentam Bb maior.
- Propostas geradas: 6
- Proposta primaria: Estratégia — Tonal Clássico
- Perfil: rota conservative; baixo functional; conducao 5.05
- Cifras: 1:Bbmaj7(#11)/Bb | 3:Ebmaj7 | 5:F7 | 7:Bb6
- Baixo: Bb -> Eb -> F -> Bb
- Evidencias da proposta:
  - Progressão orientada por ciclos de 4as/5as até o destino G
  - Estabilidade diatônica em Bb
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
  - Condução de vozes: sétima dominante resolve descendo para a terça do alvo
- Centro da referencia: janela C minor; confiança weak; global C major; confiança strong
- Comparacao com referencia: divergente; função 0/3; raiz 0/3
- Causas da comparacao: centro local divergente; centro global divergente; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
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
- Proposta primaria: Estratégia — Harmonia básica I-IV-V
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
- Janela melodica: compassos 5, 6, 7, 8, 9, 10, 11, 12
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: G major
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Cadência ii-V-I confirma G maior. Repousos recorrentes sustentam G maior.
- Propostas geradas: 5
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: F#
- Perfil: rota moderate; baixo functional; conducao 7.50
- Cifras: 10:G#m7 | 11:C#7 | 12:F#maj7
- Baixo: G# -> C# -> F#
- Evidencias da proposta:
  - cria uma cadência local para F#
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela C major; confiança medium; global E minor; confiança strong
- Comparacao com referencia: divergente; função 0/3; raiz 0/3
- Causas da comparacao: centro local divergente; centro global divergente; raiz divergente na janela
- Diagnosticos principais:
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### depois de muito discutir.musicxml

- Titulo importado: Untitled score
- Tom/armadura: F
- Material importado: 52 compassos, 169 notas, 49 cifras, 6 secoes
- Status: harmonizado
- Janela melodica: compassos 9, 10, 11, 12, 13, 14, 15, 16
- Sobreposicao com referencia: 3 compassos
- Centro escolhido: G minor
- Origem do centro: referencia harmonica da janela
- Evidencia do centro: Repousos recorrentes sustentam G menor.
- Propostas geradas: 1
- Proposta primaria: Estratégia — Gramática funcional ii-V
- Alvo cadencial da proposta: Bb
- Perfil: rota moderate; baixo functional; conducao 7.50
- Cifras: 12:Cm7 | 13:F7 | 14:Bbmaj7
- Baixo: C -> F -> Bb
- Evidencias da proposta:
  - reconhece célula ii-V local em Bb
  - usa preparação predominante antes da dominante local
  - preserva a chegada melódica como ponto de resolução
  - Linha de baixo: sustenta movimento funcional por quarta/quinta
- Centro da referencia: janela G minor; confiança medium; global F major; confiança strong
- Comparacao com referencia: parcial; função 2/3; raiz 2/3
- Causas da comparacao: centro global divergente; acompanha centro local, diverge do global; idioma da referência relevante
- Diagnosticos principais:
  - Centro modal omitido: a melodia traz direção cadencial menor por sensível ou sexta maior.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes.

### exemplo.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 4 compassos, 6 notas, 0 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4
- Sobreposicao com referencia: 0 compassos
- Centro escolhido: C major
- Propostas geradas: 8
- Proposta primaria: Estratégia — Tonal Clássico
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

### palhaço.musicxml

- Titulo importado: Untitled score
- Tom/armadura: Ab
- Material importado: 160 compassos, 1271 notas, 0 cifras, 0 secoes
- Status: harmonizado
- Janela melodica: compassos 1, 2, 3, 4, 5, 6, 7, 8
- Sobreposicao com referencia: 0 compassos
- Centro escolhido: Ab major
- Propostas geradas: 9
- Proposta primaria: Estratégia — Harmonia básica I-IV-V
- Perfil: rota conservative; baixo chromatic; conducao 4.69
- Cifras: 1:Ab | 2:Db | 3:Eb7/G | 4:Ab | 5:Ab7 | 6:Db | 7:Eb7/G | 8:Ab
- Baixo: Ab -> Db -> G -> Ab -> Ab -> Db -> G -> Ab
- Evidencias da proposta:
  - Percurso funcional: repouso -> preparação -> tensão -> repouso -> preparação -> tensão -> repouso
  - Leitura da frase: a melodia abre espaço para subdominante
  - Leitura da frase: identifica preparação dominante antes da resolução
  - Leitura da frase: final suspenso com meia-cadência
- Comparacao com referencia: sem referencia comparavel
- Diagnosticos principais:
  - ii-V local omitido: a chegada em C não teve cobertura melódica suficiente para uma cadência local.
  - Apoio melódico descoberto: uma nota estrutural da melodia ficou sem sustentação harmônica clara.
  - Aproximação cromática aceita: a nota fora do acorde conduz por semitom a uma nota sustentada.
  - Passagem por grau conjunto aceita: a melodia atravessa notas vizinhas sustentadas pela harmonia.

### teste2.musicxml

- Titulo importado: Untitled score
- Tom/armadura: C
- Material importado: 32 compassos, 0 notas, 4 cifras, 0 secoes
- Status: apenas referencia harmonica

O arquivo tem material harmonico importado, mas nao trouxe notas melodicas suficientes para acionar a harmonizacao melodica.

## Leitura de F39

A bateria real mostra tres tipos de entrada que o sistema precisa continuar distinguindo:

1. melodias sem cifra, onde a engine precisa propor a harmonia inteira;
2. melodias com cifras, onde a engine deve harmonizar sem perder a possibilidade futura de comparar com a referencia;
3. arquivos com cifra mas sem notas importadas, que testam ingestao de referencia mas nao sao entrada melodica harmonizavel.

O proximo refinamento natural e comparar a proposta primaria com a harmonia de referencia quando ela existe, separando divergencia aceitavel de erro de leitura funcional.

