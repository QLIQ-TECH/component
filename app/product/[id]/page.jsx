'use client'
import ProductDetails from '../../../components/productDetailPage/ProductDetails'
import ProductDetailsSkeleton from '../../../components/productDetailPage/ProductDetailsSkeleton'
import { ProductCardSkeleton } from '@/components/SkeletonLoader'
import ProductSections from '../../../components/productDetailPage/ProductSections'
import Navigation from '../../../components/Navigation'
import Footer from '../../../components/Footer'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchProducts } from '@/store/slices/productsSlice'
import { fetchProductDetail, fetchProductVariant, fetchProductVariants, setSelectedAttributes, setProductId } from '@/store/slices/productDetailSlice'
import { generateVariantUrl, findMatchingVariant, transformProductData } from '@/utils/productUtils'
import { getAuthToken } from '@/utils/userUtils'
import { catalog } from '@/store/api/endpoints'

// Mock product data - in a real app this would come from an API
const mockProduct = {
  id: "nike-airforce-01",
  name: "Airforce 01",
  brand: "Nike",
  price: 1200,
  originalPrice: 1600,
  discount: 25,
  rating: 5,
  stock: "In Stock",
  deliveryTime: "Available in 30 Minutes",
  boughtCount: "1000+ Bought in past month",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  images: [
    "/shoes.jpg",
    "/shoes.jpg",
    "/shoes.jpg",
    "/shoes.jpg"

  ],
  colors: ["White", "Black"],
  sizes: ["04", "05", "06", "07", "08"]
}

export default function ProductPage({ params }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const { products, loading, error } = useSelector(state => state.products)
  const { 
    product, 
    parent, 
    variants, 
    variantOptions, 
    selectedVariant, 
    selectedAttributes,
    currentProductId,
    loading: productDetailLoading, 
    error: productDetailError 
  } = useSelector(state => state.productDetail)

  // Extract product ID and slug from URL params
  const productId = searchParams.get('pid') // Only get pid from query params, not from params.id
  const productSlug = params.id

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  useEffect(() => {
    if (productSlug) {
      // Pass id only if it exists, otherwise pass null/undefined
      dispatch(fetchProductDetail({ id: productId || null, slug: productSlug }))
    }
  }, [dispatch, productId, productSlug])

  // Update URL when we get the product ID from API response
  useEffect(() => {
    if (currentProductId && !productId && productSlug) {
      // If we have a product ID from the API but not in the URL, update the URL
      const newUrl = `/product/${productSlug}?pid=${currentProductId}`
      router.replace(newUrl)
    }
  }, [currentProductId, productId, productSlug, router])

  // Fetch variants when we have a product with parent_product_id
  useEffect(() => {
    if (product && product.parent_product_id && variants.length === 0) {
      dispatch(fetchProductVariants(product.parent_product_id))
    }
  }, [dispatch, product, variants.length])

  // Save product to recently viewed when product detail loads
  useEffect(() => {
    const productId = product?._id || currentProductId
    if (!productId) return

    const saveRecentlyViewed = async () => {
      try {
        const token = await getAuthToken()
        await fetch(catalog.saveRecentlyViewed(productId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
      } catch {
        // Silently ignore - recently viewed is non-critical
      }
    }
    saveRecentlyViewed()
  }, [product?._id, currentProductId])

  // Handle variant selection
  const handleVariantChange = (attributeType, value) => {
    dispatch(setSelectedAttributes({ key: attributeType, value }))
    
    // Find the matching variant and navigate to it
    const newAttributes = { ...selectedAttributes, [attributeType]: value }
    const matchingVariant = findMatchingVariant(variants, newAttributes)
    
    if (matchingVariant) {
      // Update URL to the new variant using utility function
      const newUrl = generateVariantUrl(matchingVariant)
      router.push(newUrl)
    }
  }

  // Map the fetched product data to the format expected by ProductDetails (VAT-inclusive prices)
  const priceWithVat = product?.price_with_vat ?? product?.price
  const discountPriceWithVat = product?.discount_price_with_vat ?? product?.discount_price
  const effectivePrice = (discountPriceWithVat != null && discountPriceWithVat > 0) ? discountPriceWithVat : priceWithVat
  const mappedProduct = product ? {
    id: product._id,
    slug: product.slug || params.id,
    name: product.title,
    brand: product.brand_id?.name || 'Brand',
    price: effectivePrice ?? 0,
    originalPrice: priceWithVat ?? 0,
    discount: priceWithVat != null && discountPriceWithVat != null && discountPriceWithVat > 0
      ? Math.round(((priceWithVat - discountPriceWithVat) / priceWithVat) * 100) : 0,
    rating: product.average_rating || 5,
    stock: product.stock_quantity > 0 ? "In Stock" : "Out of Stock",
    deliveryTime: "Available in 30 Minutes",
    boughtCount: `${product.total_reviews || 0}+ Bought in past month`,
    description: product.description || product.short_description || "Product description",
    images: product.images?.map(img => img.url) || ["/shoes.jpg"],
    colors: variantOptions.color && variantOptions.color.length > 1 ? variantOptions.color : 
            (product.variant_attributes?.color ? [product.variant_attributes.color] : []),
    sizes: variantOptions.storage && variantOptions.storage.length > 1 ? variantOptions.storage : 
           (product.variant_attributes?.storage ? [product.variant_attributes.storage] : []),
    // Add variant selection handlers
    onColorChange: (color) => handleVariantChange('color', color),
    onSizeChange: (size) => handleVariantChange('storage', size),
    selectedColor: selectedAttributes.color || product.variant_attributes?.color,
    selectedSize: selectedAttributes.storage || product.variant_attributes?.storage
  } : mockProduct

  // Map API products to the format expected by ProductSections (VAT-inclusive prices)
  const relatedProducts = products && products.length > 0 
    ? products.map(p => {
        const primaryImage = p.images?.find(img => img.is_primary) || p.images?.[0];
        const imageUrl = primaryImage?.url || p.image || p.images?.[0]?.url || 'https://api.builder.io/api/v1/image/assets/TEMP/0ef2d416817956be0fe96760f14cbb67e415a446?width=644';
        const pWithVat = p.price_with_vat ?? p.price
        const dWithVat = p.discount_price_with_vat ?? p.discount_price
        const eff = (dWithVat != null && dWithVat > 0) ? dWithVat : pWithVat
        return {
          id: p._id || p.id,
          slug: p.slug || p._id || p.id,
          title: p.title || p.name || 'Product',
          price: eff != null ? `AED ${eff}` : 'AED 0',
          originalPrice: pWithVat != null ? `AED ${pWithVat}` : null,
          rating: p.average_rating || p.rating || '4.0',
          deliveryTime: p.deliveryTime || '30 Min',
          image: imageUrl
        };
      })
    : [] // Always return an array, even if empty

  return (
    <div className="product-page">
      <Navigation />

      <main className="main-content">
        {productDetailLoading ? (
          <>
            <ProductDetailsSkeleton />
            <div className="related-skeletons">
              {[...Array(6)].map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          </>
        ) : productDetailError ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
            Error loading product: {productDetailError}
          </div>
        ) : (
          <>
            <ProductDetails product={mappedProduct} variants={variants} selectedAttributes={selectedAttributes} />
            <ProductSections 
              relatedProducts={relatedProducts}
              productData={product}
            />
          </>
        )}
      </main>

      <Footer />

      <style jsx>{`
        .product-page {
          min-height: 100vh;
          background: #fafafa;
        }

        .main-content {
          margin-top: 20px;
    
        }
        .related-skeletons {
          max-width: 1392px;
          margin: 0 auto;
          padding: 0 20px 40px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
      `}</style>
    </div>
  )
}
