document.addEventListener('DOMContentLoaded', () => {
    const JSON_URL = 'https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json';

    // === ESTADO ===
    let vehiclesData = [];
    let cart = [];
    let currentVehicle = null;
    let currentPage = 1;
    const itemsPerPage = 9;

    // === SELECTORES DOM ===
    const dom = {
        sections: {
            home: document.getElementById('homeSection'),
            catalog: document.getElementById('catalogSection')
        },
        nav: {
            home: document.getElementById('nav-home'),
            catalog: document.getElementById('nav-catalog')
        },
        productsContainer: document.getElementById('productsContainer'),
        pagination: document.getElementById('paginationContainer').querySelector('ul'),
        cart: {
            count: document.getElementById('cartCount'),
            items: document.getElementById('cartItems'),
            total: document.getElementById('cartTotal'),
            checkoutBtn: document.getElementById('checkoutBtn')
        },
        modals: {
            details: new bootstrap.Modal('#detailsModal'),
            quantity: new bootstrap.Modal('#quantityModal'),
            cart: new bootstrap.Modal('#cartModal'),
            payment: new bootstrap.Modal('#paymentModal')
        },
        inputs: {
            quantity: document.getElementById('quantityInput')
        }
    };

    // === 1. SISTEMA DE ROUTING (VISTAS) ===
    window.router = (view) => {
        Object.values(dom.sections).forEach(el => el.classList.add('d-none'));
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

        if (view === 'catalog') {
            dom.sections.catalog.classList.remove('d-none');
            dom.nav.catalog.classList.add('active');
            if(vehiclesData.length === 0) loadVehicles();
        } else {
            dom.sections.home.classList.remove('d-none');
            dom.nav.home.classList.add('active');
        }
        window.scrollTo(0,0);
    };

    // === 2. MODO OSCURO ===
    const toggleDarkMode = () => {
        const html = document.documentElement;
        const isDark = html.getAttribute('data-bs-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        html.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        document.querySelector('#darkModeToggle i').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    };
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    document.querySelector('#darkModeToggle i').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    // === 3. LÓGICA DE NEGOCIO ===
    async function loadVehicles() {
        try {
            const response = await fetch(JSON_URL);
            vehiclesData = await response.json();
            setupFilters();
            renderProducts();
        } catch (error) {
            console.error(error);
            dom.productsContainer.innerHTML = `<div class="alert alert-danger text-center w-100">Error al cargar datos. Intente más tarde.</div>`;
        } finally {
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    }

    // Configuración de Barra de Herramientas (Search, Filter, Sort)
    function setupFilters() {
        const categories = [...new Set(vehiclesData.map(v => v.categoria))].sort();
        const select = document.getElementById('filterCategory');
        
        let options = `<option value="All" selected>Todas las Categorías</option>`;
        categories.forEach(cat => {
            options += `<option value="${cat}">${cat}</option>`;
        });
        select.innerHTML = options;

        // Event Listeners
        document.getElementById('filterSearch').addEventListener('input', () => applyFilters());
        document.getElementById('filterCategory').addEventListener('change', () => applyFilters());
        document.getElementById('filterSort').addEventListener('change', () => applyFilters());
        document.getElementById('btnResetFilters').addEventListener('click', resetFilters);
    }

    function resetFilters() {
        document.getElementById('filterSearch').value = '';
        document.getElementById('filterCategory').value = 'All';
        document.getElementById('filterSort').value = 'default';
        applyFilters();
    }

    function applyFilters() {
        currentPage = 1;
        renderProducts();
    }

    function renderProducts() {
        let filtered = [...vehiclesData];
        
        const searchQuery = document.getElementById('filterSearch').value.toLowerCase();
        const categoryValue = document.getElementById('filterCategory').value;
        const sortValue = document.getElementById('filterSort').value;

        // Filtros
        if (categoryValue !== 'All') {
            filtered = filtered.filter(v => v.categoria === categoryValue);
        }
        if (searchQuery) {
            filtered = filtered.filter(v => 
                v.marca.toLowerCase().includes(searchQuery) || 
                v.modelo.toLowerCase().includes(searchQuery)
            );
        }

        // Ordenamiento
        if (sortValue === 'price-asc') {
            filtered.sort((a, b) => a.precio_venta - b.precio_venta);
        } else if (sortValue === 'price-desc') {
            filtered.sort((a, b) => b.precio_venta - a.precio_venta);
        }

        // Renderizado
        if (filtered.length === 0) {
            dom.productsContainer.innerHTML = '<div class="col-12 text-center p-5"><h4>No hay vehículos que coincidan.</h4></div>';
            dom.pagination.innerHTML = '';
            return;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const paginated = filtered.slice(start, start + itemsPerPage);

        dom.productsContainer.innerHTML = paginated.map(v => `
            <div class="col-lg-4 col-md-6 fade-in">
                <div class="card h-100 hover-card shadow-sm border-0">
                    <div class="position-relative">
                        <img src="${v.imagen}" class="card-img-top" alt="${v.marca}" loading="lazy">
                        <span class="position-absolute top-0 end-0 badge bg-dark m-2 shadow">${v.anio || 'N/A'}</span>
                        <span class="position-absolute top-0 start-0 badge bg-primary m-2 shadow">${v.categoria}</span>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold text-truncate">${v.marca} ${v.modelo}</h5>
                        <p class="text-muted small mb-2 text-truncate">${v.tipo || 'Vehículo'}</p>
                        <div class="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                            <span class="h5 text-primary mb-0 fw-bold">${formatPrice(v.precio_venta)}</span>
                            <button class="btn btn-outline-primary rounded-pill btn-sm view-btn" data-code="${v.codigo}">
                                <i class="fas fa-eye"></i> Ver
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        setupPagination(filtered.length);
        
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => showDetails(parseInt(btn.dataset.code)));
        });
    }

    function setupPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) {
            dom.pagination.innerHTML = '';
            return;
        }
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                     </li>`;
        }
        dom.pagination.innerHTML = html;
    }

    window.changePage = (page) => {
        currentPage = page;
        renderProducts();
        dom.sections.catalog.scrollIntoView({ behavior: 'smooth' });
    };

    // === 4. MODALES Y CARRITO ===
    function showDetails(code) {
        currentVehicle = vehiclesData.find(v => v.codigo === code);
        if (!currentVehicle) return;

        document.getElementById('detailsModalTitle').textContent = `${currentVehicle.marca} ${currentVehicle.modelo}`;
        document.getElementById('detailsModalImage').src = currentVehicle.imagen;
        document.getElementById('detailsModalLogo').src = currentVehicle.logo || ''; 
        document.getElementById('detailsModalPrice').textContent = formatPrice(currentVehicle.precio_venta);
        document.getElementById('detailsModalDescription').textContent = currentVehicle.descripcion || 'Vehículo certificado.';
        
        dom.modals.details.show();
    }

    document.getElementById('detailsModalAddToCartBtn').addEventListener('click', () => {
        dom.modals.details.hide();
        dom.inputs.quantity.value = 1;
        dom.modals.quantity.show();
    });

    document.getElementById('addToCartBtn').addEventListener('click', () => {
        const qty = parseInt(dom.inputs.quantity.value);
        if (qty > 0 && currentVehicle) {
            addToCart(currentVehicle, qty);
            dom.modals.quantity.hide();
            Swal.fire({
                icon: 'success',
                title: '¡Añadido!',
                text: `${currentVehicle.marca} se agregó al carrito`,
                timer: 1500,
                showConfirmButton: false
            });
        }
    });

    function addToCart(vehicle, qty) {
        const exist = cart.find(i => i.codigo === vehicle.codigo);
        if (exist) exist.quantity += qty;
        else cart.push({ ...vehicle, quantity: qty });
        updateCartUI();
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartUI() {
        dom.cart.count.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
        dom.cart.checkoutBtn.disabled = cart.length === 0;
        
        let total = 0;
        dom.cart.items.innerHTML = cart.length ? cart.map(item => {
            const sub = item.precio_venta * item.quantity;
            total += sub;
            return `
                <div class="cart-item">
                    <img src="${item.imagen}" class="cart-item-img">
                    <div class="flex-grow-1">
                        <h6 class="mb-0 fw-bold">${item.marca} ${item.modelo}</h6>
                        <small class="text-muted">${item.quantity} x ${formatPrice(item.precio_venta)}</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">${formatPrice(sub)}</div>
                        <button class="btn btn-sm text-danger p-0" onclick="removeFromCart(${item.codigo})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('') : '<p class="text-center text-muted">Tu carrito está vacío</p>';

        dom.cart.total.textContent = formatPrice(total);
    }

    window.removeFromCart = (code) => {
        cart = cart.filter(i => i.codigo !== code);
        updateCartUI();
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    // === PAGO ===
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        dom.modals.cart.hide();
        dom.modals.payment.show();
    });

    document.getElementById('processPaymentBtn').addEventListener('click', () => {
        const form = document.getElementById('paymentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        dom.modals.payment.hide();
        
        Swal.fire({
            title: 'Procesando Pago...',
            timer: 2000,
            timerProgressBar: true,
            didOpen: () => Swal.showLoading()
        }).then(() => {
            Swal.fire('¡Pago Exitoso!', 'Gracias por tu compra', 'success');
            cart = [];
            updateCartUI();
            localStorage.removeItem('cart');
            form.reset();
            router('home');
        });
    });

    document.getElementById('cancelPaymentBtn').addEventListener('click', () => {
        dom.modals.payment.hide();
        dom.modals.cart.show();
    });

    function formatPrice(p) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p);
    }

    // INICIALIZACIÓN
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
    
    router('home');
});