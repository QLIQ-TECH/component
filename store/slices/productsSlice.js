import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { catalog, search } from '../api/endpoints'
import { searchProductTypes } from '@/utils/searchUtils'

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState()
      const { lastFetchTime, cacheExpiry } = state.products
      
      // Check if data is still fresh (within cache expiry time)
      if (lastFetchTime && Date.now() - lastFetchTime < cacheExpiry) {
        console.log('Using cached products data')
        return { fromCache: true }
      }
      
      // Add homepage flag for optimization
      const response = await fetch(`${catalog.products}?homepage=true&limit=10`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for fetching store products with pagination
export const fetchStoreProducts = createAsyncThunk(
  'products/fetchStoreProducts',
  async ({ storeId, page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(search.storeProducts(storeId, { page, limit }))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { ...data, page }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for fetching products by store slug
export const fetchProductsByStoreSlug = createAsyncThunk(
  'products/fetchProductsByStoreSlug',
  async ({ storeSlug, page = 1, limit = 100 } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(catalog.productsByStoreSlug(storeSlug, { page, limit }))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { ...data, storeSlug, page }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for fetching hypermarket products
export const fetchHypermarketProducts = createAsyncThunk(
  'products/fetchHypermarketProducts',
  async ({ storeId, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(catalog.hypermarketProducts(storeId, { limit }))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { ...data, storeId }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for fetching supermarket products
export const fetchSupermarketProducts = createAsyncThunk(
  'products/fetchSupermarketProducts',
  async ({ storeId, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(catalog.supermarketProducts(storeId, { limit }))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { ...data, storeId }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for fetching store products
export const fetchStoreProductsByStoreId = createAsyncThunk(
  'products/fetchStoreProductsByStoreId',
  async ({ storeId, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(catalog.storeProducts(storeId, { limit }))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { ...data, storeId }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for searching products with filters
export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async ({ query, filters = {}, sort = 'relevance', page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      console.log('Searching for:', query, 'with filters:', filters, 'page:', page, 'limit:', limit)
      
      // Build query params from filters
      const params = new URLSearchParams({ q: query, sort, page: page.toString(), limit: limit.toString() })
      
      // Price filter
      if (filters.price?.min !== undefined && filters.price?.min !== '') {
        params.append('min_price', filters.price.min)
      }
      if (filters.price?.max !== undefined && filters.price?.max !== '') {
        params.append('max_price', filters.price.max)
      }
      
      // Availability filter
      if (filters.availability instanceof Set) {
        if (filters.availability.has('in') && !filters.availability.has('out')) {
          params.append('in_stock', 'true')
        } else if (filters.availability.has('out') && !filters.availability.has('in')) {
          params.append('in_stock', 'false')
        }
      }
      
      // Rating filter
      if (typeof filters.rating === 'number') {
        params.append('min_rating', filters.rating)
      }
      
      // Offer filter
      if (filters.offer instanceof Set && filters.offer.has('on_offer')) {
        params.append('is_offer', 'true')
      }
      
      // Brand filter (multiple)
      if (filters.brand instanceof Set && filters.brand.size > 0) {
        Array.from(filters.brand).forEach(b => params.append('brand_id', b))
      }
      
      // Store filter (multiple)
      if (filters.store instanceof Set && filters.store.size > 0) {
        Array.from(filters.store).forEach(s => params.append('store_id', s))
      }
      
      // Category filters
      const categoryMapping = {
        'department': 'level2',
        'subcategory': 'level3',
        'category': 'level4'
      }
      for (const [key, apiParam] of Object.entries(categoryMapping)) {
        if (filters[key] instanceof Set && filters[key].size > 0) {
          // For simplicity, we'll use the first selected category (extend if needed)
          const firstCat = Array.from(filters[key])[0]
          params.append(apiParam, firstCat)
        }
      }
      
      // Tags filter
      if (filters.tags instanceof Set && filters.tags.size > 0) {
        Array.from(filters.tags).forEach(t => params.append('tags', t))
      }
      
      // Dynamic attribute filters (attr.*)
      Object.keys(filters).forEach(key => {
        if (key.startsWith('attr.')) {
          const attrKey = key.substring(5)
          const values = filters[key] instanceof Set ? Array.from(filters[key]) : []
          values.forEach(v => params.append(`attr_${attrKey}`, v))
        }
      })
      
      // Dynamic specification filters (spec.*)
      Object.keys(filters).forEach(key => {
        if (key.startsWith('spec.')) {
          const specKey = key.substring(5)
          const values = filters[key] instanceof Set ? Array.from(filters[key]) : []
          values.forEach(v => params.append(`spec_${specKey}`, v))
        }
      })
      
      const url = `${search.base}/search/products?${params.toString()}`
      console.log('Search URL:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Search response:', data)
      return data
    } catch (error) {
      console.error('Search error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for fetching search suggestions
export const fetchSearchSuggestions = createAsyncThunk(
  'products/fetchSearchSuggestions',
  async (query, { rejectWithValue }) => {
    try {
      if (!query || query.trim().length < 2) {
        return { suggestions: [], productTypes: [] }
      }
      
      console.log('Fetching suggestions for:', query)
      // Fetch more products to extract better types (increase limit for better type extraction)
      const response = await fetch(search.products(query, { limit: 30 }))
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Suggestions response:', data)
      
      // Extract product types from the products
      const products = data.success && data.data?.products ? data.data.products : []
      const productTypes = searchProductTypes(products, query)
      
      // Return both original data structure and extracted types
      return {
        ...data,
        productTypes: productTypes.slice(0, 10) // Limit to 10 types for suggestions
      }
    } catch (error) {
      console.error('Suggestions error:', error)
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for fetching products by category
export const fetchProductsByCategory = createAsyncThunk(
  'products/fetchProductsByCategory',
  async ({ categoryId, limit = 100 } = {}, { rejectWithValue }) => {
    try {
      if (!categoryId) {
        throw new Error('Category ID is required')
      }
      
      const response = await fetch(catalog.productsByCategory(categoryId, limit))
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return { ...data, categoryId }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)


const productsSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    bestsellers: [],
    offers: [],
    qliqPlusDeals: [],
    featured: [],
    storeProducts: [],
    storePagination: {},
    storeLoadingMore: false,
    storeSlugProducts: null,
    storeSlugProductsLoading: false,
    storeSlugProductsError: null,
    hypermarketProducts: null,
    hypermarketProductsLoading: false,
    hypermarketProductsError: null,
    supermarketProducts: null,
    supermarketProductsLoading: false,
    supermarketProductsError: null,
    storeProductsByStoreId: null,
    storeProductsByStoreIdLoading: false,
    storeProductsByStoreIdError: null,
    searchResults: [],
    searchQuery: '',
    searchPagination: {},
    searchSuggestions: [],
    searchProductTypes: [], // Product types/variants for suggestions
    suggestionsLoading: false,
    suggestionsError: null,
    categoryProducts: [],
    categoryProductsLoading: false,
    categoryProductsError: null,
    pagination: {},
    loading: false,
    searchLoading: false,
    error: null,
    searchError: null,
    success: false,
    // Cache timestamps for performance
    lastFetchTime: null,
    cacheExpiry: 5 * 60 * 1000, // 5 minutes
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearProducts: (state) => {
      state.products = []
      state.bestsellers = []
      state.offers = []
      state.qliqPlusDeals = []
      state.featured = []
      state.storeProducts = []
      state.storePagination = {}
      state.pagination = {}
    },
    clearStoreProducts: (state) => {
      state.storeProducts = []
      state.storePagination = {}
      state.storeLoadingMore = false
    },
    clearStoreSlugProducts: (state) => {
      state.storeSlugProducts = null
      state.storeSlugProductsError = null
    },
    clearHypermarketProducts: (state) => {
      state.hypermarketProducts = null
      state.hypermarketProductsError = null
    },
    clearSupermarketProducts: (state) => {
      state.supermarketProducts = null
      state.supermarketProductsError = null
    },
    clearStoreProductsByStoreId: (state) => {
      state.storeProductsByStoreId = null
      state.storeProductsByStoreIdError = null
    },
    clearSuggestions: (state) => {
      state.searchSuggestions = []
      state.searchProductTypes = []
      state.suggestionsError = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
        state.success = false
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.success = action.payload.success
        
        // Only update data if not from cache
        if (!action.payload.fromCache && action.payload.success && action.payload.data) {
          state.products = action.payload.data.products || []
          state.bestsellers = action.payload.data.bestseller || []
          state.offers = action.payload.data.offers || []
          state.qliqPlusDeals = action.payload.data.qliqPlusDeals || []
          state.featured = action.payload.data.featured || []
          state.pagination = action.payload.data.pagination || {}
          state.lastFetchTime = Date.now()
        }
        state.error = null
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.success = false
      })
      .addCase(fetchStoreProducts.pending, (state, action) => {
        const isInitialPage = !action.meta?.arg?.page || action.meta.arg.page === 1
        state.loading = isInitialPage
        state.storeLoadingMore = !isInitialPage
        state.error = null
        state.success = false
      })
      .addCase(fetchStoreProducts.fulfilled, (state, action) => {
        state.loading = false
        state.storeLoadingMore = false
        state.success = action.payload.success
        if (action.payload.success && action.payload.data) {
          const newProducts = action.payload.data.products || []
          state.storeProducts = Array.isArray(newProducts) ? newProducts : []
          // Update pagination info
          if (action.payload.data.pagination) {
            state.storePagination = action.payload.data.pagination
          }
        }
        state.error = null
      })
      .addCase(fetchStoreProducts.rejected, (state, action) => {
        state.loading = false
        state.storeLoadingMore = false
        state.error = action.payload
        state.success = false
      })
      // Fetch products by store slug cases
      .addCase(fetchProductsByStoreSlug.pending, (state) => {
        state.storeSlugProductsLoading = true
        state.storeSlugProductsError = null
      })
      .addCase(fetchProductsByStoreSlug.fulfilled, (state, action) => {
        state.storeSlugProductsLoading = false
        state.success = action.payload.success
        if (action.payload.success && action.payload.data) {
          state.storeSlugProducts = action.payload.data
        } else {
          state.storeSlugProducts = null
        }
        state.storeSlugProductsError = null
      })
      .addCase(fetchProductsByStoreSlug.rejected, (state, action) => {
        state.storeSlugProductsLoading = false
        state.storeSlugProductsError = action.payload
        state.storeSlugProducts = null
        state.success = false
      })
      // Fetch hypermarket products cases
      .addCase(fetchHypermarketProducts.pending, (state) => {
        state.hypermarketProductsLoading = true
        state.hypermarketProductsError = null
      })
      .addCase(fetchHypermarketProducts.fulfilled, (state, action) => {
        state.hypermarketProductsLoading = false
        state.success = action.payload.success
        if (action.payload.success && action.payload.data) {
          state.hypermarketProducts = action.payload.data
        } else {
          state.hypermarketProducts = null
        }
        state.hypermarketProductsError = null
      })
      .addCase(fetchHypermarketProducts.rejected, (state, action) => {
        state.hypermarketProductsLoading = false
        state.hypermarketProductsError = action.payload
        state.hypermarketProducts = null
        state.success = false
      })
      // Fetch supermarket products cases
      .addCase(fetchSupermarketProducts.pending, (state) => {
        state.supermarketProductsLoading = true
        state.supermarketProductsError = null
      })
      .addCase(fetchSupermarketProducts.fulfilled, (state, action) => {
        state.supermarketProductsLoading = false
        state.success = action.payload.success
        if (action.payload.success && action.payload.data) {
          state.supermarketProducts = action.payload.data
        } else {
          state.supermarketProducts = null
        }
        state.supermarketProductsError = null
      })
      .addCase(fetchSupermarketProducts.rejected, (state, action) => {
        state.supermarketProductsLoading = false
        state.supermarketProductsError = action.payload
        state.supermarketProducts = null
        state.success = false
      })
      // Fetch store products cases
      .addCase(fetchStoreProductsByStoreId.pending, (state) => {
        state.storeProductsByStoreIdLoading = true
        state.storeProductsByStoreIdError = null
      })
      .addCase(fetchStoreProductsByStoreId.fulfilled, (state, action) => {
        state.storeProductsByStoreIdLoading = false
        state.success = action.payload.success
        if (action.payload.success && action.payload.data) {
          state.storeProductsByStoreId = action.payload.data
        } else {
          state.storeProductsByStoreId = null
        }
        state.storeProductsByStoreIdError = null
      })
      .addCase(fetchStoreProductsByStoreId.rejected, (state, action) => {
        state.storeProductsByStoreIdLoading = false
        state.storeProductsByStoreIdError = action.payload
        state.storeProductsByStoreId = null
        state.success = false
      })
      // Search products cases
      .addCase(searchProducts.pending, (state) => {
        state.searchLoading = true
        state.searchError = null
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchLoading = false
        state.success = action.payload.success
        if (action.payload.success && action.payload.data) {
          state.searchResults = action.payload.data.products || []
          state.searchQuery = action.payload.data.query || ''
          state.searchPagination = action.payload.data.pagination || {}
        }
        state.searchError = null
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.searchLoading = false
        state.searchError = action.payload
        state.success = false
      })
      // Search suggestions cases
      .addCase(fetchSearchSuggestions.pending, (state) => {
        state.suggestionsLoading = true
        state.suggestionsError = null
      })
      .addCase(fetchSearchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false
        if (action.payload.success && action.payload.data) {
          // Store original products for fallback if needed
          state.searchSuggestions = action.payload.data.products || []
        } else {
          state.searchSuggestions = []
        }
        // Store extracted product types for display
        state.searchProductTypes = action.payload.productTypes || []
        state.suggestionsError = null
      })
      .addCase(fetchSearchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false
        state.suggestionsError = action.payload
        state.searchSuggestions = []
        state.searchProductTypes = []
      })
      // Fetch products by category cases
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.categoryProductsLoading = true
        state.categoryProductsError = null
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.categoryProductsLoading = false
        if (action.payload.success && action.payload.data) {
          state.categoryProducts = Array.isArray(action.payload.data) ? action.payload.data : []
        } else {
          state.categoryProducts = []
        }
        state.categoryProductsError = null
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.categoryProductsLoading = false
        state.categoryProductsError = action.payload
        state.categoryProducts = []
      })
  }
})

export const { clearError, clearProducts, clearSuggestions, clearStoreProducts, clearStoreSlugProducts, clearHypermarketProducts, clearSupermarketProducts, clearStoreProductsByStoreId } = productsSlice.actions
export default productsSlice.reducer
