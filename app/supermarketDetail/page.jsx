'use client'

import Navigation from '@/components/Navigation'
import Categories from '@/components/Categories'
import ImageSlider from '@/components/ImageSlider'
import ProductCard from '@/components/ProductCard'
import StoreCard from '@/components/StoreCard'
import SectionHeader from '@/components/SectionHeader'
import Footer from '@/components/Footer'
import FilterDrawer from '@/components/FilterDrawer'
import { useMemo, useState } from 'react'

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

export default function Home() {
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 21

  const products = useMemo(() => productData.concat(productData), [])

  const totalPages = useMemo(() => {
    if (!products.length) {
      return 1
    }
    return Math.max(1, Math.ceil(products.length / pageSize))
  }, [products.length, pageSize])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return products.slice(start, start + pageSize)
  }, [products, currentPage, pageSize])

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }, [totalPages])

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return
    }
    setCurrentPage(page)
  }

  const handlePrevious = () => handlePageChange(currentPage - 1)
  const handleNext = () => handlePageChange(currentPage + 1)
  return (
    <main className="home-page">
      <Navigation />

      <section className="section">
        <div className="container">
          <div className="listing-layout">
            {/* Sticky Filter Sidebar */}
            <aside className="filters-sidebar">
              <FilterDrawer open={true} inline sticky stickyTop={112} onClose={() => { }} />
            </aside>

            {/* Main Content Area with Scrollable Products */}
            <div className="content-area">
              <div className="sticky-header">
                <SectionHeader
                  title="Products"
                  showNavigation={false}
                  showButton={true}
                  buttonText="Sort By"
                  onButtonClick={() => { }}
                />
              </div>
              <div className="products-scroll-container">
                <div className="grid-3">
                  {paginatedProducts.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="grid-item">
                      <ProductCard {...product} />
                    </div>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="pagination-controls" role="navigation" aria-label="Products pagination">
                  <button
                    type="button"
                    className="pagination-button"
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={`pagination-button ${page === currentPage ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                      aria-current={page === currentPage ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="pagination-button"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Drawer for small screens or other triggers (unchanged elsewhere) */}
      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} />

      <Footer />

      <style jsx>{`
        .listing-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          min-height: calc(100vh - 200px);
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
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

        .content-area { 
          flex: 1;
          min-width: 0; /* allows flex item to shrink below content size */
          width: 100%;
          max-width: 100%;
        }
        
        .products-scroll-container {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          overflow-x: hidden;
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
          padding-bottom: 40px; /* extra space at bottom */
        }
        
        .grid-item { 
          display: flex; 
          justify-content: center; 
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 5;
          background: #ffffff;
        }

        .pagination-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 32px;
          flex-wrap: wrap;
        }

        .pagination-button {
          min-width: 40px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pagination-button:hover:not(:disabled) {
          border-color: #111827;
          color: #111827;
          background: #f9fafb;
        }

        .pagination-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .pagination-button.active {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }

        @media (max-width: 1024px) {
          .filters-sidebar { 
            width: 220px; 
          }
          
          .grid-3 { 
            grid-template-columns: repeat(2, minmax(0, 1fr)); 
            gap: 16px;
          }
        }

        @media (max-width: 767px) {
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
        }
        
        @media (max-width: 640px) {
          .grid-3 { 
            grid-template-columns: 1fr; 
            gap: 16px;
          }
        }
      `}</style>
    </main>
  )
}
