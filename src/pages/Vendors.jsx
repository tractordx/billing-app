import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { fmtDate } from '../lib/utils'
import { StatusBadge } from '../components/StatusBadge'
import { Icon } from '../components/Icon'

const TH = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.03em' }
const STATUS_TABS = ['ALL', 'ACTIVE', 'PENDING', 'INACTIVE']
const EMPTY_FORM = { name: '', email: '', phone: '', contact_person: '', gstin: '', pan: '', vendor_code: '', bank_name: '', bank_account_no: '', bank_ifsc: '', bank_account_name: '' }

export function Vendors() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setLoadError('')
    try {
      const { data, error: err } = await supabase
        .from('vendors')
        .select('id,name,email,phone,contact_person,gstin,pan,status,vendor_code,created_at')
        .order('created_at', { ascending: false })
      if (err) throw err
      setVendors(data || [])
    } catch (err) {
      setLoadError(err.message || 'Failed to load vendors. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.email.trim()) return
    setSaving(true)
    setError(null)

    // Build a clean payload — only include fields that have a non-empty trimmed value
    const payload = Object.fromEntries(
      Object.entries(form)
        .filter(([, v]) => v && v.trim())
        .map(([k, v]) => [k, v.trim()])
    )
    payload.status = 'PENDING'

    const { error: err } = await supabase.from('vendors').insert(payload)

    if (err) {
      setError(err)
      setSaving(false)
      return
    }

    setSuccess(true)
    await load()
    setSaving(false)

    setTimeout(() => {
      setSuccess(false)
      setShowForm(false)
      setForm(EMPTY_FORM)
    }, 1200)
  }

  function handleClose() {
    setShowForm(false)
    setForm(EMPTY_FORM)
    setError(null)
    setSuccess(false)
  }

  const filtered = vendors.filter(v => {
    const matchStatus = statusFilter === 'ALL' || v.status === statusFilter
    const q = search.toLowerCase()
    return matchStatus && (!q || v.name.toLowerCase().includes(q) || (v.email || '').toLowerCase().includes(q) || (v.vendor_code || '').toLowerCase().includes(q))
  })

  return (
    <div style={{ padding: '32px 36px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>Vendors</h1>
          <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{vendors.length} registered</div>
        </div>
        {role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={14} color="#fff" /> Add Vendor
          </button>
        )}
      </div>

      {/* Load error banner */}
      {loadError && (
        <div style={{ marginBottom: 18, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', color: 'var(--red)', fontSize: 13 }}>
          {loadError}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', width: 580, maxHeight: '88vh', overflowY: 'auto', animation: 'fadeUp 0.2s ease both' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Register New Vendor</span>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', lineHeight: 1 }}><Icon name="x" size={18} /></button>
            </div>
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['name', 'Vendor Name *'], ['email', 'Email *'], ['phone', 'Phone'], ['contact_person', 'Contact Person'],
                ['gstin', 'GSTIN'], ['pan', 'PAN'], ['vendor_code', 'Vendor Code'],
                ['bank_name', 'Bank Name'], ['bank_account_no', 'Account No.'], ['bank_ifsc', 'IFSC Code'], ['bank_account_name', 'Account Holder Name'],
              ].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text3)', fontWeight: 500, gridColumn: key === 'name' || key === 'bank_account_name' ? 'span 2' : undefined }}>
                  {label}
                  <input value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="input-base" style={{ fontSize: 13 }} />
                </label>
              ))}
            </div>

            {/* Success message */}
            {success && (
              <div style={{ margin: '0 24px 12px', padding: '12px 16px', background: 'rgba(132,204,22,0.12)', border: '1px solid rgba(132,204,22,0.35)', borderRadius: 'var(--radius)', color: 'var(--lime)', fontSize: 13, fontWeight: 600 }}>
                Vendor registered successfully!
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{ margin: '0 24px 12px', padding: '14px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 'var(--radius)' }}>
                <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: error.code || error.details || error.hint ? 8 : 0 }}>
                  {error.message || 'An unexpected error occurred.'}
                </div>
                {(error.code || error.details || error.hint) && (
                  <div style={{ fontSize: 11, color: 'var(--red)', opacity: 0.75, lineHeight: 1.6 }}>
                    {error.code && <div>Code: {error.code}</div>}
                    {error.details && <div>Details: {error.details}</div>}
                    {error.hint && <div>Hint: {error.hint}</div>}
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-ghost" onClick={handleClose}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd} disabled={saving || success || !form.name.trim() || !form.email.trim()}>{saving ? 'Saving…' : 'Register'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '8px 14px', flex: 1, maxWidth: 300 }}>
          <Icon name="search" size={14} color="var(--text3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, code…" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, color: 'var(--text)', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 4 }}>
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              background: statusFilter === s ? 'var(--lime)' : 'transparent',
              color: statusFilter === s ? '#111' : 'var(--text3)',
            }}>{s.charAt(0) + s.slice(1).toLowerCase()}</button>
          ))}
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
                {['Vendor', 'Code', 'Contact', 'GSTIN', 'Status', 'Added', ''].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id} className="table-row-hover" style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => navigate(`/vendors/${v.id}`)}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{v.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{v.email}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}><span className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{v.vendor_code || '—'}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text2)' }}>{v.contact_person || '—'}</td>
                  <td style={{ padding: '13px 16px' }}><span className="mono" style={{ fontSize: 12, color: 'var(--text2)' }}>{v.gstin || '—'}</span></td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge status={v.status} type="vendor" /></td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)' }}>{fmtDate(v.created_at)}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={e => { e.stopPropagation(); navigate(`/vendors/${v.id}`) }} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 52, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No vendors found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
