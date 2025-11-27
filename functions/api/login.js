import { verifyPassword } from "../api/crypto.js";

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const stmt = env.DB.prepare("SELECT * FROM users WHERE username = ?");
    const user = await stmt.bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid username or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const isValid = await verifyPassword(password, user.password, user.salt);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid username or password" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user_id: user.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
