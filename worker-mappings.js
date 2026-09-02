export async function listMappings(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, field_name, intraone_mapping, source_mapping, sort_order FROM label_mappings ORDER BY sort_order"
  ).all();
  return Response.json(
    results.map((r) => ({
      id: r.id,
      fieldName: r.field_name,
      intraoneMapping: r.intraone_mapping || "",
      sourceMapping: r.source_mapping || "",
      sortOrder: r.sort_order,
    }))
  );
}

export async function updateMapping(env, id, body) {
  const sets = [];
  const values = [];
  if (Object.prototype.hasOwnProperty.call(body, "fieldName")) {
    sets.push("field_name = ?");
    values.push(body.fieldName);
  }
  if (Object.prototype.hasOwnProperty.call(body, "intraoneMapping")) {
    sets.push("intraone_mapping = ?");
    values.push(body.intraoneMapping);
  }
  if (Object.prototype.hasOwnProperty.call(body, "sourceMapping")) {
    sets.push("source_mapping = ?");
    values.push(body.sourceMapping);
  }
  if (!sets.length) {
    return Response.json({ error: "No recognized fields in request body" }, { status: 400 });
  }
  values.push(id);
  const result = await env.DB.prepare(
    `UPDATE label_mappings SET ${sets.join(",")} WHERE id = ?`
  ).bind(...values).run();
  if (result.meta.changes === 0) {
    return Response.json({ error: "Mapping not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}

export async function bootstrapMappings(env, rows) {
  if (!Array.isArray(rows) || !rows.length) {
    return Response.json({ error: "Expected a non-empty array of fields" }, { status: 400 });
  }
  const existing = await env.DB.prepare("SELECT COUNT(*) as count FROM label_mappings").first();
  if (existing.count > 0) {
    return Response.json({ error: "label_mappings is not empty; bootstrap refused to avoid duplicating data" }, { status: 409 });
  }
  const stmts = rows.map((r, i) =>
    env.DB.prepare(
      "INSERT INTO label_mappings (field_name, intraone_mapping, source_mapping, sort_order) VALUES (?,?,?,?)"
    ).bind(r.fieldName, r.intraoneMapping || "", r.sourceMapping || "", i)
  );
  await env.DB.batch(stmts);
  return Response.json({ inserted: stmts.length });
}
