'use client'

import Image from 'next/image'

export default function CreateAccountModal({ open, onClose, onBackToLogin }) {
  const rules = [
    "Scan the QR Code",
"Download the IQLIQ Live App",
"Signup for an account to start using IQLIQ!"
  ]

  if (!open) return null

  return (
    <div className="create-modal-overlay">
      <div className="create-modal">
        <button className="create-modal-close" onClick={onClose} aria-label="Close">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#F5F5F5" />
            <path d="M9 9L19 19M19 9L9 19" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="create-modal-content">
          
          <div className="create-modal-left">
            <h1 className="create-title">Create Your Account</h1>

            <ul className="create-rules-2">
                {/* <li key={index} className="create-rule"> */}
                  {/* <span className="create-rule-number">{String(index + 1).padStart(2, '0')}</span> */}
                  <p className="create-rule-text">Seems like you are not signed in!</p>
                {/* </li> */}
            </ul>

            <ul className="create-rules">
              {rules.map((rule, index) => (
                <li key={index} className="create-rule">
                  <span className="create-rule-number">{String(index + 1).padStart(2, '0')}</span>
                  <p className="create-rule-text">{rule}</p>
                </li>
              ))}
            </ul>

            <ul className="create-rules-1">
                {/* <li key={index} className="create-rule"> */}
                  {/* <span className="create-rule-number">{String(index + 1).padStart(2, '0')}</span> */}
                  <p className="create-rule-text">If you already have an IQLIQ Live account, please Login to continue.</p>
                {/* </li> */}
            </ul>

            <div className="create-qr-block">
              <div className="create-qr">
                <Image
                  src="/iqliq.svg"
                  alt="QLIQ QR Code"
                  width={160}
                  height={160}
                  className="create-qr-image"
                />
              </div>
            </div>

            <button className="create-back-btn" onClick={onBackToLogin || onClose}>
              Back to Login
            </button>
          </div>

          <div className="create-modal-right">
            <Image
              src="/1.jpg"
              alt="Joyful user"
              width={620}
              height={740}
              className="create-image"
              style={{ borderRadius: '32px', objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .create-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.18);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .create-modal {
          background: #fff;
          border-radius: 32px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          max-width: 900px;
          width: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .create-modal-close {
          position: absolute;
          top: 24px;
          right: 24px;
          background: none;
          border: none;
          cursor: pointer;
          z-index: 2;
        }
        .create-modal-content {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: 700px;
        }
        .create-modal-left {
          flex: 1;
          padding: 48px 12px 48px 32px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .create-title {
          font-size: 40px;
          font-weight: 700;
          margin: 0;
          color: #000;
        }
        .create-rules {
          list-style: none;
          padding: 0;
          margin: 4px 0 0 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
                .create-rules-1 {
          list-style: none;
          padding: 0;
          margin: 15px 0 0 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

                        .create-rules-2 {
          list-style: none;
          padding: 0;
          margin: 10px 0 10px 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .create-rule {
          display: flex;
          gap: 0;
          align-items: flex-start;
        }
        .create-rule-number {
          font-weight: 600;
          font-size: 16px;
          color: #000;
          min-width: 40px;
        }
        .create-rule-text {
          font-size: 16px;
          line-height: 1.5;
          color: #1f1f1f;
          margin: 0;
          padding-left: 0;
        }
        .create-qr-block {
          margin-top: 16px;
          display: flex;
          justify-content: center;
        }
        .create-qr {
          background: transparent;
          border: none;
          border-radius: 16px;
          padding: 0px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .create-qr-image {
          width: 160px;
          height: 160px;
          object-fit: contain;
        }
        .create-back-btn {
          margin-top: 25px;
          align-self: flex-start;
          padding: 14px 32px;
          border-radius: 999px;
          border: 1.5px solid #0078ff;
          background: #fff;
          color: #0b2c4a;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          min-width: 400px;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .create-back-btn:hover {
          box-shadow: 0 8px 24px rgba(0, 120, 255, 0.15);
          transform: translateY(-1px);
        }
        .create-modal-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 48px 48px 0;
        }
        .create-image {
          width: 100%;
          height: 100%;
          border-radius: 32px;
          object-fit: cover;
        }
        @media (max-width: 900px) {
          .create-modal {
            max-width: 600px;
            width: 95%;
          }
          .create-modal-content {
            flex-direction: column;
            height: auto;
          }
          .create-modal-right {
            display: none;
          }
          .create-modal-left {
            padding: 32px;
          }
           .create-back-btn {
            align-self: flex-start;
            text-align: center;
            width: 100%;
            min-width: 0;
            padding: 12px;
          }
        }
        @media (max-width: 640px) {
          .create-modal {
            border-radius: 16px;
            width: 92%;
            margin: 0;
          }
          .create-modal-left {
            padding: 24px 20px;
          }
          .create-title {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  )
}

