# F65 - Split de catalogos MusicXML importados

Este relatorio registra o primeiro desmembramento automatizado dos arquivos grandes em `docs/imports`.
Os arquivos gerados ficam em `docs/imports/split` como area de staging; eles ainda nao entram no catalogo real em `docs/musics`.

## Criterio

- O inicio de cada musica e identificado por um bloco `<credit>` com `<credit-type>title</credit-type>`.
- A pagina 1 de cada livro e tratada como capa e ignorada.
- Paginas sem titulo proprio sao mantidas como continuacao da musica anterior.
- O split preserva o conteudo musical dos compassos dentro de um novo `score-partwise` minimo.
- Os compassos sao renumerados a partir de 1 em cada arquivo gerado.

## Resultado

### Ultime Jazz Book (A)

- Fonte: `docs/imports/ultime-jazz-real-book-a.musicxml`
- Musicas detectadas: 50
- Arquivos gerados: 50
- Entradas sem compassos: 0

| Paginas | Titulo | Compositor | Compassos | Arquivo |
| --- | --- | --- | ---: | --- |
| 2 | A child is born | Thad Jones | 25 | `docs/imports/split/a-002-A child is born.musicxml` |
| 3 | A fine romance | Kern/Fields | 23 | `docs/imports/split/a-003-A fine romance.musicxml` |
| 4 | Actual proof | Herbie Hancock | 36 | `docs/imports/split/a-004-Actual proof.musicxml` |
| 5 | Affirmation | Jose Feliciano (As played by Geoges Benson) | 41 | `docs/imports/split/a-005-Affirmation.musicxml` |
| 6 | African flower | Duke Ellington | 40 | `docs/imports/split/a-006-African flower.musicxml` |
| 7 | Afro blue | Mongo Santamaria | 27 | `docs/imports/split/a-007-Afro blue.musicxml` |
| 8 | Afro-centric | Joe Henderson | 26 | `docs/imports/split/a-008-Afro-centric.musicxml` |
| 9 | Afro-centric | Joe Henderson | 34 | `docs/imports/split/a-009-Afro-centric.musicxml` |
| 10 | After you | Mike Stern | 20 | `docs/imports/split/a-010-After you.musicxml` |
| 11 | After you've gone | Turner Layton | 26 | `docs/imports/split/a-011-After you've gone.musicxml` |
| 12 | Afternoon in Paris | John Lewis | 38 | `docs/imports/split/a-012-Afternoon in Paris.musicxml` |
| 13 | Ain't it the truth | Gerry Mulligan | 26 | `docs/imports/split/a-013-Ain't it the truth.musicxml` |
| 14 | Ain't misbehavin | Fats Waller | 34 | `docs/imports/split/a-014-Ain't misbehavin.musicxml` |
| 15 | Airegin | Sonny Rollins | 34 | `docs/imports/split/a-015-Airegin.musicxml` |
| 16 | Air mail special | Benny Goodman Charlie Christian | 71 | `docs/imports/split/a-016-Air mail special.musicxml` |
| 17-18 | Aja | Donald Fagen | 34 | `docs/imports/split/a-017-Aja.musicxml` |
| 19 | Alfie | Burt Bacharach | 25 | `docs/imports/split/a-019-Alfie.musicxml` |
| 20 | Alfie's theme | Sonny Rollins | 50 | `docs/imports/split/a-020-Alfie's theme.musicxml` |
| 21 | Alice in wonderland | Fain / Hilliard | 23 | `docs/imports/split/a-021-Alice in wonderland.musicxml` |
| 22 | All alone | Mal Waldron | 12 | `docs/imports/split/a-022-All alone.musicxml` |
| 23 | All blues | Miles Davis | 35 | `docs/imports/split/a-023-All blues.musicxml` |
| 24 | All in love is fair | Stevie Wonder | 30 | `docs/imports/split/a-024-All in love is fair.musicxml` |
| 25 | All my tomorrows | Cahn/Van Heusen | 32 | `docs/imports/split/a-025-All my tomorrows.musicxml` |
| 26 | All of me | Simons/Marks | 33 | `docs/imports/split/a-026-All of me.musicxml` |
| 27 | All of you | Cole Porter | 48 | `docs/imports/split/a-027-All of you.musicxml` |
| 28-29 | All or nothing at all | Jack Lawrence/Arthur Altman | 36 | `docs/imports/split/a-028-All or nothing at all.musicxml` |
| 30 | All the things you are | Hammerstein / Kern | 30 | `docs/imports/split/a-030-All the things you are.musicxml` |
| 31 | Almost like being in love | Lerner/Loewe | 33 | `docs/imports/split/a-031-Almost like being in love.musicxml` |
| 32 | Alone together | Schwartz | 34 | `docs/imports/split/a-032-Alone together.musicxml` |
| 33 | Along came Betty | Benny Golson | 31 | `docs/imports/split/a-033-Along came Betty.musicxml` |
| 34 | Always and forever | Pat Metheny | 54 | `docs/imports/split/a-034-Always and forever.musicxml` |
| 35-36 | Ana Maria | Wayne Shorter | 27 | `docs/imports/split/a-035-Ana Maria.musicxml` |
| 37 | Angel eyes | MAtt Dennis | 41 | `docs/imports/split/a-037-Angel eyes.musicxml` |
| 38 | Another star | Stevie Wonder | 33 | `docs/imports/split/a-038-Another star.musicxml` |
| 39 | Another Time | Alan Broadbent | 26 | `docs/imports/split/a-039-Another Time.musicxml` |
| 40 | Anthropology | Charlie Parker | 25 | `docs/imports/split/a-040-Anthropology.musicxml` |
| 41 | Antigua | Roland Prince | 48 | `docs/imports/split/a-041-Antigua.musicxml` |
| 42-44 | April | Lennie tristano | 32 | `docs/imports/split/a-042-April.musicxml` |
| 45 | April in Paris | Vernon Duke | 29 | `docs/imports/split/a-045-April in Paris.musicxml` |
| 46 | April joy | Pat Metheny | 36 | `docs/imports/split/a-046-April joy.musicxml` |
| 47 | Armando's rhumba | Chick Corea | 27 | `docs/imports/split/a-047-Armando's rhumba.musicxml` |
| 48 | As time goes by | Herman Hupfeld | 29 | `docs/imports/split/a-048-As time goes by.musicxml` |
| 49 | Asa | Djavan | 29 | `docs/imports/split/a-049-Asa.musicxml` |
| 50-51 | Asa | Djavan | 26 | `docs/imports/split/a-050-Asa.musicxml` |
| 52 | Ask me now | Thelonius Monk | 33 | `docs/imports/split/a-052-Ask me now.musicxml` |
| 53 | At last | Harry Warren | 12 | `docs/imports/split/a-053-At last.musicxml` |
| 54 | Au privave | Charlie Parker | 32 | `docs/imports/split/a-054-Au privave.musicxml` |
| 55 | Autumn in New York | Vernon Duke | 28 | `docs/imports/split/a-055-Autumn in New York.musicxml` |
| 56 | Autumn leaves | Joseph Kosma | 33 | `docs/imports/split/a-056-Autumn leaves.musicxml` |
| 57 | Avalon | Jolson - Rose | 46 | `docs/imports/split/a-057-Avalon.musicxml` |

### Ultimate Jazz Book (B)

- Fonte: `docs/imports/ultime-jazz-real-book-b.musicxml`
- Musicas detectadas: 47
- Arquivos gerados: 47
- Entradas sem compassos: 0

| Paginas | Titulo | Compositor | Compassos | Arquivo |
| --- | --- | --- | ---: | --- |
| 2 | Baby It's Cold Outside | Frank Loesser | 25 | `docs/imports/split/b-002-Baby It's Cold Outside.musicxml` |
| 3 | Bag's groove | Milt Jackson | 32 | `docs/imports/split/b-003-Bag's groove.musicxml` |
| 4 | Ballin' the jack | Chris Smith | 13 | `docs/imports/split/b-004-Ballin' the jack.musicxml` |
| 5 | Ba-lue Bolivar ba-lues are | Thelonius Monk | 16 | `docs/imports/split/b-005-Ba-lue Bolivar ba-lues are.musicxml` |
| 6 | Barbados | Charlie Parker | 27 | `docs/imports/split/b-006-Barbados.musicxml` |
| 7 | Basin street blues | Spencer Williams | 37 | `docs/imports/split/b-007-Basin street blues.musicxml` |
| 8 | Be bop | Dizzie Gillespie | 21 | `docs/imports/split/b-008-Be bop.musicxml` |
| 9 | Beautiful love | Victor Young | 17 | `docs/imports/split/b-009-Beautiful love.musicxml` |
| 10 | Bemsha swing | Thelonius Monk | 25 | `docs/imports/split/b-010-Bemsha swing.musicxml` |
| 11 | Bernie's tune | Bernie Miller | 19 | `docs/imports/split/b-011-Bernie's tune.musicxml` |
| 12 | Bessie's blues | John Coltrane | 27 | `docs/imports/split/b-012-Bessie's blues.musicxml` |
| 13 | Bewitched | Rogers and Hart | 25 | `docs/imports/split/b-013-Bewitched.musicxml` |
| 14 | Billie's bounce | Charlie Parker | 13 | `docs/imports/split/b-014-Billie's bounce.musicxml` |
| 15 | Bird feather | Charlie Parker | 49 | `docs/imports/split/b-015-Bird feather.musicxml` |
| 16-18 | Birdland | Joe Zawinul | 48 | `docs/imports/split/b-016-Birdland.musicxml` |
| 19 | Birk's works | Dizzie Gillespie | 27 | `docs/imports/split/b-019-Birk's works.musicxml` |
| 20 | Birth of the blues | Ray Henderson | 24 | `docs/imports/split/b-020-Birth of the blues.musicxml` |
| 21 | Black and tan fantasy | Duke Ellington | 36 | `docs/imports/split/b-021-Black and tan fantasy.musicxml` |
| 22 | Black coffe | Sonny Burke | 24 | `docs/imports/split/b-022-Black coffe.musicxml` |
| 23 | Black narcissus | Joe Henderson | 35 | `docs/imports/split/b-023-Black narcissus.musicxml` |
| 24-25 | Black nile | Wayne shorter | 39 | `docs/imports/split/b-024-Black nile.musicxml` |
| 26 | Black Orpheus | Luis Bonfa | 32 | `docs/imports/split/b-026-Black Orpheus.musicxml` |
| 27 | Blame it on my youth | Oscar Levant | 50 | `docs/imports/split/b-027-Blame it on my youth.musicxml` |
| 28 | Blessed relief | Franck Zappa | 12 | `docs/imports/split/b-028-Blessed relief.musicxml` |
| 29 | Bloomdido | Charlie Parker | 17 | `docs/imports/split/b-029-Bloomdido.musicxml` |
| 30 | Blue bossa | Kenny Dorham | 20 | `docs/imports/split/b-030-Blue bossa.musicxml` |
| 31 | Blue Daniel | Franck Rosolino | 13 | `docs/imports/split/b-031-Blue Daniel.musicxml` |
| 32 | Blue in green | Miles Davis | 12 | `docs/imports/split/b-032-Blue in green.musicxml` |
| 33 | Blue Monk | Thelonius Monk | 33 | `docs/imports/split/b-033-Blue Monk.musicxml` |
| 34 | Blue moon | Richard Rogers | 26 | `docs/imports/split/b-034-Blue moon.musicxml` |
| 35 | Blue room | Richard Rogers | 15 | `docs/imports/split/b-035-Blue room.musicxml` |
| 36 | Blue trane | John Coltrane | 35 | `docs/imports/split/b-036-Blue trane.musicxml` |
| 37 | Blueberry hill | Vincent Rose | 12 | `docs/imports/split/b-037-Blueberry hill.musicxml` |
| 38 | Blues for Alice | Charlie Parker | 24 | `docs/imports/split/b-038-Blues for Alice.musicxml` |
| 39 | Bluesette | Toots Thielmans | 25 | `docs/imports/split/b-039-Bluesette.musicxml` |
| 40 | Body and soul | Johnny Green | 25 | `docs/imports/split/b-040-Body and soul.musicxml` |
| 41 | Bohemia after dark | Cannon Ball Adderlay | 21 | `docs/imports/split/b-041-Bohemia after dark.musicxml` |
| 42 | Bolivia | Cedar Walton | 25 | `docs/imports/split/b-042-Bolivia.musicxml` |
| 43 | Boplicity | Cleo Henry | 26 | `docs/imports/split/b-043-Boplicity.musicxml` |
| 44 | Born to the blue | Bob Wells | 36 | `docs/imports/split/b-044-Born to the blue.musicxml` |
| 45 | Bossa Dorado | Dorado Schmitt | 92 | `docs/imports/split/b-045-Bossa Dorado.musicxml` |
| 46-48 | Both sides of the coin | Michael Brecker | 33 | `docs/imports/split/b-046-Both sides of the coin.musicxml` |
| 49 | Boy next door | Ralph Blane | 51 | `docs/imports/split/b-049-Boy next door.musicxml` |
| 50-51 | Bud Powell | Chick Corea | 12 | `docs/imports/split/b-050-Bud Powell.musicxml` |
| 52 | Bud's blues | Bud Powell | 25 | `docs/imports/split/b-052-Bud's blues.musicxml` |
| 53 | But beautyful | Jimmy Van Heusen | 13 | `docs/imports/split/b-053-But beautyful.musicxml` |
| 54 | Buzzy | Charlie Parker | 32 | `docs/imports/split/b-054-Buzzy.musicxml` |

### Ultimate Jazz Book (C)

- Fonte: `docs/imports/ultime-jazz-real-book-c.mxl`
- Musicas detectadas: 34
- Arquivos gerados: 34
- Entradas sem compassos: 0

| Paginas | Titulo | Compositor | Compassos | Arquivo |
| --- | --- | --- | ---: | --- |
| 2 | Cantaloupe island | Herbie Hancock | 36 | `docs/imports/split/c-002-Cantaloupe island.musicxml` |
| 3 | Caravan | Duke ellington | 16 | `docs/imports/split/c-003-Caravan.musicxml` |
| 4 | Careless love | Spencer Williams | 12 | `docs/imports/split/c-004-Careless love.musicxml` |
| 5 | Cariba | Wes Montgomery | 33 | `docs/imports/split/c-005-Cariba.musicxml` |
| 6 | Casa forte | Edu Lobo | 24 | `docs/imports/split/c-006-Casa forte.musicxml` |
| 7 | Catch me | Joe Pass | 18 | `docs/imports/split/c-007-Catch me.musicxml` |
| 8 | Cedar's blues | Cedar walton | 33 | `docs/imports/split/c-008-Cedar's blues.musicxml` |
| 9 | Celia | Bud Powell | 33 | `docs/imports/split/c-009-Celia.musicxml` |
| 10 | Central park west | John Coltrane | 25 | `docs/imports/split/c-010-Central park west.musicxml` |
| 11 | Ceora | Lee Morgan | 29 | `docs/imports/split/c-011-Ceora.musicxml` |
| 12 | A certain smile | Paul Webster | 14 | `docs/imports/split/c-012-A certain smile.musicxml` |
| 13 | Chameleon | Herbie Hancock | 51 | `docs/imports/split/c-013-Chameleon.musicxml` |
| 14 | Cheek to cheek | Irving Berlin | 40 | `docs/imports/split/c-014-Cheek to cheek.musicxml` |
| 15-16 | Chega de saudade | Antonio Carlos Jobim | 84 | `docs/imports/split/c-015-Chega de saudade.musicxml` |
| 17 | Cherokee | Ray Noble | 13 | `docs/imports/split/c-017-Cherokee.musicxml` |
| 18 | Cheryl | Charlie Parker | 27 | `docs/imports/split/c-018-Cheryl.musicxml` |
| 19 | Chicken feathers | Steve Kuhn | 36 | `docs/imports/split/c-019-Chicken feathers.musicxml` |
| 20 | Chick's tune | Chick Corea | 24 | `docs/imports/split/c-020-Chick's tune.musicxml` |
| 21 | Chief Crazy Horse | Wayne Shorter | 32 | `docs/imports/split/c-021-Chief Crazy Horse.musicxml` |
| 22 | Come rain or come shine | Harold Arlen | 24 | `docs/imports/split/c-022-Come rain or come shine.musicxml` |
| 23 | Come sunday | Duke Ellington | 15 | `docs/imports/split/c-023-Come sunday.musicxml` |
| 24 | Comin' home baby | Earl Hagan | 16 | `docs/imports/split/c-024-Comin' home baby.musicxml` |
| 25 | Con Alma | Dizzie Gillespie | 34 | `docs/imports/split/c-025-Con Alma.musicxml` |
| 26 | Confessin' that i love you | Doc Daugherty | 33 | `docs/imports/split/c-026-Confessin' that i love you.musicxml` |
| 27 | Confirmation | Charlie Parker | 26 | `docs/imports/split/c-027-Confirmation.musicxml` |
| 28 | Coquette | Johnny Green & Carmen Lombardo | 42 | `docs/imports/split/c-028-Coquette.musicxml` |
| 29 | Corcovado | Antonio Carlos Jobim | 27 | `docs/imports/split/c-029-Corcovado.musicxml` |
| 30 | Corner pocket | Freddy Green | 25 | `docs/imports/split/c-030-Corner pocket.musicxml` |
| 31 | Cottontail | Duke ellington | 20 | `docs/imports/split/c-031-Cottontail.musicxml` |
| 32 | Count every star | Bruno Coquatrix | 12 | `docs/imports/split/c-032-Count every star.musicxml` |
| 33 | Cousin Mary | John Coltrane | 24 | `docs/imports/split/c-033-Cousin Mary.musicxml` |
| 34 | Crazeology | Bud Powell | 25 | `docs/imports/split/c-034-Crazeology.musicxml` |
| 35 | Cry me a river | Arthur Hamilton | 37 | `docs/imports/split/c-035-Cry me a river.musicxml` |
| 36 | Crystal silence | Chick Corea | 33 | `docs/imports/split/c-036-Crystal silence.musicxml` |

### Ultime Jazz Book (D)

- Fonte: `docs/imports/ultime-jazz-real-book-d.mxl`
- Musicas detectadas: 28
- Arquivos gerados: 28
- Entradas sem compassos: 0

| Paginas | Titulo | Compositor | Compassos | Arquivo |
| --- | --- | --- | ---: | --- |
| 2 | D natural blues | Wes Montgomery | 30 | `docs/imports/split/d-002-D natural blues.musicxml` |
| 3 | Daahood | Clifford Brown | 26 | `docs/imports/split/d-003-Daahood.musicxml` |
| 4 | Dancing in the dark | Arthur Schwartz/Dave Liebman | 24 | `docs/imports/split/d-004-Dancing in the dark.musicxml` |
| 5 | Dancing on the ceiling | Richard Rogers | 26 | `docs/imports/split/d-005-Dancing on the ceiling.musicxml` |
| 6 | Darn that dream | Jimmy Van heusen | 18 | `docs/imports/split/d-006-Darn that dream.musicxml` |
| 7 | Dat dere | Bobby Timmons | 33 | `docs/imports/split/d-007-Dat dere.musicxml` |
| 8 | Day of wine and roses | Henry Mancini | 26 | `docs/imports/split/d-008-Day of wine and roses.musicxml` |
| 9 | Dear John | Freddie Hubbard | 35 | `docs/imports/split/d-009-Dear John.musicxml` |
| 10 | Dear old Stockholm | Trad.Swedish (as played by Mile Davis) | 24 | `docs/imports/split/d-010-Dear old Stockholm.musicxml` |
| 11 | Dearly beloved | Jerome Kern | 26 | `docs/imports/split/d-011-Dearly beloved.musicxml` |
| 12 | Deed i do | Fred Rose | 35 | `docs/imports/split/d-012-Deed i do.musicxml` |
| 13 | Deep purple | Peter DeRose | 23 | `docs/imports/split/d-013-Deep purple.musicxml` |
| 14 | Deluge | Wayne Shorter | 32 | `docs/imports/split/d-014-Deluge.musicxml` |
| 15-16 | Desafinado | Antonio Carlos Jobim | 55 | `docs/imports/split/d-015-Desafinado.musicxml` |
| 17 | Detour ahead | Lou Carter/Herb Ellis/John Frigo | 26 | `docs/imports/split/d-017-Detour ahead.musicxml` |
| 18 | Dexterity | Dexter Gordon | 32 | `docs/imports/split/d-018-Dexterity.musicxml` |
| 19 | Dinah | Harry Akat | 33 | `docs/imports/split/d-019-Dinah.musicxml` |
| 20 | Dindi | Antonio Carlos Jobim | 26 | `docs/imports/split/d-020-Dindi.musicxml` |
| 21 | Do nothing'til you hear from me | Duke Ellington | 27 | `docs/imports/split/d-021-Do nothing'til you hear from me.musicxml` |
| 22 | Do you know what it means to miss New Orleans ? | Louis Alter | 34 | `docs/imports/split/d-022-Do you know what it means to miss New Orleans -.musicxml` |
| 23-24 | Dolphin dance | Herbie Hancock | 39 | `docs/imports/split/d-023-Dolphin dance.musicxml` |
| 25 | Donna Lee | Charlie Parker | 26 | `docs/imports/split/d-025-Donna Lee.musicxml` |
| 26 | Don't blame me | Mc Hugh | 24 | `docs/imports/split/d-026-Don't blame me.musicxml` |
| 27 | Don't get around much anymore | Duke Ellington | 27 | `docs/imports/split/d-027-Don't get around much anymore.musicxml` |
| 28 | Don't go to strangers | Arthur Kent | 33 | `docs/imports/split/d-028-Don't go to strangers.musicxml` |
| 29 | Don't take your love from me | Henry Nemo | 25 | `docs/imports/split/d-029-Don't take your love from me.musicxml` |
| 30 | Doodlin' | Horace Silver | 36 | `docs/imports/split/d-030-Doodlin'.musicxml` |
| 31 | Douce ambiance | Django Reihardt | 17 | `docs/imports/split/d-031-Douce ambiance.musicxml` |

### Ultime Jazz Book (E)

- Fonte: `docs/imports/ultime-jazz-real-book-e.mxl`
- Musicas detectadas: 19
- Arquivos gerados: 19
- Entradas sem compassos: 0

| Paginas | Titulo | Compositor | Compassos | Arquivo |
| --- | --- | --- | ---: | --- |
| 2 | E.S.P. | Wayne Shorter | 27 | `docs/imports/split/e-002-E.S.P..musicxml` |
| 3 | Early autumn | Ralph Burns/Woody Herman | 36 | `docs/imports/split/e-003-Early autumn.musicxml` |
| 4 | East of the sun | Brooks Bowman | 24 | `docs/imports/split/e-004-East of the sun.musicxml` |
| 5 | Easy living | Ralph Rainger | 25 | `docs/imports/split/e-005-Easy living.musicxml` |
| 6 | Easy to love | Cole Porter | 25 | `docs/imports/split/e-006-Easy to love.musicxml` |
| 7 | Eclypso | Tommy Flanagan | 43 | `docs/imports/split/e-007-Eclypso.musicxml` |
| 8 | Eighty one | Ron Carter | 18 | `docs/imports/split/e-008-Eighty one.musicxml` |
| 9 | El gaucho | Wayne Shorter | 40 | `docs/imports/split/e-009-El gaucho.musicxml` |
| 10 | Emily | Johnny Mandel | 34 | `docs/imports/split/e-010-Emily.musicxml` |
| 11 | End of a love affair | Edward C. Redding | 34 | `docs/imports/split/e-011-End of a love affair.musicxml` |
| 12 | Epistrophy | Thelonius Monk | 20 | `docs/imports/split/e-012-Epistrophy.musicxml` |
| 13 | Equinox | John Coltrane | 26 | `docs/imports/split/e-013-Equinox.musicxml` |
| 14 | Eronel | Thelonius Monk | 44 | `docs/imports/split/e-014-Eronel.musicxml` |
| 15 | Estaté | Bruno Martino | 32 | `docs/imports/split/e-015-Estaté.musicxml` |
| 16 | Everybody loves my baby | Spencer Williams | 28 | `docs/imports/split/e-016-Everybody loves my baby.musicxml` |
| 17 | Everythong happens to me | Matt Dennis | 63 | `docs/imports/split/e-017-Everythong happens to me.musicxml` |
| 18 | Everything's coming up roses | Jule Styne | 24 | `docs/imports/split/e-018-Everything's coming up roses.musicxml` |
| 19 | Evidence | Thelonius Monk | 32 | `docs/imports/split/e-019-Evidence.musicxml` |
| 20 | Exactly like you | Jimmy McHugh | 13 | `docs/imports/split/e-020-Exactly like you.musicxml` |

### Ultime Jazz Book (F)

- Fonte: `docs/imports/ultime-jazz-real-book-f.mxl`
- Musicas detectadas: 35
- Arquivos gerados: 35
- Entradas sem compassos: 0

| Paginas | Titulo | Compositor | Compassos | Arquivo |
| --- | --- | --- | ---: | --- |
| 2 | F Blues Tootsie | Jamey Aebersold | 57 | `docs/imports/split/f-002-F Blues Tootsie.musicxml` |
| 3 | Fables of Faubus | Charles Mingus | 39 | `docs/imports/split/f-003-Fables of Faubus.musicxml` |
| 4 | Fair weather | Benny Golson | 26 | `docs/imports/split/f-004-Fair weather.musicxml` |
| 5 | Falling grace | Steve swallow | 33 | `docs/imports/split/f-005-Falling grace.musicxml` |
| 6 | Far Wes | Wes Montgomery | 41 | `docs/imports/split/f-006-Far Wes.musicxml` |
| 7 | Favela | Antonio carlos Jobim | 24 | `docs/imports/split/f-007-Favela.musicxml` |
| 8 | Fee-fi-fo-fum | Wayne shorter | 17 | `docs/imports/split/f-008-Fee-fi-fo-fum.musicxml` |
| 9 | Feel like making love | Eugene McDaniels | 56 | `docs/imports/split/f-009-Feel like making love.musicxml` |
| 10 | Feels so good | Chuck Mangione | 66 | `docs/imports/split/f-010-Feels so good.musicxml` |
| 11 | Felicidade | Antonio carlos Jobim | 21 | `docs/imports/split/f-011-Felicidade.musicxml` |
| 12 | Festive minor | gerry Mulligan | 23 | `docs/imports/split/f-012-Festive minor.musicxml` |
| 13 | Fever | John Davenport/Eddie Cooley | 54 | `docs/imports/split/f-013-Fever.musicxml` |
| 14 | Filthy McNasty | Horace Sylver | 46 | `docs/imports/split/f-014-Filthy McNasty.musicxml` |
| 15 | Firm roots | Cedar walton | 27 | `docs/imports/split/f-015-Firm roots.musicxml` |
| 16 | Five brothers | Gerry Mulligan | 19 | `docs/imports/split/f-016-Five brothers.musicxml` |
| 17 | 500 miles high | Chick Corea | 12 | `docs/imports/split/f-017-500 miles high.musicxml` |
| 18 | Five spot after dark | Benny golson | 27 | `docs/imports/split/f-018-Five spot after dark.musicxml` |
| 19 | Flamingo | Ted Grouya | 28 | `docs/imports/split/f-019-Flamingo.musicxml` |
| 20 | Fly me to the moon | Bart Howard | 29 | `docs/imports/split/f-020-Fly me to the moon.musicxml` |
| 21 | Flying home | Benny Goodman/Lionel Hampton | 32 | `docs/imports/split/f-021-Flying home.musicxml` |
| 22 | Fools rush in | Rube Bloom | 17 | `docs/imports/split/f-022-Fools rush in.musicxml` |
| 23 | Footprints | Wayne Shorter | 25 | `docs/imports/split/f-023-Footprints.musicxml` |
| 24 | For all we know | Fred Coots | 35 | `docs/imports/split/f-024-For all we know.musicxml` |
| 25 | For regulars only | Dexter Gordon | 35 | `docs/imports/split/f-025-For regulars only.musicxml` |
| 26 | For sentimentals reasons | William Best | 33 | `docs/imports/split/f-026-For sentimentals reasons.musicxml` |
| 27 | Forest flower | Charles Loyd | 41 | `docs/imports/split/f-027-Forest flower.musicxml` |
| 28 | Four | Miles Davis | 26 | `docs/imports/split/f-028-Four.musicxml` |
| 29 | Four brothers | Jimmy Giuffre | 46 | `docs/imports/split/f-029-Four brothers.musicxml` |
| 30 | Four on six | Wes Montgomery | 16 | `docs/imports/split/f-030-Four on six.musicxml` |
| 31 | Freddie the freeloader | Miles Davis | 17 | `docs/imports/split/f-031-Freddie the freeloader.musicxml` |
| 32 | Freedom jazz dance | Eddie Harris | 13 | `docs/imports/split/f-032-Freedom jazz dance.musicxml` |
| 33 | Freight trane | Tommy Flanagan | 29 | `docs/imports/split/f-033-Freight trane.musicxml` |
| 34 | Friday night at the Cadillac club | Bob Berg | 26 | `docs/imports/split/f-034-Friday night at the Cadillac club.musicxml` |
| 35 | Fried bananas | Dexter Gordon | 27 | `docs/imports/split/f-035-Fried bananas.musicxml` |
| 36-37 | Friends and strangers | William Jeffrey | 43 | `docs/imports/split/f-036-Friends and strangers.musicxml` |

## Proxima leitura

Foram gerados 213 arquivos candidatos. O proximo passo e rodar uma auditoria leve sobre esse staging para separar:

- arquivos MusicXML estruturalmente legiveis pelo nosso parser;
- cifras importadas que entram no nosso dicionario sem perda semantica;
- melodias que servem como bons casos de teste para harmonizacao basica e rearmonizacao;
- duplicatas, continuacoes ou arranjos que nao devem ir para `docs/musics`.

