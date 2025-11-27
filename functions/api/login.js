import { verifyPassword } from "../api/crypto.js";

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return json({ error: "Missing fields" }, 400);
    }

    const user = await env.DB
      .prepare("SELECT * FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (!user) return json({ error: "Invalid username or password" }, 400);

    const valid = await verifyPassword(password, user.password, user.salt);
    if (!valid) return json({ error: "Invalid username or password" }, 400);

    // create session token
    const token = crypto.randomUUID();

    // store session
    await env.DB
      .prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)")
      .bind(token, user.id)
      .run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // SESSION COOKIE
          "Set-Cookie": `session=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`
        }
      }
    );

  } catch (err) {
    return json({ error: "Server error", details: err.message }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
