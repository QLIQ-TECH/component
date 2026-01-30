'use client'

import Navigation from '@/components/Navigation'
import Categories from '@/components/Categories'
import ImageSlider from '@/components/ImageSlider'
import ProductCard from '@/components/ProductCard'
import StoreCard from '@/components/StoreCard'
import SectionHeader from '@/components/SectionHeader'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchGeneralStores, fetchFastestDeliveryStores, fetchBestCheapDeals } from '@/store/slices/storesSlice'
import { fetchProductsByCategory } from '@/store/slices/productsSlice'
import { useRouter } from 'next/navigation'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { StoreCardSkeleton } from '@/components/SkeletonLoader'

const productData = [
  {
    id: "nike-airforce-01",
    title: "Vorem ipsum dolor sit amet, consectetur adipiscing elit.",
    price: "AED 1,600",
    rating: "4.0",
    deliveryTime: "30 Min",
    image: "/iphone.jpg"
  },
  {
    id: "nike-dunk-low",
    title: "Vorem ipsum dolor sit amet, consectetur adipiscing elit.",
    price: "AED 1,600",
    rating: "4.0",
    deliveryTime: "30 Min",
    image: "/iphone.jpg"
  },
  {
    id: "nike-air-max",
    title: "Vorem ipsum dolor sit amet, consectetur adipiscing elit.",
    price: "AED 1,600",
    rating: "4.0",
    deliveryTime: "30 Min",
    image: "/iphone.jpg"
  },
  {
    id: "nike-airforce-01-black",
    title: "Vorem ipsum dolor sit amet, consectetur adipiscing elit.",
    price: "AED 1,600",
    rating: "4.0",
    deliveryTime: "30 Min",
    image: "/iphone.jpg"
  }
]

const StoreCategoryId = '68e775f44f4cbd5c2fa2e9c7';

// Helper function to transform API product data to match ProductCard component format
const transformProductData = (apiProduct) => {
  // Get the primary image or first available image
  const primaryImage = apiProduct.images?.find(img => img.is_primary) || apiProduct.images?.[0];

  // Use placeholder image if no valid image URL
  const imageUrl = primaryImage?.url || '/iphone.jpg';

  // Calculate savings for offer badge
  const savings = apiProduct.is_offer && apiProduct.price && apiProduct.discount_price
    ? apiProduct.price - apiProduct.discount_price
    : 0;

  // Format savings to 2 decimal places
  const formattedSavings = savings > 0 ? savings.toFixed(2) : 0;

  return {
    id: apiProduct._id || apiProduct.slug,
    slug: apiProduct.slug,
    title: apiProduct.title || 'Product Title',
    price: `AED ${apiProduct.discount_price || apiProduct.price || '0'}`,
    rating: apiProduct.average_rating?.toString() || '0',
    deliveryTime: '30 Min', // Default delivery time since it's not in API
    image: imageUrl,
    badge: apiProduct.is_offer && savings > 0 ? `Save AED ${formattedSavings}` : null
  }
}

export default function Home() {
  const [filterOpen, setFilterOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const fastestDeliverySwiperRef = useRef(null)
  const bestCheapDealsSwiperRef = useRef(null)
  const dispatch = useDispatch()
  const { generalStores, fastestDeliveryStores, bestCheapDeals, loading, loadingBestCheapDeals, error } = useSelector(state => state.stores)
  const { categoryProducts = [], categoryProductsLoading } = useSelector(state => state.products)
  const router = useRouter()
  const [userLocation, setUserLocation] = useState(null)
  
  // Navigation State
  const [fastestDeliveryNav, setFastestDeliveryNav] = useState({ isBeginning: true, isEnd: false })
  const [bestCheapDealsNav, setBestCheapDealsNav] = useState({ isBeginning: true, isEnd: false })

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
    dispatch(fetchGeneralStores())
    dispatch(fetchProductsByCategory(StoreCategoryId))
  }, [dispatch])

  // Fetch fastest delivery stores and deals when location is available
  useEffect(() => {
    if (userLocation) {
      dispatch(fetchFastestDeliveryStores({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        storeType: 'stores'
      }))
      dispatch(fetchBestCheapDeals({ storeType: 'stores', page: 1, limit: 20 }))
    }
  }, [userLocation, dispatch])

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
  return (
    <main className="home-page">
      <Navigation />
      {/* <QuickNav /> */}

      <Categories />

      {/* Fastest Delivery Stores */}
      {/* <section className="section">
        <div className="container">
          <SectionHeader
            title="Fastest Delivery"
            showNavigation={true}
            onPrev={handleFastestDeliveryPrev}
            onNext={handleFastestDeliveryNext}
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
              slidesPerView={isMobile ? 1.2 : 'auto'}
              spaceBetween={isMobile ? 16 : 24}
              grabCursor={true}
              freeMode={true}
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
                      router.push(`/${slug}?storeId=${store._id || store.id}`);
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
      </section> */}
      {/* Best & Cheap Deals - Only shows stores with cheap deals from API */}
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
              slidesPerView={isMobile ? 1.2 : 'auto'}
              spaceBetween={isMobile ? 16 : 24}
              grabCursor={true}
              freeMode={true}
              className="bestsellers-swiper"
              onSlideChange={(swiper) => {
                setBestCheapDealsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd })
              }}
              onReachEnd={(swiper) => {
                setBestCheapDealsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd })
              }}
              onReachBeginning={(swiper) => {
                setBestCheapDealsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd })
              }}
              onSwiper={(swiper) => {
                setBestCheapDealsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd })
              }}
            >
              {bestCheapDeals.map((store, index) => {
                // Map store category - check if level1 is stores
                let categoryName = 'Stores';
                if (store.level1) {
                  const level1Name = store.level1?.name || store.level1;
                  if (typeof level1Name === 'string') {
                    categoryName = level1Name.toLowerCase().includes('store') ||
                      level1Name.toLowerCase().includes('stores')
                      ? 'Stores'
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
                        router.push(`/${slug}?storeId=${store._id || store.id}`);
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

      <section className="section">
        <div className="container">
          <SectionHeader
            title="Stores"
            showNavigation={false}
            showButton={false}
            buttonText="See All"
          />
          {error && (
            <div style={{ margin: '16px 0', color: 'red' }}>{error}</div>
          )}
          <div className="stores-grid">
            {(loading && (!generalStores || generalStores.length === 0)) ? (
              productData.map((product, index) => (
                <StoreCard key={`skeleton-${index}`} {...product} />
              ))
            ) : (
              (generalStores || []).map((store, index) => (
                <StoreCard
                  key={store._id || store.id || `store-${index}`}
                  id={store._id || store.id}
                  title={store.name || store.title || 'Store'}
                  category={store.category?.name || store.category || 'General'}
                  rating={store.rating || '4.0'}
                  deliveryTime={store.deliveryTime || '30 Min'}
                  image={store.image || store.logo || '/iphone.jpg'}
                  location={(store.address && store.address.city) || 'Dubai, UAE'}
                  onClick={() => {
                    const slug = store.slug || store.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    router.push(`/${slug}?storeId=${store._id || store.id}`);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
