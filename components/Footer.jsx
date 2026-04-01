'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useToast } from '@/contexts/ToastContext'
import { settler } from '@/store/api/endpoints'

export default function Footer() {
  const router = useRouter()
  const { show: showToast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoinNewsletter = async (e) => {
    e.preventDefault()

    // Validate inputs
    if (!name.trim()) {
      showToast('Please enter your name', 'error')
      return
    }

    if (!email.trim()) {
      showToast('Please enter your email', 'error')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(settler.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to subscribe to newsletter')
      }

      // Success
      showToast('Successfully subscribed to newsletter!', 'success')
      setName('')
      setEmail('')
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      const errorMessage = error.message || 'Failed to subscribe. Please try again later.'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Top Section - Branding and Newsletter */}
        <div className="footer-top">
          <div className="footer-branding">
            <div className="footer-logo" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <Image
                src="/iqliq.jpg"
                alt="IQLIQ Logo"
                width={100}
                height={60}
                style={{ aspectRatio: 'contain' }}
              />
            </div>

            {/* Mobile Navigation Grid - Only visible on mobile, appears after logo */}
            <div className="mobile-nav-grid">
              <div className="nav-column">
                <a href="/" className="nav-link">Discovery</a>
                <a href="/hypermarket" className="nav-link">Hypermarket</a>
                <a href="/stores" className="nav-link">Stores</a>
              </div>
              <div className="nav-column">
                <a href="/eshop" className="nav-link">E-Shop</a>
                <a href="/supermarket" className="nav-link">Supermarket</a>
                <a href="/privacy-policy" className="nav-link">Privacy Policy</a>
              </div>
              <div className="nav-column">
                <a href="/terms-and-conditions" className="nav-link">Terms of Service</a>
                <a href="/returns-and-exchange" className="nav-link">Returns & Exchange</a>
                <a href="/shipping-and-delivery" className="nav-link">Shipping & Delivery</a>
              </div>
            </div>

            <p className="footer-description">
            Let us keep you updated with the latest offers, hottest deals, crazy promotions, new brands and much more.
            </p>
          </div>

          <div className="newsletter-section">
            <h3 className="newsletter-title">Stay In Loop</h3>
            <p className="newsletter-description">
              Be the first to know about our exclusive offers, newest collections, and latest products!
            </p>
            <form className="newsletter-form" onSubmit={handleJoinNewsletter}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="newsletter-input"
                />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="newsletter-input"
                />
                <button type="submit" className="join-button" disabled={loading}>
                  {loading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Middle Section - Navigation Links */}
        <div className="footer-navigation">
          <a href="/" className="nav-link">Discovery</a>
          <a href="/hypermarket" className="nav-link">Hypermarket</a>
          <a href="/stores" className="nav-link">Stores</a>
          <a href="/eshop" className="nav-link">E-Shop</a>
          <a href="/supermarket" className="nav-link">Supermarket</a>
          <a href="/privacy-policy" className="nav-link">Privacy Policy</a>
          <a href="/terms-and-conditions" className="nav-link">Terms of Service</a>
          <a href="/returns-and-exchange" className="nav-link">Returns & Exchange</a>
          <a href="/shipping-and-delivery" className="nav-link">Shipping & Delivery</a>
        </div>
        <div className="white-line-divider"></div>
        {/* Bottom Section - Copyright and Social Media */}
        <div className="footer-bottom">
          <div className="copyright">
            <span>© 2025 IQliq</span>
          </div>
          <div className="social-media">
            <a href="https://www.facebook.com/people/IQLIQ/61583990447382/#" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 12.3038C22 6.74719 17.5229 2.24268 12 2.24268C6.47715 2.24268 2 6.74719 2 12.3038C2 17.3255 5.65684 21.4879 10.4375 22.2427V15.2121H7.89844V12.3038H10.4375V10.0872C10.4375 7.56564 11.9305 6.1728 14.2146 6.1728C15.3088 6.1728 16.4531 6.36931 16.4531 6.36931V8.84529H15.1922C13.95 8.84529 13.5625 9.6209 13.5625 10.4166V12.3038H16.3359L15.8926 15.2121H13.5625V22.2427C18.3432 21.4879 22 17.3257 22 12.3038Z" fill="white" />
              </svg>
            </a>
            <a href="https://www.instagram.com/iqliqlive?igsh=MWQ4NGIxemJuMTVvMg==" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M16 3.24268H8C5.23858 3.24268 3 5.48126 3 8.24268V16.2427C3 19.0041 5.23858 21.2427 8 21.2427H16C18.7614 21.2427 21 19.0041 21 16.2427V8.24268C21 5.48126 18.7614 3.24268 16 3.24268ZM19.25 16.2427C19.2445 18.0353 17.7926 19.4872 16 19.4927H8C6.20735 19.4872 4.75549 18.0353 4.75 16.2427V8.24268C4.75549 6.45003 6.20735 4.99817 8 4.99268H16C17.7926 4.99817 19.2445 6.45003 19.25 8.24268V16.2427ZM16.75 8.49268C17.3023 8.49268 17.75 8.04496 17.75 7.49268C17.75 6.9404 17.3023 6.49268 16.75 6.49268C16.1977 6.49268 15.75 6.9404 15.75 7.49268C15.75 8.04496 16.1977 8.49268 16.75 8.49268ZM12 7.74268C9.51472 7.74268 7.5 9.7574 7.5 12.2427C7.5 14.728 9.51472 16.7427 12 16.7427C14.4853 16.7427 16.5 14.728 16.5 12.2427C16.5027 11.0484 16.0294 9.90225 15.1849 9.05776C14.3404 8.21327 13.1943 7.74002 12 7.74268ZM9.25 12.2427C9.25 13.7615 10.4812 14.9927 12 14.9927C13.5188 14.9927 14.75 13.7615 14.75 12.2427C14.75 10.7239 13.5188 9.49268 12 9.49268C10.4812 9.49268 9.25 10.7239 9.25 12.2427Z" fill="white" />
              </svg>
            </a>
            <a href="https://x.com/iqliq99526" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="X (Twitter)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white" />
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/iqliq/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.5 3.24268C3.67157 3.24268 3 3.91425 3 4.74268V19.7427C3 20.5711 3.67157 21.2427 4.5 21.2427H19.5C20.3284 21.2427 21 20.5711 21 19.7427V4.74268C21 3.91425 20.3284 3.24268 19.5 3.24268H4.5ZM8.52076 7.2454C8.52639 8.20165 7.81061 8.79087 6.96123 8.78665C6.16107 8.78243 5.46357 8.1454 5.46779 7.24681C5.47201 6.40165 6.13998 5.72243 7.00764 5.74212C7.88795 5.76181 8.52639 6.40728 8.52076 7.2454ZM12.2797 10.0044H9.75971H9.7583V18.5643H12.4217V18.3646C12.4217 17.9847 12.4214 17.6047 12.4211 17.2246C12.4203 16.2108 12.4194 15.1959 12.4246 14.1824C12.426 13.9363 12.4372 13.6804 12.5005 13.4455C12.7381 12.568 13.5271 12.0013 14.4074 12.1406C14.9727 12.2291 15.3467 12.5568 15.5042 13.0898C15.6013 13.423 15.6449 13.7816 15.6491 14.129C15.6605 15.1766 15.6589 16.2242 15.6573 17.2719C15.6567 17.6417 15.6561 18.0117 15.6561 18.3815V18.5629H18.328V18.3576C18.328 17.9056 18.3278 17.4537 18.3275 17.0018C18.327 15.8723 18.3264 14.7428 18.3294 13.6129C18.3308 13.1024 18.276 12.599 18.1508 12.1054C17.9638 11.3713 17.5771 10.7638 16.9485 10.3251C16.5027 10.0129 16.0133 9.81178 15.4663 9.78928C15.404 9.78669 15.3412 9.7833 15.2781 9.77989C14.9984 9.76477 14.7141 9.74941 14.4467 9.80334C13.6817 9.95662 13.0096 10.3068 12.5019 10.9241C12.4429 10.9949 12.3852 11.0668 12.2991 11.1741L12.2797 11.1984V10.0044ZM5.68164 18.5671H8.33242V10.01H5.68164V18.5671Z" fill="white" />
              </svg>
            </a>
            <a href="https://www.youtube.com/@Iqliq2025" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="YouTube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21.5931 7.20301C21.4792 6.78041 21.2566 6.39501 20.9475 6.08518C20.6383 5.77534 20.2534 5.55187 19.8311 5.43701C18.2651 5.00701 12.0001 5.00001 12.0001 5.00001C12.0001 5.00001 5.73609 4.99301 4.16909 5.40401C3.74701 5.52415 3.36291 5.75078 3.05365 6.06214C2.7444 6.3735 2.52037 6.75913 2.40309 7.18201C1.99009 8.74801 1.98609 11.996 1.98609 11.996C1.98609 11.996 1.98209 15.26 2.39209 16.81C2.62209 17.667 3.29709 18.344 4.15509 18.575C5.73709 19.005 11.9851 19.012 11.9851 19.012C11.9851 19.012 18.2501 19.019 19.8161 18.609C20.2386 18.4943 20.6238 18.2714 20.9337 17.9622C21.2436 17.653 21.4675 17.2682 21.5831 16.846C21.9971 15.281 22.0001 12.034 22.0001 12.034C22.0001 12.034 22.0201 8.76901 21.5931 7.20301ZM9.99609 15.005L10.0011 9.00501L15.2081 12.01L9.99609 15.005Z" fill="white" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: #000;
          color: #fff;
          padding: 60px;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .footer-content {
          max-width: 1360px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          padding-right: 12px;
          padding-left: 12px;
          gap: 30px;
        }


        /* Top Section */
        .footer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 100px;
        }

        .footer-branding {
          flex: 1;
          max-width: 600px;
        }

        .footer-logo {
          margin-bottom: 16px;
          position: relative;
        }

        .footer-description {
          font-size: 16px;
          line-height: 1.6;
          color: #fff;
          margin: 0;
        }

        .newsletter-section {
          flex: 1;
        }

        .newsletter-title {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 8px 0;
        }

        .newsletter-description {
          font-size: 14px;
          line-height: 1.5;
          color: #fff;
          margin: 0 0 20px 0;
        }

        .newsletter-form {
          width: 100%;
        }

        .input-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .newsletter-input {
          flex: 1;
          padding: 12px 16px;
          background: #000;
          border: 1px solid #fff;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .newsletter-input::placeholder {
          color: #fff;
          opacity: 0.7;
        }

        .newsletter-input:focus {
          border-color: #0082FF;
        }

        .join-button {
          padding: 12px 40px;
          background: #fff;
          color: #000;
          border: none;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .join-button:hover:not(:disabled) {
          background: #f0f0f0;
          transform: translateY(-1px);
        }

        .join-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Middle Section - Navigation */
        .footer-navigation {
          display: flex;
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
          justify-content: space-between;
          align-items: center;
        }

        /* Mobile Navigation Grid - Hidden by default (desktop) */
        .mobile-nav-grid {
          display: none;
        }

        .nav-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .nav-link {
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s ease;
          white-space: nowrap;
        }

        .nav-link:hover {
          color: #0082FF;
        }
          .white-line-divider {
            width: 100%;
            height: 2px;
            background: #fff;
          }

        /* Bottom Section */
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .copyright {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
        }

        .social-media {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          transition: transform 0.2s ease;
        }

        .social-link:hover {
          transform: scale(1.1);
        }

        /* Responsive Design */
        @media (max-width: 1024px) and (min-width: 768px) {
          .footer-top {
            flex-direction: row;
          }

          .footer-branding {
            flex: 1;
            max-width: 50%;
          }

          .newsletter-section {
            flex: 1;
            max-width: 50%;
          }

          .footer-navigation {
            display: none;
          }

          .mobile-nav-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            width: 100%;
            padding: 20px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            margin-bottom: 16px;
          }

          .nav-column {
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .nav-column .nav-link {
            font-size: 11px;
            line-height: 1.4;
            white-space: normal;
          }

          .white-line-divider {
            display: none;
          }
          
          .input-group {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .footer-bottom {
            display: flex;
            flex-direction: row;
            gap: 20px;
            align-items: center;
            justify-content: space-between;
            margin-top: 0px;
            width: 100%;
            padding-bottom: 20px;
          }

          .social-media {
            display: flex;
            gap: 20px;
            align-items: center;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .footer-top {
            flex-direction: row;
            gap: 30px;
          }

          .footer-branding,
          .newsletter-section {
            max-width: none;
          }

          .footer {
            padding: 40px 24px 30px;
          }

          .footer-content {
            gap: 24px;
          }

          /* Hide desktop navigation on mobile */
          .footer-navigation {
            display: none;
          }

          /* Show mobile navigation grid */
          .mobile-nav-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            width: 100%;
            padding: 20px 0;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          }

          .nav-column {
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .nav-column .nav-link {
            font-size: 12px;
            line-height: 1.4;
            white-space: normal;
          }

          .input-group {
            flex-direction: column;
            gap: 12px;
          }

          .newsletter-input {
            width: 100%;
          }

          .join-button {
            width: 100%;
          }

          .footer-bottom {
            flex-direction: row;
            gap: 20px;
            margin-bottom: 30px;
            align-items: center;
            justify-content: space-between;
          }

          .social-media {
            gap: 20px;
          }

          /* Hide the white line divider on mobile since nav is moved */
          .white-line-divider {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .footer {
            padding: 30px 16px 24px;
          }

          .logo-image {
            width: 100px;
            height: auto;
          }

          .newsletter-title {
            font-size: 18px;
          }

          .mobile-nav-grid {
            gap: 12px;
          }

          .nav-column .nav-link {
            font-size: 11px;
          }
        }
      `}</style>
    </footer>
  )
}