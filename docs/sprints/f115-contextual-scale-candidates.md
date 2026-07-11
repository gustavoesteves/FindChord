# F115 - Candidatas contextuais de escala

## Objetivo

Criar o primeiro contrato de escala para o `Harmonizar`, separando a leitura
de um acorde isolado da escolha sustentada por melodia, funcao e resolucao.

## Contrato

Cada candidata contextual agora carrega:

- escala e ordem de prioridade;
- papel: principal, cor ou resolucao;
- funcao local: repouso, preparacao, dominante, modal ou cor;
- chord tones e tensoes sustentadas;
- notas da melodia cobertas e percentual de cobertura;
- notas de evitar na leitura de tonica;
- alvo de resolucao, confianca e justificativa musical.

## Regras implementadas

- a cifra passa primeiro pelo resolvedor semantico;
- cifras ambiguas nao podem cair no fallback maior do parser legado;
- `ii-V-I` reconhece o ii como predominante e prioriza Dorian;
- dominante que resolve ao centro tonal e classificada como dominante;
- a melodia participa do ranqueamento pela cobertura ponderada das notas;
- alteracoes escritas, como `7(b9)`, preservam candidatas alteradas e nao
  recebem `major` como resposta generica;
- as sugestoes ja sao produzidas por trecho no hook do `Harmonizar`.

## Limite do sprint

O `Escrever` ainda usa o mapa local de escalas, e a interface do `Harmonizar`
ainda nao exibe as candidatas. Isso fica para o bloco de apresentacao: mostrar
uma escala principal, uma cor alternativa, as tensoes sustentadas pela melodia
e o alvo de resolucao sem transformar todas as candidatas em equivalentes.

## Verificacao

- 4 testes focados de candidatas contextuais aprovados;
- 11 testes focados de insercao no MuseScore continuam aprovados;
- TypeScript e ESLint dos arquivos alterados aprovados.
