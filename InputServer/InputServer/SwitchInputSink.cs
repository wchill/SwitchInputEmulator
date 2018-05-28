using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;
using System.IO.Ports;
using System.Threading;

namespace InputServer
{
    class SwitchInputState
    {
        public Button Buttons { get; set; }
        public DPad DPad { get; set; }
        public byte LeftX { get; set; }
        public byte LeftY { get; set; }
        public byte RightX { get; set; }
        public byte RightY { get; set; }
        
        public bool Equals(SwitchInputState other)
        {
            return Buttons == other.Buttons &&
                   DPad == other.DPad &&
                   LeftX == other.LeftX &&
                   LeftY == other.LeftY &&
                   RightX == other.RightX &&
                   RightY == other.RightY;
        }
    }

    public class SwitchInputSink : IInputSink
    {
        private SwitchInputState _state;
        private SerialPort _serialPort;
        private readonly ConcurrentQueue<InputFrame> _queuedFrames;
        private readonly object _lock = new object();

        public SwitchInputSink(string portName)
        {
            _state = new SwitchInputState();
            _queuedFrames = new ConcurrentQueue<InputFrame>();

            var workerThread = new Thread(ThreadLoop);
            workerThread.Start(portName);
            Update(new InputFrame
            {
                PressedButtons = Button.None,
                ReleasedButtons = Button.All,
                DPad = DPad.None,
                LeftX = 128,
                LeftY = 128,
                RightX = 128,
                RightY = 128
            });
        }

        ~SwitchInputSink()
        {
            if (_serialPort != null && _serialPort.IsOpen)
            {
                _serialPort.Close();
            }

            _serialPort = null;
        }

        private void ThreadLoop(object arg)
        {
            var portName = (string) arg;
            _serialPort = new SerialPort
            {
                PortName = portName,
                BaudRate = 19200,
                Parity = Parity.None,
                DataBits = 8,
                StopBits = StopBits.One,
                Handshake = Handshake.None,
                ReadTimeout = 100,
                WriteTimeout = 100
            };
            _serialPort.Open();
            if (!Sync())
            {
                throw new Exception("Unable to sync");
            }
            Console.WriteLine("Synced");

            var newFrame = new InputFrame();

            while (true)
            {
                if (newFrame.Wait <= 0)
                {
                    if (_queuedFrames.TryDequeue(out var queuedFrame))
                    {
                        newFrame = queuedFrame;
                        ApplyFrameToState(newFrame);
                        var packet = TranslateState(_state);
                        _serialPort.Write(packet, 0, packet.Length);
                    }
                }
                else
                {
                    newFrame.Wait--;
                }

                var resp = _serialPort.ReadByte();
                if (resp == 0x92)
                {
                    Console.Error.WriteLine("NACK");
                    if (!Sync())
                    {
                        throw new Exception("Unable to sync after NACK");
                    }
                }
                else if (resp != 0x90)
                {
                    // Unknown response
                }
            }
        }

        public void Reset()
        {
            var newFrame = new InputFrame
            {
                PressedButtons = Button.None,
                ReleasedButtons = Button.All,
                DPad = DPad.None,
                LeftX = 128,
                LeftY = 128,
                RightX = 128,
                RightY = 128
            };
            _queuedFrames.Clear();
            Update(newFrame);
        }

        public void Update(InputFrame newFrame)
        {
            _queuedFrames.Enqueue(newFrame);
        }

        public void WaitFrames(int numFrames)
        {
            if (numFrames <= 0) return;
            Update(new InputFrame
            {
                Wait = numFrames - 1
            });
        }

        private bool Sync()
        {
            var sendBytes = new byte[] { 0xff, 0x33, 0xcc };
            var recvBytes = new byte[] { 0xff, 0xcc, 0x33 };

            for (var i = 0; i < 100; i++)
            {
                var synced = false;
                _serialPort.DiscardOutBuffer();
                _serialPort.DiscardInBuffer();

                _serialPort.Write(sendBytes, 0, 1);
                Thread.Sleep(100);
                while (_serialPort.BytesToRead > 0)
                {
                    var b = _serialPort.ReadByte();
                    if (b == recvBytes[0])
                    {
                        synced = true;
                        break;
                    }
                }
                _serialPort.DiscardInBuffer();

                if (!synced) continue;
                synced = false;

                _serialPort.Write(sendBytes, 1, 1);
                Thread.Sleep(100);
                while (_serialPort.BytesToRead > 0)
                {
                    var b = _serialPort.ReadByte();
                    if (b == recvBytes[1])
                    {
                        synced = true;
                        break;
                    }
                }

                if (!synced) continue;
                synced = false;

                _serialPort.Write(sendBytes, 2, 1);
                Thread.Sleep(100);
                while (_serialPort.BytesToRead > 0)
                {
                    var b = _serialPort.ReadByte();
                    if (b == recvBytes[2])
                    {
                        synced = true;
                        break;
                    }
                }

                if (synced) return true;
            }

            return false;
        }

        private void ApplyFrameToState(InputFrame frame)
        {
            _state = new SwitchInputState
            {
                Buttons = (_state.Buttons | (frame.PressedButtons ?? Button.None)) & ~(frame.ReleasedButtons ?? Button.None), // & ~(Button.Home | Button.Share),
                DPad = frame.DPad ?? _state.DPad,
                LeftX = frame.LeftX ?? _state.LeftX,
                LeftY = frame.LeftY ?? _state.LeftY,
                RightX = frame.RightX ?? _state.RightX,
                RightY = frame.RightY ?? _state.RightY
            };
        }

        private byte[] TranslateState(SwitchInputState state)
        {
            var buf = new byte[9];
            buf[0] = (byte) (((int) state.Buttons & 0xFF00) >> 8);
            buf[1] = (byte) ((int) state.Buttons & 0xFF);
            buf[2] = (byte) state.DPad;
            buf[3] = state.LeftX;
            buf[4] = state.LeftY;
            buf[5] = state.RightX;
            buf[6] = state.RightY;
            buf[7] = 0;
            buf[8] = Utils.CalculateCrc8(buf, 0, buf.Length - 1);
            return buf;
        }
    }
}
