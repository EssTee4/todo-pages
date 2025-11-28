export const onRequestPost = async ({ request, env }) => {
  const db = env.DB;

  try {
    const { username, password, confirm } = await request.json();

    if (!username || !password || !confirm) {
      return Response.json({ error: "All fields required" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== confirm) {
      return Response.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const exists = await db
      .prepare("SELECT id FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (exists) {
      return Response.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    await db
      .prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .bind(username, password)
      .run();

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
};
