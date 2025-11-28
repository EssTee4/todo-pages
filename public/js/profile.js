async function checkSession() {
  const res = await fetch("/api/me", { credentials: "include" });

  if (!res.ok) {
    window.location.href = "/login.html";
    return;
  }

  const data = await res.json();
  document.getElementById("welcome").textContent =
    "Welcome back, " + data.user.username;
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/login.html";
});

checkSession();
