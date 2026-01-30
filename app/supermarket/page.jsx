'use client'

import Navigation from '@/components/Navigation'
import Categories from '@/components/Categories'
import ImageSlider from '@/components/ImageSlider'
import ProductCard from '@/components/ProductCard'
import SupermarketCard from '@/components/hypermarketcard'
import StoreCard from '@/components/StoreCard'
import SectionHeader from '@/components/SectionHeader'
import Banner from '@/components/Banner'
import CategoryCard from '@/components/CategoryCard'
import InfluencerCard from '@/components/InfluencerCard'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import QuickNav from '@/components/QuickNav'
import FilterDrawer from '@/components/FilterDrawer'
import Image from 'next/image'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSupermarketStores, fetchFastestDeliveryStores, fetchBestCheapDeals, fetchBestBundleDeals } from '@/store/slices/storesSlice'
import { fetchProducts, fetchProductsByCategory } from '@/store/slices/productsSlice'
import { useRouter } from 'next/navigation'
import { buildFacetsFromProducts, applyFiltersToProducts } from '@/utils/facets'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { StoreCardSkeleton, ProductCardSkeleton } from '@/components/SkeletonLoader'

const supermarketCategoryId = '68e775f44f4cbd5c2fa2e9c4';

// Helper function to transform API product data to match ProductCard component format
const transformProductData = (apiProduct) => {
  // Get the primary image or first available image
  const primaryImage = apiProduct.images?.find(img => img.is_primary) || apiProduct.images?.[0];

  // Use placeholder image if no valid image URL
  const imageUrl = primaryImage?.url || 'https://api.builder.io/api/v1/image/assets/TEMP/0ef2d416817956be0fe96760f14cbb67e415a446?width=644';

  // Calculate savings for offer badge
  const savings = apiProduct.is_offer && apiProduct.price && apiProduct.discount_price
    ? apiProduct.price - apiProduct.discount_price
    : 0;

  // Format savings to 2 decimal places
  const formattedSavings = savings > 0 ? savings.toFixed(2) : 0;

  // For cheap deals, show discount percentage if available
  let badge = null;
  if (apiProduct.discount_percentage && apiProduct.discount_percentage > 0) {
    badge = `${Math.round(apiProduct.discount_percentage)}% OFF`;
  } else if (apiProduct.is_offer && savings > 0) {
    badge = `Save AED ${formattedSavings}`;
  }

  return {
    id: apiProduct._id || apiProduct.slug,
    slug: apiProduct.slug,
    title: apiProduct.title || 'Product Title',
    price: `AED ${apiProduct.discount_price || apiProduct.price || '0'}`,
    rating: apiProduct.average_rating?.toString() || '0',
    deliveryTime: '30 Min', // Default delivery time since it's not in API
    image: imageUrl,
    badge: badge
  }
}

export default function Home() {
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState({})
  const [isMobile, setIsMobile] = useState(false)
  const fastestDeliverySwiperRef = useRef(null)
  const bestCheapDealsSwiperRef = useRef(null)
  const bestBundlesSwiperRef = useRef(null)
  const bestCashbackSwiperRef = useRef(null)
  const dispatch = useDispatch()
  const router = useRouter()
  const { supermarketStores, fastestDeliveryStores, bestCheapDeals, bestBundleDeals, loading, loadingBestCheapDeals, loadingBestBundleDeals, error } = useSelector(state => state.stores)
  const [userLocation, setUserLocation] = useState(null)
  const { products, categoryProducts = [], categoryProductsLoading } = useSelector(state => state.products)
  
  // Navigation State
  const [fastestDeliveryNav, setFastestDeliveryNav] = useState({ isBeginning: true, isEnd: false });
  const [bestCheapDealsNav, setBestCheapDealsNav] = useState({ isBeginning: true, isEnd: false });
  const [bestBundlesNav, setBestBundlesNav] = useState({ isBeginning: true, isEnd: false });
  const [bestCashbackNav, setBestCashbackNav] = useState({ isBeginning: true, isEnd: false });

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

  // Get user location
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          },
          (error) => {
            console.error('Error getting location:', error)
            // Default to Dubai Marina if location access denied
            setUserLocation({
              latitude: 25.0772,
              longitude: 55.1398
            })
          }
        )
      } else {
        // Default to Dubai Marina if geolocation not supported
        setUserLocation({
          latitude: 25.0772,
          longitude: 55.1398
        })
      }
    }
    getLocation()
  }, [])

  useEffect(() => {
    dispatch(fetchSupermarketStores())
    dispatch(fetchProducts())
    dispatch(fetchProductsByCategory({ categoryId: supermarketCategoryId, limit: 200 }))
  }, [dispatch])

  // Fetch fastest delivery stores and deals when location is available
  useEffect(() => {
    if (userLocation) {
      dispatch(fetchFastestDeliveryStores({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        storeType: 'supermarket'
      }))
      dispatch(fetchBestCheapDeals({ storeType: 'supermarket', page: 1, limit: 20 }))
      dispatch(fetchBestBundleDeals({ storeType: 'supermarket', page: 1, limit: 20 }))
    }
  }, [userLocation, dispatch])

  // Build facets from products for proper filter display
  const facets = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return []
    }
    return buildFacetsFromProducts(products)
  }, [products])

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return []
    }
    const filtered = applyFiltersToProducts(products, selectedFilters)
    return filtered.length > 0 ? filtered.map(transformProductData) : []
  }, [products, selectedFilters])

  const handleFilterChange = (key, value) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setSelectedFilters({})
  }

  // Transform category products
  const transformedCategoryProducts = useMemo(() => {
    if (!Array.isArray(categoryProducts) || categoryProducts.length === 0) {
      return []
    }
    return categoryProducts.map(transformProductData)
  }, [categoryProducts])

  // Navigation handlers
  const handleFastestDeliveryPrev = () => {
    if (fastestDeliverySwiperRef.current?.swiper && !fastestDeliveryNav.isBeginning) {
      fastestDeliverySwiperRef.current.swiper.slidePrev()
    }
  }

  const handleFastestDeliveryNext = () => {
    if (fastestDeliverySwiperRef.current?.swiper && !fastestDeliveryNav.isEnd) {
      fastestDeliverySwiperRef.current.swiper.slideNext()
    }
  }

  const handleBestCheapDealsPrev = () => {
    if (bestCheapDealsSwiperRef.current?.swiper && !bestCheapDealsNav.isBeginning) {
      bestCheapDealsSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleBestCheapDealsNext = () => {
    if (bestCheapDealsSwiperRef.current?.swiper && !bestCheapDealsNav.isEnd) {
      bestCheapDealsSwiperRef.current.swiper.slideNext()
    }
  }

  const handleBestBundlesPrev = () => {
    if (bestBundlesSwiperRef.current?.swiper && !bestBundlesNav.isBeginning) {
      bestBundlesSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleBestBundlesNext = () => {
    if (bestBundlesSwiperRef.current?.swiper && !bestBundlesNav.isEnd) {
      bestBundlesSwiperRef.current.swiper.slideNext()
    }
  }

  const handleBestCashbackPrev = () => {
    if (bestCashbackSwiperRef.current?.swiper) {
      bestCashbackSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleBestCashbackNext = () => {
    if (bestCashbackSwiperRef.current?.swiper) {
      bestCashbackSwiperRef.current.swiper.slideNext()
    }
  }


  return (
    <main className="home-page">
      <Navigation />
      {/* <QuickNav /> */}

      <SupermarketCard />
      {/* Fastest Delivery Stores */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Fastest Delivery"
            showNavigation={true}
            onPrev={handleFastestDeliveryPrev}
            onNext={handleFastestDeliveryNext}
            prevDisabled={fastestDeliveryNav.isBeginning}
            nextDisabled={fastestDeliveryNav.isEnd}
          />
          {loading ? (
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[...Array(4)].map((_, index) => (
                <StoreCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : (fastestDeliveryStores && fastestDeliveryStores.length > 0) ? (
            <Swiper
              ref={fastestDeliverySwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={'auto'}
              spaceBetween={24}
              breakpoints={{
                320: { slidesPerView: 1.2, spaceBetween: 16 },
                640: { slidesPerView: 2.2, spaceBetween: 20 },
                1024: { slidesPerView: 'auto', spaceBetween: 24 }
              }}
              grabCursor={true}
              freeMode={true}
              onSlideChange={(swiper) => {
                setFastestDeliveryNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachEnd={(swiper) => {
                setFastestDeliveryNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachBeginning={(swiper) => {
                setFastestDeliveryNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setFastestDeliveryNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              className="bestsellers-swiper"
            >
              {fastestDeliveryStores.map((store, index) => (
                <SwiperSlide key={store._id || store.id || `store-${index}`} className="bestseller-slide">
                  <StoreCard
                    id={store._id || store.id}
                    title={store.name || 'Store'}
                    category={store.category?.name || store.category || store.level1?.name || 'General'}
                    rating={store.rating || '4.0'}
                    deliveryTime={store.deliveryTime || '30 Min'}
                    image={store.banner || store.logo || '/iphone.jpg'}
                    logo={store.logo}
                    location={(store.address && store.address.city) || (store.latitude && store.longitude ? 'Dubai, UAE' : 'Dubai, UAE')}
                    onClick={() => {
                      const slug = store.slug || (store.name ? store.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'store');
                      router.push(`/category/${slug}?source=supermarket`);
                    }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>No stores found</p>
            </div>
          )}
        </div>
      </section>
      {/* Best & Cheap Deals - Only shows supermarket stores with cheap deals from API */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Best & Cheap Deals"
            showNavigation={true}
            onPrev={handleBestCheapDealsPrev}
            onNext={handleBestCheapDealsNext}
            prevDisabled={bestCheapDealsNav.isBeginning}
            nextDisabled={bestCheapDealsNav.isEnd}
          />
          {loadingBestCheapDeals ? (
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[...Array(4)].map((_, index) => (
                <StoreCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : (bestCheapDeals && bestCheapDeals.length > 0) ? (
            <Swiper
              ref={bestCheapDealsSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={'auto'}
              spaceBetween={24}
              breakpoints={{
                320: { slidesPerView: 1.2, spaceBetween: 16 },
                640: { slidesPerView: 2.2, spaceBetween: 20 },
                1024: { slidesPerView: 'auto', spaceBetween: 24 }
              }}
              grabCursor={true}
              freeMode={true}
              onSlideChange={(swiper) => {
                setBestCheapDealsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachEnd={(swiper) => {
                setBestCheapDealsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachBeginning={(swiper) => {
                setBestCheapDealsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setBestCheapDealsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              className="bestsellers-swiper"
            >
              {bestCheapDeals.map((store, index) => {
                // Map supermarket category - check if level1 is supermarket
                let categoryName = 'Supermarket';
                if (store.level1) {
                  const level1Name = store.level1?.name || store.level1;
                  if (typeof level1Name === 'string') {
                    categoryName = level1Name.toLowerCase().includes('supermarket') ||
                      level1Name.toLowerCase().includes('super')
                      ? 'Supermarket'
                      : level1Name;
                  }
                } else if (store.category) {
                  categoryName = store.category?.name || store.category;
                }

                return (
                  <SwiperSlide key={store._id || store.id || `store-${index}`} className="bestseller-slide">
                    <StoreCard
                      id={store._id || store.id}
                      title={store.name || 'Store'}
                      category={categoryName}
                      rating={store.rating || '4.0'}
                      deliveryTime={store.deliveryTime || '30 Min'}
                      image={store.banner || store.logo || '/iphone.jpg'}
                      logo={store.logo}
                      location={(store.address && store.address.city) || (store.latitude && store.longitude ? 'Dubai, UAE' : 'Dubai, UAE')}
                      onClick={() => {
                        const slug = store.slug || (store.name ? store.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'store');
                        router.push(`/category/${slug}?source=supermarket`);
                      }}
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>No stores with cheap deals found</p>
            </div>
          )}
        </div>
      </section>
      {/* Best Bundles Deals */}
      <section className="section">
        <div className="container">
          <SectionHeader
            title="Best Bundles Deals"
            showNavigation={true}
            onPrev={handleBestBundlesPrev}
            onNext={handleBestBundlesNext}
            prevDisabled={bestBundlesNav.isBeginning}
            nextDisabled={bestBundlesNav.isEnd}
          />
          {loadingBestBundleDeals ? (
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[...Array(4)].map((_, index) => (
                <StoreCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : (bestBundleDeals && bestBundleDeals.length > 0) ? (
            <Swiper
              ref={bestBundlesSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={'auto'}
              spaceBetween={24}
              breakpoints={{
                320: { slidesPerView: 1.2, spaceBetween: 16 },
                640: { slidesPerView: 2.2, spaceBetween: 20 },
                1024: { slidesPerView: 'auto', spaceBetween: 24 }
              }}
              grabCursor={true}
              freeMode={true}
              onSlideChange={(swiper) => {
                setBestBundlesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachEnd={(swiper) => {
                setBestBundlesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachBeginning={(swiper) => {
                setBestBundlesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setBestBundlesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              className="bestsellers-swiper"
            >
              {bestBundleDeals.map((store, index) => {
                // Map supermarket category - check if level1 is supermarket
                let categoryName = 'Supermarket';
                if (store.level1) {
                  const level1Name = store.level1?.name || store.level1;
                  if (typeof level1Name === 'string') {
                    categoryName = level1Name.toLowerCase().includes('supermarket') ||
                      level1Name.toLowerCase().includes('super')
                      ? 'Supermarket'
                      : level1Name;
                  }
                } else if (store.category) {
                  categoryName = store.category?.name || store.category;
                }

                return (
                  <SwiperSlide key={store._id || store.id || `store-${index}`} className="bestseller-slide">
                    <StoreCard
                      id={store._id || store.id}
                      title={store.name || 'Store'}
                      category={categoryName}
                      rating={store.rating || '4.0'}
                      deliveryTime={store.deliveryTime || '30 Min'}
                      image={store.banner || store.logo || '/iphone.jpg'}
                      logo={store.logo}
                      location={(store.address && store.address.city) || (store.latitude && store.longitude ? 'Dubai, UAE' : 'Dubai, UAE')}
                      onClick={() => {
                        const slug = store.slug || (store.name ? store.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'store');
                        router.push(`/category/${slug}?source=supermarket`);
                      }}
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>No stores with bundle deals found</p>
            </div>
          )}
        </div>
      </section>
      {/* Best Cashback - Show products with special deals for Qliq Plus */}
      {/* <section className="section">
        <div className="container">
          <SectionHeader
            title="Best Cashback"
            showNavigation={true}
            onPrev={handleBestCashbackPrev}
            onNext={handleBestCashbackNext}
          />
          {categoryProductsLoading ? (
            <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {[...Array(4)].map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : (categoryProducts && categoryProducts.length > 0) ? (
            <Swiper
              ref={bestCashbackSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={isMobile ? 1.2 : 'auto'}
              spaceBetween={isMobile ? 16 : 24}
              grabCursor={true}
              freeMode={true}
              className="bestsellers-swiper"
            >
              {categoryProducts
                .filter(product => product.special_deals_for_qliq_plus || product.is_offer)
                .slice(0, 20)
                .map((product, index) => {
                  const transformed = transformProductData(product);
                  return (
                    <SwiperSlide key={product._id || product.id || `cashback-${index}`} className="bestseller-slide">
                      <ProductCard
                        {...transformed}
                        badge={product.special_deals_for_qliq_plus ? 'Qliq Plus Deal' : transformed.badge}
                      />
                    </SwiperSlide>
                  );
                })}
            </Swiper>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>No products found</p>
            </div>
          )}
        </div>
      </section> */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        facets={facets}
        selected={selectedFilters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />
      <Footer />
    </main>
  )
}