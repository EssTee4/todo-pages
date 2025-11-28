export const onRequestPost = async ({ request, env }) => {
  try {
    const db = env.DB;
    const body = await request.json();
    const username = (body.username || "").trim();
    const password = body.password || "";
    const confirm = body.confirm || "";

    if (!username || !password || !confirm) {
      return new Response(JSON.stringify({ error: "All fields required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (password !== confirm) {
      return new Response(JSON.stringify({ error: "Passwords do not match" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const exists = await db
      .prepare("SELECT id FROM users WHERE username = ?")
      .bind(username)
      .first();
    if (exists) {
      return new Response(JSON.stringify({ error: "Username already taken" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .bind(username, password)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("register error", err);
    return new Response(JSON.stringify({ error: "Registration failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
