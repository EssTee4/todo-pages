// login.js - improved with dark mode switch
(function () {
  const form = document.getElementById("loginForm");
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");
  const darkSwitch = document.getElementById("darkSwitch");

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

  // dark mode switch init
  (function initTheme() {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    if (isDark) document.documentElement.classList.add("dark");

    if (darkSwitch) {
      darkSwitch.checked = isDark;
      darkSwitch.addEventListener("change", () => {
        const enabled = darkSwitch.checked;
        document.documentElement.classList.toggle("dark", enabled);
        localStorage.setItem("theme", enabled ? "dark" : "light");
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
        setTimeout(() => location.replace("/profile.html"), 500);
      } catch (err) {
        console.error("login error:", err);
        showPopup("Network error", "error");
      }
    });
  }
})();
