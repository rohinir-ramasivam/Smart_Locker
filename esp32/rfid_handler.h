#ifndef RFID_HANDLER_H
#define RFID_HANDLER_H

#include "hardware_abstraction.h"
#include <SPI.h>
#include <MFRC522.h>

class RFIDHandler : public IRFIDReader {
private:
    MFRC522 mfrc522;
    String lastUID;
    unsigned long lastScanTime;

public:
    RFIDHandler();
    void begin() override;
    bool isCardPresent() override;
    String readCardUID() override;
    void haltCard() override;
};

#endif // RFID_HANDLER_H
