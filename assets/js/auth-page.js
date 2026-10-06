// ============================================================
// NOVAHUB — Auth Page Script (Google-Only Login)
// Domain: novahubgadgets.com
// ============================================================

// ============================================================
// GO BACK
// ============================================================
function goBackFromAuth() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}
window.goBackFromAuth = goBackFromAuth;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Auth page initializing...');
    
    // If already logged in → redirect
    const user = await getCurrentUser();
    if (user) {
        console.log('✅ Already logged in, redirecting...');
        setTimeout(() => window.location.href = 'index.html', 500);
        return;
    }
    
    // Handle OAuth callback (if URL has code)
    await handleOAuthCallback();
    
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
        
        if (hasCode || hasAccessToken) {
            console.log('🔄 OAuth callback detected...');
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (session?.user) {
                console.log('✅ OAuth session established:', session.user.email);
                
                const profile = await getUserProfile(session.user.id);
                
                if (!profile || !profile.phone || !profile.division || !profile.village) {
                    window.location.href = 'profile-complete.html';
                } else {
                    window.location.href = 'index.html';
                }
                return;
            }
        }
    } catch (error) {
        console.error('OAuth callback error:', error);
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

console.log('✅ Auth page script loaded (Google-Only)');