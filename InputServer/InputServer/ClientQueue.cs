using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;

namespace InputServer
{
    public class ClientQueue<T>
    {
        private readonly ConcurrentQueue<T> _queue;
        private readonly ConcurrentDictionary<T, int> _dict;

        public ClientQueue()
        {
            _queue = new ConcurrentQueue<T>();
            _dict = new ConcurrentDictionary<T, int>();
        }

        public void Enqueue(T client)
        {
            _dict[client] = _queue.Count;
            _queue.Enqueue(client);
        }

        public void RemoveFromQueue(T client)
        {
            _dict.TryRemove(client, out var value);
        }

        public bool Dequeue(out T result)
        {
            while (true)
            {
                if (_queue.TryDequeue(out result))
                {
                    if (_dict.ContainsKey(result))
                    {
                        _dict.TryRemove(result, out var value);
                        return true;
                    }
                }
                else
                {
                    return false;
                }
            }
        }
    }
}
