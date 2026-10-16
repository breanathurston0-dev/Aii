using System;
using System.Text;
using System.Text.RegularExpressions;

namespace StoryForgeStudio.Core.Services
{
    public static class KhmerUnicodeUtility
    {
        private static readonly Regex KhmerRangeRegex = new(@"[\u1780-\u17FF\u19E0-\u19FF]", RegexOptions.Compiled);

        public static bool ContainsKhmer(string text)
        {
            if (string.IsNullOrEmpty(text)) return false;
            return KhmerRangeRegex.IsMatch(text);
        }

        public static int CountKhmerCharacters(string text)
        {
            if (string.IsNullOrEmpty(text)) return 0;
            return KhmerRangeRegex.Matches(text).Count;
        }

        public static string EnsureUtf8(string text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            byte[] bytes = Encoding.UTF8.GetBytes(text);
            return Encoding.UTF8.GetString(bytes);
        }

        public static string[] TokenizeWords(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return Array.Empty<string>();
            // Split on spaces and zero-width spaces (\u200B)
            return text.Split(new[] { ' ', '\t', '\r', '\n', '\u200B', '\u200C', '\u200D' }, StringSplitOptions.RemoveEmptyEntries);
        }
    }
}
