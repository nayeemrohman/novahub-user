// ============================================================
// NOVAHUB — Order Track Script (v4)
// FIXED: Requires Order ID + Phone Number for privacy
// ============================================================

const STATUS_STEPS = [
    { key: 'pending', label: 'Pending', icon: 'fa-clock' },
    { key: 'processing', label: 'Processing', icon: 'fa-cog' },
    { key: 'shipped', label: 'Shipped', icon: 'fa-truck' },
    { key: 'delivered', label: 'Delivered', icon: 'fa-check-circle' }
];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Order Track initializing...');
    
    await loadSettings();
    await updateHeaderProfile();
    
    const input = document.getElementById('orderIdInput');
    const phoneInput = document.getElementById('phoneVerifyInput');
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') trackOrder();
        });
        input.focus();
    }
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
        phoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') trackOrder();
        });
    }
    
    // Prefill phone if logged in
    const user = await getCurrentUser();
    if (user) {
        const profile = await getUserProfile(user.id);
        if (profile?.phone && phoneInput) {
            phoneInput.value = profile.phone;
        }
    }
    
    console.log('✅ Order Track ready');
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
                shopName: data.shop_name || 'Novahub',
                currency: data.currency || '৳',
                orderPrefix: data.order_prefix || 'NV',
                whatsappNumber: data.whatsapp_number || '01947939982'
            };
        }
    } catch (error) {
        console.error('Settings error:', error);
    }
}

// ============================================================
// HEADER PROFILE
// ============================================================
async function handleProfileClick() {
    const user = await getCurrentUser();
    if (user) window.location.href = 'profile.html';
    else window.location.href = 'auth.html';
}
window.handleProfileClick = handleProfileClick;

async function updateHeaderProfile() {
    const profileIcon = document.getElementById('headerProfileIcon');
    if (!profileIcon) return;
    
    const user = await getCurrentUser();
    if (user) {
        const profile = await getUserProfile(user.id);
        const googleData = user.user_metadata || {};
        const photoUrl = profile?.avatar_url || googleData.avatar_url || googleData.picture || null;
        const parentBtn = profileIcon.parentElement;
        
        if (photoUrl) {
            parentBtn.innerHTML = '<img src="' + escapeHtml(photoUrl) + '" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.outerHTML=\'<i class=&quot;fas fa-user&quot; id=&quot;headerProfileIcon&quot;></i>\'">';
        } else {
            profileIcon.className = 'fas fa-user-circle';
        }
    } else {
        profileIcon.className = 'fas fa-user';
    }
}

// ============================================================
// TRACK ORDER — Click Handler
// ============================================================
async function trackOrder() {
    const orderInput = document.getElementById('orderIdInput');
    const phoneInput = document.getElementById('phoneVerifyInput');
    
    if (!orderInput || !phoneInput) return;
    
    const orderId = orderInput.value.trim().toUpperCase();
    const phone = phoneInput.value.trim();
    
    if (!orderId) {
        showToast('Please enter an Order ID', 'warning');
        orderInput.focus();
        return;
    }
    
    if (!phone) {
        showToast('Please enter your phone number', 'warning');
        phoneInput.focus();
        return;
    }
    
    if (!/^01[3-9]\d{8}$/.test(phone)) {
        showToast('Enter valid phone number (01XXXXXXXXX)', 'warning');
        phoneInput.focus();
        return;
    }
    
    await fetchAndRenderOrder(orderId, phone);
}
window.trackOrder = trackOrder;

// ============================================================
// FETCH & VERIFY ORDER
// ============================================================
async function fetchAndRenderOrder(orderId, phone) {
    showState('loading');
    
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .single();
        
        if (error || !data) {
            console.log('❌ Order not found:', orderId);
            showState('notFound');
            return;
        }
        
        // Verify phone number matches (privacy protection)
        const storedPhone = (data.phone || '').trim();
        if (storedPhone !== phone) {
            console.log('❌ Phone mismatch for order:', orderId);
            showState('notFound');
            return;
        }
        
        console.log('✅ Order verified:', data.order_id);
        renderOrder(data);
        showState('details');
        
        document.title = 'Order ' + orderId + ' – Novahub';
        
    } catch (error) {
        console.error('Track error:', error);
        showState('notFound');
    }
}

// ============================================================
// SHOW STATE
// ============================================================
function showState(state) {
    const trackCard = document.getElementById('trackCard');
    const loading = document.getElementById('loadingState');
    const notFound = document.getElementById('notFoundState');
    const details = document.getElementById('orderDetailsState');
    
    if (trackCard) trackCard.style.display = (state === 'form') ? 'block' : 'none';
    if (loading) loading.style.display = (state === 'loading') ? 'block' : 'none';
    if (notFound) notFound.style.display = (state === 'notFound') ? 'block' : 'none';
    if (details) details.style.display = (state === 'details') ? 'block' : 'none';
}

// ============================================================
// RESET
// ============================================================
function resetTrack() {
    const orderInput = document.getElementById('orderIdInput');
    const phoneInput = document.getElementById('phoneVerifyInput');
    
    if (orderInput) orderInput.value = '';
    if (phoneInput) phoneInput.value = '';
    
    document.title = 'Track Your Order – Novahub';
    showState('form');
    
    setTimeout(() => {
        if (orderInput) orderInput.focus();
    }, 100);
}
window.resetTrack = resetTrack;

// ============================================================
// RENDER ORDER
// ============================================================
function renderOrder(order) {
    const currentStatus = order.status || 'pending';
    const currentIdx = STATUS_STEPS.findIndex(s => s.key === currentStatus);
    const isCancelled = currentStatus === 'cancelled';
    
    const timelineEl = document.getElementById('statusTimeline');
    if (timelineEl) {
        if (isCancelled) {
            timelineEl.innerHTML = 
                '<div class="cancelled-banner">' +
                    '<div class="cancelled-icon"><i class="fas fa-times-circle"></i></div>' +
                    '<div class="cancelled-text">' +
                        '<h3>Order Cancelled</h3>' +
                        '<p>This order has been cancelled</p>' +
                    '</div>' +
                '</div>';
            timelineEl.classList.add('cancelled-mode');
        } else {
            timelineEl.classList.remove('cancelled-mode');
            timelineEl.innerHTML = STATUS_STEPS.map((step, i) => {
                let cls = '';
                if (i < currentIdx) cls = 'completed';
                else if (i === currentIdx) cls = 'completed current';
                return '<div class="timeline-step ' + cls + '">' +
                    '<div class="timeline-circle"><i class="fas ' + step.icon + '"></i></div>' +
                    '<div class="timeline-label">' + step.label + '</div>' +
                '</div>';
            }).join('');
        }
    }
    
    setText('displayOrderId', order.order_id);
    setText('displayName', order.full_name || '-');
    setText('displayPhone', maskPhone(order.phone || '-'));
    
    const addressParts = [order.village, order.upazila, order.district, order.division].filter(Boolean);
    setText('displayAddress', addressParts.join(', ') || '-');
    
    const date = order.created_at 
        ? new Date(order.created_at).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        : '-';
    setText('displayDate', date);
    
    const statusEl = document.getElementById('displayStatus');
    if (statusEl) {
        statusEl.textContent = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
        statusEl.className = 'status-badge ' + currentStatus;
    }
    
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsEl = document.getElementById('displayItems');
    
    if (itemsEl) {
        if (items.length === 0) {
            itemsEl.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No items</p>';
        } else {
            itemsEl.innerHTML = items.map(item => {
                let variantText = '';
                if (item.selectedVariant && Object.keys(item.selectedVariant).length > 0) {
                    variantText = Object.entries(item.selectedVariant)
                        .map(([k, v]) => k + ': ' + v).join(' | ');
                }
                
                return '<div class="order-item-row">' +
                    '<img src="' + escapeHtml(item.imageURL || 'https://via.placeholder.com/52') + '" ' +
                        'onerror="this.src=\'https://via.placeholder.com/52\'">' +
                    '<div class="order-item-details">' +
                        '<strong>' + escapeHtml(item.title || 'Product') + '</strong>' +
                        '<small>Qty: ' + item.quantity + (variantText ? ' | ' + escapeHtml(variantText) : '') + '</small>' +
                    '</div>' +
                    '<div class="price">' + formatPrice(item.price * item.quantity) + '</div>' +
                '</div>';
            }).join('');
        }
    }
    
    setText('displaySubtotal', formatPrice(order.subtotal || 0));
    setText('displayDelivery', formatPrice(order.delivery_charge || 0));
    setText('displayTotal', formatPrice(order.total || 0));
}

// ============================================================
// HELPERS
// ============================================================
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function maskPhone(phone) {
    if (!phone || phone.length < 6) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
}

function formatPrice(price) {
    const curr = window.settings?.currency || '৳';
    const n = parseFloat(price) || 0;
    return curr + n.toLocaleString('en-BD', { maximumFractionDigits: 2 });
}

console.log('✅ Order Track script loaded (v4 — Phone Verification)');