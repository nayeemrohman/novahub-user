// ============================================================
// NOVAHUB — Auth Page Script (v4)
// Google-Only Login with robust OAuth callback handling
// ============================================================

function goBackFromAuth() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'index.html';
}
window.goBackFromAuth = goBackFromAuth;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Auth page initializing...');
    
    // Handle OAuth callback first
    const handled = await handleOAuthCallback();
    if (handled) return;
    
    // If already logged in → redirect
    const user = await getCurrentUser();
    if (user) {
        console.log('✅ Already logged in, redirecting...');
        setTimeout(() => window.location.href = 'index.html', 500);
        return;
    }
    
    console.log('✅ Auth page ready');
});

// ============================================================
// OAUTH CALLBACK HANDLER
// ============================================================
async function handleOAuthCallback() {
    try {
        const params = new URLSearchParams(window.location.search);
        const hasCode = params.has('code');
        const hasAccessToken = window.location.hash.includes('access_token');
        const hasError = params.has('error');
        
        if (hasError) {
            const errDesc = params.get('error_description') || params.get('error');
            console.error('OAuth error:', errDesc);
            showToast('Login failed: ' + errDesc, 'error');
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            return false;
        }
        
        if (hasCode || hasAccessToken) {
            console.log('🔄 OAuth callback detected...');
            
            // Wait for Supabase to establish session
            for (let i = 0; i < 10; i++) {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session?.user) {
                    console.log('✅ Session established:', session.user.email);
                    
                    // Clean URL (remove code/hash)
                    window.history.replaceState({}, '', window.location.pathname);
                    
                    // Check profile completion
                    const profile = await getUserProfile(session.user.id);
                    
                    if (!profile || !profile.phone || !profile.division || !profile.village) {
                        window.location.href = 'profile-complete.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                    return true;
                }
                await new Promise(r => setTimeout(r, 400));
            }
            
            console.warn('⚠️ No session after OAuth callback');
            showToast('Login incomplete. Please try again.', 'error');
            window.history.replaceState({}, '', window.location.pathname);
            return false;
        }
        
        return false;
    } catch (error) {
        console.error('OAuth callback error:', error);
        return false;
    }
}

// ============================================================
// GOOGLE SIGN IN
// ============================================================
async function handleGoogleSignIn() {
    console.log('🔐 Starting Google sign in...');
    
    const btn = document.getElementById('googleSignInBtn');
    const btnText = document.getElementById('googleBtnText');
    const btnSpinner = document.getElementById('googleBtnSpinner');
    
    if (btn.disabled) return;
    
    btn.disabled = true;
    if (btnText) btnText.textContent = 'Connecting...';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    
    try {
        const redirectUrl = window.location.origin + window.location.pathname;
        console.log('📍 Redirect URL:', redirectUrl);
        
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        if (error) throw error;
        console.log('✅ Redirecting to Google...');
        
    } catch (error) {
        console.error('❌ Google sign in error:', error);
        showToast('Login failed: ' + (error.message || 'Unknown error'), 'error');
        
        btn.disabled = false;
        if (btnText) btnText.textContent = 'Continue with Google';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}
window.handleGoogleSignIn = handleGoogleSignIn;

console.log('✅ Auth page script loaded (v4)');