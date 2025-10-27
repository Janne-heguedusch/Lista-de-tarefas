const STORAGE_KEY = "todo-list-v2";
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const counter = document.getElementById("counter");
const clearDoneBtn = document.getElementById("clear-done");
const filterBtns = document.querySelectorAll(".filters button");

let tasks = load();
let currentFilter = "all"; // all | active | done

render();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  tasks.push({ id: crypto.randomUUID(), title, done: false, createdAt: Date.now() });
  input.value = "";
  saveAndRender();
});

list.addEventListener("click", (e) => {
  const li = e.target.closest("li.task");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.matches('input[type="checkbox"]')) {
    toggleDone(id);
  } else if (e.target.matches('.delete-btn')) {
    removeTask(id);
  } else if (e.target.matches('.edit-btn')) {
    enableEdit(li, id);
  }
});

clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter(t => !t.done);
  saveAndRender();
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

function render() {
  list.innerHTML = "";
  getFiltered(tasks).forEach(task => {
    const li = document.createElement("li");
    li.className = `task ${task.done ? "done" : ""}`;
    li.dataset.id = task.id;
    li.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""} aria-label="Concluir" />
      <div class="title" contenteditable="false">${escapeHTML(task.title)}</div>
      <div class="actions">
        <button class="icon-btn edit-btn">Editar</button>
        <button class="icon-btn delete-btn">Excluir</button>
      </div>
    `;
    list.appendChild(li);
  });
  updateCounter();
}

function enableEdit(li, id) {
  const titleDiv = li.querySelector(".title");
  const editing = titleDiv.getAttribute("contenteditable") === "true";
  if (!editing) {
    titleDiv.setAttribute("contenteditable", "true");
    titleDiv.focus();
    // Coloca o cursor no fim
    document.getSelection().collapse(titleDiv, titleDiv.childNodes.length);
  } else {
    titleDiv.setAttribute("contenteditable", "false");
    const newTitle = titleDiv.textContent.trim();
    if (newTitle) {
      const t = tasks.find(t => t.id === id);
      t.title = newTitle;
      saveAndRender();
    } else {
      // se apagar tudo, removemos
      removeTask(id);
    }
  }
}

function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = !t.done; saveAndRender(); }
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

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []; }
  catch { return []; }
}
function saveAndRender() { save(); render(); }
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
