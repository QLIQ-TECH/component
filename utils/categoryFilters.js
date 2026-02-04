// Utility to convert category filter API response to facets format for FilterDrawer

export function buildFacetsFromCategoryFilters(filterData) {
  if (!filterData) return []

  const facets = []

  // Availability
  if (filterData.availability) {
    facets.push({
      key: 'availability',
      label: 'Availability',
      type: 'checkbox',
      options: [
        { value: 'in', label: 'In Stock', count: filterData.availability.inStock || 0 },
        { value: 'out', label: 'Out of Stock', count: filterData.availability.outOfStock || 0 },
      ]
    })
  }

  // Price - use discounted price if available with valid min/max, otherwise fallback to regular price
  // Check for both camelCase and snake_case property names
  const discountedPrice = filterData.discountedPrice || filterData.discounted_price
  
  // Use discountedPrice if it exists and has valid values (max > 0 indicates discounts exist)
  const priceData = (discountedPrice && 
                     discountedPrice.min != null && 
                     discountedPrice.max != null &&
                     discountedPrice.max > 0) 
                     ? discountedPrice 
                     : filterData.price
  
  if (priceData && priceData.min != null && priceData.max != null) {
    const minPrice = Math.floor(priceData.min)
    const maxPrice = Math.ceil(priceData.max)
    
    // Only add price filter if there's a range (min !== max)
    // If all products have the same price, don't show the filter
    if (minPrice !== maxPrice) {
      facets.push({
        key: 'price',
        label: 'Price',
        type: 'range',
        min: minPrice,
        max: maxPrice,
      })
    }
  }

  // Rating - removed as requested
  // if (filterData.ratings && Array.isArray(filterData.ratings)) {
  //   const ratingOptions = [5, 4, 3, 2, 1, 0]
  //     .map(r => {
  //       const count = filterData.ratings
  //         .filter(item => item.rating >= r)
  //         .reduce((sum, item) => sum + (item.count || 0), 0)
  //       return { value: r, label: `${r}+`, count }
  //     })
  //     .filter(opt => opt.count > 0)
  //   
  //   if (ratingOptions.length > 0) {
  //     facets.push({ key: 'rating', label: 'Rating', type: 'min', options: ratingOptions })
  //   }
  // }

  // Brands
  if (filterData.brands && Array.isArray(filterData.brands) && filterData.brands.length > 0) {
    facets.push({
      key: 'brand',
      label: 'Brand',
      type: 'checkbox',
      options: filterData.brands.map(b => ({
        value: b.name || b._id,
        label: b.name || 'Unknown',
        count: b.count || 0
      }))
    })
  }

  // Stores
  if (filterData.stores && Array.isArray(filterData.stores) && filterData.stores.length > 0) {
    facets.push({
      key: 'store',
      label: 'Store',
      type: 'checkbox',
      options: filterData.stores.map(s => ({
        value: s.name || s._id,
        label: s.name || 'Unknown',
        count: s.count || 0
      }))
    })
  }

  // Attributes (dynamic)
  if (filterData.attributes && typeof filterData.attributes === 'object') {
    for (const [attrKey, values] of Object.entries(filterData.attributes)) {
      if (Array.isArray(values) && values.length > 0) {
        const options = values.map(v => ({
          value: v.value,
          label: v.value,
          count: v.count || 0
        }))
        
        facets.push({
          key: `attr.${attrKey}`,
          label: attrKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'checkbox',
          options
        })
      }
    }
  }

  // Specifications (dynamic)
  if (filterData.specifications && typeof filterData.specifications === 'object') {
    for (const [specKey, values] of Object.entries(filterData.specifications)) {
      if (Array.isArray(values) && values.length > 0) {
        const options = values.map(v => ({
          value: v.value,
          label: v.value,
          count: v.count || 0
        }))
        
        facets.push({
          key: `spec.${specKey}`,
          label: specKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'checkbox',
          options
        })
      }
    }
  }

  return facets
}

export default {
  buildFacetsFromCategoryFilters
}

