# Smart Locker Room Management System — Hardware + Software Integration

An end-to-end, IoT-based **Smart Locker Room Management System** featuring modular C++ ESP32 firmware, offline-first SD log queuing & sync engine, a Node.js/Express REST & WebSocket real-time API, a SQLite database, and a React/Vite security dashboard with a built-in virtual ESP32 hardware simulator.

---

## 🌟 Key Features

1. **Modular ESP32 Firmware (`/esp32`)**:
   - Hardware Abstraction Layer (HAL) architecture.
   - Non-blocking `millis()` execution loop.
   - RC522 RFID reader integration.
   - PWM Servo motor locker actuation (0° locked / 90° unlocked).
   - I2C 16x2 LCD display status screens.
   - Piezo active buzzer alarm triggers.
   - DS3231 RTC module timestamping.
   - MicroSD card local logging (`/access_logs.csv`).
   - Offline-first queuing & automatic Wi-Fi batch synchronization.

2. **Node.js Express & WebSocket Backend (`/backend`)**:
   - REST API endpoints for events, sync, lockers, users, RFID assignment, alerts, devices, and analytics.
   - Real-time Socket.io WebSocket broadcast server.
   - SQLite relational database (`schema.sql` and seed data).

3. **React Security Dashboard & Hardware Simulator (`/frontend`)**:
   - Dark glassmorphism UI styling with live status indicators.
   - **10 Core Views**: Overview Dashboard, Locker Control (Servo angles), User Directory, RFID Assignment, Access History (Search & CSV Export), Security Alerts (Breach notifications), Analytics, IoT Device Monitor, Settings, and **Virtual ESP32 Hardware Simulator**.
   - Virtual hardware simulator allows testing card scans, locker unlocks, alarms, and offline queueing without requiring physical hardware.

---

## 📁 Directory Structure

```
MP-5/
├── esp32/                        # ESP32 C++ Firmware Source Files
│   ├── esp32_smart_locker.ino    # Main Arduino sketch entry point
│   ├── config.h                  # Pin maps, Wi-Fi & backend URIs
│   ├── hardware_abstraction.h    # HAL interfaces
│   ├── rfid_handler.h/.cpp       # MFRC522 driver
│   ├── auth_manager.h/.cpp       # Offline local auth cache
│   ├── locker_controller.h/.cpp  # Servo PWM & Alarm controller
│   ├── display_manager.h/.cpp   # LiquidCrystal_I2C 16x2 wrapper
│   ├── rtc_logger.h/.cpp        # DS3231 RTC & MicroSD Logger
│   └── wifi_sync.h/.cpp         # Wi-Fi auto-sync engine
├── backend/                      # Node.js API & WebSocket Server
│   ├── server.js                 # Express + Socket.io Server
│   ├── db.js                     # SQLite Connection Manager
│   ├── seed.js                   # DB Reseed Script
│   └── package.json              # Backend dependencies
├── frontend/                     # React Security Dashboard
│   ├── src/
│   │   ├── components/           # 10 Dashboard Tabs & Simulator
│   │   ├── App.jsx               # Main React Application
│   │   ├── index.css             # Glassmorphic Dark Styling
│   │   └── main.jsx
│   └── package.json
├── database/                     # Database Schema & Seed Data
│   ├── schema.sql                # Relational SQLite tables
│   └── seeds.sql                 # Sample users, lockers, and logs
├── docs/                         # Technical Specifications
│   ├── hardware_wiring.md        # Pin mapping & circuit schematics
│   ├── api_documentation.md      # REST & WebSocket API reference
│   └── architecture.md           # System design & offline sequence
└── START.ps1                     # One-click Powershell Launcher
```

---

## 🚀 Quick Start Instructions

### Option 1: One-Click Launch Script (PowerShell)

Run the following command from the project root:
```powershell
.\START.ps1
```

---

### Option 2: Manual Step-by-Step Setup

#### Step 1: Initialize Backend & Database
```bash
cd backend
npm install
npm run seed     # Initializes database and populates sample data
npm run dev      # Starts Express & WebSocket server on http://localhost:5000
```

#### Step 2: Start Frontend Security Dashboard
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

Open your browser at `http://localhost:5173` to view the Security Dashboard and test the **Virtual ESP32 Hardware Simulator**!

---

## 🧪 Demonstration Steps

1. Open the Security Dashboard at `http://localhost:5173`.
2. Navigate to the **HW Simulator** tab.
3. Tap **Alex Rivera (A1B2C3D4)**:
   - LCD updates to `"ACCESS GRANTED! / L01: Alex Rivera"`.
   - Servo rotates to **90° (UNLOCKED)**.
   - Access event streams live to **Overview** and **Access History** tabs.
4. Tap **Rogue Card (X9Y8Z7W6)**:
   - Active Buzzer sounds.
   - Red LED flashes and LCD renders `"ACCESS DENIED!"`.
   - Security Alert banner flashes on the Security Dashboard.
5. Click **Wi-Fi Network: ONLINE** to turn Wi-Fi **OFFLINE**:
   - Tap an RFID card.
   - Event gets recorded locally on the Virtual MicroSD Card queue with `synced = 0`.
6. Click **Wi-Fi Network: DISCONNECTED** to turn Wi-Fi **ONLINE**:
   - ESP32 automatically syncs SD Queue to Backend REST API.
   - Log updates to `SYNCED` (`synced_from_device = 1`).
