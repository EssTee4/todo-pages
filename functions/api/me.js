import { getUserFromSession } from "./_utils";

export const onRequestGet = async ({ request, env }) => {
  try {
    const userId = await getUserFromSession(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ logged_in: false }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await env.DB.prepare(
      "SELECT id, username FROM users WHERE id = ?"
    )
      .bind(userId)
      .first();
    if (!user) {
      return new Response(JSON.stringify({ logged_in: false }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return a simple shape: { logged_in: true, user: { id, username } }
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
