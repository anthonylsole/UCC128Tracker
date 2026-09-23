// Wave-level test/prod dates. Lines in tracker_rows with an empty date inherit
// their wave's date for that field; a non-empty line date is an override.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FIELDS = {
  testStart: "test_start",
  testEnd: "test_end",
  prodStart: "prod_start",
  prodEnd: "prod_end",
};

function toApi(r) {
  return {
    wave: r.wave,
    testStart: r.test_start || "",
    testEnd: r.test_end || "",
    prodStart: r.prod_start || "",
    prodEnd: r.prod_end || "",
    updatedAt: r.updated_at || null,
  };
}

export async function listWaves(env) {
  const { results } = await env.DB.prepare(
    "SELECT wave, test_start, test_end, prod_start, prod_end, updated_at FROM waves ORDER BY wave"
  ).all();
  return Response.json(results.map(toApi));
}

// body: { wave: "01. Wolford", testStart?: "2026-09-14" | "" | null, testEnd?, prodStart?, prodEnd? }
// Creates the wave row if it doesn't exist yet, then sets only the fields sent.
export async function updateWave(env, body) {
  const wave = body && typeof body.wave === "string" ? body.wave.trim() : "";
  if (!wave) {
    return Response.json({ error: "wave is required" }, { status: 400 });
  }

  const sets = [];
  const values = [];
  for (const [key, col] of Object.entries(FIELDS)) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const v = body[key];
    if (v === null || v === "") {
      values.push(null);
    } else if (typeof v === "string" && DATE_RE.test(v)) {
      values.push(v);
    } else {
      return Response.json({ error: `${key} must be YYYY-MM-DD, empty, or null` }, { status: 400 });
    }
    sets.push(`${col} = ?`);
  }
  if (!sets.length) {
    return Response.json({ error: "No recognized fields in request body" }, { status: 400 });
  }

  await env.DB.batch([
    env.DB.prepare("INSERT INTO waves (wave) VALUES (?) ON CONFLICT(wave) DO NOTHING").bind(wave),
    env.DB.prepare(
      `UPDATE waves SET ${sets.join(",")}, updated_at = datetime('now') WHERE wave = ?`
    ).bind(...values, wave),
  ]);

  const row = await env.DB.prepare(
    "SELECT wave, test_start, test_end, prod_start, prod_end, updated_at FROM waves WHERE wave = ?"
  ).bind(wave).first();
  return Response.json(toApi(row));
}
