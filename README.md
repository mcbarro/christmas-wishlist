# Christmas Wishlist

A zero-account family Christmas wishlist, built as an installable PWA with a
Responsive card grid, closed family groups and native mobile sharing.

- No sign-up, no email and no password.
- Closed family groups with invite links and admin approval of new members.
- Admins can pre-create a member and share a one-time invite link, so the
  invited person can enter immediately without waiting for approval; the link
  stops working after the first use.
- Admins can remove a member, revoking access immediately while keeping the
  wishes and gift ideas already shared with the group.
- Admins can reissue a one-time link for a member who lost their link, without
  losing that member's wishes or suggestions.
- Join multiple family groups and switch between them from the header.
- Add wishes manually, share a product link from a phone, import a public
  Amazon wishlist, or save the current page with a desktop bookmarklet.
- Search an image for a gift when there is no product URL.
- Edit and delete the wishes you created; members who had reserved them receive
  an in-app notification.
- Reserve gifts as your approved member identity so nobody buys the same present twice.
- Reservations on your own wishes are hidden to preserve the surprise.
- Suggest gift ideas for another member without revealing them to that member.
- Switch between grid and list view; the list shows a preview on the left and
  the wish details on the right.
- Rate your own wishes from 1 to 5 in 0.5 steps; wishlists are sorted by
  rating, with gift ideas for other members first.
- Filter by member and by budget range; the header keeps compact dropdowns for
  availability and members, and the search field expands from its icon.
- Hide wishes for your own view and reveal them again with a dedicated toggle.
- Family sync across devices through Supabase.
- English and Italian UI, detected from the browser language and switchable
  from the profile dialog.
- Three themes: light, dark and Christmas. New users start in the Christmas
  theme, and the choice is saved from then on.
- Deployable to GitHub Pages with a single push to `main`.

## Tech stack

- React 19 + Vite
- Tailwind CSS 4
- Supabase (PostgreSQL, Row Level Security and SECURITY DEFINER RPCs)
- `vite-plugin-pwa` + Workbox
- Microlink API for OpenGraph metadata
- Jina Reader for public Amazon wishlist imports
- Wikimedia Commons API for gift image search
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

If Supabase is not configured, the app runs in **demo mode** and keeps the
family group, members and wishes in `localStorage`. This is useful for trying
the full join/approval flow locally: create a group, copy the group invite link
from the session dialog, leave the device, rejoin as another member and approve
the request as the admin. The app displays a clear demo banner so nobody
mistakes local data for shared family data.

To use a real database, fill in `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The Supabase anon key is public by design. Security is enforced by the RPC
functions and Row Level Security described below.

## Supabase setup

### Option A: automated migrations (recommended)

The repository contains these migrations, applied in order:

- `supabase/migrations/20261109000000_init_wishlist.sql`
- `supabase/migrations/20261109010000_group_logic.sql`
- `supabase/migrations/20261109020000_fix_add_item_returning.sql`
- `supabase/migrations/20261109030000_fix_join_group_ambiguity.sql`
- `supabase/migrations/20261110010000_suggestions_and_members.sql`
- `supabase/migrations/20261110020000_delete_and_notifications.sql`
- `supabase/migrations/20261110030000_bulk_import_and_capabilities.sql`
- `supabase/migrations/20261110040000_edit_and_hidden_items.sql`
- `supabase/migrations/20261110050000_preapproved_members.sql`
- `supabase/migrations/20261110060000_one_time_invites.sql`
- `supabase/migrations/20261110070000_fix_invite_token.sql`
- `supabase/migrations/20261110080000_item_ratings.sql`
- `supabase/migrations/20261110090000_member_removal.sql`
- `supabase/migrations/20261110100000_reissue_invites.sql`

The GitHub Actions workflow applies them with `supabase db push` before
building the site.

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

If the deployed app shows a **family sync unavailable** or **database migration
not applied** warning, the group RPCs are missing from the remote project. Apply
the migration (or add the database secrets so the workflow can apply it), then
use **Retry family sync** in the warning banner. The fallback result is cached
for five minutes to avoid repeated slow probes.

### Database schema

The group migration creates or extends these tables:

| Table | Purpose |
| ----- | ------- |
| `groups` | Group id, unique `group_secret`, name and creation date |
| `group_members` | Member id, `group_id`, unique `user_secret` per group, display name, admin flag, `pending`/`approved` status |
| `wishlist_items` | Group id, owner member id, creator member id, title, URL, image, notes, price and creation date |
| `item_reservations` | One reservation per item, with the reserving member id |
| `notifications` | Private per-member notifications, with a JSON payload and a read timestamp |
| `hidden_items` | Per-member hidden wishes; invisible to everyone else |

Direct table access is denied to `anon` and `authenticated`. All operations go
through SECURITY DEFINER functions that validate the group and member secrets:

- `create_group`, `join_group`, `get_session`, `get_group_by_secret`
- `get_group_items`, `add_item`, `add_items`, `update_item`
- `reserve_item`, `release_item`, `get_safe_reservations`
- `get_pending_members`, `approve_member`, `get_group_members`,
  `create_preapproved_member`, `get_invite`, `claim_invite`, `remove_member`,
  `reissue_invite`
- `delete_item`, `get_notifications`, `mark_notifications_read`
- `hide_item`, `unhide_item`, `set_item_rating`
- `get_app_capabilities`

Two privacy rules are enforced in the database:

- `get_safe_reservations` omits reservations on the requesting member's own
  wishes, so the list owner sees them as unreserved.
- `get_group_items` omits gift ideas that another member created for the
  requesting member, so the surprise is preserved even if the owner calls the
  API directly.

The frontend never queries `item_reservations` or the other tables directly.

> [!WARNING]
> The `group_secret` and `user_secret` values are credentials. The group invite
> link lets a relative request access, but the admin must approve them. The
> personal link is more powerful: anyone with it can act as that member. Share
> it carefully. The site sends a `noindex` directive and a restrictive
> `robots.txt`, but those are not security controls.

## Family groups and privacy

### Create a group

On first access the app asks for a group name and your name. The creator becomes
the approved admin. The personal link and the group invite link are available
from the **session** button in the header.

- **Personal link**: `?group=<GROUP_SECRET>&user=<USER_SECRET>`. Reopens the
  same member session on another device. Keep it private.
- **Group invite link**: `?group=<GROUP_SECRET>`. Share it with relatives; they
  will request access as a pending member.

The session is stored in `localStorage` and mirrored in the URL so it can be
copied to another device.

### Multiple groups

The app stores a list of group sessions in `localStorage`
(`christmas-wishlist:sessions:v1`) and keeps the legacy single-session key for
backwards compatibility.

- The header pill next to the app title shows the current group.
- Open it to switch to another saved group, add a group, leave the current
  group, or leave all groups.
- Adding a group keeps the existing sessions; the create/join screen offers
  **Back to my group**.
- Leaving the current group switches to the most recent remaining group, or
  shows the create/join screen when none are left.
- The personal link remains the portable way to reopen a group on another
  device.

### Join and approval

1. A relative opens the group invite link.
2. The app asks for their name and creates a `pending` member.
3. The relative sees the **Waiting for approval** screen and can copy their
   personal link to reopen the session later.
4. The admin sees the inbox bell with the pending count, opens the **Requests**
   tab and chooses **Approve** or **Reject**.
5. The pending screen checks again automatically every few seconds, or
   immediately with **Check again**.

### One-time invite links

An admin can create a member before they join:

1. Open the inbox bell, then the **Requests** tab.
2. Enter the member name under **Invite a member**.
3. Generate the link and send it privately.

The member row is created as `invited`, hidden from the approved member list.
The generated link contains a one-time invite token instead of a member secret.
When the recipient opens it, they see a confirmation screen; the first time
they confirm, `claim_invite` assigns a fresh `user_secret`, approves the member,
and clears the token. The same link can no longer be used, including by link
previews or scanners that only open the URL.

> [!WARNING]
> The invite link is a credential until it is claimed. Share it only with the
> intended person. If an unused link leaks, remove the invited member from the
> group and create a new invite.

### Removing a member

An admin can remove a non-admin member from the **Members** section of the
inbox:

1. Open the inbox bell, then the **Requests** tab.
2. Find the member under **Members** and click **Remove**.
3. Confirm the removal.

The member status becomes `removed`, their session secret is replaced and any
invite token is cleared, so access is revoked immediately. Their reservations,
hidden items and notifications are deleted. Their wishes and gift ideas stay in
the group, so the family does not lose the ideas they contributed. Admins cannot
remove themselves; use **Leave this group** from the profile dialog instead.

### Reissuing a lost link

If a member loses their secret link, the admin can generate a new one from the
**Members** section:

1. Open the inbox bell, then the **Requests** tab.
2. Next to the member, click **New link** and confirm.
3. Copy the new one-time link and send it privately.

The member keeps the same row and member id, so their wishes, suggestions and
reservations stay attached to them. Reissuing replaces the session secret and
clears any previous invite token: the old link and any active sessions stop
working immediately. The new link goes through the usual confirmation screen and
becomes invalid after the first claim. Admins cannot reissue their own link;
they can copy their personal link from the profile dialog instead.

### Privacy of reservations

The frontend loads reservations through the `get_safe_reservations` RPC. Own
wishes are omitted from that result, so the list owner always sees them as
unreserved and cannot reserve their own gift. The owner sees a **Your wish**
state with a privacy hint; other members see the real reservation and can
reserve available gifts.

### Gift ideas for other members

In the add dialog, choose a member in **Who is it for?** to create a gift idea
for them.

- The item belongs to the selected member (`owner_member_id`) but records the
  creator (`created_by_member_id`).
- The selected member never sees the idea. Everyone else does.
- The card shows a **Gift idea for …** badge and **Suggested by …**.
- Filtering by a member shows both their own wishes and the ideas suggested for
  them. The member themselves sees only their own wishes, because the server
  filters suggestions for the owner.
- Only the creator can delete the suggestion; the owner and other members
  cannot.
- The creator can reserve their own suggestion if they want to buy it.

### Wish ratings and list view

- Each wish created for yourself starts with a rating of **2.5** and can be set
  from **1 to 5** in **0.5** steps.
- Only the member who created the wish can change its rating; other members see
  it read-only.
- Gift ideas created for someone else have no rating. They are always listed
  before rated wishes; the remaining wishes are sorted from the highest rating
  to the lowest.
- The five rating icons are stars in the light and dark themes and small gift
  boxes in the Christmas theme.
- The header toggle switches between the card grid and a compact list with a
  preview on the left and details on the right. The grid fills left to right and
  then moves to the next row. The choice is saved in the browser; on mobile the
  initial default is the list view.

### Member filter and budget

- The approved members appear in a compact header row with a stable color
  derived from the member UUID and an initial.
- **Everyone** clears the member filter; the dropdown next to it lists the
  approved members with their color and initial.
- The availability filter is a dropdown with the same all/available/reserved
  counts.
- The budget button opens a min/max slider. You can include wishes without a
  parsable price with the dedicated checkbox.
- Member, budget, availability and text search all combine with AND.
- If no price can be parsed, the budget slider is disabled.

### Delete a wish and notifications

- Only the member who created a wish can delete it. Admins cannot delete other
  members' wishes.
- The trash button is shown only to the creator, with a confirmation dialog.
- The confirmation does not reveal whether the wish was reserved or by whom.
- If someone had reserved the wish, they receive an in-app notification in the
  bell/inbox. The notification is created in the same database transaction as
  the deletion.

### Edit a wish

The creator of a wish sees a pencil button on the card. The same add dialog
opens in edit mode and updates the title, URL, image, notes, price and
recipient through the `update_item` RPC. Only the creator can edit, matching
the delete rule.

### Hidden wishes

- While filtering by another member, each wish has a **Hide** button.
- Hidden wishes are private to the member who hid them; nobody else is told.
- The **Hidden** toggle next to the budget filter controls whether the current
  member sees their hidden wishes.
- When hidden wishes are visible, they carry a **Hidden** badge and a
  **Show again** button.
- The hidden state is stored in `hidden_items` and survives reloads and
  devices linked to the same personal session.

### Image search

If no product URL is present, the add/edit dialog offers **Search image**. The
query is based on the gift name and results come from the Wikimedia Commons
API. Selecting a result fills the image URL and shows a preview.

### Desktop bookmarklet

The session dialog includes a desktop-only bookmarklet section. Drag the
button to the bookmarks bar, or copy the bookmarklet code. Opening the bookmark
on any page opens the app on a dedicated save screen where you choose:

- one of your saved groups;
- the recipient of the wish;
- the gift name, price, image and notes.

The page URL and title are prefilled, and metadata is fetched when possible.

### Import an Amazon wishlist

1. Open **Add a wish → Import from Amazon**.
2. Paste a public Amazon wishlist link.
3. Review the parsed items and choose which ones to import.
4. The selected items become the current member's own wishes.

The importer uses **Jina Reader** to read the public Amazon page, because Amazon
blocks direct browser requests with CORS and bot protection. Limitations:

- the wishlist must be public;
- the reader service can be rate-limited or temporarily unavailable;
- some items may not expose a price or image;
- imports are capped at 100 items (and at most 5 pages);
- items already present in the group (same ASIN) are marked and skipped by
  default.

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
| `SUPABASE_PROJECT_ID` | Yes for migrations | Project reference used by `supabase db push --remote` |
| `SUPABASE_ACCESS_TOKEN` | Yes for migrations | Personal Access Token for the Supabase CLI |
| `SUPABASE_DB_PASSWORD` | Recommended for migrations | Database password; if omitted, the CLI tries a temporary login role with the access token |
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

The active group session is stored locally, so sharing a product from the
installed PWA keeps the current family group. The `/add-item` route is also
supported as an alias for compatibility. The route is declared in the manifest
as `/share` and is adjusted automatically for GitHub Pages project sites and
custom domains.

> [!NOTE]
> iOS Safari does not expose the Web Share Target API to installed web apps.
> iOS users can still install the PWA and paste a product URL into the add
> dialog; the **Fetch details** button uses the same metadata extraction.

## Localization

The UI is fully translated into English and Italian.

- The initial language is chosen from `navigator.languages`.
- The language can be switched with the `EN` / `IT` control in the profile
  dialog (the session panel).
- The choice is stored in `localStorage`.
- `?lang=it` or `?lang=en` can be used to force a language for testing or for a
  specific shared link.

All user-facing strings live in `src/i18n/en.js` and `src/i18n/it.js`. Adding a
new language requires adding a dictionary with the same keys and registering it
in `src/i18n/I18nProvider.jsx`.

## Theme

The app starts in the **Christmas** theme when no preference has been saved
yet. The theme button cycles through **light → dark → Christmas → light**, and
the choice is saved in `localStorage` under `christmas-wishlist:theme`. The
Christmas theme uses the same semantic CSS variables with an
evergreen/red/gold palette, dense falling snow that accumulates at the bottom of
the viewport, strings of lights on the header, cards and dialogs, and a subtle
semi-transparent illustrated Christmas tree. The snow animation is disabled for
`prefers-reduced-motion`. All three themes stay consistent across cards,
dialogs, forms and status messages.

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
│   │   ├── AmazonImportModal.jsx
│   │   ├── Banners.jsx
│   │   ├── BookmarkletModal.jsx
│   │   ├── BudgetFilter.jsx
│   │   ├── CopyLinkButton.jsx
│   │   ├── DeleteWishModal.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── GroupSwitcher.jsx
│   │   ├── InboxModal.jsx
│   │   ├── LanguageSwitcher.jsx
│   │   ├── MemberFilter.jsx
│   │   ├── Modal.jsx
│   │   ├── Navbar.jsx
│   │   ├── ReserveModal.jsx
│   │   ├── SessionModal.jsx
│   │   ├── ShareReceiver.jsx
│   │   ├── ThemeToggle.jsx
│   │   ├── Toast.jsx
│   │   ├── WishCard.jsx
│   │   └── WishGrid.jsx
│   ├── group/
│   │   ├── GroupGate.jsx
│   │   └── GroupProvider.jsx
│   ├── hooks/
│   │   ├── useGroupWishlist.js
│   │   └── useInstallPrompt.js
│   ├── i18n/
│   │   ├── I18nProvider.jsx
│   │   ├── config.js
│   │   ├── en.js
│   │   └── it.js
│   ├── lib/
│   │   ├── amazonImport.js
│   │   ├── date.js
│   │   ├── filters.js
│   │   ├── groupStore.js
│   │   ├── imageSearch.js
│   │   ├── memberColor.js
│   │   ├── ogScraper.js
│   │   ├── price.js
│   │   ├── supabase.js
│   │   ├── text.js
│   │   └── url.js
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   └── NotFoundPage.jsx
│   ├── theme/
│   │   └── ThemeProvider.jsx
│   ├── App.jsx
│   ├── WishlistApp.jsx
│   ├── index.css
│   ├── main.jsx
│   └── sw.js                  # Custom Workbox service worker
├── supabase/
│   ├── config.toml
│   └── migrations/
│       ├── 20261109000000_init_wishlist.sql
│       ├── 20261109010000_group_logic.sql
│       ├── 20261109020000_fix_add_item_returning.sql
│       ├── 20261109030000_fix_join_group_ambiguity.sql
│       ├── 20261110010000_suggestions_and_members.sql
│       ├── 20261110020000_delete_and_notifications.sql
│       ├── 20261110030000_bulk_import_and_capabilities.sql
│       ├── 20261110040000_edit_and_hidden_items.sql
│       ├── 20261110050000_preapproved_members.sql
│       ├── 20261110060000_one_time_invites.sql
│       ├── 20261110070000_fix_invite_token.sql
│       ├── 20261110080000_item_ratings.sql
│       ├── 20261110090000_member_removal.sql
│       └── 20261110100000_reissue_invites.sql
├── supabase_schema.sql
├── index.html
├── package.json
└── vite.config.js
```

## How it works

### Data layer

`src/lib/groupStore.js` exposes a single API for both modes:

- **Supabase mode**: calls SECURITY DEFINER RPCs with the group and member
  secrets. The database rejects unapproved members and never exposes the
  `item_reservations` or `notifications` tables directly.
- **Demo mode**: stores groups, members, wishes, reservations and notifications
  in `localStorage` and emits a local change event.

The rest of the app does not need to know which mode is active.

### Group session

`GroupProvider` resolves the URL and the saved session on startup. It renders
one of these states through `GroupGate`:

- create a group
- join a group with an invite link
- waiting for admin approval
- invalid group link or network error
- approved application

`WishlistApp` is only mounted for approved members. Changing the session or
leaving the device re-renders the gate without reloading the page.

### Sync

`useGroupWishlist` loads the group data (wishes, safe reservations, approved
members, pending requests and notifications) and refreshes it on mount, every
15 seconds while the tab is visible, when the tab becomes visible again, and
after local mutations. The header shows `Live`, `Demo` or `Offline`; it is also
a manual refresh button. This avoids exposing table rows directly while keeping
the family list and inbox reasonably up to date.

### Share Target flow

`ShareReceiver.jsx` reads `title`, `text` and `url` from the query string,
extracts the first URL from the shared text when necessary, calls
`fetchUrlMetadata` and opens the add dialog with the fetched fields. If the
metadata request fails, the dialog still opens with the shared URL and text so
the user can complete it manually.

### Amazon import flow

`src/lib/amazonImport.js` validates the Amazon host and wishlist path, fetches
the public page through Jina Reader one page at a time, parses product links,
titles, prices and images, deduplicates by ASIN and returns a preview list.
`AmazonImportModal` lets the user select the items; `add_items` inserts the
selected items in one RPC (with a sequential `add_item` fallback for older
databases).

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
| A sync warning appears even though Supabase is configured | Apply `20261109010000_group_logic.sql` (or run `supabase_schema.sql`), then click **Retry family sync**. The fallback probe is cached for five minutes. |
| The Supabase project is paused or unreachable | Wake the project in the Supabase dashboard, then click **Retry family sync**. Until then the app keeps working in local demo mode. |
| A group invite link says **Group not found** | Check that the `group` parameter is complete and that the latest Supabase migration has been applied. |
| A new member stays on the waiting screen | The admin must open the bell and approve the request, or the member can tap **Check again**. |
| My own wishes never show reservations | This is intentional: `get_safe_reservations` hides reservations on the requesting member's own wishes. |
| A gift idea is missing for the member it is for | This is intentional: `get_group_items` hides suggestions from their owner to preserve the surprise. Other members see them. |
| The trash button is missing | Only the member who created the wish can delete it. Admins cannot delete other members' wishes. |
| A reservation notification does not appear immediately | Notifications refresh with the 15-second polling, on tab focus or with the status refresh button. |
| The budget filter hides a wish with no price | Enable **Include wishes without a price** in the budget dialog. |
| Member chips or the inbox are missing | Apply the latest migrations and redeploy. The capability probe disables features that the database does not expose yet. |
| The group switcher does not list a group | Open the group with its personal link once; the session is added to `christmas-wishlist:sessions:v1`. |
| The edit button is missing | Only the creator of a wish can edit it, and the `edit_items` capability must be present. |
| The hidden toggle is missing | Apply `20261110040000_edit_and_hidden_items.sql`; the `hide_items` capability gates the toggle. |
| Image search returns nothing | Try a simpler query in Italian or English. Wikimedia Commons may not have a matching photo. |
| The bookmarklet link cannot be dragged | Use **Copy bookmarklet** and create a bookmark manually, pasting the code as the URL. |
| The Christmas theme looks wrong after an update | Reload once to refresh the cached CSS and service worker. |
| The Amazon import says the list is private | Make the Amazon wishlist public; the reader service cannot access lists that require a login. |
| The Amazon import fails or times out | Jina Reader may be rate-limited or temporarily unavailable. Wait a moment and try again; the rest of the app is unaffected. |
| Amazon items have no price or image | Amazon does not always expose them in the public page. The item is still imported and can be edited manually. |
| Another device does not update immediately | The list refreshes every 15 seconds and when the tab becomes visible; use the status pill to refresh manually. |
| A shared link opens a 404 | Make sure GitHub Pages uses **GitHub Actions** as its source and that the latest build contains `404.html`. |
| Share Target does not appear | Install the PWA over HTTPS, then share from a compatible Android browser. iOS does not support Web Share Target. |
| Product details are empty | Microlink may be rate-limited or blocked by the store. The user can enter the details manually. |
| `supabase db push` is skipped | Set `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`. `SUPABASE_DB_PASSWORD` is recommended if the project uses network restrictions or the temporary login role is not allowed. |
| `supabase db push` still fails | Check the workflow log, verify the project is active, and apply the migration manually with `supabase_schema.sql`. The app remains usable in local demo mode while sync is unavailable. |
| Custom domain serves a blank page | Check the DNS records, enable Enforce HTTPS and verify that the `CUSTOM_DOMAIN` secret has no protocol or trailing slash. |

## License

No license has been declared. This repository is intended for personal family
use.
