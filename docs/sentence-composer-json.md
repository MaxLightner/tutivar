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
