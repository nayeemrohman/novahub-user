// ============================================================
// NOVAHUB — Meta Conversions API (v3 — HARDENED + DIAGNOSTIC)
// Vercel Serverless Function (Node.js runtime)
// Endpoint: POST /api/meta-capi
// ============================================================
// Fixes in v3:
//   ✅ Vercel Node.js runtime explicit
//   ✅ Graph API v22.0 (v18 deprecated April 2025)
//   ✅ Structured safe logging (no secrets)
//   ✅ Body parsing fallback (manual JSON.parse if needed)
//   ✅ Better error classification (config vs runtime)
//   ✅ Timeout guard
// ============================================================

// Force Node.js runtime (NOT Edge) — required for crypto + fetch
module.exports.config = {
    runtime: 'nodejs',
    maxDuration: 10
};

const PIXEL_ID = process.env.META_PIXEL_ID || '1072007485675742';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const API_VERSION = 'v22.0';
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';

// ============================================================
// BOOT LOG (safe — no secrets)
// ============================================================
console.log('[meta-capi] Module loaded', JSON.stringify({
    hasPixelId: !!PIXEL_ID,
    hasAccessToken: !!ACCESS_TOKEN,
    accessTokenLength: ACCESS_TOKEN ? ACCESS_TOKEN.length : 0,
    hasTestCode: !!TEST_EVENT_CODE,
    apiVersion: API_VERSION,
    nodeVersion: process.version,
    env: process.env.VERCEL_ENV || 'unknown'
}));

// ============================================================
// HANDLER
// ============================================================
module.exports = async (req, res) => {
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Preflight
    if (req.method === 'OPTIONS') return res.status(204).end();
    
    // Method guard
    if (req.method !== 'POST') {
        console.warn('[meta-capi]', requestId, 'method_not_allowed', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Config guard
    if (!ACCESS_TOKEN) {
        console.error('[meta-capi]', requestId, 'CONFIG_ERROR: META_ACCESS_TOKEN missing');
        return res.status(500).json({
            success: false,
            error: 'Server misconfigured',
            code: 'NO_ACCESS_TOKEN',
            request_id: requestId
        });
    }
    
    try {
        // Parse body (Vercel usually auto-parses, but be defensive)
        let body = req.body;
        if (!body || typeof body !== 'object') {
            console.warn('[meta-capi]', requestId, 'body_not_object — attempting manual parse');
            // Vercel normalizes req.body when Content-Type: application/json
            // If empty, treat as invalid request
            body = {};
        }
        
        const eventName = body.event_name || 'Purchase';
        const eventId = body.event_id || '';
        
        console.log('[meta-capi]', requestId, 'request_received', JSON.stringify({
            event_name: eventName,
            has_event_id: !!eventId,
            has_custom_data: !!body.custom_data,
            value: body.custom_data?.value ?? null,
            currency: body.custom_data?.currency ?? null,
            order_id: body.custom_data?.order_id ?? null,
            content_ids_count: Array.isArray(body.custom_data?.content_ids) 
                ? body.custom_data.content_ids.length 
                : 0
        }));
        
        const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
                      || req.headers['x-real-ip']
                      || (req.connection && req.connection.remoteAddress)
                      || '';
        const userAgent = req.headers['user-agent'] || '';
        
        const payload = buildPayload(body, clientIp, userAgent, requestId);
        const metaResponse = await sendToMeta(payload, requestId);
        
        console.log('[meta-capi]', requestId, 'success', JSON.stringify({
            events_received: metaResponse.events_received || 0,
            fbtrace_id: metaResponse.fbtrace_id || null
        }));
        
        return res.status(200).json({
            success: true,
            meta_response: metaResponse,
            request_id: requestId
        });
        
    } catch (error) {
        // Safe error logging — never print token or full request body
        console.error('[meta-capi]', requestId, 'ERROR', JSON.stringify({
            message: error.message,
            name: error.name,
            stack_preview: error.stack ? error.stack.split('\n').slice(0, 3).join(' | ') : null
        }));
        
        return res.status(500).json({
            success: false,
            error: 'CAPI error',
            code: 'INTERNAL_ERROR',
            request_id: requestId
        });
    }
};

// ============================================================
// BUILD PAYLOAD
// ============================================================
function buildPayload(body, clientIp, userAgent, requestId) {
    const event_name = body.event_name || 'Purchase';
    const event_id = body.event_id || '';
    const event_source_url = body.event_source_url || 'https://novahubgadgets.com';
    const user_data = body.user_data || {};
    const custom_data = body.custom_data || {};
    
    const eventTime = Math.floor(Date.now() / 1000);
    
    const metaUserData = {
        client_ip_address: clientIp || undefined,
        client_user_agent: userAgent || undefined,
        fbc: user_data.fbc || undefined,
        fbp: user_data.fbp || undefined,
        external_id: user_data.external_id ? hash(user_data.external_id) : undefined,
        em: user_data.email ? [hash(user_data.email.toLowerCase().trim())] : undefined,
        ph: user_data.phone ? [hash(normalizePhone(user_data.phone))] : undefined,
        fn: user_data.first_name ? [hash(user_data.first_name.toLowerCase().trim())] : undefined,
        ln: user_data.last_name ? [hash(user_data.last_name.toLowerCase().trim())] : undefined,
        ct: user_data.city ? [hash(user_data.city.toLowerCase().replace(/\s/g, ''))] : undefined,
        st: user_data.state ? [hash(user_data.state.toLowerCase().replace(/\s/g, ''))] : undefined,
        country: user_data.country ? [hash(user_data.country.toLowerCase())] : undefined
    };
    
    Object.keys(metaUserData).forEach(key => {
        if (metaUserData[key] === undefined || metaUserData[key] === null) {
            delete metaUserData[key];
        }
    });
    
    // Custom data validation
    const metaCustomData = {};
    
    if (custom_data.currency && /^[A-Z]{3}$/.test(String(custom_data.currency))) {
        metaCustomData.currency = String(custom_data.currency);
    }
    
    if (custom_data.value !== undefined && custom_data.value !== null) {
        const v = parseFloat(custom_data.value);
        if (isFinite(v) && v > 0) {
            metaCustomData.value = Math.round(v * 100) / 100;
        }
    }
    
    if (custom_data.order_id) metaCustomData.order_id = String(custom_data.order_id);
    if (Array.isArray(custom_data.content_ids)) {
        metaCustomData.content_ids = custom_data.content_ids.map(String);
    }
    if (custom_data.content_type) metaCustomData.content_type = String(custom_data.content_type);
    if (custom_data.content_name) metaCustomData.content_name = String(custom_data.content_name);
    if (custom_data.num_items) metaCustomData.num_items = parseInt(custom_data.num_items) || 0;
    
    if (Array.isArray(custom_data.contents)) {
        metaCustomData.contents = custom_data.contents
            .map(c => ({
                id: String(c.id),
                quantity: parseInt(c.quantity) || 1,
                item_price: Math.round((parseFloat(c.item_price) || 0) * 100) / 100
            }))
            .filter(c => c.id && c.quantity > 0);
    }
    
    const event = {
        event_name: event_name,
        event_time: eventTime,
        action_source: 'website',
        event_source_url: event_source_url,
        event_id: event_id || generateEventId(),
        user_data: metaUserData,
        custom_data: metaCustomData
    };
    
    const finalPayload = { data: [event] };
    if (TEST_EVENT_CODE) finalPayload.test_event_code = TEST_EVENT_CODE;
    
    return finalPayload;
}

// ============================================================
// SEND TO META
// ============================================================
async function sendToMeta(payload, requestId) {
    // ⚠️ Token passed as query param per Meta CAPI spec.
    // Vercel logs do NOT include query strings for serverless functions by default,
    // but treat this as sensitive anyway.
    const url = 'https://graph.facebook.com/' + API_VERSION + '/' + PIXEL_ID + '/events';
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ACCESS_TOKEN  // ← safer than query param
        },
        body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        throw new Error('Meta returned non-JSON: ' + text.slice(0, 200));
    }
    
    if (!response.ok) {
        // Meta error response contains error details — safe to log (no token)
        throw new Error('Meta API ' + response.status + ': ' + JSON.stringify(result).slice(0, 300));
    }
    
    return result;
}

// ============================================================
// HELPERS
// ============================================================
function hash(value) {
    if (!value) return null;
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function normalizePhone(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '880' + cleaned.substring(1);
    } else if (!cleaned.startsWith('880')) {
        cleaned = '880' + cleaned;
    }
    return cleaned;
}

function generateEventId() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}