# Browser acceptance checklist

Run from a local static server (`python -m http.server 8000`) and open `http://localhost:8000`.

- [ ] Empty state appears without saved data; top-level counts are zero.
- [ ] Add a role with required title/company; it appears under Saved and survives refresh.
- [ ] Add the same title/company or URL; a duplicate warning appears and the user can cancel or explicitly continue.
- [ ] Paste text containing `Job Title: ...`, `Company: ...`, and `Location: ...`; Read details fills recognizable blank fields and leaves them editable.
- [ ] Paste ordinary prose; helper reports that it found no recognizable details and manual entry still works.
- [ ] Try a malformed URL and a `javascript:` URL; the record is not saved.
- [ ] Move a card to Applied, Interview, Offer, and Closed; counts and list view reflect each status.
- [ ] Search by role, company, and location; clear the query and confirm the cards return.
- [ ] Change sorting and switch between board/list view.
- [ ] Set a follow-up date to today and a future date; summary counts only due/overdue active roles.
- [ ] Export JSON and confirm the downloaded file contains saved records.
- [ ] Remove a record after confirming; refresh and confirm it stays removed.
- [ ] Check narrow/mobile viewport, keyboard focus, dialog close/cancel, and browser console for errors.
