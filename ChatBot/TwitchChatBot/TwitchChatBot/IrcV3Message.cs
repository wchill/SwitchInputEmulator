using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace TwitchChatBot
{
    class IrcV3Message
    {
        private static Regex ircRegex = new Regex("^(?:@([^\r\n ]*) +|())(?::([^\r\n ]+) +|())([^\r\n ]+)(?: +([^:\r\n ]+[^\r\n ]*(?: +[^:\r\n ]+[^\r\n ]*)*)|())?(?: +:([^\r\n]*)| +())?[\r\n]*$");

        public IDictionary<string, string> Tags { get; }
        public string Sender { get; }
        public string Verb { get; }
        public IList<string> Parameters { get; }

        public string Message { get; }

        public IrcV3Message(string message)
        {
            Message = message;
            var match = ircRegex.Match(message);
            Tags = ParseTags(match.Groups[1].Value);
            Sender = match.Groups[2].Value;
            Verb = match.Groups[3].Value;
            var parameters = match.Groups[4];
            var trailingParameter = match.Groups[5]?.Value;

            var builder = ImmutableList.CreateBuilder<string>();
            foreach (var param in parameters.Value.Split(" ", StringSplitOptions.RemoveEmptyEntries))
            {
                builder.Add(param);
            }
            if (trailingParameter != null)
            {
                builder.Add(trailingParameter);
            }

            Parameters = builder.ToImmutable();
        }

        private static IDictionary<string, string> ParseTags(string tags)
        {
            var tagList = tags.Split(";", StringSplitOptions.RemoveEmptyEntries);
            var builder = ImmutableDictionary.CreateBuilder<string, string>();

            foreach (var tag in tagList)
            {
                var kv = tag.Split("=");
                builder.Add(kv[0], UnescapeTag(kv[1]));
            }
            return builder.ToImmutable();
        }

        private static string UnescapeTag(string tag)
        {
            if (tag.Last() == '\\')
            {
                tag = tag.Substring(0, tag.Length - 1);
            }
            tag = tag.Replace(@"\:", ";");
            tag = tag.Replace(@"\s", " ");
            tag = tag.Replace(@"\\", @"\");
            tag = tag.Replace(@"\r", "\r");
            tag = tag.Replace(@"\n", "\n");

            return tag;
        }
    }
}
