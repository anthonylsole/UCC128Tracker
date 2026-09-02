const MAX_SAMPLE_BYTES = 4 * 1024 * 1024; // 4MB

export function sampleKey(type, template) {
  return `${type}/${template}`;
}

export async function listSamples(env) {
  const listed = await env.SAMPLES.list();
  const items = listed.objects.map((o) => ({
    key: o.key,
    size: o.size,
    uploaded: o.uploaded,
  }));
  return Response.json(items);
}

export async function getSample(env, key) {
  const obj = await env.SAMPLES.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  if (obj.customMetadata && obj.customMetadata.filename) {
    headers.set("X-Filename", obj.customMetadata.filename);
  }
  return new Response(obj.body, { headers });
}

export async function putSample(env, key, request) {
  const contentType = request.headers.get("Content-Type") || "application/octet-stream";
  const filename = request.headers.get("X-Filename") || key;
  const buf = await request.arrayBuffer();
  if (buf.byteLength > MAX_SAMPLE_BYTES) {
    return Response.json({ error: "File too large (max 4MB)" }, { status: 413 });
  }
  await env.SAMPLES.put(key, buf, {
    httpMetadata: { contentType },
    customMetadata: { filename },
  });
  return Response.json({ ok: true, key, size: buf.byteLength });
}

export async function deleteSample(env, key) {
  await env.SAMPLES.delete(key);
  return Response.json({ ok: true });
}
