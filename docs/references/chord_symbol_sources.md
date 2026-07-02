# Chord Symbol Sources — notes

This file lists the source families used to draft `docs/theory/chord_symbol_dictionary.md`.

## Primary software/spec references

- W3C MusicXML 4.0 reference — `kind-value`, `<kind>`, `<degree-type>`.
- MuseScore Studio Handbook — Chord symbols syntax.
- iReal Pro Help Center — Chord symbols used in iReal Pro.
- Avid Knowledge Base — Sibelius chord symbol suffix customization.
- Finale User Manual — Chord menu / chord suffix recognition and custom teaching.
- Tonal.js — useful internal dependency reference, but should not dictate Find Chord display dialect.

## Brazilian/pedagogical references to check against manually

- Almir Chediak — Dicionário de acordes cifrados; Harmonia e improvisação.
- Ian Guest — Harmonia: método prático.
- Nelson Faria — A arte da improvisação; Acordes, arpejos e escalas.
- Carlos Almada — Harmonia funcional; Arranjo; Funcionalidade harmônica em música popular.
- Erica Masson — verify exact bibliography/source before using as normative reference.

## Implementation note

Use published software specs for machine interoperability, but keep the Find Chord dictionary as a first-class domain contract. The contract should define:

1. accepted aliases;
2. normalized internal quality;
3. preferred display by profile;
4. essential intervals;
5. function hints;
6. ambiguity warnings.
