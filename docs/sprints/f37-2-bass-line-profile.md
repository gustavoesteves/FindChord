# F37.2 — Perfil da Linha de Baixo

## Objetivo

Avaliar a linha de baixo como uma camada propria da conducao.

F37.1 sugeriu inversoes simples. F37.2 classifica o resultado da linha de baixo para explicar se ela caminha, salta, cria pedal, aproxima cromaticamente ou sustenta movimento funcional.

## Decisao teorica

O baixo nao e apenas a raiz do acorde.

Ele pode funcionar como:

- linha caminhante;
- aproximacao cromatica;
- pedal;
- movimento funcional por quarta/quinta;
- salto estrutural.

Essa leitura ajuda a separar uma progressao harmonicamente correta de uma progressao que tambem se conecta bem no registro grave.

## Comportamento implementado

Cada proposta ranqueada recebe:

```text
bassLineProfile
bassLineEvidence
```

Perfis iniciais:

```text
stepwise    -> baixo caminha por grau conjunto
chromatic   -> baixo aproxima por semitons recorrentes
pedal       -> baixo repete/sustenta uma regiao
functional  -> baixo move por quarta/quinta
leaping     -> saltos estruturais dominam a linha
mixed       -> mistura sem predominancia clara
```

O perfil deriva o baixo diretamente das cifras atuais, incluindo slash chords, para evitar divergencia entre `bassLine` antiga e acordes transformados.

## Implementacao

Arquivos principais:

```text
src/utils/music/analysis/strategies/BassLineProfile.ts
src/utils/music/analysis/strategies/VoiceLeadingProposalRanker.ts
src/utils/music/analysis/models/ReharmonizationProposal.ts
```

Mudancas:

- criada camada `BassLineProfile`;
- `ReharmonizationProposal` ganhou `bassLineProfile` e `bassLineEvidence`;
- o ranker anota perfil de baixo depois das sugestoes de inversao;
- diagnosticos locais indicam baixo caminhante/cromatico, pedal ou baixo saltado;
- `bassLine` passa a ser recalculada a partir das cifras finais da proposta.

## Testes

Coberto por:

```text
scripts/voice-leading-ranking.spec.ts
scripts/structural-bass-grammar.spec.ts
```

## Fora do escopo

- Gerar baixo independente fora da cifra.
- Escolher registro real.
- Criar ritmo de baixo.
- Substituir a analise de baixo estrutural de harmonias de referencia.

## Seguimento implementado

F37.3 usou o perfil de baixo na ordenacao fina das propostas, com peso menor que funcao, cobertura melodica e conducao geral.

```text
docs/f37-3-bass-line-ranking-adjustment.md
```
