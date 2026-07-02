# F28 — Voice Leading no Harmonizar

## Objetivo

Adicionar condução de vozes como critério musical de ranqueamento das propostas do Harmonizar.

A F28 não cria um novo motor autônomo de contraponto. Ela introduz uma régua pequena e auditável que avalia transições entre acordes já aceitos pela validação funcional. O objetivo é escolher melhor entre alternativas harmonicamente válidas.

## Tese

A harmonia funcional responde:

```text
Este acorde cumpre qual papel?
```

A condução de vozes responde:

```text
Este acorde chega bem no próximo?
```

O Harmonizar deve respeitar esta ordem:

1. preservar melodia e centro tonal;
2. validar função, resolução e compatibilidade;
3. ranquear propostas aceitas por condução de vozes;
4. explicar o resultado em linguagem musical simples.

## Fora de Escopo

- Contraponto de espécies.
- Geração de uma segunda melodia contrapontística completa.
- Ressuscitar a antiga camada genérica `src/utils/music/voiceLeading`.
- Recriar painel legado de voice-leading.
- Resolver voicings físicos de guitarra para cada proposta.
- Implementar análise modal, blues ou SubV7 completo nesta fatia.

## Escopo Funcional

### 1. Modelo de avaliação

Criar um avaliador pequeno para transições entre acordes.

Entrada sugerida:

```ts
interface VoiceLeadingTransitionInput {
  previousChord: string;
  nextChord: string;
  center: string;
  previousMelodyPitches?: string[];
  nextMelodyPitches?: string[];
}
```

Saída sugerida:

```ts
interface VoiceLeadingTransitionReport {
  score: number;
  commonToneCount: number;
  stepwiseMotionCount: number;
  guideToneResolutionCount: number;
  unresolvedTendencyCount: number;
  excessiveLeapCount: number;
  evidence: string[];
}
```

O score deve ser simples, previsível e fácil de testar.

### 2. Critérios musicais

Premiar:

- notas comuns entre acordes consecutivos;
- movimento por grau conjunto;
- resolução de sétimas de dominante para baixo;
- resolução de sensíveis por semitom quando houver alvo tonal claro;
- guide tones bem conduzidos em ii-V-I;
- baixo coerente com o gesto funcional.

Penalizar:

- saltos internos desnecessários;
- perda de resolução em dominantes claros;
- vozes cruzadas quando houver realização estimada;
- espaçamento excessivo quando a realização estimada ficar pouco idiomática;
- baixo que contradiz uma cadência estrutural sem justificativa.

### 3. Integração no Harmonizar

Integrar a avaliação depois da geração/validação das propostas:

```text
StrategyGuidedHarmonizer / ControlledSubstitutionProposals
  -> propostas aceitas
  -> VoiceLeadingProposalRanker
  -> propostas ordenadas + explicação
```

O ranking não deve rejeitar propostas sozinho na primeira versão. Ele deve:

- adicionar score de condução;
- ordenar propostas aceitas quando houver empate ou proximidade funcional;
- anexar evidências à explicação.

### 4. Modelo de proposta

Estender `ReharmonizationProposal` com metadados opcionais:

```ts
interface ReharmonizationProposal {
  ...
  voiceLeadingScore?: number;
  voiceLeadingEvidence?: string[];
}
```

Isso preserva compatibilidade com propostas existentes e evita uma migração grande.

### 5. UI mínima

Exibir no card da proposta uma frase curta quando houver evidência:

- "Condução suave: mantém 2 notas comuns."
- "Boa resolução: sétima dominante desce por grau conjunto."
- "Movimento mais brusco: salto interno estimado."

A UI não precisa de painel novo. A evidência deve aparecer junto da explicação da proposta.

## Testes

Criar uma suíte focada, por exemplo:

`scripts/voice-leading-ranking.spec.ts`

Casos mínimos:

1. `Dm7 -> G7 -> Cmaj7` deve pontuar bem por guide tones e resolução.
2. Duas propostas funcionalmente válidas devem ser ordenadas pela condução mais suave.
3. Uma dominante sem resolução clara deve receber evidência negativa.
4. Notas comuns devem aumentar o score.
5. Saltos estimados excessivos não devem rejeitar a proposta, apenas reduzir o ranking.

## Arquivos Prováveis

Criar:

- `src/utils/music/analysis/strategies/VoiceLeadingTransitionEvaluator.ts`
- `src/utils/music/analysis/strategies/VoiceLeadingProposalRanker.ts`
- `scripts/voice-leading-ranking.spec.ts`

Alterar:

- `src/utils/music/analysis/models/ReharmonizationProposal.ts`
- `src/domains/harmonizer/hooks/useHarmonizerProposals.ts`
- `src/domains/harmonizer/components/HarmonizationProposalCard.tsx`
- `src/utils/music/analysis/strategies/StrategyGuidedHarmonizer.ts`
- `src/utils/music/analysis/strategies/ControlledSubstitutionProposals.ts`, se as rearmonizações controladas também entrarem no ranking.

Consultar, mas não necessariamente reaproveitar diretamente:

- `src/utils/music/analysis/engines/fields/ContrapuntalGravityField.ts`
- `src/utils/music/analysis/engines/ChordRealizationEngine.ts`
- `src/utils/music/analysis/models/HarmonicSeed.ts`

## Critérios de Aceitação

- Propostas aceitas continuam sendo aceitas; a F28 só altera ranking e explicação.
- O card do Harmonizar mostra evidência curta de condução quando disponível.
- O ranking favorece transições com notas comuns, resolução de guide tones e movimento conjunto.
- O ranking penaliza dominantes sem resolução e saltos internos estimados.
- A suíte curada continua passando.
- Não há retorno da pasta removida `src/utils/music/voiceLeading`.

## Próximo Passo Após F28

Depois que a condução de vozes estiver ranqueando propostas, o caminho natural é F29:

- expandir SubV7 e ii-subV7;
- conectar substituições funcionais à régua de condução;
- começar a medir "distância" entre original e rearmonização;
- preparar a noção de rotas harmônicas por região.
