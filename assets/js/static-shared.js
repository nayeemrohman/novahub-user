// ============================================================
// NOVAHUB — Static Pages Shared Script (v4)
// Used in: about.html, terms.html, privacy.html
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Static page initializing...');
    
    await loadSettings();
    await updateAuthUI();
    await updateHeaderProfile();
    updateCartCount();
    
    console.log('✅ Static page ready');
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
                orderPrefix: data.order_prefix || 'NV'
            };
        }
    } catch (error) {
        console.error('Settings error:', error);
    }
}

// ============================================================
// PROFILE CLICK
// ============================================================
async function handleProfileClick() {
    const user = await getCurrentUser();
    if (user) window.location.href = 'profile.html';
    else window.location.href = 'auth.html';
}
window.handleProfileClick = handleProfileClick;

// ============================================================
// OPEN CART
// ============================================================
function openCartFromStatic() {
    window.location.href = 'index.html?openCart=1';
}
window.openCartFromStatic = openCartFromStatic;

// ============================================================
// HEADER PROFILE
// ============================================================
async function updateHeaderProfile() {
    const user = await getCurrentUser();
    const profileIcon = document.getElementById('headerProfileIcon');
    if (!profileIcon) return;
    
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
// CART COUNT
// ============================================================
function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (!countEl) return;
    
    try {
        const saved = localStorage.getItem('novahub_cart');
        const cart = saved ? JSON.parse(saved) : [];
        const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        countEl.textContent = total;
        countEl.style.display = total > 0 ? 'flex' : 'none';
    } catch (e) {
        countEl.textContent = '0';
        countEl.style.display = 'none';
    }
}

console.log('✅ Static shared script loaded (v4)');