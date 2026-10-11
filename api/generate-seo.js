// ============================================================
// NOVAHUB — AI SEO Generation Endpoint
// Vercel Serverless Function
// Endpoint: POST /api/generate-seo
// ============================================================
// SECURITY:
//   - API key read from process.env.AI_API_KEY (never exposed)
//   - Admin-only: verifies Supabase JWT + user_profiles.role = 'admin'
//   - Rate limited: 10 requests per 10 minutes per user
//   - Product loaded from DB (client cannot inject fake data)
// ============================================================
//
// Required env vars:
//   AI_API_KEY         — Provider API key
//   AI_PROVIDER        — 'openai' | 'anthropic' | 'gemini'  (default: openai)
//   AI_MODEL           — Model name (e.g. gpt-4o-mini)
//   SUPABASE_URL       — Supabase project URL
//   SUPABASE_ANON_KEY  — Supabase anon key
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oxnfiueqmvggtjtciqbn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jYBypv_FEbLfWYDqFEeEkw_IA2WmZMk';

const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const AI_API_KEY = process.env.AI_API_KEY || '';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map();

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    
    if (!AI_API_KEY) {
        console.error('❌ AI_API_KEY not set');
        return res.status(500).json({
            success: false,
            error: 'Server misconfigured: AI_API_KEY missing'
        });
    }
    
    try {
        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
        
        if (!token) {
            return res.status(401).json({ success: false, error: 'Missing auth token' });
        }
        
        const user = await verifySupabaseUser(token);
        if (!user || !user.id) {
            return res.status(401).json({ success: false, error: 'Invalid session' });
        }
        
        const isAdmin = await checkAdminRole(token, user.id);
        if (!isAdmin) {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        
        if (!checkRateLimit(user.id)) {
            return res.status(429).json({ success: false, error: 'Rate limit exceeded. Try again later.' });
        }
        
        const body = req.body || {};
        const productId = String(body.productId || '').trim();
        
        if (!productId) {
            return res.status(400).json({ success: false, error: 'productId required' });
        }
        
        const product = await fetchProduct(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        
        const { systemPrompt, userPrompt } = buildPrompt(product, body.additionalInfo);
        const aiResponse = await callAI(systemPrompt, userPrompt);
        const validated = validateAIResponse(aiResponse);
        
        if (!validated.success) {
            return res.status(502).json({
                success: false,
                error: 'AI response invalid',
                detail: validated.error
            });
        }
        
        return res.status(200).json({
            success: true,
            provider: AI_PROVIDER,
            model: AI_MODEL,
            generated: validated.data
        });
        
    } catch (error) {
        console.error('generate-seo error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'AI generation failed'
        });
    }
};

async function verifySupabaseUser(token) {
    try {
        const url = SUPABASE_URL + '/auth/v1/user';
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + token
            }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data && data.id ? data : null;
    } catch (err) {
        console.error('verifySupabaseUser error:', err.message);
        return null;
    }
}

async function checkAdminRole(token, userId) {
    try {
        const url = SUPABASE_URL + '/rest/v1/user_profiles?id=eq.' + encodeURIComponent(userId) + '&select=role';
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) return false;
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return false;
        return data[0].role === 'admin';
    } catch (err) {
        console.error('checkAdminRole error:', err.message);
        return false;
    }
}

function checkRateLimit(userId) {
    const now = Date.now();
    const timestamps = (rateLimitMap.get(userId) || [])
        .filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    
    if (timestamps.length >= RATE_LIMIT_MAX) {
        return false;
    }
    
    timestamps.push(now);
    rateLimitMap.set(userId, timestamps);
    
    if (rateLimitMap.size > 1000) {
        for (const [k, v] of rateLimitMap.entries()) {
            const filtered = v.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
            if (filtered.length === 0) rateLimitMap.delete(k);
            else rateLimitMap.set(k, filtered);
        }
    }
    
    return true;
}

async function fetchProduct(productId) {
    try {
        const url = SUPABASE_URL + '/rest/v1/products?id=eq.' + encodeURIComponent(productId) + '&select=*';
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) return null;
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        return data[0];
    } catch (err) {
        console.error('fetchProduct error:', err.message);
        return null;
    }
}

function buildPrompt(product, additionalInfo) {
    const price = parseFloat(product.price) || 0;
    const oldPrice = parseFloat(product.old_price) || 0;
    const hasDiscount = oldPrice > price;
    
    const productData = {
        title: String(product.title || '').trim(),
        description: String(product.description || '').trim(),
        price: price,
        old_price: oldPrice,
        has_discount: hasDiscount,
        currency: 'BDT',
        stock_status: product.stock_status || 'in_stock'
    };
    
    if (additionalInfo) {
        const extra = {};
        const allowed = ['brand', 'model', 'category', 'features', 'specifications', 'target_customer'];
        allowed.forEach(k => {
            if (additionalInfo[k] && String(additionalInfo[k]).trim()) {
                extra[k] = String(additionalInfo[k]).trim();
            }
        });
        if (Object.keys(extra).length > 0) {
            productData.additional_info = extra;
        }
    }
    
    const systemPrompt = [
        'You are an SEO specialist for a Bangladesh gadget e-commerce store called Novahub.',
        'You generate product-specific SEO metadata for individual products.',
        '',
        'STRICT RULES — never violate these:',
        '1. Use ONLY the information provided in the product data below.',
        '2. NEVER invent specifications, features, warranty, compatibility, certifications, materials, dimensions, battery life, weight, or technical claims.',
        '3. NEVER invent prices, discounts, ratings, review counts, or availability.',
        '4. NEVER invent brand names or manufacturer claims.',
        '5. If a field cannot be derived from the provided data, return null for it.',
        '6. Never use promotional claims like "best in the world", "guaranteed", "#1", "100% safe", "cheapest".',
        '7. Output valid JSON only. No prose, no markdown, no code fences.',
        '',
        'Return a JSON object with exactly these keys:',
        '{',
        '  "seo_title":       "50-60 chars, includes product name and price. Bangladesh-focused.",',
        '  "seo_description": "140-160 chars, concise, describes product accurately.",',
        '  "seo_keywords":    "8-12 comma-separated keywords, lowercase, Bangladesh-relevant.",',
        '  "seo_slug":        "kebab-case, 3-6 words, lowercase, no special characters.",',
        '  "og_title":        "50-60 chars, more engaging than seo_title.",',
        '  "og_description":  "140-200 chars, social-share friendly.",',
        '  "focus_keyword":   "single primary keyword phrase.",',
        '  "seo_summary":     "2-3 short sentences summarizing the product for SEO context."',
        '}',
        '',
        'If any field truly cannot be determined from the product data, set it to null.',
    ].join('\n');
    
    const userPrompt = [
        'Generate SEO for the following product. Base every field ONLY on the data provided.',
        '',
        'Product data (JSON):',
        JSON.stringify(productData, null, 2),
        '',
        'Remember: no fabrication. Return JSON only.'
    ].join('\n');
    
    return { systemPrompt, userPrompt };
}

async function callAI(systemPrompt, userPrompt) {
    switch (AI_PROVIDER) {
        case 'openai':
            return await callOpenAI(systemPrompt, userPrompt);
        case 'anthropic':
            return await callAnthropic(systemPrompt, userPrompt);
        case 'gemini':
            return await callGemini(systemPrompt, userPrompt);
        default:
            throw new Error('Unsupported AI provider: ' + AI_PROVIDER);
    }
}

async function callOpenAI(systemPrompt, userPrompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
        model: AI_MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 800
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + AI_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error('OpenAI ' + response.status + ': ' + errText.slice(0, 200));
    }
    
    const data = await response.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('Empty OpenAI response');
    return content;
}

async function callAnthropic(systemPrompt, userPrompt) {
    const url = 'https://api.anthropic.com/v1/messages';
    const body = {
        model: AI_MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'x-api-key': AI_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error('Anthropic ' + response.status + ': ' + errText.slice(0, 200));
    }
    
    const data = await response.json();
    const content = data && data.content && data.content[0] && data.content[0].text;
    if (!content) throw new Error('Empty Anthropic response');
    return content;
}

async function callGemini(systemPrompt, userPrompt) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(AI_MODEL) + ':generateContent?key=' + encodeURIComponent(AI_API_KEY);
    const body = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 800,
            responseMimeType: 'application/json'
        }
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error('Gemini ' + response.status + ': ' + errText.slice(0, 200));
    }
    
    const data = await response.json();
    const content = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!content) throw new Error('Empty Gemini response');
    return content;
}

function validateAIResponse(rawText) {
    let parsed = null;
    
    try {
        parsed = JSON.parse(rawText);
    } catch (e) {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
            try { parsed = JSON.parse(match[0]); } catch (e2) { /* fall through */ }
        }
    }
    
    if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'not JSON' };
    }
    
    const BANNED = [
        /\bguaranteed\b/i,
        /\bbest in the world\b/i,
        /\b100% safe\b/i,
        /\bnumber one\b/i,
        /\b#1\b/,
        /\bcheapest\b/i,
        /\bmiracle\b/i
    ];
    
    const fields = ['seo_title', 'seo_description', 'seo_keywords', 'seo_slug',
                    'og_title', 'og_description', 'focus_keyword', 'seo_summary'];
    
    const out = {};
    
    for (const field of fields) {
        let val = parsed[field];
        if (val === undefined || val === null) {
            out[field] = null;
            continue;
        }
        val = String(val).trim();
        if (!val) { out[field] = null; continue; }
        
        const limits = {
            seo_title: 70,
            seo_description: 200,
            seo_keywords: 300,
            seo_slug: 80,
            og_title: 70,
            og_description: 220,
            focus_keyword: 60,
            seo_summary: 400
        };
        if (val.length > (limits[field] || 200)) {
            val = val.slice(0, limits[field]).trim();
        }
        
        if (field === 'seo_slug') {
            val = val.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
            if (!val || val.length < 3) { out[field] = null; continue; }
        }
        
        const hasBanned = BANNED.some(rx => rx.test(val));
        if (hasBanned) {
            out[field] = null;
            continue;
        }
        
        out[field] = val;
    }
    
    if (!out.seo_title || !out.seo_description) {
        return { success: false, error: 'missing required fields' };
    }
    
    return { success: true, data: out };
}