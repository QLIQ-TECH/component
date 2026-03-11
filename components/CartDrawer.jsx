import Image from 'next/image'
import { useAuth } from '../contexts/AuthContext'
import { useSelector, useDispatch } from 'react-redux'
import { updateCartItem, removeFromCart, fetchCart, moveToWishlist } from '../store/slices/cartSlice'
import { fetchWishlist } from '../store/slices/wishlistSlice'
import { useEffect, useRef, useMemo } from 'react'
import { getUserFromCookies } from '../utils/userUtils'
import { useToast } from '../contexts/ToastContext'

// Compute effective VAT price per item (discount_price_with_vat when available, else price_with_vat)
function getItemEffectivePriceVat(item) {
  const priceWithVat = item.price_with_vat ?? item.product?.price_with_vat ?? item.originalPrice ?? item.price
  const discountPriceWithVat = item.discount_price_with_vat ?? item.product?.discount_price_with_vat ?? item.discountPrice
  const effective = (discountPriceWithVat != null && Number(discountPriceWithVat) > 0) ? discountPriceWithVat : priceWithVat
  return Number(effective) || 0
}

export default function CartDrawer({ open, onClose }) {
  const { requireAuth, user } = useAuth()
  const dispatch = useDispatch()
  const { items, total, itemsCount, loading, error } = useSelector(state => state.cart)
  const { items: wishlistItems } = useSelector(state => state.wishlist)
  const { show } = useToast()
  const drawerRef = useRef(null)

  // Handle click outside drawer to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose])

  // Fetch cart and wishlist when drawer opens and user is authenticated
  useEffect(() => {
    if (open) {
      const fetchUserData = async () => {
        let userId = user?.id || await getUserFromCookies()
        if (userId) {
          console.log('Fetching cart and wishlist for userId:', userId)
          dispatch(fetchCart(userId))
          dispatch(fetchWishlist())
        }
      }
      fetchUserData()
    }
  }, [open, user?.id, dispatch])

  // Debug: Log cart data when it changes (commented out to prevent console spam)
  // useEffect(() => {
  //   console.log('Cart data updated:', { items, total, itemsCount, loading, error })
  // }, [items, total, itemsCount, loading, error])

  const handleQuantityChange = (productId, newQuantity) => {
    requireAuth(() => {
      const updateQuantity = async () => {
        const userId = user?.id || await getUserFromCookies()
        if (userId) {
          console.log('Updating quantity:', { userId, productId, newQuantity })
          dispatch(updateCartItem({
            userId,
            productId,
            quantity: newQuantity
          }))
        }
      }
      updateQuantity()
    })
  }

  const handleRemoveItem = (productId) => {
    requireAuth(() => {
      const removeItem = async () => {
        const userId = user?.id || await getUserFromCookies()
        if (userId) {
          dispatch(removeFromCart({
            userId,
            productId
          }))
        }
      }
      removeItem()
    })
  }

  const handleAddToWishlist = (productId) => {
    requireAuth(() => {
      const moveItemToWishlist = async () => {
        const userId = user?.id || await getUserFromCookies()
        if (userId) {
          console.log('Moving to wishlist from cart:', { userId, productId })
          const result = await dispatch(moveToWishlist({
            userId,
            productId
          }))

          // If successful, refresh wishlist and show success message
          if (result.type === 'cart/moveToWishlist/fulfilled') {
            show('Moved to wishlist')
            dispatch(fetchWishlist(userId))
          } else if (result.type === 'cart/moveToWishlist/rejected') {
            show(result.payload || 'Failed to move to wishlist', 'error')
          }
        }
      }
      moveItemToWishlist()
    })
  }

  const handleCheckout = () => {
    requireAuth(() => {
      // Redirect to checkout page
      window.location.href = '/checkout'
    })
  }

  // Total using VAT-inclusive prices (discount_price_with_vat when available, else price_with_vat)
  const totalWithVat = useMemo(() => {
    if (!items || items.length === 0) return 0
    return items.reduce((sum, item) => {
      const effectivePrice = getItemEffectivePriceVat(item)
      const qty = Number(item.quantity) || 1
      return sum + effectivePrice * qty
    }, 0)
  }, [items])

  if (!open) return null
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" ref={drawerRef} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">Your Cart</span>
          <button className="drawer-close" onClick={onClose}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#F5F5F5" />
              <path d="M9 9L19 19M19 9L9 19" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="drawer-divider" />
        <div className="drawer-content">
          {loading ? (
            <div className="cart-loading">
              <div className="loading-spinner"></div>
              <p>Loading cart...</p>
            </div>
          ) : error ? (
            <div className="cart-error">
              <p>Error loading cart: {error}</p>
              <button onClick={() => user?.id && dispatch(fetchCart(user.id))}>
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="cart-empty">
              <div className="empty-cart-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <path d="M16 16L20 44H44L48 16H16Z" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 20V12C20 8.68629 22.6863 6 26 6H38C41.3137 6 44 8.68629 44 12V20" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>What's on your cart</h3>
              {/* <p>Add some products to get started!</p> */}
            </div>
          ) : (
            <div className="cart-items">
              {items && items.length > 0 ? items.map((item) => (
                <div key={item.productId} className="cart-item">
                  <div className="cart-image-wrap">
                    <Image
                      src={item.image || '/iphone.jpg'}
                      alt={item.name}
                      width={120}
                      height={100}
                      className="cart-image"
                    />
                  </div>
                  <div className="cart-info">
                    <div className="cart-brand">{item.brand || 'Product'}</div>
                    <div className="cart-name">{item.name}</div>
                    <div className="cart-price-container">
                      {(() => {
                        const priceWithVat = item.price_with_vat ?? item.product?.price_with_vat ?? item.originalPrice ?? item.price
                        const discountPriceWithVat = item.discount_price_with_vat ?? item.product?.discount_price_with_vat ?? item.discountPrice
                        const effectivePrice = (discountPriceWithVat != null && Number(discountPriceWithVat) > 0) ? discountPriceWithVat : priceWithVat
                        const originalPrice = priceWithVat
                        const showDiscount = originalPrice != null && effectivePrice != null && Number(originalPrice) > Number(effectivePrice)
                        return (
                          <>
                            <span className="cart-price">AED {effectivePrice != null ? Number(effectivePrice) : (item.discountPrice || item.price)}</span>
                            {showDiscount && (
                              <>
                                <span className="cart-original-price">AED {originalPrice}</span>
                                <span className="cart-discount-badge">
                                  {Math.round(((Number(originalPrice) - Number(effectivePrice)) / Number(originalPrice)) * 100)}% Off
                                </span>
                              </>
                            )}
                          </>
                        )
                      })()}
                    </div>
                    <div className="cart-actions">
                      <div className='cart-qty-control'>
                        <button
                          className="cart-qty-btn"
                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="cart-qty">{item.quantity}</span>
                        <button
                          className="cart-qty-btn"
                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="cart-wishlist-btn"
                        onClick={() => handleAddToWishlist(item.productId)}
                        disabled={wishlistItems.some(wishlistItem => wishlistItem.productId === item.productId)}
                        aria-label="Add to wishlist"
                      >
                        <svg width="28" height="28" viewBox="6 0 28 26" fill="none">
                          <path d="M20.09 18.5586L20 18.6458L19.901 18.5586C15.626 14.8005 12.8 12.3155 12.8 9.7956C12.8 8.0518 14.15 6.7439 15.95 6.7439C17.336 6.7439 18.686 7.6158 19.163 8.8016H20.837C21.314 7.6158 22.664 6.7439 24.05 6.7439C25.85 6.7439 27.2 8.0518 27.2 9.7956C27.2 12.3155 24.374 14.8005 20.09 18.5586Z" stroke="#0082FF" strokeWidth="2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    className="cart-remove-btn"
                    onClick={() => handleRemoveItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              )) : (
                <div className="cart-empty">
                  <h3>No items found</h3>
                  <p>Something went wrong loading your cart.</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="drawer-footer"
          onClick={handleCheckout}
          disabled={items.length === 0}
        >
          <div className="drawer-footer-content">
            <button
              className="drawer-checkout-btn"
              disabled={items.length === 0}
            >
              Checkout
            </button>
            <span className="drawer-total">AED {totalWithVat.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <style jsx>{`
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.08);
          z-index: 9999;
          display: flex;
          justify-content: flex-end;
        }
        .drawer {
          background: #fff;
          width: 480px;
          max-width: 100vw;
          height: 100vh;
          box-shadow: -2px 0 16px rgba(0,0,0,0.08);
          border-radius: 0 0 0 0;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.25s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px 32px 0 32px;
        }
        .drawer-title {
          font-size: 24px;
          font-weight: 700;
          color: #111;
        }
        .drawer-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }
        .drawer-close:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        .drawer-close:active {
          background-color: rgba(0, 0, 0, 0.1);
        }
        .drawer-divider {
          border-bottom: 1px solid #e5e5e5;
          margin: 16px 0 0 0;
        }
        .drawer-content {
          padding: 32px 24px 0 24px;
          flex: 1;
          overflow-y: auto;
          -ms-overflow-style: auto; /* IE and Edge */
          scrollbar-width: thin; /* Firefox */
          padding-bottom: 120px; /* space for sticky footer */
        }
        .cart-item {
          display: flex;
          align-items: flex-start;
          gap: 32px;
        }
        .cart-image-wrap {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          width: 120px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cart-image {
          border-radius: 12px;
          object-fit: contain;
          background: #fff;
        }
        .cart-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cart-brand {
          font-size: 14px;
          color: #222;
          font-weight: 600;
        }
        .cart-name {
          font-weight: 600;
          font-size: 18px;
          color: #000;
        }
        .cart-price-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cart-price {
          font-weight: 600;
          font-size: 16px;
          color: #000;
        }
        .cart-original-price {
          font-size: 14px;
          color: #888;
          text-decoration: line-through;
        }
        .cart-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }
          .cart-qty-control{
          background: #fff;
          border: 1px solid #555;
          border-radius: 100px;
          width: 106px;
          height: 40px;
          font-size: 18px;
          font-weight: 700;
          color: #222;
          display: flex;
          align-items: center;
          justify-content: center;
          }
        .cart-qty-btn {
          background: #fff;
          border: none;
          border-radius: 100px;
          width: 40px;
          height: 40px;
          font-size: 18px;
          font-weight: 700;
          color: #222;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          touch-action: manipulation;
        }
        .cart-qty-btn:hover {
          background-color: #f5f5f5;
        }
        .cart-qty-btn:active {
          background-color: #e5e5e5;
          transform: scale(0.95);
        }
        .cart-qty {
          font-size: 16px;
          font-weight: 600;
          color: #222;
          min-width: 24px;
          text-align: center;
        }
        .cart-wishlist-btn {
          background: #fff;
          border: 1.5px solid #0082FF;
          border-radius: 100px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cart-wishlist-btn:hover:not(:disabled) {
          background: #0082FF;
        }
        .cart-wishlist-btn:hover:not(:disabled) svg path {
          stroke: white;
        }
        .cart-wishlist-btn:disabled {
          background: #f5f5f5;
          border-color: #ccc;
          cursor: not-allowed;
          opacity: 0.6;
        }
        .cart-wishlist-btn:disabled svg path {
          stroke: #ccc;
        }
        .cart-remove-btn {
          background: none;
          border: none;
          color: #888;
          font-size: 16px;
          font-weight: 500;
          margin-left: 16px;
          cursor: pointer;
        }
        .drawer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-top: 1px solid #e5e5e5;
          background: #fff;
          position: sticky;
          bottom: 0;
          cursor: pointer;
        }
        .drawer-footer-content {
          display: flex;
          background: #0082FF;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          border-radius: 100px;
        }
        .drawer-checkout-btn {
          background: transparent;
          color: #fff;
          border: none;
          border-radius: 100px;
          padding: 14px 40px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: none;
        }
        .drawer-total {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          background: transparent;
          border-radius: 100px;
          padding: 14px 32px;
          margin-left: 16px;
        }
        .cart-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0082FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .cart-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }
        .cart-error button {
          background: #0082FF;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 12px;
        }
        .cart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .empty-cart-icon {
          margin-bottom: 24px;
          opacity: 0.5;
        }
        .cart-empty h3 {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
        }
        .cart-empty p {
          color: #666;
          margin: 0;
        }
        .cart-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }
        .cart-loading p {
          margin-top: 16px;
          color: #666;
          font-size: 16px;
        }
        .cart-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
        }
        .cart-error p {
          color: #ff4444;
          margin-bottom: 16px;
        }
        .cart-items {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .cart-qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .drawer-checkout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .drawer {
            width: 100vw;
            padding: 0;
          }
          .drawer-header {
            padding: 20px 16px 0 16px;
          }
          .drawer-content {
            padding: 20px 16px 0 16px;
            padding-bottom: 120px;
          }
          .drawer-footer {
            padding: 16px;
          }
          .drawer-title {
            font-size: 20px;
          }
          .drawer-close {
            padding: 12px;
          }
          .cart-item {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            background: #fafafa;
          }
          .cart-image-wrap {
            width: 100%;
            height: 120px;
            align-self: center;
          }
          .cart-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .cart-info {
            width: 100%;
          }
          .cart-brand {
            font-size: 12px;
          }
          .cart-name {
            font-size: 16px;
            line-height: 1.4;
          }
          .cart-price {
            font-size: 18px;
          }
          .cart-actions {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            margin-top: 16px;
          }
          .cart-qty-control {
            width: 100%;
            justify-content: space-between;
            padding: 0 16px;
          }
          .cart-qty-btn {
            width: 48px;
            height: 48px;
            font-size: 20px;
          }
          .cart-qty {
            font-size: 18px;
          }
          .cart-wishlist-btn {
            width: 48px;
            height: 48px;
            align-self: center;
          }
          .cart-remove-btn {
            margin-left: 0;
            margin-top: 8px;
            padding: 8px 16px;
            background: #ff4444;
            color: white;
            border-radius: 8px;
            font-size: 14px;
            text-align: center;
          }
          .drawer-checkout-btn {
            padding: 16px 24px;
            font-size: 16px;
          }
          .drawer-total {
            padding: 16px 24px;
            font-size: 16px;
          }
        }
        
        @media (max-width: 480px) {
          .drawer-header {
            padding: 16px 12px 0 12px;
          }
          .drawer-content {
            padding: 16px 12px 0 12px;
            padding-bottom: 120px;
          }
          .drawer-footer {
            padding: 12px;
          }
          .cart-item {
            padding: 12px;
            gap: 12px;
          }
          .cart-image-wrap {
            height: 100px;
          }
          .cart-name {
            font-size: 14px;
          }
          .cart-price {
            font-size: 16px;
          }
          .cart-qty-control {
            padding: 0 12px;
          }
          .cart-qty-btn {
            width: 44px;
            height: 44px;
            font-size: 18px;
          }
          .cart-wishlist-btn {
            width: 44px;
            height: 44px;
          }
          .drawer-checkout-btn {
            padding: 14px 20px;
            font-size: 14px;
          }
          .drawer-total {
            padding: 14px 20px;
            font-size: 14px;
          }
          .cart-empty {
            padding: 40px 16px;
          }
          .cart-empty h3 {
            font-size: 18px;
          }
          .cart-empty p {
            font-size: 14px;
          }
          .cart-loading {
            padding: 30px 16px;
          }
          .cart-loading p {
            font-size: 14px;
          }
          .cart-error {
            padding: 30px 16px;
          }
          .cart-error p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
