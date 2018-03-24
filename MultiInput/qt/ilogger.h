#ifndef ILOGGER_H
#define ILOGGER_H

#include <QString>
#include <iostream>

using std::cout;
using std::cerr;
using std::endl;

class ILogger
{
public:
    virtual ~ILogger(){}
    virtual void logMessage(const QString &message) {
        if (parent != nullptr) {
            parent->logMessage(message);
        } else {
            std::cout << message.toStdString() << std::endl;
        }
    }
    virtual void logWarning(const QString &message) {
        if (parent != nullptr) {
            parent->logWarning(message);
        } else {
            std::cerr << message.toStdString() << std::endl;
        }
    }
    virtual void logError(const QString &message) {
        if (parent != nullptr) {
            parent->logError(message);
        } else {
            std::cerr << message.toStdString() << std::endl;
        }
    }
    ILogger() : parent(nullptr) {}
    ILogger(const ILogger &other) : parent(other.parent) {}
    ILogger(ILogger *myParent) : parent(myParent) {}
private:
    ILogger *parent;
};

#endif // ILOGGER_H
