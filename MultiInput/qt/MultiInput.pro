#-------------------------------------------------
#
# Project created by QtCreator 2015-03-05T00:45:33
#
#-------------------------------------------------

QT       += core gui network serialport gamepad

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = MultiInput
TEMPLATE = app

DEFINES += QT_DEPRECATED_WARNINGS

SOURCES += main.cpp\
        multiinput.cpp \
    serialportwriter.cpp \
    controllerwindow.cpp \
    controllerinput.cpp \
    xboxcontrollerinput.cpp \
    tcpinputserver.cpp \
    textcommandparser.cpp \
    compositecontrollercommand.cpp \
    controllercommand.cpp \
    controlleropenglwidget.cpp

HEADERS  += multiinput.h \
    serialportwriter.h \
    controllerwindow.h \
    controllerconstants.h \
    controllerinput.h \
    xboxcontrollerinput.h \
    tcpinputserver.h \
    textcommandparser.h \
    controllerstate.h \
    optional.h \
    compositecontrollercommand.h \
    abstractcontrollercommand.h \
    controllercommand.h \
    controlleropenglwidget.h

FORMS    +=

RESOURCES += \
    resources.qrc

CONFIG += c++11 debug
