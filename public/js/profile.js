// profile.js — session, tasks, dark mode, drag/drop

(function () {
  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");
  const greeting = document.getElementById("greeting");
  const welcomeSmall = document.getElementById("welcomeSmall");
  const newTaskInput = document.getElementById("newTaskInput");
  const addBtn = document.getElementById("addTaskBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const darkSwitch = document.getElementById("darkSwitch");

  const colPending = document.getElementById("col-pending");
  const colInProgress = document.getElementById("col-inprogress");
  const colCompleted = document.getElementById("col-completed");

  const counts = {
    pending: document.getElementById("count-pending"),
    inprogress: document.getElementById("count-inprogress"),
    completed: document.getElementById("count-completed"),
  };

  function showPopup(msg, type = "success") {
    popupText.textContent = msg;
    popup.className = `popup ${type} show`;

    const dot = popup.querySelector(".dot");
    if (dot)
      dot.style.background =
        type === "success" ? "var(--success)" : "var(--error)";

    setTimeout(() => popup.classList.remove("show"), 2400);
  }

  /* ------------------ DARK MODE ------------------ */

  (function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");

    if (darkSwitch) {
      darkSwitch.checked = document.documentElement.classList.contains("dark");

      darkSwitch.addEventListener("change", () => {
        const isDark = darkSwitch.checked;
        document.documentElement.classList.toggle("dark", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
      });
    }
  })();

  /* ------------------ SESSION ------------------ */

  async function checkSession() {
    try {
      const res = await fetch("/api/me", { credentials: "include" });

      if (res.status === 401) return location.replace("/login.html");

      const data = await res.json();
      if (!data.logged_in || !data.user) return location.replace("/login.html");

      greeting.textContent = `Welcome back, ${data.user.username}!`;
      welcomeSmall.textContent = `Signed in as ${data.user.username}`;

      await loadTasks();
    } catch {
      location.replace("/login.html");
    }
  }

  /* ------------------ LOAD TASKS ------------------ */

  async function loadTasks() {
    try {
      const res = await fetch("/api/todos", { credentials: "include" });
      const data = res.ok ? await res.json() : [];

      renderTasks(data || []);
    } catch {
      clearColumns();
    }
  }

  function clearColumns() {
    colPending.innerHTML = "";
    colInProgress.innerHTML = "";
    colCompleted.innerHTML = "";
    updateCounts();
  }

  function renderTasks(tasks) {
    clearColumns();

    tasks.forEach((t) => {
      const card = createTaskCard(t);
      const status = (t.status || "pending").toLowerCase();

      if (status === "inprogress") colInProgress.append(card);
      else if (status === "completed") colCompleted.append(card);
      else colPending.append(card);
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
        <div><strong>${escapeHtml(task.task)}</strong>
        <div class="small">${task.created_at || ""}</div></div>
        <div class="small">⋯</div>
      </div>
    `;

    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("dragend", onDragEnd);

    return el;
  }

  function escapeHtml(t) {
    return String(t).replace(
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

  /* ------------------ DRAG DROP ------------------ */

  function onDragStart(e) {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ id: this.dataset.id })
    );
    this.classList.add("dragging");
  }

  function onDragEnd() {
    this.classList.remove("dragging");
  }

  function setupDropTargets() {
    const zones = document.querySelectorAll(".column-body");

    zones.forEach((zone) => {
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("over");
      });

      zone.addEventListener("dragleave", () => zone.classList.remove("over"));

      zone.addEventListener("drop", async (e) => {
        e.preventDefault();
        zone.classList.remove("over");

        let payload;
        try {
          payload = JSON.parse(e.dataTransfer.getData("text/plain"));
        } catch {
          return;
        }

        const id = payload.id;
        const newStatus = zone.dataset.status;

        const card = document.querySelector(`.board-card[data-id='${id}']`);
        if (card) {
          card.dataset.status = newStatus;
          zone.appendChild(card);
          updateCounts();
        }

        try {
          const res = await fetch(`/api/todos?id=${id}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });

          if (!res.ok) {
            showPopup("Could not move task", "error");
            await loadTasks();
          } else {
            showPopup("Task moved", "success");
          }
        } catch {
          showPopup("Network error", "error");
          await loadTasks();
        }
      });
    });
  }

  /* ------------------ ADD TASK ------------------ */

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
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: text, status: "pending" }),
        });

        if (!res.ok) {
          const err = await res.text();
          showPopup(err || "Failed to add task", "error");
        } else {
          newTaskInput.value = "";
          showPopup("Task added", "success");
          await loadTasks();
        }
      } finally {
        addBtn.disabled = false;
        spinner.remove();
      }
    });
  }

  /* ------------------ LOGOUT ------------------ */

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      location.replace("/login.html");
    });
  }

  /* ------------------ INIT ------------------ */

  setupDropTargets();
  checkSession();
})();
