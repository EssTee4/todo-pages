// profile.js - improved task add handling + theme toggle (vibrant dark mode)
(function () {
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");
  const greeting = document.getElementById("greeting");
  const welcomeSmall = document.getElementById("welcomeSmall");
  const taskList = document.getElementById("taskList");
  const newTaskInput = document.getElementById("newTaskInput");
  const addBtn = document.getElementById("addTaskBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const themeToggleBtn = document.getElementById("themeToggle");

  function showPopup(msg, type = "success") {
    popupText.textContent = msg;
    popup.className = `popup ${type} show`;
    popup.querySelector(".dot").style.background =
      type === "success" ? "var(--success)" : "var(--error)";
    setTimeout(() => popup.classList.remove("show"), 2800);
  }

  // theme toggle (vibrant)
  (function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");

    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = `<div class="theme-toggle"><div class="knob"></div></div>`;
      themeToggleBtn.style.border = "none";

      themeToggleBtn.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        localStorage.setItem(
          "theme",
          document.documentElement.classList.contains("dark") ? "dark" : "light"
        );
        const knob = themeToggleBtn.querySelector(".knob");
        knob.style.transform = document.documentElement.classList.contains(
          "dark"
        )
          ? "translateX(14px)"
          : "translateX(0)";
      });

      const knob = themeToggleBtn.querySelector(".knob");
      knob.style.transform = document.documentElement.classList.contains("dark")
        ? "translateX(14px)"
        : "translateX(0)";
    }
  })();

  async function checkSession() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.status === 401) return location.replace("/login.html");

      const data = await res.json();
      greeting.textContent = `Welcome back, ${data.user.username}!`;
      welcomeSmall.textContent = `Signed in as ${data.user.username}`;
      loadTasks();
    } catch {
      location.replace("/login.html");
    }
  }

  async function loadTasks() {
    try {
      const res = await fetch("/api/todos", { credentials: "include" });
      if (!res.ok) return;

      const data = await res.json();

      taskList.innerHTML = "";
      if (!data.length) {
        taskList.innerHTML = `<div class="small">No tasks yet — add one above.</div>`;
        return;
      }

      data.forEach((t) => {
        const el = document.createElement("div");
        el.className = "task-card fade-in";
        el.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><strong>${escapeHtml(t.task)}</strong></div>
            <div class="small">✱</div>
          </div>`;
        taskList.appendChild(el);
      });
    } catch (err) {
      console.error("loadTasks error:", err);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
  }

  // ⭐ FIXED HERE — your BIG bug
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const text = newTaskInput.value.trim();
      if (!text) return showPopup("Enter a task", "error");

      addBtn.disabled = true;
      const spinner = document.createElement("span");
      spinner.className = "spinner";
      addBtn.appendChild(spinner);

      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            task: text, // FIXED
            status: "pending", // FIXED
          }),
        });

        if (!res.ok) return showPopup("Failed to add task", "error");

        newTaskInput.value = "";
        showPopup("Task added", "success");

        await loadTasks();
      } catch (err) {
        console.error("network error:", err);
        showPopup("Network error — check console", "error");
      } finally {
        addBtn.disabled = false;
        spinner.remove();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      location.replace("/login.html");
    });
  }

  checkSession();
})();
