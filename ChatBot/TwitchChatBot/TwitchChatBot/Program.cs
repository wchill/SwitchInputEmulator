using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace TwitchChatBot
{
    class Program
    {
        class Config
        {
            public string username { get; set; }
            public string password { get; set; }
            public List<string> channels { get; set; }
        }

        static void Main(string[] args)
        {
            var client = new TwitchIrcBot();
            var config = JsonConvert.DeserializeObject<Config>(File.ReadAllText("config.json"));
            client.Connect(config.username, config.password, config.channels);
            client.AddPrivmsgHandler(null, HandleMessage);

            Task.WaitAll(client.Loop());
        }

        public static async Task HandleMessage(IrcV3Message msg)
        {
            Console.WriteLine(msg.Message);
        }
    }
}
