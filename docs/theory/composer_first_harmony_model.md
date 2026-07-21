# Modelo composer-first de harmonia e materiais

## Objetivo

Este documento fixa uma decisão de direção para o Find Chord:

> O sistema deve servir ao compositor/arranjador antes de servir às categorias herdadas do app, das bibliotecas ou das listas teóricas estáticas.

As bibliotecas continuam úteis como infraestrutura: transpor notas, normalizar pitch classes, montar coleções e resolver operações mecânicas. Elas não devem ser autoridade musical.

## Mudança de autoridade

### Antes

O app nasceu com perguntas próximas de:

- que acorde foi detectado?
- que escala é compatível com esta qualidade?
- que nome a biblioteca retorna?
- que enum/categoria já existe no código?

Essas perguntas ajudaram a construir o primeiro motor, mas são pequenas demais para o produto atual.

### Agora

As perguntas centrais passam a ser:

- que leitura musical ajuda o compositor aqui?
- que material esta melodia, acorde ou progressão sugere?
- qual função está sendo cumprida?
- que tensão existe e para onde ela quer resolver?
- que alternativas preservam a melodia, a direção e a coerência harmônica?

## Hierarquia de decisão

O sistema deve obedecer à seguinte ordem:

1. **Melodia**: notas estruturais, repousos, suspensões, aproximações e contorno.
2. **Frase e região**: unidade formal e campo gravitacional local.
3. **Função**: repouso, preparação, tensão, prolongamento, passagem ou escape.
4. **Condução**: notas comuns, semitons, notas-guia, baixo e resolução de dissonâncias.
5. **Vocabulário harmônico**: diatônico, dominante, SubV, diminuto, modal, menor, cromático.
6. **Materiais melódicos**: células, arpejos, pentatônicas, notas-guia, simetrias e cromatismos.
7. **Cifragem e escala**: superfície de escrita e mapa de notas.
8. **Explicação**: só aparece quando ajuda a decisão musical.

Essa ordem vale para `Harmonizar` e, com menos contexto, para `Escrever`.

## Fontes teóricas como autoridade

O sistema deve ser calibrado por teoria musical e repertório, não por retorno de biblioteca.

| Fonte | Papel no modelo |
| --- | --- |
| Érica Masson | campo harmônico, função popular, dominantes secundários, SubV, ii-V, função aparente |
| Carlos Almada | rearmonização progressiva, função aplicada, substituição, diminutos e cromatismo controlado |
| Schoenberg | região, transformação, dissonância, coerência tonal e lógica composicional |
| Berklee | função jazz, tensão disponível, dominantes, menor melódica, diminuta e substituições |
| Bert Ligon | linhas, notas-guia, 3as/7as, resolução horizontal e conexão entre acordes |
| Levine / materiais de improvisação | chord-scale como mapa, não como resposta final |
| Chediak / Nelson Faria / repertório brasileiro | aplicação prática em música popular, cifra real e fraseado |
| Catálogo MusicXML real | auditoria empírica, casos-limite e regressão musical |

## Papel das bibliotecas

Bibliotecas como `tonal` podem continuar fazendo:

- transposição;
- normalização de notas;
- cálculo de intervalos;
- montagem de coleções;
- apoio a parsing quando validado por nossos contratos.

Elas não devem decidir:

- nome canônico de cifra sem validação;
- função harmônica;
- melhor escala;
- melhor rearmonização;
- qualidade musical da condução;
- material melódico a priorizar;
- explicação ao usuário.

Regra prática:

> Se a decisão afeta o julgamento musical exibido ao compositor, ela pertence ao modelo do Find Chord, não à biblioteca.

## O que o Harmonizar deve responder

O `Harmonizar` tem contexto: melodia, frase, possível harmonia de referência, centro, progressão e alvo local. Por isso, ele deve responder em camadas.

### 1. Leitura fundamental

Qual é a harmonização mais simples que respeita a melodia?

Em maior, isso normalmente começa por `I`, `IV` e `V`, com inversões e baixo quando necessário. Em menor/modal, a pergunta equivalente deve preservar repouso, preparação e tensão sem forçar um modelo inadequado.

### 2. Expansão funcional

Que alternativas enriquecem sem mudar o fundamento?

Exemplos:

- relativos;
- inversões;
- predominantes;
- ii-V locais;
- dominantes secundários;
- dominantes de aproximação;
- diminutos de passagem;
- empréstimos com função preservada.

### 3. Rearmonização progressiva

Que propostas mudam a superfície mantendo alguma coerência audível?

Exemplos:

- SubV;
- cadeias cromáticas;
- diminutos simétricos;
- tonicizações locais;
- cadências alternativas;
- substituição por função;
- deslocamentos regionais.

### 4. Materiais melódicos por proposta

Cada proposta harmônica deveria poder oferecer material de improvisação/composição derivado da própria leitura:

- notas-guia;
- arpejos essenciais;
- células de tensão;
- resolução para o próximo acorde;
- pentatônicas e tríades superiores;
- diminuta, alterada, bebop e menor melódica quando houver função.

## O que o Escrever deve responder

O `Escrever` normalmente vê um acorde isolado. Portanto, ele não deve fingir que possui o mesmo contexto do `Harmonizar`.

Ele deve responder:

- quais notas formam o acorde;
- que materiais idiomáticos o acorde sugere isoladamente;
- que tensões são prováveis ou perigosas;
- que mapas de escala podem organizar o braço;
- que escolhas dependem de contexto e precisam de progressão para serem promovidas.

Direção de UI:

> Mostrar primeiro materiais musicais; depois a escala como fonte/mapa.

O nome antigo “Escalas Compatíveis” deve ser tratado como legado conceitual. A funcionalidade atual deve se chamar e se comportar como **Materiais do acorde**.

## Critérios para remover ou rebaixar conceitos antigos

Um conceito herdado deve ser rebaixado para infraestrutura quando:

- só existe porque uma biblioteca retornava aquele nome;
- aparece na UI sem ajudar uma decisão musical;
- mistura categorias incompatíveis no mesmo nível;
- não sabe diferenciar contexto local e acorde isolado;
- gera uma lista, mas não orienta ação;
- usa linguagem de estilo/gênero em vez de comportamento harmônico;
- não consegue explicar tensão, resolução ou função.

Um conceito deve permanecer como primeira classe quando:

- melhora a decisão do compositor;
- preserva melodia ou função;
- ajuda a comparar alternativas;
- tem base teórica clara;
- pode ser auditado no catálogo real;
- produz consequência musical verificável.

## Auditoria inicial de dependência conceitual

| Área | Estado | Decisão |
| --- | --- | --- |
| `getCompatibleScales` | útil como adaptador de escala-fonte | rebaixar para infraestrutura |
| `WriterMaterialPanel` | consolidou “Materiais do acorde” como tela material-first | continuar reduzindo dependências conceituais herdadas de escala |
| `contextualScaleCandidates` | contém boa parte do novo vocabulário | renomear conceitualmente para candidatos de material/linha no futuro |
| `Tonal` | útil para operações mecânicas | manter sem autoridade musical |
| nomes de escala na UI | úteis como mapa | exibir como fonte, não como resposta |
| cards de harmonização | principal produto do `Harmonizar` | manter, mas ligar materiais melódicos a cada proposta |
| explicações longas | úteis em estudo, não sempre na criação | manter recolhidas/optativas |

## Próximo programa de trabalho

### Bloco 1 — Contrato e linguagem

- consolidar este documento como norte;
- revisar nomes de UI que ainda revelam o legado;
- separar “material”, “mapa” e “explicação”.

### Bloco 2 — Motor composer-first

- rebaixar listas de escala para adaptadores;
- promover materiais melódicos como entidade própria;
- garantir que cada material saiba sua fonte, função, tensão e resolução.

### Bloco 3 — Harmonizar com materiais por proposta

- associar materiais às propostas geradas;
- diferenciar material fundamental, funcional e exploratório;
- permitir que o usuário veja materiais por compasso/acorde da proposta.

### Bloco 4 — Auditoria por repertório

- rodar o catálogo real;
- medir onde o sistema sugere material genérico demais;
- corrigir por regra musical geral, não por `if` específico de música.

## Princípio final

O Find Chord não deve tentar parecer inteligente mostrando mais nomes.

Ele deve ajudar o músico a tomar decisões melhores:

- harmonizar com fundamento;
- rearmonizar com direção;
- escrever cifras corretas;
- escolher materiais melódicos tocáveis;
- entender tensão e resolução quando isso for útil.

Todo recurso que não aproxima o usuário dessas decisões deve ser simplificado, ocultado ou removido.
