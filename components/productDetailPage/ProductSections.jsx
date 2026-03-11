import ProductCard from '@/components/ProductCard'
import SectionHeader from '@/components/SectionHeader'
import ProductInformation from '@/components/productDetailPage/ProductInformation'
import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { getProductReviews } from '@/store/slices/reviewSlice'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

export default function ProductSections({ relatedProducts, productData }) {
  const [relatedNav, setRelatedNav] = useState({ isBeginning: true, isEnd: false })
  const [expandedItem, setExpandedItem] = useState(0)
  const [manufacturerImageIndex, setManufacturerImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState('')
  const [lightboxReview, setLightboxReview] = useState(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0)
  const [viewAllOpen, setViewAllOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const relatedProductsSwiperRef = useRef(null)
  const customerAlsoLikedSwiperRef = useRef(null)

  // Swiper navigation states
  const [relatedProductsNav, setRelatedProductsNav] = useState({ isBeginning: true, isEnd: false })
  const [customerAlsoLikedNav, setCustomerAlsoLikedNav] = useState({ isBeginning: true, isEnd: false })

  // Redux for reviews
  const dispatch = useDispatch()
  const { reviews, loading: reviewsLoading } = useSelector(state => state.review)

  // Fetch reviews when component mounts
  useEffect(() => {
    if (productData?._id) {
      dispatch(getProductReviews(productData._id))
    }
  }, [productData?._id, dispatch])

  // Check screen size for mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Image lightbox handlers
  const openLightbox = (imageUrl, review = null) => {
    setLightboxImage(imageUrl)
    setLightboxReview(review)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxImage('')
    setLightboxReview(null)
  }

  // Gallery handlers
  const openGallery = (index = 0) => {
    setCurrentGalleryIndex(index)
    setGalleryOpen(true)
    setViewAllOpen(false) // Close view all when opening gallery
  }

  const closeGallery = () => {
    setGalleryOpen(false)
    setCurrentGalleryIndex(0)
  }

  const nextGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev + 1) % reviewImages.length)
  }

  const prevGalleryImage = () => {
    setCurrentGalleryIndex((prev) => (prev - 1 + reviewImages.length) % reviewImages.length)
  }

  // View All handlers
  const openViewAll = () => {
    setViewAllOpen(true)
  }

  const closeViewAll = () => {
    setViewAllOpen(false)
  }

  const openImageFromViewAll = (index) => {
    setViewAllOpen(false)
    openGallery(index)
  }

  // Calculate review statistics
  const calculateReviewStats = () => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      }
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let totalRating = 0

    reviews.forEach(review => {
      const rating = review.rating || 0
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++
        totalRating += rating
      }
    })

    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0

    const percentages = {}
    Object.keys(distribution).forEach(rating => {
      percentages[rating] = totalReviews > 0
        ? Math.round((distribution[rating] / totalReviews) * 100)
        : 0
    })

    return { averageRating, totalReviews, ratingDistribution: distribution, percentages }
  }

  const reviewStats = calculateReviewStats()

  // Get all review images with associated review data
  const getAllReviewImages = () => {
    if (!reviews || !Array.isArray(reviews)) return []
    const imagesWithReviews = []
    reviews.forEach(review => {
      if (review.images && review.images.length > 0) {
        review.images.forEach(imageUrl => {
          imagesWithReviews.push({ imageUrl, review })
        })
      }
    })
    return imagesWithReviews
  }

  const reviewImagesData = getAllReviewImages()
  const reviewImages = reviewImagesData.map(item => item.imageUrl)

  // Format date helper
  const formatReviewDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Normalize relatedProducts to always be an array
  const relatedList = Array.isArray(relatedProducts)
    ? relatedProducts
    : (Array.isArray(relatedProducts?.data?.products) ? relatedProducts.data.products
      : Array.isArray(relatedProducts?.data?.items) ? relatedProducts.data.items
        : Array.isArray(relatedProducts?.data) ? relatedProducts.data
          : Array.isArray(relatedProducts?.items) ? relatedProducts.items
            : [])

  const toggleAccordion = (index) => {
    setExpandedItem(expandedItem === index ? -1 : index)
  }

  // Sample manufacturer images
  const manufacturerImages = [
    "/6.jpeg",
    "/2.jpg",
    "/1.jpg"
  ]

  const nextImage = () => {
    setManufacturerImageIndex((prevIndex) =>
      prevIndex === manufacturerImages.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevImage = () => {
    setManufacturerImageIndex((prevIndex) =>
      prevIndex === 0 ? manufacturerImages.length - 1 : prevIndex - 1
    )
  }

  // Create comprehensive specifications from API data
  const createSpecifications = () => {
    if (!productData) return []

    const specs = []

    // Add specifications from API
    if (productData.specifications) {
      Object.entries(productData.specifications).forEach(([key, value]) => {
        // Convert value to string if it's an object or array
        let displayValue = value
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            displayValue = value.join(', ')
          } else {
            displayValue = JSON.stringify(value)
          }
        }

        specs.push({
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: displayValue
        })
      })
    }

    // Add category information
    if (productData.level4?.name) {
      specs.push({ label: 'Category', value: productData.level4.name })
    }
    if (productData.level3?.name) {
      specs.push({ label: 'Sub Category', value: productData.level3.name })
    }

    // Add brand information
    if (productData.brand_id?.name) {
      specs.push({ label: 'Brand', value: productData.brand_id.name })
    }

    // Add weight and dimensions
    if (productData.weight) {
      specs.push({ label: 'Weight', value: `${productData.weight}kg` })
    }
    if (productData.attributes?.dimensions) {
      const { length, width, height } = productData.attributes.dimensions
      specs.push({ label: 'Dimensions', value: `${length} x ${width} x ${height} cm` })
    }

    // Add SKU
    if (productData.sku) {
      specs.push({ label: 'SKU', value: productData.sku })
    }

    return specs
  }

  // Create comprehensive attributes from API data
  const createAttributes = () => {
    if (!productData) return []

    const attrs = []

    // Add attributes from API
    if (productData.attributes) {
      Object.entries(productData.attributes).forEach(([key, value]) => {
        // Skip dimensions as it's handled separately
        if (key === 'dimensions') return

        // Convert value to string if it's an object or array
        let displayValue = value
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            displayValue = value.join(', ')
          } else {
            displayValue = JSON.stringify(value)
          }
        }

        attrs.push({
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: displayValue
        })
      })
    }

    // Add warranty information
    if (productData.attributes?.warranty_period && productData.attributes?.warranty_type) {
      attrs.push({ label: 'Warranty', value: `${productData.attributes.warranty_period} months (${productData.attributes.warranty_type})` })
    }

    // Add store information
    if (productData.store_id?.name) {
      attrs.push({ label: 'Store', value: productData.store_id.name })
    }

    // Add status information
    if (productData.status) {
      attrs.push({ label: 'Status', value: productData.status.charAt(0).toUpperCase() + productData.status.slice(1) })
    }

    // Add product flags
    const flags = []
    if (productData.is_featured) flags.push('Featured')
    if (productData.is_best_seller) flags.push('Best Seller')
    if (productData.is_offer) flags.push('On Offer')
    if (productData.special_deals_for_qliq_plus) flags.push('Qliq Plus Deal')

    if (flags.length > 0) {
      attrs.push({ label: 'Product Flags', value: flags.join(', ') })
    }

    // Add tags
    if (productData.tags && productData.tags.length > 0) {
      attrs.push({ label: 'Tags', value: productData.tags.join(', ') })
    }

    return attrs
  }

  const specifications = createSpecifications()
  const attributes = createAttributes()

  // Handlers for related products swiper navigation
  const handleRelatedProductsPrev = () => {
    if (relatedProductsSwiperRef.current && relatedProductsSwiperRef.current.swiper && !relatedNav.isBeginning) {
      relatedProductsSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleRelatedProductsNext = () => {
    if (relatedProductsSwiperRef.current && relatedProductsSwiperRef.current.swiper && !relatedNav.isEnd) {
      relatedProductsSwiperRef.current.swiper.slideNext();
    }
  };

  const handleCustomerAlsoLikedPrev = () => {
    if (customerAlsoLikedSwiperRef.current && customerAlsoLikedSwiperRef.current.swiper && !customerAlsoLikedNav.isBeginning) {
      customerAlsoLikedSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleCustomerAlsoLikedNext = () => {
    if (customerAlsoLikedSwiperRef.current && customerAlsoLikedSwiperRef.current.swiper && !customerAlsoLikedNav.isEnd) {
      customerAlsoLikedSwiperRef.current.swiper.slideNext();
    }
  };

  return (
    <div>
      {/* Related Products Section */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Related Products"
            showNavigation={true}
            onPrev={handleRelatedProductsPrev}
            onNext={handleRelatedProductsNext}
            showButton={false}
            prevDisabled={relatedProductsNav.isBeginning || !Array.isArray(relatedList) || relatedList.length === 0}
            nextDisabled={relatedProductsNav.isEnd || !Array.isArray(relatedList) || relatedList.length === 0}
          />
          {Array.isArray(relatedList) && relatedList.length > 0 ? (
            <Swiper
              ref={relatedProductsSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={isMobile ? 1.2 : 'auto'}
              spaceBetween={isMobile ? 16 : 24}
              grabCursor={true}
              freeMode={true}
              className="bestsellers-swiper"
              onSlideChange={(swiper) => {
                setRelatedProductsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachEnd={(swiper) => {
                setRelatedProductsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachBeginning={(swiper) => {
                setRelatedProductsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setRelatedProductsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
            >
              {relatedList.map((product, index) => (
                <SwiperSlide key={product.id || `product-${index}`} className="bestseller-slide">
                  <ProductCard {...product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No related products available
            </div>
          )}
        </div>
      </section>

      {/* Product Information Section */}
      {/* <ProductInformation /> */}

      {/* Product Description Section */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Product Overview"
            showNavigation={false}
            showButton={false}
            buttonText="Upgrade"
          />
          <div className="description-content">
            <p>{productData?.description || productData?.short_description || "Product description not available."}</p>
            {productData?.description && productData?.short_description && productData.description !== productData.short_description && (
              <>
                <br />
                <p>{productData.short_description}</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Product Specifications Section */}
      <section className="section">
        <div className="container specifications-container">
          <SectionHeader
            title="Product Specifications"
            showNavigation={false}
            showButton={false}
            buttonText="Upgrade"
          />
          <div className="specifications-wrapper">
            <div className="spec-table spec-table-left">
              <table>
                <tbody>
                  {specifications.slice(0, Math.ceil(specifications.length / 2)).map((spec, index) => (
                    <tr key={index}>
                      <th>{spec.label}</th>
                      <td>{String(spec.value || '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="spec-table spec-table-right">
              <table>
                <tbody>
                  {attributes.slice(0, Math.ceil(attributes.length / 2)).map((attr, index) => (
                    <tr key={index}>
                      <th>{attr.label}</th>
                      <td>{String(attr.value || '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* From The Manufacturer Section */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="From The Manufacturer"
            showNavigation={false}
            showButton={false}
          />
        </div>

        {/* Full-width image container */}
        <div className="manufacturer-full-width">
          <div className="manufacturer-carousel">
            <button className="carousel-arrow left" onClick={prevImage}>‹</button>
            <div className="manufacturer-image">
              <img
                src={manufacturerImages[manufacturerImageIndex]}
                alt="Product from manufacturer"
                className="manufacturer-img"
              />
            </div>
            <button className="carousel-arrow right" onClick={nextImage}>›</button>
          </div>
        </div>
      </section>

      {/* Reviews & Ratings Section */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Reviews & Ratings"
            showNavigation={false}
            showButton={false}
          />
        </div>
        <div className="reviews-ratings-container">
          <div className="reviews-left">
            {/* Overall Rating Summary */}
            <div className="overall-rating-box">
              <div className="overall-rating-label">Overall Rating</div>
              <div className="overall-rating-score">{reviewStats.averageRating}</div>
              <div className="overall-rating-stars">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} width="28" height="28" viewBox="0 0 24 24" fill={i <= Math.round(reviewStats.averageRating) ? "#2196F3" : "#E0E0E0"} style={{ marginRight: 2 }}>
                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                  </svg>
                ))}
              </div>
              <div className="overall-rating-based">Based on {reviewStats.totalReviews} ratings</div>
              <div className="overall-rating-bars">
                <div className="rating-bar-row">
                  <span className="rating-bar-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="#2196F3" style={{ verticalAlign: 'middle' }}><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" /></svg> 5</span>
                  <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: `${reviewStats.percentages[5]}%`, background: '#2196F3' }}></div></div>
                  <span className="rating-bar-percent">{String(reviewStats.percentages[5]).padStart(2, '0')}%</span>
                </div>
                <div className="rating-bar-row">
                  <span className="rating-bar-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="#4CAF50" style={{ verticalAlign: 'middle' }}><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" /></svg> 4</span>
                  <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: `${reviewStats.percentages[4]}%`, background: '#4CAF50' }}></div></div>
                  <span className="rating-bar-percent">{String(reviewStats.percentages[4]).padStart(2, '0')}%</span>
                </div>
                <div className="rating-bar-row">
                  <span className="rating-bar-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="#FFC107" style={{ verticalAlign: 'middle' }}><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" /></svg> 3</span>
                  <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: `${reviewStats.percentages[3]}%`, background: '#FFC107' }}></div></div>
                  <span className="rating-bar-percent">{String(reviewStats.percentages[3]).padStart(2, '0')}%</span>
                </div>
                <div className="rating-bar-row">
                  <span className="rating-bar-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="#A0522D" style={{ verticalAlign: 'middle' }}><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" /></svg> 2</span>
                  <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: `${reviewStats.percentages[2]}%`, background: '#A0522D' }}></div></div>
                  <span className="rating-bar-percent">{String(reviewStats.percentages[2]).padStart(2, '0')}%</span>
                </div>
                <div className="rating-bar-row">
                  <span className="rating-bar-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="#F44336" style={{ verticalAlign: 'middle' }}><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" /></svg> 1</span>
                  <div className="rating-bar-track"><div className="rating-bar-fill" style={{ width: `${reviewStats.percentages[1]}%`, background: '#F44336' }}></div></div>
                  <span className="rating-bar-percent">{String(reviewStats.percentages[1]).padStart(2, '0')}%</span>
                </div>
              </div>
            </div>
          </div>
          <div className="reviews-right">
            <div className="reviews-summary">
              <div className="summary-title">{reviewStats.totalReviews} Reviews, summarised</div>
              <ul className="summary-list">
              </ul>
              <div className="customer-photos-row">
                <span className="customer-photos-title">Customers Photos ({reviewImages.length})</span>
                <a className="customer-photos-viewall" href="#" onClick={(e) => { e.preventDefault(); openViewAll(); }}>View All</a>
              </div>
              <div className="customer-photos-list">
                {reviewImages.length > 0 ? (
                  reviewImages.slice(0, 7).map((imageUrl, i) => (
                    <div
                      className="customer-photo"
                      key={i}
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => openGallery(i)}
                    ></div>
                  ))
                ) : (
                  <div className="no-images-text">
                    
                  </div>
                )}
              </div>

            </div>
            <div className="reviews-list">
              {reviewsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Loading reviews...</div>
              ) : reviews && Array.isArray(reviews) && reviews.length > 0 ? (
                reviews.slice(0, 4).map((review, i) => (
                  <div className="review-item" key={review._id || review.id || i}>
                    <div
                      className="review-photo"
                      style={review.images && review.images[0] ? {
                        backgroundImage: `url(${review.images[0]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer'
                      } : {}}
                      onClick={() => review.images && review.images[0] && openLightbox(review.images[0], review)}
                    ></div>
                    <div className="review-content">
                      <div className="review-text">
                        {review.comment}
                      </div>
                      <div className="review-meta">
                        <span className="review-author">{review.title || 'Anonymous'}</span>
                        {review.isVerified && (
                          <span className="review-verified">
                            <svg width="18" height="18" viewBox="0 0 18 18" style={{ verticalAlign: 'middle', marginRight: 4 }}><circle cx="9" cy="9" r="9" fill="#111" /><path d="M13 7l-4 4-2-2" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="review-date">{formatReviewDate(review.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No reviews yet. Be the first to review!</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            title="Customer Also Liked These Products"
            showNavigation={true}
            onPrev={handleCustomerAlsoLikedPrev}
            onNext={handleCustomerAlsoLikedNext}
            showButton={false}
            buttonText="Upgrade"
            prevDisabled={customerAlsoLikedNav.isBeginning || !Array.isArray(relatedList) || relatedList.length === 0}
            nextDisabled={customerAlsoLikedNav.isEnd || !Array.isArray(relatedList) || relatedList.length === 0}
          />
          {Array.isArray(relatedList) && relatedList.length > 0 ? (
            <Swiper
              ref={customerAlsoLikedSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={isMobile ? 1.2 : 'auto'}
              spaceBetween={isMobile ? 16 : 24}
              grabCursor={true}
              freeMode={true}
              className="bestsellers-swiper"
              onSlideChange={(swiper) => {
                setCustomerAlsoLikedNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachEnd={(swiper) => {
                setCustomerAlsoLikedNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachBeginning={(swiper) => {
                setCustomerAlsoLikedNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setCustomerAlsoLikedNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
            >
              {relatedList.map((product, index) => (
                <SwiperSlide key={product.id || `product-${index}`} className="bestseller-slide">
                  <ProductCard {...product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No related products available
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .product-sections {
          max-width: 1360px;
          margin: auto;
        }

        .section-title {
          font-size: 32px;
          font-weight: 700;
          color: #000000;
          margin: 0 0 48px 0;
          text-align: center;
          line-height: 1.2;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
        }

        .products-carousel {
          position: relative;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .bestsellers-swiper {
          width: 100%;
          padding-bottom: 10px;
        }

        .bestseller-slide {
          width: auto;
          height: auto;
        }

        .manufacturer-full-width {
          width: 100%;
          margin-top: 24px;
        }

        .manufacturer-carousel {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }

        .carousel-arrow {
          position: absolute;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: transparent;
          color: #000;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .carousel-arrow.left {
          left: 60px;
        }

        .carousel-arrow.right {
          right: 60px;
        }

        .accordion-container {
          max-width: 900px;
          margin: 0 auto;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: white;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .accordion {
          display: flex;
          flex-direction: column;
        }

        .accordion-item {
          border: none;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 0;
          overflow: hidden;
          margin-bottom: 0;
          background: white;
          box-shadow: none;
          transition: all 0.2s ease;
        }

        .accordion-item:last-child {
          border-bottom: none;
        }

        .accordion-item.expanded {
          border-color: #e5e7eb;
          box-shadow: none;
        }

        .accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.2s ease;
          border: none;
          width: 100%;
          text-align: left;
        }

        .accordion-item.expanded .accordion-header {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }

        .accordion-header:hover {
          background: #f9f9f9;
        }

        .accordion-title {
          font-size: 16px;
          font-weight: 500;
          color: #000000;
          margin: 0;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
        }

        .accordion-toggle {
          background: none;
          border: none;
          font-size: 24px;
          color: #666666;
          cursor: pointer;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0;
          transition: all 0.2s ease;
        }

        .accordion-content {
          padding: 24px 32px;
          background: white;
          line-height: 1.6;
        }

        .accordion-content p {
          margin: 0;
          line-height: 1.6;
          color: #666666;
          font-size: 15px;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
        }

        .description-container {
          max-width: 900px;
          margin: 0 auto;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .description-content {
          max-width: 1392px;
          width: 100%;
          background: white;
          padding-left: 24px;
          padding-right: 24px;
          border: none;
          border-radius: 0;
          box-shadow: none;
        }

        .description-content p {
          line-height: 150%;
          color: #000;
          font-size: 16px;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-weight: 600;
        }

        .description-content p:last-child {
          margin-bottom: 0;
        }

        .manufacturer-image {
          width: 100%;
          height: 400px;
          overflow: hidden;
          background: #f0f8ff;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .manufacturer-img {
          width: 100%;
          height: 100%;
          max-height: 600px;
          object-fit: cover;
        }

        .specifications-container {
          max-width: 1392px;
          padding-left: 0px;
          padding-right: 0px;
        }
        .specifications-wrapper {
          display: flex;
          gap: 0;
          justify-content: center;
          align-items: flex-start;
          margin-top: 24px;
          width: 100%;
          max-width: 1392px;
          padding: 0 12px;
        }
        .spec-table {
          flex: 1;
          min-width: 0;
          max-width: 50%;
        }
        .spec-table table {
          width: 100%;
          max-width: 1392px;
          border-collapse: collapse;
        }
        .spec-table th,
        .spec-table td {
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 16px;
          font-weight: 600;
          text-align: left;
          padding: 12px 16px;
        }
        .spec-table th {
          color: #111;
          background: transparent;
          width: 160px;
        }
        .spec-table td {
          color: #222;
        }
        @media (max-width: 768px) {
          .spec-table {
            width: 100%;
            max-width: 100%;
          }
          .spec-table table {
            width: 100%;
            max-width: 100%;
          }
          .spec-table tr {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            flex-wrap: nowrap;
          }
          .spec-table th {
            text-align: left;
            align-self: flex-start;
            flex: 0 0 auto;
            min-width: 120px;
            padding: 12px 8px 12px 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .spec-table td {
            text-align: right;
            align-self: flex-end;
            flex: 1;
            min-width: 0;
            padding: 12px 0 12px 8px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            overflow: visible;
          }
        }
        /* Right table: normal coloring */
        .spec-table-right tr:nth-child(even) td,
        .spec-table-right tr:nth-child(even) th {
          background: #f7f7f7;
        }
        .spec-table-right tr:nth-child(odd) td,
        .spec-table-right tr:nth-child(odd) th {
          background: #fff;
        }
        /* Left table: inverted coloring */
        .spec-table-left tr:nth-child(odd) td,
        .spec-table-left tr:nth-child(odd) th {
          background: #f7f7f7;
        }
        .spec-table-left tr:nth-child(even) td,
        .spec-table-left tr:nth-child(even) th {
          background: #fff;
        }
        @media (max-width: 900px) {
          .specifications-wrapper {
            flex-direction: column;
            gap: 0;
          }
          .spec-table {
            max-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .section-title {
            font-size: 28px;
            margin-bottom: 32px;
          }

          .section {
            margin-bottom: 0px;
          }

          .accordion-container {
            max-width: 100%;
            border-radius: 12px;
          }

          .accordion-header {
            padding: 20px 24px;
          }

          .accordion-title {
            font-size: 15px;
          }

          .accordion-toggle {
            font-size: 22px;
            width: 24px;
            height: 24px;
          }

          .accordion-content {
            padding: 20px 24px;
          }

          .accordion-content p {
            font-size: 14px;
          }

          .description-container {
            max-width: 100%;
            border-radius: 12px;
          }

          .description-content {
            padding: 16px 0px;
          }

          .description-content p {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 0px;
          }

          .carousel-arrow {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }

          .carousel-arrow.left {
            left: 10px;
          }
          .specifications-container {
            padding-left: 16px;
            padding-right: 16px;
            width: 100%;
            max-width: 100%;
          }
          .specifications-wrapper {
            width: 100%;
            max-width: 100%;
            padding: 0;
          }

          .carousel-arrow.right {
            right: 10px;
          }
        }

          .manufacturer-image {
            height: 300px;
          }
        }

        @media (max-width: 480px) {
          .section-title {
            font-size: 24px;
            margin-bottom: 24px;
          }
          .specifications-wrapper {
          width: 100%;
          padding-left: 0px;
          padding-right: 0px;
        }
          .accordion-header {
            padding: 16px 20px;
          }
          .accordion-content {
            padding: 16px 20px;
          }

          .description-content {
            padding: 16px 0px;
          }

          .manufacturer-image {
            height: 180px;
          }

          .carousel-arrow {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }
        }

        .reviews-ratings-container {
          display: flex;
          gap: 48px;
          max-width: 1392px;
          margin: 0 auto;
          padding: 0 24px;
        }
          .reviews-left {
          flex: 1;
          max-width: 340px;
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .reviews-title {
          font-size: 32px;
          font-weight: 600;
          margin-bottom: 8px;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
        }
          .reviews-title-2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
        }
        .overall-rating-box {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          margin-bottom: 32px;
          min-width: 320px;
          max-width: 340px;
        }
        .overall-rating-label {
          font-size: 24px;
          font-weight: 600;
          color: #000;
          margin-bottom: 0;
        }
        .overall-rating-score {
          font-size: 48px;
          font-weight: 700;
          color: #111;
          margin-bottom: 4px;
        }
        .overall-rating-stars {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .overall-rating-based {
          font-size: 15px;
          color: #222;
          margin-bottom: 18px;
        }
        .overall-rating-bars {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rating-bar-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
        }
        .rating-bar-label {
          width: 48px;
          display: flex;
          align-items: center;
          gap: 2px;
          font-weight: 600;
        }
        .rating-bar-track {
          flex: 1;
          height: 8px;
          background: #eee;
          border-radius: 8px;
          overflow: hidden;
          margin: 0 8px;
        }
        .rating-bar-fill {
          height: 100%;
          border-radius: 8px;
        }
        .rating-bar-percent {
          width: 38px;
          text-align: right;
          font-weight: 600;
        }
        .reviews-left {
          flex: 1;
          max-width: 340px;
        }
        .reviews-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 32px;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
        }
          .reviews-title-2 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
        }
        .review-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .form-input, .form-textarea {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 10px 14px;
          font-size: 16px;
          font-family: inherit;
          background: #fff;
          margin-bottom: 0;
        }
        .form-input::placeholder,
        .form-textarea::placeholder {
          color: #000; /* Black placeholder text */
        }
        .form-upload-container {
          width: 100%;
        }
        .form-upload-label {
          display: block;
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 10px 14px;
          font-size: 16px;
          font-family: inherit;
          background: #fff;
          color: #000; /* Black text for upload label */
          cursor: pointer;
          text-align: left;
        }
        .upload-input {
          display: none;
        }
        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }
        .form-cancel {
          flex: 1;
          background: #fff;
          border: 1px solid #111;
          color: #111;
          border-radius: 24px;
          font-size: 16px;
          font-weight: 500;
          padding: 8px 0;
          cursor: pointer;
        }
        .form-submit {
          flex: 1;
          background: #cbe6ff;
          border: none;
          color: #111;
          border-radius: 24px;
          font-size: 16px;
          font-weight: 500;
          padding: 8px 0;
          cursor: pointer;
        }
        .reviews-right {
          flex: 2.2;
          min-width: 900px;
        }
        .reviews-summary {
          margin-bottom: 24px;
        }
        .summary-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .summary-list {
          margin: 0 0 18px 0;
          padding-left: 18px;
          font-size: 16px;
          color: #222;
          font-weight: 600;
        }
        .no-images-text {
          padding: 20px;
          text-align: center;
          color: #888;
          font-size: 16px;
          font-weight: 600;
          width: 100%;
}

        .customer-photos-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .customer-photos-title {
          font-size: 15px;
          font-weight: 600;
          color: #222;
        }
        .customer-photos-viewall {
          font-size: 15px;
          color: #007aff;
          font-weight: 500;
          text-decoration: none;
        }
        .customer-photos-list {
          display: flex;
          gap: 16px;
          margin-bottom: 18px;
        }
        .customer-photo {
          width: 108px;
          height: 108px;
          border-radius: 12px;
          background: #111;
          display: inline-block;
        }
        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .review-item {
          display: flex;
          gap: 18px;
          align-items: flex-start;
          flex-direction: column;
        }
        .review-photo {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          background: #111;
          flex-shrink: 0;
        }
        .review-content {
          flex: 1;
        }
        .review-text {
          font-size: 16px;
          color: #222;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .review-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #222;
          margin-bottom: 4px;
        }
        .review-author {
          font-weight: 600;
          font-size: 16px;
          color: #000;
        }
        .review-verified {
          display: flex;
          align-items: center;
          gap: 2px;
          font-weight: 600;
          font-size: 16px;
          color: #000;
        }
        .review-date {
          color: #000;
          font-size: 14px;
          font-weight: 600;
        }
        @media (max-width: 1100px) {
          .reviews-ratings-container {
            flex-direction: column;
            gap: 32px;
            padding: 0 12px;
          }
          .reviews-left, .reviews-right {
            max-width: 100%;
          }
        }
        @media (max-width: 768px) {
          .reviews-title {
            font-size: 1.3rem;
            margin-bottom: 18px;
          }
          .reviews-ratings-container {
            padding: 0 16px;
          }
          .customer-photo {
            width: 60px;
            height: 60px;
          }
          .review-photo {
            width: 48px;
            height: 48px;
          }
        }
        @media (max-width: 480px) {
          .reviews-title {
            font-size: 1.1rem;
          }
          .reviews-ratings-container {
            padding: 0 16px;
          }
          .customer-photo {
            width: 100px;
            height: 100px;
          }
          .review-photo {
            width: 80px;
            height: 80px;
          }
            .review-left {
            max-width: 350px;
            width: 100%;
          }
          .reviews-right {
            min-width: 350px;
            width: 100%;
          }
        }
      `}</style>

      {/* View All Images Modal - Grid of 60px Thumbnails */}
      {viewAllOpen && (
        <div
          className="lightbox-overlay"
          onClick={closeViewAll}
        >
          <div className="viewall-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeViewAll}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h2 className="viewall-title">All Customer Photos ({reviewImages.length})</h2>

            <div className="viewall-grid">
              {reviewImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="viewall-thumbnail"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                  onClick={() => openImageFromViewAll(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal with Review */}
      {lightboxOpen && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
        >
          <div className="lightbox-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="lightbox-content">
              <div className="lightbox-image-container">
                <img src={lightboxImage} alt="Review" className="lightbox-image" />
              </div>
              {lightboxReview && (
                <div className="lightbox-review-info">
                  <div className="lightbox-review-header">
                    <div className="lightbox-review-stars">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} style={{ color: i <= lightboxReview.rating ? '#FFB800' : '#ddd', fontSize: '18px' }}>★</span>
                      ))}
                    </div>
                    <span className="lightbox-review-author">{lightboxReview.title || 'Anonymous'}</span>
                  </div>
                  <p className="lightbox-review-comment">{lightboxReview.comment}</p>
                  <span className="lightbox-review-date">{formatReviewDate(lightboxReview.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {galleryOpen && reviewImages.length > 0 && (
        <div
          className="lightbox-overlay"
          onClick={closeGallery}
        >
          <div className="gallery-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeGallery}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Navigation Arrows */}
            {reviewImages.length > 1 && (
              <>
                <button className="gallery-nav gallery-prev" onClick={prevGalleryImage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button className="gallery-nav gallery-next" onClick={nextGalleryImage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </>
            )}

            <div className="gallery-main">
              <img src={reviewImages[currentGalleryIndex]} alt={`Gallery ${currentGalleryIndex + 1}`} className="gallery-image" />

              {/* Review Info for Current Image */}
              {reviewImagesData[currentGalleryIndex]?.review && (
                <div className="gallery-review-info">
                  <div className="gallery-review-header">
                    <div className="gallery-review-stars">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} style={{ color: i <= reviewImagesData[currentGalleryIndex].review.rating ? '#FFB800' : '#ddd', fontSize: '20px' }}>★</span>
                      ))}
                    </div>
                    <span className="gallery-review-author">{reviewImagesData[currentGalleryIndex].review.title || 'Anonymous'}</span>
                  </div>
                  <p className="gallery-review-comment">{reviewImagesData[currentGalleryIndex].review.comment}</p>
                  <span className="gallery-review-date">{formatReviewDate(reviewImagesData[currentGalleryIndex].review.createdAt)}</span>
                </div>
              )}
            </div>

            {/* <div className="gallery-counter">
              {currentGalleryIndex + 1} / {reviewImages.length}
            </div> */}

            {/* Thumbnail Strip */}
            {/* <div className="gallery-thumbnails">
              {reviewImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className={`gallery-thumbnail ${index === currentGalleryIndex ? 'active' : ''}`}
                  style={{ backgroundImage: `url(${imageUrl})` }}
                  onClick={() => setCurrentGalleryIndex(index)}
                />
              ))}
            </div> */}
          </div>
        </div>
      )}

      <style jsx>{`
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease;
          padding: 20px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .lightbox-content-wrapper {
          position: relative;
          max-width: 1200px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .lightbox-content {
          display: flex;
          gap: 40px;
          align-items: center;
          background: #fff;
          border-radius: 12px;
          padding: 40px;
          max-width: 100%;
          animation: zoomIn 0.3s ease;
        }
        
        .lightbox-image-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .lightbox-image {
          max-width: 600px;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 8px;
        }
        
        .lightbox-review-info {
          flex: 0 0 300px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .lightbox-review-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .lightbox-review-stars {
          display: flex;
          gap: 2px;
        }
        
        .lightbox-review-author {
          font-weight: 600;
          font-size: 16px;
          color: #1a1a1a;
        }
        
        .lightbox-review-comment {
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          margin: 8px 0;
        }
        
        .lightbox-review-date {
          font-size: 12px;
          color: #666;
        }
        
        @keyframes zoomIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          z-index: 10;
        }
        
        .lightbox-close:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: rotate(90deg);
        }

        /* View All Images Modal Styles */
        .viewall-content {
          position: relative;
          background: #fff;
          border-radius: 16px;
          padding: 60px;
          max-width: 95vw;
          width: 1400px;
          max-height: 90vh;
          overflow-y: auto;
          animation: zoomIn 0.3s ease;
        }
        
        .viewall-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 40px;
          text-align: center;
        }
        
        .viewall-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 120px);
          gap: 16px;
          justify-content: center;
          padding: 10px;
        }
        
        .viewall-thumbnail {
          width: 120px;
          height: 120px;
          background-size: cover;
          background-position: center;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 3px solid transparent;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .viewall-thumbnail:hover {
          transform: scale(1.1);
          border-color: #2196F3;
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
          z-index: 1;
        }

        /* Gallery Styles */
        .gallery-content-wrapper {
          position: relative;
          max-width: 1400px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        
        .gallery-main {
          display: flex;
          gap: 40px;
          align-items: center;
          background: #fff;
          border-radius: 12px;
          padding: 40px;
          max-width: 100%;
          animation: zoomIn 0.3s ease;
        }
        
        .gallery-image {
          max-width: 700px;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 8px;
        }
        
        .gallery-review-info {
          flex: 0 0 350px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .gallery-review-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .gallery-review-stars {
          display: flex;
          gap: 4px;
        }
        
        .gallery-review-author {
          font-weight: 600;
          font-size: 18px;
          color: #1a1a1a;
        }
        
        .gallery-review-comment {
          font-size: 15px;
          line-height: 1.6;
          color: #333;
          margin: 8px 0;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .gallery-review-date {
          font-size: 13px;
          color: #666;
        }
        
        .gallery-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.15);
          border: none;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          z-index: 10;
        }
        
        .gallery-nav:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-50%) scale(1.1);
        }
        
        .gallery-prev {
          left: 20px;
        }
        
        .gallery-next {
          right: 20px;
        }
        
        .gallery-counter {
          position: absolute;
          bottom: 140px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }
        
        .gallery-thumbnails {
          display: flex;
          gap: 8px;
          max-width: 100%;
          overflow-x: auto;
          padding: 10px 0;
          scrollbar-width: thin;
        }
        
        .gallery-thumbnails::-webkit-scrollbar {
          height: 6px;
        }
        
        .gallery-thumbnails::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .gallery-thumbnails::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        
        .gallery-thumbnail {
          width: 70px;
          height: 70px;
          border-radius: 6px;
          background-size: cover;
          background-position: center;
          cursor: pointer;
          flex-shrink: 0;
          border: 2px solid transparent;
          transition: all 0.3s ease;
          opacity: 0.6;
        }
        
        .gallery-thumbnail:hover {
          opacity: 1;
          transform: scale(1.05);
        }
        
        .gallery-thumbnail.active {
          border-color: #2196F3;
          opacity: 1;
        }
        
        @media (max-width: 768px) {
          .viewall-content {
            padding: 20px;
            max-width: 95vw;
          }
          
          .viewall-title {
            font-size: 20px;
            margin-bottom: 20px;
          }
          
          .viewall-grid {
            gap: 8px;
          }
          
          .lightbox-content {
            flex-direction: column;
            padding: 20px;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          .lightbox-image {
            max-width: 100%;
            max-height: 50vh;
          }
          
          .lightbox-review-info {
            flex: 1;
            width: 100%;
          }
          
          .lightbox-close {
            top: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
          }
          
          .gallery-main {
            flex-direction: column;
            padding: 20px;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          .gallery-image {
            max-width: 100%;
            max-height: 50vh;
          }
          
          .gallery-review-info {
            flex: 1;
            width: 100%;
          }
          
          .gallery-nav {
            width: 40px;
            height: 40px;
          }
          
          .gallery-prev {
            left: 10px;
          }
          
          .gallery-next {
            right: 10px;
          }
          
          .gallery-counter {
            bottom: 120px;
          }
          
          .gallery-thumbnail {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </div>
  )
}