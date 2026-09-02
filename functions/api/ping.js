export async function onRequestGet({ env }) {
  const result = await env.DB.prepare("SELECT COUNT(*) as count FROM tracker_rows").first();
  return Response.json({ status: "ok", rowCount: result.count });
}
