// Profile page: checks session via /api/me, greets user, shows tasks UI.
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

  // ---------------------------------------
  // POPUP
  // ---------------------------------------
  function showPopup(msg, type = "success") {
    popupText.textContent = msg;
    popup.className = `popup ${type} show`;
    popup.querySelector(".dot").style.background =
      type === "success" ? "var(--success)" : "var(--error)";
    setTimeout(() => popup.classList.remove("show"), 2600);
  }

  // ---------------------------------------
  // DARK MODE INIT
  // ---------------------------------------
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

  // ---------------------------------------
  // SESSION CHECK - FIXED
  // ---------------------------------------
  async function checkSession() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });

      if (res.status === 401) {
        location.href = "/login.html";
        return;
      }

      const data = await res.json();

      // FIXED: /api/me returns { logged_in: true, username: "xxx" }
      if (!data.logged_in) {
        location.href = "/login.html";
        return;
      }

      greeting.textContent = `Welcome back, ${data.username}!`;
      welcomeSmall.textContent = `Signed in as ${data.username}`;

      // Load tasks
      loadTasks();
    } catch (e) {
      console.error("SESSION ERR:", e);
      location.href = "/login.html";
    }
  }

  // ---------------------------------------
  // LOAD TASKS
  // ---------------------------------------
  async function loadTasks() {
    try {
      const res = await fetch("/api/todos", { credentials: "include" });

      if (res.status === 401) {
        location.href = "/login.html";
        return;
      }

      if (!res.ok) {
        taskList.innerHTML = `<div class="small">Could not load tasks.</div>`;
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
        el.className = "task-card fade-in";

        el.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <strong>${escapeHtml(t.title || "Untitled")}</strong>
              <div class="small">${t.due || ""}</div>
            </div>
            <div class="small">✱</div>
          </div>
        `;

        taskList.appendChild(el);
      });
    } catch (err) {
      console.error(err);
      taskList.innerHTML = `<div class="small">Could not load tasks.</div>`;
    }
  }

  // ---------------------------------------
  // ESCAPE HTML
  // ---------------------------------------
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

  // ---------------------------------------
  // ADD TASK
  // ---------------------------------------
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
        showPopup(d.error || "Failed to add task", "error");
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

  // ---------------------------------------
  // LOGOUT
  // ---------------------------------------
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } finally {
      location.href = "/login.html";
    }
  });

  // ---------------------------------------
  // START
  // ---------------------------------------
  checkSession();
})();
