import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { fmtDate } from '../lib/utils'
import { StatusBadge } from '../components/StatusBadge'
import { Icon } from '../components/Icon'

const TH = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.03em' }
const STATUS_TABS = ['ALL', 'ACTIVE', 'PENDING', 'INACTIVE']
const VENDOR_CATEGORIES = ['ALL', 'SERVICE', 'PRODUCT']
const EMPTY_FORM = { name: '', email: '', phone: '', contact_person: '', gstin: '', pan: '', vendor_code: '', category: 'SERVICE', bank_name: '', bank_account_no: '', bank_ifsc: '', bank_account_name: '' }

// Section divider in Add Vendor form
function Section({ title }) {
  return (
    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function PdfLink({ url, label }) {
  if (!url || !url.trim()) return null
  return (
    <a
      href={url.trim()}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 600, color: 'var(--primary)',
        background: 'var(--primary-light)', borderRadius: 6,
        padding: '3px 8px', textDecoration: 'none',
        border: '1px solid rgba(29,78,216,0.15)',
        whiteSpace: 'nowrap',
      }}
    >
      📄 {label}
    </a>
  )
}

export function Vendors() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [vendors, setVendors]             = useState([])
  const [agreementMap, setAgreementMap]   = useState({}) // vendor_id → { url, url2 }
  const [loading, setLoading]             = useState(true)
  const [loadError, setLoadError]         = useState('')
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState(null)
  const [success, setSuccess]             = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    setLoadError('')
    try {
      const [{ data: vData, error: vErr }, { data: agData }] = await Promise.all([
        supabase
          .from('vendors')
          .select('id,name,email,phone,contact_person,gstin,pan,status,vendor_code,category,created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('agreements')
          .select('vendor_id,agreement_url,agreement_url2,trade_name')
          .not('vendor_id', 'is', null),
      ])
      if (vErr) throw vErr
      setVendors(vData || [])
      // Build a map vendor_id → best agreement URLs
      const map = {}
      for (const ag of (agData || [])) {
        if (!ag.vendor_id) continue
        if (!map[ag.vendor_id]) map[ag.vendor_id] = { url: null, url2: null }
        // Prefer entries that actually have URLs
        if (ag.agreement_url && !map[ag.vendor_id].url)  map[ag.vendor_id].url  = ag.agreement_url
        if (ag.agreement_url2 && !map[ag.vendor_id].url2) map[ag.vendor_id].url2 = ag.agreement_url2
      }
      setAgreementMap(map)
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
    const payload = Object.fromEntries(
      Object.entries(form)
        .filter(([, v]) => v && v.trim())
        .map(([k, v]) => [k, v.trim()])
    )
    payload.status = 'PENDING'
    const { error: err } = await supabase.from('vendors').insert(payload)
    if (err) { setError(err); setSaving(false); return }
    setSuccess(true)
    await load()
    setSaving(false)
    setTimeout(() => { setSuccess(false); setShowForm(false); setForm(EMPTY_FORM) }, 1200)
  }

  function handleClose() {
    setShowForm(false); setForm(EMPTY_FORM); setError(null); setSuccess(false)
  }

  const filtered = vendors.filter(v => {
    const matchStatus   = statusFilter === 'ALL' || v.status === statusFilter
    const matchCategory = categoryFilter === 'ALL' || v.category === categoryFilter
    const q = search.toLowerCase()
    return matchStatus && matchCategory && (!q || v.name.toLowerCase().includes(q) || (v.email || '').toLowerCase().includes(q) || (v.vendor_code || '').toLowerCase().includes(q))
  })

  return (
    <div style={{ padding: '32px 36px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>Vendors</h1>
          <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{vendors.length} registered</div>
        </div>
        {role === 'admin' && (
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} color="#fff" /> Add Vendor
          </button>
        )}
      </div>

      {loadError && (
        <div style={{ marginBottom: 18, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', color: 'var(--red)', fontSize: 13 }}>
          {loadError}
        </div>
      )}

      {/* ══════════ Add Vendor Modal ══════════════════════════ */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', width: 600, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeUp 0.2s ease both' }}>

            {/* Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>Register New Vendor</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>All fields marked * are required</div>
              </div>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', lineHeight: 1, padding: 4 }}>
                <Icon name="x" size={18} />
              </button>
            </div>

            {/* Form fields */}
            <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              <Section title="Basic Information" />

              {/* Name — full width */}
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)', gridColumn: 'span 2' }}>
                Vendor Name *
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-base" placeholder="Legal entity name" style={{ fontSize: 13 }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                Email *
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-base" type="email" placeholder="vendor@example.com" style={{ fontSize: 13 }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                Phone
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input-base" placeholder="+91 …" style={{ fontSize: 13 }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                Contact Person
                <input value={form.contact_person} onChange={e => setForm(p => ({ ...p, contact_person: e.target.value }))} className="input-base" placeholder="Name" style={{ fontSize: 13 }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                Category
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-base" style={{ fontSize: 13 }}>
                  <option value="SERVICE">Service</option>
                  <option value="PRODUCT">Product</option>
                </select>
              </label>

              <Section title="Tax & Compliance" />

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                GSTIN
                <input value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value }))} className="input-base" placeholder="15-character GST number" style={{ fontSize: 13 }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                PAN
                <input value={form.pan} onChange={e => setForm(p => ({ ...p, pan: e.target.value }))} className="input-base" placeholder="10-character PAN" style={{ fontSize: 13 }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                Vendor Code
                <input value={form.vendor_code} onChange={e => setForm(p => ({ ...p, vendor_code: e.target.value }))} className="input-base" placeholder="Internal code" style={{ fontSize: 13 }} />
              </label>

              <Section title="Bank Details" />

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                Bank Name
                <input value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} className="input-base" placeholder="e.g. HDFC Bank" style={{ fontSize: 13 }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                IFSC Code
                <input value={form.bank_ifsc} onChange={e => setForm(p => ({ ...p, bank_ifsc: e.target.value }))} className="input-base" placeholder="e.g. HDFC0001234" style={{ fontSize: 13 }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                Account Number
                <input value={form.bank_account_no} onChange={e => setForm(p => ({ ...p, bank_account_no: e.target.value }))} className="input-base" placeholder="Account number" style={{ fontSize: 13 }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text3)' }}>
                Account Holder Name
                <input value={form.bank_account_name} onChange={e => setForm(p => ({ ...p, bank_account_name: e.target.value }))} className="input-base" placeholder="Name on account" style={{ fontSize: 13 }} />
              </label>
            </div>

            {/* Feedback */}
            {success && (
              <div style={{ margin: '0 28px 14px', padding: '12px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)', color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
                Vendor registered successfully!
              </div>
            )}
            {error && (
              <div style={{ margin: '0 28px 14px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)' }}>
                <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>{error.message || 'An error occurred.'}</div>
                {error.hint && <div style={{ fontSize: 11, color: 'var(--red)', opacity: 0.7, marginTop: 4 }}>{error.hint}</div>}
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-ghost" onClick={handleClose}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd} disabled={saving || success || !form.name.trim() || !form.email.trim()}>
                {saving ? 'Saving…' : 'Register Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
    