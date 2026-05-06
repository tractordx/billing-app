import { useState } from 'react';

export function Vendors() {
  const [vendors, setVendors] = useState([
    { id: 1, name: 'Acme Corp', contact: 'John Doe', email: 'john@acme.com', phone: '555-0001', status: 'active' },
    { id: 2, name: 'Tech Solutions', contact: 'Jane Smith', email: 'jane@tech.com', phone: '555-0002', status: 'active' },
    { id: 3, name: 'Global Services', contact: 'Bob Johnson', email: 'bob@global.com', phone: '555-0003', status: 'inactive' },
  ]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>Vendors</div>
      <div style={{ display: 'grid', gap: 12 }}>
        {vendors.map(vendor => (
          <div key={vendor.id} style={{
            padding: 16,
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: `1px solid var(--border)`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{vendor.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Contact: {vendor.contact}</div>
              </div>
              <span style={{
                padding: '4px 12px',
                background: vendor.status === 'active' ? 'var(--lime-light)' : 'var(--red-light)',
                color: vendor.status === 'active' ? 'var(--lime)' : 'var(--red)',
                borderRadius: 'var(--radius)',
                fontSize: 12,
                fontWeight: 600,
              }}>{vendor.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 24 }}>
              <div>📧 {vendor.email}</div>
              <div>📞 {vendor.phone}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
