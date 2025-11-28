import { getUserFromSession } from "./_utils.js";

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const method = request.method;

  const user_id = await getUserFromSession(request, env);
  if (!user_id) {
    return new Response("Not logged in", { status: 401 });
  }

  // Extract ?id= from URL for PUT and DELETE
  const id = url.searchParams.get("id");

  // -----------------------
  // GET TASKS
  // -----------------------
  if (method === "GET") {
    const tasks = await env.DB.prepare("SELECT * FROM tasks WHERE user_id = ?")
      .bind(user_id)
      .all();

    return new Response(JSON.stringify(tasks.results), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // -----------------------
  // CREATE TASK (POST)
  // -----------------------
  if (method === "POST") {
    const { task } = await request.json();
    const status = "todo"; // default column

    const result = await env.DB.prepare(
      "INSERT INTO tasks (task, status, user_id) VALUES (?, ?, ?)"
    )
      .bind(task, status, user_id)
      .run();

    return new Response(
      JSON.stringify({ success: true, id: result.lastRowId }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // -----------------------
  // UPDATE TASK (PUT)
  // -----------------------
  if (method === "PUT") {
    if (!id) return new Response("Missing id", { status: 400 });

    const { status } = await request.json();

    await env.DB.prepare(
      "UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?"
    )
      .bind(status, id, user_id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // -----------------------
  // DELETE TASK
  // -----------------------
  if (method === "DELETE") {
    if (!id) return new Response("Missing id", { status: 400 });

    await env.DB.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
      .bind(id, user_id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Unsupported method", { status: 405 });
}
