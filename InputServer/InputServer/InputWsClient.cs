using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Fleck;
using Microsoft.IdentityModel.Tokens;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace InputServer
{
    class InputWsClient : WebSocketBehavior
    {
        public bool IsListener { get; private set; }
        public TwitchUser MyUser { get; private set; }
        public OnInputCallback InputCallback { get; set; }
        public OnTurnRequestCallback TurnRequestCallback { get; set; }
        public OnTurnCancelCallback TurnCancelCallback { get; set; }
        public OnOpenCallback OnNewConnectionCallback { get; set; }
        public OnAddListenerCallback OnListenerAddedCallback { get; set; }

        protected override void OnOpen()
        {
            OnNewConnectionCallback(ID);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            TurnCancelCallback(MyUser);
        }

        protected override void OnMessage(MessageEventArgs e)
        {
            var wsArgs = e.Data.Split(' ');
            var cmd = wsArgs[0];
            var restOfArgs = string.Join(" ", wsArgs.Skip(1));

            if (cmd == "PING")
            {
                Send($"PONG {DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()} {restOfArgs}");
            }
            else if (cmd == "TWITCH_LOGIN")
            {
                try
                {
                    MyUser = new TwitchUser(wsArgs[1], wsArgs[2]);
                    Console.WriteLine($"{MyUser.UserName} logged in");
                    Send("TWITCH_VERIFIED");
                }
                catch (SecurityTokenValidationException)
                {
                    MyUser = null;
                    Console.WriteLine("Invalid login attempt");
                    Send("TWITCH_INVALID");
                }
            }
            else if (cmd == "TWITCH_LOGOUT")
            {
                Console.WriteLine("Logged out");
            }
            else if (cmd == "UPDATE")
            {
                InputCallback(MyUser, restOfArgs);
            }
            else if (cmd == "REQUEST_TURN")
            {
                TurnRequestCallback(MyUser);
            }
            else if (cmd == "CANCEL_TURN")
            {
                TurnCancelCallback(MyUser);
            }
            else if (cmd == "LISTENER")
            {
                IsListener = true;
                OnListenerAddedCallback(this);
            }
        }
    }
}
