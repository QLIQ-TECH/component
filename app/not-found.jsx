export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>404</h1>
      <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Page Not Found</h2>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
        The page you are looking for does not exist.
      </p>
      <a
        href="/"
        style={{
          padding: '12px 24px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '16px'
        }}
      >
        Go Home
      </a>
    </div>
  )
}
