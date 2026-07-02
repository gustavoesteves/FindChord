# Chord Symbol Dictionary — Find Chord

Status: draft contract v0.1  
Scope: cifragem popular/jazz moderna, MusicXML/software, dialeto pedagógico brasileiro.

> Princípio: o parser deve aceitar muitas grafias reais, mas a engine deve trabalhar com uma forma interna única, semântica e testável. A forma de exibição pode variar por perfil: `br`, `jazz`, `musicxml`, `ireal`, `plain`.

---

## 1. Decisões canônicas de dialeto

### 1.1 Perfis de exibição

| Perfil | Uso | Preferências |
|---|---|---|
| `br` | músico brasileiro / songbook / aula | `7M`, `m7(b5)`, `°`, `7sus4`, tensões entre parênteses quando houver ambiguidade |
| `jazz` | Real Book / lead sheet internacional | `maj7` ou `Δ7`, `ø`, `°7`, `7sus`, `7alt` |
| `plain` | texto ASCII estável para testes | `maj7`, `m7b5`, `dim7`, `7sus4`, `7alt` |
| `musicxml` | exportação semântica | `kind` + `degree[]`, com `text` apenas como aparência |
| `ireal` | compatibilidade iReal Pro | `^`, `-`, `ø`, `o`, `+`, `alt` |

### 1.2 Normalização de símbolos

| Entrada | Normalizar para | Observação |
|---|---|---|
| `♭`, `−`, `–`, `—` | `b`, `-` | Unicode bonito vira ASCII na borda |
| `♯` | `#` | idem |
| `△`, `∆`, `Δ`, `^` | `maj7` quando usado como qualidade de sétima | `CΔ`, `C^`, `CΔ7` -> `Cmaj7` |
| `º`, `°`, `o` | `dim` ou `dim7` conforme contexto | `Co7`/`C°7` = diminuto completo; `Co`/`C°` = tríade diminuta |
| `ø`, `Ø`, `ø7` | `m7b5` | meio-diminuto completo por convenção |
| `-` após raiz | `m` | `C-7` -> `Cm7`; cuidado com hífen de texto |
| `ma`, `Maj`, `MAJ`, `M` | `maj` | mas `M` isolado deve ser aceito com baixa prioridade se ambíguo |
| `mi`, `min`, `Min` | `m` | comum em MuseScore e material pedagógico |
| `+` | `aug` ou `#5` conforme posição | `C+` = `Caug`; `C7+` pode ser `C7#5` no iReal |

### 1.3 Ordem canônica de tensões na exibição

Preferir esta ordem quando várias tensões aparecerem:

```text
b9, 9, #9, 11, #11, b13, 13
```

Exemplos:

```text
C7(#9,b13)  -> C7(#9,b13)
C7(b13,#9)  -> C7(#9,b13)
Cmaj7(#11,9) -> Cmaj7(9,#11)
```

### 1.4 Parênteses

- Tensões alteradas em dominantes: preferir parênteses na exibição `br` e `plain`: `C7(b9)`, `C7(#9,b13)`.
- Em entrada, aceitar com ou sem parênteses: `C7b9`, `C7(b9)`, `C7 b9`.
- Forma interna nunca deve depender de parênteses.

### 1.5 Baixo / inversão

| Entrada | Forma interna | Observação |
|---|---|---|
| `C/E` | root `C`, quality `maj`, bass `E` | inversão |
| `F/G` | root `F`, quality `maj`, bass `G` | slash chord/pedal; função depende do contexto |
| `Dm7/G` | root `D`, quality `m7`, bass `G` | pode funcionar como `G9sus` no contexto, mas não rebatizar automaticamente |

---

## 2. Dicionário principal

| Família | Grafias aceitas | Forma interna | Forma de exibição `br` | Forma de exibição `jazz/plain` | Notas essenciais | Função típica | MusicXML base | Observações / testes |
|---|---|---|---|---|---|---|---|---|
| Maior | `C`, `Cmaj`, `CM`, `Cma` | `maj` | `C` | `C` | `1 3 5` | T / IV / cor modal | `major` | `maj` sem 7 deve continuar tríade, não `maj7` |
| Maior com 7M | `Cmaj7`, `CM7`, `CΔ7`, `CΔ`, `C^`, `C7M`, `C7+`* | `maj7` | `C7M` | `Cmaj7` ou `CΔ7` | `1 3 5 7` | T maior / IVΔ / cor lídia | `major-seventh` | `C7+` é ambíguo: no Brasil às vezes 7M; em iReal pode significar `7#5`; marcar como alias dependente de perfil |
| Maior 6 | `C6`, `Cmaj6`, `CM6` | `6` | `C6` | `C6` | `1 3 5 6` | T maior / samba-canção / bossa | `major-sixth` | Não confundir `6` com `13` dominante |
| Maior 6/9 | `C6/9`, `C69`, `C6add9` | `6_9` | `C6/9` | `C6/9` | `1 3 5 6 9` | T maior brasileiro/bossa | `major-sixth` + add 9 | `C69` deve parsear, mas exibir `C6/9` |
| Maior add9 | `Cadd9`, `C(add9)`, `C2`* | `add9` | `C(add9)` | `Cadd9` | `1 3 5 9` | T/IV colorido | `major` + add 9 | `C2` é aceito só em perfil pop/iReal; preferir `add9` |
| Maior #11 | `Cmaj7(#11)`, `C7M(#11)`, `CΔ#11`, `C^#11` | `maj7_sharp11` | `C7M(#11)` | `Cmaj7(#11)` | `1 3 5 7 #11` | IV lídio / T lídio | `major-seventh` + add/alter #11 | Não transformar em `Cmaj7(b5)` automaticamente; #11 é tensão |
| Menor | `Cm`, `Cmin`, `Cmi`, `C-` | `m` | `Cm` | `Cm` ou `C-` | `1 b3 5` | t menor / ii / vi | `minor` | `-` só após raiz/baixo, nunca como separador genérico |
| Menor 7 | `Cm7`, `Cmin7`, `Cmi7`, `C-7` | `m7` | `Cm7` | `Cm7` ou `C-7` | `1 b3 5 b7` | ii / vi / t menor modal | `minor-seventh` | Forma interna simples `m7` |
| Menor 9 | `Cm9`, `Cmin9`, `Cmi9`, `C-9` | `m9` | `Cm9` | `Cm9` ou `C-9` | `1 b3 5 b7 9` | ii expandido / t menor modal | `minor-ninth` ou `minor-seventh` + add 9 | Encontrado em repertório real (`Dm9`) |
| Menor 11 | `Cm11`, `Cmin11`, `Cmi11`, `C-11` | `m11` | `Cm11` | `Cm11` ou `C-11` | `1 b3 5 b7 9 11` | ii expandido / cor modal menor | `minor-11th` ou `minor-seventh` + add 9/11 | Encontrado em repertório real (`Am11`, `Gm11`) |
| Menor 6 | `Cm6`, `C-6`, `Cmin6` | `m6` | `Cm6` | `Cm6` ou `C-6` | `1 b3 5 6` | t menor melódico / subdominante menor | `minor-sixth` | Em contexto pode equivaler a meio-diminuto na inversão, mas não colapsar |
| Menor 6/9 | `Cm6/9`, `C-6/9`, `Cm69` | `m6_9` | `Cm6/9` | `Cm6/9` | `1 b3 5 6 9` | t menor sofisticado | `minor-sixth` + add 9 | Muito comum em bossa/jazz |
| Menor com 7M | `Cm(maj7)`, `CmM7`, `Cm7M`, `C-^`, `C-Δ` | `mMaj7` | `Cm7M` | `Cm(maj7)` | `1 b3 5 7` | t menor melódico / cor cinematográfica | `major-minor` | Aceitar `mM7`; exibir com parêntese em jazz para legibilidade |
| Dominante 7 | `C7`, `Cdom7` | `7` | `C7` | `C7` | `1 3 5 b7` | D / V7 / dominante secundário | `dominant` | Base para alterações e tensões |
| Dominante 9 | `C9`, `C7(9)` | `9` | `C9` | `C9` | `1 3 5 b7 9` | D / blues / samba-jazz | `dominant-ninth` | `C9` inclui b7 por convenção |
| Dominante 13 | `C13`, `C7(13)`, `C9(13)` | `13` | `C13` | `C13` | `1 3 5 b7 9 13` | D / final turnaround | `dominant-13th` | 11 geralmente omitida no voicing real; engine deve tratar 11 como opcional/evitada quando 3 presente |
| Dominante b9 | `C7(b9)`, `C7b9`, `C7-9`* | `7_b9` | `C7(b9)` | `C7(b9)` | `1 3 5 b7 b9` | V7 menor / dominante harmônico | `dominant` + add b9 | `-9` só aceitar em perfil legado; preferir `b9` |
| Dominante #9 | `C7(#9)`, `C7#9`, `C7+9`* | `7_sharp9` | `C7(#9)` | `C7(#9)` | `1 3 5 b7 #9` | blues/alterado | `dominant` + add #9 | `+9` legado; preferir `#9` |
| Dominante #11 | `C7(#11)`, `C7#11`, `C9#11`, `C7(b5)`* | `7_sharp11` | `C7(#11)` | `C7(#11)` | `1 3 5 b7 #11` | SubV / lídio dominante | `dominant` + add/alter #11 | `b5` pode ser enarmônico de #11, mas qualidade/voicing diferem; não fundir sem contexto |
| Dominante b13 | `C7(b13)`, `C7b13`, `C7(#5)`* | `7_b13` | `C7(b13)` | `C7(b13)` | `1 3 5 b7 b13` | V7 menor / alterado | `dominant` + add/alter b13 | `#5` pode ser qualidade aumentada; `b13` é tensão. Preservar grafia preferencial se usuário digitou |
| Dominante alterado | `C7alt`, `Calt`, `C7(alt)` | `7alt` | `C7alt` | `C7alt` | `1 3 b7` + conjunto alterado | D alterado / V7alt | `dominant` + degrees implícitos ou `kind text="7alt"` | Não expandir automaticamente para `b9 #9 b5 #5`; `alt` é uma classe idiomática |
| Dominante sus4 | `Csus`, `Csus4`, `C7sus`, `C7sus4`, `C9sus`, `C13sus` | `7sus4` / `sus4` / `9sus4` / `13sus4` | `C7sus4` | `C7sus` ou `C7sus4` | `1 4 5 b7` | D suspensa / cadência gospel/MPB | `suspended-fourth` + add b7/tensões | Se tiver `7`, a b7 é essencial. `sus` sem número exibe `sus4` no perfil br |
| Sus2 | `Csus2`, `C2`* | `sus2` | `Csus2` | `Csus2` | `1 2 5` | pop/modal | `suspended-second` | `C2` ambíguo com add9 em iReal/pop |
| Aumentado | `Caug`, `C+`, `C(#5)` | `aug` | `Caug` | `Caug` ou `C+` | `1 3 #5` | dominante aumentado / cor cromática | `augmented` | `C+7` / `C7+` precisam de regra de perfil |
| Dominante aumentado | `C7(#5)`, `C7+`, `C+7`, `C7aug` | `7_sharp5` | `C7(#5)` | `C7#5` | `1 3 #5 b7` | V7+ / alterado parcial | `augmented-seventh` ou `dominant` + alter #5 | Em iReal `7+` = `7#5`; no Brasil `7+` às vezes = 7M. Resolver por perfil |
| Diminuto tríade | `Cdim`, `Co`, `C°` | `dim` | `C°` | `Cdim` | `1 b3 b5` | vii° / passagem | `diminished` | `C°` sem 7 não deve virar `dim7` automaticamente |
| Diminuto sétima | `Cdim7`, `Co7`, `C°7`, `Cº7` | `dim7` | `C°7` | `Cdim7` ou `C°7` | `1 b3 b5 bb7` | dominante sem fundamental / passagem cromática | `diminished-seventh` | `bb7` deve ser tratado como 6 enarmônica no pitch-class, mas mantido teoricamente |
| Meio-diminuto | `Cm7(b5)`, `Cm7b5`, `C-7b5`, `Cø`, `Cø7`, `CØ`, `Cmi7b5` | `m7b5` | `Cm7(b5)` | `Cø` ou `Cm7b5` | `1 b3 b5 b7` | PD menor / iiø / viiø | `half-diminished` | Forma pedagógica brasileira preferida: `m7(b5)`; forma compacta jazz: `ø` |
| Power chord | `C5`, `C(no3)`* | `5` | `C5` | `C5` | `1 5` | rock/pedal | `power` | Não inferir maior/menor |
| Omit/no3 | `C(no3)`, `C omit3`, `Cno3` | `no3` modifier | `C(no3)` | `C(no3)` | remove 3 | voicing aberto / ambíguo | `major`/`dominant` + subtract 3 | Deve funcionar como modificador sobre família base |
| No chord | `N.C.`, `NC`, `N.C`, `no chord` | `N.C.` | `N.C.` | `N.C.` | — | silêncio harmônico | `none` | Não enviar para detector harmônico como acorde |

---

## 3. Casos ambíguos que precisam de política explícita

| Grafia | Possíveis leituras | Política sugerida |
|---|---|---|
| `C7+` | `C7M` no Brasil; `C7#5` no iReal/jazz ASCII | Resolver por perfil. Em `br`, aceitar como alias legado de `7M` com warning. Em `ireal`, mapear para `7#5`. Preferir não exibir `7+` nunca. |
| `C+7` | `Caug7` ou `C7#5` | Mapear para `7_sharp5`; exibir `C7(#5)` no `br`. |
| `CΔ` | `Cmaj7` | Aceitar como `maj7`, não como tríade maior. |
| `C^` | `Cmaj7` no iReal | Aceitar em perfil iReal/jazz. Exibir conforme perfil. |
| `Co` | diminuto tríade ou símbolo mal digitado para `ø` | `o` = `dim`; `ø` = `m7b5`. Não adivinhar meio-diminuto. |
| `C0` | MuseScore usa zero para meio-diminuto | Aceitar em importação MuseScore como `m7b5`, mas não exibir assim. |
| `C2` | `sus2` ou `add9` | Em iReal, `sus2`; em pop, pode ser add9. Melhor exigir perfil ou deixar `ambiguous`. |
| `C7sus` | `7sus4` | Forma interna `7sus4`; exibição `C7sus4` em `br`, `C7sus` em jazz opcional. |
| `Calt` | `C7alt` | Normalizar para `7alt`; exibir sempre com 7. |
| `C7(b5)` | `7b5` ou `7#11` | Manter interno `7_b5` se explicitamente b5; o motor pode sugerir equivalência `#11` por contexto, mas não colapsar. |
| `C7(#5)` | acorde aumentado dominante ou tensão b13 | Interno `7_sharp5`; preservar display digitado quando possível. |

---

## 4. Forma interna sugerida

```ts
export type ChordQuality =
  | 'maj'
  | 'm'
  | 'aug'
  | 'dim'
  | '5'
  | 'sus2'
  | 'sus4'
  | '7'
  | 'maj7'
  | 'm7'
  | 'mMaj7'
  | '6'
  | 'm6'
  | '6_9'
  | 'm6_9'
  | '9'
  | '11'
  | '13'
  | '7sus4'
  | '9sus4'
  | '13sus4'
  | 'dim7'
  | 'm7b5'
  | '7alt'
  | '7_sharp5'
  | '7_b5'
  | '7_b9'
  | '7_sharp9'
  | '7_sharp11'
  | '7_b13'
  | 'maj7_sharp11'
  | 'add9'
  | 'N.C.';

export type ChordTension =
  | 'b9'
  | '9'
  | '#9'
  | '11'
  | '#11'
  | 'b13'
  | '13';

export interface ResolvedChordSymbol {
  raw: string;
  root?: PitchClass;
  bass?: PitchClass;
  quality: ChordQuality;
  tensions: ChordTension[];
  omissions: Array<'no3' | 'no5' | 'noRoot'>;
  normalized: string;       // ASCII canonical, e.g. Cmaj7(#11)/E
  display: string;          // profile-specific, e.g. C7M(#11)/E
  aliasesMatched: string[];
  confidence: 'exact' | 'profile' | 'ambiguous' | 'legacy';
  warnings: string[];
}
```

---

## 5. Parser — ordem recomendada

```text
1. trim + Unicode normalization
2. detect N.C.
3. parse root: A-G + accidental
4. parse optional quality token
5. parse extension: 6, 7, 9, 11, 13
6. parse parenthesized modifiers/tensions
7. parse inline modifiers/tensions
8. parse sus/add/no/omit/alt
9. parse slash bass
10. normalize aliases by profile
11. compute essential intervals
12. render display by profile
13. emit warnings for ambiguous legacy forms
```

---

## 6. MusicXML mapping guideline

MusicXML deve ser tratado como formato semântico, não como fonte única de grafia. Para acordes simples, usar `kind`. Para tensões, usar `degree` com `degree-value`, `degree-alter` e `degree-type`. O atributo `text` de `kind` pode preservar aparência de cifra quando necessário.

| Interno | MusicXML `kind` | Degrees sugeridos | `kind text` opcional |
|---|---|---|---|
| `maj` | `major` | — | `""` ou `"maj"` conforme import/export |
| `maj7` | `major-seventh` | — | `"7M"`, `"maj7"`, `"Δ7"` |
| `m7` | `minor-seventh` | — | `"m7"` |
| `7` | `dominant` | — | `"7"` |
| `9` | `dominant-ninth` | — | `"9"` |
| `13` | `dominant-13th` | — | `"13"` |
| `m7b5` | `half-diminished` | — | `"m7(b5)"` ou `"ø"` |
| `dim7` | `diminished-seventh` | — | `"°7"` |
| `sus4` | `suspended-fourth` | — | `"sus4"` |
| `7sus4` | `suspended-fourth` | add b7 | `"7sus4"` |
| `13sus4` | `suspended-fourth` ou `dominant-13th` | subtract 3 + add 4, b7, 9, 13 | `"13sus"` |
| `7alt` | `dominant` | opcional: b9/#9/#5/b13 conforme política | `"7alt"` |
| `maj7_sharp11` | `major-seventh` | add/alter #11 | `"7M(#11)"` |
| `7_b9` | `dominant` | add b9 | `"7(b9)"` |
| `7_sharp9` | `dominant` | add #9 | `"7(#9)"` |
| `7_b13` | `dominant` | add/alter b13 | `"7(b13)"` |
| `N.C.` | `none` | — | `"N.C."` |

Implementado inicialmente em `src/utils/music/theory/MusicXmlChordSymbolMapper.ts`. A primeira versão cobre o corpus real em `docs/musics`, preserva `kind text` para classes idiomáticas como `7alt`, não expande alterados de forma especulativa e já renderiza blocos `<harmony>` mínimos com round-trip testado.

---

## 7. Test matrix inicial

```ts
const cases = [
  ['Cmaj7', 'Cmaj7', 'C7M'],
  ['CM7', 'Cmaj7', 'C7M'],
  ['CΔ7', 'Cmaj7', 'C7M'],
  ['CΔ', 'Cmaj7', 'C7M'],
  ['C^', 'Cmaj7', 'C7M'],
  ['C7M', 'Cmaj7', 'C7M'],

  ['Cm7', 'Cm7', 'Cm7'],
  ['C-7', 'Cm7', 'Cm7'],
  ['Cmi7', 'Cm7', 'Cm7'],
  ['Cm9', 'Cm9', 'Cm9'],
  ['C-11', 'Cm11', 'Cm11'],

  ['Cm7(b5)', 'Cm7b5', 'Cm7(b5)'],
  ['Cm7b5', 'Cm7b5', 'Cm7(b5)'],
  ['Cø', 'Cm7b5', 'Cm7(b5)'],
  ['Cø7', 'Cm7b5', 'Cm7(b5)'],
  ['C0', 'Cm7b5', 'Cm7(b5)'],

  ['Cdim7', 'Cdim7', 'C°7'],
  ['Co7', 'Cdim7', 'C°7'],
  ['C°7', 'Cdim7', 'C°7'],
  ['Cdim', 'Cdim', 'C°'],
  ['Co', 'Cdim', 'C°'],

  ['C7alt', 'C7alt', 'C7alt'],
  ['Calt', 'C7alt', 'C7alt'],
  ['C7(b9)', 'C7(b9)', 'C7(b9)'],
  ['C7b9', 'C7(b9)', 'C7(b9)'],
  ['C7(#9,b13)', 'C7(#9,b13)', 'C7(#9,b13)'],
  ['C7(b13,#9)', 'C7(#9,b13)', 'C7(#9,b13)'],

  ['Csus', 'Csus4', 'Csus4'],
  ['C7sus', 'C7sus4', 'C7sus4'],
  ['C7sus4', 'C7sus4', 'C7sus4'],
  ['C9sus', 'C9sus4', 'C9sus4'],

  ['C/E', 'C/E', 'C/E'],
  ['Dm7/G', 'Dm7/G', 'Dm7/G'],
  ['N.C.', 'N.C.', 'N.C.'],
];
```

---

## 8. Referências operacionais consultadas

- W3C MusicXML 4.0, `kind-value`: `kind` indica o tipo base do acorde; `degree` adiciona/subtrai/altera a partir desse ponto.
- W3C MusicXML 4.0, `<kind>` e `<degree-type>`: `text` pode preservar uma aparência como `13sus`, enquanto os `degree` evitam redundância visual.
- MuseScore Studio Handbook, Chord Symbols: aceita grafias como `M/Maj/maj`, `m/mi/min/-`, `dim/o`, `0` para meio-diminuto, `aug/+`, modificadores `b9`, `#5`, `sus`, `alt`, `add`, `no3`, slash chords e polychords.
- iReal Pro Help, Chord symbols: usa `-` para menor, `^`/`∆` para maj7, `ø` para meio-diminuto, `+` para aumentado/#5, `alt` como `7alt`, `sus4` como `sus`.
- Avid/Sibelius Knowledge Base: sufixos de cifras são customizáveis via Text > Chord Symbols > Edit Chord Symbols; isso reforça que importação de Sibelius deve tolerar dialetos locais.
- Finale User Manual: Finale permite estilos de acorde e “ensinar” sufixos desconhecidos; reconhece qualidades como `M`, `m`, `Maj7`, `m7`, `dim`, `m7b5`, `aug`, `sus4`.
- Referências brasileiras para dialeto pedagógico: Chediak, Ian Guest, Nelson Faria, Carlos Almada. Para o contrato, usar como norte: `7M` para sétima maior, `m7(b5)` para meio-diminuto, parênteses em alterações e vocabulário funcional brasileiro.
