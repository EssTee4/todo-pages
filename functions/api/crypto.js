export function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return [...array].map(x => x.toString(16).padStart(2,'0')).join('');
}

export async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2,'0')).join('');
}
