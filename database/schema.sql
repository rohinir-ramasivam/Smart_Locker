-- Smart Locker Room Management System Database Schema (SQLite)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    rfid_uid TEXT UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('STUDENT', 'FACULTY', 'ADMIN', 'STAFF')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lockers Table
CREATE TABLE IF NOT EXISTS lockers (
    locker_id TEXT PRIMARY KEY,
    locker_number TEXT NOT NULL UNIQUE,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
    assigned_user_id TEXT,
    servo_state TEXT NOT NULL DEFAULT 'LOCKED' CHECK (servo_state IN ('LOCKED', 'UNLOCKED')),
    last_accessed DATETIME,
    FOREIGN KEY (assigned_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 3. Access Events Table
CREATE TABLE IF NOT EXISTS access_events (
    event_id TEXT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    rfid_uid TEXT NOT NULL,
    user_id TEXT,
    locker_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('GRANTED', 'DENIED')),
    event_type TEXT NOT NULL CHECK (event_type IN ('UNLOCKED', 'LOCKED', 'UNAUTHORIZED_ATTEMPT', 'MANUAL_OVERRIDE', 'DOOR_OPEN_TIMEOUT')),
    synced_from_device INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (locker_id) REFERENCES lockers(locker_id) ON DELETE CASCADE
);

-- 4. IoT Devices Table
CREATE TABLE IF NOT EXISTS devices (
    device_id TEXT PRIMARY KEY,
    locker_group TEXT NOT NULL,
    ip_address TEXT,
    wifi_status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (wifi_status IN ('ONLINE', 'OFFLINE', 'SYNCING')),
    rssi INTEGER DEFAULT -65,
    pending_logs_count INTEGER DEFAULT 0,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY,
    locker_id TEXT NOT NULL,
    rfid_uid TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('UNAUTHORIZED_ACCESS', 'DOOR_LEFT_OPEN', 'DEVICE_OFFLINE', 'TAMPER_ALERT')),
    severity TEXT NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    resolved INTEGER NOT NULL DEFAULT 0,
    resolved_at DATETIME,
    notes TEXT,
    FOREIGN KEY (locker_id) REFERENCES lockers(locker_id) ON DELETE CASCADE
);

-- Indexes for high performance lookup
CREATE INDEX IF NOT EXISTS idx_access_events_timestamp ON access_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_access_events_rfid ON access_events(rfid_uid);
CREATE INDEX IF NOT EXISTS idx_access_events_locker ON access_events(locker_id);
CREATE INDEX IF NOT EXISTS idx_users_rfid ON users(rfid_uid);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
