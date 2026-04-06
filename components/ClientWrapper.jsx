'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingScreen from './LoadingScreen'
import BotContainer from './BotContainer'

export default function ClientWrapper({ children }) {
  const { isInitialized } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading screen until client-side hydration is complete
  if (!isClient || !isInitialized) {
    return <LoadingScreen />
  }

  return (
    <>
      {children}
      <BotContainer />
    </>
  )
}
