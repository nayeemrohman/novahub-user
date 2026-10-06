// ============================================================
// NOVAHUB — Profile Complete Page (v4)
// ============================================================

let currentUserData = null;
let currentProfile = null;
const MAX_INIT_RETRIES = 10;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Profile Complete page initializing...');
    
    await loadSettings();
    await waitForSession();
    
    if (!currentUserData) {
        showToast('Session expired. Please sign in again.', 'warning');
        setTimeout(() => window.location.href = 'auth.html', 1500);
        return;
    }
    
    console.log('✅ Session found:', currentUserData.email);
    
    await loadOrCreateProfile();
    
    if (isProfileComplete()) {
        console.log('✅ Profile already complete, redirecting');
        window.location.href = 'index.html';
        return;
    }
    
    renderUserInfo();
    setupLocationDropdowns();
    setupPhoneValidation();
    setupFormInputs();
    
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
});

// ============================================================
// WAIT FOR SESSION
// ============================================================
async function waitForSession() {
    for (let i = 0; i < MAX_INIT_RETRIES; i++) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session?.user) {
                currentUserData = session.user;
                return;
            }
            
            if (i === 0) {
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    currentUserData = user;
                    return;
                }
            }
            
            await new Promise(r => setTimeout(r, 500));
        } catch (err) {
            await new Promise(r => setTimeout(r, 500));
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
            .from('settings').select('*').eq('id', 1).single();
        
        if (data) {
            window.settings = {
                shopName: data.shop_name || 'Novahub',
                currency: data.currency || '৳'
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
            .from('user_profiles').select('*')
            .eq('id', currentUserData.id).single();
        
        if (error && error.code === 'PGRST116') {
            const googleData = currentUserData.user_metadata || {};
            
            const newProfile = {
                id: currentUserData.id,
                full_name: googleData.full_name || googleData.name || null,
                email: currentUserData.email,
                avatar_url: googleData.avatar_url || googleData.picture || null,
                role: 'user',
                provider: 'google'
            };
            
            const { data: createdProfile } = await supabaseClient
                .from('user_profiles').insert([newProfile]).select().single();
            
            currentProfile = createdProfile || newProfile;
        } else if (data) {
            currentProfile = data;
            
            const googleData = currentUserData.user_metadata || {};
            if (!currentProfile.avatar_url && (googleData.avatar_url || googleData.picture)) {
                const avatar = googleData.avatar_url || googleData.picture;
                await supabaseClient
                    .from('user_profiles').update({ avatar_url: avatar })
                    .eq('id', currentUserData.id);
                currentProfile.avatar_url = avatar;
            }
            
            if (!currentProfile.full_name && (googleData.full_name || googleData.name)) {
                const name = googleData.full_name || googleData.name;
                await supabaseClient
                    .from('user_profiles').update({ full_name: name })
                    .eq('id', currentUserData.id);
                currentProfile.full_name = name;
            }
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
    
    const name = currentProfile?.full_name 
        || googleData.full_name 
        || googleData.name 
        || currentUserData.email.split('@')[0];
    
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    
    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = currentUserData.email;
    
    const photo = currentProfile?.avatar_url 
        || googleData.avatar_url 
        || googleData.picture 
        || 'assets/images/logo.jpg';
    
    const photoEl = document.getElementById('userPhoto');
    if (photoEl) {
        photoEl.src = photo;
        photoEl.onerror = () => { photoEl.src = 'assets/images/logo.jpg'; };
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
        divisions.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    
    divSelect.addEventListener('change', () => {
        const div = divSelect.value;
        
        distSelect.innerHTML = '<option value="">Select District</option>';
        upSelect.innerHTML = '<option value="">Select Upazila</option>';
        clearFieldError('pcDivision');
        
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
    
    distSelect.addEventListener('change', () => {
        const div = divSelect.value;
        const dist = distSelect.value;
        
        upSelect.innerHTML = '<option value="">Select Upazila</option>';
        clearFieldError('pcDistrict');
        
        if (!dist) {
            upSelect.disabled = true;
            return;
        }
        
        const upazilas = LOCATION_DATA.bangladesh.levels[div]?.[dist] || [];
        upSelect.innerHTML = '<option value="">Select Upazila</option>' +
            upazilas.map(u => `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`).join('');
        upSelect.disabled = false;
    });
    
    upSelect.addEventListener('change', () => {
        if (upSelect.value) clearFieldError('pcUpazila');
    });
}

// ============================================================
// PHONE VALIDATION
// ============================================================
function setupPhoneValidation() {
    const phoneInput = document.getElementById('pcPhone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        if (e.target.value.length === 11) clearFieldError('pcPhone');
    });
}

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
// ERROR HELPERS
// ============================================================
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.remove('error');
    
    const errEl = document.getElementById(fieldId + 'Error');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.add('error');
    
    const errEl = document.getElementById(fieldId + 'Error');
    if (errEl) { errEl.textContent = message; errEl.classList.add('show'); }
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
    
    if (!division) { showFieldError('pcDivision', 'Please select division'); valid = false; }
    if (!district) { showFieldError('pcDistrict', 'Please select district'); valid = false; }
    if (!upazila) { showFieldError('pcUpazila', 'Please select upazila'); valid = false; }
    if (!village) { showFieldError('pcVillage', 'Village/Area required'); valid = false; }
    
    if (!valid) {
        const firstError = document.querySelector('.pc-error.show');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            .from('user_profiles').update(updates)
            .eq('id', currentUserData.id);
        
        if (error) throw error;
        
        showToast('Profile completed successfully!', 'success');
        setTimeout(() => window.location.href = 'index.html', 1200);
        
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
// SKIP
// ============================================================
function skipProfileComplete() {
    window.location.href = 'index.html';
}
window.skipProfileComplete = skipProfileComplete;

console.log('✅ Profile Complete script loaded (v4)');