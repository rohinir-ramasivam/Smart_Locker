-- Initial Seed Data for Smart Locker Room Management System

-- Clear existing data if re-running seed script
DELETE FROM alerts;
DELETE FROM access_events;
DELETE FROM lockers;
DELETE FROM users;
DELETE FROM devices;

-- Insert Users
INSERT INTO users (user_id, name, email, rfid_uid, role, status) VALUES
('STU001', 'Alex Rivera', 'alex.rivera@university.edu', 'A1B2C3D4', 'STUDENT', 'ACTIVE'),
('STU002', 'Sophia Chen', 'sophia.chen@university.edu', 'E5F6G7H8', 'STUDENT', 'ACTIVE'),
('STU003', 'Marcus Vance', 'marcus.vance@university.edu', '99AA88BB', 'STUDENT', 'ACTIVE'),
('STU004', 'Emily Watson', 'emily.watson@university.edu', '11223344', 'STUDENT', 'ACTIVE'),
('ADM001', 'Dr. Robert Hayes', 'robert.hayes@university.edu', 'FF00FF00', 'ADMIN', 'ACTIVE');

-- Insert Lockers (4 Lockers for standard prototype setup)
INSERT INTO lockers (locker_id, locker_number, location, status, assigned_user_id, servo_state, last_accessed) VALUES
('L01', 'Locker 01', 'Building A - North Wing', 'OCCUPIED', 'STU001', 'LOCKED', '2026-08-15 10:30:21'),
('L02', 'Locker 02', 'Building A - North Wing', 'OCCUPIED', 'STU002', 'LOCKED', '2026-08-15 11:15:05'),
('L03', 'Locker 03', 'Building A - South Wing', 'OCCUPIED', 'STU003', 'LOCKED', '2026-08-15 09:45:10'),
('L04', 'Locker 04', 'Building A - South Wing', 'AVAILABLE', NULL, 'LOCKED', '2026-08-14 16:20:00');

-- Insert Main IoT Device
INSERT INTO devices (device_id, locker_group, ip_address, wifi_status, rssi, pending_logs_count, last_seen) VALUES
('ESP32_NODE_01', 'Locker Room Alpha (L01-L04)', '192.168.1.105', 'ONLINE', -58, 0, '2026-08-15 13:58:00');

-- Insert Access Events History
INSERT INTO access_events (event_id, timestamp, rfid_uid, user_id, locker_id, status, event_type, synced_from_device) VALUES
('EVT-1001', '2026-08-15 08:30:12', 'A1B2C3D4', 'STU001', 'L01', 'GRANTED', 'UNLOCKED', 0),
('EVT-1002', '2026-08-15 08:30:45', 'A1B2C3D4', 'STU001', 'L01', 'GRANTED', 'LOCKED', 0),
('EVT-1003', '2026-08-15 09:12:00', 'E5F6G7H8', 'STU002', 'L02', 'GRANTED', 'UNLOCKED', 0),
('EVT-1004', '2026-08-15 09:45:10', '99AA88BB', 'STU003', 'L03', 'GRANTED', 'UNLOCKED', 0),
('EVT-1005', '2026-08-15 10:30:21', 'A1B2C3D4', 'STU001', 'L01', 'GRANTED', 'UNLOCKED', 0),
('EVT-1006', '2026-08-15 10:35:12', 'X9Y8Z7W6', NULL, 'L02', 'DENIED', 'UNAUTHORIZED_ATTEMPT', 0),
('EVT-1007', '2026-08-15 11:15:05', 'E5F6G7H8', 'STU002', 'L02', 'GRANTED', 'UNLOCKED', 0),
('EVT-1008', '2026-08-15 12:05:40', 'DEADBEEF', NULL, 'L01', 'DENIED', 'UNAUTHORIZED_ATTEMPT', 0),
('EVT-1009', '2026-08-15 13:20:15', 'A1B2C3D4', 'STU001', 'L01', 'GRANTED', 'UNLOCKED', 1);

-- Insert Security Alerts
INSERT INTO alerts (alert_id, locker_id, rfid_uid, timestamp, alert_type, severity, resolved, notes) VALUES
('ALT-501', 'L02', 'X9Y8Z7W6', '2026-08-15 10:35:12', 'UNAUTHORIZED_ACCESS', 'HIGH', 0, 'Unknown RFID tag scanned 3 times consecutively'),
('ALT-502', 'L01', 'DEADBEEF', '2026-08-15 12:05:40', 'UNAUTHORIZED_ACCESS', 'HIGH', 0, 'Unauthorized access attempt detected'),
('ALT-500', 'L03', '99AA88BB', '2026-08-14 18:00:00', 'DOOR_LEFT_OPEN', 'MEDIUM', 1, 'Door remained unlatched for > 60 seconds (Resolved by Admin)');
