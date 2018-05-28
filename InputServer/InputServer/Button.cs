using System;
using System.Collections.Generic;
using System.Text;

namespace InputServer
{
    [Flags]
    public enum Button
    {
        None = 0,
        Y = 1,
        B = 2,
        A = 4,
        X = 8,
        L = 16,
        R = 32,
        ZL = 64,
        ZR = 128,
        Minus = 256,
        Plus = 512,
        L3 = 1024,
        R3 = 2048,
        Home = 4096,
        Share = 8192,
        All = 16383
    }
}
