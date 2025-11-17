document.addEventListener('DOMContentLoaded', () => {
    const JSON_URL = 'https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json';

    // === ESTADO GLOBAL ===
    let state = {
        vehicles: [],
        cart: JSON.parse(localStorage.getItem('cart')) || [],
        favorites: JSON.parse(localStorage.getItem('favorites')) || [],
        currentVehicle: null,
        page: 1,
        itemsPerPage: 9
    };

    // === SELECTORES ===
    const dom = {
        sections: {
            home: document.getElementById('homeSection'),
            catalog: document.getElementById('catalogSection'),
            favorites: document.getElementById('favoritesSection'),
            contact: document.getElementById('contactSection')
        },
        nav: {
            home: document.getElementById('nav-home'),
            catalog: document.getElementById('nav-catalog'),
            contact: document.getElementById('nav-contact')
        },
        containers: {
            products: document.getElementById('productsContainer'),
            favorites: document.getElementById('favoritesContainer'),
            pagination: document.getElementById('paginationContainer').querySelector('ul')
        },
        inputs: {
            search: document.getElementById('filterSearch'),
            category: document.getElementById('filterCategory'),
            sort: document.getElementById('filterSort')
        },
        badges: {
            cart: document.getElementById('cartCount'),
            fav: document.getElementById('favCount')
        },
        modals: {
            details: new bootstrap.Modal('#detailsModal'),
            quantity: new bootstrap.Modal('#quantityModal'),
            cart: new bootstrap.Modal('#cartModal'),
            payment: new bootstrap.Modal('#paymentModal')
        }
    };

    // === 1. ROUTING ===
    window.router = (view) => {
        Object.values(dom.sections).forEach(el => el.classList.add('d-none'));
        Object.values(dom.nav).forEach(el => el?.classList.remove('active'));

        if (dom.sections[view]) dom.sections[view].classList.remove('d-none');
        if (dom.nav[view]) dom.nav[view].classList.add('active');

        if (view === 'catalog' && state.vehicles.length === 0) loadVehicles();
        if (view === 'favorites') renderFavorites();

        window.scrollTo(0, 0);
    };

    // === 2. DATA & LOGIC ===
    async function loadVehicles() {
        try {
            const res = await fetch(JSON_URL);
            if (!res.ok) throw new Error("Error de red");
            state.vehicles = await res.json();
        } catch (e) { 
            console.warn("Carga fallida, usando datos locales:", e);
            // DATOS DE RESPALDO (Por si falla GitHub o CORS)
            state.vehicles = [
                { "codigo": 1, "marca": "Toyota", "modelo": "Corolla", "precio_venta": 25000, "anio": 2023, "categoria": "Sedán", "imagen": "https://images.unsplash.com/photo-1623869675785-70d386e0c232?q=80&w=600&auto=format&fit=crop" },
                { "codigo": 2, "marca": "Honda", "modelo": "Civic", "precio_venta": 28000, "anio": 2024, "categoria": "Sedán", "imagen": "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=600&auto=format&fit=crop" },
                { "codigo": 3, "marca": "Ford", "modelo": "Mustang", "precio_venta": 55000, "anio": 2022, "categoria": "Deportivo", "imagen": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=600&auto=format&fit=crop" },
                { "codigo": 4, "marca": "Tesla", "modelo": "Model 3", "precio_venta": 45000, "anio": 2023, "categoria": "Eléctrico", "imagen": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=600&auto=format&fit=crop" },
                { "codigo": 5, "marca": "Chevrolet", "modelo": "Tahoe", "precio_venta": 65000, "anio": 2024, "categoria": "SUV", "imagen": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600&auto=format&fit=crop" },
                { "codigo": 6, "marca": "BMW", "modelo": "X5", "precio_venta": 70000, "anio": 2023, "categoria": "Lujo", "imagen": "https://images.unsplash.com/photo-1556189250-72ba95452da9?q=80&w=600&auto=format&fit=crop" }
            ];
        } finally {
            setupFilters();
            renderProducts();
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    }

    function renderProducts() {
        let data = filterAndSortData();
        
        if (data.length === 0) {
            dom.containers.products.innerHTML = '<div class="col-12 text-center py-5"><h4>No hay resultados.</h4></div>';
            dom.containers.pagination.innerHTML = '';
            return;
        }

        const start = (state.page - 1) * state.itemsPerPage;
        const paginated = data.slice(start, start + state.itemsPerPage);

        dom.containers.products.innerHTML = paginated.map(v => createCardHTML(v)).join('');
        setupPagination(data.length);
    }

    function createCardHTML(v) {
        const isFav = state.favorites.some(f => f.codigo === v.codigo);
        return `
            <div class="col-lg-4 col-md-6 fade-in">
                <div class="card h-100 hover-card shadow-sm border-0 position-relative">
                    <button class="fav-btn-card ${isFav ? 'active' : ''}" onclick="toggleFavorite(${v.codigo})">
                        <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                    <img src="${v.imagen}" class="card-img-top" alt="${v.marca}" loading="lazy">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold text-truncate">${v.marca} ${v.modelo}</h5>
                        <p class="text-muted small mb-2">${v.categoria} | ${v.anio}</p>
                        <div class="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                            <span class="h5 text-primary mb-0 fw-bold">${formatPrice(v.precio_venta)}</span>
                            <button class="btn btn-outline-primary rounded-pill btn-sm" onclick="showDetails(${v.codigo})">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    // --- Filtros ---
    function setupFilters() {
        // Limpiar select antes de llenarlo (para evitar duplicados si se recarga)
        dom.inputs.category.innerHTML = '<option value="All">Todas las Categorías</option>';
        const cats = [...new Set(state.vehicles.map(v => v.categoria))].sort();
        dom.inputs.category.innerHTML += cats.map(c => `<option value="${c}">${c}</option>`).join('');
        
        const apply = () => { state.page = 1; renderProducts(); };
        
        // Remover listeners anteriores si existen para evitar duplicidad
        const newSearch = dom.inputs.search.cloneNode(true);
        dom.inputs.search.parentNode.replaceChild(newSearch, dom.inputs.search);
        dom.inputs.search = newSearch;
        
        dom.inputs.search.addEventListener('input', apply);
        document.getElementById('filterCategory').addEventListener('change', apply);
        document.getElementById('filterSort').addEventListener('change', apply);
        
        document.getElementById('btnResetFilters').onclick = () => {
            dom.inputs.search.value = ''; 
            document.getElementById('filterCategory').value = 'All'; 
            document.getElementById('filterSort').value = 'default';
            apply();
        };
    }

    function filterAndSortData() {
        let filtered = [...state.vehicles];
        const q = document.getElementById('filterSearch').value.toLowerCase();
        const cat = document.getElementById('filterCategory').value;
        const sort = document.getElementById('filterSort').value;

        if (cat !== 'All') filtered = filtered.filter(v => v.categoria === cat);
        if (q) filtered = filtered.filter(v => v.marca.toLowerCase().includes(q) || v.modelo.toLowerCase().includes(q));
        
        if (sort === 'price-asc') filtered.sort((a, b) => a.precio_venta - b.precio_venta);
        if (sort === 'price-desc') filtered.sort((a, b) => b.precio_venta - a.precio_venta);
        
        return filtered;
    }

    function setupPagination(total) {
        const pages = Math.ceil(total / state.itemsPerPage);
        if (pages <= 1) { dom.containers.pagination.innerHTML = ''; return; }
        
        let html = '';
        for (let i = 1; i <= pages; i++) {
            html += `<li class="page-item ${i === state.page ? 'active' : ''}"><a class="page-link" href="#" onclick="changePage(${i})">${i}</a></li>`;
        }
        dom.containers.pagination.innerHTML = html;
    }
    window.changePage = (p) => { state.page = p; renderProducts(); dom.sections.catalog.scrollIntoView({behavior:'smooth'}); };

    // === 3. FAVORITOS ===
    window.toggleFavorite = (code) => {
        const idx = state.favorites.findIndex(f => f.codigo === code);
        if (idx > -1) {
            state.favorites.splice(idx, 1);
        } else {
            const v = state.vehicles.find(i => i.codigo === code);
            if(v) state.favorites.push(v);
        }
        localStorage.setItem('favorites', JSON.stringify(state.favorites));
        updateBadges();
        if(!dom.sections.catalog.classList.contains('d-none')) renderProducts(); 
        if(!dom.sections.favorites.classList.contains('d-none')) renderFavorites(); 
    };

    function renderFavorites() {
        if (state.favorites.length === 0) {
            document.getElementById('noFavoritesMsg').classList.remove('d-none');
            dom.containers.favorites.innerHTML = '';
        } else {
            document.getElementById('noFavoritesMsg').classList.add('d-none');
            dom.containers.favorites.innerHTML = state.favorites.map(v => createCardHTML(v)).join('');
        }
    }

    // === 4. CARRITO Y DETALLES ===
    window.showDetails = (code) => {
        const v = state.vehicles.find(i => i.codigo === code);
        if (!v) return;
        state.currentVehicle = v;
        
        document.getElementById('detailsModalTitle').textContent = `${v.marca} ${v.modelo}`;
        document.getElementById('detailsModalImage').src = v.imagen;
        document.getElementById('detailsModalPrice').textContent = formatPrice(v.precio_venta);
        document.getElementById('detailsModalLogo').src = v.logo || '';
        document.getElementById('detailsModalDescription').textContent = v.descripcion || 'Excelente estado.';
        dom.modals.details.show();
    };

    document.getElementById('detailsModalAddToCartBtn').addEventListener('click', () => {
        dom.modals.details.hide();
        document.getElementById('quantityInput').value = 1;
        dom.modals.quantity.show();
    });

    document.getElementById('addToCartBtn').addEventListener('click', () => {
        const qty = parseInt(document.getElementById('quantityInput').value);
        if (qty > 0 && state.currentVehicle) {
            const exist = state.cart.find(i => i.codigo === state.currentVehicle.codigo);
            if (exist) exist.quantity += qty;
            else state.cart.push({ ...state.currentVehicle, quantity: qty });
            
            saveCart();
            dom.modals.quantity.hide();
            Swal.fire({ icon: 'success', title: '¡Añadido!', timer: 1000, showConfirmButton: false });
        }
    });

    function renderCart() {
        const container = document.getElementById('cartItems');
        if (state.cart.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">Vacío</p>';
            document.getElementById('checkoutBtn').disabled = true;
            document.getElementById('cartTotal').textContent = '$0.00';
            return;
        }
        
        let total = 0;
        container.innerHTML = state.cart.map(i => {
            const sub = i.precio_venta * i.quantity;
            total += sub;
            return `
                <div class="cart-item justify-content-between">
                    <div class="d-flex align-items-center">
                        <img src="${i.imagen}" class="cart-item-img">
                        <div>
                            <h6 class="mb-0 small fw-bold">${i.marca} ${i.modelo}</h6>
                            <small class="text-muted">${i.quantity} x ${formatPrice(i.precio_venta)}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold small">${formatPrice(sub)}</div>
                        <i class="fas fa-trash text-danger cursor-pointer" onclick="removeFromCart(${i.codigo})"></i>
                    </div>
                </div>`;
        }).join('');
        document.getElementById('cartTotal').textContent = formatPrice(total);
        document.getElementById('checkoutBtn').disabled = false;
    }

    window.removeFromCart = (code) => {
        state.cart = state.cart.filter(i => i.codigo !== code);
        saveCart();
        renderCart();
    };

    // === 5. PAGO Y FACTURA (PDF) ===
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        dom.modals.cart.hide();
        dom.modals.payment.show();
    });

    document.getElementById('processPaymentBtn').addEventListener('click', () => {
        const form = document.getElementById('paymentForm');
        if (!form.checkValidity()) { form.reportValidity(); return; }

        dom.modals.payment.hide();
        Swal.fire({ title: 'Procesando...', timer: 2000, didOpen: () => Swal.showLoading() })
        .then(() => {
            try {
                generateInvoice();
                state.cart = [];
                saveCart();
                Swal.fire('¡Éxito!', 'Compra realizada y factura descargada.', 'success');
                form.reset();
                router('home');
            } catch (err) {
                console.error(err);
                Swal.fire('Error', 'Hubo un problema al generar el PDF', 'error');
            }
        });
    });

    function generateInvoice() {
        if (!window.jspdf) { alert("Error: Librería PDF no cargada."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const name = document.getElementById('paymentName').value || 'Cliente';
        
        doc.setFontSize(18); doc.text('Factura - GarageOnline', 105, 20, { align: 'center' });
        doc.setFontSize(12); doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 30);
        doc.text(`Cliente: ${name}`, 20, 40);
        
        let y = 60, total = 0;
        state.cart.forEach(item => {
            const sub = item.precio_venta * item.quantity;
            total += sub;
            doc.text(`${item.marca} ${item.modelo} (x${item.quantity})`, 20, y);
            doc.text(formatPrice(sub), 160, y);
            y += 10;
        });
        
        doc.line(20, y, 190, y);
        doc.setFont(undefined, 'bold');
        doc.text(`Total: ${formatPrice(total)}`, 160, y + 10);
        doc.save(`Factura_GarageOnline_${Date.now()}.pdf`);
    }

    document.getElementById('cancelPaymentBtn').addEventListener('click', () => {
        dom.modals.payment.hide();
        dom.modals.cart.show();
    });

    // === UTILIDADES ===
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(state.cart));
        updateBadges();
    }
    function updateBadges() {
        const qty = state.cart.reduce((a, b) => a + b.quantity, 0);
        dom.badges.cart.textContent = qty;
        
        const favs = state.favorites.length;
        dom.badges.fav.textContent = favs;
        dom.badges.fav.classList.toggle('d-none', favs === 0);
    }
    function formatPrice(p) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p); }

    // === INIT ===
    document.getElementById('cartModal').addEventListener('show.bs.modal', renderCart);
    
    const toggleTheme = () => {
        const t = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', t);
        localStorage.setItem('theme', t);
        document.querySelector('#darkModeToggle i').className = t === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    };
    document.getElementById('darkModeToggle').addEventListener('click', toggleTheme);
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    document.querySelector('#darkModeToggle i').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    updateBadges();
    router('home');
});
