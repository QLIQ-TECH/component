'use client'

export default function SectionHeader({ 
  title, 
  showNavigation = false,
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  showButton = false, 
  buttonText = "See All",
  onButtonClick 
}) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      
      {(showNavigation || showButton) && (
        <div className="section-actions">
          {showButton && (
            <button className="section-button" onClick={onButtonClick}>
              {buttonText}
            </button>
          )}
          
          {showNavigation && (
            <div className="navigation-buttons">
              <button 
                className={`nav-btn prev ${prevDisabled ? 'disabled' : ''}`} 
                aria-label="Previous" 
                onClick={onPrev}
                disabled={prevDisabled}
              >
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <rect y="44" width="44" height="44" rx="22" transform="rotate(-90 0 44)" fill="#0082FF" fillOpacity="0.24"/>
                    <path d="M32 22L11 22M11 22L18.875 14.125M11 22L18.875 29.875" stroke="#0082FF" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className={`nav-btn next ${nextDisabled ? 'disabled' : ''}`} 
                aria-label="Next" 
                onClick={onNext}
                disabled={nextDisabled}
              >
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <rect x="44" width="44" height="44" rx="22" transform="rotate(90 44 0)" fill="#0082FF" fillOpacity="0.24"/>
                  <path d="M11 22L32 22M32 22L24.125 29.875M32 22L24.125 14.125" stroke="#0082FF" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .section-header {
          display: flex;
          width: 100%;
          max-width: 1392px;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-right: 24px;
          padding-left: 24px;
        }

        .section-title {
          color: #000;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 40px;
          font-weight: 700;
          line-height: 120%;
          margin: 0;
        }

        .section-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .section-button {
          display: flex;
          padding: 12px 40px;
          justify-content: center;
          align-items: center;
          gap: 10px;
          border-radius: 100px;
          background: rgba(0, 130, 255, 0.24);
          border: none;
          cursor: pointer;
          color: #0082FF;
          text-align: center;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 14px;
          font-weight: 700;
          line-height: 150%;
          transition: all 0.2s ease;
        }

        .section-button:hover {
          background: rgba(0, 130, 255, 0.4);
          transform: translateY(-2px);
        }

        .navigation-buttons {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 16px;
        }

        .nav-btn {
          width: 44px;
          height: 44px;
          border: none;
          background: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-btn:hover:not(.disabled) {
          transform: scale(1.05);
        }

        .nav-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }

        .nav-btn.disabled svg path {
          stroke: #999 !important;
        }

        .nav-btn.disabled svg rect {
          fill: #999 !important;
          fill-opacity: 0.24 !important;
        }

        @media (max-width: 1024px) {
          .section-title {
            font-size: 32px;
          }
        }

        @media (max-width: 767px) {
          .section-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
            padding: 0 0;
            margin-bottom: 8px;
          }

          .section-title {
            font-size: 20px;
          }

          .section-button {
            display: none;
          }
             .navigation-buttons {
          display: none;
        }
        }
      `}</style>
    </div>
  )
}
