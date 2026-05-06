import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fmt, fmtDate, daysAgo, daysUntil } from '../lib/utils'
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

const FREQ_LABELS = {
  'MONTHLY': 'Monthly',
  'QUARTERLY': 'Quarterly',
  'ANNUAL': 'Annual',
  'ONE_TIME': 'One-time',
}

const CAT_LABELS = {
  'IT_SERVICES': 'IT Services',
  'CLOUD': 'Cloud',
  'HARDWARE': 'Hardware',
  'CONSULTING': 'Consulting',
  'SUPPORT': 'Support',
  'MAINTENANCE': 'Maintenance',
}

const TH = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.03em', whiteSpace: 'nowrap' }

function fmtBillingPeriod(start, end, frequency) {
  if (!start) return '—'
  if (frequency === 'QUARTERLY') {
    const m = new Date(start).getMonth()
    const y = new Date(start).getFullYear()
    return `Q${Math.floor(m / 3) + 1} ${y}`
  }
  if (frequency === 'ANNUAL') return new Date(start).getFullYear().toString()
  return new Date(start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function dueDateColor(d) {
  if (!d) return 'var(--text3)'
  const days = daysUntil(d)
  if (days < 0) return 'var(--red)'
  if (days <= 7) return '#c2410c'
  if (days <= 14) return 'var(--yellow)'
  return 'var(--text2)'
}

function generateCSV(bills) {
  const headers = ['Vendor', 'Invoice', 'Amount', 'Period', 'Frequency', 'Category', 'Due Date', 'Status', 'Created']
  const rows = bills.map(b => [
    b.vendors?.name || '—',
    b.invoice_number || '—',
    fmt(b.amount),
    fmtBillingPeriod(b.billing_period_start, b.billing_period_end, b.frequency),
    FREQ_LABELS[b.frequency] || b.frequency || '—',
    CAT_LABELS[b.category] || b.category || '—',
    fmtDate(b.due_date),
    b.status,
    fmtDate(b.created_at),
  ])
  const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bills-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

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
        .select('id,invoice_number,amount,status,billing_period_start,billing_period_end,due_date,frequency,category,anomaly_flags,created_at,vendor_id,order_type,vendors(name)')
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>Bills Queue</h1>
          <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{bills.length} bills total</div>
        </div>
        <button className="btn-download" onClick={() => generateCSV(filtered)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="download" size={14} color="var(--primary)" />
          Export Bills
        </button>
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
                {['Vendor', 'Invoice', 'Amount', 'Period', 'Freq', 'Category', 'Due Date', 'Status', ''].map(h => (
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
                  <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 15 }}>{b.vendors?.name || '—'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{b.invoice_number || '—'}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span className="mono" style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{fmt(b.amount)}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)' }}>
                    {fmtBillingPeriod(b.billing_period_start, b.billing_period_end, b.frequency)}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, background: 'var(--surface3)', color: 'var(--text2)', borderRadius: 6, padding: '3px 8px', border: '1px solid var(--border2)' }}>
                      {FREQ_LABELS[b.frequency] || b.frequency || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      fontSize: 11,
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontWeight: 600,
                    }}>
                      {CAT_LABELS[b.category] || b.category || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 12, color: dueDateColor(b.due_date), fontWeight: daysUntil(b.due_date) <= 7 ? 700 : 400 }}>
                      {fmtDate(b.due_date)}
                    </div>
                    {b.due_date && daysUntil(b.due_date) < 0 && <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 600 }}>OVERDUE</div>}
                  </td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/bills/${b.id}`) }}
                        className="btn-ghost"
                        style={{ padding: '5px 12px', fontSize: 12 }}
                      >
                        Open →
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ color: 'var(--primary)', fontWeight: 700, padding: '5px 12px', fontSize: 12 }}
                        onClick={e => { e.stopPropagation(); navigate(`/credit-notes/new?vendor=${b.vendor_id}&bill=${b.id}`); }}
                      >
                        CN
                      </button>
                    </div>
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
