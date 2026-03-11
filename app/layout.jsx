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
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  }),
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
        {/* Google tag (gtag.js) - GA4 */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-2505FNDQFZ"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2505FNDQFZ');
            `,
          }}
        />
        {/* Microsoft Clarity */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "vitdhhur1w");
            `,
          }}
        />
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
