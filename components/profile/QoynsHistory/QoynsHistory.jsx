'use client'
import { useState, useEffect } from 'react'
import styles from './qoynsHistory.module.css'
import { wallet } from '@/store/api/endpoints'
import { decryptText } from '@/utils/crypto'

// Helper function to get auth token
const getToken = async () => {
  let token = ''
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';').map(c => c.trim())
    const tokenCookie = cookies.find(c => c.startsWith('accessToken='))
    if (tokenCookie) {
      try {
        const enc = decodeURIComponent(tokenCookie.split('=')[1] || '')
        token = await decryptText(enc)
      } catch (error) {
        console.error('Error decrypting token:', error)
      }
    }
  }
  return token
}

// Format date to display format
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleDateString('en-GB', { month: 'short' })
    const year = date.getFullYear()
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'pm' : 'am'
    const displayHours = hours % 12 || 12
    
    return `${day} ${month} ${year}, ${displayHours}:${minutes} ${ampm}`
  } catch (error) {
    return dateString
  }
}

export default function QoynsHistory() {
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRedeemHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const token = await getToken()
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await fetch(wallet.redeemHistory, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || `HTTP error ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success && result.data) {
          setHistoryData(result.data)
        } else {
          setHistoryData([])
        }
      } catch (err) {
        console.error('Error fetching redeem history:', err)
        setError(err.message)
        setHistoryData([])
      } finally {
        setLoading(false)
      }
    }

    fetchRedeemHistory()
  }, [])

  if (loading) {
    return (
      <div className={styles.historyList}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading history...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.historyList}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
          Error loading history: {error}
        </div>
      </div>
    )
  }

  if (historyData.length === 0) {
    return (
      <div className={styles.historyList}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No redeem history found
        </div>
      </div>
    )
  }

  return (
    <div className={styles.historyList}>
      {historyData.map((item, idx) => (
        <div className={styles.historyItem} key={idx}>
          <div className={styles.historyLeft}>
            <div className={styles.avatar}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#E5F0FF"/>
                <path d="M20 22c-3.333 0-6 1.333-6 4v2h12v-2c0-2.667-2.667-4-6-4zm0-2a3 3 0 100-6 3 3 0 000 6z" fill="#0082FF"/>
              </svg>
            </div>
            <div>
              <div className={styles.name}>{item.orderId || 'N/A'}</div>
              <div className={styles.date}>{formatDate(item.date)}</div>
            </div>
          </div>
          <div className={styles.amount}>Q {item.amount?.toLocaleString() || 0}</div>
        </div>
      ))}
    </div>
  )
}
