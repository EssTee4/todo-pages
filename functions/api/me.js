import { getUserFromSession } from "./_utils";

export const onRequestGet = async ({ request, env }) => {
  const userId = await getUserFromSession(request, env);

  if (!userId) {
    return Response.json({ logged_in: false }, { status: 401 });
  }

  const user = await env.DB.prepare(
    "SELECT id, username FROM users WHERE id = ?"
  )
    .bind(userId)
    .first();

  return Response.json({ logged_in: true, user });
};
