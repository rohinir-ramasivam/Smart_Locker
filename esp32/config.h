/**
 * Smart Locker Room Management System - ESP32 Firmware Configuration
 * 
 * Hardware Pinouts & System Parameters
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ============================================================================
// SYSTEM PARAMETERS
// ============================================================================
#define FIRMWARE_VERSION       "v1.0.0"
#define MAX_LOCKERS            4
#define SERVO_UNLOCK_TIME_MS   5000      // Keep locker unlocked for 5 seconds
#define RFID_DEBOUNCE_MS       2500      // Ignore identical RFID scan for 2.5s
#define SYNC_INTERVAL_MS       10000     // Check offline sync queue every 10s
#define HEARTBEAT_INTERVAL_MS  15000     // Send Wi-Fi heartbeat every 15s

// ============================================================================
// WI-FI & BACKEND SERVER CONFIGURATION
// ============================================================================
#define WIFI_SSID              "SmartLocker_WiFi"
#define WIFI_PASS              "SecurePass2026"
#define BACKEND_SERVER_IP      "192.168.1.100"
#define BACKEND_PORT           5000
#define API_ACCESS_EVENT_URL   "http://192.168.1.100:5000/api/access-events"
#define API_SYNC_URL           "http://192.168.1.100:5000/api/access-events/sync"
#define API_HEARTBEAT_URL      "http://192.168.1.100:5000/api/devices/heartbeat"

// ============================================================================
// HARDWARE PIN DEFINITIONS (ESP32 DevKit V1)
// ============================================================================

// MFRC522 RFID Reader (SPI Bus)
#define PIN_RFID_SS            5
#define PIN_RFID_RST           22
#define PIN_SPI_SCK            18
#define PIN_SPI_MISO           19
#define PIN_SPI_MOSI           23

// SD Card Module (SPI Bus - Shared SCK/MISO/MOSI, Dedicated CS)
#define PIN_SD_CS              4

// I2C Bus (Shared for 16x2 LCD & DS3231 RTC)
#define PIN_I2C_SDA            21
#define PIN_I2C_SCL            22
#define LCD_I2C_ADDR           0x27
#define LCD_COLS               16
#define LCD_ROWS               2

// Servo Motors for 4 Lockers (PWM Pins)
#define PIN_SERVO_L01          12
#define PIN_SERVO_L02          13
#define PIN_SERVO_L03          14
#define PIN_SERVO_L04          27

// Magnetic Door Reed Sensors (Inputs with Internal Pull-ups)
#define PIN_REED_L01           34
#define PIN_REED_L02           35
#define PIN_REED_L03           36
#define PIN_REED_L04           39

// Audio & Visual Alert Peripherals
#define PIN_BUZZER             25
#define PIN_LED_GREEN          26
#define PIN_LED_RED            33

// ============================================================================
// STRUCTS & DATA TYPES
// ============================================================================

struct UserLockerMapping {
  char rfidUid[16];
  char userId[16];
  char userName[32];
  char lockerId[8];
};

struct AccessLogEntry {
  char eventId[32];
  char timestamp[24];
  char rfidUid[16];
  char userId[16];
  char lockerId[8];
  char status[12];     // "GRANTED" or "DENIED"
  char eventType[24];  // "UNLOCKED", "LOCKED", "UNAUTHORIZED_ATTEMPT"
  int  synced;         // 1 = Synced, 0 = Pending
};

#endif // CONFIG_H
