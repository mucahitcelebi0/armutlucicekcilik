// ============================================================
//  ADMIN PANEL — mantık
// ============================================================
import {
  isConfigured, isCloudinaryConfigured, watchAuth, login, logout,
  getProducts, saveProduct, deleteProduct,
  getCategories, saveCategory, deleteCategory,
  getSettings, saveSettings, uploadImage
} from "./data.js";

// ---------- kısa yardımcılar ----------
const $ = (id) => document.getElementById(id);
const el = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Fiyatı şık göster: 6000 / "6000 TL" / "₺ 1.250" → "₺ 6.000"
const fmtPrice = (v) => {
  if (v == null || v === "") return "";
  const digits = String(v).replace(/\D/g, "");
  if (!digits) return esc(String(v));
  return "₺ " + parseInt(digits, 10).toLocaleString("tr-TR");
};
function slugify(s) {
  const map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };
  return String(s).replace(/[çğıöşüİÇĞÖŞÜ]/g, m => map[m] || m)
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || ("k" + Date.now());
}
let toastTimer;
function toast(msg, type = "") {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = "toast " + type, 2600);
}

let CATEGORIES = [];

// ============================================================
//  GİRİŞ / OTURUM
// ============================================================
if (!isConfigured()) {
  $("configWarn").innerHTML = `<div class="banner" style="text-align:left">
    ⚠️ Henüz Firebase ayarlanmadı. <code>firebase-config.js</code> dosyasını doldur,
    sonra bu sayfayı yenile. (Talimat: <code>KURULUM.md</code>)</div>`;
  $("loginBtn").disabled = true;
}

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("loginError").textContent = "";
  $("loginBtn").disabled = true;
  try {
    await login($("email").value.trim(), $("password").value);
  } catch (err) {
    $("loginError").textContent = "Giriş başarısız: e-posta veya şifre hatalı.";
    $("loginBtn").disabled = false;
  }
});

$("logoutBtn").addEventListener("click", () => logout());

watchAuth(async (user) => {
  if (user) {
    $("loginWrap").style.display = "none";
    $("app").style.display = "block";
    $("whoami").textContent = user.email;
    await loadAll();
  } else {
    $("app").style.display = "none";
    $("loginWrap").style.display = "flex";
    $("loginBtn").disabled = !isConfigured();
  }
});

// ============================================================
//  SEKMELER
// ============================================================
document.querySelectorAll(".tabs button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    $("panel-" + btn.dataset.tab).classList.add("active");
  });
});

// ============================================================
//  TÜM VERİYİ YÜKLE
// ============================================================
async function loadAll() {
  await loadCategories();
  await loadProducts();
  await loadSettings();
}

// ============================================================
//  ÜRÜNLER
// ============================================================
async function loadProducts() {
  const grid = $("productGrid");
  grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><span class="spinner"></span> Yükleniyor...</div>`;
  let products = [];
  try { products = await getProducts(); }
  catch (e) { grid.innerHTML = `<div class="empty" style="grid-column:1/-1">Yüklenemedi: ${esc(e.message)}</div>`; return; }

  renderSeedBanner(products.length === 0);

  if (!products.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">🌸</div>
      Henüz ürün yok. Sağ üstten <b>+ Yeni Ürün</b> ile ekle ya da yukarıdaki <b>başlangıç verisini</b> yükle.</div>`;
    return;
  }

  grid.innerHTML = "";
  products.forEach(p => {
    const cat = CATEGORIES.find(c => c.slug === p.category);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb" style="${p.image ? `background-image:url('${esc(p.image)}')` : ""}">
        ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
        ${p.active === false ? `<div class="off">Gizli</div>` : ""}
      </div>
      <div class="body">
        <span class="cat">${esc(cat ? cat.name : (p.category || "—"))}</span>
        <h3>${esc(p.name)}</h3>
        <div class="desc">${esc(p.desc || "")}</div>
        <div class="price">${fmtPrice(p.price)}</div>
        <div class="actions">
          <button class="btn btn-light btn-sm edit">Düzenle</button>
          <button class="btn btn-danger btn-sm del">Sil</button>
        </div>
      </div>`;
    el(".edit", card).addEventListener("click", () => openProductModal(p));
    el(".del", card).addEventListener("click", () => removeProduct(p));
    grid.appendChild(card);
  });
}

function openProductModal(p = null) {
  $("productModalTitle").textContent = p ? "Ürünü Düzenle" : "Yeni Ürün";
  $("p-id").value = p?.id || "";
  $("p-name").value = p?.name || "";
  $("p-price").value = p?.price || "";
  $("p-badge").value = p?.badge || "";
  $("p-order").value = p?.order ?? 0;
  $("p-desc").value = p?.desc || "";
  $("p-active").checked = p ? p.active !== false : true;
  $("p-image").value = p?.image || "";
  $("p-preview").style.backgroundImage = p?.image ? `url('${p.image}')` : "";
  $("p-preview").textContent = p?.image ? "" : "Önizleme";
  // kategori seçenekleri
  $("p-category").innerHTML = CATEGORIES.map(c => `<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join("")
    || `<option value="">(önce kategori ekleyin)</option>`;
  if (p?.category) $("p-category").value = p.category;
  openModal("productModal");
}

$("addProductBtn").addEventListener("click", () => {
  if (!CATEGORIES.length) { toast("Önce en az bir kategori ekleyin.", "err"); return; }
  openProductModal();
});

// fotoğraf yükleme
$("p-uploadBtn").addEventListener("click", () => $("p-file").click());
$("p-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!isCloudinaryConfigured()) { toast("Cloudinary ayarlanmamış (firebase-config.js).", "err"); return; }
  const hint = $("p-uploadHint");
  hint.innerHTML = `<span class="spinner"></span> Yükleniyor...`;
  $("p-uploadBtn").disabled = true;
  try {
    const url = await uploadImage(file);
    $("p-image").value = url;
    $("p-preview").style.backgroundImage = `url('${url}')`;
    $("p-preview").textContent = "";
    hint.textContent = "✓ Yüklendi.";
  } catch (err) {
    hint.textContent = "Yüklenemedi: " + err.message;
    toast("Görsel yüklenemedi.", "err");
  } finally {
    $("p-uploadBtn").disabled = false;
    e.target.value = "";
  }
});

$("saveProductBtn").addEventListener("click", async () => {
  const name = $("p-name").value.trim();
  if (!name) { toast("Ürün adı gerekli.", "err"); return; }
  const payload = {
    name,
    category: $("p-category").value,
    price: $("p-price").value.trim(),
    badge: $("p-badge").value.trim(),
    desc: $("p-desc").value.trim(),
    image: $("p-image").value,
    order: Number($("p-order").value) || 0,
    active: $("p-active").checked,
  };
  $("saveProductBtn").disabled = true;
  try {
    await saveProduct($("p-id").value || null, payload);
    closeModal("productModal");
    toast("Ürün kaydedildi.", "ok");
    await loadProducts();
  } catch (e) { toast("Kaydedilemedi: " + e.message, "err"); }
  finally { $("saveProductBtn").disabled = false; }
});

async function removeProduct(p) {
  if (!confirm(`"${p.name}" ürünü silinsin mi?`)) return;
  try { await deleteProduct(p.id); toast("Ürün silindi.", "ok"); await loadProducts(); }
  catch (e) { toast("Silinemedi: " + e.message, "err"); }
}

// ============================================================
//  KATEGORİLER
// ============================================================
async function loadCategories() {
  try { CATEGORIES = await getCategories(); }
  catch (e) { CATEGORIES = []; }
  const list = $("categoryList");
  if (!CATEGORIES.length) {
    list.innerHTML = `<div class="empty"><div class="big">🏷️</div>Henüz kategori yok. <b>+ Yeni Kategori</b> ile ekle.</div>`;
    return;
  }
  list.innerHTML = "";
  CATEGORIES.forEach(c => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div><div class="name">${esc(c.name)}</div><div class="slug">${esc(c.slug)}</div></div>
      <div class="actions">
        <button class="btn btn-light btn-sm edit">Düzenle</button>
        <button class="btn btn-danger btn-sm del">Sil</button>
      </div>`;
    el(".edit", row).addEventListener("click", () => openCategoryModal(c));
    el(".del", row).addEventListener("click", () => removeCategory(c));
    list.appendChild(row);
  });
}

function openCategoryModal(c = null) {
  $("categoryModalTitle").textContent = c ? "Kategoriyi Düzenle" : "Yeni Kategori";
  $("c-id").value = c?.id || "";
  $("c-name").value = c?.name || "";
  $("c-order").value = c?.order ?? 0;
  openModal("categoryModal");
}
$("addCategoryBtn").addEventListener("click", () => openCategoryModal());

$("saveCategoryBtn").addEventListener("click", async () => {
  const name = $("c-name").value.trim();
  if (!name) { toast("Kategori adı gerekli.", "err"); return; }
  const payload = { name, slug: slugify(name), order: Number($("c-order").value) || 0 };
  $("saveCategoryBtn").disabled = true;
  try {
    await saveCategory($("c-id").value || null, payload);
    closeModal("categoryModal");
    toast("Kategori kaydedildi.", "ok");
    await loadCategories();
    await loadProducts();
  } catch (e) { toast("Kaydedilemedi: " + e.message, "err"); }
  finally { $("saveCategoryBtn").disabled = false; }
});

async function removeCategory(c) {
  if (!confirm(`"${c.name}" kategorisi silinsin mi?`)) return;
  try { await deleteCategory(c.id); toast("Kategori silindi.", "ok"); await loadCategories(); }
  catch (e) { toast("Silinemedi: " + e.message, "err"); }
}

// ============================================================
//  AYARLAR
// ============================================================
const SETTING_FIELDS = ["shopName", "whatsapp", "phone", "hours", "address", "rating", "reviewCount", "heroSubtitle", "mapUrl"];
async function loadSettings() {
  let s = null;
  try { s = await getSettings(); } catch (e) {}
  s = s || {};
  SETTING_FIELDS.forEach(f => { const node = $("s-" + f); if (node) node.value = s[f] ?? ""; });
}
$("saveSettingsBtn").addEventListener("click", async () => {
  const payload = {};
  SETTING_FIELDS.forEach(f => { payload[f] = $("s-" + f).value.trim(); });
  $("saveSettingsBtn").disabled = true;
  try { await saveSettings(payload); toast("Ayarlar kaydedildi.", "ok"); }
  catch (e) { toast("Kaydedilemedi: " + e.message, "err"); }
  finally { $("saveSettingsBtn").disabled = false; }
});

// ============================================================
//  MODAL yardımcıları
// ============================================================
function openModal(id) { $(id).classList.add("open"); }
function closeModal(id) { $(id).classList.remove("open"); }
document.querySelectorAll(".modal").forEach(m => {
  m.addEventListener("click", (e) => {
    if (e.target === m || e.target.hasAttribute("data-close")) m.classList.remove("open");
  });
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") document.querySelectorAll(".modal.open").forEach(m => m.classList.remove("open"));
});

// ============================================================
//  BAŞLANGIÇ VERİSİ (SEED)
// ============================================================
function renderSeedBanner(show) {
  const b = $("seedBanner");
  if (!show) { b.innerHTML = ""; return; }
  b.innerHTML = `<div class="banner">
    👋 İlk kurulum: Sitedeki mevcut <b>kategoriler, 6 ürün ve ayarları</b> tek tıkla yükleyebilirsin.
    Sonra hepsini düzenleyebilirsin. <br>
    <button class="btn btn-dark btn-sm" id="seedBtn" style="margin-top:10px">⬇️ Başlangıç verisini yükle</button>
  </div>`;
  $("seedBtn").addEventListener("click", seedData);
}

const SEED_CATEGORIES = [
  { name: "Buketler", slug: "buket", order: 1 },
  { name: "Aranjmanlar", slug: "aranjman", order: 2 },
  { name: "Özel Tasarım", slug: "ozel", order: 3 },
  { name: "Özel Gün", slug: "ozelgun", order: 4 },
  { name: "Çelenk", slug: "celenk", order: 5 },
];
const SEED_PRODUCTS = [
  { name: "Romantic Garden", category: "buket", price: "₺ 1.250", badge: "Çok Satan", image: "images/p1.jpg", order: 1, active: true, desc: "Kırmızı güller, pembe krizantemler ve cipsofilya ile gazete ambalajda el yapımı zarif buket." },
  { name: "Pure Ivory", category: "buket", price: "₺ 950", badge: "", image: "images/p2.jpg", order: 2, active: true, desc: "Beyaz güller, cipsofilya ve kraft ambalajla sade zarafetin simgesi premium buket." },
  { name: "Forever Love", category: "ozel", price: "₺ 4.500", badge: "Premium", image: "images/p3.jpg", order: 3, active: true, desc: "51 adet fuşya güllerden oluşan, \"Love You Forever\" altın yazılı siyah kurdeleli ihtişamlı koleksiyon." },
  { name: "Sweet Dreams", category: "buket", price: "₺ 1.150", badge: "Yeni", image: "images/p4.jpg", order: 4, active: true, desc: "Pembe ve beyaz papatyalar, krizantemler ile pembe ambalajda romantik karışım buket." },
  { name: "Royal Red", category: "ozel", price: "₺ 1.850", badge: "", image: "images/p5.jpg", order: 5, active: true, desc: "Kırmızı güller, okaliptüs yaprakları ve cipsofilya; kırmızı-altın saten ambalajda ihtişamlı sunum." },
  { name: "Crimson Luxury", category: "ozel", price: "₺ 3.250", badge: "Lüks", image: "images/p6.jpg", order: 6, active: true, desc: "Bordo kırmızı güller, altın cipsofilya ile çizgili premium ambalajda görkemli koleksiyon parçası." },
];
const SEED_SETTINGS = {
  shopName: "Armutlu Çiçekçilik",
  whatsapp: "905514223218",
  phone: "0551 422 32 18",
  hours: "7/24 Açık",
  address: "Bayır Mah. Atatürk Cd. No:25, 77500 Armutlu / Yalova",
  rating: "5.0",
  reviewCount: "127",
  heroSubtitle: "Armutlu'nun en seçkin çiçekçisi. El emeği lüks buketler, çelenkler, özel tasarım aranjmanlar ve 7/24 aynı gün teslimat ile her anınızı zarafetle taçlandırın.",
  mapUrl: "https://maps.google.com/maps?q=40.5121621,28.8350563&t=&z=17&ie=UTF8&iwloc=&output=embed",
};

async function seedData() {
  if (!confirm("Başlangıç verisi (kategoriler + 6 ürün + ayarlar) yüklensin mi?")) return;
  const btn = $("seedBtn");
  btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Yükleniyor...`;
  try {
    for (const c of SEED_CATEGORIES) await saveCategory(null, c);
    for (const p of SEED_PRODUCTS) await saveProduct(null, p);
    await saveSettings(SEED_SETTINGS);
    toast("Başlangıç verisi yüklendi.", "ok");
    await loadAll();
  } catch (e) {
    toast("Yüklenemedi: " + e.message, "err");
    btn.disabled = false; btn.textContent = "⬇️ Başlangıç verisini yükle";
  }
}
