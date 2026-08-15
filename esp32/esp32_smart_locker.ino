/**
 * Smart Locker Room Management System — Firmware Main Entry Point
 * 
 * Hardware: ESP32 DevKit, MFRC522 RFID, DS3231 RTC, MicroSD Module, 
 *           LiquidCrystal_I2C 16x2, Servos, Buzzer, Reed Sensors
 * 
 * Features:
 * - Non-blocking state machine loop (millis-based)
 * - Offline-first architecture (Logs events to SD card if Wi-Fi drops)
 * - Automatic background synchronization on Wi-Fi reconnection
 * - Modular Hardware Abstraction Layer (HAL)
 */

#include "config.h"
#include "hardware_abstraction.h"
#include "rfid_handler.h"
#include "auth_manager.h"
#include "locker_controller.h"
#include "display_manager.h"
#include "rtc_logger.h"
#include "wifi_sync.h"

// Hardware Module Instances
RFIDHandler       rfidReader;
AuthManager       authManager;
LockerController  lockerControl;
DisplayManager    display;
RTCLogger         logger;
WiFiSync          networkSync;

unsigned long lastSyncCheck = 0;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println(F("\n======================================================="));
    Serial.println(F("🔒 Smart Locker Room Management System — Firmware Startup"));
    Serial.println(F("======================================================="));

    // 1. Initialize Hardware Components via HAL
    display.begin();
    display.printMessage("SYSTEM INITIALIZING", "Checking HW...");

    rfidReader.begin();
    authManager.begin();
    lockerControl.begin();
    logger.begin();
    networkSync.begin();

    display.displayIdle();
    Serial.println(F("🚀 System ready for RFID card scans!\n"));
}

void loop() {
    // 1. Non-blocking state updates & timers
    lockerControl.updateTimers();
    display.update();
    networkSync.checkConnection();

    // 2. Check for RFID Card Scan
    if (rfidReader.isCardPresent()) {
        String uid = rfidReader.readCardUID();
        if (uid.length() > 0) {
            Serial.println(F("-------------------------------------------------------"));
            Serial.printf("💳 RFID Card Scanned: %s\n", uid.c_str());

            char userId[16];
            char userName[32];
            char lockerId[8];

            // 3. Local Offline Authentication Check
            bool isAuthorized = authManager.authenticate(uid.c_str(), userId, userName, lockerId);

            String timestamp = logger.getCurrentTimestamp();
            char eventId[32];
            snprintf(eventId, sizeof(eventId), "EVT-%lu", millis());

            AccessLogEntry entry;
            strncpy(entry.eventId, eventId, sizeof(entry.eventId) - 1);
            strncpy(entry.timestamp, timestamp.c_str(), sizeof(entry.timestamp) - 1);
            strncpy(entry.rfidUid, uid.c_str(), sizeof(entry.rfidUid) - 1);
            strncpy(entry.userId, userId, sizeof(entry.userId) - 1);
            strncpy(entry.lockerId, lockerId, sizeof(entry.lockerId) - 1);

            if (isAuthorized) {
                // AUTHORIZED ACCESS
                strncpy(entry.status, "GRANTED", sizeof(entry.status) - 1);
                strncpy(entry.eventType, "UNLOCKED", sizeof(entry.eventType) - 1);

                // Actuate Locker Servo Motor
                lockerControl.unlockLocker(lockerId);
                display.displayAccessGranted(lockerId, userName);
                Serial.printf("✅ ACCESS GRANTED -> User: %s | Locker: %s\n", userName, lockerId);
            } else {
                // UNAUTHORIZED ACCESS
                strncpy(entry.status, "DENIED", sizeof(entry.status) - 1);
                strncpy(entry.eventType, "UNAUTHORIZED_ATTEMPT", sizeof(entry.eventType) - 1);

                // Trigger Alarm Buzzer & Red LED
                lockerControl.setStatusLeds(false, true);
                lockerControl.triggerBuzzer(4000, 800); // Loud warning beep
                display.displayAccessDenied("Unknown Card");
                Serial.printf("❌ ACCESS DENIED -> UID: %s\n", uid.c_str());
            }

            // 4. Send directly to cloud if Wi-Fi is connected, else queue on SD card
            if (networkSync.isConnected() && networkSync.sendEvent(entry)) {
                entry.synced = 1;
            } else {
                entry.synced = 0;
                Serial.println(F("💾 Saved event to SD Card queue for background sync."));
            }

            // 5. Always record to local RTC/SD Card logger
            logger.logAccessEvent(entry);

            rfidReader.haltCard();
        }
    }

    // 3. Periodic Background Sync (Check for pending offline logs every 10 seconds)
    unsigned long now = millis();
    if (now - lastSyncCheck >= SYNC_INTERVAL_MS) {
        lastSyncCheck = now;
        if (networkSync.isConnected()) {
            networkSync.syncPendingLogs(&logger);
            networkSync.sendHeartbeat(0);
        }
    }

    delay(10); // Short yield for ESP32 watchdog
}
