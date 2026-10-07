# Architecture

## Current shape

Internship OS is a static browser application made of three files. There is no framework, build process, external API, server, third-party asset request, or model dependency. This keeps the first experiment cheap to run and easy to inspect.

## Data flow

1. The user enters or pastes a job link/description.
2. A small deterministic pattern matcher suggests fields from text and URL slugs. It does not fetch the page or call a model.
3. The user reviews and submits the form. Role title and company are required; URL protocol is restricted to HTTP(S).
4. The app checks for an exact normalized company/title match or matching normalized URL and asks before saving duplicates.
5. The record is saved to `localStorage`, then the board/list and counts are rendered from the in-memory array.
6. The user may export the complete array as a JSON file.

## Record shape

```json
{
  "id": "browser-generated-id",
  "title": "Machine Learning Intern",
  "company": "Example Labs",
  "url": "https://example.com/careers/ml-intern",
  "description": "Copied job description",
  "location": "Remote",
  "deadline": "2026-11-01",
  "status": "saved",
  "followUp": "2026-11-08",
  "resume": "ML resume v2",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

The supported stages are `saved`, `applied`, `interview`, `offer`, and `closed`.

## Decisions and trade-offs

- **Local-first storage:** no account setup and no server cost. The trade-off is no sync or recovery; export is provided.
- **No model in v1:** the initial value is capture and recall. A model is only justified if interviews show that extraction is a frequent, costly friction and users accept review/correction.
- **Manual confirmation:** parsed information never silently becomes a saved record.
- **Vanilla JavaScript:** fewer dependencies and a simple repo for a first-year student to understand. If the workflow is validated, we can split modules and add a backend deliberately.
- **Safe output:** user-provided strings are HTML-escaped before rendering; external links are only opened for HTTP(S) URLs.

## Next architecture decision

Do not add authentication or cloud sync until validation shows multi-device access or collaboration is required. If that need is real, compare a small hosted database with export/import before building a larger account system.
