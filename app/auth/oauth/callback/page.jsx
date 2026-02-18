'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useDispatch } from 'react-redux'
import { loginUser } from '@/store/slices/authSlice'
import { auth } from '@/store/api/endpoints'
import { encryptText } from '@/utils/crypto'

export default function OAuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const dispatch = useDispatch()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const errorParam = searchParams.get('error')

        // Check for OAuth errors
        if (errorParam) {
          setError(`OAuth error: ${errorParam}`)
          setLoading(false)
          setTimeout(() => {
            router.push('/')
          }, 3000)
          return
        }

        if (!code) {
          setError('Authorization code not found')
          setLoading(false)
          setTimeout(() => {
            router.push('/')
          }, 3000)
          return
        }

        // Verify state (optional but recommended for security)
        if (typeof window !== 'undefined') {
          const storedState = sessionStorage.getItem('oauth_state')
          if (storedState && state !== storedState) {
            setError('Invalid state parameter. Possible CSRF attack.')
            setLoading(false)
            setTimeout(() => {
              router.push('/')
            }, 3000)
            return
          }
          sessionStorage.removeItem('oauth_state')
        }

        // Exchange code for tokens via backend
        const redirectUri = `${window.location.origin}/auth/oauth/callback`
        const response = await fetch(
          `${auth.oauthCallback}?code=${encodeURIComponent(code)}&redirectUri=${encodeURIComponent(redirectUri)}${state ? `&state=${encodeURIComponent(state)}` : ''}`
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to process OAuth callback' }))
          throw new Error(errorData.message || 'Failed to process OAuth callback')
        }

        const data = await response.json()

        if (data.user && data.tokens) {
          // Store tokens in cookies
          if (typeof document !== 'undefined') {
            const maxAge = data.tokens.expiresIn || 60 * 60 * 24
            if (data.user.cognitoUserId) {
              const encId = await encryptText(String(data.user.cognitoUserId))
              document.cookie = `cognitoId=${encodeURIComponent(encId)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`
            }
            if (data.user.id) {
              const encUser = await encryptText(String(data.user.id))
              document.cookie = `userId=${encodeURIComponent(encUser)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`
            }
            if (data.tokens.accessToken) {
              const encTok = await encryptText(String(data.tokens.accessToken))
              document.cookie = `accessToken=${encodeURIComponent(encTok)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`
            }
          }

          // Login user
          login(data.user, data.tokens.accessToken, true)

          // Redirect to home page
          router.push('/')
        } else {
          throw new Error('Invalid response from OAuth callback')
        }
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError(err.message || 'Failed to complete login')
        setLoading(false)
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, router, login])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #0082FF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ fontSize: '18px', color: '#666' }}>Completing login...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '20px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <h1 style={{ fontSize: '24px', color: '#FF4444', margin: 0 }}>Login Failed</h1>
        <p style={{ fontSize: '16px', color: '#666', textAlign: 'center', maxWidth: '400px' }}>{error}</p>
        <p style={{ fontSize: '14px', color: '#999' }}>Redirecting to home page...</p>
      </div>
    )
  }

  return null
}
