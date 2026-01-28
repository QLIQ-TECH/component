'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { useEffect, useState, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getAuthToken, getUserFromCookies, getUserIds } from '@/utils/userUtils'
import { fetchCart, clearCart } from '@/store/slices/cartSlice'

import {
  fetchUserAddresses,
  createAddress,
  setDefaultAddress,
  placeOrder,
  createStripePaymentIntent,
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
  validateQoynRedemption,
  fetchAcceptedPurchaseGigs,
  fetchGigCompletions,
  setAppliedCoupon,
  clearAppliedCoupon,
  setAppliedGigCompletion,
  clearAppliedGigCompletion,
  fetchCountries,
  fetchCitiesByCountry,
  fetchZonesByCity
} from '@/store/slices/checkoutSlice'
import { fetchProfile } from '@/store/slices/profileSlice'
import { fetchUserBalance, fetchRedeemableCashBalance } from '@/store/slices/walletSlice'
import { payment as paymentEndpoints, wallet as walletEndpoints } from '@/store/api/endpoints'
import { loadStripe } from '@stripe/stripe-js'
import StripeCheckout from '@/components/StripeCheckout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faBriefcase, faMapMarkerAlt, faCheck, faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useToast } from '@/contexts/ToastContext'
import styles from './checkout.module.css'

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyDdZ_Y4ANv6qnyWeBebbWA6YoKqMd-o-4Y'

// Map country names to ISO country codes for Google Places API
const getCountryCode = (countryName) => {
  const countryCodeMap = {
    'United Arab Emirates': 'ae',
    'UAE': 'ae',
    'United States': 'us',
    'USA': 'us',
    'United Kingdom': 'gb',
    'UK': 'gb',
    'India': 'in',
    'Saudi Arabia': 'sa',
    'Kuwait': 'kw',
    'Qatar': 'qa',
    'Oman': 'om',
    'Bahrain': 'bh'
  }
  return countryCodeMap[countryName] || null
}

// Load Google Maps API with Places library
const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkLoaded)
          resolve()
        }
      }, 100)
      return
    }

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      resolve()
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps')
      reject(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  })
}

// Get coordinates from address using Google Geocoding API
const getCoordinatesFromAddress = async (addressData) => {
  try {
    const addressString = [
      addressData.addressLine1,
      addressData.addressLine2,
      addressData.city,
      addressData.state,
      addressData.postalCode,
      addressData.country
    ].filter(Boolean).join(', ')
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${GOOGLE_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return {
        latitude: location.lat,
        longitude: location.lng
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting coordinates:', error)
    return null
  }
}

// Get address from coordinates using Google Places API (Reverse Geocoding)
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`
    )
    
    const data = await response.json()
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0]
      const addressComponents = result.address_components
      
      let addressData = {
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      }
      
      // Extract address components
      addressComponents.forEach(component => {
        const types = component.types
        
        if (types.includes('street_number') || types.includes('route')) {
          if (types.includes('street_number')) {
            addressData.addressLine1 = component.long_name
          } else if (types.includes('route')) {
            addressData.addressLine1 = addressData.addressLine1 
              ? `${addressData.addressLine1} ${component.long_name}` 
              : component.long_name
          }
        } else if (types.includes('locality')) {
          addressData.city = component.long_name
        } else if (types.includes('administrative_area_level_1')) {
          addressData.state = component.long_name
        } else if (types.includes('postal_code')) {
          addressData.postalCode = component.long_name
        } else if (types.includes('country')) {
          addressData.country = component.short_name
        }
      })
      
      // If addressLine1 is empty, use formatted address
      if (!addressData.addressLine1 && result.formatted_address) {
        addressData.addressLine1 = result.formatted_address.split(',')[0]
      }
      
      return addressData
    }
    
    return null
  } catch (error) {
    console.error('Error getting address from coordinates:', error)
    return null
  }
}

// Helper function to calculate days remaining until expiry
const calculateDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null
  
  try {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  } catch (error) {
    console.error('Error calculating days remaining:', error)
    return null
  }
}

// Helper function to format expiry date
const formatExpiryDate = (expiryDate) => {
  if (!expiryDate) return null
  
  try {
    const date = new Date(expiryDate)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting expiry date:', error)
    return null
  }
}

export default function CheckoutPage() {
  const dispatch = useDispatch()
  const { show: showToast } = useToast()

  // State to control address display
  const [showAllAddresses, setShowAllAddresses] = useState(false)
  
  // Promo code input state
  const [promoCodeInput, setPromoCodeInput] = useState('')
  
  // State to track address validation error
  const [addressValidationError, setAddressValidationError] = useState(false)
  
  // Ref for address section to scroll to
  const addressSectionRef = useRef(null)
  const addressLine1AutocompleteRef = useRef(null)
  const autocompleteInstanceRef = useRef(null)
  const citiesZonesRef = useRef({ cities: [], zones: [] })
  
  // Applied discount state
  const [appliedDiscount, setAppliedDiscount] = useState(null)
  
  // Selected coupon state
  const [selectedCouponId, setSelectedCouponId] = useState('')
  
  // Selected gig completion state
  const [selectedGigCompletionId, setSelectedGigCompletionId] = useState('')

  // Cash wallet applied state
  const [useCashWallet, setUseCashWallet] = useState(false)
  const [isCashWalletPaymentLoading, setIsCashWalletPaymentLoading] = useState(false)

  // Shipping methods state
  const [shippingMethods, setShippingMethods] = useState([])
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(null)
  const [loadingShippingMethods, setLoadingShippingMethods] = useState(false)

  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)

  // Country, State, City selection state (for address form)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  // Cart state
  const { items: cartItems, total: cartTotal, loading: cartLoading } = useSelector(state => state.cart)

  // Profile state - for user data
  const { user, addresses: profileAddresses } = useSelector(state => state.profile)
  
  // Auth state - fallback for user role
  const authUser = useSelector(state => state.auth?.user)
  
  // Get user role from profile or auth (whichever is available)
  const userRole = user?.role || authUser?.role

  // Wallet state
  const { userQoynBalance, userBalance, storeCurrency, qoynExpiryDate, loading: walletLoading, redeemableCashUsd, redeemableCashAed, cashLoading } = useSelector(state => state.wallet)
  
  // Debug: Log user role for troubleshooting (after wallet state is declared)
  useEffect(() => {
    if (user || authUser) {
      console.log('👤 [CHECKOUT] User role check:', {
        profileUser: user,
        authUser: authUser,
        userRole: userRole,
        isInfluencer: userRole === 'influencer',
        redeemableCashAed: redeemableCashAed
      })
    }
  }, [user, authUser, userRole, redeemableCashAed])

  // Calculate displayed balance: current balance - applied Qoyns (if any)
  // When Qoyns are applied, show remaining coins. When removed, show full balance again.
  const displayedQoynBalance = useMemo(() => {
    const currentBalance = userQoynBalance ?? 0
    const appliedQoyns = appliedDiscount && appliedDiscount.type === 'qoyn' ? (appliedDiscount.qoynAmount || 0) : 0
    // Calculate remaining balance (never show negative)
    const remainingBalance = Math.max(0, currentBalance - appliedQoyns)
    return remainingBalance
  }, [userQoynBalance, appliedDiscount])

  // Checkout state
  const {
    addresses: userAddresses,
    selectedAddress,
    showAddressForm,
    loadingAddresses,
    addressError,
    addressForm,
    isSubmittingAddress,
    shippingSameAsDelivery,
    showShippingForm,
    selectedPaymentMethod,
    isPlacingOrder,
    orderError,
    stripeClientSecret,
    stripePaymentIntentId,
    isCreatingPaymentIntent,
    paymentIntentError,
    qoynValidation,
    coupons,
    loadingCoupons,
    couponsError,
    appliedCoupon,
    gigCompletions,
    loadingGigCompletions,
    gigCompletionsError,
    appliedGigCompletion,
    countries: apiCountries,
    loadingCountries,
    cities: apiCities,
    loadingCities,
    zones: apiZones,
    loadingZones
  } = useSelector(state => state.checkout)

  // Combine addresses from both sources to ensure we get all available addresses
  const allAddresses = []

  // Add addresses from checkout slice
  if (userAddresses && userAddresses.length > 0) {
    allAddresses.push(...userAddresses)
  }

  // Add addresses from profile slice that aren't already included
  if (profileAddresses && profileAddresses.length > 0) {
    profileAddresses.forEach(profileAddr => {
      const exists = allAddresses.some(addr =>
        (addr.id || addr._id) === (profileAddr.id || profileAddr._id)
      )
      if (!exists) {
        allAddresses.push(profileAddr)
      }
    })
  }

  // Show only first 2 addresses initially, or all if showAllAddresses is true
  const displayAddresses = showAllAddresses ? allAddresses : allAddresses.slice(0, 2)

  // Calculate total if not provided by API
  const calculatedTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const originalSubtotal = cartTotal || calculatedTotal

  // Helper function to extract pid from productUrl
  const extractPidFromUrl = (productUrl) => {
    if (!productUrl) return null
    try {
      const url = new URL(productUrl)
      const pid = url.searchParams.get('pid')
      return pid ? String(pid).trim() : null
    } catch (error) {
      // If URL parsing fails, try regex extraction
      const match = productUrl.match(/[?&]pid=([^&]+)/)
      return match ? String(match[1]).trim() : null
    }
  }

  // Filter coupons that match cart items by productId - ONLY show matching ones
  // Compare: cart item productId with coupon pid (extracted from productUrl)
  const availableCoupons = coupons.filter(coupon => {
    // Extract pid from productUrl
    const couponPid = coupon.pid || extractPidFromUrl(coupon.productUrl)
    
    if (!couponPid) {
      console.log('Coupon missing pid:', coupon)
      return false
    }
    
    return cartItems.some(item => {
      // Get productId from cart item (from data.cart.items[].productId)
      const itemProductId = String(item.productId || item.id || '').trim()
      // Get pid from coupon (from productUrl query parameter or direct pid field)
      const pid = String(couponPid).trim()
      
      // Exact string comparison (case-sensitive)
      const isMatch = itemProductId === pid && itemProductId !== '' && pid !== ''
      
      // Debug logging for all comparisons
      console.log('🔍 Comparing:', {
        couponCode: coupon.discountCode,
        couponPid: pid,
        itemProductId: itemProductId,
        isMatch: isMatch,
        matchType: isMatch ? '✅ MATCH' : '❌ NO MATCH',
        itemName: item.name || 'N/A',
        productUrl: coupon.productUrl || 'N/A'
      })
      
      return isMatch
    })
  })
  
  // Debug: Log available coupons
  useEffect(() => {
    if (coupons.length > 0) {
      console.log('📦 === Coupon Matching Debug ===')
      console.log('🎫 All coupons from API:', coupons.map(c => {
        const pid = c.pid || extractPidFromUrl(c.productUrl)
        return {
          _id: c._id,
          discountCode: c.discountCode,
          pid: pid,
          productUrl: c.productUrl,
          percentage: c.customerDiscountPercentage
        }
      }))
      console.log('🛒 Cart items:', cartItems.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        quantity: item.quantity
      })))
      console.log('✅ Available coupons (matched):', availableCoupons.map(c => {
        const pid = c.pid || extractPidFromUrl(c.productUrl)
        return {
          discountCode: c.discountCode,
          pid: pid
        }
      }))
      console.log('📊 Match count:', availableCoupons.length, 'out of', coupons.length)
      console.log('===============================')
    }
  }, [coupons, cartItems, availableCoupons])

  // Filter gig completions that match cart items by productId
  const availableGigCompletions = gigCompletions.filter(gig => {
    // Get all product IDs from the gig completion
    const gigProductIds = (gig.productId || []).map(p => String(p.id || p).trim())
    
    // Check if any cart item matches any of the gig's product IDs
    return cartItems.some(item => {
      const itemProductId = String(item.productId || item.id || '').trim()
      return gigProductIds.includes(itemProductId)
    })
  })

  // Helper function to check if a product has coupon discount applied
  const hasCouponDiscount = (item) => {
    if (!appliedCoupon || !appliedCoupon.customerDiscountPercentage) return false
    const couponPid = appliedCoupon.pid || extractPidFromUrl(appliedCoupon.productUrl)
    if (!couponPid) return false
    const itemProductId = String(item.productId || item.id || '').trim()
    const pid = String(couponPid).trim()
    return itemProductId === pid && itemProductId !== '' && pid !== ''
  }

  // Helper function to check if a product has gig completion discount applied
  const hasGigCompletionDiscount = (item) => {
    if (!appliedGigCompletion) return false
    const gigProductIds = (appliedGigCompletion.productId || []).map(p => String(p.id || p).trim())
    const itemProductId = String(item.productId || item.id || '').trim()
    return gigProductIds.includes(itemProductId) && itemProductId !== ''
  }

  // Helper function to check if a product has any discount applied
  const hasAnyDiscount = (item) => {
    return hasCouponDiscount(item) || hasGigCompletionDiscount(item)
  }

  // Helper function to get discount percentage for a product
  const getProductDiscountPercentage = (item) => {
    if (hasCouponDiscount(item)) {
      return appliedCoupon.customerDiscountPercentage
    }
    if (hasGigCompletionDiscount(item)) {
      return appliedGigCompletion.customerDiscountPercentage || 0
    }
    return 0
  }

  // Helper function to get discount code for a product
  const getProductDiscountCode = (item) => {
    if (hasCouponDiscount(item)) {
      return appliedCoupon.discountCode
    }
    if (hasGigCompletionDiscount(item)) {
      return appliedGigCompletion.discountCode
    }
    return null
  }

  // Helper function to calculate discounted price for a product
  const getProductDiscountedPrice = (item) => {
    const originalPrice = item.price || 0
    let discountAmount = 0
    
    if (hasCouponDiscount(item)) {
      const discountPercentage = appliedCoupon.customerDiscountPercentage
      discountAmount = (originalPrice * discountPercentage) / 100
    } else if (hasGigCompletionDiscount(item)) {
      if (appliedGigCompletion.customerDiscountPercentage > 0) {
        const discountPercentage = appliedGigCompletion.customerDiscountPercentage
        discountAmount = (originalPrice * discountPercentage) / 100
      } else if (appliedGigCompletion.customerDiscountFixed > 0) {
        // For fixed discount, we need to calculate per unit
        // Since fixed discount is on total, we'll calculate proportionally
        const itemTotal = originalPrice * (item.quantity || 1)
        const allMatchingItemsTotal = cartItems
          .filter(i => hasGigCompletionDiscount(i))
          .reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0)
        
        if (allMatchingItemsTotal > 0) {
          const itemDiscountShare = (itemTotal / allMatchingItemsTotal) * appliedGigCompletion.customerDiscountFixed
          discountAmount = itemDiscountShare / (item.quantity || 1)
        }
      }
    }
    
    return originalPrice - discountAmount
  }

  // Apply coupon discount only to matching product(s) if coupon is applied
  let couponDiscountAmount = 0
  let subtotalAfterCoupon = originalSubtotal
  if (appliedCoupon && appliedCoupon.customerDiscountPercentage) {
    const discountPercentage = appliedCoupon.customerDiscountPercentage
    // Extract productId from coupon (pid from productUrl or direct pid field)
    const couponPid = appliedCoupon.pid || extractPidFromUrl(appliedCoupon.productUrl)
    
    if (couponPid) {
      // Find matching cart items for this coupon
      const matchingItems = cartItems.filter(item => {
        const itemProductId = String(item.productId || item.id || '').trim()
        const pid = String(couponPid).trim()
        return itemProductId === pid && itemProductId !== '' && pid !== ''
      })
      
      // Calculate discount only on matching products
      matchingItems.forEach(item => {
        const itemTotal = (item.price || 0) * (item.quantity || 1)
        couponDiscountAmount += (itemTotal * discountPercentage) / 100
      })
    }
    
    // Apply discount to subtotal
    subtotalAfterCoupon = originalSubtotal - couponDiscountAmount
  }

  // Apply gig completion discount only to matching product(s) if gig completion is applied
  let gigCompletionDiscountAmount = 0
  let subtotalAfterGigCompletion = subtotalAfterCoupon
  if (appliedGigCompletion) {
    // Get all product IDs from the gig completion
    const gigProductIds = (appliedGigCompletion.productId || []).map(p => String(p.id || p).trim())
    
    if (gigProductIds.length > 0) {
      // Find matching cart items for this gig completion
      const matchingItems = cartItems.filter(item => {
        const itemProductId = String(item.productId || item.id || '').trim()
        return gigProductIds.includes(itemProductId) && itemProductId !== ''
      })
      
      if (matchingItems.length > 0) {
        if (appliedGigCompletion.customerDiscountPercentage > 0) {
          // Calculate discount only on matching products
          matchingItems.forEach(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 1)
            gigCompletionDiscountAmount += (itemTotal * appliedGigCompletion.customerDiscountPercentage) / 100
          })
        } else if (appliedGigCompletion.customerDiscountFixed > 0) {
          // For fixed discount, apply the full amount (it's already a fixed value)
          gigCompletionDiscountAmount = appliedGigCompletion.customerDiscountFixed
        }
      }
    }
    
    subtotalAfterGigCompletion = subtotalAfterCoupon - gigCompletionDiscountAmount
  } else {
    subtotalAfterGigCompletion = subtotalAfterCoupon
  }

  // Apply Qoyns discount to subtotal (after coupon and gig completion discount)
  let qoynsDiscountAmount = 0
  let subtotalAfterDiscounts = subtotalAfterGigCompletion
  if (appliedDiscount && appliedDiscount.discountAmount) {
    qoynsDiscountAmount = appliedDiscount.discountAmount
    // Apply Qoyns discount to subtotal after gig completion discount
    subtotalAfterDiscounts = subtotalAfterGigCompletion - qoynsDiscountAmount
    // Ensure subtotal doesn't go negative
    if (subtotalAfterDiscounts < 0) {
      subtotalAfterDiscounts = 0
    }
  }

  // VAT Calculation - use product VAT percentage or default to 5%
  const getVatRate = () => {
    if (cartItems.length === 0) return 0.05; // Default 5%
    
    // Get VAT percentage from the first item (assuming all items have same VAT rate)
    const firstItem = cartItems[0];
    const vatPercentage = firstItem.vat_percentage || 5; // Default to 5% if not provided
    return vatPercentage / 100; // Convert percentage to decimal
  }
  
  const vatRate = getVatRate();
  // Calculate VAT on original subtotal (always, not on discounted amount)
  const vatAmount = originalSubtotal * vatRate;
  // Get shipping cost from selected shipping method (from Jibly API)
  const shippingCost = selectedShippingMethod?.cost || selectedShippingMethod?.shippingMethodCost || 9; // Default to 9 if no method selected
  
  // Calculate order total before cash wallet
  // VAT is always on original subtotal, but discounts are still applied to subtotal
  const orderTotalBeforeCashWallet = subtotalAfterDiscounts + vatAmount + shippingCost;
  
  // Apply Cash Wallet discount on ORDER TOTAL (1 AED = 1 AED discount) - Only for influencer role
  let cashWalletDiscountAmount = 0
  let finalTotal = orderTotalBeforeCashWallet
  if (userRole === 'influencer' && useCashWallet && redeemableCashAed > 0) {
    // Use the minimum of cash balance or order total
    cashWalletDiscountAmount = Math.min(redeemableCashAed, orderTotalBeforeCashWallet)
    finalTotal = orderTotalBeforeCashWallet - cashWalletDiscountAmount
    if (finalTotal < 0) {
      finalTotal = 0
    }
  }

  // Use the calculated final total
  const actualTotal = finalTotal;
  
  // For display purposes
  const subtotal = subtotalAfterDiscounts;
  // Combined discounts (coupon + gig completion + qoyns) — shown inline in Subtotal
  const totalDiscounts = couponDiscountAmount + gigCompletionDiscountAmount + qoynsDiscountAmount;

  // Combined error state
  const error = addressError || orderError || paymentIntentError

  // Fetch user addresses and cart on component mount
  useEffect(() => {
    const loadCheckoutData = async () => {
      // Load profile data for user info (name, email, phone)
      dispatch(fetchProfile())
      
      // Load wallet balance
      dispatch(fetchUserBalance())

      // Load addresses
      dispatch(fetchUserAddresses())
      
      // Load countries for address form
      dispatch(fetchCountries())
      
      // Load coupons
      dispatch(fetchAcceptedPurchaseGigs())
      
      // Load gig completions
      dispatch(fetchGigCompletions())

      // Check if cart data is already available in Redux
      if (cartItems.length > 0) {
        console.log('Cart data already available in Redux:', cartItems)
        return
      }

      // Load cart items if not already available
      try {
        const token = await getAuthToken()
        if (token) {
          // Get userId and dispatch fetchCart with userId
          try {
            const userId = await getUserFromCookies()
            if (userId) {
              console.log('Fetching cart for userId:', userId)
              dispatch(fetchCart(userId))
            } else {
              dispatch(clearError())
            }
          } catch (error) {
            console.log('No user found in cookies')
            dispatch(clearError())
          }
        } else {
          dispatch(clearError())
        }
      } catch (error) {
        console.error('Error loading cart:', error)
        dispatch(clearError())
      }
    }

    loadCheckoutData()
  }, [dispatch, cartItems.length])

  // Auto-validate Qoyn redemption when cart total changes
  // Use subtotal after gig completion discount since Qoyns are applied to subtotal after gig discount
  useEffect(() => {
    if (subtotalAfterGigCompletion > 0 && cartItems.length > 0) {
      // Auto-validate with subtotal after gig completion discount
      dispatch(validateQoynRedemption({
        totalAmount: subtotalAfterGigCompletion
      }))
    }
  }, [subtotalAfterGigCompletion, cartItems.length, dispatch])

  // Reset country/state/city selections and autocomplete when address form is closed
  useEffect(() => {
    if (!showAddressForm && !showShippingForm) {
      setSelectedCountry('')
      setSelectedState('')
      setSelectedCity('')
      // Clear autocomplete instance when form closes
      if (autocompleteInstanceRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteInstanceRef.current)
        if (autocompleteInstanceRef.current._observer) {
          autocompleteInstanceRef.current._observer.disconnect()
        }
        autocompleteInstanceRef.current = null
      }
      // Remove any pac-containers
      const pacContainers = document.querySelectorAll('.pac-container')
      pacContainers.forEach(container => container.remove())
    }
  }, [showAddressForm, showShippingForm])

  // Fetch cities when country is selected
  useEffect(() => {
    if (selectedCountry) {
      dispatch(fetchCitiesByCountry(selectedCountry))
      setSelectedCity('') // Reset city when country changes
      setSelectedState('') // Reset zone when country changes
    }
  }, [selectedCountry, dispatch])

  // Fetch zones when city is selected
  useEffect(() => {
    if (selectedCity) {
      dispatch(fetchZonesByCity(selectedCity))
      setSelectedState('') // Reset zone when city changes
    }
  }, [selectedCity, dispatch])

  // Auto-populate address form with user data when form is shown
  useEffect(() => {
    if (showAddressForm && user) {
      dispatch(updateAddressForm({
        fullName: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      }))
    }
  }, [showAddressForm, user, dispatch])

  // Initialize Google Maps API and Places Autocomplete - runs once when form is shown
  useEffect(() => {
    let isMounted = true
    let observer = null

    const initializeAutocomplete = async () => {
      // Only initialize if form is shown
      if (!showAddressForm || !GOOGLE_API_KEY) {
        return
      }

      try {
        // Load Google Maps API if not already loaded
        if (!googleMapsLoaded) {
          await loadGoogleMaps()
          if (!isMounted) return
          setGoogleMapsLoaded(true)
        }

        // Verify Google Maps is loaded
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          return
        }

        // Get the input element
        const addressInput = document.getElementById('address-line-1-autocomplete')
        if (!addressInput) {
          return
        }

        // If autocomplete already exists, just update the country restriction
        if (autocompleteInstanceRef.current) {
          // Update component restrictions if country changed
          if (selectedCountry) {
            const countryCode = getCountryCode(selectedCountry)
            if (countryCode) {
              autocompleteInstanceRef.current.setComponentRestrictions({ country: countryCode })
            } else {
              autocompleteInstanceRef.current.setComponentRestrictions({})
            }
          } else {
            autocompleteInstanceRef.current.setComponentRestrictions({})
          }
          return
        }

        // Clean up any existing pac-containers before creating new instance
        const existingPacContainers = document.querySelectorAll('.pac-container')
        existingPacContainers.forEach(container => container.remove())

        // Prepare autocomplete options
        const autocompleteOptions = {
          types: ['geocode'],
          fields: ['address_components', 'formatted_address', 'geometry', 'name', 'types']
        }

        // Add country restriction if country is selected
        if (selectedCountry) {
          const countryCode = getCountryCode(selectedCountry)
          if (countryCode) {
            autocompleteOptions.componentRestrictions = { country: countryCode }
          }
        }

        // Create autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(addressInput, autocompleteOptions)
        autocompleteInstanceRef.current = autocomplete

        // Optimized styling function - remove duplicates and style
        const styleAutocompleteDropdown = () => {
          const pacContainers = document.querySelectorAll('.pac-container')
          // Remove all but the last container (most recent one)
          if (pacContainers.length > 1) {
            for (let i = 0; i < pacContainers.length - 1; i++) {
              pacContainers[i].remove()
            }
          }
          // Style the remaining container
          const pacContainer = document.querySelector('.pac-container')
          if (pacContainer) {
            pacContainer.style.zIndex = '10000'
            pacContainer.style.borderRadius = '8px'
            pacContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            pacContainer.style.marginTop = '4px'
            pacContainer.style.maxHeight = '300px'
            pacContainer.style.overflowY = 'auto'
          }
        }

        // Use a more efficient MutationObserver - only watch for pac-container additions
        observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) {
                if (node.classList?.contains('pac-container')) {
                  styleAutocompleteDropdown()
                  break
                } else if (node.querySelector?.('.pac-container')) {
                  styleAutocompleteDropdown()
                  break
                }
              }
            }
          }
        })
        
        // Only observe the input's parent container, not the entire body
        const inputContainer = addressInput.closest('div') || document.body
        observer.observe(inputContainer, {
          childList: true,
          subtree: true
        })

        // Store observer for cleanup
        autocomplete._observer = observer

        // Style dropdown when it opens (debounced)
        let styleTimeout = null
        const debouncedStyle = () => {
          clearTimeout(styleTimeout)
          styleTimeout = setTimeout(styleAutocompleteDropdown, 10)
        }

        addressInput.addEventListener('focus', debouncedStyle)
        addressInput.addEventListener('input', debouncedStyle)

        // Handle place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          
          if (!place.geometry || !place.geometry.location) {
            return
          }

          // Extract address components
          const addressComponents = place.address_components || []
          let streetNumber = ''
          let route = ''
          let city = ''
          let state = ''
          let postalCode = ''
          let country = ''

          addressComponents.forEach(component => {
            const types = component.types
            if (types.includes('street_number')) {
              streetNumber = component.long_name
            } else if (types.includes('route')) {
              route = component.long_name
            } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              city = component.long_name
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name
            } else if (types.includes('country')) {
              country = component.long_name
            }
          })

          // Use place name for establishments, otherwise use formatted address
          const addressLine1 = place.name && place.types?.includes('establishment') 
            ? `${place.name}, ${place.formatted_address}`
            : place.formatted_address || [streetNumber, route].filter(Boolean).join(' ')

          // Get latitude and longitude
          const latitude = place.geometry.location.lat()
          const longitude = place.geometry.location.lng()

          // Log coordinates for debugging
          console.log('📍 Selected place coordinates:', { latitude, longitude, placeName: place.name || addressLine1 })

          // Update form with extracted data including coordinates
          dispatch(updateAddressForm({
            addressLine1: addressLine1,
            ...(city && { city: city }),
            ...(state && { state: state }),
            ...(postalCode && { postalCode: postalCode }),
            ...(country && { country: country }),
            latitude: latitude,
            longitude: longitude
          }))

          // Update selected city if found - use ref to get latest cities
          if (city) {
            const currentCities = citiesZonesRef.current.cities
            const cityMatch = currentCities.find(c => c.name.toLowerCase() === city.toLowerCase())
            if (cityMatch) {
              setSelectedCity(cityMatch.name)
            }
          }

          // Update selected zone if found - use ref to get latest zones
          if (state) {
            const currentZones = citiesZonesRef.current.zones
            const zoneMatch = currentZones.find(z => z.name.toLowerCase() === state.toLowerCase())
            if (zoneMatch) {
              setSelectedState(zoneMatch.name)
            }
          }
        })
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error)
      }
    }

    // Initialize with minimal delay
    const timeoutId = setTimeout(() => {
      initializeAutocomplete()
    }, 0)

    // Cleanup function - only runs on unmount or when form closes
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      if (autocompleteInstanceRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteInstanceRef.current)
        // Disconnect observer if it exists
        if (autocompleteInstanceRef.current._observer) {
          autocompleteInstanceRef.current._observer.disconnect()
        }
        autocompleteInstanceRef.current = null
      }
      // Clean up observer if it exists
      if (observer) {
        observer.disconnect()
      }
      // Remove any pac-containers when form closes
      const pacContainers = document.querySelectorAll('.pac-container')
      pacContainers.forEach(container => container.remove())
    }
  }, [showAddressForm, GOOGLE_API_KEY, googleMapsLoaded]) // Removed selectedCountry from dependencies

  // Update country restrictions when country changes - separate effect for better performance
  useEffect(() => {
    if (autocompleteInstanceRef.current && window.google?.maps?.places) {
      if (selectedCountry) {
        const countryCode = getCountryCode(selectedCountry)
        if (countryCode) {
          autocompleteInstanceRef.current.setComponentRestrictions({ country: countryCode })
        } else {
          autocompleteInstanceRef.current.setComponentRestrictions({})
        }
      } else {
        autocompleteInstanceRef.current.setComponentRestrictions({})
      }
    }
  }, [selectedCountry])

  // Ensure a selected address when addresses are available (prefer default)
  useEffect(() => {
    if (!selectedAddress && displayAddresses.length > 0) {
      const defaultAddr = displayAddresses.find(a => a.isDefault)
      dispatch(setSelectedAddress(defaultAddr || displayAddresses[0]))
    }
  }, [displayAddresses, selectedAddress, dispatch])

  // Fetch shipping methods when address is selected
  useEffect(() => {
    const fetchShippingMethods = async () => {
      if (!selectedAddress || !selectedAddress.latitude || !selectedAddress.longitude) {
        setShippingMethods([])
        setSelectedShippingMethod(null)
        return
      }

      setLoadingShippingMethods(true)
      try {
        const { delivery } = await import('@/store/api/endpoints')
        const params = new URLSearchParams({
          latitude: selectedAddress.latitude.toString(),
          longitude: selectedAddress.longitude.toString(),
          ...(selectedAddress.city && { city: selectedAddress.city }),
          ...(selectedAddress.state && { state: selectedAddress.state }),
          ...(selectedAddress.country && { country: selectedAddress.country }),
          ...(selectedAddress.postalCode && { postalCode: selectedAddress.postalCode })
        })

        const token = await getAuthToken()
        const response = await fetch(`${delivery.getShippingMethods}?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch shipping methods')
        }

        const data = await response.json()
        const methods = data.data?.shippingMethods || []
        setShippingMethods(methods)

        // Auto-select first method if available
        if (methods.length > 0 && !selectedShippingMethod) {
          setSelectedShippingMethod(methods[0])
        }
      } catch (error) {
        console.error('Error fetching shipping methods:', error)
        showToast('Failed to load shipping methods', 'error')
        // Fallback to default shipping method
        setShippingMethods([{
          id: 'standard',
          name: 'Standard',
          deliveryTime: '3 - 5 Days',
          cost: 9
        }])
        setSelectedShippingMethod({
          id: 'standard',
          name: 'Standard',
          deliveryTime: '3 - 5 Days',
          cost: 9
        })
      } finally {
        setLoadingShippingMethods(false)
      }
    }

    fetchShippingMethods()
  }, [selectedAddress, showToast])
  
  // Clear validation error when address is selected
  useEffect(() => {
    if (selectedAddress && addressValidationError) {
      setAddressValidationError(false)
    }
  }, [selectedAddress, addressValidationError])

  // Set Stripe as default payment method
  useEffect(() => {
    if (!selectedPaymentMethod) {
      dispatch(setSelectedPaymentMethod('credit-card'))
    }
  }, [selectedPaymentMethod, dispatch])

  // Debug: Log cart data when it changes (commented out to prevent console spam)
  // useEffect(() => {
  //   console.log('Checkout page cart data:', { 
  //     cartItems, 
  //     cartTotal, 
  //     cartLoading, 
  //     itemsCount: cartItems.length 
  //   })
  //   
  //   // Log individual cart item structure
  //   if (cartItems.length > 0) {
  //     console.log('First cart item structure:', cartItems[0])
  //     console.log('Cart item keys:', Object.keys(cartItems[0]))
  //   }
  // }, [cartItems, cartTotal, cartLoading])

  // Fetch cash wallet balance when user role is available and is influencer
  useEffect(() => {
    if (userRole === 'influencer') {
      dispatch(fetchRedeemableCashBalance())
    }
  }, [userRole, dispatch])

  // Check if cart is empty and show appropriate message
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      dispatch(clearError())
      // Set error in checkout state - we'll handle this in the UI
    } else if (cartItems.length > 0) {
      // Clear error if cart has items
      dispatch(clearError())
    }
  }, [cartItems.length, cartLoading, dispatch])

  // Auto-create Stripe payment intent when credit card is selected and we have all required data
  useEffect(() => {
    if (
      selectedPaymentMethod === 'credit-card' &&
      selectedAddress &&
      cartItems.length > 0 &&
      !stripeClientSecret &&
      !isCreatingPaymentIntent &&
      !paymentIntentError
    ) {
      handleCreateStripePaymentIntent()
    }
  }, [selectedPaymentMethod, selectedAddress, cartItems.length, stripeClientSecret, isCreatingPaymentIntent, paymentIntentError])

  // Use API countries (convert array of strings to array of objects for compatibility)
  const countries = (apiCountries || []).map(countryName => ({ name: countryName, isoCode: countryName }))
  
  // Use API cities (convert array of strings to array of objects for compatibility)
  const cities = (apiCities || []).map(cityName => ({ name: cityName }))
  
  // Use API zones (convert to array of objects with name property)
  const zones = (apiZones || []).map(zone => ({ name: zone.zoneName, id: zone.id }))

  // Keep refs updated with latest cities and zones for use in autocomplete handler
  useEffect(() => {
    citiesZonesRef.current = { cities, zones }
  }, [cities, zones])
  
  // Check if we should show zones dropdown (when city is selected)
  const shouldShowZonesDropdown = selectedCity && zones.length > 0

  // Address form handlers
  const handleAddressFormChange = (field, value) => {
    dispatch(updateAddressForm({ [field]: value }))
  }

  // Handle country change
  const handleCountryChange = (e) => {
    const countryName = e.target.value
    setSelectedCountry(countryName)
    setSelectedCity('') // Reset city when country changes
    setSelectedState('') // Reset zone when country changes
    
    dispatch(updateAddressForm({ country: countryName }))
  }

  const handleCityChange = (e) => {
    const cityName = e.target.value
    setSelectedCity(cityName)
    setSelectedState('') // Reset zone when city changes
    
    dispatch(updateAddressForm({ city: cityName }))
  }

  const handleZoneChange = (e) => {
    const zoneName = e.target.value
    setSelectedState(zoneName)
    dispatch(updateAddressForm({ state: zoneName }))
  }

  // Handle "Use Current Location" button click
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error')
      return
    }

    setIsLoadingLocation(true)

    try {
      // Load Google Maps API only when needed for reverse geocoding
      if (!googleMapsLoaded) {
        try {
          await loadGoogleMaps()
          setGoogleMapsLoaded(true)
        } catch (error) {
          console.error('Failed to load Google Maps:', error)
          // Continue without Google Maps - user can enter address manually
        }
      }

      // Get user's current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        )
      })

      const { latitude, longitude } = position.coords

      // Get address from coordinates using Google Places API (only if Google Maps is loaded)
      let addressData = null
      if (googleMapsLoaded && window.google && window.google.maps) {
        try {
          addressData = await getAddressFromCoordinates(latitude, longitude)
        } catch (error) {
          console.error('Error getting address from coordinates:', error)
          // Continue without address data - user can enter manually
        }
      }

      if (addressData) {
        // Update form with fetched address data
        dispatch(updateAddressForm({
          addressLine1: addressData.addressLine1 || addressForm.addressLine1,
          city: addressData.city || addressForm.city,
          state: addressData.state || addressForm.state,
          postalCode: addressData.postalCode || addressForm.postalCode,
          country: addressData.country || addressForm.country,
          latitude: latitude,
          longitude: longitude
        }))

        showToast('Location fetched successfully!', 'success')
      } else {
        // Update form with coordinates even if address details couldn't be fetched
        dispatch(updateAddressForm({
          latitude: latitude,
          longitude: longitude
        }))
        showToast('Coordinates saved. Please enter address details manually.', 'success')
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      if (error.code === 1) {
        showToast('Location access denied. Please enable location permissions.', 'error')
      } else {
        showToast('Failed to get your location. Please try again.', 'error')
      }
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    
    // Validate required dropdown fields
    if (!selectedCountry) {
      showToast('Please select a country', 'error')
      return
    }
    if (!selectedCity) {
      showToast('Please select a city', 'error')
      return
    }
    if (!selectedState) {
      showToast('Please select a zone', 'error')
      return
    }
    
    try {
      // Get coordinates from address
      const coordinates = await getCoordinatesFromAddress({
        ...addressForm,
        country: selectedCountry,
        city: selectedCity,
        state: selectedState
      })
      
      // Prepare address data with coordinates (only if coordinates exist)
      const addressData = {
        ...addressForm,
        country: selectedCountry,
        city: selectedCity,
        state: selectedState
      }
      
      // Only add coordinates if they exist (prefer form coordinates from autocomplete, fallback to geocoded)
      if (addressForm.latitude && addressForm.longitude) {
        addressData.latitude = addressForm.latitude
        addressData.longitude = addressForm.longitude
        console.log('✅ Saving address with coordinates from autocomplete:', { 
          latitude: addressForm.latitude, 
          longitude: addressForm.longitude 
        })
      } else if (coordinates && coordinates.latitude && coordinates.longitude) {
        addressData.latitude = coordinates.latitude
        addressData.longitude = coordinates.longitude
        console.log('✅ Saving address with coordinates from geocoding:', { 
          latitude: coordinates.latitude, 
          longitude: coordinates.longitude 
        })
      } else {
        console.warn('⚠️ No coordinates available for address')
      }

      const result = await dispatch(createAddress(addressData))

      // Refetch addresses to ensure we have the latest data
      if (createAddress.fulfilled.match(result)) {
        await dispatch(fetchUserAddresses())
        // Close the form and reset selections
        dispatch(setShowAddressForm(false))
        dispatch(setShowShippingForm(false))
        setSelectedCountry('')
        setSelectedState('')
        setSelectedCity('')
        showToast('Address saved successfully!', 'success')
      }
    } catch (error) {
      console.error('Error submitting address:', error)
      showToast('Failed to save address. Please try again.', 'error')
    }
  }

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const result = await dispatch(setDefaultAddress(addressId))
      
      if (setDefaultAddress.fulfilled.match(result)) {
        showToast('Default address updated successfully', 'success')
        // Refetch addresses to get updated default status
        dispatch(fetchUserAddresses())
      } else if (setDefaultAddress.rejected.match(result)) {
        showToast(result.payload || 'Failed to update default address', 'error')
      }
    } catch (error) {
      showToast('Failed to update default address', 'error')
    }
  }

  const handleCreateStripePaymentIntent = async () => {
    if (!selectedAddress) {
      dispatch(clearPaymentIntentError())
      return
    }

    if (cartItems.length === 0) {
      dispatch(clearPaymentIntentError())
      return
    }



    const orderData = {
      items: cartItems,
      deliveryAddress: selectedAddress,
      shippingAddress: shippingSameAsDelivery ? selectedAddress : null,
      paymentMethod: selectedPaymentMethod,
      total: actualTotal,
      subtotal: subtotal,
      vat: vatAmount,
      shipping: shippingCost,
      discount: qoynsDiscountAmount + couponDiscountAmount + gigCompletionDiscountAmount + cashWalletDiscountAmount,
      couponCode: appliedCoupon ? appliedCoupon.discountCode : (appliedGigCompletion ? appliedGigCompletion.discountCode : null),
      // Shipping method information (from Jibly API)
      shippingMethod: selectedShippingMethod?.id || selectedShippingMethod?.methodId,
      shippingMethodName: selectedShippingMethod?.name || selectedShippingMethod?.methodName,
      shippingMethodTime: selectedShippingMethod?.deliveryTime || selectedShippingMethod?.estimatedDelivery || selectedShippingMethod?.time,
      shippingMethodCost: shippingCost
    }

    dispatch(createStripePaymentIntent(orderData))
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      dispatch(clearOrderError())
      return
    }

    if (cartItems.length === 0) {
      dispatch(clearOrderError())
      return
    }



    const orderData = {
      items: cartItems,
      deliveryAddress: selectedAddress,
      shippingAddress: shippingSameAsDelivery ? selectedAddress : null,
      paymentMethod: selectedPaymentMethod,
      total: actualTotal,
      subtotal: subtotal,
      vat: vatAmount,
      shipping: shippingCost,
      discount: qoynsDiscountAmount + couponDiscountAmount + gigCompletionDiscountAmount + cashWalletDiscountAmount,
      couponCode: appliedCoupon ? appliedCoupon.discountCode : (appliedGigCompletion ? appliedGigCompletion.discountCode : null),
      // Shipping method information (from Jibly API)
      shippingMethod: selectedShippingMethod?.id || selectedShippingMethod?.methodId,
      shippingMethodName: selectedShippingMethod?.name || selectedShippingMethod?.methodName,
      shippingMethodTime: selectedShippingMethod?.deliveryTime || selectedShippingMethod?.estimatedDelivery || selectedShippingMethod?.time,
      shippingMethodCost: shippingCost
    }

    dispatch(placeOrder(orderData))
  }

  const handleHostedCheckout = async () => {
    try {
      console.log('🚀 Checkout button clicked!')
      console.log('📦 Cart items:', cartItems)
      console.log('📍 Selected address:', selectedAddress)

      // Validation checks
      if (cartItems.length === 0) {
        showToast('Your cart is empty. Please add items before checkout.', 'error')
        return
      }

      if (!selectedAddress) {
        setAddressValidationError(true)
        showToast('Add a address first', 'error')
        // Scroll to address section
        setTimeout(() => {
          if (addressSectionRef.current) {
            addressSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
        return
      }
      
      // Clear validation error if address is selected
      setAddressValidationError(false)

      const key = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY : undefined
      const publishableKey = (typeof key === 'string' && key.trim()) ? key : ''

      console.log('🔑 Checking Stripe key...')
      if (!publishableKey) {
        console.error('❌ Stripe publishable key is missing!')
        showToast('Payment system not configured. Please contact support.', 'error')
        return
      }

      console.log('✅ Stripe key found')
      console.log('🔄 Loading Stripe...')

      const stripe = await loadStripe(publishableKey)
      if (!stripe) {
        console.error('❌ Stripe failed to initialize')
        alert('Failed to load payment system. Please refresh and try again.')
        return
      }

      console.log('✅ Stripe loaded successfully')
      console.log('🔑 Getting auth token...')

      const token = await getAuthToken()
      if (!token) {
        console.error('❌ No auth token')
        showToast('Please log in to continue with checkout.', 'error')
        return
      }

      console.log('✅ Auth token obtained')



      // Validate that all cart items have valid product IDs
      const invalidItems = cartItems.filter(item => !item.productId && !item.id)
      if (invalidItems.length > 0) {
        console.error('❌ Some cart items are missing product IDs:', invalidItems)
        showToast('Some items in your cart are missing product information. Please refresh and try again.', 'error')
        return
      }

      // Get both user IDs
      const { mongoUserId, cognitoUserId } = await getUserIds()
      console.log('👤 User IDs:', { mongoUserId, cognitoUserId })

      // Determine discount type - can be 'qoyn', 'coupon', 'gig_completion', 'both', or null
      let finalDiscountType = null
      if (appliedDiscount && appliedCoupon) {
        finalDiscountType = 'both'
      } else if (appliedDiscount && appliedGigCompletion) {
        finalDiscountType = 'qoyn_gig'
      } else if (appliedCoupon && appliedGigCompletion) {
        finalDiscountType = 'coupon_gig'
      } else if (appliedDiscount) {
        finalDiscountType = 'qoyn'
      } else if (appliedCoupon) {
        finalDiscountType = 'coupon'
      } else if (appliedGigCompletion) {
        finalDiscountType = 'gig_completion'
      }

      const body = {
        items: cartItems.map(item => {
          return {
            productId: item.productId || item.id,
            name: item.name || 'Product',
            quantity: item.quantity || 1,
            price: item.price || 0,
            image: item.image || undefined
          }
        }),
        total: actualTotal,
        subtotal: subtotal,
        vat: vatAmount,
        discount: qoynsDiscountAmount + couponDiscountAmount + gigCompletionDiscountAmount + cashWalletDiscountAmount,
        discountType: finalDiscountType,
        // Qoyns discount information
        qoynsUsed: appliedDiscount && appliedDiscount.type === 'qoyn' ? appliedDiscount.qoynAmount : undefined,
        qoynsDiscountAmount: qoynsDiscountAmount > 0 ? qoynsDiscountAmount : undefined,
        // Coupon discount information
        couponCode: appliedCoupon ? appliedCoupon.discountCode : (appliedGigCompletion ? appliedGigCompletion.discountCode : null),
        couponDiscountAmount: appliedCoupon ? couponDiscountAmount : undefined,
        couponDiscountPercentage: appliedCoupon ? appliedCoupon.customerDiscountPercentage : undefined,
        // Gig completion discount information
        gigCompletionDiscountAmount: appliedGigCompletion ? gigCompletionDiscountAmount : undefined,
        gigCompletionDiscountPercentage: appliedGigCompletion ? appliedGigCompletion.customerDiscountPercentage : undefined,
        gigCompletionDiscountFixed: appliedGigCompletion ? appliedGigCompletion.customerDiscountFixed : undefined,
        currency: 'usd',
        userId: mongoUserId, // MongoDB user ID
        cognitoUserId: cognitoUserId, // Cognito user ID
        deliveryAddress: selectedAddress, // Include selected delivery address
        shippingAddress: shippingSameAsDelivery ? selectedAddress : null, // Include shipping address
        successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/checkout`,
        ...(mongoUserId && { mongoUserId }) // Include MongoDB userId if available
      }

      // Store cash wallet redemption info in sessionStorage if using cash wallet
      if (useCashWallet && cashWalletDiscountAmount > 0) {
        const cashRedemptionInfo = {
          amountInAed: cashWalletDiscountAmount.toFixed(2)
        }
        sessionStorage.setItem('pendingCashRedemption', JSON.stringify(cashRedemptionInfo))
        console.log('💰 [CASH WALLET] Stored pending cash redemption:', cashRedemptionInfo)
      } else {
        sessionStorage.removeItem('pendingCashRedemption')
      }

      // Store gig completion info in sessionStorage if sales gig is used
      if (appliedGigCompletion) {
        const gigCompletionInfo = {
          discountCode: appliedGigCompletion.discountCode,
          customerDiscountPercentage: appliedGigCompletion.customerDiscountPercentage,
          customerDiscountFixed: appliedGigCompletion.customerDiscountFixed,
          totalAmount: finalTotal // Store total amount for commission calculation
        }
        sessionStorage.setItem('pendingGigCompletionPurchase', JSON.stringify(gigCompletionInfo))
        console.log('🎯 [GIG COMPLETION] Stored pending gig completion purchase:', gigCompletionInfo)
      } else {
        sessionStorage.removeItem('pendingGigCompletionPurchase')
      }

      console.log('📤 Creating checkout session...')
      console.log('🔗 Endpoint:', paymentEndpoints.stripeHostedCheckout)
      console.log('📦 Payload:', body)



      const res = await fetch(paymentEndpoints.stripeHostedCheckout, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      console.log('📥 Response status:', res.status)

      if (!res.ok) {
        const text = await res.text()
        console.error('❌ API Error:', text)
        alert(`Checkout failed: ${text.substring(0, 100)}`)
        throw new Error(text)
      }

      const { data } = await res.json()
      console.log('✅ Session created:', data)

      if (!data.sessionId) {
        console.error('❌ No session ID in response')
        alert('Checkout session creation failed. Please try again.')
        return
      }

      console.log('🔄 Redirecting to Stripe checkout...')
      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId })

      if (result.error) {
        console.error('❌ Redirect error:', result.error)
        showToast(`Checkout failed: ${result.error.message}`, 'error')
      }

    } catch (e) {
      console.error('❌ Hosted checkout error:', e)
      showToast(`Checkout error: ${e.message || 'Unknown error'}`, 'error')
    }
  }

  // Handle payment with Cash Wallet only (when order total is 0 after cash wallet discount)
  const handleCashWalletPayment = async () => {
    try {
      setIsCashWalletPaymentLoading(true)
      console.log('💰 [CASH WALLET PAYMENT] Starting cash wallet checkout...')

      // Validation checks
      if (cartItems.length === 0) {
        showToast('Your cart is empty. Please add items before checkout.', 'error')
        return
      }

      if (!selectedAddress) {
        setAddressValidationError(true)
        showToast('Add an address first', 'error')
        if (addressSectionRef.current) {
          addressSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return
      }

      if (!useCashWallet || cashWalletDiscountAmount <= 0) {
        showToast('Cash wallet not applied', 'error')
        return
      }

      const token = await getAuthToken()
      if (!token) {
        showToast('Please log in to continue with checkout.', 'error')
        return
      }

      // Build checkout payload
      const checkoutPayload = {
        items: cartItems.map(item => ({
          productId: item.productId || item.id,
          name: item.name || 'Product',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image || null
        })),
        currency: 'usd',
        total: actualTotal,
        subtotal: originalSubtotal,
        vat: vatAmount,
        discount: qoynsDiscountAmount + couponDiscountAmount + cashWalletDiscountAmount,
        cashWalletAmount: cashWalletDiscountAmount,
        qoynsDiscountAmount: qoynsDiscountAmount,
        couponDiscountAmount: couponDiscountAmount,
        couponCode: appliedCoupon?.discountCode || null,
        deliveryAddress: {
          fullName: selectedAddress.fullName,
          addressLine1: selectedAddress.addressLine1,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          phone: selectedAddress.phone,
          email: selectedAddress.email
        },
        shippingAddress: shippingSameAsDelivery ? {
          fullName: selectedAddress.fullName,
          addressLine1: selectedAddress.addressLine1,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
          phone: selectedAddress.phone,
          email: selectedAddress.email
        } : null,
        shippingMethod: selectedShippingMethod?.id || selectedShippingMethod?.methodId || 'standard',
        shippingMethodName: selectedShippingMethod?.name || selectedShippingMethod?.methodName || 'Standard Delivery',
        shippingMethodTime: selectedShippingMethod?.deliveryTime || selectedShippingMethod?.estimatedDelivery || selectedShippingMethod?.time,
        shippingMethodCost: shippingCost,
        shippingCost: shippingCost
      }

      console.log('📡 [CASH WALLET PAYMENT] Calling checkout API:', checkoutPayload)
      
      const response = await fetch(paymentEndpoints.cashWalletCheckout, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(checkoutPayload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [CASH WALLET PAYMENT] Failed:', response.status, errorText)
        try {
          const errorData = JSON.parse(errorText)
          showToast(errorData.message || 'Failed to process cash wallet payment.', 'error')
        } catch {
          showToast('Failed to process cash wallet payment. Please try again.', 'error')
        }
        return
      }

      const result = await response.json()
      console.log('✅ [CASH WALLET PAYMENT] Success:', result)

      // Redeem cash wallet amount after successful order
      try {
        console.log('💸 [CASH WALLET REDEEM] Calling redeem API for amount:', cashWalletDiscountAmount)
        const redeemResponse = await fetch('https://backendwallet.qliq.ae/api/wallet/cash/redeem', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amountInAed: cashWalletDiscountAmount.toFixed(2)
          })
        })
        
        if (redeemResponse.ok) {
          const redeemResult = await redeemResponse.json()
          console.log('✅ [CASH WALLET REDEEM] Success:', redeemResult)
        } else {
          console.error('❌ [CASH WALLET REDEEM] Failed:', redeemResponse.status)
        }
      } catch (redeemError) {
        console.error('❌ [CASH WALLET REDEEM] Error:', redeemError)
      }

      // Refresh cash wallet balance
      dispatch(fetchRedeemableCashBalance())

      // Clear cart
      dispatch(clearCart())

      // Show success toast briefly then redirect
      showToast('Payment successful with Cash Wallet!', 'success')
      
      // Use router.push for proper Next.js navigation
      const orderId = result.data?.order?._id || result.data?.orderId || ''
      const redirectUrl = `/checkout/success?payment_method=cash_wallet${orderId ? `&order_id=${orderId}` : ''}`
      
      // Small delay to allow toast to show, then redirect
      setTimeout(() => {
        window.location.replace(redirectUrl)
      }, 500)
      
      return // Prevent finally block from resetting loading state before redirect

    } catch (error) {
      console.error('❌ [CASH WALLET PAYMENT] Error:', error)
      showToast(`Payment error: ${error.message || 'Unknown error'}`, 'error')
      setIsCashWalletPaymentLoading(false)
    }
  }

  // Qoyn validation handlers (only validates, doesn't redeem - redemption happens on order success)
  const handleQoynValidation = async () => {
    if (!qoynValidation.walletUnlocked || !qoynValidation.eligibleForDiscount) {
      showToast('Qoyn redemption is not available for this order', 'error')
      return
    }

    if (qoynValidation.currentDiscountQoyn <= 0) {
      showToast('No Qoyns available to apply', 'error')
      return
    }

    try {
      // Use subtotal after gig completion discount since Qoyns are applied to subtotal after gig discount
      const result = await dispatch(validateQoynRedemption({
        totalAmount: subtotalAfterGigCompletion
      }))
      
      if (result.payload && result.payload.data && result.payload.data.order) {
        const orderData = result.payload.data.order
        
        // Extract productIds and storeId for later redemption
        const productIds = cartItems
          .map(item => item.productId || item.id)
          .filter(id => id) // Remove any undefined/null values
        
        const storeId = cartItems[0]?.storeId || null
        
        // Only store the discount info - don't redeem yet
        // Redemption will happen when order is successfully placed
        const discountInfo = {
          type: 'qoyn',
          discountAmount: orderData.discountAmountStoreCurrency,
          totalAfterDiscount: orderData.totalAmountAfterDiscount,
          qoynAmount: qoynValidation.currentDiscountQoyn,
          totalAmount: subtotalAfterGigCompletion, // Store for redemption later
          productIds: productIds, // Store for redemption later
          storeId: storeId // Store for redemption later
        }
        
        setAppliedDiscount(discountInfo)
        
        // Store in sessionStorage for access on success page
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pendingQoynRedemption', JSON.stringify(discountInfo))
        }
        
        showToast(`Applied ${qoynValidation.currentDiscountQoyn} Qoyns successfully!`, 'success')
      }
    } catch (error) {
      console.error('Qoyn validation error:', error)
      showToast('Failed to apply Qoyns. Please try again.', 'error')
    }
  }

  // Remove applied discount (no coins to restore since they weren't redeemed yet)
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    // Clear sessionStorage since Qoyns are no longer applied
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('pendingQoynRedemption')
    }
  }
  
  // Handle coupon selection - populate the promo code input and apply
  const handleCouponSelect = (couponId) => {
    if (!couponId) {
      setSelectedCouponId('')
      setPromoCodeInput('')
      return
    }
    
    const selectedCoupon = availableCoupons.find(c => c._id === couponId)
    if (selectedCoupon) {
      setSelectedCouponId(couponId)
      setPromoCodeInput(selectedCoupon.discountCode)
      // Automatically apply the coupon when selected
      handleApplyCouponDirectly(selectedCoupon)
    }
  }
  
  // Apply coupon directly (used when clicking from dropdown)
  const handleApplyCouponDirectly = (coupon) => {
    // Clear any existing discount first
    if (appliedDiscount) {
      setAppliedDiscount(null)
    }
    
    // Apply the coupon
    dispatch(setAppliedCoupon(coupon))
    setSelectedCouponId(coupon._id)
    setPromoCodeInput(coupon.discountCode)
    showToast(`Coupon ${coupon.discountCode} applied successfully!`, 'success')
  }
  
  // Handle coupon application from promo code input
  const handleApplyCoupon = () => {
    if (!promoCodeInput.trim()) {
      showToast('Please enter or select a coupon code', 'error')
      return
    }
    
    // First check available coupons (matching cart items)
    let selectedCoupon = availableCoupons.find(c => 
      c.discountCode.toLowerCase() === promoCodeInput.trim().toLowerCase()
    )
    
    // If not found in available coupons, check all coupons from API
    if (!selectedCoupon && coupons.length > 0) {
      selectedCoupon = coupons.find(c => 
        c.discountCode.toLowerCase() === promoCodeInput.trim().toLowerCase()
      )
    }
    
    if (!selectedCoupon) {
      showToast('Invalid coupon code or coupon not available for items in cart', 'error')
      return
    }
    
    // Clear any existing discount first
    if (appliedDiscount) {
      setAppliedDiscount(null)
    }
    
    // Apply the coupon
    dispatch(setAppliedCoupon(selectedCoupon))
    setSelectedCouponId(selectedCoupon._id)
    setPromoCodeInput(selectedCoupon.discountCode) // Ensure the code is displayed
    showToast(`Coupon ${selectedCoupon.discountCode} applied successfully!`, 'success')
  }
  
  // Handle coupon removal
  const handleRemoveCoupon = () => {
    dispatch(clearAppliedCoupon())
    setSelectedCouponId('')
    setPromoCodeInput('')
    showToast('Coupon removed', 'success')
  }

  // Handle gig completion selection and application
  const handleGigCompletionSelect = (gigId) => {
    if (!gigId) {
      setSelectedGigCompletionId('')
      if (appliedGigCompletion) {
        handleRemoveGigCompletion()
      }
      return
    }

    const selectedGig = availableGigCompletions.find(g => g._id === gigId)
    if (selectedGig) {
      setSelectedGigCompletionId(gigId)
      dispatch(setAppliedGigCompletion(selectedGig))
      const discountText = selectedGig.customerDiscountPercentage > 0 
        ? `${selectedGig.customerDiscountPercentage}% off`
        : `AED ${selectedGig.customerDiscountFixed} off`
      showToast(`Gig completion offer ${selectedGig.discountCode} (${discountText}) applied!`, 'success')
    }
  }

  // Handle gig completion removal
  const handleRemoveGigCompletion = () => {
    dispatch(clearAppliedGigCompletion())
    setSelectedGigCompletionId('')
    showToast('Gig completion offer removed', 'success')
  }

  const handlePromoCodeValidation = async () => {
    if (!promoCodeInput.trim()) {
      showToast('Please enter a promo code', 'error')
      return
    }

    // Check if it's a coupon code first
    const couponMatch = coupons.find(c => 
      c.discountCode.toLowerCase() === promoCodeInput.trim().toLowerCase()
    )
    
    if (couponMatch) {
      // It's a coupon, try to apply it
      handleApplyCoupon()
      return
    }

    // For other promo codes, show not implemented message
    showToast(`Promo code "${promoCodeInput}" validation not implemented yet`, 'error')
  }

  const handlePaymentSuccess = () => {
    // Clear Stripe data and redirect to success page
    dispatch(clearStripeData())
    window.location.href = '/checkout/success'
  }

  const handlePaymentError = (error) => {
    console.error('Payment error:', error)
    dispatch(clearPaymentIntentError())
  }
  return (
    <div className={styles.checkoutPage}>
      <Navigation />

      <div className={styles.checkoutContainer}>
        <h1 className={styles.checkoutTitle}>CHECKOUT</h1>
        <p className={styles.checkoutSubtitle}>
          Complete your order by selecting delivery address and payment method.
        </p>

        {error && (
          <div className={styles.errorMessage}>
            {error}
            {error.includes('cart is empty') && (
              <button
                className={styles.refreshCartBtn}
                onClick={async () => {
                  try {
                    const userId = await getUserFromCookies()
                    if (userId) {
                      dispatch(fetchCart(userId))
                    }
                  } catch (error) {
                    console.log('No user found in cookies')
                  }
                }}
              >
                Refresh Cart
              </button>
            )}
          </div>
        )}

        {!cartLoading && cartItems.length === 0 && !error && (
          <div className={styles.errorMessage}>
            Your cart is empty. Please add items to proceed with checkout.
            <button
              className={styles.refreshCartBtn}
              onClick={async () => {
                try {
                  const userId = await getUserFromCookies()
                  if (userId) {
                    dispatch(fetchCart(userId))
                  }
                } catch (error) {
                  console.log('No user found in cookies')
                }
              }}
            >
              Refresh Cart
            </button>
          </div>
        )}
        <div className={styles.checkoutContent}>
          {/* Left Side */}
          <div className={styles.checkoutLeft}>
            {/* Wallet Card */}
            <div className={styles.walletCard}>
              <div className={styles.walletIcon}>
                <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#0082FF" />
                  <path d="M12 16L16 20L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className={styles.walletTitle}>My Qoyns Wallet</div>
              </div>
              <div className={styles.walletInfo}>
                <div className={styles.walletBalance}>{displayedQoynBalance.toLocaleString()}</div>
              </div>
              <div className={styles.walletExpiry}>
                {(() => {
                  const daysRemaining = calculateDaysRemaining(qoynExpiryDate)
                  
                  if (daysRemaining !== null) {
                    return `${daysRemaining} ${daysRemaining === 1 ? 'Day' : 'Days'} remaining`
                  } else {
                    return 'No expiry is available'
                  }
                })()}
              </div>
            </div>


            {/* Delivery Address */}
            <div ref={addressSectionRef} className={`${styles.section} ${addressValidationError ? styles.addressError : ''}`}>
              <div className={`${styles.sectionHeader} ${addressValidationError ? styles.sectionHeaderError : ''}`}>Delivery Address</div>

              {loadingAddresses ? (
                <div className={styles.loadingText}>Loading addresses...</div>
              ) : allAddresses.length > 0 ? (
                <>
                  {/* Display existing addresses */}
                  <div className={styles.addressesList}>
                    {displayAddresses.map((address) => {
                      const addressId = address.id || address._id
                      const isSelected = (selectedAddress?.id || selectedAddress?._id) === addressId
                      
                      return (
                      <div
                        key={addressId}
                        className={`${styles.addressCard} ${isSelected ? styles.selectedAddress : ''}`}
                        onClick={async () => {
                          // Update selected address immediately for better UX
                          dispatch(setSelectedAddress(address))
                          
                          // Call API to set as default address
                          if (!isSelected) {
                            await handleSetDefaultAddress(addressId)
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={styles.addressType}>
                          <div className={styles.addressTypeInfo}>
                            {/* <FontAwesomeIcon 
                              icon={
                                address.type === 'home' ? faHome : 
                                address.type === 'work' ? faBriefcase : 
                                faMapMarkerAlt
                              } 
                              className={styles.addressTypeIcon}
                            /> */}
                            <span className={styles.addressLabel}>{address.type}</span>
                            {/* {address.isDefault && (
                              <span className={styles.defaultBadge}>Default</span>
                            )} */}
                          </div>
                          {isSelected && (
                            <div className={styles.selectedIndicator}>
                              <FontAwesomeIcon icon={faCheck} className={styles.checkIcon} />
                            </div>
                          )}
                        </div>
                        <div className={styles.addressDetails}>
                          <div className={styles.addressText}>
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </div>
                          <div className={styles.addressLocation}>
                            {address.city}, {address.state} {address.postalCode}
                          </div>
                          <div className={styles.addressContact}>{address.phone}</div>
                          <div className={styles.addressContact}>{address.email}</div>
                        </div>
                        {/* {!address.isDefault && (
                          <button 
                            className={styles.setDefaultBtn}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSetDefaultAddress(address.id)
                            }}
                          >
                            Set as Default
                          </button>
                        )} */}
                      </div>
                      )
                    })}
                  </div>

                  {/* No address selected message */}
                  {!selectedAddress && (
                    <div className={styles.noAddressSelected}>
                      <p>Please select an address to continue with your order.</p>
                    </div>
                  )}

                  {/* Button row - View More and Add New Address */}
                  <div className={styles.addressButtonsRow}>
                    {allAddresses.length > 2 && (
                      <button
                        className={styles.viewMoreBtn}
                        onClick={() => setShowAllAddresses(!showAllAddresses)}
                      >
                        {showAllAddresses ? 'View Less' : `View More`}
                      </button>
                    )}

                    <button
                      className={styles.addAddressBtn}
                      onClick={() => {
                        setAddressValidationError(false)
                        dispatch(setShowAddressForm(!showAddressForm))
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} className={styles.addIcon} />
                      Add New Address
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.noAddresses}>
                  <p>No addresses found. Please add an address to continue.</p>
                  <button
                    className={styles.addAddressBtn}
                    onClick={() => {
                      setAddressValidationError(false)
                      dispatch(setShowAddressForm(true))
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} className={styles.addIcon} />
                    Add Address
                  </button>
                </div>
              )}

              {/* Address Form */}
              {showAddressForm && (
                <form className={styles.addressForm} onSubmit={handleAddressSubmit}>
                  {error && (
                    <div className={styles.errorMessage}>
                      {error}
                    </div>
                  )}
                  <div className={styles.addressFormTabs}>
                    <button
                      type="button"
                      className={`${styles.addressTab} ${addressForm.type === 'home' ? styles.active : ''}`}
                      onClick={() => handleAddressFormChange('type', 'home')}
                      title="Home"
                    >
                      <FontAwesomeIcon
                        icon={faHome}
                        className={styles.addressTabIcon}
                        style={{ color: addressForm.type === 'home' ? '#FFFFFF' : '#000000' }}
                      />
                    </button>
                    <button
                      type="button"
                      className={`${styles.addressTab} ${addressForm.type === 'work' ? styles.active : ''}`}
                      onClick={() => handleAddressFormChange('type', 'work')}
                      title="Work"
                    >
                      <FontAwesomeIcon
                        icon={faBriefcase}
                        className={styles.addressTabIcon}
                        style={{ color: addressForm.type === 'work' ? '#FFFFFF' : '#000000' }}
                      />
                    </button>
                    <button
                      type="button"
                      className={`${styles.addressTab} ${addressForm.type === 'other' ? styles.active : ''}`}
                      onClick={() => handleAddressFormChange('type', 'other')}
                      title="Other"
                    >
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className={styles.addressTabIcon}
                        style={{ color: addressForm.type === 'other' ? '#FFFFFF' : '#000000' }}
                      />
                    </button>
                    <input
                      className={styles.addressLabelInput}
                      placeholder="Custom Label"
                      value={addressForm.type}
                      onChange={(e) => handleAddressFormChange('type', e.target.value)}
                    />
                  </div>
                  <div className={styles.addressFormGrid}>
                    <input
                      className={styles.addressInput}
                      placeholder="Full Name"
                      value={addressForm.fullName}
                      onChange={(e) => handleAddressFormChange('fullName', e.target.value)}
                      required
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Phone"
                      value={addressForm.phone}
                      onChange={(e) => handleAddressFormChange('phone', e.target.value)}
                      required
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Email"
                      type="email"
                      value={addressForm.email}
                      onChange={(e) => handleAddressFormChange('email', e.target.value)}
                      required
                    />
                    <select
                      className={styles.addressInput}
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      required
                      disabled={loadingCountries}
                    >
                      <option value="">{loadingCountries ? 'Loading...' : 'Select Country'}</option>
                      {countries.map((country) => (
                        <option key={country.isoCode} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {selectedCountry && (
                      <select
                        className={styles.addressInput}
                        value={selectedCity}
                        onChange={handleCityChange}
                        disabled={!selectedCountry || loadingCities}
                        required
                      >
                        <option value="">{loadingCities ? 'Loading...' : 'Select City'}</option>
                        {cities.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {shouldShowZonesDropdown && (
                      <select
                        className={styles.addressInput}
                        value={selectedState}
                        onChange={handleZoneChange}
                        disabled={!selectedCity || loadingZones}
                        required
                      >
                        <option value="">{loadingZones ? 'Loading...' : 'Select Zone'}</option>
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.name}>
                            {zone.name}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    )}
                    <input
                      id="address-line-1-autocomplete"
                      ref={addressLine1AutocompleteRef}
                      className={styles.addressInput}
                      placeholder="Search Address (e.g., Latifa Tower)"
                      value={addressForm.addressLine1}
                      onChange={(e) => handleAddressFormChange('addressLine1', e.target.value)}
                      required
                      autoComplete="off"
                      style={{ gridColumn: 'span 2' }}
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Address Line 2 (Flat Number, Building Number)"
                      value={addressForm.addressLine2}
                      onChange={(e) => handleAddressFormChange('addressLine2', e.target.value)}
                      style={{ gridColumn: 'span 2' }}
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Postal Code"
                      value={addressForm.postalCode}
                      onChange={(e) => handleAddressFormChange('postalCode', e.target.value)}
                      required
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Landmark"
                      value={addressForm.landmark}
                      onChange={(e) => handleAddressFormChange('landmark', e.target.value)}
                    />
                    <textarea
                      className={styles.addressInput}
                      placeholder="Delivery Instructions"
                      value={addressForm.instructions}
                      onChange={(e) => handleAddressFormChange('instructions', e.target.value)}
                      rows="3"
                      style={{ gridColumn: 'span 2', width: '100%', resize: 'vertical' }}
                    />
                  </div>
                  <div className={styles.addressFormActions}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => {
                        setAddressValidationError(false)
                        dispatch(setShowAddressForm(false))
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.saveBtn}
                      disabled={isSubmittingAddress}
                    >
                      {isSubmittingAddress ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Shipping Address */}
            {/* <div className={styles.section}>
              <div className={styles.sectionHeader}>Shipping Address</div>
              <div className={styles.shippingTabs}>
                <button
                  className={shippingSameAsDelivery ? styles.shippingTab1 : styles.shippingTab}
                  onClick={() => {
                    dispatch(setShippingSameAsDelivery(true))
                    dispatch(setShowShippingForm(false))
                  }}
                >
                  Same as Delivery Address
                </button>
                <button
                  className={!shippingSameAsDelivery ? styles.shippingTab1 : styles.shippingTab}
                  onClick={() => {
                    dispatch(setShippingSameAsDelivery(false))
                    dispatch(setShowShippingForm(true))
                  }}
                >
                  Use a Different Address
                </button>
              </div>
              {shippingSameAsDelivery && selectedAddress && (
                <div className={styles.sameAsDeliveryMessage}>
                  <FontAwesomeIcon icon={faCheck} className={styles.checkIcon} />
                  <span>Using the same address as delivery address</span>
                </div>
              )}
              {!shippingSameAsDelivery && showShippingForm && (
                <form className={styles.addressForm} onSubmit={handleAddressSubmit}>
                  <div className={styles.addressFormTabs}>
                    <button
                      type="button"
                      className={`${styles.addressTab} ${addressForm.type === 'home' ? styles.active : ''}`}
                      onClick={() => handleAddressFormChange('type', 'home')}
                      title="Home"
                    >
                      <FontAwesomeIcon
                        icon={faHome}
                        className={styles.addressTabIcon}
                        style={{ color: addressForm.type === 'home' ? '#FFFFFF' : '#000000' }}
                      />
                    </button>
                    <button
                      type="button"
                      className={`${styles.addressTab} ${addressForm.type === 'work' ? styles.active : ''}`}
                      onClick={() => handleAddressFormChange('type', 'work')}
                      title="Work"
                    >
                      <FontAwesomeIcon
                        icon={faBriefcase}
                        className={styles.addressTabIcon}
                        style={{ color: addressForm.type === 'work' ? '#FFFFFF' : '#000000' }}
                      />
                    </button>
                    <button
                      type="button"
                      className={`${styles.addressTab} ${addressForm.type === 'other' ? styles.active : ''}`}
                      onClick={() => handleAddressFormChange('type', 'other')}
                      title="Other"
                    >
                      <FontAwesomeIcon
                        icon={faMapMarkerAlt}
                        className={styles.addressTabIcon}
                        style={{ color: addressForm.type === 'other' ? '#FFFFFF' : '#000000' }}
                      />
                    </button>
                    <input
                      className={styles.addressLabelInput}
                      placeholder="Custom Label"
                      value={addressForm.type}
                      onChange={(e) => handleAddressFormChange('type', e.target.value)}
                    />
                  </div>
                  <div className={styles.addressFormGrid}>
                    <input
                      className={styles.addressInput}
                      placeholder="Full Name"
                      value={addressForm.fullName}
                      onChange={(e) => handleAddressFormChange('fullName', e.target.value)}
                      required
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Phone"
                      value={addressForm.phone}
                      onChange={(e) => handleAddressFormChange('phone', e.target.value)}
                      required
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Email"
                      type="email"
                      value={addressForm.email}
                      onChange={(e) => handleAddressFormChange('email', e.target.value)}
                      required
                    />
                    <select
                      className={styles.addressInput}
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      required
                      disabled={loadingCountries}
                    >
                      <option value="">{loadingCountries ? 'Loading...' : 'Select Country'}</option>
                      {countries.map((country) => (
                        <option key={country.isoCode} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {selectedCountry && (
                      <select
                        className={styles.addressInput}
                        value={selectedCity}
                        onChange={handleCityChange}
                        disabled={!selectedCountry || loadingCities}
                        required
                      >
                        <option value="">{loadingCities ? 'Loading...' : 'Select City'}</option>
                        {cities.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {shouldShowZonesDropdown && (
                      <select
                        className={styles.addressInput}
                        value={selectedState}
                        onChange={handleZoneChange}
                        disabled={!selectedCity || loadingZones}
                        required
                      >
                        <option value="">{loadingZones ? 'Loading...' : 'Select Zone'}</option>
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.name}>
                            {zone.name}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    )}
                    <input
                      className={styles.addressInput}
                      placeholder="Postal Code"
                      value={addressForm.postalCode}
                      onChange={(e) => handleAddressFormChange('postalCode', e.target.value)}
                      required
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Address Line 1"
                      value={addressForm.addressLine1}
                      onChange={(e) => handleAddressFormChange('addressLine1', e.target.value)}
                      required
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Address Line 2"
                      value={addressForm.addressLine2}
                      onChange={(e) => handleAddressFormChange('addressLine2', e.target.value)}
                    />
                    <input
                      className={styles.addressInput}
                      placeholder="Landmark"
                      value={addressForm.landmark}
                      onChange={(e) => handleAddressFormChange('landmark', e.target.value)}
                    />
                    <textarea
                      className={styles.addressInput}
                      placeholder="Delivery Instructions"
                      value={addressForm.instructions}
                      onChange={(e) => handleAddressFormChange('instructions', e.target.value)}
                      rows="3"
                    />
                  </div>
                  <div className={styles.addressFormActions}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => {
                        dispatch(setShowShippingForm(false))
                        dispatch(setShippingSameAsDelivery(true))
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={styles.saveBtn}>Save</button>
                  </div>
                </form>
              )}
            </div> */}

            {/* Shipping Method */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>Shipping Method</div>
              {loadingShippingMethods ? (
                <div className={styles.shippingMethodCard}>
                  <span>Loading shipping methods...</span>
                </div>
              ) : shippingMethods.length > 0 ? (
                <div className={styles.shippingMethodsList}>
                  {shippingMethods.map((method) => (
                    <div
                      key={method.id || method.name}
                      className={`${styles.shippingMethodCard} ${selectedShippingMethod?.id === method.id ||
                        selectedShippingMethod?.name === method.name 
                          ? styles.shippingMethodSelected 
                          : ''
                      }`}
                      onClick={() => setSelectedShippingMethod(method)}
                      style={{ cursor: 'pointer', marginBottom: '8px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{method.name || method.methodName || 'Standard'}</span>
                          {method.cost && (
                            <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>
                              (AED {method.cost})
                            </span>
                          )}
                        </div>
                        <span className={styles.shippingTime}>
                          {method.deliveryTime || method.estimatedDelivery || method.time || '3 - 5 Days'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedAddress ? (
                <div className={styles.shippingMethodCard}>
                  <span>No shipping methods available</span>
                </div>
              ) : (
                <div className={styles.shippingMethodCard}>
                  <span>Please select an address to see shipping methods</span>
                </div>
              )}
            </div>

            {/* Payment Method */}
            {/* <div className={styles.section}>
              <div className={styles.sectionHeader}>Payment Method</div>
              <div className={styles.paymentMethods}>
                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit-card"
                    checked={true}
                    readOnly
                    className={styles.paymentRadio}
                  />
                  <div className={styles.paymentContent}>
                    <div className={styles.paymentText}>Pay with Stripe</div>
                  </div>
                </label>
                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="tabby"
                    checked={selectedPaymentMethod === 'tabby'}
                    onChange={(e) => {
                      dispatch(setSelectedPaymentMethod(e.target.value))
                      dispatch(clearStripeData()) // Clear Stripe data when switching to other methods
                    }}
                    className={styles.paymentRadio}
                  />
                  <div className={styles.paymentContent}>
                    <div className={styles.paymentText}>
                      Pay With <span className={styles.paymentBadgeTabby}>tabby</span>
                    </div>
                  </div>
                </label>
                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="tamara"
                    checked={selectedPaymentMethod === 'tamara'}
                    onChange={(e) => {
                      dispatch(setSelectedPaymentMethod(e.target.value))
                      dispatch(clearStripeData()) // Clear Stripe data when switching to other methods
                    }}
                    className={styles.paymentRadio}
                  />
                  <div className={styles.paymentContent}>
                    <div className={styles.paymentText}>
                      Pay With <span className={styles.paymentBadgeTamara}>tamara</span>
                    </div>
                  </div>
                </label>

              </div>

            </div> */}
          </div>

          {/* Right Side - Order Summary */}
          <div className={styles.checkoutRight}>
            <div className={styles.orderSummary}>
              {cartLoading ? (
                <div className={styles.loadingText}>Loading cart items...</div>
              ) : cartItems.length > 0 ? (
                <>
                  {cartItems.map((item, index) => {
                    const hasDiscount = hasAnyDiscount(item)
                    const discountedPrice = getProductDiscountedPrice(item)
                    const originalPrice = item.price || 0
                    const discountPercentage = getProductDiscountPercentage(item)
                    const discountCode = getProductDiscountCode(item)
                    
                    return (
                      <div key={index} className={styles.productItem}>
                        <Image
                          src={item.image || '/iphone.jpg'}
                          alt={item.name || "Product"}
                          width={60}
                          height={60}
                          className={styles.productImage}
                        />
                        <div className={styles.productDetails}>
                          <div className={styles.productBrand}>{item.brand || "Brand"}</div>
                          <div className={styles.productName}>
                            {item.name || "Product Name"}
                            {hasDiscount && discountPercentage > 0 && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '12px', 
                                color: '#0082FF', 
                                fontWeight: '600',
                                background: '#E6F3FF',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                {discountPercentage}% OFF {discountCode ? `(${discountCode})` : ''}
                              </span>
                            )}
                            {hasDiscount && discountPercentage === 0 && appliedGigCompletion?.customerDiscountFixed > 0 && (
                              <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '12px', 
                                color: '#0082FF', 
                                fontWeight: '600',
                                background: '#E6F3FF',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                OFF {discountCode ? `(${discountCode})` : ''}
                              </span>
                            )}
                          </div>
                          <div className={styles.productQuantity}>Qty: {item.quantity}</div>
                        </div>
                        <div className={styles.productPrice}>
                          {hasDiscount ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <span style={{ 
                                textDecoration: 'line-through', 
                                color: '#999', 
                                fontSize: '14px' 
                              }}>
                                AED {originalPrice.toFixed(2)}
                              </span>
                              <span style={{ color: '#0082FF', fontWeight: '600' }}>
                                AED {discountedPrice.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span>AED {originalPrice.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className={styles.emptyCart}>
                  <p>Your cart is empty</p>
                  <p>Add items to proceed with checkout</p>
                </div>
              )}
              <div className={styles.orderSummaryMessage}>
                <div className={styles.walletExpiry}>
                  {qoynValidation.walletUnlocked && qoynValidation.eligibleForDiscount 
                   
                    ? `${qoynValidation.message}`
                    : qoynValidation.totalQoynBalance === 0 && qoynValidation.message
                      ? qoynValidation.message
                      : `${qoynValidation.message}`
                  }
                </div>
              </div>
              {qoynValidation.walletUnlocked && qoynValidation.eligibleForDiscount && (
                <>
                  {/* Qoyns Input */}
                  <div className={styles.promoCode}>
                    <input 
                      className={styles.promoInput} 
                      value={`${qoynValidation.currentDiscountQoyn || 0} Qoyns`}
                      readOnly
                      disabled={!qoynValidation.walletUnlocked || !qoynValidation.eligibleForDiscount}
                    />
                    <button 
                      className={styles.promoApplyBtn}
                      onClick={appliedDiscount ? handleRemoveDiscount : handleQoynValidation}
                      disabled={!qoynValidation.walletUnlocked || !qoynValidation.eligibleForDiscount || qoynValidation.isValidationLoading}
                    >
                      {qoynValidation.isValidationLoading ? 'Validating...' : appliedDiscount ? '✕' : 'Apply'}
                    </button>
                  </div>
                </>
              )}
              {/* <div className={styles.qoynsSliderSection}>
                <div className={styles.qoynsSliderLabel}>Choose Qoyns to use</div>
                <div className={styles.qoynsSliderTrack}>
                  <input type="range" min="10" max="50" step="10" className={styles.qoynsSlider} />
                  <div className={styles.qoynsSliderTicks}>
                    <span>10%</span>
                    <span>20%</span>
                    <span>30%</span>
                    <span>40%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div> */}
              {/* Coupon Dropdown - Select and apply discount code - ONLY show matching coupons */}
              {availableCoupons.length > 0 && (
                <div className={styles.couponDropdownSection}>
                  {/* <div className={styles.couponDropdownLabel}>Select Coupon:</div> */}
                  <div className={styles.couponSelectWrapper}>
                    <select
                      className={styles.couponSelect}
                      value={appliedCoupon ? appliedCoupon._id : selectedCouponId}
                      onChange={(e) => {
                        const couponId = e.target.value
                        if (couponId) {
                          // Only allow selection from availableCoupons (matching ones)
                          const selectedCoupon = availableCoupons.find(c => c._id === couponId)
                          if (selectedCoupon) {
                            // Automatically apply the coupon when selected
                            handleApplyCouponDirectly(selectedCoupon)
                          }
                        } else {
                          // If "Choose a coupon code" is selected, remove applied coupon
                          if (appliedCoupon) {
                            handleRemoveCoupon()
                          }
                          setSelectedCouponId('')
                        }
                      }}
                      disabled={!!appliedCoupon}
                    >
                      <option value="">{appliedCoupon ? appliedCoupon.discountCode : 'Choose a coupon code'}</option>
                      {/* Only show coupons that match cart items (productId === pid) */}
                      {availableCoupons.map((coupon) => (
                        <option key={coupon._id} value={coupon._id}>
                          {coupon.discountCode} ({coupon.customerDiscountPercentage}% off)
                        </option>
                      ))}
                    </select>
                    {appliedCoupon && (
                      <button 
                        className={styles.couponRemoveBtn}
                        onClick={handleRemoveCoupon}
                        title="Remove coupon"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* {appliedCoupon && (
                <div className={styles.couponDiscountInfo}>
                  <span>Coupon {appliedCoupon.discountCode} ({appliedCoupon.customerDiscountPercentage}% off) applied: -AED {couponDiscountAmount.toFixed(2)}</span>
                </div>
              )} */}
              {/* Gig Completions Dropdown - Select and apply discount offer */}
              {availableGigCompletions.length > 0 && (
                <div className={styles.couponDropdownSection}>
                  <div className={styles.couponSelectWrapper}>
                    <select
                      className={styles.couponSelect}
                      value={appliedGigCompletion ? appliedGigCompletion._id : selectedGigCompletionId}
                      onChange={(e) => {
                        const gigId = e.target.value
                        handleGigCompletionSelect(gigId)
                      }}
                      disabled={!!appliedGigCompletion}
                    >
                      <option value="">
                        {appliedGigCompletion 
                          ? `${appliedGigCompletion.discountCode} (${appliedGigCompletion.customerDiscountPercentage > 0 ? `${appliedGigCompletion.customerDiscountPercentage}%` : `AED ${appliedGigCompletion.customerDiscountFixed}`} off)`
                          : 'Choose a gig completion offer'}
                      </option>
                      {availableGigCompletions.map((gig) => (
                        <option key={gig._id} value={gig._id}>
                          {gig.discountCode} ({gig.customerDiscountPercentage > 0 
                            ? `${gig.customerDiscountPercentage}% off`
                            : `AED ${gig.customerDiscountFixed} off`})
                        </option>
                      ))}
                    </select>
                    {appliedGigCompletion && (
                      <button 
                        className={styles.couponRemoveBtn}
                        onClick={handleRemoveGigCompletion}
                        title="Remove gig completion offer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* Cash Wallet Checkbox - Only show for influencer role */}
              {userRole === 'influencer' && redeemableCashAed > 0 && cartItems.length > 0 && (
                <div className={styles.cashWalletOption}>
                  <label className={styles.cashWalletLabel}>
                    <input
                      type="checkbox"
                      checked={useCashWallet}
                      onChange={(e) => setUseCashWallet(e.target.checked)}
                      className={styles.cashWalletCheckbox}
                    />
                    <span>Use Cash Wallet (AED {redeemableCashAed.toFixed(2)} available)</span>
                  </label>
                </div>
              )}
              {/* Totals */}
              {cartItems.length > 0 && (
                <div className={styles.orderTotals}>
                  <div className={styles.totalRow}>
                    <span>Subtotal</span>
                    <span>AED {subtotalAfterGigCompletion.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className={styles.totalRowDiscount}>
                      <span>Coupon Discount ({appliedCoupon.discountCode})</span>
                      <span>- AED {couponDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {appliedDiscount && qoynsDiscountAmount > 0 && (
                    <>
                      <div className={styles.totalRowDiscount}>
                        <span>Qoyns Discount</span>
                        <span>- AED {qoynsDiscountAmount.toFixed(2)}</span>
                      </div>
                      <div className={styles.totalRow}>
                        <span>Subtotal (after discount)</span>
                        <span>AED {subtotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {/* Gig Completion offer display removed per request (still applied to subtotal calculation) */}
                  <div className={styles.totalRow}>
                    <span>VAT ({(vatRate * 100).toFixed(0)}%)</span>
                    <span>AED {vatAmount.toFixed(2)}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Shipping</span>
                    <span>AED {shippingCost.toFixed(2)}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Order Total</span>
                    <span>AED {orderTotalBeforeCashWallet.toFixed(2)}</span>
                  </div>
                  {userRole === 'influencer' && useCashWallet && cashWalletDiscountAmount > 0 && (
                    <div className={styles.totalRowDiscount}>
                      <span>Cash Wallet</span>
                      <span>- AED {cashWalletDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className={styles.totalRowFinal}>
                    <span>Amount to Pay</span>
                    <span>AED {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
              {/* Show different button based on whether cash wallet covers full amount - Only for influencer */}
              {userRole === 'influencer' && useCashWallet && finalTotal <= 0 ? (
                <button
                  className={styles.placeOrderBtn}
                  onClick={handleCashWalletPayment}
                  disabled={cartItems.length === 0 || isCashWalletPaymentLoading}
                >
                  {isCashWalletPaymentLoading ? 'Processing...' : 'Pay with Cash Wallet'}
                </button>
              ) : (
              <button
                className={styles.placeOrderBtn}
                onClick={handleHostedCheckout}
                disabled={cartItems.length === 0}
              >
                Pay with Stripe
              </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

    </div>
  )
}