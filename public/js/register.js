document.getElementById("registerBtn").addEventListener("click", registerUser);

async function registerUser() {
  const username = username.value.trim();
  const password = password.value.trim();
  const confirm = confirm_password.value.trim();

  if (!username || !password || !confirm) {
    return showPopup("Fill all fields", "error");
  }

  if (password.length < 8) {
    return showPopup("Password must be at least 8 characters", "error");
  }

  if (password !== confirm) {
    return showPopup("Passwords do not match", "error");
  }

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password, confirm }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      showPopup(data.error, "error");
      return;
    }

    showPopup("Registration successful!", "success");

    setTimeout(() => {
      window.location.href = "/login.html";
    }, 700);
  } catch (err) {
    showPopup("Network error", "error");
  }
}
