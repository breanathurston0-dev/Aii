using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using StoryForgeStudio.Core.Models;

namespace StoryForgeStudio.Core.Services
{
    public static class SrtParser
    {
        public static string SecondsToTimestamp(double seconds)
        {
            if (double.IsNaN(seconds) || seconds < 0) seconds = 0;
            var ts = TimeSpan.FromSeconds(seconds);
            return string.Format(CultureInfo.InvariantCulture, "{0:D2}:{1:D2}:{2:D2},{3:D3}",
                (int)ts.TotalHours, ts.Minutes, ts.Seconds, ts.Milliseconds);
        }

        public static double TimestampToSeconds(string timestamp)
        {
            if (string.IsNullOrWhiteSpace(timestamp)) return 0;
            var clean = timestamp.Trim().Replace('.', ',');
            var parts = clean.Split(':');
            if (parts.Length < 3) return 0;

            if (!double.TryParse(parts[0], NumberStyles.Any, CultureInfo.InvariantCulture, out double hours)) hours = 0;
            if (!double.TryParse(parts[1], NumberStyles.Any, CultureInfo.InvariantCulture, out double minutes)) minutes = 0;

            var secParts = parts[2].Split(',');
            if (!double.TryParse(secParts[0], NumberStyles.Any, CultureInfo.InvariantCulture, out double seconds)) seconds = 0;
            double millis = 0;
            if (secParts.Length > 1)
            {
                double.TryParse(secParts[1].PadRight(3, '0').Substring(0, 3), NumberStyles.Any, CultureInfo.InvariantCulture, out millis);
            }

            return hours * 3600 + minutes * 60 + seconds + millis / 1000.0;
        }

        public static List<SubtitleEntry> Parse(string srtContent)
        {
            var entries = new List<SubtitleEntry>();
            if (string.IsNullOrWhiteSpace(srtContent)) return entries;

            var normalized = srtContent.Replace("\r\n", "\n").Replace('\r', '\n');
            var rawBlocks = Regex.Split(normalized, @"\n\s*\n");

            int generatedId = 1;

            foreach (var block in rawBlocks)
            {
                var lines = block.Trim().Split('\n').Select(l => l.Trim()).Where(l => l.Length > 0).ToList();
                if (lines.Count < 2) continue;

                int timeIdx = -1;
                for (int i = 0; i < lines.Count; i++)
                {
                    if (lines[i].Contains("-->"))
                    {
                        timeIdx = i;
                        break;
                    }
                }

                if (timeIdx == -1) continue;

                var timeLine = lines[timeIdx];
                var parts = timeLine.Split(new[] { "-->" }, StringSplitOptions.None);
                if (parts.Length != 2) continue;

                var startStr = parts[0].Trim();
                var endStr = parts[1].Trim().Split(' ')[0].Trim(); // strip coordinates

                var startSec = TimestampToSeconds(startStr);
                var endSec = TimestampToSeconds(endStr);

                var textLines = lines.Skip(timeIdx + 1);
                var fullText = string.Join("\n", textLines);

                // Speaker regex
                string? speaker = null;
                var match = Regex.Match(fullText, @"^\[?([A-Za-z0-9_\u1780-\u17FF\s]+)\]?:\s*(.*)", RegexOptions.Singleline);
                if (match.Success && match.Groups[1].Value.Length < 30)
                {
                    speaker = match.Groups[1].Value.Trim();
                    fullText = match.Groups[2].Value.Trim();
                }

                entries.Add(new SubtitleEntry
                {
                    Id = generatedId++,
                    StartTime = SecondsToTimestamp(startSec),
                    EndTime = SecondsToTimestamp(endSec),
                    StartSeconds = startSec,
                    EndSeconds = endSec,
                    Text = fullText,
                    Speaker = speaker
                });
            }

            DetectOverlaps(entries);
            return entries;
        }

        public static string Stringify(IEnumerable<SubtitleEntry> entries)
        {
            var sb = new StringBuilder();
            int index = 1;
            foreach (var entry in entries)
            {
                sb.AppendLine(index.ToString(CultureInfo.InvariantCulture));
                sb.AppendLine($"{entry.StartTime} --> {entry.EndTime}");
                if (!string.IsNullOrEmpty(entry.Speaker))
                {
                    sb.AppendLine($"[{entry.Speaker}]: {entry.Text}");
                }
                else
                {
                    sb.AppendLine(entry.Text);
                }
                sb.AppendLine();
                index++;
            }
            return sb.ToString().TrimEnd();
        }

        public static void ShiftTimestamps(List<SubtitleEntry> entries, double deltaSeconds)
        {
            foreach (var entry in entries)
            {
                entry.StartSeconds = Math.Max(0, entry.StartSeconds + deltaSeconds);
                entry.EndSeconds = Math.Max(entry.StartSeconds + 0.1, entry.EndSeconds + deltaSeconds);
                entry.StartTime = SecondsToTimestamp(entry.StartSeconds);
                entry.EndTime = SecondsToTimestamp(entry.EndSeconds);
            }
            DetectOverlaps(entries);
        }

        public static void DetectOverlaps(List<SubtitleEntry> entries)
        {
            var sorted = entries.OrderBy(e => e.StartSeconds).ToList();
            for (int i = 0; i < sorted.Count; i++)
            {
                sorted[i].IsOverlapping = false;
                if (i > 0 && sorted[i].StartSeconds < sorted[i - 1].EndSeconds)
                {
                    sorted[i].IsOverlapping = true;
                    sorted[i - 1].IsOverlapping = true;
                }
            }
        }

        public static void FixOverlaps(List<SubtitleEntry> entries)
        {
            var sorted = entries.OrderBy(e => e.StartSeconds).ToList();
            for (int i = 0; i < sorted.Count - 1; i++)
            {
                if (sorted[i].EndSeconds > sorted[i + 1].StartSeconds)
                {
                    sorted[i].EndSeconds = Math.Max(sorted[i].StartSeconds + 0.2, sorted[i + 1].StartSeconds - 0.05);
                    sorted[i].EndTime = SecondsToTimestamp(sorted[i].EndSeconds);
                }
            }
            DetectOverlaps(entries);
        }
    }
}
