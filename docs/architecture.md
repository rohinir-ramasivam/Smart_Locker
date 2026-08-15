# Smart Locker Room Management System — System Architecture

This document describes the high-level architecture, offline-first execution flows, hardware abstraction layers, and security mechanisms of the Smart Locker Room Management System.

---

## 1. High-Level System Architecture

```
                                +-----------------------------------+
                                |     RC522 RFID Card Reader        |
                                +-----------------+-----------------+
                                                  |
                                                  v
                                +-----------------------------------+
                                |    ESP32 Microcontroller          |
                                |  - Non-blocking millis() loop     |
                                |  - Local Auth Cache               |
                                |  - Offline SD Log Queue           |
                                +--------+-----------------+--------+
                                         |                 |
                   +---------------------+                 +--------------------+
                   | (Wi-Fi Available)                                          | (Wi-Fi Offline)
                   v                                                            v
+------------------------------------+                        +----------------------------------+
|   Node.js / Express REST Server    |                        |   DS3231 RTC + MicroSD Card      |
|   & Socket.io Real-Time Broadcast  |                        |   Local Persistent Queue         |
+------------------+-----------------+                        +-----------------+----------------+
                   |                                                            |
                   v                                                            | (On Reconnect)
+------------------------------------+                                          |
|      SQLite Relational DB          | <----------------------------------------+
+------------------+-----------------+
                   |
                   v
+------------------------------------+
|    React Security Dashboard        |
|  - Real-Time Alerts & Feed         |
|  - Visual Servo Angle Gauges       |
|  - ESP32 Hardware Simulator        |
+------------------------------------+
```

---

## 2. Offline-First Synchronization Workflow

When Wi-Fi connection is active:
1. RFID card scanned by RC522 reader.
2. ESP32 validates UID against local cache (`auth_manager`).
3. Servo motor rotates to 90° (unlocked) for 5 seconds.
4. Access event logged to DS3231 RTC + SD card.
5. Event transmitted directly via HTTP POST to `/api/access-events`.
6. Express API updates database and emits WebSocket `access_event` to connected Security Dashboard.

When Wi-Fi connection drops:
1. RFID card scanned by RC522 reader.
2. ESP32 validates UID locally from `auth_manager` (no internet required!).
3. Locker servo unlocks smoothly.
4. Event saved to SD card file `/access_logs.csv` with `synced = 0`.
5. Background worker periodically checks Wi-Fi connection.
6. When Wi-Fi is restored, ESP32 uploads all pending logs in a batch request to `/api/access-events/sync`.
7. Backend marks logs as synced (`synced_from_device = 1`) and notifies dashboard via WebSocket!

---

## 3. Hardware Abstraction Layer (HAL)

The ESP32 C++ firmware separates hardware driver details from system business logic using abstract interfaces (`IRFIDReader`, `ILockerController`, `IDisplay`, `ILogger`, `INetworkSync`). This design ensures that components like RFID readers or LCD displays can be upgraded or swapped without modifying core authentication or synchronization logic.
