const STORAGE_KEY = "todo-list-v3";
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const counter = document.getElementById("counter");
const clearDoneBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filters button");
const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");

let tasks = load();
let currentFilter = "all"; // all | active | done
let searchText = "";
let sortMode = "created_desc"; // created_desc | created_asc | az | status

render();

/* ===== Create ===== */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  const now = Date.now();
  tasks.push({ id: crypto.randomUUID(), title, done: false, createdAt: now, updatedAt: now });
  input.value = "";
  saveAndRender();
});

/* ===== Read + Interações de Lista ===== */
list.addEventListener("click", (e) => {
  const li = e.target.closest("li.task");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.matches('input[type="checkbox"]')) {
    toggleDone(id);
  } else if (e.target.matches('.delete-btn')) {
    showConfirm(li, id);
  } else if (e.target.matches('.edit-btn')) {
    toggleEdit(li, id);
  } else if (e.target.matches('.confirm-yes')) {
    removeTask(id);
  } else if (e.target.matches('.confirm-no')) {
    hideConfirm(li);
  }
});

/* Duplo-clique para editar */
list.addEventListener("dblclick", (e) => {
  const titleDiv = e.target.closest(".title");
  if (!titleDiv) return;
  const li = titleDiv.closest("li.task");
  const id = li.dataset.id;
  startEditing(li, id);
});

/* Captura Enter/Esc no modo edição */
list.addEventListener("keydown", (e) => {
  const titleDiv = e.target.closest(".title[contenteditable='true']");
  if (!titleDiv) return;
  const li = titleDiv.closest("li.task");
  const id = li.dataset.id;

  if (e.key === "Enter") {
    e.preventDefault();
    finishEditing(li, id, true);
  } else if (e.key === "Escape") {
    e.preventDefault();
    finishEditing(li, id, false);
  }
});

/* Limpar concluídas */
clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.done);
  saveAndRender();
});

/* Filtros */
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

/* Busca */
searchInput.addEventListener("input", () => {
  searchText = searchInput.value.trim().toLowerCase();
  render();
});

/* Ordenação */
sortSelect.addEventListener("change", () => {
  sortMode = sortSelect.value;
  render();
});

/* ===== Render ===== */
function render() {
  list.innerHTML = "";
  const view = sortTasks(filterBySearch(getFiltered(tasks)));

  view.forEach(task => {
    const li = document.createElement("li");
    li.className = `task ${task.done ? "done" : ""}`;
    li.dataset.id = task.id;

    const created = new Date(task.createdAt).toLocaleString();
    const updated = task.updatedAt ? new Date(task.updatedAt).toLocaleString() : created;

    li.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Concluir" />
      <div class="title" contenteditable="false" title="Criada: ${created}\nAtualizada: ${updated}">${escapeHTML(task.title)}</div>
      <div class="actions">
        <button class="icon-btn edit-btn" aria-label="Editar">Editar</button>
        <button class="icon-btn delete-btn" aria-label="Excluir">Excluir</button>
      </div>
    `;
    list.appendChild(li);
  });

  updateCounter();
}

/* ===== Update ===== */
function startEditing(li, id) {
  li.classList.add("editing");
  const titleDiv = li.querySelector(".title");
  titleDiv.setAttribute("contenteditable", "true");
  // coloca o cursor no fim
  const range = document.createRange();
  range.selectNodeContents(titleDiv);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  titleDiv.focus();
}

function finishEditing(li, id, saveChanges) {
  const titleDiv = li.querySelector(".title");
  if (!titleDiv) return;
  if (saveChanges) {
    const newTitle = titleDiv.textContent.trim();
    if (newTitle) {
      const t = tasks.find(t => t.id === id);
      t.title = newTitle;
      t.updatedAt = Date.now();
      titleDiv.setAttribute("contenteditable", "false");
      li.classList.remove("editing");
      saveAndRender();
      return;
    } else {
 
      return;
    }
  }
  // cancelar
  titleDiv.setAttribute("contenteditable", "false");
  li.classList.remove("editing");
  render();
}

function toggleEdit(li, id) {
  const isEditing = li.classList.contains("editing");
  if (isEditing) {
    finishEditing(li, id, true);
  } else {
    startEditing(li, id);
  }
}

function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (t) {
    t.done = !t.done;
    t.updatedAt = Date.now();
    saveAndRender();
  }
}


function showConfirm(li) {
  if (li.querySelector(".confirm")) return;
  const c = document.createElement("span");
  c.className = "confirm";
  c.innerHTML = `
    <small>Excluir?</small>
    <button class="confirm-yes">Sim</button>
    <button class="confirm-no">Não</button>
  `;
  li.querySelector(".actions").appendChild(c);
}
function hideConfirm(li) {
  const c = li.querySelector(".confirm");
  if (c) c.remove();
}
function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveAndRender();
}


function updateCounter() {
  const total = tasks.length;
  const pending = tasks.filter(t => !t.done).length;
  counter.textContent = `${pending} pendentes / ${total} totais`;
}

function getFiltered(list) {
  if (currentFilter === "active") return list.filter(t => !t.done);
  if (currentFilter === "done")   return list.filter(t =>  t.done);
  return list;
}

function filterBySearch(list) {
  if (!searchText) return list;
  return list.filter(t => t.title.toLowerCase().includes(searchText));
}

function sortTasks(list) {
  const arr = [...list];
  if (sortMode === "created_desc") {
    arr.sort((a,b) => b.createdAt - a.createdAt);
  } else if (sortMode === "created_asc") {
    arr.sort((a,b) => a.createdAt - b.createdAt);
  } else if (sortMode === "az") {
    arr.sort((a,b) => a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' }));
  } else if (sortMode === "status") {
    // pendentes primeiro, mantendo ordem de criação dentro do grupo
    arr.sort((a,b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
  }
  return arr;
}


function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
 
    return data.map(t => ({
      id: t.id ?? crypto.randomUUID(),
      title: String(t.title ?? "").trim(),
      done: Boolean(t.done),
      createdAt: t.createdAt ?? Date.now(),
      updatedAt: t.updatedAt ?? t.createdAt ?? Date.now()
    }));
  } catch {
    return [];
  }
}
function saveAndRender() { save(); render(); }


function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
