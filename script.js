/* ======== GENERAL ======== */
body {
    padding-top: 70px;
    font-family: 'Segoe UI', system-ui, sans-serif;
}

.btn-icon {
    width: 40px; height: 40px; padding: 0;
    display: inline-flex; align-items: center; justify-content: center;
}

/* ======== ANIMACIONES ======== */
.fade-in { animation: fadeIn 0.5s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.animate-up { animation: slideUp 0.8s ease-out forwards; opacity: 0; transform: translateY(30px); }
.delay-1 { animation-delay: 0.2s; }
.delay-2 { animation-delay: 0.4s; }
@keyframes slideUp { to { opacity: 1; transform: translateY(0); } }

/* ======== HERO & CARDS ======== */
.hero-section {
    background-image: url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop');
    background-size: cover; background-position: center; height: 60vh; margin-top: -20px;
}
.hero-section .overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8)); z-index: 1;
}

.hover-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
.hover-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.15) !important; }
.card-img-top { height: 200px; object-fit: cover; }

/* Botón Favorito en Card */
.fav-btn-card {
    position: absolute; top: 10px; right: 10px;
    background: rgba(255,255,255,0.8); border: none;
    border-radius: 50%; width: 35px; height: 35px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10; transition: all 0.2s;
}
.fav-btn-card:hover { transform: scale(1.1); background: white; }
.fav-btn-card.active { color: #dc3545; }

/* ======== DARK MODE ======== */
[data-bs-theme="dark"] .bg-light, [data-bs-theme="dark"] .bg-body-tertiary { background-color: #212529 !important; }
[data-bs-theme="dark"] .card { background-color: #2b3035; border-color: #373b3e; }
[data-bs-theme="dark"] .input-group-text, [data-bs-theme="dark"] .form-control, [data-bs-theme="dark"] .form-select {
    background-color: #2b3035; border-color: #495057; color: #e9ecef;
}
[data-bs-theme="dark"] .fav-btn-card { background: rgba(0,0,0,0.6); color: #fff; }
[data-bs-theme="dark"] .fav-btn-card:hover { background: black; }

/* ======== CARRITO ======== */
.cart-item { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid var(--bs-border-color); }
.cart-item-img { width: 60px; height: 60px; object-fit: cover; border-radius: 5px; margin-right: 10px; }
