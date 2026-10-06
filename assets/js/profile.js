// ============================================================
// NOVAHUB — Profile Page Script (Google + Photo Upload)
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
let user = null;
let profile = null;
let userOrders = [];
let activeTab = 'info';
let isUploading = false;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Profile page initializing...');
    
    await loadSettings();
    
    user = await getCurrentUser();
    if (!user) {
        showToast('Please login first', 'warning');
        setTimeout(() => window.location.href = 'auth.html', 1000);
        return;
    }
    
    console.log('✅ User:', user.email);
    
    await loadProfile();
    await loadOrders();
    renderProfile();
    setupPhotoUpload();
    
    console.log('✅ Profile page ready');
});

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
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error && error.code === 'PGRST116') {
            // Create new profile if not exists
            const googleData = user.user_metadata || {};
            
            const newProfile = {
                id: user.id,
                full_name: googleData.full_name || googleData.name || null,
                email: user.email,
                avatar_url: googleData.avatar_url || googleData.picture || null,
                role: 'user',
                provider: 'google'
            };
            
            const { data: created } = await supabaseClient
                .from('user_profiles')
                .insert([newProfile])
                .select()
                .single();
            
            profile = created || newProfile;
        } else if (data) {
            profile = data;
            
            // Auto-fill name + photo from Google if missing
            const googleData = user.user_metadata || {};
            let needsUpdate = false;
            const updates = {};
            
            if (!profile.full_name && (googleData.full_name || googleData.name)) {
                updates.full_name = googleData.full_name || googleData.name;
                needsUpdate = true;
            }
            
            if (!profile.avatar_url && (googleData.avatar_url || googleData.picture)) {
                updates.avatar_url = googleData.avatar_url || googleData.picture;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await supabaseClient
                    .from('user_profiles')
                    .update(updates)
                    .eq('id', user.id);
                
                profile = { ...profile, ...updates };
                console.log('✅ Google data synced');
            }
        }
    } catch (error) {
        console.error('Load profile error:', error);
        profile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
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
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        userOrders = data || [];
    } catch (error) {
        console.error('Error loading orders:', error);
        userOrders = [];
    }
}

// ============================================================
// RENDER PROFILE
// ============================================================
function renderProfile() {
    const container = document.getElementById('profileContainer');
    if (!container) return;
    
    const googleData = user.user_metadata || {};
    
    // Name: profile > google > email
    const displayName = profile?.full_name 
        || googleData.full_name 
        || googleData.name 
        || user.email.split('@')[0];
    
    const initials = displayName.charAt(0).toUpperCase();
    
    // Photo: profile > google
    const photoUrl = profile?.avatar_url 
        || googleData.avatar_url 
        || googleData.picture 
        || null;
    
    // Avatar HTML
    const avatarHTML = photoUrl 
        ? `<img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(displayName)}" class="profile-avatar-img" id="profileAvatarImg" onerror="this.outerHTML='<div class=\\'profile-avatar-letter\\' id=\\'profileAvatarLetter\\'>${escapeHtml(initials)}</div>'">`
        : `<div class="profile-avatar-letter" id="profileAvatarLetter">${escapeHtml(initials)}</div>`;
    
    container.innerHTML = `
        <div class="profile-header-card">
            <div class="profile-avatar-wrap">
                ${avatarHTML}
                ${profile?.provider === 'google' || googleData.avatar_url ? `
                    <div class="profile-google-badge"><i class="fab fa-google"></i></div>
                ` : ''}
                <button type="button" class="profile-photo-btn" id="profilePhotoBtn" onclick="triggerPhotoUpload()" title="Change photo">
                    <i class="fas fa-camera" id="profilePhotoIcon"></i>
                </button>
            </div>
            <div class="profile-name">${escapeHtml(displayName)}</div>
            <div class="profile-email">${escapeHtml(user.email)}</div>
        </div>
        
        <div class="profile-tabs">
            <button class="profile-tab active" data-tab="info" onclick="switchTab('info')">
                <i class="fas fa-user"></i> Info
            </button>
            <button class="profile-tab" data-tab="orders" onclick="switchTab('orders')">
                <i class="fas fa-shopping-bag"></i> Orders
            </button>
            <button class="profile-tab" data-tab="edit" onclick="switchTab('edit')">
                <i class="fas fa-edit"></i> Edit
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
    else if (tab === 'edit') renderEditTab(container);
}

// ============================================================
// INFO TAB
// ============================================================
function renderInfoTab(container) {
    const googleData = user.user_metadata || {};
    
    const address = [
        profile.village, profile.upazila, profile.district, profile.division
    ].filter(Boolean).join(', ') || 'Not set';
    
    const displayName = profile.full_name 
        || googleData.full_name 
        || googleData.name 
        || 'Not set';
    
    container.innerHTML = `
        <div class="profile-card">
            <h3><i class="fas fa-user-circle"></i> Personal Information</h3>
            <div class="info-row">
                <span class="label">Full Name</span>
                <span class="value">${escapeHtml(displayName)}</span>
            </div>
            <div class="info-row">
                <span class="label">Email</span>
                <span class="value">${escapeHtml(user.email)}</span>
            </div>
            <div class="info-row">
                <span class="label">Phone</span>
                <span class="value">${escapeHtml(profile.phone || 'Not set')}</span>
            </div>
            <div class="info-row">
                <span class="label">Address</span>
                <span class="value">${escapeHtml(address)}</span>
            </div>
            ${profile.full_address ? `
                <div class="info-row">
                    <span class="label">Full Address</span>
                    <span class="value">${escapeHtml(profile.full_address)}</span>
                </div>
            ` : ''}
        </div>
        
        <div class="profile-card">
            <h3><i class="fas fa-chart-line"></i> Account Stats</h3>
            <div class="info-row">
                <span class="label">Total Orders</span>
                <span class="value">${userOrders.length}</span>
            </div>
            <div class="info-row">
                <span class="label">Delivered</span>
                <span class="value">${userOrders.filter(o => o.status === 'delivered').length}</span>
            </div>
            <div class="info-row">
                <span class="label">Pending</span>
                <span class="value">${userOrders.filter(o => o.status === 'pending').length}</span>
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
                <div class="empty-state">
                    <i class="fas fa-shopping-bag"></i>
                    <h3>No Orders Yet</h3>
                    <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px;">Start shopping to see your orders here</p>
                    <a href="index.html" style="display:inline-block;padding:12px 24px;background:var(--red);color:white;border-radius:50px;font-weight:700;text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:1px;">
                        <i class="fas fa-shopping-cart"></i> Shop Now
                    </a>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="profile-card">
            <h3><i class="fas fa-shopping-bag"></i> Recent Orders (${userOrders.length})</h3>
            ${userOrders.map(order => {
                const date = order.created_at 
                    ? new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '';
                
                return `
                    <div class="order-list-item" onclick="window.location.href='order-track.html?id=${order.order_id}'">
                        <div class="order-item-header">
                            <span class="order-list-id">${escapeHtml(order.order_id)}</span>
                            <span class="order-list-status ${order.status}">${order.status}</span>
                        </div>
                        <div class="order-item-meta">
                            <span>📅 ${date}</span>
                            <span><strong>${formatPrice(order.total)}</strong></span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ============================================================
// EDIT TAB
// ============================================================
function renderEditTab(container) {
    const googleData = user.user_metadata || {};
    
    const displayName = profile.full_name 
        || googleData.full_name 
        || googleData.name 
        || '';
    
    container.innerHTML = `
        <div class="profile-card">
            <h3><i class="fas fa-edit"></i> Edit Profile</h3>
            
            <form class="profile-form" onsubmit="event.preventDefault(); saveProfile(event)">
                
                <div class="form-field">
                    <label>
                        <i class="fas fa-user"></i> Full Name
                        <span class="readonly-tag">From Google</span>
                    </label>
                    <input type="text" id="editName" value="${escapeHtml(displayName)}" readonly>
                </div>
                
                <div class="form-field">
                    <label>
                        <i class="fas fa-envelope"></i> Email
                        <span class="readonly-tag">From Google</span>
                    </label>
                    <input type="email" id="editEmail" value="${escapeHtml(user.email)}" readonly>
                </div>
                
                <div class="form-field">
                    <label><i class="fas fa-phone"></i> Phone Number</label>
                    <input type="tel" id="editPhone" value="${escapeHtml(profile.phone || '')}" placeholder="01XXXXXXXXX" maxlength="11">
                </div>
                
                <div class="form-field">
                    <label><i class="fas fa-map"></i> Division</label>
                    <select id="editDivision"><option value="">Select Division</option></select>
                </div>
                
                <div class="form-field">
                    <label><i class="fas fa-city"></i> District</label>
                    <select id="editDistrict" disabled><option value="">Select District</option></select>
                </div>
                
                <div class="form-field">
                    <label><i class="fas fa-building"></i> Thana / Upazila</label>
                    <select id="editUpazila" disabled><option value="">Select Upazila</option></select>
                </div>
                
                <div class="form-field">
                    <label><i class="fas fa-home"></i> Village / Area</label>
                    <input type="text" id="editVillage" value="${escapeHtml(profile.village || '')}" placeholder="Village or Area">
                </div>
                
                <div class="form-field">
                    <label><i class="fas fa-location-dot"></i> Full Address</label>
                    <textarea id="editFullAddress" rows="2" placeholder="House, Road, Landmark">${escapeHtml(profile.full_address || '')}</textarea>
                </div>
                
                <button type="submit" class="btn-primary-profile" id="saveProfileBtn">
                    <span><i class="fas fa-save"></i> Save Changes</span>
                    <i class="fas fa-spinner fa-spin" style="display:none;"></i>
                </button>
            </form>
        </div>
    `;
    
    setupEditLocationDropdowns();
    setupPhoneInput();
}

// ============================================================
// EDIT LOCATION DROPDOWNS
// ============================================================
function setupEditLocationDropdowns() {
    const divSelect = document.getElementById('editDivision');
    const distSelect = document.getElementById('editDistrict');
    const upSelect = document.getElementById('editUpazila');
    
    if (!divSelect || !distSelect || !upSelect) return;
    
    const divisions = Object.keys(LOCATION_DATA.bangladesh.levels);
    divSelect.innerHTML = '<option value="">Select Division</option>' +
        divisions.map(d => `<option value="${d}">${d}</option>`).join('');
    
    if (profile.division) {
        divSelect.value = profile.division;
        const districts = Object.keys(LOCATION_DATA.bangladesh.levels[profile.division] || {});
        distSelect.innerHTML = '<option value="">Select District</option>' +
            districts.map(d => `<option value="${d}">${d}</option>`).join('');
        distSelect.disabled = false;
        
        if (profile.district) {
            distSelect.value = profile.district;
            const upazilas = LOCATION_DATA.bangladesh.levels[profile.division]?.[profile.district] || [];
            upSelect.innerHTML = '<option value="">Select Upazila</option>' +
                upazilas.map(u => `<option value="${u}">${u}</option>`).join('');
            upSelect.disabled = false;
            if (profile.upazila) upSelect.value = profile.upazila;
        }
    }
    
    divSelect.addEventListener('change', () => {
        const div = divSelect.value;
        distSelect.innerHTML = '<option value="">Select District</option>';
        upSelect.innerHTML = '<option value="">Select Upazila</option>';
        
        if (!div) {
            distSelect.disabled = true;
            upSelect.disabled = true;
            return;
        }
        
        const districts = Object.keys(LOCATION_DATA.bangladesh.levels[div] || {});
        distSelect.innerHTML = '<option value="">Select District</option>' +
            districts.map(d => `<option value="${d}">${d}</option>`).join('');
        distSelect.disabled = false;
        upSelect.disabled = true;
    });
    
    distSelect.addEventListener('change', () => {
        const div = divSelect.value;
        const dist = distSelect.value;
        upSelect.innerHTML = '<option value="">Select Upazila</option>';
        
        if (!dist) { upSelect.disabled = true; return; }
        
        const upazilas = LOCATION_DATA.bangladesh.levels[div]?.[dist] || [];
        upSelect.innerHTML = '<option value="">Select Upazila</option>' +
            upazilas.map(u => `<option value="${u}">${u}</option>`).join('');
        upSelect.disabled = false;
    });
}

function setupPhoneInput() {
    const phoneInput = document.getElementById('editPhone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

// ============================================================
// SAVE PROFILE
// ============================================================
async function saveProfile(event) {
    event.preventDefault();
    
    const btn = document.getElementById('saveProfileBtn');
    const btnText = btn.querySelector('span');
    const btnSpinner = btn.querySelector('.fa-spinner');
    
    const phone = document.getElementById('editPhone').value.trim();
    const division = document.getElementById('editDivision').value;
    const district = document.getElementById('editDistrict').value;
    const upazila = document.getElementById('editUpazila').value;
    const village = document.getElementById('editVillage').value.trim();
    const fullAddress = document.getElementById('editFullAddress').value.trim();
    
    // Phone validation (optional but if given must be valid)
    if (phone) {
        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(phone)) {
            showToast('Enter valid phone (01XXXXXXXXX)', 'warning');
            return;
        }
    }
    
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    
    try {
        const updates = {
            phone: phone || null,
            division: division || null,
            district: district || null,
            upazila: upazila || null,
            village: village || null,
            full_address: fullAddress || null,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id);
        
        if (error) throw error;
        
        profile = { ...profile, ...updates };
        
        showToast('Profile updated successfully!', 'success');
        
        setTimeout(() => switchTab('info'), 800);
        
    } catch (error) {
        console.error('Save profile error:', error);
        showToast('Failed to save: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        if (btnText) btnText.style.display = 'inline-flex';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

window.saveProfile = saveProfile;

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
    if (icon) {
        icon.className = 'fas fa-spinner';
    }
    
    try {
        showToast('Uploading photo...', 'info');
        
        // Upload to Cloudinary
        const result = await uploadToCloudinary(file);
        
        if (!result.success) throw new Error('Upload failed');
        
        // Save to Supabase
        const { error } = await supabaseClient
            .from('user_profiles')
            .update({ 
                avatar_url: result.url,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
        
        if (error) throw error;
        
        profile.avatar_url = result.url;
        
        // Update avatar in DOM
        updateAvatarInDOM(result.url);
        
        showToast('Photo updated!', 'success');
        
    } catch (error) {
        console.error('Photo upload error:', error);
        showToast(error.message || 'Failed to upload photo', 'error');
    } finally {
        isUploading = false;
        if (btn) btn.classList.remove('uploading');
        if (icon) {
            icon.className = 'fas fa-camera';
        }
        event.target.value = '';
    }
}

// ============================================================
// UPLOAD TO CLOUDINARY
// ============================================================
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
                        resolve({ 
                            success: true, 
                            url: response.secure_url,
                            publicId: response.public_id
                        });
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

// ============================================================
// UPDATE AVATAR IN DOM
// ============================================================
function updateAvatarInDOM(url) {
    const wrap = document.querySelector('.profile-avatar-wrap');
    if (!wrap) return;
    
    // Remove old avatar
    const oldImg = wrap.querySelector('.profile-avatar-img');
    const oldLetter = wrap.querySelector('.profile-avatar-letter');
    if (oldImg) oldImg.remove();
    if (oldLetter) oldLetter.remove();
    
    // Create new image
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Profile';
    img.className = 'profile-avatar-img';
    img.id = 'profileAvatarImg';
    img.onerror = () => {
        img.outerHTML = `<div class="profile-avatar-letter">${(profile.full_name || user.email).charAt(0).toUpperCase()}</div>`;
    };
    
    // Insert before google badge
    const badge = wrap.querySelector('.profile-google-badge');
    if (badge) {
        wrap.insertBefore(img, badge);
    } else {
        wrap.insertBefore(img, wrap.firstChild);
    }
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

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    container.appendChild(toast);
    
    const timeout = setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timeout);
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    });
}

console.log('✅ Profile script loaded (Google + Photo Upload)');