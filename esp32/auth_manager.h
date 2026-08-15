#ifndef AUTH_MANAGER_H
#define AUTH_MANAGER_H

#include "config.h"

class AuthManager {
private:
    UserLockerMapping localMappings[16];
    int mappingCount;

public:
    AuthManager();
    void begin();
    bool authenticate(const char* rfidUid, char* outUserId, char* outUserName, char* outLockerId);
    bool addOrUpdateMapping(const char* uid, const char* userId, const char* userName, const char* lockerId);
};

#endif // AUTH_MANAGER_H
