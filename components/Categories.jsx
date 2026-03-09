import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { useRef } from 'react'

const categories = [
  {
    name: 'Restaurants',
    icon: '/hypermarket.svg',
    bgColor: 'rgba(31, 199, 10, 0.16)'
  },
  {
    name: 'Sweets Shops',
    icon: '/supermarket.svg',
    bgColor: 'rgba(203, 89, 101, 0.16)'
  },
  {
    name: 'Bakeries',
    icon: '/Bakeries.svg',
    bgColor: 'rgba(0, 157, 224, 0.16)'
  },
  {
    name: 'Groceries',
    icon: '/Grocires.svg',
    bgColor: 'rgba(31, 199, 10, 0.16)'
  },
  {
    name: 'Pharmacy',
    icon: 'pharmacy.svg',
    bgColor: 'rgba(198, 128, 0, 0.16)'
  },
  {
    name: 'Florists',
    icon: '/florist.svg',
    bgColor: 'rgba(0, 157, 224, 0.16)'
  }
  
]

export default function Categories() {
  const swiperRef = useRef(null);

  const handlePrev = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleNext = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  return (
    <div className="categories-section">
      <div className="container">
        {/* Desktop View */}
        <div className="categories-content desktop">
          {categories.map((category, index) => (
            <div key={index} className="category-item">
              <div
                className="category-icon"
                style={{ background: category.bgColor }}
              >
                <Image
                  src={category.icon}
                  alt={category.name}
                  width={80}
                  height={80}
                />
                <div className="coming-soon-overlay">
                  <span>Coming Soon</span>
                </div>
              </div>
              <div className="category-text">
                <h3>{category.name}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View with Swiper */}
        <div className="categories-swiper mobile">
          <Swiper
            ref={swiperRef}
            modules={[SwiperNavigation]}
            slidesPerView={2.7}
            spaceBetween={10}
            breakpoints={{
              744: {
                slidesPerView: 5.2,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 5.5,
                spaceBetween: 16,
              }
            }}
            grabCursor={true}
            freeMode={true}
            className="categories-swiper-container"
          >
            {categories.map((category, index) => (
              <SwiperSlide key={index} className="category-slide">
                <div className="category-item">
                  <div
                    className="category-icon"
                    style={{ background: category.bgColor }}
                  >
                    <Image
                      src={category.icon}
                      alt={category.name}
                      width={60}
                      height={60}
                    />
                    <div className="coming-soon-overlay">
                      <span>Coming Soon</span>
                    </div>
                  </div>
                  <div className="category-text">
                    <h3>{category.name}</h3>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <style jsx>{`
        .categories-section {
          display: flex;
          width: 100%;
          padding: 40px 0;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .categories-content {
          display: flex;
          width: 100%;
          justify-content: center;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .categories-swiper {
          display: none;
        }

        .categories-swiper-container {
          width: 100%;
          padding: 0 20px;
        }

        .category-slide {
          width: 100%;
        }

        .category-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-item:hover {
          transform: translateY(-5px);
        }

        .category-icon {
          display: flex;
          width: 140px;
          height: 80px;
          justify-content: center;
          align-items: center;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
        }

        .coming-soon-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 16px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .coming-soon-overlay span {
          color: white;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
        }

        .category-item:hover .coming-soon-overlay {
          opacity: 1;
          visibility: visible;
        }

        .category-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          align-self: stretch;
        }

        .category-text h3 {
          color: #000;
          text-align: center;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 16px;
          font-weight: 700;
          line-height: 150%;
          margin: 0;
        }
        @media (max-width: 1024px) and (min-width: 768px) {
          .categories-content.desktop {
            gap: 16px;
          }
          
          .category-icon {
            width: 110px;
            height: 70px;
          }
          
          .category-text h3 {
            font-size: 14px;
          }
        }
        @media (max-width: 767px) {
          .categories-content.desktop {
            display: none;
          }

          .categories-swiper.mobile {
            display: block;
          }
          
          .category-icon {
            width: 120px;
            height: 80px;
          }
          
          .category-text h3 {
            font-size: 14px;
          }

          .coming-soon-overlay span {
            font-size: 12px;
          }

          .categories-swiper-container {
            padding: 0 10px;
          }
        }
      `}</style>
    </div>
  )
}
