import queue
import serial
import serial.tools.list_ports
import threading
import time

BUTTON_NONE      =   0x00
BUTTON_Y         =   0x01
BUTTON_B         =   0x02
BUTTON_A         =   0x04
BUTTON_X         =   0x08
BUTTON_L         =   0x10
BUTTON_R         =   0x20
BUTTON_ZL        =   0x40
BUTTON_ZR        =   0x80
BUTTON_MINUS     =  0x100
BUTTON_PLUS      =  0x200
BUTTON_LCLICK    =  0x400
BUTTON_RCLICK    =  0x800
BUTTON_HOME      = 0x1000
BUTTON_CAPTURE   = 0x2000

DPAD_UP          = 0x00
DPAD_UP_RIGHT    = 0x01
DPAD_RIGHT       = 0x02
DPAD_DOWN_RIGHT  = 0x03
DPAD_DOWN        = 0x04
DPAD_DOWN_LEFT   = 0x05
DPAD_LEFT        = 0x06
DPAD_UP_LEFT     = 0x07
DPAD_CENTER      = 0x08

BUTTON_NAMES = {
    0x00: 'None', 
    0x01: 'Y',
    0x02: 'B',
    0x04: 'A',
    0x08: 'X',
    0x10: 'L',
    0x20: 'R',
    0x40: 'ZL',
    0x80: 'ZR',
    0x100: 'Minus',
    0x200: 'Plus',
    0x400: 'LStick',
    0x800: 'RStick',
    0x1000: 'Home',
    0x2000: 'Capture'
}

DPAD_NAMES = {
    0: 'Up',
    1: 'UpRight',
    2: 'Right',
    3: 'DownRight',
    4: 'Down',
    5: 'DownLeft',
    6: 'Left',
    7: 'UpLeft',
    8: 'None',
}

STICK_MIN        = -1.0
STICK_CENTER     = 0.0
STICK_MAX        = 1.0

class Packet:
    def __init__(self):
        self.buttons = set()
        self.dpad = DPAD_CENTER
        self.lx = STICK_CENTER
        self.ly = STICK_CENTER
        self.rx = STICK_CENTER
        self.ry = STICK_CENTER
        self.vendorspec = b'\x00'
        self.lock = threading.Lock()

    def f2b(val):
        if val == 0.0:
            return b'\x80'
        elif val == -1.0:
            return b'\x00'
        elif val == 1.0:
            return b'\xff'
        return int((val + 1.0) / 2.0 * 255).to_bytes(1, byteorder='big')

    def press_buttons(self, *buttons):
        with self.lock:
            for button in buttons:
                self.buttons.add(button)
            return self

    def release_buttons(self, *buttons):
        with self.lock:
            for button in buttons:
                self.buttons.discard(button)
            return self

    def reset(self):
        with self.lock:
            self.buttons = set()
            self.dpad = DPAD_CENTER
            self.lx = STICK_CENTER
            self.ly = STICK_CENTER
            self.rx = STICK_CENTER
            self.ry = STICK_CENTER
            return self

    def press_dpad(self, dpad_press):
        with self.lock:
            self.dpad = dpad_press
            return self

    def move_left_stick(self, x, y):
        with self.lock:
            self.lx = x
            self.ly = y
            return self

    def move_right_stick(self, x, y):
        with self.lock:
            self.rx = x
            self.ry = y
            return self

    def get_bytes(self):
        with self.lock:
            return sum(self.buttons).to_bytes(2, byteorder='big') + self.dpad.to_bytes(1, byteorder='big') + Packet.f2b(self.lx) + Packet.f2b(self.ly) + Packet.f2b(self.rx) + Packet.f2b(self.ry) + self.vendorspec

class Controller:
    def __init__(self, default_wait=None, serial_port=None, debug=False):
        if serial_port is None:
            serial_port = Controller.find_arduino()
        self.serial_port = serial_port
        self.state = Packet()
        self._write_thread = None
        self._last_update = time.clock()
        self._default_wait = default_wait
        self._debug=debug

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

    def wait(self, wait_time=None):
        if wait_time is None:
            wait_time = self._default_wait
        while time.clock() - last_time < wait_time:
            pass
        return self

    def hold_buttons(self, *buttons):
        if self._debug:
            print('Holding [{}]'.format(', '.join([BUTTON_NAMES[x] for x in buttons])))
        self.state.press_buttons(*buttons)
        return self

    def release_buttons(self, *buttons):
        if self._debug:
            print('Releasing [{}]'.format(', '.join([BUTTON_NAMES[x] for x in buttons])))
        self.state.release_buttons(*buttons)
        return self

    def push_button(self, button, wait=None):
        if self._debug:
            print('Pushing [{}]{}'.format(BUTTON_NAMES[button], ' for %.2fs' % wait if wait else ''))
        return self.push_buttons(button, wait=wait)

    def push_buttons(self, *buttons, wait=None):
        self.hold_buttons(*buttons).wait().release_buttons(*buttons)
        self.wait(wait)
        return self

    def hold_dpad(self, dpad, wait=None):
        if self._debug:
            print('Holding dpad {}{}'.format(DPAD_NAMES[dpad], ' for %.2fs' % wait if wait else ''))
        self.state.press_dpad(dpad)
        self.wait(wait)
        self.release_dpad()
        return self

    def release_dpad(self):
        if self._debug:
            print('Releasing dpad')
        self.state.press_dpad(DPAD_CENTER)
        return self

    def push_dpad(self, dpad, wait=None):
        if self._debug:
            print('Pushing dpad {}{}'.format(DPAD_NAMES[dpad], ' and waiting %.2fs' % wait if wait else ''))
        self.hold_dpad(dpad).wait().release_dpad()
        self.wait(wait)
        return self

    def move_left_stick(self, x, y):
        if self._debug:
            print('Moving left stick to (%d, %d)' % (x, y))
        self.state.move_left_stick(x, y)
        return self

    def move_right_stick(self, x, y):
        if self._debug:
            print('Moving right stick to (%d, %d)' % (x, y))
        self.state.move_right_stick(x, y)
        return self

    def reset(self):
        if self._debug:
            print('Clearing all inputs')
        self.state.reset()
        return self

    def _write_handler(self):
        old_state = b'\x00\x00\x08\x80\x80\x80\x80\x00'
        while self.ser.is_open:
            current_state = self.state.get_bytes()
            if old_state != current_state:
                old_state = current_state
                self.ser.write(self.state)

    def __enter__(self):
        print('Opening port {}'.format(self.serial_port))
        self.ser = serial.Serial(self.serial_port, 19200, timeout=0)
        self._write_packet(self.state)
        self._write_thread = threading.Thread(target=self._write_handler, name='Controller Write Thread', daemon=True)
        self._write_thread.start()
        return self

    def __exit__(self, *args):
        self._write_packet(self.state)
        while self.ser.out_waiting > 0:
            time.sleep(0.1)
        self.ser.close()

