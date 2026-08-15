# Smart Locker Room Management System — API & WebSocket Reference

This document provides complete documentation for the REST API endpoints and WebSocket real-time event streams provided by the Node.js/Express backend server.

---

## Base Configuration

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **Real-time Protocol**: Socket.io (`http://localhost:5000`)

---

## 1. Access Events & Offline Sync APIs

### `POST /api/access-events`
Records a single access event transmitted by an ESP32 or simulated device.

**Request Payload:**
```json
{
  "eventId": "EVT-1005",
  "rfidUid": "A1B2C3D4",
  "userId": "STU001",
  "lockerId": "L01",
  "timestamp": "2026-08-15 10:30:21",
  "status": "GRANTED",
  "eventType": "UNLOCKED",
  "syncedFromDevice": 0
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "eventId": "EVT-1005",
  "alertCreated": false,
  "event": {
    "event_id": "EVT-1005",
    "timestamp": "2026-08-15 10:30:21",
    "rfid_uid": "A1B2C3D4",
    "user_id": "STU001",
    "locker_id": "L01",
    "status": "GRANTED",
    "event_type": "UNLOCKED",
    "user_name": "Alex Rivera",
    "locker_number": "Locker 01"
  }
}
```

---

### `POST /api/access-events/sync`
Batch synchronizes offline pending access events stored locally in the ESP32 MicroSD card.

**Request Payload:**
```json
{
  "deviceId": "ESP32_NODE_01",
  "events": [
    {
      "eventId": "EVT-OFFLINE-01",
      "rfidUid": "E5F6G7H8",
      "userId": "STU002",
      "lockerId": "L02",
      "timestamp": "2026-08-15 11:15:05",
      "status": "GRANTED",
      "eventType": "UNLOCKED"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "deviceId": "ESP32_NODE_01",
  "syncedCount": 1,
  "duplicateCount": 0,
  "message": "Successfully synchronized 1 logs (0 duplicates skipped)"
}
```

---

### `GET /api/access-events`
Retrieves timestamped access events history with optional search, filtering, and pagination.

**Query Parameters:**
- `search`: Filter by user name, RFID UID, locker ID, or event ID
- `status`: `GRANTED` or `DENIED`
- `lockerId`: `L01`, `L02`, etc.
- `limit`: Default `100`
- `page`: Default `1`

---

## 2. Locker Management APIs

### `GET /api/lockers`
Returns state of all registered physical lockers.

### `PUT /api/lockers/:id`
Updates assigned user or status of a locker.

### `POST /api/lockers/:id/control`
Executes an emergency remote lock/unlock command from the Security Dashboard.

**Request Payload:**
```json
{ "command": "UNLOCK" }
```

---

## 3. User & RFID Assignment APIs

### `GET /api/users`
Retrieves registered users list.

### `POST /api/users`
Registers a new authorized user.

### `POST /api/rfid/assign`
Links an RFID card UID to a user profile and locker.

**Request Payload:**
```json
{
  "rfidUid": "A1B2C3D4",
  "userId": "STU001",
  "lockerId": "L01"
}
```

---

## 4. Real-time WebSocket Events (Socket.io)

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `access_event` | Server -> Client | `FullEventObject` | Emitted when a new RFID card scan occurs |
| `security_alert` | Server -> Client | `AlertObject` | Emitted on unauthorized scan attempts |
| `locker_update` | Server -> Client | `LockersArray` | Emitted when servo state or assignment changes |
| `logs_synced` | Server -> Client | `{ deviceId, syncedCount }` | Emitted when ESP32 completes offline sync |
