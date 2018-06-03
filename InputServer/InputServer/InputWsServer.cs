using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Timers;
using WebSocketSharp;
using WebSocketSharp.Server;

namespace InputServer
{
    class InputWsServer
    {
        private const string ServicePath = "/switch/ws";
        private const int timeout = 30000;

        private readonly HttpServer _server;
        private readonly IInputSink _sink;
        
        private object _lock;
        private readonly ConcurrentQueue<TwitchUser> _userQueue;
        private readonly HashSet<TwitchUser> _queuedUsers;
        private TwitchUser _activeUser;
        private readonly Timer _turnExpirationTimer;
        private long _expirationTime = -1;
        private long _turnLength = 30000;

        private readonly ConcurrentDictionary<WebSocketBehavior, bool> _listenerClients;

        public InputWsServer(int port, IInputSink sink)
        {
            _lock = new object();
            _sink = sink;
            _sink.AddStateListener(OnUpdate);
            _userQueue = new ConcurrentQueue<TwitchUser>();
            _queuedUsers = new HashSet<TwitchUser>();
            _listenerClients = new ConcurrentDictionary<WebSocketBehavior, bool>();

            _turnExpirationTimer = new Timer(timeout)
            {
                AutoReset = false,
                Enabled = false,
            };
            _turnExpirationTimer.Elapsed += (sender, e) => OnNextTurn();

            _server = new HttpServer(port);
            _server.AddWebSocketService(ServicePath, () =>
            {
                var client = new InputWsClient
                {
                    InputCallback = OnInputFrame,
                    TurnRequestCallback = OnTurnRequest,
                    TurnCancelCallback = OnTurnCancel,
                    OnNewConnectionCallback = OnNewConnection,
                    OnListenerAddedCallback = OnNewListener
                };
                return client;
            });
        }

        public void Start()
        {
            _server.Start();
        }

        private void OnUpdate(string stateStr)
        {
            var updateStr = $"UPDATE {stateStr}";
            Task.Run(() =>
            {
                foreach (var kvp in _listenerClients)
                {
                    var client = kvp.Key;
                    if (client.State == WebSocketState.Open)
                    {
                        client.Context.WebSocket.Send(updateStr);
                    }
                    else
                    {
                        _listenerClients.TryRemove(client, out var value);
                    }
                }
            });
        }

        private void OnNewConnection(string id)
        {
            if (_activeUser != null)
            {
                SendToId(id,
                    $"CLIENT_ACTIVE {_activeUser.UserId} {_activeUser.UserName} {_activeUser.Picture} {_expirationTime} {_turnLength}");
            }
            else
            {
                SendToId(id, "NO_CLIENTS");
            }
        }

        private void OnNewListener(WebSocketBehavior client)
        {
            _listenerClients[client] = true;
        }

        private void OnInputFrame(TwitchUser user, string frame)
        {
            if (_activeUser.Equals(user))
            {
                _sink.Update(InputFrame.ParseInputString(frame));
            }
        }

        private void OnTurnRequest(TwitchUser user)
        {
            if (!_queuedUsers.Contains(user))
            {
                Console.WriteLine($"{user.UserName} requested turn");
                _queuedUsers.Add(user);
                _userQueue.Enqueue(user);
                if (_activeUser == null)
                {
                    // No other users, so this user can just play immediately
                    Console.WriteLine("No other users, user can play immediately");
                    OnNextTurn();
                }
                else if (!_turnExpirationTimer.Enabled)
                {
                    // If there were no other waiting users, we need to restart timer
                    Console.WriteLine("Restarting timer since it was stopped");
                    _turnLength = 30000;
                    _turnExpirationTimer.Interval = _turnLength;
                    _turnExpirationTimer.Start();
                    _expirationTime = DateTimeOffset.UtcNow.AddMilliseconds(_turnLength).ToUnixTimeMilliseconds();
                    Broadcast($"CLIENT_ACTIVE {_activeUser.UserId} {_activeUser.UserName} {_activeUser.Picture} {_expirationTime} {_turnLength}");
                }
            }
            else
            {
                Console.WriteLine($"{user.UserName} tried to request multiple turns");
            }
        }

        private void OnTurnCancel(TwitchUser user)
        {
            if (user == null) return;
            if (_queuedUsers.Contains(user))
            {
                Console.WriteLine($"{user.UserName} cancelled waiting for turn");
                _queuedUsers.Remove(user);
                if (_queuedUsers.Count == 0)
                {
                    // No other users, user gets unlimited time
                    _expirationTime = -1;
                    _turnLength = -1;
                    Broadcast($"CLIENT_ACTIVE {_activeUser.UserId} {_activeUser.UserName} {_activeUser.Picture} {_expirationTime} {_turnLength}");
                }
            }
            else if (user.Equals(_activeUser))
            {
                Console.WriteLine($"{user.UserName} cancelled their active turn, picking next player");
                _turnExpirationTimer.Enabled = false;
                _activeUser = null;
                OnNextTurn();
            }
        }

        private void OnNextTurn()
        {
            while (true)
            {
                if (_userQueue.TryDequeue(out var nextUser))
                {
                    if (_queuedUsers.Contains(nextUser))
                    {
                        _queuedUsers.Remove(nextUser);
                        _activeUser = nextUser;
                        if (_userQueue.Count > 0)
                        {
                            // More clients in the queue
                            _turnLength = 30000;
                            _turnExpirationTimer.Interval = _turnLength;
                            _turnExpirationTimer.Start();
                            _expirationTime = DateTimeOffset.UtcNow.AddSeconds(_turnLength).ToUnixTimeMilliseconds();
                            Console.WriteLine($"{_activeUser.UserName} is now playing, turn expires in 30 seconds");
                            Broadcast(
                                $"CLIENT_ACTIVE {_activeUser.UserId} {_activeUser.UserName} {_activeUser.Picture} {_expirationTime} {_turnLength}");
                            break;
                        }
                        else
                        {
                            // No more clients, user's turn lasts forever
                            Console.WriteLine($"{_activeUser.UserName} is now playing forever");
                            _expirationTime = -1;
                            _turnLength = -1;
                            Broadcast(
                                $"CLIENT_ACTIVE {_activeUser.UserId} {_activeUser.UserName} {_activeUser.Picture} {_expirationTime} {_turnLength}");
                            break;
                        }
                    }
                    else
                    {
                        Console.WriteLine($"Skipping {nextUser.UserName} as they cancelled their turn");
                    }
                }
                else if (_activeUser == null)
                {
                    Console.WriteLine("Not able to pick a player");
                    Broadcast("NO_CLIENTS");
                    break;
                }
                else
                {
                    break;
                    // One client, turn lasts forever
                }
            }
        }

        private void Broadcast(string str)
        {
            _server.WebSocketServices[ServicePath].Sessions.Broadcast(str);
        }

        private void SendToId(string id, string str)
        {
            _server.WebSocketServices[ServicePath].Sessions[id].Context.WebSocket.Send(str);
        }

        ~InputWsServer()
        {
            _sink.Reset();
        }
    }
}
