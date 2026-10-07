(function () {
  "use strict";
  const STORAGE_KEY = "internship-os-v1";
  const STATUSES = [
    { id: "saved", title: "Saved", label: "Saved" },
    { id: "applied", title: "Applied", label: "Applied" },
    { id: "interview", title: "Interview", label: "Interview" },
    { id: "offer", title: "Offer", label: "Offer" },
    { id: "closed", title: "Closed", label: "Closed" },
  ];
  let jobs = loadJobs();
  let currentView = "board";
  let savedOnly = false;
  let toastTimer;

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const board = $("#board");
  const listWrap = $("#list-wrap");
  const emptyState = $("#empty-state");
  const jobModal = $("#job-modal");
  const form = $("#job-form");
  const toast = $("#toast");

  function loadJobs() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(stored) ? stored.filter((job) => job && job.id && job.title && job.company) : [];
    } catch (error) {
      console.warn("Could not read saved opportunities:", error);
      return [];
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
      return true;
    } catch (error) {
      console.error("Could not save opportunities:", error);
      showToast("Could not save. Check your browser storage settings.");
      return false;
    }
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(date);
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function relativeDate(dateString) {
    if (!dateString) return "";
    const target = new Date(`${dateString}T00:00:00`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const delta = Math.round((target - today) / 86400000);
    if (delta < 0) return `${Math.abs(delta)}d overdue`;
    if (delta === 0) return "Today";
    if (delta === 1) return "Tomorrow";
    return `In ${delta} days`;
  }

  function normalized(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

  function hasDuplicate(candidate, excludeId = null) {
    const candidateUrl = safeUrl(candidate.url);
    return jobs.some((job) => {
      if (job.id === excludeId) return false;
      const sameUrl = candidateUrl && safeUrl(job.url) && candidateUrl.replace(/\/$/, "") === safeUrl(job.url).replace(/\/$/, "");
      const sameRole = normalized(job.title) === normalized(candidate.title) && normalized(job.company) === normalized(candidate.company);
      return Boolean(sameUrl || (sameRole && candidate.title && candidate.company));
    });
  }

  function initials(company) { return String(company || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }

  function updateSummary() {
    const active = jobs.filter((job) => job.status !== "closed");
    const today = localDateKey();
    const followups = active.filter((job) => job.followUp && job.followUp <= today);
    $("#stat-total").textContent = jobs.length;
    $("#stat-progress").textContent = jobs.filter((job) => ["applied", "interview", "offer"].includes(job.status)).length;
    $("#stat-interviews").textContent = jobs.filter((job) => job.status === "interview").length;
    $("#stat-followups").textContent = followups.length;
    $("#nav-total").textContent = jobs.length;
    $("#follow-nav-dot").style.display = followups.length ? "block" : "none";
  }

  function getVisibleJobs() {
    const query = normalized($("#search-input").value);
    let visible = jobs.filter((job) => {
      if (savedOnly && job.status !== "saved") return false;
      const content = normalized([job.title, job.company, job.location, job.resume, job.notes].join(" "));
      return !query || content.includes(query);
    });
    const sort = $("#sort-select").value;
    if (sort === "company") visible.sort((a, b) => a.company.localeCompare(b.company));
    else if (sort === "followup") visible.sort((a, b) => (a.followUp || "9999").localeCompare(b.followUp || "9999"));
    else visible.sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
    return visible;
  }

  function renderCard(job) {
    const safeLink = safeUrl(job.url);
    const meta = [];
    if (job.location) meta.push(`<span class="meta-pill">⌖ ${escapeHtml(job.location)}</span>`);
    if (job.deadline) meta.push(`<span class="meta-pill deadline-pill">◷ ${escapeHtml(formatDate(job.deadline))}</span>`);
    if (job.followUp) meta.push(`<span class="meta-pill followup-pill">↗ ${escapeHtml(relativeDate(job.followUp))}</span>`);
    return `<article class="job-card" data-open-job="${escapeHtml(job.id)}" tabindex="0" aria-label="View ${escapeHtml(job.title)} at ${escapeHtml(job.company)}">
      <div class="job-card-top"><div class="company-mark">${escapeHtml(initials(job.company))}</div><button class="card-menu" data-menu="${escapeHtml(job.id)}" aria-label="Opportunity actions" aria-haspopup="true">···</button></div>
      <h3 class="job-title">${safeLink ? `<a class="card-title-link" href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(job.title)}</a>` : escapeHtml(job.title)}</h3>
      <p class="job-company">${escapeHtml(job.company)}</p>
      ${meta.length ? `<div class="job-meta">${meta.join("")}</div>` : ""}
      <div class="card-footer"><span>${escapeHtml(formatDate((job.createdAt || "").slice(0, 10)) || "Added recently")}</span><span class="resume-tag" title="${escapeHtml(job.resume || "No resume note")}">${job.resume ? `▤ ${escapeHtml(job.resume)}` : "＋ Add a note"}</span></div>
    </article>`;
  }

  function renderBoard(visible) {
    board.innerHTML = STATUSES.map((status) => {
      const items = visible.filter((job) => job.status === status.id);
      return `<section class="board-column" data-status="${status.id}"><div class="column-heading">${status.title}<span class="column-count">${items.length}</span></div><div class="column-rail" data-drop-status="${status.id}">${items.length ? items.map(renderCard).join("") : `<div class="empty-column">${status.id === "saved" ? "Good ideas start here." : "Nothing here just yet."}</div>`}</div></section>`;
    }).join("");
    bindBoardEvents();
  }

  function renderList(visible) {
    listWrap.innerHTML = `<table class="list-table"><thead><tr><th>ROLE</th><th>LOCATION</th><th>STATUS</th><th>FOLLOW-UP</th><th>RESUME / NOTES</th><th></th></tr></thead><tbody>${visible.map((job) => `<tr><td><span class="list-role" data-open-job="${escapeHtml(job.id)}">${escapeHtml(job.title)}<br><span style="font-weight:400;color:#8c958d">${escapeHtml(job.company)}</span></span></td><td>${escapeHtml(job.location || "—")}</td><td><select class="status-select" data-status-select="${escapeHtml(job.id)}" aria-label="Status for ${escapeHtml(job.title)}">${STATUSES.map((s) => `<option value="${s.id}" ${job.status === s.id ? "selected" : ""}>${s.label}</option>`).join("")}</select></td><td>${escapeHtml(formatDate(job.followUp) || "—")}</td><td>${escapeHtml(job.resume || "—")}</td><td><button class="card-menu" data-menu="${escapeHtml(job.id)}" aria-label="Opportunity actions">···</button></td></tr>`).join("")}</tbody></table>`;
    listWrap.querySelectorAll("[data-open-job]").forEach((el) => el.addEventListener("click", () => showDetails(el.dataset.openJob)));
    listWrap.querySelectorAll("[data-status-select]").forEach((el) => el.addEventListener("change", () => updateJob(el.dataset.statusSelect, { status: el.value })));
    listWrap.querySelectorAll("[data-menu]").forEach((el) => el.addEventListener("click", (event) => { event.stopPropagation(); showCardMenu(el, el.dataset.menu); }));
  }

  function render() {
    updateSummary();
    const visible = getVisibleJobs();
    const isEmpty = jobs.length === 0;
    board.classList.toggle("hidden", isEmpty || currentView !== "board");
    listWrap.classList.toggle("hidden", isEmpty || currentView !== "list");
    emptyState.classList.toggle("hidden", !isEmpty);
    if (!isEmpty) currentView === "board" ? renderBoard(visible) : renderList(visible);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function openForm(job = null) {
    form.reset();
    $("#duplicate-notice").classList.add("hidden");
    $("#modal-title").textContent = job ? "Edit opportunity" : "Add an opportunity";
    $("#save-label").textContent = job ? "Save changes" : "Save opportunity";
    form.dataset.editingId = job ? job.id : "";
    if (job) {
      for (const key of ["url", "description", "title", "company", "location", "deadline", "status", "followUp", "resume"]) {
        if (form.elements[key]) form.elements[key].value = job[key] || "";
      }
    }
    jobModal.showModal();
    setTimeout(() => $("#job-title").focus(), 50);
  }

  function createId() { return globalThis.crypto?.randomUUID?.() || `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

  function updateJob(id, changes) {
    const job = jobs.find((item) => item.id === id);
    if (!job) return;
    Object.assign(job, changes, { updatedAt: new Date().toISOString() });
    if (persist()) { render(); showToast("Opportunity updated."); }
  }

  function showCardMenu(anchor, id) {
    closeMenus();
    const menu = document.createElement("div");
    menu.className = "card-actions";
    menu.innerHTML = `<button data-action="edit">Edit details</button><button data-action="copy">Copy opportunity</button><button class="danger" data-action="delete">Remove opportunity</button>`;
    anchor.parentElement.append(menu);
    menu.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      closeMenus();
      const job = jobs.find((item) => item.id === id);
      if (!job) return;
      if (action === "edit") openForm(job);
      if (action === "copy") { jobs.push({ ...job, id: createId(), status: "saved", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); if (persist()) { render(); showToast("A copy was added to Saved."); } }
      if (action === "delete" && confirm(`Remove “${job.title} at ${job.company}” from this device?`)) { jobs = jobs.filter((item) => item.id !== id); if (persist()) { render(); showToast("Opportunity removed."); } }
    });
  }

  function closeMenus() { document.querySelectorAll(".card-actions").forEach((menu) => menu.remove()); }

  function bindBoardEvents() {
    board.querySelectorAll("[data-open-job]").forEach((card) => {
      card.addEventListener("click", (event) => { if (event.target.closest("button,a")) return; showDetails(card.dataset.openJob); });
      card.addEventListener("keydown", (event) => { if ((event.key === "Enter" || event.key === " ") && event.target === card) { event.preventDefault(); showDetails(card.dataset.openJob); } });
    });
    board.querySelectorAll("[data-menu]").forEach((button) => button.addEventListener("click", (event) => { event.stopPropagation(); showCardMenu(button, button.dataset.menu); }));
    board.querySelectorAll("[data-drop-status]").forEach((rail) => {
      rail.addEventListener("dragover", (event) => { event.preventDefault(); rail.classList.add("drag-over"); });
      rail.addEventListener("dragleave", () => rail.classList.remove("drag-over"));
      rail.addEventListener("drop", (event) => { event.preventDefault(); rail.classList.remove("drag-over"); const id = event.dataTransfer.getData("text/plain"); if (id) updateJob(id, { status: rail.dataset.dropStatus }); });
    });
    board.querySelectorAll(".job-card").forEach((card) => { card.draggable = true; card.addEventListener("dragstart", (event) => { event.dataTransfer.setData("text/plain", card.dataset.openJob); event.dataTransfer.effectAllowed = "move"; }); });
  }

  function showDetails(id) {
    const job = jobs.find((item) => item.id === id);
    if (!job) return;
    const link = safeUrl(job.url);
    const status = STATUSES.find((item) => item.id === job.status)?.label || "Saved";
    $("#detail-content").innerHTML = `<div class="detail-top"><div class="detail-company-mark">${escapeHtml(initials(job.company))}</div><button class="icon-button close-button detail-close" aria-label="Close">×</button></div><h2 id="detail-title">${escapeHtml(job.title)}</h2><div class="detail-company">${escapeHtml(job.company)}${job.location ? ` · ${escapeHtml(job.location)}` : ""}</div><div class="detail-grid"><div class="detail-field"><span>Status</span><strong>${escapeHtml(status)}</strong></div><div class="detail-field"><span>Deadline</span><strong>${escapeHtml(formatDate(job.deadline) || "Not set")}</strong></div><div class="detail-field"><span>Follow-up</span><strong>${escapeHtml(formatDate(job.followUp) || "Not set")}</strong></div><div class="detail-field"><span>Resume / notes</span><strong>${escapeHtml(job.resume || "Not added")}</strong></div>${link ? `<div class="detail-field" style="grid-column:1/-1"><span>Job posting</span><strong><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Open original posting ↗</a></strong></div>` : ""}</div>${job.description ? `<div class="field-label">SAVED JOB DESCRIPTION</div><div class="detail-description">${escapeHtml(job.description)}</div>` : ""}<div class="detail-actions"><button class="button button-primary" data-detail-edit="${escapeHtml(job.id)}">Edit details</button><label class="field-label" for="detail-status" style="margin:auto 2px auto 8px">MOVE TO</label><select id="detail-status" class="status-select" data-detail-status="${escapeHtml(job.id)}">${STATUSES.map((s) => `<option value="${s.id}" ${job.status === s.id ? "selected" : ""}>${s.label}</option>`).join("")}</select><button class="button button-quiet" data-detail-close>Done</button></div>`;
    const dialog = $("#detail-modal");
    dialog.showModal();
    $(".detail-close", dialog).addEventListener("click", () => dialog.close());
    $("[data-detail-close]", dialog).addEventListener("click", () => dialog.close());
    $("[data-detail-edit]", dialog).addEventListener("click", () => { dialog.close(); openForm(job); });
    $("[data-detail-status]", dialog).addEventListener("change", (event) => updateJob(job.id, { status: event.target.value }));
  }

  function extractFromText(text) {
    const result = {};
    const titlePatterns = [/^\s*(?:job title|role|position)\s*[:\-]\s*(.+)$/im, /^\s*(?:we are hiring|hiring)\s+(?:an?\s+)?(.+)$/im, /^\s*(.+?\s+(?:intern|internship|engineer|developer|analyst|designer|associate|manager))\s*$/im];
    for (const pattern of titlePatterns) { const match = text.match(pattern); if (match?.[1]) { result.title = match[1].trim().slice(0, 100); break; } }
    const companyPatterns = [/^\s*(?:company|organization|employer)\s*[:\-]\s*(.+)$/im, /^\s*(?:about|who we are)\s+([A-Z][\w&.,' -]{1,45})/im];
    for (const pattern of companyPatterns) { const match = text.match(pattern); if (match?.[1]) { result.company = match[1].trim().split(/[.!\n]/)[0].slice(0, 70); break; } }
    const locationMatch = text.match(/^\s*(?:location|workplace|based in)\s*[:\-]\s*(.+)$/im);
    if (locationMatch) result.location = locationMatch[1].trim().split(/[\n;]/)[0].slice(0, 80);
    const deadlineMatch = text.match(/^\s*(?:application deadline|apply by|deadline)\s*[:\-]\s*(.+)$/im);
    if (deadlineMatch) {
      const dateText = deadlineMatch[1].trim();
      const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
      if (isoDate) {
        const parsed = new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
        if (localDateKey(parsed) === dateText) result.deadline = dateText;
      } else {
        const parsed = new Date(dateText);
        if (!Number.isNaN(parsed.getTime())) result.deadline = localDateKey(parsed);
      }
    }
    return result;
  }

  function extractUrlHints(urlString) {
    const hints = {};
    const link = safeUrl(urlString);
    if (!link) return hints;
    try {
      const url = new URL(link);
      const host = url.hostname.replace(/^www\./, "").split(".")[0];
      if (host && !["linkedin", "indeed", "wellfound", "greenhouse", "lever", "workday"].includes(host)) hints.company = host.charAt(0).toUpperCase() + host.slice(1);
      const slug = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      if (slug && slug.length > 3 && !/^job\s*\d+$/i.test(slug)) hints.title = slug.slice(0, 90);
    } catch { /* URL is validated separately; keep the form available. */ }
    return hints;
  }

  function readDetails() {
    const description = $("#job-description").value.trim();
    const url = $("#job-url").value.trim();
    if (!description && !url) { $("#extract-hint").textContent = "Paste a job description or URL first."; return; }
    const extracted = { ...extractUrlHints(url), ...extractFromText(description) };
    for (const key of ["title", "company", "location", "deadline"]) {
      if (extracted[key] && !form.elements[key].value.trim()) form.elements[key].value = extracted[key];
    }
    const found = Object.keys(extracted).filter((key) => extracted[key]);
    $("#extract-hint").textContent = found.length ? `Found ${found.join(", ")}. Please review before saving; this is local pattern matching, not AI.` : "No recognizable details found. Fill in the role and company fields manually.";
    checkDuplicateNotice();
  }

  function checkDuplicateNotice() {
    const candidate = { url: form.elements.url.value.trim(), title: form.elements.title.value.trim(), company: form.elements.company.value.trim() };
    $("#duplicate-notice").classList.toggle("hidden", !hasDuplicate(candidate, form.dataset.editingId || null));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `internship-os-export-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
    URL.revokeObjectURL(url); showToast("Your data export is ready.");
  }

  $("#open-add").addEventListener("click", () => openForm());
  $("#empty-add").addEventListener("click", () => openForm());
  $(".close-button", jobModal).addEventListener("click", () => jobModal.close());
  $(".cancel-button").addEventListener("click", () => jobModal.close());
  $("#extract-button").addEventListener("click", readDetails);
  ["title", "company", "url"].forEach((key) => form.elements[key].addEventListener("input", checkDuplicateNotice));
  $("#job-description").addEventListener("input", () => { if ($("#extract-hint").textContent.startsWith("No recognizable")) $("#extract-hint").textContent = "Paste a link or job description below. Details are extracted in your browser."; });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const urlValue = String(data.get("url") || "").trim();
    if (urlValue && !safeUrl(urlValue)) { showToast("Please enter a valid http or https job link."); $("#job-url").focus(); return; }
    const editingId = form.dataset.editingId;
    const existing = jobs.find((job) => job.id === editingId);
    const now = new Date().toISOString();
    const job = { id: editingId || createId(), title: String(data.get("title")).trim(), company: String(data.get("company")).trim(), url: urlValue, description: String(data.get("description") || "").trim(), location: String(data.get("location") || "").trim(), deadline: String(data.get("deadline") || ""), status: String(data.get("status") || "saved"), followUp: String(data.get("followUp") || ""), resume: String(data.get("resume") || "").trim(), createdAt: existing?.createdAt || now, updatedAt: now };
    if (!job.title || !job.company) { showToast("Role title and company are required."); return; }
    if (hasDuplicate(job, editingId || null) && !confirm("This looks like a duplicate. Save it anyway?")) return;
    if (existing) jobs = jobs.map((item) => item.id === editingId ? job : item); else jobs.push(job);
    if (persist()) { jobModal.close(); render(); showToast(existing ? "Changes saved." : "Opportunity saved on this device."); }
  });
  $("#search-input").addEventListener("input", render);
  $("#sort-select").addEventListener("change", render);
  $("#board-view").addEventListener("click", () => { currentView = "board"; $("#board-view").classList.add("selected"); $("#list-view").classList.remove("selected"); render(); });
  $("#list-view").addEventListener("click", () => { currentView = "list"; $("#list-view").classList.add("selected"); $("#board-view").classList.remove("selected"); render(); });
  $("#saved-nav").addEventListener("click", () => { savedOnly = !savedOnly; $("#saved-nav").classList.toggle("active", savedOnly); if (savedOnly) showToast("Showing saved roles only. Click Saved roles again to reset."); render(); });
  $(".export-button").addEventListener("click", exportData);
  $("#help-button").addEventListener("click", () => $("#help-modal").showModal());
  $(".help-close").addEventListener("click", () => $("#help-modal").close());
  $("#follow-nav-dot").parentElement.addEventListener("click", (event) => { if (event.target.closest("a")) { event.preventDefault(); savedOnly = false; $("#search-input").value = ""; currentView = "board"; $("#board-view").classList.add("selected"); $("#list-view").classList.remove("selected"); render(); showToast(`${jobs.filter((job) => job.status !== "closed" && job.followUp && job.followUp <= localDateKey()).length} follow-up(s) due or overdue.`); } });
  document.addEventListener("click", (event) => { if (!event.target.closest(".card-menu,.card-actions")) closeMenus(); });
  document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));
  window.addEventListener("storage", (event) => { if (event.key === STORAGE_KEY) { jobs = loadJobs(); render(); } });
  render();
})();
