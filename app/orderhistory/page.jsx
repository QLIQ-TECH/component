'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders } from '../../store/slices/profileSlice';
import { createProductReview, updateProductReview, clearReviewState } from '../../store/slices/reviewSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { getAuthToken, getUserFromCookies } from '../../utils/userUtils';
import { useToast } from '../../contexts/ToastContext';
import { orders as orderEndpoints } from '../../store/api/endpoints';
import Navigation from '@/components/Navigation';
import styles from './orderHistory.module.css';
import Image from 'next/image';

const OrderHistoryPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const productId = searchParams.get('productId');
  const dispatch = useDispatch();
  const { loading: reviewLoading, error: reviewError, success: reviewSuccess, reviews } = useSelector(state => state.review);
  const { show: showToast } = useToast();

  const [rating, setRating] = useState(0);
  const [reviewData, setReviewData] = useState({
    name: '',
    review: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [lastSubmittedHasImages, setLastSubmittedHasImages] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Fetch order by ID directly from API
  useEffect(() => {
    const fetchOrderById = async () => {
      if (!orderId) {
        setOrderData(null);
        return;
      }

      setOrderLoading(true);
      setOrderError(null);

      try {
        const token = await getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(orderEndpoints.getOrderById(orderId), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch order' }));
          throw new Error(errorData.message || `HTTP error ${response.status}`);
        }

        const responseData = await response.json();
        
        if (responseData.success && responseData.data?.order) {
          const order = responseData.data.order;
          console.log('Fetched order from API:', order);
          console.log('Order items:', order.items);
          setOrderData(order);
          
          // Set initial selected product from URL or first item
          if (productId && order.items) {
            const foundItem = order.items.find(item =>
              String(item.productId || item.id || '') === String(productId)
            );
            if (foundItem) {
              setSelectedProductId(foundItem.productId || foundItem.id || productId);
            } else if (order.items.length > 0) {
              setSelectedProductId(order.items[0].productId || order.items[0].id || null);
            }
          } else if (order.items && order.items.length > 0) {
            setSelectedProductId(order.items[0].productId || order.items[0].id || null);
          }
        } else {
          throw new Error('Order not found in response');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setOrderError(error.message || 'Failed to fetch order');
        setOrderData(null);
        showToast(`Error loading order: ${error.message}`, 'error');
      } finally {
        setOrderLoading(false);
      }
    };

    fetchOrderById();
  }, [orderId, productId, showToast]);

  // Fetch existing review for this product
  useEffect(() => {
    const checkExistingReview = async () => {
      try {
        // Use selected product from dropdown first, then productId from URL, then first item
        let actualProductId = null;

        // First, try to get product ID from selectedProductId (dropdown selection)
        if (selectedProductId && orderData?.items) {
          const selectedItem = orderData.items.find(item => {
            const itemProductId = item.productId || item.id;
            return String(itemProductId) === String(selectedProductId);
          });
          if (selectedItem) {
            actualProductId = selectedItem.productId || selectedItem.id;
          }
        }

        // If not found, try productId from URL
        if (!actualProductId && productId && orderData?.items) {
          const urlItem = orderData.items.find(item => {
            const itemProductId = item.productId || item.id;
            return String(itemProductId) === String(productId);
          });
          if (urlItem) {
            actualProductId = urlItem.productId || urlItem.id;
          }
        }

        // If still not found, use first item
        if (!actualProductId && orderData?.items && orderData.items.length > 0) {
          actualProductId = orderData.items[0].productId || orderData.items[0].id;
        }

        if (!actualProductId) {
          console.log('⚠️ No valid product ID found');
          setExistingReview(null);
          setIsEditMode(false);
          setShowEditForm(true);
          return;
        }

        console.log('🔍 Checking for existing review for product:', actualProductId);
        console.log('🔍 Selected Product ID from dropdown:', selectedProductId);

        // Get auth token to identify current user
        const token = await getAuthToken();
        let foundReview = null;

        if (token) {
          try {
            // Get MongoDB user ID from encrypted cookies (this is the correct way)
            const mongoUserId = await getUserFromCookies();
            console.log('🔍 Looking for review with MongoDB user ID:', mongoUserId);

            if (mongoUserId) {
              // Call the API using POST method with body parameters
              const response = await fetch(`https://backendreview.qliq.ae/api/product-reviews/user/product-reviews`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userId: mongoUserId,
                  productId: actualProductId,
                  orderId: orderId || undefined
                })
              });
              const data = await response.json();

              console.log('📝 User product reviews response:', data);

              if (data.success && data.data && data.data.reviews && Array.isArray(data.data.reviews)) {
                // The API now returns only the user's reviews for this product
                foundReview = data.data.reviews.length > 0 ? data.data.reviews[0] : null;
                console.log('🔍 Found review by MongoDB ID:', foundReview ? 'YES' : 'NO');
              }
            }

            // If no review found with MongoDB user ID, try JWT token sub
            if (!foundReview) {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const currentUserId = payload.sub;
                console.log('🔍 Trying JWT sub:', currentUserId);

                // Try the API again with JWT sub as userId
                const response = await fetch(`https://backendreview.qliq.ae/api/product-reviews/user/product-reviews`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    userId: currentUserId,
                    productId: actualProductId,
                    orderId: orderId || undefined
                  })
                });
                const data = await response.json();

                if (data.success && data.data && data.data.reviews && Array.isArray(data.data.reviews)) {
                  foundReview = data.data.reviews.length > 0 ? data.data.reviews[0] : null;
                  console.log('🔍 Found review by JWT sub:', foundReview ? 'YES' : 'NO');
                }
              }
            }
          } catch (error) {
            console.error('❌ Error getting user review:', error);
          }
        } else {
          console.log('⚠️ No auth token available');
        }

        if (foundReview) {
          console.log('✅ Found existing review:', foundReview);

          // Map the review data to match our expected structure
          const mappedReview = {
            id: foundReview.id,
            _id: foundReview.id, // Add _id for compatibility
            userId: foundReview.userId,
            productId: foundReview.productId,
            rating: foundReview.rating,
            title: foundReview.title,
            comment: foundReview.comment,
            images: foundReview.images || [],
            pros: foundReview.pros || [],
            cons: foundReview.cons || [],
            isVerified: foundReview.isVerified || false,
            isHelpful: foundReview.isHelpful || 0,
            status: foundReview.status || 'pending',
            createdAt: foundReview.createdAt,
            updatedAt: foundReview.updatedAt
          };

          setExistingReview(mappedReview);
          setIsEditMode(true);
          setShowEditForm(false); // Show view mode first

          // Populate form data (but don't show form yet)
          setRating(mappedReview.rating);
          setReviewData({
            name: mappedReview.title || '',
            review: mappedReview.comment || ''
          });

          if (mappedReview.images && mappedReview.images.length > 0) {
            setImagePreviews(mappedReview.images);
          }

          console.log('📋 Review data loaded - showing review with edit button');
        } else {
          console.log('ℹ️ No existing review found for this product');
          setExistingReview(null);
          setIsEditMode(false);
          setShowEditForm(true); // Show form to create new review
        }
      } catch (err) {
        console.error('❌ Error checking for existing review:', err);
        setShowEditForm(true); // On error, show form
      }
    };

    if (orderData) {
      checkExistingReview();
    }
  }, [orderData, productId, selectedProductId]);


  // Handle review success
  useEffect(() => {
    if (reviewSuccess) {
      // Check if we're in edit mode to show appropriate message
      if (isEditMode) {
        // Message for update is handled in handleSubmitReview where we have image context
        // This is a fallback in case the update message wasn't shown
        if (!lastSubmittedHasImages) {
          showToast('Review updated successfully (no images)', 'success')
        }
      } else {
        // For new reviews, show message based on whether images were included
        if (lastSubmittedHasImages) {
          showToast('Review submitted successfully with images!', 'success')
        } else {
          showToast('Review submitted successfully (without images)', 'success')
        }
        // After successful creation, refresh to check for existing review
        setReviewData({ name: '', review: '' })
        setRating(0)
        setImageFiles([])
        setImagePreviews([])
        setShowEditForm(false)
        // Reload the page to fetch the newly created review
        window.location.reload()
      }
      // Clear review state
      setTimeout(() => {
        dispatch(clearReviewState())
      }, 2000)
    }
  }, [reviewSuccess, dispatch, showToast, isEditMode, lastSubmittedHasImages])

  // Handle review error
  useEffect(() => {
    if (reviewError) {
      showToast(`Error: ${reviewError}`, 'error')
      dispatch(clearReviewState())
    }
  }, [reviewError, dispatch, showToast])

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);

    // Count existing images (URLs) and new files
    const existingImageCount = imagePreviews.filter(img => typeof img === 'string' && img.startsWith('http')).length;

    if (files.length + imageFiles.length + existingImageCount > 5) {
      showToast('Maximum 5 images allowed per review', 'error');
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      showToast('Only image files are allowed', 'error');
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxFileSize = 5 * 1024 * 1024; // 5MB in bytes
    const oversizedFiles = validFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      showToast('Image too large. Please upload images below 5MB', 'error');
      return;
    }

    if (validFiles.length === 0) {
      return;
    }

    // Add new files to existing files
    setImageFiles(prev => [...prev, ...validFiles]);

    // Create previews
    let loadedCount = 0;
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
        loadedCount++;
        // Show success message when all images are loaded
        if (loadedCount === validFiles.length) {
          if (validFiles.length === 1) {
            showToast('Image added successfully', 'success');
          } else {
            showToast(`${validFiles.length} images added successfully`, 'success');
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    // Check if this is an existing review image (URL) or new upload (File)
    const isExistingImage = typeof imagePreviews[index] === 'string' && imagePreviews[index].startsWith('http');

    if (isExistingImage && isEditMode) {
      // Remove from existing review images
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
      showToast('Image removed. Changes will be saved when you update the review.', 'success');
      // Note: The existing images will be updated when form is submitted
    } else {
      // Remove from new uploads
      // Calculate the correct index for new files (excluding existing images)
      const existingImageCount = imagePreviews.filter(img => typeof img === 'string' && img.startsWith('http')).length;
      const newFileIndex = index - existingImageCount;

      if (newFileIndex >= 0) {
        setImageFiles(prev => prev.filter((_, i) => i !== newFileIndex));
      }
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
      showToast('Image removed successfully', 'success');
    }
  };

  const handleSubmitReview = async () => {
    // Validate required fields
    if (rating === 0) {
      showToast('Please select a rating (1-5 stars)', 'error');
      return;
    }

    if (!reviewData.review || reviewData.review.trim().length === 0) {
      showToast('Please write a review', 'error');
      return;
    }

    // Check if review has images
    const hasImages = imageFiles.length > 0 || imagePreviews.length > 0;
    setLastSubmittedHasImages(hasImages);

    // Use selected product from dropdown first, then productId from URL, then first item
    let actualProductId = null;

    // First, try to get product ID from selectedProductId (dropdown selection)
    if (selectedProductId && orderData?.items) {
      const selectedItem = orderData.items.find(item => {
        const itemProductId = item.productId || item.id;
        return String(itemProductId) === String(selectedProductId);
      });
      if (selectedItem) {
        actualProductId = selectedItem.productId || selectedItem.id;
      }
    }

    // If not found, try productId from URL
    if (!actualProductId && productId && orderData?.items) {
      const urlItem = orderData.items.find(item => {
        const itemProductId = item.productId || item.id;
        return String(itemProductId) === String(productId);
      });
      if (urlItem) {
        actualProductId = urlItem.productId || urlItem.id;
      }
    }

    // If still not found, use first item
    if (!actualProductId && orderData?.items && orderData.items.length > 0) {
      actualProductId = orderData.items[0].productId || orderData.items[0].id;
    }

    if (!actualProductId) {
      showToast('Product MongoDB ID not found. Please contact support.', 'error');
      console.error('Available product data:', orderData?.items);
      return;
    }

    console.log('📝 Submitting review for product ID:', actualProductId);

    console.log(isEditMode ? 'Updating review' : 'Creating review', 'with product ID:', actualProductId);

    if (isEditMode && existingReview) {
      // Update existing review using Redux action
      try {
        // Get existing image URLs from previews
        const existingImageUrls = imagePreviews.filter(url => typeof url === 'string' && url.startsWith('http'));

        // Check if images were added, removed, or updated
        const originalImageCount = existingReview.images ? existingReview.images.length : 0;
        const currentImageCount = existingImageUrls.length + imageFiles.length;
        const imagesChanged = originalImageCount !== currentImageCount || imageFiles.length > 0;

        const result = await dispatch(updateProductReview({
          reviewId: existingReview.id || existingReview._id,
          rating: rating,
          title: reviewData.name,
          comment: reviewData.review,
          images: existingImageUrls,
          imageFiles: imageFiles
        }));

        if (updateProductReview.fulfilled.match(result)) {
          // Show appropriate message based on image changes
          if (imagesChanged) {
            if (imageFiles.length > 0 && existingImageUrls.length > 0) {
              showToast('Review and images updated successfully!', 'success');
            } else if (imageFiles.length > 0) {
              showToast('Review updated with new images!', 'success');
            } else if (currentImageCount < originalImageCount) {
              showToast('Review updated. Images removed successfully!', 'success');
            } else {
              showToast('Review updated successfully!', 'success');
            }
          } else {
            // Images didn't change
            if (!hasImages) {
              showToast('Review updated successfully (no images)', 'success');
            } else {
              showToast('Review updated successfully!', 'success');
            }
          }

          // Update the existing review state with new data
          setExistingReview({
            ...existingReview,
            rating: rating,
            title: reviewData.name,
            comment: reviewData.review,
            images: result.payload.images || existingImageUrls,
            updatedAt: new Date().toISOString()
          });
          // Clear new file uploads
          setImageFiles([]);
          // Keep the updated image previews
          setImagePreviews(result.payload.images || existingImageUrls);
          // Go back to view mode
          setShowEditForm(false);
        } else {
          throw new Error(result.payload || 'Failed to update review');
        }
      } catch (err) {
        showToast(`Error updating review: ${err.message}`, 'error');
      }
    } else {
      // Create new review
      await dispatch(createProductReview({
        productId: actualProductId,
        rating: rating,
        name: reviewData.name,
        comment: reviewData.review,
        imageFiles: imageFiles,
        orderId: orderId // Include orderId when creating review
      }));
    }
  };

  const handleEditClick = () => {
    if (existingReview) {
      // Populate form with existing review data
      setRating(existingReview.rating);
      setReviewData({
        name: existingReview.title || '',
        review: existingReview.comment || ''
      });

      // Set existing images as previews
      if (existingReview.images && existingReview.images.length > 0) {
        setImagePreviews(existingReview.images);
      } else {
        setImagePreviews([]);
      }

      // Clear any new file uploads
      setImageFiles([]);
    }
    setShowEditForm(true);
  };

  const handleCancelEdit = () => {
    if (existingReview) {
      // Cancel edit, go back to view mode
      setShowEditForm(false);
      // Restore original review data
      setRating(existingReview.rating);
      setReviewData({
        name: existingReview.title || '',
        review: existingReview.comment || ''
      });
      setImageFiles([]);
      setImagePreviews(existingReview.images || []);
    } else {
      // Clear everything
      setReviewData({ name: '', review: '' });
      setRating(0);
      setImageFiles([]);
      setImagePreviews([]);
    }
    dispatch(clearReviewState());
  };

  const handleCancelReview = handleCancelEdit;

  const handleBuyAgain = async () => {
    try {
      // Get the first item from the order (or the specific product if filtered)
      const item = orderData?.items?.[0];

      if (!item) {
        showToast('No product found to add to cart', 'error');
        return;
      }

      // Get user ID for cart operations
      const userId = await getUserFromCookies();
      if (!userId) {
        showToast('Please login to add items to cart', 'error');
        return;
      }

      // Prepare cart item data
      const cartItem = {
        productId: item.productId,
        name: item.name,
        price: item.price || item.unitPrice,
        quantity: item.quantity,
        image: item.image || '/iphone.jpg', // fallback image
        brand: item.brand || 'Product'
      };

      console.log('Adding to cart:', cartItem);

      // Add to cart
      const result = await dispatch(addToCart({
        userId,
        productId: cartItem.productId,
        name: cartItem.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        image: cartItem.image,
        brand: cartItem.brand
      }));

      if (addToCart.fulfilled.match(result)) {
        showToast('Item added to cart successfully!', 'success');
        // Navigate to checkout page
        window.location.href = '/checkout';
      } else {
        showToast('Failed to add item to cart. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Error adding item to cart. Please try again.', 'error');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      if (!orderData || !orderData._id) {
        showToast('Order data not available', 'error');
        return;
      }

      // Get authentication token
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to download invoice', 'error');
        return;
      }

      // Get order ID
      const orderId = orderData._id;

      // Construct the API URL
      const apiUrl = orderEndpoints.downloadInvoice(orderId);

      console.log('Downloading invoice from:', apiUrl);

      // Fetch the PDF
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to download invoice' }));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${orderData.orderNumber}_invoice.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Invoice downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast(`Error downloading invoice: ${error.message}`, 'error');
    }
  };

  // Helper functions for formatting
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      case 'processing':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  // Compute per-item unit price including VAT and Tax
  const getItemUnitPriceWithTaxes = (item, order) => {
    const base = Number(item?.unitPrice ?? item?.price ?? 0) || 0;
    const qty = Math.max(1, Number(item?.quantity) || 1);
    const lineTax = Number(item?.tax) || 0;
    const lineVat = Number(item?.vat) || 0;

    // Prefer item-level tax/vat if provided (assumed totals for the line)
    if (lineTax || lineVat) {
      const perUnitTaxes = (lineTax + lineVat) / qty;
      const inclusive = base + perUnitTaxes;
      return Number(inclusive.toFixed(2));
    }

    // Otherwise compute a tax rate from order totals and apply to the unit price
    const derivedSubtotal = Number(order?.subtotal);
    const fallbackSubtotal = Array.isArray(order?.items)
      ? order.items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)
      : 0;
    const orderSubtotal = (isNaN(derivedSubtotal) || derivedSubtotal <= 0) ? fallbackSubtotal : derivedSubtotal;
    const orderTax = Number(order?.tax) || 0;
    const orderVat = Number(order?.vat) || 0;

    if (orderSubtotal > 0 && (orderTax || orderVat)) {
      const taxRate = (orderTax + orderVat) / orderSubtotal; // fraction applied to unit price
      const inclusive = base * (1 + taxRate);
      return Number(inclusive.toFixed(2));
    }

    // Fallback: no taxes available
    return Number(base.toFixed(2));
  };

  // Compute subtotal from items' unit prices (excluding taxes), respecting quantity
  const getItemsSubtotal = (order) => {
    if (!order || !Array.isArray(order.items)) return 0;
    const sum = order.items.reduce((acc, it) => {
      const unit = Number(it?.unitPrice ?? it?.price ?? 0) || 0;
      const qty = Math.max(1, Number(it?.quantity) || 1);
      return acc + unit * qty;
    }, 0);
    return Number(sum.toFixed(2));
  };

  // Compute subtotal using discounted prices (when gig_completion discount exists)
  const getDiscountedItemsSubtotal = (order) => {
    if (!order || !Array.isArray(order.items)) return 0;
    const sum = order.items.reduce((acc, it) => {
      const priceDetails = getItemPriceDetails(it, order);
      const qty = Math.max(1, Number(it?.quantity) || 1);
      return acc + priceDetails.discountedPrice * qty;
    }, 0);
    return Number(sum.toFixed(2));
  };

  // Format discount type for display
  const formatDiscountType = (discountType) => {
    if (!discountType) return '';
    return discountType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Discount';
  };

  // Format discount type for display in brackets (simpler version)
  const formatDiscountTypeBracket = (discountType) => {
    if (!discountType) return '';
    return discountType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate discounted price and discount amount for an item.
  // Only show product-level discount (discountName, discountAmount or discountPercentage).
  // Do NOT display order-level gig_completion near products - only show offers/coupons when present on the product.
  const getItemPriceDetails = (item, order) => {
    const basePrice = Number(item?.unitPrice ?? item?.price ?? 0) || 0;
    const qty = Math.max(1, Number(item?.quantity) || 1);

    // Product-level discount only: item has discountName and either discountAmount or discountPercentage.
    // Never display gig_completion - exclude when discountName indicates gig completion (e.g. "Gig Completion").
    const isGigCompletionDiscount = item?.discountName && /gig\s*completion|completion\s*discount/i.test(String(item.discountName));
    const hasItemDiscount = !isGigCompletionDiscount && item?.discountName && (Number(item?.discountAmount) > 0 || Number(item?.discountPercentage) > 0);
    if (hasItemDiscount) {
      let discountPerUnit = 0;
      let discountPercentage = 0;

      if (Number(item.discountPercentage) > 0) {
        discountPercentage = Number(item.discountPercentage);
        discountPerUnit = (basePrice * discountPercentage) / 100;
      } else if (Number(item.discountAmount) > 0) {
        discountPerUnit = Number(item.discountAmount);
        discountPercentage = basePrice > 0 ? (discountPerUnit / basePrice) * 100 : 0;
      }

      const discountedPrice = Math.max(0, basePrice - discountPerUnit);

      return {
        originalPrice: basePrice,
        discountAmount: Number(discountPerUnit.toFixed(2)),
        discountedPrice: Number(discountedPrice.toFixed(2)),
        discountPercentage: Number(discountPercentage.toFixed(2)),
        discountType: null,
        discountName: item.discountName
      };
    }

    // No product-level discount - do not display any discount (including gig_completion)
    return {
      originalPrice: basePrice,
      discountAmount: 0,
      discountedPrice: basePrice,
      discountPercentage: 0,
      discountType: null,
      discountName: null
    };
  };

  // Compute total tax across displayed items (prefer item-level tax, else proportional share from order.tax)
  const getItemsTax = (order) => {
    if (!order || !Array.isArray(order.items)) return 0;
    const orderSubtotal = getItemsSubtotal(order) || 0;
    const orderTax = Number(order?.tax) || 0;
    let sum = 0;
    for (const it of order.items) {
      const qty = Math.max(1, Number(it?.quantity) || 1);
      const unit = Number(it?.unitPrice ?? it?.price ?? 0) || 0;
      const lineBase = unit * qty;
      const lineTax = Number(it?.tax) || 0;
      if (lineTax) {
        sum += lineTax;
      } else if (orderSubtotal > 0 && orderTax) {
        sum += (lineBase / orderSubtotal) * orderTax;
      }
    }
    return Number(sum.toFixed(2));
  };

  // Compute discounted subtotal (subtotal after all discounts)
  const getDiscountedSubtotal = (order) => {
    if (!order) return 0;
    const subtotal = getItemsSubtotal(order) || 0;
    const couponDiscount = Number(order?.couponDiscountAmount || 0);
    const qoynsDiscount = Number(order?.qoynsDiscountAmount || 0);
    const discountType = order?.discountType;
    const discountAmount = Number(order?.discount || 0);

    // Calculate total discount
    let totalDiscount = 0;
    if (couponDiscount > 0) totalDiscount += couponDiscount;
    if (qoynsDiscount > 0) totalDiscount += qoynsDiscount;
    // If discountType is gig_completion, use the discount field for gig completion discount
    if (discountType === 'gig_completion' && discountAmount > 0) {
      totalDiscount += discountAmount;
    } else if (discountAmount > 0 && discountType !== 'gig_completion' && couponDiscount === 0 && qoynsDiscount === 0) {
      // Other discount types (fallback)
      totalDiscount += discountAmount;
    }

    const discountedSubtotal = subtotal - totalDiscount;
    return Math.max(0, discountedSubtotal); // Ensure it doesn't go negative
  };

  // Compute total VAT across displayed items - VAT should be calculated on discounted amount at 5%
  const getItemsVat = (order) => {
    if (!order || !Array.isArray(order.items)) return 0;

    const discountedSubtotal = getDiscountedSubtotal(order);

    // Always use 5% VAT rate
    const vatRate = 0.05;

    // Calculate VAT on discounted subtotal (matching checkout logic)
    const vatAmount = discountedSubtotal * vatRate;
    return Number(vatAmount.toFixed(2));
  };

  if (orderLoading) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            Loading order details...
          </div>
        </div>
      </div>
    );
  }

  if (orderError) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
            Error loading order: {orderError}
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div>
        <Navigation />
        <div className={styles.container}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            Order not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        {/* Header Section */}
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <h1 className={styles.orderNumber}>ORDER #{orderData.orderNumber}</h1>
        </div>

        {/* Order Information Card */}
        <div className={styles.orderInfoCard}>
          <div className={styles.orderInfoLeft}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Order Placed</span>
              <span className={styles.infoValue}>{formatDate(orderData.createdAt)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Order Number</span>
              <span className={styles.infoValue}>{orderData.orderNumber}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Payment Method</span>
              <span className={styles.infoValue}>{orderData.paymentMethod || 'Credit/Debit Card'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Order Status</span>
              <span
                className={`${styles.infoValue} ${styles.deliveredStatus}`}
                style={{ color: getStatusColor(orderData.status) }}
              >
                {orderData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Product Dropdown Section */}


        {/* Address and Review Section */}
        <div className={styles.contentGrid}>
          {/* Address Cards Row */}
          <div className={styles.addressRow}>
            {/* Delivery Address Card */}
            <div className={styles.addressCard}>
              <h3 className={styles.cardTitle}>Delivery Address</h3>
              <div className={styles.addressContent}>
                <span className={styles.addressType}>Home</span>
                <p className={styles.addressText}>
                  {orderData.deliveryAddress && orderData.deliveryAddress.addressLine1 !== "Address not provided" ?
                    `${orderData.deliveryAddress.fullName || ''}\n${orderData.deliveryAddress.addressLine1}, ${orderData.deliveryAddress.city}, ${orderData.deliveryAddress.state} ${orderData.deliveryAddress.postalCode}, ${orderData.deliveryAddress.country}` :
                    'Delivery address not provided'
                  }
                </p>
                <div className={styles.contactInfo}>
                  <span className={styles.contactNumber}>
                    {orderData.deliveryAddress?.phone && orderData.deliveryAddress.phone !== "+1234567890" ?
                      orderData.deliveryAddress.phone : 'Phone not provided'}
                  </span>
                  <span className={styles.contactEmail}>
                    {orderData.deliveryAddress?.email || 'Email not provided'}
                  </span>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                  <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Shipping Cost: </span>
                  <span style={{ fontSize: '16px', color: '#000', fontWeight: '600' }}>
                    AED {((orderData.shippingCost === 0 || !orderData.shippingCost) ? 9.00 : Number(orderData.shippingCost)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Address Card */}
            {/* <div className={styles.addressCard}>
            <h3 className={styles.cardTitle}>Billing Address</h3>
            <div className={styles.addressContent}>
              <span className={styles.addressType}>Home</span>
              <p className={styles.addressText}>
                {orderData.shippingAddress && orderData.shippingAddress.addressLine1 !== "Address not provided" ? 
                  `${orderData.shippingAddress.fullName || ''}\n${orderData.shippingAddress.addressLine1}, ${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${orderData.shippingAddress.postalCode}, ${orderData.shippingAddress.country}` :
                  'Shipping address not provided'
                }
              </p>
              <div className={styles.contactInfo}>
                <span className={styles.contactNumber}>
                  {orderData.shippingAddress?.phone && orderData.shippingAddress.phone !== "+1234567890" ? 
                    orderData.shippingAddress.phone : 'Phone not provided'}
                </span>
                <span className={styles.contactEmail}>
                  {orderData.shippingAddress?.email || 'Email not provided'}
                </span>
              </div>
            </div>
          </div> */}
          </div>

          {/* Bottom Row - Review and Order Summary */}
          <div className={styles.bottomRow}>
            {/* Write/Edit a Review Card */}
            <div className={styles.reviewCard}>
              <h3 className={styles.cardTitle}>Write a review</h3>

              {/* Product Dropdown Section - Inside Review Card */}
              {orderData && orderData.items && orderData.items.length > 0 && (
                <div className={styles.productDropdownSection}>
                  <label className={styles.productDropdownLabel}>Select Product</label>
                  <select
                    className={styles.productDropdown}
                    value={selectedProductId || ''}
                    onChange={(e) => {
                      const newProductId = e.target.value;
                      console.log('🔄 Dropdown changed to product ID:', newProductId);
                      setSelectedProductId(newProductId);
                      // Clear existing review when product changes - useEffect will fetch new review
                      setExistingReview(null);
                      setIsEditMode(false);
                      setShowEditForm(false); // Set to false so useEffect can check if review exists
                      setRating(0);
                      setReviewData({ name: '', review: '' });
                      setImageFiles([]);
                      setImagePreviews([]);
                    }}
                  >
                    {orderData.items.map((item, index) => {
                      const itemProductId = item.productId || item.id || `item-${index}`;
                      return (
                        <option key={itemProductId} value={itemProductId}>
                          {item.name || `Product ${index + 1}`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
              {/* Show Review View if exists and not in edit mode */}
              {existingReview && !showEditForm ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className={styles.cardTitle}>Your Review</h3>
                    <button
                      className={styles.editButton}
                      onClick={handleEditClick}
                      style={{
                        padding: '12px 24px',
                        background: 'rgb(0, 130, 255, 0.2)',
                        color: 'rgb(0, 130, 255)',
                        border: '1px solid rgb(0, 130, 255)',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#0082FF';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgb(0, 130, 255, 0.2)';
                        e.currentTarget.style.color = 'rgb(0, 130, 255)';
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Edit Review
                    </button>
                  </div>

                  {/* Display existing review */}
                  <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                    {/* Rating */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Rating</label>
                      <div className={styles.starRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} width="24" height="24" viewBox="0 0 24 24" fill={star <= existingReview.rating ? '#FFB800' : '#E0E0E0'}>
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {/* Name/Title */}
                    {existingReview.title && (
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Name</label>
                        <div style={{ fontSize: '16px', color: '#1a1a1a', fontWeight: '500' }}>{existingReview.title}</div>
                      </div>
                    )}

                    {/* Comment */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Review</label>
                      <div style={{ fontSize: '15px', color: '#333', lineHeight: '1.6' }}>{existingReview.comment}</div>
                    </div>

                    {/* Images */}
                    {existingReview.images && existingReview.images.length > 0 && (
                      <div>
                        <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Photos</label>
                        <div className={styles.imagePreviews}>
                          {existingReview.images.map((imageUrl, index) => (
                            <div key={index} className={styles.imagePreviewItem}>
                              <img src={imageUrl} alt={`Review ${index + 1}`} className={styles.previewImage} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #dee2e6' }}>
                      <span style={{
                        fontSize: '12px',
                        color: existingReview.status === 'approved' ? '#4CAF50' : existingReview.status === 'pending' ? '#FF9800' : '#F44336',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        Status: {existingReview.status}
                      </span>
                      <span style={{ fontSize: '12px', color: '#999', marginLeft: '15px' }}>
                        {formatDate(existingReview.createdAt)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.reviewForm}>
                    <div className={styles.reviewFormColumns}>
                      {/* Left Column: Name, Rating, Upload Photo */}
                      <div className={styles.reviewFormLeft}>
                        <div className={styles.formField}>
                          <input
                            type="text"
                            name="name"
                            value={reviewData.name}
                            onChange={handleInputChange}
                            className={styles.formInput}
                            placeholder="Name"
                          />
                        </div>

                        <div className={styles.ratingRow}>
                          <label className={styles.ratingLabel}>Rating</label>
                          <div className={styles.starRating}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                className={`${styles.star} ${star <= rating ? styles.starFilled : styles.starEmpty}`}
                                onClick={() => handleRatingChange(star)}
                                type="button"
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className={styles.fileSizeNote}>
                          * Images above 5MB not allowed
                        </div>
                        <div className={styles.formField}>
                          <div className={styles.uploadRow}>
                            <label className={styles.uploadLabel}>Upload Photo</label>
                            <div
                              className={styles.uploadButtonContainer}
                              onClick={() => {
                                const existingImageCount = imagePreviews.filter(img => typeof img === 'string' && img.startsWith('http')).length;
                                const totalImages = imageFiles.length + existingImageCount;
                                if (totalImages < 5) {
                                  document.getElementById('photo-upload').click();
                                }
                              }}
                              style={{
                                cursor: (() => {
                                  const existingImageCount = imagePreviews.filter(img => typeof img === 'string' && img.startsWith('http')).length;
                                  const totalImages = imageFiles.length + existingImageCount;
                                  return totalImages < 5 ? 'pointer' : 'not-allowed';
                                })()
                              }}
                            >
                              <input
                                type="file"
                                id="photo-upload"
                                name="photo"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                              />
                              <button
                                type="button"
                                className={styles.uploadButton}
                                style={{
                                  cursor: (() => {
                                    const existingImageCount = imagePreviews.filter(img => typeof img === 'string' && img.startsWith('http')).length;
                                    const totalImages = imageFiles.length + existingImageCount;
                                    return totalImages < 5 ? 'pointer' : 'not-allowed';
                                  })()
                                }}
                                disabled={(() => {
                                  const existingImageCount = imagePreviews.filter(img => typeof img === 'string' && img.startsWith('http')).length;
                                  const totalImages = imageFiles.length + existingImageCount;
                                  return totalImages >= 5;
                                })()}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {/* File size remark */}

                          {/* Image Previews */}
                          {imagePreviews.length > 0 && (
                            <div className={styles.imagePreviews}>
                              {imagePreviews.map((preview, index) => {
                                const isExistingImage = typeof preview === 'string' && preview.startsWith('http');
                                return (
                                  <div key={index} className={styles.imagePreviewItem}>
                                    <img src={preview} alt={`Preview ${index + 1}`} className={styles.previewImage} />
                                    {isExistingImage && (
                                      <span className={styles.existingImageBadge}>Existing</span>
                                    )}
                                    <button
                                      type="button"
                                      className={styles.removeImageButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveImage(index);
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Review */}
                      <div className={styles.reviewFormRight}>
                        <div className={styles.formField}>
                          {/* <label className={styles.fieldLabel}>Comment</label> */}
                          <textarea
                            name="review"
                            value={reviewData.review}
                            onChange={handleInputChange}
                            className={styles.formTextarea}
                            placeholder="Write a comment"
                            rows="10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.reviewButtons}>
                      <button
                        className={styles.cancelButton}
                        onClick={handleCancelReview}
                        disabled={reviewLoading}
                      >
                        {isEditMode ? 'Back' : 'Cancel'}
                      </button>
                      <button
                        className={styles.submitButton}
                        onClick={handleSubmitReview}
                        disabled={reviewLoading || rating === 0}
                      >
                        {reviewLoading ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update' : 'Submit')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Order Summary Card */}
            <div className={styles.orderSummaryCard}>
              <h3 className={styles.cardTitle}>Order Summary</h3>

              {/* Order Items - Show all items */}
              {orderData.items && orderData.items.length > 0 && (
                <div className={styles.productsList}>
                  {orderData.items.map((item, index) => (
                    <div key={index} className={styles.productSection}>
                      <div className={styles.productMiddleSection}>
                        <div className={styles.productImageContainer}>
                          <Image
                            src={item.image || '/iphone.jpg'}
                            alt={item.name}
                            width={60}
                            height={60}
                            className={styles.productImg}
                          />
                        </div>
                        <div className={styles.productDetails}>
                          <h6 className={styles.productBrand}>{item.brand || 'Product'}</h6>
                          <h4 className={styles.productName}>{item.name}</h4>
                          <p className={styles.productQuantity}>Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className={styles.productRightSection}>
                        <div className={styles.productNumber}>#{index + 1}</div>
                        {(() => {
                          const priceDetails = getItemPriceDetails(item, orderData);
                          const hasDiscount = priceDetails.discountAmount > 0 && priceDetails.discountType !== 'gig_completion';
                          const discountLabel = priceDetails.discountName
                            ? `${priceDetails.discountName} (${priceDetails.discountPercentage}% OFF)`
                            : priceDetails.discountType
                              ? `${formatDiscountType(priceDetails.discountType)} (${priceDetails.discountPercentage}% OFF)`
                              : `${priceDetails.discountPercentage}% OFF`;

                          return (
                            <div className={styles.productPriceContainer}>
                              {hasDiscount ? (
                                <>
                                  <p className={styles.originalPrice}>
                                    AED {priceDetails.originalPrice.toFixed(2)}
                                  </p>
                                  <p className={styles.discountType}>
                                    {discountLabel}
                                  </p>
                                  <p className={styles.discountAmount}>
                                    - AED {priceDetails.discountAmount.toFixed(2)}
                                  </p>
                                  <p className={styles.productPrice}>
                                    AED {priceDetails.discountedPrice.toFixed(2)}
                                  </p>
                                </>
                              ) : (
                                <p className={styles.productPrice}>
                                  AED {priceDetails.discountedPrice.toFixed(2)}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.costBreakdown}>
                {/* Subtotal from discounted product prices */}
                <div className={styles.costItem}>
                  <span className={styles.costLabel}>Subtotal</span>
                  <span className={styles.costValue}>AED {getDiscountedItemsSubtotal(orderData).toFixed(2)}</span>
                </div>

                {/* Qoyns Discount - below subtotal */}
                {(Number(orderData.qoynsDiscountAmount) || 0) > 0 && (
                  <div className={styles.costItem}>
                    <span className={styles.costLabel}>Qoyns Discount</span>
                    <span className={styles.discountValue || styles.costValue}>
                      - AED {(Number(orderData.qoynsDiscountAmount) || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Cash Wallet - below subtotal */}
                {(Number(orderData.cashWalletAmount) || 0) > 0 && (
                  <div className={styles.costItem}>
                    <span className={styles.costLabel}>Cash Wallet</span>
                    <span className={styles.discountValue || styles.costValue}>
                      - AED {(Number(orderData.cashWalletAmount) || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Subtotal after discount */}
                {((Number(orderData.qoynsDiscountAmount) || 0) > 0 || (Number(orderData.cashWalletAmount) || 0) > 0) && (
                  <div className={styles.costItem}>
                    <span className={styles.costLabel}>Subtotal after discount</span>
                    <span className={styles.costValue}>
                      AED {(getDiscountedItemsSubtotal(orderData) - (Number(orderData.qoynsDiscountAmount) || 0) - (Number(orderData.cashWalletAmount) || 0)).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Shipping */}
                <div className={styles.costItem}>
                  <span className={styles.costLabel}>Shipping</span>
                  <span className={styles.costValue}>
                    AED {((orderData.shippingCost === 0 || !orderData.shippingCost) ? 9.00 : Number(orderData.shippingCost)).toFixed(2)}
                  </span>
                </div>

                {/* Order Total */}
                <div className={`${styles.costItem} ${styles.totalItem}`}>
                  <span className={styles.costLabel}>Order Total</span>
                  <span className={styles.totalValue}>
                    AED {(Number(orderData.totalAmount) || (
                      getDiscountedItemsSubtotal(orderData) +
                      ((orderData.shippingCost === 0 || !orderData.shippingCost) ? 9.00 : Number(orderData.shippingCost)) -
                      (orderData.qoynsDiscountAmount || 0) -
                      (orderData.cashWalletAmount || 0)
                    )).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className={styles.summaryButtons}>
                <button
                  className={styles.buyAgainButton}
                  onClick={handleBuyAgain}
                >
                  Buy Again
                </button>
                <button 
                  className={styles.downloadInvoiceButton}
                  onClick={handleDownloadInvoice}
                >
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
