/**
 * Hardware Abstraction Layer (HAL) Interfaces for Smart Locker Firmware
 */

#ifndef HARDWARE_ABSTRACTION_H
#define HARDWARE_ABSTRACTION_H

#include "config.h"

// RFID Reader Interface
class IRFIDReader {
public:
    virtual void begin() = 0;
    virtual bool isCardPresent() = 0;
    virtual String readCardUID() = 0;
    virtual void haltCard() = 0;
};

// Locker Motor & Sensor Controller Interface
class ILockerController {
public:
    virtual void begin() = 0;
    virtual bool unlockLocker(const char* lockerId) = 0;
    virtual bool lockLocker(const char* lockerId) = 0;
    virtual bool isDoorOpen(const char* lockerId) = 0;
    virtual void updateTimers() = 0;
};

// Display Interface
class IDisplay {
public:
    virtual void begin() = 0;
    virtual void displayIdle() = 0;
    virtual void displayAccessGranted(const char* lockerId, const char* userName) = 0;
    virtual void displayAccessDenied(const char* reason) = 0;
    virtual void displaySyncStatus(int pendingCount) = 0;
    virtual void printMessage(const char* line1, const char* line2) = 0;
};

// Logger (RTC + SD Card) Interface
class ILogger {
public:
    virtual void begin() = 0;
    virtual String getCurrentTimestamp() = 0;
    virtual bool logAccessEvent(const AccessLogEntry& entry) = 0;
    virtual int getPendingLogs(AccessLogEntry* entriesBuffer, int maxBuffer) = 0;
    virtual bool markLogsSynced(const char* eventId) = 0;
};

// Network & Cloud Synchronization Interface
class INetworkSync {
public:
    virtual void begin() = 0;
    virtual bool isConnected() = 0;
    virtual bool sendEvent(const AccessLogEntry& entry) = 0;
    virtual bool syncPendingLogs(ILogger* logger) = 0;
    virtual void sendHeartbeat(int pendingCount) = 0;
};

#endif // HARDWARE_ABSTRACTION_H
