// ============================================================
// NOVAHUB — Product Page Script (v5)
// Fixed: Uses CartModule, prevents double-click, safer SEO
// ============================================================

let product = null;
let productImages = [];
let currentImageIndex = 0;
let selectedVariants = {};
let selectedRating = 0;
let reviewImage = null;
let allReviews = [];
let relatedProducts = [];
let isAddingToCart = false;
let isBuyingNow = false;

// ==================== HEADER ACTIONS ====================
async function handleProfileClick() {
    const user = await getCurrentUser();
    if (user) window.location.href = 'profile.html';
    else window.location.href = 'auth.html';
}
window.handleProfileClick = handleProfileClick;

async function updateHeaderProfile() {
    const profileIcon = document.getElementById('headerProfileIcon');
    if (!profileIcon) return;
    try {
        const user = await getCurrentUser();
        if (!user) { profileIcon.className = 'fas fa-user'; return; }
        
        const profile = await getUserProfile(user.id);
        const g = user.user_metadata || {};
        const photoUrl = profile?.avatar_url || g.avatar_url || g.picture || null;
        
        if (photoUrl) {
            profileIcon.parentElement.innerHTML = '<img src="' + escapeHtml(photoUrl) + '" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" onerror="this.outerHTML=\'<i class=&quot;fas fa-user-circle&quot; id=&quot;headerProfileIcon&quot;></i>\'">';
        } else {
            profileIcon.className = 'fas fa-user-circle';
        }
    } catch (err) {
        console.error('updateHeaderProfile error:', err);
    }
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Product page initializing...');
    
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    
    if (!productId) {
        showToast('Product not found', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }
    
    await loadSettings();
    await updateAuthUI();
    updateHeaderProfile();
    await loadProduct(productId);
    setupLightbox();
    
    console.log('✅ Product page ready');
});

// ==================== LOAD SETTINGS ====================
async function loadSettings() {
    try {
        const { data } = await supabaseClient
            .from('settings').select('*').eq('id', 1).single();
        
        if (data) {
            window.settings = {
                shopName: data.shop_name || 'Novahub',
                currency: data.currency || '৳',
                orderPrefix: data.order_prefix || 'NV',
                whatsappNumber: data.whatsapp_number || '01947939982',
                insideDhakaCharge: data.inside_dhaka_charge || 60,
                outsideDhakaCharge: data.outside_dhaka_charge || 120
            };
        }
    } catch (error) {
        console.error('Settings error:', error);
    }
}

// ==================== LOAD PRODUCT ====================
async function loadProduct(productId) {
    try {
        const { data, error } = await supabaseClient
            .from('products').select('*')
            .eq('id', productId).eq('is_active', true).single();
        
        if (error || !data) {
            showToast('Product not found', 'error');
            setTimeout(() => window.location.href = 'index.html', 1500);
            return;
        }
        
        product = data;
        productImages = [];
        if (product.image_url) productImages.push(product.image_url);
        
        if (Array.isArray(product.images) && product.images.length > 0) {
            product.images.forEach(img => {
                if (img && !productImages.includes(img)) productImages.push(img);
            });
        }
        
        if (productImages.length === 0) productImages = ['https://via.placeholder.com/600'];
        
        currentImageIndex = 0;
        
        renderProduct();
        await loadReviews();
        updateSEO();
        updateBreadcrumb();
        setupReviewForm();
        await loadRelatedProducts();
        
        if (typeof window.trackViewContent === 'function') {
            window.trackViewContent(product);
        }
        
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Error loading product', 'error');
    }
}

// ============================================================
// SEO UPDATE
// ============================================================
function updateSEO() {
    const price = safeParseNumber(product.price);
    const oldPrice = safeParseNumber(product.old_price);
    const inStock = product.stock_status !== 'out_of_stock';
    const productUrl = 'https://novahubgadgets.com/product.html?id=' + product.id;
    const productImage = productImages[0] || 'https://novahubgadgets.com/assets/images/logo.jpg';
    
    const shortDesc = product.description 
        ? product.description.replace(/\s+/g, ' ').trim().substring(0, 155)
        : 'Buy ' + product.title + ' at ৳' + price + ' in Bangladesh. Cash on Delivery available. Order now from Novahub.';
    
    const pageTitle = product.title + ' – ৳' + price + ' | Novahub Bangladesh';
    
    document.title = pageTitle;
    
    setMeta('name', 'title', pageTitle);
    setMeta('name', 'description', shortDesc);
    
    const canonical = document.getElementById('canonicalLink');
    if (canonical) canonical.href = productUrl;
    
    setMetaById('og:url', productUrl);
    setMetaById('og:title', pageTitle);
    setMetaById('og:description', shortDesc);
    setMetaById('og:image', productImage);
    
    setMetaById('twitter:url', productUrl);
    setMetaById('twitter:title', pageTitle);
    setMetaById('twitter:description', shortDesc);
    setMetaById('twitter:image', productImage);
    setMetaById('twitter:data1', '৳' + price);
    setMetaById('twitter:data2', inStock ? 'In Stock' : 'Out of Stock');
    
    setMetaById('whatsapp:title', pageTitle);
    setMetaById('whatsapp:description', shortDesc);
    setMetaById('whatsapp:image', productImage);
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        "image": productImages,
        "description": product.description || product.title,
        "sku": product.id,
        "mpn": product.id,
        "brand": { "@type": "Brand", "name": "Novahub" },
        "offers": {
            "@type": "Offer",
            "url": productUrl,
            "priceCurrency": "BDT",
            "price": price,
            "priceValidUntil": "2027-12-31",
            "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {
                "@type": "Organization",
                "name": "Novahub",
                "url": "https://novahubgadgets.com"
            }
        }
    };
    
    if (allReviews.length > 0) {
        const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        schema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": avgRating.toFixed(1),
            "reviewCount": allReviews.length,
            "bestRating": 5,
            "worstRating": 1
        };
        
        schema.review = allReviews.slice(0, 3).map(r => ({
            "@type": "Review",
            "author": { "@type": "Person", "name": r.reviewer_name || 'Customer' },
            "datePublished": r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            "reviewBody": r.comment || 'Great product!',
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": r.rating,
                "bestRating": 5,
                "worstRating": 1
            }
        }));
    }
    
    const schemaTag = document.getElementById('productSchema');
    if (schemaTag) schemaTag.textContent = JSON.stringify(schema, null, 2);
    
    const bcSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://novahubgadgets.com/" },
            { "@type": "ListItem", "position": 2, "name": product.title, "item": productUrl }
        ]
    };
    
    const bcTag = document.getElementById('breadcrumbSchema');
    if (bcTag) bcTag.textContent = JSON.stringify(bcSchema, null, 2);
    
    const ogType = document.getElementById('ogType');
    if (ogType) ogType.setAttribute('content', 'product');
}

function setMeta(attr, name, content) {
    let tag = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

function setMetaById(name, content) {
    const idMap = {
        'og:url': 'ogUrl',
        'og:title': 'ogTitle',
        'og:description': 'ogDescription',
        'og:image': 'ogImage',
        'twitter:url': 'twitterUrl',
        'twitter:title': 'twitterTitle',
        'twitter:description': 'twitterDescription',
        'twitter:image': 'twitterImage',
        'twitter:data1': 'twitterPrice',
        'twitter:data2': 'twitterAvail',
        'whatsapp:title': 'waTitle',
        'whatsapp:description': 'waDescription',
        'whatsapp:image': 'waImage'
    };
    
    const elId = idMap[name];
    if (elId) {
        const tag = document.getElementById(elId);
        if (tag) { tag.setAttribute('content', content); return; }
    }
}

// ==================== BREADCRUMB ====================
function updateBreadcrumb() {
    const nav = document.getElementById('breadcrumbNav');
    const list = document.getElementById('breadcrumbList');
    if (!nav || !list) return;
    
    nav.style.display = 'block';
    list.innerHTML = 
        '<li><a href="index.html"><i class="fas fa-home"></i> Home</a></li>' +
        '<li><i class="fas fa-chevron-right"></i> <span>' + escapeHtml(product.title) + '</span></li>';
}

// ==================== RENDER PRODUCT ====================
function renderProduct() {
    const container = document.getElementById('productContainer');
    if (!container) return;
    
    const price = safeParseNumber(product.price);
    const oldPrice = safeParseNumber(product.old_price);
    const hasDiscount = oldPrice > price;
    const discountPercent = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
    const isOutOfStock = product.stock_status === 'out_of_stock';
    
    const mainImage = productImages[0] || 'https://via.placeholder.com/600';
    
    const thumbnailsHTML = productImages.length > 1 
        ? productImages.map((img, i) => 
            '<img src="' + escapeHtml(img) + '" alt="' + escapeHtml(product.title) + ' - View ' + (i+1) + '" ' +
            'class="product-thumbnail ' + (i === 0 ? 'active' : '') + '" ' +
            'data-index="' + i + '" loading="lazy" ' +
            'onerror="this.src=\'https://via.placeholder.com/70\'">'
        ).join('')
        : '';
    
    let variantsHTML = '';
    const hasVariants = product.enable_variants && Array.isArray(product.variants) && product.variants.length > 0;
    
    if (hasVariants) {
        variantsHTML = '<div class="product-variants">' +
            '<div class="variants-header">' +
                '<div class="variants-title">Select Options</div>' +
                '<div class="variant-summary" id="variantSummary">' +
                    '<span class="variant-summary-empty">Select options</span>' +
                '</div>' +
            '</div>';
        
        product.variants.forEach((v) => {
            if (!v.name || !Array.isArray(v.options)) return;
            variantsHTML += '<div class="variant-group">' +
                '<label class="variant-label">' + escapeHtml(v.name) + '</label>' +
                '<div class="variant-options" data-variant-name="' + escapeHtml(v.name) + '">' +
                    v.options.map(opt => 
                        '<button type="button" class="variant-option" ' +
                        'data-name="' + escapeHtml(v.name) + '" ' +
                        'data-value="' + escapeHtml(opt) + '">' + escapeHtml(opt) + '</button>'
                    ).join('') +
                '</div>' +
            '</div>';
        });
        variantsHTML += '</div>';
    }
    
    const description = product.description 
        ? escapeHtml(product.description).replace(/\n/g, '<br>')
        : 'No description available.';
    
    container.innerHTML = 
        '<div class="product-details">' +
            '<div class="product-images-section">' +
                '<div class="main-image-container" id="mainImageWrap">' +
                    '<img src="' + escapeHtml(mainImage) + '" alt="' + escapeHtml(product.title) + '" ' +
                    'class="main-product-image" id="mainProductImage" ' +
                    'onerror="this.src=\'https://via.placeholder.com/600\'">' +
                '</div>' +
                (thumbnailsHTML ? '<div class="thumbnail-container" id="thumbnailContainer">' + thumbnailsHTML + '</div>' : '') +
            '</div>' +
            '<div class="product-details-info">' +
                '<h1 class="product-details-title">' + escapeHtml(product.title) + '</h1>' +
                '<div class="product-details-price">' +
                    '<div class="price-stock-row">' +
                        '<div class="price-section">' +
                            '<span class="current-price">' + formatPrice(price) + '</span>' +
                            (hasDiscount ? '<span class="old-price">' + formatPrice(oldPrice) + '</span>' : '') +
                            (hasDiscount ? '<span class="discount-pill">-' + discountPercent + '% OFF</span>' : '') +
                        '</div>' +
                        '<span class="stock-pill ' + (isOutOfStock ? 'out-of-stock' : 'in-stock') + '">' +
                            '<i class="fas ' + (isOutOfStock ? 'fa-times-circle' : 'fa-check-circle') + '"></i> ' +
                            (isOutOfStock ? 'Out of Stock' : 'In Stock') +
                        '</span>' +
                    '</div>' +
                '</div>' +
                variantsHTML +
                '<div class="product-details-description">' +
                    '<h3>Product Description</h3>' +
                    '<div class="description-content">' + description + '</div>' +
                '</div>' +
                '<div class="product-details-actions">' +
                    '<button class="btn add-to-cart" id="addToCartBtn" ' + (isOutOfStock ? 'disabled' : '') + '>' +
                        '<i class="fas fa-cart-plus"></i> Add to Cart</button>' +
                    '<button class="btn buy-now" id="buyNowBtn" ' + (isOutOfStock ? 'disabled' : '') + '>' +
                        '<i class="fas fa-bolt"></i> Buy Now</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    // Attach event listeners (safer than inline onclick)
    const mainImgWrap = document.getElementById('mainImageWrap');
    if (mainImgWrap) {
        mainImgWrap.addEventListener('click', () => {
            openLightbox(productImages[currentImageIndex]);
        });
    }
    
    const thumbContainer = document.getElementById('thumbnailContainer');
    if (thumbContainer) {
        thumbContainer.querySelectorAll('.product-thumbnail').forEach(el => {
            el.addEventListener('click', () => {
                changeProductImage(parseInt(el.dataset.index));
            });
        });
    }
    
    // Variant buttons
    container.querySelectorAll('.variant-option').forEach(el => {
        el.addEventListener('click', () => {
            selectVariant(el);
        });
    });
    
    // Action buttons
    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) addBtn.addEventListener('click', handleAddToCart);
    
    const buyBtn = document.getElementById('buyNowBtn');
    if (buyBtn) buyBtn.addEventListener('click', handleBuyNow);
    
    if (hasVariants) {
        updateAddToCartButtonState();
        updateVariantSummary();
    }
}

// ==================== CHANGE IMAGE ====================
function changeProductImage(index) {
    if (index < 0 || index >= productImages.length) return;
    currentImageIndex = index;
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg) mainImg.src = productImages[index];
    document.querySelectorAll('.product-thumbnail').forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
}
window.changeProductImage = changeProductImage;

// ==================== LIGHTBOX ====================
function openLightbox(imageUrl) {
    const lightbox = document.getElementById('imageLightbox');
    const img = document.getElementById('lightboxImage');
    if (!lightbox || !img) return;
    img.src = imageUrl || productImages[currentImageIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.openLightbox = openLightbox;

function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}
window.closeLightbox = closeLightbox;

function setupLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    if (!lightbox) return;
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });
}

// ==================== VARIANT ====================
function selectVariant(btn) {
    const name = btn.dataset.name;
    const value = btn.dataset.value;
    btn.parentElement.querySelectorAll('.variant-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedVariants[name] = value;
    updateVariantSummary();
    updateAddToCartButtonState();
}
window.selectVariant = selectVariant;

function updateVariantSummary() {
    const summaryEl = document.getElementById('variantSummary');
    if (!summaryEl) return;
    const entries = Object.entries(selectedVariants);
    if (entries.length === 0) {
        summaryEl.innerHTML = '<span class="variant-summary-empty">Select options</span>';
        return;
    }
    summaryEl.innerHTML = entries.map(([key, val]) => 
        '<span class="variant-summary-item"><strong>' + escapeHtml(key) + ':</strong> ' + escapeHtml(val) + '</span>'
    ).join(' <span class="variant-summary-sep">•</span> ');
}

function updateAddToCartButtonState() {
    if (!product.enable_variants || !product.variants || product.variants.length === 0) return;
    
    const allSelected = product.variants.every(v => selectedVariants[v.name]);
    const addBtn = document.getElementById('addToCartBtn');
    const buyBtn = document.getElementById('buyNowBtn');
    
    if (addBtn) addBtn.classList.toggle('needs-variant', !allSelected);
    if (buyBtn) buyBtn.classList.toggle('needs-variant', !allSelected);
}

function scrollToVariants() {
    const variantSection = document.querySelector('.product-variants');
    if (!variantSection) return;
    
    variantSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    variantSection.classList.add('highlight-variants');
    setTimeout(() => variantSection.classList.remove('highlight-variants'), 2000);
}
window.scrollToVariants = scrollToVariants;

// ============================================================
// ADD TO CART (with double-click prevention)
// ============================================================
function handleAddToCart() {
    if (isAddingToCart) return;
    
    if (product.enable_variants && product.variants && product.variants.length > 0) {
        const allSelected = product.variants.every(v => selectedVariants[v.name]);
        if (!allSelected) {
            showToast('Please select all options', 'warning');
            scrollToVariants();
            return;
        }
    }
    
    isAddingToCart = true;
    const btn = document.getElementById('addToCartBtn');
    if (btn) btn.disabled = true;
    
    try {
        const variant = Object.keys(selectedVariants).length > 0 ? selectedVariants : null;
        const result = CartModule.addToCart(product, 1, variant);
        
        if (result.success) {
            CartModule.renderCartUI();
            showToast(product.title + ' added to cart', 'success');
        } else if (result.error === 'out_of_stock') {
            showToast('Product out of stock', 'error');
        } else {
            showToast('Failed to add to cart', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showToast('Failed to add to cart', 'error');
    } finally {
        setTimeout(() => {
            isAddingToCart = false;
            if (btn && product.stock_status !== 'out_of_stock') btn.disabled = false;
        }, 500);
    }
}
window.handleAddToCart = handleAddToCart;

// ============================================================
// BUY NOW (with double-click prevention)
// ============================================================
function handleBuyNow() {
    if (isBuyingNow) return;
    
    if (product.enable_variants && product.variants && product.variants.length > 0) {
        const allSelected = product.variants.every(v => selectedVariants[v.name]);
        if (!allSelected) {
            showToast('Please select all options', 'warning');
            scrollToVariants();
            return;
        }
    }
    
    isBuyingNow = true;
    const btn = document.getElementById('buyNowBtn');
    if (btn) btn.disabled = true;
    
    try {
        const variant = Object.keys(selectedVariants).length > 0 ? selectedVariants : null;
        const directItem = {
            productId: product.id,
            title: product.title,
            price: product.price,
            imageURL: product.image_url,
            quantity: 1,
            selectedVariant: variant,
            isDirect: true
        };
        
        localStorage.setItem('novahub_direct_checkout', JSON.stringify(directItem));
        window.location.href = 'checkout.html?mode=direct';
    } catch (error) {
        console.error('Buy now error:', error);
        showToast('Failed to proceed', 'error');
        isBuyingNow = false;
        if (btn) btn.disabled = false;
    }
}
window.handleBuyNow = handleBuyNow;

// ==================== LOAD REVIEWS ====================
async function loadReviews() {
    try {
        const { data, error } = await supabaseClient
            .from('reviews').select('*')
            .eq('product_id', product.id)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        allReviews = data || [];
        renderReviews();
    } catch (error) {
        console.error('Error loading reviews:', error);
        allReviews = [];
        renderReviews();
    }
}

// ==================== RENDER REVIEWS ====================
function renderReviews() {
    const section = document.getElementById('reviewsSection');
    const summaryEl = document.getElementById('reviewsSummary');
    const trackEl = document.getElementById('reviewsScrollTrack');
    
    if (!section) return;
    section.style.display = 'block';
    
    let avg = 0;
    if (allReviews.length > 0) {
        avg = allReviews.reduce((s, r) => s + (r.rating || 0), 0) / allReviews.length;
    }
    
    if (summaryEl) {
        const fullStars = Math.floor(avg);
        const hasHalf = avg - fullStars >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
        
        let starsHTML = '';
        for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star star"></i>';
        if (hasHalf) starsHTML += '<i class="fas fa-star-half-alt star"></i>';
        for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star star empty"></i>';
        
        summaryEl.innerHTML = 
            '<div class="average-rating">' +
                '<div class="average-score">' + avg.toFixed(1) + '</div>' +
                '<div class="stars-display">' + starsHTML + '</div>' +
                '<div class="review-count">(' + allReviews.length + ' review' + (allReviews.length !== 1 ? 's' : '') + ')</div>' +
            '</div>';
    }
    
    if (!trackEl) return;
    
    if (allReviews.length === 0) {
        trackEl.innerHTML = '<div class="no-reviews"><i class="fas fa-comment-slash"></i><p>No reviews yet. Be the first to review!</p></div>';
        trackEl.style.animation = 'none';
        return;
    }
    
    const reviewsToRender = allReviews.length < 3 
        ? [...allReviews, ...allReviews, ...allReviews] 
        : [...allReviews, ...allReviews];
    
    trackEl.innerHTML = reviewsToRender.map(r => renderReviewSquare(r)).join('');
    
    const totalWidth = reviewsToRender.length * 240;
    const duration = Math.max(20, totalWidth / 30);
    trackEl.style.animation = 'reviewScroll ' + duration + 's linear infinite';
}

function renderReviewSquare(r) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += i <= r.rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star empty"></i>';
    }
    
    const date = r.created_at 
        ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        : '';
    
    const reviewerName = r.reviewer_name || 'User';
    const initials = reviewerName.charAt(0).toUpperCase();
    const image = r.image_url_1 || null;
    const avatar = r.reviewer_avatar || null;
    const comment = r.comment && r.comment.trim() 
        ? escapeHtml(r.comment) 
        : '<span style="color:#AAA;font-style:italic;">No comment</span>';
    
    let avatarHTML;
    if (avatar) {
        avatarHTML = '<div class="review-square-avatar has-image"><img src="' + escapeHtml(avatar) + '" alt="' + escapeHtml(reviewerName) + '" loading="lazy" onerror="this.parentElement.classList.remove(\'has-image\');this.parentElement.textContent=\'' + escapeHtml(initials) + '\';"></div>';
    } else {
        avatarHTML = '<div class="review-square-avatar">' + escapeHtml(initials) + '</div>';
    }
    
    return '<div class="review-square-card">' +
        '<div class="review-square-header">' +
            avatarHTML +
            '<div class="review-square-user">' +
                '<div class="review-square-name">' + escapeHtml(reviewerName) + '</div>' +
                '<div class="review-square-date">' + date + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="review-square-stars">' + starsHTML + '</div>' +
        '<div class="review-square-text">' + comment + '</div>' +
        (image ? '<div class="review-square-image" onclick="openLightbox(\'' + escapeHtml(image) + '\')"><img src="' + escapeHtml(image) + '" alt="Review" loading="lazy" onerror="this.parentElement.style.display=\'none\'"></div>' : '') +
    '</div>';
}

// ==================== RELATED PRODUCTS ====================
async function loadRelatedProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products').select('*')
            .eq('is_active', true)
            .neq('id', product.id);
        
        if (error || !data || data.length === 0) {
            const section = document.getElementById('relatedSection');
            if (section) section.style.display = 'none';
            return;
        }
        
        const shuffled = data.sort(() => Math.random() - 0.5);
        relatedProducts = shuffled.slice(0, 4);
        
        const section = document.getElementById('relatedSection');
        const grid = document.getElementById('relatedGrid');
        
        if (!section || !grid) return;
        
        section.style.display = 'block';
        grid.innerHTML = relatedProducts.map(p => {
            const price = safeParseNumber(p.price);
            const oldPrice = safeParseNumber(p.old_price);
            const hasDiscount = oldPrice > price;
            const discountPercent = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
            const isOutOfStock = p.stock_status === 'out_of_stock';
            
            return '<div class="product-card">' +
                '<div class="product-image-wrapper">' +
                    (hasDiscount ? '<div class="product-badge">-' + discountPercent + '%</div>' : '') +
                    '<img src="' + escapeHtml(p.image_url || 'https://via.placeholder.com/300') + '" ' +
                        'alt="' + escapeHtml(p.title) + '" class="product-image" loading="lazy" ' +
                        'onclick="window.location.href=\'product.html?id=' + p.id + '\'" ' +
                        'onerror="this.src=\'https://via.placeholder.com/300\'">' +
                    (isOutOfStock ? '<div class="stock-badge out-of-stock">Out of Stock</div>' : '') +
                '</div>' +
                '<div class="product-info">' +
                    '<h3 class="product-title" onclick="window.location.href=\'product.html?id=' + p.id + '\'">' + escapeHtml(p.title) + '</h3>' +
                    '<div class="product-price">' +
                        '<span class="current-price">' + formatPrice(price) + '</span>' +
                        (hasDiscount ? '<span class="old-price">' + formatPrice(oldPrice) + '</span>' : '') +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
        
    } catch (error) {
        console.error('Error loading related:', error);
        const section = document.getElementById('relatedSection');
        if (section) section.style.display = 'none';
    }
}

// ==================== REVIEW FORM ====================
async function setupReviewForm() {
    const user = await getCurrentUser();
    const writeBtn = document.getElementById('writeReviewBtn');
    const loginBox = document.getElementById('loginToReview');
    
    if (user) {
        if (writeBtn) writeBtn.style.display = 'inline-flex';
        if (loginBox) loginBox.style.display = 'none';
        setupStarRating();
        setupImageUpload();
    } else {
        if (writeBtn) writeBtn.style.display = 'none';
        if (loginBox) loginBox.style.display = 'block';
    }
}

function setupStarRating() {
    const stars = document.querySelectorAll('#starRating i');
    const ratingText = document.getElementById('ratingText');
    const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            stars.forEach((s, i) => {
                if (i < selectedRating) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
            if (ratingText) ratingText.textContent = selectedRating + ' - ' + ratingLabels[selectedRating];
        });
    });
}

function setupImageUpload() {
    const input = document.getElementById('reviewImage1');
    if (input) input.addEventListener('change', handleImageSelect);
}

async function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Only images allowed', 'error');
        return;
    }
    
    try {
        showToast('Compressing image...', 'info');
        const compressed = await compressImage(file, 1 * 1024 * 1024);
        reviewImage = compressed;
        
        const slot = document.getElementById('slot1');
        const reader = new FileReader();
        reader.onload = (e) => {
            slot.innerHTML = '<img src="' + e.target.result + '" alt="Review image">' +
                '<button class="remove-img" onclick="removeImage(event)"><i class="fas fa-times"></i></button>';
            slot.classList.add('has-image');
        };
        reader.readAsDataURL(compressed);
        
        showToast('Image ready', 'success');
    } catch (error) {
        console.error('Image error:', error);
        showToast('Failed to process image', 'error');
    }
}

function removeImage(event) {
    event.stopPropagation();
    reviewImage = null;
    const slot = document.getElementById('slot1');
    slot.classList.remove('has-image');
    slot.innerHTML = '<i class="fas fa-camera"></i><small>Tap to add photo</small>';
    const input = document.getElementById('reviewImage1');
    if (input) input.value = '';
}
window.removeImage = removeImage;

function compressImage(file, maxSize) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                const maxDim = 1920;
                
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height / width) * maxDim;
                        width = maxDim;
                    } else {
                        width = (width / height) * maxDim;
                        height = maxDim;
                    }
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                let quality = 0.9;
                const tryCompress = () => {
                    canvas.toBlob((b) => {
                        if (!b) return reject('Compression failed');
                        if (b.size <= maxSize || quality <= 0.3) resolve(b);
                        else { quality -= 0.1; tryCompress(); }
                    }, 'image/jpeg', quality);
                };
                tryCompress();
            };
            img.onerror = () => reject('Image load failed');
        };
        reader.onerror = () => reject('File read failed');
    });
}

// ==================== REVIEW MODAL ====================
function openReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}
window.openReviewModal = openReviewModal;

function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}
window.closeReviewModal = closeReviewModal;

// ==================== SUBMIT REVIEW ====================
async function submitReview() {
    const user = await getCurrentUser();
    if (!user) {
        showToast('Please login first', 'warning');
        window.location.href = 'auth.html';
        return;
    }
    
    if (selectedRating === 0) {
        showToast('Please select a star rating', 'warning');
        return;
    }
    
    const comment = document.getElementById('reviewComment').value.trim();
    const profile = await getUserProfile(user.id);
    const googleData = user.user_metadata || {};
    
    const btn = document.getElementById('submitReviewBtn');
    const btnText = btn.querySelector('span');
    const btnSpinner = btn.querySelector('.fa-spinner');
    
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    
    try {
        showToast('Uploading review...', 'info');
        
        let imageUrl = null;
        if (reviewImage) {
            const fileName = product.id + '/' + user.id + '_' + Date.now() + '.jpg';
            const { error: uploadError } = await supabaseClient.storage
                .from('reviews')
                .upload(fileName, reviewImage, { contentType: 'image/jpeg', upsert: false });
            
            if (!uploadError) {
                const { data: urlData } = supabaseClient.storage
                    .from('reviews').getPublicUrl(fileName);
                imageUrl = urlData.publicUrl;
            }
        }
        
        const reviewerName = profile?.full_name 
            || googleData.full_name 
            || googleData.name 
            || user.email.split('@')[0];
        
        const reviewerAvatar = profile?.avatar_url 
            || googleData.avatar_url 
            || googleData.picture 
            || null;
        
        const { error } = await supabaseClient
            .from('reviews')
            .insert([{
                product_id: product.id,
                user_id: user.id,
                reviewer_name: reviewerName,
                reviewer_avatar: reviewerAvatar,
                rating: selectedRating,
                comment: comment || null,
                image_url_1: imageUrl,
                is_approved: false
            }]);
        
        if (error) throw error;
        
        showToast('Review submitted! Waiting for approval.', 'success');
        
        selectedRating = 0;
        reviewImage = null;
        document.getElementById('reviewComment').value = '';
        document.getElementById('ratingText').textContent = 'Tap to rate';
        
        document.querySelectorAll('#starRating i').forEach(s => {
            s.classList.remove('fas', 'active');
            s.classList.add('far');
        });
        
        const slot = document.getElementById('slot1');
        slot.innerHTML = '<i class="fas fa-camera"></i><small>Tap to add photo</small>';
        slot.classList.remove('has-image');
        const inp = document.getElementById('reviewImage1');
        if (inp) inp.value = '';
        
        closeReviewModal();
    } catch (error) {
        console.error('Submit review error:', error);
        showToast('Failed to submit: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        if (btnText) btnText.style.display = 'inline-flex';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}
window.submitReview = submitReview;

console.log('✅ Product page loaded (v5 — CartModule integrated)');