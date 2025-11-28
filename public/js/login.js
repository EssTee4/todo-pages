// login.js - improved
(function () {
  const form = document.getElementById("loginForm");
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");
  const themeToggle = document.getElementById("themeToggle");

  function showPopup(msg, type = "success") {
    if (!popup) return;
    popupText.textContent = msg;
    popup.className = `popup ${type} show`;
    const dot = popup.querySelector(".dot");
    if (dot)
      dot.style.background =
        type === "success" ? "var(--success)" : "var(--error)";
    setTimeout(() => popup.classList.remove("show"), 2800);
  }

  // theme init + visual
  (function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    if (themeToggle) {
      themeToggle.innerHTML = `<div class="theme-toggle"><div class="knob"></div></div>`;
      const knob = themeToggle.querySelector(".knob");
      if (knob)
        knob.style.transform = document.documentElement.classList.contains(
          "dark"
        )
          ? "translateX(14px)"
          : "translateX(0)";
      themeToggle.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        localStorage.setItem(
          "theme",
          document.documentElement.classList.contains("dark") ? "dark" : "light"
        );
        if (knob)
          knob.style.transform = document.documentElement.classList.contains(
            "dark"
          )
            ? "translateX(14px)"
            : "translateX(0)";
      });
    }
  })();

  if (form) {
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
        // use replace to ensure cookie is included on next navigation
        setTimeout(() => location.replace("/profile.html"), 500);
      } catch (err) {
        console.error("login network error:", err);
        showPopup("Network error", "error");
      }
    });
  }
})();
