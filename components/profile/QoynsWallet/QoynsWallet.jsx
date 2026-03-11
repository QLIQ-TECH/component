import { useSelector, useDispatch } from 'react-redux'
import { fetchUserBalance } from '@/store/slices/walletSlice'
import { useEffect, useMemo } from 'react'
import styles from './qoynsWallet.module.css'

// Helper function to calculate days remaining until expiry
const calculateDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null
  
  try {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  } catch (error) {
    console.error('Error calculating days remaining:', error)
    return null
  }
}

// Helper function to format expiry date
const formatExpiryDate = (expiryDate) => {
  if (!expiryDate) return null
  
  try {
    const date = new Date(expiryDate)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting expiry date:', error)
    return null
  }
}

export default function QoynsWallet() {
  const dispatch = useDispatch()
  const { userQoynBalance, userBalance, storeCurrency, qoynExpiryDate, loading: walletLoading } = useSelector(state => state.wallet)

  useEffect(() => {
    dispatch(fetchUserBalance())
  }, [dispatch])

  const daysRemaining = useMemo(() => calculateDaysRemaining(qoynExpiryDate), [qoynExpiryDate])

  return (
    <div className={styles.walletHeader}>
      <div className={styles.QoynsCard}>
        <div className={styles.balanceRow}>
          <svg width="40" height="40" fill="none"><circle cx="12" cy="12" r="10" fill="#0082FF" /><path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <h3 className={styles.QoynsTitle}>My Qoyns Wallet</h3>
        </div>
        <div className={styles.QoynsBalance}>{userQoynBalance.toLocaleString()}</div>
        <div className={styles.CardDetails}>
          {daysRemaining !== null ? (
            <span className={styles.QoynsExiry}>
              Expires in {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'}
            </span>
          ) : (
            <span className={styles.QoynsExiry}>No expiry is available</span>
          )}
        </div>
      </div>
    </div>
  )
}
