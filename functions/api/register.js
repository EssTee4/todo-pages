import { generateSalt, hashPassword } from "./crypto.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "Invalid JSON" }, 400);

    const { username, password } = body;
    if (!username || !password) return json({ error: "Missing fields" }, 400);

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    await env.DB
      .prepare("INSERT INTO users (username, password, salt) VALUES (?, ?, ?)")
      .bind(username, passwordHash, salt)
      .run();

    return json({ success: true }, 201);
  } catch (e) {
    // Return DB error details in logs but generic message to client
    console.error("register error:", e);
    return json({ error: "User exists or DB error", details: e.message }, 400);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
