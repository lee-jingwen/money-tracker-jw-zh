# Money Tracker

A simple, mobile-friendly shared expense tracker for two people. React +
Tailwind frontend on GitHub Pages, Google Sheet + Apps Script as the backend
"API" (no server/database to manage yourself).

## 1. Set up the Google Sheet + Apps Script backend

1. Create a new Google Sheet.
2. Rename the first tab to `Entries` (must match exactly).
3. Add a header row: `Date | Description | Amount | PaidBy | Category | Id | Owed`
   (`Id` and `Owed` are filled in automatically by the script — you never
   type into them yourself).
4. Open **Extensions > Apps Script**.
5. Delete any starter code, then paste in the contents of
   [`apps-script/Code.gs`](apps-script/Code.gs) from this repo.
6. Click **Deploy > New deployment**.
   - Select type: **Web app**.
   - Execute as: **Me**.
   - Who has access: **Anyone**.
7. Click **Deploy**, authorize when prompted, and copy the resulting URL
   (ends in `/exec`). This is your API endpoint.

If you already had a deployment from before `Id`/`Owed` existed: add the two
new header columns, paste in the updated `Code.gs`, then use
**Deploy > Manage deployments** → edit your existing deployment → **New
version** → **Deploy**. This keeps the same URL, so `src/config.js` doesn't
need to change.

> Entries added before the `Id` column existed won't have an id and so can't
> be edited/deleted from the app (they'll still display fine). Either delete
> those rows or manually paste a unique value into their `Id` cell.

### Set your passcode

This repo (and the deployed frontend) is public, so anyone with the link
could otherwise poke at it. `Code.gs` gates every request behind a shared
passcode via the `PASSCODE` constant near the top of the file.

**Important:** set your real passcode directly in the Apps Script editor —
never replace the `CHANGE_ME` placeholder in this git repo and commit it,
since that would publish your passcode to everyone. The Apps Script editor
lives on Google's servers, completely separate from what's pushed to
GitHub, so this is the one piece of the backend you edit only there.

1. In the Apps Script editor, find `const PASSCODE = 'CHANGE_ME';`.
2. Change `'CHANGE_ME'` to your own secret (share it with your partner
   directly, not through the repo).
3. **Deploy > Manage deployments** → edit → **New version** → **Deploy**.

The frontend will prompt for this passcode on first visit (per browser) and
remember it afterwards via `localStorage`.

## 2. Point the frontend at your Apps Script URL

Open [`src/config.js`](src/config.js) and paste your URL:

```js
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/XXXXX/exec'
```

You can also relabel `PEOPLE.A` / `PEOPLE.B` here (e.g. to real names) at
any time — the Sheet always stores the raw `A`/`B` key, so relabeling never
touches existing data. Same goes for `CATEGORIES` — add, remove, reorder, or
re-emoji them freely; the Sheet only ever stores each category's `key`.

## 3. Run it locally

```bash
npm install
npm run dev
```

## 4. Deploy to GitHub Pages

This repo includes a GitHub Actions workflow
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that builds
and publishes automatically on every push to `main`.

One-time setup:

1. Push this repo to GitHub (if not already).
2. Go to **Settings > Pages**.
3. Under "Build and deployment", set **Source** to **GitHub Actions**.
4. Push to `main` — the workflow builds the Vite app and publishes it.

Your site will be live at:

```
https://<your-username>.github.io/money-tracker-jw-zh/
```

> Note: `vite.config.js` sets `base: '/money-tracker-jw-zh/'` to match this
> repo's name. If you ever rename the repo, update that value to match.
