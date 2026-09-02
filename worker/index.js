// This one file now does the job the old functions/api/ folder used to do.
// The current Cloudflare "Workers with static assets" model uses a single
// Worker script that inspects the request and either (a) handles it itself
// (our API routes) or (b) hands it off to env.ASSETS to serve a static file
// from the public/ folder.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/ping" && request.method === "GET") {
      const result = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM tracker_rows"
      ).first();
      return Response.json({ status: "ok", rowCount: result.count });
    }

    // Add more API routes here as they're built, e.g.:
    // if (url.pathname === "/api/rows" && request.method === "GET") { ... }

    // Anything that isn't an API route falls through to the static site
    // (public/index.html, and eventually the real tracker's HTML/CSS/JS).
    return env.ASSETS.fetch(request);
  },
};
