import { v4 as uuid } from "uuid";

export const onRequestPost = async ({ request, env }) => {
  const db = env.DB;

  try {
    const { username, password } = await request.json();

    const user = await db
      .prepare("SELECT id, password FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (!user) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (user.password !== password) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = uuid();

    await db
      .prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)")
      .bind(token, user.id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  } catch (e) {
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
};
