import struct
import sys
import time

SYNC_START    = 1
SYNC_1        = 2
NEW_PACKET    = 3
REPLAY_PACKET = 4
OUT_OF_SYNC   = 5

COMMAND_NOP        = b'\x00'
COMMAND_SYNC_1     = b'\x33'
COMMAND_SYNC_2     = b'\xCC'
COMMAND_SYNC_START = b'\xFF'

RESP_USB_ACK       = b'\x90'
RESP_UPDATE_ACK    = b'\x91'
RESP_UPDATE_NACK   = b'\x92'
RESP_SYNC_START    = b'\xFF'
RESP_SYNC_1        = b'\xCC'
RESP_SYNC_OK       = b'\x33'

def crc8_ccitt(old_crc, new_data):
    # https://www.microchip.com/webdoc/AVRLibcReferenceManual/group__util__crc_1gab27eaaef6d7fd096bd7d57bf3f9ba083.html
    new_data_byte = struct.unpack('<B', new_data)[0]
    data = old_crc ^ new_data_byte

    for i in range(8):
        if (data & 0x80) != 0:
            data = data << 1
            data = data ^ 0x07
        else:
            data = data << 1
        data = data & 0xff
    return data

def write(data):
    sys.stdout.buffer.write(data)
    sys.stdout.flush()

def main():
    data_buf = b''
    crc = 0
    state = OUT_OF_SYNC

    while True:
        byte_in = sys.stdin.buffer.read(1)
        if state == SYNC_START:
            if byte_in == COMMAND_SYNC_1:
                state = SYNC_1
                write(RESP_SYNC_1)
            else:
                state = OUT_OF_SYNC
        elif state == SYNC_1:
            if byte_in == COMMAND_SYNC_2:
                state = NEW_PACKET
                write(RESP_SYNC_OK)
            else:
                state = OUT_OF_SYNC
        elif state == NEW_PACKET or state == REPLAY_PACKET:
            if len(data_buf) == 8:
                input_crc = struct.unpack('<B', byte_in)[0]
                if input_crc != crc:
                    if data_buf[-2:-1] == COMMAND_SYNC_START and input_crc == COMMAND_SYNC_START:
                        state = SYNC_START
                        write(RESP_SYNC_START)
                    else:
                        sys.stderr.write('CRC mismatch: expected {} but got {}\n'.format(input_crc, crc))
                        write(RESP_UPDATE_NACK)
                else:
                    state = NEW_PACKET
                    write(RESP_UPDATE_ACK)
                data_buf = b''
                crc = 0
            else:
                crc = crc8_ccitt(crc, byte_in)
                data_buf += byte_in

        if state == NEW_PACKET:
            write(RESP_USB_ACK)
            state = REPLAY_PACKET
        
        if state == OUT_OF_SYNC:
            if byte_in == COMMAND_SYNC_START:
                state = SYNC_START
                write(RESP_SYNC_START)


if __name__ == '__main__':
    main()
