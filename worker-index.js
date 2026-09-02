import { listRows, createRow, updateRow, bootstrapRows, bulkUpdateRows } from "./rows.js";
import { listMappings, updateMapping, bootstrapMappings } from "./mappings.js";
import { sampleKey, listSamples, getSample, putSample, deleteSample } from "./samples.js";
import { checkAuth, unauthorizedResponse } from "./auth.js";

export default {
  async fetch(request, env, ctx) {
    if (!checkAuth(request, env)) {
      return unauthorizedResponse();
    }

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

      if (path === "/api/mappings" && method === "GET") {
        return await listMappings(env);
      }
      if (path === "/api/mappings/bootstrap" && method === "POST") {
        const body = await request.json();
        return await bootstrapMappings(env, body);
      }
      if (path.startsWith("/api/mappings/") && method === "PATCH") {
        const id = Number(path.slice("/api/mappings/".length));
        const body = await request.json();
        return await updateMapping(env, id, body);
      }

      if (path === "/api/samples" && method === "GET") {
        return await listSamples(env);
      }
      const sampleMatch = path.match(/^\/api\/samples\/(movex|intraone)\/(.+)$/);
      if (sampleMatch) {
        const [, type, encodedTemplate] = sampleMatch;
        const template = decodeURIComponent(encodedTemplate);
        const key = sampleKey(type, template);
        if (method === "GET") return await getSample(env, key);
        if (method === "PUT") return await putSample(env, key, request);
        if (method === "DELETE") return await deleteSample(env, key);
      }

      // Anything that isn't an API route falls through to the static site.
      return env.ASSETS.fetch(request);
    } catch (err) {
      return Response.json({ error: String(err && err.message || err) }, { status: 500 });
    }
  },
};


