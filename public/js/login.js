document.getElementById("loginBtn").addEventListener("click", loginUser);

async function loginUser() {
  const username = username.value.trim();
  const password = password.value.trim();

  if (!username || !password) {
    return showPopup("Enter username & password", "error");
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      showPopup(data.error, "error");
      return;
    }

    showPopup("Login successful!", "success");

    setTimeout(() => {
      window.location.href = "/profile.html";
    }, 700);
  } catch (err) {
    showPopup("Network error", "error");
  }
}
