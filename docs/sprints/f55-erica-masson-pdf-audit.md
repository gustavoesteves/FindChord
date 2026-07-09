# F55 — Auditoria teorica Masson para o Harmonizar

## Objetivo

Revisar os tres PDFs de teoria de harmonia popular da Erica Masson agora presentes em `docs/theory/` e decidir se o Harmonizar esta seguindo um caminho teoricamente saudavel.

Arquivos revisados:

- `docs/theory/ebook+1.pdf` — introducao a harmonia e analise harmonica da musica popular.
- `docs/theory/ebook+2.pdf` — analise harmonica em tom menor e modal.
- `docs/theory/ebook+3.pdf` — analise harmonica com acordes de funcao aparente.

Este documento nao transcreve os PDFs. Ele transforma a leitura em criterios de produto e engenharia para o Find Chord.

## Veredito

O caminho atual esta saudavel.

O ponto mais importante confirmado pela revisao e que a abordagem da Erica Masson nao trata rearmonizacao como uma lista livre de acordes sofisticados. A logica central e contextual:

- identificar centro e campo ativo;
- reconhecer funcao harmonica;
- aceitar substituicoes quando preservam funcao ou direcao;
- julgar acordes aparentes pelo comportamento, nao pelo nome isolado;
- observar melodia e contexto antes de classificar.

Isso coincide com a arquitetura que estamos consolidando:

- melodia como contrato;
- centro global/local/frase;
- funcao antes da cifra;
- proposta por estrategia;
- validacao por propriedades;
- explicacao musical em vez de debug interno.

## O que os PDFs reforcam

### Volume 1 — base tonal popular

O primeiro volume reforca a base que ja usamos como chao do motor:

- campo harmonico maior;
- funcoes T, SD/PD e D;
- dominante primario, secundario e estendido;
- cadencia IIm7-V7;
- cadencia IIm7-subV7;
- subIIm7;
- blues como forma e idioma.

Leitura para o sistema:

- O Find Chord ja esta correto em tratar I-IV-V, expansao diatonica, dominante secundario e ii-V local como degraus progressivos.
- O `subIIm7` ainda precisa aparecer de forma mais explicita como preparacao cromatica para `subV7`.
- Blues nao deve ser apenas "dominantes em cadeia"; precisa de idioma proprio.

### Volume 2 — menor e modal

O segundo volume confirma duas fronteiras importantes.

Em menor, a funcao depende do campo usado:

- menor natural;
- menor harmonico;
- menor melodico.

Isso significa que uma substituicao em menor nao pode ser apenas "mesmo grau relativo". O sistema precisa saber se a cor vem de um campo menor especifico e se a melodia permite a nota caracteristica.

Na parte modal, a diferenca essencial e que a harmonia modal nao depende da logica tonal de tensao e repouso. Ela e reconhecida por centro, sonoridade, tipo de acorde, nota caracteristica e ausencia de resolucao funcional classica.

Leitura para o sistema:

- A estrategia de centro de referencia em menor esta bem colocada.
- Ainda falta separar melhor menor natural, harmonico e melodico como fontes de substituicao.
- Modal nao deve ser forçado para T-PD-D quando a frase nao pede isso.
- A nota caracteristica do modo deve virar evidencia, especialmente em dórico, lídio, mixolídio, eólio e frígio.

### Volume 3 — funcao aparente

O terceiro volume e o mais importante para o momento atual.

Ele reforca que acordes aparentes sao acordes cuja cifra escrita nao e necessariamente a melhor explicacao funcional. O papel real aparece pelo contexto.

Casos centrais:

- diminuto com funcao dominante;
- diminuto com funcao subdominante;
- diminuto cromatico descendente;
- sus como dominante ou como preparacao subdominante;
- sus(b9) em contexto menor ou mais direcional;
- m6 como estrutura com acordes implicitos;
- Im(b6) como gerador de leitura subdominante;
- #IVm7(b5) como intensificacao/substituicao do IVmaj7;
- tabela de substituicoes por funcao, em maior e menor.

Leitura para o sistema:

- O ajuste recente no `ReferenceHarmonyComparator` esta alinhado com o livro: slash chord, sus e funcao aparente nao devem ser julgados de forma literal demais.
- A cautela com `m6` tambem esta correta: ele nao deve sobrescrever uma funcao clara so por conter outra estrutura implicita.
- O proximo salto nao e adicionar mais acordes; e fazer cada acorde aparente explicar qual funcao real ele esta sugerindo.

## Estado atual contra a teoria

| Tema Masson | Estado no Find Chord | Decisao |
| --- | --- | --- |
| T/SD/D em maior | Operacional | Manter como backbone basico |
| Dominantes secundarios | Operacional inicial | Reforcar resolucao local e alvo cadencial |
| ii-V local | Operacional parcial | Melhorar janela, alvo e ranking |
| IIm7-subV7 | Parcial | Transformar em estrategia explicita e testavel |
| subIIm7 | Fraco | Adicionar como preparacao cromatica contextual |
| Menor funcional | Operacional parcial | Separar natural/harmonico/melodico por evidencia melodica |
| Modal | Inicial/fraco | Criar detector que nao dependa de T-PD-D |
| Diminutos | Parcial | Separar dominante, subdominante e cromatico descendente |
| Sus | Parcial | Separar dominante real, subdominante aparente e sus(b9) |
| m6 | Parcial | Modelar acordes implicitos sem forcar funcao |
| Im(b6) | Ausente/fraco | Adicionar como leitura subdominante em menor |
| #IVm7(b5) | Parcial | Consolidar como intensificacao predominante |
| Tabela de substituicoes | Parcial | Criar contrato versionavel por funcao |
| Blues | Fraco | Tratar como idioma independente |

## Ajustes de rumo

### 1. Trocar "SD" por "PD" internamente, mas manter traducao musical

A Erica usa subdominante. O sistema usa `PD` por ser mais generico para preparacao. Isso e saudavel, desde que a UI fale musicalmente:

- "preparacao";
- "subdominante";
- "prepara a dominante";
- "intensifica a chegada".

Evitar expor `PD` cru ao usuario.

### 2. Funcao aparente deve ser uma camada, nao uma excecao

Hoje `ApparentFunctionAnalysis` ja existe, mas ainda funciona como apoio pontual.

Proximo passo: cada caso aparente deve devolver:

- acorde escrito;
- acorde real/implicito quando houver;
- funcao aparente;
- alvo;
- confianca;
- evidencia;
- se pode ou nao contar como substituicao funcional.

### 3. Substituicao precisa preservar pelo menos uma estrutura forte

Uma troca so deve ser sugerida quando preservar pelo menos um destes eixos:

- funcao;
- alvo cadencial;
- notas estruturais da melodia;
- resolucao por semitom/tom;
- baixo coerente;
- guide tones;
- memoria da referencia.

Sem isso, vira coloracao aleatoria.

### 4. Menor nao pode ser apenas "maior com b3"

O Volume 2 deixa claro que menor mistura campos. O sistema deve perguntar:

- a melodia traz sensivel?
- a melodia traz sexta maior?
- a melodia repousa em b6 ou b7?
- o dominante tem tritono?
- o acorde aponta para menor natural, harmonico ou melodico?

### 5. Modal precisa de outro contrato

Se a frase e modal, forçar T-PD-D pode gerar diagnostico errado.

Um detector modal minimo deve procurar:

- centro recorrente sem V-I claro;
- acordes do mesmo tipo em centros diferentes;
- nota caracteristica do modo;
- pedal ou vamp;
- baixa necessidade de resolucao dominante.

## Proxima sprint recomendada

### F56 — Funcoes aparentes como contrato de substituicao

Objetivo:

Transformar a leitura de funcao aparente em um contrato mais forte para comparacao, ranking e explicacao.

Escopo sugerido:

1. Expandir `ApparentFunctionAnalysis` para retornar tambem `impliedChordSymbols`.
2. Separar diminuto em tres leituras:
   - dominante aparente;
   - subdominante aparente;
   - cromatico descendente.
3. Separar sus em:
   - dominante suspenso;
   - subdominante aparente;
   - sus(b9) em contexto menor/subIIm7(b5).
4. Melhorar `m6`:
   - mapear m7(b5) implicito;
   - mapear dominante implicito;
   - nao sobrescrever funcao clara sem contexto.
5. Adicionar `Im(b6)` como leitura subdominante em menor.
6. Consolidar `#IVm7(b5)` como predominante cromatico com alvo IV ou D.
7. Usar essa camada no relatorio real para diferenciar:
   - divergencia real;
   - funcao preservada por acorde aparente;
   - cor cromatica aceitavel;
   - substituicao sem evidencia suficiente.

Fora do escopo desta sprint:

- painel visual completo da tabela de substituicoes;
- detector modal completo;
- blues idiomatico.

## Criterio de aceite

A sprint deve passar quando:

- os testes cobrirem pelo menos um caso de dim dominante, dim cromatico, sus dominante, sus subdominante, m6 contextual, Im(b6) e #IVm7(b5);
- o relatorio real reduzir falsos "divergente" quando a referencia usa funcao aparente clara;
- nenhuma proposta passar apenas por ter uma cifra sofisticada;
- `npm run test:curated`, `npm run build` e `npm run lint` passarem.

## Conclusao

Podemos seguir.

Os PDFs nao sugerem uma mudanca de direcao; eles sugerem que estamos no ponto certo da estrada. O risco agora nao e falta de teoria, mas excesso de permissividade. A melhor continuidade e transformar a teoria de funcao aparente em contrato computacional: cada acorde aparente precisa dizer o que esta substituindo, por que pode substituir e para onde aponta.
