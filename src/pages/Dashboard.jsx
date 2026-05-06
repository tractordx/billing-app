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

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1400, width: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
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
          {/* Top row — KPIs + chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, marginBottom: 16 }}>
            {/* KPI 1 — Approvals */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--primary)', borderRadius: '16px 16px 0 0' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>APPROVAL QUEUE</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div onClick={() => navigate('/bills?status=PENDING_L1')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `7px solid var(--primary)` }} />
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>L1</span>
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{stats.pendingL1}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Awaiting L1</div>
                </div>
                <div onClick={() => navigate('/bills?status=PENDING_L2')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `7px solid var(--lime)` }} />
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>L2</span>
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{stats.pendingL2}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Awaiting L2</div>
                </div>
              </div>
              {/* Mini dot chart */}
              <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 32 }}>
                {MOCK_TREND.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: Math.round(d.v / 12000), background: i % 2 === 0 ? 'var(--primary)' : 'var(--lime)', borderRadius: 3, minHeight: 4, maxHeight: 28 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* KPI 2 — Payments */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--lime)', borderRadius: '16px 16px 0 0' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>PAYMENT STATUS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div onClick={() => navigate('/bills?status=PENDING_PAYMENT')} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: `7px solid var(--primary)` }} />
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>Due</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1, fontFamily: 'DM Mono, monospace' }}>{fmt(stats.pendingPayAmt).replace('₹','')}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>₹ Pending</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `7px solid var(--lime)` }} />
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>Paid</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1, fontFamily: 'DM Mono, monospace' }}>{fmt(stats.paidMonth).replace('₹','')}</div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>₹ This month</div>
                </div>
              </div>
              {/* Dot grid visualisation */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i < Math.round((stats.pendingPayCount / (recentBills.length || 1)) * 30)
                      ? 'var(--primary)' : i < 20 ? 'var(--lime)' : 'var(--surface3)',
                  }} />
                ))}
              </div>
            </div>

            {/* Chart — Payment Trend */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>PAYMENT TREND</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />Billed</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)', display: 'inline-block' }} />Paid</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={MOCK_TREND}>
                  <defs>
                    <linearGradient id="gOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gLime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} labelStyle={{ color: '#18181b' }} itemStyle={{ color: '#52525b' }} formatter={v => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Area type="monotone" dataKey="v" stroke="#1d4ed8" strokeWidth={2} fill="url(#gOrange)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom row — recent bills + sidebar panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
            {/* Recent Bills table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Recent Bills</div>
                <button onClick={() => navigate('/bills')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600 }}>
                  View all →
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Vendor', 'Invoice', 'Amount', 'Status'].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentBills.map((b, i) => (
                    <tr key={b.id} className="table-row-hover" style={{ borderBottom: i < recentBills.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => navigate(`/bills/${b.id}`)}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{b.vendors?.name || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>{b.invoice_number || '—'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 13, fontFamily: 'DM Mono, monospace', color: 'var(--primary)' }}>{fmt(b.amount)}</td>
                      <td style={{ padding: '12px 16px' }}><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                  {recentBills.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No bills yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Expiring contracts */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="alert" size={14} color="var(--yellow)" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Expiring Contracts</span>
                </div>
                {expiringContracts.length === 0
                  ? <div style={{ padding: '16px', fontSize: 13, color: 'var(--text3)' }}>No alerts.</div>
                  : expiringContracts.slice(0, 3).map((c, i) => (
                    <div key={c.id} style={{ padding: '12px 16px', borderBottom: i < Math.min(expiringContracts.length, 3) - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.vendors?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{fmtDate(c.valid_to)}</div>
                      </div>
                      <div style={{
                        fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 14,
                        color: daysUntil(c.valid_to) <= 7 ? 'var(--red)' : 'var(--yellow)',
                        background: daysUntil(c.valid_to) <= 7 ? 'var(--red-light)' : 'var(--yellow-light)',
                        borderRadius: 99, padding: '3px 10px',
                      }}>
                        {daysUntil(c.valid_to)}d
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Ready to pay */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--lime)', animation: 'pulse-lime 2s infinite' }} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Ready to Pay</span>
                </div>
                {readyToPay.length === 0
                  ? <div style={{ padding: '16px', fontSize: 13, color: 'var(--text3)' }}>Queue clear.</div>
                  : readyToPay.map((b, i) => (
                    <div key={b.id} onClick={() => navigate(`/bills/${b.id}`)} style={{ padding: '12px 16px', borderBottom: i < readyToPay.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{b.vendors?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1, fontFamily: 'DM Mono, monospace' }}>{b.invoice_number}</div>
                      </div>
                      <div style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 14, color: 'var(--lime)' }}>{fmt(b.amount)}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

