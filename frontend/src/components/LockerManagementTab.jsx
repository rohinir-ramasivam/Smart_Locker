import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  UserPlus, 
  Plus, 
  Settings, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LockerManagementTab({ lockers, users, onUnlockTrigger, onAssignUser, onAddLocker }) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newLockerNumber, setNewLockerNumber] = useState('');
  const [newLockerLocation, setNewLockerLocation] = useState('Building A - North Wing');

  const openAssign = (locker) => {
    setSelectedLocker(locker);
    setSelectedUserId(locker.assigned_user_id || '');
    setShowAssignModal(true);
  };

  const handleSaveAssign = () => {
    if (selectedLocker) {
      onAssignUser(selectedLocker.locker_id, selectedUserId || null);
      setShowAssignModal(false);
    }
  };

  const handleCreateLocker = (e) => {
    e.preventDefault();
    if (newLockerNumber) {
      const nextId = `L0${lockers.length + 1}`;
      onAddLocker({
        lockerId: nextId,
        lockerNumber: `Locker ${newLockerNumber}`,
        location: newLockerLocation
      });
      setNewLockerNumber('');
      setShowAddModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header & Quick Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            Locker Management & Remote Servo Control
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Monitor real-time servo locks, assign user access rights, or trigger emergency overrides.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} /> Add New Locker
        </button>
      </div>

      {/* Locker Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {lockers.map((locker) => {
          const isUnlocked = locker.servo_state === 'UNLOCKED';
          const isOccupied = locker.status === 'OCCUPIED';

          return (
            <div 
              key={locker.locker_id}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderColor: isUnlocked ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-color)',
                boxShadow: isUnlocked ? '0 0 20px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              {/* Locker Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isUnlocked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                    border: `1px solid ${isUnlocked ? '#10b981' : '#38bdf8'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isUnlocked ? <Unlock size={22} color="#10b981" /> : <Lock size={22} color="#38bdf8" />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                      {locker.locker_id} ({locker.locker_number})
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> {locker.location}
                    </div>
                  </div>
                </div>

                <span className={isUnlocked ? 'badge badge-granted' : (isOccupied ? 'badge badge-occupied' : 'badge badge-available')}>
                  {isUnlocked ? 'UNLOCKED' : locker.status}
                </span>
              </div>

              {/* Servo Motor Angle Indicator */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SERVO ANGLE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isUnlocked ? '#34d399' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {isUnlocked ? '90° (OPEN)' : '0° (LOCKED)'}
                  </div>
                </div>

                {/* Animated Servo Dial */}
                <div className="servo-gauge-dial">
                  <div 
                    className="servo-needle" 
                    style={{ transform: `rotate(${isUnlocked ? 45 : -45}deg)` }}
                  />
                </div>
              </div>

              {/* Assigned User Info */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.4)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} color="var(--text-muted)" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ASSIGNED USER</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: locker.assigned_user_name ? '#ffffff' : 'var(--text-muted)' }}>
                      {locker.assigned_user_name || 'No User Assigned'}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => openAssign(locker)}
                  className="btn-secondary" 
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <UserPlus size={14} /> Reassign
                </button>
              </div>

              {/* Last Access Time */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={13} /> Last Activity: {locker.last_accessed || 'Never'}
              </div>

              {/* Control Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: 'auto' }}>
                <button 
                  onClick={() => onUnlockTrigger(locker.locker_id, isUnlocked ? 'LOCK' : 'UNLOCK')}
                  className={isUnlocked ? 'btn-secondary' : 'btn-primary'}
                  style={{ justifyContent: 'center', padding: '0.65rem' }}
                >
                  {isUnlocked ? <Lock size={16} /> : <Unlock size={16} />}
                  {isUnlocked ? 'Command Lock (0°)' : 'Remote Unlock (90°)'}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Assign User Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '450px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>
              Assign User to {selectedLocker?.locker_id}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Select Authorized Student / Faculty:
              </label>
              <select 
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  color: '#ffffff',
                  fontFamily: 'var(--font-main)',
                  outline: 'none'
                }}
              >
                <option value="">-- No User (Mark Available) --</option>
                {users.map(u => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name} ({u.role}) — RFID: {u.rfid_uid || 'Unassigned'}
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button onClick={() => setShowAssignModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSaveAssign} className="btn-primary">Save Assignment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Locker Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <form onSubmit={handleCreateLocker} className="glass-panel" style={{ width: '90%', maxWidth: '450px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>
              Add New Physical Locker
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  Locker Number (e.g. 05)
                </label>
                <input 
                  type="text"
                  required
                  placeholder="05"
                  value={newLockerNumber}
                  onChange={(e) => setNewLockerNumber(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  Building Location
                </label>
                <input 
                  type="text"
                  required
                  value={newLockerLocation}
                  onChange={(e) => setNewLockerLocation(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Locker</button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
