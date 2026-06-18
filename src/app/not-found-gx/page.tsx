export default function NotFoundGx() {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          color: '#000',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '24px', fontWeight: 700 }}>404</span>
          <span style={{ borderLeft: '1px solid #ccc', height: '40px' }} />
          <span style={{ fontSize: '14px' }}>This page could not be found.</span>
        </div>
      </div>
    );
  }
  