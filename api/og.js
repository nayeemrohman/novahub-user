// ============================================================
// NOVAHUB — Dynamic OG Meta Tag Generator
// Vercel Serverless Function
// URL: https://novahubgadgets.com/og?id=PRODUCT_ID
// ============================================================

const SUPABASE_URL = 'https://oxnfiueqmvggtjtciqbn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jYBypv_FEbLfWYDqFEeEkw_IA2WmZMk';

const SITE_NAME = 'Novahub';
const SITE_URL = 'https://novahubgadgets.com';
const DEFAULT_IMAGE = `${SITE_URL}/assets/images/logo.jpg`;
const DEFAULT_TITLE = 'Novahub – Best Gadget Accessories Shop in Bangladesh';
const DEFAULT_DESCRIPTION = 'Shop premium gadget accessories at Novahub – Headphones, Gaming Gear, Power Banks & more at best prices.';

// ============================================================
// HELPERS
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

function truncate(str, length = 160) {
    if (!str) return '';
    const clean = String(str).replace(/\s+/g, ' ').trim();
    if (clean.length <= length) return clean;
    return clean.substring(0, length - 3).trim() + '...';
}

function formatPrice(price) {
    const n = parseFloat(price) || 0;
    return '৳' + n.toLocaleString('en-BD', { maximumFractionDigits: 0 });
}

// ============================================================
// FETCH PRODUCT
// ============================================================

async function fetchProduct(productId) {
    if (!productId) return null;

    try {
        const url = `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&is_active=eq.true&select=*`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        return data[0];
    } catch (error) {
        console.error('Fetch error:', error);
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
    let url = SITE_URL;
    let price = '';
    let availability = 'in stock';

    if (product) {
        const productUrl = `${SITE_URL}/product.html?id=${product.id}`;
        url = productUrl;

        const productPrice = parseFloat(product.price) || 0;
        title = `${product.title} – ${formatPrice(productPrice)} | ${SITE_NAME}`;

        if (product.description && product.description.trim()) {
            description = truncate(product.description, 160);
        } else {
            description = `Buy ${product.title} at ${formatPrice(productPrice)} in Bangladesh. Cash on Delivery, Fast Shipping. Order now from Novahub.`;
        }

        if (product.image_url && product.image_url.trim()) {
            image = product.image_url;
        }

        price = productPrice.toString();
        availability = product.stock_status === 'out_of_stock' ? 'out of stock' : 'in stock';
    }

    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeImage = escapeHtml(image);
    const safeUrl = escapeHtml(url);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="${SITE_NAME}">
    <meta property="og:url" content="${safeUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${safeTitle}">
    <meta property="og:locale" content="en_US">
    
    ${price ? `<meta property="product:price:amount" content="${price}">
    <meta property="product:price:currency" content="BDT">` : ''}
    ${availability ? `<meta property="product:availability" content="${availability}">` : ''}
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@novahub">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${safeImage}">
    
    <meta itemprop="name" content="${safeTitle}">
    <meta itemprop="description" content="${safeDescription}">
    <meta itemprop="image" content="${safeImage}">
    
    <link rel="canonical" href="${safeUrl}">
    <meta http-equiv="refresh" content="0;url=${safeUrl}">
    <script>window.location.replace("${safeUrl}");</script>
</head>
<body>
    <p>Redirecting to <a href="${safeUrl}">${safeTitle}</a>...</p>
</body>
</html>`;
}

// ============================================================
// MAIN HANDLER
// ============================================================

module.exports = async (req, res) => {
    try {
        const url = new URL(req.url, `https://${req.headers.host || 'novahubgadgets.com'}`);
        const productId = url.searchParams.get('id');

        const product = productId ? await fetchProduct(productId) : null;
        const html = buildHTML(product);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
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