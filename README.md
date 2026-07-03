# The Ledger — a free, database-backed website

A static site (hosted free on GitHub Pages) with a real database and file
storage behind it (hosted free on Supabase). Two pages:

- **index.html** — public archive anyone can browse and search
- **admin.html** — private page where you log in to add/edit/delete entries
  and upload files

No PHP, no server to maintain. Everything runs in the browser and talks
directly to Supabase.

## 1. Create a free Supabase project

1. Go to https://supabase.com → sign up (free tier is enough) → **New project**.
2. Pick a name and a database password (save it somewhere safe), wait ~2 min
   for it to spin up.

## 2. Create the database table

1. In your Supabase project, open **SQL Editor** → **New query**.
2. Paste the entire contents of `schema.sql` (included in this folder) and
   click **Run**.
   This creates the `records` table and the access rules (public can read,
   only your logged-in admin account can write).

## 3. Create a storage bucket for files

1. Open **Storage** in the Supabase sidebar → **New bucket**.
2. Name it exactly `files` and toggle **Public bucket** on → **Create**.
   (The upload/read policies for this bucket were already created by
   `schema.sql` in step 2.)

## 4. Create your admin login

1. Open **Authentication → Users** → **Add user**.
2. Enter the email and password you'll use to log into `admin.html`.
   Set "Auto Confirm User" to on so you don't need email verification.

## 5. Connect the site to your project

1. In Supabase, open **Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `assets/config.js` in this folder and paste them in:

   ```js
   window.SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```

## 6. Put it on GitHub Pages

1. Create a new repository on GitHub, upload all the files in this folder
   (`index.html`, `admin.html`, `assets/`, keep `schema.sql`/`README.md` too
   if you like).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   branch `main`, folder `/ (root)` → **Save**.
4. After a minute, your site is live at
   `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`.

## Using it

- Visit `admin.html` on your live site, sign in with the account from step 4,
  and add entries — a title, description, category, and optionally a file.
- Visit `index.html` to see the public archive, searchable and filterable
  by category.

## Notes

- The admin page is only as private as its password — anyone with the
  login can edit content, but visitors without it can only read, thanks to
  the row-level security rules in `schema.sql`.
- Free tier limits (as of writing): Supabase gives 500MB database + 1GB file
  storage free, GitHub Pages is free and unlimited for public repos. Fine
  for a small archive; check current limits on supabase.com/pricing if you
  grow past that.
- Want more fields (e.g. author, date, tags)? Add columns to the `records`
  table in Supabase, then add matching inputs in `admin.html`'s form and
  `assets/admin.js` / `assets/app.js`.
