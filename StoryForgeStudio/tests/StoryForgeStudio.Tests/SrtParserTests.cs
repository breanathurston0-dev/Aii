using System;
using System.Collections.Generic;
using StoryForgeStudio.Core.Models;
using StoryForgeStudio.Core.Services;
using Xunit;

namespace StoryForgeStudio.Tests
{
    public class SrtParserTests
    {
        [Fact]
        public void TimestampConversion_ShouldRoundTripPrecisely()
        {
            double originalSeconds = 3661.425; // 01:01:01,425
            string timestamp = SrtParser.SecondsToTimestamp(originalSeconds);
            Assert.Equal("01:01:01,425", timestamp);

            double parsedSeconds = SrtParser.TimestampToSeconds(timestamp);
            Assert.Equal(originalSeconds, parsedSeconds, precision: 3);
        }

        [Fact]
        public void ParseSrt_ShouldCorrectlyParseEntriesAndSpeakers()
        {
            string srt = @"1
00:00:01,000 --> 00:00:04,500
[Narrator]: Welcome to StoryForge Studio.

2
00:00:05,000 --> 00:00:08,200
This is a high quality subtitle test.";

            var entries = SrtParser.Parse(srt);
            Assert.Equal(2, entries.Count);
            Assert.Equal("Narrator", entries[0].Speaker);
            Assert.Equal("Welcome to StoryForge Studio.", entries[0].Text);
            Assert.Equal(1.0, entries[0].StartSeconds);
            Assert.Equal(4.5, entries[0].EndSeconds);
        }

        [Fact]
        public void KhmerUnicode_ShouldPreserveScriptWithoutCorruption()
        {
            string khmerText = "សូមស្វាគមន៍មកកាន់ StoryForge Studio កម្មវិធីកែសម្រួលវីដេអូ";
            string srt = $@"1
00:00:00,500 --> 00:00:04,000
{khmerText}";

            var entries = SrtParser.Parse(srt);
            Assert.Single(entries);
            Assert.Equal(khmerText, entries[0].Text);
            Assert.True(KhmerUnicodeUtility.ContainsKhmer(entries[0].Text));

            string exported = SrtParser.Stringify(entries);
            Assert.Contains(khmerText, exported);
        }

        [Fact]
        public void DetectAndFixOverlaps_ShouldResolveOverlappingEntries()
        {
            var entries = new List<SubtitleEntry>
            {
                new SubtitleEntry { Id = 1, StartSeconds = 1.0, EndSeconds = 5.0, StartTime = "00:00:01,000", EndTime = "00:00:05,000", Text = "First" },
                new SubtitleEntry { Id = 2, StartSeconds = 4.0, EndSeconds = 7.0, StartTime = "00:00:04,000", EndTime = "00:00:07,000", Text = "Second" }
            };

            SrtParser.DetectOverlaps(entries);
            Assert.True(entries[0].IsOverlapping);
            Assert.True(entries[1].IsOverlapping);

            SrtParser.FixOverlaps(entries);
            Assert.True(entries[0].EndSeconds <= entries[1].StartSeconds);
        }

        [Fact]
        public void ShiftTimestamps_ShouldApplyDeltaToAllEntries()
        {
            var entries = new List<SubtitleEntry>
            {
                new SubtitleEntry { Id = 1, StartSeconds = 2.0, EndSeconds = 4.0, StartTime = "00:00:02,000", EndTime = "00:00:04,000", Text = "Sample" }
            };

            SrtParser.ShiftTimestamps(entries, 1.5);
            Assert.Equal(3.5, entries[0].StartSeconds, precision: 2);
            Assert.Equal(5.5, entries[0].EndSeconds, precision: 2);
            Assert.Equal("00:00:03,500", entries[0].StartTime);
        }
    }
}
