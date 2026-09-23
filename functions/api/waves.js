// GET   /api/waves  -> [{wave, testStart, testEnd, prodStart, prodEnd, updatedAt}]
// PATCH /api/waves  body: {wave: "01. Wolford", testStart?: "2026-09-14" | null, ...}
//   Upserts the wave row and sets only the date fields included in the body.
//   null or "" clears that wave date. Line items in tracker_rows with an empty
//   date for a field inherit the wave's date for that field.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FIELDS = { testStart: 'test_start', testEnd: 'test_end', prodStart: 'prod_start', prodEnd: 'prod_end' };

function toApi(r) {
  return {
    wave: r.wave,
    testStart: r.test_start || '',
    testEnd: r.test_end || '',
    prodStart: r.prod_start || '',
    prodEnd: r.prod_end || '',
    updatedAt: r.updated_at || null,
  };
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT wave, test_start, test_end, prod_start, prod_end, updated_at FROM waves ORDER BY wave'
    ).all();
    return Response.json(results.map(toApi));
  } catch (err) {
    return Response.json({ error: 'Could not read waves (has migration 0002a been run?): ' + err.message }, { status: 500 });
  }
}

export async function onRequestPatch({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const wave = typeof body.wave === 'string' ? body.wave.trim() : '';
  if (!wave) return Response.json({ error: 'wave is required' }, { status: 400 });

  const cols = [];
  const vals = [];
  for (const [key, col] of Object.entries(FIELDS)) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === null || v === '') vals.push(null);
    else if (typeof v === 'string' && DATE_RE.test(v)) vals.push(v);
    else return Response.json({ error: `${key} must be YYYY-MM-DD, empty, or null` }, { status: 400 });
    cols.push(col);
  }
  if (!cols.length) return Response.json({ error: 'No date fields to update' }, { status: 400 });

  try {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO waves (wave) VALUES (?) ON CONFLICT(wave) DO NOTHING').bind(wave),
      env.DB.prepare(
        `UPDATE waves SET ${cols.map(c => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE wave = ?`
      ).bind(...vals, wave),
    ]);
    const row = await env.DB.prepare(
      'SELECT wave, test_start, test_end, prod_start, prod_end, updated_at FROM waves WHERE wave = ?'
    ).bind(wave).first();
    return Response.json(toApi(row));
  } catch (err) {
    return Response.json({ error: 'Could not save wave dates: ' + err.message }, { status: 500 });
  }
}
