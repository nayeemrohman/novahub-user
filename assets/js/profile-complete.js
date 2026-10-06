// ============================================================
// NOVAHUB — Profile Complete Page Script (v2 — Fixed)
// ============================================================

let currentUserData = null;
let currentProfile = null;
let initRetries = 0;
const MAX_INIT_RETRIES = 10;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Profile Complete page initializing...');
    
    await loadSettings();
    
    // Wait for session (Google OAuth needs time)
    await waitForSession();
    
    if (!currentUserData) {
        console.log('❌ No session after retries, redirecting to auth');
        showToast('Session expired. Please sign in again.', 'warning');
        setTimeout(() => window.location.href = 'auth.html', 1500);
        return;
    }
    
    console.log('✅ Session found:', currentUserData.email);
    
    // Load or create profile
    await loadOrCreateProfile();
    
    // Check if profile already complete
    if (isProfileComplete()) {
        console.log('✅ Profile already complete, redirecting home');
        window.location.href = 'index.html';
        return;
    }
    
    // Render user info
    renderUserInfo();
    
    // Setup form
    setupLocationDropdowns();
    setupPhoneValidation();
    setupFormInputs();
    
    // Show main content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    console.log('✅ Profile Complete page ready');
});

// ============================================================
// WAIT FOR SESSION (with retries)
// ============================================================
async function waitForSession() {
    for (let i = 0; i < MAX_INIT_RETRIES; i++) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session?.user) {
                currentUserData = session.user;
                console.log(`✅ Session found on attempt ${i + 1}`);
                return;
            }
            
            // Wait for onAuthStateChange as well
            if (i === 0) {
                // Try to get user directly
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    currentUserData = user;
                    console.log('✅ User found via getUser()');
                    return;
                }
            }
            
            console.log(`⏳ Waiting for session... attempt ${i + 1}`);
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
            console.error('Session check error:', err);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    currentUserData = null;
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
                whatsappNumber: data.whatsapp_number || '01947939982',
                insideDhakaCharge: data.inside_dhaka_charge || 60,
                outsideDhakaCharge: data.outside_dhaka_charge || 120
            };
        }
    } catch (error) {
        console.error('Settings error:', error);
    }
}

// ============================================================
// LOAD OR CREATE PROFILE
// ============================================================
async function loadOrCreateProfile() {
    try {
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('id', currentUserData.id)
            .single();
        
        if (error && error.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('📝 Creating new profile...');
            
            const googleData = currentUserData.user_metadata || {};
            
            const newProfile = {
                id: currentUserData.id,
                full_name: googleData.full_name || googleData.name || null,
                email: currentUserData.email,
                avatar_url: googleData.avatar_url || googleData.picture || null,
                role: 'user',
                provider: 'google'
            };
            
            const { data: createdProfile, error: createError } = await supabaseClient
                .from('user_profiles')
                .insert([newProfile])
                .select()
                .single();
            
            if (createError) {
                console.error('Profile create error:', createError);
                currentProfile = newProfile;
            } else {
                currentProfile = createdProfile;
                console.log('✅ Profile created');
            }
        } else if (data) {
            currentProfile = data;
            console.log('✅ Profile loaded');
            
            // Update avatar if missing
            const googleData = currentUserData.user_metadata || {};
            if (!currentProfile.avatar_url && (googleData.avatar_url || googleData.picture)) {
                const avatar = googleData.avatar_url || googleData.picture;
                await supabaseClient
                    .from('user_profiles')
                    .update({ avatar_url: avatar })
                    .eq('id', currentUserData.id);
                currentProfile.avatar_url = avatar;
            }
            
            // Update name if missing
            if (!currentProfile.full_name && (googleData.full_name || googleData.name)) {
                const name = googleData.full_name || googleData.name;
                await supabaseClient
                    .from('user_profiles')
                    .update({ full_name: name })
                    .eq('id', currentUserData.id);
                currentProfile.full_name = name;
            }
        } else {
            console.error('Unexpected profile state');
            currentProfile = null;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        currentProfile = null;
    }
}

// ============================================================
// CHECK IF PROFILE COMPLETE
// ============================================================
function isProfileComplete() {
    if (!currentProfile) return false;
    return !!(currentProfile.phone && currentProfile.division && currentProfile.village);
}

// ============================================================
// RENDER USER INFO
// ============================================================
function renderUserInfo() {
    if (!currentUserData) return;
    
    const googleData = currentUserData.user_metadata || {};
    
    // Name
    const name = currentProfile?.full_name 
        || googleData.full_name 
        || googleData.name 
        || currentUserData.email.split('@')[0];
    
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = currentUserData.email;
    
    // Photo
    const photo = currentProfile?.avatar_url 
        || googleData.avatar_url 
        || googleData.picture 
        || 'assets/images/logo.jpg';
    
    const photoEl = document.getElementById('userPhoto');
    if (photoEl) {
        photoEl.src = photo;
        photoEl.onerror = () => {
            photoEl.src = 'assets/images/logo.jpg';
        };
    }
}

// ============================================================
// SETUP LOCATION DROPDOWNS
// ============================================================
function setupLocationDropdowns() {
    const divSelect = document.getElementById('pcDivision');
    const distSelect = document.getElementById('pcDistrict');
    const upSelect = document.getElementById('pcUpazila');
    
    if (!divSelect || !distSelect || !upSelect) return;
    
    const divisions = Object.keys(LOCATION_DATA.bangladesh.levels);
    divSelect.innerHTML = '<option value="">Select Division</option>' +
        divisions.map(d => `<option value="${d}">${d}</option>`).join('');
    
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
        
        clearFieldError('pcDivision');
    });
    
    distSelect.addEventListener('change', () => {
        const div = divSelect.value;
        const dist = distSelect.value;
        
        upSelect.innerHTML = '<option value="">Select Upazila</option>';
        
        if (!dist) {
            upSelect.disabled = true;
            return;
        }
        
        const upazilas = LOCATION_DATA.bangladesh.levels[div]?.[dist] || [];
        upSelect.innerHTML = '<option value="">Select Upazila</option>' +
            upazilas.map(u => `<option value="${u}">${u}</option>`).join('');
        
        upSelect.disabled = false;
        clearFieldError('pcDistrict');
    });
    
    upSelect.addEventListener('change', () => {
        if (upSelect.value) clearFieldError('pcUpazila');
    });
}

// ============================================================
// SETUP PHONE VALIDATION
// ============================================================
function setupPhoneValidation() {
    const phoneInput = document.getElementById('pcPhone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        if (e.target.value.length === 11) clearFieldError('pcPhone');
    });
}

// ============================================================
// SETUP FORM INPUTS
// ============================================================
function setupFormInputs() {
    ['pcVillage'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                if (el.value.trim()) clearFieldError(id);
            });
        }
    });
}

// ============================================================
// CLEAR FIELD ERROR
// ============================================================
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.remove('error');
    
    const errEl = document.getElementById(fieldId + 'Error');
    if (errEl) {
        errEl.textContent = '';
        errEl.classList.remove('show');
    }
}

// ============================================================
// SHOW FIELD ERROR
// ============================================================
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.add('error');
    
    const errEl = document.getElementById(fieldId + 'Error');
    if (errEl) {
        errEl.textContent = message;
        errEl.classList.add('show');
    }
}

// ============================================================
// SUBMIT PROFILE
// ============================================================
async function submitProfile() {
    if (!currentUserData) {
        showToast('Session expired. Please login again.', 'error');
        setTimeout(() => window.location.href = 'auth.html', 1500);
        return;
    }
    
    const btn = document.getElementById('pcSubmitBtn');
    const btnText = btn.querySelector('span');
    const btnSpinner = document.getElementById('pcSubmitSpinner');
    
    const phone = document.getElementById('pcPhone').value.trim();
    const division = document.getElementById('pcDivision').value;
    const district = document.getElementById('pcDistrict').value;
    const upazila = document.getElementById('pcUpazila').value;
    const village = document.getElementById('pcVillage').value.trim();
    const fullAddress = document.getElementById('pcFullAddress').value.trim();
    
    let valid = true;
    
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phone) {
        showFieldError('pcPhone', 'Phone number required');
        valid = false;
    } else if (!phoneRegex.test(phone)) {
        showFieldError('pcPhone', 'Enter valid phone (01XXXXXXXXX)');
        valid = false;
    }
    
    if (!division) {
        showFieldError('pcDivision', 'Please select division');
        valid = false;
    }
    
    if (!district) {
        showFieldError('pcDistrict', 'Please select district');
        valid = false;
    }
    
    if (!upazila) {
        showFieldError('pcUpazila', 'Please select upazila');
        valid = false;
    }
    
    if (!village) {
        showFieldError('pcVillage', 'Village/Area required');
        valid = false;
    }
    
    if (!valid) {
        const firstError = document.querySelector('.pc-error.show');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    
    try {
        const updates = {
            phone: phone,
            division: division,
            district: district,
            upazila: upazila,
            village: village,
            full_address: fullAddress || null,
            profile_completed: true,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabaseClient
            .from('user_profiles')
            .update(updates)
            .eq('id', currentUserData.id);
        
        if (error) throw error;
        
        console.log('✅ Profile saved');
        showToast('Profile completed successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);
        
    } catch (error) {
        console.error('❌ Save error:', error);
        showToast('Failed to save profile. Please try again.', 'error');
        
        btn.disabled = false;
        if (btnText) btnText.style.display = 'inline-flex';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

window.submitProfile = submitProfile;

// ============================================================
// SKIP PROFILE COMPLETE
// ============================================================
function skipProfileComplete() {
    console.log('⏭️ Skipping profile completion');
    window.location.href = 'index.html';
}

window.skipProfileComplete = skipProfileComplete;

// ============================================================
// TOAST
// ============================================================
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

function escapeHtml(str) {
    if (!str) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(str).replace(/[&<>"']/g, m => map[m]);
}

console.log('✅ Profile Complete script loaded (v2 — Fixed)');
