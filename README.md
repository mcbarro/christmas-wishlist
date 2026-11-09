# Christmas Wishlist

A zero-account family Christmas wishlist, built as an installable PWA with a
Pinterest-style masonry layout, real-time sync and native mobile sharing.

- No sign-up, no email and no password.
- Add wishes manually or share a product link from a phone.
- Reserve gifts with your name so nobody buys the same present twice.
- Real-time updates across family devices through Supabase.
- English and Italian UI, detected from the browser language.
- Light theme by default, with a dark-mode toggle and a saved preference.
- Deployable to GitHub Pages with a single push to `main`.

## Tech stack

- React 19 + Vite
- Tailwind CSS 4
- Supabase (PostgreSQL, Row Level Security and Realtime)
- `vite-plugin-pwa` + Workbox
- Microlink API for OpenGraph metadata
- GitHub Actions + GitHub Pages

## Quick start

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell, create the environment file with
`Copy-Item .env.example .env.local`.

If Supabase is not configured, the app runs in **demo mode** and keeps wishes in
`localStorage`. This is useful for trying the UI locally. The app displays a
clear demo banner so nobody mistakes local data for shared family data.

To use a real database, fill in `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The Supabase anon key is public by design. Security is enforced by the database
policies described below.

## Supabase setup

### Option A: automated migrations (recommended)

The repository contains the initial migration in
`supabase/migrations/20261109000000_init_wishlist.sql`. The GitHub Actions
workflow applies it with `supabase db push` before building the site.

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy the project URL and the public anon key from **Project settings → API**.
3. Create a Personal Access Token from **Account settings → Access Tokens**.
4. Find the project reference in **Project settings → General**.
5. Add the repository secrets listed in the deployment section below.
6. Push to `main` (or run the workflow manually). The migration is applied
   automatically.

### Option B: manual SQL

Open the Supabase SQL Editor, paste the contents of
[`supabase_schema.sql`](./supabase_schema.sql) and run it once. The script is
idempotent and can be executed again safely.

### Database schema

The `public.wishlist_items` table contains:

| Column        | Type          | Purpose                                  |
| ------------- | ------------- | ---------------------------------------- |
| `id`          | `uuid`        | Primary key                              |
| `created_at`  | `timestamptz` | Creation date                            |
| `title`       | `text`        | Gift name                                |
| `url`         | `text`        | Product page                             |
| `image_url`   | `text`        | Product image                            |
| `notes`       | `text`        | Size, color or other notes               |
| `price`       | `text`        | Optional price, kept as text             |
| `added_by`    | `text`        | Optional name of the person who added it |
| `reserved_by` | `text`        | Name of the person buying the gift       |

Row Level Security is enabled with open policies for `SELECT`, `INSERT`,
`UPDATE` and `DELETE`. Realtime is enabled for the table and real-time changes
are broadcast to every open client.

> [!WARNING]
> This is intentionally a trusted-family app. Anyone who knows the deployed URL
> can read and modify the wishlist. Do not store sensitive information and do
> not reuse this schema for private data. The site sends a `noindex` directive
> and a restrictive `robots.txt`, but those are not security controls.

## GitHub Pages deployment

1. In the repository, open **Settings → Pages** and set the source to
   **GitHub Actions**.
   - Optional: add a `PAGES_TOKEN` secret (a PAT with Pages/administration
     write permissions) and the workflow will try to enable Pages by itself.
   - `GITHUB_TOKEN` alone cannot enable Pages on a repository where Pages has
     never been configured, so the manual one-time setup is the reliable path.
2. Add the required repository secrets under
   **Settings → Secrets and variables → Actions**.
3. Push to `main`. The workflow tests the project, pushes database migrations,
   builds the PWA and deploys `dist/` to GitHub Pages.

### Repository secrets

| Secret | Required | Purpose |
| ------ | -------- | ------- |
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_PROJECT_ID` | Yes for migrations | Project reference used by `supabase link` |
| `SUPABASE_ACCESS_TOKEN` | Yes for migrations | Personal Access Token for the Supabase CLI |
| `SUPABASE_DB_PASSWORD` | Yes for migrations | Database password used by `supabase db push` |
| `CUSTOM_DOMAIN` | No | Custom domain written to `dist/CNAME` |
| `PAGES_TOKEN` | No | PAT with Pages/admin permissions used to enable Pages automatically |

Both secret naming conventions are supported for the URL and anon key, so you
can use the names from the original specification or the `VITE_`-prefixed
names. If the database secrets are incomplete, the workflow logs a notice and
skips migrations instead of failing the deployment.

### Automatic base path

The workflow detects the deployment type automatically:

- Repository named `<owner>.github.io`: base path `/`.
- Project repository such as `christmas-wishlist`: base path
  `/christmas-wishlist/`.
- `CUSTOM_DOMAIN` secret present: base path `/`.

The Vite `base`, React Router basename, PWA manifest, service worker scope and
the GitHub Pages `404.html` fallback are all generated from the same base path.
No manual path changes are required.

## Custom domain

1. Add a repository secret named `CUSTOM_DOMAIN` containing the domain, for
   example `wishlist.example.com` (no protocol, no trailing slash).
2. Configure DNS at your domain provider:
   - **Apex / second-level domain** (`example.com`): four `A` records to
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and
     `185.199.111.153`.
   - **Subdomain** (`wishlist.example.com`): one `CNAME` record to
     `<your-github-username>.github.io`.
3. Wait for DNS propagation, then enable **Enforce HTTPS** in
   **Settings → Pages**.
4. Push to `main`. The workflow writes the domain to `dist/CNAME` and builds
   with base path `/`.

The PWA manifest keeps `start_url` and `share_target.action` relative to the
deployment base, so the Share Target API keeps working with or without a custom
domain.

## PWA and Web Share Target

### Install the app

- **Android / Chrome**: use the install button in the app or the browser's
  install prompt.
- **iPhone / iPad**: open the site in Safari, tap **Share** and choose
  **Add to Home Screen**.

### Share a product link

1. Install the PWA on the phone.
2. Open a product page in a browser or shopping app.
3. Tap **Share** and choose **Wishlist**.
4. The app opens `/share`, fetches the product title, image and price through
   Microlink, and pre-fills the add-wish dialog.

The `/add-item` route is also supported as an alias for compatibility. The
route is declared in the manifest as `/share` and is adjusted automatically for
GitHub Pages project sites and custom domains.

> [!NOTE]
> iOS Safari does not expose the Web Share Target API to installed web apps.
> iOS users can still install the PWA and paste a product URL into the add
> dialog; the **Fetch details** button uses the same metadata extraction.

## Localization

The UI is fully translated into English and Italian.

- The initial language is chosen from `navigator.languages`.
- The language can be switched with the `EN` / `IT` control in the header.
- The choice is stored in `localStorage`.
- `?lang=it` or `?lang=en` can be used to force a language for testing or for a
  specific shared link.

All user-facing strings live in `src/i18n/en.js` and `src/i18n/it.js`. Adding a
new language requires adding a dictionary with the same keys and registering it
in `src/i18n/I18nProvider.jsx`.

## Theme

The app starts in **light mode**. The sun/moon button in the header switches to
dark mode, and the choice is saved in `localStorage` under
`christmas-wishlist:theme`. The palette is implemented with semantic CSS
variables, so both themes stay consistent across cards, dialogs, forms and
status messages.

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production PWA into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Vitest unit tests |
| `npm run icons` | Regenerate the PWA icons in `public/` |

## Project structure

```text
.
├── .github/workflows/deploy.yml
├── public/
│   ├── 404.html               # GitHub Pages SPA redirect
│   ├── favicon.ico
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon.png
│   ├── icon.svg
│   └── ...
├── scripts/generate-icons.mjs
├── src/
│   ├── components/
│   │   ├── AddWishModal.jsx
│   │   ├── Banners.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── LanguageSwitcher.jsx
│   │   ├── Modal.jsx
│   │   ├── Navbar.jsx
│   │   ├── ReserveModal.jsx
│   │   ├── ShareReceiver.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── Toast.jsx
│   │   ├── WishCard.jsx
│   │   └── WishGrid.jsx
│   ├── hooks/
│   │   ├── useInstallPrompt.js
│   │   └── useWishlist.js
│   ├── i18n/
│   │   ├── I18nProvider.jsx
│   │   ├── config.js
│   │   ├── en.js
│   │   └── it.js
│   ├── lib/
│   │   ├── date.js
│   │   ├── ogScraper.js
│   │   ├── profile.js
│   │   ├── supabase.js
│   │   ├── text.js
│   │   ├── url.js
│   │   └── wishlistStore.js
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   └── NotFoundPage.jsx
│   ├── theme/
│   │   └── ThemeProvider.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── sw.js                  # Custom Workbox service worker
├── supabase/
│   ├── config.toml
│   └── migrations/20261109000000_init_wishlist.sql
├── supabase_schema.sql
├── index.html
├── package.json
└── vite.config.js
```

## How it works

### Data layer

`src/lib/wishlistStore.js` exposes a single API for both modes:

- **Supabase mode**: reads and writes `public.wishlist_items`, subscribes to
  Postgres changes and uses a conditional update (`.is('reserved_by', null)`)
  to prevent two family members from reserving the same gift at the same time.
- **Demo mode**: uses `localStorage`, the same UI and cross-tab storage events.

The rest of the app does not need to know which mode is active.

### Real-time updates

`App.jsx` uses `useWishlist`, which subscribes to the `wishlist_items` table.
When another device adds, reserves or releases a gift, the list refreshes
automatically. The header shows `Live`, `Demo` or `Offline` so the state is
always visible.

### Share Target flow

`ShareReceiver.jsx` reads `title`, `text` and `url` from the query string,
extracts the first URL from the shared text when necessary, calls
`fetchUrlMetadata` and opens the add dialog with the fetched fields. If the
metadata request fails, the dialog still opens with the shared URL and text so
the user can complete it manually.

### GitHub Pages routing

GitHub Pages does not serve `index.html` for unknown paths. `public/404.html`
redirects `/share` and other client routes to the app shell, and the script in
`index.html` restores the original URL before React Router mounts. The build
plugin replaces `__BASE_PATH__` with the correct base, so the fallback works for
both project sites and custom domains.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| The app shows **Demo** after deployment | Add `SUPABASE_URL` / `SUPABASE_ANON_KEY` (or the `VITE_` variants) to repository secrets and redeploy. |
| Realtime does not update | Run the migration again or check that `wishlist_items` is in the `supabase_realtime` publication. |
| A shared link opens a 404 | Make sure GitHub Pages uses **GitHub Actions** as its source and that the latest build contains `404.html`. |
| Share Target does not appear | Install the PWA over HTTPS, then share from a compatible Android browser. iOS does not support Web Share Target. |
| Product details are empty | Microlink may be rate-limited or blocked by the store. The user can enter the details manually. |
| `supabase db push` is skipped | Set `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID` and `SUPABASE_DB_PASSWORD`. |
| Custom domain serves a blank page | Check the DNS records, enable Enforce HTTPS and verify that the `CUSTOM_DOMAIN` secret has no protocol or trailing slash. |

## License

No license has been declared. This repository is intended for personal family
use.
