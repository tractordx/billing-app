import { NavLink } from 'react-router-dom'
import { Icon } from './Icon'
import { useAuth } from '../contexts/AuthContext'

export function MicroSidebar() {
  const { isAdmin, profile, role, signOut } = useAuth()

  const NAV = [
    { to: '/',           icon: 'dashboard', label: 'Dashboard'  },
    { to: '/bills',      icon: 'bills',     label: 'Bills'      },
    { to: '/vendors',    icon: 'vendors',   label: 'Vendors'    },
    { to: '/contracts',  icon: 'contracts', label: 'Contracts'  },
    { to: '/agreements', icon: 'contracts', label: 'Agreements' },
    { to: '/payments',   icon: 'payments',  label: 'Payments'   },
    ...(isAdmin ? [{ to: '/users', icon: 'vendors', label: 'Users' }] : []),
  ]

  const roleLabel = { admin: 'Admin', l1: 'L1 Approver', l2: 'L2 Approver', finance: 'Finance' }[role] || role

  return (
    <aside style={{
      width: 'var(--side-w)',
      minHeight: '100vh',
      background: '#ffffff',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          miraggio
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
          Vendor Payments
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 10, paddingBottom: 10, overflowY: 'auto' }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={{ display: 'block', textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <div className={`sidebar-nav-link${isActive ? ' active' : ''}`}>
                <Icon
                  name={icon}
                  size={15}
                  color={isActive ? 'var(--orange)' : 'var(--text3)'}
                />
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--orange)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, color: '#fff',
            flexShrink: 0,
          }}>
            {(profile?.name || profile?.email || 'M')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.name || profile?.email?.split('@')[0] || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {roleLabel}
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            style={{ background: 'none', border: 'none', padding: 4, color: 'var(--text3)', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <Icon name="x" size={14} color="var(--text3)" />
          </button>
        </div>
      </div>
    </aside>
  )
}
