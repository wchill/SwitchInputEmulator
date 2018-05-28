using System;
using System.Collections.Generic;
using System.Text;

namespace InputServer
{
    public class InputFrame
    {
        public Button? PressedButtons { get; set; }
        public Button? ReleasedButtons { get; set; }
        public DPad? DPad { get; set; }
        public byte? LeftX { get; set; }
        public byte? LeftY { get; set; }
        public byte? RightX { get; set; }
        public byte? RightY { get; set; }
        public int Wait { get; set; }

        public static InputFrame ParseInputString(string str)
        {
            var frame = new InputFrame();
            var args = str.Split(' ');

            foreach (var arg in args)
            {
                var kv = arg.Split('=');
                if (kv.Length != 2)
                {
                    throw new Exception($"Invalid input frame: {str}");
                }

                switch (kv[0])
                {
                    case "P":
                        frame.PressedButtons = (Button) int.Parse(kv[1]);
                        break;
                    case "R":
                        frame.ReleasedButtons = (Button) int.Parse(kv[1]);
                        break;
                    case "D":
                        frame.DPad = (DPad) int.Parse(kv[1]);
                        break;
                    case "LX":
                        frame.LeftX = byte.Parse(kv[1]);
                        break;
                    case "LY":
                        frame.LeftY = byte.Parse(kv[1]);
                        break;
                    case "RX":
                        frame.RightX = byte.Parse(kv[1]);
                        break;
                    case "RY":
                        frame.RightY = byte.Parse(kv[1]);
                        break;
                    default:
                        throw new Exception($"Invalid frame modifier specified: {str}");
                }
            }

            return frame;
        }
    }
}
