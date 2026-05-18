const BILL_CFG = {
  PENDING_L1:      { label: 'Awaiting L1',    bg: 'rgba(245,158,11,0.12)',  color: '#b45309' },
  PENDING_L2:      { label: 'Awaiting L2',    bg: 'rgba(29,78,216,0.12)',  color: '#c2410c' },
  PENDING_PAYMENT: { label: 'Pending Payment', bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  PAID:            { label: 'Paid',           bg: 'rgba(34,197,94,0.12)',   color: '#15803d' },
  REJECTED_L1:     { label: 'Rejected L1',    bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
  REJECTED_L2:     { label: 'Rejected L2',    bg: 'rgba(239,68,68,0.12)',   color: '#dc2626' },
}

const VENDOR_CFG = {
  ACTIVE:   { label: 'Active',   bg: 'rgba(34,197,94,0.12)',   color: '#15803d' },
  PENDING:  { label: 'Pending',  bg: 'rgba(245,158,11,0.12)',  color: '#b45309' },
  INACTIVE: { label: 'Inactive', bg: 'rgba(100,100,100,0.10)', color: '#71717a' },
}

const FALLBACK = { bg: 'rgba(100,100,100,0.10)', color: '#71717a' }

export function StatusBadge({ status, type = 'bill' }) {
  const cfg = type === 'vendor'
    ? (VENDOR_CFG[status] || { ...FALLBACK, label: status })
    : (BILL_CFG[status]   || { ...FALLBACK, label: status })

  const isPending = ['PENDING_L1','PENDING_L2','PENDING_PAYMENT'].includes(status)

  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: cfg.color, flexShrink: 0,
        animation: isPending ? 'pulse-orange 2s ease-in-out infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  )
}

