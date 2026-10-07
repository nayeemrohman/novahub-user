// ============================================================
// NOVAHUB — Meta Conversions API
// Vercel Serverless Function
// Endpoint: https://YOUR-DOMAIN/api/meta-capi
// ============================================================

const PIXEL_ID = '1072007485675742';
const ACCESS_TOKEN = 'EAAP8WCYcuFYBSuG4tadvNPhVSXfMXuKtnlyxU4csuD1M7Ex534ZBUN5YCVmI4GNAjfixcuXbaUqmYA7avEJfF6UzhXRUBnjZCzFZBEhu6R7E2FZAqmpU9ZA19dQKAIdsPNpI9sE6kOeSS6N4W6K8g1T1fVEi6uLnhnBPJLmJ9dFGNohIZCS3a1fQuM94ZAwUgTxYQZDZD';
const API_VERSION = 'v18.0';
const TEST_EVENT_CODE = '';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
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
    
    const metaCustomData = {};
    if (custom_data.currency) metaCustomData.currency = custom_data.currency;
    if (custom_data.value !== undefined) metaCustomData.value = parseFloat(custom_data.value) || 0;
    if (custom_data.order_id) metaCustomData.order_id = custom_data.order_id;
    if (Array.isArray(custom_data.content_ids)) metaCustomData.content_ids = custom_data.content_ids;
    if (custom_data.content_type) metaCustomData.content_type = custom_data.content_type;
    if (custom_data.content_name) metaCustomData.content_name = custom_data.content_name;
    if (custom_data.num_items) metaCustomData.num_items = parseInt(custom_data.num_items) || 0;
    if (Array.isArray(custom_data.contents)) metaCustomData.contents = custom_data.contents;
    
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