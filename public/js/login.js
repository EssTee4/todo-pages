// Login client - session-only (cookie)
(function () {
  const form = document.getElementById("loginForm");
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");
  const themeButtons = document.querySelectorAll("#themeToggle");

  function showPopup(msg, type = "success") {
    popupText.textContent = msg;
    popup.className = `popup ${type} show`;
    popup.querySelector(".dot").style.background =
      type === "success" ? "var(--success)" : "var(--error)";
    setTimeout(() => popup.classList.remove("show"), 2400);
  }

  // theme toggle
  function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    }
    themeButtons.forEach((b) => b.addEventListener("click", toggleTheme));
  }
  function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  }
  initTheme();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      showPopup("Please enter username & password", "error");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showPopup(data.error || "Login failed", "error");
        return;
      }
      showPopup("Login successful", "success");
      // slight delay to allow the cookie to be set and animation to be seen
      setTimeout(() => (location.href = "/profile.html"), 600);
    } catch (err) {
      console.error(err);
      showPopup("Network error", "error");
    }
  });
})();
