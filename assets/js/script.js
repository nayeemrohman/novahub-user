// ============================================================
// NOVAHUB — Homepage Script (v4 — Uses Unified CartModule)
// ============================================================

let allProducts = [];
let allCategories = [];
let allSections = [];
let allSliders = [];
let allBanners = [];
let layoutSections = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Novahub Homepage initializing...');
    
    setupMenuToggle();
    setupSearch();
    
    await loadSettings();
    await updateAuthUI();
    
    await Promise.all([
        loadSliders(),
        loadCategories(),
        loadSections(),
        loadPromoBanners(),
        loadProducts()
    ]);
    
    await loadLayout();
    renderLayoutSections();
    renderSidebarCollections();
    
    // Handle ?openCart=1 param
    const params = new URLSearchParams(window.location.search);
    if (params.get('openCart') === '1') {
        setTimeout(() => CartModule.openCartSidebar(), 500);
    }
    
    // Handle ?category=xxx
    const catId = params.get('category');
    if (catId) {
        setTimeout(() => filterByCategory(catId), 300);
    }
    
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
    
    function closeMenu() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    window.closeMenu = closeMenu;
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
        debounceTimer = setTimeout(() => performSearch(query), 300);
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
            .from('settings').select('*').eq('id', 1).single();
        
        if (data) {
            window.settings = {
                shopName: data.shop_name || 'Novahub',
                currency: data.currency || '৳',
                orderPrefix: data.order_prefix || 'NV',
                whatsappNumber: data.whatsapp_number || '01947939982',
                insideDhakaCharge: data.inside_dhaka_charge || 60,
                outsideDhakaCharge: data.outside_dhaka_charge || 120
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
    let savedSections = [];
    try {
        const { data } = await supabaseClient
            .from('homepage_layout').select('*').eq('id', 1).single();
        savedSections = data?.sections || [];
    } catch (error) {
        console.error('Layout error:', error);
    }
    
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
        allSection: document.getElementById('allSection')
    };
    
    Object.values(systemEls).forEach(el => {
        if (el) el.style.display = 'none';
    });
    
    const visibleSections = layoutSections.filter(s => s.visible);
    const elementsToInsert = [];
    
    visibleSections.forEach(section => {
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
            wrapper.dataset.order = section.order;
            wrapper.innerHTML = `
                <h2 class="section-title">${escapeHtml(sectionData.name)}</h2>
                <div class="products-grid">
                    ${sectionProducts.map(p => renderProductCard(p)).join('')}
                </div>
            `;
            elementsToInsert.push({ el: wrapper, order: section.order });
        }
        else if (section.type === 'custom_banner') {
            const banner = allBanners.find(b => b.id === section.bannerId);
            if (!banner) return;
            
            const wrapper = document.createElement('section');
            wrapper.className = 'promo-banner-section custom-banner-wrapper';
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
    elementsToInsert.forEach(({ el }) => container.appendChild(el));
}

// ============================================================
// LOAD SLIDERS
// ============================================================
async function loadSliders() {
    try {
        const { data, error } = await supabaseClient
            .from('sliders').select('*').eq('is_active', true)
            .order('order_index', { ascending: true });
        if (error) throw error;
        allSliders = data || [];
    } catch (error) {
        console.error('Sliders error:', error);
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
        if (slides.length > 1) autoTimer = setInterval(next, 5000);
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
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
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
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
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
            .from('categories').select('*').eq('is_active', true)
            .order('order_index', { ascending: true });
        if (error) throw error;
        allCategories = data || [];
    } catch (error) {
        console.error('Categories error:', error);
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
                alt="${escapeHtml(cat.name)}" loading="lazy" 
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
            .from('sections').select('*').eq('is_active', true)
            .order('order_index', { ascending: true });
        if (error) throw error;
        allSections = data || [];
    } catch (error) {
        console.error('Sections error:', error);
        allSections = [];
    }
}

// ============================================================
// LOAD BANNERS
// ============================================================
async function loadPromoBanners() {
    try {
        const { data, error } = await supabaseClient
            .from('promo_banners').select('*').eq('is_active', true)
            .order('order_index', { ascending: true });
        if (error) throw error;
        allBanners = data || [];
    } catch (error) {
        console.error('Banners error:', error);
        allBanners = [];
    }
}

// ============================================================
// SIDEBAR COLLECTIONS
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
                    alt="${escapeHtml(cat.name)}" loading="lazy" 
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
            .from('products').select('*').eq('is_active', true)
            .order('created_at', { ascending: false });
        if (error) throw error;
        allProducts = data || [];
    } catch (error) {
        console.error('Products error:', error);
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
                <img src="${escapeHtml(product.image_url || 'https://via.placeholder.com/300')}" 
                    alt="${escapeHtml(product.title)}" class="product-image" loading="lazy"
                    onclick="openProduct('${product.id}')"
                    onerror="this.src='https://via.placeholder.com/300'">
                ${isOutOfStock ? '<div class="stock-badge out-of-stock">Out of Stock</div>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title" onclick="openProduct('${product.id}')">${escapeHtml(product.title)}</h3>
                <div class="product-price">
                    <span class="current-price">${formatPrice(price)}</span>
                    ${hasDiscount ? `<span class="old-price">${formatPrice(oldPrice)}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn add-to-cart" onclick="quickAddToCart('${product.id}')" ${isOutOfStock ? 'disabled' : ''}>
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
// QUICK ADD TO CART (homepage)
// ============================================================
function quickAddToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }
    
    // If product has variants, redirect to product page
    if (product.enable_variants && Array.isArray(product.variants) && product.variants.length > 0) {
        window.location.href = `product.html?id=${productId}`;
        return;
    }
    
    const result = CartModule.addToCart(product, 1, null);
    if (result.success) {
        CartModule.renderCartUI();
        showToast(`${product.title} added to cart`, 'success');
    } else if (result.error === 'out_of_stock') {
        showToast('Out of stock', 'error');
    }
}

window.quickAddToCart = quickAddToCart;

// ============================================================
// OPEN PRODUCT / FILTER
// ============================================================
function openProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}
window.openProduct = openProduct;

function filterByCategory(categoryId) {
    // Since we don't have a category page, just filter all products
    const filtered = allProducts.filter(p => {
        const catIds = Array.isArray(p.category_ids) ? p.category_ids : [];
        return catIds.includes(categoryId);
    });
    
    const grid = document.getElementById('allProductsGrid');
    const allSection = document.getElementById('allSection');
    
    if (grid && allSection) {
        if (filtered.length > 0) {
            grid.innerHTML = filtered.map(p => renderProductCard(p)).join('');
        } else {
            grid.innerHTML = '<div class="no-products"><i class="fas fa-box-open" style="font-size:48px;opacity:0.3;margin-bottom:15px;display:block;"></i><p>No products in this category</p></div>';
        }
        allSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Close sidebar if open
    if (window.closeMenu) window.closeMenu();
}
window.filterByCategory = filterByCategory;

console.log('✅ Homepage script loaded (v4 — Unified Cart)');