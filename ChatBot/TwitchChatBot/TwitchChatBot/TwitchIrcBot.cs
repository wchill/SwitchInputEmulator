using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Sockets;
using System.Threading.Tasks;

namespace TwitchChatBot
{
    class TwitchIrcBot
    {
        private TcpClient _tcpClient;
        private StreamReader _inputStream;
        private StreamWriter _outputStream;

        private List<Tuple<Func<IrcV3Message, bool>, Func<IrcV3Message, Task>>> PrivmsgHandlers;

        public TwitchIrcBot()
        {
            PrivmsgHandlers = new List<Tuple<Func<IrcV3Message, bool>, Func<IrcV3Message, Task>>>();
        }

        public void AddPrivmsgHandler(Func<IrcV3Message, bool> canHandle, Func<IrcV3Message, Task> handler)
        {
            PrivmsgHandlers.Add(Tuple.Create(canHandle, handler));
        }

        public void Connect(string username, string pass, IEnumerable<string> channels)
        {
            _tcpClient = new TcpClient("irc.chat.twitch.tv", 6667);
            _inputStream = new StreamReader(_tcpClient.GetStream());
            _outputStream = new StreamWriter(_tcpClient.GetStream());
            _outputStream.AutoFlush = true;

            SendMessage($"PASS oauth:{pass}");
            SendMessage($"NICK {username}");

            JoinChannels(channels);
        }

        public void JoinChannels(IEnumerable<string> channels)
        {
            if (!_tcpClient.Connected)
            {
                throw new InvalidOperationException("Not connected to a server.");
            }
            foreach (var channel in channels)
            {
                SendMessage($"JOIN {channel}");
            }
        }

        public void SendMessage(string message)
        {
            Console.WriteLine($"> {message}");
            _outputStream.WriteLine(message);
        }

        public async Task<string> ReadMessage()
        {
            return await _inputStream.ReadLineAsync();
        }

        public async Task Loop()
        {
            while (true)
            {
                var incomingLine = await ReadMessage();
                if (incomingLine == null) return;
                Console.WriteLine($"< {incomingLine}");
                var message = new IrcV3Message(incomingLine);
                if (message.Verb == "PRIVMSG")
                {
                    foreach (var handler in PrivmsgHandlers)
                    {
                        bool canHandle = true;
                        if (handler.Item1 != null)
                        {
                            canHandle = handler.Item1(message);
                        }
                        if (canHandle)
                        {
                            await handler.Item2(message);
                        }
                    }
                }
            }
        }
    }
}
