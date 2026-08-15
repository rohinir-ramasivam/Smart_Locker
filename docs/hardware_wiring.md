# Smart Locker Room Management System — Hardware Connection & Wiring Guide

This document specifies the exact hardware pinout mapping, component power requirements, schematic connections, and circuit design for assembling the **ESP32 Smart Locker Room Controller**.

---

## 1. Components Required

| Component | Quantity | Specification / Description |
|---|---|---|
| **ESP32 DevKit V1** | 1 | Microcontroller (32-bit Dual Core, 2.4GHz Wi-Fi + Bluetooth) |
| **RC522 RFID Reader** | 1 | SPI Interface, 13.56 MHz High-Frequency RFID Module |
| **RFID Cards / Key Fobs** | 4+ | MIFARE 1K Tags (13.56MHz) |
| **SG90 / MG90S Servo Motors** | 4 | PWM Control (0° Locked, 90° Unlocked) |
| **LiquidCrystal I2C 16x2 LCD** | 1 | HD44780 with PCF8574 I2C Backpack (Address 0x27) |
| **DS3231 RTC Module** | 1 | Real-Time Clock with CR2032 Battery (I2C Address 0x68) |
| **MicroSD Card Module** | 1 | SPI Interface (File System FAT32 for local logging) |
| **Active Buzzer** | 1 | 5V Active Piezo Buzzer for security alarms |
| **Magnetic Reed Door Sensors**| 4 | NO/NC Door Switch Sensors for open detection |
| **Status LEDs** | 2 | 1x Green (Access Granted), 1x Red (Access Denied) |
| **Resistors** | 2 | 220Ω Current Limiting Resistors for LEDs |
| **Regulated Power Supply** | 1 | 5V / 3A DC Adapter (Common Ground with ESP32) |

---

## 2. ESP32 Master Pinout Table

### A. MFRC522 RFID Reader (SPI Bus)
> ⚠️ **CRITICAL**: The MFRC522 operates strictly at **3.3V**. Connecting to 5V will permanently damage the module.

| MFRC522 Pin | ESP32 Pin | Wire Color | Voltage |
|---|---|---|---|
| **VCC** | **3.3V** | Red | 3.3V DC |
| **RST** | **GPIO 22** | Orange | 3.3V Signal |
| **GND** | **GND** | Black | Ground |
| **MISO** | **GPIO 19** | Blue | 3.3V Signal |
| **MOSI** | **GPIO 23** | Green | 3.3V Signal |
| **SCK** | **GPIO 18** | Yellow | 3.3V Signal |
| **SDA / SS** | **GPIO 5** | White | 3.3V Signal |

---

### B. MicroSD Card Module (Shared SPI Bus)

| MicroSD Module Pin | ESP32 Pin | Voltage |
|---|---|---|
| **VCC** | **5V / 3.3V** | 5V DC |
| **GND** | **GND** | Ground |
| **SCK** | **GPIO 18** (Shared) | 3.3V Signal |
| **MISO** | **GPIO 19** (Shared) | 3.3V Signal |
| **MOSI** | **GPIO 23** (Shared) | 3.3V Signal |
| **CS** | **GPIO 4** (Dedicated Chip Select) | 3.3V Signal |

---

### C. I2C Bus (Shared: 16x2 LCD + DS3231 RTC)

| Module | Pin | ESP32 Pin | Power |
|---|---|---|---|
| **16x2 LCD I2C** | SDA | **GPIO 21** | 5V DC |
| | SCL | **GPIO 22** | 5V DC |
| **DS3231 RTC** | SDA | **GPIO 21** (Shared) | 3.3V / 5V DC |
| | SCL | **GPIO 22** (Shared) | 3.3V / 5V DC |

---

### D. Locker Servo Motors (PWM Outputs)

| Locker ID | Servo Signal Pin | Power Supply | Angle States |
|---|---|---|---|
| **Locker 01 (L01)** | **GPIO 12** | External 5V Regulated | 0° (Locked) / 90° (Unlocked) |
| **Locker 02 (L02)** | **GPIO 13** | External 5V Regulated | 0° (Locked) / 90° (Unlocked) |
| **Locker 03 (L03)** | **GPIO 14** | External 5V Regulated | 0° (Locked) / 90° (Unlocked) |
| **Locker 04 (L04)** | **GPIO 27** | External 5V Regulated | 0° (Locked) / 90° (Unlocked) |

---

### E. Security Peripherals (Buzzer, LEDs, Reed Switches)

| Peripheral | ESP32 Pin | Configuration | Notes |
|---|---|---|---|
| **Active Buzzer** | **GPIO 25** | Digital Output | High = Alarm Beep |
| **Green Status LED** | **GPIO 26** | Digital Output (220Ω) | High = Access Granted |
| **Red Status LED** | **GPIO 33** | Digital Output (220Ω) | High = Access Denied |
| **Reed Sensor L01** | **GPIO 34** | Digital Input | Internal Pull-up |
| **Reed Sensor L02** | **GPIO 35** | Digital Input | Internal Pull-up |
| **Reed Sensor L03** | **GPIO 36** | Digital Input | Internal Pull-up |
| **Reed Sensor L04** | **GPIO 39** | Digital Input | Internal Pull-up |

---

## 3. Circuit Schematics Diagram (ASCII Layout)

```
                     +---------------------------------------+
                     |             ESP32 DevKit              |
                     +---------------------------------------+
                        |  |  |  |  |  |  |  |  |  |  |  |
        +---------------+  |  |  |  |  |  |  |  |  |  +---------------+
        |                  |  |  |  |  |  |  |  |  |                  |
        v (SPI)            |  |  |  v (I2C)|  v (PWM)             v (GPIO)
 +--------------+          |  |  +-----+--+--+ +-----------+     +---------+
 | MFRC522 RFID |          |  |  | LCD 16x2  | | SG90 Servo|     | BUZZER  |
 | Reader       |          |  |  | DS3231 RTC| | Locker L01|     | LED RED |
 +--------------+          |  |  +-----------+ +-----------+     | LED GRN |
                           |  v (SPI CS: GPIO 4)                 +---------+
                           +----------------------+
                                                  |
                                           +------+-------+
                                           | MicroSD Card |
                                           | Module       |
                                           +--------------+
```

---

## 4. Power Supply Guidelines

1. **Common Ground**: Ensure that the Ground (GND) of the external 5V power supply, ESP32 board, Servos, and SD module are connected together.
2. **Servo Power**: Do NOT attempt to power 4 servo motors directly from the ESP32 3.3V or 5V VIN pins. High stall current will cause ESP32 brownout resets. Use a dedicated 5V 3A DC power rail for servos.
