using System;
using System.Collections.Generic;
using System.Text;
using WebSocketSharp.Server;

namespace InputServer
{
    public delegate void OnOpenCallback(string id);

    public delegate void OnInputCallback(TwitchUser user, string frame);

    public delegate void OnTurnRequestCallback(TwitchUser user);

    public delegate void OnTurnCancelCallback(TwitchUser user);

    public delegate void OnAddListenerCallback(WebSocketBehavior client);

    public delegate void OnUpdateCallback(string stateStr);
}
