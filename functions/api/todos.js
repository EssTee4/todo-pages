export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id');
  if (!user_id) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 });

  const res = await env.DB.prepare('SELECT id, user_id, task, completed, status FROM todos WHERE user_id = ? ORDER BY id').bind(user_id).all();
  return new Response(JSON.stringify(res.results || []), { headers: { 'Content-Type': 'application/json' }});
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }
  const { user_id, task } = body || {};
  if (!user_id || !task) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });

  const r = await env.DB.prepare('INSERT INTO todos (user_id, task, completed, status) VALUES (?, ?, ?, ?)').bind(user_id, task, 0, 'todo').run();
  return new Response(JSON.stringify({ success: true, id: r.lastRowId }), { headers: { 'Content-Type': 'application/json' }});
}

export async function onRequestPut({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }
  const { id, user_id, task, completed, status } = body || {};
  if (!id || !user_id) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });

  await env.DB.prepare('UPDATE todos SET task=?, completed=?, status=? WHERE id=? AND user_id=?').bind(task, completed, status, id, user_id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
}

export async function onRequestDelete({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }
  const { id, user_id } = body || {};
  if (!id || !user_id) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });

  await env.DB.prepare('DELETE FROM todos WHERE id=? AND user_id=?').bind(id, user_id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
}
