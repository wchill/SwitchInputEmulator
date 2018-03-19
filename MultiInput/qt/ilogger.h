#ifndef ILOGGER_H
#define ILOGGER_H

#include <QString>

class ILogger
{
public:
    virtual ~ILogger(){}
    virtual void logMessage(const QString &message) {
        if (parent != nullptr) {
            parent->logMessage(message);
        }
    }
    virtual void logWarning(const QString &message) {
        if (parent != nullptr) {
            parent->logWarning(message);
        }
    }
    virtual void logError(const QString &message) {
        if (parent != nullptr) {
            parent->logError(message);
        }
    }
    ILogger() : parent(nullptr) {}
    ILogger(ILogger *myParent) : parent(myParent) {}
private:
    ILogger *parent;
};

#endif // ILOGGER_H
