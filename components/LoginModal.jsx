import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '@/store/slices/authSlice'
import { useToast } from '@/contexts/ToastContext'

export default function LoginModal({ open, onClose, onOpenForgotPassword, onOpenCreateModal }) {
  const { login } = useAuth()
  const dispatch = useDispatch()
  const authState = useSelector(state => state.auth)
  const { show } = useToast()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const resetForm = () => {
    setFormData({ email: '', password: '' })
    setErrors({ email: '', password: '' })
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const resultAction = await dispatch(loginUser({ 
      email: formData.email, 
      password: formData.password 
    }))
    
    if (loginUser.fulfilled.match(resultAction)) {
      const payload = resultAction.payload
      const token = payload?.tokens?.accessToken
      const user = payload?.user
      if (token && user) {
        login(user, token)
        // Don't show message here - AuthContext already shows it
        // Reset form data before closing
        resetForm()
        onClose()
      }
    } else if (loginUser.rejected.match(resultAction)) {
      const errMsg = resultAction.payload || 'Login failed'
      
      // Set specific error messages based on the error
      if (typeof errMsg === 'string') {
        if (errMsg.toLowerCase().includes('email') || errMsg.toLowerCase().includes('user')) {
          setErrors(prev => ({
            ...prev,
            email: 'Invalid email address'
          }))
        } else if (errMsg.toLowerCase().includes('password')) {
          setErrors(prev => ({
            ...prev,
            password: 'Incorrect password'
          }))
        } else {
          setErrors(prev => ({
            ...prev,
            email: 'Invalid email or password',
            password: 'Invalid email or password'
          }))
        }
      } else {
        setErrors(prev => ({
          ...prev,
          email: 'Login failed',
          password: 'Login failed'
        }))
      }
    }
  }

  const handleCreateAccount = (e) => {
    e.preventDefault()
    resetForm() // Reset login form when switching to create flow
    if (onOpenCreateModal) {
      onOpenCreateModal()
    }
  }

  // Reset form data when modal is closed
  const handleLoginModalClose = () => {
    resetForm()
    onClose() // Close login modal
  }


  if (!open) return null
  return (
    <>
      <div className="login-modal-overlay">
        <div className="login-modal">
          <button className="login-modal-close" onClick={handleLoginModalClose}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#F5F5F5" />
              <path d="M9 9L19 19M19 9L9 19" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="login-modal-content">
            <div className="login-modal-left">
              <h1 className="login-title">Welcome to IQLIQ</h1>
              <p className="login-desc">
              Home to the best deals and big savings. Log in to shop, earn, save & share!
              </p>
              <form className="login-form">
                <div className="login-field">
                  <label className="login-label">Email</label>
                  <input 
                    className={`login-input ${errors.email ? 'login-input-error' : ''}`}
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email" 
                  />
                  {errors.email && <span className="login-error">{errors.email}</span>}
                </div>
                <div className="login-field">
                  <div className="login-password-row">
                    <label className="login-label">Password</label>
                    <span className="login-forgot" onClick={onOpenForgotPassword}>Forget password?</span>
                  </div>
                  <div className="login-password-input-wrapper">
                    <input 
                      className={`login-input ${errors.password ? 'login-input-error' : ''}`}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password" 
                    />
                    <button 
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <span className="login-error">{errors.password}</span>}
                </div>
                <div className="login-btn-row">
                  <button type="button" className="login-create-btn" onClick={handleCreateAccount}>Create Account</button>
                  <button type="submit" className="login-btn" onClick={handleLogin} disabled={authState.loading}>
                    {authState.loading ? 'Logging in...' : 'Login'}
                  </button>
                </div>
              </form>
              <div className="login-divider-row">
                <hr className="login-divider" />
                <span className="login-divider-text">Login with</span>
                <hr className="login-divider" />
              </div>
              <div className="login-social-row">
                <button className="login-social-btn"><img src="/google.svg" alt="Google" /></button>
                <button className="login-social-btn"><img src="/facebook.svg" alt="Facebook" /></button>
                <button className="login-social-btn"><img src="/tiktok.svg" alt="TikTok" /></button>
                <button className="login-social-btn"><img src="/insta.svg" alt="Instagram" /></button>
              </div>
            </div>
            <div className="login-modal-right">
              <Image
                src="/loginImage.jpg"
                alt="Login"
                width={610}
                height={740}
                className="login-image"
                style={{ borderRadius: '32px', objectFit: 'cover', width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      
      <style jsx>{`
        .login-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.18);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-modal {
          background: #fff;
          border-radius: 32px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          max-width: 900px;
          width: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .login-modal-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
          z-index: 2;
        }
        .login-modal-content {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: 700px;
        }
        .login-modal-left {
          flex: 1;
          padding: 48px 40px 48px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .login-title {
          font-size: 40px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #000;
        }
        .login-desc {
          font-size: 16px;
          color: #000;
          margin-bottom: 32px;
          line-height: 150%;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .login-field {
          display: flex;
          flex-direction: column;
        }
        .login-label {
          font-size: 16px;
          color: #222;
          font-weight: 600;
        }
        .login-password-input-wrapper {
          position: relative;
          width: 100%;
        }
        .login-input {
          width: 100%;
          border: 1px solid #E5E5E5;
          border-radius: 16px;
          padding: 16px;
          padding-right: 48px;
          font-size: 16px;
          font-weight: 500;
          color: #222;
          margin-bottom: 8px;
          transition: border-color 0.2s;
        }
        .login-input:focus {
          outline: none;
          border-color: #0082FF;
        }
        .login-input-error {
          border-color: #FF4444;
        }
        .login-password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #888;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          margin-top: -4px;
        }
        .login-password-toggle:hover {
          color: #0082FF;
        }
        .login-password-toggle svg {
          width: 20px;
          height: 20px;
        }
        .login-error {
          color: #FF4444;
          font-size: 14px;
          margin-top: 4px;
          margin-bottom: 8px;
        }
        .login-password-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .login-forgot {
          font-size: 14px;
          color: #888;
          cursor: pointer;
        }
        .login-forgot:hover {
          color: #0082FF;
        }
        .login-btn-row {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }
        .login-create-btn,
        .login-btn {
          min-width: 200px;
          width: 200px;
          text-align: center;
        }
        .login-create-btn {
          background: #fff;
          border: 1px solid #0082FF;
          color: #000;
          border-radius: 100px;
          padding: 12px 32px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
        }
        .login-btn {
          background: #CBE6FF;
          color: #0082FF;
          border-radius: 100px;
          border: none;
          padding: 12px 32px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
        }
        .login-divider-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 32px 0 16px 0;
        }
        .login-divider {
          flex: 1;
          border: none;
          border-top: 1px solid #E5E5E5;
        }
        .login-divider-text {
          font-size: 14px;
          color: #888;
          font-weight: 500;
        }
        .login-social-row {
          display: flex;
          justify-content: center;
          gap: 24px;
        }
        .login-social-btn {
          background: #fff;
          border: 1px solid #E5E5E5;
          border-radius: 100px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .login-social-btn:hover {
          box-shadow: 0 2px 8px rgba(0,130,255,0.12);
        }
        .login-modal-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 48px 48px 0;
        }
        .login-image {
          width: 100%;
          height: 100%;
          border-radius: 32px;
          object-fit: cover;
        }
        @media (max-width: 900px) {
          .login-modal {
            max-width: 600px;
            width: 95%;
          }
          .login-modal-content {
            flex-direction: column;
            height: auto;
          }
          .login-modal-right {
            display: none;
          }
          .login-modal-left {
            padding: 32px;
          }
          .login-btn-row {
            width: 100%;
          }
          .login-create-btn,
          .login-btn {
            min-width: 0;
            flex: 1;
            padding: 12px;
          }
        }
        @media (max-width: 600px) {
          .login-modal {
            border-radius: 16px;
            width: 92%;
          }
          .login-modal-left {
            padding: 24px 20px;
          }
          .login-title {
            font-size: 32px;
          }
        }
      `}</style>
    </>
  )
}