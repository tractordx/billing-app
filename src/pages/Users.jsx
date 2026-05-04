import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmtDate } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'

const TH = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.03em' }
const ROLES = ['admin', 'l1', 'l2', 'finance']
const ROLE_LABELS = { admin: 'Admin', l1: 'L1 Approver', l2: 'L2 Approver', finance: 'Finance' }
const ROLE_COLORS = { admin: 'var(--orange)', l1: 'var(--lime)', l2: 'var(--green)', finance: 'var(--yellow)' }
const ROLE_BG = { admin: 'rgba(249,115,22,0.15)', l1: 'rgba(163,230,53,0.15)', l2: 'rgba(34,197,94,0.15)', finance: 'rgba(234,179,8,0.15)' }

export function Users() {
  const { role: myRole, profile: myProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error: err } = await supabase.from('profiles').select('*').order('created_at', { ascending: true })
    if (err) setError(err.message)
    else setUsers(data || [])
    setLoading(false)
  }

  async function updateUser(userId, changes) {
    setSaving(p => ({ ...p, [userId]: true }))
    const { error: err } = await supabase.from('profiles').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', userId)
    if (err) setError(err.message)
    else setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...changes } : u))
    setSaving(p => ({ ...p, [userId]: false }))
  }

  if (myRole !== 'admin') {
    return (
      <div style={{ padding: '60px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Access Denied</div>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Only administrators can manage users.</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)' }}>Users</h1>
          <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>{users.length} accounts</div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 18, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius)', color: 'var(--red)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Role legend */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        {ROLES.map(r => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', background: ROLE_BG[r], border: `1px solid ${ROLE_COLORS[r]}33`, borderRadius: 99, fontSize: 12, fontWeight: 600, color: ROLE_COLORS[r] }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ROLE_COLORS[r] }} />
            {ROLE_LABELS[r]}
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 52, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading…</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isMe = u.id === myProfile?.id
                const isSaving = saving[u.id]
                return (
                  <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none', opacity: isSaving ? 0.6 : 1, transition: 'opacity 0.15s' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: ROLE_BG[u.role] || 'var(--surface3)',
                          border: `1px solid ${ROLE_COLORS[u.role] || 'var(--border)'}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          color: ROLE_COLORS[u.role] || 'var(--text3)',
                        }}>
                          {(u.name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                            {u.name || '—'} {isMe && <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400, marginLeft: 4 }}>(you)</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <select
                        value={u.role}
                        disabled={isMe || isSaving}
                        onChange={e => updateUser(u.id, { role: e.target.value })}
                        className="input-base"
                        style={{ fontSize: 12, padding: '5px 10px', width: 'auto', minWidth: 120, color: ROLE_COLORS[u.role] || 'var(--text)', fontWeight: 600 }}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        disabled={isMe || isSaving}
                        onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 99,
                          border: 'none',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: isMe ? 'not-allowed' : 'pointer',
                          background: u.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
                          color: u.is_active ? 'var(--green)' : 'var(--red)',
                          opacity: isMe ? 0.5 : 1,
                        }}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text3)' }}>{fmtDate(u.created_at)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      {!isMe && (
                        <button
                          className="btn-ghost"
                          disabled={isSaving}
                          onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                          style={{ padding: '5px 12px', fontSize: 12 }}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 52, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    No users yet. Create users via the Supabase Dashboard, then assign roles here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Help box */}
      <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 8 }}>Adding new users</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
          1. Go to <strong style={{ color: 'var(--text2)' }}>Supabase Dashboard → Authentication → Users → Invite user</strong><br/>
          2. Enter their email. They will receive a setup link.<br/>
          3. Once they sign in for the first time, their profile will appear above.<br/>
          4. Set their role and status here.
        </div>
      </div>
    </div>
  )
}
