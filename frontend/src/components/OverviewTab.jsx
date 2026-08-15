import React from 'react';
import { 
  Lock, 
  Unlock, 
  Users, 
  ShieldAlert, 
  Activity, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Radio
} from 'lucide-react';

export default function OverviewTab({ stats, lockers, recentEvents, alerts, setActiveTab, onUnlockTrigger }) {
  const unresolvedAlerts = alerts.filter(a => !a.resolved);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Security Alert Banner (if unresolved alerts exist) */}
      {unresolvedAlerts.length > 0 && (
        <div className="alert-banner-flashing" style={{
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <AlertTriangle size={26} color="#f43f5e" />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fb7185' }}>
                SECURITY ALERT — {unresolvedAlerts.length} UNAUTHORIZED ACCESS ATTEMPT(S)
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                Latest breach detected at {unresolvedAlerts[0]?.timestamp} on Locker {unresolvedAlerts[0]?.locker_id} (RFID: {unresolvedAlerts[0]?.rfid_uid})
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('alerts')}
            className="btn-danger"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            Review Security Log <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        
        {/* Total Lockers Card */}
        <div className="glass-card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Lockers</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)' }}>
              <Lock size={20} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalLockers || 4}</div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.25rem' }}>
            {stats.availableLockers || 0} Available • {stats.occupiedLockers || 0} Occupied
          </div>
        </div>

        {/* Total Registered Users Card */}
        <div className="glass-card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Authorized Users</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)' }}>
              <Users size={20} color="#a855f7" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalUsers || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '0.25rem' }}>
            Active RFID Cards Assigned
          </div>
        </div>

        {/* Today's Access Count */}
        <div className="glass-card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Accesses</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)' }}>
              <Activity size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.todayAccessCount || 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.25rem' }}>
            Real-time event logging
          </div>
        </div>

        {/* Security Violations / Denied Card Scans */}
        <div className="glass-card-interactive">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Unauthorized Scans</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)' }}>
              <ShieldAlert size={20} color="#f43f5e" />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: (stats.totalUnauthorizedAttempts > 0) ? '#f43f5e' : 'inherit' }}>
            {stats.totalUnauthorizedAttempts || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: '0.25rem' }}>
            {unresolvedAlerts.length} Unresolved Alerts
          </div>
        </div>

      </div>

      {/* Main Grid: Locker Cards + Recent Access Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Quick Locker Status Grid */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="#38bdf8" /> Live Locker Status
            </h3>
            <button onClick={() => setActiveTab('lockers')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              Manage All
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {lockers.slice(0, 4).map((locker) => (
              <div 
                key={locker.locker_id}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${locker.servo_state === 'UNLOCKED' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>{locker.locker_id}</span>
                  <span className={locker.servo_state === 'UNLOCKED' ? 'badge badge-granted' : 'badge badge-occupied'}>
                    {locker.servo_state}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  User: <strong style={{ color: '#ffffff' }}>{locker.assigned_user_name || 'Unassigned'}</strong>
                </div>

                <button 
                  onClick={() => onUnlockTrigger(locker.locker_id, locker.servo_state === 'UNLOCKED' ? 'LOCK' : 'UNLOCK')}
                  className={locker.servo_state === 'UNLOCKED' ? 'btn-secondary' : 'btn-primary'}
                  style={{ fontSize: '0.75rem', padding: '0.4rem', justifyContent: 'center', marginTop: '0.25rem' }}
                >
                  {locker.servo_state === 'UNLOCKED' ? <Lock size={14} /> : <Unlock size={14} />}
                  {locker.servo_state === 'UNLOCKED' ? 'Remote Lock' : 'Remote Unlock'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Access Feed */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#10b981" /> Live Access Feed
            </h3>
            <button onClick={() => setActiveTab('logs')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
              View History
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
            {recentEvents.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent access events recorded.
              </div>
            ) : (
              recentEvents.slice(0, 6).map((evt) => (
                <div 
                  key={evt.event_id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderLeft: `4px solid ${evt.status === 'GRANTED' ? '#10b981' : '#f43f5e'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: evt.status === 'GRANTED' ? '#34d399' : '#fb7185' }}>
                        {evt.status === 'GRANTED' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {evt.locker_id}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      User: {evt.user_name || 'Unknown RFID'} ({evt.rfid_uid})
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {evt.timestamp ? evt.timestamp.substring(11, 19) : ''}
                    </div>
                    {evt.synced_from_device === 1 && (
                      <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 600 }}>OFFLINE SYNCED</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
