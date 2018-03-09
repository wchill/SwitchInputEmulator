import serial
import serial.tools.list_ports
import sys
import time

SWITCH_Y         = 0x01
SWITCH_B         = 0x02
SWITCH_A         = 0x04
SWITCH_X         = 0x08
SWITCH_L         = 0x10
SWITCH_R         = 0x20
SWITCH_ZL        = 0x40
SWITCH_ZR        = 0x80
SWITCH_MINUS     = 0x100
SWITCH_PLUS      = 0x200
SWITCH_LCLICK    = 0x400
SWITCH_RCLICK    = 0x800
SWITCH_HOME      = 0x1000
SWITCH_CAPTURE   = 0x2000

HAT_TOP          = 0x00
HAT_TOP_RIGHT    = 0x01
HAT_RIGHT        = 0x02
HAT_BOTTOM_RIGHT = 0x03
HAT_BOTTOM       = 0x04
HAT_BOTTOM_LEFT  = 0x05
HAT_LEFT         = 0x06
HAT_TOP_LEFT     = 0x07
HAT_CENTER       = 0x08

STICK_MIN        = 0
STICK_CENTER     = 128
STICK_MAX        = 255

class Packet:
    def __init__(self):
        self.button = b'\x00\x00'
        self.hat = HAT_CENTER.to_bytes(1, byteorder='big')
        self.lx = STICK_CENTER.to_bytes(1, byteorder='big')
        self.ly = STICK_CENTER.to_bytes(1, byteorder='big')
        self.rx = STICK_CENTER.to_bytes(1, byteorder='big')
        self.ry = STICK_CENTER.to_bytes(1, byteorder='big')
        self.vendorspec = b'\x00'

    def press_buttons(self, *buttons):
        button_val = sum(buttons)
        self.button = button_val.to_bytes(2, byteorder='big')
        return self

    def press_hat(self, hat_press):
        self.hat = hat_press.to_bytes(1, byteorder='big')
        return self

    def move_left(self):
        self.lx = b'\x00'
        return self

    def move_right(self):
        self.lx = b'\xff'
        return self

    def get_bytes(self):
        return self.button + self.hat + self.lx + self.ly + self.rx + self.ry + self.vendorspec

def find_arduino():
    arduino_ports = [
        p.device
        for p in serial.tools.list_ports.comports()
        if p.vid == 9025 and p.pid == 67
    ]
    if not arduino_ports:
        raise IOError('No Arduino found')
    if len(arduino_ports) > 1:
        print('Found multiple Arduinos, using the first')
    return arduino_ports[0]

def main():
    with serial.Serial(find_arduino(), 9600, timeout=1) as ser:
        try:
            print('Connected to port')
            ser.read()
            ser.write(Packet().press_hat(HAT_CENTER).get_bytes())
            ser.read(1)
            while ser.is_open:
                p = Packet().move_left()
                ser.write(p.get_bytes())
                ser.read(1)
                time.sleep(0.05)

                p = Packet().move_right()
                ser.write(p.get_bytes())
                ser.read(1)
                time.sleep(0.05)
        except KeyboardInterrupt:
            print('Cleaning up')
            ser.write(Packet().press_hat(HAT_CENTER).get_bytes())

if __name__ == '__main__':
    main()
