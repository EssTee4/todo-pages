export const onRequestGet = async () => {
  return new Response("Logged out", {
    headers: {
      "Set-Cookie": "session=; Path=/; HttpOnly; Max-Age=0; Secure; SameSite=Lax"
    }
  });
};
