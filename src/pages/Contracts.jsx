import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fmt, fmtDate, daysUntil } from '../lib/utils'
import { Icon } from '../components/Icon'

const TH = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.03em', whiteSpace: 'nowrap' }

function ContractStatusTag({ valid_to }) {
  if (!valid_to) return <span style={{ fontSize: 11, color: 'var(--text3)' }}>No dates</span>
  const days = daysUntil(valid_to)
  if (days < 0) return (
    <span style={{ background: 'var(--red-light)', color: 'var(--red)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>Expired</span>
  )
  if (days <= 7) return (
    <span style={{ background: 'var(--red-light)', color: 'var(--red)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>{days}d left</span>
  )
  if (days <= 30) return (
    <span style={{ background: 'var(--yellow-light)', color: 'var(--yellow)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>Exp in {days}d</span>
  )
  return (
    <span style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>Active</span>
  )
}

function AgreementStatusTag({ status }) {
  if (!status) return <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
  const s = status.toUpperCase()
  if (s === 'ACTIVE') return (
    <span style={{ background: 'var(--green-light)', color: 'var(--green)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>Active</span>
  )
  if (s === 'EXPIRED') return (
    <span style={{ background: 'var(--red-light)', color: 'var(--red)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>Expired</span>
  )
  if (s === 'PENDING') return (
    <span style={{ background: 'var(--yellow-light)', color: 'var(--yellow)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>Pending</span>
  )
  return (
    <span style={{ background: 'var(--surface2)', color: 'var(--text3)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>{status}</span>
  )
}

const EMPTY_FORM = { vendor_id: '', service_description: '', billing_cycle: 'MONTHLY', max_amount: '', payment_terms_days: '', valid_from: '', valid_to: '' }

export function Contracts() {
  const navigate = useNavigate()
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('contracts')
  const [agreements, setAgreements] = useState([])
  const [agrLoading, setAgrLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [vendors, setVendors] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('contracts')
        .select('id,service_description,billing_cycle,max_amount,payment_terms_days,valid_from,valid_to,original_filename,email_subject,created_at,vendors(id,name,email)')
        .order('created_at', { ascending: false })
      setContracts(data || [])
      setLoading(false)
    }
    load()
    supabase.from('vendors').select('id,name').order('name').then(({ data }) => setVendors(data || []))
    setAgrLoading(true)
    supabase
      .from('agreements')
      .select('*, vendors(id,name,email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAgreements(data || [])
        setAgrLoading(false)
      })
      .catch(() => {
        setAgreements([])
        setAgrLoading(false)
      })
  }, [])

  async function loadContracts() {
    const { data } = await supabase
      .from('contracts')
      .select('id,service_description,billing_cycle,max_amount,payment_terms_days,valid_from,valid_to,original_filename,email_subject,created_at,vendors(id,name,email)')
      .order('created_at', { ascending: false })
    setContracts(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.vendor_id) { setFormError('Please select a vendor.'); return }
    if (!form.service_description.trim()) { setFormError('Service description is required.'); return }
    setSaving(true)
    const { error } = await supabase.from('contracts').insert({
      vendor_id: form.vendor_id,
      service_description: form.service_description,
      billing_cycle: form.billing_cycle,
      max_amount: form.max_amount || null,
      payment_terms_days: form.payment_terms_days || null,
      valid_from: form.valid_from || null,
      valid_to: form.valid_to || null,
    })
    setSaving(false)
    if (error) { setFormError(error.message || 'Failed to save contract.'); return }
    setShowForm(false)
    setForm(EMPTY_FORM)
    await loadContracts()
  }

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase()
    return !q || (c.vendors?.name || '').toLowerCase().includes(q) || (c.service_description || '').toLowerCase().includes(q)
  })

  const filteredAgreements = agreements.filter(a => {
    const q = search.toLowerCase()
    const title = a.title || a.name || a.description || a.service_description || ''
    return !q || (a.vendors?.name || '').toLowerCase().includes(q) || title.toLowerCase().includes(q)
  })

  return (
    <div style={{ padding: '32px 36px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>Contracts</h1>
          <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
            {activeTab === 'contracts' ? `${contracts.length} contracts on file` : `${agreements.length} agreements on file`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowForm(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="plus" size={14} color="#fff" /> Add Contract
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '8px 14px', maxWidth: 300 }}>
          <Icon name="search" size={14} color="var(--text3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor or service…" style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, color: 'var(--text)', fontSize: 13 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 4, width: 'fit-content', marginBottom: 18 }}>
        {['contracts', 'agreements'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 16px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 600, transition: 'all 0.15s', cursor: 'pointer',
            background: activeTab === tab ? 'var(--orange)' : 'transparent',
            color: activeTab === tab ? '#fff' : 'var(--text3)',
            textTransform: 'capitalize',
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'contracts' && (
        <div className="card">
          {loading ? (
            <div style={{ padding: 52, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  {['Vendor', 'Service', 'Max Amount', 'Cycle', 'Valid Period', 'Terms', 'Status', 'Source'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="table-row-hover" style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => navigate(`/vendors/${c.vendors?.id}`)}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{c.vendors?.name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{c.vendors?.email}</div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text2)', maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.service_description || '—'}</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}><span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{fmt(c.max_amount)}</span></td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text2)', textTransform: 'capitalize' }}>{c.billing_cycle?.toLowerCase() || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {fmtDate(c.valid_from)}<span style={{ margin: '0 4px', opacity: 0.5 }}>→</span>{fmtDate(c.valid_to)}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text2)' }}>{c.payment_terms_days ? `${c.payment_terms_days} days` : '—'}</td>
                    <td style={{ padding: '13px 16px' }}><ContractStatusTag valid_to={c.valid_to} /></td>
                    <td style={{ padding: '13px 16px' }}>
                      {c.original_filename
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text3)' }}><Icon name="bills" size={12} color="var(--text3)" /> File</span>
                        : c.email_subject
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text3)' }}><Icon name="external" size={12} color="var(--text3)" /> Email</span>
                        : <span style={{ color: 'var(--text3)', fontSize: 13 }}>—</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 52, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No contracts found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'agreements' && (
        <div className="card">
          {agrLoading ? (
            <div style={{ padding: 52, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                  {['Vendor', 'Title / Description', 'Valid Period', 'Amount', 'Status', 'Created'].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAgreements.map((a, i) => {
                  const title = a.title || a.name || a.description || a.service_description || '—'
                  const startDate = a.start_date || a.valid_from
                  const endDate = a.end_date || a.valid_to
                  const amount = a.amount || a.max_amount
                  return (
                    <tr key={a.id} className="table-row-hover" style={{ borderBottom: i < filteredAgreements.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }} onClick={() => a.vendors?.id && navigate(`/vendors/${a.vendors.id}`)}>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{a.vendors?.name || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{a.vendors?.email}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text2)', maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                        {fmtDate(startDate)}<span style={{ margin: '0 4px', opacity: 0.5 }}>→</span>{fmtDate(endDate)}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {amount ? <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{fmt(amount)}</span> : <span style={{ color: 'var(--text3)', fontSize: 13 }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 16px' }}><AgreementStatusTag status={a.status} /></td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</td>
                    </tr>
                  )
                })}
                {filteredAgreements.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 52, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No agreements found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { if (e.target === e.currentTarget) { setShowForm(false) } }}>
          <div className="card" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Add Contract</h2>
              <button className="btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '4px 8px', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>Vendor *</label>
                <select
                  className="input-base"
                  value={form.vendor_id}
                  onChange={e => handleFormChange('vendor_id', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Select vendor…</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>Service Description *</label>
                <textarea
                  className="input-base"
                  rows={3}
                  value={form.service_description}
                  onChange={e => handleFormChange('service_description', e.target.value)}
                  placeholder="Describe the service or scope of work…"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>Billing Cycle</label>
                <select
                  className="input-base"
                  value={form.billing_cycle}
                  onChange={e => handleFormChange('billing_cycle', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="ONE_TIME">One Time</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>Max Amount</label>
                  <input
                    className="input-base"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.max_amount}
                    onChange={e => handleFormChange('max_amount', e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>Payment Terms (days)</label>
                  <input
                    className="input-base"
                    type="number"
                    min="0"
                    value={form.payment_terms_days}
                    onChange={e => handleFormChange('payment_terms_days', e.target.value)}
                    placeholder="30"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>Valid From</label>
                  <input
                    className="input-base"
                    type="date"
                    value={form.valid_from}
                    onChange={e => handleFormChange('valid_from', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>Valid To</label>
                  <input
                    className="input-base"
                    type="date"
                    value={form.valid_to}
                    onChange={e => handleFormChange('valid_to', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {formError && (
                <div style={{ background: 'var(--red-light)', color: 'var(--red)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13 }}>{formError}</div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Contract'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
