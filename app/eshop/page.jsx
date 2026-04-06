'use client'

import Navigation from '@/components/Navigation'
import Categories from '@/components/Categories'
import ImageSlider from '@/components/ImageSlider'
import ProductCard from '@/components/ProductCard'
import SectionHeader from '@/components/SectionHeader'
import Banner from '@/components/Banner'
import CategoryCard from '@/components/CategoryCard'
import InfluencerCard from '@/components/InfluencerCard'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import QuickNav from '@/components/QuickNav'
import StoreCard from '@/components/StoreCard'
import FilterDrawer from '@/components/FilterDrawer'
import Image from 'next/image'
import { useRef, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts } from '@/store/slices/productsSlice'
import { fetchBrands } from '@/store/slices/brandsSlice'
import { fetchEshopStores } from '@/store/slices/storesSlice'
import { fetchEcommerceCategories, fetchEcommerceLevel3Categories } from '@/store/slices/categoriesSlice'
import { buildFacetsFromProducts, applyFiltersToProducts } from '@/utils/facets'

// Helper function to transform API product data to match ProductCard component format
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

  return {
    id: apiProduct._id || apiProduct.slug,
    title: apiProduct.title || 'Product Title',
    price: `AED ${effectivePrice ?? '0'}`,
    rating: apiProduct.average_rating?.toString() || '0',
    deliveryTime: '30 Min', // Default delivery time since it's not in API
    image: imageUrl,
    badge: apiProduct.is_offer && savings > 0 ? `Save AED ${savings}` : null,
    priceWithVat: priceWithVat != null ? Number(priceWithVat) : undefined,
    discountPriceWithVat: discountPriceWithVat != null && Number(discountPriceWithVat) > 0 ? Number(discountPriceWithVat) : undefined
  }
}

// Helper function to transform API brand data to match CategoryCard component format
const transformBrandData = (apiBrand) => {
  return {
    name: apiBrand.name || 'Brand Name',
    image: apiBrand.logo || 'https://api.builder.io/api/v1/image/assets/TEMP/12ba4121022e746495773eb8df2e6b4add90148f?width=412',
    slug: apiBrand.slug || apiBrand.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }
}

// Helper function to transform API category data to match CategoryCard component format
const transformCategoryData = (apiCategory) => {
  // Use icon from API if available, otherwise use default placeholder
  const imageUrl = apiCategory.icon || 'https://api.builder.io/api/v1/image/assets/TEMP/12ba4121022e746495773eb8df2e6b4add90148f?width=412';

  return {
    id: apiCategory._id,
    name: apiCategory.name || 'Category Name',
    slug: apiCategory.slug,
    image: imageUrl
  }
}

// Helper function to transform API store data to match CategoryCard component format
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


export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { products, bestsellers, offers, qliqPlusDeals, featured, loading, error } = useSelector(state => state.products);
  const { brands, loading: brandsLoading, error: brandsError } = useSelector(state => state.brands);
  const { eshopStores, eshopNewStores, eshopTopStores, loading: storesLoading, error: storesError } = useSelector(state => state.stores);
  const { ecommerceCategories, ecommerceLevel3Categories, loading: categoriesLoading, error: categoriesError } = useSelector(state => state.categories);

  const swiperRef = useRef(null);
  const topStoresSwiperRef = useRef(null);
  const topBrandsSwiperRef = useRef(null);
  const bestsellersSwiperRef = useRef(null);
  const offersSwiperRef = useRef(null);
  const specialDealsSwiperRef = useRef(null);
  const featuredOffersSwiperRef = useRef(null);
  const categoriesSwiperRef = useRef(null);
  const level3CategoriesSwiperRef = useRef(null);
  const [activeStoreFilter, setActiveStoreFilter] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Swiper navigation states
  const [bestsellersNav, setBestsellersNav] = useState({ isBeginning: true, isEnd: false });
  const [offersNav, setOffersNav] = useState({ isBeginning: true, isEnd: false });
  const [specialDealsNav, setSpecialDealsNav] = useState({ isBeginning: true, isEnd: false });
  const [featuredOffersNav, setFeaturedOffersNav] = useState({ isBeginning: true, isEnd: false });
  const [categoriesNav, setCategoriesNav] = useState({ isBeginning: true, isEnd: false });
  const [level3CategoriesNav, setLevel3CategoriesNav] = useState({ isBeginning: true, isEnd: false });
  const [topStoresNav, setTopStoresNav] = useState({ isBeginning: true, isEnd: false });
  const [topBrandsNav, setTopBrandsNav] = useState({ isBeginning: true, isEnd: false });

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
    return filtered.map(transformProductData)
  }, [products, selectedFilters])

  const handleFilterChange = (key, value) => {
    setSelectedFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setSelectedFilters({})
  }

  // Fetch products, brands, e-shop stores, and categories on component mount
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchBrands());
    dispatch(fetchEshopStores());
    dispatch(fetchEcommerceCategories());
    dispatch(fetchEcommerceLevel3Categories());
  }, [dispatch]);

  // Transform API data for different sections
  const transformedProducts = products.map(transformProductData);
  const transformedBestsellers = bestsellers.map(transformProductData);
  const transformedOffers = offers.map(transformProductData);
  const transformedSpecialDeals = qliqPlusDeals.map(transformProductData);
  const transformedFeaturedOffers = featured.map(transformProductData);
  const transformedBrands = brands.map(transformBrandData);
  const transformedTopStores = eshopTopStores.map(transformStoreData);
  const transformedNewStores = eshopNewStores.map(transformStoreData);
  const transformedCategories = ecommerceCategories.map(transformCategoryData);
  const transformedLevel3Categories = ecommerceLevel3Categories.map(transformCategoryData);

  // Use filtered products for bestsellers section if filters are applied
  const displayBestsellers = Object.keys(selectedFilters).length > 0 ? filteredProducts : transformedBestsellers;

  const handlePrev = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const handleNext = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };

  const handleTopStoresPrev = () => {
    if (topStoresSwiperRef.current && topStoresSwiperRef.current.swiper && !topStoresNav.isBeginning) {
      topStoresSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleTopStoresNext = () => {
    if (topStoresSwiperRef.current && topStoresSwiperRef.current.swiper && !topStoresNav.isEnd) {
      topStoresSwiperRef.current.swiper.slideNext();
    }
  };

  const handleTopBrandsPrev = () => {
    if (topBrandsSwiperRef.current && topBrandsSwiperRef.current.swiper && !topBrandsNav.isBeginning) {
      topBrandsSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleTopBrandsNext = () => {
    if (topBrandsSwiperRef.current && topBrandsSwiperRef.current.swiper && !topBrandsNav.isEnd) {
      topBrandsSwiperRef.current.swiper.slideNext();
    }
  };

  const handleBestsellersPrev = () => {
    if (bestsellersSwiperRef.current && bestsellersSwiperRef.current.swiper && !bestsellersNav.isBeginning) {
      bestsellersSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleBestsellersNext = () => {
    if (bestsellersSwiperRef.current && bestsellersSwiperRef.current.swiper && !bestsellersNav.isEnd) {
      bestsellersSwiperRef.current.swiper.slideNext();
    }
  };

  const handleOffersPrev = () => {
    if (offersSwiperRef.current && offersSwiperRef.current.swiper && !offersNav.isBeginning) {
      offersSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleOffersNext = () => {
    if (offersSwiperRef.current && offersSwiperRef.current.swiper && !offersNav.isEnd) {
      offersSwiperRef.current.swiper.slideNext();
    }
  };

  const handleSpecialDealsPrev = () => {
    if (specialDealsSwiperRef.current && specialDealsSwiperRef.current.swiper && !specialDealsNav.isBeginning) {
      specialDealsSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleSpecialDealsNext = () => {
    if (specialDealsSwiperRef.current && specialDealsSwiperRef.current.swiper && !specialDealsNav.isEnd) {
      specialDealsSwiperRef.current.swiper.slideNext();
    }
  };

  const handleFeaturedOffersPrev = () => {
    if (featuredOffersSwiperRef.current && featuredOffersSwiperRef.current.swiper && !featuredOffersNav.isBeginning) {
      featuredOffersSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleFeaturedOffersNext = () => {
    if (featuredOffersSwiperRef.current && featuredOffersSwiperRef.current.swiper && !featuredOffersNav.isEnd) {
      featuredOffersSwiperRef.current.swiper.slideNext();
    }
  };

  const handleCategoriesPrev = () => {
    if (categoriesSwiperRef.current && categoriesSwiperRef.current.swiper && !categoriesNav.isBeginning) {
      categoriesSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleCategoriesNext = () => {
    if (categoriesSwiperRef.current && categoriesSwiperRef.current.swiper && !categoriesNav.isEnd) {
      categoriesSwiperRef.current.swiper.slideNext();
    }
  };

  const handleLevel3CategoriesPrev = () => {
    if (level3CategoriesSwiperRef.current && level3CategoriesSwiperRef.current.swiper && !level3CategoriesNav.isBeginning) {
      level3CategoriesSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleLevel3CategoriesNext = () => {
    if (level3CategoriesSwiperRef.current && level3CategoriesSwiperRef.current.swiper && !level3CategoriesNav.isEnd) {
      level3CategoriesSwiperRef.current.swiper.slideNext();
    }
  };

  const handleStoreFilter = (filter) => {
    setActiveStoreFilter(filter);
  };

  const handleSeeAllStores = () => {
    router.push('/store');
  };

  const handleSeeAllFeaturedOffers = () => {
    router.push('/ecommerce');
  };

  const handleCategoryClick = (category) => {
    // Use the slug from the API data or create a slug from the name
    const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/category/${slug}`);
  };

  const handleBrandClick = (brand) => {
    // Use the slug from the API data or create a slug from the name
    const slug = brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/${slug}`);
  };

  const handleStoreClick = (store) => {
    // Use the slug from the API data or create a slug from the name
    const slug = store.slug || store.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    router.push(`/${slug}?storeId=${store.id}`);
  };

  const getFilteredStores = () => {
    switch (activeStoreFilter) {
      case 'top':
        return transformedTopStores;
      case 'new':
        return transformedNewStores;
      default:
        return eshopStores.map(transformStoreData);
    }
  };

  return (
    <>
      <Navigation />
      <main className="home-page">
        {/* <QuickNav /> */}

        <Categories />

        <section className="section">
          <div className="container">
            <ImageSlider />
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
              prevDisabled={bestsellersNav.isBeginning || displayBestsellers.length === 0}
              nextDisabled={bestsellersNav.isEnd || displayBestsellers.length === 0}
            />
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Loading products...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading products: {error}
              </div>
            ) : (
              <Swiper
                ref={bestsellersSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={'auto'}
                spaceBetween={24}
                breakpoints={{
                  320: { slidesPerView: 1.15, spaceBetween: 12 },
                  640: { slidesPerView: 2.6, spaceBetween: 10 },
                  820: { slidesPerView: 2.8, spaceBetween: 16 },
                  1024: { slidesPerView: '3.6', spaceBetween: 24 },
                }}
                grabCursor={true}
                freeMode={true}
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
                className="bestsellers-swiper"
              >
                {displayBestsellers.map((product, index) => (
                  <SwiperSlide key={product.id || index} className="bestseller-slide">
                    <ProductCard {...product} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>

        {/* Other Categories Section */}
        <section className="section">
          <div className="container">
            <SectionHeader
              title="Other Categories"
              showNavigation={true}
              onPrev={handleCategoriesPrev}
              onNext={handleCategoriesNext}
              prevDisabled={categoriesNav.isBeginning || transformedCategories.length === 0}
              nextDisabled={categoriesNav.isEnd || transformedCategories.length === 0}
            />
            {categoriesLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Loading categories...
              </div>
            ) : categoriesError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading categories: {categoriesError}
              </div>
            ) : (
              <Swiper
                ref={categoriesSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={'auto'}
                spaceBetween={24}
                breakpoints={{
                  320: { slidesPerView: 2.30, spaceBetween: 12 },
                  640: { slidesPerView: 3, spaceBetween: 10 },
                  820: { slidesPerView: 3.2, spaceBetween: 16 },
                  1024: { slidesPerView: 4.2, spaceBetween: 24 },
                  1360: { slidesPerView: 5.4, spaceBetween: 24 },
                  1440: { slidesPerView: 6, spaceBetween: 24 },
                }}
                grabCursor={true}
                freeMode={true}
                onSlideChange={(swiper) => {
                  setCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachEnd={(swiper) => {
                  setCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachBeginning={(swiper) => {
                  setCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onSwiper={(swiper) => {
                  setCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                className="other-categories-swiper"
              >
                {transformedCategories.map((category, index) => (
                  <SwiperSlide key={category.id || index} style={{ width: 'auto' }}>
                    <CategoryCard {...category} onClick={() => handleCategoryClick(category)} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>

        {/* Offers Section */}
        <section className="section">
          <div className="container">
            <SectionHeader
              title="Offers For You"
              showNavigation={true}
              onPrev={handleOffersPrev}
              onNext={handleOffersNext}
              prevDisabled={offersNav.isBeginning || transformedOffers.length === 0}
              nextDisabled={offersNav.isEnd || transformedOffers.length === 0}
            />
            <Swiper
              ref={offersSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={'auto'}
              spaceBetween={24}
              breakpoints={{
                320: { slidesPerView: 1.15, spaceBetween: 12 },
                640: { slidesPerView: 2.6, spaceBetween: 10 },
                820: { slidesPerView: 2.8, spaceBetween: 16 },
                1024: { slidesPerView: '3.6', spaceBetween: 24 },
              }}
              grabCursor={true}
              freeMode={true}
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
              className="bestsellers-swiper"
            >
              {transformedOffers.map((product, index) => (
                <SwiperSlide key={product.id || index} className="bestseller-slide">
                  <ProductCard {...product} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* Special Deals Section */}
        {/* <section className="section">
          <div className="container">
            <SectionHeader
              title="Special Deals For QLIQ+"
              showNavigation={true}
              showButton={true}
              buttonText="Upgrade"
              onPrev={handleSpecialDealsPrev}
              onNext={handleSpecialDealsNext}
            />
            <Swiper
              ref={specialDealsSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={isMobile ? 1.2 : 'auto'}
              spaceBetween={isMobile ? 16 : 24}
              grabCursor={true}
              freeMode={true}
              className="bestsellers-swiper"
            >
              {transformedSpecialDeals.map((product, index) => (
                <SwiperSlide key={product.id || index} className="bestseller-slide">
                  <ProductCard {...product} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section> */}

        {/* Top Brands Section */}
        <section className="section">
          <div className="container">
            <SectionHeader
              title="Top Brands"
              showNavigation={true}
              onPrev={handleTopBrandsPrev}
              onNext={handleTopBrandsNext}
              prevDisabled={topBrandsNav.isBeginning || transformedBrands.length === 0}
              nextDisabled={topBrandsNav.isEnd || transformedBrands.length === 0}
            />
            {brandsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Loading brands...
              </div>
            ) : brandsError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading brands: {brandsError}
              </div>
            ) : (
              <Swiper
                ref={topBrandsSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={'auto'}
                spaceBetween={24}
                breakpoints={{
                  320: { slidesPerView: 2.30, spaceBetween: 12 },
                  640: { slidesPerView: 3, spaceBetween: 10 },
                  820: { slidesPerView: 3.2, spaceBetween: 16 },
                  1024: { slidesPerView: 4.2, spaceBetween: 24 },
                  1360: { slidesPerView: 5.4, spaceBetween: 24 },
                  1440: { slidesPerView: 6, spaceBetween: 24 },
                }}
                grabCursor={true}
                freeMode={true}
                onSlideChange={(swiper) => {
                  setTopBrandsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachEnd={(swiper) => {
                  setTopBrandsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachBeginning={(swiper) => {
                  setTopBrandsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onSwiper={(swiper) => {
                  setTopBrandsNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                className="other-categories-swiper"
              >
                {transformedBrands.map((brand, index) => (
                  <SwiperSlide key={brand.name || index} style={{ width: 'auto' }}>
                    <CategoryCard {...brand} onClick={() => handleBrandClick(brand)} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>

        {/* Featured Offers Section */}
        <section className="section">
          <div className="container">
            <SectionHeader
              title="Featured Offers"
              showNavigation={true}
              showButton={false}
              onPrev={handleFeaturedOffersPrev}
              onNext={handleFeaturedOffersNext}
              prevDisabled={featuredOffersNav.isBeginning || transformedFeaturedOffers.length === 0}
              nextDisabled={featuredOffersNav.isEnd || transformedFeaturedOffers.length === 0}
            />
            <Swiper
              ref={featuredOffersSwiperRef}
              modules={[SwiperNavigation]}
              slidesPerView={'auto'}
              spaceBetween={24}
              breakpoints={{
                320: { slidesPerView: 1.15, spaceBetween: 12 },
                640: { slidesPerView: 2.6, spaceBetween: 10 },
                820: { slidesPerView: 2.8, spaceBetween: 16 },
                1024: { slidesPerView: '3.6', spaceBetween: 24 },
              }}
              grabCursor={true}
              freeMode={true}
              onSlideChange={(swiper) => {
                setFeaturedOffersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachEnd={(swiper) => {
                setFeaturedOffersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onReachBeginning={(swiper) => {
                setFeaturedOffersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              onSwiper={(swiper) => {
                setFeaturedOffersNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
              }}
              className="bestsellers-swiper"
            >
              {transformedFeaturedOffers.map((product, index) => (
                <SwiperSlide key={product.id || index} className="bestseller-slide">
                  <ProductCard {...product} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* Top Stores Section */}
        {/* <section className="section">
          <div className="container">
            <SectionHeader
              title="Top Stores"
              showNavigation={true}
              showButton={false}
              onPrev={handleTopStoresPrev}
              onNext={handleTopStoresNext}
            />
            {storesLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Loading stores...
              </div>
            ) : storesError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading stores: {storesError}
              </div>
            ) : (
              <Swiper
                ref={topStoresSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={isMobile ? 2.08 : 'auto'}
                spaceBetween={isMobile ? 12 : 24}
                grabCursor={true}
                freeMode={true}
                className="other-categories-swiper"
              >
                {transformedTopStores.map((store, index) => (
                  <SwiperSlide key={store.name || index} style={{ width: 'auto' }}>
                    <CategoryCard name={store.name} image={store.image} onClick={() => handleStoreClick(store)} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section> */}

        {/* Level 3 Categories Section */}
        <section className="section">
          <div className="container">
            <SectionHeader
              title="Popular Categories"
              showNavigation={true}
              onPrev={handleLevel3CategoriesPrev}
              onNext={handleLevel3CategoriesNext}
              prevDisabled={level3CategoriesNav.isBeginning || transformedLevel3Categories.length === 0}
              nextDisabled={level3CategoriesNav.isEnd || transformedLevel3Categories.length === 0}
            />
            {categoriesLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Loading categories...
              </div>
            ) : categoriesError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading categories: {categoriesError}
              </div>
            ) : (
              <Swiper
                ref={level3CategoriesSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={'auto'}
                spaceBetween={24}
                breakpoints={{
                  320: { slidesPerView: 2.30, spaceBetween: 12 },
                  640: { slidesPerView: 3, spaceBetween: 10 },
                  820: { slidesPerView: 3.2, spaceBetween: 16 },
                  1024: { slidesPerView: 4.2, spaceBetween: 24 },
                  1360: { slidesPerView: 5.4, spaceBetween: 24 },
                  1440: { slidesPerView: 6, spaceBetween: 24 },
                }}
                grabCursor={true}
                freeMode={true}
                onSlideChange={(swiper) => {
                  setLevel3CategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachEnd={(swiper) => {
                  setLevel3CategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachBeginning={(swiper) => {
                  setLevel3CategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onSwiper={(swiper) => {
                  setLevel3CategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                className="other-categories-swiper"
              >
                {transformedLevel3Categories.map((category, index) => (
                  <SwiperSlide key={category.id || index} style={{ width: 'auto' }}>
                    <CategoryCard {...category} onClick={() => handleCategoryClick(category)} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section>


        {/* New Stores Section */}
        {/* <section className="section">
          <div className="container">
            <SectionHeader
              title="New Stores on QLIQ"
              showNavigation={true}
              onPrev={handlePrev}
              onNext={handleNext}
            />
            {storesLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Loading stores...
              </div>
            ) : storesError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading stores: {storesError}
              </div>
            ) : (
              <Swiper
                ref={swiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={isMobile ? 2.08 : 'auto'}
                spaceBetween={isMobile ? 12 : 24}
                grabCursor={true}
                freeMode={true}
                className="other-categories-swiper"
              >
                {transformedNewStores.reverse().map((store, index) => (
                  <SwiperSlide key={store.name || index} style={{ width: 'auto' }}>
                    <CategoryCard name={store.name} image={store.image} onClick={() => handleStoreClick(store)} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        </section> */}

        <Footer />
        {/* Test Authentication Link */}
      </main>
    </>
  )
}
