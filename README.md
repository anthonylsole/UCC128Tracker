# UCC128 Tracker

The UCC128 Label Rollout Tracker, hosted as a Cloudflare Worker with static
assets. Data lives in D1 (database) and label sample files in R2.

## How it fits together

All requests go to the Worker first (`run_worker_first = true` in
`wrangler.toml`). The Worker checks the shared site password, handles any
`/api/*` route, and serves everything else from `public/`.

```
UCC128Tracker/
├── wrangler.toml      # Worker config: D1 (DB) and R2 (SAMPLES) bindings
├── schema.sql         # Table definitions for the D1 database
├── public/
│   └── index.html     # The tracker app
└── worker/
    ├── index.js       # Entry point: auth check and API routing
    ├── auth.js        # Shared-password (Basic Auth) gate
    ├── rows.js        # /api/rows, /api/bootstrap, /api/rows/bulk-update
    ├── waves.js       # /api/waves (go-live dates per wave)
    ├── mappings.js    # /api/mappings (label field mappings)
    └── samples.js     # /api/samples (label sample files in R2)
```

## Setup from scratch

With `wrangler` installed and logged in:

```bash
# 1. Create the D1 database, then copy the database_id it prints into wrangler.toml
wrangler d1 create ucc128-tracker-db

# 2. Create the R2 bucket for label samples
wrangler r2 bucket create ucc128-label-samples

# 3. Load the schema
wrangler d1 execute ucc128-tracker-db --remote --file=schema.sql

# 4. Set the site password (you'll be prompted for the value)
wrangler secret put SITE_PASSWORD

# 5. Deploy
wrangler deploy
```

If the Worker is connected to this repo in the Cloudflare dashboard, pushing to
`main` deploys it automatically instead of step 5.

## Local development

```bash
wrangler dev
```

Then open http://localhost:8787. If `SITE_PASSWORD` isn't set locally, the
password check is skipped. To test it locally, put
`SITE_PASSWORD=yourpassword` in a `.dev.vars` file (and keep that file out of
git).

`/api/ping` returns `{"status":"ok","rowCount":N}` and is a quick way to check
that the Worker can reach the database.

## Notes

`GRANULAR_SETUP_GUIDE.md` is the original walkthrough from when this project
started on Cloudflare Pages. The account setup and D1/R2 steps still apply, but
the Pages-specific parts (`functions/api/`, `wrangler pages` commands) were
replaced by the Worker setup above.
