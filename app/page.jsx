'use client'

import Navigation from '@/components/Navigation'
import Categories from '@/components/Categories'
import BrandOfferCard from '@/components/offer/BrandOfferCard'
import ImageSlider from '@/components/ImageSlider'
import ProductCard from '@/components/ProductCard'
import SectionHeader from '@/components/SectionHeader'
import Banner from '@/components/Banner'
import CategoryCard from '@/components/CategoryCard'
import InfluencerCard from '@/components/InfluencerCard'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import Script from 'next/script'
import QuickNav from '@/components/QuickNav'
import StoreCard from '@/components/StoreCard'
import Image from 'next/image'
import { useRef, useState, useEffect, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProducts } from '@/store/slices/productsSlice'
import { fetchBrands } from '@/store/slices/brandsSlice'
import { fetchStores } from '@/store/slices/storesSlice'
import { fetchPopularCategories, fetchLevel2Categories } from '@/store/slices/categoriesSlice'
import { fetchHomepageSections } from '@/store/slices/homepageSectionsSlice'
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

// Helper function to transform API store data to match CategoryCard component format
const transformStoreData = (apiStore) => {
  return {
    id: apiStore._id,
    name: apiStore.name || 'Store Name',
    slug: apiStore.slug || apiStore.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    image: apiStore.logo || 'https://api.builder.io/api/v1/image/assets/TEMP/12ba4121022e746495773eb8df2e6b4add90148f?width=412'
  }
}

// Helper function to transform API popular category data to match CategoryCard component format
const transformPopularCategoryData = (apiCategory) => {
  console.log('Transforming category:', apiCategory)

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

  const transformed = {
    name: apiCategory.name || 'Category Name',
    image: categoryImage,
    slug: apiCategory.slug || apiCategory.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  console.log('Transformed category:', transformed)
  return transformed
}

const categoryData = [
  {
    name: "Pet Supplies",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/b96c7d3062a93a3b6d8e9a2a4bd11acfa542dced?width=412",
    slug: "pet-supplies"
  },
  {
    name: "Health n Beauty",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/81e3ee1beeaa2c8941600c27d3ec9733bac0869c?width=412",
    slug: "health-beauty"
  },
  {
    name: "Books",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/5839901b9e3641626fef47388dc1036c852a0aa5?width=412",
    slug: "books"
  },
  {
    name: "Computers",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/4a25e8a2b689f4d8cf2f809de9e46f2c26c36d46?width=412",
    slug: "computers"
  },
  {
    name: "Electronics",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/bb3de20fdb53760293d946ca033adbf4489bed56?width=412",
    slug: "electronics"
  },
  {
    name: "Home Appliances",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/f291940d1feaf8e5cb0a7335f629e12091d26a73?width=412",
    slug: "home-appliances"
  }
]

const brandData = [
  {
    name: "Samsung",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/12ba4121022e746495773eb8df2e6b4add90148f?width=412"
  },
  {
    name: "Nike",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/5944fb96605e58c0b0a225611b6e462119c6f6bd?width=412"
  },
  {
    name: "Apple",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/66b97f6957f6e465c502e41a9cda2d8b72cc8817?width=412"
  },
  {
    name: "Sony",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/31e4e4b864102352c5e9e341e72064d8251f7320?width=412"
  },
  {
    name: "Nothing",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/0c4ed4c2cd24b5e148c3022cb0106476b3b63754?width=412"
  },
  {
    name: "Samsung",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/12ba4121022e746495773eb8df2e6b4add90148f?width=412"
  },
  {
    name: "Nothing",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/0c4ed4c2cd24b5e148c3022cb0106476b3b63754?width=412"
  },
  {
    name: "OnePlus",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/b6331ae52c82eb8a247a99158e1d71d242182070?width=412"
  }
]

const storeData = [
  {
    id: "store-1",
    name: "TechHub Electronics",
    category: "Electronics",
    rating: "4.8",
    deliveryTime: "45 Min",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/12ba4121022e746495773eb8df2e6b4add90148f?width=412",
    location: "Dubai Mall",
    isTopStore: true,
    isNewStore: false
  },
  {
    id: "store-2",
    name: "Fashion Forward",
    category: "Fashion",
    rating: "4.6",
    deliveryTime: "30 Min",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/5944fb96605e58c0b0a225611b6e462119c6f6bd?width=412",
    location: "Marina Walk",
    isTopStore: true,
    isNewStore: false
  },
  {
    id: "store-3",
    name: "Home & Garden Plus",
    category: "Home & Garden",
    rating: "4.7",
    deliveryTime: "60 Min",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/66b97f6957f6e465c502e41a9cda2d8b72cc8817?width=412",
    location: "JBR",
    isTopStore: true,
    isNewStore: false
  },
  {
    id: "store-4",
    name: "Sports Central",
    category: "Sports",
    rating: "4.5",
    deliveryTime: "40 Min",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/31e4e4b864102352c5e9e341e72064d8251f7320?width=412",
    location: "Downtown",
    isTopStore: true,
    isNewStore: false
  },
  {
    id: "store-5",
    name: "Beauty Essentials",
    category: "Beauty",
    rating: "4.9",
    deliveryTime: "25 Min",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/0c4ed4c2cd24b5e148c3022cb0106476b3b63754?width=412",
    location: "City Centre",
    isTopStore: true,
    isNewStore: false
  },
  {
    id: "store-6",
    name: "Gourmet Delights",
    category: "Food",
    rating: "4.4",
    deliveryTime: "35 Min",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/b6331ae52c82eb8a247a99158e1d71d242182070?width=412",
    location: "DIFC",
    isTopStore: true,
    isNewStore: false
  },
  {
    id: "store-7",
    name: "Bookworm Paradise",
    category: "Books",
    rating: "4.3",
    deliveryTime: "50 Min",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/12ba4121022e746495773eb8df2e6b4add90148f?width=412",
    location: "Knowledge Village",
    isTopStore: false,
    isNewStore: true
  },
  {
    id: "store-8",
    name: "Pet Care Plus",
    category: "Pet Supplies",
    rating: "4.6",
    deliveryTime: "45 Min",
    image: "https://api.builder.io/api/v1/image/assets/TEMP/5944fb96605e58c0b0a225611b6e462119c6f6bd?width=412",
    location: "Jumeirah",
    isTopStore: false,
    isNewStore: true
  }
]

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { products, bestsellers, offers, qliqPlusDeals, featured, loading, error } = useSelector(state => state.products);
  const { brands, loading: brandsLoading, error: brandsError } = useSelector(state => state.brands);
  const { stores, topStores, newStores, loading: storesLoading, error: storesError } = useSelector(state => state.stores);
  const { popularCategories, level2Categories, loading: popularCategoriesLoading, error: popularCategoriesError } = useSelector(state => state.categories);
  const { sections: homepageSections, loading: homepageSectionsLoading, error: homepageSectionsError } = useSelector(state => state.homepageSections);

  const swiperRef = useRef(null);
  const topStoresSwiperRef = useRef(null);
  const newStoresSwiperRef = useRef(null);
  const topBrandsSwiperRef = useRef(null);
  const bestsellersSwiperRef = useRef(null);
  const offersSwiperRef = useRef(null);
  const specialDealsSwiperRef = useRef(null);
  const featuredOffersSwiperRef = useRef(null);
  const popularCategoriesSwiperRef = useRef(null);
  const otherCategoriesSwiperRef = useRef(null);
  const [activeStoreFilter, setActiveStoreFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  
  // Swiper navigation states
  const [bestsellersNav, setBestsellersNav] = useState({ isBeginning: true, isEnd: false });
  const [offersNav, setOffersNav] = useState({ isBeginning: true, isEnd: false });
  const [specialDealsNav, setSpecialDealsNav] = useState({ isBeginning: true, isEnd: false });
  const [featuredOffersNav, setFeaturedOffersNav] = useState({ isBeginning: true, isEnd: false });
  const [popularCategoriesNav, setPopularCategoriesNav] = useState({ isBeginning: true, isEnd: false });
  const [otherCategoriesNav, setOtherCategoriesNav] = useState({ isBeginning: true, isEnd: false });
  const [topStoresNav, setTopStoresNav] = useState({ isBeginning: true, isEnd: false });
  const [newStoresNav, setNewStoresNav] = useState({ isBeginning: true, isEnd: false });
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

  // Fetch products, brands, stores, categories, and homepage sections on component mount
  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchBrands());
    dispatch(fetchStores());
    dispatch(fetchPopularCategories());
    dispatch(fetchLevel2Categories());
    dispatch(fetchHomepageSections({ isActive: true }));
  }, [dispatch]);

  // Cart and wishlist are now fetched on login, not on home page visit

  // Transform API data for different sections with memoization
  const transformedProducts = useMemo(() => products.map(transformProductData), [products]);
  const transformedBestsellers = useMemo(() => bestsellers.map(transformProductData), [bestsellers]);
  const transformedOffers = useMemo(() => offers.map(transformProductData), [offers]);
  const transformedSpecialDeals = useMemo(() => qliqPlusDeals.map(transformProductData), [qliqPlusDeals]);
  const transformedFeaturedOffers = useMemo(() => featured.map(transformProductData), [featured]);
  const transformedBrands = useMemo(() => brands.map(transformBrandData), [brands]);
  const transformedTopStores = useMemo(() => topStores.map(transformStoreData), [topStores]);
  const transformedNewStores = useMemo(() => newStores.map(transformStoreData), [newStores]);
  const transformedPopularCategories = useMemo(() => popularCategories.map(transformPopularCategoryData), [popularCategories]);
  const transformedLevel2Categories = useMemo(() => level2Categories.map(transformPopularCategoryData), [level2Categories]);

  // Debug logging removed for performance

  // Temporary test data to verify rendering works
  const testCategories = [
    { name: "Dairy & Eggs", image: "https://api.builder.io/api/v1/image/assets/TEMP/b96c7d3062a93a3b6d8e9a2a4bd11acfa542dced?width=412" },
    { name: "Electronics", image: "https://api.builder.io/api/v1/image/assets/TEMP/81e3ee1beeaa2c8941600c27d3ec9733bac0869c?width=412" },
    { name: "Fashion", image: "https://api.builder.io/api/v1/image/assets/TEMP/5839901b9e3641626fef47388dc1036c852a0aa5?width=412" }
  ];

  const handlePrev = () => {
    if (swiperRef.current && swiperRef.current.swiper && !newStoresNav.isBeginning) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const handleNext = () => {
    if (swiperRef.current && swiperRef.current.swiper && !newStoresNav.isEnd) {
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

  const handleNewStoresPrev = () => {
    if (newStoresSwiperRef.current && newStoresSwiperRef.current.swiper && !newStoresNav.isBeginning) {
      newStoresSwiperRef.current.swiper.slidePrev();
    }
  };

  const handleNewStoresNext = () => {
    if (newStoresSwiperRef.current && newStoresSwiperRef.current.swiper && !newStoresNav.isEnd) {
      newStoresSwiperRef.current.swiper.slideNext();
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

  const handlePopularCategoriesPrev = () => {
    if (popularCategoriesSwiperRef.current && popularCategoriesSwiperRef.current.swiper && !popularCategoriesNav.isBeginning) {
      popularCategoriesSwiperRef.current.swiper.slidePrev();
    }
  };

  const handlePopularCategoriesNext = () => {
    if (popularCategoriesSwiperRef.current && popularCategoriesSwiperRef.current.swiper && !popularCategoriesNav.isEnd) {
      popularCategoriesSwiperRef.current.swiper.slideNext();
    }
  };

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

  const handleStoreFilter = (filter) => {
    setActiveStoreFilter(filter);
  };

  const handleSeeAllStores = () => {
    router.push('/stores');
  };

  const handleSeeAllFeaturedOffers = () => {
    router.push('/ecommerce');
  };

  const handleBannerClick = () => {
    window.open('https://iqliqlive.ae/', '_blank');
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
        return storeData.filter(store => store.isTopStore);
      case 'new':
        return storeData.filter(store => store.isNewStore);
      default:
        return storeData;
    }
  };

  // Helper function to check if homepage sections exist
  const hasHomepageSections = () => {
    if (!homepageSections) return false;
    
    // Check if it's the new grouped structure
    if (typeof homepageSections === 'object' && !Array.isArray(homepageSections)) {
      const brandCount = Array.isArray(homepageSections.brand) ? homepageSections.brand.length : 0;
      const categoriesCount = Array.isArray(homepageSections.categories) ? homepageSections.categories.length : 0;
      const hypermarketCount = Array.isArray(homepageSections.hypermarket) ? homepageSections.hypermarket.length : 0;
      const supermarketCount = Array.isArray(homepageSections.supermarket) ? homepageSections.supermarket.length : 0;
      return brandCount + categoriesCount + hypermarketCount + supermarketCount > 0;
    }
    
    // Check if it's the legacy array structure
    return Array.isArray(homepageSections) && homepageSections.length > 0;
  };

  return (
    <>
      {/* WebSite Schema with SearchAction - homepage */}
      <Script
        id="website-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': 'https://www.iqliq.ae/#website',
            url: 'https://www.iqliq.ae/',
            name: 'IQLIQ',
            publisher: {
              '@id': 'https://www.iqliq.ae/#organization',
            },
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://www.iqliq.ae/search?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

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
              prevDisabled={bestsellersNav.isBeginning || transformedBestsellers.length === 0}
              nextDisabled={bestsellersNav.isEnd || transformedBestsellers.length === 0}
            />
            {loading ? (
              <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {[...Array(4)].map((_, index) => (
                  <ProductCardSkeleton key={`skeleton-${index}`} />
                ))}
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
                {transformedBestsellers.map((product, index) => (
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
              onPrev={handleOtherCategoriesPrev}
              onNext={handleOtherCategoriesNext}
              prevDisabled={otherCategoriesNav.isBeginning || (transformedLevel2Categories.length === 0 && categoryData.length === 0)}
              nextDisabled={otherCategoriesNav.isEnd || (transformedLevel2Categories.length === 0 && categoryData.length === 0)}
            />
            {popularCategoriesLoading ? (
              <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {[...Array(6)].map((_, index) => (
                  <CategoryCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            ) : popularCategoriesError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading categories: {popularCategoriesError}
              </div>
            ) : (transformedLevel2Categories.length > 0 || categoryData.length > 0) ? (
              <Swiper
                ref={otherCategoriesSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={isMobile ? 2.08 : 'auto'}
                spaceBetween={isMobile ? 12 : 24}
                grabCursor={true}
                freeMode={true}
                onSlideChange={(swiper) => {
                  setOtherCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachEnd={(swiper) => {
                  setOtherCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachBeginning={(swiper) => {
                  setOtherCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onSwiper={(swiper) => {
                  setOtherCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                className="other-categories-swiper"
              >
                {(transformedLevel2Categories.length > 0 ? transformedLevel2Categories : categoryData).map((category, index) => (
                  <SwiperSlide key={category.name || index} style={{ width: 'auto' }}>
                    <CategoryCard {...category} onClick={() => handleCategoryClick(category)} />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No categories available at the moment.
              </div>
            )}
          </div>
        </section>

        {/* Banner 1 */}
        <Banner
          title="IQLIQ - Home to best online deals in the UAE"
          description="Shop, Earn, Save and Share!! Up to 50% saving for all shoppers and bigger margins for brands and sellers!"
          buttonText="Start here now!"
          backgroundImage="3.jpg"
          onButtonClick={handleBannerClick}
        />

        <section className="section">
          <div className="container">
          
            {homepageSectionsLoading ? (
              <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {[...Array(4)].map((_, index) => (
                  <div key={`skeleton-${index}`} style={{ width: '322px', height: '404px', background: '#f0f0f0', borderRadius: '16px', flexShrink: 0 }} />
                ))}
              </div>
            ) : homepageSectionsError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading homepage sections: {homepageSectionsError}
              </div>
            ) : homepageSections && typeof homepageSections === 'object' && !Array.isArray(homepageSections) ? (
              <Swiper
                ref={offersSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={'auto'}
                spaceBetween={20}
                grabCursor={true}
                freeMode={true}
                className="offers-swiper"
              >
                {/* Map Brand Sections */}
                {homepageSections.brand && Array.isArray(homepageSections.brand) && homepageSections.brand.map((section) => {
                  const level4CategoryIds = section.config?.level4Categories?.map(cat => cat._id) || [];
                  
                  return (
                    <SwiperSlide key={section._id} style={{ width: 'auto' }}>
                      <BrandOfferCard
                        title={section.title}
                        brands={section.config?.brands || []}
                        categories={section.config?.level4Categories || []}
                        ctaLink={section.uiConfig?.ctaLink}
                        ctaText={section.uiConfig?.ctaText || 'View all'}
                        itemType="brand"
                        level4CategoryIds={level4CategoryIds}
                      />
                    </SwiperSlide>
                  );
                })}
                
                {/* Map Category Sections */}
                {homepageSections.categories && Array.isArray(homepageSections.categories) && homepageSections.categories.map((section) => {
                  const level4CategoryIds = section.config?.level4Categories?.map(cat => cat._id) || [];
                  
                  return (
                    <SwiperSlide key={section._id} style={{ width: 'auto' }}>
                      <BrandOfferCard
                        title={section.title}
                        brands={[]}
                        categories={section.config?.level4Categories || []}
                        ctaLink={section.uiConfig?.ctaLink}
                        ctaText={section.uiConfig?.ctaText || 'View all'}
                        itemType="category"
                        level4CategoryIds={level4CategoryIds}
                      />
                    </SwiperSlide>
                  );
                })}
                
                {/* Map Hypermarket Sections */}
                {homepageSections.hypermarket && Array.isArray(homepageSections.hypermarket) && homepageSections.hypermarket.map((section) => {
                  const level4CategoryIds = section.config?.level4Categories?.map(cat => cat._id) || [];
                  
                  // Transform hypermarket stores to match category format
                  const hypermarketStoresAsCategories = section.config?.hypermarketStores?.map(store => ({
                    _id: store._id,
                    name: store.name,
                    icon: store.logo,
                    logo: store.logo,
                    slug: store.slug
                  })) || [];
                  
                  return (
                    <SwiperSlide key={section._id} style={{ width: 'auto' }}>
                      <BrandOfferCard
                        title={section.title}
                        brands={[]}
                        categories={hypermarketStoresAsCategories}
                        ctaLink={section.uiConfig?.ctaLink}
                        ctaText={section.uiConfig?.ctaText || 'View all'}
                        itemType="hypermarket"
                        level4CategoryIds={level4CategoryIds}
                      />
                    </SwiperSlide>
                  );
                })}
                
                {/* Map Supermarket Sections */}
                {homepageSections.supermarket && Array.isArray(homepageSections.supermarket) && homepageSections.supermarket.map((section) => {
                  const level4CategoryIds = section.config?.level4Categories?.map(cat => cat._id) || [];
                  
                  // Transform supermarket stores to match category format
                  const supermarketStoresAsCategories = section.config?.supermarketStores?.map(store => ({
                    _id: store._id,
                    name: store.name,
                    icon: store.logo,
                    logo: store.logo,
                    slug: store.slug
                  })) || [];
                  
                  return (
                    <SwiperSlide key={section._id} style={{ width: 'auto' }}>
                      <BrandOfferCard
                        title={section.title}
                        brands={[]}
                        categories={supermarketStoresAsCategories}
                        ctaLink={section.uiConfig?.ctaLink}
                        ctaText={section.uiConfig?.ctaText || 'View all'}
                        itemType="supermarket"
                        level4CategoryIds={level4CategoryIds}
                      />
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            ) : Array.isArray(homepageSections) && homepageSections.length > 0 ? (
              // Fallback for legacy array structure
              <Swiper
                ref={offersSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={'auto'}
                spaceBetween={20}
                grabCursor={true}
                freeMode={true}
                className="offers-swiper"
              >
                {homepageSections.map((section) => {
                  const hasHypermarketStores = section.config?.hypermarketStores && 
                    Array.isArray(section.config.hypermarketStores) &&
                    section.config.hypermarketStores.length > 0;
                  
                  const hasSupermarketStores = section.config?.supermarketStores && 
                    Array.isArray(section.config.supermarketStores) &&
                    section.config.supermarketStores.length > 0;
                  
                  const hypermarketStoresAsCategories = hasHypermarketStores 
                    ? section.config.hypermarketStores.map(store => ({
                        _id: store._id,
                        name: store.name,
                        icon: store.logo,
                        logo: store.logo,
                        slug: store.slug
                      }))
                    : [];
                  
                  const supermarketStoresAsCategories = hasSupermarketStores 
                    ? section.config.supermarketStores.map(store => ({
                        _id: store._id,
                        name: store.name,
                        icon: store.logo,
                        logo: store.logo,
                        slug: store.slug
                      }))
                    : [];
                  
                  const categoriesToUse = hasHypermarketStores 
                    ? hypermarketStoresAsCategories 
                    : hasSupermarketStores
                    ? supermarketStoresAsCategories
                    : (section.config?.level4Categories || []);
                  
                  const itemType = hasHypermarketStores 
                    ? 'hypermarket' 
                    : hasSupermarketStores
                    ? 'supermarket'
                    : (section.config?.brands && section.config.brands.length > 0)
                    ? 'brand'
                    : 'category';
                  
                  const level4CategoryIds = section.config?.level4Categories?.map(cat => cat._id) || [];
                  
                  return (
                    <SwiperSlide key={section._id} style={{ width: 'auto' }}>
                      <BrandOfferCard
                        title={section.title}
                        brands={section.config?.brands || []}
                        categories={categoriesToUse}
                        ctaLink={section.uiConfig?.ctaLink}
                        ctaText={section.uiConfig?.ctaText || 'View all'}
                        itemType={itemType}
                        level4CategoryIds={level4CategoryIds}
                      />
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            ) : (
              <Swiper
                ref={offersSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={'auto'}
                spaceBetween={20}
                grabCursor={true}
                freeMode={true}
                className="offers-swiper"
              >
                <SwiperSlide style={{ width: 'auto' }}><BrandOfferCard /></SwiperSlide>
                <SwiperSlide style={{ width: 'auto' }}><BrandOfferCard /></SwiperSlide>
                <SwiperSlide style={{ width: 'auto' }}><BrandOfferCard /></SwiperSlide>
                <SwiperSlide style={{ width: 'auto' }}><BrandOfferCard /></SwiperSlide>
              </Swiper>
            )}
          </div>
        </section>

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
              <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {[...Array(6)].map((_, index) => (
                  <CategoryCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            ) : brandsError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading brands: {brandsError}
              </div>
            ) : (
              <Swiper
                ref={topBrandsSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={isMobile ? 2.08 : 'auto'}
                spaceBetween={isMobile ? 12 : 24}
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

        {/* Special Deals Section */}
        {/* <section className="section">
          <div className="container">
            <SectionHeader
              title="Special Deals For QLIQ+"
              showNavigation={true}
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

        {/* Banner 2 */}
        <Banner
          title="Earn Online with IQLIQ Qyons!"
          description="Introducing online IQLIQ Qoyns system where 100 Qoyn = $1. The more you shop, the more you save!!"
          buttonText="Learn how it works"
          backgroundImage="1.jpg"
          onButtonClick={handleBannerClick}
        />

        {/* Top Stores Section */}
        <section className="section">
          <div className="container">
            <SectionHeader
              title="Top Stores"
              showNavigation={true}
              showButton={true}
              buttonText={"See All"}
              onButtonClick={handleSeeAllStores}
              onPrev={handleTopStoresPrev}
              onNext={handleTopStoresNext}
              prevDisabled={topStoresNav.isBeginning || transformedTopStores.length === 0}
              nextDisabled={topStoresNav.isEnd || transformedTopStores.length === 0}
            />
            {storesLoading ? (
              <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {[...Array(6)].map((_, index) => (
                  <CategoryCardSkeleton key={`skeleton-${index}`} />
                ))}
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
                onSlideChange={(swiper) => {
                  setTopStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachEnd={(swiper) => {
                  setTopStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachBeginning={(swiper) => {
                  setTopStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onSwiper={(swiper) => {
                  setTopStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
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
        </section>

        {/* Featured Offers Section */}
        <section className="section">
          <div className="container">
            <SectionHeader
              title="Featured Offers"
              showNavigation={true}
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

        {/* Popular Categories Section */}
        <section className="section">
          <div className="container">
            <SectionHeader
              title="Popular Categories"
              showNavigation={true}
              onPrev={handlePopularCategoriesPrev}
              onNext={handlePopularCategoriesNext}
              prevDisabled={popularCategoriesNav.isBeginning || (transformedPopularCategories.length === 0 && testCategories.length === 0)}
              nextDisabled={popularCategoriesNav.isEnd || (transformedPopularCategories.length === 0 && testCategories.length === 0)}
            />
            {popularCategoriesLoading ? (
              <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {[...Array(6)].map((_, index) => (
                  <CategoryCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            ) : popularCategoriesError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading popular categories: {popularCategoriesError}
              </div>
            ) : (transformedPopularCategories.length > 0 || testCategories.length > 0) ? (
              <Swiper
                ref={popularCategoriesSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={isMobile ? 2.08 : 'auto'}
                spaceBetween={isMobile ? 12 : 24}
                grabCursor={true}
                freeMode={true}
                onSlideChange={(swiper) => {
                  setPopularCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachEnd={(swiper) => {
                  setPopularCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachBeginning={(swiper) => {
                  setPopularCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onSwiper={(swiper) => {
                  setPopularCategoriesNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                className="other-categories-swiper"
              >
                {(transformedPopularCategories.length > 0 ? transformedPopularCategories : testCategories).map((category, index) => (
                  <SwiperSlide key={category.name || index} style={{ width: 'auto' }}>
                    <CategoryCard {...category} onClick={() => handleCategoryClick(category)} />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No popular categories available at the moment.
              </div>
            )}
          </div>
        </section>

        {/* Banner 3 */}
        <Banner
          title="Make dollars online while in the UAE"
          description="IQLIQ helps you earn $$$ every month in form of Qoyns by doing small gigs offered by influencers and brands. You can start today!"
          buttonText="Learn more"
          backgroundImage="2.jpg"
          onButtonClick={handleBannerClick}
        />

        {/* New Stores Section */}
        <section className="section">
          <div className="container">
            <SectionHeader
              title="New Stores on IQLIQ"
              showNavigation={true}
              onPrev={handlePrev}
              onNext={handleNext}
              showButton={false}
              buttonText={""}
              onButtonClick={() => { }}
              prevDisabled={newStoresNav.isBeginning || transformedNewStores.length === 0}
              nextDisabled={newStoresNav.isEnd || transformedNewStores.length === 0}
            />
            {storesLoading ? (
              <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {[...Array(6)].map((_, index) => (
                  <CategoryCardSkeleton key={`skeleton-${index}`} />
                ))}
              </div>
            ) : storesError ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                Error loading stores: {storesError}
              </div>
            ) : (
              <Swiper
                ref={newStoresSwiperRef}
                modules={[SwiperNavigation]}
                slidesPerView={isMobile ? 2.08 : 'auto'}
                spaceBetween={isMobile ? 12 : 24}
                grabCursor={true}
                freeMode={true}
                onSlideChange={(swiper) => {
                  setNewStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachEnd={(swiper) => {
                  setNewStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onReachBeginning={(swiper) => {
                  setNewStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
                onSwiper={(swiper) => {
                  setNewStoresNav({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd });
                }}
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
        </section>

        {/* Banner 4 */}
        {/* <Banner
          title="How To Earn Doing a GIG"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
          buttonText="Learn More"
          backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/f70eb37fe9b38478a141ee9536f057811ff47ace?width=2720"
        /> */}

        {/* FAQ Section */}
        <FAQ />

        {/* Final Banner */}
        {/* <Banner
          title="Become a Vendor"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis."
          buttonText="Learn More"
          backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/c1726d63175ccf7d26ef79e2d2a0ffde926ef9d0?width=2720"
        /> */}
        <Footer />
        {/* Test Authentication Link */}
      </main>
    </>
  )
}
