import { useState, useEffect } from 'react';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalBills: 0,
    totalVendors: 0,
    activeContracts: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    // Fetch dashboard stats
    setStats({
      totalBills: 45,
      totalVendors: 12,
      activeContracts: 8,
      pendingPayments: 3,
    });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, color: 'var(--text)' }}>Dashboard</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{
          padding: 20,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: `1px solid var(--border)`,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>TOTAL BILLS</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{stats.totalBills}</div>
        </div>
        <div style={{
          padding: 20,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: `1px solid var(--border)`,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>TOTAL VENDORS</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--primary)' }}>{stats.totalVendors}</div>
        </div>
        <div style={{
          padding: 20,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: `1px solid var(--border)`,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>ACTIVE CONTRACTS</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--lime)' }}>{stats.activeContracts}</div>
        </div>
        <div style={{
          padding: 20,
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: `1px solid var(--border)`,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>PENDING PAYMENTS</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--orange)' }}>{stats.pendingPayments}</div>
        </div>
      </div>
      <div style={{
        padding: 20,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid var(--border)`,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Recent Activity</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>No recent activity</div>
      </div>
    </div>
  );
}
