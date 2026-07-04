// ============================================
// BEYLİKDÜZÜ ÇİÇEKÇİ - Site Interactions
// ============================================

// ===== Mobile menu =====
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');

// Menü açıkken tıklanınca kapatan arka plan katmanı
const backdrop = document.createElement('div');
backdrop.className = 'nav-backdrop';
document.body.appendChild(backdrop);

function openMenu() {
    nav.classList.add('open');
    menuBtn.classList.add('active');
    backdrop.classList.add('open');
    document.body.classList.add('menu-open');
}

function closeMenu() {
    nav.classList.remove('open');
    menuBtn.classList.remove('active');
    backdrop.classList.remove('open');
    document.body.classList.remove('menu-open');
}

menuBtn.addEventListener('click', () => {
    nav.classList.contains('open') ? closeMenu() : openMenu();
});

backdrop.addEventListener('click', closeMenu);

nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

// ESC ile kapat
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
});

// ===== Header scroll effect =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ===== Product filter =====
const tabs = document.querySelectorAll('.tab');
const products = document.querySelectorAll('.product');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.dataset.filter;
        products.forEach(p => {
            const cats = p.dataset.cat || '';
            if (filter === 'all' || cats.includes(filter)) {
                p.classList.remove('hidden');
            } else {
                p.classList.add('hidden');
            }
        });
    });
});

// ===== Fade-in animations on scroll =====
const fadeElements = document.querySelectorAll('.product, .service-card, .testimonial, .feature, .contact-item');
fadeElements.forEach(el => el.classList.add('fade-in'));

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

fadeElements.forEach(el => observer.observe(el));

// ===== Contact form =====
function sendForm(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[type="text"]').value;
    const phone = form.querySelector('input[type="tel"]').value;
    const subject = form.querySelectorAll('input[type="text"]')[1]?.value || 'Genel Bilgi';
    const message = form.querySelector('textarea').value;

    const waMessage = `Merhaba Armutlu Çiçekçilik!%0A%0A*Adım:* ${encodeURIComponent(name)}%0A*Telefonum:* ${encodeURIComponent(phone)}%0A*Konu:* ${encodeURIComponent(subject)}%0A%0A*Mesajım:*%0A${encodeURIComponent(message)}`;

    window.open(`https://wa.me/905514223218?text=${waMessage}`, '_blank');

    form.reset();
    alert('Mesajınız WhatsApp üzerinden iletilmek üzere yönlendiriliyor. Teşekkür ederiz!');
    return false;
}
