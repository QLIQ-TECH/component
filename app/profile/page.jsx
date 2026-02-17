'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, fetchOrders, fetchUserAddresses } from '@/store/slices/profileSlice'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Image from 'next/image'
import styles from './profile.module.css'
import PersonalInfo from '../../components/profile/PersonalInfo/PersonalInfo'
import CashWallet from '../../components/profile/CashWallet/CashWallet'
import QoynsWallet from '../../components/profile/QoynsWallet/QoynsWallet'
import Orders from '../../components/profile/Orders/Orders'
import Addresses from '../../components/profile/Addresses/Addresses'
import AddCard from '../../components/profile/AddCard/AddCard'
import QoynsHistory from '../../components/profile/QoynsHistory/QoynsHistory'
import SendQoyn from '../../components/profile/SendQoyn/SendQoyn'
import NewAddress from '../../components/profile/NewAddress/newAddress'
import LocationModal from '../../components/LocationModal'

// User data is now fetched once in the main ProfilePage component and passed down

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()
  const { user, addresses, orders, ordersPagination, loading, loadingAddresses, ordersLoading, error, addressError } = useSelector(state => state.profile)
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'personal-info')
  const [isEditing, setIsEditing] = useState(false)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [comingSoonOpen, setComingSoonOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const normalizeStatus = (value) => {
    if (!value) return ''
    const v = String(value).toLowerCase().trim()
    if (v === 'delivered' || v === 'completed') return 'delivered'
    if (v === 'pending') return 'pending'
    if (v === 'rejected' || v === 'reject' || v === 'cancelled' || v === 'canceled') return 'rejected'
    if (v === 'accepted' || v === 'processing' || v === 'in-transit' || v === 'in transit' || v === 'shipped') return 'accepted'
    return v
  }

  const labelizeStatus = (value) => {
    const v = normalizeStatus(value)
    switch (v) {
      case 'delivered': return 'Delivered'
      case 'pending': return 'Pending'
      case 'rejected': return 'Rejected'
      case 'accepted': return 'Accepted'
      default:
        return String(value || '').replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
    }
  }

  const uniqueStatuses = Array.from(new Set((orders || []).map(o => normalizeStatus(o?.status)).filter(Boolean)))
  const filteredOrders = selectedStatus === 'all' ? orders : (orders || []).filter(o => normalizeStatus(o?.status) === selectedStatus)

  // Calculate pagination info
  const totalPages = ordersPagination?.totalPages || 1
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return
    }
    setCurrentPage(page)
    // Scroll to top of orders section
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrevious = () => handlePageChange(currentPage - 1)
  const handleNext = () => handlePageChange(currentPage + 1)

  // Fetch profile data only when on tabs that require it
  useEffect(() => {
    const tabsThatDoNotNeedProfile = new Set(['orders', 'qoyns-wallet', 'qoyns-history', 'send-qoyn'])
    if (!tabsThatDoNotNeedProfile.has(activeTab)) {
      dispatch(fetchProfile())
    }
  }, [dispatch, activeTab])

  // Fetch orders when orders tab becomes active or page changes
  useEffect(() => {
    if (activeTab === 'orders') {
      dispatch(fetchOrders({ page: currentPage, limit: pageSize }))
    }
  }, [activeTab, dispatch, currentPage, pageSize])

  // Reset to page 1 when status filter changes
  useEffect(() => {
    if (activeTab === 'orders' && currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [selectedStatus, activeTab])

  // Fetch addresses when addresses tab becomes active
  useEffect(() => {
    if (activeTab === 'addresses') {
      dispatch(fetchUserAddresses())
    }
  }, [activeTab, dispatch])

  // Initialize active tab from URL parameter (and react to changes)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab')
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams, activeTab])

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    const url = new URL(window.location)
    url.searchParams.set('tab', tabId)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  // Handle navigation from NewAddress component
  const handleNewAddressCancel = () => {
    handleTabChange('addresses')
  }

  const handleNewAddressSave = () => {
    // TODO: Implement save address functionality
    handleTabChange('addresses')
  }

  const handleNewCardCancel = () => {
    handleTabChange('cash-wallet')
  }

  const handleNewCardSave = () => {
    // TODO: Implement save address functionality
    handleTabChange('cash-wallet')
  }

  const handleSendQoynCancel = () => {
    handleTabChange('qoyns-wallet')
  }

  const handleSendQoynSave = () => {
    // TODO: Implement save address functionality
    handleTabChange('qoyns-wallet')
  }

  const handleGoLiveClick = () => {
    window.open('https://iqliqlive.ae/', '_blank')
  }

  // Only show cash wallet tab for influencer role
  const tabs = [
    { id: 'personal-info', label: 'Personal Info' },
    ...(user?.role === 'influencer' ? [{ id: 'cash-wallet', label: 'Cash Wallet' }] : []),
    { id: 'qoyns-wallet', label: 'Qoyns Wallet' },
    { id: 'orders', label: 'Orders' },
    { id: 'addresses', label: 'Addresses' },
  ]

  return (
    <div className={styles.profilePage}>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.textContent}>
            <h1 className={styles.title}>MY PROFILE</h1>
            <p className={styles.subtitle}>
            Welcome to IQLIQ where you NEVER have to pay a full price for buying your favorite stuff  again!
            </p>
          </div>
          <div className={styles.actionTop}>
            <button className={styles.goLiveBtn} onClick={handleGoLiveClick}>Go to QLIQ Live</button>
            <button 
              className={styles.upgradeBtn}
              onClick={() => setComingSoonOpen(true)}
            >
              Upgrade to QLIQ Plus
            </button>
          </div>
        </div>
        <div className={styles.profileContent}>
          <div className={styles.tabsRow}>
            <div className={styles.tabsContainer}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* {activeTab === 'cash-wallet' && (
              <button
                className={styles.addCardBtn}
                onClick={() => handleTabChange('add-card')}
              >
                Add New Card
              </button>
            )} */}
            {activeTab === 'qoyns-wallet' || activeTab === 'qoyns-history' || activeTab === 'send-qoyn' ? (
              <div className={styles.qoynsActionsRow}>
                <button
                  className={`${styles.addCardBtn} ${activeTab === 'qoyns-history' ? styles.active : ''}`}
                  onClick={() => handleTabChange('qoyns-history')}
                >
                  History
                </button>
              </div>
            ) : null}
            {activeTab === 'orders' && (
              <div className={styles.qoynsActionsRow}>
                <div className={styles.statusDropdownWrapper}>
                  <select 
                    className={styles.statusDropdown}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    {/* Ensure primary statuses are available in the dropdown if present */}
                    {['delivered','pending','rejected','accepted']
                      .filter(s => uniqueStatuses.includes(s))
                      .map(s => (
                        <option key={s} value={s}>{labelizeStatus(s)}</option>
                      ))}
                    {/* Include any other unknown statuses */}
                    {uniqueStatuses
                      .filter(s => !['delivered','pending','rejected','accepted'].includes(s))
                      .map(s => (
                        <option key={s} value={s}>{labelizeStatus(s)}</option>
                      ))}
                  </select>
                  <span className={styles.dropdownArrow}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4 7L9 12L14 7" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            )}
            {activeTab === 'addresses' && (
              <div className={styles.qoynsActionsRow}>
                <button 
                  className={styles.addCardBtn}
                  onClick={() => setLocationModalOpen(true)}
                >
                  Use my Current Location
                </button>
                <button
                  className={`${styles.addCardBtn} ${activeTab === 'new-address' ? styles.active : ''}`}
                  onClick={() => handleTabChange('new-address')}
                >
                  Add New Address
                </button>
              </div>
            )}
          </div>
          <div className={styles.mainContent}>
            {activeTab === 'orders' ? (
              <div className={styles.sectionContent}>
                {ordersLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    Loading orders...
                  </div>
                ) : (
                  <>
                    <Orders orders={filteredOrders} />
                    {!ordersLoading && totalPages > 1 && (
                      <div className={styles.paginationControls} role="navigation" aria-label="Orders pagination">
                        <button
                          type="button"
                          className={styles.paginationButton}
                          onClick={handlePrevious}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                        {pageNumbers.map((page) => (
                          <button
                            key={page}
                            type="button"
                            className={`${styles.paginationButton} ${page === currentPage ? styles.active : ''}`}
                            onClick={() => handlePageChange(page)}
                            aria-current={page === currentPage ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={styles.paginationButton}
                          onClick={handleNext}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : activeTab === 'qoyns-wallet' ? (
              <div className={styles.sectionContent}>
                <QoynsWallet user={user} />
              </div>
            ) : activeTab === 'qoyns-history' ? (
              <div className={styles.sectionContent}>
                <QoynsHistory user={user} />
              </div>
            ) : activeTab === 'send-qoyn' ? (
              <div className={styles.sectionContent}>
                <SendQoyn
                  onCancel={handleSendQoynCancel}
                  onSave={handleSendQoynSave}
                />
              </div>
            ) : (
              <>
                {loading && (
                  <div className={styles.sectionContent}>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      Loading profile data...
                    </div>
                  </div>
                )}
                {error && (
                  <div className={styles.sectionContent}>
                    <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                      Error loading profile: {error}
                    </div>
                  </div>
                )}
                {!loading && !error && (
                  <>
                {activeTab === 'personal-info' && (
                  <div className={styles.sectionContent}>
                    <PersonalInfo user={user} />
                  </div>
                )}
                {activeTab === 'cash-wallet' && user?.role === 'influencer' && (
                  <div className={styles.sectionContent}>
                    <CashWallet user={user} />
                  </div>
                )}
                {activeTab === 'add-card' && (
                  <div className={styles.sectionContent}>
                    <AddCard
                      onCancel={handleNewCardCancel}
                      onSave={handleNewCardSave}
                    />
                  </div>
                )}
                {activeTab === 'qoyns-wallet' && null}
                {activeTab === 'qoyns-history' && null}
                {activeTab === 'send-qoyn' && null}
                {activeTab === 'orders' && null}
                {activeTab === 'addresses' && (
                  <div className={styles.sectionContent}>
                    {loadingAddresses ? (
                      <div style={{ textAlign: 'center', padding: '40px' }}>
                        Loading addresses...
                      </div>
                    ) : addressError ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                        Error loading addresses: {addressError}
                      </div>
                    ) : (
                      <Addresses addresses={addresses} />
                    )}
                  </div>
                )}
                {activeTab === 'new-address' && (
                  <div className={styles.sectionContent}>
                    <NewAddress
                      onCancel={handleNewAddressCancel}
                      onSave={handleNewAddressSave}
                    />
                  </div>
                )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <LocationModal 
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
      {/* QLIQ Plus Coming Soon modal */}
      {comingSoonOpen && (
        <div className={styles.comingSoonOverlay} onClick={() => setComingSoonOpen(false)} role="dialog" aria-modal="true" aria-labelledby="coming-soon-title">
          <div className={styles.comingSoonModal} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className={styles.comingSoonClose}
              onClick={() => setComingSoonOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 id="coming-soon-title" className={styles.comingSoonTitle}>Coming Soon</h2>
            <p className={styles.comingSoonText}>
              QLIQ Plus is on its way. Stay tuned for exclusive benefits and more.
            </p>
            <button
              type="button"
              className={styles.comingSoonBtn}
              onClick={() => setComingSoonOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}