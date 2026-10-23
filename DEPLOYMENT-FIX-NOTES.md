# NovaHub routing / SEO patch notes

## What changed
- Added a Vercel rewrite for social/search crawlers on `/product/:productId` to `/api/og?id=:productId`, preserving per-product Open Graph metadata in crawler HTML.
- Kept the regular visitor rewrite to `/product.html?id=:productId`.
- Standardized generated canonical, sitemap and OG URLs to `https://www.novahubgadgets.com`.
- Normalized legacy canonical URLs stored in product records when they use the NovaHub apex/www domains.
- Removed the generic `/product.html` URL from the sitemap; active product URLs are listed individually.

## Important deployment steps
1. In Vercel, open the **user website** project and set **Root Directory** to `user` (or deploy the contents of this folder as the project root). `user/vercel.json` must be at the deployment root.
2. Deploy the project and test `/product/plextone-rx3-plus-wired-gaming-earphone-price-in-bangladesh` and `/product/k8-wireless-earbuds-digital-display`.
3. Confirm `/api/og?id=k8-wireless-earbuds-digital-display` returns product-specific title, image, description and canonical.
4. Re-scrape the final product URLs using Meta Sharing Debugger after deployment.
5. Confirm the preferred host `www.novahubgadgets.com` is the canonical host and that the apex host redirects to it.

## Limitations
This patch is based on the supplied source ZIP. It does not deploy to Vercel, access the live Supabase database, or prove that a given product slug exists/is active. Verify deployment and product records before considering the issue closed.
