import React from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Users, 
  Radio, 
  History, 
  AlertTriangle, 
  BarChart3, 
  Cpu, 
  Tv2, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Wifi
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  unresolvedAlertCount, 
  isOnline, 
  soundEnabled, 
  setSoundEnabled 
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'lockers', label: 'Locker Control', icon: Lock },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'rfid', label: 'RFID Link', icon: Radio },
    { id: 'logs', label: 'Access History', icon: History },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: unresolvedAlertCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'devices', label: 'IoT Status', icon: Cpu },
    { id: 'simulator', label: 'HW Simulator', icon: Tv2, highlight: true }
  ];

  return (
    <header style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(10, 13, 20, 0.85)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Top Header Bar */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
          }}>
            <Lock size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SMART LOCKER <span style={{ color: '#38bdf8', WebkitTextFillColor: 'initial' }}>HUB</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              IoT Hardware + Software Security System
            </p>
          </div>
        </div>

        {/* System Status Indicators & Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Wi-Fi / Backend Connection Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '9999px',
            background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
          }}>
            <div className={`pulse-indicator ${isOnline ? 'green' : ''}`} style={{ background: isOnline ? '#10b981' : '#f43f5e' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isOnline ? '#34d399' : '#fb7185' }}>
              {isOnline ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
            </span>
          </div>

          {/* Sound Toggle Button */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn-secondary"
            title={soundEnabled ? 'Disable Alarm Beeps' : 'Enable Alarm Beeps'}
            style={{ padding: '0.45rem 0.75rem' }}
          >
            {soundEnabled ? <Volume2 size={18} color="#38bdf8" /> : <VolumeX size={18} color="#94a3b8" />}
            <span style={{ fontSize: '0.8rem' }}>{soundEnabled ? 'Audio ON' : 'Audio OFF'}</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: isActive 
                  ? (item.highlight ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)' : 'rgba(56, 189, 248, 0.12)')
                  : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderBottom: isActive ? `2px solid ${item.highlight ? '#a855f7' : '#38bdf8'}` : '2px solid transparent',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                position: 'relative'
              }}
            >
              <Icon size={17} color={isActive ? (item.highlight ? '#c084fc' : '#38bdf8') : 'var(--text-muted)'} />
              <span>{item.label}</span>

              {item.badge > 0 && (
                <span style={{
                  background: '#f43f5e',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                  boxShadow: '0 0 10px rgba(244, 63, 94, 0.6)'
                }}>
                  {item.badge}
                </span>
              )}

              {item.highlight && (
                <span style={{
                  background: 'linear-gradient(90deg, #a855f7, #38bdf8)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  marginLeft: '0.2rem'
                }}>
                  VIRTUAL ESP32
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
