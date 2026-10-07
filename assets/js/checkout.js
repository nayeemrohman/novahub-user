// ============================================================
// NOVAHUB — Checkout Script (v6 — CAPI Integration)
// - Pixel + Conversion API on Purchase
// - Parallel stock validation
// - Fixed currency prefix
// - Better error handling
// ============================================================

let checkoutMode = 'cart';
let checkoutItems = [];
let selectedDivision = '';
let selectedDistrict = '';
let selectedUpazila = '';

// ============================================================
// BACK
// ============================================================
function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'index.html';
}
window.goBack = goBack;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Checkout initializing...');
    
    await loadSettings();
    await updateAuthUI();
    
    const params = new URLSearchParams(window.location.search);
    checkoutMode = params.get('mode') === 'direct' ? 'direct' : 'cart';
    
    await buildCheckoutItems();
    renderCheckoutItems();
    updateSummary();
    
    setupSearchableDropdowns();
    setupDeliveryCharge();
    setupFormValidation();
    setupOutsideClickListener();
    
    await prefillUserInfo();
    
    if (typeof window.trackInitiateCheckout === 'function' && checkoutItems.length > 0) {
        const subtotal = checkoutItems.reduce((s, i) => s + (i.price * i.quantity), 0);
        window.trackInitiateCheckout(checkoutItems, subtotal);
    }
    
    await loadReviewsPreview();
    setupLightbox();
    
    console.log('✅ Checkout ready. Items:', checkoutItems.length);
});

// ============================================================
// LOAD SETTINGS
// ============================================================
async function loadSettings() {
    try {
        const { data } = await supabaseClient
            .from('settings').select('*').eq('id', 1).single();
        
        if (data) {
            window.settings = {
                ...window.settings,
                shopName: data.shop_name || 'Novahub',
                currency: data.currency || '৳',
                orderPrefix: data.order_prefix || 'NV',
                whatsappNumber: data.whatsapp_number || '01947939982',
                insideDhakaCharge: data.inside_dhaka_charge || 60,
                outsideDhakaCharge: data.outside_dhaka_charge || 120,
                webhookUrl: data.webhook_url || ''
            };
        }
    } catch (error) {
        console.error('Settings error:', error);
        window.settings = window.settings || {};
    }
}

// ============================================================
// SEARCHABLE DROPDOWNS
// ============================================================
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    
    const trigger = dropdown.querySelector('.dropdown-search-input');
    if (trigger && trigger.disabled) return;
    
    const isOpen = dropdown.classList.contains('open');
    
    document.querySelectorAll('.searchable-dropdown').forEach(d => d.classList.remove('open'));
    
    if (!isOpen) {
        dropdown.classList.add('open');
        const searchInput = dropdown.querySelector('.dropdown-search-input');
        if (searchInput) {
            searchInput.readOnly = false;
            searchInput.value = '';
            searchInput.focus();
            filterDropdownList(dropdown.id, '');
        }
    }
}
window.toggleDropdown = toggleDropdown;

function setupSearchableDropdowns() {
    const divisions = Object.keys(LOCATION_DATA.bangladesh.levels);
    renderDropdownList('divisionList', divisions, 'division');
    
    setupDropdownSearchInput('divisionSearch', 'divisionList', 'division');
    setupDropdownSearchInput('districtSearch', 'districtList', 'district');
    setupDropdownSearchInput('upazilaSearch', 'upazilaList', 'upazila');
}

function renderDropdownList(listId, items, type) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;
    
    if (!items || items.length === 0) {
        listEl.innerHTML = '<div class="dropdown-item no-result">কোনো ফলাফল নেই</div>';
        return;
    }
    
    listEl.innerHTML = items.map(item => {
        return `<div class="dropdown-item" data-value="${escapeHtml(item)}" data-type="${type}">${escapeHtml(item)}</div>`;
    }).join('');
    
    listEl.querySelectorAll('.dropdown-item:not(.no-result)').forEach(el => {
        el.addEventListener('click', () => {
            selectDropdownItem(el.dataset.type, el.dataset.value);
        });
    });
}

function filterDropdownList(dropdownId, query) {
    const listIdMap = {
        'divisionDropdown': 'divisionList',
        'districtDropdown': 'districtList',
        'upazilaDropdown': 'upazilaList'
    };
    
    const listId = listIdMap[dropdownId];
    if (!listId) return;
    
    const listEl = document.getElementById(listId);
    if (!listEl) return;
    
    const q = (query || '').toLowerCase().trim();
    const allItems = Array.from(listEl.querySelectorAll('.dropdown-item'))
        .filter(el => !el.classList.contains('no-result'));
    
    let matchCount = 0;
    allItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const match = !q || text.includes(q);
        item.style.display = match ? 'flex' : 'none';
        if (match) matchCount++;
    });
    
    const oldNoResult = listEl.querySelector('.dropdown-item.no-result');
    if (oldNoResult) oldNoResult.remove();
    
    if (matchCount === 0 && q) {
        const noResult = document.createElement('div');
        noResult.className = 'dropdown-item no-result';
        noResult.textContent = 'কোনো ফলাফল নেই';
        listEl.appendChild(noResult);
    }
}

function setupDropdownSearchInput(inputId, listId, type) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('input', (e) => {
        const parent = input.closest('.searchable-dropdown');
        if (!parent) return;
        filterDropdownList(parent.id, e.target.value);
    });
}

function selectDropdownItem(type, value) {
    if (type === 'division') {
        selectedDivision = value;
        document.getElementById('division').value = value;
        document.getElementById('divisionSearch').value = value;
        document.getElementById('divisionSearch').readOnly = true;
        
        selectedDistrict = '';
        selectedUpazila = '';
        document.getElementById('district').value = '';
        document.getElementById('districtSearch').value = '';
        document.getElementById('districtSearch').readOnly = true;
        document.getElementById('districtSearch').disabled = false;
        document.getElementById('upazila').value = '';
        document.getElementById('upazilaSearch').value = '';
        document.getElementById('upazilaSearch').disabled = true;
        
        const districts = Object.keys(LOCATION_DATA.bangladesh.levels[value] || {});
        renderDropdownList('districtList', districts, 'district');
        
    } else if (type === 'district') {
        selectedDistrict = value;
        document.getElementById('district').value = value;
        document.getElementById('districtSearch').value = value;
        document.getElementById('districtSearch').readOnly = true;
        
        selectedUpazila = '';
        document.getElementById('upazila').value = '';
        document.getElementById('upazilaSearch').value = '';
        document.getElementById('upazilaSearch').readOnly = true;
        document.getElementById('upazilaSearch').disabled = false;
        
        const upazilas = LOCATION_DATA.bangladesh.levels[selectedDivision]?.[value] || [];
        renderDropdownList('upazilaList', upazilas, 'upazila');
        
        autoSelectDeliveryArea(value);
        
    } else if (type === 'upazila') {
        selectedUpazila = value;
        document.getElementById('upazila').value = value;
        document.getElementById('upazilaSearch').value = value;
        document.getElementById('upazilaSearch').readOnly = true;
    }
    
    document.querySelectorAll('.searchable-dropdown').forEach(d => d.classList.remove('open'));
    
    const errMap = {
        'division': 'divisionError',
        'district': 'districtError',
        'upazila': 'upazilaError'
    };
    if (errMap[type]) {
        const errEl = document.getElementById(errMap[type]);
        if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
    }
}
window.selectDropdownItem = selectDropdownItem;

function setupOutsideClickListener() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.searchable-dropdown')) {
            document.querySelectorAll('.searchable-dropdown').forEach(d => {
                d.classList.remove('open');
                const input = d.querySelector('.dropdown-search-input');
                if (input && input.value.trim()) input.readOnly = true;
            });
        }
    });
}

// ============================================================
// AUTO SELECT DELIVERY AREA
// ============================================================
function autoSelectDeliveryArea(district) {
    if (!district) return;
    
    const val = String(district).toLowerCase().trim();
    const isDhakaDistrict = val.includes('dhaka') || val.startsWith('dhaka') || val.includes('ঢাকা');
    
    const insideCheckbox = document.getElementById('deliveryInsideCheckbox');
    const outsideCheckbox = document.getElementById('deliveryOutsideCheckbox');
    const insideLabel = document.getElementById('deliveryInsideLabel');
    const outsideLabel = document.getElementById('deliveryOutsideLabel');
    
    if (isDhakaDistrict) {
        if (insideCheckbox) insideCheckbox.checked = true;
        if (outsideCheckbox) outsideCheckbox.checked = false;
        if (insideLabel) insideLabel.classList.add('selected');
        if (outsideLabel) outsideLabel.classList.remove('selected');
    } else {
        if (outsideCheckbox) outsideCheckbox.checked = true;
        if (insideCheckbox) insideCheckbox.checked = false;
        if (outsideLabel) outsideLabel.classList.add('selected');
        if (insideLabel) insideLabel.classList.remove('selected');
    }
    
    updateSummary();
    const errEl = document.getElementById('deliveryAreaError');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
}

// ============================================================
// DELIVERY CHARGE
// ============================================================
function setupDeliveryCharge() {
    const insideText = document.getElementById('insideChargeText');
    const outsideText = document.getElementById('outsideChargeText');
    
    if (insideText) insideText.textContent = formatPrice(window.settings.insideDhakaCharge);
    if (outsideText) outsideText.textContent = formatPrice(window.settings.outsideDhakaCharge);
    
    const insideCheckbox = document.getElementById('deliveryInsideCheckbox');
    const outsideCheckbox = document.getElementById('deliveryOutsideCheckbox');
    const insideLabel = document.getElementById('deliveryInsideLabel');
    const outsideLabel = document.getElementById('deliveryOutsideLabel');
    
    if (insideCheckbox) {
        insideCheckbox.addEventListener('change', () => {
            if (insideCheckbox.checked) {
                if (outsideCheckbox) outsideCheckbox.checked = false;
                if (insideLabel) insideLabel.classList.add('selected');
                if (outsideLabel) outsideLabel.classList.remove('selected');
            } else {
                if (insideLabel) insideLabel.classList.remove('selected');
            }
            updateSummary();
            clearDeliveryError();
        });
    }
    
    if (outsideCheckbox) {
        outsideCheckbox.addEventListener('change', () => {
            if (outsideCheckbox.checked) {
                if (insideCheckbox) insideCheckbox.checked = false;
                if (outsideLabel) outsideLabel.classList.add('selected');
                if (insideLabel) insideLabel.classList.remove('selected');
            } else {
                if (outsideLabel) outsideLabel.classList.remove('selected');
            }
            updateSummary();
            clearDeliveryError();
        });
    }
}

function clearDeliveryError() {
    const errEl = document.getElementById('deliveryAreaError');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
}

// ============================================================
// PREFILL USER INFO
// ============================================================
async function prefillUserInfo() {
    const user = await getCurrentUser();
    if (!user) return;
    
    const profile = await getUserProfile(user.id);
    if (!profile) return;
    
    const googleData = user.user_metadata || {};
    
    const displayName = profile.full_name || googleData.full_name || googleData.name || null;
    if (displayName) {
        const el = document.getElementById('fullName');
        if (el) el.value = displayName;
    }
    
    if (profile.phone) {
        const el = document.getElementById('phone');
        if (el) el.value = profile.phone;
    }
    
    if (user.email) {
        const el = document.getElementById('email');
        if (el) el.value = user.email;
    }
    
    if (profile.village) {
        const el = document.getElementById('village');
        if (el) el.value = profile.village;
    }
    if (profile.full_address) {
        const el = document.getElementById('fullAddress');
        if (el) el.value = profile.full_address;
    }
    
    // Prefill location
    if (profile.division && LOCATION_DATA.bangladesh.levels[profile.division]) {
        selectedDivision = profile.division;
        document.getElementById('division').value = profile.division;
        document.getElementById('divisionSearch').value = profile.division;
        document.getElementById('divisionSearch').readOnly = true;
        
        const districts = Object.keys(LOCATION_DATA.bangladesh.levels[profile.division] || {});
        renderDropdownList('districtList', districts, 'district');
        document.getElementById('districtSearch').disabled = false;
        
        if (profile.district) {
            selectedDistrict = profile.district;
            document.getElementById('district').value = profile.district;
            document.getElementById('districtSearch').value = profile.district;
            document.getElementById('districtSearch').readOnly = true;
            
            const upazilas = LOCATION_DATA.bangladesh.levels[profile.division]?.[profile.district] || [];
            renderDropdownList('upazilaList', upazilas, 'upazila');
            document.getElementById('upazilaSearch').disabled = false;
            
            if (profile.upazila) {
                selectedUpazila = profile.upazila;
                document.getElementById('upazila').value = profile.upazila;
                document.getElementById('upazilaSearch').value = profile.upazila;
                document.getElementById('upazilaSearch').readOnly = true;
            }
            
            autoSelectDeliveryArea(profile.district);
        }
    }
}

// ============================================================
// BUILD CHECKOUT ITEMS
// ============================================================
async function buildCheckoutItems() {
    checkoutItems = [];
    
    if (checkoutMode === 'direct') {
        try {
            const stored = localStorage.getItem('novahub_direct_checkout');
            if (!stored) {
                showToast('No product found', 'error');
                setTimeout(() => window.location.href = 'index.html', 1500);
                return;
            }
            const directProductData = JSON.parse(stored);
            
            const { data: product } = await supabaseClient
                .from('products').select('*')
                .eq('id', directProductData.productId).single();
            
            if (product) {
                checkoutItems = [{
                    productId: product.id,
                    title: product.title,
                    price: safeParseNumber(product.price),
                    imageURL: product.image_url,
                    quantity: directProductData.quantity || 1,
                    selectedVariant: directProductData.selectedVariant || null
                }];
            }
        } catch (error) {
            console.error('Direct checkout error:', error);
        }
    } else {
        const cart = CartModule.getCart();
        const selectedKeys = CartModule.getSelected();
        
        if (cart.length === 0 || selectedKeys.length === 0) {
            showToast('No items selected for checkout', 'warning');
            setTimeout(() => window.location.href = 'index.html', 1500);
            return;
        }
        
        const selectedItems = cart.filter(item => {
            const key = generateItemKey(item.productId, item.selectedVariant);
            return selectedKeys.includes(key);
        });
        
        const productIds = selectedItems.map(i => i.productId);
        if (productIds.length === 0) return;
        
        const { data: products } = await supabaseClient
            .from('products').select('*').in('id', productIds);
        
        const productMap = {};
        (products || []).forEach(p => { productMap[p.id] = p; });
        
        for (const item of selectedItems) {
            const product = productMap[item.productId];
            if (product) {
                checkoutItems.push({
                    productId: product.id,
                    title: product.title,
                    price: safeParseNumber(product.price),
                    imageURL: product.image_url,
                    quantity: item.quantity || 1,
                    selectedVariant: item.selectedVariant || null
                });
            }
        }
    }
}

// ============================================================
// RENDER CHECKOUT ITEMS
// ============================================================
function renderCheckoutItems() {
    const container = document.getElementById('checkoutItemsList');
    if (!container) return;
    
    if (checkoutItems.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px 20px;color:#888;"><i class="fas fa-shopping-bag" style="font-size:36px;opacity:0.3;display:block;margin-bottom:12px;"></i><p>No items found</p></div>';
        return;
    }
    
    container.innerHTML = checkoutItems.map(item => {
        let variantHTML = '';
        if (item.selectedVariant && Object.keys(item.selectedVariant).length > 0) {
            variantHTML = '<div class="checkout-item-variant">' +
                Object.entries(item.selectedVariant).map(([k, v]) => '<span>' + escapeHtml(k) + ': ' + escapeHtml(v) + '</span>').join('') +
                '</div>';
        }
        
        return '<div class="checkout-item">' +
            '<img src="' + escapeHtml(item.imageURL || 'https://via.placeholder.com/64') + '" alt="' + escapeHtml(item.title) + '" onerror="this.src=\'https://via.placeholder.com/64\'">' +
            '<div class="checkout-item-info">' +
                '<div class="checkout-item-title">' + escapeHtml(item.title) + '</div>' +
                variantHTML +
                '<div class="checkout-item-meta">' +
                    '<span><strong>Qty:</strong> ' + item.quantity + '</span>' +
                    '<span><strong>Unit:</strong> ' + formatPrice(item.price) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="checkout-item-price">' + formatPrice(item.price * item.quantity) + '</div>' +
        '</div>';
    }).join('');
}

// ============================================================
// UPDATE SUMMARY
// ============================================================
function updateSummary() {
    const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const insideCheckbox = document.getElementById('deliveryInsideCheckbox');
    const outsideCheckbox = document.getElementById('deliveryOutsideCheckbox');
    
    let deliveryCharge = 0;
    if (insideCheckbox?.checked) deliveryCharge = window.settings.insideDhakaCharge;
    else if (outsideCheckbox?.checked) deliveryCharge = window.settings.outsideDhakaCharge;
    
    const total = subtotal + deliveryCharge;
    
    const subEl = document.getElementById('summarySubtotal');
    const delEl = document.getElementById('summaryDelivery');
    const totEl = document.getElementById('summaryTotal');
    
    if (subEl) subEl.textContent = formatPrice(subtotal);
    if (delEl) delEl.textContent = formatPrice(deliveryCharge);
    if (totEl) totEl.textContent = formatPrice(total);
}

// ============================================================
// VALIDATION
// ============================================================
function setupFormValidation() {
    document.querySelectorAll('#checkoutForm input, #checkoutForm textarea').forEach(field => {
        field.addEventListener('input', () => {
            field.classList.remove('error');
            const errEl = document.getElementById(field.id + 'Error');
            if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
        });
    });
}

function validateForm() {
    let valid = true;
    clearErrors();
    
    const name = document.getElementById('fullName');
    if (!name.value.trim() || name.value.trim().length < 3) {
        showFieldError(name, 'fullNameError', 'Please enter your full name');
        valid = false;
    }
    
    const phone = document.getElementById('phone');
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phone.value.trim()) {
        showFieldError(phone, 'phoneError', 'Please enter your phone number');
        valid = false;
    } else if (!phoneRegex.test(phone.value.trim())) {
        showFieldError(phone, 'phoneError', 'Enter valid phone (01XXXXXXXXX)');
        valid = false;
    }
    
    if (!selectedDivision) {
        const errEl = document.getElementById('divisionError');
        if (errEl) { errEl.textContent = 'Please select division'; errEl.classList.add('show'); }
        valid = false;
    }
    
    if (!selectedDistrict) {
        const errEl = document.getElementById('districtError');
        if (errEl) { errEl.textContent = 'Please select district'; errEl.classList.add('show'); }
        valid = false;
    }
    
    const village = document.getElementById('village');
    if (!village.value.trim()) {
        showFieldError(village, 'villageError', 'Please enter village/area');
        valid = false;
    }
    
    const insideCheckbox = document.getElementById('deliveryInsideCheckbox');
    const outsideCheckbox = document.getElementById('deliveryOutsideCheckbox');
    if (!insideCheckbox?.checked && !outsideCheckbox?.checked) {
        const errEl = document.getElementById('deliveryAreaError');
        if (errEl) { errEl.textContent = 'Please select delivery area'; errEl.classList.add('show'); }
        valid = false;
    }
    
    if (!valid) {
        const firstErr = document.querySelector('.field-error.show');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return valid;
}

function showFieldError(field, errorId, message) {
    field.classList.add('error');
    const errEl = document.getElementById(errorId);
    if (errEl) { errEl.textContent = message; errEl.classList.add('show'); }
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    document.querySelectorAll('#checkoutForm .error').forEach(el => el.classList.remove('error'));
}

// ============================================================
// STOCK VALIDATION
// ============================================================
async function validateStockBeforeOrder() {
    const outOfStockItems = [];
    
    if (checkoutItems.length === 0) return outOfStockItems;
    
    const productIds = checkoutItems.map(i => i.productId);
    
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('id, title, stock_status, stock_quantity')
        .in('id', productIds);
    
    if (error || !products) {
        console.warn('Stock check failed, proceeding anyway');
        return outOfStockItems;
    }
    
    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });
    
    for (const item of checkoutItems) {
        const product = productMap[item.productId];
        if (!product) { outOfStockItems.push(item.title); continue; }
        if (product.stock_status === 'out_of_stock') { outOfStockItems.push(product.title); continue; }
        if (product.stock_quantity !== undefined && product.stock_quantity !== null) {
            if (parseInt(product.stock_quantity) <= 0) outOfStockItems.push(product.title);
        }
    }
    
    return outOfStockItems;
}

// ============================================================
// PLACE ORDER — with Pixel + CAPI
// ============================================================
async function placeOrder(event) {
    if (event) event.preventDefault();
    
    if (checkoutItems.length === 0) {
        showToast('No items to order', 'error');
        return;
    }
    
    if (!validateForm()) return;
    
    const btn = document.getElementById('placeOrderBtn');
    if (btn.disabled) return;
    
    const btnText = btn.querySelector('span');
    const btnIcon = btn.querySelector('.fa-check-circle');
    const btnSpinner = btn.querySelector('.fa-spinner');
    
    btn.disabled = true;
    if (btnText) btnText.textContent = 'Checking stock...';
    if (btnIcon) btnIcon.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    
    const outOfStock = await validateStockBeforeOrder();
    
    if (outOfStock.length > 0) {
        btn.disabled = false;
        if (btnText) btnText.textContent = 'Confirm Order';
        if (btnIcon) btnIcon.style.display = 'inline';
        if (btnSpinner) btnSpinner.style.display = 'none';
        showToast('Out of stock: ' + outOfStock.join(', '), 'error');
        return;
    }
    
    if (btnText) btnText.textContent = 'Processing...';
    
    try {
        const orderId = generateOrderId();
        const subtotal = checkoutItems.reduce((s, i) => s + (i.price * i.quantity), 0);
        
        const insideCheckbox = document.getElementById('deliveryInsideCheckbox');
        const deliveryArea = insideCheckbox?.checked ? 'inside' : 'outside';
        const deliveryCharge = deliveryArea === 'inside' 
            ? window.settings.insideDhakaCharge 
            : window.settings.outsideDhakaCharge;
        const total = subtotal + deliveryCharge;
        
        const user = await getCurrentUser();
        
        const orderData = {
            order_id: orderId,
            user_id: user ? user.id : null,
            full_name: document.getElementById('fullName').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim() || null,
            division: selectedDivision,
            district: selectedDistrict,
            upazila: selectedUpazila || null,
            village: document.getElementById('village').value.trim(),
            full_address: document.getElementById('fullAddress').value.trim() || null,
            delivery_area: deliveryArea,
            delivery_area_text: deliveryArea === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
            customer_note: document.getElementById('customerNote').value.trim() || null,
            items: checkoutItems.map(item => ({
                productId: item.productId,
                title: item.title,
                imageURL: item.imageURL,
                quantity: item.quantity,
                price: item.price,
                selectedVariant: item.selectedVariant
            })),
            subtotal: subtotal,
            delivery_charge: deliveryCharge,
            total: total,
            currency: window.settings.currency,
            status: 'pending'
        };
        
        const { data, error } = await supabaseClient
            .from('orders').insert([orderData]).select().single();
        
        if (error) throw error;
        
        console.log('✅ Order placed:', data);
        
        // Fire webhook (non-blocking)
        sendWebhookNotification(orderData).catch(err => console.error('Webhook failed:', err));
        
        // ===== ✅ Pixel + Conversion API: Track Purchase =====
        if (typeof window.trackPurchase === 'function') {
            window.trackPurchase(orderId, checkoutItems, total, {
                email: orderData.email,
                phone: orderData.phone,
                full_name: orderData.full_name,
                district: orderData.district,
                division: orderData.division,
                user_id: orderData.user_id
            });
        }
        
        // Clear cart
        if (checkoutMode === 'cart') {
            CartModule.clearSelected();
        } else {
            localStorage.removeItem('novahub_direct_checkout');
        }
        
        document.getElementById('thankYouOrderId').textContent = orderId;
        document.getElementById('thankYouModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Place order error:', error);
        showToast('Failed to place order: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        if (btnText) btnText.textContent = 'Confirm Order';
        if (btnIcon) btnIcon.style.display = 'inline';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}
window.placeOrder = placeOrder;

// ============================================================
// WEBHOOK
// ============================================================
async function sendWebhookNotification(orderData) {
    const webhookUrl = window.settings.webhookUrl;
    if (!webhookUrl || !webhookUrl.trim()) return;
    
    const payload = {
        event: 'order.created',
        timestamp: new Date().toISOString(),
        source: 'novahub-website',
        order_id: orderData.order_id,
        user_id: orderData.user_id || null,
        status: orderData.status || 'pending',
        currency: orderData.currency || 'BDT',
        customer: {
            full_name: orderData.full_name,
            phone: orderData.phone,
            email: orderData.email || null
        },
        shipping_address: {
            division: orderData.division,
            district: orderData.district,
            upazila: orderData.upazila,
            village: orderData.village,
            full_address: orderData.full_address || null,
            delivery_area: orderData.delivery_area,
            delivery_area_text: orderData.delivery_area_text
        },
        items: (orderData.items || []).map(item => ({
            product_id: item.productId,
            title: item.title,
            image_url: item.imageURL || null,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            selected_variant: item.selectedVariant || null
        })),
        pricing: {
            subtotal: orderData.subtotal,
            delivery_charge: orderData.delivery_charge,
            total: orderData.total,
            currency: orderData.currency || 'BDT'
        },
        customer_note: orderData.customer_note || null
    };
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (response.ok) console.log('✅ Webhook sent');
        else console.warn('⚠️ Webhook status:', response.status);
    } catch (error) {
        console.error('❌ Webhook error:', error.message);
    }
}

// ============================================================
// LOAD REVIEWS PREVIEW
// ============================================================
async function loadReviewsPreview() {
    const container = document.getElementById('reviewsPreviewContent');
    if (!container) return;
    
    if (checkoutItems.length === 0) {
        container.innerHTML = '<div class="reviews-loading"><i class="fas fa-comment-slash"></i><p>No items</p></div>';
        return;
    }
    
    try {
        const productIds = checkoutItems.map(item => item.productId);
        
        const { data: reviews } = await supabaseClient
            .from('reviews').select('*')
            .in('product_id', productIds)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
        
        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<div class="reviews-loading"><i class="fas fa-star" style="color:#DDD;"></i><p>No reviews yet</p></div>';
            return;
        }
        
        const reviewsToRender = reviews.length < 3 
            ? [...reviews, ...reviews, ...reviews] 
            : [...reviews, ...reviews];
        
        container.innerHTML = '<div class="checkout-reviews-scroll-wrapper">' +
            '<div class="checkout-reviews-scroll-track" id="checkoutReviewsTrack">' +
                reviewsToRender.map(r => renderCheckoutReviewSquare(r)).join('') +
            '</div>' +
        '</div>';
        
        const track = document.getElementById('checkoutReviewsTrack');
        if (track) {
            const totalWidth = reviewsToRender.length * 230;
            const duration = Math.max(20, totalWidth / 30);
            track.style.animation = 'reviewScrollCheckout ' + duration + 's linear infinite';
        }
        
    } catch (error) {
        console.error('Reviews preview error:', error);
        container.innerHTML = '<div class="reviews-loading"><i class="fas fa-exclamation-triangle"></i><p>Unable to load</p></div>';
    }
}

function renderCheckoutReviewSquare(r) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += i <= r.rating 
            ? '<i class="fas fa-star"></i>' 
            : '<i class="far fa-star empty"></i>';
    }
    
    const date = r.created_at 
        ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        : '';
    
    const reviewerName = r.reviewer_name || 'User';
    const initials = reviewerName.charAt(0).toUpperCase();
    const image = r.image_url_1 || null;
    const avatar = r.reviewer_avatar || null;
    
    const comment = r.comment && r.comment.trim() 
        ? escapeHtml(r.comment) 
        : '<span style="color:#AAA;font-style:italic;">No comment</span>';
    
    let avatarHTML;
    if (avatar) {
        avatarHTML = '<div class="review-square-avatar has-image"><img src="' + escapeHtml(avatar) + '" alt="' + escapeHtml(reviewerName) + '" loading="lazy" onerror="this.parentElement.classList.remove(\'has-image\');this.parentElement.textContent=\'' + escapeHtml(initials) + '\';"></div>';
    } else {
        avatarHTML = '<div class="review-square-avatar">' + escapeHtml(initials) + '</div>';
    }
    
    return '<div class="review-square-card">' +
        '<div class="review-square-header">' +
            avatarHTML +
            '<div class="review-square-user">' +
                '<div class="review-square-name">' + escapeHtml(reviewerName) + '</div>' +
                '<div class="review-square-date">' + date + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="review-square-stars">' + starsHTML + '</div>' +
        '<div class="review-square-text">' + comment + '</div>' +
        (image ? '<div class="review-square-image" onclick="openLightbox(\'' + escapeHtml(image) + '\')"><img src="' + escapeHtml(image) + '" alt="Review" onerror="this.parentElement.style.display=\'none\'"></div>' : '') +
    '</div>';
}

// ============================================================
// LIGHTBOX
// ============================================================
function openLightbox(imageUrl) {
    let lightbox = document.getElementById('imageLightbox');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'imageLightbox';
        lightbox.className = 'image-lightbox';
        lightbox.innerHTML = '<button class="lightbox-close" onclick="closeLightbox()" aria-label="Close"><i class="fas fa-times"></i></button><img id="lightboxImage" class="lightbox-image" src="" alt="Preview" onclick="event.stopPropagation();">';
        document.body.appendChild(lightbox);
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
    }
    document.getElementById('lightboxImage').src = imageUrl;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openLightbox = openLightbox;

function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}
window.closeLightbox = closeLightbox;

function setupLightbox() {}

// ============================================================
// COPY ORDER ID / CONTINUE
// ============================================================
function copyOrderId() {
    const orderId = document.getElementById('thankYouOrderId').textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(orderId).then(() => {
            showToast('Order ID copied!', 'success');
        }).catch(() => fallbackCopy(orderId));
    } else {
        fallbackCopy(orderId);
    }
}
window.copyOrderId = copyOrderId;

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Order ID copied!', 'success'); }
    catch(e) { showToast('Copy failed', 'error'); }
    document.body.removeChild(ta);
}

function continueShopping() {
    window.location.href = 'index.html';
}
window.continueShopping = continueShopping;

console.log('✅ Checkout script loaded (v6 — Pixel + CAPI)');