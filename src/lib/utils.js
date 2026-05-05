export const fmt = (n) =>
  n == null ? '—' : '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const fmtDateShort = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'

export const daysUntil = (d) => Math.ceil((new Date(d) - Date.now()) / 86400000)

export const daysAgo = (d) => {
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return `${diff}d ago`
}

export const STATUS_CONFIG = {
  PENDING_L1:      { label: 'AWAITING L1',    color: 'var(--yellow)', dot: 'var(--yellow)' },
  PENDING_L2:      { label: 'AWAITING L2',     color: '#ffaa00',       dot: '#ffaa00' },
  PENDING_PAYMENT: { label: 'PENDING PAYMENT', color: 'var(--amber)',  dot: 'var(--amber)' },
  PAID:            { label: 'PAID',            color: 'var(--green)',  dot: 'var(--green)' },
  REJECTED_L1:     { label: 'REJECTED L1',     color: 'var(--red)',    dot: 'var(--red)' },
  REJECTED_L2:     { label: 'REJECTED L2',     color: 'var(--red)',    dot: 'var(--red)' },
}

export const VENDOR_STATUS_CONFIG = {
  ACTIVE:   { label: 'ACTIVE',   color: 'var(--green)' },
  PENDING:  { label: 'PENDING',  color: 'var(--yellow)' },
  INACTIVE: { label: 'INACTIVE', color: 'var(--text3)' },
}

/* Shared page header style */
export const PAGE_HEADER = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--text)',
  lineHeight: 1.1,
}

export const MONO_LABEL = {
  fontSize: 10,
  color: 'var(--text3)',
  fontFamily: 'DM Mono, monospace',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}
