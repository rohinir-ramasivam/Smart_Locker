#include "display_manager.h"

DisplayManager::DisplayManager()
    : lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS), messageResetTime(0), isCustomMessage(false) {}

void DisplayManager::begin() {
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    lcd.init();
    lcd.backlight();
    displayIdle();
    Serial.println(F("✅ LiquidCrystal_I2C Display Initialized."));
}

void DisplayManager::displayIdle() {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("SMART LOCKER V1.0");
    lcd.setCursor(0, 1);
    lcd.print("Scan RFID Tag...");
    isCustomMessage = false;
}

void DisplayManager::displayAccessGranted(const char* lockerId, const char* userName) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ACCESS GRANTED!");
    lcd.setCursor(0, 1);
    char buf[17];
    snprintf(buf, sizeof(buf), "%s: %s", lockerId, userName);
    lcd.print(buf);

    isCustomMessage = true;
    messageResetTime = millis() + 4000;
}

void DisplayManager::displayAccessDenied(const char* reason) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ACCESS DENIED!");
    lcd.setCursor(0, 1);
    lcd.print(reason ? reason : "Unauthorized Tag");

    isCustomMessage = true;
    messageResetTime = millis() + 3500;
}

void DisplayManager::displaySyncStatus(int pendingCount) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("SYNCING OFFLINE");
    lcd.setCursor(0, 1);
    char buf[17];
    snprintf(buf, sizeof(buf), "Logs queue: %d", pendingCount);
    lcd.print(buf);

    isCustomMessage = true;
    messageResetTime = millis() + 3000;
}

void DisplayManager::printMessage(const char* line1, const char* line2) {
    lcd.clear();
    lcd.setCursor(0, 0);
    if (line1) lcd.print(line1);
    lcd.setCursor(0, 1);
    if (line2) lcd.print(line2);

    isCustomMessage = true;
    messageResetTime = millis() + 3000;
}

void DisplayManager::update() {
    if (isCustomMessage && millis() >= messageResetTime) {
        displayIdle();
    }
}
