import { getUserFromSession } from "./_utils";

export async function onRequestGet({ request, env }) {
  const user_id = await getUserFromSession(request, env);
  if (!user_id)
    return Response.redirect("/login.html", 302);

  const tasks = await env.DB
    .prepare("SELECT * FROM tasks WHERE user_id = ?")
    .bind(user_id)
    .all();

  return new Response(JSON.stringify(tasks.results), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost({ request, env }) {
  const user_id = await getUserFromSession(request, env);
  if (!user_id) return Response.redirect("/login.html", 302);

  const { task, status } = await request.json();

  const result = await env.DB
    .prepare("INSERT INTO tasks (task, status, user_id) VALUES (?, ?, ?)")
    .bind(task, status, user_id)
    .run();

  return new Response(
    JSON.stringify({ success: true, id: result.lastRowId }),
    { headers: { "Content-Type": "application/json" } }
  );
}

export async function onRequestPut({ request, env, params }) {
  const user_id = await getUserFromSession(request, env);
  if (!user_id) return Response.redirect("/login.html", 302);

  const { status } = await request.json();

  const id = params.id;

  await env.DB
    .prepare("UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?")
    .bind(status, id, user_id)
    .run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestDelete({ request, env, params }) {
  const user_id = await getUserFromSession(request, env);
  if (!user_id) return Response.redirect("/login.html", 302);

  const id = params.id;

  await env.DB
    .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .bind(id, user_id)
    .run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
