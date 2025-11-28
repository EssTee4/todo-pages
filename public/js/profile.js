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
    if (!popup || !popupText) return;
    popupText.textContent = msg;
    popup.className = `popup ${type} show`;
    const dot = popup.querySelector(".dot");
    if (dot)
      dot.style.background =
        type === "success" ? "var(--success)" : "var(--error)";
    setTimeout(() => popup.classList.remove("show"), 2800);
  }

  // theme toggle (vibrant)
  (function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
    // create a nicer toggle visual if element exists
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = `<div class="theme-toggle"><div class="knob"></div></div>`;
      themeToggleBtn.classList.add("theme-toggle-wrapper");
      themeToggleBtn.style.border = "none";
      themeToggleBtn.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        localStorage.setItem(
          "theme",
          document.documentElement.classList.contains("dark") ? "dark" : "light"
        );
        // animate knob by toggling transform
        const knob = themeToggleBtn.querySelector(".knob");
        if (knob) {
          knob.style.transform = document.documentElement.classList.contains(
            "dark"
          )
            ? "translateX(14px)"
            : "translateX(0)";
        }
      });
      // initialise knob position
      const initKnob = themeToggleBtn.querySelector(".knob");
      if (initKnob)
        initKnob.style.transform = document.documentElement.classList.contains(
          "dark"
        )
          ? "translateX(14px)"
          : "translateX(0)";
    }
  })();

  // Check session and greet user
  async function checkSession() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.status === 401) {
        location.replace("/login.html");
        return;
      }
      if (!res.ok) {
        console.warn("Unexpected /api/me response:", res.status);
        location.replace("/login.html");
        return;
      }
      const data = await res.json();
      if (!data || !data.logged_in || !data.user) {
        location.replace("/login.html");
        return;
      }
      greeting.textContent = `Welcome back, ${data.user.username}!`;
      if (welcomeSmall)
        welcomeSmall.textContent = `Signed in as ${data.user.username}`;
      loadTasks();
    } catch (err) {
      console.error("checkSession error:", err);
      location.replace("/login.html");
    }
  }

  // Load tasks (safe)
  async function loadTasks() {
    if (!taskList) return;
    try {
      const res = await fetch("/api/todos", { credentials: "include" });
      if (res.status === 401) {
        location.replace("/login.html");
        return;
      }
      if (!res.ok) {
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
        el.className = "task-card fade-in";
        el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>${escapeHtml(
            t.title || t.task || "Untitled"
          )}</strong><div class="small">${t.due || ""}</div></div>
          <div class="small">✱</div>
        </div>`;
        taskList.appendChild(el);
      });
    } catch (err) {
      console.error("loadTasks error:", err);
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

  // Add task with robust handling
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const text = ((newTaskInput && newTaskInput.value) || "").trim();
      if (!text) {
        showPopup("Enter a task", "error");
        return;
      }

      // disable + spinner
      addBtn.disabled = true;
      const spinner = document.createElement("span");
      spinner.className = "spinner";
      addBtn.appendChild(spinner);

      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: text }),
          credentials: "include",
        });

        // if server responded HTML it's probably a redirect (not JSON)
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
          let errMsg = "Failed to add task";
          try {
            if (ct.includes("application/json")) {
              const j = await res.json();
              errMsg = j.error || errMsg;
            } else {
              const t = await res.text();
              errMsg = t
                ? t.length > 200
                  ? t.slice(0, 200) + "..."
                  : t
                : errMsg;
            }
          } catch (e) {
            console.error("parsing error body:", e);
          }
          showPopup(errMsg, "error");
          return;
        }

        // success
        showPopup("Task added", "success");
        if (newTaskInput) newTaskInput.value = "";
        await loadTasks();
      } catch (err) {
        console.error("addTask network error:", err);
        showPopup("Network error while adding task — check console", "error");
      } finally {
        addBtn.disabled = false;
        if (spinner && spinner.parentNode)
          spinner.parentNode.removeChild(spinner);
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
      } catch (e) {
        console.error(e);
      }
      location.replace("/login.html");
    });
  }

  // start
  checkSession();
})();
