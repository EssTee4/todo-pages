// helper to get user_id from session cookie
export async function getUserFromSession(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)session=([A-Za-z0-9\-\_]+)/);
  if (!m) return null;
  const token = m[1];
  const row = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE token = ?"
  )
    .bind(token)
    .first();
  return row ? row.user_id : null;
}
