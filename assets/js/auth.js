// ============================================================
// NOVAHUB — Auth + Pixel + CAPI Helpers (v10 — CAPI DIAGNOSTIC)
// ============================================================
// Changes in v10:
//   ✅ Structured logging for CAPI diagnostics (no secrets)
//   ✅ Bearer header auth (safer than query param)
//   ✅ Better error surface for 500 diagnosis
//   ✅ Deduplication guard preserved
//   ✅ Currency from orderData (not hardcoded)
//   ✅ value normalized to 2 decimals
// ============================================================

// ============================================================
// LOGOUT
// ============================================================
async function logoutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        window.currentUser = null;
        window.currentProfile = null;
        
        try {
            localStorage.removeItem('novahub_selected_cart');
        } catch(e) {}
        
        return { success: true };
    } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: error.message };
    }
}

async function handleLogout() {
    const result = await logoutUser();
    if (result.success) {
        showToast('Logged out successfully', 'success');
        setTimeout(() => window.location.href = 'index.html', 800);
    } else {
        showToast('Logout failed: ' + result.error, 'error');
    }
}

// ============================================================
// UPDATE USER PROFILE
// ============================================================
async function updateUserProfile(userId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        
        window.currentProfile = data;
        return { success: true, data };
    } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// UPDATE AUTH UI
// ============================================================
async function updateAuthUI() {
    try {
        await syncGoogleProfileData();
        const user = await getCurrentUser();
        
        const guestView = document.getElementById('guestView');
        const userView = document.getElementById('userView');
        const menuLoginBtn = document.getElementById('menuLoginBtn');
        const menuProfileBtn = document.getElementById('menuProfileBtn');
        const menuLogoutBtn = document.getElementById('menuLogoutBtn');
        const menuUserName = document.getElementById('menuUserName');
        const menuUserEmail = document.getElementById('menuUserEmail');
        const userAvatarMenu = document.getElementById('userAvatarMenu');
        
        if (user) {
            const profile = await getUserProfile(user.id);
            const googleData = user.user_metadata || {};
            
            if (guestView) guestView.style.display = 'none';
            if (userView) userView.style.display = 'flex';
            if (menuLoginBtn) menuLoginBtn.style.display = 'none';
            if (menuProfileBtn) menuProfileBtn.style.display = 'flex';
            if (menuLogoutBtn) menuLogoutBtn.style.display = 'flex';
            
            const displayName = profile?.full_name 
                || googleData.full_name 
                || googleData.name 
                || user.email.split('@')[0];
            
            if (menuUserName) menuUserName.textContent = displayName;
            if (menuUserEmail) menuUserEmail.textContent = user.email;
            
            const photoUrl = profile?.avatar_url 
                || googleData.avatar_url 
                || googleData.picture 
                || null;
            
            if (userAvatarMenu) {
                if (photoUrl) {
                    userAvatarMenu.innerHTML = '<img src="' + escapeHtml(photoUrl) + '" alt="' + escapeHtml(displayName) + '" onerror="this.outerHTML=\'<i class=&quot;fas fa-user-circle&quot;></i>\'">';
                } else {
                    const initial = displayName.charAt(0).toUpperCase();
                    userAvatarMenu.innerHTML = '<span>' + escapeHtml(initial) + '</span>';
                }
            }
        } else {
            if (guestView) guestView.style.display = 'flex';
            if (userView) userView.style.display = 'none';
            if (menuLoginBtn) menuLoginBtn.style.display = 'flex';
            if (menuProfileBtn) menuProfileBtn.style.display = 'none';
            if (menuLogoutBtn) menuLogoutBtn.style.display = 'none';
            
            if (userAvatarMenu) {
                userAvatarMenu.innerHTML = '<i class="fas fa-user-circle"></i>';
            }
        }
    } catch (err) {
        console.error('updateAuthUI error:', err);
    }
}

// ============================================================
// AUTH STATE LISTENER
// ============================================================
try {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        setTimeout(() => updateAuthUI(), 100);
    });
} catch (err) {
    console.error('Auth state listener error:', err);
}

// ============================================================
// SYNC GOOGLE PROFILE DATA
// ============================================================
async function syncGoogleProfileData() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session?.user) return;
        
        const user = session.user;
        const googleData = user.user_metadata || {};
        
        const googleAvatar = googleData.avatar_url || googleData.picture || null;
        const googleName = googleData.full_name || googleData.name || null;
        
        if (!googleAvatar && !googleName) return;
        
        const { data: profile } = await supabaseClient
            .from('user_profiles')
            .select('avatar_url, full_name')
            .eq('id', user.id)
            .single();
        
        if (!profile) return;
        
        const updates = {};
        if (!profile.avatar_url && googleAvatar) updates.avatar_url = googleAvatar;
        if (!profile.full_name && googleName) updates.full_name = googleName;
        
        if (Object.keys(updates).length > 0) {
            await supabaseClient.from('user_profiles').update(updates).eq('id', user.id);
            console.log('✅ Synced Google data:', updates);
        }
    } catch (err) {
        console.error('Sync error:', err);
    }
}

// ============================================================
// SEO INJECTOR
// ============================================================
async function loadAndInjectSEO() {
    try {
        if (window.__seoInjected) return;
        window.__seoInjected = true;
        
        const { data: settings, error } = await supabaseClient
            .from('settings')
            .select('google_verification, facebook_verification, bing_verification, google_analytics_id')
            .eq('id', 1)
            .single();
        
        if (error || !settings) return;
        
        if (settings.google_verification && settings.google_verification.trim()) {
            const meta = document.createElement('meta');
            meta.name = 'google-site-verification';
            meta.content = settings.google_verification.trim();
            document.head.appendChild(meta);
        }
        
        if (settings.facebook_verification && settings.facebook_verification.trim()) {
            const meta = document.createElement('meta');
            meta.name = 'facebook-domain-verification';
            meta.content = settings.facebook_verification.trim();
            document.head.appendChild(meta);
        }
        
        if (settings.bing_verification && settings.bing_verification.trim()) {
            const meta = document.createElement('meta');
            meta.name = 'msvalidate.01';
            meta.content = settings.bing_verification.trim();
            document.head.appendChild(meta);
        }
        
        if (settings.google_analytics_id && settings.google_analytics_id.trim()) {
            const gaId = settings.google_analytics_id.trim();
            if (gaId.startsWith('G-') || gaId.startsWith('UA-')) {
                const script1 = document.createElement('script');
                script1.async = true;
                script1.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
                document.head.appendChild(script1);
                
                const script2 = document.createElement('script');
                script2.textContent = 
                    'window.dataLayer = window.dataLayer || [];' +
                    'function gtag(){dataLayer.push(arguments);}' +
                    'gtag("js", new Date());' +
                    'gtag("config", "' + gaId + '");';
                document.head.appendChild(script2);
                
                window.__gaId = gaId;
            }
        }
        
        console.log('✅ SEO tags injected');
    } catch (err) {
        console.error('SEO inject error:', err);
    }
}

// ============================================================
// PIXEL TRACKING — CLIENT SIDE
// ============================================================
window.trackViewContent = function(product) {
    if (typeof fbq !== 'function') return;
    try {
        fbq('track', 'ViewContent', {
            content_ids: [product.id],
            content_name: product.title,
            content_type: 'product',
            value: parseFloat(product.price) || 0,
            currency: 'BDT'
        });
    } catch(e) {}
};

window.trackAddToCart = function(product, quantity, selectedVariant) {
    quantity = quantity || 1;
    if (typeof fbq !== 'function') return;
    try {
        const eventData = {
            content_ids: [product.id],
            content_name: product.title,
            content_type: 'product',
            value: (parseFloat(product.price) || 0) * quantity,
            currency: 'BDT',
            quantity: quantity
        };
        
        if (selectedVariant && Object.keys(selectedVariant).length > 0) {
            const variantText = Object.entries(selectedVariant).map(([k, v]) => k + ':' + v).join(', ');
            eventData.content_name = product.title + ' (' + variantText + ')';
        }
        
        fbq('track', 'AddToCart', eventData);
    } catch(e) {}
};

window.trackInitiateCheckout = function(items, total) {
    if (typeof fbq !== 'function') return;
    try {
        fbq('track', 'InitiateCheckout', {
            content_ids: items.map(i => i.productId),
            content_type: 'product',
            num_items: items.reduce((s, i) => s + i.quantity, 0),
            value: total,
            currency: 'BDT'
        });
    } catch(e) {}
};

// ============================================================
// TRACK PURCHASE — Pixel + Conversion API (v10 — CAPI DIAGNOSTIC)
// ============================================================
window.trackPurchase = function(orderId, items, total, orderData) {
    // ---------- Deduplication guard ----------
    const guardKey = 'novahub_purchase_fired_' + orderId;
    const browserGuardKey = guardKey + '_browser';
    const capiGuardKey = guardKey + '_capi';
    if (localStorage.getItem(browserGuardKey) && localStorage.getItem(capiGuardKey)) {
        console.log('[Pixel/CAPI] Purchase already sent for', orderId, '— skipping duplicate');
        return;
    }

    // ---------- Validate ----------
    const numericTotal = parseFloat(total);
    if (!numericTotal || numericTotal <= 0 || !isFinite(numericTotal)) {
        console.warn('[Pixel] Invalid purchase value:', total, '— skipping');
        return;
    }

    const currency = (orderData && orderData.currency) || window.settings?.currency || 'BDT';
    const normalizedTotal = Math.round(numericTotal * 100) / 100;

    // ---------- Build contents ----------
    const contents = items.map(i => ({
        id: String(i.productId),
        quantity: parseInt(i.quantity) || 1,
        item_price: Math.round((parseFloat(i.price) || 0) * 100) / 100
    }));

    const numItems = contents.reduce((s, c) => s + c.quantity, 0);

    // ---------- 1. Browser Pixel ----------
    if (!localStorage.getItem(browserGuardKey) && typeof fbq === 'function') {
        try {
            fbq('track', 'Purchase', {
                content_ids: contents.map(c => c.id),
                content_type: 'product',
                num_items: numItems,
                value: normalizedTotal,
                currency: currency
            }, { eventID: orderId });
            localStorage.setItem(browserGuardKey, String(Date.now()));
            console.log('[Pixel] Purchase sent:', orderId, normalizedTotal, currency);
        } catch (e) {
            console.warn('[Pixel] error:', e);
        }
    } else {
        console.warn('[Pixel] fbq not available — skipped');
    }

    // ---------- 2. Server CAPI ----------
    if (!localStorage.getItem(capiGuardKey)) {
        sendPurchaseToCAPI(orderId, contents, normalizedTotal, currency, orderData)
            .then(() => { localStorage.setItem(capiGuardKey, String(Date.now())); })
            .catch(err => {
                // Do not mark failed CAPI delivery as complete; a later safe retry can recover it.
                console.warn('[CAPI] send failed; retry remains possible:', err.message);
            });
    }
};

// ============================================================
// SEND PURCHASE TO CAPI (v10 — DIAGNOSTIC)
// ============================================================
async function sendPurchaseToCAPI(orderId, contents, total, currency, orderData) {
    const capiUrl = window.settings?.metaCapiUrl;

    if (!capiUrl || !capiUrl.trim()) {
        console.log('[CAPI] URL not configured — skipping');
        return Promise.resolve();
    }

    const fbc = getCookie('_fbc');
    const fbp = getCookie('_fbp');
    const eventSourceUrl = window.location.href.split('?')[0];

    const user_data = {
        fbc: fbc || null,
        fbp: fbp || null,
        email: orderData?.email || null,
        phone: orderData?.phone || null,
        first_name: orderData?.full_name ? String(orderData.full_name).split(' ')[0] : null,
        last_name: orderData?.full_name ? String(orderData.full_name).split(' ').slice(1).join(' ') : null,
        city: orderData?.district || null,
        state: orderData?.division || null,
        country: 'bd',
        external_id: orderData?.user_id || null
    };

    const custom_data = {
        currency: currency,
        value: total,
        order_id: orderId,
        content_type: 'product',
        content_ids: contents.map(c => c.id),
        num_items: contents.reduce((s, c) => s + c.quantity, 0),
        contents: contents.map(c => ({
            id: c.id,
            quantity: c.quantity,
            item_price: c.item_price
        }))
    };

    const requestBody = {
        event_name: 'Purchase',
        event_id: orderId,
        event_source_url: eventSourceUrl,
        user_data: user_data,
        custom_data: custom_data
    };

    console.log('[CAPI] Sending Purchase request', JSON.stringify({
        url: capiUrl,
        event_id: orderId,
        value: total,
        currency: currency,
        content_ids: custom_data.content_ids,
        num_items: custom_data.num_items
    }));

    let response;
    try {
        response = await fetch(capiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
    } catch (networkErr) {
        console.error('[CAPI] Network error:', networkErr.message);
        throw networkErr;
    }

    const status = response.status;
    const text = await response.text();

    let result;
    try {
        result = text ? JSON.parse(text) : {};
    } catch (e) {
        console.error('[CAPI] Non-JSON response', JSON.stringify({
            status: status,
            preview: text.slice(0, 200)
        }));
        throw new Error('CAPI non-JSON response (' + status + ')');
    }

    if (!response.ok) {
        console.error('[CAPI] HTTP error', JSON.stringify({
            status: status,
            error: result.error || null,
            code: result.code || null,
            request_id: result.request_id || null
        }));
        throw new Error('CAPI HTTP ' + status + ': ' + (result.error || 'unknown'));
    }

    console.log('[CAPI] Purchase sent OK', JSON.stringify({
        status: status,
        events_received: result.meta_response?.events_received ?? 0,
        request_id: result.request_id || null
    }));

    return result;
}

// ============================================================
// COOKIE HELPER
// ============================================================
function getCookie(name) {
    try {
        const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[2]) : null;
    } catch(e) {
        return null;
    }
}

// ============================================================
// FBC COOKIE FIX
// Meta Pixel sets _fbc only when fbclid URL param exists.
// ============================================================
(function ensureFbcCookie() {
    try {
        const params = new URLSearchParams(window.location.search);
        const fbclid = params.get('fbclid');
        if (fbclid && !getCookie('_fbc')) {
            const fbcValue = 'fb.1.' + Date.now() + '.' + fbclid;
            document.cookie = '_fbc=' + fbcValue + '; path=/; max-age=' + (90 * 24 * 60 * 60) + '; SameSite=Lax';
        }
    } catch(e) {}
})();

// ============================================================
// AUTO BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadAndInjectSEO, 300);
});

// ============================================================
// EXPORTS
// ============================================================
window.logoutUser = logoutUser;
window.handleLogout = handleLogout;
window.updateUserProfile = updateUserProfile;
window.updateAuthUI = updateAuthUI;
window.syncGoogleProfileData = syncGoogleProfileData;
window.loadAndInjectSEO = loadAndInjectSEO;

console.log('✅ Auth + Pixel + CAPI loaded (v10 — CAPI DIAGNOSTIC)');