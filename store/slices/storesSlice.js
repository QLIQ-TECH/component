import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { catalog } from '../api/endpoints'

// Async thunk for fetching stores discovery data
export const fetchStores = createAsyncThunk(
  'stores/fetchStores',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(catalog.storesDiscovery)
      
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

// Fetch Hypermarket stores
export const fetchHypermarketStores = createAsyncThunk(
  'stores/fetchHypermarketStores',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${catalog.base}/stores/hypermarket`)
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

// Fetch Fastest Delivery stores
export const fetchFastestDeliveryStores = createAsyncThunk(
  'stores/fetchFastestDeliveryStores',
  async ({ latitude, longitude, storeType = 'hypermarket' }, { rejectWithValue }) => {
    try {
      const url = catalog.fastestDelivery(latitude, longitude, storeType)
      const response = await fetch(url)
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

// Fetch Best Cheap Deals
export const fetchBestCheapDeals = createAsyncThunk(
  'stores/fetchBestCheapDeals',
  async (params = {}, { rejectWithValue }) => {
    try {
      const url = catalog.bestCheapDeals(params)
      const response = await fetch(url)
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

// Fetch Best Bundle Deals
export const fetchBestBundleDeals = createAsyncThunk(
  'stores/fetchBestBundleDeals',
  async (params = {}, { rejectWithValue }) => {
    try {
      const url = catalog.bestBundleDeals(params)
      const response = await fetch(url)
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

// Fetch Supermarket stores
export const fetchSupermarketStores = createAsyncThunk(
  'stores/fetchSupermarketStores',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${catalog.base}/stores/supermarket`)
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

// Fetch General store (general-store) stores
export const fetchGeneralStores = createAsyncThunk(
  'stores/fetchGeneralStores',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${catalog.base}/stores/general-store`)
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

// Fetch E-Shop stores
export const fetchEshopStores = createAsyncThunk(
  'stores/fetchEshopStores',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${catalog.base}/stores/eshop`)
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

const storesSlice = createSlice({
  name: 'stores',
  initialState: {
    stores: [],
    topStores: [],
    newStores: [],
    hypermarketStores: [],
    supermarketStores: [],
    generalStores: [],
    eshopStores: [],
    eshopNewStores: [],
    eshopTopStores: [],
    fastestDeliveryStores: [],
    bestCheapDeals: [],
    bestBundleDeals: [],
    pagination: {},
    loading: false,
    loadingBestCheapDeals: false,
    loadingBestBundleDeals: false,
    error: null,
    success: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearStores: (state) => {
      state.stores = []
      state.topStores = []
      state.newStores = []
      state.pagination = {}
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.loading = true
        state.error = null
        state.success = false
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        // Handle the API response structure: { success, message, data: { newStores: [...], topStores: [...], totalNewStores, totalTopStores } }
        const responseData = action.payload?.data || action.payload
        if (responseData) {
          state.newStores = responseData.newStores || []
          state.topStores = responseData.topStores || []
          state.stores = [...(responseData.newStores || []), ...(responseData.topStores || [])]
          state.pagination = {
            totalNewStores: responseData.totalNewStores || 0,
            totalTopStores: responseData.totalTopStores || 0
          }
        }
        state.error = null
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.success = false
      })
      // Hypermarket
      .addCase(fetchHypermarketStores.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchHypermarketStores.fulfilled, (state, action) => {
        state.loading = false
        const responseData = action.payload?.data || action.payload
        state.hypermarketStores = Array.isArray(responseData?.stores) ? responseData.stores : []
        state.pagination = responseData?.pagination || {}
      })
      .addCase(fetchHypermarketStores.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Supermarket
      .addCase(fetchSupermarketStores.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSupermarketStores.fulfilled, (state, action) => {
        state.loading = false
        const responseData = action.payload?.data || action.payload
        state.supermarketStores = Array.isArray(responseData?.stores) ? responseData.stores : []
        state.pagination = responseData?.pagination || {}
      })
      .addCase(fetchSupermarketStores.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // General Stores
      .addCase(fetchGeneralStores.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGeneralStores.fulfilled, (state, action) => {
        state.loading = false
        const responseData = action.payload?.data || action.payload
        state.generalStores = Array.isArray(responseData?.stores) ? responseData.stores : []
        state.pagination = responseData?.pagination || {}
      })
      .addCase(fetchGeneralStores.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // E-Shop Stores
      .addCase(fetchEshopStores.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEshopStores.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
        // Handle the API response structure: { success, message, data: { newStores: [...], topStores: [...], totalNewStores, totalTopStores } }
        const responseData = action.payload?.data || action.payload
        if (responseData) {
          state.eshopNewStores = responseData.newStores || []
          state.eshopTopStores = responseData.topStores || []
          state.eshopStores = [...(responseData.newStores || []), ...(responseData.topStores || [])]
          state.pagination = {
            ...state.pagination,
            totalEshopNewStores: responseData.totalNewStores || 0,
            totalEshopTopStores: responseData.totalTopStores || 0
          }
        }
        state.error = null
      })
      .addCase(fetchEshopStores.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.success = false
      })
      // Fastest Delivery
      .addCase(fetchFastestDeliveryStores.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFastestDeliveryStores.fulfilled, (state, action) => {
        state.loading = false
        const responseData = action.payload?.data || action.payload
        state.fastestDeliveryStores = Array.isArray(responseData?.stores) ? responseData.stores : []
      })
      .addCase(fetchFastestDeliveryStores.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Best Cheap Deals
      .addCase(fetchBestCheapDeals.pending, (state) => {
        state.loadingBestCheapDeals = true
        state.error = null
      })
      .addCase(fetchBestCheapDeals.fulfilled, (state, action) => {
        state.loadingBestCheapDeals = false
        const responseData = action.payload?.data || action.payload
        // API now returns stores instead of deals
        state.bestCheapDeals = Array.isArray(responseData?.stores) ? responseData.stores : []
        state.pagination = responseData?.pagination || {}
      })
      .addCase(fetchBestCheapDeals.rejected, (state, action) => {
        state.loadingBestCheapDeals = false
        state.error = action.payload
      })
      // Best Bundle Deals
      .addCase(fetchBestBundleDeals.pending, (state) => {
        state.loadingBestBundleDeals = true
        state.error = null
      })
      .addCase(fetchBestBundleDeals.fulfilled, (state, action) => {
        state.loadingBestBundleDeals = false
        const responseData = action.payload?.data || action.payload
        // API returns stores instead of bundleDeals
        state.bestBundleDeals = Array.isArray(responseData?.stores) ? responseData.stores : []
        state.pagination = responseData?.pagination || {}
      })
      .addCase(fetchBestBundleDeals.rejected, (state, action) => {
        state.loadingBestBundleDeals = false
        state.error = action.payload
      })
  }
})

export const { clearError, clearStores } = storesSlice.actions
export default storesSlice.reducer
