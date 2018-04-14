import serial
import struct
import sys
import time

CONTROLLER_SERIAL = '/dev/ttyACM0'

SYNC_START    = 1
SYNC_1        = 2
NEW_PACKET    = 3
REPLAY_PACKET = 4
OUT_OF_SYNC   = 5

COMMAND_NOP        = 0x00
COMMAND_SYNC_1     = 0x33
COMMAND_SYNC_2     = 0xCC
COMMAND_SYNC_START = 0xFF

RESP_USB_ACK       = b'\x90'
RESP_UPDATE_ACK    = b'\x91'
RESP_UPDATE_NACK   = b'\x92'
RESP_SYNC_START    = b'\xFF'
RESP_SYNC_1        = b'\xCC'
RESP_SYNC_OK       = b'\x33' 

def crc8_ccitt(old_crc, new_data):
    # https://www.microchip.com/webdoc/AVRLibcReferenceManual/group__util__crc_1gab27eaaef6d7fd096bd7d57bf3f9ba083.html
    data = old_crc ^ new_data

    for i in range(8):
        if (data & 0x80) != 0:
            data = data << 1
            data = data ^ 0x07
        else:
            data = data << 1
        data = data & 0xff
    return data

def read():
    byte_in = sys.stdin.buffer.read(1)
    byte_int = byte_in[0]
    sys.stderr.write("\\x%x" % byte_int)
    sys.stderr.flush()
    return byte_int, byte_in

def main(use_serial=False):
    data_buf = []
    state = OUT_OF_SYNC
    ser = None

    def start_sync():
        nonlocal state
        state = SYNC_START
        write(RESP_SYNC_START)

    def write(data):
        sys.stdout.buffer.write(data)
        sys.stdout.flush()

        if use_serial:
            ser_in = ser.read(1)
            if ser_in != data:
                sys.stderr.write('Hardware mismatch: received {} but expected {}\n'.format(ser_in, data))

    if use_serial:
        ser = serial.Serial(CONTROLLER_SERIAL, 19200)
        sys.stderr.write('Using serial passthrough\n')

    while True:
        byte_in, byte_str = read()
        
        if use_serial:
            ser.write(byte_str)

        if state == NEW_PACKET or state == REPLAY_PACKET:
            data_buf.append(byte_in)

            if len(data_buf) == 9:
                # Complete packet received
                crc = 0
                for d in data_buf[:-1]:
                    crc = crc8_ccitt(crc, d)

                if crc != data_buf[-1]:
                    # Bad CRC, check for special case
                    if data_buf[-2] == data_buf[-1] == COMMAND_SYNC_START:
                        start_sync()
                    else:
                        sys.stderr.write('CRC mismatch: sent checksum was {} but calculated {}\n'.format(data_buf[-1], crc))
                        write(RESP_UPDATE_NACK)
                else:
                    state = NEW_PACKET
                    write(RESP_UPDATE_ACK)
                data_buf = []

        elif byte_in == COMMAND_SYNC_START:
            start_sync()

        elif state == SYNC_START and byte_in == COMMAND_SYNC_1:
            state = SYNC_1
            write(RESP_SYNC_1)

        elif state == SYNC_1 and byte_in == COMMAND_SYNC_2:
            state = NEW_PACKET
            write(RESP_SYNC_OK)

        else:
            state = OUT_OF_SYNC

        if state == NEW_PACKET:
            write(RESP_USB_ACK)
            state = REPLAY_PACKET

if __name__ == '__main__':
    use_serial = len(sys.argv) > 1 and sys.argv[1] == '-serial'
    main(use_serial)
