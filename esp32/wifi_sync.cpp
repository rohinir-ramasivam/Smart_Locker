#include "wifi_sync.h"

WiFiSync::WiFiSync() : connected(false), lastHeartbeat(0) {}

void WiFiSync::begin() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.printf("🌐 Connecting to Wi-Fi SSID '%s'...\n", WIFI_SSID);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - start) < 5000) {
        delay(250);
        Serial.print(".");
    }

    if (WiFi.status() == WL_CONNECTED) {
        connected = true;
        Serial.println("\n✅ Wi-Fi Connected! IP: " + WiFi.localIP().toString());
    } else {
        connected = false;
        Serial.println("\n⚠️ Wi-Fi Unavailable! Operating in OFFLINE-FIRST mode.");
    }
}

bool WiFiSync::isConnected() {
    return (WiFi.status() == WL_CONNECTED);
}

void WiFiSync::checkConnection() {
    if (WiFi.status() == WL_CONNECTED) {
        if (!connected) {
            connected = true;
            Serial.println("🌐 Wi-Fi Re-established!");
        }
    } else {
        if (connected) {
            connected = false;
            Serial.println("⚠️ Wi-Fi Lost! Switched to Offline mode.");
        }
    }
}

bool WiFiSync::sendEvent(const AccessLogEntry& entry) {
    if (!isConnected()) return false;

    HTTPClient http;
    http.begin(API_ACCESS_EVENT_URL);
    http.addHeader("Content-Type", "application/json");

    char jsonPayload[384];
    snprintf(jsonPayload, sizeof(jsonPayload),
             "{\"eventId\":\"%s\",\"rfidUid\":\"%s\",\"userId\":\"%s\",\"lockerId\":\"%s\",\"timestamp\":\"%s\",\"status\":\"%s\",\"eventType\":\"%s\",\"syncedFromDevice\":0}",
             entry.eventId, entry.rfidUid, entry.userId, entry.lockerId, entry.timestamp, entry.status, entry.eventType);

    int httpCode = http.POST(jsonPayload);
    http.end();

    if (httpCode == 200 || httpCode == 201) {
        Serial.println("📡 Event successfully sent to backend API.");
        return true;
    } else {
        Serial.printf("❌ Failed to send event, HTTP code: %d\n", httpCode);
        return false;
    }
}

bool WiFiSync::syncPendingLogs(ILogger* logger) {
    if (!isConnected() || !logger) return false;

    AccessLogEntry pendingQueue[10];
    int count = logger->getPendingLogs(pendingQueue, 10);
    if (count == 0) return true;

    Serial.printf("🔄 Synchronizing %d pending offline logs to Backend API...\n", count);

    HTTPClient http;
    http.begin(API_SYNC_URL);
    http.addHeader("Content-Type", "application/json");

    String jsonArray = "{\"deviceId\":\"ESP32_NODE_01\",\"events\":[";
    for (int i = 0; i < count; i++) {
        if (i > 0) jsonArray += ",";
        char item[256];
        snprintf(item, sizeof(item),
                 "{\"eventId\":\"%s\",\"rfidUid\":\"%s\",\"userId\":\"%s\",\"lockerId\":\"%s\",\"timestamp\":\"%s\",\"status\":\"%s\",\"eventType\":\"%s\"}",
                 pendingQueue[i].eventId, pendingQueue[i].rfidUid, pendingQueue[i].userId,
                 pendingQueue[i].lockerId, pendingQueue[i].timestamp, pendingQueue[i].status, pendingQueue[i].eventType);
        jsonArray += item;
    }
    jsonArray += "]}";

    int httpCode = http.POST(jsonArray);
    http.end();

    if (httpCode == 200) {
        for (int i = 0; i < count; i++) {
            logger->markLogsSynced(pendingQueue[i].eventId);
        }
        Serial.printf("✅ Successfully synced %d logs.\n", count);
        return true;
    }

    return false;
}

void WiFiSync::sendHeartbeat(int pendingCount) {
    if (!isConnected()) return;

    unsigned long now = millis();
    if (now - lastHeartbeat < HEARTBEAT_INTERVAL_MS) return;

    lastHeartbeat = now;

    HTTPClient http;
    http.begin(API_HEARTBEAT_URL);
    http.addHeader("Content-Type", "application/json");

    char json[128];
    snprintf(json, sizeof(json),
             "{\"deviceId\":\"ESP32_NODE_01\",\"ipAddress\":\"%s\",\"wifiStatus\":\"ONLINE\",\"rssi\":%d,\"pendingLogsCount\":%d}",
             WiFi.localIP().toString().c_str(), WiFi.RSSI(), pendingCount);

    http.POST(json);
    http.end();
}
