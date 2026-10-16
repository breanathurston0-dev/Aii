using System;

namespace StoryForgeStudio.Core.Models
{
    public class SubtitleEntry
    {
        public int Id { get; set; }
        public string StartTime { get; set; } = "00:00:00,000";
        public string EndTime { get; set; } = "00:00:00,000";
        public double StartSeconds { get; set; }
        public double EndSeconds { get; set; }
        public string Text { get; set; } = string.Empty;
        public string? Speaker { get; set; }
        public string? VoiceId { get; set; }
        public bool IsOverlapping { get; set; }

        public double DurationSeconds => Math.Max(0.01, EndSeconds - StartSeconds);
        public double CharactersPerSecond => Text.Length / DurationSeconds;
        public bool HasReadingSpeedAlert => CharactersPerSecond > 22.0;
    }

    public class TranscriptSegment
    {
        public int Id { get; set; }
        public double StartSeconds { get; set; }
        public double EndSeconds { get; set; }
        public string Speaker { get; set; } = "Speaker 1";
        public string Text { get; set; } = string.Empty;
        public double Confidence { get; set; } = 1.0;
    }

    public class VoiceProfile
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string Language { get; set; } = "km";
        public string Gender { get; set; } = "neutral";
        public string Provider { get; set; } = "gemini";
        public string VoiceIdentifier { get; set; } = string.Empty;
        public bool IsCloned { get; set; }
        public bool ConsentVerified { get; set; }
        public string? OwnerName { get; set; }
        public string? ReferenceAudioPath { get; set; }
        public DateTime? ConsentTimestamp { get; set; }
    }

    public class StorySummaryResult
    {
        public string Title { get; set; } = string.Empty;
        public string Synopsis { get; set; } = string.Empty;
        public List<string> KeyEvents { get; set; } = new();
        public List<SceneOutlineItem> SceneOutline { get; set; } = new();
        public string NarrationScript { get; set; } = string.Empty;
        public List<CharacterItem> Characters { get; set; } = new();
        public string Tone { get; set; } = "Dramatic";
        public string Length { get; set; } = "medium";
    }

    public class SceneOutlineItem
    {
        public int SceneNumber { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double DurationSeconds { get; set; }
    }

    public class CharacterItem
    {
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string SuggestedVoiceTone { get; set; } = string.Empty;
    }

    public enum JobState
    {
        Queued,
        Running,
        Completed,
        Failed,
        Cancelled
    }

    public class JobRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Type { get; set; } = "transcription";
        public string Title { get; set; } = string.Empty;
        public JobState Status { get; set; } = JobState.Queued;
        public int ProgressPercentage { get; set; }
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public string? ErrorMessage { get; set; }
        public List<string> Logs { get; set; } = new();
    }
}
