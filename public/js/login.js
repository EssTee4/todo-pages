// login.js - improved
(function () {
  const form = document.getElementById("loginForm");
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

  // theme toggle
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

    if (!username || !password) {
      showPopup("Enter username & password", "error");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const body = await res.json();
      if (!res.ok) {
        showPopup(body.error || "Login failed", "error");
        return;
      }

      showPopup("Login successful", "success");

      // IMPORTANT: use location.replace so the new navigation includes the cookie
      setTimeout(() => location.replace("/profile.html"), 500);
    } catch (err) {
      console.error(err);
      showPopup("Network error", "error");
    }
  });
})();
