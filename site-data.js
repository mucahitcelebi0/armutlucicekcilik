// ============================================================
//  ANA SİTE — Firestore'dan dinamik içerik
//  Veri varsa statik içeriğin yerini alır; yoksa statik kalır.
// ============================================================
import { isConfigured, getProducts, getCategories, getSettings } from "./data.js";

if (isConfigured()) {
  init();
}

async function init() {
  try {
    const [settings, categories, products] = await Promise.all([
      getSettings().catch(() => null),
      getCategories().catch(() => []),
      getProducts().catch(() => []),
    ]);
    if (settings) applySettings(settings);
    const waNum = (settings && settings.whatsapp) || "905514223218";
    if (categories.length) renderTabs(categories);
    if (products.length) renderProducts(products, categories, waNum);
    if (categories.length || products.length) setupFilter();
  } catch (e) {
    console.warn("Dinamik içerik yüklenemedi, statik içerik gösteriliyor.", e);
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const wa = (num, text) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
// Fiyatı şık göster: ne yazılırsa yazılsın (6000, "6000 TL", "₺ 1.250") → "₺ 6.000"
const fmtPrice = (v) => {
  if (v == null || v === "") return "";
  const digits = String(v).replace(/\D/g, "");
  if (!digits) return esc(String(v));
  return "₺ " + parseInt(digits, 10).toLocaleString("tr-TR");
};

// ---------- FİLTRE SEKMELERİ ----------
function renderTabs(categories) {
  const wrap = document.querySelector(".filter-tabs");
  if (!wrap) return;
  const tabs = [`<button class="tab active" data-filter="all">Tümü</button>`]
    .concat(categories.map(c => `<button class="tab" data-filter="${esc(c.slug)}">${esc(c.name)}</button>`));
  wrap.innerHTML = tabs.join("");
}

// ---------- ÜRÜNLER ----------
function renderProducts(products, categories, waNum) {
  const grid = document.querySelector(".products-grid");
  if (!grid) return;
  const catName = {};
  categories.forEach(c => catName[c.slug] = c.name);

  const visible = products.filter(p => p.active !== false);
  grid.innerHTML = visible.map(p => {
    const img = p.image
      ? `<div class="img-placeholder" style="background-image:url('${esc(p.image)}')"></div>`
      : `<div class="img-placeholder" style="background:#1c1c28"></div>`;
    const badge = p.badge ? `<div class="product-badge">${esc(p.badge)}</div>` : "";
    const link = wa(waNum, `${p.name} hakkında bilgi almak istiyorum`);
    return `
      <article class="product fade-in" data-cat="${esc(p.category || "")}">
        <div class="product-img">
          ${badge}
          ${img}
          <div class="product-actions">
            <a href="${link}" target="_blank" class="btn btn-gold btn-sm">Sipariş Ver</a>
          </div>
        </div>
        <div class="product-info">
          <span class="product-cat">${esc(catName[p.category] || p.category || "")}</span>
          <h3>${esc(p.name)}</h3>
          <p>${esc(p.desc || "")}</p>
          <div class="product-price">${fmtPrice(p.price)}</div>
        </div>
      </article>`;
  }).join("");

  // yeni eklenen ürünler için fade-in animasyonu
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) en.target.classList.add("visible"); });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  grid.querySelectorAll(".product").forEach(el => io.observe(el));
}

// ---------- FİLTRELEME ----------
function setupFilter() {
  const tabs = document.querySelectorAll(".filter-tabs .tab");
  const products = document.querySelectorAll(".products-grid .product");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const f = tab.dataset.filter;
      products.forEach(p => {
        const cats = p.dataset.cat || "";
        p.classList.toggle("hidden", !(f === "all" || cats.split(/\s+/).includes(f)));
      });
    });
  });
}

// ---------- AYARLARI SİTEYE UYGULA ----------
function applySettings(s) {
  const num = s.whatsapp || "905514223218";

  // tüm WhatsApp linkleri
  document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
    a.href = a.href.replace(/wa\.me\/\d+/, "wa.me/" + num);
  });
  // tüm telefon (tel:) linkleri
  if (num) document.querySelectorAll('a[href^="tel:"]').forEach(a => { a.href = "tel:+" + num; });

  const setText = (sel, val) => { const n = document.querySelector(sel); if (n && val != null && val !== "") n.textContent = val; };

  setText("#set-hero-sub", s.heroSubtitle);
  setText("#set-rating", s.rating);
  setText("#set-reviewcount", s.reviewCount);
  if (s.rating || s.reviewCount)
    setText("#set-review-line", `Google'da ${s.rating || "4.7"} ★ puan, ${s.reviewCount || "27"}+ memnun müşteri yorumu.`);

  setText("#set-phone-link", s.phone);
  setText("#set-wa-link", s.phone);
  setText("#set-footer-phone", s.phone);
  setText("#set-footer-wa", s.phone);

  if (s.address) {
    const a = document.querySelector("#set-address");
    if (a) a.innerHTML = esc(s.address);
  }
  if (s.hours) setText("#set-hours", s.hours.startsWith("Her gün") ? s.hours : "Her gün " + s.hours);

  if (s.mapUrl) { const m = document.querySelector("#set-map"); if (m) m.src = s.mapUrl; }
}
