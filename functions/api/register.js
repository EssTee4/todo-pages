import { generateSalt, hashPassword } from './crypto.js';

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

  const salt = generateSalt();
  const password_hash = await hashPassword(password, salt);

  try {
    await env.DB.prepare('INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)').bind(username, password_hash, salt).run();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'User exists or DB error' }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' }});
}
