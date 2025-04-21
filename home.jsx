import { createSignal } from 'solid-js';

export default function Home() {
  const [count, setCount] = createSignal(0);

  return (
    <div style={{
      color: 'white',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <h1>Welcome to BloxClash</h1>
      <p>This is the home page.</p>

      <button
        onClick={() => setCount(count() + 1)}
        style={{
          padding: '0.5rem 1rem',
          marginTop: '1rem',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Clicks: {count()}
      </button>
    </div>
  );
}
