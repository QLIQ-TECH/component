// Centralized API endpoints
// Configure base URLs via environment variables if available

export const BASES = {
  catalog: process.env.NEXT_PUBLIC_CATALOG_BASE_URL || 'https://backendcatalog.qliq.ae/api',
  search: process.env.NEXT_PUBLIC_SEARCH_BASE_URL || 'https://search.qliq.ae/api',
  auth: process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'https://backendauth.qliq.ae/api',
  cart: process.env.NEXT_PUBLIC_CART_BASE_URL || 'https://backendcart.qliq.ae/api',
  payment: process.env.NEXT_PUBLIC_PAYMENT_BASE_URL || 'https://backendcart.qliq.ae/api',
  delivery: process.env.NEXT_PUBLIC_PAYMENT_BASE_URL || 'https://backendcart.qliq.ae/api', // Same as payment service
  upload: process.env.NEXT_PUBLIC_UPLOAD_BASE_URL || 'https://ecomupload.qliq.ae/api',
  review: process.env.NEXT_PUBLIC_REVIEW_BASE_URL || 'https://backendreview.qliq.ae/api',
  subscription: process.env.NEXT_PUBLIC_SUBSCRIPTION_BASE_URL || 'https://backendamp.qliq.ae/api',
  wallet: process.env.NEXT_PUBLIC_WALLET_BASE_URL || 'https://backendwallet.qliq.ae/api',
}


// export const BASES = {
//   catalog: process.env.NEXT_PUBLIC_CATALOG_BASE_URL || (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? 'http://localhost:8003/api' : 'https://backendcatalog.qliq.ae/api'),
//   auth: process.env.NEXT_PUBLIC_AUTH_BASE_URL || (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? 'http://localhost:8888/api' : 'https://backendauth.qliq.ae/api'),
//   cart: process.env.NEXT_PUBLIC_CART_BASE_URL || (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? 'http://localhost:8002/api' : 'https://backendcart.qliq.ae/api'),
//   payment: process.env.NEXT_PUBLIC_PAYMENT_BASE_URL || (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' ? 'http://localhost:8002/api' : 'https://backendcart.qliq.ae/api'),
// }
// Catalog endpoints
export const catalog = {
  base: BASES.catalog,
  brands: `${BASES.catalog}/brands/top`,
  brandBySlug: (slug) => `${BASES.catalog}/brands/slug/${slug}`,
  products: `${BASES.catalog}/products`,
  productById: (id) => `${BASES.catalog}/products/${id}`,
  productBySlug: (id, slug) => `${BASES.catalog}/products/${id}/slug/${slug}`,
  productBySlugOnly: (slug) => `${BASES.catalog}/products/slug/${slug}`,
  productsByBrand: (brandSlug) => `${BASES.catalog}/products/brand/${brandSlug}`,
  productsByStore: (storeId) => `${BASES.catalog}/products/store/${storeId}`,
  productsByStoreSlug: (storeSlug, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const queryString = queryParams.toString();
    return `${BASES.catalog}/products/store-slug/${storeSlug}${queryString ? `?${queryString}` : ''}`;
  },
  hypermarketProducts: (storeId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    const queryString = queryParams.toString();
    return `${BASES.catalog}/products/hypermarket/${storeId}${queryString ? `?${queryString}` : ''}`;
  },
  hypermarketCheapDeals: (storeId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const queryString = queryParams.toString();
    return `${BASES.catalog}/products/hypermarket/${storeId}/cheap-deals${queryString ? `?${queryString}` : ''}`;
  },
  supermarketProducts: (storeId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    const queryString = queryParams.toString();
    return `${BASES.catalog}/products/supermarket/${storeId}${queryString ? `?${queryString}` : ''}`;
  },
  supermarketCheapDeals: (storeId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const queryString = queryParams.toString();
    return `${BASES.catalog}/products/supermarket/${storeId}/cheap-deals${queryString ? `?${queryString}` : ''}`;
  },
  storeProducts: (storeId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    const queryString = queryParams.toString();
    return `${BASES.catalog}/products/store-products/${storeId}${queryString ? `?${queryString}` : ''}`;
  },
  storeCheapDeals: (storeId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    const queryString = queryParams.toString();
    return `${BASES.catalog}/products/store-products/${storeId}/cheap-deals${queryString ? `?${queryString}` : ''}`;
  },
  productsByLevel4Category: (categorySlug) => `${BASES.catalog}/products/level4/${categorySlug}`,
  productsByLevel4AndStore: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.level4) queryParams.append('level4', params.level4);
    if (params.storeId) queryParams.append('storeId', params.storeId);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.min_price) queryParams.append('min_price', params.min_price);
    if (params.max_price) queryParams.append('max_price', params.max_price);
    if (params.min_rating) queryParams.append('min_rating', params.min_rating);
    if (params.in_stock !== undefined) queryParams.append('in_stock', params.in_stock);
    if (params.brand_id) {
      const brandIds = Array.isArray(params.brand_id) ? params.brand_id : [params.brand_id];
      brandIds.forEach(id => queryParams.append('brand_id', id));
    }
    // Handle attribute filters
    if (params.attributes) {
      Object.entries(params.attributes).forEach(([key, values]) => {
        const valuesArray = Array.isArray(values) ? values : [values];
        valuesArray.forEach(v => queryParams.append(`attr_${key}`, String(v)));
      });
    }
    // Handle specification filters
    if (params.specifications) {
      Object.entries(params.specifications).forEach(([key, values]) => {
        const valuesArray = Array.isArray(values) ? values : [values];
        valuesArray.forEach(v => queryParams.append(`spec_${key}`, String(v)));
      });
    }
    return `${BASES.catalog}/products/level4/store?${queryParams.toString()}`;
  },
  productsByCategory: (categoryId, limit = 100) => `${BASES.catalog}/products/category?categoryId=${categoryId}&limit=${limit}`,
  similarProducts: (productId, limit = 10) => `${BASES.catalog}/products/similar/${productId}?limit=${limit}`,
  stores: `${BASES.catalog}/stores`,
  storeBySlug: (slug) => `${BASES.catalog}/stores/slug/${slug}`,
  storesDiscovery: `${BASES.catalog}/stores/discovery`,
  fastestDelivery: (latitude, longitude, storeType) => `${BASES.catalog}/stores/deals/fastest-delivery?latitude=${latitude}&longitude=${longitude}${storeType ? `&storeType=${storeType}` : ''}`,
  bestCheapDeals: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.storeType) queryParams.append('storeType', params.storeType);
    if (params.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    return `${BASES.catalog}/stores/deals/best-cheap?${queryParams.toString()}`;
  },
  bestBundleDeals: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.storeType) queryParams.append('storeType', params.storeType);
    return `${BASES.catalog}/stores/deals/best-bundles?${queryParams.toString()}`;
  },
  popularCategories: `${BASES.catalog}/categories/level3`,
  level2Categories: `${BASES.catalog}/categories/level2`,
  hypermarketLevel2Categories: `${BASES.catalog}/categories/hypermarket/level2`,
  supermarketLevel2Categories: `${BASES.catalog}/categories/supermarket/level2`,
  storeLevel2Categories: `${BASES.catalog}/categories/store/level2`,
  categoryChildren: (slug) => `${BASES.catalog}/categories/level2/${slug}/children`,
  categoryBySlug: (slug) => `${BASES.catalog}/categories/slug/${slug}`,
  searchProducts: (query) => `${BASES.catalog}/search/products?q=${encodeURIComponent(query)}`,
  homepageSections: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    const queryString = queryParams.toString();
    return `${BASES.catalog}/homepage-sections${queryString ? `?${queryString}` : ''}`;
  },
}

// Search endpoints (new microservice)
export const search = {
  base: BASES.search,
  global: (query, type = 'all', page = 1, limit = 10) => `${BASES.search}/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}&limit=${limit}`,
  products: (query, params = {}) => {
    const usp = new URLSearchParams({ q: query, ...Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)) });
    return `${BASES.search}/search/products?${usp.toString()}`;
  },
  productsByLevel4: (params = {}) => {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'attributes') {
          // Handle nested objects for attributes
          // Backend expects: attr_color=red&attr_color=blue&attr_size=large
          if (typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(value).forEach(([attrKey, attrValues]) => {
              const valuesArray = Array.isArray(attrValues) ? attrValues : [attrValues];
              valuesArray.forEach(v => {
                usp.append(`attr_${attrKey}`, String(v));
              });
            });
          }
        } else if (key === 'specifications') {
          // Handle nested objects for specifications
          // Backend expects: spec_size=large&spec_weight=1kg
          if (typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(value).forEach(([specKey, specValues]) => {
              const valuesArray = Array.isArray(specValues) ? specValues : [specValues];
              valuesArray.forEach(v => {
                usp.append(`spec_${specKey}`, String(v));
              });
            });
          }
        } else if (Array.isArray(value)) {
          value.forEach(v => usp.append(key, String(v)));
        } else {
          usp.append(key, String(value));
        }
      }
    });
    return `${BASES.search}/search/products/level4?${usp.toString()}`;
  },
  suggestions: (query) => `${BASES.search}/search/suggestions?q=${encodeURIComponent(query)}`,
  byCategory: (categoryId, params = {}) => {
    const usp = new URLSearchParams({ categoryId, ...Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)) });
    return `${BASES.search}/search/category?${usp.toString()}`;
  },
  trending: (params = {}) => {
    const usp = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)));
    return `${BASES.search}/search/trending?${usp.toString()}`;
  },
  // Category filters endpoint
  categoryFilters: (slug, level) => `${BASES.search}/search/filters?slug=${encodeURIComponent(slug)}&level=${level}`,
  // Brand filters endpoint
  brandFilters: (slug) => `${BASES.search}/search/filters/brand?slug=${encodeURIComponent(slug)}`,
  // Store filters endpoint
  storeFilters: (storeId) => `${BASES.search}/search/filters/store?storeId=${encodeURIComponent(storeId)}`,
  // Store products endpoint
  storeProducts: (storeId, params = {}) => {
    const usp = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)));
    return `${BASES.search}/search/store/${encodeURIComponent(storeId)}/products?${usp.toString()}`;
  },
  // Search filters endpoint
  searchFilters: (query, params = {}) => {
    const usp = new URLSearchParams({ q: query, ...Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)) });
    return `${BASES.search}/search/filters/search?${usp.toString()}`;
  },
}

// Auth endpoints (auth base is explicitly namespaced with /auth as requested)
export const auth = {
  base: `${BASES.auth}/auth`,
  login: `${BASES.auth}/auth/login`,
  register: `${BASES.auth}/auth/signup`,
  me: `${BASES.auth}/auth/me`,
  profile: `${BASES.auth}/auth/profile`,
  updateProfile: `${BASES.auth}/auth/profile`,
  changePassword: `${BASES.auth}/auth/change-password`,
}

export const cart = {
  base: BASES.cart,
  add: `${BASES.cart}/cart/add`,
  get: `${BASES.cart}/cart`,
  update: `${BASES.cart}/cart/update`,
  remove: `${BASES.cart}/cart/remove`,
  moveToWishlist: `${BASES.cart}/wishlist/add`,
  wishlistAdd: `${BASES.cart}/wishlist/add`,
  wishlistGet: `${BASES.cart}/wishlist`,
  wishlistRemove: `${BASES.cart}/wishlist/remove`,
  wishlistMoveToCart: `${BASES.cart}/wishlist/move-to-cart`,
}

export const payment = {
  base: BASES.payment,
  stripeCheckout: `${BASES.payment}/payment/stripe/checkout`,
  stripeHostedCheckout: `${BASES.payment}/payment/stripe/hosted-checkout`,
  cashWalletCheckout: `${BASES.payment}/payment/cash-wallet/checkout`,
}

export const addresses = {
  base: `${BASES.auth}/addresses`,
  get: `${BASES.auth}/addresses`,
  create: `${BASES.auth}/addresses`,
  update: `${BASES.auth}/addresses`,
  delete: `${BASES.auth}/addresses`,
  setDefault: `${BASES.auth}/addresses/default`,
}

export const orders = {
  base: `${BASES.cart}/orders`,
  getUserOrders: `${BASES.cart}/orders/user-orders`,
  getOrderById: (orderId) => `${BASES.cart}/orders/${orderId}`,
}


export const upload = {
  base: `${BASES.upload}/upload`,
  single: `${BASES.upload}/upload/single`,
  image: `${BASES.upload}/upload/image`,
  multiple: `${BASES.upload}/upload/multiple`,
  images: `${BASES.upload}/upload/images`,
  reviewImages: `${BASES.upload}/upload/review-images`,
  productImages: `${BASES.upload}/upload/product-images`,
  categoryIcon: `${BASES.upload}/upload/category-icon`,
  delete: `${BASES.upload}/upload`,
  deleteMultiple: `${BASES.upload}/upload/multiple`,
}

export const review = {
  base: `${BASES.review}/reviews`,
  create: `${BASES.review}/product-reviews/product`,
  createByProductId: (productId) => `${BASES.review}/product-reviews/product/${productId}/review`, // Direct review by product ID (no validation)
  getByProduct: (productId) => `${BASES.review}/product-reviews/product/${productId}`, // Updated to new endpoint
  getById: (reviewId) => `${BASES.review}/product-reviews/${reviewId}`,
  update: (reviewId) => `${BASES.review}/product-reviews/${reviewId}`,
  delete: (reviewId) => `${BASES.review}/product-reviews/${reviewId}`,
  markHelpful: (reviewId) => `${BASES.review}/product-reviews/${reviewId}/helpful`,
  statistics: (productId) => `${BASES.review}/product-reviews/statistics/product/${productId}`,
  userReviews: `${BASES.review}/product-reviews/user/product-reviews`,
}

export const subscription = {
  base: BASES.subscription,
  details: `${BASES.subscription}/users/subscription-details`,
  webSubscription: `https://backendpayment.qliq.ae/api/wallet/web-subscription`,
}

export const wallet = {
  base: BASES.wallet,
  userBalance: `${BASES.wallet}/wallet/qoyn/user-balance`,
  validateRedemption: `${BASES.wallet}/wallet/qoyn/validate-redemption`,
  redeemQoyn: `${BASES.wallet}/wallet/qoyn/redeem`,
  redeemableCashBalance: `${BASES.wallet}/wallet/cash/redeemable-balance`,
  redeemCash: `${BASES.wallet}/wallet/cash/redeem`,
}

export const delivery = {
  base: BASES.delivery,
  getShippingMethods: `${BASES.delivery}/delivery/shipping/methods`,
}

export const zones = {
  base: `${BASES.auth}/zones`,
  getCountries: `${BASES.auth}/zones/countries`,
  getCitiesByCountry: (countryName) => `${BASES.auth}/zones/country/${encodeURIComponent(countryName)}/cities`,
  getZonesByCity: (cityName) => `${BASES.auth}/zones/city/${encodeURIComponent(cityName)}`,
}

export const settler = {
  base: `${BASES.auth}/settlers`,
  create: `${BASES.auth}/settlers`,
  getByEmail: (email) => `${BASES.auth}/settlers/email/${email}`,
}

export default { catalog, search, auth, cart, addresses, orders, upload, review, subscription, wallet, delivery, settler }


