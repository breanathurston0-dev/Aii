using System;
using System.Collections.Generic;

namespace StoryForgeStudio.Core.Models
{
    public class Project
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = "Untitled Project";
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public string SourceLanguage { get; set; } = "auto";
        public string TargetLanguage { get; set; } = "km";
        public double DurationSeconds { get; set; }

        public List<MediaItem> MediaFiles { get; set; } = new();
        public List<TranscriptSegment> TranscriptSegments { get; set; } = new();
        public List<SubtitleEntry> Subtitles { get; set; } = new();
        public StorySummaryResult? Summary { get; set; }
        public Dictionary<string, string> VoiceMappings { get; set; } = new(); // Speaker -> VoiceId
        public SubtitleStyleConfig SubtitleStyle { get; set; } = new();
    }

    public class MediaItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string MediaType { get; set; } = "video"; // video or audio
        public double Duration { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public double FrameRate { get; set; }
        public string VideoCodec { get; set; } = string.Empty;
        public string AudioCodec { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
    }

    public class SubtitleStyleConfig
    {
        public string FontFamily { get; set; } = "Noto Sans Khmer";
        public int FontSize { get; set; } = 28;
        public string FontColor { get; set; } = "#FFFFFF";
        public string OutlineColor { get; set; } = "#000000";
        public int OutlineWidth { get; set; } = 2;
        public string Alignment { get; set; } = "bottom"; // bottom, middle, top
        public int MarginVertical { get; set; } = 30;
    }
}
