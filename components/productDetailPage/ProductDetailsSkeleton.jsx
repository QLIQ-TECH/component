export default function ProductDetailsSkeleton() {
  return (
    <div className="product-details">
      <div className="product-main">
        <div className="product-images">
          <div className="main-image-container">
            <div className="skeleton skeleton-block" />
          </div>
          <div className="image-dots">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="dot skeleton" />
            ))}
          </div>
        </div>

        <div className="product-info">
          <div className="first-row">
            <div className="brand-name skeleton skeleton-text" />
            <div className="bought-count skeleton skeleton-text" />
          </div>

          <div className="stats">
            <div className="product-name skeleton skeleton-title" />
            <div className="delivery-time skeleton skeleton-chip" />
          </div>

          <div className="second-row-stats">
            <div className="stock-status skeleton skeleton-text" />
            <div className="rating">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="star skeleton" />
              ))}
            </div>
          </div>

          <div className="pricing">
            <div className="original-price skeleton skeleton-text sm" />
            <div className="current-price skeleton skeleton-text md" />
            <div className="discount skeleton skeleton-chip" />
          </div>

          <div className="selection-group">
            <div className="label skeleton skeleton-text sm" />
            <div className="options">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="pill skeleton" />
              ))}
            </div>
          </div>

          <div className="selection-group">
            <div className="label skeleton skeleton-text sm" />
            <div className="options">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="pill skeleton" />
              ))}
            </div>
          </div>

          <div className="quantity-share-container">
            <div className="quantity skeleton skeleton-block short" />
            <div className="share-icons">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="share-icon skeleton" />
              ))}
            </div>
          </div>

          <div className="action-buttons">
            <div className="btn skeleton" />
            <div className="btn skeleton" />
          </div>

          <div className="promo-cards-row">
            <div className="promo-card skeleton" />
            <div className="promo-card skeleton" />
          </div>

          <div className="additional-info">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="info-item skeleton" />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .product-details {
          max-width: 1392px;
          justify-content: center;
          align-items: center;
          margin: 0 auto;
          padding: 40px 20px;
          width: 100%;
        }

        .product-main {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .product-images { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .main-image-container { position: relative; width: 600px; height: 687px; border-radius: 16px; overflow: hidden; background: white; border: 1px solid rgba(0,0,0,0.1); }
        .image-dots { display: flex; gap: 8px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .star { width: 20px; height: 20px; border-radius: 4px; }

        .product-info { display: flex; flex-direction: column; gap: 24px; }
        .first-row { display: flex; justify-content: space-between; align-items: center; }
        .stats { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .second-row-stats { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
        .pricing { display: flex; align-items: center; gap: 16px; }
        .selection-group { display: flex; flex-direction: row; align-items: center; gap: 12px; }
        .options { display: flex; gap: 10px; flex-wrap: wrap; }
        .pill { height: 36px; width: 96px; border-radius: 999px; }
        .label { width: 70px; }
        .quantity-share-container { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
        .quantity { width: 140px; height: 48px; border-radius: 25px; }
        .share-icons { display: flex; gap: 8px; }
        .share-icon { width: 40px; height: 40px; border-radius: 8px; }
        .action-buttons { display: flex; gap: 16px; }
        .btn { width: 100%; max-width: 342px; height: 48px; border-radius: 50px; }
        .promo-cards-row { display: flex; gap: 16px; width: 100%; }
        .promo-card { flex: 1; height: 72px; border-radius: 16px; }
        .additional-info { display: flex; flex-direction: row; justify-content: space-between; gap: 12px; }
        .info-item { height: 32px; flex: 1; border-radius: 8px; }

        /* Skeleton base */
        .skeleton { position: relative; overflow: hidden; background: #eee; }
        .skeleton::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150px;
          height: 100%;
          width: 150px;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
          animation: shimmer 1.4s ease-in-out infinite;
        }

        .skeleton-block { width: 100%; height: 100%; }
        .skeleton-text { height: 20px; border-radius: 6px; width: 40%; }
        .skeleton-text.sm { width: 25%; height: 16px; }
        .skeleton-text.md { width: 35%; height: 22px; }
        .skeleton-title { width: 70%; height: 40px; border-radius: 8px; }
        .skeleton-chip { width: 120px; height: 28px; border-radius: 999px; }
        .short { width: 160px; }

        @keyframes shimmer {
          0% { transform: translateX(0); }
          100% { transform: translateX(300%); }
        }

        @media (max-width: 767px) {
          .product-main { grid-template-columns: 1fr; gap: 40px; }
          .main-image-container { width: 100%; height: 400px; }
          .btn { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}


