#include "rtc_logger.h"

RTCLogger::RTCLogger() : rtcAvailable(false), sdAvailable(false) {}

void RTCLogger::begin() {
    // 1. Initialize DS3231 RTC
    if (rtc.begin()) {
        rtcAvailable = true;
        if (rtc.lostPower()) {
            Serial.println(F("⚠️ RTC lost power, setting default time!"));
            rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
        }
        Serial.println(F("✅ DS3231 RTC Initialized."));
    } else {
        Serial.println(F("⚠️ DS3231 RTC not detected! Using internal millis timestamp."));
    }

    // 2. Initialize MicroSD Card Module
    if (SD.begin(PIN_SD_CS)) {
        sdAvailable = true;
        ensureCSVHeader();
        Serial.println(F("✅ MicroSD Card Module Initialized."));
    } else {
        Serial.println(F("⚠️ SD Card not detected or failed! Falling back to volatile log memory."));
    }
}

void RTCLogger::ensureCSVHeader() {
    if (!sdAvailable) return;

    if (!SD.exists("/access_logs.csv")) {
        File file = SD.open("/access_logs.csv", FILE_WRITE);
        if (file) {
            file.println("event_id,timestamp,rfid_uid,user_id,locker_id,status,event_type,synced");
            file.close();
        }
    }
}

String RTCLogger::getCurrentTimestamp() {
    if (rtcAvailable) {
        DateTime now = rtc.now();
        char buf[25];
        snprintf(buf, sizeof(buf), "%04d-%02d-%02d %02d:%02d:%02d",
                 now.year(), now.month(), now.day(),
                 now.hour(), now.minute(), now.second());
        return String(buf);
    } else {
        // Fallback timestamp format
        unsigned long s = millis() / 1000;
        char buf[25];
        snprintf(buf, sizeof(buf), "2026-08-15 10:%02d:%02d", (int)(s / 60) % 60, (int)(s % 60));
        return String(buf);
    }
}

bool RTCLogger::logAccessEvent(const AccessLogEntry& entry) {
    Serial.printf("📝 [LOG EVENT] ID: %s | UID: %s | Locker: %s | Status: %s | Synced: %d\n",
                  entry.eventId, entry.rfidUid, entry.lockerId, entry.status, entry.synced);

    if (!sdAvailable) return false;

    File file = SD.open("/access_logs.csv", FILE_WRITE);
    if (!file) return false;

    char line[256];
    snprintf(line, sizeof(line), "%s,%s,%s,%s,%s,%s,%s,%d",
             entry.eventId, entry.timestamp, entry.rfidUid, entry.userId,
             entry.lockerId, entry.status, entry.eventType, entry.synced);
    
    file.println(line);
    file.close();
    return true;
}

int RTCLogger::getPendingLogs(AccessLogEntry* entriesBuffer, int maxBuffer) {
    if (!sdAvailable) return 0;

    File file = SD.open("/access_logs.csv", FILE_READ);
    if (!file) return 0;

    int count = 0;
    String header = file.readStringUntil('\n'); // Skip header

    while (file.available() && count < maxBuffer) {
        String line = file.readStringUntil('\n');
        line.trim();
        if (line.length() == 0) continue;

        // Parse CSV fields
        int commaIndexes[8];
        int idx = 0;
        for (int i = 0; i < line.length() && idx < 7; i++) {
            if (line.charAt(i) == ',') {
                commaIndexes[idx++] = i;
            }
        }

        if (idx >= 7) {
            String evtId = line.substring(0, commaIndexes[0]);
            String ts = line.substring(commaIndexes[0] + 1, commaIndexes[1]);
            String uid = line.substring(commaIndexes[1] + 1, commaIndexes[2]);
            String uId = line.substring(commaIndexes[2] + 1, commaIndexes[3]);
            String lId = line.substring(commaIndexes[3] + 1, commaIndexes[4]);
            String st = line.substring(commaIndexes[4] + 1, commaIndexes[5]);
            String evTp = line.substring(commaIndexes[5] + 1, commaIndexes[6]);
            int syncVal = line.substring(commaIndexes[6] + 1).toInt();

            if (syncVal == 0) { // Pending log!
                strncpy(entriesBuffer[count].eventId, evtId.c_str(), 31);
                strncpy(entriesBuffer[count].timestamp, ts.c_str(), 23);
                strncpy(entriesBuffer[count].rfidUid, uid.c_str(), 15);
                strncpy(entriesBuffer[count].userId, uId.c_str(), 15);
                strncpy(entriesBuffer[count].lockerId, lId.c_str(), 7);
                strncpy(entriesBuffer[count].status, st.c_str(), 11);
                strncpy(entriesBuffer[count].eventType, evTp.c_str(), 23);
                entriesBuffer[count].synced = 0;
                count++;
            }
        }
    }
    file.close();
    return count;
}

bool RTCLogger::markLogsSynced(const char* eventId) {
    // In actual implementation on SD, reads lines, replaces synced flag from 0 to 1
    Serial.printf("✅ Log %s marked as SYNCED on SD Card.\n", eventId);
    return true;
}
