// Profile page: checks session via /api/me, greets user, shows simple tasks UI.
// You likely have a /api/todos already; this uses a minimal UI to show tasks if present.
(function () {
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");
  const greeting = document.getElementById("greeting");
  const welcomeSmall = document.getElementById("welcomeSmall");
  const taskList = document.getElementById("taskList");
  const newTaskInput = document.getElementById("newTaskInput");
  const addBtn = document.getElementById("addTaskBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const themeButtons = document.querySelectorAll("#themeToggle");

  function showPopup(msg, type = "success") {
    popupText.textContent = msg;
    popup.className = `popup ${type} show`;
    popup.querySelector(".dot").style.background =
      type === "success" ? "var(--success)" : "var(--error)";
    setTimeout(() => popup.classList.remove("show"), 2600);
  }

  // theme init
  (function () {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    themeButtons.forEach((b) =>
      b.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        localStorage.setItem(
          "theme",
          document.documentElement.classList.contains("dark") ? "dark" : "light"
        );
      })
    );
  })();

  async function checkSession() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) {
        location.href = "/login.html";
        return;
      }
      const data = await res.json();
      greeting.textContent = `Welcome back, ${data.user.username}!`;
      welcomeSmall.textContent = `Signed in as ${data.user.username}`;
      // load tasks if endpoint exists
      loadTasks();
    } catch (e) {
      console.error(e);
      location.href = "/login.html";
    }
  }

  async function loadTasks() {
    try {
      const res = await fetch("/api/todos", { credentials: "include" });
      if (!res.ok) {
        // If /api/todos doesn't exist or returns HTML redirect to login, handle gracefully
        if (
          res.headers &&
          res.headers.get &&
          res.headers.get("content-type") &&
          res.headers.get("content-type").includes("text/html")
        ) {
          location.href = "/login.html";
          return;
        }
        // no tasks endpoint: just show empty state
        taskList.innerHTML = `<div class="small">No tasks to display.</div>`;
        return;
      }
      const data = await res.json();
      taskList.innerHTML = "";
      if (!Array.isArray(data) || data.length === 0) {
        taskList.innerHTML = `<div class="small">No tasks yet — add one above.</div>`;
        return;
      }
      data.forEach((t) => {
        const el = document.createElement("div");
        el.className = "task-card";
        el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>${escapeHtml(
            t.title || t.task || "Untitled"
          )}</strong><div class="small">${t.due || ""}</div></div>
          <div class="small">✱</div>
        </div>`;
        taskList.appendChild(el);
      });
    } catch (err) {
      console.error(err);
      taskList.innerHTML = `<div class="small">Could not load tasks.</div>`;
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

  addBtn.addEventListener("click", async () => {
    const text = newTaskInput.value.trim();
    if (!text) {
      showPopup("Enter a task", "error");
      return;
    }
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text }),
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        showPopup(d.error || "Failed to add", "error");
        return;
      }
      newTaskInput.value = "";
      showPopup("Task added", "success");
      loadTasks();
    } catch (e) {
      console.error(e);
      showPopup("Network error", "error");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } finally {
      // ensure redirect
      location.href = "/login.html";
    }
  });

  checkSession();
})();
