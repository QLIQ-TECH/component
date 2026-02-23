'use client'

import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import Navigation from '@/components/Navigation'
import ProductCard from '@/components/ProductCard'
import CategoryCard from '@/components/CategoryCard'
import SectionHeader from '@/components/SectionHeader'
import Footer from '@/components/Footer'
import { fetchCategoryChildren, fetchHypermarketLevel2Categories, fetchSupermarketLevel2Categories, fetchStoreLevel2Categories } from '@/store/slices/categoriesSlice'
import { fetchProductsByStoreSlug, fetchHypermarketProducts, fetchSupermarketProducts, fetchStoreProductsByStoreId, clearStoreSlugProducts, clearHypermarketProducts, clearSupermarketProducts, clearStoreProductsByStoreId } from '@/store/slices/productsSlice'
import { catalog } from '@/store/api/endpoints'
import { ProductCardSkeleton, CategoryCardSkeleton } from '@/components/SkeletonLoader'

// Helper function to transform API product data to match ProductCard component format (VAT-inclusive prices)
const transformProductData = (apiProduct) => {
  // Get the primary image or first available image
  const primaryImage = apiProduct.images?.find(img => img.is_primary) || apiProduct.images?.[0];

  // Use placeholder image if no valid image URL
  const imageUrl = primaryImage?.url || 'https://api.builder.io/api/v1/image/assets/TEMP/0ef2d416817956be0fe96760f14cbb67e415a446?width=644';

  const priceWithVat = apiProduct.price_with_vat ?? apiProduct.price
  const discountPriceWithVat = apiProduct.discount_price_with_vat ?? apiProduct.discount_price
  const effectivePrice = (discountPriceWithVat != null && discountPriceWithVat > 0) ? discountPriceWithVat : priceWithVat
  const savings = apiProduct.is_offer && priceWithVat != null && discountPriceWithVat != null && discountPriceWithVat > 0
    ? priceWithVat - discountPriceWithVat
    : 0;

  // For cheap deals, show discount percentage if available
  let badge = null;
  if (apiProduct.discount_percentage && apiProduct.discount_percentage > 0) {
    badge = `${Math.round(apiProduct.discount_percentage)}% OFF`;
  } else if (apiProduct.is_offer && savings > 0) {
    badge = `Save AED ${savings}`;
  }

  return {
    id: apiProduct._id || apiProduct.slug,
    title: apiProduct.title || 'Product Title',
    price: `AED ${effectivePrice ?? '0'}`,
    rating: apiProduct.average_rating?.toString() || '0',
    deliveryTime: '30 Min', // Default delivery time since it's not in API
    image: imageUrl,
    badge: badge,
    priceWithVat: priceWithVat != null ? Number(priceWithVat) : undefined,
    discountPriceWithVat: discountPriceWithVat != null && Number(discountPriceWithVat) > 0 ? Number(discountPriceWithVat) : undefined
  }
}

// Helper function to transform API category data to match CategoryCard component format
const transformCategoryData = (apiCategory) => {
  // Use placeholder images as fallback if icon is not provided
  const placeholderImages = [
    'https://api.builder.io/api/v1/image/assets/TEMP/b96c7d3062a93a3b6d8e9a2a4bd11acfa542dced?width=412',
    'https://api.builder.io/api/v1/image/assets/TEMP/81e3ee1beeaa2c8941600c27d3ec9733bac0869c?width=412',
    'https://api.builder.io/api/v1/image/assets/TEMP/5839901b9e3641626fef47388dc1036c852a0aa5?width=412',
    'https://api.builder.io/api/v1/image/assets/TEMP/4a25e8a2b689f4d8cf2f809de9e46f2c26c36d46?width=412',
    'https://api.builder.io/api/v1/image/assets/TEMP/bb3de20fdb53760293d946ca033adbf4489bed56?width=412',
    'https://api.builder.io/api/v1/image/assets/TEMP/f291940d1feaf8e5cb0a7335f629e12091d26a73?width=412'
  ]

  // Use icon from database if available, otherwise use placeholder
  let categoryImage = apiCategory.icon;
  
  // If no icon from database, use hash-based placeholder assignment
  if (!categoryImage) {
    const hash = apiCategory.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    const imageIndex = Math.abs(hash) % placeholderImages.length
    categoryImage = placeholderImages[imageIndex]
  }

  return {
    id: apiCategory._id,
    name: apiCategory.name || 'Category Name',
    image: categoryImage,
    slug: apiCategory.slug || apiCategory.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    level: apiCategory.level
  }
}

// Static product data for fallback

export default function CategoryPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const slug = params.slug
  const source = searchParams?.get('source') || null

  const { categoryChildren, hypermarketLevel2Categories, supermarketLevel2Categories, storeLevel2Categories, loading, error } = useSelector(state => state.categories)
  const loadingMoreCategories = useRef(false)
  const { 
    storeSlugProducts, 
    storeSlugProductsLoading, 
    storeSlugProductsError, 
    hypermarketProducts, 
    hypermarketProductsLoading, 
    hypermarketProductsError,
    supermarketProducts,
    supermarketProductsLoading,
    supermarketProductsError,
    storeProductsByStoreId,
    storeProductsByStoreIdLoading,
    storeProductsByStoreIdError
  } = useSelector(state => state.products)
  
  const [categoryInfo, setCategoryInfo] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isStoreSlug, setIsStoreSlug] = useState(false)
  const [storeId, setStoreId] = useState(null)
  
  // Navigation State
  const [bestsellersNav, setBestsellersNav] = useState({ isBeginning: true, isEnd: false });
  const [offersNav, setOffersNav] = useState({ isBeginning: true, isEnd: false });
  const [newArrivalsNav, setNewArrivalsNav] = useState({ isBeginning: true, isEnd: false });
  const [otherCategoriesNav, setOtherCategoriesNav] = useState({ isBeginning: true, isEnd: false });

  // Determine if this is actually a store slug based on data presence
  // Check hypermarket, supermarket, store products, and store slug products
  const isActuallyStoreSlug = !!(hypermarketProducts?.store || supermarketProducts?.store || storeProductsByStoreId?.store || storeSlugProducts?.store)
  const isHypermarketStore = !!hypermarketProducts?.store
  const isSupermarketStore = !!supermarketProducts?.store
  const isRegularStore = !!storeProductsByStoreId?.store
  
  // Determine loading state - loading if any of category, store, hypermarket, supermarket, or regular store is loading
  const isLoading = loading || storeSlugProductsLoading || hypermarketProductsLoading || supermarketProductsLoading || storeProductsByStoreIdLoading
  // Determine error state - show error if category failed and it's not a store, or if any store type failed and it is a store
  const hasError = (isActuallyStoreSlug && (storeSlugProductsError || hypermarketProductsError || supermarketProductsError || storeProductsByStoreIdError)) || (!isActuallyStoreSlug && error)

  // Swiper refs
  const bestsellersSwiperRef = useRef(null)
  const offersSwiperRef = useRef(null)
  const newArrivalsSwiperRef = useRef(null)
  const cheapDealsSwiperRef = useRef(null)
  const otherCategoriesSwiperRef = useRef(null)

  // Check screen size for mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkScreenSize()

    // Add event listener
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // For /category/[slug] pages, fetch appropriate API based on source
  useEffect(() => {
    if (slug) {
      // Clear all data immediately when slug or source changes to prevent showing stale data
      setIsStoreSlug(false)
      setCategoryInfo(null)
      setStoreId(null)
      dispatch(clearStoreSlugProducts())
      dispatch(clearHypermarketProducts())
      dispatch(clearSupermarketProducts())
      dispatch(clearStoreProductsByStoreId())
      
      // Check source query parameter to determine which API to call
      if (source === 'hypermarket') {
        // From hypermarket page - first get store by slug, then call hypermarket products API
        const fetchStoreAndProducts = async () => {
          try {
            // Fetch store by slug to get storeId
            const storeResponse = await fetch(catalog.storeBySlug(slug))
            if (storeResponse.ok) {
              const storeData = await storeResponse.json()
              if (storeData.success && storeData.data && storeData.data._id) {
                const fetchedStoreId = storeData.data._id
                setStoreId(fetchedStoreId)
                // Call hypermarket products API with storeId
                dispatch(fetchHypermarketProducts({ storeId: fetchedStoreId }))
              }
            }
          } catch (error) {
            console.error('Error fetching store by slug:', error)
          }
        }
        fetchStoreAndProducts()
        // Also fetch hypermarket level2 categories
        dispatch(fetchHypermarketLevel2Categories())
      } else if (source === 'supermarket') {
        // From supermarket page - first get store by slug, then call supermarket products API
        const fetchStoreAndProducts = async () => {
          try {
            // Fetch store by slug to get storeId
            const storeResponse = await fetch(catalog.storeBySlug(slug))
            if (storeResponse.ok) {
              const storeData = await storeResponse.json()
              if (storeData.success && storeData.data && storeData.data._id) {
                const fetchedStoreId = storeData.data._id
                setStoreId(fetchedStoreId)
                // Call supermarket products API with storeId
                dispatch(fetchSupermarketProducts({ storeId: fetchedStoreId }))
              }
            }
          } catch (error) {
            console.error('Error fetching store by slug:', error)
          }
        }
        fetchStoreAndProducts()
        // Also fetch supermarket level2 categories
        dispatch(fetchSupermarketLevel2Categories())
      } else if (source === 'store') {
        // From store page - first get store by slug, then call store products API
        const fetchStoreAndProducts = async () => {
          try {
            // Fetch store by slug to get storeId
            const storeResponse = await fetch(catalog.storeBySlug(slug))
            if (storeResponse.ok) {
              const storeData = await storeResponse.json()
              if (storeData.success && storeData.data && storeData.data._id) {
                const fetchedStoreId = storeData.data._id
                setStoreId(fetchedStoreId)
                // Call store products API with storeId
                dispatch(fetchStoreProductsByStoreId({ storeId: fetchedStoreId }))
              }
            }
          } catch (error) {
            console.error('Error fetching store by slug:', error)
          }
        }
        fetchStoreAndProducts()
        // Also fetch store level2 categories
        dispatch(fetchStoreLevel2Categories())
      } else {
        // From discovery page or no source - also fetch hypermarket and supermarket level 2 categories
        dispatch(fetchHypermarketLevel2Categories())
        dispatch(fetchSupermarketLevel2Categories())
      }
      // Fetch all category children in one go (limit 50) so 11th, 12th etc. display immediately in slider
      dispatch(fetchCategoryChildren({ slug, page: 1, limit: 50 }))
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearStoreSlugProducts())
      dispatch(clearHypermarketProducts())
      dispatch(clearSupermarketProducts())
      dispatch(clearStoreProductsByStoreId())
      setStoreId(null)
    }
  }, [dispatch, slug, source])

  // Update isStoreSlug when hypermarket, supermarket, store products, or storeSlugProducts data loads
  useEffect(() => {
    if (hypermarketProducts?.store) {
      setIsStoreSlug(true)
      setCategoryInfo({
        name: hypermarketProducts.store.name,
        description: hypermarketProducts.store.description || 'Browse all products from this hypermarket'
      })
    } else if (supermarketProducts?.store) {
      setIsStoreSlug(true)
      setCategoryInfo({
        name: supermarketProducts.store.name,
        description: supermarketProducts.store.description || 'Browse all products from this supermarket'
      })
    } else if (storeProductsByStoreId?.store) {
      setIsStoreSlug(true)
      setCategoryInfo({
        name: storeProductsByStoreId.store.name,
        description: storeProductsByStoreId.store.description || 'Browse all products from this store'
      })
    } else if (storeSlugProducts?.store) {
      setIsStoreSlug(true)
      setCategoryInfo({
        name: storeSlugProducts.store.name,
        description: storeSlugProducts.store.description || 'Browse all products from this store'
      })
    }
  }, [hypermarketProducts, supermarketProducts, storeProductsByStoreId, storeSlugProducts])

  // Update category info when category children data is loaded (only if not a store)
  useEffect(() => {
    if (!isStoreSlug && categoryChildren?.data?.category) {
      setCategoryInfo(categoryChildren.data.category)
    }
  }, [categoryChildren, isStoreSlug])

  // Clear load-more lock when category children pagination updates (so we can fetch next page again)
  useEffect(() => {
    if (categoryChildren?.data?.pagination) {
      loadingMoreCategories.current = false
    }
  }, [categoryChildren?.data?.pagination?.page])

  // Reset load-more ref when slug changes so new category can load more pages
  useEffect(() => {
    loadingMoreCategories.current = false
  }, [slug])

  // Transform API data - prioritize hypermarket, then supermarket, then store products, then store slug, then category children
  const getProductsForSection = (sectionName) => {
    // First check if we have hypermarket products
    if (hypermarketProducts?.store && hypermarketProducts?.productsByCategory) {
      const sectionProducts = hypermarketProducts.productsByCategory[sectionName] || []
      if (sectionProducts.length > 0) {
        return sectionProducts.map(transformProductData)
      }
    }
    
    // Then check if we have supermarket products
    if (supermarketProducts?.store && supermarketProducts?.productsByCategory) {
      const sectionProducts = supermarketProducts.productsByCategory[sectionName] || []
      if (sectionProducts.length > 0) {
        return sectionProducts.map(transformProductData)
      }
    }
    
    // Then check if we have store products
    if (storeProductsByStoreId?.store && storeProductsByStoreId?.productsByCategory) {
      const sectionProducts = storeProductsByStoreId.productsByCategory[sectionName] || []
      if (sectionProducts.length > 0) {
        return sectionProducts.map(transformProductData)
      }
    }
    
    // Then check if we have store slug products (storeSlugProducts is already the data object)
    if (storeSlugProducts?.store && storeSlugProducts?.productsByCategory) {
      // Use products from store slug
      const sectionProducts = storeSlugProducts.productsByCategory[sectionName] || []
      if (sectionProducts.length > 0) {
        return sectionProducts.map(transformProductData)
      }
    }
    
    // Fall back to category children if no store products
    if (categoryChildren?.data?.products) {
      const sectionProducts = categoryChildren.data.products[sectionName] || []
      if (sectionProducts.length > 0) {
        return sectionProducts.map(transformProductData)
      }
    }
    
    return []
  }

  const transformedBestsellers = getProductsForSection('bestsellers') || []
  const transformedOffers = getProductsForSection('offers') || []
  const transformedNewArrivals = getProductsForSection('newArrivals') || []
  const transformedCheapDeals = getProductsForSection('cheapDeals') || []

  // Get all products if it's a store slug for displaying in a grid
  // Check hypermarket, supermarket, store products, then store slug products
  const allStoreProducts = (hypermarketProducts?.products && hypermarketProducts.products.length > 0)
    ? hypermarketProducts.products.map(transformProductData)
    : (supermarketProducts?.products && supermarketProducts.products.length > 0)
    ? supermarketProducts.products.map(transformProductData)
    : (storeProductsByStoreId?.products && storeProductsByStoreId.products.length > 0)
    ? storeProductsByStoreId.products.map(transformProductData)
    : (storeSlugProducts?.success && storeSlugProducts?.data?.products)
    ? storeSlugProducts.data.products.map(transformProductData)
    : []

  // Get store banner image - prioritize hypermarket, then supermarket, then store products, then store slug
  const storeBannerImage = hypermarketProducts?.store?.banner 
    || supermarketProducts?.store?.banner 
    || storeProductsByStoreId?.store?.banner 
    || storeSlugProducts?.store?.banner 
    || '/2.jpg'
  
  // Use appropriate categories based on source
  // Return empty array while loading to prevent showing stale data
  const categoriesToDisplay = (() => {
    // If loading, return empty array to prevent showing stale categories
    if (isLoading) {
      return []
    }
    
    if (source === 'hypermarket' && hypermarketLevel2Categories && hypermarketLevel2Categories.length > 0) {
      return hypermarketLevel2Categories.map(transformCategoryData)
    } else if (source === 'supermarket' && supermarketLevel2Categories && supermarketLevel2Categories.length > 0) {
      return supermarketLevel2Categories.map(transformCategoryData)
    } else if (source === 'store' && storeLevel2Categories && storeLevel2Categories.length > 0) {
      return storeLevel2Categories.map(transformCategoryData)
    } else if (categoryChildren?.data?.level4Categories) {
      // Default: use category children level4Categories (from discovery page)
      return categoryChildren.data.level4Categories.map(transformCategoryData)
    } else {
      // Fallback: try hypermarket or supermarket if available
      if (hypermarketLevel2Categories && hypermarketLevel2Categories.length > 0) {
        return hypermarketLevel2Categories.map(transformCategoryData)
      } else if (supermarketLevel2Categories && supermarketLevel2Categories.length > 0) {
        return supermarketLevel2Categories.map(transformCategoryData)
      }
      return []
    }
  })()
  
  const transformedCategories = categoriesToDisplay

  const handleBack = () => {
    router.push('/')
  }

  const handleCategoryClick = (category) => {
    // Use the slug from the API data or create a slug from the name
    const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    // For level 2 categories (hypermarket), navigate to category page
    // For level 4 categories, navigate to the slug page
    if (category.level === 2) {
      router.push(`/category/${slug}`);
    } else {
      router.push(`/${slug}?categoryLevel=4`);
    }
  }

  // Navigation handlers for swipers
  const handleBestsellersPrev = () => {
    if (bestsellersSwiperRef.current && bestsellersSwiperRef.current.swiper && !bestsellersNav.isBeginning) {
      bestsellersSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleBestsellersNext = () => {
    if (bestsellersSwiperRef.current && bestsellersSwiperRef.current.swiper && !bestsellersNav.isEnd) {
      bestsellersSwiperRef.current.swiper.slideNext()
    }
  }

  const handleOffersPrev = () => {
    if (offersSwiperRef.current && offersSwiperRef.current.swiper && !offersNav.isBeginning) {
      offersSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleOffersNext = () => {
    if (offersSwiperRef.current && offersSwiperRef.current.swiper && !offersNav.isEnd) {
      offersSwiperRef.current.swiper.slideNext()
    }
  }

  const handleNewArrivalsPrev = () => {
    if (newArrivalsSwiperRef.current && newArrivalsSwiperRef.current.swiper && !newArrivalsNav.isBeginning) {
      newArrivalsSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleNewArrivalsNext = () => {
    if (newArrivalsSwiperRef.current && newArrivalsSwiperRef.current.swiper && !newArrivalsNav.isEnd) {
      newArrivalsSwiperRef.current.swiper.slideNext()
    }
  }

  const handleCheapDealsPrev = () => {
    if (cheapDealsSwiperRef.current && cheapDealsSwiperRef.current.swiper) {
      cheapDealsSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleCheapDealsNext = () => {
    if (cheapDealsSwiperRef.current && cheapDealsSwiperRef.current.swiper) {
      cheapDealsSwiperRef.current.swiper.slideNext()
    }
  }

  const handleProductsPrev = () => {
    if (productsSwiperRef.current && productsSwiperRef.current.swiper) {
      productsSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleProductsNext = () => {
    if (productsSwiperRef.current && productsSwiperRef.current.swiper) {
      productsSwiperRef.current.swiper.slideNext()
    }
  }
  const handleOtherCategoriesPrev = () => {
    if (otherCategoriesSwiperRef.current && otherCategoriesSwiperRef.current.swiper && !otherCategoriesNav.isBeginning) {
      otherCategoriesSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleOtherCategoriesNext = () => {
    if (otherCategoriesSwiperRef.current && otherCategoriesSwiperRef.current.swiper && !otherCategoriesNav.isEnd) {
      otherCategoriesSwiperRef.current.swiper.slideNext();
    }
  };

  return (
    <main className="home-page">
      <Navigation />

      {/* Category Banner Section */}
      <section className="section">
        <div className="banner-container">
          <div className="banner-section">
            <div 
              className="banner-content"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.60) 100%), url('${storeBannerImage}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* <button className="banner-back-btn" onClick={handleBack}>
                Back
              </button> */}
              <div className="banner-info">
                <div className="banner-title">
                  {categoryInfo?.name || hypermarketProducts?.store?.name || supermarketProducts?.store?.name || storeProductsByStoreId?.store?.name || storeSlugProducts?.store?.name || slug?.toUpperCase() || 'CATEGORY'}
                </div>
                {/* <div className="banner-desc">
                  {categoryInfo?.description || hypermarketProducts?.store?.description || supermarketProducts?.store?.description || storeProductsByStoreId?.store?.description || storeSlugProducts?.store?.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.'}
                </div> */}
              </div>
              {/* <button className="banner-follow-btn">Follow</button> */}
            </div>
          </div>
        </div>
      </section>

      {/* Other Categories Section */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Other Categories"
            showNavigation={true}
            onPrev={handleOtherCategoriesPrev}
            onNext={handleOtherCategoriesNext}
            prevDisabled={otherCategoriesNav.isBeginning}
            nextDisabled={otherCategoriesNav.isEnd}
          />
           {isLoading ? (
             <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
               {[...Array(6)].map((_, index) => (
                 <CategoryCardSkeleton key={`skeleton-${index}`} />
               ))}
             </div>
           ) : hasError ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
              Error loading {isActuallyStoreSlug ? 'store' : 'categories'}: {hasError}
            </div>
          ) : transformedCategories.length > 0 ? (
            <Swiper
              ref={otherCategoriesSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={isMobile ? 2.08 : 'auto'}
              spaceBetween={isMobile ? 12 : 24}
              grabCursor={true}
              freeMode={true}
              onSlideChange={(swiper) => {
                setOtherCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                // Load more only when category has 50+ children and user slides near end
                const useCategoryChildren = !source || !['hypermarket', 'supermarket', 'store'].includes(source)
                const pagination = categoryChildren?.data?.pagination
                if (useCategoryChildren && categoryChildren?.data?.level4Categories && pagination?.hasNext && !loadingMoreCategories.current && swiper.activeIndex >= 40) {
                  loadingMoreCategories.current = true
                  dispatch(fetchCategoryChildren({ slug, page: (pagination.page ?? 1) + 1, limit: 50 }))
                }
              }}
              onReachEnd={(swiper) => {
                setOtherCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                // Load next page only when category has 50+ children
                const useCategoryChildren = !source || !['hypermarket', 'supermarket', 'store'].includes(source)
                const pagination = categoryChildren?.data?.pagination
                if (useCategoryChildren && categoryChildren?.data?.level4Categories && pagination?.hasNext && !loadingMoreCategories.current) {
                  loadingMoreCategories.current = true
                  dispatch(fetchCategoryChildren({ slug, page: (pagination.page ?? 1) + 1, limit: 50 }))
                }
              }}
              onReachBeginning={(swiper) => {
                setOtherCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setOtherCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              className="other-categories-swiper"
            >
              {transformedCategories.map((category, index) => (
                <SwiperSlide key={category.id || category.slug || category.name || index} style={{ width: 'auto' }}>
                  <CategoryCard {...category} onClick={() => handleCategoryClick(category)} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No categories to Display
            </div>
          )}
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Our Bestsellers"
            showNavigation={true}
            onPrev={handleBestsellersPrev}
            onNext={handleBestsellersNext}
            prevDisabled={bestsellersNav.isBeginning}
            nextDisabled={bestsellersNav.isEnd}
          />
          {isLoading ? (
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[...Array(4)].map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : hasError ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
              Error loading products: {error}
            </div>
          ) : (transformedBestsellers.length > 0 || allStoreProducts.length > 0) ? (
            <Swiper
              ref={bestsellersSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView="auto"
              spaceBetween={24}
              grabCursor={true}
              freeMode={true}
              style={{ width: '1360px' }}
              onSlideChange={(swiper) => {
                setBestsellersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachEnd={(swiper) => {
                setBestsellersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachBeginning={(swiper) => {
                setBestsellersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setBestsellersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
            >
              {(transformedBestsellers.length > 0 ? transformedBestsellers : allStoreProducts.slice(0, 21)).map((product, index) => (
                <SwiperSlide key={product.id || index} style={{ width: 'auto' }}>
                  <ProductCard {...product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No bestsellers available at the moment.
            </div>
          )}
        </div>
      </section>

      {/* Best and Cheap Deals Section */}
      {/* <section className="section">
        <div className="container">
          <SectionHeader
            title="Best and Cheap Deals"
            showNavigation={true}
            onPrev={handleCheapDealsPrev}
            onNext={handleCheapDealsNext}
          />
          {isLoading ? (
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[...Array(4)].map((_, index) => (
                <ProductCardSkeleton key={`skeleton-cheap-${index}`} />
              ))}
            </div>
          ) : hasError ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
              Error loading products: {error}
            </div>
          ) : transformedCheapDeals.length > 0 ? (
            <Swiper
              ref={cheapDealsSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView="auto"
              spaceBetween={24}
              grabCursor={true}
              freeMode={true}
              style={{ width: '1360px' }}
            >
              {transformedCheapDeals.map((product, index) => (
                <SwiperSlide key={product.id || index} style={{ width: 'auto' }}>
                  <ProductCard {...product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No cheap deals available at the moment.
            </div>
          )}
        </div>
      </section> */}

      {/* Offers Section */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Offers For You"
            showNavigation={true}
            onPrev={handleOffersPrev}
            onNext={handleOffersNext}
            prevDisabled={offersNav.isBeginning}
            nextDisabled={offersNav.isEnd}
          />
          {isLoading ? (
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[...Array(4)].map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : hasError ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
              Error loading products: {error}
            </div>
          ) : (transformedOffers.length > 0 || allStoreProducts.length > 0) ? (
            <Swiper
              ref={offersSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView="auto"
              spaceBetween={24}
              grabCursor={true}
              freeMode={true}
              style={{ width: '1360px' }}
              onSlideChange={(swiper) => {
                setOffersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachEnd={(swiper) => {
                setOffersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachBeginning={(swiper) => {
                setOffersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setOffersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
            >
              {(transformedOffers.length > 0 ? transformedOffers : allStoreProducts.slice(21, 42)).map((product, index) => (
                <SwiperSlide key={product.id || index} style={{ width: 'auto' }}>
                  <ProductCard {...product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No offers available at the moment.
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="New Arrivals"
            showNavigation={true}
            onPrev={handleNewArrivalsPrev}
            onNext={handleNewArrivalsNext}
            prevDisabled={newArrivalsNav.isBeginning}
            nextDisabled={newArrivalsNav.isEnd}
          />
          {isLoading ? (
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[...Array(4)].map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : hasError ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
              Error loading products: {hasError}
            </div>
          ) : (transformedNewArrivals.length > 0 || allStoreProducts.length > 0) ? (
            <Swiper
              ref={newArrivalsSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView="auto"
              spaceBetween={24}
              grabCursor={true}
              freeMode={true}
              style={{ width: '1360px' }}
              onSlideChange={(swiper) => {
                setNewArrivalsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachEnd={(swiper) => {
                setNewArrivalsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachBeginning={(swiper) => {
                setNewArrivalsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setNewArrivalsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
            >
              {(transformedNewArrivals.length > 0 ? transformedNewArrivals : allStoreProducts.slice(40, 60)).map((product, index) => (
                <SwiperSlide key={product.id || index} style={{ width: 'auto' }}>
                  <ProductCard {...product} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              No new arrivals available at the moment.
            </div>
          )}
        </div>
      </section>


      <Footer />

      <style jsx>{`
        .banner-container {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 0px 24px;
          box-sizing: border-box;
          position: relative;
        }
        
        .banner-section {
          width: 100%;
          max-width: 1360px;
          height: 324px;
          position: relative;
          border-radius: 24px;
          overflow: hidden;
        }

        .banner-content {
          display: flex;
          width: 100%;
          height: 324px;
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-end;
          border-radius: 24px;
          padding: 0 48px 40px 48px;
          box-sizing: border-box;
          position: relative;
        }
        
        .banner-back-btn {
          background: #fff;
          color: #111;
          font-size: 18px;
          font-weight: 600;
          border: none;
          border-radius: 24px;
          padding: 12px 36px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          transition: background 0.2s;
          position: absolute;
          top: 24px;
          left: 48px;
          z-index: 10;
        }
        
        .banner-back-btn:hover {
          background: #f0f0f0;
        }
        
        .banner-info {
          display: flex;
          flex-direction: column;
          gap: 18px;
          position: relative;
        }
        
        .banner-title {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
        }
        
        .banner-desc {
          font-size: 18px;
          color: #fff;
          font-weight: 500;
          max-width: 600px;
          line-height: 1.5;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
        }
        
        .banner-follow-btn {
          background: #fff;
          color: #111;
          font-size: 18px;
          font-weight: 600;
          border: none;
          border-radius: 24px;
          padding: 12px 36px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          transition: background 0.2s;
        }
        
        .banner-follow-btn:hover {
          background: #f0f0f0;
        }
        
        .swiper-container {
          width: 100%;
          overflow: hidden;
        }
        
        .swiper-slide {
          width: auto !important;
          flex-shrink: 0;
        }
        
        @media (max-width: 900px) {
          .banner-content {
            flex-direction: column;
            align-items: flex-start;
            padding: 44px 24px 24px 24px;
          }
          
          .banner-back-btn {
            left: 24px;
          }
          
          .banner-follow-btn {
            margin-top: 24px;
          }
        }
      `}</style>
    </main>
  )
}
