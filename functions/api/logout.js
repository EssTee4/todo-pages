export const onRequestPost = async ({ request, env }) => {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const m = cookie.match(/(?:^|;\s*)session=([A-Za-z0-9\-\_]+)/);
    if (m) {
      const token = m[1];
      await env.DB.prepare("DELETE FROM sessions WHERE token = ?")
        .bind(token)
        .run();
    }
  } catch (e) {
    console.error("logout cleanup:", e);
  }

  // Expire cookie
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie":
        "session=deleted; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    },
  });
};
