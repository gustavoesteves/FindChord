# Envelope suportado da integração MuseScore

Este documento registra o contrato operacional atual da integração Find Chord ↔ MuseScore.

## Escopo suportado

- Uma instância ativa do MuseScore por vez.
- Uma partitura ativa/sincronizada por vez.
- Inserção de cifras textuais na partitura ativa.
- Reenvio idempotente de uma tentativa de inserção quando o Writer mantém o mesmo `commandId`.
- Rejeição de comandos quando a sessão do plugin ou o `scoreId` conhecido não batem com o alvo da operação.

## Limitações declaradas

- Ao trocar de partitura no MuseScore, o usuário deve ressincronizar antes de inserir novas cifras.
- O plugin insere cifra, não diagrama de braço/fretboard.
- Múltiplas instâncias simultâneas do MuseScore ainda não são um cenário suportado como contrato de produto.
- O estado confiável é a última partitura sincronizada e reconhecida pelo bridge; uma partitura aberta depois disso não deve receber comandos sem novo sync.

## Checklist manual

1. Sincronizar partitura A.
2. Abrir ou ativar partitura B sem ressincronizar.
3. Tentar inserir uma cifra pelo Writer.
4. Resultado esperado: a operação deve ser bloqueada/rejeitada ou exigir nova sincronização, nunca inserir silenciosamente na partitura errada.

5. Abrir o plugin no MuseScore e sincronizar uma partitura.
6. Reiniciar a bridge local mantendo o plugin aberto.
7. Tentar sincronizar/inserir novamente.
8. Resultado esperado: o plugin deve renovar sessão/token ou a UI deve mostrar falha recuperável, sem deixar comando antigo pendurado como sucesso.

## Status de cobertura automatizada

- Bridge em porta efêmera.
- Sessão de plugin com `pluginSessionId`.
- Mutações endereçadas por `targetPluginSessionId` e `targetScoreId`.
- Mutação endereçada à sessão renovada não é consumida pela sessão antiga.
- ACK rejeitado quando vem de sessão diferente.
- Comando endereçado ao score B não é entregue quando o score ativo conhecido é A.
- Timeout, ACK rejeitado e queda de conexão cobertos por fault injection.

## Critério prático

A integração pode ser considerada operacionalmente segura para uso cotidiano quando os dois testes manuais acima forem executados com sucesso no runtime real do MuseScore.
