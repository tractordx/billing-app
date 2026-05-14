import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fmt, fmtDate, daysUntil } from '../lib/utils'
import { Icon } from '../components/Icon'

const TH = {
  padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: 'var(--text3)', letterSpacing: '0.04em', textTransform: 'uppercase',
  borderBottom: '1px solid var(--border)',
}

const DATE_OPTIONS = [
  { value: 'all',        label: 'All Time'      },
  { value: 'this_month', label: 'This Month'    },
  { value: 'last_month', label: 'Last Month'    },
  { value: 'last_3m',   label: 'Last 3 Months' },
]

function applyDateFilter(bills, filter) {
  if (filter === 'all') return bills
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  return bills.filter(b => {
    const d = new Date(b.created_at)
    if (filter === 'this_month') return d >= new Date(y, m, 1)
    if (filter === 'last_month') return d >= new Date(y, m - 1, 1) && d < new Date(y, m, 1)
    if (filter === 'last_3m')   return d >= new Date(y, m - 2, 1)
    return true
  })
}

const pillSelect = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 99,
  padding: '7px 32px 7px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--text)',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
}

export function Dashboard() {
  const navigate = useNavigate()
  const [allBills, setAllBills]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [dateFilter, setDateFilter]   = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('bills')
        .select('id,status,amount,invoice_number,vendor_id,created_at,vendors(name)')
        .order('created_at', { ascending: false })
      setAllBills(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Unique vendors for the vendor dropdown
  const uniqueVendors = useMemo(() => {
    const map = {}
    allBills.forEach(b => {
      if (b.vendor_id && !map[b.vendor_id])
        map[b.vendor_id] = b.vendors?.name || b.vendor_id
    })
    return Object.entries(map)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allBills])

  // Apply both filters
  const bills = useMemo(() => {
    let filtered = applyDateFilter(allBills, dateFilter)
    if (vendorFilter !== 'all') filtered = filtered.filter(b => b.vendor_id === vendorFilter)
    return filtered
  }, [allBills, dateFilter, vendorFilter])

  // Compute KPI stats from filtered bills
  const stats = useMemo(() => {
    const now       = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const pendingL1  = bills.filter(b => b.status === 'PENDING_L1').length
    const pendingL2  = bills.filter(b => b.status === 'PENDING_L2').length
    const payBills   = bills.filter(b => b.status === 'PENDING_PAYMENT')
    const paidMonth  = bills
      .filter(b => b.status === 'PAID' && new Date(b.created_at) >= monthStart)
      .reduce((s, b) => s + Number(b.amount), 0)
    return {
      pendingL1, pendingL2,
      pendingPayAmt: payBills.reduce((s, b) => s + Number(b.amount), 0),
      pendingPayCount: payBills.length,
      paidMonth,
    }
  }, [bills])

  // Vendor-wise summary from filtered bills
  const vendorSummaryRows = useMemo(() => {
    const map = {}
    bills.forEach(b => {
      if (!map[b.vendor_id]) map[b.vendor_id] = {
        vendor_id: b.vendor_id, vendor_name: b.vendors?.name || '—',
        total_invoiced: 0, count: 0, pending_count: 0,
      }
      map[b.vendor_id].total_invoiced += Number(b.amount || 0)
      map[b.vendor_id].count += 1
      if (b.status !== 'PAID') map[b.vendor_id].pending_count += 1
    })
    return Object.values(map).sort((a, b) => b.total_invoiced - a.total_invoiced)
  }, [bills])

  const now = new Date()

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1400, width: '100%' }}>

      {/* ── Page header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          {/* MIRAGGIO SMS — bigger brand line */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              MIRAGGIO
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', lineHeight: 1 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>S</span>
              <span style={{ fontSize: 13 }}>M</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>S</span>
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1 }}>
            OVERVIEW
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* ── Functional filters ────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={pillSelect}>
              {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} style={pillSelect}>
              <option value="all">All Vendors</option>
              {uniqueVendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', padding: '40px 0', fontSize: 13 }}>Loading data…</div>
      ) : (
        <>
          {/* ── KPI cards ──────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => navigate('/bills?status=PENDING_L1')}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Awaiting L1</div>
              <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, marginBottom: 12 }}>{stats.pendingL1}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>bills pending approval</div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => navigate('/bills?status=PENDING_L2')}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Awaiting L2</div>
              <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, marginBottom: 12 }}>{stats.pendingL2}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>bills in approval</div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => navigate('/bills?status=PENDING_PAYMENT')}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>To Pay</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, fontFamily: 'DM Mono, monospace', marginBottom: 12 }}>
                {fmt(stats.pendingPayAmt).replace('₹', '')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{stats.pendingPayCount} bill{stats.pendingPayCount !== 1 ? 's' : ''} ready</div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Paid This Month</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, fontFamily: 'DM Mono, monospace', marginBottom: 12 }}>
                {fmt(stats.paidMonth).replace('₹', '')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>payments processed</div>
            </div>
          </div>

          {/* ── Vendor-wise summary ────────────────────────────── */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Vendor-wise Summary</div>
              <button onClick={() => navigate('/vendors')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cur