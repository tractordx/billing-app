import { useState } from 'react';
import { DownloadButton } from '../components/DownloadButton';

export function Bills() {
  const [bills, setBills] = useState([
    { id: 1, vendor: 'Acme Corp', amount: 1000, date: '2026-05-01', status: 'paid' },
    { id: 2, vendor: 'Tech Solutions', amount: 2500, date: '2026-05-02', status: 'pending' },
  ]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>Bills</div>
      <div style={{ display: 'grid', gap: 12 }}>
        {bills.map(bill => (
          <div key={bill.id} style={{
            padding: 16,
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: `1px solid var(--border)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{bill.vendor}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{bill.date}</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)' }}>${bill.amount}</div>
              <div style={{ fontSize: 12, padding: '4px 8px', background: bill.status === 'paid' ? 'var(--green-light)' : 'var(--yellow-light)', borderRadius: 'var(--radius)', color: bill.status === 'paid' ? 'var(--green)' : 'var(--yellow)' }}>{bill.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
