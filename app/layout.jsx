import './globals.css'
import { DM_Sans } from 'next/font/google'
import { AuthProvider } from '../contexts/AuthContext'
import { ReduxProvider } from '../store/ReduxProvider'
import { ToastProvider } from '../contexts/ToastContext'
import ClientWrapper from '../components/ClientWrapper'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata = {
  title: 'IQLIQ - Marketplace',
  description: 'Your one-stop marketplace for everything',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/favicon.png',
    shortcut: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSans.className}`}>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body>
        <ReduxProvider>
          <ToastProvider>
            <AuthProvider>
              <ClientWrapper>
                {children}
              </ClientWrapper>
            </AuthProvider>
          </ToastProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
