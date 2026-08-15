import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import Navbar from './components/Navbar';
import OverviewTab from './components/OverviewTab';
import LockerManagementTab from './components/LockerManagementTab';
import UserManagementTab from './components/UserManagementTab';
import RfidAssignmentTab from './components/RfidAssignmentTab';
import AccessLogsTab from './components/AccessLogsTab';
import SecurityAlertsTab from './components/SecurityAlertsTab';
import AnalyticsTab from './components/AnalyticsTab';
import IoTDeviceStatusTab from './components/IoTDeviceStatusTab';
import HardwareSimulatorTab from './components/HardwareSimulatorTab';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isOnline, setIsOnline] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Application Data States
  const [stats, setStats] = useState({});
  const [lockers, setLockers] = useState([]);
  const [users, setUsers] = useState([]);
  const [accessEvents, setAccessEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [analytics, setAnalytics] = useState({});

  // 1. Initial Data Fetching from Express API
  const fetchAllData = async () => {
    try {
      const [lockersRes, usersRes, eventsRes, alertsRes, devicesRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/lockers`).then(r => r.json()),
        fetch(`${API_BASE}/users`).then(r => r.json()),
        fetch(`${API_BASE}/access-events?limit=50`).then(r => r.json()),
        fetch(`${API_BASE}/alerts`).then(r => r.json()),
        fetch(`${API_BASE}/devices`).then(r => r.json()),
        fetch(`${API_BASE}/analytics/summary`).then(r => r.json())
      ]);

      setLockers(Array.isArray(lockersRes) ? lockersRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setAccessEvents(eventsRes?.events || []);
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      setDevices(Array.isArray(devicesRes) ? devicesRes : []);
      setAnalytics(analyticsRes || {});
      setStats(analyticsRes?.stats || {});
      setIsOnline(true);
    } catch (err) {
      console.warn('⚠️ Could not connect to backend API server:', err);
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // 2. Setup Real-time WebSocket Connection
    const socket = io('http://localhost:5000', {
      reconnectionAttempts: 5,
      timeout: 5000
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Real-time Security WebSocket');
      setIsOnline(true);
    });

    socket.on('disconnect', () => {
      console.warn('🔌 WebSocket disconnected');
      setIsOnline(false);
    });

    // Real-time access event broadcast from ESP32 or Simulator
    socket.on('access_event', (newEvt) => {
      console.log('📡 Real-time Access Event Received:', newEvt);
      setAccessEvents(prev => [newEvt, ...prev]);
      fetchAllData();
    });

    // Real-time security alert broadcast
    socket.on('security_alert', (newAlert) => {
      console.warn('⚠️ Real-time Security Alert:', newAlert);
      setAlerts(prev => [newAlert, ...prev]);
      fetchAllData();
    });

    socket.on('locker_update', (updatedLockers) => {
      if (Array.isArray(updatedLockers)) setLockers(updatedLockers);
    });

    return () => socket.disconnect();
  }, []);

  // API Action Handlers
  const handleUnlockTrigger = async (lockerId, command) => {
    try {
      const res = await fetch(`${API_BASE}/lockers/${lockerId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      if (data.success) fetchAllData();
    } catch (e) {
      console.error('Error triggering locker lock:', e);
    }
  };

  const handleAssignUser = async (lockerId, userId) => {
    try {
      await fetch(`${API_BASE}/lockers/${lockerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedUserId: userId })
      });
      fetchAllData();
    } catch (e) {
      console.error('Error assigning user:', e);
    }
  };

  const handleAddLocker = async (lockerData) => {
    try {
      await fetch(`${API_BASE}/lockers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lockerData)
      });
      fetchAllData();
    } catch (e) {
      console.error('Error adding locker:', e);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      fetchAllData();
    } catch (e) {
      console.error('Error creating user:', e);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
      fetchAllData();
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const handleAssignRfid = async (assignmentData) => {
    try {
      await fetch(`${API_BASE}/rfid/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      });
      fetchAllData();
    } catch (e) {
      console.error('Error assigning RFID:', e);
    }
  };

  const handleResolveAlert = async (alertId, notes) => {
    try {
      await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      fetchAllData();
    } catch (e) {
      console.error('Error resolving alert:', e);
    }
  };

  const handleTriggerSimulatorScan = async (scanPayload) => {
    try {
      await fetch(`${API_BASE}/access-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanPayload)
      });
      fetchAllData();
    } catch (e) {
      console.error('Error sending simulator event:', e);
    }
  };

  const unresolvedAlertCount = alerts.filter(a => !a.resolved).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        unresolvedAlertCount={unresolvedAlertCount}
        isOnline={isOnline}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.5rem', flex: 1 }}>
        {activeTab === 'overview' && (
          <OverviewTab 
            stats={stats} 
            lockers={lockers} 
            recentEvents={accessEvents} 
            alerts={alerts}
            setActiveTab={setActiveTab}
            onUnlockTrigger={handleUnlockTrigger}
          />
        )}

        {activeTab === 'lockers' && (
          <LockerManagementTab 
            lockers={lockers} 
            users={users}
            onUnlockTrigger={handleUnlockTrigger}
            onAssignUser={handleAssignUser}
            onAddLocker={handleAddLocker}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementTab 
            users={users} 
            onCreateUser={handleCreateUser} 
            onDeleteUser={handleDeleteUser} 
          />
        )}

        {activeTab === 'rfid' && (
          <RfidAssignmentTab 
            users={users} 
            lockers={lockers} 
            onAssignRfid={handleAssignRfid} 
          />
        )}

        {activeTab === 'logs' && (
          <AccessLogsTab 
            events={accessEvents} 
            onRefresh={fetchAllData}
            lockers={lockers}
            users={users}
          />
        )}

        {activeTab === 'alerts' && (
          <SecurityAlertsTab 
            alerts={alerts} 
            onResolveAlert={handleResolveAlert} 
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab analytics={analytics} />
        )}

        {activeTab === 'devices' && (
          <IoTDeviceStatusTab devices={devices} onRefresh={fetchAllData} />
        )}

        {activeTab === 'simulator' && (
          <HardwareSimulatorTab 
            onTriggerScan={handleTriggerSimulatorScan} 
            soundEnabled={soundEnabled} 
          />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(10,13,20,0.9)' }}>
        Smart Locker Room Management System • Hardware + Software IoT Integration • ESP32 + Node.js + React
      </footer>
    </div>
  );
}
