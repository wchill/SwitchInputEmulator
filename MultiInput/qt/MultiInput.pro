#-------------------------------------------------
#
# Project created by QtCreator 2015-03-05T00:45:33
#
#-------------------------------------------------

QT       += core gui network serialport

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

TARGET = MultiInput
TEMPLATE = app


SOURCES += main.cpp\
        multiinput.cpp \
    serialportwriter.cpp \
    controllerwindow.cpp \
    controller.cpp

HEADERS  += multiinput.h \
    serialportwriter.h \
    controllerwindow.h \
    controller.h \
    controllerconstants.h \
    ilogger.h

FORMS    += multiinput.ui \
    controllerwindow.ui

CONFIG += c++11 static
QMAKE_CXXFLAGS += -std=c++11 -stdlib=libc++
QMAKE_LFLAGS += -Xlinker
LIBS += -stdlib=libc++

RESOURCES += \
    resources.qrc
