# Browser QA results

Run: 2026-10-07, local static server, headless Chrome with the desktop's bundled Playwright runtime. The app itself has no Playwright or Node dependency.

## Passed

- Empty state, opening the form, saving required fields, and browser refresh persistence.
- Pattern extraction from a multi-line description, including a natural-language deadline that stays on the intended local calendar date.
- Follow-up due today counts as due; a future follow-up does not count early.
- Status change updates summary counts; drag-and-drop moves a role between board stages.
- Duplicate warning appears and explicit confirmation can save a duplicate.
- Board/list switching, company sorting, company/location search, and follow-up sorting control.
- JSON export downloads parseable records with the expected deadline.
- `javascript:` URLs are rejected; markup in a title renders as text; malformed stored JSON falls back to the empty state.
- Confirmed removal restores the empty state; Escape closes the add dialog.
- Mobile viewport (390 × 844) has no horizontal page overflow.
- No browser page/console errors in the checked flows and no external network requests.

## Still requires manual verification

- Screen-reader and keyboard-only review beyond the dialog Escape/focus smoke check.
- Real phone browser checks, especially on iOS Safari and Android Chrome.
- GitHub Pages hosting behavior is not covered by these local browser checks; deployment is verified separately through Actions and Settings → Pages.
