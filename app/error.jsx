'use client'

export default function Error({ error, reset }) {
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
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>500</h1>
      <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong!</h2>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
        {error?.message || 'An error occurred while processing your request.'}
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            padding: '12px 24px',
            backgroundColor: '#f0f0f0',
            color: '#333',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px'
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
