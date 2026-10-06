// ============================================================
// NOVAHUB — Homepage Script (Dynamic Sections + Layout)
// ============================================================

let allProducts = [];
let allCategories = [];
let allSections = [];
let allSliders = [];
let allBanners = [];
let layoutSections = [];
let cart = [];
let selectedCartItems = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Novahub Homepage initializing...');
    
    setupMenuToggle();
    setupSearch();
    setupCartIcon();
    
    await loadSettings();
    await loadCartFromStorage();
    await updateAuthUI();
    
    // Load all data
    await Promise.all([
        loadSliders(),
        loadCategories(),
        loadSections(),
        loadPromoBanners(),
        loadProducts()
    ]);
    
    // Load layout (depends on sections + banners)
    await loadLayout();
    
    // Render
    renderLayoutSections();
    renderSidebarCollections();
    updateCartUI();
    
    console.log('✅ Homepage loaded');
});

// ============================================================
// MENU TOGGLE
// ============================================================
function setupMenuToggle() {
    const btn = document.getElementById('menuToggleBtn');
    const sidebar = document.getElementById('sidebarMenu');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!btn) return;
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    overlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
    });
    
    window.closeMenu = closeMenu;
    
    function closeMenu() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================================
// SEARCH
// ============================================================
function setupSearch() {
    const input = document.getElementById('headerSearch');
    const clearBtn = document.getElementById('searchClearBtn');
    const resultsSection = document.getElementById('searchResultsSection');
    const dynamicSections = document.getElementById('dynamicSections');
    
    if (!input) return;
    
    let debounceTimer;
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        clearBtn.style.display = query ? 'flex' : 'none';
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.style.display = 'none';
        resultsSection.style.display = 'none';
        dynamicSections.style.display = 'block';
    });
    
    function performSearch(query) {
        if (!query) {
            resultsSection.style.display = 'none';
            dynamicSections.style.display = 'block';
            return;
        }
        
        const results = allProducts.filter(p => 
            (p.title || '').toLowerCase().includes(query)
        );
        
        const grid = document.getElementById('searchResultsGrid');
        const noResults = document.getElementById('noSearchResults');
        
        if (results.length === 0) {
            grid.innerHTML = '';
            noResults.style.display = 'block';
        } else {
            grid.innerHTML = results.map(p => renderProductCard(p)).join('');
            noResults.style.display = 'none';
        }
        
        resultsSection.style.display = 'block';
        dynamicSections.style.display = 'none';
    }
}

// ============================================================
// LOAD SETTINGS
// ============================================================
async function loadSettings() {
    try {
        const { data } = await supabaseClient
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (data) {
            window.settings = {
                shopName: data.shop_name || 'Novahub',
                currency: data.currency || '৳',
                orderPrefix: data.order_prefix || 'NV',
                whatsappNumber: data.whatsapp_number || '01947939982',
                insideDhakaCharge: data.inside_dhaka_charge || 60,
                outsideDhakaCharge: data.outside_dhaka_charge || 120,
                footerDescription: data.footer_description || ''
            };
        }
    } catch (error) {
        console.error('Settings error:', error);
    }
}

// ============================================================
// LOAD LAYOUT
// ============================================================
async function loadLayout() {
    try {
        const { data } = await supabaseClient
            .from('homepage_layout')
            .select('*')
            .eq('id', 1)
            .single();
        
        const savedSections = data?.sections || [];
        
        const defaultLayout = [
            { id: 'slider', name: 'Slider', order: 1, visible: true, type: 'system' },
            { id: 'categories', name: 'Categories', order: 2, visible: true, type: 'system' },
            ...allSections.map((s, i) => ({
                id: `section_${s.id}`,
                sectionId: s.id,
                name: s.name,
                order: 100 + i,
                visible: true,
                type: 'custom_section'
            })),
            ...allBanners.map((b, i) => ({
                id: `banner_${b.id}`,
                bannerId: b.id,
                name: b.name || `Banner ${i + 1}`,
                imageUrl: b.image_url,
                order: 500 + i,
                visible: true,
                type: 'custom_banner'
            })),
            { id: 'all', name: 'All Products', order: 9999, visible: true, type: 'system' }
        ];
        
        layoutSections = defaultLayout.map(def => {
            const saved = savedSections.find(s => s.id === def.id);
            if (saved) {
                return { ...def, visible: saved.visible !== false, order: saved.order || def.order };
            }
            return def;
        });
        
        layoutSections.sort((a, b) => a.order - b.order);
        
        console.log('✅ Layout loaded:', layoutSections.length, 'sections');
        
    } catch (error) {
        console.error('Layout error:', error);
        layoutSections = [
            { id: 'slider', name: 'Slider', order: 1, visible: true, type: 'system' },
            { id: 'categories', name: 'Categories', order: 2, visible: true, type: 'system' },
            ...allSections.map((s, i) => ({
                id: `section_${s.id}`,
                sectionId: s.id,
                name: s.name,
                order: 100 + i,
                visible: true,
                type: 'custom_section'
            })),
            ...allBanners.map((b, i) => ({
                id: `banner_${b.id}`,
                bannerId: b.id,
                name: b.name || `Banner ${i + 1}`,
                imageUrl: b.image_url,
                order: 500 + i,
                visible: true,
                type: 'custom_banner'
            })),
            { id: 'all', name: 'All Products', order: 9999, visible: true, type: 'system' }
        ];
    }
}

// ============================================================
// RENDER LAYOUT SECTIONS
// ============================================================
function renderLayoutSections() {
    const container = document.getElementById('dynamicSections');
    if (!container) return;
    
    container.querySelectorAll('.custom-section-wrapper').forEach(el => el.remove());
    container.querySelectorAll('.custom-banner-wrapper').forEach(el => el.remove());
    
    const systemEls = {
        sliderSection: document.getElementById('sliderSection'),
        categoriesSection: document.getElementById('categoriesSection'),
        bannerSection: document.getElementById('bannerSection'),
        customSectionsSection: document.getElementById('customSectionsSection'),
        allSection: document.getElementById('allSection')
    };
    
    Object.values(systemEls).forEach(el => {
        if (el) {
            el.style.display = 'none';
            el.dataset.order = '';
        }
    });
    
    const visibleSections = layoutSections.filter(s => s.visible);
    console.log('🎨 Rendering visible sections:', visibleSections.map(s => s.name));
    
    const elementsToInsert = [];
    
    visibleSections.forEach(section => {
        // Custom Section (Products)
        if (section.type === 'custom_section') {
            const sectionData = allSections.find(s => s.id === section.sectionId);
            if (!sectionData) return;
            
            const sectionProducts = allProducts.filter(p => {
                const sectionIds = Array.isArray(p.section_ids) ? p.section_ids : [];
                return sectionIds.includes(sectionData.id);
            });
            
            if (sectionProducts.length === 0) return;
            
            const wrapper = document.createElement('section');
            wrapper.className = 'product-section custom-section-wrapper';
            wrapper.dataset.sectionId = sectionData.id;
            wrapper.dataset.order = section.order;
            wrapper.innerHTML = `
                <h2 class="section-title">${escapeHtml(sectionData.name)}</h2>
                <div class="products-grid">
                    ${sectionProducts.map(p => renderProductCard(p)).join('')}
                </div>
            `;
            
            elementsToInsert.push({ el: wrapper, order: section.order });
        }
        
        // Custom Banner
        else if (section.type === 'custom_banner') {
            const banner = allBanners.find(b => b.id === section.bannerId);
            if (!banner) return;
            
            const wrapper = document.createElement('section');
            wrapper.className = 'promo-banner-section custom-banner-wrapper';
            wrapper.dataset.bannerId = banner.id;
            wrapper.dataset.order = section.order;
            wrapper.innerHTML = `
                <div class="promo-banner-single" ${banner.target_link ? 'style="cursor:pointer;"' : ''}>
                    <img src="${escapeHtml(banner.image_url)}" 
                        alt="${escapeHtml(banner.name || 'Banner')}"
                        loading="lazy"
                        onerror="this.parentElement.style.display='none'">
                </div>
            `;
            
            if (banner.target_link && banner.target_link.trim()) {
                wrapper.querySelector('.promo-banner-single').addEventListener('click', () => {
                    window.location.href = banner.target_link;
                });
            }
            
            elementsToInsert.push({ el: wrapper, order: section.order });
        }
        
        // System Sections
        else {
            let el;
            switch(section.id) {
                case 'slider':
                    el = systemEls.sliderSection;
                    renderSlider();
                    break;
                case 'categories':
                    el = systemEls.categoriesSection;
                    renderCategories();
                    break;
                case 'all':
                    el = systemEls.allSection;
                    renderAllProducts();
                    break;
            }
            
            if (el) {
                el.style.display = 'block';
                el.dataset.order = section.order;
                elementsToInsert.push({ el, order: section.order });
            }
        }
    });
    
    elementsToInsert.sort((a, b) => a.order - b.order);
    elementsToInsert.forEach(({ el }) => {
        container.appendChild(el);
    });
    
    console.log('✅ Rendered in order:', elementsToInsert.map(e => e.order));
}

// ============================================================
// LOAD SLIDERS
// ============================================================
async function loadSliders() {
    try {
        const { data, error } = await supabaseClient
            .from('sliders')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        
        if (error) throw error;
        allSliders = data || [];
    } catch (error) {
        console.error('Error loading sliders:', error);
        allSliders = [];
    }
}

// ============================================================
// RENDER SLIDER
// ============================================================
function renderSlider() {
    const section = document.getElementById('sliderSection');
    if (!section) return;
    
    if (allSliders.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.innerHTML = `
        <div class="slider-container" id="sliderContainer">
            <div class="slider-wrapper" id="sliderWrapper">
                ${allSliders.map((s, i) => `
                    <img src="${escapeHtml(s.image_url)}" class="slide" alt="Slide ${i+1}" loading="${i === 0 ? 'eager' : 'lazy'}">
                `).join('')}
            </div>
            ${allSliders.length > 1 ? `
                <div class="slider-dots" id="sliderDots">
                    ${allSliders.map((_, i) => `<button class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    initSliderLogic();
}

function initSliderLogic() {
    const container = document.getElementById('sliderContainer');
    const wrapper = document.getElementById('sliderWrapper');
    if (!container || !wrapper) return;
    
    const slides = wrapper.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    
    if (slides.length === 0) return;
    
    let currentIndex = 0;
    let autoTimer;
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;
    let dragStartX = 0;
    
    function goTo(index) {
        currentIndex = (index + slides.length) % slides.length;
        wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    }
    
    function next() { goTo(currentIndex + 1); }
    function prev() { goTo(currentIndex - 1); }
    
    function startAuto() {
        stopAuto();
        if (slides.length > 1) {
            autoTimer = setInterval(next, 5000);
        }
    }
    function stopAuto() {
        if (autoTimer) clearInterval(autoTimer);
    }
    
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            goTo(parseInt(dot.dataset.index));
            startAuto();
        });
    });
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAuto();
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? next() : prev();
        }
        startAuto();
    }, { passive: true });
    
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        stopAuto();
    });
    
    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        const diff = dragStartX - e.clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? next() : prev();
        }
        isDragging = false;
        startAuto();
    });
    
    container.addEventListener('click', () => {
        if (Math.abs(touchStartX - touchEndX) > 10) return;
        
        const slide = allSliders[currentIndex];
        if (slide && slide.target_link && slide.target_link.trim()) {
            window.location.href = slide.target_link;
        }
    });
    
    startAuto();
}

// ============================================================
// LOAD CATEGORIES
// ============================================================
async function loadCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        
        if (error) throw error;
        allCategories = data || [];
    } catch (error) {
        console.error('Error loading categories:', error);
        allCategories = [];
    }
}

// ============================================================
// RENDER CATEGORIES
// ============================================================
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    const section = document.getElementById('categoriesSection');
    if (!container) return;
    
    if (allCategories.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    container.innerHTML = allCategories.map(cat => `
        <div class="category-card" onclick="filterByCategory('${cat.id}')">
            <img src="${escapeHtml(cat.image_url || 'https://via.placeholder.com/150')}" 
                alt="${escapeHtml(cat.name)}" 
                loading="lazy" 
                onerror="this.src='https://via.placeholder.com/150'">
            <h3>${escapeHtml(cat.name)}</h3>
        </div>
    `).join('');
}

// ============================================================
// LOAD SECTIONS
// ============================================================
async function loadSections() {
    try {
        const { data, error } = await supabaseClient
            .from('sections')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        
        if (error) throw error;
        allSections = data || [];
        console.log('✅ Sections loaded:', allSections.length);
    } catch (error) {
        console.error('Error loading sections:', error);
        allSections = [];
    }
}

// ============================================================
// LOAD PROMO BANNERS
// ============================================================
async function loadPromoBanners() {
    try {
        const { data, error } = await supabaseClient
            .from('promo_banners')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });
        
        if (error) throw error;
        allBanners = data || [];
        console.log('✅ Banners loaded:', allBanners.length);
    } catch (error) {
        console.error('Error loading banners:', error);
        allBanners = [];
    }
}

// ============================================================
// RENDER SIDEBAR COLLECTIONS
// ============================================================
function renderSidebarCollections() {
    const container = document.getElementById('sidebarCollectionsGrid');
    if (!container) return;
    
    if (allCategories.length === 0) {
        container.innerHTML = '<p style="font-size:12px;color:#888;grid-column:1/-1;text-align:center;">No collections</p>';
        return;
    }
    
    const display = allCategories.slice(0, 6);
    
    container.innerHTML = display.map(cat => `
        <div class="collection-card" onclick="filterByCategory('${cat.id}')">
            <div class="collection-img-wrap">
                <img src="${escapeHtml(cat.image_url || 'https://via.placeholder.com/150')}" 
                    alt="${escapeHtml(cat.name)}" 
                    loading="lazy" 
                    onerror="this.src='https://via.placeholder.com/150'">
            </div>
            <div class="collection-name">${escapeHtml(cat.name)}</div>
        </div>
    `).join('');
}

// ============================================================
// LOAD PRODUCTS
// ============================================================
async function loadProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        allProducts = data || [];
        console.log('✅ Products loaded:', allProducts.length);
    } catch (error) {
        console.error('Error loading products:', error);
        allProducts = [];
    }
}

// ============================================================
// RENDER ALL PRODUCTS
// ============================================================
function renderAllProducts() {
    const grid = document.getElementById('allProductsGrid');
    
    if (!grid) return;
    
    if (allProducts.length === 0) {
        grid.innerHTML = '<div class="no-products"><i class="fas fa-box-open" style="font-size:48px;opacity:0.3;margin-bottom:15px;display:block;"></i><p>No products available</p></div>';
        return;
    }
    
    grid.innerHTML = allProducts.map(p => renderProductCard(p)).join('');
}

// ============================================================
// PRODUCT CARD
// ============================================================
function renderProductCard(product) {
    const price = safeParseNumber(product.price);
    const oldPrice = safeParseNumber(product.old_price);
    const hasDiscount = oldPrice > price;
    const discountPercent = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
    const isOutOfStock = product.stock_status === 'out_of_stock';
    
    return `
        <div class="product-card">
            <div class="product-image-wrapper">
                ${hasDiscount ? `<div class="product-badge">-${discountPercent}%</div>` : ''}
                <img 
                    src="${escapeHtml(product.image_url || 'https://via.placeholder.com/300')}" 
                    alt="${escapeHtml(product.title)}" 
                    class="product-image" 
                    loading="lazy"
                    onclick="openProduct('${product.id}')"
                    onerror="this.src='https://via.placeholder.com/300'"
                >
                ${isOutOfStock ? '<div class="stock-badge out-of-stock">Out of Stock</div>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title" onclick="openProduct('${product.id}')">${escapeHtml(product.title)}</h3>
                <div class="product-price">
                    <span class="current-price">${formatPrice(price)}</span>
                    ${hasDiscount ? `<span class="old-price">${formatPrice(oldPrice)}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn add-to-cart" onclick="addToCart('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Add
                    </button>
                    <button class="btn buy-now" onclick="openProduct('${product.id}')">
                        <i class="fas fa-bolt"></i> Buy
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// OPEN PRODUCT
// ============================================================
function openProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

window.openProduct = openProduct;

// ============================================================
// FILTER BY CATEGORY
// ============================================================
function filterByCategory(categoryId) {
    window.location.href = `index.html?category=${categoryId}`;
}

window.filterByCategory = filterByCategory;

// ============================================================
// CART
// ============================================================
function setupCartIcon() {
    const cartIcon = document.getElementById('cartIconContainer');
    if (cartIcon) {
        cartIcon.addEventListener('click', openCartSidebar);
    }
    
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartSidebar);
    }
}

function openCartSidebar() {
    document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartSidebar() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

window.closeCartSidebar = closeCartSidebar;

async function loadCartFromStorage() {
    try {
        const saved = localStorage.getItem('novahub_cart');
        cart = saved ? JSON.parse(saved) : [];
        
        const savedSelected = localStorage.getItem('novahub_selected_cart');
        selectedCartItems = savedSelected ? JSON.parse(savedSelected) : [];
    } catch (e) {
        cart = [];
        selectedCartItems = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem('novahub_cart', JSON.stringify(cart));
        localStorage.setItem('novahub_selected_cart', JSON.stringify(selectedCartItems));
    } catch (e) {
        console.error('Error saving cart:', e);
    }
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }
    
    if (product.stock_status === 'out_of_stock') {
        showToast('Out of stock', 'error');
        return;
    }
    
    const existing = cart.find(item => item.productId === productId && !item.selectedVariant);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            productId: productId,
            title: product.title,
            price: safeParseNumber(product.price),
            imageURL: product.image_url,
            quantity: 1,
            selectedVariant: null
        });
    }
    
    saveCart();
    updateCartUI();
    showToast(`${product.title} added to cart`, 'success');
}

window.addToCart = addToCart;

function updateCartUI() {
    const countEl = document.getElementById('cartCount');
    const itemsEl = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('cartSubtotal');
    const selectedCountEl = document.getElementById('selectedCount');
    const selectedCartCountEl = document.getElementById('selectedCartCount');
    
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (countEl) countEl.textContent = totalItems;
    
    if (!itemsEl) return;
    
    if (cart.length === 0) {
        itemsEl.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        if (subtotalEl) subtotalEl.textContent = '৳0';
        if (selectedCountEl) selectedCountEl.textContent = '0';
        if (selectedCartCountEl) selectedCartCountEl.textContent = '0/0';
        return;
    }
    
    let subtotal = 0;
    let selectedCount = 0;
    
    itemsEl.innerHTML = cart.map(item => {
        const price = safeParseNumber(item.price) || safeParseNumber(allProducts.find(p => p.id === item.productId)?.price);
        const itemTotal = price * item.quantity;
        const itemKey = generateItemKey(item.productId, item.selectedVariant);
        const isSelected = selectedCartItems.includes(itemKey);
        
        subtotal += itemTotal;
        if (isSelected) selectedCount++;
        
        const variantText = item.selectedVariant 
            ? Object.entries(item.selectedVariant).map(([k,v]) => `${k}: ${v}`).join(', ')
            : '';
        
        return `
            <div class="cart-item">
                <input type="checkbox" class="cart-item-checkbox" ${isSelected ? 'checked' : ''} 
                    onchange="toggleCartItem('${item.productId}', ${JSON.stringify(item.selectedVariant || null).replace(/"/g, '&quot;')})">
                <img src="${escapeHtml(item.imageURL || 'https://via.placeholder.com/56')}" 
                    alt="${escapeHtml(item.title || 'Product')}" 
                    onclick="openProduct('${item.productId}')"
                    onerror="this.src='https://via.placeholder.com/56'">
                <div class="cart-item-info">
                    <div class="cart-item-title">${escapeHtml(item.title || 'Product')}</div>
                    ${variantText ? `<div style="font-size:11px;color:#888;margin:2px 0;">${escapeHtml(variantText)}</div>` : ''}
                    <div class="cart-item-price">${formatPrice(price)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity('${item.productId}', -1, ${JSON.stringify(item.selectedVariant || null).replace(/"/g, '&quot;')})">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.productId}', 1, ${JSON.stringify(item.selectedVariant || null).replace(/"/g, '&quot;')})">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.productId}', ${JSON.stringify(item.selectedVariant || null).replace(/"/g, '&quot;')})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (selectedCountEl) selectedCountEl.textContent = selectedCount;
    if (selectedCartCountEl) selectedCartCountEl.textContent = `${selectedCount}/${cart.length}`;
}

function toggleCartItem(productId, selectedVariant) {
    const itemKey = generateItemKey(productId, selectedVariant);
    const idx = selectedCartItems.indexOf(itemKey);
    
    if (idx > -1) {
        selectedCartItems.splice(idx, 1);
    } else {
        selectedCartItems.push(itemKey);
    }
    
    saveCart();
    updateCartUI();
}

window.toggleCartItem = toggleCartItem;

function updateQuantity(productId, delta, selectedVariant) {
    const item = cart.find(i => i.productId === productId && areVariantsEqual(i.selectedVariant, selectedVariant));
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity <= 0) {
        removeFromCart(productId, selectedVariant);
        return;
    }
    
    saveCart();
    updateCartUI();
}

window.updateQuantity = updateQuantity;

function removeFromCart(productId, selectedVariant) {
    cart = cart.filter(i => !(i.productId === productId && areVariantsEqual(i.selectedVariant, selectedVariant)));
    
    const itemKey = generateItemKey(productId, selectedVariant);
    selectedCartItems = selectedCartItems.filter(k => k !== itemKey);
    
    saveCart();
    updateCartUI();
    showToast('Item removed', 'info');
}

window.removeFromCart = removeFromCart;

// Select All
document.addEventListener('DOMContentLoaded', () => {
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedCartItems = cart.map(item => generateItemKey(item.productId, item.selectedVariant));
            } else {
                selectedCartItems = [];
            }
            saveCart();
            updateCartUI();
        });
    }
});

// ============================================================
// GO TO CHECKOUT
// ============================================================
function goToCheckout() {
    if (selectedCartItems.length === 0) {
        showToast('Please select items to checkout', 'warning');
        return;
    }
    window.location.href = 'checkout.html';
}

window.goToCheckout = goToCheckout;

// ============================================================
// LOGOUT
// ============================================================
async function handleLogout() {
    const result = await logoutUser();
    if (result.success) {
        showToast('Logged out', 'success');
        setTimeout(() => window.location.reload(), 800);
    }
}

window.handleLogout = handleLogout;

console.log('✅ Homepage script loaded');