import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAuthToken, getUserFromCookies } from '../../utils/userUtils'
import { addresses, payment, wallet, zones } from '../api/endpoints'
 

// Async thunks for checkout operations
export const fetchUserAddresses = createAsyncThunk(
  'checkout/fetchUserAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(addresses.get, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch addresses')
      }

      const responseData = await response.json()
      return responseData.data?.addresses || []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createAddress = createAsyncThunk(
  'checkout/createAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(addresses.create, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create address')
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const setDefaultAddress = createAsyncThunk(
  'checkout/setDefaultAddress',
  async (addressId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(addresses.setDefault, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ addressId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to set default address')
      }

      return addressId
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const createStripePaymentIntent = createAsyncThunk(
  'checkout/createStripePaymentIntent',
  async (orderData, { rejectWithValue }) => {
    try {
      console.log('🔄 Creating Stripe payment intent...')
      console.log('📦 Order data:', orderData)
      
      const token = await getAuthToken()
      const userId = await getUserFromCookies()
      
      if (!token) {
        console.error('❌ No auth token!')
        throw new Error('Authentication required')
      }

      console.log('✅ Auth token obtained')

      

      // Handle Stripe payment
      const stripeCheckoutData = {
        items: orderData.items.map(item => {
          return {
            productId: item.productId || item.id,
            name: item.name || 'Product',
            quantity: item.quantity || 1,
            price: item.price || 0,
            image: item.image || 'https://example.com/image.jpg'
          }
        }),
        total: orderData.total,
        currency: 'usd',
        // Include shipping information
        shippingMethodCost: orderData.shippingMethodCost || orderData.shipping || 0,
        shippingCost: orderData.shippingMethodCost || orderData.shipping || 0,
        shippingMethod: orderData.shippingMethod,
        shippingMethodName: orderData.shippingMethodName,
        shippingMethodTime: orderData.shippingMethodTime,
        deliveryAddress: orderData.deliveryAddress,
        shippingAddress: orderData.shippingAddress
      }

      console.log('🔗 Endpoint:', payment.stripeCheckout)

      const response = await fetch(payment.stripeCheckout, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stripeCheckoutData)
      })

      console.log('📥 Response status:', response.status)

      if (!response.ok) {
        // Robust error handling when server returns non-JSON (e.g., HTML error page)
        const raw = await response.text()
        console.error('❌ API Error Response:', raw)
        try {
          const errorData = JSON.parse(raw)
          console.error('❌ Error data:', errorData)
          throw new Error(errorData.message || 'Failed to create payment intent')
        } catch (_) {
          // Surface status and a snippet of the body to help debugging
          const snippet = (raw || '').slice(0, 200)
          console.error('❌ Raw error:', snippet)
          throw new Error(`Payment API error (${response.status}): ${snippet}`)
        }
      }

      const responseData = await response.json()
      console.log('✅ Payment intent created:', responseData)
      
      return {
        type: 'stripe',
        clientSecret: responseData.data?.clientSecret,
        paymentIntentId: responseData.data?.paymentIntentId,
        totalAmount: responseData.data?.totalAmount,
        currency: responseData.data?.currency,
        paymentData: responseData.data
      }
    } catch (error) {
      console.error('❌ Payment intent creation failed:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const placeOrder = createAsyncThunk(
  'checkout/placeOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      if (!token) {
        throw new Error('Authentication required')
      }

      if (orderData.paymentMethod === 'credit-card') {
        // For Stripe, we just return the order data
        // The actual payment will be handled by Stripe Elements
        return {
          type: 'stripe',
          orderData,
          message: 'Payment intent created. Please complete payment.'
        }
      } else {
        // Handle other payment methods (tabby, tamara)
        return {
          type: 'other',
          orderData,
          message: 'Order placed successfully!'
        }
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Qoyn validation async thunk
export const validateQoynRedemption = createAsyncThunk(
  'checkout/validateQoynRedemption',
  async (redemptionData, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(wallet.validateRedemption, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(redemptionData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to validate Qoyn redemption')
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Qoyn redemption async thunk
export const redeemQoyns = createAsyncThunk(
  'checkout/redeemQoyns',
  async (redemptionData, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(wallet.redeemQoyn, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(redemptionData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to redeem Qoyns')
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Fetch accepted purchase gigs (coupons) async thunk
export const fetchAcceptedPurchaseGigs = createAsyncThunk(
  'checkout/fetchAcceptedPurchaseGigs',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('https://backendgigs.qliq.ae/api/gig-completions/accepted-purchase-gigs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch coupons')
      }

      const responseData = await response.json()
      return responseData.data || []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchGigCompletions = createAsyncThunk(
  'checkout/fetchGigCompletions',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('https://backendgigs.qliq.ae/api/gig-completions/accepted-purchase-gigs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch gig completions')
      }

      const responseData = await response.json()
      return responseData.data || []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Fetch countries from zones API
export const fetchCountries = createAsyncThunk(
  'checkout/fetchCountries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(zones.getCountries, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch countries')
      }

      const responseData = await response.json()
      return responseData.data?.countries || []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Fetch cities by country
export const fetchCitiesByCountry = createAsyncThunk(
  'checkout/fetchCitiesByCountry',
  async (countryName, { rejectWithValue }) => {
    try {
      const response = await fetch(zones.getCitiesByCountry(countryName), {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch cities')
      }

      const responseData = await response.json()
      return responseData.data?.cities || []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Fetch zones by city
export const fetchZonesByCity = createAsyncThunk(
  'checkout/fetchZonesByCity',
  async (cityName, { rejectWithValue }) => {
    try {
      const response = await fetch(zones.getZonesByCity(cityName), {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch zones')
      }

      const responseData = await response.json()
      return responseData.data?.zones || []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: {
    // Address management
    addresses: [],
    selectedAddress: null,
    loadingAddresses: false,
    addressError: null,
    
    // Address form
    showAddressForm: false,
    addressForm: {
      type: 'home',
      isDefault: false,
      fullName: '',
      phone: '',
      email: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      landmark: '',
      instructions: ''
    },
    isSubmittingAddress: false,
    
    // Shipping
    shippingSameAsDelivery: true,
    showShippingForm: false,
    
    // Payment
    selectedPaymentMethod: 'credit-card',
    
    // Stripe payment
    stripeClientSecret: null,
    stripePaymentIntentId: null,
    isCreatingPaymentIntent: false,
    paymentIntentError: null,
    
    // Order placement
    isPlacingOrder: false,
    orderError: null,
    
    // Qoyn validation
    qoynValidation: {
      walletUnlocked: false,
      eligibleForDiscount: false,
      maxDiscountInStoreCurrency: 0,
      maxDiscountSpendInStoreCurrency: 0,
      currentDiscountQoyn: 0,
      totalQoynBalance: 0,
      qoynExpiryDate: null,
      storeCurrency: 'AED',
      isValidationLoading: false,
      validationError: null,
      message: null
    },
    
    // Coupons
    coupons: [],
    loadingCoupons: false,
    couponsError: null,
    appliedCoupon: null,
    
    // Gig Completions
    gigCompletions: [],
    loadingGigCompletions: false,
    gigCompletionsError: null,
    appliedGigCompletion: null,
    
    // Zones (Countries, Cities, Zones)
    countries: [],
    loadingCountries: false,
    countriesError: null,
    cities: [],
    loadingCities: false,
    citiesError: null,
    zones: [],
    loadingZones: false,
    zonesError: null,
    
    // General
    loading: false,
    error: null
  },
  reducers: {
    // Address management
    setSelectedAddress: (state, action) => {
      state.selectedAddress = action.payload
    },
    setShowAddressForm: (state, action) => {
      state.showAddressForm = action.payload
    },
    updateAddressForm: (state, action) => {
      state.addressForm = { ...state.addressForm, ...action.payload }
    },
    resetAddressForm: (state) => {
      state.addressForm = {
        type: 'home',
        isDefault: false,
        fullName: '',
        phone: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        landmark: '',
        instructions: ''
      }
    },
    
    // Shipping
    setShippingSameAsDelivery: (state, action) => {
      state.shippingSameAsDelivery = action.payload
    },
    setShowShippingForm: (state, action) => {
      state.showShippingForm = action.payload
    },
    
    // Payment
    setSelectedPaymentMethod: (state, action) => {
      state.selectedPaymentMethod = action.payload
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null
      state.addressError = null
      state.orderError = null
      state.paymentIntentError = null
    },
    clearAddressError: (state) => {
      state.addressError = null
    },
    clearOrderError: (state) => {
      state.orderError = null
    },
    clearPaymentIntentError: (state) => {
      state.paymentIntentError = null
    },
    clearStripeData: (state) => {
      state.stripeClientSecret = null
      state.stripePaymentIntentId = null
      state.paymentIntentError = null
    },
    
    // Coupon management
    setAppliedCoupon: (state, action) => {
      state.appliedCoupon = action.payload
    },
    clearAppliedCoupon: (state) => {
      state.appliedCoupon = null
    },
    
    // Gig Completion management
    setAppliedGigCompletion: (state, action) => {
      state.appliedGigCompletion = action.payload
    },
    clearAppliedGigCompletion: (state) => {
      state.appliedGigCompletion = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch addresses
      .addCase(fetchUserAddresses.pending, (state) => {
        state.loadingAddresses = true
        state.addressError = null
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.loadingAddresses = false
        state.addresses = action.payload
        
        // Set default address if available
        const defaultAddress = action.payload.find(addr => addr.isDefault)
        if (defaultAddress) {
          state.selectedAddress = defaultAddress
        } else if (action.payload.length > 0) {
          state.selectedAddress = action.payload[0]
        }
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.loadingAddresses = false
        state.addressError = action.payload
      })
      
      // Create address
      .addCase(createAddress.pending, (state) => {
        state.isSubmittingAddress = true
        state.addressError = null
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.isSubmittingAddress = false
        state.showAddressForm = false
        
        // Add the newly created address to the addresses array
        if (action.payload?.data?.address) {
          state.addresses.push(action.payload.data.address)
          // Auto-select the newly created address
          state.selectedAddress = action.payload.data.address
        }
        
        // Reset the form
        state.addressForm = {
          type: 'home',
          isDefault: false,
          fullName: '',
          phone: '',
          email: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          landmark: '',
          instructions: ''
        }
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.isSubmittingAddress = false
        state.addressError = action.payload
      })
      
      // Set default address
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        // Update the addresses array to reflect the new default
        state.addresses = state.addresses.map(addr => ({
          ...addr,
          isDefault: addr.id === action.payload
        }))
      })
      
      // Create Stripe Payment Intent
      .addCase(createStripePaymentIntent.pending, (state) => {
        state.isCreatingPaymentIntent = true
        state.paymentIntentError = null
      })
      .addCase(createStripePaymentIntent.fulfilled, (state, action) => {
        state.isCreatingPaymentIntent = false
        state.stripeClientSecret = action.payload.clientSecret
        state.stripePaymentIntentId = action.payload.paymentIntentId
      })
      .addCase(createStripePaymentIntent.rejected, (state, action) => {
        state.isCreatingPaymentIntent = false
        state.paymentIntentError = action.payload
      })
      
      // Place order
      .addCase(placeOrder.pending, (state) => {
        state.isPlacingOrder = true
        state.orderError = null
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.isPlacingOrder = false
        
        if (action.payload.type === 'stripe') {
          // For Stripe, payment will be handled by Stripe Elements
          // No redirect needed
        } else if (action.payload.type === 'other') {
          // Show success message and redirect (use native event to allow UI-level toast)
          if (typeof window !== 'undefined') {
            const ev = new CustomEvent('app:toast', { detail: { message: action.payload.message, type: 'success' } })
            window.dispatchEvent(ev)
          }
          window.location.href = '/'
        }
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.isPlacingOrder = false
        state.orderError = action.payload
      })
      
      // Qoyn validation
      .addCase(validateQoynRedemption.pending, (state) => {
        state.qoynValidation.isValidationLoading = true
        state.qoynValidation.validationError = null
      })
      .addCase(validateQoynRedemption.fulfilled, (state, action) => {
        state.qoynValidation.isValidationLoading = false
        const data = action.payload.data
        if (data) {
          state.qoynValidation.walletUnlocked = data.walletUnlocked
          state.qoynValidation.eligibleForDiscount = data.eligibleForDiscount
          if (data.qoyn) {
            state.qoynValidation.maxDiscountInStoreCurrency = data.qoyn.maxDiscountInStoreCurrency
            state.qoynValidation.maxDiscountSpendInStoreCurrency = data.qoyn.maxDiscountSpendInStoreCurrency
            state.qoynValidation.currentDiscountQoyn = data.qoyn.currentDiscountQoyn
            state.qoynValidation.totalQoynBalance = data.qoyn.totalQoynBalance
            state.qoynValidation.qoynExpiryDate = data.qoyn.qoynExpiryDate
            state.qoynValidation.storeCurrency = data.qoyn.storeCurrency
          }
        }
        // Store the message from API response
        if (action.payload.message) {
          state.qoynValidation.message = action.payload.message
        }
      })
      .addCase(validateQoynRedemption.rejected, (state, action) => {
        state.qoynValidation.isValidationLoading = false
        state.qoynValidation.validationError = action.payload
      })
      
      // Fetch accepted purchase gigs (coupons)
      .addCase(fetchAcceptedPurchaseGigs.pending, (state) => {
        state.loadingCoupons = true
        state.couponsError = null
      })
      .addCase(fetchAcceptedPurchaseGigs.fulfilled, (state, action) => {
        state.loadingCoupons = false
        state.coupons = action.payload || []
      })
      .addCase(fetchAcceptedPurchaseGigs.rejected, (state, action) => {
        state.loadingCoupons = false
        state.couponsError = action.payload
      })
      
      // Fetch gig completions
      .addCase(fetchGigCompletions.pending, (state) => {
        state.loadingGigCompletions = true
        state.gigCompletionsError = null
      })
      .addCase(fetchGigCompletions.fulfilled, (state, action) => {
        state.loadingGigCompletions = false
        state.gigCompletions = action.payload || []
      })
      .addCase(fetchGigCompletions.rejected, (state, action) => {
        state.loadingGigCompletions = false
        state.gigCompletionsError = action.payload
      })
      
      // Redeem Qoyns
      .addCase(redeemQoyns.pending, (state) => {
        state.qoynValidation.isValidationLoading = true
        state.qoynValidation.validationError = null
      })
      .addCase(redeemQoyns.fulfilled, (state, action) => {
        state.qoynValidation.isValidationLoading = false
        // Update qoyn balance if returned in response
        if (action.payload.data && action.payload.data.userQoynBalance !== undefined) {
          state.qoynValidation.totalQoynBalance = action.payload.data.userQoynBalance
        }
      })
      .addCase(redeemQoyns.rejected, (state, action) => {
        state.qoynValidation.isValidationLoading = false
        state.qoynValidation.validationError = action.payload
      })
      
      // Fetch countries
      .addCase(fetchCountries.pending, (state) => {
        state.loadingCountries = true
        state.countriesError = null
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.loadingCountries = false
        state.countries = action.payload || []
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.loadingCountries = false
        state.countriesError = action.payload
      })
      
      // Fetch cities by country
      .addCase(fetchCitiesByCountry.pending, (state) => {
        state.loadingCities = true
        state.citiesError = null
        state.cities = [] // Clear previous cities
        state.zones = [] // Clear zones when country changes
      })
      .addCase(fetchCitiesByCountry.fulfilled, (state, action) => {
        state.loadingCities = false
        state.cities = action.payload || []
      })
      .addCase(fetchCitiesByCountry.rejected, (state, action) => {
        state.loadingCities = false
        state.citiesError = action.payload
      })
      
      // Fetch zones by city
      .addCase(fetchZonesByCity.pending, (state) => {
        state.loadingZones = true
        state.zonesError = null
        state.zones = [] // Clear previous zones
      })
      .addCase(fetchZonesByCity.fulfilled, (state, action) => {
        state.loadingZones = false
        state.zones = action.payload || []
      })
      .addCase(fetchZonesByCity.rejected, (state, action) => {
        state.loadingZones = false
        state.zonesError = action.payload
      })
  }
})

export const {
  setSelectedAddress,
  setShowAddressForm,
  updateAddressForm,
  resetAddressForm,
  setShippingSameAsDelivery,
  setShowShippingForm,
  setSelectedPaymentMethod,
  clearError,
  clearAddressError,
  clearOrderError,
  clearPaymentIntentError,
  clearStripeData,
  setAppliedCoupon,
  clearAppliedCoupon,
  setAppliedGigCompletion,
  clearAppliedGigCompletion
} = checkoutSlice.actions

export default checkoutSlice.reducer
