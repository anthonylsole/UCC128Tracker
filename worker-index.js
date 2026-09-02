import { listRows, createRow, updateRow, bootstrapRows, bulkUpdateRows } from "./rows.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      if (path === "/api/ping" && method === "GET") {
        const result = await env.DB.prepare("SELECT COUNT(*) as count FROM tracker_rows").first();
        return Response.json({ status: "ok", rowCount: result.count });
      }

      if (path === "/api/rows" && method === "GET") {
        return await listRows(env);
      }
      if (path === "/api/rows" && method === "POST") {
        const body = await request.json();
        return await createRow(env, body);
      }
      if (path.startsWith("/api/rows/") && method === "PATCH") {
        const id = decodeURIComponent(path.slice("/api/rows/".length));
        const body = await request.json();
        return await updateRow(env, id, body);
      }
      if (path === "/api/bootstrap" && method === "POST") {
        const body = await request.json();
        return await bootstrapRows(env, body);
      }
      if (path === "/api/rows/bulk-update" && method === "POST") {
        const body = await request.json();
        return await bulkUpdateRows(env, body);
      }

      // Anything that isn't an API route falls through to the static site.
      return env.ASSETS.fetch(request);
    } catch (err) {
      return Response.json({ error: String(err && err.message || err) }, { status: 500 });
    }
  },
};

