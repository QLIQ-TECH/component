// Utility to build facets from a list of products returned by the search API
// Produces sections for: Availability, Price range, Rating, Brand, Store, Categories, Attributes, Specifications, Tags, Offers

function getNumericPrice(product) {
  // Use discounted price with VAT when available, else price with VAT, else price (for facets/range)
  const discountWithVat = product.discount_price_with_vat != null && Number(product.discount_price_with_vat) > 0
    ? Number(product.discount_price_with_vat)
    : null
  if (discountWithVat !== null) return discountWithVat
  const priceWithVat = product.price_with_vat != null ? Number(product.price_with_vat) : null
  if (priceWithVat !== null) return priceWithVat
  const fallback = typeof product.price === 'number' ? product.price : 0
  return typeof fallback === 'number' ? fallback : 0
}

export function buildFacetsFromProducts(products = []) {
  const uniqueValues = {
    brand: new Map(),
    store: new Map(),
    level2: new Map(),
    level3: new Map(),
    level4: new Map(),
    tags: new Map(),
    attributes: {},
    specifications: {},
    offers: { offer: 0, regular: 0 },
    availability: { inStock: 0, outOfStock: 0 },
    rating: new Map(),
  }

  let minPrice = Number.POSITIVE_INFINITY
  let maxPrice = 0

  for (const product of products) {
    // price range
    const price = getNumericPrice(product)
    if (price > 0) {
      if (price < minPrice) minPrice = price
      if (price > maxPrice) maxPrice = price
    }

    // availability
    const inStock = (product.stock_quantity || 0) > 0
    if (inStock) uniqueValues.availability.inStock += 1
    else uniqueValues.availability.outOfStock += 1

    // offer flag
    if (product.is_offer) uniqueValues.offers.offer += 1
    else uniqueValues.offers.regular += 1

    // rating bucket (floor to integer 0-5)
    const rating = Math.max(0, Math.min(5, Math.floor(Number(product.average_rating || 0))))
    uniqueValues.rating.set(rating, (uniqueValues.rating.get(rating) || 0) + 1)

    // brand
    const brand = product.brand_id?.name
    if (brand) uniqueValues.brand.set(brand, (uniqueValues.brand.get(brand) || 0) + 1)

    // store
    const store = product.store_id?.name
    if (store) uniqueValues.store.set(store, (uniqueValues.store.get(store) || 0) + 1)

    // categories
    const l2 = product.level2?.name
    const l3 = product.level3?.name
    const l4 = product.level4?.name
    if (l2) uniqueValues.level2.set(l2, (uniqueValues.level2.get(l2) || 0) + 1)
    if (l3) uniqueValues.level3.set(l3, (uniqueValues.level3.get(l3) || 0) + 1)
    if (l4) uniqueValues.level4.set(l4, (uniqueValues.level4.get(l4) || 0) + 1)

    // tags
    if (Array.isArray(product.tags)) {
      for (const tag of product.tags) {
        if (!tag) continue
        uniqueValues.tags.set(tag, (uniqueValues.tags.get(tag) || 0) + 1)
      }
    }

    // attributes
    if (product.attributes && typeof product.attributes === 'object') {
      for (const [key, value] of Object.entries(product.attributes)) {
        if (key === 'dimensions') continue // skip complex nested
        if (!uniqueValues.attributes[key]) uniqueValues.attributes[key] = new Map()
        const values = Array.isArray(value) ? value : [value]
        for (const v of values) {
          const str = String(v)
          if (!str) continue
          uniqueValues.attributes[key].set(str, (uniqueValues.attributes[key].get(str) || 0) + 1)
        }
      }
    }

    // specifications
    if (product.specifications && typeof product.specifications === 'object') {
      for (const [key, value] of Object.entries(product.specifications)) {
        if (!uniqueValues.specifications[key]) uniqueValues.specifications[key] = new Map()
        // split comma-separated like connectivity: "5G, Wi‑Fi"
        const rawValues = Array.isArray(value)
          ? value
          : (typeof value === 'string' ? value.split(',') : [value])
        for (let v of rawValues) {
          if (v === undefined || v === null) continue
          const str = String(v).trim()
          if (!str) continue
          uniqueValues.specifications[key].set(str, (uniqueValues.specifications[key].get(str) || 0) + 1)
        }
      }
    }
  }

  if (!isFinite(minPrice)) minPrice = 0

  // Build facets array
  const facets = []

  // Availability
  facets.push({
    key: 'availability',
    label: 'Availability',
    type: 'checkbox',
    options: [
      { value: 'in', label: 'In Stock', count: uniqueValues.availability.inStock },
      { value: 'out', label: 'Out of Stock', count: uniqueValues.availability.outOfStock },
    ]
  })

  // Price - only show if there's a price range (min !== max)
  const floorMinPrice = Math.floor(minPrice)
  const ceilMaxPrice = Math.ceil(maxPrice)
  
  // Only add price filter if there's a range (min !== max)
  // If all products have the same price, don't show the filter
  if (floorMinPrice !== ceilMaxPrice) {
    facets.push({
      key: 'price',
      label: 'Price',
      type: 'range',
      min: floorMinPrice,
      max: ceilMaxPrice,
    })
  }

  // Rating
  const ratingOptions = [5,4,3,2,1,0]
    .filter(r => uniqueValues.rating.get(r))
    .map(r => ({ value: r, label: `${r}+`, count: Array.from(uniqueValues.rating.keys()).filter(k => k >= r).reduce((acc,k) => acc + (uniqueValues.rating.get(k) || 0), 0) }))
  facets.push({ key: 'rating', label: 'Rating', type: 'min', options: ratingOptions })

  // Brand
  facets.push({
    key: 'brand', label: 'Brand', type: 'checkbox',
    options: Array.from(uniqueValues.brand.entries()).map(([value,count]) => ({ value, label: value, count }))
  })

  // Store
  facets.push({
    key: 'store', label: 'Store', type: 'checkbox',
    options: Array.from(uniqueValues.store.entries()).map(([value,count]) => ({ value, label: value, count }))
  })

  // Categories
  const catLevel = (map, label) => ({ key: label.toLowerCase().replace(/\s+/g,'_'), label, type: 'checkbox', options: Array.from(map.entries()).map(([value,count]) => ({ value, label: value, count })) })
  if (uniqueValues.level2.size) facets.push(catLevel(uniqueValues.level2, 'Department'))
  if (uniqueValues.level3.size) facets.push(catLevel(uniqueValues.level3, 'Subcategory'))
  if (uniqueValues.level4.size) facets.push(catLevel(uniqueValues.level4, 'Category'))

  // Offers
  facets.push({
    key: 'offer', label: 'Deals', type: 'checkbox',
    options: [ { value: 'on_offer', label: 'On Offer', count: uniqueValues.offers.offer } ]
  })

  // Attributes
  for (const [attrKey, map] of Object.entries(uniqueValues.attributes)) {
    const options = Array.from(map.entries()).map(([value,count]) => ({ value, label: value, count }))
    if (options.length) facets.push({ key: `attr.${attrKey}`, label: attrKey.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase()), type: 'checkbox', options })
  }

  // Specifications
  for (const [specKey, map] of Object.entries(uniqueValues.specifications)) {
    const options = Array.from(map.entries()).map(([value,count]) => ({ value, label: value, count }))
    if (options.length) facets.push({ key: `spec.${specKey}`, label: specKey.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase()), type: 'checkbox', options })
  }

  // Tags
  const tagOptions = Array.from(uniqueValues.tags.entries()).map(([value,count]) => ({ value, label: value, count }))
  if (tagOptions.length) facets.push({ key: 'tags', label: 'Tags', type: 'checkbox', options: tagOptions })

  return facets
}

export function applyFiltersToProducts(products = [], selected = {}) {
  const minPrice = selected.price?.min
  const maxPrice = selected.price?.max
  const availability = selected.availability || new Set()
  const minRating = typeof selected.rating === 'number' ? selected.rating : null

  function matchesFacet(product, facetKey, valuesSet) {
    if (!valuesSet || valuesSet.size === 0) return true
    // attr.* and spec.* prefixes
    if (facetKey.startsWith('attr.')) {
      const key = facetKey.slice(5)
      const v = product.attributes?.[key]
      if (Array.isArray(v)) return v.some(x => valuesSet.has(String(x)))
      if (v !== undefined && v !== null) return valuesSet.has(String(v))
      return false
    }
    if (facetKey.startsWith('spec.')) {
      const key = facetKey.slice(5)
      const v = product.specifications?.[key]
      const arr = Array.isArray(v) ? v : (typeof v === 'string' ? v.split(',') : [v])
      return arr.filter(x => x !== undefined && x !== null).some(x => valuesSet.has(String(x).trim()))
    }
    switch (facetKey) {
      case 'brand':
        return valuesSet.has(String(product.brand_id?.name || ''))
      case 'store':
        return valuesSet.has(String(product.store_id?.name || ''))
      case 'category':
      case 'subcategory':
      case 'department': {
        const keyToLevel = { category: 'level4', subcategory: 'level3', department: 'level2' }
        const levelKey = keyToLevel[facetKey]
        return valuesSet.has(String(product[levelKey]?.name || ''))
      }
      case 'tags': {
        const tags = Array.isArray(product.tags) ? product.tags : []
        return tags.some(t => valuesSet.has(String(t)))
      }
      case 'offer':
        return valuesSet.has('on_offer') ? !!product.is_offer : true
      default:
        return true
    }
  }

  return products.filter(product => {
    // price
    const price = getNumericPrice(product)
    if (typeof minPrice === 'number' && price < minPrice) return false
    if (typeof maxPrice === 'number' && maxPrice > 0 && price > maxPrice) return false

    // availability
    if (availability.size) {
      const inStock = (product.stock_quantity || 0) > 0
      if (availability.has('in') && !inStock) return false
      if (availability.has('out') && inStock) return false
    }

    // rating
    if (minRating !== null) {
      const rating = Number(product.average_rating || 0)
      if (rating < minRating) return false
    }

    // other facets in selected where key is Set or Array
    for (const [key, value] of Object.entries(selected)) {
      if (key === 'price' || key === 'availability' || key === 'rating') continue
      const set = value instanceof Set ? value : new Set(Array.isArray(value) ? value : [value])
      if (!matchesFacet(product, key, set)) return false
    }

    return true
  })
}

export default {
  buildFacetsFromProducts,
  applyFiltersToProducts
}


