export async function getUserFromSession(request, env) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);

  if (!match) return null;

  const token = match[1];

  const row = await env.DB
    .prepare("SELECT user_id FROM sessions WHERE token = ?")
    .bind(token)
    .first();

  if (!row) return null;

  return row.user_id;
}
