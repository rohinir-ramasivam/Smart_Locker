import React, { useState } from 'react';
import { Radio, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RfidAssignmentTab({ users, lockers, onAssignRfid }) {
  const [rfidUid, setRfidUid] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedLockerId, setSelectedLockerId] = useState('');
  const [message, setMessage] = useState(null);

  const handleAssign = (e) => {
    e.preventDefault();
    if (!rfidUid || !selectedUserId) {
      setMessage({ type: 'error', text: 'Please specify an RFID Card UID and select a User.' });
      return;
    }

    onAssignRfid({ rfidUid, userId: selectedUserId, lockerId: selectedLockerId || null });
    setMessage({ type: 'success', text: `Successfully linked RFID [${rfidUid}] to User!` });
    setRfidUid('');
  };

  const sampleTags = ['A1B2C3D4', 'E5F6G7H8', '99AA88BB', '11223344', 'FF00FF00', 'B3C4D5E6'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
          RFID Security Tag Assignment
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Link physical RC522 RFID card UIDs to authorized users and specific locker units.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        
        {/* Assignment Form Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={20} color="#38bdf8" /> Link RFID Card Tag
          </h3>

          {message && (
            <div style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: message.type === 'success' ? '#34d399' : '#fb7185',
              border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                RFID Tag UID (Hex String)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text"
                  required
                  placeholder="e.g. A1B2C3D4"
                  value={rfidUid}
                  onChange={(e) => setRfidUid(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Sample Tag Quick Buttons */}
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preset Scans:</span>
                {sampleTags.map(tag => (
                  <button 
                    key={tag}
                    type="button"
                    onClick={() => setRfidUid(tag)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '4px',
                      padding: '0.15rem 0.4rem',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                Select User Profile
              </label>
              <select 
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  color: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="">-- Choose User --</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name} ({u.role}) — Current Tag: {u.rfid_uid || 'None'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                Assign to Locker (Optional)
              </label>
              <select 
                value={selectedLockerId}
                onChange={(e) => setSelectedLockerId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  color: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="">-- No Locker Assignment --</option>
                {lockers.map(l => (
                  <option key={l.locker_id} value={l.locker_id}>
                    {l.locker_id} ({l.locker_number}) — {l.status}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
              <CheckCircle2 size={18} /> Confirm RFID Assignment
            </button>
          </form>
        </div>

        {/* Current Active Mappings Display */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
            Current Active Authorizations
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
            {users.filter(u => u.rfid_uid).map(u => (
              <div 
                key={u.user_id}
                style={{
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#34d399' }}>
                    {u.rfid_uid}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                    {u.assigned_locker_number ? `Locker ${u.assigned_locker_id}` : 'Unassigned Locker'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
