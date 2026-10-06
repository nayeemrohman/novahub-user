// ============================================================
// NOVAHUB — Profile Page Script (v7 — Professional Redesign)
// Features:
//   ✅ Edit Name (Modal)
//   ✅ Edit Phone (Modal with validation)
//   ✅ Edit Location (Modal with Division→District→Upazila cascade)
//   ✅ Photo Upload to Cloudinary
//   ✅ Live DOM updates
//   ✅ Orders with modern empty state
//   ✅ Card-style headers with icons
// ============================================================

// ==================== CLOUDINARY CONFIG ====================
const CLOUDINARY_CONFIG = {
    cloudName: 'gl3cjwsz',
    uploadPreset: 'novahub_unsigned',
    folder: 'novahub/profiles',
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

// ==================== GLOBAL ====================
let currentUser = null;
let currentProfile = null;
let userOrders = [];
let activeTab = 'info';
let isUploading = false;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Profile page initializing...');
    
    await loadSettings();
    
    currentUser = await getCurrentUser();
    if (!currentUser) {
        showToast('Please login first', 'warning');
        setTimeout(() => window.location.href = 'auth.html', 1000);
        return;
    }
    
    console.log('✅ User:', currentUser.email);
    
    await loadProfile();
    await loadOrders();
    renderProfile();
    setupPhotoUpload();
    setupAllModals();
    setupLocationDropdowns();
    setupPhoneInput();
    
    console.log('✅ Profile page ready');
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
                currency: data.currency || '৳',
                ...data
            };
        }
    } catch (error) {
        console.error('Settings error:', error);
    }
}

// ============================================================
// LOAD PROFILE
// ============================================================
async function loadProfile() {
    try {
        const { data, error } = await supabaseClient
            .from('user_profiles').select('*')
            .eq('id', currentUser.id).single();
        
        if (error && error.code === 'PGRST116') {
            const googleData = currentUser.user_metadata || {};
            
            const newProfile = {
                id: currentUser.id,
                full_name: googleData.full_name || googleData.name || null,
                email: currentUser.email,
                avatar_url: googleData.avatar_url || googleData.picture || null,
                role: 'user',
                provider: 'google'
            };
            
            const { data: created } = await supabaseClient
                .from('user_profiles').insert([newProfile]).select().single();
            
            currentProfile = created || newProfile;
        } else if (data) {
            currentProfile = data;
            
            const googleData = currentUser.user_metadata || {};
            const updates = {};
            let needsUpdate = false;
            
            if (!currentProfile.full_name && (googleData.full_name || googleData.name)) {
                updates.full_name = googleData.full_name || googleData.name;
                needsUpdate = true;
            }
            
            if (!currentProfile.avatar_url && (googleData.avatar_url || googleData.picture)) {
                updates.avatar_url = googleData.avatar_url || googleData.picture;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await supabaseClient
                    .from('user_profiles').update(updates)
                    .eq('id', currentUser.id);
                currentProfile = { ...currentProfile, ...updates };
            }
        }
    } catch (error) {
        console.error('Load profile error:', error);
        currentProfile = {
            id: currentUser.id,
            full_name: currentUser.user_metadata?.full_name || null,
            avatar_url: currentUser.user_metadata?.avatar_url || null,
            phone: '', division: '', district: '',
            upazila: '', village: '', full_address: ''
        };
    }
}

// ============================================================
// LOAD ORDERS
// ============================================================
async function loadOrders() {
    try {
        const { data, error } = await supabaseClient
            .from('orders').select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        userOrders = data || [];
    } catch (error) {
        console.error('Error loading orders:', error);
        userOrders = [];
    }
}

// ============================================================
// HELPERS
// ============================================================
function getDisplayName() {
    const googleData = currentUser.user_metadata || {};
    return currentProfile?.full_name 
        || googleData.full_name 
        || googleData.name 
        || currentUser.email.split('@')[0];
}

function getDisplayPhoto() {
    const googleData = currentUser.user_metadata || {};
    return currentProfile?.avatar_url 
        || googleData.avatar_url 
        || googleData.picture 
        || null;
}

function getAddressText() {
    const parts = [
        currentProfile?.village,
        currentProfile?.upazila,
        currentProfile?.district,
        currentProfile?.division
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not set';
}

// ============================================================
// RENDER PROFILE
// ============================================================
function renderProfile() {
    const container = document.getElementById('profileContainer');
    if (!container) return;
    
    const displayName = getDisplayName();
    const initials = displayName.charAt(0).toUpperCase();
    const photoUrl = getDisplayPhoto();
    
    const avatarHTML = photoUrl 
        ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(displayName)}" class="profile-avatar-img" id="profileAvatarImg" onerror="this.outerHTML='<div class=\\'profile-avatar-letter\\' id=\\'profileAvatarLetter\\'>${escapeHtml(initials)}</div>'">`
        : `<div class="profile-avatar-letter" id="profileAvatarLetter">${escapeHtml(initials)}</div>`;
    
    container.innerHTML = `
        <div class="profile-header-card">
            <div class="profile-header-pattern"></div>
            <div class="profile-avatar-wrap">
                ${avatarHTML}
                ${currentProfile?.provider === 'google' || currentUser.user_metadata?.avatar_url ? `
                    <div class="profile-google-badge"><i class="fab fa-google"></i></div>
                ` : ''}
                <button type="button" class="profile-photo-btn" id="profilePhotoBtn" onclick="triggerPhotoUpload()" title="Change photo">
                    <i class="fas fa-camera" id="profilePhotoIcon"></i>
                </button>
            </div>
            <div class="profile-name" id="profileNameDisplay">${escapeHtml(displayName)}</div>
            <div class="profile-email">${escapeHtml(currentUser.email)}</div>
        </div>
        
        <div class="profile-tabs">
            <button class="profile-tab active" data-tab="info" onclick="switchTab('info')">
                <i class="fas fa-user"></i> <span>Info</span>
            </button>
            <button class="profile-tab" data-tab="orders" onclick="switchTab('orders')">
                <i class="fas fa-shopping-bag"></i> <span>Orders</span>
            </button>
            <button class="profile-tab" data-tab="settings" onclick="switchTab('settings')">
                <i class="fas fa-cog"></i> <span>Settings</span>
            </button>
        </div>
        
        <div id="tabContent"></div>
    `;
    
    renderTab('info');
}

// ============================================================
// SWITCH TAB
// ============================================================
function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.profile-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    renderTab(tab);
}
window.switchTab = switchTab;

function renderTab(tab) {
    const container = document.getElementById('tabContent');
    if (!container) return;
    
    if (tab === 'info') renderInfoTab(container);
    else if (tab === 'orders') renderOrdersTab(container);
    else if (tab === 'settings') renderSettingsTab(container);
}

// ============================================================
// INFO TAB
// ============================================================
function renderInfoTab(container) {
    const displayName = getDisplayName();
    const address = getAddressText();
    
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-card-header">
                <div class="profile-card-header-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h3>Personal Information</h3>
            </div>
            
            <div class="info-row" id="infoRowName">
                <div class="info-row-icon"><i class="fas fa-signature"></i></div>
                <div class="info-row-content">
                    <div class="info-row-label">Full Name</div>
                    <div class="info-row-value">${escapeHtml(displayName)}</div>
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-row-icon"><i class="fas fa-envelope"></i></div>
                <div class="info-row-content">
                    <div class="info-row-label">Email</div>
                    <div class="info-row-value">${escapeHtml(currentUser.email)}</div>
                </div>
            </div>
            
            <div class="info-row" id="infoRowPhone">
                <div class="info-row-icon"><i class="fas fa-phone"></i></div>
                <div class="info-row-content">
                    <div class="info-row-label">Phone</div>
                    <div class="info-row-value">${escapeHtml(currentProfile.phone || 'Not set')}</div>
                </div>
            </div>
            
            <div class="info-row" id="infoRowAddress">
                <div class="info-row-icon"><i class="fas fa-map-marker-alt"></i></div>
                <div class="info-row-content">
                    <div class="info-row-label">Delivery Address</div>
                    <div class="info-row-value">${escapeHtml(address)}</div>
                </div>
            </div>
            
            ${currentProfile.full_address ? `
                <div class="info-row" id="infoRowFullAddress">
                    <div class="info-row-icon"><i class="fas fa-home"></i></div>
                    <div class="info-row-content">
                        <div class="info-row-label">Full Address</div>
                        <div class="info-row-value">${escapeHtml(currentProfile.full_address)}</div>
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="profile-card">
            <div class="profile-card-header">
                <div class="profile-card-header-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3>Account Stats</h3>
            </div>
            
            <div class="info-row">
                <div class="info-row-icon"><i class="fas fa-box"></i></div>
                <div class="info-row-content">
                    <div class="info-row-label">Total Orders</div>
                    <div class="info-row-value">${userOrders.length}</div>
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-row-icon"><i class="fas fa-check-circle"></i></div>
                <div class="info-row-content">
                    <div class="info-row-label">Delivered</div>
                    <div class="info-row-value">${userOrders.filter(o => o.status === 'delivered').length}</div>
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-row-icon"><i class="fas fa-clock"></i></div>
                <div class="info-row-content">
                    <div class="info-row-label">Pending</div>
                    <div class="info-row-value">${userOrders.filter(o => o.status === 'pending').length}</div>
                </div>
            </div>
        </div>
        
        <button class="btn-logout" onclick="handleLogout()">
            <i class="fas fa-sign-out-alt"></i> Logout
        </button>
    `;
}

// ============================================================
// ORDERS TAB
// ============================================================
function renderOrdersTab(container) {
    if (userOrders.length === 0) {
        container.innerHTML = `
            <div class="profile-card">
                <div class="empty-orders-state">
                    <div class="empty-orders-icon">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <h3>No Orders Yet</h3>
                    <p>You haven't placed any orders yet. Start shopping to see them here!</p>
                    <a href="index.html" class="empty-orders-btn">
                        <i class="fas fa-shopping-cart"></i>
                        <span>Start Shopping</span>
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-card-header">
                <div class="profile-card-header-icon">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <h3>My Orders (${userOrders.length})</h3>
            </div>
            
            <div style="padding-top: 4px;">
                ${userOrders.map(order => {
                    const date = order.created_at 
                        ? new Date(order.created_at).toLocaleDateString('en-GB', { 
                            day: '2-digit', month: 'short', year: 'numeric' 
                        })
                        : '';
                    
                    const itemCount = Array.isArray(order.items) 
                        ? order.items.reduce((s, i) => s + (i.quantity || 0), 0) 
                        : 0;
                    
                    return `
                        <div class="order-list-item" onclick="window.location.href='order-track.html'">
                            <div class="order-item-header">
                                <span class="order-list-id">${escapeHtml(order.order_id)}</span>
                                <span class="order-list-status ${order.status}">${order.status}</span>
                            </div>
                            <div class="order-item-meta">
                                <span><i class="far fa-calendar"></i> ${date}</span>
                                <span><i class="fas fa-box"></i> ${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
                                <span class="order-item-total">${formatPrice(order.total)}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ============================================================
// SETTINGS TAB
// ============================================================
function renderSettingsTab(container) {
    const displayName = getDisplayName();
    const address = getAddressText();
    
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-card-header">
                <div class="profile-card-header-icon">
                    <i class="fas fa-cog"></i>
                </div>
                <h3>Account Settings</h3>
            </div>
            
            <!-- NAME -->
            <div class="setting-row" onclick="openEditNameModal()">
                <div class="setting-info">
                    <div class="setting-icon"><i class="fas fa-signature"></i></div>
                    <div>
                        <div class="setting-label">Display Name</div>
                        <div class="setting-value" id="settingsNameValue">${escapeHtml(displayName)}</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right setting-arrow"></i>
            </div>
            
            <!-- EMAIL (Read-only) -->
            <div class="setting-row readonly">
                <div class="setting-info">
                    <div class="setting-icon"><i class="fas fa-envelope"></i></div>
                    <div>
                        <div class="setting-label">Email <span class="setting-tag">Google</span></div>
                        <div class="setting-value">${escapeHtml(currentUser.email)}</div>
                    </div>
                </div>
                <i class="fas fa-lock setting-lock"></i>
            </div>
            
            <!-- PHONE -->
            <div class="setting-row" onclick="openEditPhoneModal()">
                <div class="setting-info">
                    <div class="setting-icon"><i class="fas fa-phone"></i></div>
                    <div>
                        <div class="setting-label">Phone Number</div>
                        <div class="setting-value" id="settingsPhoneValue">${escapeHtml(currentProfile.phone || 'Not set — tap to add')}</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right setting-arrow"></i>
            </div>
            
            <!-- ADDRESS -->
            <div class="setting-row" onclick="openEditLocationModal()">
                <div class="setting-info">
                    <div class="setting-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <div>
                        <div class="setting-label">Delivery Address</div>
                        <div class="setting-value" id="settingsAddressValue">${escapeHtml(address)}</div>
                    </div>
                </div>
                <i class="fas fa-chevron-right setting-arrow"></i>
            </div>
        </div>
        
        <div class="profile-card">
            <div class="profile-card-header">
                <div class="profile-card-header-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <h3>Account Info</h3>
            </div>
            
            <div class="info-row">
                <div class="info-row-icon"><i class="fab fa-google"></i></div>
                <div class="info-row-content">
                    <div class="info-row-label">Account Type</div>
                    <div class="info-row-value">Google Account</div>
                </div>
            </div>
            
            <div class="info-row">
                <div class="info-row-icon"><i class="fas fa-calendar"></i></div>
                <div class="info-row-content">
                    <div class="info-row-label">Member Since</div>
                    <div class="info-row-value">${currentUser.created_at 
                        ? new Date(currentUser.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
                        : 'Recently'}</div>
                </div>
            </div>
        </div>
        
        <button class="btn-logout" onclick="handleLogout()">
            <i class="fas fa-sign-out-alt"></i> Logout
        </button>
    `;
}

// ============================================================
// MODAL SETUP
// ============================================================
function setupAllModals() {
    const modals = ['editNameModal', 'editPhoneModal', 'editLocationModal'];
    
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (!modal) return;
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(id);
        });
    });
    
    // ESC to close any open modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(id => {
                const m = document.getElementById(id);
                if (m && m.classList.contains('active')) closeModal(id);
            });
        }
    });
    
    // Name: Enter to save
    const nameInput = document.getElementById('editNameInput');
    if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); saveNewName(); }
        });
        nameInput.addEventListener('input', () => clearFieldError('editNameError'));
    }
    
    // Phone: Enter to save
    const phoneInput = document.getElementById('editPhoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); saveNewPhone(); }
        });
        phoneInput.addEventListener('input', () => {
            phoneInput.value = phoneInput.value.replace(/\D/g, '');
            clearFieldError('editPhoneError');
        });
    }
}

function clearFieldError(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.remove('show'); }
}

function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add('show'); }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}
window.closeModal = closeModal;

// ============================================================
// NAME EDIT
// ============================================================
function openEditNameModal() {
    const input = document.getElementById('editNameInput');
    if (!input) return;
    
    input.value = getDisplayName();
    clearFieldError('editNameError');
    openModal('editNameModal');
    
    setTimeout(() => {
        input.focus();
        input.select();
    }, 100);
}
window.openEditNameModal = openEditNameModal;

async function saveNewName() {
    const input = document.getElementById('editNameInput');
    const btn = document.getElementById('saveNameBtn');
    const btnText = btn.querySelector('span');
    const btnSpinner = btn.querySelector('.fa-spinner');
    
    const newName = input.value.trim();
    
    if (!newName) {
        showFieldError('editNameError', 'Please enter your name');
        input.focus();
        return;
    }
    if (newName.length < 2) {
        showFieldError('editNameError', 'Name must be at least 2 characters');
        input.focus();
        return;
    }
    if (newName.length > 60) {
        showFieldError('editNameError', 'Name too long (max 60 characters)');
        input.focus();
        return;
    }
    if (newName === getDisplayName()) {
        closeModal('editNameModal');
        return;
    }
    
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    
    try {
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({ 
                full_name: newName,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        currentProfile.full_name = newName;
        updateNameInDOM(newName);
        
        showToast('Name updated!', 'success');
        closeModal('editNameModal');
        
    } catch (error) {
        console.error('Save name error:', error);
        showFieldError('editNameError', error.message || 'Failed to save');
    } finally {
        btn.disabled = false;
        if (btnText) btnText.style.display = 'inline-flex';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}
window.saveNewName = saveNewName;

function updateNameInDOM(newName) {
    const headerName = document.getElementById('profileNameDisplay');
    if (headerName) headerName.textContent = newName;
    
    const settingsName = document.getElementById('settingsNameValue');
    if (settingsName) settingsName.textContent = newName;
    
    const infoRowName = document.querySelector('#infoRowName .info-row-value');
    if (infoRowName) infoRowName.textContent = newName;
    
    const avatarLetter = document.getElementById('profileAvatarLetter');
    if (avatarLetter) avatarLetter.textContent = newName.charAt(0).toUpperCase();
    
    document.title = newName + ' – My Profile | Novahub';
}

// ============================================================
// PHONE EDIT
// ============================================================
function openEditPhoneModal() {
    const input = document.getElementById('editPhoneInput');
    if (!input) return;
    
    input.value = currentProfile.phone || '';
    clearFieldError('editPhoneError');
    openModal('editPhoneModal');
    
    setTimeout(() => {
        input.focus();
        input.select();
    }, 100);
}
window.openEditPhoneModal = openEditPhoneModal;

async function saveNewPhone() {
    const input = document.getElementById('editPhoneInput');
    const btn = document.getElementById('savePhoneBtn');
    const btnText = btn.querySelector('span');
    const btnSpinner = btn.querySelector('.fa-spinner');
    
    const newPhone = input.value.trim();
    const phoneRegex = /^01[3-9]\d{8}$/;
    
    if (!newPhone) {
        showFieldError('editPhoneError', 'Please enter your phone number');
        input.focus();
        return;
    }
    if (!phoneRegex.test(newPhone)) {
        showFieldError('editPhoneError', 'Enter valid BD number (01XXXXXXXXX)');
        input.focus();
        return;
    }
    if (newPhone === currentProfile.phone) {
        closeModal('editPhoneModal');
        return;
    }
    
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    
    try {
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({ 
                phone: newPhone,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        currentProfile.phone = newPhone;
        updatePhoneInDOM(newPhone);
        
        showToast('Phone number updated!', 'success');
        closeModal('editPhoneModal');
        
    } catch (error) {
        console.error('Save phone error:', error);
        showFieldError('editPhoneError', error.message || 'Failed to save');
    } finally {
        btn.disabled = false;
        if (btnText) btnText.style.display = 'inline-flex';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}
window.saveNewPhone = saveNewPhone;

function updatePhoneInDOM(newPhone) {
    const settingsPhone = document.getElementById('settingsPhoneValue');
    if (settingsPhone) settingsPhone.textContent = newPhone;
    
    const infoRowPhone = document.querySelector('#infoRowPhone .info-row-value');
    if (infoRowPhone) infoRowPhone.textContent = newPhone;
}

// ============================================================
// LOCATION EDIT — SETUP DROPDOWNS
// ============================================================
function setupLocationDropdowns() {
    const divSelect = document.getElementById('editDivision');
    const distSelect = document.getElementById('editDistrict');
    const upSelect = document.getElementById('editUpazila');
    
    if (!divSelect || !distSelect || !upSelect) return;
    
    // Populate divisions
    const divisions = Object.keys(LOCATION_DATA.bangladesh.levels);
    divSelect.innerHTML = '<option value="">Select Division</option>' +
        divisions.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    
    // Division change → populate districts
    divSelect.addEventListener('change', () => {
        const div = divSelect.value;
        
        distSelect.innerHTML = '<option value="">Select District</option>';
        upSelect.innerHTML = '<option value="">Select Upazila</option>';
        clearFieldError('editLocationError');
        
        if (!div) {
            distSelect.disabled = true;
            upSelect.disabled = true;
            return;
        }
        
        const districts = Object.keys(LOCATION_DATA.bangladesh.levels[div] || {});
        distSelect.innerHTML = '<option value="">Select District</option>' +
            districts.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
        distSelect.disabled = false;
        upSelect.disabled = true;
    });
    
    // District change → populate upazilas
    distSelect.addEventListener('change', () => {
        const div = divSelect.value;
        const dist = distSelect.value;
        
        upSelect.innerHTML = '<option value="">Select Upazila</option>';
        clearFieldError('editLocationError');
        
        if (!dist) {
            upSelect.disabled = true;
            return;
        }
        
        const upazilas = LOCATION_DATA.bangladesh.levels[div]?.[dist] || [];
        upSelect.innerHTML = '<option value="">Select Upazila</option>' +
            upazilas.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
        upSelect.disabled = false;
    });
    
    // Upazila change → clear error
    upSelect.addEventListener('change', () => clearFieldError('editLocationError'));
    
    // Village input
    const villageInput = document.getElementById('editVillage');
    if (villageInput) {
        villageInput.addEventListener('input', () => clearFieldError('editLocationError'));
    }
}

// ============================================================
// LOCATION EDIT — OPEN MODAL
// ============================================================
function openEditLocationModal() {
    const divSelect = document.getElementById('editDivision');
    const distSelect = document.getElementById('editDistrict');
    const upSelect = document.getElementById('editUpazila');
    const villageInput = document.getElementById('editVillage');
    const addressInput = document.getElementById('editFullAddress');
    
    if (!divSelect) return;
    
    clearFieldError('editLocationError');
    
    // Reset selects to empty first
    divSelect.value = '';
    distSelect.innerHTML = '<option value="">Select District</option>';
    distSelect.disabled = true;
    upSelect.innerHTML = '<option value="">Select Upazila</option>';
    upSelect.disabled = true;
    if (villageInput) villageInput.value = '';
    if (addressInput) addressInput.value = '';
    
    // Prefill current values with cascade
    if (currentProfile.division && LOCATION_DATA.bangladesh.levels[currentProfile.division]) {
        divSelect.value = currentProfile.division;
        
        const districts = Object.keys(LOCATION_DATA.bangladesh.levels[currentProfile.division] || {});
        distSelect.innerHTML = '<option value="">Select District</option>' +
            districts.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
        distSelect.disabled = false;
        
        if (currentProfile.district) {
            distSelect.value = currentProfile.district;
            
            const upazilas = LOCATION_DATA.bangladesh.levels[currentProfile.division]?.[currentProfile.district] || [];
            upSelect.innerHTML = '<option value="">Select Upazila</option>' +
                upazilas.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
            upSelect.disabled = false;
            
            if (currentProfile.upazila) upSelect.value = currentProfile.upazila;
        }
    }
    
    if (villageInput) villageInput.value = currentProfile.village || '';
    if (addressInput) addressInput.value = currentProfile.full_address || '';
    
    openModal('editLocationModal');
}
window.openEditLocationModal = openEditLocationModal;

// ============================================================
// LOCATION EDIT — SAVE
// ============================================================
async function saveNewLocation() {
    const divSelect = document.getElementById('editDivision');
    const distSelect = document.getElementById('editDistrict');
    const upSelect = document.getElementById('editUpazila');
    const villageInput = document.getElementById('editVillage');
    const addressInput = document.getElementById('editFullAddress');
    
    const btn = document.getElementById('saveLocationBtn');
    const btnText = btn.querySelector('span');
    const btnSpinner = btn.querySelector('.fa-spinner');
    
    const division = divSelect.value;
    const district = distSelect.value;
    const upazila = upSelect.value;
    const village = villageInput.value.trim();
    const fullAddress = addressInput.value.trim();
    
    // Validation
    if (!division) {
        showFieldError('editLocationError', 'Please select a division');
        divSelect.focus();
        return;
    }
    if (!district) {
        showFieldError('editLocationError', 'Please select a district');
        distSelect.focus();
        return;
    }
    if (!upazila) {
        showFieldError('editLocationError', 'Please select a thana/upazila');
        upSelect.focus();
        return;
    }
    if (!village) {
        showFieldError('editLocationError', 'Please enter village/area name');
        villageInput.focus();
        return;
    }
    
    // Check if unchanged
    const isSame = 
        division === currentProfile.division &&
        district === currentProfile.district &&
        upazila === currentProfile.upazila &&
        village === (currentProfile.village || '') &&
        fullAddress === (currentProfile.full_address || '');
    
    if (isSame) {
        closeModal('editLocationModal');
        return;
    }
    
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    
    try {
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({
                division: division,
                district: district,
                upazila: upazila,
                village: village,
                full_address: fullAddress || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        // Update local state
        currentProfile.division = division;
        currentProfile.district = district;
        currentProfile.upazila = upazila;
        currentProfile.village = village;
        currentProfile.full_address = fullAddress || null;
        
        updateAddressInDOM();
        
        showToast('Delivery address updated!', 'success');
        closeModal('editLocationModal');
        
    } catch (error) {
        console.error('Save location error:', error);
        showFieldError('editLocationError', error.message || 'Failed to save address');
    } finally {
        btn.disabled = false;
        if (btnText) btnText.style.display = 'inline-flex';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}
window.saveNewLocation = saveNewLocation;

function updateAddressInDOM() {
    const addressText = getAddressText();
    
    const settingsAddress = document.getElementById('settingsAddressValue');
    if (settingsAddress) settingsAddress.textContent = addressText;
    
    const infoRowAddress = document.querySelector('#infoRowAddress .info-row-value');
    if (infoRowAddress) infoRowAddress.textContent = addressText;
    
    // Full address row — render or update
    const infoRowFull = document.getElementById('infoRowFullAddress');
    if (currentProfile.full_address) {
        if (infoRowFull) {
            const val = infoRowFull.querySelector('.info-row-value');
            if (val) val.textContent = currentProfile.full_address;
        }
    }
}

// ============================================================
// PHONE INPUT (setup for phone modal)
// ============================================================
function setupPhoneInput() {
    const input = document.getElementById('editPhoneInput');
    if (!input) return;
    input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

// ============================================================
// PHOTO UPLOAD
// ============================================================
function setupPhotoUpload() {
    const input = document.getElementById('profilePhotoInput');
    if (!input) return;
    input.addEventListener('change', handlePhotoSelect);
}

function triggerPhotoUpload() {
    if (isUploading) return;
    const input = document.getElementById('profilePhotoInput');
    if (input) {
        input.value = '';
        input.click();
    }
}
window.triggerPhotoUpload = triggerPhotoUpload;

async function handlePhotoSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!CLOUDINARY_CONFIG.allowedTypes.includes(file.type)) {
        showToast('Only JPG, PNG, WEBP allowed', 'error');
        return;
    }
    
    if (file.size > CLOUDINARY_CONFIG.maxFileSize) {
        showToast('Image too large (Max 5MB)', 'error');
        return;
    }
    
    isUploading = true;
    
    const btn = document.getElementById('profilePhotoBtn');
    const icon = document.getElementById('profilePhotoIcon');
    
    if (btn) btn.classList.add('uploading');
    if (icon) icon.className = 'fas fa-spinner';
    
    try {
        showToast('Uploading photo...', 'info');
        const result = await uploadToCloudinary(file);
        
        if (!result.success) throw new Error('Upload failed');
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({ 
                avatar_url: result.url,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        currentProfile.avatar_url = result.url;
        updateAvatarInDOM(result.url);
        
        showToast('Photo updated!', 'success');
        
    } catch (error) {
        console.error('Photo upload error:', error);
        showToast(error.message || 'Failed to upload photo', 'error');
    } finally {
        isUploading = false;
        if (btn) btn.classList.remove('uploading');
        if (icon) icon.className = 'fas fa-camera';
        event.target.value = '';
    }
}

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', CLOUDINARY_CONFIG.folder);
    
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.secure_url) {
                        resolve({ success: true, url: response.secure_url });
                    } else {
                        reject(new Error('No URL returned'));
                    }
                } catch (e) {
                    reject(new Error('Parse error'));
                }
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    reject(new Error(err.error?.message || `Upload failed (${xhr.status})`));
                } catch (e) {
                    reject(new Error(`Upload failed (${xhr.status})`));
                }
            }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
    });
}

function updateAvatarInDOM(url) {
    const wrap = document.querySelector('.profile-avatar-wrap');
    if (!wrap) return;
    
    const oldImg = wrap.querySelector('.profile-avatar-img');
    const oldLetter = wrap.querySelector('.profile-avatar-letter');
    if (oldImg) oldImg.remove();
    if (oldLetter) oldLetter.remove();
    
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Profile';
    img.className = 'profile-avatar-img';
    img.id = 'profileAvatarImg';
    img.onerror = () => {
        img.outerHTML = `<div class="profile-avatar-letter">${getDisplayName().charAt(0).toUpperCase()}</div>`;
    };
    
    const badge = wrap.querySelector('.profile-google-badge');
    const photoBtn = wrap.querySelector('.profile-photo-btn');
    
    if (badge) wrap.insertBefore(img, badge);
    else if (photoBtn) wrap.insertBefore(img, photoBtn);
    else wrap.insertBefore(img, wrap.firstChild);
}

// ============================================================
// HELPERS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, m => map[m]);
}

function formatPrice(price) {
    const curr = window.settings?.currency || '৳';
    const n = parseFloat(price) || 0;
    return curr + n.toLocaleString('en-BD', { maximumFractionDigits: 2 });
}

console.log('✅ Profile script loaded (v7 — Professional Redesign)');