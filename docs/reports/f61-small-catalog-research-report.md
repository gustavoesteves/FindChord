# F61 - Relatorio da pesquisa dirigida

Este relatorio roda o conjunto inicial definido em `docs/sprints/f61-small-catalog-research.md`.
A leitura e qualitativa: cada obra funciona como caso de teste musical para decidir o proximo refinamento do harmonizador.

## Resumo

- Obras rodadas: 5
- Caminhos alinhados: 1
- Referencia muda centro: 2
- Mesmo centro, harmonizacao diferente: 1
- Referencia destrava harmonizacao: 1

## Leitura geral

O conjunto confirma que a proxima melhoria nao deve ser simplesmente adicionar acordes mais complexos. O ponto central e hierarquizar leituras: harmonia basica por melodia, centro local da referencia, densidade funcional e rearmonizacao como alternativa.

## asa branca.musicxml

- Papel na pesquisa: controle tonal simples
- Pergunta: A harmonia basica gerada so pela melodia e suficiente?
- Status: harmonizado
- Janela melodica: 1, 2, 3, 4, 5, 6, 7, 8
- Centro escolhido: C major
- Melodia-only: centro C major; primaria Estratégia — Harmonia básica I-IV-V; 5 propostas
- Com referencia: centro C major; primaria Estratégia — Harmonia básica I-IV-V; 5 propostas
- Leitura da divergencia: caminhos alinhados
- Centro da referencia: sem referencia comparavel
- Comparacao com referencia: sem referencia comparavel
- Proposta primaria: Estratégia — Harmonia básica I-IV-V
- Camada da proposta: harmonia basica
- Cifras geradas: 1:C | 2:C | 3:C7 | 4:F | 5:C/E | 6:C | 7:G7/B | 8:C
- Hipotese de produto: usar como referencia de harmonia basica e controle contra excesso de complexidade
- Proxima decisao: validar se a proposta deve ser o padrao de harmonizacao simples

## Bright Size Life.musicxml

- Papel na pesquisa: centro local forte contra centro global
- Pergunta: A referencia revela uma regiao local que a melodia-only nao fixa?
- Status: harmonizado
- Janela melodica: 2, 3, 4, 5, 6, 7, 8, 9
- Centro escolhido: Bb major
- Melodia-only: centro D major; primaria Estratégia — Melodia primeiro; 3 propostas
- Com referencia: centro Bb major; primaria Estratégia — Centro de referência; 1 propostas
- Leitura da divergencia: a referencia muda o centro percebido
- Centro da referencia: local Bb major (strong); global D major (strong)
- Comparacao com referencia: alinhada; funcao 5/5; raiz 3/5
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Cifras geradas: 2:Dm | 3:Bb | 4:Eb | 5:Bb/D | 6:Eb | 7:Bb/D | 8:Bb | 9:Bb
- Hipotese de produto: separar centro local, centro global e centro melodico antes de promover a proposta
- Proxima decisao: escutar se a melodia sustenta o centro local ou se ele depende da cifra/baixo

## afternoon in Paris.musicxml

- Papel na pesquisa: centro local com centro global preservado
- Pergunta: O app consegue separar centro local da frase e centro global da obra?
- Status: harmonizado
- Janela melodica: 1, 2, 3, 4, 5, 6, 7, 8
- Centro escolhido: Bb major
- Melodia-only: centro C major; primaria Estratégia — Melodia primeiro; 7 propostas
- Com referencia: centro Bb major; primaria Estratégia — Tonal Clássico; 7 propostas
- Leitura da divergencia: a referencia muda o centro percebido
- Centro da referencia: local Bb major (strong); global C major (strong)
- Comparacao com referencia: parcial; funcao 2/3; raiz 0/3
- Proposta primaria: Estratégia — Tonal Clássico
- Camada da proposta: rearmonizacao
- Cifras geradas: 1:Bbmaj7(#11)/Bb | 3:Ebmaj7 | 5:F7 | 7:Bb6
- Hipotese de produto: separar centro local, centro global e centro melodico antes de promover a proposta
- Proxima decisao: escutar se a melodia sustenta o centro local ou se ele depende da cifra/baixo

## Ain't misbehavin.musicxml

- Papel na pesquisa: mesmo centro com harmonizacao diferente
- Pergunta: A divergencia e outra densidade harmonica, nao erro de centro?
- Status: harmonizado
- Janela melodica: 1, 2, 3, 4, 5, 6, 7, 8
- Centro escolhido: Eb major
- Melodia-only: centro Eb major; primaria Estratégia — Melodia primeiro; 9 propostas
- Com referencia: centro Eb major; primaria Estratégia — Centro de referência; 8 propostas
- Leitura da divergencia: mesmo centro, harmonizacao diferente
- Centro da referencia: local Eb major (medium); global Eb major (strong)
- Comparacao com referencia: alinhada; funcao 6/8; raiz 5/8
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Cifras geradas: 1:Eb | 2:Fm7 | 3:Cm7/Eb | 4:Fm7 | 5:Eb | 6:Fm7 | 7:Eb | 8:Eb
- Hipotese de produto: tratar a referencia como densidade ou vocabulario alternativo, nao como correcao absoluta
- Proxima decisao: decidir se a referencia entra como alternativa de rearmonizacao

## Actual proof.musicxml

- Papel na pesquisa: referencia destrava harmonizacao
- Pergunta: Quando a melodia sozinha nao basta, qual contexto a referencia fornece?
- Status: harmonizado
- Janela melodica: 2, 5, 6, 7, 9, 10, 11, 12
- Centro escolhido: E minor
- Melodia-only: sem proposta
- Com referencia: centro E minor; primaria Estratégia — Centro de referência; 1 propostas
- Leitura da divergencia: a referencia destrava a harmonizacao
- Centro da referencia: local E minor (medium); global Eb major (strong)
- Comparacao com referencia: divergente; funcao 1/4; raiz 0/4
- Proposta primaria: Estratégia — Centro de referência
- Camada da proposta: centro de referencia
- Cifras geradas: 2:Em7 | 5:Em | 6:Em | 7:Em | 9:B7/D# | 10:D7 | 11:B7/D# | 12:Em
- Hipotese de produto: admitir que a melodia isolada pode exigir mais contexto harmonico
- Proxima decisao: definir mensagem e fallback quando melodia-only nao gera proposta

