// profile.js — session, tasks, dark mode, drag/drop, multi-select & bulk delete
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

  // selection state
  const selectedIds = new Set();
  let deleteBtn = null; // will be created dynamically

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

  /* ------------------ DARK MODE ------------------ */

  (function initTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");

    if (darkSwitch) {
      darkSwitch.checked = document.documentElement.classList.contains("dark");

      darkSwitch.addEventListener("change", () => {
        const isDark = darkSwitch.checked;
        // smooth theme transition: add temporary class
        document.documentElement.classList.add("theme-transition");
        window.setTimeout(() => {
          document.documentElement.classList.remove("theme-transition");
        }, 500);

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

      // clear selection when reloading
      clearSelection();
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
    updateDeleteButtonVisibility();
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

    // drag events
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("dragend", onDragEnd);

    // selection: right-click toggles select, left-click + ctrl toggles select
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      toggleSelection(el);
      return false;
    });

    el.addEventListener("click", (e) => {
      // ctrl/cmd+click toggles selection
      if (e.ctrlKey || e.metaKey) {
        toggleSelection(el);
      }
    });

    return el;
  }

  function escapeHtml(t) {
    return String(t || "").replace(
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

  /* ------------------ SELECTION HELPERS ------------------ */

  function toggleSelection(cardEl) {
    if (!cardEl || !cardEl.dataset) return;
    const id = String(cardEl.dataset.id);
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
      cardEl.classList.remove("selected");
      cardEl.style.boxShadow = ""; // revert if we changed it
    } else {
      selectedIds.add(id);
      cardEl.classList.add("selected");
      // subtle highlight style (keep compatible with current theme)
      cardEl.style.boxShadow = "0 8px 30px rgba(0,0,0,0.15)";
    }
    updateDeleteButtonVisibility();
  }

  function clearSelection() {
    selectedIds.clear();
    const selected = document.querySelectorAll(".board-card.selected");
    selected.forEach((s) => {
      s.classList.remove("selected");
      s.style.boxShadow = "";
    });
    updateDeleteButtonVisibility();
  }

  function updateDeleteButtonVisibility() {
    if (!deleteBtn) createDeleteButtonIfNeeded();
    if (!deleteBtn) return;
    if (selectedIds.size > 0) {
      deleteBtn.style.display = "inline-block";
      deleteBtn.textContent = `Delete selected (${selectedIds.size})`;
    } else {
      deleteBtn.style.display = "none";
    }
  }

  function createDeleteButtonIfNeeded() {
    if (deleteBtn) return;
    // create and insert after the switch (or before logout)
    deleteBtn = document.createElement("button");
    deleteBtn.id = "deleteSelectedBtn";
    deleteBtn.title = "Delete selected tasks";
    deleteBtn.style.display = "none"; // hidden until selection
    deleteBtn.addEventListener("click", onDeleteSelected);
    // Try to insert into header right before logoutBtn
    if (logoutBtn && logoutBtn.parentNode) {
      logoutBtn.parentNode.insertBefore(deleteBtn, logoutBtn);
    } else {
      // fallback: append to header
      const header = document.querySelector(".header");
      if (header) header.appendChild(deleteBtn);
    }
  }

  async function onDeleteSelected() {
    if (selectedIds.size === 0) return;
    // simple confirm
    const ok = confirm(
      `Delete ${selectedIds.size} selected task(s)? This cannot be undone.`
    );
    if (!ok) return;

    // disable UI while deleting
    deleteBtn.disabled = true;
    const ids = Array.from(selectedIds);

    try {
      // perform parallel deletes
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/todos?id=${encodeURIComponent(id)}`, {
            method: "DELETE",
            credentials: "include",
          })
        )
      );

      // check for failures
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        showPopup("Some deletes failed — reloading tasks", "error");
      } else {
        showPopup("Deleted selected tasks", "success");
      }
    } catch (err) {
      console.error("bulk delete error:", err);
      showPopup("Network error deleting tasks", "error");
    } finally {
      deleteBtn.disabled = false;
      // reload to reflect authoritative state
      await loadTasks();
    }
  }

  /* ------------------ DRAG DROP ------------------ */

  function onDragStart(e) {
    // If item is part of selection, still set payload for that card only.
    // (Complex multi-drag isn't implemented; leave as single-card drag)
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
          const res = await fetch(`/api/todos?id=${encodeURIComponent(id)}`, {
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
      const text = (newTaskInput.value || "").trim();
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
          const err = await (async () => {
            try {
              const ct = res.headers.get("content-type") || "";
              if (ct.includes("application/json")) {
                const j = await res.json();
                return j.error || "Failed to add task";
              } else {
                return await res.text();
              }
            } catch {
              return "Failed to add task";
            }
          })();
          showPopup(err || "Failed to add task", "error");
        } else {
          newTaskInput.value = "";
          showPopup("Task added", "success");
          await loadTasks();
        }
      } catch (err) {
        console.error("add error:", err);
        showPopup("Network error", "error");
      } finally {
        addBtn.disabled = false;
        spinner.remove();
      }
    });
  }

  /* ------------------ LOGOUT ------------------ */

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

  /* ------------------ INIT ------------------ */

  // ensure delete button exists (hidden initially)
  createDeleteButtonIfNeeded();
  setupDropTargets();
  checkSession();

  // expose small helper for debugging (optional)
  window._todoSelectedIds = selectedIds;
})();
