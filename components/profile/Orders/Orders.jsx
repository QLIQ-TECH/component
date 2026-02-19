'use client'
import { useState, useMemo, Fragment } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import styles from './orders.module.css'
import orderHistoryStyles from '../../../app/orderhistory/orderHistory.module.css'

export default function Orders({ orders }) {
  const router = useRouter()
  const [expandedGroups, setExpandedGroups] = useState(new Set())
  const [expandedOrders, setExpandedOrders] = useState(new Set())
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US').format(price.toFixed(2))
  }

  const getTotalProductsCount = (order) => {
    if (!order.items || !Array.isArray(order.items)) return 0
    return order.items.reduce((total, item) => total + (item.quantity || 1), 0)
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50'
      case 'pending':
        return '#FF9800'
      case 'rejected':
        return '#F44336'
        case 'accepted':
        return '#0082FF'
      case 'processing':
        return '#2196F3'
      case 'shipped':
        return '#9C27B0'
      case 'in-transit':
        return '#2196F3'
      default:
        return '#666'
    }
  }

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return '#4CAF50'
      case 'pending':
        return '#FF9800'
      case 'failed':
        return '#F44336'
      case 'refunded':
        return '#9C27B0'
      default:
        return '#666'
    }
  }

  const getPaymentMethodLabel = (paymentMethod) => {
    switch (paymentMethod?.toLowerCase()) {
      case 'cash_wallet':
        return 'Cash Wallet'
      case 'stripe':
        return 'Card (Stripe)'
      case 'tabby':
        return 'Tabby'
      case 'cash_on_delivery':
        return 'Cash on Delivery'
      default:
        return paymentMethod || 'N/A'
    }
  }

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

  // Format discount type for display
  const formatDiscountType = (discountType) => {
    if (!discountType) return '';
    return discountType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Discount';
  };

  // Calculate discounted price and discount amount for an item.
  // Prefer product-level discount (discountName, discountAmount or discountPercentage), then order-level gig_completion.
  const getItemPriceDetails = (item, order) => {
    const basePrice = Number(item?.unitPrice ?? item?.price ?? 0) || 0;
    const qty = Math.max(1, Number(item?.quantity) || 1);

    // 1) Product-level discount: item has discountName and either discountAmount or discountPercentage
    const hasItemDiscount = item?.discountName && (Number(item?.discountAmount) > 0 || Number(item?.discountPercentage) > 0);
    if (hasItemDiscount) {
      let discountPerUnit = 0;
      let discountPercentage = 0;

      if (Number(item.discountPercentage) > 0) {
        // Discount is percentage: discountPerUnit = basePrice * (percentage / 100)
        discountPercentage = Number(item.discountPercentage);
        discountPerUnit = (basePrice * discountPercentage) / 100;
      } else if (Number(item.discountAmount) > 0) {
        // Discount is fixed amount per unit
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

    // 2) Order-level: discountType is gig_completion
    if (order?.discountType === 'gig_completion' && order?.discount > 0) {
      const totalDiscount = Number(order.discount) || 0;
      const orderSubtotal = getItemsSubtotal(order);

      if (orderSubtotal > 0) {
        const itemTotal = basePrice * qty;
        const discountProportion = itemTotal / orderSubtotal;
        const itemDiscount = totalDiscount * discountProportion;
        const discountPerUnit = itemDiscount / qty;
        const discountedPrice = basePrice - discountPerUnit;
        const pct = basePrice > 0 ? (discountPerUnit / basePrice) * 100 : 0;

        return {
          originalPrice: basePrice,
          discountAmount: Number(discountPerUnit.toFixed(2)),
          discountedPrice: Math.max(0, Number(discountedPrice.toFixed(2))),
          discountPercentage: Number(pct.toFixed(2)),
          discountType: order.discountType,
          discountName: null
        };
      }
    }

    return {
      originalPrice: basePrice,
      discountAmount: 0,
      discountedPrice: basePrice,
      discountPercentage: 0,
      discountType: null,
      discountName: null
    };
  };

  const handleOrderClick = (order, item) => {
    // Navigate to order history page with order and specific product
    const pid = item?.productId || item?.id || ''
    const url = pid ? `/orderhistory?orderId=${order._id}&productId=${encodeURIComponent(pid)}` : `/orderhistory?orderId=${order._id}`
    router.push(url)
  }

  const handleProductsClick = (order, e) => {
    e.stopPropagation()
    // Open modal with order summary
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedOrder(null)
  }

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  // Group orders by paymentIntentId or by close createdAt timestamps (within 2 minutes)
  const groupedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []
    
    const groups = []
    const processed = new Set()
    
    orders.forEach((order, index) => {
      if (processed.has(index)) return
      
      const group = [order]
      processed.add(index)
      
      // Try to find orders with same paymentIntentId
      if (order.paymentIntentId) {
        orders.forEach((otherOrder, otherIndex) => {
          if (otherIndex !== index && !processed.has(otherIndex) && 
              otherOrder.paymentIntentId === order.paymentIntentId) {
            group.push(otherOrder)
            processed.add(otherIndex)
          }
        })
      }
      
      // If no matches by paymentIntentId, try grouping by close timestamps (within 2 minutes)
      if (group.length === 1 && order.createdAt) {
        const orderTime = new Date(order.createdAt).getTime()
        orders.forEach((otherOrder, otherIndex) => {
          if (otherIndex !== index && !processed.has(otherIndex) && otherOrder.createdAt) {
            const otherTime = new Date(otherOrder.createdAt).getTime()
            const timeDiff = Math.abs(orderTime - otherTime)
            // Group if within 2 minutes (120000 ms) and same user
            if (timeDiff <= 120000 && order.userId === otherOrder.userId) {
              group.push(otherOrder)
              processed.add(otherIndex)
            }
          }
        })
      }
      
      groups.push(group)
    })
    
    return groups
  }, [orders])

  const renderOrderItem = (order, item, idx, isGrouped = false) => {
    const totalProducts = getTotalProductsCount(order)
    const productCount = totalProducts.toString().padStart(2, '0')
    
    return (
      <div 
        key={`${order._id}_${idx}`}
        className={styles.orderItem}
      >
        <div className={styles.orderImageSection}>
          {item ? (
            <Image
              src={item.image || '/iphone.jpg'}
              alt={item.name || 'Product'}
              width={150}
              height={150}
              className={styles.orderImage}
            />
          ) : (
            <div className={styles.orderImage} style={{ backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No Image
            </div>
          )}
        </div>
        <div className={styles.orderInfoSection}>
          <div className={styles.orderRow}>
            <div className={styles.orderStatus}>{order.status}</div>
            <div className={styles.orderNumber} onClick={(e) => {
              e.stopPropagation()
              handleOrderClick(order, item)
            }}>ORDER #{order.orderNumber}</div>
          </div>
          <div className={styles.orderRow}>
            <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
            <div className={styles.orderPrice}>AED {formatPrice(order.totalAmount || 0)}</div>
          </div>
          <div className={styles.orderProducts}>
            <span 
              className={styles.productsLabel}
              onClick={(e) => handleProductsClick(order, e)}
              style={{ cursor: 'pointer' }}
            >
              Products
            </span> : <span className={styles.productsNumber}>{productCount}</span>
          </div>
        </div>
      </div>
    )
  }

  // Loading and error states are now handled in the parent ProfilePage component

  if (!orders || orders.length === 0) {
    return (
      <div className={styles.ordersList}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          No orders found
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.ordersContainer}>
        <div className={styles.ordersList}>
        {groupedOrders.map((group, groupIndex) => {
          const groupId = `group-${groupIndex}`
          const isExpanded = expandedGroups.has(groupId)
          const firstOrder = group[0]
          const additionalCount = group.length - 1
          
          // If only one order in group, render it with first item + expandable
          if (group.length === 1) {
            const orderItems = firstOrder.items || []
            const isOrderExpanded = expandedOrders.has(firstOrder._id)
            const additionalItemsCount = orderItems.length - 1
            
            if (orderItems.length === 0) {
              return (
                <div key={groupId} className={styles.orderGroup}>
                  <div className={styles.orderItem}>
                    <div className={styles.orderInfoSection}>
                      <div className={styles.orderRow}>
                        <div className={styles.orderStatus}>{firstOrder.status}</div>
                        <div 
                          className={styles.orderNumber}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOrderClick(firstOrder, null)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          ORDER #{firstOrder.orderNumber}
                        </div>
                      </div>
                      <div className={styles.orderRow}>
                        <div className={styles.orderDate}>{formatDate(firstOrder.createdAt)}</div>
                        <div className={styles.orderPrice}>AED {formatPrice(firstOrder.totalAmount || 0)}</div>
                      </div>
                      <div className={styles.orderProducts}>
                        <span 
                          className={styles.productsLabel}
                          onClick={(e) => handleProductsClick(firstOrder, e)}
                          style={{ cursor: 'pointer' }}
                        >
                          Products
                        </span> : <span className={styles.productsNumber}>00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            
            const firstItem = orderItems[0]
            const totalProducts = getTotalProductsCount(firstOrder)
            const productCount = totalProducts.toString().padStart(2, '0')
            
            return (
              <div key={groupId} className={styles.orderGroup}>
                <div className={styles.orderGroupHeader}>
                  <div className={styles.orderItem}>
                    <div className={styles.orderImageSection}>
                      {firstItem ? (
                        <Image
                          src={firstItem.image || '/iphone.jpg'}
                          alt={firstItem.name || 'Product'}
                          width={150}
                          height={150}
                          className={styles.orderImage}
                        />
                      ) : (
                        <div className={styles.orderImage} style={{ backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          No Image
                        </div>
                      )}
                    </div>
                    <div className={styles.orderInfoSection}>
                      <div className={styles.orderRow}>
                        <div className={styles.orderStatus}>{firstOrder.status}</div>
                        <div 
                          className={styles.orderNumber}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOrderClick(firstOrder, firstItem)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          ORDER #{firstOrder.orderNumber}
                        </div>
                      </div>
                      <div className={styles.orderRow}>
                        <div className={styles.orderDate}>{formatDate(firstOrder.createdAt)}</div>
                        <div className={styles.orderPrice}>AED {formatPrice(firstOrder.totalAmount || 0)}</div>
                      </div>
                      <div className={styles.orderProducts}>
                        <span 
                          className={styles.productsLabel}
                          onClick={(e) => handleProductsClick(firstOrder, e)}
                          style={{ cursor: 'pointer' }}
                        >
                          Products
                        </span> : <span className={styles.productsNumber}>{productCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            )
          }
          
          // Multiple orders - render each order separately
          return (
            <Fragment key={groupId}>
              {group.map((order, orderIndex) => {
                const orderKey = order._id || order.orderNumber || `order-${groupIndex}-${orderIndex}`
                const orderItems = order.items || []
                const firstItem = orderItems[0]
                const totalProducts = getTotalProductsCount(order)
                const productCount = totalProducts.toString().padStart(2, '0')
                
                if (orderItems.length === 0) {
                  return (
                    <div key={orderKey} className={styles.orderItem}>
                      <div className={styles.orderInfoSection}>
                        <div className={styles.orderRow}>
                          <div className={styles.orderStatus}>{order.status}</div>
                          <div 
                            className={styles.orderNumber}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOrderClick(order, null)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            ORDER #{order.orderNumber}
                          </div>
                        </div>
                        <div className={styles.orderRow}>
                          <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
                          <div className={styles.orderPrice}>AED {formatPrice(order.totalAmount || 0)}</div>
                        </div>
                        <div className={styles.orderProducts}>
                          <span 
                            className={styles.productsLabel}
                            onClick={(e) => handleProductsClick(order, e)}
                            style={{ cursor: 'pointer' }}
                          >
                            Products
                          </span> : <span className={styles.productsNumber}>00</span>
                        </div>
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div key={orderKey} className={styles.orderGroup}>
                    <div className={styles.orderItem}>
                      <div className={styles.orderImageSection}>
                        {firstItem ? (
                          <Image
                            src={firstItem.image || '/iphone.jpg'}
                            alt={firstItem.name || 'Product'}
                            width={150}
                            height={150}
                            className={styles.orderImage}
                          />
                        ) : (
                          <div className={styles.orderImage} style={{ backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            No Image
                          </div>
                        )}
                      </div>
                      <div className={styles.orderInfoSection}>
                        <div className={styles.orderRow}>
                          <div className={styles.orderStatus}>{order.status}</div>
                          <div 
                            className={styles.orderNumber}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOrderClick(order, firstItem)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            ORDER #{order.orderNumber}
                          </div>
                        </div>
                        <div className={styles.orderRow}>
                          <div className={styles.orderDate}>{formatDate(order.createdAt)}</div>
                          <div className={styles.orderPrice}>AED {formatPrice(order.totalAmount || 0)}</div>
                        </div>
                        <div className={styles.orderProducts}>
                          <span 
                            className={styles.productsLabel}
                            onClick={(e) => handleProductsClick(order, e)}
                            style={{ cursor: 'pointer' }}
                          >
                          Products
                        </span> : <span className={styles.productsNumber}>{productCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </Fragment>
          )
        })}
        </div>
      </div>

      {/* Order Summary Modal */}
      {isModalOpen && selectedOrder && (
        <div className={orderHistoryStyles.modalOverlay} onClick={closeModal}>
          <div className={orderHistoryStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={orderHistoryStyles.modalHeader}>
              <h3 className={orderHistoryStyles.cardTitle}>Order Summary</h3>
              <button className={orderHistoryStyles.modalCloseButton} onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Order Items - Show all items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div className={orderHistoryStyles.productsList}>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className={orderHistoryStyles.productSection}>
                    <div className={orderHistoryStyles.productMiddleSection}>
                      <div className={orderHistoryStyles.productImageContainer}>
                        <Image
                          src={item.image || '/iphone.jpg'}
                          alt={item.name}
                          width={60}
                          height={60}
                          className={orderHistoryStyles.productImg}
                        />
                      </div>
                      <div className={orderHistoryStyles.productDetails}>
                        <h6 className={orderHistoryStyles.productBrand}>{item.brand || 'Product'}</h6>
                        <h4 className={orderHistoryStyles.productName}>{item.name}</h4>
                        <p className={orderHistoryStyles.productQuantity}>Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className={orderHistoryStyles.productRightSection}>
                      <div className={orderHistoryStyles.productNumber}>#{index + 1}</div>
                      {(() => {
                        const priceDetails = getItemPriceDetails(item, selectedOrder);
                        const hasDiscount = priceDetails.discountAmount > 0;
                        const discountLabel = priceDetails.discountName
                          ? `${priceDetails.discountName} (${priceDetails.discountPercentage}% OFF)`
                          : priceDetails.discountType
                            ? `${formatDiscountType(priceDetails.discountType)} (${priceDetails.discountPercentage}% OFF)`
                            : `${priceDetails.discountPercentage}% OFF`;

                        return (
                          <div className={orderHistoryStyles.productPriceContainer}>
                            {hasDiscount ? (
                              <>
                                <p className={orderHistoryStyles.originalPrice}>
                                  AED {priceDetails.originalPrice.toFixed(2)}
                                </p>
                                <p className={orderHistoryStyles.discountType}>
                                  {discountLabel}
                                </p>
                                <p className={orderHistoryStyles.discountAmount}>
                                  - AED {priceDetails.discountAmount.toFixed(2)}
                                </p>
                                <p className={orderHistoryStyles.productPrice}>
                                  AED {priceDetails.discountedPrice.toFixed(2)}
                                </p>
                              </>
                            ) : (
                              <p className={orderHistoryStyles.productPrice}>
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
          </div>
        </div>
      )}
    </>
  )
}
