import serial
import sys
import queue
import threading

SERIAL_1 = '/dev/ttyACM0'
SERIAL_2 = '/dev/vtty0'
BAUD_RATE = 19200

def pipe_stdin(ser1, ser2):
    while True:
        data = sys.stdin.buffer.read(1)
        if len(data) == 0:
            return
        ser1.write(data)
        ser2.write(data)

def read_ser(ser, q):
    while True:
        if ser.in_waiting > 0:
            data = ser.read(1)
            if len(data) == 0:
                return
            q.put(data)

def compare_queue(q1, q2, q3):
    buf1 = b''
    buf2 = b''

    while True:
        while True:
            try:
                buf1 += q1.get(False)
            except queue.Empty:
                break

        while True:
            try:
                buf2 += q2.get(False)
            except queue.Empty:
                break
        
        while len(buf1) > 0 and len(buf2) > 0:
            if buf1[0] == buf2[0]:
                q3.put(buf1[:1])
            else:
                sys.stderr.write('Mismatch: Hardware returned {} but emulator returned {}\n'.format(buf1[:1], buf2[:1]))
            buf1 = buf1[1:]
            buf2 = buf2[1:]



def main():
    try:
        ser1 = serial.Serial(SERIAL_1, BAUD_RATE)
        ser2 = serial.Serial(SERIAL_2, BAUD_RATE)
        q1 = queue.Queue()
        q2 = queue.Queue()
        q3 = queue.Queue()
        t = threading.Thread(target=pipe_stdin, args=(ser1, ser2))
        t1 = threading.Thread(target=read_ser, args=(ser1, q1))
        t2 = threading.Thread(target=read_ser, args=(ser2, q2))
        t3 = threading.Thread(target=compare_queue, args=(q1, q2, q3))
        t.daemon = True
        t1.daemon = True
        t2.daemon = True
        t3.daemon = True
        t.start()
        t1.start()
        t2.start()
        t3.start()
        while True:
            d1 = q3.get()
            #sys.stderr.write(str(d1)[2:-1])
            #sys.stderr.flush()
            #sys.stderr.write('Wrote byte to output\n')
            sys.stdout.buffer.write(d1)
            sys.stdout.flush()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    main()
