#include "rfid_handler.h"

RFIDHandler::RFIDHandler() 
    : mfrc522(PIN_RFID_SS, PIN_RFID_RST), lastUID(""), lastScanTime(0) {}

void RFIDHandler::begin() {
    SPI.begin(PIN_SPI_SCK, PIN_SPI_MISO, PIN_SPI_MOSI, PIN_RFID_SS);
    mfrc522.PCD_Init();
    Serial.println(F("✅ MFRC522 RFID Reader Initialized."));
}

bool RFIDHandler::isCardPresent() {
    if (!mfrc522.PICC_IsNewCardPresent()) {
        return false;
    }
    if (!mfrc522.PICC_ReadCardSerial()) {
        return false;
    }
    return true;
}

String RFIDHandler::readCardUID() {
    String uidStr = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (mfrc522.uid.uidByte[i] < 0x10) {
            uidStr += "0";
        }
        uidStr += String(mfrc522.uid.uidByte[i], HEX);
    }
    uidStr.toUpperCase();

    // Anti-bounce check
    unsigned long now = millis();
    if (uidStr == lastUID && (now - lastScanTime) < RFID_DEBOUNCE_MS) {
        return ""; // Suppress duplicate reading
    }

    lastUID = uidStr;
    lastScanTime = now;
    return uidStr;
}

void RFIDHandler::haltCard() {
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
}
