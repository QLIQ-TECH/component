'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { getAuthToken, getUserFromCookies } from '@/utils/userUtils'
import styles from '../checkout.module.css'
import successStyles from './success.module.css'
import { removeFromCart, clearCart } from '@/store/slices/cartSlice'
import { redeemQoyns } from '@/store/slices/checkoutSlice'
import { fetchUserBalance, fetchRedeemableCashBalance } from '@/store/slices/walletSlice'
import { orders, wallet } from '@/store/api/endpoints'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const cartItems = useSelector(state => state.cart.items || [])
  const [paymentStatus, setPaymentStatus] = useState('loading')
  const [paymentData, setPaymentData] = useState(null)
  const [error, setError] = useState(null)

  // Function to fetch the latest order and redeem Qoyns (with retry logic)
  const fetchOrderAndRedeemQoyns = async (sessionIdOrPaymentIntentId, type, retryCount = 0) => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 2000 // 2 seconds
    
    try {
      console.log(`🔍 [QOYNS REDEMPTION] Attempt ${retryCount + 1}/${MAX_RETRIES + 1} - Fetching order after payment confirmation...`)
      console.log('🔍 [QOYNS REDEMPTION] Session/Payment Intent ID:', sessionIdOrPaymentIntentId, 'Type:', type)
      
      // Check if there are pending Qoyns to redeem
      const pendingRedemption = sessionStorage.getItem('pendingQoynRedemption')
      if (!pendingRedemption) {
        console.log('⚠️ [QOYNS REDEMPTION] No pending Qoyn redemption found in sessionStorage')
        return
      }

      console.log('✅ [QOYNS REDEMPTION] Found pending redemption')
      const redemptionInfo = JSON.parse(pendingRedemption)
      console.log('✅ [QOYNS REDEMPTION] Parsed redemption info:', redemptionInfo)
      
      // Fetch the latest order for the user
      const token = await getAuthToken()
      if (!token) {
        console.error('❌ [QOYNS REDEMPTION] No auth token available')
        return
      }

      console.log('📡 [QOYNS REDEMPTION] Fetching user orders...')
      const ordersResponse = await fetch(`${orders.getUserOrders}?page=1&limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!ordersResponse.ok) {
        const errorText = await ordersResponse.text()
        console.error('❌ [QOYNS REDEMPTION] Failed to fetch orders:', ordersResponse.status, errorText)
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            fetchOrderAndRedeemQoyns(sessionIdOrPaymentIntentId, type, retryCount + 1)
          }, RETRY_DELAY)
        }
        return
      }

      const ordersData = await ordersResponse.json()
      console.log('📦 [QOYNS REDEMPTION] Orders response structure:', {
        hasData: !!ordersData.data,
        hasOrders: !!ordersData.orders,
        keys: Object.keys(ordersData)
      })
      
      // Get the latest order - handle different response structures
      const ordersList = ordersData?.data?.orders || 
                        ordersData?.orders?.orders || 
                        ordersData?.data || 
                        ordersData?.orders ||
                        []
      
      console.log('📦 [QOYNS REDEMPTION] Orders list length:', ordersList.length)
      
      if (!ordersList || ordersList.length === 0) {
        console.warn(`⚠️ [QOYNS REDEMPTION] No orders found (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 [QOYNS REDEMPTION] Retrying in ${RETRY_DELAY}ms...`)
          setTimeout(() => {
            fetchOrderAndRedeemQoyns(sessionIdOrPaymentIntentId, type, retryCount + 1)
          }, RETRY_DELAY)
        } else {
          console.error('❌ [QOYNS REDEMPTION] Max retries reached. Full response:', ordersData)
        }
        return
      }
      
      // Get the most recent order (first one, as they're sorted by createdAt descending)
      const latestOrder = ordersList[0]

      console.log('✅ [QOYNS REDEMPTION] Found latest order:', {
        orderNumber: latestOrder.orderNumber,
        orderId: latestOrder.orderId,
        _id: latestOrder._id,
        id: latestOrder.id,
        createdAt: latestOrder.createdAt
      })
      
      // Get order ID - try multiple fields (orderNumber is the primary identifier)
      const orderId = latestOrder.orderNumber || latestOrder.orderId || latestOrder._id || latestOrder.id
      
      if (!orderId) {
        console.error('❌ [QOYNS REDEMPTION] Order ID not found in order data. Order keys:', Object.keys(latestOrder))
        console.error('❌ [QOYNS REDEMPTION] Full order data:', latestOrder)
        return
      }

      console.log('🚀 [QOYNS REDEMPTION] Calling redemption API with:', {
        orderId,
        totalAmount: redemptionInfo.totalAmount,
        metadata: {
          storeId: redemptionInfo.storeId || undefined,
          productIds: redemptionInfo.productIds || []
        }
      })
      
      // Redeem Qoyns with actual order ID
      const result = await dispatch(redeemQoyns({
        orderId: orderId,
        totalAmount: redemptionInfo.totalAmount,
        metadata: {
          storeId: redemptionInfo.storeId || undefined,
          productIds: redemptionInfo.productIds || []
        }
      }))

      console.log('📥 [QOYNS REDEMPTION] Redemption result:', {
        type: result.type,
        error: result.error,
        payload: result.payload
      })

      if (redeemQoyns.fulfilled.match(result)) {
        console.log('✅ [QOYNS REDEMPTION] Qoyns redeemed successfully!')
        console.log('📊 [QOYNS REDEMPTION] Result payload:', result.payload)
        // Clear sessionStorage
        sessionStorage.removeItem('pendingQoynRedemption')
        console.log('🗑️ [QOYNS REDEMPTION] Cleared sessionStorage')
        // Refresh wallet balance
        dispatch(fetchUserBalance())
        console.log('🔄 [QOYNS REDEMPTION] Refreshed wallet balance')
      } else {
        console.error('❌ [QOYNS REDEMPTION] Failed to redeem Qoyns')
        console.error('❌ [QOYNS REDEMPTION] Error:', result.error)
        console.error('❌ [QOYNS REDEMPTION] Payload:', result.payload)
      }
    } catch (error) {
      console.error('❌ [QOYNS REDEMPTION] Exception occurred:', error)
      console.error('❌ [QOYNS REDEMPTION] Error stack:', error.stack)
      // Don't fail the entire success page if redemption fails
    }
  }

  // Function to notify gig completion purchase
  const notifyGigCompletionPurchase = async (order) => {
    try {
      console.log('🎯 [GIG COMPLETION] Checking for pending gig completion purchase...')
      
      const pendingGigPurchase = sessionStorage.getItem('pendingGigCompletionPurchase')
      if (!pendingGigPurchase) {
        console.log('⚠️ [GIG COMPLETION] No pending gig completion purchase found - sales gig may not have been used')
        return
      }

      const gigInfo = JSON.parse(pendingGigPurchase)
      console.log('✅ [GIG COMPLETION] Found pending gig completion purchase:', gigInfo)

      if (!gigInfo.discountCode) {
        console.log('⚠️ [GIG COMPLETION] Invalid gig completion info, skipping purchase notification')
        sessionStorage.removeItem('pendingGigCompletionPurchase')
        return
      }

      // Get order ID - try multiple fields
      const orderId = order?.orderNumber || order?.orderId || order?._id || order?.id
      if (!orderId) {
        console.error('❌ [GIG COMPLETION] Order ID not found, cannot notify purchase')
        return
      }

      // Calculate commission based on product prices only (sum of items), not subtotal which may include VAT
      // Commission should be calculated on the actual product price before any taxes or fees
      const orderItems = order?.items || []
      const orderCurrency = order?.currency || 'usd'
      
      // Calculate total product price from items (price × quantity for each item)
      const totalProductPrice = orderItems.reduce((sum, item) => {
        const itemPrice = item.price || 0
        const itemQuantity = item.quantity || 1
        return sum + (itemPrice * itemQuantity)
      }, 0)

      if (!totalProductPrice || totalProductPrice <= 0) {
        console.error('❌ [GIG COMPLETION] Order items not found or total product price is invalid, cannot calculate commission')
        console.error('❌ [GIG COMPLETION] Order items:', orderItems)
        return
      }

      console.log('📊 [GIG COMPLETION] Product price calculation:', {
        itemsCount: orderItems.length,
        totalProductPrice: totalProductPrice.toFixed(2),
        items: orderItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: (item.price * item.quantity).toFixed(2)
        }))
      })

      // Fetch gig completion details to get commission percentage
      const token = await getAuthToken()
      if (!token) {
        console.error('❌ [GIG COMPLETION] No auth token available')
        return
      }

      console.log('📡 [GIG COMPLETION] Fetching gig completion details...')
      const gigResponse = await fetch('https://backendgigs.qliq.ae/api/gig-completions/accepted-purchase-gigs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!gigResponse.ok) {
        console.error('❌ [GIG COMPLETION] Failed to fetch gig completions:', gigResponse.status)
        return
      }

      const gigData = await gigResponse.json()
      const gigCompletions = Array.isArray(gigData.data) ? gigData.data : []
      
      const matchingGig = gigCompletions.find(
        (gig) => gig.discountCode === gigInfo.discountCode
      )

      if (!matchingGig) {
        console.log('⚠️ [GIG COMPLETION] Gig completion not found for discount code:', gigInfo.discountCode)
        sessionStorage.removeItem('pendingGigCompletionPurchase')
        return
      }

      // Get influencer commission - can be fixed amount or percentage
      const commissionFixed = 
        matchingGig.influencerCommissionFixed ||
        matchingGig.commissionFixed ||
        0

      const commissionPercentage = 
        matchingGig.influencerCommissionPercentage ||
        matchingGig.commissionPercentage ||
        matchingGig.commission ||
        0

      // Check if we have either fixed or percentage commission
      if ((!commissionFixed || commissionFixed <= 0) && (!commissionPercentage || commissionPercentage <= 0)) {
        console.log('⚠️ [GIG COMPLETION] No commission (fixed or percentage) found, skipping purchase notification')
        sessionStorage.removeItem('pendingGigCompletionPurchase')
        return
      }

      // Use product price directly for commission (assume prices are in AED as charged)
      const productPriceInAED = totalProductPrice

      // Calculate influencer commission in AED
      // Priority: Fixed amount > Percentage
      // Commission is calculated on product price only (no VAT, no shipping, no discounts)
      let influencerCommission = 0
      if (commissionFixed && commissionFixed > 0) {
        // Use fixed commission amount directly (already in AED, no calculation needed)
        influencerCommission = commissionFixed
        console.log('💰 [GIG COMPLETION] Using fixed commission directly:', commissionFixed, 'AED')
      } else if (commissionPercentage && commissionPercentage > 0) {
        // Calculate commission as percentage of product price (before any taxes or fees)
        influencerCommission = (productPriceInAED * commissionPercentage) / 100
        // Round to 2 decimal places
        influencerCommission = Math.round(influencerCommission * 100) / 100
        console.log('💰 [GIG COMPLETION] Calculating percentage commission:', commissionPercentage + '% of', productPriceInAED.toFixed(2), 'AED (product price) =', influencerCommission.toFixed(2), 'AED')
      }

      console.log('🔄 [GIG COMPLETION] Calling purchase API:', {
        orderId,
        couponCode: gigInfo.discountCode,
        totalProductPrice: totalProductPrice.toFixed(2),
        productPriceInAED: productPriceInAED.toFixed(2),
        orderSubtotal: order?.subtotal?.toFixed(2) || 'N/A',
        commissionType: commissionFixed > 0 ? 'fixed' : 'percentage',
        commissionFixed: commissionFixed > 0 ? commissionFixed : null,
        commissionPercentage: commissionPercentage > 0 ? commissionPercentage : null,
        influencerCommission: influencerCommission.toFixed(2)
      })

      // Round commission to 2 decimal places (for both fixed and percentage)
      const finalCommission = Math.round(influencerCommission * 100) / 100

      const requestBody = {
        orderId: orderId,
        couponCode: gigInfo.discountCode,
        influencerCommission: finalCommission
      }

      const purchaseResponse = await fetch('https://backendgigs.qliq.ae/api/gig-completions/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!purchaseResponse.ok) {
        const errorText = await purchaseResponse.text()
        console.error('❌ [GIG COMPLETION] Failed to notify purchase:', purchaseResponse.status, errorText)
        try {
          const errorData = JSON.parse(errorText)
          console.error('❌ [GIG COMPLETION] Error details:', errorData)
        } catch {
          // Error text is not JSON, already logged
        }
        return
      }

      const result = await purchaseResponse.json()
      console.log('✅ [GIG COMPLETION] Purchase notification sent successfully:', result)
      
      // Clear sessionStorage after successful notification
      sessionStorage.removeItem('pendingGigCompletionPurchase')
      console.log('🗑️ [GIG COMPLETION] Cleared sessionStorage')
    } catch (error) {
      console.error('❌ [GIG COMPLETION] Exception occurred:', error)
      // Don't fail the entire success page if gig completion notification fails
    }
  }

  // Function to create delivery order
  // const createDeliveryOrder = async (order) => {
  //   try {
  //     console.log('🚚 [DELIVERY ORDER] Creating delivery order...')
      
  //     if (!order) {
  //       console.error('❌ [DELIVERY ORDER] Order data is missing')
  //       return
  //     }

  //     // Get auth token
  //     const token = await getAuthToken()
  //     if (!token) {
  //       console.error('❌ [DELIVERY ORDER] No auth token available')
  //       return
  //     }

  //     // Extract vendor info from items array (use first item's vendor)
  //     const orderItems = order?.items || []
  //     if (orderItems.length === 0) {
  //       console.error('❌ [DELIVERY ORDER] No items found in order')
  //       return
  //     }

  //     // Get vendor info from first item
  //     const firstItem = orderItems[0]
  //     const vendorId = firstItem?.vendorId || null
  //     const vendorName = firstItem?.vendorName || 'Unknown Vendor'

  //     if (!vendorId) {
  //       console.warn('⚠️ [DELIVERY ORDER] Vendor ID not found in order items')
  //     }

  //     // Get city value for both area and city (they should be the same)
  //     const deliveryCity = order.deliveryAddress?.city || order.shippingAddress?.city || ''
      
  //     // Map order data to delivery API format
  //     const deliveryOrderData = {
  //       userId: order.userId || order.cognitoUserId || '',
  //       cognitoUserId: order.cognitoUserId || order.userId || '',
  //       vendor: {
  //         id: vendorId || '',
  //         name: vendorName
  //       },
  //       orderNumber: order.orderNumber || order.orderId || order._id || '',
  //       items: orderItems.map(item => ({
  //         productId: item.productId || item._id || '',
  //         name: item.name || '',
  //         quantity: item.quantity || 1,
  //         price: item.price || 0
  //       })),
  //       subtotal: order.subtotal || 0,
  //       tax: order.tax || 0,
  //       vat: order.vat || 0,
  //       shippingCost: order.shippingCost || order.shippingMethodCost || 0,
  //       discount: order.discount || order.couponDiscountAmount || order.qoynsDiscountAmount || 0,
  //       totalAmount: order.totalAmount || 0,
  //       currency: order.currency || 'AED',
  //       paymentStatus: order.paymentStatus || 'paid',
  //       paymentMethod: order.paymentMethod || 'card',
  //       zone: deliveryCity,
  //       shippingAddress: {
  //         fullName: order.shippingAddress?.fullName || '',
  //         phone: order.shippingAddress?.phone || '',
  //         email: order.shippingAddress?.email || '',
  //         addressLine1: order.shippingAddress?.addressLine1 || '',
  //         city: order.shippingAddress?.city || '',
  //         state: order.shippingAddress?.state || '',
  //         postalCode: order.shippingAddress?.postalCode || '',
  //         country: order.shippingAddress?.country || ''
  //       },
  //       deliveryAddress: {
  //         fullName: order.deliveryAddress?.fullName || order.shippingAddress?.fullName || '',
  //         phone: order.deliveryAddress?.phone || order.shippingAddress?.phone || '',
  //         email: order.deliveryAddress?.email || order.shippingAddress?.email || '',
  //         addressLine1: order.deliveryAddress?.addressLine1 || order.shippingAddress?.addressLine1 || '',
  //         area: deliveryCity,
  //         city: deliveryCity,
  //         state: order.deliveryAddress?.state || order.shippingAddress?.state || '',
  //         postalCode: order.deliveryAddress?.postalCode || order.shippingAddress?.postalCode || '',
  //         country: order.deliveryAddress?.country || order.shippingAddress?.country || ''
  //       }
  //     }

  //     console.log('📦 [DELIVERY ORDER] Sending delivery order data:', {
  //       orderNumber: deliveryOrderData.orderNumber,
  //       vendor: deliveryOrderData.vendor,
  //       itemsCount: deliveryOrderData.items.length,
  //       totalAmount: deliveryOrderData.totalAmount
  //     })

  //     // Call delivery API
  //     const deliveryResponse = await fetch('https://backenddelivery.qliq.ae/api/delivery/orders/create', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(deliveryOrderData)
  //     })

  //     if (!deliveryResponse.ok) {
  //       const errorText = await deliveryResponse.text()
  //       console.error('❌ [DELIVERY ORDER] Failed to create delivery order:', deliveryResponse.status, errorText)
  //       try {
  //         const errorData = JSON.parse(errorText)
  //         console.error('❌ [DELIVERY ORDER] Error details:', errorData)
  //       } catch {
  //         // Error text is not JSON, already logged
  //       }
  //       return
  //     }

  //     const result = await deliveryResponse.json()
  //     console.log('✅ [DELIVERY ORDER] Delivery order created successfully:', result)
  //   } catch (error) {
  //     console.error('❌ [DELIVERY ORDER] Exception occurred:', error)
  //     // Don't fail the entire success page if delivery order creation fails
  //   }
  // }

  // Function to redeem cash wallet
  const redeemCashWallet = async () => {
    try {
      console.log('💰 [CASH REDEMPTION] Checking for pending cash redemption...')
      
      const pendingCashRedemption = sessionStorage.getItem('pendingCashRedemption')
      if (!pendingCashRedemption) {
        console.log('⚠️ [CASH REDEMPTION] No pending cash redemption found - cash wallet may not have been used')
        return
      }

      const cashInfo = JSON.parse(pendingCashRedemption)
      console.log('✅ [CASH REDEMPTION] Found pending cash redemption:', cashInfo)
      console.log('💰 [CASH REDEMPTION] Amount to redeem (used with Stripe):', cashInfo.amountInAed, 'AED')

      if (!cashInfo.amountInAed || parseFloat(cashInfo.amountInAed) <= 0) {
        console.log('⚠️ [CASH REDEMPTION] Invalid cash wallet amount, skipping redemption')
        sessionStorage.removeItem('pendingCashRedemption')
        return
      }

      const token = await getAuthToken()
      if (!token) {
        console.error('❌ [CASH REDEMPTION] No auth token available')
        return
      }

      console.log('📡 [CASH REDEMPTION] Calling redeem API after order success...')
      console.log('📡 [CASH REDEMPTION] API: https://backendwallet.qliq.ae/api/wallet/cash/redeem')
      console.log('📡 [CASH REDEMPTION] Amount:', cashInfo.amountInAed, 'AED')
      const response = await fetch('https://backendwallet.qliq.ae/api/wallet/cash/redeem', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amountInAed: cashInfo.amountInAed
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [CASH REDEMPTION] Failed to redeem cash:', response.status, errorText)
        try {
          const errorData = JSON.parse(errorText)
          console.error('❌ [CASH REDEMPTION] Error details:', errorData)
        } catch {
          // Error text is not JSON, already logged
        }
        return
      }

      const result = await response.json()
      console.log('✅ [CASH REDEMPTION] Cash redeemed successfully:', result)
      
      // Clear sessionStorage after successful redemption
      sessionStorage.removeItem('pendingCashRedemption')
      console.log('🗑️ [CASH REDEMPTION] Cleared sessionStorage')
      
      // Refresh cash wallet balance
      dispatch(fetchRedeemableCashBalance())
      console.log('🔄 [CASH REDEMPTION] Refreshed cash wallet balance')
    } catch (error) {
      console.error('❌ [CASH REDEMPTION] Exception occurred:', error)
      // Don't fail the entire success page if redemption fails
    }
  }

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // Check for session_id (from Stripe redirect) or payment_intent (from direct payment)
        const sessionId = searchParams.get('session_id')
        const paymentIntentId = searchParams.get('payment_intent')
        const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')
        
        const paymentMethod = searchParams.get('payment_method')
        
        console.log('URL params:', { sessionId, paymentIntentId, paymentIntentClientSecret, paymentMethod })
        
        // If paid with cash wallet only
        if (paymentMethod === 'cash_wallet') {
          console.log('Payment successful via Cash Wallet')
          setPaymentData({
            paymentMethod: 'cash_wallet',
            status: 'succeeded',
            message: 'Payment completed successfully with Cash Wallet'
          })
          setPaymentStatus('success')
          
          // Fetch order and notify gig completion for cash wallet orders
          try {
            const token = await getAuthToken()
            if (token) {
              const ordersResponse = await fetch(`${orders.getUserOrders}?page=1&limit=1`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json()
                const ordersList = ordersData?.data?.orders || 
                                  ordersData?.orders?.orders || 
                                  ordersData?.data || 
                                  ordersData?.orders ||
                                  []
                  if (ordersList && ordersList.length > 0) {
                    const latestOrder = ordersList[0]
                    await notifyGigCompletionPurchase(latestOrder)
                    // Create delivery order after successful order placement
                    await createDeliveryOrder(latestOrder)
                  }
                }
              }
            } catch (error) {
              console.error('❌ Error fetching order for gig completion (cash wallet):', error)
            }
          
          return
        }
        
        // If we have session_id, confirm with backend and create order
        if (sessionId) {
          console.log('Payment successful via Stripe session:', sessionId)
          
          const token = await getAuthToken()
          if (!token) {
            setError('Authentication required')
            setPaymentStatus('error')
            return
          }

          try {
            // Confirm session with backend to create order
            const response = await fetch(`${process.env.NEXT_PUBLIC_PAYMENT_BASE_URL}/payment/stripe/confirm-session/${sessionId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Failed to confirm payment session')
            }

            const responseData = await response.json()
            setPaymentData(responseData.data)
            setPaymentStatus('success')
            console.log('✅ Order created successfully via session confirmation')
            console.log('✅ Order success message generated')
            
            // Immediately fetch the order and redeem Qoyns (order should be created synchronously)
            await fetchOrderAndRedeemQoyns(sessionId, 'session')
            
            // Fetch the latest order for gig completion notification
            try {
              const token = await getAuthToken()
              if (token) {
                const ordersResponse = await fetch(`${orders.getUserOrders}?page=1&limit=1`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                })
                if (ordersResponse.ok) {
                  const ordersData = await ordersResponse.json()
                  const ordersList = ordersData?.data?.orders || 
                                    ordersData?.orders?.orders || 
                                    ordersData?.data || 
                                    ordersData?.orders ||
                                    []
                  if (ordersList && ordersList.length > 0) {
                    const latestOrder = ordersList[0]
                    // Notify gig completion purchase AFTER order success
                    await notifyGigCompletionPurchase(latestOrder)
                    // Create delivery order after successful order placement
                    await createDeliveryOrder(latestOrder)
                  }
                }
              }
            } catch (error) {
              console.error('❌ Error fetching order for gig completion:', error)
            }
            
            // Redeem cash wallet AFTER order success message is generated
            // This ensures the order is confirmed before redeeming the cash wallet amount
            console.log('💰 [CASH WALLET] Order success confirmed, now redeeming cash wallet...')
            await redeemCashWallet()
          } catch (error) {
            console.error('❌ Error confirming session:', error)
            // Still show success but with warning
            setPaymentData({
              sessionId: sessionId,
              status: 'succeeded',
              message: 'Payment completed successfully (order creation may be pending)'
            })
            setPaymentStatus('success')
            console.log('✅ Order success message generated (with warning)')
            
            // Still try to redeem cash wallet even if order confirmation failed
            // Payment was successful, so we should redeem the cash wallet
            // Redeem AFTER success message is generated
            console.log('💰 [CASH WALLET] Order success message shown, now redeeming cash wallet...')
            await redeemCashWallet()
            
            // Try to notify gig completion even if order confirmation failed
            try {
              const token = await getAuthToken()
              if (token) {
                const ordersResponse = await fetch(`${orders.getUserOrders}?page=1&limit=1`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                })
                if (ordersResponse.ok) {
                  const ordersData = await ordersResponse.json()
                  const ordersList = ordersData?.data?.orders || 
                                    ordersData?.orders?.orders || 
                                    ordersData?.data || 
                                    ordersData?.orders ||
                                    []
                  if (ordersList && ordersList.length > 0) {
                    const latestOrder = ordersList[0]
                    await notifyGigCompletionPurchase(latestOrder)
                    // Create delivery order after successful order placement
                    await createDeliveryOrder(latestOrder)
                  }
                }
              }
            } catch (error) {
              console.error('❌ Error fetching order for gig completion (error case):', error)
            }
          }
          return
        }
        
        // If we have payment_intent, confirm with backend
        if (paymentIntentId && paymentIntentClientSecret) {
          try {
            const token = await getAuthToken()
            if (!token) {
              setError('Authentication required')
              setPaymentStatus('error')
              return
            }

            // Confirm payment with backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_PAYMENT_BASE_URL}/payment/stripe/confirm/${paymentIntentId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Failed to confirm payment')
            }

            const responseData = await response.json()
            setPaymentData(responseData.data)
            setPaymentStatus('success')
            console.log('✅ Order created successfully via payment intent confirmation')
            console.log('✅ Order success message generated')
            
            // Immediately fetch the order and redeem Qoyns
            await fetchOrderAndRedeemQoyns(paymentIntentId, 'paymentIntent')
            
            // Fetch the latest order for gig completion notification
            try {
              const token = await getAuthToken()
              if (token) {
                const ordersResponse = await fetch(`${orders.getUserOrders}?page=1&limit=1`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                })
                if (ordersResponse.ok) {
                  const ordersData = await ordersResponse.json()
                  const ordersList = ordersData?.data?.orders || 
                                    ordersData?.orders?.orders || 
                                    ordersData?.data || 
                                    ordersData?.orders ||
                                    []
                  if (ordersList && ordersList.length > 0) {
                    const latestOrder = ordersList[0]
                    // Notify gig completion purchase AFTER order success
                    await notifyGigCompletionPurchase(latestOrder)
                    // Create delivery order after successful order placement
                    await createDeliveryOrder(latestOrder)
                  }
                }
              }
            } catch (error) {
              console.error('❌ Error fetching order for gig completion:', error)
            }
            
            // Redeem cash wallet AFTER order success message is generated
            // This ensures the order is confirmed before redeeming the cash wallet amount
            console.log('💰 [CASH WALLET] Order success confirmed, now redeeming cash wallet...')
            await redeemCashWallet()
          } catch (error) {
            console.error('❌ Error confirming payment intent:', error)
            // Still show success but with warning
            setPaymentData({
              paymentIntentId: paymentIntentId,
              status: 'succeeded',
              message: 'Payment completed successfully (order creation may be pending)'
            })
            setPaymentStatus('success')
            console.log('✅ Order success message generated (with warning)')
            
            // Payment was successful (we're on success page), so still try to redeem cash wallet
            // Redeem AFTER success message is generated
            console.log('💰 [CASH WALLET] Order success message shown, now redeeming cash wallet...')
            await redeemCashWallet()
            
            // Try to notify gig completion even if order confirmation failed
            try {
              const token = await getAuthToken()
              if (token) {
                const ordersResponse = await fetch(`${orders.getUserOrders}?page=1&limit=1`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                })
                if (ordersResponse.ok) {
                  const ordersData = await ordersResponse.json()
                  const ordersList = ordersData?.data?.orders || 
                                    ordersData?.orders?.orders || 
                                    ordersData?.data || 
                                    ordersData?.orders ||
                                    []
                  if (ordersList && ordersList.length > 0) {
                    const latestOrder = ordersList[0]
                    await notifyGigCompletionPurchase(latestOrder)
                    // Create delivery order after successful order placement
                    await createDeliveryOrder(latestOrder)
                  }
                }
              }
            } catch (error) {
              console.error('❌ Error fetching order for gig completion (error case):', error)
            }
          }
          return
        }
        
        // If neither session_id nor payment_intent is present
        setError('Invalid payment confirmation - missing payment parameters')
        setPaymentStatus('error')
        
      } catch (error) {
        console.error('Payment confirmation error:', error)
        setError(error.message)
        setPaymentStatus('error')
      }
    }

    handlePaymentSuccess()
  }, [searchParams])

  // After success, clear cart state immediately to prevent repeated updates
  useEffect(() => {
    if (paymentStatus !== 'success') return
    
    // Clear cart immediately to prevent state update loops
    dispatch(clearCart())
    
    // Optionally remove items from server-side cart (but don't wait for it)
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      (async () => {
        try {
          const userId = await getUserFromCookies()
          if (userId) {
            // Remove items from server without waiting for completion
            cartItems.forEach(item => {
              dispatch(removeFromCart({ userId, productId: item.productId || item.id })).catch(() => {})
            })
          }
        } catch (e) {
          // ignore server-side cleanup errors
        }
      })()
    }
  }, [paymentStatus, dispatch])

  if (paymentStatus === 'loading') {
    return (
      <div className={successStyles.page}>
        <Navigation />
        <div className={successStyles.container}>
          <div className={successStyles.loadingContainer}>
            <div className={successStyles.loadingSpinner}>
              <div className={successStyles.spinner}></div>
            </div>
            <h2 className={successStyles.loadingTitle}>Confirming your payment...</h2>
            <p className={successStyles.loadingText}>Please wait while we verify your payment.</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (paymentStatus === 'error') {
    return (
      <div className={successStyles.page}>
        <Navigation />
        <div className={successStyles.container}>
          <div className={successStyles.errorContainer}>
            <div className={successStyles.errorIcon}>
              <div className={successStyles.errorCircle}>
                <span>✕</span>
              </div>
            </div>
            <h2 className={successStyles.errorTitle}>Payment Failed</h2>
            <p className={successStyles.errorMessage}>{error}</p>
            <div className={successStyles.errorActions}>
              <button 
                className={successStyles.retryButton}
                onClick={() => window.location.href = '/checkout'}
              >
                <span>Try Again</span>
              </button>
              <button 
                className={successStyles.homeButton}
                onClick={() => window.location.href = '/'}
              >
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className={successStyles.page}>
      <Navigation />
      <div className={successStyles.container}>
        <div className={successStyles.successContainer}>
          {/* Success Animation */}
          <div className={successStyles.successAnimation}>
            <div className={successStyles.checkmarkContainer}>
              <div className={successStyles.checkmark}>
                <div className={successStyles.checkmarkCircle}></div>
                <div className={successStyles.checkmarkStem}></div>
                <div className={successStyles.checkmarkKick}></div>
              </div>
            </div>
            <div className={successStyles.confetti}>
              <div className={successStyles.confettiPiece}></div>
              <div className={successStyles.confettiPiece}></div>
              <div className={successStyles.confettiPiece}></div>
              <div className={successStyles.confettiPiece}></div>
              <div className={successStyles.confettiPiece}></div>
            </div>
          </div>

          {/* Success Content */}
          <div className={successStyles.successContent}>
            <h1 className={successStyles.successTitle}>Payment Successful!</h1>
            <p className={successStyles.successMessage}>
              Thank you for your order! Your payment has been processed successfully and your order is being prepared.
            </p>
            
            {/* Payment Details Card */}
            {paymentData && (
              <div className={successStyles.paymentCard}>
                <div className={successStyles.cardHeader}>
                  <h3 className={successStyles.cardTitle}>
                    <span className={successStyles.cardIcon}>💳</span>
                    Payment Details
                  </h3>
                </div>
                <div className={successStyles.cardContent}>
                  <div className={successStyles.paymentRow}>
                    <span className={successStyles.paymentLabel}>Payment ID:</span>
                    <span className={successStyles.paymentValue}>
                      {paymentData.paymentIntentId || paymentData.sessionId}
                    </span>
                  </div>
                  {paymentData.totalAmount && (
                    <div className={successStyles.paymentRow}>
                      <span className={successStyles.paymentLabel}>Amount:</span>
                      <span className={successStyles.paymentValue}>
                        AED {paymentData.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className={successStyles.paymentRow}>
                    <span className={successStyles.paymentLabel}>Status:</span>
                    <span className={successStyles.statusBadge}>
                      {paymentData.status}
                    </span>
                  </div>
                  {paymentData.message && (
                    <div className={successStyles.paymentRow}>
                      <span className={successStyles.paymentLabel}>Message:</span>
                      <span className={successStyles.paymentValue}>
                        {paymentData.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className={successStyles.nextSteps}>
              <h4 className={successStyles.nextStepsTitle}>What's Next?</h4>
              <div className={successStyles.stepsList}>
                <div className={successStyles.step}>
                  <div className={successStyles.stepIcon}>📧</div>
                  <div className={successStyles.stepContent}>
                    <span className={successStyles.stepTitle}>Order Confirmation</span>
                    <span className={successStyles.stepDescription}>You'll receive an email confirmation shortly</span>
                  </div>
                </div>
                <div className={successStyles.step}>
                  <div className={successStyles.stepIcon}>📦</div>
                  <div className={successStyles.stepContent}>
                    <span className={successStyles.stepTitle}>Order Processing</span>
                    <span className={successStyles.stepDescription}>We're preparing your order for shipment</span>
                  </div>
                </div>
                <div className={successStyles.step}>
                  <div className={successStyles.stepIcon}>🚚</div>
                  <div className={successStyles.stepContent}>
                    <span className={successStyles.stepTitle}>Shipping Updates</span>
                    <span className={successStyles.stepDescription}>Track your order with real-time updates</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={successStyles.actionButtons}>
              <button 
                className={successStyles.primaryButton}
                onClick={() => window.location.href = '/profile?tab=orders'}
              >
                <span className={successStyles.buttonIcon}>📋</span>
                <span>View My Orders</span>
              </button>
              <button 
                className={successStyles.secondaryButton}
                onClick={() => window.location.href = '/'}
              >
                <span className={successStyles.buttonIcon}>🛍️</span>
                <span>Continue Shopping</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
