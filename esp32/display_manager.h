#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include "hardware_abstraction.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

class DisplayManager : public IDisplay {
private:
    LiquidCrystal_I2C lcd;
    unsigned long messageResetTime;
    bool isCustomMessage;

public:
    DisplayManager();
    void begin() override;
    void displayIdle() override;
    void displayAccessGranted(const char* lockerId, const char* userName) override;
    void displayAccessDenied(const char* reason) override;
    void displaySyncStatus(int pendingCount) override;
    void printMessage(const char* line1, const char* line2) override;
    void update();
};

#endif // DISPLAY_MANAGER_H
