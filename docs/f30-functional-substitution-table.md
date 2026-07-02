# F30 — Tabela de Substituições por Função

## Objetivo

Sistematizar substituições por função em vez de manter candidatos soltos no código.

Até aqui, a substituição controlada conhecia praticamente um caso: `#IVm7(b5)` como predominante aparente. A F30 cria um catálogo explícito de substituições funcionais.

## Tese

Uma substituição só é musicalmente segura quando preserva algo reconhecível:

- função;
- melodia;
- direção;
- baixo;
- alvo cadencial;
- idioma.

Por isso, a tabela não deve ser apenas uma lista de acordes. Cada entrada precisa carregar função, template, acorde materializado, idioma e explicação.

## Escopo Implementado

### 1. Catálogo funcional

Foi criado `FunctionalSubstitutionCatalog`.

Entradas iniciais em maior funcional:

| Função | Template | Exemplo em C | Sentido |
| --- | --- | --- | --- |
| T | `vi` | `Am` | relativo menor prolonga repouso |
| T | `iii` | `Em` | mediante preserva repouso |
| PD | `ii` | `Dm` | supertônico menor preserva preparação |
| PD | `#IVm7(b5)` | `F#m7(b5)` | intensifica subdominante |
| D | `V7sus4` | `G7sus4` | dominante suspenso |
| D | `SubV7` | `Db7` | dominante por trítono |

### 2. Integração com substituição controlada

`ControlledSubstitutionProposals` agora consome o catálogo.

O gerador:

- identifica a função do acorde original;
- busca candidatos da mesma função;
- exige melodia estrutural no compasso;
- exige cobertura melódica;
- preserva baixo explícito estrutural;
- valida função real ou aparente antes de propor.

### 3. SubV7 como substituição dominante

`FunctionPreservingSubstitution` agora reconhece `SubV7` resolvido como dominante aparente quando:

```text
Db7 -> C
```

Isso permite que a tabela use SubV7 sem tratar todo acorde cromático como funcional.

## Fora de Escopo

- Tabela para menor.
- Tabela modal.
- Tabela blues.
- Equivalência enharmônica completa.
- Escolha estilística automática entre substitutos.
- Aplicar múltiplas substituições na mesma frase.

## Critérios de Aceitação

- O catálogo materializa substituições de T, PD e D em C.
- A substituição controlada continua gerando `F#m7(b5)` para função predominante quando a melodia permite.
- A substituição controlada consegue gerar `Am` para repouso quando a melodia permite.
- A substituição controlada consegue gerar `Db7` para dominante resolvida quando a melodia permite.
- Compassos sem melodia estrutural não recebem substituição controlada.
- A suíte curada continua passando.

## Próximo Passo

A F30.1 deve ampliar a tabela com controle por idioma:

- maior funcional;
- menor tonal;
- modal;
- blues.

Antes de aplicar isso amplamente, vale resolver equivalência enharmônica, porque muitas substituições cromáticas dependem de escrita musical flexível.
