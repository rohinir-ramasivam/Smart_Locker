import React, { useState } from 'react';
import { Users, UserPlus, Radio, Lock, Trash2, Edit3, Shield, Mail } from 'lucide-react';

export default function UserManagementTab({ users, onCreateUser, onDeleteUser }) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rfidUid, setRfidUid] = useState('');
  const [role, setRole] = useState('STUDENT');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email) {
      onCreateUser({ name, email, rfidUid, role });
      setName('');
      setEmail('');
      setRfidUid('');
      setRole('STUDENT');
      setShowModal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            User Directory & Authorization Roster
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Manage student & staff profiles, roles, and linked RFID security credentials.
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-primary">
          <UserPlus size={18} /> Register New User
        </button>
      </div>

      {/* User Roster Table */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>User Details</th>
              <th style={{ padding: '1rem' }}>Role</th>
              <th style={{ padding: '1rem' }}>RFID Tag UID</th>
              <th style={{ padding: '1rem' }}>Assigned Locker</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Mail size={12} /> {user.email} • ID: {user.user_id}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: user.role === 'ADMIN' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                    color: user.role === 'ADMIN' ? '#c084fc' : '#38bdf8',
                    border: `1px solid ${user.role === 'ADMIN' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(56, 189, 248, 0.3)'}`
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)' }}>
                  {user.rfid_uid ? (
                    <span style={{ color: '#34d399', fontWeight: 700 }}>
                      💳 {user.rfid_uid}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  {user.assigned_locker_number ? (
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>
                      🔒 {user.assigned_locker_id} ({user.assigned_locker_number})
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>None</span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className="badge badge-granted">ACTIVE</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button 
                    onClick={() => onDeleteUser(user.user_id)}
                    className="btn-secondary" 
                    style={{ padding: '0.35rem 0.6rem', color: '#fb7185' }}
                    title="Delete User"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
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
          <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '90%', maxWidth: '450px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>
              Register Authorized User
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Full Name
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  Email Address
                </label>
                <input 
                  type="email"
                  required
                  placeholder="jordan.miller@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  RFID Tag UID (Hex String e.g. A1B2C3D4)
                </label>
                <input 
                  type="text"
                  placeholder="A1B2C3D4"
                  value={rfidUid}
                  onChange={(e) => setRfidUid(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
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

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                  System Role
                </label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
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
                  <option value="STUDENT">STUDENT</option>
                  <option value="FACULTY">FACULTY</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register User</button>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
