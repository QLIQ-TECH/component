// Utility to convert search filter API response to facets format for FilterDrawer

export function buildFacetsFromSearchFilters(filterData) {
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

  // Brands
  if (filterData.brands && Array.isArray(filterData.brands) && filterData.brands.length > 0) {
    facets.push({
      key: 'brand',
      label: 'Brand',
      type: 'checkbox',
      options: filterData.brands.map(brand => ({
        value: brand._id,
        label: brand.name,
        count: brand.count || 0
      }))
    })
  }

  // Stores
  if (filterData.stores && Array.isArray(filterData.stores) && filterData.stores.length > 0) {
    facets.push({
      key: 'store',
      label: 'Store',
      type: 'checkbox',
      options: filterData.stores.map(store => ({
        value: store._id,
        label: store.name,
        count: store.count || 0
      }))
    })
  }

  // Ratings
  if (filterData.ratings && Array.isArray(filterData.ratings) && filterData.ratings.length > 0) {
    facets.push({
      key: 'rating',
      label: 'Rating',
      type: 'min',
      options: filterData.ratings.map(rating => ({
        value: rating._id,
        label: `${rating._id} Stars & Up`,
        count: rating.count || 0
      }))
    })
  }

  // Dynamic attributes
  if (filterData.attributes) {
    Object.entries(filterData.attributes).forEach(([attrKey, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        facets.push({
          key: `attr.${attrKey}`,
          label: attrKey.charAt(0).toUpperCase() + attrKey.slice(1).replace(/_/g, ' '),
          type: 'checkbox',
          options: values.map(value => ({
            value: value.value,
            label: value.value,
            count: value.count || 0
          }))
        })
      }
    })
  }

  // Dynamic specifications
  if (filterData.specifications) {
    Object.entries(filterData.specifications).forEach(([specKey, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        facets.push({
          key: `spec.${specKey}`,
          label: specKey.charAt(0).toUpperCase() + specKey.slice(1).replace(/_/g, ' '),
          type: 'checkbox',
          options: values.map(value => ({
            value: value.value,
            label: value.value,
            count: value.count || 0
          }))
        })
      }
    })
  }

  return facets
}
