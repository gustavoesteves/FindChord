# F28.2 — Planejador de Regiões Funcionais

## Objetivo

Transformar a janela de frase em uma leitura funcional interna mínima.

A F28.1 definiu se estamos lidando com uma seção explícita ou uma frase inferida. A F28.2 dá o próximo passo: dentro da frase, cada compasso passa a ter um papel funcional inicial.

## Tese

Uma frase não é apenas uma sequência de compassos. Mesmo antes de escolher cifras específicas, ela costuma conter:

1. estabelecimento;
2. resposta ou abertura subdominante;
3. preparação dominante;
4. resolução cadencial.

Essa leitura não decide sozinha os acordes. Ela oferece uma base para que o Harmonizar escolha, valide e explique as estratégias.

## Escopo Implementado

### 1. Planejador de região funcional

Foi criado `FunctionalRegionPlanner`, responsável por converter compassos em regiões funcionais.

Papéis atuais:

| Papel | Função | Sentido musical |
| --- | --- | --- |
| `ESTABLISHMENT` | `T` | estabelece repouso ou ponto de partida |
| `SUBDOMINANT_RESPONSE` | `PD` | abre caminho, responde ou prepara deslocamento |
| `DOMINANT_PREPARATION` | `D` | cria impulso cadencial |
| `CADENTIAL_RESOLUTION` | `T` | resolve ou fecha a unidade |

### 2. Subfrases de quatro compassos

Uma janela de 8 compassos agora pode ser lida como duas curvas internas:

```text
1: T  — estabelecimento
2: PD — resposta subdominante
3: D  — preparação dominante
4: T  — resolução

5: T  — estabelecimento
6: PD — resposta subdominante
7: D  — preparação dominante
8: T  — resolução
```

Essa regra ainda é deliberadamente simples. Ela é um contrato inicial, não uma teoria completa de período, sentença ou motivo.

### 3. Integração no harmonizador

`StrategyGuidedHarmonizer` agora consome a região funcional planejada para:

- escolher a função de base de cada compasso;
- identificar finais de subfrase;
- preservar a resposta subdominante da Parte B de Asa Branca;
- manter a intensificação cromática sob controle.

Importante: a leitura de preparação dominante interna existe, mas ainda não libera dominantes secundárias ou diminutos em todos esses pontos. Por enquanto, a intensificação segue conservadora para evitar saturação harmônica.

## Fora de Escopo

- Segmentar motivos reais.
- Detectar pergunta/resposta por contorno melódico.
- Diferenciar período paralelo, período contrastante e sentença.
- Criar um resolvedor completo de regiões harmônicas.
- Liberar SubV7, ii-subV7 ou empréstimos modais a partir dessa camada.

## Critérios de Aceitação

- Uma janela de 8 compassos gera duas curvas funcionais internas de 4 compassos.
- Cada compasso recebe papel e função explícitos.
- O harmonizador usa esse contrato em vez de calcular posição de frase de forma implícita.
- Asa Branca continua validando a Parte B como frase própria.
- A intensificação cromática não aumenta densidade sem validação melódica.

## Próximo Passo

A F28.3 deve deixar a região menos mecânica:

- usar peso melódico para confirmar ou corrigir o papel funcional;
- distinguir fechamento real de pausa aberta;
- detectar subdominante estrutural por duração e repetição;
- estimar alvo cadencial local por subfrase;
- produzir explicações como "a frase abre para subdominante" ou "a frase prepara cadência".

Só depois disso SubV7 deve entrar com segurança: ele precisa saber qual dominante está substituindo e para onde essa dominante deve resolver.
