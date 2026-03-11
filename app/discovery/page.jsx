'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import SectionHeader from '@/components/SectionHeader'
import StoreCard from '@/components/StoreCard'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

// Helper function to transform API store data to match StoreCard component format
const transformStoreData = (apiStore) => {
  return {
    id: apiStore._id,
    name: apiStore.name || 'Store Name',
    slug: apiStore.slug || apiStore.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    description: apiStore.description,
    image: apiStore.logo || 'https://api.builder.io/api/v1/image/assets/TEMP/12ba4121022e746495773eb8df2e6b4add90148f?width=412',
    isTopStore: apiStore.isTopStore,
    email: apiStore.email,
    phone: apiStore.phone,
    address: apiStore.address,
    isActive: apiStore.isActive
  }
}

export default function DiscoveryPage() {
  const router = useRouter()
  const [newStores, setNewStores] = useState([])
  const [topStores, setTopStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const newStoresSwiperRef = useRef(null)
  const topStoresSwiperRef = useRef(null)

  // Swiper navigation states
  const [newStoresNav, setNewStoresNav] = useState({ isBeginning: true, isEnd: false })

  // Fetch discovery page data
  useEffect(() => {
    const fetchDiscoveryData = async () => {
      try {
        setLoading(true)
        const response = await fetch('http://localhost:8082/api/stores/discovery')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success && data.data) {
          setNewStores(data.data.newStores || [])
          setTopStores(data.data.topStores || [])
        } else {
          throw new Error(data.message || 'Failed to fetch discovery data')
        }
      } catch (error) {
        console.error('Error fetching discovery data:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDiscoveryData()
  }, [])

  // Transform API data
  const transformedNewStores = newStores.map(transformStoreData)
  const transformedTopStores = topStores.map(transformStoreData)

  const handleStoreClick = (store) => {
    const slug = store.slug || store.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    router.push(`/${slug}?storeId=${store.id}`)
  }

  const handleNewStoresPrev = () => {
    if (newStoresSwiperRef.current && newStoresSwiperRef.current.swiper && !newStoresNav.isBeginning) {
      newStoresSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleNewStoresNext = () => {
    if (newStoresSwiperRef.current && newStoresSwiperRef.current.swiper && !newStoresNav.isEnd) {
      newStoresSwiperRef.current.swiper.slideNext()
    }
  }

  const handleTopStoresPrev = () => {
    if (topStoresSwiperRef.current && topStoresSwiperRef.current.swiper) {
      topStoresSwiperRef.current.swiper.slidePrev()
    }
  }

  const handleTopStoresNext = () => {
    if (topStoresSwiperRef.current && topStoresSwiperRef.current.swiper) {
      topStoresSwiperRef.current.swiper.slideNext()
    }
  }

  const handleSeeAllNewStores = () => {
    router.push('/stores?filter=new')
  }

  const handleSeeAllTopStores = () => {
    router.push('/stores?filter=top')
  }

  return (
    <>
      <Navigation />
      <main className="discovery-page">
        <div className="container" style={{ paddingTop: '100px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '16px' }}>
              Discover Amazing Stores
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Explore the latest additions and top-rated stores in our marketplace
            </p>
          </div>

          {/* New Stores Section */}
          <section className="section">
            <div className="container">
              <SectionHeader
                title="New Stores"
                showNavigation={true}
                showButton={true}
                buttonText="See All"
                onButtonClick={handleSeeAllNewStores}
                onPrev={handleNewStoresPrev}
                onNext={handleNewStoresNext}
                prevDisabled={newStoresNav.isBeginning || transformedNewStores.length === 0}
                nextDisabled={newStoresNav.isEnd || transformedNewStores.length === 0}
              />
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  Loading new stores...
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                  Error loading stores: {error}
                </div>
              ) : (
                <Swiper
                  ref={newStoresSwiperRef}
                  modules={[SwiperNavigation]}
                  slidesPerView="auto"
                  spaceBetween={24}
                  grabCursor={true}
                  freeMode={true}
                  onSlideChange={(swiper) => {
                    setNewStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                  }}
                  onSwiper={(swiper) => {
                    setNewStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                  }}
                  style={{ width: '1360px' }}
                >
                  {transformedNewStores.map((store, index) => (
                    <SwiperSlide key={store.id || index} style={{ width: 'auto' }}>
                      <StoreCard {...store} onClick={() => handleStoreClick(store)} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </section>

          {/* Top Stores Section */}
          <section className="section">
            <div className="container">
              <SectionHeader
                title="Top Stores"
                showNavigation={true}
                showButton={true}
                buttonText="See All"
                onButtonClick={handleSeeAllTopStores}
                onPrev={handleTopStoresPrev}
                onNext={handleTopStoresNext}
              />
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  Loading top stores...
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                  Error loading stores: {error}
                </div>
              ) : (
                <Swiper
                  ref={topStoresSwiperRef}
                  modules={[SwiperNavigation]}
                  slidesPerView="auto"
                  spaceBetween={24}
                  grabCursor={true}
                  freeMode={true}
                  style={{ width: '1360px' }}
                >
                  {transformedTopStores.map((store, index) => (
                    <SwiperSlide key={store.id || index} style={{ width: 'auto' }}>
                      <StoreCard {...store} onClick={() => handleStoreClick(store)} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
