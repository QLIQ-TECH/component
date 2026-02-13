'use client'

export default function Banner({
  title,
  description,
  buttonText,
  backgroundImage,
  onButtonClick
}) {
  return (
    <div className="banner-container">
      <div className="banner-section">
        <div className="banner-content">
          <div className="banner-info">
            <h2 className="banner-title">{title}</h2>
            <p className="banner-description">{description}</p>
            <button className="banner-button" onClick={onButtonClick}>
              {buttonText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .banner-container {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 40px 24px;
          box-sizing: border-box;
        }
        
        .banner-section {
          width: 100%;
          max-width: 1360px;
          height: 324px;
          justify-content: center;
          align-items: center;
        }

        .banner-content {
          display: flex;
          width: 100%;
          height: 324px;
          padding: 40px;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          gap: 40px;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.60) 100%), 
                      url('${backgroundImage}') lightgray 50% / cover no-repeat;
        }

        .banner-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
          align-self: stretch;
        }

        .banner-title {
          width: 600px;
          color: #FFF;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 40px;
          font-weight: 700;
          line-height: 130%;
          margin: 0;
        }

        .banner-description {
          width: 600px;
          color: rgba(255, 255, 255, 0.80);
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 16px;
          font-weight: 400;
          line-height: 150%;
          margin: 0;
        }

        .banner-button {
          display: flex;
          padding: 12px 40px;
          justify-content: center;
          align-items: center;
          gap: 10px;
          border-radius: 100px;
          background: #FFF;
          border: none;
          cursor: pointer;
          color: #000;
          text-align: center;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 16px;
          font-weight: 500;
          line-height: 150%;
          transition: all 0.2s ease;
        }

        .banner-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .banner-container {
            padding: 0 16px;
          }
          
          .banner-content {
           
            padding: 24px 24px 24px 0px;
            align-items: flex-start;
            text-align: flex-start;
          }

          .banner-info {
            margin-top: 20px;
            align-items: flex-start;
          }

          .banner-title {
            width: 100%;
            font-size: 24px;
          }

          .banner-description {
            width: 100%;
            font-size: 14px;
          }

          .banner-button {
            padding: 10px 24px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
