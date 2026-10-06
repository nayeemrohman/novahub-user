// ============================================================
// NOVAHUB — Shared Cart + Header Functions
// Used in: order-track, checkout, about, terms, privacy
// ============================================================

let sharedCart = [];
let sharedSelectedCart = [];

// ============================================================
// INIT — Load cart from localStorage
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadSharedCart();
    await updateAuthUI();
    await updateSharedHeaderProfile();
    updateSharedCartUI();
    setupSharedCartIcon();
});

// ============================================================
// LOAD CART
// ============================================================
async function loadSharedCart() {
    try {
        const saved = localStorage.getItem('novahub_cart');
        sharedCart = saved ? JSON.parse(saved) : [];
        
        const savedSelected = localStorage.getItem('novahub_selected_cart');
        sharedSelectedCart = savedSelected ? JSON.parse(savedSelected) : [];
    } catch (e) {
        sharedCart = [];
        sharedSelectedCart = [];
    }
}

function saveSharedCart() {
    try {
        localStorage.setItem('novahub_cart', JSON.stringify(sharedCart));
        localStorage.setItem('novahub_selected_cart', JSON.stringify(sharedSelectedCart));
    } catch (e) {
        console.error('Save cart error:', e);
    }
}

// ============================================================
// HEADER PROFILE ICON (Dynamic)
// ============================================================
async function updateSharedHeaderProfile() {
    const user = await getCurrentUser();
    const profileIcon = document.getElementById('headerProfileIcon');
    
    if (!profileIcon) return;
    
    if (user) {
        const profile = await getUserProfile(user.id);
        const googleData = user.user_metadata || {};
        
        const photoUrl = profile?.avatar_url 
            || googleData.avatar_url 
            || googleData.picture 
            || null;
        
        const parentBtn = profileIcon.parentElement;
        
        if (photoUrl) {
            parentBtn.innerHTML = `<img src="${escapeHtml(photoUrl)}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.outerHTML='<i class=\\'fas fa-user\\' id=\\'headerProfileIcon\\'></i>'">`;
        } else {
            profileIcon.className = 'fas fa-user-circle';
        }
    }
}

// ============================================================
// PROFILE CLICK
// ============================================================
async function handleProfileClick() {
    const user = await getCurrentUser();
    
    if (user) {
        window.location.href = 'profile.html';
    } else {
        window.location.href = 'auth.html';
    }
}

window.handleProfileClick = handleProfileClick;

// ============================================================
// CART UI
// ============================================================
function setupSharedCartIcon() {
    const cartBtn = document.getElementById('headerCartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', openCartSidebar);
    }
    
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartSidebar);
    }
}

function openCartSidebar() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar && overlay) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
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

window.openCartSidebar = openCartSidebar;
window.closeCartSidebar = closeCartSidebar;

function updateSharedCartUI() {
    const countEl = document.getElementById('cartCount');
    const itemsEl = document.getElementById('cartItems');
    const subtotalEl = document.getElementById('cartSubtotal');
    const selectedCountEl = document.getElementById('selectedCount');
    const selectedCartCountEl = document.getElementById('selectedCartCount');
    
    const totalItems = sharedCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (countEl) countEl.textContent = totalItems;
    
    if (!itemsEl) return;
    
    if (sharedCart.length === 0) {
        itemsEl.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        if (subtotalEl) subtotalEl.textContent = '৳0';
        if (selectedCountEl) selectedCountEl.textContent = '0';
        if (selectedCartCountEl) selectedCartCountEl.textContent = '0/0';
        return;
    }
    
    let subtotal = 0;
    let selectedCount = 0;
    
    itemsEl.innerHTML = sharedCart.map(item => {
        const price = parseFloat(item.price) || 0;
        const itemTotal = price * item.quantity;
        const itemKey = generateSharedItemKey(item.productId, item.selectedVariant);
        const isSelected = sharedSelectedCart.includes(itemKey);
        
        subtotal += itemTotal;
        if (isSelected) selectedCount++;
        
        const variantText = item.selectedVariant 
            ? Object.entries(item.selectedVariant).map(([k,v]) => `${k}: ${v}`).join(', ')
            : '';
        
        return `
            <div class="cart-item">
                <input type="checkbox" class="cart-item-checkbox" ${isSelected ? 'checked' : ''} 
                    onchange="toggleSharedCartItem('${item.productId}', ${JSON.stringify(item.selectedVariant || null).replace(/"/g, '&quot;')})">
                <img src="${escapeHtml(item.imageURL || 'https://via.placeholder.com/56')}" 
                    alt="${escapeHtml(item.title || 'Product')}"
                    onerror="this.src='https://via.placeholder.com/56'">
                <div class="cart-item-info">
                    <div class="cart-item-title">${escapeHtml(item.title || 'Product')}</div>
                    ${variantText ? `<div style="font-size:11px;color:#888;margin:2px 0;">${escapeHtml(variantText)}</div>` : ''}
                    <div class="cart-item-price">৳${price.toLocaleString('en-BD')}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateSharedQuantity('${item.productId}', -1, ${JSON.stringify(item.selectedVariant || null).replace(/"/g, '&quot;')})">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateSharedQuantity('${item.productId}', 1, ${JSON.stringify(item.selectedVariant || null).replace(/"/g, '&quot;')})">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeSharedFromCart('${item.productId}', ${JSON.stringify(item.selectedVariant || null).replace(/"/g, '&quot;')})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    
    if (subtotalEl) subtotalEl.textContent = '৳' + subtotal.toLocaleString('en-BD');
    if (selectedCountEl) selectedCountEl.textContent = selectedCount;
    if (selectedCartCountEl) selectedCartCountEl.textContent = `${selectedCount}/${sharedCart.length}`;
}

function toggleSharedCartItem(productId, selectedVariant) {
    const itemKey = generateSharedItemKey(productId, selectedVariant);
    const idx = sharedSelectedCart.indexOf(itemKey);
    
    if (idx > -1) {
        sharedSelectedCart.splice(idx, 1);
    } else {
        sharedSelectedCart.push(itemKey);
    }
    
    saveSharedCart();
    updateSharedCartUI();
}

window.toggleSharedCartItem = toggleSharedCartItem;

function updateSharedQuantity(productId, delta, selectedVariant) {
    const item = sharedCart.find(i => 
        i.productId === productId && 
        JSON.stringify(i.selectedVariant) === JSON.stringify(selectedVariant)
    );
    
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity <= 0) {
        removeSharedFromCart(productId, selectedVariant);
        return;
    }
    
    saveSharedCart();
    updateSharedCartUI();
}

window.updateSharedQuantity = updateSharedQuantity;

function removeSharedFromCart(productId, selectedVariant) {
    sharedCart = sharedCart.filter(i => 
        !(i.productId === productId && 
        JSON.stringify(i.selectedVariant) === JSON.stringify(selectedVariant))
    );
    
    const itemKey = generateSharedItemKey(productId, selectedVariant);
    sharedSelectedCart = sharedSelectedCart.filter(k => k !== itemKey);
    
    saveSharedCart();
    updateSharedCartUI();
    showToast('Item removed', 'info');
}

window.removeSharedFromCart = removeSharedFromCart;

function goToCheckout() {
    if (sharedSelectedCart.length === 0) {
        showToast('Please select items to checkout', 'warning');
        return;
    }
    window.location.href = 'checkout.html';
}

window.goToCheckout = goToCheckout;

function generateSharedItemKey(productId, selectedVariant) {
    if (!selectedVariant || Object.keys(selectedVariant).length === 0) {
        return productId;
    }
    const sortedKeys = Object.keys(selectedVariant).sort();
    const variantString = sortedKeys.map(k => `${k}:${selectedVariant[k]}`).join('|');
    return `${productId}|${variantString}`;
}

// ============================================================
// SELECT ALL
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            if (e.target.checked) {
                sharedSelectedCart = sharedCart.map(item => 
                    generateSharedItemKey(item.productId, item.selectedVariant)
                );
            } else {
                sharedSelectedCart = [];
            }
            saveSharedCart();
            updateSharedCartUI();
        });
    }
});

console.log('✅ Shared cart script loaded');