const supa = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const listEl = document.getElementById("ledger");
const searchEl = document.getElementById("search");
const categoryEl = document.getElementById("category");
const countEl = document.getElementById("count");

let allRecords = [];

function fileUrl(path){
  if(!path) return null;
  const { data } = supa.storage.from(window.STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function renderCard(r, i){
  const url = fileUrl(r.file_path);
  const date = new Date(r.created_at).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});
  return `
    <article class="card">
      <div class="idx">No. ${String(i+1).padStart(3,"0")}</div>
      <div class="body">
        <h3>${escapeHtml(r.title)}</h3>
        <p>${escapeHtml(r.description || "")}</p>
        <div class="meta">
          <span>${date}</span>
          ${r.category ? `<span class="tag">${escapeHtml(r.category)}</span>` : ""}
        </div>
      </div>
      <div class="file">
        ${url ? `<a href="${url}" target="_blank" rel="noopener">Open file</a>` : ""}
      </div>
    </article>
  `;
}

function escapeHtml(s){
  return (s || "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

function render(){
  const q = searchEl.value.trim().toLowerCase();
  const cat = categoryEl.value;
  const filtered = allRecords.filter(r=>{
    const matchesQ = !q || (r.title + " " + (r.description||"")).toLowerCase().includes(q);
    const matchesCat = !cat || r.category === cat;
    return matchesQ && matchesCat;
  });
  countEl.textContent = `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`;
  listEl.innerHTML = filtered.length
    ? filtered.map(renderCard).join("")
    : `<div class="state-msg">No entries match. Try clearing the search.</div>`;
}

function populateCategories(){
  const cats = [...new Set(allRecords.map(r=>r.category).filter(Boolean))].sort();
  categoryEl.innerHTML = `<option value="">All categories</option>` +
    cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

async function load(){
  listEl.innerHTML = `<div class="state-msg">Loading entries…</div>`;
  const { data, error } = await supa
    .from("records")
    .select("*")
    .order("created_at", { ascending:false });

  if(error){
    listEl.innerHTML = `<div class="state-msg">Couldn't load entries. Check assets/config.js is set up (see README).</div>`;
    console.error(error);
    return;
  }
  allRecords = data;
  populateCategories();
  render();
}

searchEl.addEventListener("input", render);
categoryEl.addEventListener("change", render);
load();
