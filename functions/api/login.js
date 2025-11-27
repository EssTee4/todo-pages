import { v4 as uuid } from "uuid";

export const onRequestPost = async ({ request, env }) => {
  const db = env.DB;

  try {
    const { username, password } = await request.json();

    const user = await db
      .prepare("SELECT * FROM users WHERE username = ? AND password = ?")
      .bind(username, password)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // create new session token
    const token = uuid();

    await db
      .prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)")
      .bind(token, user.id)
      .run();

    return new Response(JSON.stringify({ success: true, user_id: user.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie":
          `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Login failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
