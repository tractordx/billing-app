import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { supabase } from '../lib/supabase'
import { fmt, fmtDate, daysUntil } from '../lib/utils'
import { MetricCard } from '../components/MetricCard'
import { StatusBadge } from '../components/StatusBadge'
import { Icon } from '../components/Icon'

const MOCK_TREND = [
  { m: 'Nov', v: 120000 }, { m: 'Dec', v: 185000 }, { m: 'Jan', v: 95000 },
  { m: 'Feb', v: 220000 }, { m: 'Mar', v: 175000 }, { m: 'Apr', v: 310000 },
]

const TH = {
  padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
  color: 'var(--text3)', letterSpacing: '0.04em', textTransform: 'uppercase',
  borderBottom: '1px solid var(--border)',
}

export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ pendingL1: 0, pendingL2: 0, pendingPayAmt: 0, pendingPayCount: 0, paidMonth: 0 })
  const [expiringContracts, setExpiringContracts] = useState([])
  const [readyToPay, setReadyToPay] = useState([])
  const [recentBills, setRecentBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [billsRes, contractsRes] = await Promise.all([
        supabase.from('bills')
          .select('id,status,amount,invoice_number,vendor_id,created_at,vendors(name)')
          .order('created_at', { ascending: false }),
        supabase.from('contracts')
          .select('id,valid_to,vendor_id,vendors(name)')
          .not('valid_to', 'is', null),
      ])

      const bills = billsRes.data || []
      const contracts = contractsRes.data || []
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

      const pendingL1 = bills.filter(b => b.status === 'PENDING_L1').length
      const pendingL2 = bills.filter(b => b.status === 'PENDING_L2').length
      const pendingPayBills = bills.filter(b => b.status === 'PENDING_PAYMENT')
      const paidMonth = bills.filter(b => b.status === 'PAID' && new Date(b.created_at) >= monthStart).reduce((s, b) => s + Number(b.amount), 0)

      setStats({ pendingL1, pendingL2, pendingPayAmt: pendingPayBills.reduce((s, b) => s + Number(b.amount), 0), pendingPayCount: pendingPayBills.length, paidMonth })
      setExpiringContracts(contracts.filter(c => daysUntil(c.valid_to) <= 30 && daysUntil(c.valid_to) > 0).sort((a, b) => daysUntil(a.valid_to) - daysUntil(b.valid_to)))
      setReadyToPay(pendingPayBills.slice(0, 4))
      setRecentBills(bills.slice(0, 6))
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date()

  // Calculate vendor-wise summary
  const vendorSummary = {}
  if (recentBills.length > 0) {
    recentBills.forEach(b => {
      if (!vendorSummary[b.vendor_id]) {
        vendorSummary[b.vendor_id] = {
          vendor_id: b.vendor_id,
          vendor_name: b.vendors?.name || '—',
          total_invoiced: 0,
          count: 0,
          pending_count: 0,
        }
      }
      vendorSummary[b.vendor_id].total_invoiced += Number(b.amount || 0)
      vendorSummary[b.vendor_id].count += 1
      if (b.status !== 'PAID') vendorSummary[b.vendor_id].pending_count += 1
    })
  }
  const vendorSummaryRows = Object.values(vendorSummary).sort((a, b) => b.total_invoiced - a.total_invoiced)

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1400, width: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>MIRAGGIO SMS</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1 }}>
            OVERVIEW
          </h1>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, padding: '7px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
            Date: <strong style={{ color: 'var(--text)' }}>Now</strong> <Icon name="chevron_down" size={13} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 99, padding: '7px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
            Filter: <strong style={{ color: 'var(--text)' }}>All</strong> <Icon name="chevron_down" size={13} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', padding: '40px 0', fontSize: 13 }}>Loading data…</div>
      ) : (
        <>
          {/* Top row — 4-column KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* KPI 1 — Awaiting L1 */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate('/bills?status=PENDING_L1')}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Awaiting L1</div>
              <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, marginBottom: 12 }}>{stats.pendingL1}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>bills pending approval</div>
            </div>

            {/* KPI 2 — Awaiting L2 */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate('/bills?status=PENDING_L2')}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Awaiting L2</div>
              <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, marginBottom: 12 }}>{stats.pendingL2}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>bills in approval</div>
            </div>

            {/* KPI 3 — To Pay */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate('/bills?status=PENDING_PAYMENT')}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>To Pay</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, fontFamily: 'DM Mono, monospace', marginBottom: 12 }}>{fmt(stats.pendingPayAmt).replace('₹', '')}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>ready for payment</div>
            </div>

            {/* KPI 4 — Paid This Month */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Paid This Month</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1, fontFamily: 'DM Mono, monospace', marginBottom: 12 }}>{fmt(stats.paidMonth).replace('₹', '')}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>payments processed</div>
            </div>
          </div>

          {/* Vendor-wise Summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Vendor-wise Summary</div>
              <button onClick={() => navigate('/vendors')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>
                View all →
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Vendor', 'Total Invoiced', 'Bill Count', 'Pending Bills'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendorSummaryRows.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No vendor data yet.</td></tr>
                ) : (
                  vendorSummaryRows.map((v, i) => (
                    <tr key={v.vendor_id} className="table-row-hover" style={{ borderBottom: i < vendorSummaryRows.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{v.vendor_name}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, fontFamily: 'DM Mono, monospace', color: 'var(--primary)' }}>{fmt(v.total_invoiced)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>{v.count}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: v.pending_count > 0 ? 'var(--yellow)' : 'var(--text3)', fontWeight: v.pending_count > 0 ? 700 : 400 }}>
                        {v.pending_count > 0 ? `${v.pending_count} bill${v.pending_count !== 1 ? 's' : ''}` : 'None'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
