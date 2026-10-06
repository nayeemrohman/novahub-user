// ============================================================
// NOVAHUB — Unified Cart Module (v4)
// Used by: index, product, checkout, order-track, static pages
// Single source of truth for cart operations
// ============================================================

(function() {
    'use strict';
    
    // ============================================================
    // STATE
    // ============================================================
    let cart = [];
    let selectedCartItems = [];
    
    // ============================================================
    // LOAD FROM STORAGE
    // ============================================================
    function loadCart() {
        try {
            const saved = localStorage.getItem('novahub_cart');
            cart = saved ? JSON.parse(saved) : [];
            
            const savedSelected = localStorage.getItem('novahub_selected_cart');
            selectedCartItems = savedSelected ? JSON.parse(savedSelected) : [];
        } catch (e) {
            cart = [];
            selectedCartItems = [];
        }
        return cart;
    }
    
    function saveCart() {
        try {
            localStorage.setItem('novahub_cart', JSON.stringify(cart));
            localStorage.setItem('novahub_selected_cart', JSON.stringify(selectedCartItems));
        } catch (e) {
            console.error('Save cart error:', e);
        }
    }
    
    // ============================================================
    // GETTERS
    // ============================================================
    function getCart() {
        if (cart.length === 0) loadCart();
        return cart;
    }
    
    function getSelected() {
        if (selectedCartItems.length === 0 && cart.length === 0) loadCart();
        return selectedCartItems;
    }
    
    function getTotalCount() {
        return getCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
    
    function getSelectedItems() {
        const c = getCart();
        const s = getSelected();
        return c.filter(item => {
            const key = generateItemKey(item.productId, item.selectedVariant);
            return s.includes(key);
        });
    }
    
    function getSubtotal() {
        return getCart().reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            return sum + (price * (item.quantity || 0));
        }, 0);
    }
    
    // ============================================================
    // ADD
    // ============================================================
    function addToCart(product, quantity, selectedVariant) {
        if (!product || !product.id) {
            console.error('Invalid product');
            return { success: false };
        }
        
        if (product.stock_status === 'out_of_stock') {
            return { success: false, error: 'out_of_stock' };
        }
        
        quantity = quantity || 1;
        selectedVariant = selectedVariant || null;
        
        loadCart();
        
        const existingIdx = cart.findIndex(item => 
            item.productId === product.id && 
            areVariantsEqual(item.selectedVariant, selectedVariant)
        );
        
        if (existingIdx >= 0) {
            cart[existingIdx].quantity += quantity;
        } else {
            cart.push({
                productId: product.id,
                title: product.title,
                price: parseFloat(product.price) || 0,
                imageURL: product.image_url,
                quantity: quantity,
                selectedVariant: selectedVariant
            });
        }
        
        saveCart();
        
        if (typeof window.trackAddToCart === 'function') {
            window.trackAddToCart(product, quantity);
        }
        
        return { success: true };
    }
    
    // ============================================================
    // UPDATE QUANTITY
    // ============================================================
    function updateQuantity(productId, delta, selectedVariant) {
        loadCart();
        const item = cart.find(i => 
            i.productId === productId && 
            areVariantsEqual(i.selectedVariant, selectedVariant)
        );
        
        if (!item) return { success: false };
        
        item.quantity += delta;
        
        if (item.quantity <= 0) {
            return removeFromCart(productId, selectedVariant);
        }
        
        saveCart();
        return { success: true };
    }
    
    // ============================================================
    // REMOVE
    // ============================================================
    function removeFromCart(productId, selectedVariant) {
        loadCart();
        
        cart = cart.filter(i => 
            !(i.productId === productId && 
            areVariantsEqual(i.selectedVariant, selectedVariant))
        );
        
        const itemKey = generateItemKey(productId, selectedVariant);
        selectedCartItems = selectedCartItems.filter(k => k !== itemKey);
        
        saveCart();
        return { success: true };
    }
    
    // ============================================================
    // SELECT / DESELECT
    // ============================================================
    function toggleCartItem(productId, selectedVariant) {
        loadCart();
        const itemKey = generateItemKey(productId, selectedVariant);
        const idx = selectedCartItems.indexOf(itemKey);
        
        if (idx > -1) {
            selectedCartItems.splice(idx, 1);
        } else {
            selectedCartItems.push(itemKey);
        }
        
        saveCart();
        return { success: true };
    }
    
    function selectAll() {
        loadCart();
        selectedCartItems = cart.map(item => 
            generateItemKey(item.productId, item.selectedVariant)
        );
        saveCart();
    }
    
    function deselectAll() {
        selectedCartItems = [];
        saveCart();
    }
    
    function clearSelected() {
        loadCart();
        cart = cart.filter(item => {
            const key = generateItemKey(item.productId, item.selectedVariant);
            return !selectedCartItems.includes(key);
        });
        selectedCartItems = [];
        saveCart();
    }
    
    // ============================================================
    // UI RENDER (for sidebar)
    // ============================================================
    function renderCartUI() {
        const countEl = document.getElementById('cartCount');
        const itemsEl = document.getElementById('cartItems');
        const subtotalEl = document.getElementById('cartSubtotal');
        const selectedCountEl = document.getElementById('selectedCount');
        const selectedCartCountEl = document.getElementById('selectedCartCount');
        
        loadCart();
        
        const totalItems = getTotalCount();
        if (countEl) {
            countEl.textContent = totalItems;
            countEl.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        
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
            const price = parseFloat(item.price) || 0;
            const itemTotal = price * item.quantity;
            const itemKey = generateItemKey(item.productId, item.selectedVariant);
            const isSelected = selectedCartItems.includes(itemKey);
            
            subtotal += itemTotal;
            if (isSelected) selectedCount++;
            
            const variantText = item.selectedVariant 
                ? Object.entries(item.selectedVariant).map(([k,v]) => `${k}: ${v}`).join(', ')
                : '';
            
            const variantJSON = JSON.stringify(item.selectedVariant || null).replace(/"/g, '&quot;');
            
            return `
                <div class="cart-item">
                    <input type="checkbox" class="cart-item-checkbox" ${isSelected ? 'checked' : ''} 
                        onchange="CartModule.toggleCartItem('${item.productId}', ${variantJSON})">
                    <img src="${escapeHtml(item.imageURL || 'https://via.placeholder.com/56')}" 
                        alt="${escapeHtml(item.title || 'Product')}"
                        onclick="window.location.href='product.html?id=${item.productId}'"
                        onerror="this.src='https://via.placeholder.com/56'">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${escapeHtml(item.title || 'Product')}</div>
                        ${variantText ? `<div style="font-size:11px;color:#888;margin:2px 0;">${escapeHtml(variantText)}</div>` : ''}
                        <div class="cart-item-price">${formatPrice(price)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="CartModule.updateQuantityAndRefresh('${item.productId}', -1, ${variantJSON})">−</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="CartModule.updateQuantityAndRefresh('${item.productId}', 1, ${variantJSON})">+</button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="CartModule.removeAndRefresh('${item.productId}', ${variantJSON})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
        if (selectedCountEl) selectedCountEl.textContent = selectedCount;
        if (selectedCartCountEl) selectedCartCountEl.textContent = `${selectedCount}/${cart.length}`;
        
        // Update select-all checkbox
        const selectAllBox = document.getElementById('selectAllCheckbox');
        if (selectAllBox) {
            selectAllBox.checked = selectedCount === cart.length && cart.length > 0;
        }
    }
    
    // ============================================================
    // WRAPPER FUNCTIONS (with UI refresh)
    // ============================================================
    function updateQuantityAndRefresh(productId, delta, selectedVariant) {
        updateQuantity(productId, delta, selectedVariant);
        renderCartUI();
    }
    
    function removeAndRefresh(productId, selectedVariant) {
        removeFromCart(productId, selectedVariant);
        renderCartUI();
        if (typeof showToast === 'function') showToast('Item removed', 'info');
    }
    
    function toggleCartItemAndRefresh(productId, selectedVariant) {
        toggleCartItem(productId, selectedVariant);
        renderCartUI();
    }
    
    // ============================================================
    // SIDEBAR OPEN / CLOSE
    // ============================================================
    function openCartSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (sidebar && overlay) {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            renderCartUI();
        }
    }
    
    function closeCartSidebar() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (sidebar && overlay) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    // ============================================================
    // CHECKOUT
    // ============================================================
    function goToCheckout() {
        loadCart();
        if (selectedCartItems.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Please select items to checkout', 'warning');
            }
            return;
        }
        window.location.href = 'checkout.html';
    }
    
    // ============================================================
    // INIT (auto-run on DOM ready)
    // ============================================================
    function init() {
        loadCart();
        renderCartUI();
        
        const cartBtn = document.getElementById('headerCartBtn') || 
                        document.getElementById('cartIconContainer');
        if (cartBtn) {
            cartBtn.addEventListener('click', openCartSidebar);
        }
        
        const cartOverlay = document.getElementById('cartOverlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', closeCartSidebar);
        }
        
        const selectAllBox = document.getElementById('selectAllCheckbox');
        if (selectAllBox) {
            selectAllBox.addEventListener('change', (e) => {
                if (e.target.checked) selectAll();
                else deselectAll();
                renderCartUI();
            });
        }
        
        // Listen to storage changes (multi-tab sync)
        window.addEventListener('storage', (e) => {
            if (e.key === 'novahub_cart' || e.key === 'novahub_selected_cart') {
                loadCart();
                renderCartUI();
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ============================================================
    // EXPORT
    // ============================================================
    window.CartModule = {
        // State
        getCart: getCart,
        getSelected: getSelected,
        getSelectedItems: getSelectedItems,
        getTotalCount: getTotalCount,
        getSubtotal: getSubtotal,
        
        // Actions
        addToCart: addToCart,
        updateQuantity: updateQuantity,
        removeFromCart: removeFromCart,
        toggleCartItem: toggleCartItem,
        selectAll: selectAll,
        deselectAll: deselectAll,
        clearSelected: clearSelected,
        
        // UI
        renderCartUI: renderCartUI,
        updateQuantityAndRefresh: updateQuantityAndRefresh,
        removeAndRefresh: removeAndRefresh,
        toggleCartItemAndRefresh: toggleCartItemAndRefresh,
        openCartSidebar: openCartSidebar,
        closeCartSidebar: closeCartSidebar,
        
        // Checkout
        goToCheckout: goToCheckout
    };
    
    // Legacy aliases (for backwards compatibility)
    window.loadCartFromStorage = loadCart;
    window.updateCartUI = renderCartUI;
    window.closeCartSidebar = closeCartSidebar;
    window.openCartSidebar = openCartSidebar;
    window.goToCheckout = goToCheckout;
    
    console.log('✅ Unified Cart Module loaded (v4)');
})();