// Maps the frontend's camelCase field names to the database's snake_case columns.
const FIELD_MAP = {
  account: "account",
  customer: "customer",
  wave: "wave",
  template: "template",
  testStart: "test_start",
  testEnd: "test_end",
  prodStart: "prod_start",
  prodEnd: "prod_end",
  testingRequired: "testing_required",
  testResource: "test_resource",
  opsReviewer: "ops_reviewer",
  status: "status",
  approvalScope: "approval_scope",
  testPOs: "test_pos",
  notes: "notes",
};
const COLUMNS = ["id", ...Object.values(FIELD_MAP)];

function rowToJson(dbRow) {
  const out = { id: dbRow.id };
  for (const [jsKey, col] of Object.entries(FIELD_MAP)) {
    out[jsKey] = dbRow[col] ?? "";
  }
  if (!out.status) out.status = "Not Started";
  if (!out.approvalScope) out.approvalScope = "This Combo Only";
  return out;
}

export async function listRows(env) {
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS.join(",")} FROM tracker_rows ORDER BY account`
  ).all();
  return Response.json(results.map(rowToJson));
}

export async function createRow(env, body) {
  const id = crypto.randomUUID();
  const values = COLUMNS.map((col) => {
    if (col === "id") return id;
    const jsKey = Object.keys(FIELD_MAP).find((k) => FIELD_MAP[k] === col);
    return body[jsKey] ?? (col === "status" ? "Not Started" : col === "approval_scope" ? "This Combo Only" : "");
  });
  const placeholders = COLUMNS.map(() => "?").join(",");
  await env.DB.prepare(
    `INSERT INTO tracker_rows (${COLUMNS.join(",")}) VALUES (${placeholders})`
  ).bind(...values).run();
  return Response.json({ id }, { status: 201 });
}

export async function updateRow(env, id, body) {
  const sets = [];
  const values = [];
  for (const [jsKey, col] of Object.entries(FIELD_MAP)) {
    if (Object.prototype.hasOwnProperty.call(body, jsKey)) {
      sets.push(`${col} = ?`);
      values.push(body[jsKey]);
    }
  }
  if (!sets.length) {
    return Response.json({ error: "No recognized fields in request body" }, { status: 400 });
  }
  values.push(id);
  const result = await env.DB.prepare(
    `UPDATE tracker_rows SET ${sets.join(",")} WHERE id = ?`
  ).bind(...values).run();
  if (result.meta.changes === 0) {
    return Response.json({ error: "Row not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}

export async function bootstrapRows(env, rows) {
  if (!Array.isArray(rows) || !rows.length) {
    return Response.json({ error: "Expected a non-empty array of rows" }, { status: 400 });
  }
  const existing = await env.DB.prepare("SELECT COUNT(*) as count FROM tracker_rows").first();
  if (existing.count > 0) {
    return Response.json({ error: "tracker_rows is not empty; bootstrap refused to avoid duplicating data" }, { status: 409 });
  }
  const placeholders = COLUMNS.map(() => "?").join(",");
  const stmts = rows.map((r) => {
    const id = crypto.randomUUID();
    const values = COLUMNS.map((col) => {
      if (col === "id") return id;
      const jsKey = Object.keys(FIELD_MAP).find((k) => FIELD_MAP[k] === col);
      return r[jsKey] ?? (col === "status" ? "Not Started" : col === "approval_scope" ? "This Combo Only" : "");
    });
    return env.DB.prepare(`INSERT INTO tracker_rows (${COLUMNS.join(",")}) VALUES (${placeholders})`).bind(...values);
  });
  await env.DB.batch(stmts);
  return Response.json({ inserted: stmts.length });
}
