export const onRequestPost = async ({ request, env }) => {
  try {
    const db = env.DB;
    const body = await request.json();
    const username = (body.username || "").trim();
    const password = body.password || "";

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Missing username or password" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await db
      .prepare("SELECT id, password FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (!user || user.password !== password) {
      return new Response(
        JSON.stringify({ error: "Invalid username or password" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = crypto.randomUUID();

    await db
      .prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)")
      .bind(token, user.id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // cookie — HttpOnly so JS can't read it. Secure is fine on Cloudflare Pages (HTTPS).
        "Set-Cookie": `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  } catch (err) {
    console.error("login error", err);
    return new Response(JSON.stringify({ error: "Login failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
