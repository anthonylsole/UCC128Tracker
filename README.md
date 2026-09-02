# UCC128 Tracker — Cloudflare Pages Project

This is the project scaffold for hosting the UCC128 Label Rollout Tracker on
Cloudflare Pages, backed by D1 (database) and R2 (label sample file storage).

## Setup

Follow `GRANULAR_SETUP_GUIDE.md` for the full step-by-step walkthrough. Short
version, once you have `wrangler` installed and are logged in:

```bash
# 1. Create your D1 database (if you haven't already)
wrangler d1 create ucc128-tracker-db
# Copy the database_id it prints into wrangler.toml

# 2. Create your R2 bucket (if you haven't already)
wrangler r2 bucket create ucc128-label-samples

# 3. Load the schema
wrangler d1 execute ucc128-tracker-db --remote --file=schema.sql

# 4. Test locally
wrangler pages dev public
# then visit http://127.0.0.1:8788/api/ping — should return {"status":"ok","rowCount":0}

# 5. Deploy
wrangler pages deploy public --project-name=ucc128-tracker
```

## Project structure 

```
ucc128-tracker/
├── wrangler.toml          # Cloudflare config — bindings for D1 + R2
├── schema.sql             # Database table definitions
├── public/                # The actual website (served as-is)
│   └── index.html
└── functions/api/         # Serverless API endpoints (Cloudflare Pages Functions)
    └── ping.js            # Test endpoint confirming DB connectivity
```

## Status

- [x] Project scaffolded, git repo initialized
- [ ] `wrangler.toml` filled in with real `database_id`
- [ ] Schema loaded into live D1 database
- [ ] Local test (`/api/ping`) confirmed working
- [ ] Deployed to Cloudflare Pages
- [ ] Real tracker application + API endpoints built (not yet started)
