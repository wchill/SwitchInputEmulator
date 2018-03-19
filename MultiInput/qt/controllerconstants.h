#ifndef CONTROLLERCONSTANTS_H
#define CONTROLLERCONSTANTS_H

#include <QVector2D>

#define BUTTON_NONE      0x00
#define BUTTON_Y         0x01
#define BUTTON_B         0x02
#define BUTTON_A         0x04
#define BUTTON_X         0x08
#define BUTTON_L         0x10
#define BUTTON_R         0x20
#define BUTTON_ZL        0x40
#define BUTTON_ZR        0x80
#define BUTTON_MINUS    0x100
#define BUTTON_PLUS     0x200
#define BUTTON_LCLICK   0x400
#define BUTTON_RCLICK   0x800
#define BUTTON_HOME    0x1000
#define BUTTON_CAPTURE 0x2000
#define BUTTON_ALL     0x3FFF

#define STICK_MIN       0
#define STICK_CENTER    128
#define STICK_MAX       255

#define BUTTON_NONE_NAME    "None"
#define BUTTON_Y_NAME       "Y"
#define BUTTON_B_NAME       "B"
#define BUTTON_A_NAME       "A"
#define BUTTON_X_NAME       "X"
#define BUTTON_L_NAME       "L"
#define BUTTON_R_NAME       "R"
#define BUTTON_ZL_NAME      "ZL"
#define BUTTON_ZR_NAME      "ZR"
#define BUTTON_MINUS_NAME   "Minus"
#define BUTTON_PLUS_NAME    "Plus"
#define BUTTON_L3_NAME      "LStick"
#define BUTTON_R3_NAME      "RStick"
#define BUTTON_HOME_NAME    "Home"
#define BUTTON_CAPTURE_NAME "Capture"

#define DPAD_UP_NAME            "Up"
#define DPAD_UP_RIGHT_NAME      "UpRight"
#define DPAD_RIGHT_NAME         "Right"
#define DPAD_DOWN_RIGHT_NAME    "DownRight"
#define DPAD_DOWN_NAME          "Down"
#define DPAD_DOWN_LEFT_NAME     "DownLeft"
#define DPAD_LEFT_NAME          "Left"
#define DPAD_UP_LEFT_NAME       "UpLeft"
#define DPAD_NONE_NAME          "None"

typedef enum {
    DPAD_UP,
    DPAD_UP_RIGHT,
    DPAD_RIGHT,
    DPAD_DOWN_RIGHT,
    DPAD_DOWN,
    DPAD_DOWN_LEFT,
    DPAD_LEFT,
    DPAD_UP_LEFT,
    DPAD_NONE
} Dpad_t;

typedef uint16_t Button_t;

// 50 ms update time (20hz)
#define WAIT_TIME 50

#endif // CONTROLLERCONSTANTS_H
