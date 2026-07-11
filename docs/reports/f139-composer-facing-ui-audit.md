# F139 - Varredura de valor musical na UI

## Pergunta

Quais informacoes hoje aparecem na interface como "conquistas do motor", mas nao ajudam diretamente a leitura de um compositor/arranjador?

## Criterio

A UI principal deve mostrar decisao musical acionavel:

- que acorde, escala, voicing ou caminho esta sendo proposto;
- por que isso ajuda a melodia, a funcao harmonica, a conducao ou a resolucao;
- o que o compositor pode tocar, aceitar, comparar ou revisar.

Dados internos como score, percentual, cobertura, distancia numerica, pitch MIDI, confidence e ranking bruto devem ficar em testes, relatorios, diagnosticos de desenvolvimento ou ser traduzidos para linguagem musical qualitativa.

## Achados prioritarios

### 1. Escrever - metricas cruas nos cards de voicing

Arquivo: `src/domains/writer/components/VoicingSearchLayer.tsx`

Trecho observado:

- `E: {ergScore}`
- `Delta: {dist}`

Problema: o usuario ve siglas e numeros de classificacao, mas nao recebe uma decisao musical clara. Para o compositor, o que importa e se o voicing e confortavel, se preserva a regiao do braco, se move pouco em relacao ao acorde atual ou se abre uma nova posicao.

Sugestao:

- remover os numeros dos cards;
- manter a ordenacao interna;
- quando for util, trocar por etiquetas qualitativas como `confortavel`, `movimento curto`, `mesma regiao`, `nova posicao`.

### 2. Escrever - detalhe MIDI exposto como leitura musical

Arquivo: `src/domains/writer/components/TranslationLayer.tsx`

Trecho observado:

- `Pitches MIDI Absolutos: [ ... ]`

Problema: pitch MIDI e um dado de engenharia. Ele pode ser util para depurar o adaptador, mas nao para decidir um acorde ou shape.

Sugestao:

- remover da UI principal;
- se ainda for necessario, mover para um modo de diagnostico;
- manter na superficie apenas `Notas tocadas`, `Acorde`, `Baixo`, `Inversao`, `Tensoes` e informacoes de execucao.

### 3. Escrever - tensao harmonica como numero

Arquivo: `src/domains/writer/components/TranslationLayer.tsx`

Trecho observado:

- `Tensao Estimada`
- `activeChord.tensionLevel.toFixed(2)`
- barra proporcional ao valor interno

Problema: a ideia de tensao e musical, mas o numero cru nao diz o que fazer. Sem contexto tonal, uma barra pode parecer autoridade teorica onde talvez exista apenas uma heuristica.

Sugestao:

- transformar em leitura qualitativa: `tensao baixa`, `tensao moderada`, `tensao alta`;
- ou esconder no Escrever ate haver contexto harmonico suficiente;
- quando exibida, explicar musicalmente: `tríade estavel`, `acorde com extensoes`, `dominante/alterado`, etc.

### 4. Harmonizar - conducao exibida como score

Arquivo: `src/domains/harmonizer/components/HarmonizationProposalCard.tsx`

Trecho observado:

- `Conducao: {proposal.voiceLeadingScore.toFixed(2)}`

Problema: a conducao de vozes e essencial, mas o score bruto e leitura de motor. O compositor quer saber se a passagem e suave, se usa notas comuns, se exige salto, se cria baixo cantabile ou se troca de regiao.

Sugestao:

- trocar o numero por uma etiqueta: `conducao suave`, `movimento moderado`, `movimento amplo`;
- manter evidencias musicais em `Ver analise`, por exemplo `mantem 3 notas comuns`, `baixo por grau conjunto`, `resolucao cromatica`.

### 5. Harmonizar - cobertura melodica em percentual

Arquivo: `src/domains/harmonizer/components/ContextualScaleSuggestionsPanel.tsx`

Trecho observado:

- `Melodia: 100%`

Problema: o percentual e util para ranking, mas empobrece a leitura musical. Uma escala pode cobrir 100% da melodia e ainda nao ser a melhor leitura improvisacional se nao orientar notas-guia, alvos, tensoes ou resolucoes.

Sugestao:

- substituir por linguagem qualitativa: `melodia apoia`, `apoio parcial`, `neutra`, `revisar com a melodia`;
- manter os detalhes que realmente orientam o improvisador: `Apoio: B (nota-guia), C (alvo)`, `Passagens`, `Fragmentos`, `Resolucao`.

## Ajustes de linguagem recomendados

Estes nao sao erros graves, mas deixam a UI mais tecnica do que musical:

- `Cognição Harmônica (Tradução)` -> `Leitura do acorde` ou `Acorde e voicing`;
- `Notas Físicas` -> `Notas tocadas`;
- `Buscador de Voicings Equivalentes` -> `Variações de voicing`;
- `Interna` em escalas -> `Dentro` ou `Escala base`;
- `Fonte de Verdade` no rodape -> evitar na UI final, pois e linguagem de engenharia.

## Informacoes que agregam valor e devem permanecer

- progressao cifrada;
- baixo proposto;
- perfil harmonico quando ajuda a comparar propostas;
- explicacao expandida em `Por que funciona?` / `Ver analise`;
- notas-guia;
- alvos de resolucao;
- notas de passagem;
- fragmentos lineares;
- tensoes disponiveis;
- rotas lineares;
- leituras regionais;
- botoes de aplicacao e comparacao.

## Proximo sprint sugerido

### F140 - Limpeza da superficie compositor/arranjador

Objetivo: remover ou traduzir metricas internas visiveis sem perder a inteligencia do motor.

Escopo recomendado:

1. Trocar `Conducao: 4.33` por uma leitura qualitativa no Harmonizar.
2. Trocar `Melodia: 100%` por leitura qualitativa no painel de escalas contextuais.
3. Remover `Pitches MIDI Absolutos` da UI principal do Escrever.
4. Trocar `E:` e `Delta:` dos voicings por etiquetas musicais ou ocultar os badges.
5. Revisar titulos tecnicos do Escrever para linguagem de compositor.

Critério de aceite:

- nenhum numero interno aparece na UI principal sem uma interpretacao musical;
- os dados removidos continuam disponiveis em testes, relatorios ou diagnostico tecnico se forem necessarios;
- o compositor consegue comparar propostas sem ler score, coverage ou pitch MIDI.

