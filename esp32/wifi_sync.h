#ifndef WIFI_SYNC_H
#define WIFI_SYNC_H

#include "hardware_abstraction.h"
#include <WiFi.h>
#include <HTTPClient.h>

class WiFiSync : public INetworkSync {
private:
    bool connected;
    unsigned long lastHeartbeat;

public:
    WiFiSync();
    void begin() override;
    bool isConnected() override;
    bool sendEvent(const AccessLogEntry& entry) override;
    bool syncPendingLogs(ILogger* logger) override;
    void sendHeartbeat(int pendingCount) override;
    void checkConnection();
};

#endif // WIFI_SYNC_H
