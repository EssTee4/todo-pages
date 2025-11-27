import { generateSalt, hashPassword } from "./crypto.js";

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) return json({ error: "Missing fields" }, 400);

    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    await env.DB
      .prepare("INSERT INTO users (username, password, salt) VALUES (?, ?, ?)")
      .bind(username, hash, salt)
      .run();

    return json({ success: true });

  } catch (e) {
    return json({ error: "User exists or DB error", details: e.message }, 400);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
