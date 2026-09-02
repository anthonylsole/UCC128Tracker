# Hosting the UCC128 Tracker on Cloudflare — Beginner's Step-by-Step Guide

This assumes you've never used Cloudflare Pages, D1, R2, or the command line tool
("wrangler") before. Every step tells you exactly what to type or click, and what
you should see if it worked before you move to the next one.

---

## Phase 0 — Before you start

You need three things. Check these off first.

### 0.1 A Cloudflare account
Go to https://dash.cloudflare.com/sign-up and create a free account if you don't
already have one. The free tier covers everything in this guide — Pages, D1, and R2
all have generous free limits well beyond what an internal tracker like this needs.

**✅ Checkpoint:** You can log into https://dash.cloudflare.com and see a dashboard
(even if it's empty).

### 0.2 Node.js installed on your computer
This is the engine that runs the command-line tools.

- Go to https://nodejs.org and download the **LTS** version (the one recommended
  for most users, not "Current").
- Run the installer, clicking through with defaults.

**✅ Checkpoint:** Open a terminal (on Mac: the "Terminal" app; on Windows: "Command
Prompt" or "PowerShell") and type:
```bash
node --version
```
You should see something like `v22.x.x`. If you see "command not found," restart
your terminal (or your computer) and try again — installers sometimes need a
restart to update your PATH.

### 0.3 A place to keep your project files
Pick or create a folder on your computer where this project will live, e.g.
`Documents/ucc128-tracker`. You don't need to create it yet — we'll do that in
Phase 2.

---

## Phase 1 — Install Wrangler (Cloudflare's command-line tool)

Wrangler is the tool you use to create databases, deploy your site, and manage
everything else on Cloudflare from your terminal.

### 1.1 Install it
In your terminal, type:
```bash
npm install -g wrangler
```
This downloads and installs it globally on your computer (the `-g` means
"globally," so you can run it from any folder).

**✅ Checkpoint:**
```bash
wrangler --version
```
Should print a version number like `3.x.x`.

### 1.2 Log in
```bash
wrangler login
```
This opens your web browser and asks you to log into Cloudflare and approve access.
Click **Allow**.

**✅ Checkpoint:** Back in your terminal, you should see `Successfully logged in.`
If the browser didn't open automatically, wrangler will print a URL — copy/paste
it into your browser manually.

---

## Phase 2 — Create your project folder

### 2.1 Create and enter the folder
```bash
mkdir ucc128-tracker
cd ucc128-tracker
```
(`mkdir` makes the folder, `cd` moves your terminal "into" it. Everything from
here on assumes your terminal is inside this folder.)

**✅ Checkpoint:** Type `pwd` (Mac) or `cd` with no arguments (Windows) — it should
print a path ending in `ucc128-tracker`.

---

## Phase 3 — Create the D1 database

D1 is where the actual tracker data (the rows, statuses, dates) will live.

### 3.1 Create it
```bash
wrangler d1 create ucc128-tracker-db
```

**✅ Checkpoint:** This prints something like:
```
✅ Successfully created DB 'ucc128-tracker-db'

[[d1_databases]]
binding = "DB"
database_name = "ucc128-tracker-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```
**Copy that whole `[[d1_databases]]` block somewhere safe** (a text file, a sticky
note) — you'll paste it into a config file in the next phase. The long ID is
unique to your database; yours will look different from the example above.

### 3.2 See it in the dashboard (optional, but reassuring for a first time)
Go to https://dash.cloudflare.com → **Workers & Pages** → **D1** in the left
sidebar. You should see `ucc128-tracker-db` listed. This confirms it was really
created, not just printed to your terminal.

---

## Phase 4 — Create the R2 bucket (for label sample images)

R2 is separate from D1 — it's for storing actual files (your MovEx/IntraOne label
sample images), not data rows.

### 4.1 Create it
```bash
wrangler r2 bucket create ucc128-label-samples
```

**✅ Checkpoint:** You should see `Created bucket 'ucc128-label-samples'`.

### 4.2 See it in the dashboard
Go to https://dash.cloudflare.com → **R2** in the left sidebar. You should see
`ucc128-label-samples` listed.

> **Note:** R2 requires you to add a payment method on file even to use the free
> tier (Cloudflare does this to prevent abuse) — but you will not be charged
> unless you exceed the free monthly allowance, which is 10 GB storage, far more
> than label sample images will use.

---

## Phase 5 — Configure `wrangler.toml`

This file tells Cloudflare how your project's pieces connect together. Think of
it as the "settings file" for your whole project.

### 5.1 Create the file
In your project folder (`ucc128-tracker`), create a new file called
`wrangler.toml` (using any text editor — VS Code, Notepad, TextEdit, whatever you
have) with this content:

```toml
name = "ucc128-tracker"
compatibility_date = "2026-08-28"
pages_build_output_dir = "public"

[[d1_databases]]
binding = "DB"
database_name = "ucc128-tracker-db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"

[[r2_buckets]]
binding = "SAMPLES"
bucket_name = "ucc128-label-samples"
```

Replace `PASTE_YOUR_DATABASE_ID_HERE` with the actual ID you copied in step 3.1.

**✅ Checkpoint:** Save the file. Run:
```bash
wrangler d1 execute ucc128-tracker-db --command "SELECT 1"
```
If your `wrangler.toml` is set up correctly, this runs a trivial test query
against your real database and prints a result table with `1` in it. If you get
an error about the database not being found, double-check the `database_id` you
pasted matches exactly what was printed in step 3.1.

---

## Phase 6 — Create the database schema (the actual table structure)

### 6.1 Create the schema file
In your project folder, create a file called `schema.sql`:

```sql
CREATE TABLE tracker_rows (
  id TEXT PRIMARY KEY,
  account TEXT,
  customer TEXT,
  wave TEXT,
  template TEXT,
  test_start TEXT,
  test_end TEXT,
  prod_start TEXT,
  prod_end TEXT,
  testing_required TEXT,
  test_resource TEXT,
  ops_reviewer TEXT,
  status TEXT DEFAULT 'Not Started',
  approval_scope TEXT DEFAULT 'This Combo Only',
  test_pos TEXT,
  notes TEXT
);

CREATE TABLE label_mappings (
  field_name TEXT PRIMARY KEY,
  intraone_mapping TEXT,
  source_mapping TEXT,
  sort_order INTEGER
);
```

### 6.2 Run it against your database
```bash
wrangler d1 execute ucc128-tracker-db --remote --file=schema.sql
```
(`--remote` means "run this against the real, live database" rather than a local
test copy.)

**✅ Checkpoint:**
```bash
wrangler d1 execute ucc128-tracker-db --remote --command "SELECT name FROM sqlite_master WHERE type='table'"
```
Should list `tracker_rows` and `label_mappings`.

---

## Phase 7 — Write and test one small API endpoint before building everything

This is the most important checkpoint in the whole process: confirming your site,
your database, and Cloudflare are all actually talking to each other — with the
absolute simplest possible example — before we build out the full tracker on top
of it.

### 7.1 Create the folder structure
```bash
mkdir public
mkdir functions
mkdir functions/api
```
- `public/` is where your actual website files go (we'll add the tracker's HTML
  here shortly).
- `functions/api/` is where your backend endpoints go. Cloudflare automatically
  turns each file in here into a URL — a file at `functions/api/ping.js` becomes
  accessible at `yoursite.com/api/ping`.

### 7.2 Create a placeholder homepage
Create `public/index.html`:
```html
<!DOCTYPE html>
<html><body><h1>UCC128 Tracker — coming soon</h1></body></html>
```
(This is just a placeholder so the site has *something* to show. We'll replace it
with the real tracker later.)

### 7.3 Create a test endpoint
Create `functions/api/ping.js`:
```js
export async function onRequestGet({ env }) {
  const result = await env.DB.prepare("SELECT COUNT(*) as count FROM tracker_rows").first();
  return Response.json({ status: "ok", rowCount: result.count });
}
```
This is a tiny function that just asks your database "how many rows are in
tracker_rows?" and reports back. Since the table is empty right now, it should
report `0` — the point isn't the number, it's confirming the whole chain works.

### 7.4 Test it locally
```bash
wrangler pages dev public
```
This starts a local test server on your computer. It will print something like
`Local: http://127.0.0.1:8788`.

Open that URL in your browser — you should see the placeholder homepage. Now go
to `http://127.0.0.1:8788/api/ping` in your browser.

**✅ Checkpoint:** You should see:
```json
{"status":"ok","rowCount":0}
```
If you see this, every piece is correctly wired together: your site, your
Function, and your live D1 database. Press `Ctrl+C` in the terminal to stop the
local server when you're done checking this.

> **If something's wrong here:** this is the best point to troubleshoot, since
> it's the simplest possible test. Common issues: a typo in `wrangler.toml`'s
> `database_id`, or the `schema.sql` step not having actually run — re-check
> Phases 5 and 6 above.

---

## Phase 8 — Deploy to the live internet

### 8.1 Deploy
```bash
wrangler pages deploy public --project-name=ucc128-tracker
```
The first time you run this, it may ask a couple of setup questions (which
Cloudflare account to use, confirming the project name) — just confirm the
defaults.

**✅ Checkpoint:** It prints a URL like `https://ucc128-tracker.pages.dev` —
open it. You should see the same placeholder homepage, now live on the internet.
Try `https://ucc128-tracker.pages.dev/api/ping` too — same JSON response as
before, but now served from Cloudflare's real infrastructure instead of your
laptop.

### 8.2 (Optional) Connect it to GitHub for automatic deploys
If you'd rather push code to GitHub and have it deploy automatically instead of
running `wrangler pages deploy` by hand each time: in the Cloudflare dashboard,
go to **Workers & Pages** → your `ucc128-tracker` project → **Settings** →
**Builds & deployments**, and connect a GitHub repository. Not required to get
started — you can always do this later.

---

## Where things stand after this guide

At this point you have:
- A live Cloudflare Pages site
- A working D1 database, empty but ready
- A working R2 bucket, empty but ready
- One confirmed-working API endpoint proving the whole chain works

**What's not done yet:** the actual tracker application — the real API endpoints
for reading/writing tracker rows, uploading label samples to R2, and the
frontend rewired to call them instead of `window.storage`. That's a separate,
larger piece of work. Once you've confirmed Phase 7 and Phase 8 both worked for
you, let me know and I'll build that complete package to drop into your
`public/` and `functions/api/` folders.
