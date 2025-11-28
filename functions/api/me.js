export const onRequestGet = async ({ request, env }) => {
  try {
    const db = env.DB;

    // Read cookie
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/session=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
      return new Response(JSON.stringify({ logged_in: false }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lookup session
    const session = await db
      .prepare("SELECT user_id FROM sessions WHERE token = ?")
      .bind(token)
      .first();

    if (!session) {
      return new Response(JSON.stringify({ logged_in: false }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Lookup user
    const user = await db
      .prepare("SELECT id, username FROM users WHERE id = ?")
      .bind(session.user_id)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ logged_in: false }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ logged_in: true, user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("me error", err);
    return new Response(JSON.stringify({ logged_in: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
