import Image from 'next/image'

export default function StoreCard({
  id,
  title,
  category,
  rating,
  deliveryTime,
  image,
  logo,
  location,
  isTopStore = false,
  isNewStore = false,
  onClick
}) {
  const handleCardClick = onClick

  const getBadge = () => {
    if (isNewStore) return "New Store"
    if (isTopStore) return "Top Store"
    return null
  }

  return (
    <div className="store-card" onClick={handleCardClick}>
      <div className="store-image">
        <Image
          src={image}
          alt={title}
          width={322}
          height={222}
          style={{ borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.16)', width: '100%', height: 'auto', aspectRatio: '322/222' }}
        />

        {getBadge() && (
          <div className="store-badge">
            {getBadge()}
          </div>
        )}
      </div>

      <div className="store-info">
        <div className="store-title-row">
          {/* {logo && (
            <div className="store-logo">
              <Image
                src={logo}
                alt={`${title} logo`}
                width={40}
                height={40}
                style={{ borderRadius: '8px', objectFit: 'contain' }}
              />
            </div>
          )} */}
          <h3 className="store-title">{title}</h3>
          {/* <div className="delivery-time">
            {deliveryTime}
          </div> */}
        </div>

        <div className="store-bottom">
          <div className="store-location">{location}</div>
          <div className="store-rating">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M6.99937 10.0742L9.4202 11.5384C9.86354 11.8067 10.406 11.41 10.2894 10.9084L9.64771 8.15503L11.7885 6.30003C12.1794 5.96169 11.9694 5.32003 11.456 5.27919L8.63854 5.04003L7.53604 2.43836C7.3377 1.96586 6.66104 1.96586 6.4627 2.43836L5.3602 5.03419L2.5427 5.27336C2.02937 5.31419 1.81937 5.95586 2.2102 6.29419L4.35104 8.14919L3.70937 10.9025C3.5927 11.4042 4.1352 11.8009 4.57854 11.5325L6.99937 10.0742Z" fill="#0082FF"/>
            </svg>
            <span>{rating}</span>
          </div>
        </div>

        <div className="store-category">
          {/* {category} */}
        </div>
      </div>

      <style jsx>{`
        .store-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          position: relative;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          width: 322px;
        }

        .store-image {
          width: 322px;
          height: 222px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.16);
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }

        /* ... existing styles ... */

        .store-info {
          display: flex;
          width: 322px;
          padding: 0 8px 8px 8px;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        @media (max-width: 1024px) {
          .store-card, .store-image, .store-info {
            width: 100%;
          }
          .store-image {
            height: auto;
            aspect-ratio: 322 / 222;
          }
        }

        .store-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          align-self: stretch;
        }

        .store-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
        }

        .store-title {
          flex: 1 0 0;
          color: #000;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 16px;
          font-weight: 700;
          line-height: 150%;
          margin: 0;
        }

        .delivery-time {
          display: flex;
          padding: 8px;
          justify-content: center;
          align-items: center;
          gap: 10px;
          border-radius: 8px;
          background: rgba(0, 130, 255, 0.24);
          color: #0082FF;
          text-align: center;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 14px;
          font-weight: 700;
          line-height: 150%;
        }

        .store-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          align-self: stretch;
        }

        .store-location {
          color: #000;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 16px;
          font-weight: 700;
          line-height: 150%;
        }

        .store-rating {
          display: flex;
          padding: 4px 16px;
          justify-content: center;
          align-items: center;
          gap: 4px;
        }

        .store-rating span {
          color: #0082FF;
          text-align: center;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 400;
          line-height: 150%;
        }

        .store-category {
          color: #666;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 14px;
          font-weight: 400;
          line-height: 150%;
        }

        @media (max-width: 1024px) {
          .store-card {
            width: 100%;
          }

          .store-image {
            width: 100%;
            height: auto;
            aspect-ratio: 322/222;
          }

          .store-info {
            width: 100%;
            padding: 0 4px 4px 4px;
          }

          .store-title {
            font-size: 14px;
          }

          .store-location {
            font-size: 14px;
          }

          .delivery-time {
            font-size: 12px;
            padding: 6px;
          }
        }
      `}</style>
    </div>
  )
}