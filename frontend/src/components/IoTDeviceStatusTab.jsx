import React from 'react';
import { Cpu, Wifi, RefreshCw, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

export default function IoTDeviceStatusTab({ devices, onRefresh }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            IoT Hardware & ESP32 Node Diagnostics
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Monitor real-time Wi-Fi connectivity, RSSI signal strength, and offline SD buffer queues across physical hardware nodes.
          </p>
        </div>

        <button onClick={onRefresh} className="btn-secondary">
          <RefreshCw size={16} /> Ping Devices
        </button>
      </div>

      {/* Device Cards List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {devices.map((device) => {
          const isOnline = device.wifi_status === 'ONLINE';

          return (
            <div 
              key={device.device_id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderColor: isOnline ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                    border: `1px solid ${isOnline ? '#10b981' : '#f43f5e'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Cpu size={24} color={isOnline ? '#10b981' : '#f43f5e'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                      {device.device_id}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {device.locker_group}
                    </div>
                  </div>
                </div>

                <span className={isOnline ? 'badge badge-granted' : 'badge badge-denied'}>
                  {device.wifi_status}
                </span>
              </div>

              {/* Specs & Wi-Fi Details */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>IP Address:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', color: '#ffffff' }}>{device.ip_address || '192.168.1.105'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Wifi size={14} /> Wi-Fi RSSI Signal:
                  </span>
                  <strong style={{ color: '#38bdf8' }}>{device.rssi || -58} dBm (Good)</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SD Card Offline Queue:</span>
                  <strong style={{ color: device.pending_logs_count > 0 ? '#fb7185' : '#34d399' }}>
                    {device.pending_logs_count || 0} Pending Logs
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Heartbeat:</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{device.last_seen || 'Just now'}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
