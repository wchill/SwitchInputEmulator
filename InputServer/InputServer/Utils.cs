using System;
using System.Collections.Generic;
using System.Text;

namespace InputServer
{
    public static class Utils
    {
        public static byte CalculateCrc8(byte[] data, int off, int len, byte start = 0)
        {
            var output = start;
            for (var i = off; i < len; i++)
            {
                output ^= data[i];
                for (var j = 0; j < 8; j++)
                {
                    if ((output & 0x80) != 0)
                    {
                        output <<= 1;
                        output ^= 0x07;
                    }
                    else
                    {
                        output <<= 1;
                    }
                }
            }

            return output;
        }
    }
}
