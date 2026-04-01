import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import OtherSellersDrawer from './OtherSellersDrawer';
import { useAuth } from '../../contexts/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, fetchCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { getUserFromCookies } from '../../utils/userUtils';
import { useToast } from '../../contexts/ToastContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation as SwiperNavigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import { getAvailableOptions } from '../../utils/productUtils';

export default function ProductDetails({ product, variants = [], selectedAttributes: selectedAttributesFromStore = {} }) {
  console.log('🔍 ProductDetails component received product:', product);
  console.log('🔍 Product ID:', product.id);

  const [selectedColor, setSelectedColor] = useState(product.selectedColor || product.colors?.[0]);
  const [selectedSize, setSelectedSize] = useState(product.selectedSize || product.sizes?.[0]);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [isAddedToWishlist, setIsAddedToWishlist] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const colorSwiperRef = useRef(null);
  const sizeSwiperRef = useRef(null);
  const promoCardsSwiperRef = useRef(null);
  const { requireAuth } = useAuth();
  const dispatch = useDispatch();
  const { show } = useToast();

  // Check if product is in cart or wishlist
  const { items: cartItems } = useSelector(state => state.cart);
  const { items: wishlistItems } = useSelector(state => state.wishlist);

  const isInCart = cartItems.some(item => item.productId === product.id);
  const isInWishlist = wishlistItems.some(item => item.productId === product.id);
  const cartItem = cartItems.find(item => item.productId === product.id);
  const cartQuantity = cartItem?.quantity || 0;

  // Sync local state with props when they change
  useEffect(() => {
    if (product.selectedColor) {
      setSelectedColor(product.selectedColor);
    }
    if (product.selectedSize) {
      setSelectedSize(product.selectedSize);
    }

    // Update button states based on cart and wishlist
    setIsAddedToCart(isInCart);
    setIsAddedToWishlist(isInWishlist);
  }, [product.selectedColor, product.selectedSize, isInCart, isInWishlist]);

  // Sync local state with props when they change
  useEffect(() => {
    if (product.selectedColor) {
      setSelectedColor(product.selectedColor);
    }
    if (product.selectedSize) {
      setSelectedSize(product.selectedSize);
    }
  }, [product.selectedColor, product.selectedSize]);

  // Check screen size for mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 834);
      setIsPhone(window.innerWidth < 480);
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  // Compute available sizes given selected color (and other selected attributes if any)
  const effectiveSelected = {
    ...(selectedAttributesFromStore || {}),
    color: selectedColor,
  };
  const availableSizes = getAvailableOptions(variants || [], effectiveSelected, 'storage');
  const isSizeAvailable = (size) => {
    if (!size) return false;
    // some data could be like "512 GB" vs "512"; normalize to include both simple contains checks
    const normalizedAvailable = availableSizes.map(v => String(v).toLowerCase());
    const norm = String(size).toLowerCase();
    return normalizedAvailable.includes(norm);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleAddToCart = () => {
    // If already in cart, don't add again
    if (isAddedToCart || isInCart) {
      show('Item already in cart')
      return
    }

    requireAuth(() => {
      ; (async () => {
        const userId = await getUserFromCookies()

        const priceWithVat = product.originalPrice ?? product.price
        const discountPriceWithVat = (product.originalPrice != null && product.price != null && product.price < product.originalPrice) ? product.price : product.price
        const cartItem = {
          userId,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          image: product.images[0],
          selectedColor,
          selectedSize,
          price_with_vat: priceWithVat,
          discount_price_with_vat: discountPriceWithVat
        }

        const result = await dispatch(addToCart(cartItem))
        if (addToCart.fulfilled.match(result)) {
          show('Added to cart')
          setIsAddedToCart(true)

          // Refresh cart data
          dispatch(fetchCart(userId))
        } else if (addToCart.rejected.match(result)) {
          show('Failed to add to cart', 'error')
        }
      })()
    });
  };

  const handleAddToFavourite = () => {
    requireAuth(() => {
      ; (async () => {
        const userId = await getUserFromCookies()

        if (isInWishlist) {
          // Remove from wishlist
          const result = await dispatch(removeFromWishlist({
            userId,
            productId: product.id
          }))
          if (removeFromWishlist.fulfilled.match(result)) {
            show('Removed from wishlist')
            setIsAddedToWishlist(false)
          } else if (removeFromWishlist.rejected.match(result)) {
            show('Failed to remove from wishlist', 'error')
          }
        } else {
          // Add to wishlist
          const wishlistItem = {
            userId,
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0]
          }

          const result = await dispatch(addToWishlist(wishlistItem))
          if (addToWishlist.fulfilled.match(result)) {
            const isDuplicate = result.payload?.isDuplicate
            show(isDuplicate ? 'Already in wishlist' : 'Added to wishlist')
            setIsAddedToWishlist(true)
          } else if (addToWishlist.rejected.match(result)) {
            show('Failed to add to wishlist', 'error')
          }
        }
      })()
    });
  };


  return (
    <div className="product-details">
      <div className="product-main">
        {/* Left Side - Product Images */}
        <div className="product-images">
          <div className="main-image-container">
            <button className="nav-arrow left" onClick={prevImage}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <Image
              src={product.images[currentImageIndex]}
              alt={product.name}
              width={isPhone ? 350 : 600}
              height={isPhone ? 350 : 650}
              className="main-image"
            />

            <button className="nav-arrow right" onClick={nextImage}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="image-dots">
            {product.images.map((_, index) => (
              <div
                key={index}
                className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Product Details */}
        <div className="product-info">
          {/* First row: Brand name and bought count */}
          <div className="first-row">
            <div className="brand-name">{product.brand}</div>
            <span className="vat-note">Inclusive of Tax</span>
            {/* <span className="bought-count">{product.boughtCount}</span> */}
          </div>

          {/* Second row: Product name and delivery time */}
          <div className="stats">
            <h1 className="product-name">{product.name}</h1>
            {/* <span className="delivery-time">{product.deliveryTime}</span> */}
          </div>
          <div className="second-row-stats">
            <div className="stock-status">{product.stock}</div>
            <div className="rating">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 15.0742L12.4208 16.5384C12.8635 16.8067 13.406 16.41 13.2894 15.9084L12.6477 13.155L14.7885 11.3C15.1794 10.9617 14.9694 10.32 14.456 10.2792L11.6385 10.04L10.536 7.43836C10.3377 6.96586 9.66104 6.96586 9.4627 7.43836L8.3602 10.0342L5.5427 10.2734C5.02937 10.3142 4.81937 10.9559 5.2102 11.2942L7.35104 13.1492L6.70937 15.9025C6.5927 16.4042 7.1352 16.8009 7.57854 16.5325L10 15.0742Z" fill="#0082FF" />
                </svg>
              ))}
            </div>
          </div>
          <div className="pricing">
            <span className="original-price">AED {product.originalPrice.toLocaleString()}</span>
            <span className="current-price">AED {product.price.toLocaleString()}</span>
            <span className="discount">{product.discount}% Off</span>
          </div>

          {/* Color Selection - Only show if multiple colors available */}
          {product.colors && product.colors.length > 1 && (
            <div className="selection-group">
              <label>Color:</label>
              {isMobile ? (
                <div className="color-swiper-wrapper">
                  <Swiper
                    ref={colorSwiperRef}
                    modules={[SwiperNavigation]}
                    slidesPerView="auto"
                    spaceBetween={10}
                    grabCursor={true}
                    freeMode={true}
                    className="color-swiper"
                  >
                    {product.colors.map((color) => (
                      <SwiperSlide key={color} style={{ width: 'auto' }}>
                        <button
                          className={`color-btn ${selectedColor === color ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedColor(color);
                            if (product.onColorChange) {
                              product.onColorChange(color);
                            }
                          }}
                        >
                          {color}
                        </button>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div className="color-options">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`color-btn ${selectedColor === color ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedColor(color);
                        if (product.onColorChange) {
                          product.onColorChange(color);
                        }
                      }}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Size Selection - Only show if multiple sizes available */}
          {product.sizes && product.sizes.length > 1 && (
            <div className="selection-group">
              <label>Size:</label>
              {isMobile ? (
                <div className="size-swiper-wrapper">
                  <Swiper
                    ref={sizeSwiperRef}
                    modules={[SwiperNavigation]}
                    slidesPerView="auto"
                    spaceBetween={10}
                    grabCursor={true}
                    freeMode={true}
                    className="size-swiper"
                  >
                    {product.sizes.map((size) => (
                      <SwiperSlide key={size} style={{ width: 'auto' }}>
                        <button
                          className={`size-btn ${selectedSize === size ? 'selected' : ''} ${!isSizeAvailable(size) ? 'unavailable' : ''}`}
                          onClick={() => {
                            if (!isSizeAvailable(size)) return;
                            setSelectedSize(size);
                            if (product.onSizeChange) {
                              product.onSizeChange(size);
                            }
                          }}
                          disabled={!isSizeAvailable(size)}
                        >
                          {size}
                        </button>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div className="size-options">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? 'selected' : ''} ${!isSizeAvailable(size) ? 'unavailable' : ''}`}
                      onClick={() => {
                        if (!isSizeAvailable(size)) return;
                        setSelectedSize(size);
                        if (product.onSizeChange) {
                          product.onSizeChange(size);
                        }
                      }}
                      disabled={!isSizeAvailable(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector and Share Section */}
          <div className={`quantity-share-container ${isMobile ? 'quantity-share-container-mobile' : ''}`}>
            <div className={`selection-group ${isMobile ? 'selection-group-mobile' : ''}`}>
              {!isMobile && <label>Quantity:</label>}
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>
            <div className={`share-section ${isMobile ? 'share-section-mobile' : ''}`}>
              {!isMobile && <span>Share:</span>}
              <div className="share-icons">
                <a href="https://www.instagram.com/iqliqlive?igsh=MWQ4NGIxemJuMTVvMg==" target="_blank" rel="noopener noreferrer" className="share-icon">
                  <svg width="24" height="24" viewBox="0 0 24 22" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M16 3.24268H8C5.23858 3.24268 3 5.48126 3 8.24268V16.2427C3 19.0041 5.23858 21.2427 8 21.2427H16C18.7614 21.2427 21 19.0041 21 16.2427V8.24268C21 5.48126 18.7614 3.24268 16 3.24268ZM19.25 16.2427C19.2445 18.0353 17.7926 19.4872 16 19.4927H8C6.20735 19.4872 4.75549 18.0353 4.75 16.2427V8.24268C4.75549 6.45003 6.20735 4.99817 8 4.99268H16C17.7926 4.99817 19.2445 6.45003 19.25 8.24268V16.2427ZM16.75 8.49268C17.3023 8.49268 17.75 8.04496 17.75 7.49268C17.75 6.9404 17.3023 6.49268 16.75 6.49268C16.1977 6.49268 15.75 6.9404 15.75 7.49268C15.75 8.04496 16.1977 8.49268 16.75 8.49268ZM12 7.74268C9.51472 7.74268 7.5 9.7574 7.5 12.2427C7.5 14.728 9.51472 16.7427 12 16.7427C14.4853 16.7427 16.5 14.728 16.5 12.2427C16.5027 11.0484 16.0294 9.90225 15.1849 9.05776C14.3404 8.21327 13.1943 7.74002 12 7.74268ZM9.25 12.2427C9.25 13.7615 10.4812 14.9927 12 14.9927C13.5188 14.9927 14.75 13.7615 14.75 12.2427C14.75 10.7239 13.5188 9.49268 12 9.49268C10.4812 9.49268 9.25 10.7239 9.25 12.2427Z" fill="black" />
                  </svg>
                </a>
                <a href="https://www.facebook.com/people/IQLIQ/61583990447382/#" target="_blank" rel="noopener noreferrer" className="share-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M22 12.3038C22 6.74719 17.5229 2.24268 12 2.24268C6.47715 2.24268 2 6.74719 2 12.3038C2 17.3255 5.65684 21.4879 10.4375 22.2427V15.2121H7.89844V12.3038H10.4375V10.0872C10.4375 7.56564 11.9305 6.1728 14.2146 6.1728C15.3088 6.1728 16.4531 6.36931 16.4531 6.36931V8.84529H15.1922C13.95 8.84529 13.5625 9.6209 13.5625 10.4166V12.3038H16.3359L15.8926 15.2121H13.5625V22.2427C18.3432 21.4879 22 17.3257 22 12.3038Z" fill="black" />
                  </svg>
                </a>
                <a href="https://x.com/iqliq99526" target="_blank" rel="noopener noreferrer" className="share-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M17.1761 4.24268H19.9362L13.9061 11.0201L21 20.2427H15.4456L11.0951 14.6493L6.11723 20.2427H3.35544L9.80517 12.9935L3 4.24268H8.69545L12.6279 9.3553L17.1761 4.24268ZM16.2073 18.6181H17.7368L7.86441 5.78196H6.2232L16.2073 18.6181Z" fill="black" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/iqliq/" target="_blank" rel="noopener noreferrer" className="share-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M4.5 3.24268C3.67157 3.24268 3 3.91425 3 4.74268V19.7427C3 20.5711 3.67157 21.2427 4.5 21.2427H19.5C20.3284 21.2427 21 20.5711 21 19.7427V4.74268C21 3.91425 20.3284 3.24268 19.5 3.24268H4.5ZM8.52076 7.2454C8.52639 8.20165 7.81061 8.79087 6.96123 8.78665C6.16107 8.78243 5.46357 8.1454 5.46779 7.24681C5.47201 6.40165 6.13998 5.72243 7.00764 5.74212C7.88795 5.76181 8.52639 6.40728 8.52076 7.2454ZM12.2797 10.0044H9.75971H9.7583V18.5643H12.4217V18.3646C12.4217 17.9847 12.4214 17.6047 12.4211 17.2246C12.4203 16.2108 12.4194 15.1959 12.4246 14.1824C12.426 13.9363 12.4372 13.6804 12.5005 13.4455C12.7381 12.568 13.5271 12.0013 14.4074 12.1406C14.9727 12.2291 15.3467 12.5568 15.5042 13.0898C15.6013 13.423 15.6449 13.7816 15.6491 14.129C15.6605 15.1766 15.6589 16.2242 15.6573 17.2719C15.6567 17.6417 15.6561 18.0117 15.6561 18.3815V18.5629H18.328V18.3576C18.328 17.9056 18.3278 17.4537 18.3275 17.0018C18.327 15.8723 18.3264 14.7428 18.3294 13.6129C18.3308 13.1024 18.276 12.599 18.1508 12.1054C17.9638 11.3713 17.5771 10.7638 16.9485 10.3251C16.5027 10.0129 16.0133 9.81178 15.4663 9.78928C15.404 9.78669 15.3412 9.7833 15.2781 9.77989C14.9984 9.76477 14.7141 9.74941 14.4467 9.80334C13.6817 9.95662 13.0096 10.3068 12.5019 10.9241C12.4429 10.9949 12.3852 11.0668 12.2991 11.1741L12.2797 11.1984V10.0044ZM5.68164 18.5671H8.33242V10.01H5.68164V18.5671Z" fill="black" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`action-buttons ${isMobile ? 'action-buttons-mobile' : ''}`}>
            {isMobile ? (
              <>
                <button
                  className={`add-to-cart-mobile ${(isAddedToCart || isInCart) ? 'added' : ''}`}
                  onClick={handleAddToCart}
                  disabled={isAddedToCart || isInCart}
                >
                  {(isAddedToCart || isInCart) ? 'Added To Cart' : 'Add To Cart'}
                  {/* {cartQuantity > 0 && <span className="quantity-badge-mobile">{cartQuantity}</span>} */}
                </button>
                <button
                  className={`add-to-favourite ${(isAddedToWishlist || isInWishlist) ? 'added' : ''}`}
                  onClick={handleAddToFavourite}
                >
                  {(isAddedToWishlist || isInWishlist) ? 'Added To Wishlist' : 'Add To Wishlist'}
                </button>
              </>
            ) : (
              <>
                <button
                  className={`add-to-cart ${(isAddedToCart || isInCart) ? 'added' : ''}`}
                  onClick={handleAddToCart}
                  disabled={isAddedToCart || isInCart}
                >
                  {(isAddedToCart || isInCart) ? 'Added To Cart' : 'Add To Cart'}
                </button>
                <button
                  className={`add-to-favourite ${(isAddedToWishlist || isInWishlist) ? 'added' : ''}`}
                  onClick={handleAddToFavourite}
                >
                  {(isAddedToWishlist || isInWishlist) ? 'Added To Wishlist' : 'Add To Wishlist'}
                </button>
              </>
            )}
          </div>

          {/* Other Sellers */}
          <div className="other-sellers" onClick={() => {
            console.log('🖱️ Other Sellers button clicked');
            console.log('🖱️ Product ID being passed:', product.id);
            setDrawerOpen(true);
          }}>
            <span>Other Sellers</span>
            <button className="arrow-right">→</button>
          </div>

          {/* Promo Cards - Two in one row */}
          {/* <div className="promo-cards-row">
            {isMobile ? (
              <div className="promo-cards-swiper-wrapper">
                <Swiper
                  ref={promoCardsSwiperRef}
                  modules={[SwiperNavigation]}
                  slidesPerView="auto"
                  spaceBetween={16}
                  grabCursor={true}
                  freeMode={true}
                  className="promo-cards-swiper"
                >
                  <SwiperSlide style={{ width: 'auto' }}>
                    <div className="promo-card promo-card-outline">
                      <div className="promo-card-icon">
                        <Image src="/discount.svg" alt="Return Policy" width={32} height={32} />
                      </div>
                      <div className="promo-card-content">
                        <div className="promo-card-title">Pay in 3 interest-free payments</div>
                        <div className="promo-card-link">Learn More</div>
                      </div>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide style={{ width: 'auto' }}>
                    <div className="promo-card promo-card-outline">
                      <div className="promo-card-icon">
                        <Image src="/discount.svg" alt="Return Policy" width={32} height={32} />
                      </div>
                      <div className="promo-card-content">
                        <div className="promo-card-title">Pay in 3 interest-free payments</div>
                        <div className="promo-card-link">Learn More</div>
                      </div>
                    </div>
                  </SwiperSlide>
                </Swiper>
              </div>
            ) : (
              <>
                <div className="promo-card promo-card-outline">
                  <div className="promo-card-icon">
                    <Image src="/discount.svg" alt="Return Policy" width={32} height={32} />
                  </div>
                  <div className="promo-card-content">
                    <div className="promo-card-title">Pay in 3 interest-free payments</div>
                    <div className="promo-card-link">Learn More</div>
                  </div>
                </div>
                <div className="promo-card promo-card-outline">
                  <div className="promo-card-icon">
                    <Image src="/discount.svg" alt="Return Policy" width={32} height={32} />
                  </div>
                  <div className="promo-card-content">
                    <div className="promo-card-title">Pay in 3 interest-free payments</div>
                    <div className="promo-card-link">Learn More</div>
                  </div>
                </div>
              </>
            )}
          </div> */}

          {/* Additional Info */}
          <div className="additional-info">
            <div className="info-item">
              <span className="icon">
                <Image src="/return.svg" alt="Return Policy" width={20} height={20} />
              </span>
              <span>Return Policy</span>
            </div>
            <div className="info-item">
              <span className="icon">
                <Image src="/star.svg" alt="Return Policy" width={30} height={30} />
              </span>
              <span>1 Year Warranty</span>
            </div>
            <div className="info-item">
              <span className="icon">
                <Image src="/warrenty.svg" alt="Return Policy" width={20} height={20} />
              </span>
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </div>

      <OtherSellersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        productId={product.id}
      />

      <style jsx>{`
        .product-details {
          max-width: 1392px;
          justify-content: center;
          align-items: center;
          margin: 0 auto;
          padding: 40px 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .product-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .product-images {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .main-image-container {
          position: relative;
          width: 100%;
          max-width: 600px;
          height: auto;
          aspect-ratio: 1 / 1;
          border-radius: 16px;
          overflow: hidden;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .main-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #333;
          z-index: 10;
        }

        .nav-arrow.left {
          left: 16px;
        }

        .nav-arrow.right {
          right: 16px;
        }

        .image-dots {
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0, 130, 255, 0.24);
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .dot.active {
          background: #0082FF;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* First row: Brand name and bought count */
        .first-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-name {
          color: #000;
          font-size: 16px;
          font-weight: 600;
        }

        .bought-count {
          color: #0082FF;
          font-size: 14px;
          font-weight: 600;
        }

        /* Second row: Product name and delivery time */
        .stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .second-row-stats {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 6px;
        }

        .product-name {
          font-size: 40px;
          font-weight: 600;
          color: #000;
          margin: 0;
          line-height: 1.2;
          flex: 1;
        }

        .delivery-time {
          color: #0082FF;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
        }

        .stock-status {
          color: #000;
          font-size: 16px;
          font-weight: 600;
        }

        .rating {
          display: flex;
          gap: 4px;
        }

        .pricing {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .original-price {
          color: #666;
          text-decoration: line-through;
          font-size: 14px;
          font-weight: 600;
        }

        .current-price {
          color: #000;
          font-size: 24px;
          font-weight: 600;
        }

        .discount {
          color: #1FC70A;
          font-size: 14px;
          font-weight: 600;
        }

        .vat-note {
          font-size: 14px;
          font-weight: 600;
          color: #0082FF;
        }

        .description {
          color: #000;
          line-height: 150%;
          margin: 0;
        }

        .selection-group {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 12px;
        }

        .selection-group label {
          font-weight: 600;
          color: #333;
          min-width: 70px;
        }

        .color-options, .size-options {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .color-btn {
          padding: 8px 32px;
          border: 2px solid #0082FF;
          border-radius: 25px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .size-btn {
          padding: 8px 24px;
          border: 2px solid #0082FF;
          border-radius: 25px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          white-space: nowrap;
        }

        .color-btn.selected, .size-btn.selected {
          border-color: #0082FF;
          background: #0082FF;
          color: white;
        }

        /* Unavailable size styling with diagonal cross */
        .size-btn.unavailable {
          position: relative;
          color: #bbb;
          border-color: #e5e7eb;
          background: #fafafa;
          cursor: not-allowed;
        }
        .size-btn.unavailable::after {
          content: '';
          position: absolute;
          left: 6px;
          right: 6px;
          top: 50%;
          height: 2px;
          background: #bbb;
          transform: rotate(-20deg);
        }

        /* Quantity and Share Container */
        .quantity-share-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        /* Mobile quantity and share - one row, no labels */
        .quantity-share-container-mobile {
          flex-direction: row;
          gap: 12px;
          align-items: center;
        }

        .selection-group-mobile {
          gap: 0;
        }

        .selection-group-mobile label {
          display: none;
        }

        .share-section-mobile {
          gap: 0;
        }

        .share-section-mobile > span {
          display: none;
        }

        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 25px;
          padding: 8px;
          width: fit-content;
        }

        .quantity-selector button {
          width: 32px;
          height: 32px;
          border: none;
          background: #fff;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          font-weight: 600;
        }

        .quantity-selector span {
          min-width: 40px;
          text-align: center;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
        }

        /* Mobile-specific action buttons layout */
        .action-buttons-mobile {
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .add-to-cart {
          width: 100%;
          max-width: 342px;
          padding: 12px 40px;
          background: rgba(0, 130, 255, 0.24); 
          border: none;
          border-radius: 50px;
          color: #0082FF;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .add-to-cart.added {
          background: rgba(0, 204, 102, 0.24);
          color: #00CC66;
        }
        
        .add-to-cart:disabled {
          cursor: default;
          opacity: 0.9;
        }

        /* Mobile add to cart button */
        .add-to-cart-mobile {
          flex: 1;
          padding: 12px 20px;
          background: rgba(0, 130, 255, 0.24); 
          border: none;
          border-radius: 50px;
          color: #0082FF;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
          position: relative;
        }
        
        .add-to-cart-mobile.added {
          background: rgba(0, 204, 102, 0.24);
          color: #00CC66;
        }
        
        .add-to-cart-mobile:disabled {
          cursor: default;
          opacity: 0.9;
        }

        .quantity-badge-mobile {
          position: absolute;
          top: -8px;
          right: 8px;
          background: #0082FF;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }

        .add-to-favourite {
          padding: 12px 40px;
          width: 100%;
          max-width: 342px;
          background: white;
          color: #0082FF;
          border: 2px solid #0082FF;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .add-to-favourite.added {
          background: rgba(0, 130, 255, 0.05);
          color: #0082FF;
          border: 2px solid #0082FF;
        }
        
        .add-to-favourite:disabled {
          cursor: default;
          opacity: 0.9;
        }

        /* Mobile favorite button - heart shape like product card */
        .add-to-favourite-mobile {
          width: 40px;
          height: 40px;
          padding: 0;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .add-to-favourite-mobile:hover {
          transform: scale(1.05);
        }

        .add-to-favourite-mobile svg {
          display: block;
        }

        /* Ensure desktop buttons remain unchanged */
        @media (min-width: 834px) {
          .action-buttons-mobile {
            flex-direction: row;
            gap: 16px;
          }
          
          .add-to-cart-mobile,
          .add-to-favourite-mobile {
            display: none;
          }
        }

        /* Mobile-specific styles */
        @media (max-width: 833px) {
          .add-to-cart {
            display: none;
          }

          .action-buttons-mobile {
            display: flex;
            flex-direction: column;
          }
        }

        .share-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .share-icons {
          display: flex;
          gap: 8px;
        }

        .share-icon {
          width: 24px;
          height: 24px;
          border: none;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s ease;
          justify-content: center;
          align-items: center;
        }

        .share-icon:hover {
          border-color: #0082FF;
          background: #f0f8ff;
        }

        .other-sellers {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          border: 2px solid #0082FF;
          border-radius: 50px;
          cursor: pointer;
        }

        .arrow-right {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #000;
        }

        /* Promo Cards - Two in one row */
        .promo-cards-row {
          display: flex;
          gap: 16px;
          width: 100%;
        }
        
        .promo-card {
          display: flex;
          align-items: center;
          border-radius: 16px;
          padding: 18px;
          flex: 1;
          box-sizing: border-box;
          gap: 12px;
          min-width: 0; /* Allows text truncation */
        }
        
        .promo-card-outline {
          border: 2px solid #2196F3;
          background: #fff;
        }
        
        .promo-card-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .promo-card-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0; /* Allows text truncation */
          flex: 1;
        }
        
        .promo-card-title {
          font-size: 16px;
          font-weight: 600;
          color: #000;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .promo-card-link {
          font-size: 14px;
          font-weight: 600;
          color: #000;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          white-space: nowrap;
        }

        .additional-info {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          gap: 12px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #000;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
        }

        .info-item:hover {
          color: #0082FF;
        }

        @media (max-width: 1200px) and (min-width: 834px) {
          .product-details {
            max-width: 1392px; /* same as desktop */
            padding: 40px 32px;
            margin: 0;
            width: 100%;
            box-sizing: border-box;
          }

          .product-main {
            gap: 32px;
          }

          .main-image-container {
            width: 100%;
            max-width: 480px;
            height: auto;
            aspect-ratio: 1 / 1;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 40px;
          }

          .thumbnail-list {
            margin-top: 16px;
            justify-content: center;
          }

          .product-info {
            padding-left: 0px;
            width: 100%;
            max-width: 100%;
            margin: 0;
          }

          .product-name {
            font-size: 28px;
          }

          .add-to-cart,
          .add-to-favourite {
            max-width: 100%;
          }

          .action-buttons {
            display: flex;
            flex-direction: row;
            width: 100%;
            gap: 16px;
          }

          .action-buttons .add-to-cart,
          .action-buttons .add-to-favourite {
            flex: 1;
          }

          .seller-brand-row {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .quantity-share-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            width: 100%;
          }
          
          .share-section {
            display: flex;
            align-items: center;
            gap: 10px;
          }
        }

        @media (max-width: 833px) {
          .product-details {
            width: 100%;
            padding: 16px;
            box-sizing: border-box;
          }
          .product-main {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .main-image-container {
            width: 100%;
            height: auto;
            aspect-ratio: 1 / 1;
            margin: 0 auto;
            max-width: 500px;
          }
          .main-image-container .main-image {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain;
          }
          .image-dots {
            display: flex;
            gap: 6px;
          }
          .product-info {
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 0;
            width: 100%;
          }
          .product-name {
            font-size: 24px;
          }
          .stats {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .first-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          .action-buttons {
            flex-direction: column;
            width: 100%;
            gap: 12px;
          }
          .add-to-cart,
          .add-to-favourite,
          .add-to-cart-mobile {
            width: 100%;
            max-width: 100%;
          }
          .quantity-share-container {
            flex-direction: row;
            align-items: flex-end;
          }
          .selection-group {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
          .quantity-share-container .selection-group {
            flex-direction: row;
            align-items: center;
          }
          .color-swiper-wrapper,
          .size-swiper-wrapper {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
          }
          .color-swiper,
          .size-swiper {
            width: 100%;
            padding: 0;
          }
          .color-swiper .swiper-slide,
          .size-swiper .swiper-slide {
            width: auto;
          }
          .color-swiper .color-btn,
          .size-swiper .size-btn {
            flex-shrink: 0;
          }
          .promo-cards-row {
            flex-direction: column;
          }
          .promo-cards-swiper-wrapper {
            width: 100%;
            max-width: 100%;
            overflow: hidden;
          }
          .promo-cards-swiper {
            width: 100%;
            max-width: 100%;
            padding: 0;
          }
          .promo-cards-swiper .swiper-slide {
            width: auto;
          }
          .promo-cards-swiper .promo-card {
            flex: none;
            width: auto;
            min-width: 280px;
          }
        }
      `}</style>
    </div>
  );
}
