// register.js
(function () {
  const form = document.getElementById("registerForm");
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");
  const themeToggle = document.getElementById("themeToggle");

  function showPopup(msg, type = "success") {
    popupText.textContent = msg;
    popup.className = `popup ${type} show`;
    popup.querySelector(".dot").style.background =
      type === "success" ? "var(--success)" : "var(--error)";
    setTimeout(() => popup.classList.remove("show"), 2600);
  }

  (function () {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    if (themeToggle)
      themeToggle.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        localStorage.setItem(
          "theme",
          document.documentElement.classList.contains("dark") ? "dark" : "light"
        );
      });
  })();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm_password").value;

    if (!username || !password || !confirm) {
      showPopup("Fill all fields", "error");
      return;
    }
    if (password.length < 8) {
      showPopup("Password must be at least 8 chars", "error");
      return;
    }
    if (password !== confirm) {
      showPopup("Passwords do not match", "error");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, confirm }),
        credentials: "include",
      });
      const body = await res.json();
      if (!res.ok) {
        showPopup(body.error || "Registration failed", "error");
        return;
      }

      showPopup("Account created", "success");
      setTimeout(() => location.replace("/login.html"), 700);
    } catch (err) {
      console.error(err);
      showPopup("Network error", "error");
    }
  });
})();
