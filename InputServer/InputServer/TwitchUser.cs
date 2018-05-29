using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace InputServer
{
    public class TwitchUser
    {
        private readonly JwtSecurityToken validatedToken;
        public int UserId { get; }
        public string UserName { get; }
        public string Picture { get; }

        public TwitchUser(string token, string picture)
        {
            Picture = picture;

            var modulus =
                "6lq9MQ-q6hcxr7kOUp-tHlHtdcDsVLwVIw13iXUCvuDOeCi0VSuxCCUY6UmMjy53dX00ih2E4Y4UvlrmmurK0eG26b-HMNNAvCGsVXHU3RcRhVoHDaOwHwU72j7bpHn9XbP3Q3jebX6KIfNbei2MiR0Wyb8RZHE-aZhRYO8_-k9G2GycTpvc-2GBsP8VHLUKKfAs2B6sW3q3ymU6M0L-cFXkZ9fHkn9ejs-sqZPhMJxtBPBxoUIUQFTgv4VXTSv914f_YkNw-EjuwbgwXMvpyr06EyfImxHoxsZkFYB-qBYHtaMxTnFsZBr6fn8Ha2JqT1hoP7Z5r5wxDu3GQhKkHw";
            var exponent = "AQAB";
            var audiences = new []
            {
                "6ilamg1dh1d2fwi30x5ryiarfq6y86",
                "sa5pewo51b3fi5d70le38sj5916iz5"
            };
            var issuer = "https://id.twitch.tv/oauth2";

            var decodedMod = FromBase64Url(modulus);
            var decodedExp = FromBase64Url(exponent);
            var rsa = new RSACryptoServiceProvider();
            rsa.ImportParameters(new RSAParameters
            {
                Modulus = decodedMod,
                Exponent = decodedExp
            });

            var validationParameters = new TokenValidationParameters
            {
                RequireExpirationTime = true,
                RequireSignedTokens = true,
                ValidateAudience = true,
                ValidAudiences = audiences,
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateLifetime = false,
                IssuerSigningKey = new RsaSecurityKey(rsa)
            };
            var handler = new JwtSecurityTokenHandler();
            handler.ValidateToken(token, validationParameters, out var securityToken);
            validatedToken = securityToken as JwtSecurityToken;
            UserId = GetUserId(validatedToken);
            UserName = GetUserName(validatedToken);
        }
        private static int GetUserId(JwtSecurityToken token)
        {
            return int.Parse(token.Subject);
        }

        private static string GetUserName(JwtSecurityToken token)
        {
            return token.Claims.First(c => c.Type == "preferred_username").Value;
        }
        private static byte[] FromBase64Url(string base64Url)
        {
            var padded = base64Url.Length % 4 == 0 ? base64Url : base64Url + "====".Substring(base64Url.Length % 4);
            var base64 = padded.Replace("_", "/").Replace("-", "+");
            return Convert.FromBase64String(base64);
        }

        public override bool Equals(object other)
        {
            if (!(other is TwitchUser player)) return false;
            return UserId == player.UserId;
        }

        public override int GetHashCode()
        {
            return UserId.GetHashCode();
        }
    }
}
