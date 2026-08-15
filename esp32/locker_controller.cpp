#include "locker_controller.h"

LockerController::LockerController() {
    servoPins[0] = PIN_SERVO_L01;
    servoPins[1] = PIN_SERVO_L02;
    servoPins[2] = PIN_SERVO_L03;
    servoPins[3] = PIN_SERVO_L04;

    reedPins[0] = PIN_REED_L01;
    reedPins[1] = PIN_REED_L02;
    reedPins[2] = PIN_REED_L03;
    reedPins[3] = PIN_REED_L04;

    for (int i = 0; i < MAX_LOCKERS; i++) {
        unlockTimers[i] = 0;
        isUnlockedState[i] = false;
    }
}

void LockerController::begin() {
    pinMode(PIN_BUZZER, OUTPUT);
    pinMode(PIN_LED_GREEN, OUTPUT);
    pinMode(PIN_LED_RED, OUTPUT);

    digitalWrite(PIN_BUZZER, LOW);
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, LOW);

    for (int i = 0; i < MAX_LOCKERS; i++) {
        servos[i].attach(servoPins[i]);
        servos[i].write(0); // 0 degrees = LOCKED
        pinMode(reedPins[i], INPUT_PULLUP);
    }

    Serial.println(F("✅ LockerController Initialized (Servos attached & locked)."));
}

int LockerController::getLockerIndex(const char* lockerId) {
    if (!lockerId) return -1;
    if (strcasecmp(lockerId, "L01") == 0 || strcmp(lockerId, "1") == 0) return 0;
    if (strcasecmp(lockerId, "L02") == 0 || strcmp(lockerId, "2") == 0) return 1;
    if (strcasecmp(lockerId, "L03") == 0 || strcmp(lockerId, "3") == 0) return 2;
    if (strcasecmp(lockerId, "L04") == 0 || strcmp(lockerId, "4") == 0) return 3;
    return -1;
}

bool LockerController::unlockLocker(const char* lockerId) {
    int idx = getLockerIndex(lockerId);
    if (idx < 0) {
        // If ALL (Admin override), unlock locker 0
        idx = 0;
    }

    servos[idx].write(90); // 90 degrees = UNLOCKED
    isUnlockedState[idx] = true;
    unlockTimers[idx] = millis();

    setStatusLeds(true, false);
    triggerBuzzer(2000, 150); // Short happy beep

    Serial.printf("🔓 Locker %s UNLOCKED (Servo set to 90 deg)\n", lockerId);
    return true;
}

bool LockerController::lockLocker(const char* lockerId) {
    int idx = getLockerIndex(lockerId);
    if (idx < 0) idx = 0;

    servos[idx].write(0); // 0 degrees = LOCKED
    isUnlockedState[idx] = false;
    unlockTimers[idx] = 0;

    setStatusLeds(false, false);

    Serial.printf("🔒 Locker %s LOCKED (Servo set to 0 deg)\n", lockerId);
    return true;
}

bool LockerController::isDoorOpen(const char* lockerId) {
    int idx = getLockerIndex(lockerId);
    if (idx < 0) return false;
    // LOW = Door Closed, HIGH = Door Open (with pull-up resistor)
    return (digitalRead(reedPins[idx]) == HIGH);
}

void LockerController::updateTimers() {
    unsigned long now = millis();
    for (int i = 0; i < MAX_LOCKERS; i++) {
        if (isUnlockedState[i] && (now - unlockTimers[i] >= SERVO_UNLOCK_TIME_MS)) {
            char lkrId[8];
            snprintf(lkrId, sizeof(lkrId), "L0%d", i + 1);
            lockLocker(lkrId);
        }
    }
}

void LockerController::triggerBuzzer(int frequency, int durationMs) {
    tone(PIN_BUZZER, frequency, durationMs);
}

void LockerController::setStatusLeds(bool green, bool red) {
    digitalWrite(PIN_LED_GREEN, green ? HIGH : LOW);
    digitalWrite(PIN_LED_RED, red ? HIGH : LOW);
}
