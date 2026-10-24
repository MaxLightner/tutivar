# Data-driven sentence composer

The `sentence-composer` activity is a generic renderer. It does not contain lesson-specific vocabulary or grammar. Authors define the teaching model in lesson JSON.

## Contract

- `wordSets`: named arrays of words. Each word has a stable `id`, a visible `label`, a `translation`, optional `role` (`core` or `supplementary`), grammatical `features`, and language-specific `forms`.
- `slots`: variable positions in the sentence. Each slot references a word set and declares its default. Its options are generated from the set, so the UI automatically handles any number of words.
- `patterns`: sentence forms. Each pattern has ordered `segments`; a segment is exactly one of `fixed`, `slot` plus optional `form`, or `derived`. Spaces and punctuation belong in fixed segments.
- `derivedDefaults`: default grammar values such as demonstrative, auxiliary verb, or translation copula.
- `dependencies`: declarative conditions that update derived values. A condition can test a selected slot's grammatical feature, a pattern, or nested `all` / `any` conditions.
- `translationSegments`: optional segments rendered as the meaning below the English sentence.
- `optionSearchThreshold`: show search when a word set is larger than this number.

## Adding vocabulary

Add a word object to the appropriate `wordSets` array. The sentence picker reads the array at runtime; no JavaScript edit or per-combination outcome is required. Keep each word's `id` stable because saved learner selections refer to IDs, not display text.

## Example shape

```json
{
  "id": "example-composer",
  "type": "sentence-composer",
  "wordSets": {
    "owners": [
      {
        "id": "me",
        "label": "my",
        "translation": "من",
        "features": { "person": "first" },
        "forms": { "determiner": "my", "pronoun": "mine" }
      }
    ]
  },
  "slots": [
    { "id": "owner", "label": "مالک", "wordSet": "owners", "default": "me" }
  ],
  "derivedDefaults": {},
  "dependencies": [],
  "patterns": [
    {
      "id": "statement",
      "label": "خبری",
      "segments": [
        { "fixed": "This is " },
        { "slot": "owner", "form": "determiner" },
        { "fixed": " book." }
      ]
    }
  ],
  "defaultPattern": "statement"
}
```

Dialogues remain lesson data too: ordinary lines use `speaker`, `en`, and `fa`. A line may also use ordered segments where a future dialogue template needs variable words; it should reference a sentence-composer activity instead of duplicating the vocabulary.

## Reusing composer variables in dialogue

A dialogue line can bind to a sentence-composer activity with `sourceActivityId`. Use `segments` for the target-language line and `translationSegments` for its translation. Both accept the same `fixed`, `slot`, and `derived` segment forms, so the dialogue can reuse the selected object and grammatical dependencies without copying the word list.

```json
{
  "speaker": "Staff",
  "sourceActivityId": "ownership-sentence-composer",
  "segments": [
    { "derived": "questionAux" },
    { "fixed": " " },
    { "derived": "demonstrativeLower" },
    { "fixed": " your " },
    { "slot": "object", "form": "noun" },
    { "fixed": "?" }
  ],
  "translationSegments": [
    { "fixed": "آیا " },
    { "derived": "faDemonstrative" },
    { "fixed": " " },
    { "slot": "object", "form": "translation" },
    { "fixed": " متعلق به تو " },
    { "derived": "faCopula" },
    { "fixed": "؟" }
  ]
}
```

Keep fully authored dialogue lines as `en` and `fa` strings when they should not change with the composer.

## Shared two-part lesson template

Each A1 lesson declares `lessonTemplate: "discovery-production-v1"` and a `phase` on every activity. Foundation phases must appear in this order: `words`, `phrases`, `sentence`, `variants`, `puzzle`, `construction`. Production phases: `correspondence`, `context`, `guided`, `independent`. The shared `lesson-flow.js` validates ordering, required stages, compatible activity types, references and puzzle permutations. Content and vocabulary remain JSON-authored. `composer-view` reuses another `sentence-composer` via `sourceActivityId`, with a forced `patternId` or stage-specific `patternIds`; tapping an editable word cycles directly through its wordSet rather than opening a picker. A `derived` segment may define `cycleSlot` so dependent pronouns such as He/She/You can also be tapped.
