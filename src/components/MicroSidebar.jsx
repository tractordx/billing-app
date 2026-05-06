import { useState } from 'react';
import { Link } from 'react-router-dom';

export function MicroSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside style={{
      width: 'var(--side-w)',
      background: 'var(--sidebar-bg)',
      borderRight: `1px solid var(--sidebar-border)`,
      minHeight: '100vh',
      padding: '16px',
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link to="/" style={{ padding: '8px 12px', borderRadius: 'var(--radius)' }}>Dashboard</Link>
        <Link to="/bills" style={{ padding: '8px 12px', borderRadius: 'var(--radius)' }}>Bills</Link>
        <Link to="/contracts" style={{ padding: '8px 12px', borderRadius: 'var(--radius)' }}>Contracts</Link>
        <Link to="/vendors" style={{ padding: '8px 12px', borderRadius: 'var(--radius)' }}>Vendors</Link>
      </nav>
    </aside>
  );
}
