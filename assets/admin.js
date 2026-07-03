const supa = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const loginPanel = document.getElementById("login-panel");
const adminArea = document.getElementById("admin-area");
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");
const logoutBtn = document.getElementById("logout-btn");
const whoami = document.getElementById("whoami");

const recordForm = document.getElementById("record-form");
const formMsg = document.getElementById("form-msg");
const listEl = document.getElementById("admin-list");
const resetBtn = document.getElementById("reset-form");

let editingId = null;

function escapeHtml(s){
  return (s || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function showMsg(el, text, ok){
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "err");
  el.classList.remove("hidden");
}

/* ---------------- auth ---------------- */

async function refreshAuthUI(){
  const { data:{ session } } = await supa.auth.getSession();
  if(session){
    loginPanel.classList.add("hidden");
    adminArea.classList.remove("hidden");
    whoami.textContent = session.user.email;
    loadRecords();
  } else {
    loginPanel.classList.remove("hidden");
    adminArea.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const { error } = await supa.auth.signInWithPassword({ email, password });
  if(error){
    showMsg(loginMsg, error.message, false);
  } else {
    loginMsg.classList.add("hidden");
    refreshAuthUI();
  }
});

logoutBtn.addEventListener("click", async ()=>{
  await supa.auth.signOut();
  refreshAuthUI();
});

/* ---------------- records CRUD ---------------- */

function fileUrl(path){
  if(!path) return null;
  const { data } = supa.storage.from(window.STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function renderRow(r){
  const url = fileUrl(r.file_path);
  return `
    <article class="card">
      <div class="idx">${escapeHtml(r.category || "—")}</div>
      <div class="body">
        <h3>${escapeHtml(r.title)}</h3>
        <p>${escapeHtml(r.description || "")}</p>
        <div class="meta">${new Date(r.created_at).toLocaleString()}</div>
      </div>
      <div class="file">
        ${url ? `<a href="${url}" target="_blank" rel="noopener">File</a>` : ""}
        <button class="ghost" data-edit="${r.id}">Edit</button>
        <button class="danger" data-del="${r.id}">Delete</button>
      </div>
    </article>
  `;
}

let cache = [];

async function loadRecords(){
  listEl.innerHTML = `<div class="state-msg">Loading…</div>`;
  const { data, error } = await supa.from("records").select("*").order("created_at",{ascending:false});
  if(error){
    listEl.innerHTML = `<div class="state-msg">Couldn't load records.</div>`;
    console.error(error);
    return;
  }
  cache = data;
  listEl.innerHTML = data.length ? data.map(renderRow).join("") : `<div class="state-msg">No entries yet. Add one above.</div>`;

  listEl.querySelectorAll("[data-edit]").forEach(btn=>{
    btn.addEventListener("click", ()=> startEdit(btn.dataset.edit));
  });
  listEl.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=> deleteRecord(btn.dataset.del));
  });
}

function startEdit(id){
  const r = cache.find(x=>x.id === id);
  if(!r) return;
  editingId = id;
  document.getElementById("title").value = r.title || "";
  document.getElementById("description").value = r.description || "";
  document.getElementById("category").value = r.category || "";
  document.getElementById("form-title").textContent = "Edit entry";
  window.scrollTo({top:0, behavior:"smooth"});
}

resetBtn.addEventListener("click", ()=>{
  editingId = null;
  recordForm.reset();
  document.getElementById("form-title").textContent = "Add entry";
});

async function deleteRecord(id){
  if(!confirm("Delete this entry? This can't be undone.")) return;
  const { error } = await supa.from("records").delete().eq("id", id);
  if(error){ alert(error.message); return; }
  loadRecords();
}

recordForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  formMsg.classList.add("hidden");

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value.trim();
  const fileInput = document.getElementById("file");
  const file = fileInput.files[0];

  let file_path = null;

  try {
    if(file){
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g,"_")}`;
      const { error: upErr } = await supa.storage.from(window.STORAGE_BUCKET).upload(safeName, file);
      if(upErr) throw upErr;
      file_path = safeName;
    }

    if(editingId){
      const patch = { title, description, category };
      if(file_path) patch.file_path = file_path;
      const { error } = await supa.from("records").update(patch).eq("id", editingId);
      if(error) throw error;
      showMsg(formMsg, "Entry updated.", true);
    } else {
      const { error } = await supa.from("records").insert([{ title, description, category, file_path }]);
      if(error) throw error;
      showMsg(formMsg, "Entry added.", true);
    }

    editingId = null;
    recordForm.reset();
    document.getElementById("form-title").textContent = "Add entry";
    loadRecords();
  } catch(err){
    console.error(err);
    showMsg(formMsg, err.message || "Something went wrong.", false);
  }
});

refreshAuthUI();
