import React, { useState, useEffect } from 'react';
import { 
  Tv2, 
  Radio, 
  Wifi, 
  WifiOff, 
  Volume2, 
  Lock, 
  Unlock, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';

export default function HardwareSimulatorTab({ onTriggerScan, soundEnabled }) {
  const [wifiOnline, setWifiOnline] = useState(true);
  const [customUid, setCustomUid] = useState('');
  const [targetLockerId, setTargetLockerId] = useState('L01');

  // Emulator Hardware States
  const [lcdLine1, setLcdLine1] = useState('SMART LOCKER V1.0');
  const [lcdLine2, setLcdLine2] = useState('Scan RFID Tag...');
  const [servoAngle, setServoAngle] = useState(0); // 0 = Locked, 90 = Unlocked
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [ledRed, setLedRed] = useState(false);
  const [ledGreen, setLedGreen] = useState(false);

  // Virtual SD Card Log Lines
  const [sdLogs, setSdLogs] = useState([
    { event_id: 'EVT-1001', timestamp: '2026-08-15 10:30:21', rfid: 'A1B2C3D4', user: 'STU001', locker: 'L01', status: 'GRANTED', type: 'UNLOCKED', synced: 1 },
    { event_id: 'EVT-1002', timestamp: '2026-08-15 10:35:12', rfid: 'X9Y8Z7W6', user: 'UNKNOWN', locker: 'L02', status: 'DENIED', type: 'UNAUTHORIZED_ATTEMPT', synced: 1 }
  ]);

  // Audio Synthesizer Beep for Buzzer
  const playBuzzerBeep = (isDenied = false) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isDenied ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isDenied ? 400 : 1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + (isDenied ? 0.6 : 0.2));
    } catch (e) {
      console.warn('Audio Context disabled or not supported:', e);
    }
  };

  // Run Virtual Hardware Scan Simulation
  const simulateScan = (rfid, locker, forcedName = null) => {
    const timestamp = new Date().toISOString().substring(0, 19).replace('T', ' ');
    const eventId = `EVT-${Date.now().toString(36).toUpperCase()}`;

    let isAuthorized = false;
    let userName = forcedName || 'Unknown Tag';
    let userId = 'UNKNOWN';

    if (rfid === 'A1B2C3D4') { isAuthorized = true; userName = 'Alex Rivera'; userId = 'STU001'; }
    else if (rfid === 'E5F6G7H8') { isAuthorized = true; userName = 'Sophia Chen'; userId = 'STU002'; }
    else if (rfid === '99AA88BB') { isAuthorized = true; userName = 'Marcus Vance'; userId = 'STU003'; }
    else if (rfid === '11223344') { isAuthorized = true; userName = 'Emily Watson'; userId = 'STU004'; }
    else if (rfid === 'FF00FF00') { isAuthorized = true; userName = 'Admin Hayes'; userId = 'ADM001'; }

    if (isAuthorized) {
      // 1. LCD Update
      setLcdLine1('ACCESS GRANTED!');
      setLcdLine2(`${locker}: ${userName}`);
      setLedGreen(true);
      setLedRed(false);
      setServoAngle(90); // Rotate servo motor to 90 degrees!
      playBuzzerBeep(false);

      // Auto relock after 5s
      setTimeout(() => {
        setServoAngle(0);
        setLedGreen(false);
        setLcdLine1('SMART LOCKER V1.0');
        setLcdLine2('Scan RFID Tag...');
      }, 4000);
    } else {
      // DENIED
      setLcdLine1('ACCESS DENIED!');
      setLcdLine2('Unauthorized Tag');
      setLedRed(true);
      setLedGreen(false);
      setBuzzerActive(true);
      playBuzzerBeep(true);

      setTimeout(() => {
        setBuzzerActive(false);
        setLedRed(false);
        setLcdLine1('SMART LOCKER V1.0');
        setLcdLine2('Scan RFID Tag...');
      }, 3000);
    }

    // 2. Append to Virtual SD Card CSV
    const newSdEntry = {
      event_id: eventId,
      timestamp,
      rfid,
      user: userId,
      locker,
      status: isAuthorized ? 'GRANTED' : 'DENIED',
      type: isAuthorized ? 'UNLOCKED' : 'UNAUTHORIZED_ATTEMPT',
      synced: wifiOnline ? 1 : 0
    };

    setSdLogs(prev => [newSdEntry, ...prev]);

    // 3. If Wi-Fi is ON, transmit event to Express backend & dashboard!
    if (wifiOnline) {
      onTriggerScan({
        eventId,
        rfidUid: rfid,
        userId: isAuthorized ? userId : null,
        lockerId: locker,
        timestamp,
        status: isAuthorized ? 'GRANTED' : 'DENIED',
        eventType: isAuthorized ? 'UNLOCKED' : 'UNAUTHORIZED_ATTEMPT',
        syncedFromDevice: 0
      });
    }
  };

  // Sync Offline Queue when Wi-Fi turns back ON
  const handleToggleWifi = () => {
    const nextWifiState = !wifiOnline;
    setWifiOnline(nextWifiState);

    if (!wifiOnline && nextWifiState) {
      // Sync pending logs!
      const pending = sdLogs.filter(l => l.synced === 0);
      if (pending.length > 0) {
        setLcdLine1('SYNCING OFFLINE');
        setLcdLine2(`Logs queue: ${pending.length}`);

        // Upload batch to backend
        pending.forEach(evt => {
          onTriggerScan({
            eventId: evt.event_id,
            rfidUid: evt.rfid,
            userId: evt.user !== 'UNKNOWN' ? evt.user : null,
            lockerId: evt.locker,
            timestamp: evt.timestamp,
            status: evt.status,
            eventType: evt.type,
            syncedFromDevice: 1
          });
        });

        // Mark local SD logs as synced
        setSdLogs(prev => prev.map(l => ({ ...l, synced: 1 })));

        setTimeout(() => {
          setLcdLine1('SMART LOCKER V1.0');
          setLcdLine2('Scan RFID Tag...');
        }, 3000);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tv2 size={24} color="#a855f7" /> ESP32 Interactive Hardware Simulator
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Simulate physical RC522 card taps, LCD 16x2 text rendering, Servo unlock angles, Buzzer alarms, and Offline SD Queue sync.
          </p>
        </div>

        {/* Wi-Fi Toggle Switch */}
        <button 
          onClick={handleToggleWifi}
          className={wifiOnline ? 'btn-primary' : 'btn-danger'}
          style={{ padding: '0.6rem 1rem' }}
        >
          {wifiOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
          <span>{wifiOnline ? 'Wi-Fi Network: ONLINE' : 'Wi-Fi Network: DISCONNECTED (OFFLINE)'}</span>
        </button>
      </div>

      {/* Main Virtual Hardware Board Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Virtual ESP32 Board Graphic & Peripherals */}
        <div className="glass-panel" style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(18, 24, 36, 0.95) 0%, rgba(30, 42, 64, 0.8) 100%)',
          borderColor: 'rgba(168, 85, 247, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Tv2 size={18} /> ESP32 DEVKIT V1 BOARD
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              FW: v1.0.0 (C++ HAL)
            </span>
          </div>

          {/* 1. Emulated 16x2 LCD Screen */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              I2C 16x2 LCD DISPLAY (ADDRESS 0x27)
            </div>
            <div className="lcd-screen">
              <div>{lcdLine1}</div>
              <div>{lcdLine2}</div>
            </div>
          </div>

          {/* 2. Emulated Servo Motor Angle Gauge */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SERVO MOTOR PWM</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: servoAngle === 90 ? '#34d399' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {servoAngle === 90 ? '90° (UNLOCKED)' : '0° (LOCKED)'}
              </div>
            </div>

            <div className="servo-gauge-dial">
              <div 
                className="servo-needle" 
                style={{ transform: `rotate(${servoAngle === 90 ? 45 : -45}deg)` }}
              />
            </div>
          </div>

          {/* 3. Status LEDs & Buzzer Indicators */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              border: `1px solid ${ledGreen ? '#10b981' : 'var(--border-color)'}`
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: ledGreen ? '#10b981' : '#334155', margin: '0 auto 0.3rem auto', boxShadow: ledGreen ? '0 0 10px #10b981' : 'none' }} />
              <span style={{ fontSize: '0.7rem', color: ledGreen ? '#34d399' : 'var(--text-muted)', fontWeight: 700 }}>GREEN LED</span>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              border: `1px solid ${ledRed ? '#f43f5e' : 'var(--border-color)'}`
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: ledRed ? '#f43f5e' : '#334155', margin: '0 auto 0.3rem auto', boxShadow: ledRed ? '0 0 10px #f43f5e' : 'none' }} />
              <span style={{ fontSize: '0.7rem', color: ledRed ? '#fb7185' : 'var(--text-muted)', fontWeight: 700 }}>RED LED</span>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              border: `1px solid ${buzzerActive ? '#f59e0b' : 'var(--border-color)'}`
            }}>
              <Volume2 size={16} color={buzzerActive ? '#fbbf24' : 'var(--text-muted)'} style={{ margin: '0 auto 0.2rem auto' }} />
              <span style={{ fontSize: '0.7rem', color: buzzerActive ? '#fbbf24' : 'var(--text-muted)', fontWeight: 700 }}>BUZZER</span>
            </div>
          </div>
        </div>

        {/* MFRC522 Scan Controls & Presets */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={20} color="#38bdf8" /> RC522 RFID Tap Simulator
          </h3>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              Target Locker for Scan
            </label>
            <select 
              value={targetLockerId}
              onChange={(e) => setTargetLockerId(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem',
                color: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="L01">L01 — Locker 01 (Assigned: Alex Rivera)</option>
              <option value="L02">L02 — Locker 02 (Assigned: Sophia Chen)</option>
              <option value="L03">L03 — Locker 03 (Assigned: Marcus Vance)</option>
              <option value="L04">L04 — Locker 04 (Assigned: Emily Watson)</option>
            </select>
          </div>

          {/* Preset Card Tap Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Authorized RFID Cards:
            </span>

            <button 
              onClick={() => simulateScan('A1B2C3D4', targetLockerId)}
              className="btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.65rem 0.85rem' }}
            >
              <span>💳 Alex Rivera (A1B2C3D4)</span>
              <span className="badge badge-granted">Tap Authorized</span>
            </button>

            <button 
              onClick={() => simulateScan('E5F6G7H8', targetLockerId)}
              className="btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.65rem 0.85rem' }}
            >
              <span>💳 Sophia Chen (E5F6G7H8)</span>
              <span className="badge badge-granted">Tap Authorized</span>
            </button>

            <button 
              onClick={() => simulateScan('FF00FF00', targetLockerId)}
              className="btn-secondary"
              style={{ justifyContent: 'space-between', padding: '0.65rem 0.85rem' }}
            >
              <span>🔑 Admin Hayes (FF00FF00)</span>
              <span className="badge badge-granted">Admin Override</span>
            </button>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.5rem' }}>
              Unauthorized Intruder Card:
            </span>

            <button 
              onClick={() => simulateScan('X9Y8Z7W6', targetLockerId)}
              className="btn-danger"
              style={{ justifyContent: 'space-between', padding: '0.65rem 0.85rem' }}
            >
              <span>⚠️ Rogue Card (X9Y8Z7W6)</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>TRIGGER BUZZER ALARM</span>
            </button>
          </div>
        </div>

      </div>

      {/* Raw Virtual MicroSD Card File Console */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="#38bdf8" /> Virtual MicroSD Card Viewer (/access_logs.csv)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {sdLogs.filter(l => l.synced === 0).length} Unsynced Pending Logs
          </span>
        </div>

        <div style={{
          background: '#090d16',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: '#38bdf8',
          maxHeight: '180px',
          overflowY: 'auto',
          lineHeight: 1.6
        }}>
          <div style={{ color: 'var(--text-muted)', borderBottom: '1px solid #1e293b', paddingBottom: '0.3rem', marginBottom: '0.4rem' }}>
            event_id,timestamp,rfid_uid,user_id,locker_id,status,event_type,synced
          </div>
          {sdLogs.map((log, idx) => (
            <div key={idx} style={{ color: log.synced === 0 ? '#fb7185' : '#34d399' }}>
              {log.event_id},{log.timestamp},{log.rfid},{log.user},{log.locker},{log.status},{log.type},{log.synced}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
