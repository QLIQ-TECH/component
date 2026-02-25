import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchRedeemableCashBalance } from '@/store/slices/walletSlice'
import styles from './cashWallet.module.css'

export default function CashWallet() {
  const dispatch = useDispatch()
  const { redeemableCashUsd, redeemableCashAed, cashLoading } = useSelector(state => state.wallet)

  useEffect(() => {
    dispatch(fetchRedeemableCashBalance())
  }, [dispatch])

  return (
    <div className={styles.walletHeader}>
      <div className={styles.balanceCard}>
        <div className={styles.balanceRow}>
          <img src="/cashwallet.svg" alt="Cash Wallet" width="40" height="40" />
          <span className={styles.walletLabel}>Cash Wallet</span>
        </div>
        <h3 className={styles.balanceTitle}>
          {cashLoading ? '...' : `AED ${redeemableCashAed.toFixed(2)}`}
        </h3>
        <p className={styles.balanceSubtitle}>
          {cashLoading ? '' : `$${redeemableCashUsd.toFixed(2)}`}
        </p>
        {/* <button className={styles.withdrawBtn}>Send Request To Withdraw</button> */}
        {/* <button className={styles.useQoynsBtn}>Use Qoyns To Shop</button> */}
      </div>
    </div>
  )
}
