import { useState } from 'react';

export function Contracts() {
  const [contracts, setContracts] = useState([
    { id: 1, vendor: 'Acme Corp', value: 50000, startDate: '2026-01-01', endDate: '2027-01-01', status: 'active' },
    { id: 2, vendor: 'Tech Solutions', value: 75000, startDate: '2026-02-01', endDate: '2027-02-01', status: 'active' },
  ]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>Contracts</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid var(--border)` }}>
              <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: 'var(--text2)' }}>Vendor</th>
              <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: 'var(--text2)' }}>Value</th>
              <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: 'var(--text2)' }}>Start Date</th>
              <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: 'var(--text2)' }}>End Date</th>
              <th style={{ textAlign: 'left', padding: 12, fontWeight: 600, color: 'var(--text2)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract.id} style={{ borderBottom: `1px solid var(--border)` }}>
                <td style={{ padding: 12, color: 'var(--text)' }}>{contract.vendor}</td>
                <td style={{ padding: 12, color: 'var(--text)' }}>${contract.value.toLocaleString()}</td>
                <td style={{ padding: 12, color: 'var(--text2)' }}>{contract.startDate}</td>
                <td style={{ padding: 12, color: 'var(--text2)' }}>{contract.endDate}</td>
                <td style={{ padding: 12 }}><span style={{ padding: '4px 8px', background: 'var(--lime-light)', color: 'var(--lime)', borderRadius: 'var(--radius)', fontSize: 12 }}>{contract.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
