# Internship OS

A small, local-first workspace for keeping internship opportunities and applications together. This project starts as a no-build static web app so a student can try the workflow without creating an account or paying for hosting.

## The problem we are testing

Students often keep roles in browser bookmarks, inboxes, spreadsheets, and documents. That can make it hard to remember where they applied, which resume version they sent, and when they meant to follow up. This is a hypothesis from public user reports, not a claim that demand or willingness to pay has been validated.

## What works today

- Save opportunities with a link, role, company, description, location, deadline, application status, follow-up date, and resume note.
- View the pipeline as a board or list; search and sort saved records.
- Move a role between stages by dragging its card or changing its status in the detail/list view.
- Detect likely duplicates by URL or normalized company and role; the user can still choose to save one.
- Export all records as JSON.
- Keep records in this browser's `localStorage`; no account or server is involved.
- Try a lightweight local pattern matcher on pasted text or URL. It is not an AI model and its suggestions require review.

## Run it

No dependencies or build step are required. Open `index.html` in a current desktop browser, or serve this directory locally:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>. A static local server is recommended because browser storage behavior for `file://` URLs varies. The app uses system fonts and makes no third-party requests.

## Data and privacy

Records are stored under the `internship-os-v1` key in the current browser profile. They are not synced, encrypted, backed up, or shared across devices. Use **Export your data** before clearing browser storage. Avoid saving sensitive personal data in notes. There is no authentication, backend, analytics, or external AI provider in this version. Hosting the static files publicly does not upload visitors' browser data, but makes the app itself publicly accessible.

## Limitations

- The URL field is saved, but the app does not fetch a job page. Many job sites block cross-origin reads or require login.
- The “Read details” helper uses simple patterns on pasted text and URL slugs. It may miss or mislabel fields; review all fields before saving.
- No email inbox integration, application status tracking, or automatic follow-up sending exists.
- Data is local to one browser/device and can be lost if site data is cleared.
- This is an early validation MVP, not a proven commercial product.

## Publish a static demo with GitHub Pages

The repository includes a **manual-only** Pages workflow at `.github/workflows/pages.yml`. It will not deploy on a push. To publish after you choose to make the GitHub repository public, open **Settings → Pages**, choose **GitHub Actions** as the source, and run **Actions → Publish static demo to GitHub Pages → Run workflow**. GitHub Pages sites are publicly available on the internet; review the repo contents first. This app has no backend and each visitor's records remain in their own browser. See [GitHub's Pages publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Project map

- `index.html` — accessible page structure and dialogs
- `styles.css` — responsive visual system and layout
- `app.js` — storage, rendering, parsing, duplicate checks, and interactions
- `ARCHITECTURE.md` — implementation choices and data flow
- `ROADMAP.md` — validation-first next steps
- `CHANGELOG.md` — shipped changes
- `CONTRIBUTING.md` — local contribution workflow
- `tests/manual-checklist.md` — browser acceptance checks
- `tests/qa-results.md` — browser smoke-test results and remaining manual checks

## License

See `LICENSE`.
