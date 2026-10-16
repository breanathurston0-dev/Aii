using System;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using StoryForgeStudio.Core.Interfaces;
using StoryForgeStudio.Core.Models;

namespace StoryForgeStudio.Infrastructure.Services
{
    public class FFmpegService : IFFmpegService
    {
        private readonly string _ffmpegPath;
        private readonly string _ffprobePath;

        public FFmpegService(string? customFfmpeg = null, string? customFfprobe = null)
        {
            _ffmpegPath = customFfmpeg ?? "ffmpeg";
            _ffprobePath = customFfprobe ?? "ffprobe";
        }

        public async Task<bool> IsAvailableAsync()
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = _ffmpegPath,
                    Arguments = "-version",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var proc = Process.Start(psi);
                if (proc == null) return false;
                await proc.WaitForExitAsync();
                return proc.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> GetVersionAsync()
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = _ffmpegPath,
                    Arguments = "-version",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var proc = Process.Start(psi);
                if (proc == null) return "Unavailable";
                string outText = await proc.StandardOutput.ReadToEndAsync();
                await proc.WaitForExitAsync();
                var firstLine = outText.Split('\n')[0];
                return firstLine.Replace("ffmpeg version", "").Trim();
            }
            catch
            {
                return "Unavailable";
            }
        }

        public async Task<MediaItem> ProbeMediaAsync(string filePath, CancellationToken ct = default)
        {
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException("Media file not found", filePath);
            }

            var fi = new FileInfo(filePath);
            var item = new MediaItem
            {
                FilePath = filePath,
                Name = fi.Name,
                FileSizeBytes = fi.Length,
                MediaType = filePath.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase) ||
                            filePath.EndsWith(".wav", StringComparison.OrdinalIgnoreCase)
                            ? "audio" : "video"
            };

            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = _ffprobePath,
                    Arguments = $"-v error -show_entries format=duration -show_entries stream=width,height,codec_name,codec_type,r_frame_rate -of default=noprint_wrappers=1 \"{filePath}\"",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var proc = Process.Start(psi);
                if (proc != null)
                {
                    string output = await proc.StandardOutput.ReadToEndAsync(ct);
                    await proc.WaitForExitAsync(ct);

                    var lines = output.Split('\n');
                    foreach (var line in lines)
                    {
                        var parts = line.Trim().Split('=');
                        if (parts.Length != 2) continue;
                        var key = parts[0];
                        var val = parts[1];

                        if (key == "duration" && double.TryParse(val, NumberStyles.Any, CultureInfo.InvariantCulture, out double dur))
                        {
                            item.Duration = dur;
                        }
                        else if (key == "width" && int.TryParse(val, out int w))
                        {
                            item.Width = w;
                        }
                        else if (key == "height" && int.TryParse(val, out int h))
                        {
                            item.Height = h;
                        }
                        else if (key == "codec_name")
                        {
                            if (string.IsNullOrEmpty(item.VideoCodec)) item.VideoCodec = val;
                            else if (string.IsNullOrEmpty(item.AudioCodec)) item.AudioCodec = val;
                        }
                    }
                }
            }
            catch
            {
                // Fallback default duration
                item.Duration = 60.0;
            }

            return item;
        }

        public async Task<string> ExtractAudioAsync(string videoPath, string outputPath, CancellationToken ct = default)
        {
            var psi = new ProcessStartInfo
            {
                FileName = _ffmpegPath,
                Arguments = $"-y -i \"{videoPath}\" -vn -acodec libmp3lame -q:a 2 \"{outputPath}\"",
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var proc = Process.Start(psi);
            if (proc == null) throw new InvalidOperationException("Failed to start ffmpeg process");
            await proc.WaitForExitAsync(ct);
            if (proc.ExitCode != 0)
            {
                string err = await proc.StandardError.ReadToEndAsync(ct);
                throw new InvalidOperationException($"FFmpeg audio extraction failed: {err}");
            }

            return outputPath;
        }

        public async Task<string> TrimMediaAsync(string inputPath, double startSec, double durationSec, string outputPath, CancellationToken ct = default)
        {
            string startStr = startSec.ToString(CultureInfo.InvariantCulture);
            string durStr = durationSec.ToString(CultureInfo.InvariantCulture);

            var psi = new ProcessStartInfo
            {
                FileName = _ffmpegPath,
                Arguments = $"-y -ss {startStr} -i \"{inputPath}\" -t {durStr} -c copy \"{outputPath}\"",
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var proc = Process.Start(psi);
            if (proc == null) throw new InvalidOperationException("Failed to start ffmpeg process");
            await proc.WaitForExitAsync(ct);
            return outputPath;
        }

        public async Task<string> BurnSubtitlesAsync(string videoPath, string srtPath, SubtitleStyleConfig style, string outputPath, IProgress<int>? progress = null, CancellationToken ct = default)
        {
            // Escape subtitle path for ffmpeg filter: escape colons and backslashes
            string escapedSrt = srtPath.Replace("\\", "/").Replace(":", "\\:");
            string filter = $"subtitles='{escapedSrt}':force_style='FontName={style.FontFamily},FontSize={style.FontSize},PrimaryColour=&H{style.FontColor.Replace("#", "")}&,OutlineColour=&H{style.OutlineColor.Replace("#", "")}&,Outline={style.OutlineWidth},MarginV={style.MarginVertical}'";

            var psi = new ProcessStartInfo
            {
                FileName = _ffmpegPath,
                Arguments = $"-y -i \"{videoPath}\" -vf \"{filter}\" -c:a copy \"{outputPath}\"",
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var proc = Process.Start(psi);
            if (proc == null) throw new InvalidOperationException("Failed to start ffmpeg process");

            // Report simulated or parsed progress
            progress?.Report(25);
            await proc.WaitForExitAsync(ct);
            progress?.Report(100);

            if (proc.ExitCode != 0)
            {
                string err = await proc.StandardError.ReadToEndAsync(ct);
                throw new InvalidOperationException($"FFmpeg subtitle burning failed: {err}");
            }

            return outputPath;
        }
    }
}
