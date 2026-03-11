'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

const slides = [
  {
    id: 1,
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/8327e3bf1cc4b0879c5c6e445dc27305afbd0795?width=1336',
    width: 668,
    height: 380
  },
  {
    id: 2,
    image: 'https://api.builder.io/api/v1/image/assets/TEMP/dd3b697ca0d3ef83a64c4b812706fae22e6774f2?width=1336',
    width: 668,
    height: 380
  },
  {
    id: 3,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxab6jMWSSKjrOEbsNjwj-ieKXun5YHnFTMA&s',
    width: 688,
    height: 380
  },
  {
    id: 4,
    image: 'https://img.freepik.com/free-vector/paper-style-podium-horizontal-banner_23-2150956911.jpg?semt=ais_hybrid&w=740&q=80',
    width: 688,
    height: 380
  }
]

export default function ImageSlider() {
  const swiperRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkScreenSize()

    // Add event listener
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleSlideChange = (swiper) => {
    setIsBeginning(swiper.isBeginning)
    setIsEnd(swiper.isEnd)
  }

  const nextSlide = () => {
    if (swiperRef.current && swiperRef.current.swiper && !isEnd) {
      swiperRef.current.swiper.slideNext()
    }
  }

  const prevSlide = () => {
    if (swiperRef.current && swiperRef.current.swiper && !isBeginning) {
      swiperRef.current.swiper.slidePrev()
    }
  }

  return (
    <div className="slider-container">
      <div className="container">
        <div className="slider-section">
          <Swiper
            ref={swiperRef}
            modules={[Navigation]}
            spaceBetween={isMobile ? 16 : 24}
            slidesPerView={isMobile ? 1.2 : 1.5}
            centeredSlides={isMobile}
            loop={false}
            onSlideChange={handleSlideChange}
            onSwiper={(swiper) => {
              setIsBeginning(swiper.isBeginning)
              setIsEnd(swiper.isEnd)
            }}
            style={{
              maxWidth: '1392px',
              height: isMobile ? '200px' : '380px',
            }}
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={slide.id}>
                <div className="slide-container">
                  <Image
                    src={slide.image}
                    alt={`Slide ${index + 1}`}
                    width={slide.width}
                    height={slide.height}
                    style={{
                      borderRadius: isMobile ? '12px' : '16px',
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                    className="slider-image"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="slider-controls">
            <button
              className={`nav-button prev ${isBeginning || slides.length === 0 ? 'disabled' : ''}`}
              onClick={prevSlide}
              disabled={isBeginning || slides.length === 0}
              aria-label="Previous slide"
            >
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <rect y="44" width="44" height="44" rx="22" transform="rotate(-90 0 44)" fill="white" />
                <path d="M32 22L11 22M11 22L18.875 14.125M11 22L18.875 29.875" stroke="#0082FF" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              className={`nav-button next ${isEnd || slides.length === 0 ? 'disabled' : ''}`}
              onClick={nextSlide}
              disabled={isEnd || slides.length === 0}
              aria-label="Next slide"
            >
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <rect x="44" width="44" height="44" rx="22" transform="rotate(90 44 0)" fill="white" />
                <path d="M11 22L32 22M32 22L24.125 29.875M32 22L24.125 14.125" stroke="#0082FF" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-container {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .container {
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .slider-section {
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        .slide-container {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .slider-controls {
          display: flex;
          width: 100%;
          justify-content: space-between;
          align-items: center;
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          height: 44px;
          z-index: 10;
          pointer-events: none;
          padding: 0 20px;
          box-sizing: border-box;
        }

        .nav-button {
          width: 44px;
          height: 44px;
          border-radius: 22px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          pointer-events: all;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .nav-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .nav-button:active {
          transform: scale(0.95);
        }

        .nav-button.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }

        .nav-button.disabled:hover {
          transform: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .nav-button.disabled svg path {
          stroke: #999;
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 0;
            min-width: 340px;
          }
          
          .slider-section {
            min-width: 340px;
          }
          
          .slider-controls {
            padding: 0 0;
          }
          
          .nav-button {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}