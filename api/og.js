// ============================================================
// NOVAHUB — Dynamic OG Meta Tag Generator (v4 — FINAL)
// Vercel Serverless Function
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oxnfiueqmvggtjtciqbn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jYBypv_FEbLfWYDqFEeEkw_IA2WmZMk';

const SITE_NAME = 'Novahub';
const SITE_URL = 'https://novahubgadgets.com';
const DEFAULT_IMAGE = SITE_URL + '/assets/images/logo.jpg';
const DEFAULT_TITLE = 'Novahub – Best Gadget Accessories Shop in Bangladesh';
const DEFAULT_DESCRIPTION = 'Shop premium gadget accessories at Novahub – Headphones, Gaming Gear, Power Banks & more at best prices.';

// ============================================================
// ESCAPE HELPERS
// ============================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function truncate(str, length) {
    length = length || 160;
    if (!str) return '';
    const clean = String(str).replace(/\s+/g, ' ').trim();
    if (clean.length <= length) return clean;
    return clean.substring(0, length - 3).trim() + '...';
}

function formatPrice(price) {
    const n = parseFloat(price) || 0;
    return '৳' + n.toLocaleString('en-BD', { maximumFractionDigits: 0 });
}

function isUUID(str) {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ============================================================
// FETCH PRODUCT
// ============================================================
async function fetchProduct(idOrSlug) {
    if (!idOrSlug) return null;
    try {
        const col = isUUID(idOrSlug) ? 'id' : 'seo_slug';
        const url = SUPABASE_URL + '/rest/v1/products?' + col + '=eq.' + encodeURIComponent(idOrSlug) + '&is_active=eq.true&select=*';
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer ' + SUPABASE_KEY,
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) return null;
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        return data[0];
    } catch (error) {
        console.error('Fetch product error:', error.message);
        return null;
    }
}

// ============================================================
// BUILD HTML
// ============================================================
function buildHTML(product) {
    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESCRIPTION;
    let image = DEFAULT_IMAGE;
    let canonicalUrl = SITE_URL;
    let redirectUrl = SITE_URL;
    let price = '';
    let availability = 'in stock';

    if (product) {
        const slug = (product.seo_slug && String(product.seo_slug).trim()) || null;
        const canonicalFromDb = (product.canonical_url && String(product.canonical_url).trim()) || null;
        
        canonicalUrl = canonicalFromDb
            || (slug
                ? SITE_URL + '/product/' + encodeURIComponent(slug)
                : SITE_URL + '/product.html?id=' + product.id);
        
        redirectUrl = slug
            ? SITE_URL + '/product/' + encodeURIComponent(slug)
            : SITE_URL + '/product.html?id=' + product.id;

        const productPrice = parseFloat(product.price) || 0;

        const autoTitle = product.title + ' – ' + formatPrice(productPrice) + ' | ' + SITE_NAME;
        title = (product.seo_title && String(product.seo_title).trim()) || autoTitle;

        if (product.seo_description && String(product.seo_description).trim()) {
            description = truncate(product.seo_description, 160);
        } else if (product.description && String(product.description).trim()) {
            description = truncate(product.description, 160);
        } else {
            description = 'Buy ' + product.title + ' at ' + formatPrice(productPrice) + ' in Bangladesh. Cash on Delivery, Fast Shipping. Order now from Novahub.';
        }

        if (product.og_title && String(product.og_title).trim()) {
            title = String(product.og_title).trim();
        }
        if (product.og_description && String(product.og_description).trim()) {
            description = truncate(product.og_description, 200);
        }

        if (product.og_image && String(product.og_image).trim()) {
            image = String(product.og_image).trim();
        } else if (product.image_url && String(product.image_url).trim()) {
            image = String(product.image_url).trim();
        }

        price = productPrice.toString();
        availability = product.stock_status === 'out_of_stock' ? 'out of stock' : 'in stock';
    }

    const safeTitle = escapeAttr(title);
    const safeDescription = escapeAttr(description);
    const safeImage = escapeAttr(image);
    const safeCanonical = escapeAttr(canonicalUrl);
    const safeRedirect = escapeAttr(redirectUrl);
    const safeRedirectJs = redirectUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'    <meta charset="UTF-8">\n' +
'    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'    \n' +
'    <title>' + safeTitle + '</title>\n' +
'    <meta name="description" content="' + safeDescription + '">\n' +
'    \n' +
'    <!-- Open Graph -->\n' +
'    <meta property="og:type" content="product">\n' +
'    <meta property="og:site_name" content="' + SITE_NAME + '">\n' +
'    <meta property="og:url" content="' + safeCanonical + '">\n' +
'    <meta property="og:title" content="' + safeTitle + '">\n' +
'    <meta property="og:description" content="' + safeDescription + '">\n' +
'    <meta property="og:image" content="' + safeImage + '">\n' +
'    <meta property="og:image:secure_url" content="' + safeImage + '">\n' +
'    <meta property="og:image:width" content="1200">\n' +
'    <meta property="og:image:height" content="630">\n' +
'    <meta property="og:image:type" content="image/jpeg">\n' +
'    <meta property="og:image:alt" content="' + safeTitle + '">\n' +
'    <meta property="og:locale" content="en_US">\n' +
'    <meta property="og:locale:alternate" content="bn_BD">\n' +
'    \n' +
(price ? '    <meta property="product:price:amount" content="' + escapeAttr(price) + '">\n' +
'    <meta property="product:price:currency" content="BDT">\n' : '') +
(availability ? '    <meta property="product:availability" content="' + escapeAttr(availability) + '">\n' : '') +
'    \n' +
'    <!-- Twitter Card -->\n' +
'    <meta name="twitter:card" content="summary_large_image">\n' +
'    <meta name="twitter:site" content="@novahub">\n' +
'    <meta name="twitter:title" content="' + safeTitle + '">\n' +
'    <meta name="twitter:description" content="' + safeDescription + '">\n' +
'    <meta name="twitter:image" content="' + safeImage + '">\n' +
'    <meta name="twitter:image:alt" content="' + safeTitle + '">\n' +
'    \n' +
'    <!-- WhatsApp -->\n' +
'    <meta property="whatsapp:title" content="' + safeTitle + '">\n' +
'    <meta property="whatsapp:description" content="' + safeDescription + '">\n' +
'    <meta property="whatsapp:image" content="' + safeImage + '">\n' +
'    \n' +
'    <!-- Canonical + Redirect -->\n' +
'    <link rel="canonical" href="' + safeCanonical + '">\n' +
'    <meta http-equiv="refresh" content="0;url=' + safeRedirect + '">\n' +
'    <script>window.location.replace("' + safeRedirectJs + '");<\/script>\n' +
'</head>\n' +
'<body>\n' +
'    <p>Redirecting to <a href="' + safeRedirect + '">' + safeTitle + '</a>...</p>\n' +
'</body>\n' +
'</html>';
}

// ============================================================
// HANDLER
// ============================================================
module.exports = async (req, res) => {
    try {
        const url = new URL(req.url, 'https://' + (req.headers.host || 'novahubgadgets.com'));
        const idOrSlug = url.searchParams.get('id');

        const product = idOrSlug ? await fetchProduct(idOrSlug) : null;
        const html = buildHTML(product);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
        res.setHeader('X-Robots-Tag', 'noindex');

        return res.status(200).send(html);

    } catch (error) {
        console.error('OG Function error:', error);
        const fallbackHtml = buildHTML(null);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
        return res.status(200).send(fallbackHtml);
    }
};