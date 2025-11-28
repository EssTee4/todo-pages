export async function getUserFromSession(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/session=([A-Za-z0-9\-]+)/);

  if (!match) return null;

  const token = match[1];

  const row = await env.DB.prepare(
    "SELECT user_id FROM sessions WHERE token = ?"
  )
    .bind(token)
    .first();

  return row ? row.user_id : null;
}
