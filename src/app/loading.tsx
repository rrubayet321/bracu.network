export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#08090a',
        gap: 20,
      }}
    >
      {/* Ring spinner */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '1.5px solid rgba(94,106,210,0.15)',
          borderTopColor: '#5e6ad2',
          animation: 'spin 0.75s linear infinite',
        }}
      />

      <span
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#3d3f45',
        }}
      >
        bracu.network
      </span>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
