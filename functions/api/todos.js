export async function onRequestGet({ request, env }) {
  const session = await getUser(request, env);
  if (!session) return htmlLogin();

  const res = await env.DB
    .prepare("SELECT * FROM todos WHERE user_id = ? ORDER BY id")
    .bind(session.user_id)
    .all();

  return json(res.results);
}

export async function onRequestPost({ request, env }) {
  const session = await getUser(request, env);
  if (!session) return htmlLogin();

  const { task } = await request.json();
  if (!task) return json({ error: "Missing task" }, 400);

  const result = await env.DB
    .prepare("INSERT INTO todos (user_id, task, completed, status) VALUES (?, ?, 0, 'todo')")
    .bind(session.user_id, task)
    .run();

  return json({ success: true, id: result.lastRowId });
}

export async function onRequestPut({ request, env }) {
  const session = await getUser(request, env);
  if (!session) return htmlLogin();

  const { status } = await request.json();
  const id = new URL(request.url).pathname.split("/").pop();

  await env.DB
    .prepare("UPDATE todos SET status = ? WHERE id = ? AND user_id = ?")
    .bind(status, id, session.user_id)
    .run();

  return json({ success: true });
}

export async function onRequestDelete({ request, env }) {
  const session = await getUser(request, env);
  if (!session) return htmlLogin();

  const id = new URL(request.url).pathname.split("/").pop();

  await env.DB
    .prepare("DELETE FROM todos WHERE id = ? AND user_id = ?")
    .bind(id, session.user_id)
    .run();

  return json({ success: true });
}

// helpers
async function getUser(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;

  const token = match[1];
  return await env.DB
    .prepare("SELECT * FROM sessions WHERE token = ?")
    .bind(token)
    .first();
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function htmlLogin() {
  return new Response("Redirecting...", {
    status: 302,
    headers: {
      "Location": "/login.html",
      "Content-Type": "text/html"
    }
  });
}
