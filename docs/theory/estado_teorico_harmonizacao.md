# Estado Teórico da Harmonização

Última atualização: 2026-06-29

Este documento consolida o ponto teórico atual do Find Chord no eixo de harmonização e rearmonização. Ele parte de três fontes internas:

- `docs/theory/analise_ebooks_erica_masson.md`, com a progressão pedagógica da harmonia funcional popular em três volumes.
- `docs/theory/almada_examples.md`, com uma mesma melodia submetida a graus crescentes de rearmonização.
- `docs/jazz_theory_pedagogy_spec.md`, recuperado do histórico do git, com o panorama de escolas e autores de jazz moderno que vinha fundamentando o Harmony Engine.

O objetivo aqui não é encerrar a teoria, mas fixar uma base comum: onde estamos, que ideias já viraram critério computacional, quais lacunas ainda existem e que direções parecem musicalmente promissoras.

Para a organização operacional das camadas do sistema, ver também `docs/theory/quadro_teorico_sistema_harmonizacao.md`.

---

## 1. Tese atual do projeto

O Find Chord deixou de ser apenas um analisador de acordes e passou a caminhar para um laboratório de possibilidades harmônicas guiado por melodia.

A pergunta central mudou:

- Antes: "Que acorde, escala ou função aparece aqui?"
- Agora: "Que leituras harmônicas esta frase permite sem trair sua melodia, seu centro e sua direção funcional?"

Isso coloca a harmonização em um ponto intermediário entre teoria, composição e engenharia:

1. A melodia é a restrição principal.
2. A harmonia original é válida; ela não é tratada como erro.
3. A função estrutural importa mais do que o nome isolado do acorde.
4. Toda sugestão deve ser explicável por propriedades musicais: cobertura melódica, função, resolução, direção de baixo, cromatismo, tensão e estabilidade.
5. A rearmonização deve ser incremental: o sistema oferece próximos passos plausíveis, não uma resposta única.

---

## 2. Linhagens teóricas que estamos combinando

### 2.1 Harmonia tonal e funcional clássica

Esta camada fornece o vocabulário de gravidade tonal: repouso, preparação e tensão.

Autores e ideias importantes:

- Jean-Philippe Rameau: baixo fundamental, hierarquia dos acordes e relação entre acorde e centro tonal.
- Hugo Riemann: teoria funcional, com a tripartição Tônica, Subdominante e Dominante.
- Arnold Schoenberg: região tonal, prolongamento, transformação e lógica composicional da harmonia.
- Walter Piston: abordagem pedagógica de harmonia tonal, cadências e conduções normativas.
- Heinrich Schenker: importância da estrutura profunda e da diferença entre superfície e função estrutural.

Aplicação no Find Chord:

- A gramática operacional atual usa `T`, `PD` e `D` como funções estruturais.
- As estratégias são validadas por backbone funcional, não apenas por lista de cifras.
- Cadências e resoluções locais pesam mais do que a identidade estática do acorde.

### 2.2 Harmonia popular brasileira e funcional aplicada

Esta camada vem principalmente da leitura dos volumes de Érica Masson. Ela é particularmente útil porque traduz a teoria funcional para a prática de música popular, com foco em cifra, campo harmônico, dominantes secundários, SubV7, cadências ii-V, empréstimos e funções aparentes.

Pontos centrais:

- Campo harmônico maior e menor como mapa de possibilidades diatônicas.
- Funções harmônicas em tonalidade maior: Tônica, Subdominante e Dominante.
- Dominantes secundários e cadências ii-V locais.
- SubV7 e cadências por substituição tritonal.
- Tonalidade menor com campos natural, harmônico e melódico.
- Harmonia modal e identificação por notas características.
- Acordes de função aparente: diminutos, sus, m6, Im(b6), #IVm7(b5).
- Tabela de substituições por função como base para rearmonização controlada.

Aplicação no Find Chord:

- A ideia de substituição só é aceita quando preserva função e compatibilidade melódica.
- Diminutos, sus, m6 e #IVm7(b5) começam a ser lidos por contexto, não como "acordes estranhos".
- A tabela de substituições ainda não virou painel completo, mas já aparece como princípio em validadores e propostas controladas.

### 2.3 Rearmonização prática em Carlos Almada

O exemplo de Almada é valioso porque mostra uma mesma melodia atravessando vários níveis de sofisticação harmônica.

A sequência documentada vai de:

- harmonização primária com I, IV e V;
- expansão diatônica com relativos e inversões;
- dominantes secundários;
- ii-V locais;
- dominantes alterados;
- substituições tritonais;
- diminutos de passagem;
- empréstimos e acordes cromáticos;
- rearmonizações densas, com maior ambiguidade tonal.

Aplicação no Find Chord:

- As estratégias atuais refletem os primeiros degraus dessa escada: I-IV-V, expansão funcional diatônica, dominantes secundários e diminutos de passagem.
- O próximo salto não é simplesmente "adicionar mais acordes", mas classificar o grau de afastamento: conservador, moderado, cromático, modulante ou estruturalmente ambivalente.
- Almada funciona como corpus pequeno, mas muito bom, para testes de regressão musical.

### 2.4 Jazz moderno, improvisação e condução linear

O documento histórico sobre jazz apontava quatro escolas que continuam úteis:

- Bebop funcional: Barry Harris, Jerry Coker. Enfatiza dominantes conectivos, diminutos e resolução horizontal por semitom.
- Chord-scale theory: Mark Levine, Berklee, Dan Haerle. Associa qualidade de acorde a escala, extensões, tensões e voicings.
- Modal e pós-bop: George Russell, Ron Miller. Trabalha centros menos cadenciais, gravidade lídia e cores modais.
- Harmonia linear: Bert Ligon. Critica a leitura puramente vertical e prioriza linhas que conectam terças, sétimas e notas estruturais.

Aplicação no Find Chord:

- Chord-scale ajuda a sugerir escalas compatíveis e extensões.
- Bebop funcional e Barry Harris reforçam o tratamento de diminutos como movimento, não como evento isolado.
- Ligon sustenta a prioridade da melodia e da condução horizontal.
- Russell e a escola modal apontam para uma futura análise que não dependa sempre de V-I.

### 2.5 Contraponto aplicado e condução de vozes

Esta camada não deve ser entendida como contraponto estrito de espécies, nem como obrigação de criar uma segunda melodia contrapontística contra um cantus firmus. Para o Find Chord, a utilidade está em outro lugar: avaliar se uma progressão funcionalmente válida também se move bem entre acordes.

A harmonia funcional pergunta:

`Este acorde cumpre qual papel?`

A condução de vozes pergunta:

`Este acorde chega bem no próximo?`

Essas perguntas se completam. Uma progressão pode cumprir `T -> PD -> D -> T` e ainda soar dura se as vozes internas saltam sem necessidade, se a sétima de dominante não resolve, se há cruzamento estranho ou se o baixo contradiz o gesto da frase. Da mesma forma, uma condução muito suave pode não criar direção harmônica suficiente.

Autores e ideias importantes:

- Johann Joseph Fux: referência histórica para independência de vozes, ainda que o uso aqui seja muito mais livre.
- Rameau e Piston: tratamento da harmonia em vozes, resolução de dissonâncias e preparação cadencial.
- Schoenberg: movimento harmônico como consequência de transformação e condução.
- Barry Harris: diminutos e movimentos internos como mecanismo prático de ligação.
- Bert Ligon: guide tones, linhas horizontais e resolução de terças e sétimas.

Aplicação no Find Chord:

- A condução de vozes deve servir como critério de validação e ranqueamento, não como um motor composicional autônomo nesta fase.
- O sistema deve premiar notas comuns, movimento conjunto, resolução de sensíveis, resolução de sétimas e guide tones bem conduzidos.
- O sistema deve penalizar saltos internos desnecessários, paralelismos muito rígidos quando forem musicalmente pobres, cruzamento de vozes, espaçamento excessivo e baixo sem direção.
- A camada deve comparar alternativas que já passaram pela validação funcional, ajudando a escolher a opção que soa mais inevitável.

---

## 3. O que já virou teoria operacional

### 3.1 Melodia como contrato

A melodia não é decoração sobre uma cifra. Ela determina quais acordes podem existir.

Hoje isso aparece em:

- extração de âncoras melódicas;
- cobertura mínima da melodia por acorde;
- rejeição de candidatos que não sustentam notas estruturais;
- preferência por propostas que preservam a direção da frase.

Lacuna: ainda precisamos distinguir melhor nota estrutural, nota ornamental, nota de aproximação, suspensão e tensão expressiva.

### 3.2 Função antes de cifra

O motor já trabalha com um arco funcional básico:

`T -> PD -> D -> T`

Isso permite comparar harmonizações diferentes pela mesma "frase funcional". Por exemplo, `F`, `Dm7`, `#IVm7(b5)` e certos acordes sus podem atuar como preparação, dependendo do contexto.

Lacuna: a função ainda é muito centrada em maior/menor tonal. Falta um modelo mais rico para regiões locais, tonicizações, ambiguidade modal e funções em menor.

### 3.3 Rearmonização como estratégia validada

As estratégias atuais podem ser resumidas assim:

| Estratégia | Ideia teórica | Estado |
| --- | --- | --- |
| I-IV-V | harmonização primária | operacional |
| Expansão funcional diatônica | relativos, prolongamentos e preparação | operacional |
| Dominantes secundários | tonicização local com resolução | operacional |
| Diminuto de passagem | cromatismo resolvido por semitom | operacional |
| ii-V local | gramática cadencial local | parcial |
| Substituição controlada | trocar mantendo função | parcial |

O ponto importante é que o sistema já possui uma postura: gerar, validar e explicar. Uma cifra candidata não basta; ela precisa cumprir papel musical.

### 3.4 Funções aparentes

O terceiro volume de Érica Masson é central para a próxima fase porque trata acordes que parecem "fora", mas cumprem função clara.

Já temos início de leitura contextual para:

- sus como preparação ou dominante suspenso;
- diminuto como dominante aparente ou passagem cromática;
- m6 como estrutura implícita dependente de alvo;
- #IVm7(b5) como intensificação/substituição predominante.

Lacuna: ainda falta transformar isso em uma tabela ampla de substituições por função, com UI e geração musical consistente.

### 3.5 Condução de vozes como critério

A condução de vozes ainda não está consolidada no Harmonizar atual como regra explícita de decisão. Existem rastros conceituais no código, como `ContrapuntalGravityField`, `ChordRealizationEngine`, `bassContour` e campos de `voiceLeadingScore`, mas eles não formam hoje uma régua simples e canônica para ranquear propostas visíveis.

O próximo passo teórico não é criar uma máquina independente de contraponto. O próximo passo é definir uma régua pequena:

- manter notas comuns entre acordes consecutivos;
- favorecer movimento por grau conjunto nas vozes internas;
- resolver sétimas de dominante para baixo quando houver alvo tonal claro;
- resolver sensíveis por semitom quando isso fizer parte da cadência;
- valorizar terças e sétimas como guide tones em ii-V-I;
- observar se o baixo sustenta ou contradiz a função;
- evitar cruzamentos e espaçamentos pouco idiomáticos;
- tratar cromatismos como aproximação quando resolvem, não como erro automático.

Essa régua deve entrar depois da validação funcional. Em outras palavras: primeiro o sistema decide se a proposta é harmonicamente aceitável; depois decide qual proposta aceitável conduz melhor as vozes.

---

## 4. Onde estamos agora

O estado teórico atual pode ser descrito assim:

1. Base tonal e funcional estabelecida.
2. Melodia já é usada como restrição real.
3. Harmonização primária e expansão diatônica já existem como estratégias.
4. Dominantes secundários e diminutos de passagem já possuem validação por resolução.
5. Funções aparentes já começaram a entrar no sistema.
6. Substituição controlada existe, mas ainda é pequena.
7. Análise modal, blues, SubV7 sistemático, empréstimo modal amplo e tabela completa de substituições ainda estão como próximas camadas.
8. Condução de vozes existe como intuição e rastros técnicos, mas ainda não como critério canônico de ranking no Harmonizar.

Em termos musicais, estamos no final da fase "harmonia funcional controlada" e no começo da fase "rearmonização contextual".

Ainda falta abordar teoricamente, com mais cuidado:

- condução de vozes aplicada à harmonização, especialmente guide tones e resolução de dissonâncias;
- diferença entre contraponto estrito, harmonia em vozes e voice leading idiomático para música popular/jazz;
- tensões e extensões como cor, função, preparação ou atrito;
- menor natural, harmônico e melódico como gramáticas funcionais completas;
- modalismo sem dependência de V-I;
- blues como sistema em que dominante pode ser estabilidade, não apenas tensão;
- SubV7, subIIm7, diminutos, sus, m6, #IVm7(b5) e empréstimos como substituições funcionais contextualizadas;
- rearmonização por objetivo composicional: evitar resolução, aumentar tensão, preparar modulação, preservar baixo, preservar memória cadencial.

---

## 5. Tensões teóricas que precisamos preservar

Estas tensões são boas; elas impedem o sistema de ficar simplista.

### Vertical vs horizontal

A chord-scale theory pergunta: "Que escala serve neste acorde?"

A harmonia linear pergunta: "Para onde esta linha está indo?"

O Find Chord precisa das duas, mas a decisão de harmonização deve favorecer a leitura horizontal quando houver conflito, porque a melodia é soberana.

### Função vs cor

Um acorde pode ser bonito e ainda assim não cumprir a função da frase.

O sistema deve separar:

- substituição funcional: muda a cifra, preserva papel;
- coloração: adiciona tensões, preserva base;
- reinterpretação: muda o papel percebido;
- modulação: muda ou prepara novo centro.

### Função vs condução

A função diz por que um acorde pertence à frase. A condução diz se ele se conecta bem ao acorde anterior e ao próximo.

O sistema não deve deixar a condução de vozes substituir a função. Uma passagem extremamente suave pode ser funcionalmente fraca; uma cadência funcionalmente forte pode exigir algum atrito local. A decisão correta é hierárquica:

1. preservar melodia e centro;
2. validar função e resolução;
3. ranquear por condução de vozes;
4. explicar o resultado em termos musicais simples.

### Tonal vs modal

Nem toda progressão quer resolver por V-I.

O motor atual ainda pensa majoritariamente em função tonal. A camada modal futura deve reconhecer estabilidade por nota característica, pedal, centro recorrente e ausência de cadência dominante.

### Teoria normativa vs prática idiomática

A teoria clássica oferece critério; a música popular oferece exceções idiomáticas.

O Find Chord não deve "corrigir" uma escolha idiomática apenas porque ela foge de uma regra escolar. Ele deve explicar a escolha e mostrar alternativas.

---

## 6. Próximas fronteiras

### 6.1 Curto prazo: consolidar rearmonização controlada

Prioridades:

1. Adicionar condução de vozes como régua de ranqueamento das propostas aceitas.
2. Expandir a tabela de substituições por função.
3. Implementar SubV7 e ii-subV7 como estratégias explícitas.
4. Generalizar #IVm7(b5), sus, m6 e diminutos em propostas controladas.
5. Exibir "por que esta troca funciona" em linguagem musical simples.

Resultado esperado: o usuário consegue trocar um acorde por outro entendendo o que foi preservado e o que mudou.

### 6.2 Médio prazo: regiões e rotas harmônicas

Prioridades:

1. Agrupar acordes em regiões: estabelecimento, prolongamento, predominante, dominante e cadencial.
2. Gerar rotas, não apenas acordes soltos.
3. Medir distância em relação ao original: conservadora, moderada, cromática, radical.
4. Explicar também o que foi rejeitado.

Resultado esperado: o Harmonizer vira um explorador de possibilidades, não uma lista de sugestões.

### 6.3 Médio/longo prazo: modal, blues e menor profundo

Prioridades:

1. Detectar centro modal sem exigir V-I.
2. Usar notas características dos modos como evidência.
3. Diferenciar intercâmbio modal de modulação modal.
4. Modelar blues como gramática própria, não como "erro tonal".
5. Tratar os três campos menores com suas funções específicas.

Resultado esperado: o sistema passa a compreender linguagens que não cabem totalmente no arco tonal clássico.

### 6.4 Longo prazo: composição assistida por objetivos

Prioridades:

1. Permitir objetivos como "evitar resolução final", "aumentar tensão", "preparar modulação" ou "manter baixo".
2. Traduzir objetivos em restrições musicais.
3. Criar memória de exploração: original, variações aceitas, variações rejeitadas.
4. Permitir navegação por uma árvore de rearmonizações.

Resultado esperado: o Find Chord se torna uma ferramenta de pensamento composicional.

---

## 7. Base de trabalho recomendada

Para manter o projeto coerente, as próximas implementações deveriam seguir esta ordem conceitual:

1. Função e resolução antes de cor.
2. Região antes de acorde isolado.
3. Melodia antes de cifra.
4. Condução de vozes depois da validação funcional.
5. Explicabilidade antes de quantidade de sugestões.
6. Substituição controlada antes de rearmonização radical.
7. Tonalidade consolidada antes de modalismo avançado.
8. Exemplos musicais reais antes de expansão abstrata.

Essa ordem preserva o que o projeto já conquistou: um motor que não apenas enumera acordes possíveis, mas tenta pensar musicalmente.

---

## 8. Como este documento deve ser usado

Este arquivo deve funcionar como um ponto de orientação para futuras sprints.

Antes de adicionar uma feature harmônica, vale perguntar:

1. Ela pertence a qual camada teórica?
2. Ela preserva melodia, função ou centro?
3. Ela é substituição, coloração, reinterpretação ou modulação?
4. Ela precisa de validação por resolução?
5. Ela melhora, piora ou preserva a condução de vozes?
6. Ela consegue explicar sua própria escolha?
7. Ela aparece nos exemplos de Érica Masson, Almada ou na linhagem jazz/clássica mapeada?

Se a resposta não estiver clara, talvez a feature ainda não seja implementação: talvez seja primeiro um conceito a documentar.
