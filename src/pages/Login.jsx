import { useState } from 'react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic
    console.log('Login:', email, password);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg)',
      gap: 24,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>Billing App</div>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: 300,
      }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius)',
            border: `1px solid var(--border)`,
            fontSize: 14,
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius)',
            border: `1px solid var(--border)`,
            fontSize: 14,
          }}
        />
        <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>Sign In</button>
      </form>
    </div>
  );
}
