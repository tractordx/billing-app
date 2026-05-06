import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fmt, fmtDate, daysAgo } from '../lib/utils'
import { StatusBadge } from '../components/StatusBadge'
import { Icon } from '../components/Icon'

const TABS = [
  { key: 'ALL',              label: 'All' },
  { key: 'PENDING_L1',      label: 'L1 Queue' },
  { key: 'PENDING_L2',      label: 'L2 Queue' },
  { key: 'PENDING_PAYMENT', label: 'To Pay' },
  { key: 'PAID',            label: 'Paid' },
  { key: 'REJECTED',        label: 'Rejected' },
]

const TH = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.03em', whiteSpace: 'nowrap' }

export function Bills() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const activeTab = searchParams.get('status') || 'ALL'

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('bills')
        .select('id,invoice_number,amount,status,billing_period_start,billing_period_end,anomaly_flags,created_at,vendor_id,order_type,vendors(name)')
        .order('created_at', { ascending: false })
      setBills(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = bills.filter(b => {
    const matchStatus =
      activeTab === 'ALL' ? true :
      activeTab === 'REJECTED' ? (b.status === 'REJECTED_L1' || b.status === 'REJECTED_L2') :
      b.status === activeTab
    const q = search.toLowerCase()
    return matchStatus && (!q || (b.vendors?.name || '').toLowerCase().includes(q) || (b.invoice_number || '').toLowerCase().includes(q))
  })

  const setTab = (key) => {
    if (key === 'ALL') searchParams.delete('status')
    else searchParams.set('status', key)
    setSearchParams(searchParams)
  }

  return (
    <div style={{ padding: '32px 36px', width: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>Bills Queue</h1>
        <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{bills.length} bills total</div>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '8px 14px', flex: 1, minWidth: 200, maxWidth: 300 }}>
          <Icon name="search" size={14} color="var(--text3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor or invoice…" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, color: 'var(--text)', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 4 }}>
          {TABS.map(({ key, label }) => {
            const isActive = activeTab === key
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.15s',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text3)',
              }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 52, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                {['Vendor', 'Invoice', 'Amount', 'Period', 'Type', 'Status', 'Flags', 'Received', ''].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr
                  key={b.id}
                  className="table-row-hover"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                  onClick={() => navigate(`/bills/${b.id}`)}
                >
                  <td style={{ padding: '13px 16px', fontWeight: 500, fontSize: 13 }}>{b.vendors?.name || '—'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{b.invoice_number || '—'}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="mono" style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{fmt(b.amount)}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {fmtDate(b.billing_period_start)}<span style={{ margin: '0 4px', opacity: 0.5 }}>→</span>{fmtDate(b.billing_period_end)}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {b.order_type ? (
                      <span style={{ fontSize: 11, background: 'var(--surface3)', color: 'var(--text2)', borderRadius: 6, padding: '3px 8px', border: '1px solid var(--border2)' }}>
                        {b.order_type}
                      </span>
                    ) : <span style={{ color: 'var(--text3)', fontSize: 13 }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    {b.anomaly_flags?.length > 0 && (
                      <span title={b.anomaly_flags.join('\n')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--yellow-light)', color: 'var(--yellow)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
                        <Icon name="alert" size={11} color="var(--yellow)" />
                        {b.anomaly_flags.length}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {daysAgo(b.created_at)}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/bills/${b.id}`) }}
                      className="btn-ghost"
                      style={{ padding: '5px 12px', fontSize: 12 }}
                    >
                      Open →
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 52, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No bills match the current filter</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

