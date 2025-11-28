// profile.js — Kanban board + drag/drop + session & add task handling
(function () {
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");
  const greeting = document.getElementById("greeting");
  const welcomeSmall = document.getElementById("welcomeSmall");
  const newTaskInput = document.getElementById("newTaskInput");
  const addBtn = document.getElementById("addTaskBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const themeToggleBtn = document.getElementById("themeToggle");
  const darkSwitch = document.getElementById("darkSwitch"); // new switch element

  const colPending = document.getElementById("col-pending");
  const colInProgress = document.getElementById("col-inprogress");
  const colCompleted = document.getElementById("col-completed");

  const counts = {
    pending: document.getElementById("count-pending"),
    inprogress: document.getElementById("count-inprogress"),
    completed: document.getElementById("count-completed"),
  };

  function showPopup(msg, type = "success") {
    if (!popup || !popupText) return;
    popupText.textContent = msg;
    popup.className = `popup ${type} show`;
    const dot = popup.querySelector(".dot");
    if (dot)
      dot.style.background =
        type === "success" ? "var(--success)" : "var(--error)";
    setTimeout(() => popup.classList.remove("show"), 2400);
  }

  // theme toggle — use switch if available, otherwise fallback to button behavior
  (function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");

    // If there's a real switch checkbox (#darkSwitch), use it
    if (darkSwitch) {
      darkSwitch.checked = document.documentElement.classList.contains("dark");
      darkSwitch.addEventListener("change", () => {
        const isDark = darkSwitch.checked;
        document.documentElement.classList.toggle("dark", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
      });
    } else if (themeToggleBtn) {
      // legacy fallback: keep the previous behavior for the button
      themeToggleBtn.innerHTML = `<div class="theme-toggle"><div class="knob"></div></div>`;
      themeToggleBtn.style.border = "none";

      themeToggleBtn.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        localStorage.setItem(
          "theme",
          document.documentElement.classList.contains("dark") ? "dark" : "light"
        );
        const knob = themeToggleBtn.querySelector(".knob");
        if (knob)
          knob.style.transform = document.documentElement.classList.contains(
            "dark"
          )
            ? "translateX(14px)"
            : "translateX(0)";
      });

      const knob = themeToggleBtn.querySelector(".knob");
      if (knob)
        knob.style.transform = document.documentElement.classList.contains(
          "dark"
        )
          ? "translateX(14px)"
          : "translateX(0)";
    }
  })();

  // --- session check ---
  async function checkSession() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.status === 401) return location.replace("/login.html");
      if (!res.ok) return location.replace("/login.html");
      const data = await res.json();
      if (!data || !data.logged_in || !data.user)
        return location.replace("/login.html");

      greeting.textContent = `Welcome back, ${data.user.username}!`;
      if (welcomeSmall)
        welcomeSmall.textContent = `Signed in as ${data.user.username}`;
      await loadTasks();
    } catch (err) {
      console.error("checkSession error:", err);
      location.replace("/login.html");
    }
  }

  // --- load tasks and render into columns ---
  async function loadTasks() {
    try {
      const res = await fetch("/api/todos", { credentials: "include" });
      if (!res.ok) {
        console.warn("Could not load tasks:", res.status);
        clearColumns();
        return;
      }
      const data = await res.json();
      renderTasks(data || []);
    } catch (err) {
      console.error("loadTasks error:", err);
      clearColumns();
    }
  }

  function clearColumns() {
    [colPending, colInProgress, colCompleted].forEach(
      (c) => (c.innerHTML = "")
    );
    updateCounts();
  }

  function renderTasks(tasks) {
    clearColumns();

    tasks.forEach((t) => {
      const status = (t.status || "pending").toLowerCase();
      const el = createTaskCard(t);
      if (status === "inprogress") colInProgress.appendChild(el);
      else if (status === "completed") colCompleted.appendChild(el);
      else colPending.appendChild(el);
    });

    updateCounts();
  }

  function updateCounts() {
    counts.pending.textContent = colPending.children.length;
    counts.inprogress.textContent = colInProgress.children.length;
    counts.completed.textContent = colCompleted.children.length;
  }

  function createTaskCard(task) {
    const el = document.createElement("div");
    el.className = "task-card board-card";
    el.draggable = true;
    el.dataset.id = task.id;
    el.dataset.status = task.status || "pending";

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><strong>${escapeHtml(task.task)}</strong><div class="small">${
      task.created_at || ""
    }</div></div>
        <div class="small">⋯</div>
      </div>
    `;

    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("dragend", onDragEnd);

    return el;
  }

  function escapeHtml(s) {
    return String(s || "").replace(
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

  // --- drag/drop handlers for columns ---
  function onDragStart(e) {
    const id = this.dataset.id;
    const status = this.dataset.status || "pending";
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, status }));
    e.dataTransfer.effectAllowed = "move";
    this.classList.add("dragging");
  }
  function onDragEnd(e) {
    this.classList.remove("dragging");
  }

  // columns accept drop
  function setupDropTargets() {
    const dropZones = document.querySelectorAll(".column-body");
    dropZones.forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("over");
        e.dataTransfer.dropEffect = "move";
      });
      zone.addEventListener("dragleave", () => zone.classList.remove("over"));
      zone.addEventListener("drop", async (e) => {
        e.preventDefault();
        zone.classList.remove("over");
        let payload;
        try {
          payload = JSON.parse(e.dataTransfer.getData("text/plain"));
        } catch (_) {
          return;
        }
        if (!payload || !payload.id) return;

        const id = payload.id;
        const newStatus = zone.dataset.status;

        const card = document.querySelector(`.board-card[data-id='${id}']`);
        if (card) {
          card.dataset.status = newStatus;
          zone.appendChild(card);
          updateCounts();
        }

        try {
          // <-- FIXED: use query param id= (matches single-file todos handler)
          const res = await fetch(`/api/todos?id=${encodeURIComponent(id)}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          if (!res.ok) {
            showPopup("Could not move task (server error)", "error");
            await loadTasks();
            return;
          }
          showPopup("Task moved", "success");
        } catch (err) {
          console.error("drag update error:", err);
          showPopup("Network error moving task", "error");
          await loadTasks();
        }
      });
    });
  }

  // --- add task ---
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const text = ((newTaskInput && newTaskInput.value) || "").trim();
      if (!text) {
        showPopup("Enter a task", "error");
        return;
      }

      addBtn.disabled = true;
      const spinner = document.createElement("span");
      spinner.className = "spinner";
      addBtn.appendChild(spinner);

      try {
        // send status pending so tasks appear in To-Do column
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ task: text, status: "pending" }),
        });

        if (!res.ok) {
          let errMsg = "Failed to add task";
          try {
            const ct = res.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
              const j = await res.json();
              errMsg = j.error || errMsg;
            } else {
              const t = await res.text();
              errMsg = t || errMsg;
            }
          } catch (e) {
            console.error("parse add error:", e);
          }
          showPopup(errMsg, "error");
          return;
        }

        newTaskInput.value = "";
        showPopup("Task added", "success");
        await loadTasks();
      } catch (err) {
        console.error("addTask network error:", err);
        showPopup("Network error while adding task — check console", "error");
      } finally {
        addBtn.disabled = false;
        spinner.remove();
      }
    });
  }

  // logout
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

  // init
  setupDropTargets();
  checkSession();
})();
