// ============================================================
// NOVAHUB — Supabase Configuration (v3)
// Domain: novahubgadgets.com
// WhatsApp: 01947939982
// 
// This is the READ-ONLY storefront client.
// All write operations (add/edit/delete products) are
// handled by a separate, secured admin backend that is
// NOT exposed to this client.
// ============================================================

// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = 'https://oxnfiueqmvggtjtciqbn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jYBypv_FEbLfWYDqFEeEkw_IA2WmZMk';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== GLOBAL STATE ====================
window.currentUser = null;
window.currentProfile = null;

window.settings = {
    shopName: 'Novahub',
    currency: '৳',
    orderPrefix: 'NV',
    whatsappNumber: '01947939982',
    insideDhakaCharge: 60,
    outsideDhakaCharge: 120,
    footerDescription: 'Premium Gadgets & Electronics Store in Bangladesh. Latest tech at best prices.'
};

// ==================== USER HELPERS ====================

async function getCurrentUser() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            window.currentUser = user;
            return user;
        }
        window.currentUser = null;
        return null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

async function getUserProfile(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('Error getting profile:', error);
            return null;
        }
        
        window.currentProfile = data;
        return data;
    } catch (error) {
        console.error('Error getting profile:', error);
        return null;
    }
}

async function isAdmin() {
    if (!window.currentUser) return false;
    const profile = await getUserProfile(window.currentUser.id);
    return profile && profile.role === 'admin';
}

// ==================== SETTINGS LOADER ====================

async function loadSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.error('Error loading settings:', error);
            return;
        }
        
        if (data) {
            window.settings = {
                shopName: data.shop_name || 'Novahub',
                logoURL: data.logo_url || 'assets/images/logo.jpg',
                currency: data.currency || '৳',
                orderPrefix: data.order_prefix || 'NV',
                whatsappNumber: data.whatsapp_number || '01947939982',
                facebookUrl: data.facebook_url || '',
                instagramUrl: data.instagram_url || '',
                insideDhakaCharge: data.inside_dhaka_charge || 60,
                outsideDhakaCharge: data.outside_dhaka_charge || 120,
                footerDescription: data.footer_description || '',
                webhookUrl: data.webhook_url || '',
                metaPixelId: data.meta_pixel_id || '',
                metaPixelEnabled: data.meta_pixel_enabled === true
            };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// ==================== FORMATTING HELPERS ====================

function formatPrice(price) {
    const curr = window.settings.currency || '৳';
    const safe = parseFloat(price) || 0;
    return curr + safe.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function safeParseNumber(value, defaultValue) {
    if (defaultValue === undefined) defaultValue = 0;
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(unsafe).replace(/[&<>"']/g, (m) => map[m]);
}

// ==================== ORDER ID GENERATOR ====================

function generateOrderId() {
    const prefix = window.settings.orderPrefix || 'NV';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return prefix + '-' + timestamp + random;
}

// ==================== VARIANT HELPERS ====================

function generateItemKey(productId, selectedVariant) {
    if (!selectedVariant || Object.keys(selectedVariant).length === 0) {
        return productId;
    }
    const sortedKeys = Object.keys(selectedVariant).sort();
    const variantString = sortedKeys.map(k => k + ':' + selectedVariant[k]).join('|');
    return productId + '|' + variantString;
}

function areVariantsEqual(v1, v2) {
    if (typeof v1 === 'string') {
        try { v1 = JSON.parse(v1); } catch(e) { v1 = null; }
    }
    if (typeof v2 === 'string') {
        try { v2 = JSON.parse(v2); } catch(e) { v2 = null; }
    }
    
    if (!v1 && !v2) return true;
    if (!v1 || !v2) return false;
    
    const keys1 = Object.keys(v1).sort();
    const keys2 = Object.keys(v2).sort();
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => v1[key] === v2[key]);
}

// ==================== TOAST ====================

function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.log(type + ': ' + message);
        return;
    }
    
    // Remove duplicate messages
    const existing = container.querySelectorAll('.toast');
    existing.forEach(el => {
        if (el.textContent.trim() === message.trim()) el.remove();
    });
    
    // Keep max 3 toasts
    while (container.children.length >= 3) {
        container.firstChild.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = 
        '<div class="toast-icon">' +
            '<i class="fas ' + (icons[type] || icons.info) + '"></i>' +
        '</div>' +
        '<span class="toast-message">' + escapeHtml(message) + '</span>' +
        '<button class="toast-close">' +
            '<i class="fas fa-times"></i>' +
        '</button>';
    
    container.appendChild(toast);
    
    const timeout = setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3500);
    
    toast._timeout = timeout;
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timeout);
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    });
}

// ==================== PAGE-VISIBILITY SAFE TIMERS ====================

// Pause auto-refresh timers when tab is hidden (performance)
let __isTabVisible = true;
document.addEventListener('visibilitychange', () => {
    __isTabVisible = !document.hidden;
});

// ==================== EXPORTS ====================
window.supabaseClient = supabaseClient;
window.getCurrentUser = getCurrentUser;
window.getUserProfile = getUserProfile;
window.isAdmin = isAdmin;
window.loadSettings = loadSettings;
window.formatPrice = formatPrice;
window.safeParseNumber = safeParseNumber;
window.escapeHtml = escapeHtml;
window.generateOrderId = generateOrderId;
window.generateItemKey = generateItemKey;
window.areVariantsEqual = areVariantsEqual;
window.showToast = showToast;

console.log('✅ Supabase Config loaded (v3 — Read-Only Client)');