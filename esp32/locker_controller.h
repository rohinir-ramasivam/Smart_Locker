#ifndef LOCKER_CONTROLLER_H
#define LOCKER_CONTROLLER_H

#include "hardware_abstraction.h"
#include <ESP32Servo.h>

class LockerController : public ILockerController {
private:
    Servo servos[MAX_LOCKERS];
    int servoPins[MAX_LOCKERS];
    int reedPins[MAX_LOCKERS];
    unsigned long unlockTimers[MAX_LOCKERS];
    bool isUnlockedState[MAX_LOCKERS];

    int getLockerIndex(const char* lockerId);

public:
    LockerController();
    void begin() override;
    bool unlockLocker(const char* lockerId) override;
    bool lockLocker(const char* lockerId) override;
    bool isDoorOpen(const char* lockerId) override;
    void updateTimers() override;
    void triggerBuzzer(int frequency, int durationMs);
    void setStatusLeds(bool green, bool red);
};

#endif // LOCKER_CONTROLLER_H
