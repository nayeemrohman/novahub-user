// ============================================================
// NOVAHUB — Dynamic Sitemap Generator
// Vercel Serverless Function
// Endpoint: GET /api/sitemap.xml
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oxnfiueqmvggtjtciqbn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_jYBypv_FEbLfWYDqFEeEkw_IA2WmZMk';

const SITE_URL = 'https://novahubgadgets.com';

module.exports = async (req, res) => {
    try {
        const products = await fetchActiveProducts();
        const xml = buildSitemapXML(products);
        
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
        res.setHeader('X-Robots-Tag', 'noindex');
        
        return res.status(200).send(xml);
    } catch (error) {
        console.error('Sitemap generation error:', error.message);
        const fallback = buildSitemapXML([]);
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
        return res.status(200).send(fallback);
    }
};

async function fetchActiveProducts() {
    try {
        const url = SUPABASE_URL + '/rest/v1/products?is_active=eq.true&select=id,seo_slug,updated_at,created_at';
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
                'Accept': 'application/json'
            }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('fetchActiveProducts error:', error.message);
        return [];
    }
}

function buildSitemapXML(products) {
    const today = new Date().toISOString().split('T')[0];
    
    const staticPages = [
        { loc: SITE_URL + '/', changefreq: 'daily', priority: '1.0', lastmod: today },
        { loc: SITE_URL + '/product.html', changefreq: 'daily', priority: '0.9', lastmod: today },
        { loc: SITE_URL + '/about.html', changefreq: 'monthly', priority: '0.7', lastmod: today },
        { loc: SITE_URL + '/order-track.html', changefreq: 'weekly', priority: '0.6', lastmod: today },
        { loc: SITE_URL + '/terms.html', changefreq: 'monthly', priority: '0.4', lastmod: today },
        { loc: SITE_URL + '/privacy.html', changefreq: 'monthly', priority: '0.4', lastmod: today }
    ];
    
    const urls = [];
    
    staticPages.forEach(page => {
        urls.push(buildUrlEntry(page));
    });
    
    products.forEach(product => {
        if (!product || !product.id) return;
        
        const lastmod = (product.updated_at || product.created_at || today).split('T')[0];
        
        let loc;
        if (product.seo_slug && String(product.seo_slug).trim()) {
            loc = SITE_URL + '/product/' + encodeURIComponent(String(product.seo_slug).trim());
        } else {
            loc = SITE_URL + '/product.html?id=' + encodeURIComponent(product.id);
        }
        
        urls.push(buildUrlEntry({
            loc: loc,
            lastmod: lastmod,
            changefreq: 'weekly',
            priority: '0.8'
        }));
    });
    
    const header = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
                       '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n' +
                       '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n' +
                       '        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">\n';
    
    const body = urls.join('\n');
    const footer = '\n</urlset>';
    
    return header + urlsetOpen + body + footer;
}

function buildUrlEntry(entry) {
    const safeLoc = escapeXml(entry.loc);
    const safeLastmod = escapeXml(entry.lastmod);
    const safeChangefreq = escapeXml(entry.changefreq);
    const safePriority = escapeXml(entry.priority);
    
    return [
        '    <url>',
        '        <loc>' + safeLoc + '</loc>',
        '        <lastmod>' + safeLastmod + '</lastmod>',
        '        <changefreq>' + safeChangefreq + '</changefreq>',
        '        <priority>' + safePriority + '</priority>',
        '    </url>'
    ].join('\n');
}

function escapeXml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}