# Contributing

## Local setup

There are no dependencies. Open `index.html` in a browser or run `python -m http.server 8000` from the repository root and visit <http://localhost:8000>.

## Before submitting a change

- Keep user data local unless the feature explicitly requires otherwise and its privacy trade-offs are documented.
- Keep parsed suggestions reviewable; do not silently submit applications or send messages.
- Check keyboard use, mobile layout, empty states, malformed storage, and browser console errors.
- Update the README, architecture, roadmap, and changelog when behavior changes.
- Keep publishing manual-only; the Pages workflow must not auto-deploy a public release on push.
- Follow the browser acceptance checklist in `tests/manual-checklist.md`.

## Scope

This is a validation prototype. Prefer a small change that tests a user need over speculative features or a new framework.
