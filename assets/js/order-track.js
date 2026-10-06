// ============================================================
// NOVAHUB — Order Track Script (v3 — Pretty URL Redirect)
// Domain: novahubgadgets.com
// URL: /order-track/NV618181728 → auto-detect + fetch
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
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') trackOrder();
        });
        input.focus();
    }
    
    // ============================================================
    // DETECT ORDER ID FROM URL — 2 ways:
    //   1. Pretty URL:  /order-track/NV618181728
    //   2. Query string: /order-track.html?track=NV618181728
    // ============================================================
    const orderId = detectOrderIdFromURL();
    
    if (orderId) {
        console.log('📍 Detected order ID from URL:', orderId);
        if (input) input.value = orderId;
        // Auto track
        await fetchAndRenderOrder(orderId);
    }
    
    console.log('✅ Order Track ready');
});

// ============================================================
// DETECT ORDER ID FROM URL
// ============================================================
function detectOrderIdFromURL() {
    // Method 1: Query string (from Vercel rewrite)
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('track') || params.get('id');
    if (fromQuery) return fromQuery.trim().toUpperCase();
    
    // Method 2: URL path — /order-track/NV618181728 or /track/NV618181728
    const path = window.location.pathname;
    const match = path.match(/\/(?:order-track|track)\/([A-Za-z0-9\-_]+)\/?$/i);
    if (match && match[1]) {
        return match[1].trim().toUpperCase();
    }
    
    return null;
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
                whatsappNumber: data.whatsapp_number || '01947939982'
            };
        }
    } catch (error) {
        console.error('Settings error:', error);
    }
}

// ============================================================
// HEADER — Profile Click
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
// HEADER — Update Profile Photo
// ============================================================
async function updateHeaderProfile() {
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
    const input = document.getElementById('orderIdInput');
    if (!input) return;
    
    const orderId = input.value.trim().toUpperCase();
    
    if (!orderId) {
        showToast('Please enter an Order ID', 'warning');
        input.focus();
        return;
    }
    
    // ✅ REDIRECT TO PRETTY URL
    // /order-track.html → /order-track/NV618181728
    const prettyUrl = '/order-track/' + encodeURIComponent(orderId);
    
    console.log('🔄 Redirecting to:', prettyUrl);
    
    // If already on pretty URL, don't reload
    if (window.location.pathname === prettyUrl) {
        await fetchAndRenderOrder(orderId);
    } else {
        // Redirect — browser will load page, then detectOrderIdFromURL will handle it
        window.location.href = prettyUrl;
    }
}
window.trackOrder = trackOrder;

// ============================================================
// FETCH & RENDER ORDER
// ============================================================
async function fetchAndRenderOrder(orderId) {
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
        
        console.log('✅ Order loaded:', data.order_id);
        renderOrder(data);
        showState('details');
        
        // Update page title with order ID
        document.title = 'Order ' + orderId + ' – Novahub';
        
        // Update URL if not already pretty
        const prettyPath = '/order-track/' + encodeURIComponent(orderId);
        if (window.location.pathname !== prettyPath) {
            window.history.replaceState({}, '', prettyPath);
        }
        
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
    
    if (trackCard) trackCard.style.display = (state === 'details' || state === 'loading' || state === 'notFound') ? 'none' : 'block';
    if (loading) loading.style.display = (state === 'loading') ? 'block' : 'none';
    if (notFound) notFound.style.display = (state === 'notFound') ? 'block' : 'none';
    if (details) details.style.display = (state === 'details') ? 'block' : 'none';
}

// ============================================================
// RESET — Go Back to Track Form
// ============================================================
function resetTrack() {
    // Clear URL to /order-track
    window.history.replaceState({}, '', '/order-track');
    
    // Reset input
    const input = document.getElementById('orderIdInput');
    if (input) input.value = '';
    
    // Reset title
    document.title = 'Track Your Order – Novahub';
    
    // Show track card
    showState('form');
    
    // Focus input
    setTimeout(() => {
        if (input) input.focus();
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
    
    // ===== Timeline =====
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
    
    // ===== Order Info =====
    setText('displayOrderId', order.order_id);
    setText('displayName', order.full_name || '-');
    setText('displayPhone', order.phone || '-');
    
    const addressParts = [order.village, order.upazila, order.district, order.division].filter(Boolean);
    setText('displayAddress', addressParts.join(', ') || '-');
    
    const date = order.created_at 
        ? new Date(order.created_at).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        : '-';
    setText('displayDate', date);
    
    // ===== Status Badge =====
    const statusEl = document.getElementById('displayStatus');
    if (statusEl) {
        statusEl.textContent = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
        statusEl.className = 'status-badge ' + currentStatus;
    }
    
    // ===== Items =====
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
    
    // ===== Summary =====
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

function formatPrice(price) {
    const curr = window.settings?.currency || '৳';
    const n = parseFloat(price) || 0;
    return curr + n.toLocaleString('en-BD', { maximumFractionDigits: 2 });
}

function escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, m => map[m]);
}

console.log('✅ Order Track script loaded (v3 — Pretty URL)');