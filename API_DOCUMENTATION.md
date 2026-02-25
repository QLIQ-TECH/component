# QLIQ API Documentation

Complete API reference organized by **pages**, with endpoints, request/response examples, cURL commands, and usage locations.

---

## 📋 Table of Contents

- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [1. Discovery Page](#1-discovery-page)
- [2. Hypermarket Page](#2-hypermarket-page)
- [3. Store Pages](#3-store-pages)
- [4. Supermarket Page](#4-supermarket-page)
- [5. E-shop Page](#5-e-shop-page)
- [6. Cart](#6-cart)
- [7. Wishlist](#7-wishlist)
- [8. Profile Page](#8-profile-page)
- [9. Checkout Page](#9-checkout-page)
- [10. Order History Page](#10-order-history-page)
- [11. Subscription Page](#11-subscription-page)
- [12. Product Detail Page](#12-product-detail-page)
- [13. Search Page](#13-search-page)
- [14. Category Page](#14-category-page)
- [15. Homepage](#15-homepage)
- [16. Other Pages & Components](#16-other-pages--components)

---

## Base URLs

| Service | Development | Production |
|---------|-------------|------------|
| Catalog | `http://localhost:8082/api` | `https://backendcatalog.qliq.ae/api` |
| Search | `http://localhost:8080/api` | `https://search.qliq.ae/api` |
| Auth | `http://localhost:8888/api` | `https://backendauth.qliq.ae/api` |
| Cart/Payment | `http://localhost:8084/api` | `https://backendcart.qliq.ae/api` |
| Review | `http://localhost:8008/api` | `https://backendreview.qliq.ae/api` |
| Upload | `http://localhost:5005/api` | `https://backendupload.qliq.ae/api` |
| Subscription | `https://backendamp.qliq.ae/api` | `https://backendamp.qliq.ae/api` |
| Wallet | `https://backendwallet.qliq.ae/api` | `https://backendwallet.qliq.ae/api` |

---

## Authentication

Most protected endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 1. Discovery Page

**Page Location:** `app/discovery/page.jsx`

### 1.1 Get Stores Discovery

**Endpoint:** `GET /api/stores/discovery`

**Description:** Get new stores and top stores for discovery page

**Used In:**
- 📄 `app/discovery/page.jsx` - Discovery page

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/stores/discovery" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "newStores": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Store Name",
        "slug": "store-name",
        "logo": "https://example.com/logo.jpg",
        "description": "Store description",
        "isTopStore": false
      }
    ],
    "topStores": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Top Store",
        "slug": "top-store",
        "logo": "https://example.com/logo.jpg",
        "isTopStore": true
      }
    ]
  }
}
```

---

## 2. Hypermarket Page

**Page Location:** `app/hypermarket/page.jsx`

### 2.1 Get Hypermarket Products

**Endpoint:** `GET /api/products/hypermarket/:storeId`

**Description:** Get products from a hypermarket store

**Used In:**
- 📄 `app/hypermarket/page.jsx` - Hypermarket page
- 📄 `app/category/[slug]/page.jsx` - Category pages for hypermarket
- 🔧 Redux: `store/slices/productsSlice.js` - `fetchHypermarketProducts` action

**Query Parameters:**
- `limit` (optional): Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products/hypermarket/507f1f77bcf86cd799439012?limit=20" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bestSellers": [],
    "offers": [],
    "newArrivals": []
  }
}
```

---

### 2.2 Get Hypermarket Level 2 Categories

**Endpoint:** `GET /api/categories/hypermarket/level2`

**Description:** Get level 2 categories for hypermarket

**Used In:**
- 📄 `app/hypermarket/page.jsx` - Hypermarket page
- 📄 `app/hypermarketDetail/page.jsx` - Hypermarket detail page
- 📄 `app/category/[slug]/page.jsx` - Category pages
- 🔧 Redux: `store/slices/categoriesSlice.js` - `fetchHypermarketLevel2Categories` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/categories/hypermarket/level2" \
  -H "Content-Type: application/json"
```

---

### 2.3 Get Best Cheap Deals (Hypermarket)

**Endpoint:** `GET /api/stores/deals/best-cheap`

**Description:** Get best cheap deals for hypermarket

**Used In:**
- 📄 `app/hypermarket/page.jsx` - Hypermarket page

**Query Parameters:**
- `storeType`: "hypermarket"
- `page`: Page number
- `limit`: Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/stores/deals/best-cheap?storeType=hypermarket&page=1&limit=20" \
  -H "Content-Type: application/json"
```

---

### 2.4 Get Hypermarket Cheap Deals

**Endpoint:** `GET /api/products/hypermarket/:storeId/cheap-deals`

**Description:** Get products with discount from hypermarket

**Used In:**
- 📄 `app/hypermarket/page.jsx` - Hypermarket page

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products/hypermarket/507f1f77bcf86cd799439012/cheap-deals?page=1&limit=20" \
  -H "Content-Type: application/json"
```

---

### 2.5 Get Fastest Delivery Stores

**Endpoint:** `GET /api/stores/deals/fastest-delivery`

**Description:** Get stores with fastest delivery

**Used In:**
- 📄 `app/hypermarket/page.jsx` - Hypermarket page
- 📄 `app/supermarket/page.jsx` - Supermarket page
- 📄 `app/stores/page.jsx` - Stores page

**Query Parameters:**
- `latitude`: User latitude
- `longitude`: User longitude
- `storeType` (optional): Store type filter

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/stores/deals/fastest-delivery?latitude=25.2048&longitude=55.2708&storeType=hypermarket" \
  -H "Content-Type: application/json"
```

---

## 3. Store Pages

**Page Locations:** 
- `app/stores/page.jsx` - Stores listing page
- `app/storeDetail/page.jsx` - Store detail page
- `app/[slug]/page.jsx` - Dynamic store pages

### 3.1 Get All Stores

**Endpoint:** `GET /api/stores`

**Description:** Get all stores

**Used In:**
- 📄 `app/stores/page.jsx` - Stores listing page
- 🔧 Redux: `store/slices/storesSlice.js` - `fetchStores` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/stores" \
  -H "Content-Type: application/json"
```

---

### 3.2 Get Store by Slug

**Endpoint:** `GET /api/stores/slug/:slug`

**Description:** Get a store by its slug

**Used In:**
- 📄 `app/[slug]/page.jsx` - Dynamic store pages
- 📄 `app/category/[slug]/page.jsx` - Category pages

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/stores/slug/store-name" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Store Name",
    "slug": "store-name",
    "description": "Store description",
    "logo": "https://example.com/logo.jpg",
    "email": "store@example.com",
    "phone": "+971501234567",
    "address": "Store address",
    "isActive": true
  }
}
```

---

### 3.3 Get Store Products

**Endpoint:** `GET /api/products/store-products/:storeId`

**Description:** Get products from a general store

**Used In:**
- 📄 `app/storeDetail/page.jsx` - Store detail page
- 📄 `app/category/[slug]/page.jsx` - Category pages for stores
- 🔧 Redux: `store/slices/productsSlice.js` - `fetchStoreProductsByStoreId` action

**Query Parameters:**
- `limit` (optional): Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products/store-products/507f1f77bcf86cd799439012?limit=20" \
  -H "Content-Type: application/json"
```

---

### 3.4 Get Store Products by Slug

**Endpoint:** `GET /api/products/store-slug/:storeSlug`

**Description:** Get products for a specific store by store slug

**Used In:**
- 📄 `app/[slug]/page.jsx` - Store product listing page
- 🔧 Redux: `store/slices/productsSlice.js` - `fetchProductsByStoreSlug` action

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products/store-slug/store-name?page=1&limit=20" \
  -H "Content-Type: application/json"
```

---

### 3.5 Get Store Filters

**Endpoint:** `GET /api/search/filters/store`

**Description:** Get available filters for store products

**Used In:**
- 📄 `app/[slug]/page.jsx` - Store product listing with filters

**Query Parameters:**
- `storeId`: Store ID (required)
- Additional filter parameters

**cURL Command:**
```bash
curl -X GET "https://search.qliq.ae/api/search/filters/store?storeId=507f1f77bcf86cd799439012" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "priceRange": {
      "min": 10,
      "max": 1000
    },
    "brands": [],
    "attributes": {},
    "specifications": {}
  }
}
```

---

### 3.6 Get Store Products (Search Service)

**Endpoint:** `GET /api/search/store/:storeId/products`

**Description:** Get products from a specific store with filters

**Used In:**
- 📄 `app/storeDetail/page.jsx` - Store detail page
- 📄 `app/[slug]/page.jsx` - Store product listing

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- Additional filter parameters

**cURL Command:**
```bash
curl -X GET "https://search.qliq.ae/api/search/store/507f1f77bcf86cd799439012/products?page=1&limit=20" \
  -H "Content-Type: application/json"
```

---

### 3.7 Get Store Level 2 Categories

**Endpoint:** `GET /api/categories/store/level2`

**Description:** Get level 2 categories for stores

**Used In:**
- 📄 `app/category/[slug]/page.jsx` - Category pages for stores
- 🔧 Redux: `store/slices/categoriesSlice.js` - `fetchStoreLevel2Categories` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/categories/store/level2" \
  -H "Content-Type: application/json"
```

---

## 4. Supermarket Page

**Page Location:** `app/supermarket/page.jsx`

### 4.1 Get Supermarket Products

**Endpoint:** `GET /api/products/supermarket/:storeId`

**Description:** Get products from a supermarket store

**Used In:**
- 📄 `app/supermarket/page.jsx` - Supermarket page
- 📄 `app/category/[slug]/page.jsx` - Category pages for supermarket
- 🔧 Redux: `store/slices/productsSlice.js` - `fetchSupermarketProducts` action

**Query Parameters:**
- `limit` (optional): Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products/supermarket/507f1f77bcf86cd799439012?limit=20" \
  -H "Content-Type: application/json"
```

---

### 4.2 Get Supermarket Level 2 Categories

**Endpoint:** `GET /api/categories/supermarket/level2`

**Description:** Get level 2 categories for supermarket

**Used In:**
- 📄 `app/supermarket/page.jsx` - Supermarket page
- 📄 `app/category/[slug]/page.jsx` - Category pages
- 🔧 Redux: `store/slices/categoriesSlice.js` - `fetchSupermarketLevel2Categories` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/categories/supermarket/level2" \
  -H "Content-Type: application/json"
```

---

### 4.3 Get Best Cheap Deals (Supermarket)

**Endpoint:** `GET /api/stores/deals/best-cheap`

**Description:** Get best cheap deals for supermarket

**Used In:**
- 📄 `app/supermarket/page.jsx` - Supermarket page

**Query Parameters:**
- `storeType`: "supermarket"
- `page`: Page number
- `limit`: Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/stores/deals/best-cheap?storeType=supermarket&page=1&limit=20" \
  -H "Content-Type: application/json"
```

---

### 4.4 Get Supermarket Cheap Deals

**Endpoint:** `GET /api/products/supermarket/:storeId/cheap-deals`

**Description:** Get products with discount from supermarket

**Used In:**
- 📄 `app/supermarket/page.jsx` - Supermarket page

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products/supermarket/507f1f77bcf86cd799439012/cheap-deals?page=1&limit=20" \
  -H "Content-Type: application/json"
```

---

## 5. E-shop Page

**Page Location:** `app/eshop/page.jsx`

### 5.1 Get Products

**Endpoint:** `GET /api/products`

**Description:** Retrieve a list of products with optional filtering

**Used In:**
- 📄 `app/eshop/page.jsx` - E-shop page
- 📄 `app/page.jsx` - Homepage
- 🔧 Redux: `store/slices/productsSlice.js` - `fetchProducts` action

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sort` (optional): Sort order

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products?page=1&limit=20" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Product Name",
      "slug": "product-name",
      "price": 99.99,
      "discount": 10,
      "rating": 4.5,
      "images": ["https://example.com/image.jpg"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

### 5.2 Get Top Brands

**Endpoint:** `GET /api/brands/top`

**Description:** Get top brands

**Used In:**
- 📄 `app/eshop/page.jsx` - E-shop page
- 📄 `app/page.jsx` - Homepage
- 🔧 Redux: `store/slices/brandsSlice.js` - `fetchBrands` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/brands/top" \
  -H "Content-Type: application/json"
```

---

### 5.3 Get E-commerce Stores

**Endpoint:** `GET /api/stores`

**Description:** Get all stores (filtered for e-commerce)

**Used In:**
- 📄 `app/eshop/page.jsx` - E-shop page
- 🔧 Redux: Store slice actions

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/stores" \
  -H "Content-Type: application/json"
```

---

### 5.4 Get E-commerce Level 2 Categories

**Endpoint:** `GET /api/categories/ecommerce/level2`

**Description:** Get level 2 categories for e-commerce

**Used In:**
- 📄 `app/eshop/page.jsx` - E-shop page
- 🔧 Redux: `store/slices/categoriesSlice.js` - `fetchEcommerceCategories` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/categories/ecommerce/level2" \
  -H "Content-Type: application/json"
```

---

### 5.5 Get E-commerce Level 3 Categories

**Endpoint:** `GET /api/categories/ecommerce/level3`

**Description:** Get level 3 categories for e-commerce

**Used In:**
- 📄 `app/eshop/page.jsx` - E-shop page
- 🔧 Redux: `store/slices/categoriesSlice.js` - `fetchEcommerceLevel3Categories` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/categories/ecommerce/level3" \
  -H "Content-Type: application/json"
```

---

## 6. Cart

**Component Location:** `components/CartDrawer.jsx`

### 6.1 Get Cart

**Endpoint:** `GET /api/cart`

**Description:** Get the user's cart

**Used In:**
- 📦 `components/CartDrawer.jsx` - Cart drawer component
- 📄 `app/checkout/page.jsx` - Checkout page
- 🔧 Redux: `store/slices/cartSlice.js` - `fetchCart` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendcart.qliq.ae/api/cart?userId=507f1f77bcf86cd799439017" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cart": {
      "_id": "507f1f77bcf86cd799439018",
      "userId": "507f1f77bcf86cd799439017",
      "items": [],
      "totalItems": 0,
      "totalPrice": 0
    }
  }
}
```

---

### 6.2 Add to Cart

**Endpoint:** `POST /api/cart/add`

**Description:** Add a product to the user's cart

**Used In:**
- 📦 `components/ProductCard.jsx` - Product card component
- 📦 `components/productDetailPage/ProductDetails.jsx` - Product details component
- 🔧 Redux: `store/slices/cartSlice.js` - `addToCart` action

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

**cURL Command:**
```bash
curl -X POST "https://backendcart.qliq.ae/api/cart/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "quantity": 2
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Product added to cart successfully",
  "data": {
    "cart": {
      "_id": "507f1f77bcf86cd799439018",
      "userId": "507f1f77bcf86cd799439017",
      "items": [],
      "total": 199.98
    }
  }
}
```

---

### 6.2.1 Click Cart (Add Multiple Products)

**Endpoint:** `POST /api/cart/click-cart`

**Description:** Add multiple products to cart at once. Each product is added with quantity 1 (or the specified quantity). Returns the full cart in the same format as Get Cart.

**Used In:**
- 🔧 Redux: `store/slices/cartSlice.js` - `clickCart` action

**Authentication:** Required

**Request Body:**
```json
{
  "productIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "quantity": 1
}
```

**cURL Command:**
```bash
curl -X POST "https://backendcart.qliq.ae/api/cart/click-cart" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "quantity": 1
  }'
```

**Response:** Same format as Get Cart - returns full cart with populated items, totalItems, totalPrice.

---

### 6.3 Update Cart Item

**Endpoint:** `PUT /api/cart/update`

**Description:** Update quantity of a cart item

**Used In:**
- 📦 `components/CartDrawer.jsx` - Cart drawer
- 📦 `components/ProductCard.jsx` - Product card (quantity controls)
- 🔧 Redux: `store/slices/cartSlice.js` - `updateCartItem` action

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 3
}
```

**cURL Command:**
```bash
curl -X PUT "https://backendcart.qliq.ae/api/cart/update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "quantity": 3
  }'
```

---

### 6.4 Remove from Cart

**Endpoint:** `DELETE /api/cart/remove`

**Description:** Remove a product from cart

**Used In:**
- 📦 `components/CartDrawer.jsx` - Cart drawer
- 📦 `components/ProductCard.jsx` - Product card
- 🔧 Redux: `store/slices/cartSlice.js` - `removeFromCart` action

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011"
}
```

**cURL Command:**
```bash
curl -X DELETE "https://backendcart.qliq.ae/api/cart/remove" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011"
  }'
```

---

### 6.5 Clear Cart

**Endpoint:** `DELETE /api/cart/clear`

**Description:** Clear all items from cart

**Used In:**
- 📄 `app/checkout/success/page.jsx` - Order success page
- 🔧 Redux: `store/slices/cartSlice.js` - `clearCart` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X DELETE "https://backendcart.qliq.ae/api/cart/clear" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 6.6 Move from Cart to Wishlist

**Endpoint:** `POST /api/wishlist/add`

**Description:** Move a product from cart to wishlist

**Used In:**
- 📦 `components/CartDrawer.jsx` - Cart drawer
- 🔧 Redux: `store/slices/cartSlice.js` - `moveToWishlist` action

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011"
}
```

**cURL Command:**
```bash
curl -X POST "https://backendcart.qliq.ae/api/wishlist/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011"
  }'
```

---

## 7. Wishlist

**Component Location:** `components/WishlistDrawer.jsx`

### 7.1 Get Wishlist

**Endpoint:** `GET /api/wishlist`

**Description:** Get user's wishlist

**Used In:**
- 📦 `components/WishlistDrawer.jsx` - Wishlist drawer component
- 📦 `components/CartDrawer.jsx` - Cart drawer (fetches wishlist)
- 🔧 Redux: `store/slices/wishlistSlice.js` - `fetchWishlist` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendcart.qliq.ae/api/wishlist" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wishlist": {
      "_id": "507f1f77bcf86cd799439019",
      "userId": "507f1f77bcf86cd799439017",
      "items": [
        {
          "productId": "507f1f77bcf86cd799439011",
          "name": "Product Name",
          "price": 99.99,
          "image": "https://example.com/image.jpg"
        }
      ]
    }
  }
}
```

---

### 7.2 Add to Wishlist

**Endpoint:** `POST /api/wishlist/add`

**Description:** Add a product to wishlist

**Used In:**
- 📦 `components/ProductCard.jsx` - Product card
- 📦 `components/productDetailPage/ProductDetails.jsx` - Product details
- 🔧 Redux: `store/slices/wishlistSlice.js` - `addToWishlist` action

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011"
}
```

**cURL Command:**
```bash
curl -X POST "https://backendcart.qliq.ae/api/wishlist/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011"
  }'
```

---

### 7.3 Remove from Wishlist

**Endpoint:** `DELETE /api/wishlist/remove`

**Description:** Remove a product from wishlist

**Used In:**
- 📦 `components/WishlistDrawer.jsx` - Wishlist drawer
- 📦 `components/ProductCard.jsx` - Product card
- 🔧 Redux: `store/slices/wishlistSlice.js` - `removeFromWishlist` action

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011"
}
```

**cURL Command:**
```bash
curl -X DELETE "https://backendcart.qliq.ae/api/wishlist/remove" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011"
  }'
```

---

### 7.4 Move from Wishlist to Cart

**Endpoint:** `POST /api/wishlist/move-to-cart`

**Description:** Move a product from wishlist to cart

**Used In:**
- 📦 `components/WishlistDrawer.jsx` - Wishlist drawer
- 🔧 Redux: `store/slices/wishlistSlice.js` - `moveToCart` action

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 1
}
```

**cURL Command:**
```bash
curl -X POST "https://backendcart.qliq.ae/api/wishlist/move-to-cart" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "quantity": 1
  }'
```

---

## 8. Profile Page

**Page Location:** `app/profile/page.jsx`

### 8.1 Get User Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Get authenticated user's profile

**Used In:**
- 📄 `app/profile/page.jsx` - Profile page
- 📄 `app/checkout/page.jsx` - Checkout page
- 🔧 Redux: `store/slices/profileSlice.js` - `fetchProfile` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendauth.qliq.ae/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+971501234567"
  }
}
```

---

### 8.2 Get Aggregated Profile

**Endpoint:** `GET /api/auth/profile/aggregated`

**Description:** Get user profile with aggregated information

**Used In:**
- 📄 `app/profile/page.jsx` - Profile page
- 🔧 Redux: `store/slices/profileSlice.js` - `fetchProfile` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendauth.qliq.ae/api/auth/profile/aggregated" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 8.3 Update User Profile

**Endpoint:** `PUT /api/auth/profile`

**Description:** Update authenticated user's profile

**Used In:**
- 📦 `components/profile/PersonalInfo/PersonalInfo.jsx` - Personal info component
- 📄 `app/profile/page.jsx` - Profile page

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+971501234567"
}
```

**cURL Command:**
```bash
curl -X PUT "https://backendauth.qliq.ae/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+971501234567"
  }'
```

---

### 8.4 Change Password

**Endpoint:** `POST /api/auth/change-password`

**Description:** Change user password

**Used In:**
- 📦 `components/profile/PersonalInfo/PersonalInfo.jsx` - Personal info component

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**cURL Command:**
```bash
curl -X POST "https://backendauth.qliq.ae/api/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

---

### 8.5 Upload Profile Image

**Endpoint:** `POST /api/upload/image`

**Description:** Upload a single image file (for profile picture)

**Used In:**
- 📦 `components/profile/PersonalInfo/PersonalInfo.jsx` - Profile image upload

**Authentication:** Required

**Request:** Multipart form data with file field

**cURL Command:**
```bash
curl -X POST "https://backendupload.qliq.ae/api/upload/image" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://s3.amazonaws.com/bucket/image.jpg",
    "key": "uploads/image.jpg"
  }
}
```

---

### 8.6 Get User Addresses

**Endpoint:** `GET /api/addresses`

**Description:** Get all addresses for authenticated user

**Used In:**
- 📄 `app/profile/page.jsx` - Profile page (addresses tab)
- 📄 `app/checkout/page.jsx` - Checkout page
- 📦 `components/profile/NewAddress/newAddress.jsx` - New address component
- 🔧 Redux: `store/slices/profileSlice.js` - `fetchUserAddresses` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendauth.qliq.ae/api/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "userId": "507f1f77bcf86cd799439017",
      "type": "home",
      "isDefault": true,
      "fullName": "John Doe",
      "phone": "+971501234567",
      "addressLine1": "123 Main Street",
      "city": "Dubai",
      "country": "UAE"
    }
  ]
}
```

---

### 8.7 Create Address

**Endpoint:** `POST /api/addresses`

**Description:** Create a new address

**Used In:**
- 📦 `components/profile/NewAddress/newAddress.jsx` - New address component
- 📄 `app/checkout/page.jsx` - Checkout page (add new address)
- 🔧 Redux: Address slice actions

**Authentication:** Required

**Request Body:**
```json
{
  "type": "home",
  "isDefault": false,
  "fullName": "John Doe",
  "phone": "+971501234567",
  "email": "user@example.com",
  "addressLine1": "123 Main Street",
  "city": "Dubai",
  "country": "UAE"
}
```

**cURL Command:**
```bash
curl -X POST "https://backendauth.qliq.ae/api/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "home",
    "isDefault": false,
    "fullName": "John Doe",
    "phone": "+971501234567",
    "addressLine1": "123 Main Street",
    "city": "Dubai",
    "country": "UAE"
  }'
```

---

### 8.8 Update Address

**Endpoint:** `PUT /api/addresses/:addressId`

**Description:** Update an existing address

**Used In:**
- 📦 `components/profile/NewAddress/newAddress.jsx` - New address component (edit mode)

**Authentication:** Required

**cURL Command:**
```bash
curl -X PUT "https://backendauth.qliq.ae/api/addresses/507f1f77bcf86cd799439020" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "fullName": "John Doe Updated",
    "phone": "+971501234567"
  }'
```

---

### 8.9 Set Default Address

**Endpoint:** `PATCH /api/addresses/:addressId/default`

**Description:** Set an address as default

**Used In:**
- 📄 `app/profile/page.jsx` - Profile page
- 🔧 Redux: `store/slices/profileSlice.js` - `setDefaultAddress` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X PATCH "https://backendauth.qliq.ae/api/addresses/507f1f77bcf86cd799439020/default" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 8.10 Get User Orders

**Endpoint:** `GET /api/orders/user-orders-flattened`

**Description:** Get all orders for authenticated user (flattened format)

**Used In:**
- 📄 `app/profile/page.jsx` - Profile page (orders tab)
- 📄 `app/orderhistory/page.jsx` - Order history page
- 🔧 Redux: `store/slices/profileSlice.js` - `fetchOrders` action

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcart.qliq.ae/api/orders/user-orders-flattened?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "orderId": "507f1f77bcf86cd799439022",
        "orderNumber": "ORD-1234567890-ABC123",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "status": "pending",
        "paymentStatus": "paid",
        "totalAmount": 99.99
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalOrders": 6
    }
  }
}
```

---

## 9. Checkout Page

**Page Location:** `app/checkout/page.jsx`

### 9.1 Get Cart (Checkout)

**Endpoint:** `GET /api/cart`

**Description:** Get the user's cart for checkout

**Used In:**
- 📄 `app/checkout/page.jsx` - Checkout page
- 🔧 Redux: `store/slices/cartSlice.js` - `fetchCart` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendcart.qliq.ae/api/cart?userId=507f1f77bcf86cd799439017" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 9.2 Get User Addresses (Checkout)

**Endpoint:** `GET /api/addresses`

**Description:** Get all addresses for checkout page

**Used In:**
- 📄 `app/checkout/page.jsx` - Checkout page
- 🔧 Redux: `store/slices/profileSlice.js` - `fetchUserAddresses` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendauth.qliq.ae/api/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 9.3 Create Address (Checkout)

**Endpoint:** `POST /api/addresses`

**Description:** Create a new address during checkout

**Used In:**
- 📄 `app/checkout/page.jsx` - Checkout page (add new address)
- 🔧 Redux: Checkout slice actions

**Authentication:** Required

**cURL Command:**
```bash
curl -X POST "https://backendauth.qliq.ae/api/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "home",
    "fullName": "John Doe",
    "phone": "+971501234567",
    "addressLine1": "123 Main Street",
    "city": "Dubai",
    "country": "UAE"
  }'
```

---

### 9.4 Get Shipping Methods

**Endpoint:** `GET /api/delivery/shipping/methods`

**Description:** Get available shipping methods

**Used In:**
- 📄 `app/checkout/page.jsx` - Checkout page (shipping selection)

**Query Parameters:**
- `latitude`: User latitude
- `longitude`: User longitude
- Additional parameters

**cURL Command:**
```bash
curl -X GET "https://backendcart.qliq.ae/api/delivery/shipping/methods?latitude=25.2048&longitude=55.2708" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 9.5 Get Wallet Balance (Checkout)

**Endpoint:** `GET /api/wallet/qoyn/user-balance`

**Description:** Get user wallet balance for checkout

**Used In:**
- 📄 `app/checkout/page.jsx` - Checkout page (wallet payment option)
- 🔧 Redux: `store/slices/walletSlice.js` - `fetchUserBalance` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendwallet.qliq.ae/api/wallet/qoyn/user-balance" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 9.6 Validate Qoyn Redemption

**Endpoint:** `POST /api/wallet/qoyn/validate-redemption`

**Description:** Validate Qoyn redemption before checkout

**Used In:**
- 📄 `app/checkout/page.jsx` - Checkout page (Qoyn discount)
- 🔧 Redux: Checkout slice actions

**Authentication:** Required

**Request Body:**
```json
{
  "totalAmount": 99.99
}
```

**cURL Command:**
```bash
curl -X POST "https://backendwallet.qliq.ae/api/wallet/qoyn/validate-redemption" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "totalAmount": 99.99
  }'
```

---

### 9.7 Create Stripe Checkout Session

**Endpoint:** `POST /api/payment/stripe/checkout`

**Description:** Create a Stripe payment checkout session

**Used In:**
- 📄 `app/checkout/page.jsx` - Checkout page
- 🔧 Redux: Payment slice actions

**Authentication:** Required

**Request Body:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 1,
      "price": 99.99,
      "name": "Product Name",
      "image": "https://example.com/image.jpg"
    }
  ],
  "total": 99.99,
  "currency": "aed",
  "userId": "507f1f77bcf86cd799439017",
  "deliveryAddress": {}
}
```

**cURL Command:**
```bash
curl -X POST "https://backendcart.qliq.ae/api/payment/stripe/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "items": [{
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 1,
      "price": 99.99,
      "name": "Product Name"
    }],
    "total": 99.99,
    "currency": "aed",
    "userId": "507f1f77bcf86cd799439017"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Checkout session created successfully",
  "data": {
    "paymentIntentId": "pi_3SNqMbGXoMo2UGUq1qpbdqaJ",
    "clientSecret": "pi_3SNqMbGXoMo2UGUq1qpbdqaJ_secret_...",
    "totalAmount": 99.99,
    "currency": "aed",
    "status": "pending"
  }
}
```

---

### 9.8 Confirm Payment

**Endpoint:** `GET /api/payment/stripe/confirm/:paymentIntentId`

**Description:** Confirm payment after successful Stripe payment

**Used In:**
- 📄 `app/checkout/success/page.jsx` - Order success page

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendcart.qliq.ae/api/payment/stripe/confirm/pi_3SNqMbGXoMo2UGUq1qpbdqaJ" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "paymentIntentId": "pi_3SNqMbGXoMo2UGUq1qpbdqaJ",
    "status": "succeeded",
    "totalAmount": 99.99,
    "currency": "aed"
  }
}
```

---

## 10. Order History Page

**Page Location:** `app/orderhistory/page.jsx`

### 10.1 Get User Orders

**Endpoint:** `GET /api/orders/user-orders-flattened`

**Description:** Get all orders for authenticated user (flattened format)

**Used In:**
- 📄 `app/orderhistory/page.jsx` - Order history page
- 📄 `app/profile/page.jsx` - Profile page (orders tab)
- 🔧 Redux: `store/slices/profileSlice.js` - `fetchOrders` action

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**cURL Command:**
```bash
curl -X GET "https://backendcart.qliq.ae/api/orders/user-orders-flattened?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "orderId": "507f1f77bcf86cd799439022",
        "orderNumber": "ORD-1234567890-ABC123",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "status": "pending",
        "paymentStatus": "paid",
        "totalAmount": 99.99,
        "productId": "507f1f77bcf86cd799439011",
        "name": "Product Name",
        "quantity": 1,
        "price": 99.99
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalOrders": 6
    }
  }
}
```

---

### 10.2 Get User Reviews

**Endpoint:** `GET /api/product-reviews/user/product-reviews`

**Description:** Get all reviews by the authenticated user

**Used In:**
- 📄 `app/orderhistory/page.jsx` - Order history page (shows user's reviews)

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendreview.qliq.ae/api/product-reviews/user/product-reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 10.3 Create Product Review

**Endpoint:** `POST /api/product-reviews/product/:productId/review`

**Description:** Create a new product review

**Used In:**
- 📄 `app/orderhistory/page.jsx` - Order history (create review from order)
- 📦 `components/ReviewForm/ReviewForm.jsx` - Review form component
- 🔧 Redux: `store/slices/reviewSlice.js` - `createProductReview` action

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "rating": 5,
  "title": "Great product!",
  "comment": "This product exceeded my expectations.",
  "images": [],
  "pros": ["High quality"],
  "cons": []
}
```

**cURL Command:**
```bash
curl -X POST "https://backendreview.qliq.ae/api/product-reviews/product/507f1f77bcf86cd799439011/review" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "rating": 5,
    "title": "Great product!",
    "comment": "This product exceeded my expectations.",
    "images": []
  }'
```

---

### 10.4 Update Product Review

**Endpoint:** `PUT /api/product-reviews/:reviewId`

**Description:** Update a review

**Used In:**
- 📄 `app/orderhistory/page.jsx` - Order history (update review)

**Authentication:** Required

**Request Body:**
```json
{
  "rating": 4,
  "title": "Updated title",
  "comment": "Updated comment"
}
```

**cURL Command:**
```bash
curl -X PUT "https://backendreview.qliq.ae/api/product-reviews/507f1f77bcf86cd799439021" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 4,
    "title": "Updated title",
    "comment": "Updated comment"
  }'
```

---

## 11. Subscription Page

**Page Location:** `app/subscription/page.jsx`

### 11.1 Get Subscription Details

**Endpoint:** `GET /api/users/subscription-details`

**Description:** Get user subscription details

**Used In:**
- 📄 `app/subscription/page.jsx` - Subscription page
- 🔧 Redux: Subscription slice actions

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendamp.qliq.ae/api/users/subscription-details" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 11.2 Create Web Subscription

**Endpoint:** `POST /api/wallet/web-subscription`

**Description:** Create a web subscription

**Used In:**
- 📄 `app/subscription/page.jsx` - Subscription page
- 🔧 Redux: Subscription slice actions

**Authentication:** Required

**Request Body:**
```json
{
  "subscriptionType": "monthly",
  "planId": "plan_id_here"
}
```

**cURL Command:**
```bash
curl -X POST "https://backendpayment.qliq.ae/api/wallet/web-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "subscriptionType": "monthly",
    "planId": "plan_id_here"
  }'
```

---

## 12. Product Detail Page

**Page Location:** `app/product/[id]/page.jsx`

### 12.1 Get Product by ID and Slug

**Endpoint:** `GET /api/products/:id/slug/:slug`

**Description:** Get product by both ID and slug for SEO purposes

**Used In:**
- 📄 `app/product/[id]/page.jsx` - Product detail page (SEO-friendly URL)
- 🔧 Redux: `store/slices/productDetailSlice.js` - `fetchProductDetail` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products/507f1f77bcf86cd799439011/slug/product-name" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Product Name",
    "slug": "product-name",
    "description": "Product description",
    "price": 99.99,
    "discount": 10,
    "rating": 4.5,
    "reviews": 120,
    "inStock": true,
    "images": ["https://example.com/image.jpg"],
    "store": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Store Name"
    }
  }
}
```

---

### 12.2 Get Product Reviews

**Endpoint:** `GET /api/product-reviews/product/:productId`

**Description:** Get all reviews for a product

**Used In:**
- 📦 `components/ProductReviews/ProductReviews.jsx` - Product reviews component
- 📦 `components/productDetailPage/ProductSections.jsx` - Product sections
- 📄 `app/product/[id]/page.jsx` - Product detail page
- 🔧 Redux: `store/slices/reviewSlice.js` - `getProductReviews` action

**Authentication:** Not required

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sort` (optional): Sort order

**cURL Command:**
```bash
curl -X GET "https://backendreview.qliq.ae/api/product-reviews/product/507f1f77bcf86cd799439011?page=1&limit=10" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Product reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "userId": "507f1f77bcf86cd799439017",
        "rating": 5,
        "title": "Great product!",
        "comment": "This product exceeded my expectations.",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50
    }
  }
}
```

---

### 12.3 Get Review Statistics

**Endpoint:** `GET /api/product-reviews/statistics/product/:productId`

**Description:** Get review statistics for a product

**Used In:**
- 📦 `components/ProductReviews/ProductReviews.jsx` - Product reviews component

**Authentication:** Not required

**cURL Command:**
```bash
curl -X GET "https://backendreview.qliq.ae/api/product-reviews/statistics/product/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalReviews": 120,
    "ratingDistribution": {
      "5": 60,
      "4": 30,
      "3": 20,
      "2": 5,
      "1": 5
    }
  }
}
```

---

### 12.4 Get Similar Products

**Endpoint:** `GET /api/products/similar/:productId`

**Description:** Get similar products from other sellers

**Used In:**
- 📦 `components/productDetailPage/OtherSellersDrawer.jsx` - Other sellers drawer component
- 📄 `app/product/[id]/page.jsx` - Product detail page

**Query Parameters:**
- `limit` (optional): Number of products to return (default: 10)

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products/similar/507f1f77bcf86cd799439011?limit=10" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Similar Product",
        "price": 89.99,
        "store": {
          "name": "Other Store"
        }
      }
    ]
  }
}
```

---

### 12.5 Add to Cart (Product Detail)

**Endpoint:** `POST /api/cart/add`

**Description:** Add a product to the user's cart from product detail page

**Used In:**
- 📦 `components/productDetailPage/ProductDetails.jsx` - Product details component
- 🔧 Redux: `store/slices/cartSlice.js` - `addToCart` action

**Authentication:** Required

**Request Body:**
```json
{
  "productId": "507f1f77bcf86cd799439011",
  "quantity": 1
}
```

**cURL Command:**
```bash
curl -X POST "https://backendcart.qliq.ae/api/cart/add" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "quantity": 1
  }'
```

---

### 12.6 Upload Review Images

**Endpoint:** `POST /api/upload/review-images`

**Description:** Upload images specifically for reviews

**Used In:**
- 📦 `components/ReviewForm/ReviewForm.jsx` - Review form (image upload)
- 🔧 Redux: `store/slices/reviewSlice.js` - `uploadReviewImages` action

**Authentication:** Required

**cURL Command:**
```bash
curl -X POST "https://backendupload.qliq.ae/api/upload/review-images" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "files=@/path/to/review-image.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": [
    {
      "url": "https://s3.amazonaws.com/bucket/image.jpg",
      "key": "uploads/image.jpg"
    }
  ]
}
```

---

## 13. Search Page

**Page Location:** `app/search/page.jsx`

### 13.1 Search Products

**Endpoint:** `GET /api/search/products`

**Description:** Search for products only

**Used In:**
- 📄 `app/search/page.jsx` - Search results page
- 🔧 Redux: `store/slices/productsSlice.js` - `searchProducts` action

**Query Parameters:**
- `q`: Search query (required)
- `page`: Page number
- `limit`: Items per page
- `sort`: Sort order
- `min_price`: Minimum price
- `max_price`: Maximum price

**cURL Command:**
```bash
curl -X GET "https://search.qliq.ae/api/search/products?q=laptop&page=1&limit=20" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "query": "laptop",
    "products": [],
    "suggestions": {
      "categories": [],
      "brands": []
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

### 13.2 Get Search Suggestions

**Endpoint:** `GET /api/search/suggestions`

**Description:** Get search suggestions/autocomplete

**Used In:**
- 📦 `components/SearchSuggestions.jsx` - Search suggestions dropdown
- 🔧 Redux: `store/slices/productsSlice.js` - `fetchSearchSuggestions` action

**Query Parameters:**
- `q`: Search query (required)

**cURL Command:**
```bash
curl -X GET "https://search.qliq.ae/api/search/suggestions?q=laptop" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "laptop",
      "laptop bag",
      "laptop stand"
    ]
  }
}
```

---

### 13.3 Global Search

**Endpoint:** `GET /api/search`

**Description:** Global search across all entities

**Used In:**
- 📄 `app/search/page.jsx` - Search results page

**Query Parameters:**
- `q`: Search query (required)
- `type`: Type of search (all, products, stores, brands)
- `page`: Page number
- `limit`: Items per page

**cURL Command:**
```bash
curl -X GET "https://search.qliq.ae/api/search?q=laptop&type=all&page=1&limit=10" \
  -H "Content-Type: application/json"
```

---

## 14. Category Page

**Page Location:** `app/category/[slug]/page.jsx`

### 14.1 Get Category by Slug

**Endpoint:** `GET /api/categories/slug/:slug`

**Description:** Get a category by its slug

**Used In:**
- 📄 `app/category/[slug]/page.jsx` - Category page
- 📄 `app/[slug]/page.jsx` - Dynamic category pages

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/categories/slug/electronics" \
  -H "Content-Type: application/json"
```

---

### 14.2 Get Category Children

**Endpoint:** `GET /api/categories/level2/:slug/children`

**Description:** Get child categories of a level 2 category

**Used In:**
- 📄 `app/category/[slug]/page.jsx` - Category page
- 🔧 Redux: `store/slices/categoriesSlice.js` - `fetchCategoryChildren` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/categories/level2/electronics/children" \
  -H "Content-Type: application/json"
```

---

### 14.3 Get Category Filters

**Endpoint:** `GET /api/search/filters`

**Description:** Get available filters for category products

**Used In:**
- 📄 `app/category/[slug]/page.jsx` - Category page with filters
- 📄 `app/[slug]/page.jsx` - Dynamic category pages

**Query Parameters:**
- `slug`: Category slug
- `level`: Category level
- Additional filter parameters

**cURL Command:**
```bash
curl -X GET "https://search.qliq.ae/api/search/filters?slug=electronics&level=2" \
  -H "Content-Type: application/json"
```

---

### 14.4 Search Products by Level 4 Category

**Endpoint:** `GET /api/search/products/level4`

**Description:** Search products within a level 4 category

**Used In:**
- 📄 `app/[slug]/page.jsx` - Category level 4 product listing
- 📄 `app/category/[slug]/page.jsx` - Category pages

**Query Parameters:**
- `level4`: Level 4 category ID (required)
- `storeId`: Store ID (optional)
- `page`: Page number
- `limit`: Items per page
- `sort`: Sort order
- `in_stock`: Filter by stock status
- `min_price`: Minimum price
- `max_price`: Maximum price
- `attr_*`: Attribute filters (e.g., `attr_color=red`)
- `spec_*`: Specification filters (e.g., `spec_size=large`)

**cURL Command:**
```bash
curl -X GET "https://search.qliq.ae/api/search/products/level4?level4=507f1f77bcf86cd799439016&page=1&limit=20" \
  -H "Content-Type: application/json"
```

---

## 15. Homepage

**Page Location:** `app/page.jsx`

### 15.1 Get Products

**Endpoint:** `GET /api/products`

**Description:** Retrieve a list of products for homepage

**Used In:**
- 📄 `app/page.jsx` - Homepage (fetches products on mount)
- 🔧 Redux: `store/slices/productsSlice.js` - `fetchProducts` action

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sort` (optional): Sort order

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/products?page=1&limit=20" \
  -H "Content-Type: application/json"
```

---

### 15.2 Get Top Brands

**Endpoint:** `GET /api/brands/top`

**Description:** Get top brands for homepage

**Used In:**
- 📄 `app/page.jsx` - Homepage
- 🔧 Redux: `store/slices/brandsSlice.js` - `fetchBrands` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/brands/top" \
  -H "Content-Type: application/json"
```

---

### 15.3 Get All Stores

**Endpoint:** `GET /api/stores`

**Description:** Get all stores for homepage

**Used In:**
- 📄 `app/page.jsx` - Homepage
- 🔧 Redux: `store/slices/storesSlice.js` - `fetchStores` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/stores" \
  -H "Content-Type: application/json"
```

---

### 15.4 Get Popular Categories

**Endpoint:** `GET /api/categories/level3`

**Description:** Get popular level 3 categories for homepage

**Used In:**
- 📄 `app/page.jsx` - Homepage
- 🔧 Redux: `store/slices/categoriesSlice.js` - `fetchPopularCategories` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/categories/level3" \
  -H "Content-Type: application/json"
```

---

### 15.5 Get Level 2 Categories

**Endpoint:** `GET /api/categories/level2`

**Description:** Get all level 2 categories for homepage

**Used In:**
- 📄 `app/page.jsx` - Homepage (fetches level 2 categories)
- 🔧 Redux: `store/slices/categoriesSlice.js` - `fetchLevel2Categories` action

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/categories/level2" \
  -H "Content-Type: application/json"
```

---

### 15.6 Get Homepage Sections

**Endpoint:** `GET /api/homepage-sections`

**Description:** Get homepage sections with active status

**Used In:**
- 📄 `app/page.jsx` - Homepage (fetches homepage sections)

**Query Parameters:**
- `isActive` (optional): Filter by active status

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/homepage-sections?isActive=true" \
  -H "Content-Type: application/json"
```

---

## 16. Other Pages & Components

### 16.1 Authentication APIs

#### User Signup

**Endpoint:** `POST /api/auth/signup`

**Description:** Register a new user

**Used In:**
- 📦 `components/RegisterModal.jsx` - Registration modal component
- 🔧 Redux: `store/slices/authSlice.js` - `registerUser` action

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "phone": "+971501234567"
}
```

**cURL Command:**
```bash
curl -X POST "https://backendauth.qliq.ae/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe",
    "phone": "+971501234567"
  }'
```

---

#### User Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and get access token

**Used In:**
- 📦 `components/LoginModal.jsx` - Login modal component
- 🔧 Redux: `store/slices/authSlice.js` - `loginUser` action

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**cURL Command:**
```bash
curl -X POST "https://backendauth.qliq.ae/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-here",
    "user": {
      "userId": "507f1f77bcf86cd799439017",
      "email": "user@example.com"
    }
  }
}
```

---

### 16.2 Qoyns Wallet Page

**Page Location:** `app/qoyns-wallet/page.jsx`

#### Get Wallet Balance

**Endpoint:** `GET /api/wallet/qoyn/user-balance`

**Description:** Get user wallet balance

**Used In:**
- 📦 `components/profile/QoynsWallet/QoynsWallet.jsx` - Wallet component
- 📄 `app/qoyns-wallet/page.jsx` - Qoyns wallet page
- 📄 `app/checkout/page.jsx` - Checkout page (wallet payment)
- 🔧 Redux: Wallet slice actions

**Authentication:** Required

**cURL Command:**
```bash
curl -X GET "https://backendwallet.qliq.ae/api/wallet/qoyn/user-balance" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 16.3 Brand Pages

#### Get Brand by Slug

**Endpoint:** `GET /api/brands/slug/:slug`

**Description:** Get a brand by its slug

**Used In:**
- 📄 `app/[slug]/page.jsx` - Brand pages

**cURL Command:**
```bash
curl -X GET "https://backendcatalog.qliq.ae/api/brands/slug/brand-name" \
  -H "Content-Type: application/json"
```

---

#### Get Brand Filters

**Endpoint:** `GET /api/search/filters/brand`

**Description:** Get available filters for brand products

**Used In:**
- 📄 `app/[slug]/page.jsx` - Brand product listing

**Query Parameters:**
- `slug`: Brand slug

**cURL Command:**
```bash
curl -X GET "https://search.qliq.ae/api/search/filters/brand?slug=brand-name" \
  -H "Content-Type: application/json"
```

---

## Error Responses

All APIs follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": "Error Type"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate entry)
- `500 Internal Server Error`: Server error

---

## Notes

1. **Replace `YOUR_JWT_TOKEN`** with your actual JWT token in all authenticated requests
2. **Replace example IDs** with actual IDs from your database
3. **Base URLs** can be configured via environment variables
4. **Rate limiting** may apply to some endpoints
5. **Pagination** is available on most list endpoints (default page: 1, default limit: 20)

---

## Legend

- 📄 = Page Component (`app/` directory)
- 📦 = UI Component (`components/` directory)
- 🔧 = Redux Slice/Action (`store/slices/` directory)

---

## Support

For API support or questions, please contact the development team.

**Last Updated:** January 2024
