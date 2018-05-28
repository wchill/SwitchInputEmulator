using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO.Ports;
using System.Linq;
using System.Security.Cryptography;
using System.Threading;
using Microsoft.IdentityModel.Tokens;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace InputServer
{

    class Program
    {
        public static void Main(string[] args)
        {
            var sink = new SwitchInputSink("COM4");
            var server = new InputWsServer(31338, sink);
            server.Start();
        }
    }
}
