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

STICK_MIN        = 0
STICK_CENTER     = 128
STICK_MAX        = 255

UPDATES_PER_SEC  = 20
DELAY_PER_UPDATE = 1.0 / UPDATES_PER_SEC

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
            return sum(self.buttons).to_bytes(2, byteorder='big') + self.dpad.to_bytes(1, byteorder='big') + self.lx.to_bytes(1, byteorder='big') + self.ly.to_bytes(1, byteorder='big') + self.rx.to_bytes(1, byteorder='big') + self.ry.to_bytes(1, byteorder='big') + self.vendorspec

class Controller:
    def __init__(self, serial_port=None):
        if serial_port is None:
            serial_port = Controller.find_arduino()
        self.serial_port = serial_port
        self.state = Packet()
        self._write_thread = None
        self._last_update = time.clock()

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

    def wait(self, wait_time=0):
        last_time = self._last_update
        while last_time == self._last_update:
            pass
        last_time = self._last_update
        while time.clock() - last_time < max(DELAY_PER_UPDATE, wait_time):
            pass
        return self

    def hold_buttons(self, *buttons):
        self.state.press_buttons(*buttons)
        return self

    def release_buttons(self, *buttons):
        self.state.release_buttons(*buttons)
        return self

    def push_button(self, button, wait=None):
        return self.push_buttons(button, wait=wait)

    def push_buttons(self, *buttons, wait=None):
        self.hold_buttons(*buttons).wait().release_buttons(*buttons)
        if wait is not None:
            time.sleep(wait)
        return self

    def hold_dpad(self, dpad, wait=None):
        self.state.press_dpad(dpad)
        if wait is not None:
            time.sleep(wait)
            self.release_dpad()
        return self

    def release_dpad(self):
        self.state.press_dpad(DPAD_CENTER)
        return self

    def push_dpad(self, dpad, wait=None):
        self.hold_dpad(dpad).wait().release_dpad()
        if wait is not None:
            time.sleep(wait)
        return self

    def move_left_stick(self, x, y):
        self.state.move_left_stick(x, y)
        return self

    def move_right_stick(self, x, y):
        self.state.move_right_stick(x, y)
        return self

    def reset(self):
        self.state.reset()
        return self

    def _write_handler(self):
        while self.ser.is_open:
            self._write_packet(self.state)
            while time.clock() - self._last_update < DELAY_PER_UPDATE:
                pass
            self.ser.read(1)
            self._last_update = time.clock()

    def _write_packet(self, packet):
        self.ser.write(packet.get_bytes())

    def __enter__(self):
        print('Opening port {}'.format(self.serial_port))
        self.ser = serial.Serial(self.serial_port, 9600, timeout=0)
        self._write_packet(self.state)
        self._write_thread = threading.Thread(target=self._write_handler, name='Controller Write Thread', daemon=True)
        self._write_thread.start()
        return self

    def __exit__(self, *args):
        self._write_packet(self.state)
        while self.ser.out_waiting > 0:
            time.sleep(0.1)
        self.ser.close()

