import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getAuthToken, getUserFromCookies } from '../../utils/userUtils'
import { cart } from '../api/endpoints'
 

// Async thunks for API calls
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (cartItem, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      const mongoUserId = await getUserFromCookies()
      
      const payload = {
        ...cartItem,
        discount_price_with_vat: cartItem.discount_price_with_vat ?? cartItem.price,
        ...(mongoUserId && { mongoUserId })
      }
      delete payload.discount_price

      const response = await fetch(cart.add, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (userId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      const response = await fetch(`${cart.get}?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ userId, productId, quantity }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      const response = await fetch(cart.update, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId, productId, quantity }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      const response = await fetch(cart.remove, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId, productId }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const clickCart = createAsyncThunk(
  'cart/clickCart',
  async ({ productIds, quantity = 1 }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      const mongoUserId = await getUserFromCookies()

      if (!Array.isArray(productIds) || productIds.length === 0) {
        return rejectWithValue('At least one product ID is required')
      }

      const payload = {
        productIds,
        quantity: Math.max(1, quantity || 1),
        ...(mongoUserId && { mongoUserId }),
      }

      const response = await fetch(cart.clickCart, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const moveToWishlist = createAsyncThunk(
  'cart/moveToWishlist',
  async ({ userId, productId }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken()
      
      const response = await fetch(cart.wishlistAdd, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `HTTP error ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    itemsCount: 0,
    total: 0,
    loading: false,
    error: null,
  },
  reducers: {
    setCartCount: (state, action) => {
      state.itemsCount = Number(action.payload) || 0
    },
    clearCart: (state) => {
      state.items = []
      state.itemsCount = 0
      state.total = 0
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false
        // Handle the API response structure and update local state
        const responseData = action.payload.data || action.payload
        const cartData = responseData.cart || responseData
        const addedItem = responseData.addedItem || responseData.item || responseData
        
        // console.log('Add to cart response:', action.payload)
        
        if (cartData) {
          // If the API returns the full cart, use that
          state.items = cartData.items || []
          state.itemsCount = cartData.totalItems || 0
          state.total = cartData.totalPrice || 0
        } else if (addedItem) {
          // Fallback: update individual item
          const existingItem = state.items.find(item => item.productId === addedItem.productId)
          if (existingItem) {
            existingItem.quantity += addedItem.quantity || 1
          } else {
            // Map the new field names from backend to frontend
            const itemToAdd = {
              productId: addedItem.productId,
              name: addedItem.name,
              quantity: addedItem.quantity || 1,
              price: addedItem.price,
              // originalPrice: addedItem.original_price,
              // discountPrice: addedItem.discount_price,
              image: addedItem.image
            }
            state.items.push(itemToAdd)
          }
          
          // Recalculate totals using the price field (which now contains discount_price)
          state.itemsCount = state.items.reduce((total, item) => total + item.quantity, 0)
          state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
        }
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false
        // Handle the API response structure: { success, message, data: { cart: { items, totalItems, totalPrice } } }
        const cartData = action.payload.data?.cart || action.payload.cart || action.payload
        
        
        
        state.items = cartData.items || []
        state.itemsCount = cartData.totalItems || cartData.itemsCount || 0
        state.total = cartData.totalPrice || cartData.total || 0
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false
        // The update API returns the entire updated cart, not just the item
        const responseData = action.payload.data || action.payload
        const cartData = responseData.cart || responseData
        
        // console.log('Update cart response:', action.payload)
        // console.log('Cart data extracted:', cartData)
        
        if (cartData) {
          // Update the entire cart state with the fresh data from API
          state.items = cartData.items || []
          state.itemsCount = cartData.totalItems || 0
          state.total = cartData.totalPrice || 0
          
          // console.log('Updated cart state:', { 
          //   items: state.items, 
          //   itemsCount: state.itemsCount, 
          //   total: state.total 
          // })
        }
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false
        // The remove API likely returns the entire updated cart as well
        const responseData = action.payload.data || action.payload
        const cartData = responseData.cart || responseData
        
        if (cartData) {
          // Update the entire cart state with the fresh data from API
          state.items = cartData.items || []
          state.itemsCount = cartData.totalItems || 0
          state.total = cartData.totalPrice || 0
        } else {
          // Fallback: remove the item manually if cart data is not available
          const removedProductId = responseData.productId || action.payload.productId
          if (removedProductId) {
            state.items = state.items.filter(item => item.productId !== removedProductId)
            // Recalculate totals
            state.itemsCount = state.items.reduce((total, item) => total + item.quantity, 0)
            state.total = state.items.reduce((total, item) => total + (item.price * item.quantity), 0)
          }
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Click cart (add multiple products)
      .addCase(clickCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(clickCart.fulfilled, (state, action) => {
        state.loading = false
        const cartData = action.payload.data?.cart || action.payload.cart || action.payload
        state.items = cartData.items || []
        state.itemsCount = cartData.totalItems || cartData.itemsCount || 0
        state.total = cartData.totalPrice || cartData.total || 0
      })
      .addCase(clickCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Move to wishlist
      .addCase(moveToWishlist.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(moveToWishlist.fulfilled, (state, action) => {
        state.loading = false
        // The wishlist/add API only adds to wishlist, cart remains unchanged
        // No need to update cart state since item stays in cart
      })
      .addCase(moveToWishlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setCartCount, clearCart, clearError } = cartSlice.actions
export default cartSlice.reducer


