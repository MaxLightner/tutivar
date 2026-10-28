# ADR-0004: Leitner scheduler and lesson-derived lexeme bank

Status: implementation prepared; repository publication awaits connected GitHub access.

## Contract

- Client-side review data remains inside the existing learner progress JSON (`progress.leitnerV2`) so phase 3's previous-good and exported backups cover all review cards, history, queue and settings. No backend or multi-device sync is implied.
- Each lexeme is identified by target-language normalized lemma. A limited, conservative English morphological adapter merges verified inflections (including `good/better/best`); source meanings, inflections and lesson references remain discoverable. No semantic relationships are inferred without explicit approved data.
- Approved `sample` A1 lesson files, not historical lesson versions or unreleased roadmap headings, populate `dist/data/word-bank.json` at build time; a missing pinned JSON fails the build. Changes to lesson content regenerate the bank automatically.
- Each card has a house value in `[0,1,2,4,8,16,32,64]`, one due timestamp (not one timer per house), attempt counts and a fast-track flag.
- Initial card face shows **بلدم / بلد نیستم**; after reveal, **حدس درست / اشتباه کردم**. The initial response records self-assessed familiarity; only the confirmed final response grades progression.
- If the *first-ever* attempt from 0 is initially **بلدم** and finally **حدس درست**, then 0→1 and, on the next correct review, 1→4. Thereafter move one ordinal house per correct confirmation. A mistake in any house forfeits the skip; in houses 1..32 it moves one house back. Mistakes at 0 repeat at the back of the same-day queue. The 64 house is terminal and is never due again.
- House numbers above zero are waiting intervals in days; moving from 32 to 64 graduates the card immediately, without scheduling another review.
- Admit due cards before unseen words, respecting the user-set limit of **unique cards admitted per local calendar day**; repeated house-zero attempts do not consume additional quota. Unreviewed due cards remain overdue for future days.
- The view-direction preference reverses only the main prompt and revealed equivalent. Morphology, examples, POS and relations retain their layout. TTS uses the existing browser `speechSynthesis` helper. Offline playback availability depends on installed voices.
- User settings persist: 1–200 distinct cards per day, direction, audio/auto-audio and grammatical-form toggles. Changes do not erase existing cards.

## Deferred

True semantic links, POS disambiguation for homographs, learner-generated entries, syncing over accounts and end-to-end mobile QA remain separate work. No fabricated synonyms/antonyms. Lexical banks should undergo language and editorial QA before general-public release.
