import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { catalog } from '../../store/api/endpoints';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, fetchCart } from '../../store/slices/cartSlice';
import { getUserFromCookies } from '../../utils/userUtils';
import { useToast } from '../../contexts/ToastContext';

export default function OtherSellersDrawer({ open, onClose, productId }) {
    const router = useRouter();
    const { requireAuth } = useAuth();
    const dispatch = useDispatch();
    const { show } = useToast();
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addingToCart, setAddingToCart] = useState({});
    
    // Get cart items to check if products are already in cart
    const { items: cartItems } = useSelector(state => state.cart);

    useEffect(() => {
        console.log('🔍 OtherSellersDrawer useEffect triggered:', { open, productId });
        if (open) {
            document.body.style.overflow = 'hidden';
            if (productId) {
                console.log('🚀 Opening drawer and fetching sellers for productId:', productId);
                fetchOtherSellers();
            } else {
                console.log('⚠️ Drawer opened but no productId provided');
            }
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, productId]);

    const fetchOtherSellers = async () => {
        console.log('🔄 fetchOtherSellers called with productId:', productId);
        setLoading(true);
        try {
            // Use the new similar products API endpoint
            const apiUrl = catalog.similarProducts(productId, 10);
            console.log('📡 Making API call to:', apiUrl);
            const response = await axios.get(apiUrl);
            console.log('✅ API response received:', response.data);
            const data = response.data.data;
            
            // Transform API data to match UI format
            const transformedSellers = [];

            // Add similar products from other sellers
            if (data.products && data.products.length > 0) {
                data.products.forEach(product => {
                    transformedSellers.push(transformProduct(product));
                });
            }

            setSellers(transformedSellers);
        } catch (error) {
            console.error('❌ Error fetching similar products from other sellers:', error);
            console.error('❌ Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });
            setSellers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (seller, e) => {
        e.stopPropagation();
        
        // Check if product is already in cart
        const isInCart = cartItems.some(item => item.productId === seller.id);
        if (isInCart) {
            show('Item already in cart');
            return;
        }
        
        // Set loading state for this specific product
        setAddingToCart(prev => ({ ...prev, [seller.id]: true }));
        
        requireAuth(async () => {
            try {
                const userId = await getUserFromCookies();
                
                const parsedPrice = typeof seller.price === 'string' ? Number(String(seller.price).replace(/[^0-9.]/g, '')) : seller.price;
                const priceWithVat = seller.price_with_vat ?? seller.originalPrice ?? parsedPrice;
                const discountPriceWithVat = seller.discount_price_with_vat ?? seller.discountPrice;
                const effectiveVat = (discountPriceWithVat != null && Number(discountPriceWithVat) > 0) ? discountPriceWithVat : priceWithVat;
                const dVat = (discountPriceWithVat != null && Number(discountPriceWithVat) > 0) ? discountPriceWithVat : effectiveVat;
                const cartItem = {
                    userId,
                    productId: seller.id,
                    name: seller.title,
                    price: effectiveVat,
                    quantity: 1,
                    image: seller.image,
                    price_with_vat: priceWithVat,
                    discount_price_with_vat: dVat
                };
                
                console.log('🛒 Adding to cart:', cartItem);
                console.log('🛒 Seller data:', seller);
                console.log('🛒 Cart item structure:', {
                    userId: typeof cartItem.userId,
                    productId: typeof cartItem.productId,
                    name: typeof cartItem.name,
                    price: typeof cartItem.price,
                    quantity: typeof cartItem.quantity,
                    image: typeof cartItem.image
                });
                
                const result = await dispatch(addToCart(cartItem));
                if (addToCart.fulfilled.match(result)) {
                    show('Added to cart');
                    // Refresh cart data
                    dispatch(fetchCart(userId));
                } else if (addToCart.rejected.match(result)) {
                    show('Failed to add to cart', 'error');
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                show('Failed to add to cart', 'error');
            } finally {
                // Clear loading state for this product
                setAddingToCart(prev => ({ ...prev, [seller.id]: false }));
            }
        });
    };

    const transformProduct = (product) => {
        const finalPrice = product.discount_price || product.price;
        const discount = product.discount_price 
            ? Math.round(((product.price - product.discount_price) / product.price) * 100)
            : 0;

        const deliveryDate = getDeliveryDate();
        const orderTime = '2-3 days';
        
        // Calculate positive percentage based on rating (default to 85% if no rating)
        const positive = product.average_rating 
            ? Math.round((product.average_rating / 5) * 100)
            : 85; // Default positive rating

        const warranty = product.warranty_period 
            ? `${product.warranty_period} ${product.warranty_type || ''}`
            : '1 year warranty'; // Default warranty

        return {
            id: product._id,
            _id: product._id,
            title: product.title,
            price: finalPrice,
            discount: discount,
            orderTime: orderTime,
            rating: product.average_rating || 4.2, // Default rating
            deliveryDate: deliveryDate,
            positive: positive,
            sellerName: product.store?.name || 'Unknown Store',
            warranty: warranty,
            stock: product.stock_quantity || 0,
            productData: product,
            similarityScore: product.similarityScore || 0,
            brand: product.brand?.name || 'Unknown Brand',
            image: product.images?.[0]?.url || '/placeholder.jpg',
            category: product.level1_category?.name || 'Unknown Category'
        };
    };

    const getDeliveryDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 3);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleProductClick = (seller) => {
        const productSlug = seller.productData?.slug || seller.slug;
        const productId = seller.id || seller._id;
        
        if (productSlug && productId) {
            // Close the drawer first
            onClose();
            // Navigate to product PDP page
            router.push(`/product/${productSlug}?pid=${productId}`);
        }
    };


    if (!open) return null;

    return (
        <div className="other-sellers-drawer-overlay">
            <div className="other-sellers-drawer">
                <div className="drawer-header">
                    <div className="drawer-title-section">
                        <span className="drawer-title">Similar Products</span>
                        <span className="drawer-subtitle">From other sellers</span>
                    </div>
                    <button className="drawer-close" onClick={onClose}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="14" fill="#F5F5F5" />
                            <path d="M9 9L19 19M19 9L9 19" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <div className="drawer-content">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading similar products...</p>
                        </div>
                    ) : sellers.length === 0 ? (
                        <div className="empty-state">
                            <p>No similar products found from other sellers</p>
                            <p className="empty-subtitle">Try searching for different products or check back later</p>
                        </div>
                    ) : (
                        sellers.map((seller, idx) => (
                            <div className="seller-card" key={idx}>
                                <div className="product-info">
                                    <span 
                                        className="product-title" 
                                        onClick={() => handleProductClick(seller)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {seller.productData.title}
                                    </span>
                                    <span className="product-brand">{seller.brand} • {seller.category}</span>
                                    {seller.similarityScore > 0 && (
                                        <span className="similarity-badge">
                                            {seller.similarityScore >= 200 ? 'Highly Similar' : 'Similar'}
                                        </span>
                                    )}
                                </div>
                                <div className="seller-row">
                                    <span className="seller-price">AED {seller.price}</span>
                                    <span className="seller-discount">{seller.discount}% off</span>
                                </div>
                                <div className="seller-row">
                                    <span className="seller-order">Order in {seller.orderTime}</span>
                                    <span className="seller-star">
                                        <svg width="24px" height="24px" viewBox="0 0 20 20" fill="#0082FF">
                                            <path d="M10 15.0742L12.4208 16.5384C12.8635 16.8067 13.406 16.41 13.2894 15.9084L12.6477 13.155L14.7885 11.3C15.1794 10.9617 14.9694 10.32 14.456 10.2792L11.6385 10.04L10.536 7.43836C10.3377 6.96586 9.66104 6.96586 9.4627 7.43836L8.3602 10.0342L5.5427 10.2734C5.02937 10.3142 4.81937 10.9559 5.2102 11.2942L7.35104 13.1492L6.70937 15.9025C6.5927 16.4042 7.1352 16.8009 7.57854 16.5325L10 15.0742Z" />
                                        </svg>
                                        <span className="seller-rating">{seller.rating}</span>
                                    </span>
                                </div>
                                <div className="seller-row seller-sub">
                                    <span className="seller-delivery">Get it by {seller.deliveryDate}</span>
                                    <span className="seller-positive">{seller.positive}% Positive</span>
                                </div>
                                <div className="seller-row seller-sub">
                                    <span className="seller-label">Sold by</span>
                                    <span className="seller-label">Warranty</span>
                                </div>
                                <div className="seller-row seller-sub">
                                    <span className="seller-value">{seller.sellerName}</span>
                                    <span className="seller-value">{seller.warranty}</span>
                                </div>
                                <button 
                                    className="seller-add-cart" 
                                    onClick={(e) => handleAddToCart(seller, e)}
                                    disabled={addingToCart[seller.id] || cartItems.some(item => item.productId === seller.id)}
                                >
                                    {addingToCart[seller.id] ? 'Adding...' : 
                                     cartItems.some(item => item.productId === seller.id) ? 'Added To Cart' : 
                                     'Add To Cart'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <style jsx>{`
        .other-sellers-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.08);
          z-index: 9999;
          display: flex;
          justify-content: flex-end;
        }
        .other-sellers-drawer {
          background: #fff;
          width: 600px;
          max-width: 100vw;
          height: 100vh;
          box-shadow: -2px 0 16px rgba(0,0,0,0.08);
          border-radius: 0 0 0 0;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.25s cubic-bezier(.4,0,.2,1);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 16px;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0082FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loading-container p {
          color: #666;
          font-size: 16px;
          font-weight: 500;
        }
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .empty-state p {
          color: #999;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .empty-subtitle {
          color: #bbb !important;
          font-size: 14px !important;
          margin-bottom: 0 !important;
        }
        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px 32px 16px 32px;
          border-bottom: 1px solid #555;
        }
        .drawer-title-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .drawer-title {
          font-size: 24px;
          font-weight: 700;
          color: #111;
        }
        .drawer-subtitle {
          font-size: 14px;
          font-weight: 500;
          color: #666;
        }
        .drawer-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .drawer-content {
          padding: 24px 24px 24px 24px;
          overflow-y: auto;
          flex: 1;
        }
        .seller-card {
          margin-bottom: 32px;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 20px;
          background: #fafafa;
        }
        .product-info {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e5e5;
        }
        .product-title {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: #111;
          margin-bottom: 4px;
          line-height: 1.4;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .product-title:hover {
          color: #0082FF;
          text-decoration: underline;
        }
        .product-brand {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          margin-bottom: 8px;
        }
        .similarity-badge {
          display: inline-block;
          background: #0082FF;
          color: white;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          margin-top: 4px;
        }
        .seller-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .seller-price {
          font-size: 20px;
          font-weight: 600;
          color: #000;
          line-height: 140%;
        }
        .seller-discount {
          font-size: 14px;
          font-weight: 600;
          color: #1FC70A;
          margin-left: 8px;
          line-height: 150%;
        }
        .seller-order {
          font-size: 16px;
          font-weight: 600;
          color: #000;
          line-height: 150%;
        }
        .seller-star {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 24px;
          font-weight: 700;
          color: #0082FF;
        }
        .seller-rating {
          font-size: 16px;
          font-weight: 600;
          color: #0082FF;
        }
        .seller-sub {
          color: #000;
          font-weight: 600;
        }
        .seller-delivery {
          font-size: 14px;
          font-weight: 600;
          line-height: 150%;
          color: #000;
          margin-bottom: 8px;
        }
        .seller-positive {
          font-size: 14px;
          font-weight: 600;
          line-height: 150%;
          color: #000;
          margin-bottom: 8px;
        }
        .seller-label {
          font-size: 16px;
          font-weight: 600;
          color: #000;
          line-height: 150%;
        }
        .seller-value {
          font-size: 14px;
          color: #000;
          font-weight: 600;
          line-height: 150%;
        }
        .seller-add-cart {
          width: 100%;
          margin-top: 18px;
          padding: 14px 0;
          background: #CBE6FF;
          color: #0082FF;
          font-size: 18px;
          font-weight: 600;
          border: none;
          border-radius: 24px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .seller-add-cart:hover {
          background: #b3dbff;
        }
        @media (max-width: 600px) {
          .other-sellers-drawer {
            width: 100vw;
            padding: 0;
          }
          .drawer-header {
            padding: 24px 16px 12px 16px;
          }
          .drawer-content {
            padding: 0 8px 16px 8px;
          }
        }
      `}</style>
        </div>
    );
}
