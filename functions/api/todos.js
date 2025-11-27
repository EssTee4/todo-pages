// Helper to get session (returns session row { token, user_id } or null)
async function getSession(request, env) {
  const cookie = request.headers.get("Cookie") || request.headers.get("cookie") || "";
  const m = cookie.match(/session=([^;]+)/);
  if (!m) return null;
  const token = m[1];
  const s = await env.DB.prepare("SELECT token, user_id FROM sessions WHERE token = ?").bind(token).first();
  return s || null;
}

export async function onRequestGet({ request, env }) {
  try {
    const session = await getSession(request, env);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const rows = await env.DB
      .prepare("SELECT id, user_id, task, completed, status FROM todos WHERE user_id = ? ORDER BY id")
      .bind(session.user_id)
      .all();

    return json(rows.results || []);
  } catch (err) {
    console.error("todos GET error:", err);
    return json({ error: "Server error" }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const session = await getSession(request, env);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const body = await request.json().catch(() => null);
    if (!body || !body.task) return json({ error: "Missing fields" }, 400);

    const r = await env.DB
      .prepare("INSERT INTO todos (user_id, task, completed, status) VALUES (?, ?, 0, ?)")
      .bind(session.user_id, body.task, body.status ?? "todo")
      .run();

    return json({ success: true, id: r.lastRowId }, 201);
  } catch (err) {
    console.error("todos POST error:", err);
    return json({ error: "Server error" }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const session = await getSession(request, env);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const body = await request.json().catch(() => null);
    if (!body || typeof body.id === "undefined") return json({ error: "Missing fields" }, 400);

    await env.DB
      .prepare("UPDATE todos SET task = COALESCE(?, task), completed = COALESCE(?, completed), status = COALESCE(?, status) WHERE id = ? AND user_id = ?")
      .bind(body.task ?? null, body.completed ?? null, body.status ?? null, body.id, session.user_id)
      .run();

    return json({ success: true });
  } catch (err) {
    console.error("todos PUT error:", err);
    return json({ error: "Server error" }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const session = await getSession(request, env);
    if (!session) return json({ error: "Unauthorized" }, 401);

    const body = await request.json().catch(() => null);
    if (!body || typeof body.id === "undefined") return json({ error: "Missing fields" }, 400);

    await env.DB.prepare("DELETE FROM todos WHERE id = ? AND user_id = ?").bind(body.id, session.user_id).run();
    return json({ success: true });
  } catch (err) {
    console.error("todos DELETE error:", err);
    return json({ error: "Server error" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
