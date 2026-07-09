# F91 - Auditoria de tensao dominante no catalogo

## Objetivo

Medir como o catalogo real usa dominantes simples, coloridas, alteradas e altamente alteradas.

Depois da F89/F90, a pergunta deixou de ser apenas "o motor reconhece `G7alt`?" e passou a ser: quando a referencia usa tensao forte, ela resolve imediatamente, fica suspensa, prepara uma resolucao deceptiva ou funciona como cor local?

## Implementacao

Foi criado o script:

- `scripts/audit-dominant-tension-corpus.ts`

Ele percorre `docs/musics`, le as cifras de referencia e gera:

- `docs/reports/f91-dominant-tension-audit.md`
- `docs/reports/f91-dominant-tension-audit.csv`

## Categorias

A auditoria conta:

- dominante simples;
- dominante colorida;
- dominante alterada;
- dominante altamente alterada;
- dominante alterada resolvida por quarta ascendente;
- dominante alterada resolvida como SubV por semitom descendente;
- dominante alterada sem alvo imediato.

## Decisao teorica

Dominante alterada sem alvo imediato nao deve ser tratada automaticamente como erro.

Ela pode ser:

- dominante deceptiva;
- dominante prolongada;
- dominante de passagem;
- dominante cujo alvo aparece depois de um acorde intermediario;
- cifra de referencia realmente solta ou ambigua.

## Proximo passo

Usar o relatorio F91 para escolher exemplos reais e implementar uma regra mais fina para:

- dominantes deceptivas;
- dominantes prolongadas;
- resolucao atrasada;
- diferenca entre tensao alterada funcional e cor cromatica sem destino.
