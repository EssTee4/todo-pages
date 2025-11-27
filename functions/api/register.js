export const onRequestPost = async ({ request, env }) => {
  const db = env.DB;

  try {
    const { username, password } = await request.json();

    const exists = await db
      .prepare("SELECT id FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (exists) {
      return new Response(JSON.stringify({ error: "User exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .bind(username, password)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Register error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
