import { hashPassword } from './crypto.js';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }
  const username = body.username;
  const password = body.password;
  if (!username || !password) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });

  const row = await env.DB.prepare('SELECT id, password_hash, password_salt FROM users WHERE username = ?').bind(username).first();
  if (!row) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

  const attempt = await hashPassword(password, row.password_salt);
  if (attempt !== row.password_hash) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

  return new Response(JSON.stringify({ success: true, user_id: row.id }), { headers: { 'Content-Type': 'application/json' }});
}
