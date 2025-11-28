export const onRequestPost = async ({ env, request }) => {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie":
        "session=deleted; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    },
  });
};
