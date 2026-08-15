import React, { useState } from 'react';
import { History, Search, Download, Filter, RefreshCw, CheckCircle2, XCircle, Wifi } from 'lucide-react';

export default function AccessLogsTab({ events, onRefresh, lockers, users }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lockerFilter, setLockerFilter] = useState('');

  const filteredEvents = events.filter(evt => {
    const matchesSearch = !search || 
      evt.rfid_uid?.toLowerCase().includes(search.toLowerCase()) ||
      evt.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      evt.locker_id?.toLowerCase().includes(search.toLowerCase()) ||
      evt.event_id?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || evt.status === statusFilter;
    const matchesLocker = !lockerFilter || evt.locker_id === lockerFilter;

    return matchesSearch && matchesStatus && matchesLocker;
  });

  const exportCSV = () => {
    const headers = ["event_id", "timestamp", "rfid_uid", "user_name", "locker_id", "status", "event_type", "synced_from_device"];
    const rows = filteredEvents.map(e => [
      e.event_id, e.timestamp, e.rfid_uid, e.user_name || 'UNKNOWN', e.locker_id, e.status, e.event_type, e.synced_from_device
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `locker_access_logs_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            Audit Trail & Access Event Logs
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Timestamped history of all authorized unlock requests, unauthorized attempts, and offline sync logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onRefresh} className="btn-secondary">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={exportCSV} className="btn-primary">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        
        {/* Search Box */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search RFID, User, Event ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              color: '#ffffff',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter */}
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.55rem 0.75rem',
            color: '#ffffff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        >
          <option value="">All Statuses</option>
          <option value="GRANTED">GRANTED ONLY</option>
          <option value="DENIED">DENIED ONLY</option>
        </select>

        {/* Locker Filter */}
        <select 
          value={lockerFilter}
          onChange={(e) => setLockerFilter(e.target.value)}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.55rem 0.75rem',
            color: '#ffffff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        >
          <option value="">All Lockers</option>
          {lockers.map(l => (
            <option key={l.locker_id} value={l.locker_id}>{l.locker_id} ({l.locker_number})</option>
          ))}
        </select>
      </div>

      {/* Log Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Event ID & Time</th>
              <th style={{ padding: '1rem' }}>RFID Tag UID</th>
              <th style={{ padding: '1rem' }}>User Name</th>
              <th style={{ padding: '1rem' }}>Locker ID</th>
              <th style={{ padding: '1rem' }}>Access Status</th>
              <th style={{ padding: '1rem' }}>Event Type</th>
              <th style={{ padding: '1rem' }}>Sync Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No access logs match your current filter criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.event_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{evt.event_id}</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {evt.timestamp}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                    {evt.rfid_uid}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: evt.user_name ? '#ffffff' : 'var(--text-muted)' }}>
                    {evt.user_name || 'UNKNOWN TAG'}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 800, color: '#ffffff' }}>
                    {evt.locker_id}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={evt.status === 'GRANTED' ? 'badge badge-granted' : 'badge badge-denied'}>
                      {evt.status === 'GRANTED' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {evt.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {evt.event_type}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {evt.synced_from_device === 1 ? (
                      <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.2)' }}>
                        ⚡ SD SYNCED
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)' }}>
                        🌐 REAL-TIME
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
