'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import SectionHeader from '@/components/SectionHeader'
import ProductCard from '@/components/ProductCard'
import FilterDrawer from '@/components/FilterDrawer'
import SortDropdown from '@/components/SortDropdown'
import { fetchProducts } from '@/store/slices/productsSlice'
import { catalog, search } from '@/store/api/endpoints'
import { buildFacetsFromCategoryFilters } from '@/utils/categoryFilters'
import { buildFacetsFromBrandFilters } from '@/utils/brandFilters'
import { buildFacetsFromStoreFilters } from '@/utils/storeFilters'

// Helper function to transform API product data
const transformProductData = (apiProduct) => {
  const savings = apiProduct.discount_price ? apiProduct.price - apiProduct.discount_price : 0
  return {
    id: apiProduct._id,
    slug: apiProduct.slug,
    title: apiProduct.title,
    price: `AED ${apiProduct.discount_price || apiProduct.price || '0'}`,
    originalPrice: apiProduct.price,
    rating: apiProduct.average_rating || 4.5,
    deliveryTime: "30 Min",
    image: apiProduct.images?.[0]?.url || '/iphone.jpg',
    badge: savings > 0 ? `Save AED ${savings}` : null
  }
}

export default function BrandPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const slug = params.slug
  const storeId = searchParams.get('storeId') || searchParams.get('storeID') || searchParams.get('store_id')
  const categoryLevel = searchParams.get('categoryLevel')
  // Note: brand_id is removed - brands should navigate to their own page, not watches
  const source = searchParams.get('source')
  const categoryId = searchParams.get('categoryId') || searchParams.get('category_id') // For filtering by specific category ID (support both formats)
  const storeType = searchParams.get('storeType') // Store type filter (hypermarket, supermarket, e-shop)

  const { products, loading, error } = useSelector(state => state.products)
  const [brandInfo, setBrandInfo] = useState(null)
  const [brandProducts, setBrandProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [isStore, setIsStore] = useState(false)
  const [isCategory, setIsCategory] = useState(false)
  const [filterData, setFilterData] = useState(null)
  const [selectedFilters, setSelectedFilters] = useState({})
  const [breadcrumbPath, setBreadcrumbPath] = useState([])
  const [level2Category, setLevel2Category] = useState(null) // Store level2 category info
  const buildLevel2Entry = (level2Data) => {
    if (!level2Data) return null
    const level2Name = typeof level2Data === 'string' ? level2Data : level2Data?.name
    if (!level2Name) return null
    const normalized = typeof level2Data === 'string' ? {} : level2Data
    return {
      ...normalized,
      name: level2Name
    }
  }

  const [debouncedFilters, setDebouncedFilters] = useState({})
  const [sortBy, setSortBy] = useState('relevance')
  const [isMobile, setIsMobile] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState(null)
  
  // Ref to track if fetch is in progress
  const isFetchingRef = useRef(false)
  // Ref for the scrollable products container
  const productsScrollContainerRef = useRef(null)

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

  // Fetch products when component mounts
  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  // Fetch filter data for category, brand, and store pages
  useEffect(() => {
    const fetchFilterData = async () => {
      console.log('Fetching filter data for:', { slug, categoryLevel, storeId, source, debouncedFilters })
      
      // Check if this is a store page first (has source or will be determined by slug)
      const isStorePage = storeId || source;
      let actualStoreIdForFilters = storeId;
      
      // If it's a store page but no storeId, fetch store by slug first
      if (isStorePage && !storeId && slug) {
        try {
          console.log('Fetching store by slug for filters:', slug);
          const storeResponse = await fetch(catalog.storeBySlug(slug));
          if (storeResponse.ok) {
            const storeData = await storeResponse.json();
            if (storeData.success && storeData.data && storeData.data._id) {
              actualStoreIdForFilters = storeData.data._id;
              console.log('Fetched store ID for filters:', actualStoreIdForFilters);
            }
          }
        } catch (error) {
          console.error('Error fetching store by slug for filters:', error);
        }
      }
      
      // Priority: Store > Category > Brand
      if (actualStoreIdForFilters) {
        // Fetch store filters with current selected filters for accurate counts
        console.log('Fetching store filters for storeId:', actualStoreIdForFilters)
        try {
          // Build filter params for the store filters API
          const filterParams = new URLSearchParams()
          
          // Add categoryId if present (for level4 filtering)
          if (categoryId) {
            filterParams.append('categoryId', categoryId)
          }
          
          // Price filter
          if (debouncedFilters.price?.min !== undefined && debouncedFilters.price?.min !== '') {
            filterParams.append('min_price', debouncedFilters.price.min)
          }
          if (debouncedFilters.price?.max !== undefined && debouncedFilters.price?.max !== '') {
            filterParams.append('max_price', debouncedFilters.price.max)
          }
          
          // Availability filter
          if (debouncedFilters.availability instanceof Set) {
            if (debouncedFilters.availability.has('in') && !debouncedFilters.availability.has('out')) {
              filterParams.append('in_stock', 'true')
            } else if (debouncedFilters.availability.has('out') && !debouncedFilters.availability.has('in')) {
              filterParams.append('in_stock', 'false')
            }
          }
          
          // Rating filter
          if (typeof debouncedFilters.rating === 'number') {
            filterParams.append('min_rating', debouncedFilters.rating)
          }
          
          // Brand filter (multiple) - send brand names, not IDs
          if (debouncedFilters.brand instanceof Set && debouncedFilters.brand.size > 0) {
            Array.from(debouncedFilters.brand).forEach(b => filterParams.append('brand_id', b))
          }
          
          // Dynamic attribute filters (attr.*)
          Object.keys(debouncedFilters).forEach(key => {
            if (key.startsWith('attr.')) {
              const attrKey = key.substring(5)
              const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
              values.forEach(v => filterParams.append(`attr_${attrKey}`, v))
            }
          })
          
          // Dynamic specification filters (spec.*)
          Object.keys(debouncedFilters).forEach(key => {
            if (key.startsWith('spec.')) {
              const specKey = key.substring(5)
              const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
              values.forEach(v => filterParams.append(`spec_${specKey}`, v))
            }
          })
          
          const url = filterParams.toString() 
            ? `${search.storeFilters(actualStoreIdForFilters)}&${filterParams.toString()}`
            : search.storeFilters(actualStoreIdForFilters)
          
          console.log('Fetching store filters with URL:', url)
          const response = await fetch(url)
          if (response.ok) {
            const data = await response.json()
            console.log('Store Filter API Response:', data)
            if (data.success && data.data) {
              console.log('Setting filter data:', data.data)
              setFilterData(data.data)
            } else {
              console.error('Store filter API returned unsuccessful response:', data)
            }
          } else {
            console.error('Store filter API error:', response.status, response.statusText)
            const errorText = await response.text()
            console.error('Error response body:', errorText)
          }
        } catch (error) {
          console.error('Error fetching store filter data:', error)
        }
      } else if (categoryLevel && slug && !isStorePage) {
        // Fetch category filters with selected filters for accurate counts
        try {
          // Build filter params for the category filters API
          const filterParams = new URLSearchParams()
          
          // Price filter
          if (debouncedFilters.price?.min !== undefined && debouncedFilters.price?.min !== '') {
            filterParams.append('min_price', debouncedFilters.price.min)
          }
          if (debouncedFilters.price?.max !== undefined && debouncedFilters.price?.max !== '') {
            filterParams.append('max_price', debouncedFilters.price.max)
          }
          
          // Availability filter
          if (debouncedFilters.availability instanceof Set) {
            if (debouncedFilters.availability.has('in') && !debouncedFilters.availability.has('out')) {
              filterParams.append('in_stock', 'true')
            } else if (debouncedFilters.availability.has('out') && !debouncedFilters.availability.has('in')) {
              filterParams.append('in_stock', 'false')
            }
          }
          
          // Rating filter
          if (typeof debouncedFilters.rating === 'number') {
            filterParams.append('min_rating', debouncedFilters.rating)
          }
          
          // Brand filter from filters (multiple) - brands should navigate to their own page, not watches
          // Only apply brand filter if user manually selects it from filters
          if (debouncedFilters.brand instanceof Set && debouncedFilters.brand.size > 0) {
            // Brand filter from filters (multiple)
            Array.from(debouncedFilters.brand).forEach(b => filterParams.append('brand_id', b))
          }
          
          // Store filter from query params (when clicking icon) - takes priority
          if (storeId) {
            filterParams.append('store_id', storeId)
          } else if (debouncedFilters.store instanceof Set && debouncedFilters.store.size > 0) {
            // Store filter from filters (multiple)
            Array.from(debouncedFilters.store).forEach(s => filterParams.append('store_id', s))
          }
          
          // Dynamic attribute filters (attr.*)
          Object.keys(debouncedFilters).forEach(key => {
            if (key.startsWith('attr.')) {
              const attrKey = key.substring(5)
              const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
              values.forEach(v => filterParams.append(`attr_${attrKey}`, v))
            }
          })
          
          // Dynamic specification filters (spec.*)
          Object.keys(debouncedFilters).forEach(key => {
            if (key.startsWith('spec.')) {
              const specKey = key.substring(5)
              const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
              values.forEach(v => filterParams.append(`spec_${specKey}`, v))
            }
          })
          
          const url = filterParams.toString() 
            ? `${search.categoryFilters(slug, categoryLevel)}&${filterParams.toString()}`
            : search.categoryFilters(slug, categoryLevel)
          
          const response = await fetch(url)
          if (response.ok) {
            const data = await response.json()
            console.log('Category Filter API Response:', data)
            if (data.success && data.data) {
              setFilterData(data.data)
            }
          }
        } catch (error) {
          console.error('Error fetching category filter data:', error)
        }
      } else if (slug) {
        // Fetch brand filters (when it's not a store and not a category)
        try {
          const response = await fetch(search.brandFilters(slug))
          if (response.ok) {
            const data = await response.json()
            console.log('Brand Filter API Response:', data)
            if (data.success && data.data) {
              setFilterData(data.data)
            }
          }
        } catch (error) {
          console.error('Error fetching brand filter data:', error)
        }
      }
    }

    fetchFilterData()
  }, [slug, categoryLevel, storeId, categoryId, source, debouncedFilters])

  // Debounce filter changes to allow multiple selections
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(selectedFilters)
    }, 300) // 300ms delay for filter changes

    return () => clearTimeout(timer)
  }, [selectedFilters])

  // Reset pagination and clear stale data when filters or navigation changes
  useEffect(() => {
    setCurrentPage(1)
    setPaginationInfo(null)
    setBrandProducts([])
    isFetchingRef.current = false // Reset fetch lock when filters change
    
    // Clear level2Category and brandInfo immediately when slug changes to prevent showing stale data
    // This ensures no old category data shows when navigating between categories
    setLevel2Category(null)
    setBrandInfo(null)
  }, [debouncedFilters, slug, storeId, categoryLevel, source, categoryId])

  // Fetch brand/store/category info and products by slug
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return
      
      // Prevent duplicate fetches
      if (isFetchingRef.current) {
        console.log('Fetch already in progress, skipping...')
        return
      }
      
      isFetchingRef.current = true
      
      try {
        setLoadingProducts(true)
        // Clear products immediately when starting to fetch new page
        // This ensures old products don't show while new ones are loading
        setBrandProducts([])
        
        // Clear level2Category and brandInfo immediately when slug changes
        // This prevents showing stale category data during navigation
        setLevel2Category(null)
        setBrandInfo(null)

        // Check if this is a store (has storeId parameter or source parameter), category (has categoryLevel), or a brand
        // If source is present (hypermarket/supermarket), it's definitely a store
        const isStorePage = storeId || source;
        
        if (isStorePage) {
          setIsStore(true)
          setIsCategory(false)
          
          // If we have source or categoryLevel=4 but no storeId, fetch store by slug first
          let actualStoreId = storeId;
          let storeInfo = null;
          
          if ((source || categoryLevel === '4') && !storeId && slug) {
            try {
              console.log('Fetching store by slug:', slug);
              const storeResponse = await fetch(catalog.storeBySlug(slug));
              if (storeResponse.ok) {
                const storeData = await storeResponse.json();
                console.log('Store data response:', storeData);
                if (storeData.success && storeData.data && storeData.data._id) {
                  actualStoreId = storeData.data._id;
                  storeInfo = storeData.data;
                  console.log('Fetched store ID from slug:', actualStoreId);
                  // Set store info immediately
                  if (currentPage === 1) {
                    setBrandInfo(storeData.data);
                  }
                } else {
                  console.warn('Store data not found or invalid:', storeData);
                }
              } else {
                console.error('Store fetch failed:', storeResponse.status, storeResponse.statusText);
              }
            } catch (error) {
              console.error('Error fetching store by slug:', error);
            }
          }
          
          if (actualStoreId) {
            try {
              console.log('Fetching products for store:', actualStoreId, 'with categoryLevel:', categoryLevel);
              
              // If categoryLevel=4 is present but no category_id, try to find a level4 category
              let level4CategoryId = categoryId;
              if (categoryLevel === '4' && !categoryId) {
                try {
                  // Try to find "watches" category as default level4 category
                  const watchesCategoryResponse = await fetch(catalog.categoryBySlug('watches'));
                  if (watchesCategoryResponse.ok) {
                    const watchesData = await watchesCategoryResponse.json();
                    if (watchesData.success && watchesData.data && watchesData.data._id && watchesData.data.level === 4) {
                      level4CategoryId = watchesData.data._id;
                      console.log('Found default level4 category (watches):', level4CategoryId);
                    } else {
                      // If watches is not level 4, try to find any level 4 category
                      // We could fetch all level 4 categories, but for now let's try a few common ones
                      const commonLevel4Slugs = ['watches', 'electronics', 'mobile-phones', 'laptops'];
                      for (const slug of commonLevel4Slugs) {
                        try {
                          const categoryResponse = await fetch(catalog.categoryBySlug(slug));
                          if (categoryResponse.ok) {
                            const categoryData = await categoryResponse.json();
                            if (categoryData.success && categoryData.data && categoryData.data._id && categoryData.data.level === 4) {
                              level4CategoryId = categoryData.data._id;
                              console.log(`Found level4 category (${slug}):`, level4CategoryId);
                              break;
                            }
                          }
                        } catch (err) {
                          continue;
                        }
                      }
                    }
                  }
                  
                  // Update URL to include the categoryId if we found one
                  if (level4CategoryId && level4CategoryId !== categoryId) {
                    const newParams = new URLSearchParams(searchParams.toString());
                    newParams.set('categoryId', level4CategoryId);
                    const newUrl = `/${slug}?${newParams.toString()}`;
                    console.log('Updating URL with categoryId:', newUrl);
                    router.replace(newUrl, { scroll: false });
                  }
                } catch (error) {
                  console.warn('Could not fetch default level4 category:', error);
                }
              }
              
              // Build filter params for store
              const params = new URLSearchParams()
              
              // Add pagination params
              params.append('page', currentPage.toString())
              params.append('limit', '20')
              
              // Add sort parameter
              params.append('sort', sortBy)
              
              // Price filter
              if (debouncedFilters.price?.min !== undefined && debouncedFilters.price?.min !== '') {
                params.append('min_price', debouncedFilters.price.min)
              }
              if (debouncedFilters.price?.max !== undefined && debouncedFilters.price?.max !== '') {
                params.append('max_price', debouncedFilters.price.max)
              }
              
              // Availability filter
              if (debouncedFilters.availability instanceof Set) {
                if (debouncedFilters.availability.has('in') && !debouncedFilters.availability.has('out')) {
                  params.append('in_stock', 'true')
                } else if (debouncedFilters.availability.has('out') && !debouncedFilters.availability.has('in')) {
                  params.append('in_stock', 'false')
                }
              }
              
              // Rating filter
              if (typeof debouncedFilters.rating === 'number') {
                params.append('min_rating', debouncedFilters.rating)
              }
              
              // Brand filter (multiple)
              if (debouncedFilters.brand instanceof Set && debouncedFilters.brand.size > 0) {
                Array.from(debouncedFilters.brand).forEach(b => params.append('brand_id', b))
              }
              
              // Dynamic attribute filters (attr.*)
              Object.keys(debouncedFilters).forEach(key => {
                if (key.startsWith('attr.')) {
                  const attrKey = key.substring(5)
                  const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
                  values.forEach(v => params.append(`attr_${attrKey}`, v))
                }
              })
              
              // Dynamic specification filters (spec.*)
              Object.keys(debouncedFilters).forEach(key => {
                if (key.startsWith('spec.')) {
                  const specKey = key.substring(5)
                  const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
                  values.forEach(v => params.append(`spec_${specKey}`, v))
                }
              })
              
              // If categoryLevel=4 and categoryId is present, use the new unified API
              if (categoryLevel === '4' && level4CategoryId) {
                // Clean and validate the category ID before passing
                const cleanedCategoryId = String(level4CategoryId).trim().split(/\s+/)[0];
                if (cleanedCategoryId && /^[0-9a-fA-F]{24}$/.test(cleanedCategoryId)) {
                  // Use the new unified API endpoint for level4 products
                  const unifiedParams = {
                    level4: cleanedCategoryId,
                    storeId: actualStoreId, // For hypermarket/supermarket/store
                    page: currentPage,
                    limit: 20,
                    sort: sortBy,
                    in_stock: true
                  };
                  
                  // Add price filters
                  if (debouncedFilters.price?.min !== undefined && debouncedFilters.price?.min !== '') {
                    unifiedParams.min_price = debouncedFilters.price.min;
                  }
                  if (debouncedFilters.price?.max !== undefined && debouncedFilters.price?.max !== '') {
                    unifiedParams.max_price = debouncedFilters.price.max;
                  }
                  
                  // Add availability filter
                  if (debouncedFilters.availability instanceof Set) {
                    if (debouncedFilters.availability.has('in') && !debouncedFilters.availability.has('out')) {
                      unifiedParams.in_stock = true;
                    } else if (debouncedFilters.availability.has('out') && !debouncedFilters.availability.has('in')) {
                      unifiedParams.in_stock = false;
                    }
                  }
                  
                  // Add rating filter
                  if (typeof debouncedFilters.rating === 'number') {
                    unifiedParams.min_rating = debouncedFilters.rating;
                  }
                  
                  // Add brand filter (multiple)
                  if (debouncedFilters.brand instanceof Set && debouncedFilters.brand.size > 0) {
                    unifiedParams.brand_id = Array.from(debouncedFilters.brand);
                  }
                  
                  // Add dynamic attribute filters
                  Object.keys(debouncedFilters).forEach(key => {
                    if (key.startsWith('attr.')) {
                      const attrKey = key.substring(5);
                      const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : [];
                      if (values.length > 0) {
                        if (!unifiedParams.attributes) unifiedParams.attributes = {};
                        unifiedParams.attributes[attrKey] = values;
                      }
                    }
                  });
                  
                  // Add dynamic specification filters
                  Object.keys(debouncedFilters).forEach(key => {
                    if (key.startsWith('spec.')) {
                      const specKey = key.substring(5);
                      const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : [];
                      if (values.length > 0) {
                        if (!unifiedParams.specifications) unifiedParams.specifications = {};
                        unifiedParams.specifications[specKey] = values;
                      }
                    }
                  });
                  
                  const url = catalog.productsByLevel4AndStore(unifiedParams);
                  console.log('Using level4 and store API with params:', unifiedParams);
                  console.log('Fetching from URL:', url);
                  
                  const response = await fetch(url);
                  
                  if (response.ok) {
                    const data = await response.json();
                    console.log('Level4 and Store API Response:', data);
                    
                    if (data.success && data.data) {
                      // Set store info if we fetched it separately, otherwise try from first product
                      if (currentPage === 1) {
                        if (storeInfo) {
                          setBrandInfo(storeInfo);
                        } else {
                          const firstProduct = data.data.products?.[0];
                          if (firstProduct?.store_id) {
                            setBrandInfo(firstProduct.store_id);
                          }
                        }
                        
                        // Extract level2 from first product for breadcrumb
                        const firstProduct = data.data.products?.[0];
                        if (firstProduct?.level2) {
                          const level2Entry = buildLevel2Entry(firstProduct.level2);
                          if (level2Entry?.name) {
                            setLevel2Category(level2Entry);
                            console.log('Extracted level2 from product for store page:', level2Entry.name);
                          }
                        }
                      }
                      
                      // Products are already filtered by store_id in the API, no need to filter again
                      const newProducts = data.data.products || [];
                      
                      console.log('Received products:', newProducts.length);
                      setBrandProducts(newProducts);
                      
                      const pagination = data.data.pagination;
                      setPaginationInfo(pagination || null);
                    } else {
                      console.warn('API response not successful:', data);
                      setBrandProducts([]);
                    }
                  } else {
                    console.error('Level4 and Store API error:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('Error response body:', errorText);
                    setBrandProducts([]);
                  }
                  
                  setLoadingProducts(false);
                  isFetchingRef.current = false;
                  return; // Exit early since we've handled the request
                } else {
                  console.warn('Invalid categoryId format:', level4CategoryId);
                }
              }
              
              // Use search service API for filtered store products (fallback when no level4)
              // Convert URLSearchParams to plain object for the API function
              // Handle multiple values for the same key (e.g., multiple brand_id)
              const paramsObj = {};
              params.forEach((value, key) => {
                if (paramsObj[key]) {
                  // If key already exists, make it an array
                  if (Array.isArray(paramsObj[key])) {
                    paramsObj[key].push(value);
                  } else {
                    paramsObj[key] = [paramsObj[key], value];
                  }
                } else {
                  paramsObj[key] = value;
                }
              });
              
              console.log('Store products params object:', paramsObj);
              const url = Object.keys(paramsObj).length > 0
                ? search.storeProducts(actualStoreId, paramsObj)
                : search.storeProducts(actualStoreId)
              
              console.log('Fetching store products from URL:', url);
               
              const response = await fetch(url)

              if (response.ok) {
                const data = await response.json()
                console.log('Store Catalog API Response:', data)

                if (data.success && data.data) {
                  // Set store info if we fetched it separately, otherwise try from first product
                  if (currentPage === 1) {
                    if (storeInfo) {
                      setBrandInfo(storeInfo);
                    } else {
                      // Extract store info from the first product's store_id
                      const firstProduct = data.data.products?.[0]
                      if (firstProduct?.store_id) {
                        setBrandInfo(firstProduct.store_id) // Store info
                      }
                    }
                    
                    // Extract level2 from first product for breadcrumb
                    const firstProduct = data.data.products?.[0];
                    if (firstProduct?.level2) {
                      const level2Entry = buildLevel2Entry(firstProduct.level2);
                      if (level2Entry?.name) {
                        setLevel2Category(level2Entry);
                        console.log('Extracted level2 from product for store page (fallback API):', level2Entry.name);
                      }
                    }
                  }
                  
                  let newProducts = data.data.products || []
                  
                  // Filter products by store_id if storeId is present (when on a store page)
                  if (storeId && newProducts.length > 0) {
                    newProducts = newProducts.filter(product => {
                      // Check if product has store_id and it matches the current storeId
                      const productStoreId = product.store_id?._id || product.store_id;
                      return productStoreId === storeId || String(productStoreId) === String(storeId);
                    });
                    console.log(`Filtered products by store_id ${storeId}: ${newProducts.length} products found`);
                  }
                  
                  console.log('Received products:', newProducts.length);
                  setBrandProducts(newProducts)

                  const pagination = data.data.pagination
                  setPaginationInfo(pagination || null)
                } else {
                  console.warn('API response not successful:', data);
                }
              } else {
                console.error('Store products API error:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response body:', errorText);
                setBrandProducts([]);
              }
            } catch (error) {
              console.error('Error fetching store products:', error);
              setBrandProducts([]);
            } finally {
              setLoadingProducts(false);
              isFetchingRef.current = false;
            }
          } else {
            console.warn('Store ID not found for store page');
            setLoadingProducts(false);
            isFetchingRef.current = false;
          }
          } else if (categoryLevel) {
            setIsStore(false)
            setIsCategory(true)
            
            try {
              // For level4 categories, get the category ID from slug if not provided
              let level4CategoryId = categoryId;
              let level4CategoryData = null;
              
              if (categoryLevel === '4') {
                if (!level4CategoryId && slug) {
                  // Fetch category by slug to get the ID
                  try {
                    const categoryResponse = await fetch(catalog.categoryBySlug(slug));
                    if (categoryResponse.ok) {
                      const categoryData = await categoryResponse.json();
                      if (categoryData.success && categoryData.data && categoryData.data._id && categoryData.data.level === 4) {
                        level4CategoryId = categoryData.data._id;
                        level4CategoryData = categoryData.data;
                        console.log('Fetched level4 category ID from slug:', level4CategoryId);
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching category by slug:', error);
                  }
                }
              }
              
              // Only use store ID from query params for category pages
              const actualStoreId = storeId;
              
              // If we have both level4 ID and store ID, use the new endpoint
              if (categoryLevel === '4' && level4CategoryId && actualStoreId) {
                // Clean and validate the category ID
                const cleanedCategoryId = String(level4CategoryId).trim().split(/\s+/)[0];
                const cleanedStoreId = String(actualStoreId).trim().split(/\s+/)[0];
                
                if (cleanedCategoryId && /^[0-9a-fA-F]{24}$/.test(cleanedCategoryId) && 
                    cleanedStoreId && /^[0-9a-fA-F]{24}$/.test(cleanedStoreId)) {
                  
                  // Use the new level4 and store API endpoint
                  const unifiedParams = {
                    level4: cleanedCategoryId,
                    storeId: cleanedStoreId,
                    page: currentPage,
                    limit: 20,
                    sort: sortBy
                  };
                  
                  // Add price filters
                  if (debouncedFilters.price?.min !== undefined && debouncedFilters.price?.min !== '') {
                    unifiedParams.min_price = debouncedFilters.price.min;
                  }
                  if (debouncedFilters.price?.max !== undefined && debouncedFilters.price?.max !== '') {
                    unifiedParams.max_price = debouncedFilters.price.max;
                  }
                  
                  // Add availability filter
                  if (debouncedFilters.availability instanceof Set) {
                    if (debouncedFilters.availability.has('in') && !debouncedFilters.availability.has('out')) {
                      unifiedParams.in_stock = true;
                    } else if (debouncedFilters.availability.has('out') && !debouncedFilters.availability.has('in')) {
                      unifiedParams.in_stock = false;
                    }
                  }
                  
                  // Add rating filter
                  if (typeof debouncedFilters.rating === 'number') {
                    unifiedParams.min_rating = debouncedFilters.rating;
                  }
                  
                  // Add brand filter (multiple)
                  if (debouncedFilters.brand instanceof Set && debouncedFilters.brand.size > 0) {
                    unifiedParams.brand_id = Array.from(debouncedFilters.brand);
                  }
                  
                  // Add dynamic attribute filters
                  Object.keys(debouncedFilters).forEach(key => {
                    if (key.startsWith('attr.')) {
                      const attrKey = key.substring(5);
                      const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : [];
                      if (values.length > 0) {
                        if (!unifiedParams.attributes) unifiedParams.attributes = {};
                        unifiedParams.attributes[attrKey] = values;
                      }
                    }
                  });
                  
                  // Add dynamic specification filters
                  Object.keys(debouncedFilters).forEach(key => {
                    if (key.startsWith('spec.')) {
                      const specKey = key.substring(5);
                      const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : [];
                      if (values.length > 0) {
                        if (!unifiedParams.specifications) unifiedParams.specifications = {};
                        unifiedParams.specifications[specKey] = values;
                      }
                    }
                  });
                  
                  const url = catalog.productsByLevel4AndStore(unifiedParams);
                  console.log('Using level4 and store API for category page with params:', unifiedParams);
                  console.log('Fetching from URL:', url);
                  
                  const response = await fetch(url);
                  
                  if (response.ok) {
                    const data = await response.json();
                    console.log('Level4 and Store API Response (category page):', data);
                    
                    if (data.success && data.data) {
                      if (currentPage === 1) {
                        // Use category data from API response or fetched data
                        const categoryData = data.data.category || level4CategoryData;
                        if (categoryData) {
                          setBrandInfo(categoryData);
                        }
                        
                        // Extract level2 from first product for breadcrumb
                        const firstProduct = data.data.products?.[0];
                        if (firstProduct?.level2) {
                          const level2Entry = buildLevel2Entry(firstProduct.level2);
                          if (level2Entry?.name) {
                            setLevel2Category(level2Entry);
                            console.log('Extracted level2 from product for category page:', level2Entry.name);
                          }
                        }
                      }
                      
                      // Products are already filtered by store_id in the API
                      const newProducts = data.data.products || [];
                      console.log('Received products:', newProducts.length);
                      setBrandProducts(newProducts);
                      
                      const pagination = data.data.pagination;
                      setPaginationInfo(pagination || null);
                    } else {
                      console.warn('API response not successful:', data);
                      setBrandProducts([]);
                    }
                  } else {
                    console.error('Level4 and Store API error:', response.status, response.statusText);
                    const errorText = await response.text();
                    console.error('Error response body:', errorText);
                    setBrandProducts([]);
                  }
                  
                  setLoadingProducts(false);
                  isFetchingRef.current = false;
                  return; // Exit early since we've handled the request
                }
              }
              
              // Fallback to old endpoint if we don't have both level4 ID and store ID
              // Build filter params
              const params = new URLSearchParams()
              
              // Add pagination params
              params.append('page', currentPage.toString())
              params.append('limit', '20')
              
              // Add sort parameter
              params.append('sort', sortBy)
              
              // Price filter
              if (debouncedFilters.price?.min !== undefined && debouncedFilters.price?.min !== '') {
                params.append('min_price', debouncedFilters.price.min)
              }
              if (debouncedFilters.price?.max !== undefined && debouncedFilters.price?.max !== '') {
                params.append('max_price', debouncedFilters.price.max)
              }
              
              // Availability filter
              if (debouncedFilters.availability instanceof Set) {
                if (debouncedFilters.availability.has('in') && !debouncedFilters.availability.has('out')) {
                  params.append('in_stock', 'true')
                } else if (debouncedFilters.availability.has('out') && !debouncedFilters.availability.has('in')) {
                  params.append('in_stock', 'false')
                }
              }
              
              // Rating filter
              if (typeof debouncedFilters.rating === 'number') {
                params.append('min_rating', debouncedFilters.rating)
              }
              
              // Brand filter from filters (multiple)
              if (debouncedFilters.brand instanceof Set && debouncedFilters.brand.size > 0) {
                Array.from(debouncedFilters.brand).forEach(b => params.append('brand_id', b))
              }
              
              // Store filter from query params (when clicking icon)
              if (storeId) {
                params.append('store_id', storeId)
              }
              
              // Store type filter (hypermarket, supermarket, e-shop) - filters by level1 category
              if (storeType) {
                params.append('storeType', storeType)
              }
              
              // Dynamic attribute filters (attr.*)
              Object.keys(debouncedFilters).forEach(key => {
                if (key.startsWith('attr.')) {
                  const attrKey = key.substring(5)
                  const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
                  values.forEach(v => params.append(`attr_${attrKey}`, v))
                }
              })
              
              // Dynamic specification filters (spec.*)
              Object.keys(debouncedFilters).forEach(key => {
                if (key.startsWith('spec.')) {
                  const specKey = key.substring(5)
                  const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
                  values.forEach(v => params.append(`spec_${specKey}`, v))
                }
              })
              
              // Fetch category products with filters
              let categorySlug = slug;
              if (level4CategoryId && categoryLevel === '4') {
                params.append('level4', level4CategoryId);
              }
              
              const url = params.toString() 
                ? `${catalog.productsByLevel4Category(categorySlug)}?${params.toString()}`
                : catalog.productsByLevel4Category(categorySlug)
              
              console.log('Fetching category products with URL (fallback):', url);
              console.log('Category Level:', categoryLevel);
              console.log('Slug:', slug);
              
              const response = await fetch(url)

              if (response.ok) {
                const data = await response.json()
                console.log('Category API Response:', data)

                if (data.success && data.data) {
                  if (currentPage === 1) {
                    const categoryData = data.data.category || level4CategoryData;
                    if (categoryData) {
                      // Always try to extract level2 from first product for breadcrumb
                      const firstProduct = data.data.products?.[0];
                      if (firstProduct?.level2) {
                        const level2Entry = buildLevel2Entry(firstProduct.level2);
                        if (level2Entry?.name) {
                          setLevel2Category(level2Entry);
                          console.log('Extracted level2 from product for category page:', level2Entry.name);
                          
                          // Also add level2 to category path if not present
                          if (categoryData && (!categoryData.path?.level2 || categoryData.path.level2.length === 0)) {
                            if (!categoryData.path) {
                              categoryData.path = {};
                            }
                            if (!categoryData.path.level2) {
                              categoryData.path.level2 = [];
                            }
                            if (!categoryData.path.level2.includes(level2Entry.name)) {
                              categoryData.path.level2.push(level2Entry.name);
                            }
                          }
                        }
                      }
                      setBrandInfo(categoryData) // Category info with enhanced path
                    }
                  }
                  
                  let newProducts = data.data.products || []
                  
                  // Filter products by store_id if storeId is present
                  if (storeId && newProducts.length > 0) {
                    newProducts = newProducts.filter(product => {
                      // Check if product has store_id and it matches the current storeId
                      const productStoreId = product.store_id?._id || product.store_id;
                      return productStoreId === storeId || String(productStoreId) === String(storeId);
                    });
                    console.log(`Filtered products by store_id ${storeId}: ${newProducts.length} products found`);
                  }
                  
                  setBrandProducts(newProducts)

                  const pagination = data.data.pagination
                  setPaginationInfo(pagination || null)
                }
              }
            } catch (error) {
              console.error('Error fetching category products:', error);
              setBrandProducts([]);
            } finally {
              setLoadingProducts(false);
              isFetchingRef.current = false;
            }
          } else {
            setIsStore(false)
            setIsCategory(false)
            
            // Build filter params for brand
            const params = new URLSearchParams()
            
            // Add pagination params
            params.append('page', currentPage.toString())
            params.append('limit', '20')
            
            // Add sort parameter
            params.append('sort', sortBy)
            
            // Price filter
            if (debouncedFilters.price?.min !== undefined && debouncedFilters.price?.min !== '') {
              params.append('min_price', debouncedFilters.price.min)
            }
            if (debouncedFilters.price?.max !== undefined && debouncedFilters.price?.max !== '') {
              params.append('max_price', debouncedFilters.price.max)
            }
            
            // Availability filter
            if (debouncedFilters.availability instanceof Set) {
              if (debouncedFilters.availability.has('in') && !debouncedFilters.availability.has('out')) {
                params.append('in_stock', 'true')
              } else if (debouncedFilters.availability.has('out') && !debouncedFilters.availability.has('in')) {
                params.append('in_stock', 'false')
              }
            }
            
            // Rating filter
            if (typeof debouncedFilters.rating === 'number') {
              params.append('min_rating', debouncedFilters.rating)
            }
            
            // Store filter (multiple)
            if (debouncedFilters.store instanceof Set && debouncedFilters.store.size > 0) {
              Array.from(debouncedFilters.store).forEach(s => params.append('store_id', s))
            }
            
            // Dynamic attribute filters (attr.*)
            Object.keys(debouncedFilters).forEach(key => {
              if (key.startsWith('attr.')) {
                const attrKey = key.substring(5)
                const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
                values.forEach(v => params.append(`attr_${attrKey}`, v))
              }
            })
            
            // Dynamic specification filters (spec.*)
            Object.keys(debouncedFilters).forEach(key => {
              if (key.startsWith('spec.')) {
                const specKey = key.substring(5)
                const values = debouncedFilters[key] instanceof Set ? Array.from(debouncedFilters[key]) : []
                values.forEach(v => params.append(`spec_${specKey}`, v))
              }
            })
            
            // Fetch brand data with filters
            const url = params.toString() 
              ? `${catalog.base}/products/brand/${slug}?${params.toString()}`
              : `${catalog.base}/products/brand/${slug}`
            
            const response = await fetch(url)

            if (response.ok) {
              const data = await response.json()
              console.log('Brand API Response:', data)

              if (data.success && data.data) {
                if (currentPage === 1) {
                  setBrandInfo(data.data.brand)
                  
                  // Extract level2 from first product for breadcrumb
                  const firstProduct = data.data.products?.[0];
                  if (firstProduct?.level2) {
                    const level2Entry = buildLevel2Entry(firstProduct.level2);
                    if (level2Entry?.name) {
                      setLevel2Category(level2Entry);
                      console.log('Extracted level2 from product for brand page:', level2Entry.name);
                    }
                  }
                }
                
                let newProducts = data.data.products || []
                
                // Filter products by store_id if storeId is present (when on a store page)
                if (storeId && newProducts.length > 0) {
                  newProducts = newProducts.filter(product => {
                    // Check if product has store_id and it matches the current storeId
                    const productStoreId = product.store_id?._id || product.store_id;
                    return productStoreId === storeId || String(productStoreId) === String(storeId);
                  });
                  console.log(`Filtered products by store_id ${storeId}: ${newProducts.length} products found`);
                }
                
                setBrandProducts(newProducts)

                const pagination = data.data.pagination
                setPaginationInfo(pagination || null)
              }
            }
          }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoadingProducts(false)
        isFetchingRef.current = false
      }
    }

    fetchData()
  }, [slug, storeId, categoryLevel, categoryId, source, debouncedFilters, currentPage, sortBy])

  // Transform API data
  const transformedProducts = brandProducts.map(transformProductData)

  // Build facets from filter API response for category, brand, or store pages
  const facets = useMemo(() => {
    console.log('Building facets with filterData:', filterData, 'isStore:', isStore, 'isCategory:', isCategory)
    if (isCategory && filterData) {
      const result = buildFacetsFromCategoryFilters(filterData)
      console.log('Category facets result:', result)
      return result
    } else if (isStore && filterData) {
      const result = buildFacetsFromStoreFilters(filterData)
      console.log('Store facets result:', result)
      return result
    } else if (!isStore && !isCategory && filterData) {
      // It's a brand page
      const result = buildFacetsFromBrandFilters(filterData)
      console.log('Brand facets result:', result)
      return result
    }
    console.log('No filter data, returning empty facets')
    return []
  }, [isCategory, isStore, filterData])

  const totalResults = useMemo(() => {
    if (typeof paginationInfo?.total === 'number') {
      return paginationInfo.total
    }
    return brandProducts.length
  }, [paginationInfo?.total, brandProducts.length])

  const totalPages = useMemo(() => {
    if (paginationInfo?.pages) {
      return Math.max(1, paginationInfo.pages)
    }

    if (paginationInfo?.total) {
      return Math.max(1, Math.ceil(paginationInfo.total / 20))
    }

    return 1
  }, [paginationInfo])

  // Calculate the range of products displayed on current page
  const productRange = useMemo(() => {
    if (totalResults === 0 || brandProducts.length === 0) {
      return { start: 0, end: 0 }
    }
    const pageSize = 20
    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalResults)
    return { start, end }
  }, [currentPage, totalResults, brandProducts.length])

  const pageNumbers = useMemo(() => {
    // Show only 3 buttons at a time with sliding window
    if (totalPages <= 3) {
      // If total pages is 3 or less, show all
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }
    
    // Calculate which 3 pages to show based on current page
    let startPage
    
    if (currentPage <= 2) {
      // On page 1 or 2, show 1, 2, 3
      startPage = 1
    } else {
      // On page 3 or more, show current-1, current, current+1
      // But if we're near the end, adjust to show the last 3 pages
      startPage = Math.min(currentPage - 1, totalPages - 2)
    }
    
    // Generate the 3 page numbers
    const pages = []
    for (let i = 0; i < 3 && (startPage + i) <= totalPages; i++) {
      pages.push(startPage + i)
    }
    
    return pages
  }, [totalPages, currentPage])

  const handlePageChangeLocal = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return
    }
    setCurrentPage(page)
    // Scroll window to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Scroll the products container to top as well
    if (productsScrollContainerRef.current) {
      productsScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Scroll to top when page changes and after products load
  useEffect(() => {
    if (!loadingProducts && brandProducts.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Scroll window to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Scroll the products container to top
        if (productsScrollContainerRef.current) {
          productsScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 100)
    }
  }, [currentPage, loadingProducts, brandProducts.length])

  const handlePreviousPage = () => handlePageChangeLocal(currentPage - 1)
  const handleNextPage = () => handlePageChangeLocal(currentPage + 1)

  const handleFilterChange = (key, value) => {
    console.log('Filter changed:', key, value)
    setSelectedFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      console.log('New selected filters:', newFilters)
      return newFilters
    })
  }

  const handleClearFilters = () => {
    setSelectedFilters({})
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handleBack = () => {
    router.push('/')
  }

  // Build breadcrumb path from available data
  useEffect(() => {
    const buildBreadcrumb = () => {
      const path = []
      path.push({ label: 'Discovery', href: '/' })

      // Helper function to create slug from name
      const createSlugFromName = (name) => {
        if (!name) return null
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }

      // For level2 categories, navigate to category page (shows level4 categories) not product listing
      // Try to get slug from brandInfo.level2 object
      const level2SlugFromBrand =
        brandInfo?.level2 &&
        typeof brandInfo.level2 !== 'string' &&
        brandInfo.level2?.slug
          ? `/category/${brandInfo.level2.slug}`
          : null
      
      // Try to get slug from level2Category state
      const level2SlugFromState = level2Category?.slug ? `/category/${level2Category.slug}` : null
      
      // Try to get slug from brandInfo.level2 if it's an object with slug
      const level2SlugFromBrandObject = 
        brandInfo?.level2 &&
        typeof brandInfo.level2 === 'object' &&
        brandInfo.level2?.slug
          ? `/category/${brandInfo.level2.slug}`
          : null
      
      // Get level2 name for fallback slug generation
      let level2NameForSlug = null
      if (brandInfo?.level2) {
        if (typeof brandInfo.level2 === 'string') {
          level2NameForSlug = brandInfo.level2
        } else if (brandInfo.level2?.name) {
          level2NameForSlug = brandInfo.level2.name
        }
      } else if (level2Category?.name) {
        level2NameForSlug = level2Category.name
      } else if (brandInfo?.path?.level2 && Array.isArray(brandInfo.path.level2) && brandInfo.path.level2.length > 0) {
        level2NameForSlug = brandInfo.path.level2[0]
      }
      
      // Create fallback href from name if we have name but no slug
      const level2HrefFromName = level2NameForSlug ? `/category/${createSlugFromName(level2NameForSlug)}` : null
      
      // Priority: slug from brandInfo.level2 object > slug from level2Category > slug from name
      const level2Href = level2SlugFromBrand || level2SlugFromState || level2SlugFromBrandObject || level2HrefFromName || null

      if (isStore && brandInfo) {
        // Only show level2Category if we're not on a level4 page or if we have proper store data
        if (level2Category?.name && categoryLevel !== '4') {
          path.push({
            label: level2Category.name,
            href: level2Href
          })
        }
        path.push({
          label: brandInfo.name || 'Store',
          href: null
        })
      } else if (isCategory && brandInfo && !isStore) {
        let level2Name = null
        let level4Name = null

        // For level4 pages, prioritize brandInfo data over stale level2Category
        if (categoryLevel === '4') {
          // Only use level2Category if brandInfo doesn't have level2 data
          if (brandInfo.path?.level2 && Array.isArray(brandInfo.path.level2) && brandInfo.path.level2.length > 0) {
            level2Name = brandInfo.path.level2[0]
          } else if (brandInfo.level2) {
            if (typeof brandInfo.level2 === 'string') {
              level2Name = brandInfo.level2
            } else if (brandInfo.level2?.name) {
              level2Name = brandInfo.level2.name
            }
          }
          // Don't use level2Category for level4 pages to avoid showing stale data
        } else {
          // For non-level4 pages, use normal logic
          if (brandInfo.path?.level2 && Array.isArray(brandInfo.path.level2) && brandInfo.path.level2.length > 0) {
            level2Name = brandInfo.path.level2[0]
          } else if (brandInfo.level2) {
            if (typeof brandInfo.level2 === 'string') {
              level2Name = brandInfo.level2
            } else if (brandInfo.level2?.name) {
              level2Name = brandInfo.level2.name
            }
          } else if (level2Category?.name) {
            level2Name = level2Category.name
          }
        }

        if (brandInfo.path?.level4 && Array.isArray(brandInfo.path.level4) && brandInfo.path.level4.length > 0) {
          level4Name = brandInfo.path.level4[0]
        } else if (brandInfo.level4) {
          if (typeof brandInfo.level4 === 'string') {
            level4Name = brandInfo.level4
          } else if (brandInfo.level4?.name) {
            level4Name = brandInfo.level4.name
          }
        } else if (brandInfo.name) {
          level4Name = brandInfo.name
        }

        if (level2Name) {
          // Ensure we have a href for level2 - prioritize existing href, otherwise create from level2Name
          let finalLevel2Href = level2Href
          // If we don't have a href yet, create one from the level2Name
          // This handles cases where level2Name comes from brandInfo.path.level2[0] (string array)
          if (!finalLevel2Href) {
            finalLevel2Href = `/category/${createSlugFromName(level2Name)}`
          }
          path.push({
            label: level2Name,
            href: finalLevel2Href
          })
        }

        if (level4Name) {
          path.push({
            label: level4Name,
            href: slug ? `/${slug}` : null
          })
        }

        if (path.length === 1 && brandInfo.name) {
          path.push({
            label: brandInfo.name,
            href: null
          })
        }
      } else if (brandInfo && !isStore && !isCategory) {
        // Only show level2Category if we're not on a level4 page
        if (level2Category?.name && categoryLevel !== '4') {
          path.push({
            label: level2Category.name,
            href: level2Href
          })
        }
        path.push({
          label: brandInfo.name || 'Brand',
          href: null
        })
      }

      setBreadcrumbPath(path)
    }
    
    if (brandInfo || isStore || isCategory) {
      buildBreadcrumb()
    }
  }, [brandInfo, isStore, isCategory, level2Category, categoryLevel, slug])

  return (
    <main className="home-page">
      <Navigation />
      {/* Products Section */}
      <section className="section">
        <div className="container breadcrumb-container">
          {/* Breadcrumb */}
          {breadcrumbPath.length > 0 && (
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <ol className="breadcrumb-list">
                {breadcrumbPath.map((item, index) => (
                  <li key={index} className="breadcrumb-item">
                    {index > 0 && <span className="breadcrumb-separator">/</span>}
                    {item.href ? (
                      <a 
                        href={item.href} 
                        onClick={(e) => {
                          e.preventDefault()
                          router.push(item.href)
                        }}
                        className="breadcrumb-link"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span className="breadcrumb-current">{item.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="listing-layout">
            {/* Sticky Filter Sidebar - Always display filters */}
            <aside className="filters-sidebar">
              <FilterDrawer 
                open={true} 
                inline 
                sticky 
                stickyTop={112} 
                facets={facets}
                selected={selectedFilters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
                onClose={() => { }} 
              />
            </aside>

            {/* Main Content Area */}
            <div className="content-area">
              <div className="section-header sticky-header">
                <div className="section-actions">
                  {isMobile && (
                    <button 
                      className="filter-button-mobile"
                      onClick={() => setFilterOpen(true)}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M2.5 5H17.5M5 10H15M7.5 15H12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Filter
                    </button>
                  )}
                  <SortDropdown 
                    currentSort={sortBy}
                    onSortChange={handleSortChange}
                  />
                </div>
              </div>

              {loadingProducts ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading products...</p>
                </div>
              ) : transformedProducts.length > 0 ? (
                <div className="products-scroll-container" ref={productsScrollContainerRef}>
                  <div className={`grid-3 ${isMobile ? 'grid-mobile-column' : ''}`}>
                    {transformedProducts.map((product, index) => (
                      <div key={product.id || index} className="grid-item">
                        <ProductCard {...product} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-products">
                  <p>No products found for this {isStore ? 'store' : isCategory ? 'category' : 'brand'}.</p>
                </div>
              )}

              {!loadingProducts && transformedProducts.length > 0 && totalPages > 1 && (
                <div className="pagination-wrapper">
                  <div className="pagination-controls" role="navigation" aria-label="Products pagination">
                    <button
                      type="button"
                      className="pagination-button"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    {pageNumbers.map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChangeLocal(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="pagination-button"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                  {totalResults > 0 && (
                    <span className="pagination-count">
                      {productRange.start} - {productRange.end} products out of {totalResults}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Drawer for small screens - Always display filters */}
      <FilterDrawer 
        open={filterOpen} 
        onClose={() => setFilterOpen(false)} 
        facets={facets}
        selected={selectedFilters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <Footer />

      <style jsx>{`
        .home-page .section {
          padding-top: 16px;
        }

        .breadcrumb-container {
          padding-top: 0;
          padding-bottom: 4px;
        }

        .breadcrumb {
          margin-bottom: 4px;
          padding: 0;
          margin-top: 0;
        }

        .breadcrumb-list {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          list-style: none;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.5;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          margin: 0;
          padding: 0;
        }

        .breadcrumb-separator {
          margin: 0 0;
          color: #6b7280;
          font-size: 12px;
        }

        .breadcrumb-link {
          color: #0082FF;
          font-weight: 600;
          font-size: 12px;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .breadcrumb-current:hover, .breadcrumb-link:hover {
          color: #0066cc;
          text-decoration: underline;
        }

        .breadcrumb-current {
          color: #0082FF;
          font-weight: 600;
          font-size: 12px;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .listing-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          min-height: calc(100vh - 200px);
        }
        
        .filters-sidebar {
          position: sticky;
          top: 112px; /* below fixed navbar */
          width: 320px;
          flex-shrink: 0;
          z-index: 10;
          height: fit-content;
          max-height: calc(100vh - 112px);
          overflow-y: auto;
           /* Hide scrollbar, keep scroll functionality */
           -ms-overflow-style: none; /* IE and Edge */
           scrollbar-width: none; /* Firefox */
        }
         .filters-sidebar::-webkit-scrollbar { display: none; }

        /* Mobile styles */
        @media (max-width: 767px) {
          .filters-sidebar {
            display: none;
          }
          .section-actions {
            display: flex;
            gap: 12px;
            align-items: center;
          }

          .filter-button-mobile {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 8px 16px;
            background: #0082FF;
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            height: 40px;
            min-width: 120px;
            flex: 1;
          }

          .filter-button-mobile:hover {
            background: #0066CC;
          }

          .filter-button-mobile svg {
            width: 18px;
            height: 18px;
          }

          /* Make SortDropdown button match filter button size */
          .section-actions :global(.sort-dropdown) {
            flex: 1;
          }

          .section-actions :global(.sort-dropdown .sort-button) {
            height: 40px !important;
            width: 100% !important;
            min-width: 150px !important;
            padding: 8px 16px !important;
            font-size: 14px !important;
            border-radius: 25px !important;
          }

          .grid-mobile-column {
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: center;
            width: 100%;
            padding: 0;
          }
          .grid-mobile-column .grid-item { 
            width: 100%;
            max-width: 100%;
            display: flex;
            justify-content: center;
          }

          /* Center align container content in mobile with equal padding */
          .container {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
            .products-scroll-container{
              padding-right: 0px !important;
            }
          .listing-layout {
            padding: 0;
          }

          .content-area {
            padding: 0;
          }
        }

        .content-area { 
          flex: 1;
          min-width: 0; /* allows flex item to shrink below content size */
        }
        
        .products-scroll-container {
          width: 100%;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          padding-right: 8px; /* space for scrollbar */
           /* Hide scrollbar, keep scroll functionality */
           -ms-overflow-style: none; /* IE and Edge */
           scrollbar-width: none; /* Firefox */
        }
         .products-scroll-container::-webkit-scrollbar { display: none; }
        
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          padding-bottom: 0; /* extra space at bottom */
          justify-items: center; /* center items within grid cells */
        }
        
        .grid-item { 
          display: flex; 
          justify-content: center; 
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 48px 0;
          color: #6b7280;
        }

        .loading-container .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #111827;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .no-products {
          text-align: center;
          padding: 48px 0;
          color: #6b7280;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .pagination-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-top: 32px;
        }

        .pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pagination-count {
          color: #6b7280;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 14px;
          font-weight: 400;
          line-height: 140%;
          white-space: nowrap;
        }

        .pagination-button {
          min-width: 40px;
          padding: 8px 12px;
          border: 1px solid #0082FF;
          border-radius: 8px;
          background: #ffffff;
          color: #0082FF;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pagination-button:hover:not(:disabled) {
          border-color: #0082FF;
          color: #0082FF;
          background: #f9fafb;
        }

        .pagination-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .pagination-button.active {
          background: #0082FF;
          color: #ffffff;
          border-color: none;
        }

        @media (max-width: 1024px) {
          .listing-layout { 
            flex-direction: column; 
            gap: 16px;
          }
          
          .filters-sidebar { 
            position: relative; 
            top: 0; 
            width: 100%; 
            z-index: 1;
            max-height: none;
            overflow-y: visible;
          }
          
          .grid-3 { 
            grid-template-columns: repeat(2, minmax(0, 1fr)); 
            gap: 16px;
          }
        }
        
        @media (max-width: 640px) {
          .grid-3 { 
            grid-template-columns: 1fr; 
            gap: 16px;
          }
        }

        .section-header {
          display: flex;
          width: 100%;
          max-width: 1392px;
          justify-content: flex-end;
          align-items: center;
          margin-bottom: 24px;
          padding-right: 24px;
          padding-left: 24px;
        }

        .section-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          margin-left: auto;
        }

        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 5;
          background: #ffffff;
        }

        @media (max-width: 768px) {
          .section-header {
            justify-content: flex-start;
          }
          
          .pagination-count {
            font-size: 13px;
          }

          /* Ensure product grid stays centered on mobile */
          .products-scroll-container {
            display: flex;
            justify-content: center;
          }

          .grid-3 {
            width: 100%;
            max-width: 520px;
            justify-items: center;
          }

          .grid-item {
            width: 100%;
            max-width: 360px;
          }
        }
      `}</style>
    </main>
  )
}
