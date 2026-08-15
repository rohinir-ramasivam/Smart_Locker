#ifndef RTC_LOGGER_H
#define RTC_LOGGER_H

#include "hardware_abstraction.h"
#include <RTClib.h>
#include <SD.h>
#include <SPI.h>

class RTCLogger : public ILogger {
private:
    RTC_DS3231 rtc;
    bool rtcAvailable;
    bool sdAvailable;

    void ensureCSVHeader();

public:
    RTCLogger();
    void begin() override;
    String getCurrentTimestamp() override;
    bool logAccessEvent(const AccessLogEntry& entry) override;
    int getPendingLogs(AccessLogEntry* entriesBuffer, int maxBuffer) override;
    bool markLogsSynced(const char* eventId) override;
};

#endif // RTC_LOGGER_H
