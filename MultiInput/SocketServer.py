__author__ = 'Eric Ahn'

from twisted.internet.protocol import Factory
from twisted.protocols.basic import LineReceiver
from twisted.internet import reactor
import ctypes
import SendKeys

SendInput = ctypes.windll.user32.SendInput

# C struct redefinitions
PUL = ctypes.POINTER(ctypes.c_ulong)
class KeyBdInput(ctypes.Structure):
    _fields_ = [("wVk", ctypes.c_ushort),
                ("wScan", ctypes.c_ushort),
                ("dwFlags", ctypes.c_ulong),
                ("time", ctypes.c_ulong),
                ("dwExtraInfo", PUL)]

class HardwareInput(ctypes.Structure):
    _fields_ = [("uMsg", ctypes.c_ulong),
                ("wParamL", ctypes.c_short),
                ("wParamH", ctypes.c_ushort)]

class MouseInput(ctypes.Structure):
    _fields_ = [("dx", ctypes.c_long),
                ("dy", ctypes.c_long),
                ("mouseData", ctypes.c_ulong),
                ("dwFlags", ctypes.c_ulong),
                ("time",ctypes.c_ulong),
                ("dwExtraInfo", PUL)]

class Input_I(ctypes.Union):
    _fields_ = [("ki", KeyBdInput),
                 ("mi", MouseInput),
                 ("hi", HardwareInput)]

class Input(ctypes.Structure):
    _fields_ = [("type", ctypes.c_ulong),
                ("ii", Input_I)]

# Actuals Functions

def PressKey(hexKeyCode):
    extra = ctypes.c_ulong(0)
    ii_ = Input_I()
    ii_.ki = KeyBdInput( 0, hexKeyCode, 0x0008, 0, ctypes.pointer(extra) )
    x = Input( ctypes.c_ulong(1), ii_ )
    ctypes.windll.user32.SendInput(1, ctypes.pointer(x), ctypes.sizeof(x))

def ReleaseKey(hexKeyCode):
    extra = ctypes.c_ulong(0)
    ii_ = Input_I()
    ii_.ki = KeyBdInput( 0, hexKeyCode, 0x0008 | 0x0002, 0, ctypes.pointer(extra) )
    x = Input( ctypes.c_ulong(1), ii_ )
    ctypes.windll.user32.SendInput(1, ctypes.pointer(x), ctypes.sizeof(x))

user32 = ctypes.windll.user32


class SocketServer(LineReceiver):

    def __init__(self, factory):
        self.factory = factory
        self.peer = ''

    def lineReceived(self, data):
        if data[0] == '+':
            PressKey(ord(data[1]))
        elif data[0] == '-':
            ReleaseKey(ord(data[1]))
        else:
            print 'received {0}'.format(data)

    def connectionMade(self):
        self.peer = self.getPeerString()
        print 'Client {0} connected'.format(self.peer)
        self.factory.clients.append(self)
        self.transport.write('You are client number {0} ({1})\n'.format(len(self.factory.clients), self.peer))

    def connectionLost(self, reason):
        print 'Client {0} disconnected'.format(self.peer)
        self.factory.clients.remove(self)
        self.peer = ''
        #user32.mouse_event(0x0004, 0, 0, 0, 0)
        #self.shoot_event = False
        #ReleaseKey(0x1D)
        #self.crouch_event = False
        #ReleaseKey(0x12)
        #self.use_event = False

    def getPeerString(self):
        peer = self.transport.getPeer()
        return '{0}:{1}'.format(peer.host, peer.port)

    def message(self, message):
        self.transport.write(message + '\n')

class SocketServerFactory(Factory):

    protocol = SocketServer

    def __init__(self):
        self.clients = []

    def buildProtocol(self, addr):
        return SocketServer(self)


def main():
    reactor.listenTCP(8000, SocketServerFactory())
    reactor.run()

if __name__ == '__main__':
    main()
