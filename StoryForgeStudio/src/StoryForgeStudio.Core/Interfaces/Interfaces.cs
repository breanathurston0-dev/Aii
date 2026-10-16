using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using StoryForgeStudio.Core.Models;

namespace StoryForgeStudio.Core.Interfaces
{
    public interface IFFmpegService
    {
        Task<bool> IsAvailableAsync();
        Task<string> GetVersionAsync();
        Task<MediaItem> ProbeMediaAsync(string filePath, CancellationToken ct = default);
        Task<string> ExtractAudioAsync(string videoPath, string outputPath, CancellationToken ct = default);
        Task<string> TrimMediaAsync(string inputPath, double startSec, double durationSec, string outputPath, CancellationToken ct = default);
        Task<string> BurnSubtitlesAsync(string videoPath, string srtPath, SubtitleStyleConfig style, string outputPath, IProgress<int>? progress = null, CancellationToken ct = default);
    }

    public interface ITranscriptionService
    {
        string ProviderName { get; }
        Task<bool> IsAvailableAsync();
        Task<List<TranscriptSegment>> TranscribeAsync(string audioFilePath, string language = "auto", IProgress<int>? progress = null, CancellationToken ct = default);
    }

    public interface ITextToSpeechService
    {
        string ProviderName { get; }
        Task<bool> IsAvailableAsync();
        Task<IReadOnlyList<VoiceProfile>> GetAvailableVoicesAsync(string? language = null);
        Task<string> SynthesizeToFileAsync(string text, string voiceId, string outputPath, double speed = 1.0, CancellationToken ct = default);
    }

    public interface ITranslationService
    {
        string ProviderName { get; }
        Task<bool> IsAvailableAsync();
        Task<string> TranslateTextAsync(string text, string sourceLanguage, string targetLanguage, CancellationToken ct = default);
        Task<List<SubtitleEntry>> TranslateSubtitlesAsync(List<SubtitleEntry> subtitles, string sourceLanguage, string targetLanguage, IProgress<int>? progress = null, CancellationToken ct = default);
    }

    public interface ISummarizerService
    {
        string ProviderName { get; }
        Task<bool> IsAvailableAsync();
        Task<StorySummaryResult> SummarizeStoryAsync(string content, string tone, string length, string targetLanguage, CancellationToken ct = default);
    }

    public interface IVocalRemoverService
    {
        string ProviderName { get; }
        Task<bool> IsAvailableAsync();
        Task<(string vocalsPath, string instrumentalPath)> SeparateVocalsAsync(string inputAudioPath, string outputDirectory, IProgress<int>? progress = null, CancellationToken ct = default);
    }

    public interface IVoiceCloningService
    {
        Task<VoiceProfile> RegisterVoiceWithConsentAsync(string profileName, string ownerName, string referenceAudioPath, string language, bool consentVerified, CancellationToken ct = default);
        Task<bool> ValidateConsentAsync(string ownerName, string referenceAudioPath);
    }

    public interface IProjectRepository
    {
        Task<List<Project>> GetAllProjectsAsync();
        Task<Project?> GetProjectByIdAsync(string id);
        Task SaveProjectAsync(Project project);
        Task DeleteProjectAsync(string id);
    }

    public interface IJobQueueService
    {
        IReadOnlyList<JobRecord> GetJobs();
        Task<string> EnqueueJobAsync(string type, string title, Func<IProgress<int>, CancellationToken, Task<string>> executionWork);
        void CancelJob(string jobId);
        event EventHandler<JobRecord>? JobStatusChanged;
    }
}
