import { verifyPassword } from "./crypto.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "Invalid JSON" }, 400);

    const { username, password } = body;
    if (!username || !password) return json({ error: "Missing fields" }, 400);

    const user = await env.DB
      .prepare("SELECT id, username, password, salt FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (!user) return json({ error: "Invalid username or password" }, 400);

    const ok = await verifyPassword(password, user.password, user.salt);
    if (!ok) return json({ error: "Invalid username or password" }, 400);

    // create session token and store it
    const token = crypto.randomUUID();

    await env.DB
      .prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)")
      .bind(token, user.id)
      .run();

    // Set cookie — Pages uses HTTPS, so Secure + SameSite=None is OK.
    // HttpOnly prevents JS access (safer). Path=/ so cookie is sent to /api/*
    const cookie = `session=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000`;

    return new Response(JSON.stringify({ success: true, user_id: user.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie
      }
    });

  } catch (err) {
    console.error("login error:", err);
    return json({ error: "Server error", details: err.message }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
