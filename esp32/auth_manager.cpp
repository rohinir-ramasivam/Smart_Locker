#include "auth_manager.h"
#include <string.h>

AuthManager::AuthManager() : mappingCount(0) {}

void AuthManager::begin() {
    // Populate default prototype mappings (Offline Auth Cache)
    addOrUpdateMapping("A1B2C3D4", "STU001", "Alex Rivera", "L01");
    addOrUpdateMapping("E5F6G7H8", "STU002", "Sophia Chen", "L02");
    addOrUpdateMapping("99AA88BB", "STU003", "Marcus Vance", "L03");
    addOrUpdateMapping("11223344", "STU004", "Emily Watson", "L04");
    addOrUpdateMapping("FF00FF00", "ADM001", "Admin Hayes", "ALL");

    Serial.printf("✅ AuthManager initialized with %d cached user mappings.\n", mappingCount);
}

bool AuthManager::addOrUpdateMapping(const char* uid, const char* userId, const char* userName, const char* lockerId) {
    for (int i = 0; i < mappingCount; i++) {
        if (strcasecmp(localMappings[i].rfidUid, uid) == 0) {
            strncpy(localMappings[i].userId, userId, sizeof(localMappings[i].userId) - 1);
            strncpy(localMappings[i].userName, userName, sizeof(localMappings[i].userName) - 1);
            strncpy(localMappings[i].lockerId, lockerId, sizeof(localMappings[i].lockerId) - 1);
            return true;
        }
    }

    if (mappingCount < 16) {
        strncpy(localMappings[mappingCount].rfidUid, uid, sizeof(localMappings[mappingCount].rfidUid) - 1);
        strncpy(localMappings[mappingCount].userId, userId, sizeof(localMappings[mappingCount].userId) - 1);
        strncpy(localMappings[mappingCount].userName, userName, sizeof(localMappings[mappingCount].userName) - 1);
        strncpy(localMappings[mappingCount].lockerId, lockerId, sizeof(localMappings[mappingCount].lockerId) - 1);
        mappingCount++;
        return true;
    }

    return false;
}

bool AuthManager::authenticate(const char* rfidUid, char* outUserId, char* outUserName, char* outLockerId) {
    if (!rfidUid || strlen(rfidUid) == 0) return false;

    for (int i = 0; i < mappingCount; i++) {
        if (strcasecmp(localMappings[i].rfidUid, rfidUid) == 0) {
            if (outUserId) strncpy(outUserId, localMappings[i].userId, 15);
            if (outUserName) strncpy(outUserName, localMappings[i].userName, 31);
            if (outLockerId) strncpy(outLockerId, localMappings[i].lockerId, 7);
            return true;
        }
    }

    // Default unassigned output
    if (outUserId) strcpy(outUserId, "UNKNOWN");
    if (outUserName) strcpy(outUserName, "Unknown Tag");
    if (outLockerId) strcpy(outLockerId, "NONE");
    return false;
}
