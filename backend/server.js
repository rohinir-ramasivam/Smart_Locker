const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const { db, query, getOne, execute, initDb } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// HTTP Server + Socket.io Server for Real-Time Dashboard Updates
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Socket connection logger
io.on('connection', (socket) => {
  console.log(`⚡ Client connected to real-time feed: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Helper function to broadcast updates
function broadcastEvent(eventName, data) {
  io.emit(eventName, data);
}

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// 1. Health check & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Smart Locker Management System Backend',
    timestamp: new Date().toISOString()
  });
});

// 2. Validate RFID Tag (Used by ESP32 or Simulator)
app.post('/api/rfid/validate', async (req, res) => {
  try {
    const { rfidUid, lockerId } = req.body;

    if (!rfidUid) {
      return res.status(400).json({ error: 'rfidUid is required' });
    }

    // Find user matching RFID UID
    const user = await getOne('SELECT * FROM users WHERE rfid_uid = ? AND status = "ACTIVE"', [rfidUid]);

    if (!user) {
      return res.json({
        authorized: false,
        reason: 'UNKNOWN_RFID',
        user: null,
        locker: null
      });
    }

    // Check if user is ADMIN (Admins can unlock any locker)
    if (user.role === 'ADMIN') {
      const locker = lockerId ? await getOne('SELECT * FROM lockers WHERE locker_id = ?', [lockerId]) : null;
      return res.json({
        authorized: true,
        reason: 'ADMIN_OVERRIDE',
        user,
        lockerId: lockerId || 'L01'
      });
    }

    // Find locker assigned to this user
    let assignedLocker = await getOne('SELECT * FROM lockers WHERE assigned_user_id = ?', [user.user_id]);

    // If specific lockerId provided, check if matches assigned locker
    if (lockerId && assignedLocker && assignedLocker.locker_id !== lockerId) {
      return res.json({
        authorized: false,
        reason: 'WRONG_LOCKER_ASSIGNMENT',
        user,
        assignedLockerId: assignedLocker.locker_id,
        targetLockerId: lockerId
      });
    }

    if (!assignedLocker && !lockerId) {
      return res.json({
        authorized: false,
        reason: 'NO_LOCKER_ASSIGNED',
        user,
        locker: null
      });
    }

    const targetLocker = assignedLocker ? assignedLocker.locker_id : lockerId;

    return res.json({
      authorized: true,
      reason: 'AUTHORIZED_USER',
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      lockerId: targetLocker
    });
  } catch (err) {
    console.error('Error validating RFID:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Receive Access Event from ESP32 / IoT device
app.post('/api/access-events', async (req, res) => {
  try {
    const {
      eventId,
      rfidUid,
      userId: reqUserId,
      lockerId,
      timestamp: reqTimestamp,
      status,
      eventType,
      syncedFromDevice = 0
    } = req.body;

    if (!rfidUid || !lockerId || !status || !eventType) {
      return res.status(400).json({ error: 'Missing required event parameters (rfidUid, lockerId, status, eventType)' });
    }

    const generateEventId = eventId || `EVT-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = reqTimestamp || new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Duplicate check
    const existing = await getOne('SELECT event_id FROM access_events WHERE event_id = ?', [generateEventId]);
    if (existing) {
      return res.json({ success: true, duplicate: true, message: 'Event already recorded' });
    }

    // Resolve user ID if not provided
    let userId = reqUserId;
    if (!userId) {
      const user = await getOne('SELECT user_id FROM users WHERE rfid_uid = ?', [rfidUid]);
      if (user) userId = user.user_id;
    }

    // Insert access event
    await execute(
      `INSERT INTO access_events (event_id, timestamp, rfid_uid, user_id, locker_id, status, event_type, synced_from_device)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateEventId, timestamp, rfidUid, userId || null, lockerId, status, eventType, syncedFromDevice ? 1 : 0]
    );

    // If Granted & Unlocked -> Update locker state
    if (status === 'GRANTED' && (eventType === 'UNLOCKED' || eventType === 'MANUAL_OVERRIDE')) {
      await execute(
        `UPDATE lockers SET servo_state = 'UNLOCKED', status = 'OCCUPIED', last_accessed = ? WHERE locker_id = ?`,
        [timestamp, lockerId]
      );
    } else if (status === 'GRANTED' && eventType === 'LOCKED') {
      await execute(
        `UPDATE lockers SET servo_state = 'LOCKED', last_accessed = ? WHERE locker_id = ?`,
        [timestamp, lockerId]
      );
    }

    // If Denied / Unauthorized attempt -> Create security alert!
    let createdAlert = null;
    if (status === 'DENIED' || eventType === 'UNAUTHORIZED_ATTEMPT') {
      const alertId = `ALT-${Date.now().toString(36).toUpperCase()}`;
      await execute(
        `INSERT INTO alerts (alert_id, locker_id, rfid_uid, timestamp, alert_type, severity, resolved, notes)
         VALUES (?, ?, ?, ?, 'UNAUTHORIZED_ACCESS', 'HIGH', 0, ?)`,
        [alertId, lockerId, rfidUid, `Unauthorized attempt with RFID [${rfidUid}] on ${lockerId}`]
      );

      createdAlert = await getOne('SELECT * FROM alerts WHERE alert_id = ?', [alertId]);
      broadcastEvent('security_alert', createdAlert);
    }

    // Retrieve fresh event row with user details for dashboard broadcast
    const fullEvent = await getOne(
      `SELECT e.*, u.name as user_name, u.email as user_email, l.locker_number
       FROM access_events e
       LEFT JOIN users u ON e.user_id = u.user_id
       LEFT JOIN lockers l ON e.locker_id = l.locker_id
       WHERE e.event_id = ?`,
      [generateEventId]
    );

    // Broadcast WebSocket real-time event to all connected dashboard pages
    broadcastEvent('access_event', fullEvent);
    broadcastEvent('locker_update', await query('SELECT * FROM lockers'));

    res.json({
      success: true,
      eventId: generateEventId,
      event: fullEvent,
      alertCreated: !!createdAlert
    });
  } catch (err) {
    console.error('Error logging access event:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Offline Event Batch Sync (from ESP32 SD card queue)
app.post('/api/access-events/sync', async (req, res) => {
  try {
    const { deviceId = 'ESP32_NODE_01', events = [] } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'events must be an array' });
    }

    let syncedCount = 0;
    let duplicateCount = 0;
    const insertedEvents = [];

    for (const evt of events) {
      const { eventId, rfidUid, lockerId, timestamp, status, eventType } = evt;
      const genId = eventId || `SYNC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*1000)}`;
      
      const existing = await getOne('SELECT event_id FROM access_events WHERE event_id = ?', [genId]);
      if (existing) {
        duplicateCount++;
        continue;
      }

      let userId = evt.userId;
      if (!userId && rfidUid) {
        const user = await getOne('SELECT user_id FROM users WHERE rfid_uid = ?', [rfidUid]);
        if (user) userId = user.user_id;
      }

      await execute(
        `INSERT INTO access_events (event_id, timestamp, rfid_uid, user_id, locker_id, status, event_type, synced_from_device)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [genId, timestamp || new Date().toISOString().substring(0,19).replace('T',' '), rfidUid, userId || null, lockerId, status, eventType]
      );

      syncedCount++;

      // Create alert if denied
      if (status === 'DENIED' || eventType === 'UNAUTHORIZED_ATTEMPT') {
        const alertId = `ALT-SYNC-${Date.now().toString(36).toUpperCase()}`;
        await execute(
          `INSERT INTO alerts (alert_id, locker_id, rfid_uid, timestamp, alert_type, severity, resolved, notes)
           VALUES (?, ?, ?, ?, 'UNAUTHORIZED_ACCESS', 'HIGH', 0, ?)`,
          [alertId, lockerId, rfidUid, `Offline synced unauthorized attempt with RFID [${rfidUid}] on ${lockerId}`]
        );
      }
    }

    // Update Device status
    await execute(
      `UPDATE devices SET wifi_status = 'ONLINE', pending_logs_count = 0, last_seen = CURRENT_TIMESTAMP WHERE device_id = ?`,
      [deviceId]
    );

    broadcastEvent('logs_synced', { deviceId, syncedCount, duplicateCount });
    broadcastEvent('device_update', await query('SELECT * FROM devices'));

    res.json({
      success: true,
      deviceId,
      syncedCount,
      duplicateCount,
      message: `Successfully synchronized ${syncedCount} logs (${duplicateCount} duplicates skipped)`
    });
  } catch (err) {
    console.error('Error batch syncing logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Get Access Logs with Search and Filtering
app.get('/api/access-events', async (req, res) => {
  try {
    const { search, status, lockerId, userId, startDate, endDate, limit = 100, page = 1 } = req.query;

    let sql = `
      SELECT e.*, u.name as user_name, u.email as user_email, l.locker_number, l.location as locker_location
      FROM access_events e
      LEFT JOIN users u ON e.user_id = u.user_id
      LEFT JOIN lockers l ON e.locker_id = l.locker_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (e.rfid_uid LIKE ? OR u.name LIKE ? OR e.event_id LIKE ? OR l.locker_number LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      sql += ` AND e.status = ?`;
      params.push(status);
    }

    if (lockerId) {
      sql += ` AND e.locker_id = ?`;
      params.push(lockerId);
    }

    if (userId) {
      sql += ` AND e.user_id = ?`;
      params.push(userId);
    }

    if (startDate) {
      sql += ` AND e.timestamp >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND e.timestamp <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY e.timestamp DESC`;

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    const allRows = await query(sql, params);
    const totalCount = allRows.length;

    const paginatedSql = sql + ` LIMIT ? OFFSET ?`;
    const rows = await query(paginatedSql, [...params, parsedLimit, offset]);

    res.json({
      total: totalCount,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalCount / parsedLimit),
      events: rows
    });
  } catch (err) {
    console.error('Error fetching access events:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. User Management APIs
app.get('/api/users', async (req, res) => {
  try {
    const users = await query(`
      SELECT u.*, l.locker_id as assigned_locker_id, l.locker_number as assigned_locker_number
      FROM users u
      LEFT JOIN lockers l ON u.user_id = l.assigned_user_id
      ORDER BY u.user_id ASC
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { userId, name, email, rfidUid, role = 'STUDENT', status = 'ACTIVE' } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const genUserId = userId || `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    await execute(
      `INSERT INTO users (user_id, name, email, rfid_uid, role, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [genUserId, name, email, rfidUid || null, role, status]
    );

    const newUser = await getOne('SELECT * FROM users WHERE user_id = ?', [genUserId]);
    broadcastEvent('user_update', newUser);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, rfidUid, role, status } = req.body;

    await execute(
      `UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email),
       rfid_uid = ?, role = COALESCE(?, role), status = COALESCE(?, status)
       WHERE user_id = ?`,
      [name, email, rfidUid, role, status, id]
    );

    const updatedUser = await getOne('SELECT * FROM users WHERE user_id = ?', [id]);
    broadcastEvent('user_update', updatedUser);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Unassign lockers first
    await execute('UPDATE lockers SET assigned_user_id = NULL, status = "AVAILABLE" WHERE assigned_user_id = ?', [id]);
    await execute('DELETE FROM users WHERE user_id = ?', [id]);
    broadcastEvent('user_update', { deleted: id });
    res.json({ success: true, message: `User ${id} deleted` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Locker Management APIs
app.get('/api/lockers', async (req, res) => {
  try {
    const lockers = await query(`
      SELECT l.*, u.name as assigned_user_name, u.email as assigned_user_email, u.rfid_uid as assigned_user_rfid, u.role as assigned_user_role
      FROM lockers l
      LEFT JOIN users u ON l.assigned_user_id = u.user_id
      ORDER BY l.locker_id ASC
    `);
    res.json(lockers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lockers', async (req, res) => {
  try {
    const { lockerId, lockerNumber, location, assignedUserId, status = 'AVAILABLE' } = req.body;
    if (!lockerNumber || !location) {
      return res.status(400).json({ error: 'Locker number and location are required' });
    }

    const genLockerId = lockerId || `L${Math.floor(10 + Math.random() * 90)}`;
    await execute(
      `INSERT INTO lockers (locker_id, locker_number, location, status, assigned_user_id, servo_state)
       VALUES (?, ?, ?, ?, ?, 'LOCKED')`,
      [genLockerId, lockerNumber, location, assignedUserId ? 'OCCUPIED' : status, assignedUserId || null]
    );

    const newLocker = await getOne('SELECT * FROM lockers WHERE locker_id = ?', [genLockerId]);
    broadcastEvent('locker_update', await query('SELECT * FROM lockers'));
    res.status(201).json(newLocker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lockers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { lockerNumber, location, status, assignedUserId, servoState } = req.body;

    const newStatus = assignedUserId ? 'OCCUPIED' : (status || 'AVAILABLE');

    await execute(
      `UPDATE lockers SET locker_number = COALESCE(?, locker_number),
       location = COALESCE(?, location),
       status = ?,
       assigned_user_id = ?,
       servo_state = COALESCE(?, servo_state)
       WHERE locker_id = ?`,
      [lockerNumber, location, newStatus, assignedUserId !== undefined ? assignedUserId : null, servoState, id]
    );

    const updatedLocker = await getOne('SELECT * FROM lockers WHERE locker_id = ?', [id]);
    broadcastEvent('locker_update', await query('SELECT * FROM lockers'));
    res.json(updatedLocker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remote Lock/Unlock Trigger from Dashboard
app.post('/api/lockers/:id/control', async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = req.body; // 'UNLOCK' or 'LOCK'

    if (!['UNLOCK', 'LOCK'].includes(command)) {
      return res.status(400).json({ error: 'Command must be UNLOCK or LOCK' });
    }

    const newServoState = command === 'UNLOCK' ? 'UNLOCKED' : 'LOCKED';
    const timestamp = new Date().toISOString().substring(0,19).replace('T',' ');

    await execute(
      `UPDATE lockers SET servo_state = ?, last_accessed = ? WHERE locker_id = ?`,
      [newServoState, timestamp, id]
    );

    // Record remote manual override access event
    const eventId = `EVT-REMOTE-${Date.now().toString(36).toUpperCase()}`;
    const locker = await getOne('SELECT * FROM lockers WHERE locker_id = ?', [id]);

    await execute(
      `INSERT INTO access_events (event_id, timestamp, rfid_uid, user_id, locker_id, status, event_type, synced_from_device)
       VALUES (?, ?, 'REMOTE_ADMIN', ?, ?, 'GRANTED', 'MANUAL_OVERRIDE', 0)`,
      [eventId, timestamp, locker.assigned_user_id || null, id]
    );

    const updatedLockers = await query('SELECT * FROM lockers');
    broadcastEvent('locker_update', updatedLockers);
    broadcastEvent('remote_control', { lockerId: id, command, timestamp });

    res.json({
      success: true,
      lockerId: id,
      servoState: newServoState,
      command
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. RFID Assignment API (Link RFID UID -> User -> Locker)
app.post('/api/rfid/assign', async (req, res) => {
  try {
    const { rfidUid, userId, lockerId } = req.body;

    if (!rfidUid || !userId) {
      return res.status(400).json({ error: 'rfidUid and userId are required' });
    }

    // 1. Assign RFID to User
    await execute('UPDATE users SET rfid_uid = ? WHERE user_id = ?', [rfidUid, userId]);

    // 2. If lockerId provided, assign user to locker
    if (lockerId) {
      // Unassign existing locker for this user if any
      await execute('UPDATE lockers SET assigned_user_id = NULL, status = "AVAILABLE" WHERE assigned_user_id = ?', [userId]);
      // Assign new locker
      await execute('UPDATE lockers SET assigned_user_id = ?, status = "OCCUPIED" WHERE locker_id = ?', [userId, lockerId]);
    }

    const updatedUser = await getOne('SELECT * FROM users WHERE user_id = ?', [userId]);
    const updatedLockers = await query('SELECT * FROM lockers');

    broadcastEvent('user_update', updatedUser);
    broadcastEvent('locker_update', updatedLockers);

    res.json({
      success: true,
      message: `Assigned RFID ${rfidUid} to user ${updatedUser.name}` + (lockerId ? ` and locker ${lockerId}` : ''),
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Alerts Management
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await query(`
      SELECT a.*, l.locker_number, l.location as locker_location
      FROM alerts a
      LEFT JOIN lockers l ON a.locker_id = l.locker_id
      ORDER BY a.timestamp DESC
    `);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const timestamp = new Date().toISOString().substring(0,19).replace('T',' ');
    await execute(
      `UPDATE alerts SET resolved = 1, resolved_at = ?, notes = COALESCE(?, notes) WHERE alert_id = ?`,
      [timestamp, notes, id]
    );

    const updatedAlert = await getOne('SELECT * FROM alerts WHERE alert_id = ?', [id]);
    broadcastEvent('alert_resolved', updatedAlert);
    res.json(updatedAlert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. IoT Device Management & Heartbeats
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await query('SELECT * FROM devices');
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/devices/heartbeat', async (req, res) => {
  try {
    const { deviceId = 'ESP32_NODE_01', ipAddress, wifiStatus = 'ONLINE', rssi = -60, pendingLogsCount = 0 } = req.body;

    const existing = await getOne('SELECT device_id FROM devices WHERE device_id = ?', [deviceId]);
    if (existing) {
      await execute(
        `UPDATE devices SET ip_address = COALESCE(?, ip_address), wifi_status = ?, rssi = ?, pending_logs_count = ?, last_seen = CURRENT_TIMESTAMP WHERE device_id = ?`,
        [ipAddress, wifiStatus, rssi, pendingLogsCount, deviceId]
      );
    } else {
      await execute(
        `INSERT INTO devices (device_id, locker_group, ip_address, wifi_status, rssi, pending_logs_count, last_seen)
         VALUES (?, 'Locker Room Alpha', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [deviceId, ipAddress, wifiStatus, rssi, pendingLogsCount]
      );
    }

    const updatedDevice = await getOne('SELECT * FROM devices WHERE device_id = ?', [deviceId]);
    broadcastEvent('device_update', await query('SELECT * FROM devices'));
    res.json(updatedDevice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Dashboard Analytics Summary
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const totalLockersRow = await getOne('SELECT COUNT(*) as count FROM lockers');
    const availableLockersRow = await getOne('SELECT COUNT(*) as count FROM lockers WHERE status = "AVAILABLE"');
    const occupiedLockersRow = await getOne('SELECT COUNT(*) as count FROM lockers WHERE status = "OCCUPIED"');
    const totalUsersRow = await getOne('SELECT COUNT(*) as count FROM users');

    const todayStr = new Date().toISOString().substring(0, 10);
    const todayAccessRow = await getOne('SELECT COUNT(*) as count FROM access_events WHERE timestamp LIKE ?', [`${todayStr}%`]);
    const totalUnauthorizedRow = await getOne('SELECT COUNT(*) as count FROM access_events WHERE status = "DENIED" OR event_type = "UNAUTHORIZED_ATTEMPT"');
    const unresolvedAlertsRow = await getOne('SELECT COUNT(*) as count FROM alerts WHERE resolved = 0');
    const onlineDevicesRow = await getOne('SELECT COUNT(*) as count FROM devices WHERE wifi_status = "ONLINE"');

    // Access by hour of day (for chart)
    const hourlyData = await query(`
      SELECT strftime('%H', timestamp) as hour, COUNT(*) as count,
             SUM(CASE WHEN status = 'GRANTED' THEN 1 ELSE 0 END) as authorized,
             SUM(CASE WHEN status = 'DENIED' THEN 1 ELSE 0 END) as unauthorized
      FROM access_events
      GROUP BY hour
      ORDER BY hour ASC
    `);

    // Top accessed lockers
    const lockerUsage = await query(`
      SELECT e.locker_id, l.locker_number, COUNT(*) as access_count
      FROM access_events e
      LEFT JOIN lockers l ON e.locker_id = l.locker_id
      GROUP BY e.locker_id
      ORDER BY access_count DESC
    `);

    res.json({
      stats: {
        totalLockers: totalLockersRow ? totalLockersRow.count : 0,
        availableLockers: availableLockersRow ? availableLockersRow.count : 0,
        occupiedLockers: occupiedLockersRow ? occupiedLockersRow.count : 0,
        totalUsers: totalUsersRow ? totalUsersRow.count : 0,
        todayAccessCount: todayAccessRow ? todayAccessRow.count : 0,
        totalUnauthorizedAttempts: totalUnauthorizedRow ? totalUnauthorizedRow.count : 0,
        unresolvedAlerts: unresolvedAlertsRow ? unresolvedAlertsRow.count : 0,
        onlineDevices: onlineDevicesRow ? onlineDevicesRow.count : 0
      },
      hourlyDistribution: hourlyData,
      lockerUsage
    });
  } catch (err) {
    console.error('Error generating analytics summary:', err);
    res.status(500).json({ error: err.message });
  }
});

// Handle port in use gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error(`💡 Tip: Close any running instances of node or specify PORT=5001 in environment.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

// Initialize DB and start HTTP server
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Smart Locker Backend API Server running on port ${PORT}`);
    console.log(`📡 WebSocket server initialized and ready`);
    console.log(`=======================================================`);
  });
}).catch(err => {
  console.error('❌ Database initialization error:', err);
});
