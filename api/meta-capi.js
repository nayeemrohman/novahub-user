// ============================================================
// NOVAHUB — Meta Conversions API (v2 — HARDENED)
// Vercel Serverless Function
// Endpoint: https://novahubgadgets.com/api/meta-capi
// ============================================================
// Fixes in v2:
//   ✅ Strict value validation (must be positive finite number)
//   ✅ Currency must be valid ISO 4217, 3 uppercase letters
//   ✅ contents sum sanity check (log warning only)
//   ✅ Event dedup awareness (event_id passed through unchanged)
//   ✅ Never exposes ACCESS_TOKEN in response or logs
// ============================================================
// Required env vars (set in Vercel Dashboard):
//   META_PIXEL_ID         — Meta Dataset / Pixel ID
//   META_ACCESS_TOKEN     — Meta Conversions API Access Token
//   META_TEST_EVENT_CODE  — Optional. Only for Events Manager Test Events.
// ============================================================

const PIXEL_ID = process.env.META_PIXEL_ID || '1072007485675742';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const API_VERSION = 'v18.0';
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';

if (!ACCESS_TOKEN) {
    console.error('❌ META_ACCESS_TOKEN is not set. CAPI calls will fail.');
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    if (!ACCESS_TOKEN) {
        return res.status(500).json({
            success: false,
            error: 'Server misconfigured: META_ACCESS_TOKEN missing'
        });
    }

    try {
        const body = req.body || {};

        const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
                      || req.headers['x-real-ip']
                      || (req.connection && req.connection.remoteAddress)
                      || '';
        const userAgent = req.headers['user-agent'] || '';

        const payload = await buildPayload(body, clientIp, userAgent);
        const metaResponse = await sendToMeta(payload);

        console.log('Meta CAPI Response:', JSON.stringify(metaResponse));

        return res.status(200).json({ success: true, meta_response: metaResponse });
    } catch (error) {
        console.error('CAPI Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

async function buildPayload(body, clientIp, userAgent) {
    const event_name = body.event_name || 'Purchase';
    const event_id = body.event_id;
    const event_source_url = body.event_source_url;
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

    // ============================================================
    // ✅ FIXED: Strict custom_data validation
    // ============================================================
    const metaCustomData = {};

    // Currency — must be valid ISO 4217, 3 uppercase letters
    if (custom_data.currency && /^[A-Z]{3}$/.test(String(custom_data.currency))) {
        metaCustomData.currency = String(custom_data.currency);
    } else if (custom_data.currency) {
        console.warn('⚠️ Invalid currency:', custom_data.currency, '— dropping');
    }

    // Value — must be positive finite number
    if (custom_data.value !== undefined && custom_data.value !== null) {
        const v = parseFloat(custom_data.value);
        if (isFinite(v) && v > 0) {
            metaCustomData.value = Math.round(v * 100) / 100;
        } else {
            console.warn('⚠️ Invalid value:', custom_data.value, '— dropping');
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

    // ============================================================
    // Sanity check — sum of contents should ≈ value
    // ============================================================
    if (metaCustomData.contents && metaCustomData.value) {
        const contentsSum = metaCustomData.contents.reduce(
            (s, c) => s + c.item_price * c.quantity, 0
        );
        const diff = Math.abs(contentsSum - metaCustomData.value);
        if (diff > 1.0) {
            console.warn(
                '⚠️ contents sum mismatch: contents=' + contentsSum.toFixed(2),
                'value=' + metaCustomData.value.toFixed(2),
                'diff=' + diff.toFixed(2),
                'order=' + (metaCustomData.order_id || '?')
            );
        }
    }

    const event = {
        event_name: event_name,
        event_time: eventTime,
        action_source: 'website',
        event_source_url: event_source_url || 'https://novahubgadgets.com',
        event_id: event_id || generateEventId(),
        user_data: metaUserData,
        custom_data: metaCustomData
    };

    const finalPayload = { data: [event] };
    if (TEST_EVENT_CODE) finalPayload.test_event_code = TEST_EVENT_CODE;

    return finalPayload;
}

async function sendToMeta(payload) {
    const url = 'https://graph.facebook.com/' + API_VERSION + '/' + PIXEL_ID + '/events?access_token=' + ACCESS_TOKEN;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error('Meta API error: ' + JSON.stringify(result));
    }

    return result;
}

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